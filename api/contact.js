// POST /api/contact — receives the site's two forms (contact + zine request) and emails them
// through Resend. Keys and addresses live only in environment variables:
//   RESEND_API_KEY  required
//   CONTACT_TO      required — where submissions are delivered
//   CONTACT_FROM    optional — verified sender, defaults to Resend's test sender

const RESEND_URL = "https://api.resend.com/emails";

const ALLOWED_ORIGINS = new Set([
  "https://www.yezhang.net",
  "https://yezhang.net",
  ...(process.env.EXTRA_ORIGINS || "").split(",").map((s) => s.trim()).filter(Boolean),
]);

// Field whitelist per form: [key, label, max length, required]
const FORMS = {
  contact: {
    subject: "yezhang.net — new message",
    fields: [
      ["name", "Name", 200, false],
      ["contact", "Contact", 300, false],
      ["email", "Email", 300, false],
      ["message", "Message", 5000, true],
    ],
  },
  zine: {
    subject: "yezhang.net — zine request",
    fields: [
      ["firstName", "First name", 200, true],
      ["lastName", "Last name", 200, false],
      ["email", "Email", 300, true],
      ["phone", "Phone", 100, false],
      ["address", "Address", 1000, true],
      ["issue", "Issue", 100, false],
    ],
  },
};

// Best-effort per-instance rate limit: 5 submissions / 10 minutes / IP.
const WINDOW_MS = 10 * 60 * 1000;
const LIMIT = 5;
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
  const sameOrigin = origin === new URL(request.url).origin;
  if (!ALLOWED_ORIGINS.has(origin) && !sameOrigin) return reply(403, "Forbidden", origin);

  const ip = (request.headers.get("x-forwarded-for") || "").split(",")[0].trim() || "unknown";
  if (rateLimited(ip)) return reply(429, "Too many messages — try again in a few minutes.", origin);

  if (!process.env.RESEND_API_KEY || !process.env.CONTACT_TO) {
    return reply(503, "The form isn't set up yet — please check back soon.", origin);
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return reply(400, "Bad request", origin);
  }

  const form = FORMS[body?.form];
  if (!form) return reply(400, "Bad request", origin);
  // Honeypot: real visitors never fill this hidden field. Pretend success so bots don't retry.
  if (body.website) return reply(200, "ok", origin);

  const lines = [];
  for (const [key, label, max, required] of form.fields) {
    const value = typeof body[key] === "string" ? body[key].trim().slice(0, max) : "";
    if (required && !value) return reply(400, `Please fill in: ${label}`, origin);
    if (value) lines.push(`${label}: ${value}`);
  }
  lines.push("", `Page: ${String(body.page || "").slice(0, 200)}`);

  // Reply straight to the visitor when they left an email (the contact form's "contact" field often is one).
  const email = [body.email, body.contact].find((v) => typeof v === "string" && v.includes("@"))?.trim() || "";
  const upstream = await fetch(RESEND_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: process.env.CONTACT_FROM || "yezhang.net <onboarding@resend.dev>",
      to: [process.env.CONTACT_TO],
      subject: form.subject,
      text: lines.join("\n"),
      ...(/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) ? { reply_to: email } : {}),
    }),
  });

  if (!upstream.ok) {
    console.error("resend error", upstream.status, await upstream.text().catch(() => ""));
    return reply(502, "Couldn't send right now — please try again later.", origin);
  }
  return reply(200, "ok", origin);
}
