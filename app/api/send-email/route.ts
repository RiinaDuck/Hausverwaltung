import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const { to, subject, body } = await req.json();

  if (!to || !subject || !body) {
    return NextResponse.json(
      { error: "Fehlende Parameter: to, subject, body" },
      { status: 400 },
    );
  }

  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM;

  if (!apiKey || !from) {
    return NextResponse.json(
      { error: "Resend nicht konfiguriert. Bitte RESEND_API_KEY und RESEND_FROM in .env.local setzen." },
      { status: 503 },
    );
  }

  const resend = new Resend(apiKey);

  const escaped = body
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\n/g, "<br>");
  const html = `<div style="font-family:Arial,sans-serif;font-size:14px;white-space:pre-wrap">${escaped}</div>`;

  try {
    const { error } = await resend.emails.send({ from, to, subject, html, text: body });
    if (error) {
      console.error("Resend Fehler:", error);
      return NextResponse.json({ error: (error as any).message ?? "Resend-Fehler" }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("E-Mail-Versand fehlgeschlagen:", err);
    return NextResponse.json(
      { error: err?.message ?? "Unbekannter Fehler" },
      { status: 500 },
    );
  }
}
