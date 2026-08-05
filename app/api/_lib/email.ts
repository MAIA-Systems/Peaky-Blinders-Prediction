import { Resend } from "resend";
import { HttpError } from "./http";

let client: Resend | null = null;

function getResend(): Resend {
  if (client) return client;
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new HttpError(503, "Email sending is not configured yet (RESEND_API_KEY missing).");
  client = new Resend(apiKey);
  return client;
}

export function isEmailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY);
}

function getFromAddress(): string {
  return process.env.EMAIL_FROM ?? "Peaky Blinders Prediction Market <onboarding@resend.dev>";
}

// Inline-styled, table-free, single-column — the layout that survives every
// email client's CSS support (or lack of it) intact.
function emailShell(preheader: string, bodyHtml: string): string {
  return `<!doctype html>
<html>
  <body style="margin:0;padding:0;background:#17130f;font-family:'DM Sans',Arial,sans-serif;">
    <span style="display:none;font-size:1px;color:#17130f;">${preheader}</span>
    <div style="max-width:480px;margin:0 auto;padding:40px 24px;">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:32px;">
        <span style="font-family:Georgia,serif;font-size:17px;font-weight:600;color:#ece4d6;">Peaky Blinders</span>
        <span style="font-size:10px;letter-spacing:0.2em;text-transform:uppercase;color:#c9a15a;">Prediction Market</span>
      </div>
      ${bodyHtml}
      <p style="margin-top:40px;font-size:11px;color:#756a5a;">
        Peaky Blinders Prediction Market — a white-label prediction market experience built on FanEngine infrastructure. Demo
        environment, no real funds.
      </p>
    </div>
  </body>
</html>`;
}

function buttonHtml(url: string, label: string): string {
  return `<a href="${url}" style="display:inline-block;margin-top:20px;padding:12px 24px;background:#c9a15a;color:#1a1409;font-weight:600;text-decoration:none;border-radius:6px;font-size:14px;">${label}</a>`;
}

export async function sendVerificationEmail(to: string, name: string, verifyUrl: string): Promise<void> {
  const resend = getResend();
  const html = emailShell(
    "Confirm your email to start trading.",
    `<h1 style="font-family:Georgia,serif;font-size:22px;color:#ece4d6;margin:0 0 12px;">Confirm your email</h1>
     <p style="font-size:14px;line-height:1.6;color:#a99d8b;margin:0;">
       Hi ${name}, confirm this address to finish setting up your account.
     </p>
     ${buttonHtml(verifyUrl, "Verify email")}
     <p style="margin-top:20px;font-size:12px;color:#756a5a;">This link expires in 24 hours. If you didn't create an account, ignore this email.</p>`,
  );

  const { error } = await resend.emails.send({
    from: getFromAddress(),
    to,
    subject: "Confirm your email — Peaky Blinders Prediction Market",
    html,
  });
  if (error) throw new Error(`Resend error: ${error.message}`);
}

export async function sendPasswordResetEmail(to: string, name: string, resetUrl: string): Promise<void> {
  const resend = getResend();
  const html = emailShell(
    "Reset your password.",
    `<h1 style="font-family:Georgia,serif;font-size:22px;color:#ece4d6;margin:0 0 12px;">Reset your password</h1>
     <p style="font-size:14px;line-height:1.6;color:#a99d8b;margin:0;">
       Hi ${name}, we got a request to reset your password. If this wasn't you, you can safely ignore this email.
     </p>
     ${buttonHtml(resetUrl, "Reset password")}
     <p style="margin-top:20px;font-size:12px;color:#756a5a;">This link expires in 1 hour and can only be used once.</p>`,
  );

  const { error } = await resend.emails.send({
    from: getFromAddress(),
    to,
    subject: "Reset your password — Peaky Blinders Prediction Market",
    html,
  });
  if (error) throw new Error(`Resend error: ${error.message}`);
}
