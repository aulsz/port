const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;
const RATE_LIMIT_MAX = 5;
const MAX_BODY_BYTES = 12_000;
const MIN_FORM_TIME_MS = 900;
const MAX_FORM_AGE_MS = 2 * 60 * 60 * 1000;

const rateLimitStore = globalThis.__portfolioContactRateLimit || new Map();
globalThis.__portfolioContactRateLimit = rateLimitStore;

const defaultAllowedOrigins = [
  'https://aulsz-port.vercel.app',
  'https://collinsculbert.dev',
  'https://www.collinsculbert.dev',
  'http://localhost:5173',
  'http://127.0.0.1:5173'
];

function getAllowedOrigins() {
  const configured = (process.env.CONTACT_ALLOWED_ORIGINS || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  const vercelUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : '';
  return new Set([...defaultAllowedOrigins, ...configured, vercelUrl].filter(Boolean));
}

function setSecurityHeaders(res, origin = '') {
  const allowedOrigins = getAllowedOrigins();
  const corsOrigin = allowedOrigins.has(origin) ? origin : 'https://aulsz-port.vercel.app';

  res.setHeader('Access-Control-Allow-Origin', corsOrigin);
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept');
  res.setHeader('Access-Control-Max-Age', '86400');
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('X-Content-Type-Options', 'nosniff');
}

function sendJson(res, status, payload) {
  if (status === 204) return res.status(204).end();
  res.status(status).json(payload);
}

function getClientIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.length) return forwarded.split(',')[0].trim();
  return req.socket?.remoteAddress || 'unknown';
}

function checkRateLimit(ip) {
  const now = Date.now();
  const entry = rateLimitStore.get(ip) || { count: 0, resetAt: now + RATE_LIMIT_WINDOW_MS };

  if (entry.resetAt <= now) {
    entry.count = 0;
    entry.resetAt = now + RATE_LIMIT_WINDOW_MS;
  }

  entry.count += 1;
  rateLimitStore.set(ip, entry);

  for (const [key, value] of rateLimitStore.entries()) {
    if (value.resetAt <= now) rateLimitStore.delete(key);
  }

  return entry.count <= RATE_LIMIT_MAX;
}

async function readBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string') return JSON.parse(req.body || '{}');

  let size = 0;
  const chunks = [];
  for await (const chunk of req) {
    size += chunk.length;
    if (size > MAX_BODY_BYTES) {
      const error = new Error('Message is too large.');
      error.statusCode = 413;
      throw error;
    }
    chunks.push(chunk);
  }

  const raw = Buffer.concat(chunks).toString('utf8');
  return raw ? JSON.parse(raw) : {};
}

function clean(value, maxLength) {
  return String(value || '')
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
    .trim()
    .slice(0, maxLength);
}

function escapeHtml(value) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function validate(payload) {
  const name = clean(payload.name, 80);
  const email = clean(payload.email, 120).toLowerCase();
  const message = clean(payload.message, 2000);
  const website = clean(payload.website, 120);
  const startedAt = Number(payload.startedAt || 0);
  const elapsed = Date.now() - startedAt;

  if (website) return { ok: false, status: 204, error: '' };
  if (!name || name.length < 2) return { ok: false, status: 400, error: 'Please enter your name.' };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { ok: false, status: 400, error: 'Please enter a valid email.' };
  if (!message || message.length < 10) return { ok: false, status: 400, error: 'Please write a slightly longer message.' };
  if (message.length > 2000) return { ok: false, status: 400, error: 'Message is too long.' };
  if (!startedAt || elapsed < MIN_FORM_TIME_MS || elapsed > MAX_FORM_AGE_MS) {
    return { ok: false, status: 400, error: 'Please refresh and try again.' };
  }

  const linkCount = (message.match(/https?:\/\//gi) || []).length;
  if (linkCount > 3) return { ok: false, status: 400, error: 'Too many links in the message.' };

  return { ok: true, name, email, message };
}

export default async function handler(req, res) {
  const origin = req.headers.origin || '';
  setSecurityHeaders(res, origin);

  if (req.method === 'OPTIONS') return sendJson(res, 204, {});
  if (req.method !== 'POST') return sendJson(res, 405, { error: 'Method not allowed.' });

  const allowedOrigins = getAllowedOrigins();
  if (origin && !allowedOrigins.has(origin)) {
    return sendJson(res, 403, { error: 'Request origin is not allowed.' });
  }

  const contentType = req.headers['content-type'] || '';
  if (!contentType.includes('application/json')) {
    return sendJson(res, 415, { error: 'Unsupported content type.' });
  }

  const ip = getClientIp(req);
  if (!checkRateLimit(ip)) {
    return sendJson(res, 429, { error: 'Too many messages. Please try again later.' });
  }

  let payload;
  try {
    payload = await readBody(req);
  } catch (error) {
    return sendJson(res, error.statusCode || 400, { error: 'Invalid message payload.' });
  }

  const validation = validate(payload);
  if (!validation.ok) {
    if (validation.status === 204) return sendJson(res, 204, {});
    return sendJson(res, validation.status, { error: validation.error });
  }

  const apiKey = process.env.RESEND_API_KEY;
  const toEmail = process.env.CONTACT_TO_EMAIL || 'coculbert@icloud.com';
  const fromEmail = process.env.CONTACT_FROM_EMAIL || 'Portfolio <onboarding@resend.dev>';

  if (!apiKey) {
    return sendJson(res, 503, { error: 'Email backend is not configured yet.' });
  }

  const safeName = escapeHtml(validation.name);
  const safeEmail = escapeHtml(validation.email);
  const safeMessage = escapeHtml(validation.message).replace(/\n/g, '<br>');

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from: fromEmail,
      to: [toEmail],
      reply_to: validation.email,
      subject: `Portfolio message from ${validation.name}`,
      text: `Name: ${validation.name}\nEmail: ${validation.email}\n\n${validation.message}`,
      html: `
        <h2>New portfolio message</h2>
        <p><strong>Name:</strong> ${safeName}</p>
        <p><strong>Email:</strong> ${safeEmail}</p>
        <p><strong>Message:</strong></p>
        <p>${safeMessage}</p>
      `
    })
  });

  if (!response.ok) {
    console.error('Resend email failed', response.status, await response.text());
    return sendJson(res, 502, { error: 'Email service could not send the message.' });
  }

  return sendJson(res, 200, { ok: true });
}
