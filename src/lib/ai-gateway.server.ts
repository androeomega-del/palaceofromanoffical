/**
 * Lovable AI Gateway wrapper for the Growth OS.
 *
 * Every call:
 *  1. Estimates cost
 *  2. Checks MTD spend against MONTHLY_BUDGET_USD ($160 cap)
 *  3. Calls the gateway (chat completions, OpenAI-compatible)
 *  4. Writes a row to ai_usage_ledger
 *
 * Models default to the cheapest tier that can do the job; callers can
 * override. The budget is a hard ceiling: when exceeded, we throw a
 * BudgetExceededError that the caller surfaces to the admin UI.
 */

import { supabaseAdmin } from "@/integrations/supabase/client.server";

const GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";

// USD per 1M tokens. Rough public-list estimates — refined as we observe
// actual gateway invoices. Conservative on the high side to keep us under cap.
const MODEL_PRICING: Record<string, { in: number; out: number }> = {
  "google/gemini-2.5-flash-lite": { in: 0.075, out: 0.3 },
  "google/gemini-2.5-flash": { in: 0.3, out: 2.5 },
  "google/gemini-3-flash-preview": { in: 0.3, out: 2.5 },
  "google/gemini-2.5-pro": { in: 1.25, out: 10 },
  "google/gemini-2.5-flash-image": { in: 0.3, out: 2.5 }, // per call ~$0.04
  "openai/gpt-5-nano": { in: 0.1, out: 0.4 },
  "openai/gpt-5-mini": { in: 0.5, out: 2 },
  "openai/gpt-5": { in: 2.5, out: 10 },
};

export const MONTHLY_BUDGET_USD = 160;

export class BudgetExceededError extends Error {
  constructor(public mtdUsd: number) {
    super(`Monthly AI budget of $${MONTHLY_BUDGET_USD} reached (MTD: $${mtdUsd.toFixed(2)}). Pause generation or raise the cap in src/lib/ai-gateway.server.ts.`);
    this.name = "BudgetExceededError";
  }
}

function getKey(): string {
  const key = typeof process !== "undefined" ? process.env?.LOVABLE_API_KEY : undefined;
  if (!key) throw new Error("LOVABLE_API_KEY missing");
  return key;
}

export async function getMonthlySpendUsd(): Promise<number> {
  const since = new Date();
  since.setUTCDate(1);
  since.setUTCHours(0, 0, 0, 0);
  const { data, error } = await supabaseAdmin
    .from("ai_usage_ledger")
    .select("cost_cents")
    .gte("created_at", since.toISOString());
  if (error) {
    console.error("[ai-gateway] mtd query failed:", error.message);
    return 0;
  }
  const cents = (data ?? []).reduce((s, r) => s + Number(r.cost_cents || 0), 0);
  return cents / 100;
}

function estimateCostUsd(model: string, inTokens: number, outTokens: number) {
  const p = MODEL_PRICING[model] ?? MODEL_PRICING["google/gemini-2.5-flash"];
  return (inTokens / 1_000_000) * p.in + (outTokens / 1_000_000) * p.out;
}

export type AiCallOptions = {
  module: string;
  model?: string;
  system: string;
  user: string;
  json?: boolean;
  maxTokens?: number;
  temperature?: number;
  tools?: unknown[];
  toolChoice?: unknown;
};

export type AiCallResult = {
  content: string;
  toolCalls?: Array<{ name: string; arguments: unknown }>;
  inputTokens: number;
  outputTokens: number;
  costUsd: number;
};

export async function callAi(opts: AiCallOptions): Promise<AiCallResult> {
  const model = opts.model ?? "google/gemini-2.5-flash";

  // Pre-flight budget check using a conservative estimate (1500 in, max out)
  const estIn = Math.ceil((opts.system.length + opts.user.length) / 4);
  const estOut = opts.maxTokens ?? 1200;
  const estCost = estimateCostUsd(model, estIn, estOut);
  const mtd = await getMonthlySpendUsd();
  if (mtd + estCost > MONTHLY_BUDGET_USD) {
    throw new BudgetExceededError(mtd);
  }

  const body: Record<string, unknown> = {
    model,
    messages: [
      { role: "system", content: opts.system },
      { role: "user", content: opts.user },
    ],
    temperature: opts.temperature ?? 0.7,
    max_tokens: opts.maxTokens ?? 1200,
  };
  if (opts.json) body.response_format = { type: "json_object" };
  if (opts.tools) body.tools = opts.tools;
  if (opts.toolChoice) body.tool_choice = opts.toolChoice;

  const res = await fetch(GATEWAY_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${getKey()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    if (res.status === 429) throw new Error("AI gateway rate-limited — retry in a minute.");
    if (res.status === 402) throw new Error("AI gateway credits exhausted — top up the Lovable workspace.");
    throw new Error(`AI gateway ${res.status}: ${text.slice(0, 240)}`);
  }

  const data = (await res.json()) as {
    choices?: Array<{
      message?: {
        content?: string;
        tool_calls?: Array<{ function: { name: string; arguments: string } }>;
      };
    }>;
    usage?: { prompt_tokens?: number; completion_tokens?: number };
  };

  const message = data.choices?.[0]?.message;
  const content = message?.content?.trim() ?? "";
  const inputTokens = data.usage?.prompt_tokens ?? estIn;
  const outputTokens = data.usage?.completion_tokens ?? Math.ceil(content.length / 4);
  const costUsd = estimateCostUsd(model, inputTokens, outputTokens);

  const toolCalls = message?.tool_calls?.map((t) => {
    let parsed: unknown = {};
    try { parsed = JSON.parse(t.function.arguments); } catch { /* ignore parse errors */ }
    return { name: t.function.name, arguments: parsed };
  });

  // Ledger write (best-effort; never block the caller on logging failures)
  void supabaseAdmin.from("ai_usage_ledger").insert({
    module: opts.module,
    model,
    input_tokens: inputTokens,
    output_tokens: outputTokens,
    cost_cents: Math.round(costUsd * 10000) / 100, // 4 decimals of a cent
    metadata: { json: !!opts.json, tools: !!opts.tools },
  });

  return { content, toolCalls, inputTokens, outputTokens, costUsd };
}
