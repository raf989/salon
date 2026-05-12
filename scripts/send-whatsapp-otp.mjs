// WhatsApp Cloud API — OTP delivery test.
//
// Usage:
//   node scripts/send-whatsapp-otp.mjs hello   994701234567
//   node scripts/send-whatsapp-otp.mjs auth    994701234567 123456
//
// Reads credentials from .env.local (never hardcode the token):
//   WHATSAPP_PHONE_NUMBER_ID
//   WHATSAPP_API_VERSION       (defaults to v20.0)
//   WHATSAPP_TOKEN

import axios from "axios";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

// ---- env loading ------------------------------------------------------------

const here = dirname(fileURLToPath(import.meta.url));
const envPath = join(here, "..", ".env.local");
const env = Object.fromEntries(
  readFileSync(envPath, "utf8")
    .split(/\r?\n/)
    .filter((l) => l && !l.startsWith("#"))
    .map((l) => {
      const idx = l.indexOf("=");
      return [l.slice(0, idx).trim(), l.slice(idx + 1).trim()];
    }),
);

const TOKEN = env.WHATSAPP_TOKEN;
const PHONE_NUMBER_ID = env.WHATSAPP_PHONE_NUMBER_ID;
const API_VERSION = env.WHATSAPP_API_VERSION || "v20.0";

if (!TOKEN || !PHONE_NUMBER_ID) {
  console.error(
    "Missing WHATSAPP_TOKEN or WHATSAPP_PHONE_NUMBER_ID in .env.local",
  );
  process.exit(1);
}

const BASE_URL = `https://graph.facebook.com/${API_VERSION}/${PHONE_NUMBER_ID}/messages`;

// ---- helpers ----------------------------------------------------------------

/**
 * Normalise an incoming phone number. The WhatsApp API accepts E.164 either
 * with or without the leading "+", but it must not contain spaces or dashes.
 * Throws on obviously bad input.
 */
function normalisePhone(raw) {
  const digits = String(raw).replace(/\D/g, "");
  if (digits.length < 11 || digits.length > 15) {
    throw new Error(
      `Bad phone "${raw}" — expected 11-15 digits in E.164 (e.g. 994701234567)`,
    );
  }
  return digits;
}

/** Pretty-print an axios error coming back from Graph API. */
function logRequestError(prefix, err) {
  if (axios.isAxiosError(err) && err.response) {
    const { status, statusText, data } = err.response;
    console.error(
      `${prefix} — HTTP ${status} ${statusText}\n${JSON.stringify(data, null, 2)}`,
    );
    if (status === 401) {
      console.error(
        "\n[hint] 401 usually means the access token is invalid or expired.\n" +
          "       Generate a new temporary token in Meta for Developers → WhatsApp → API Setup.",
      );
    } else if (status === 400) {
      const fbErr = data?.error ?? {};
      console.error(
        `\n[hint] 400 details: code=${fbErr.code} subcode=${fbErr.error_subcode} ` +
          `type=${fbErr.type}\n       ${fbErr.message ?? ""}\n` +
          "       Common causes: recipient phone not added to allowed list in dev mode,\n" +
          "       template name doesn't exist in your business account, or language tag mismatch.",
      );
    }
  } else {
    console.error(`${prefix} — non-HTTP error:`, err);
  }
}

// ---- version 1: hello_world (delivery smoke test) ---------------------------

/**
 * Send the stock `hello_world` template — Meta provisions this on every WABA,
 * accepts no variables, only useful for verifying that the token + Phone
 * Number ID + recipient combination actually delivers.
 *
 * @param {string} recipientPhone E.164 digits, e.g. "994701234567"
 * @returns {Promise<object>} the Graph API response payload
 */
export async function sendWhatsAppHello(recipientPhone) {
  const to = normalisePhone(recipientPhone);
  const payload = {
    messaging_product: "whatsapp",
    to,
    type: "template",
    template: {
      name: "hello_world",
      language: { code: "en_US" }, // hello_world only ships in en_US
    },
  };
  try {
    const res = await axios.post(BASE_URL, payload, {
      headers: {
        Authorization: `Bearer ${TOKEN}`,
        "Content-Type": "application/json",
      },
    });
    const wamid = res.data?.messages?.[0]?.id ?? "?";
    console.log(
      `[whatsapp] hello_world → ${to} OK (wamid=${wamid}, contacts=${res.data?.contacts?.[0]?.wa_id ?? "?"})`,
    );
    return res.data;
  } catch (err) {
    logRequestError(`[whatsapp] hello_world → ${to} FAILED`, err);
    throw err;
  }
}

// ---- version 2: auth_code (real OTP template) -------------------------------

/**
 * Send the `auth_code` template with the OTP code substituted into the
 * single body variable {{1}}. You must create this template in Meta Business
 * Manager → WhatsApp → Message Templates first, with category "Authentication"
 * (otherwise the code in the body will be flagged as suspicious template).
 *
 * Template body should be something like:
 *   "Sizin {{1}} təsdiq kodunuz. Heç kimə deməyin."
 *
 * @param {string} recipientPhone E.164 digits, e.g. "994701234567"
 * @param {string} code           6-digit OTP, e.g. "123456"
 * @param {string} [languageCode] e.g. "az" or "ru" — must match the template's
 *                                approved language. Defaults to "az".
 * @returns {Promise<object>}
 */
export async function sendWhatsAppOTP(recipientPhone, code, languageCode = "az") {
  const to = normalisePhone(recipientPhone);
  if (!/^\d{4,8}$/.test(String(code))) {
    throw new Error(`Bad OTP code "${code}" — expected 4-8 digits`);
  }
  const payload = {
    messaging_product: "whatsapp",
    to,
    type: "template",
    template: {
      name: "auth_code",
      language: { code: languageCode },
      components: [
        {
          type: "body",
          parameters: [{ type: "text", text: String(code) }],
        },
        // Many "Authentication" category templates also require a button
        // component echoing the code so the user can copy it in one tap.
        // Uncomment when your template has a "Copy code" button:
        // {
        //   type: "button",
        //   sub_type: "url",
        //   index: "0",
        //   parameters: [{ type: "text", text: String(code) }],
        // },
      ],
    },
  };
  try {
    const res = await axios.post(BASE_URL, payload, {
      headers: {
        Authorization: `Bearer ${TOKEN}`,
        "Content-Type": "application/json",
      },
    });
    const wamid = res.data?.messages?.[0]?.id ?? "?";
    console.log(
      `[whatsapp] auth_code(${code}) → ${to} OK (wamid=${wamid})`,
    );
    return res.data;
  } catch (err) {
    logRequestError(`[whatsapp] auth_code → ${to} FAILED`, err);
    throw err;
  }
}

// ---- CLI entry --------------------------------------------------------------

const mode = process.argv[2];
const phone = process.argv[3];
const code = process.argv[4];

if (!mode || !phone) {
  console.log(
    "Usage:\n" +
      "  node scripts/send-whatsapp-otp.mjs hello 994701234567\n" +
      "  node scripts/send-whatsapp-otp.mjs auth  994701234567 123456",
  );
  process.exit(0);
}

try {
  if (mode === "hello") {
    await sendWhatsAppHello(phone);
  } else if (mode === "auth") {
    if (!code) {
      console.error("auth mode requires a 4-8 digit code");
      process.exit(1);
    }
    await sendWhatsAppOTP(phone, code);
  } else {
    console.error(`Unknown mode "${mode}". Use "hello" or "auth".`);
    process.exit(1);
  }
} catch {
  process.exit(1);
}
