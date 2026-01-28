import sg from "@sendgrid/mail";
sg.setApiKey(process.env.SENDGRID_API_KEY as string);

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { to, subject, html, text } = typeof req.body === "string" ? JSON.parse(req.body) : (req.body || {});
    if (!to || !subject || (!html && !text)) {
      return res.status(400).json({ error: "Faltan campos: to, subject, html/text" });
    }

    await sg.send({
      to,
      from: { email: process.env.FROM_EMAIL as string, name: process.env.FROM_NAME || "SIGAIRE" },
      subject,
      text,
      html,
    });

    return res.status(200).json({ ok: true });
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ error: err?.response?.body || err?.message || "Error al enviar" });
  }
}