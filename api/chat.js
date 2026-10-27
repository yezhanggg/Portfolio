// POST /api/chat — proxies the widget's conversation to Claude and streams the reply back
// as plain text. The Anthropic key lives only in the ANTHROPIC_API_KEY environment variable.

import { SYSTEM_PROMPT } from "./_prompt.js";

const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";
// Haiku: the smallest, cheapest Claude model — plenty for a site guide.
const MODEL = process.env.ANTHROPIC_MODEL || "claude-haiku-5-5";

const ALLOWED_ORIGINS = new Set([
  "https://www.yezhang.net",
  "https://yezhang.net",
  ...(process.env.EXTRA_ORIGINS || "").split(",").map((s) => s.trim()).filter(Boolean),
]);

// Kept small to keep cost low: replies are meant to be 1–3 sentences anyway.
const MAX_TURNS = 8; // messages of history sent upstream
const MAX_CHARS = 600; // per visitor message
const MAX_TOKENS = 300; // per reply

// Best-effort per-instance rate limit: 15 messages / 10 minutes / IP.
const WINDOW_MS = 10 * 60 * 1000;
const LIMIT = 15;
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

  if (!process.env.ANTHROPIC_API_KEY) {
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
  while (messages.length && messages[0].role !== "user") messages.shift(); // Claude starts on a user turn

  if (!messages.length || messages[messages.length - 1].role !== "user") {
    return reply(400, "Bad request", origin);
  }

  // Which page the visitor is chatting from, so "what is this?" has an answer.
  const page = body?.page;
  const path = typeof page?.path === "string" ? page.path.slice(0, 120).replace(/[^\w\-./%~]/g, "") : "";
  const title = typeof page?.title === "string" ? page.title.slice(0, 120).replace(/[\r\n]/g, " ") : "";
  // The fixed prompt is marked for caching so repeat visitors are billed for it at the cache
  // rate; the page line comes after it so it doesn't break the cached prefix.
  const system = [{ type: "text", text: SYSTEM_PROMPT, cache_control: { type: "ephemeral" } }];
  if (path) {
    system.push({ type: "text", text: `The visitor is currently on https://www.yezhang.net${path}${title ? ` ("${title}")` : ""}.` });
  }

  const upstream = await fetch(ANTHROPIC_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: MODEL,
      system,
      messages,
      max_tokens: MAX_TOKENS,
      temperature: 0.6,
      stream: true,
    }),
  }).catch(() => null);

  if (!upstream || !upstream.ok || !upstream.body) {
    const detail = upstream ? `${upstream.status} ${await upstream.text().catch(() => "")}` : "network error";
    console.error("Anthropic error:", detail.slice(0, 500));
    return reply(502, "The assistant is having trouble right now — please try again later.", origin);
  }

  // Turn Claude's SSE stream into a plain text stream of the reply.
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
          if (!data) continue;
          try {
            const event = JSON.parse(data);
            const text = event.type === "content_block_delta" ? event.delta?.text : "";
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
