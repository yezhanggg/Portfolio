// POST /api/chat — proxies the widget's conversation to DeepSeek and streams the reply back
// as plain text. The DeepSeek key lives only in the DEEPSEEK_API_KEY environment variable.

import { SYSTEM_PROMPT } from "./_prompt.js";

const DEEPSEEK_URL = "https://api.deepseek.com/chat/completions";
const MODEL = process.env.DEEPSEEK_MODEL || "deepseek-chat";

const ALLOWED_ORIGINS = new Set([
  "https://www.yezhang.net",
  "https://yezhang.net",
  ...(process.env.EXTRA_ORIGINS || "").split(",").map((s) => s.trim()).filter(Boolean),
]);

const MAX_TURNS = 12; // messages of history sent upstream
const MAX_CHARS = 1000; // per visitor message
const MAX_TOKENS = 500; // per reply

// Best-effort per-instance rate limit: 20 messages / 10 minutes / IP.
const WINDOW_MS = 10 * 60 * 1000;
const LIMIT = 20;
const hits = new Map();

function rateLimited(ip) {
  const now = Date.now();
  const recent = (hits.get(ip) || []).filter((t) => now - t < WINDOW_MS);
  recent.push(now);
  hits.set(ip, recent);
  if (hits.size > 5000) hits.clear();
  return recent.length > LIMIT;
}

function corsHeaders(origin) {
  if (!ALLOWED_ORIGINS.has(origin)) return {};
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };
}

function reply(status, text, origin) {
  return new Response(text, {
    status,
    headers: { "Content-Type": "text/plain; charset=utf-8", ...corsHeaders(origin) },
  });
}

export function OPTIONS(request) {
  const origin = request.headers.get("origin") || "";
  return new Response(null, { status: 204, headers: corsHeaders(origin) });
}

export async function POST(request) {
  const origin = request.headers.get("origin") || "";
  const sameOrigin = origin === new URL(request.url).origin; // the preview page on this deployment
  if (!ALLOWED_ORIGINS.has(origin) && !sameOrigin) return reply(403, "Forbidden", origin);

  const ip = (request.headers.get("x-forwarded-for") || "").split(",")[0].trim() || "unknown";
  if (rateLimited(ip)) {
    return reply(429, "You're sending messages a bit fast — try again in a few minutes.", origin);
  }

  if (!process.env.DEEPSEEK_API_KEY) {
    return reply(503, "The assistant isn't set up yet — please check back soon.", origin);
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return reply(400, "Bad request", origin);
  }

  const messages = (Array.isArray(body?.messages) ? body.messages : [])
    .filter((m) => (m?.role === "user" || m?.role === "assistant") && typeof m.content === "string")
    .slice(-MAX_TURNS)
    .map((m) => ({ role: m.role, content: m.content.slice(0, MAX_CHARS) }));

  if (!messages.length || messages[messages.length - 1].role !== "user") {
    return reply(400, "Bad request", origin);
  }

  const upstream = await fetch(DEEPSEEK_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [{ role: "system", content: SYSTEM_PROMPT }, ...messages],
      max_tokens: MAX_TOKENS,
      temperature: 0.7,
      stream: true,
    }),
  }).catch(() => null);

  if (!upstream || !upstream.ok || !upstream.body) {
    const detail = upstream ? `${upstream.status} ${await upstream.text().catch(() => "")}` : "network error";
    console.error("DeepSeek error:", detail.slice(0, 500));
    return reply(502, "The assistant is having trouble right now — please try again later.", origin);
  }

  // Turn DeepSeek's OpenAI-style SSE stream into a plain text stream of the reply.
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();
  let buffer = "";
  const stream = upstream.body.pipeThrough(
    new TransformStream({
      transform(chunk, controller) {
        buffer += decoder.decode(chunk, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop();
        for (const line of lines) {
          if (!line.startsWith("data:")) continue;
          const data = line.slice(5).trim();
          if (!data || data === "[DONE]") continue;
          try {
            const text = JSON.parse(data).choices?.[0]?.delta?.content;
            if (text) controller.enqueue(encoder.encode(text));
          } catch {
            // ignore partial / keep-alive lines
          }
        }
      },
    })
  );

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
      ...corsHeaders(origin),
    },
  });
}
