// Server-only helper to call the Emergent Universal LLM proxy (OpenAI-compatible).
// Keeps the EMERGENT_LLM_KEY off the client. Workers/fetch-friendly — no SDK.

const EMERGENT_PROXY = "https://integrations.emergentagent.com/llm/chat/completions";
const DEFAULT_MODEL = "claude-sonnet-4-5-20250929";

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

function getKey(): string {
  // Server runtime secrets are exposed through process.env; avoid import.meta.env
  // here because Vite's server module runner rejects dynamic import.meta access.
  const key = typeof process !== "undefined" ? process.env?.EMERGENT_LLM_KEY : undefined;
  if (!key) throw new Error("EMERGENT_LLM_KEY missing — cannot call LLM proxy");
  return key;
}

export async function callLlm(opts: CallLlmOptions): Promise<string> {
  const messages: ChatMessage[] = [
    { role: "system", content: opts.system },
    { role: "user", content: opts.user },
  ];

  const body: Record<string, unknown> = {
    model: opts.model ?? DEFAULT_MODEL,
    messages,
    max_tokens: opts.maxTokens ?? 800,
    temperature: opts.temperature ?? 0.2,
  };
  if (opts.json) {
    body.response_format = { type: "json_object" };
  }

  const res = await fetch(EMERGENT_PROXY, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getKey()}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`LLM proxy ${res.status}: ${text.slice(0, 240)}`);
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
