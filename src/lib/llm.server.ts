// Server-only helper to call the Emergent Universal LLM proxy (OpenAI-compatible).
// Keeps the EMERGENT_LLM_KEY off the client. Workers/fetch-friendly — no SDK.

const EMERGENT_PROXY = "https://integrations.emergentagent.com/llm/v1/chat/completions";
const LOVABLE_GATEWAY = "https://ai.gateway.lovable.dev/v1/chat/completions";
const DEFAULT_EMERGENT_MODEL = "claude-sonnet-4-5-20250929";
const DEFAULT_LOVABLE_MODEL = "google/gemini-2.5-flash";

type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

export type CallLlmOptions = {
  system: string;
  user: string;
  model?: string;
  /** Force JSON object output (we then JSON.parse it). */
  json?: boolean;
  maxTokens?: number;
  temperature?: number;
};

function getProvider(): { url: string; key: string; model: string; name: string } {
  // Server runtime secrets are exposed through process.env; avoid import.meta.env
  // here because Vite's server module runner rejects dynamic import.meta access.
  const env = typeof process !== "undefined" ? process.env : undefined;
  const emergentKey = env?.EMERGENT_LLM_KEY;
  if (emergentKey) {
    return {
      url: EMERGENT_PROXY,
      key: emergentKey,
      model: DEFAULT_EMERGENT_MODEL,
      name: "emergent",
    };
  }

  const lovableKey = env?.LOVABLE_API_KEY;
  if (lovableKey) {
    return {
      url: LOVABLE_GATEWAY,
      key: lovableKey,
      model: DEFAULT_LOVABLE_MODEL,
      name: "lovable-ai",
    };
  }

  throw new Error("No LLM key configured — missing EMERGENT_LLM_KEY and LOVABLE_API_KEY");
}

export async function callLlm(opts: CallLlmOptions): Promise<string> {
  const provider = getProvider();
  const messages: ChatMessage[] = [
    { role: "system", content: opts.system },
    { role: "user", content: opts.user },
  ];

  const body: Record<string, unknown> = {
    model: opts.model ?? provider.model,
    messages,
    max_tokens: opts.maxTokens ?? 800,
    temperature: opts.temperature ?? 0.2,
  };
  if (opts.json) {
    body.response_format = { type: "json_object" };
  }

  // Lovable AI Gateway authenticates with `Lovable-API-Key`, not Bearer.
  // Emergent's proxy uses the standard `Authorization: Bearer` header.
  const authHeaders: Record<string, string> =
    provider.name === "lovable-ai"
      ? {
          "Lovable-API-Key": provider.key,
          "X-Lovable-AIG-SDK": "palace-of-roman-llm-helper",
        }
      : { Authorization: `Bearer ${provider.key}` };

  const res = await fetch(provider.url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`LLM proxy ${provider.name} ${res.status}: ${text.slice(0, 240)}`);
  }
  const data = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  return data.choices?.[0]?.message?.content?.trim() ?? "";
}

/** Convenience: parse a JSON object response, with a guarded fallback. */
export async function callLlmJson<T>(opts: CallLlmOptions, fallback: T): Promise<T> {
  try {
    const raw = await callLlm({ ...opts, json: true });
    if (!raw) return fallback;
    // Strip code fences if the model still wraps them.
    const cleaned = raw.replace(/^```json\s*|^```\s*|```$/gm, "").trim();
    return JSON.parse(cleaned) as T;
  } catch (err) {
    console.error("[llm] callLlmJson failed:", err);
    return fallback;
  }
}
