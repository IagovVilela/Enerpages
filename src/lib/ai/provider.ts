import { z } from "zod";

export class AiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

export function isQuotaError(error: unknown) {
  return error instanceof AiError && (error.status === 429 || error.status === 402 || error.status === 403);
}

export interface AIProvider {
  name: string;
  generateJSON<T>(prompt: string, schema: z.ZodType<T>, system?: string): Promise<T>;
}

function extractJson(raw: string) {
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
  const text = fenced?.[1] ?? raw;
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1) throw new AiError("A resposta não continha JSON.", 422);
  return JSON.parse(text.slice(start, end + 1)) as unknown;
}

async function readError(response: Response) {
  const body = await response.text();
  throw new AiError(body.slice(0, 300) || response.statusText, response.status);
}

async function completeJson(run: (prompt: string) => Promise<string>, prompt: string, schema: z.ZodType, system?: string) {
  let extra = "";
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const raw = await run(`${system ? `${system}\n` : ""}${prompt}${extra}`);
    try {
      const parsed = schema.safeParse(extractJson(raw));
      if (parsed.success) return parsed.data;
      extra = `\nA resposta anterior é inválida: ${parsed.error.issues.map((issue) => issue.message).slice(0, 6).join("; ")}. Responda apenas JSON válido.`;
    } catch (error) {
      if (error instanceof AiError && error.status !== 422) throw error;
      extra = "\nResponda apenas um objeto JSON, sem markdown.";
    }
  }
  throw new AiError("Não foi possível validar o JSON.", 422);
}

function gemini(): AIProvider {
  return {
    name: "gemini",
    async generateJSON(prompt, schema, system) {
      const key = process.env.GEMINI_API_KEY;
      if (!key) throw new AiError("GEMINI_API_KEY ausente", 401);
      const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";
      return completeJson(async (text) => {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`,
          {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
              contents: [{ parts: [{ text }] }],
              generationConfig: { responseMimeType: "application/json", temperature: 0.8 },
            }),
          },
        );
        if (!response.ok) await readError(response);
        const data = (await response.json()) as {
          candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
        };
        return data.candidates?.[0]?.content?.parts?.map((part) => part.text || "").join("\n") || "";
      }, prompt, schema, system);
    },
  };
}

function groq(): AIProvider {
  return {
    name: "groq",
    async generateJSON(prompt, schema, system) {
      const key = process.env.GROQ_API_KEY;
      if (!key) throw new AiError("GROQ_API_KEY ausente", 401);
      return completeJson(async (text) => {
        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            authorization: `Bearer ${key}`,
            "content-type": "application/json",
          },
          body: JSON.stringify({
            model: process.env.GROQ_MODEL || "llama-3.3-70b-versatile",
            temperature: 0.7,
            response_format: { type: "json_object" },
            messages: [
              { role: "system", content: system || "Responda apenas JSON." },
              { role: "user", content: text },
            ],
          }),
        });
        if (!response.ok) await readError(response);
        const data = (await response.json()) as { choices?: Array<{ message?: { content?: string } }> };
        return data.choices?.[0]?.message?.content || "";
      }, prompt, schema, system);
    },
  };
}

function openrouter(): AIProvider {
  return {
    name: "openrouter",
    async generateJSON(prompt, schema, system) {
      const key = process.env.OPENROUTER_API_KEY;
      if (!key) throw new AiError("OPENROUTER_API_KEY ausente", 401);
      return completeJson(async (text) => {
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            authorization: `Bearer ${key}`,
            "content-type": "application/json",
          },
          body: JSON.stringify({
            model: process.env.OPENROUTER_MODEL || "meta-llama/llama-3.3-70b-instruct:free",
            temperature: 0.7,
            messages: [
              { role: "system", content: system || "Responda apenas JSON." },
              { role: "user", content: text },
            ],
          }),
        });
        if (!response.ok) await readError(response);
        const data = (await response.json()) as { choices?: Array<{ message?: { content?: string } }> };
        return data.choices?.[0]?.message?.content || "";
      }, prompt, schema, system);
    },
  };
}

function ollama(): AIProvider {
  return {
    name: "ollama",
    async generateJSON(prompt, schema, system) {
      const base = process.env.OLLAMA_BASE_URL;
      if (!base) throw new AiError("OLLAMA_BASE_URL ausente", 401);
      return completeJson(async (text) => {
        const response = await fetch(`${base.replace(/\/$/, "")}/api/chat`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            model: process.env.OLLAMA_MODEL || "llama3.2",
            stream: false,
            format: "json",
            messages: [
              { role: "system", content: system || "Responda apenas JSON." },
              { role: "user", content: text },
            ],
          }),
        });
        if (!response.ok) await readError(response);
        const data = (await response.json()) as { message?: { content?: string } };
        return data.message?.content || "";
      }, prompt, schema, system);
    },
  };
}

const factories = { gemini, groq, openrouter, ollama };

export function providerOrder() {
  const primary = process.env.AI_PROVIDER || "gemini";
  const fallback = (process.env.AI_FALLBACK || "groq,openrouter")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  const names = [primary, ...fallback.filter((name) => name !== primary)];
  if (process.env.OLLAMA_BASE_URL && !names.includes("ollama")) names.push("ollama");
  return names.filter((name): name is keyof typeof factories => name in factories);
}

async function sleep(ms: number) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

export async function generateJSON<T>(prompt: string, schema: z.ZodType<T>, system?: string): Promise<{ data: T; provider: string }> {
  const names = providerOrder();
  let lastError: unknown;
  for (const name of names) {
    const provider = factories[name]();
    let delay = 600;
    for (let attempt = 0; attempt < 3; attempt += 1) {
      try {
        const data = await provider.generateJSON(prompt, schema, system);
        return { data, provider: name };
      } catch (error) {
        lastError = error;
        if (!isQuotaError(error)) break;
        if (attempt < 2) {
          await sleep(delay);
          delay *= 2;
        }
      }
    }
  }
  throw lastError instanceof Error ? lastError : new AiError("Nenhum provedor de IA disponível.", 503);
}
