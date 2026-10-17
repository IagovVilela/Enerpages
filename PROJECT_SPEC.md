# EDITOR VISUAL (PUCK + AMBIENTE ZE)

Use a biblioteca Puck (`@puckeditor/core`, sucessor do `@measured/puck`) como um dos editores. Não use Craft.js.
- Cada bloco da minha biblioteca é um componente registrado no Puck, com seus campos de edição (texto, imagem, cor, variante, preset de animação) e versão responsiva.
- O JSON do Puck (`draftData` / `publishedData`) e o canvas Ze (`canvasDraft` / `canvasPublished`, contrato siteJson v2) convivem na mesma página.
- O studio permite **trocar de ambiente** (Puck ↔ Ze) e **exportar o estado atual** (conversão aproximada) ou abrir o outro rascunho sem sobrescrever.
- `publishEngine` define o que o site público renderiza: Puck `Render` ou `TenantCanvasRenderer`.
- Personalize a interface do Puck (painéis, tema, rótulos em português) e porte o canvas livre do Ze (drag/resize, arteboards, biblioteca).
- Todos os blocos Puck devem suportar animações Motion configuráveis por campo (preset, duração, delay, gatilho).
- Paridade UX com o studio do Ze do Corte no ambiente canvas; no Puck, mantenha biblioteca, camadas, modelos, status e tema.

# GERAÇÃO ASSISTIDA POR IA (APENAS PROVEDORES GRATUITOS)

Custo de IA deve ser ZERO. Use somente planos gratuitos ou modelos locais.

1. Crie uma camada de abstração `AIProvider` com a interface `generateJSON(prompt, schema)`, com implementações para:
   - Google Gemini (API gratuita do AI Studio), provedor PADRÃO, usando saída em JSON estruturado
   - Groq (reserva)
   - OpenRouter com modelos gratuitos (reserva)
   - Ollama local (opcional, via variável de ambiente)
   O provedor ativo e a ordem de fallback são configurados por variáveis de ambiente.
2. Trate limites dos planos gratuitos: rate limit com fila e backoff exponencial, troca automática para o próximo provedor em caso de erro 429/quota, cache de resultados por briefing e mensagens claras no painel quando a cota acabar.
3. Não confie cegamente na saída: valide tudo com Zod, tente reparar o JSON automaticamente (até 2 tentativas) e, se falhar, use um gerador determinístico baseado nos Arquétipos de segmento (regras locais que montam tema + blocos sem IA).
4. Divida a geração em etapas pequenas e baratas em vez de um prompt gigante: (a) escolher arquétipo, tokens de design e ordem de blocos; (b) escrever os textos de cada bloco; (c) sugerir presets de animação. Isso melhora a qualidade em modelos gratuitos e economiza cota.
5. Gerar 3 propostas por briefing quando houver cota; caso contrário, 1 proposta + variações determinísticas.
6. Mantenha os cuidados éticos: sem depoimentos ou fotos de pessoas inventados (usar placeholders marcados), e linguagem adequada às regras de publicidade para advogados e psicólogos.
7. Nenhuma chave de API pode ir para o cliente (browser): todas as chamadas passam por rotas de servidor protegidas pelo login do admin.
