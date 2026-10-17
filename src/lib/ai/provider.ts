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

function isRetryableError(error: unknown) {
  return error instanceof AiError && (error.status === 429 || error.status === 402 || error.status === 503);
}

function retryDelayMs(error: unknown, fallback: number) {
  if (!(error instanceof Error)) return fallback;
  const match = error.message.match(/try again in ([\d.]+)\s*s/i);
  if (!match) return fallback;
  return Math.min(45_000, Math.ceil(Number(match[1]) * 1000) + 750);
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

const AI_FETCH_MS = 10_000;

function aiFetch(input: string, init?: RequestInit) {
  return fetch(input, { ...init, signal: AbortSignal.timeout(AI_FETCH_MS) });
}

async function completeJson(run: (prompt: string) => Promise<string>, prompt: string, schema: z.ZodType, system?: string) {
  let extra = "";
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const raw = await run(`${system ? `${system}\n` : ""}${prompt}${extra}`);
    try {
      const parsed = schema.safeParse(extractJson(raw));
      if (parsed.success) return parsed.data;
      extra = `\nA resposta anterior é inválida: ${parsed.error.issues.map((issue) => issue.message).slice(0, 6).join("; ")}. Responda apenas JSON válido.`;
    } catch (error) {
      if (error instanceof AiError && error.status !== 422) throw error;
      if (error instanceof Error && /abort|timeout/i.test(error.message)) {
        throw new AiError("Tempo esgotado na resposta da IA.", 503);
      }
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
      const model = process.env.GEMINI_MODEL || "gemini-3.1-flash-lite";
      return completeJson(async (text) => {
        const response = await aiFetch(
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
        return (
          data.candidates?.[0]?.content?.parts
            ?.map((part) => part.text || "")
            .filter(Boolean)
            .join("\n") || ""
        );
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
        const response = await aiFetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            authorization: `Bearer ${key}`,
            "content-type": "application/json",
          },
          body: JSON.stringify({
            model: process.env.GROQ_MODEL || "qwen/qwen3.8-27b",
            temperature: 0.7,
            max_tokens: 700,
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
        const response = await aiFetch("https://openrouter.ai/api/v1/chat/completions", {
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
        const response = await aiFetch(`${base.replace(/\/$/, "")}/api/chat`, {
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

type ProviderName = keyof typeof factories;

export function isProviderConfigured(name: ProviderName) {
  switch (name) {
    case "gemini":
      return Boolean(process.env.GEMINI_API_KEY?.trim());
    case "groq":
      return Boolean(process.env.GROQ_API_KEY?.trim());
    case "openrouter":
      return Boolean(process.env.OPENROUTER_API_KEY?.trim());
    case "ollama":
      return Boolean(process.env.OLLAMA_BASE_URL?.trim());
    default: {
      const _exhaustive: never = name;
      void _exhaustive;
      return false;
    }
  }
}

export function providerOrder() {
  const primary = process.env.AI_PROVIDER || "gemini";
  const fallback = (process.env.AI_FALLBACK || "groq,openrouter")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  const names = [primary, ...fallback.filter((name) => name !== primary)];
  if (process.env.OLLAMA_BASE_URL && !names.includes("ollama")) names.push("ollama");
  return names.filter((name): name is ProviderName => name in factories && isProviderConfigured(name as ProviderName));
}

async function sleep(ms: number) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

export async function generateJSON<T>(prompt: string, schema: z.ZodType<T>, system?: string): Promise<{ data: T; provider: string }> {
  const names = providerOrder();
  if (names.length === 0) {
    throw new AiError("Nenhuma chave de IA configurada (GEMINI_API_KEY / GROQ_API_KEY).", 401);
  }
  let lastError: unknown;
  for (const name of names) {
    const provider = factories[name]();
    let delay = 800;
    for (let attempt = 0; attempt < 2; attempt += 1) {
      try {
        const data = await provider.generateJSON(prompt, schema, system);
        return { data, provider: name };
      } catch (error) {
        lastError = error;
        if (!isRetryableError(error)) break;
        if (attempt < 1) {
          await sleep(retryDelayMs(error, delay));
          delay = Math.min(delay * 2, 8_000);
        }
      }
    }
  }
  throw lastError instanceof Error ? lastError : new AiError("Nenhum provedor de IA disponível.", 503);
}
