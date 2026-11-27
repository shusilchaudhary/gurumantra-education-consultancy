import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { z } from "zod";

const PUBLIC_CONTACT_EMAIL = "gurumantraconsultancy39@gmail.com";
const RESEND_DEFAULT_EMAIL = "gurumantraconsultancy39@gmail.com";
const DEFAULT_RESEND_FROM = "Gurumantra Website <onboarding@resend.dev>";

function resolveResendFromAddress(): string {
  const configured = process.env.RESEND_FROM_EMAIL?.trim();
  if (!configured) return DEFAULT_RESEND_FROM;
  if (/@(gmail|yahoo|hotmail|outlook|live)\./i.test(configured)) {
    return DEFAULT_RESEND_FROM;
  }
  return configured;
}

function formatResendError(error: { name?: string; statusCode?: number | null; message?: string }): string {
  const msg = error.message || "";
  if (/only send testing emails to your own email address/i.test(msg)) {
    return "Resend sandbox only allows sending to your Resend account email (gurumantraconsultancy39@gmail.com) unless a custom domain is verified. Please check RESEND_TO_EMAIL or call 9808531098.";
  }
  if (error.name === "invalid_api_key" || error.statusCode === 401 || /api key/i.test(msg)) {
    return "Resend API key was rejected as invalid. Please check RESEND_API_KEY in Secrets or call 9808531098.";
  }
  if (/not verified|domain/i.test(msg)) {
    return "Sender domain is not verified in Resend. Leave RESEND_FROM_EMAIL unset (uses onboarding@resend.dev) or verify your domain, or call 9808531098.";
  }
  if (error.statusCode === 429 || /rate limit|quota/i.test(msg)) {
    return "Email sending limit reached temporarily. Please wait a moment and try again, or call 9808531098.";
  }
  return "Unable to send email right now. Please try again or call 9808531098.";
}

const requestSchema = z.object({
  name: z.string().trim().min(2, "Please enter your full name.").max(100),
  email: z.string().trim().email("Please enter a valid email address.").max(150),
  phone: z.string().trim().min(7, "Please enter a valid phone number.").max(25),
  destination: z.string().trim().max(80).optional().default(""),
  message: z.string().trim().max(2000).optional().default(""),
  source: z.enum(["home", "book-consultation"]).optional().default("home"),
});

function stripNewlines(value: string): string {
  return value.replace(/[\r\n]+/g, " ").trim();
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function isAllowedOrigin(req: NextRequest): boolean {
  const origin = req.headers.get("origin");
  if (!origin) return true;
  try {
    const originHost = new URL(origin).host;
    const forwardedHosts = (req.headers.get("x-forwarded-host") || "")
      .split(",")
      .map((h) => h.trim())
      .filter(Boolean);
    const directHost = req.headers.get("host");
    const allowedHosts = new Set<string>([
      ...forwardedHosts,
      ...(directHost ? [directHost] : []),
    ]);

    const appUrl = process.env.APP_URL?.trim();
    if (appUrl && appUrl !== "MY_APP_URL") {
      try {
        allowedHosts.add(new URL(appUrl).host);
      } catch {
        // Ignore invalid APP_URL placeholder
      }
    }

    if (allowedHosts.size === 0) return true;
    return allowedHosts.has(originHost);
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  if (!isAllowedOrigin(req)) {
    return NextResponse.json({ error: "Forbidden request origin." }, { status: 403 });
  }

  let rawBody: unknown;
  try {
    rawBody = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request payload." }, { status: 400 });
  }

  const parsed = requestSchema.safeParse(rawBody);
  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0]?.message ?? "Please check your form details.";
    return NextResponse.json({ error: firstIssue }, { status: 400 });
  }

  const cleanName = stripNewlines(parsed.data.name);
  const cleanEmail = stripNewlines(parsed.data.email);
  const cleanPhone = stripNewlines(parsed.data.phone);
  const cleanDestination = stripNewlines(parsed.data.destination || "Not specified");
  const cleanMessage = parsed.data.message.trim() || "No additional message provided.";
  const sourceLabel = parsed.data.source === "book-consultation" ? "Book Consultation Page" : "Home Page";

  const subject = `New Consultation Inquiry from ${cleanName} (${cleanDestination})`;

  const textBody = [
    "New Free Consultation Inquiry — Gurumantra Educational Consultancy",
    "",
    `Full Name: ${cleanName}`,
    `Email: ${cleanEmail}`,
    `Phone: ${cleanPhone}`,
    `Preferred Destination: ${cleanDestination}`,
    `Submitted From: ${sourceLabel}`,
    "",
    "Message:",
    cleanMessage,
  ].join("\n");

  const htmlBody = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1e293b;">
      <h2 style="color: #1565C0; margin-bottom: 16px;">New Consultation Inquiry</h2>
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 16px;">
        <tr><td style="padding: 8px 0; font-weight: 700; width: 170px;">Full Name:</td><td style="padding: 8px 0;">${escapeHtml(cleanName)}</td></tr>
        <tr><td style="padding: 8px 0; font-weight: 700;">Email:</td><td style="padding: 8px 0;">${escapeHtml(cleanEmail)}</td></tr>
        <tr><td style="padding: 8px 0; font-weight: 700;">Phone:</td><td style="padding: 8px 0;">${escapeHtml(cleanPhone)}</td></tr>
        <tr><td style="padding: 8px 0; font-weight: 700;">Destination:</td><td style="padding: 8px 0;">${escapeHtml(cleanDestination)}</td></tr>
        <tr><td style="padding: 8px 0; font-weight: 700;">Submitted From:</td><td style="padding: 8px 0;">${escapeHtml(sourceLabel)}</td></tr>
      </table>
      <div style="padding: 12px 16px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px;">
        <div style="font-weight: 700; margin-bottom: 6px;">Message:</div>
        <div style="white-space: pre-wrap;">${escapeHtml(cleanMessage)}</div>
      </div>
    </div>
  `.trim();

  const resendApiKey = process.env.RESEND_API_KEY?.trim();
  if (resendApiKey) {
    const resend = new Resend(resendApiKey);
    const recipients = (process.env.RESEND_TO_EMAIL?.trim() || RESEND_DEFAULT_EMAIL)
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);

    try {
      const { error } = await resend.emails.send({
        from: resolveResendFromAddress(),
        to: recipients,
        replyTo: cleanEmail,
        subject,
        text: textBody,
        html: htmlBody,
      });

      if (error) {
        console.error("[Consultation API] Resend SDK error:", error.name, error.statusCode, error.message);
        return NextResponse.json(
          { error: formatResendError(error) },
          { status: 502 }
        );
      }

      return NextResponse.json({
        ok: true,
        mode: "resend",
      });
    } catch (err) {
      console.error("[Consultation API] Resend send failed:", err);
      return NextResponse.json(
        { error: "Unable to send email right now. Please try again or call 9808531098." },
        { status: 502 }
      );
    }
  }

  const mailtoUrl = `mailto:${PUBLIC_CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(textBody)}`;
  return NextResponse.json({
    ok: true,
    mode: "mailto_fallback",
    recipient: PUBLIC_CONTACT_EMAIL,
    mailtoUrl,
  });
}
