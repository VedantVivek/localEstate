const nodemailer = require("nodemailer");

function smtpReady() {
  return Boolean(process.env.SMTP_USER && process.env.SMTP_PASS);
}
function mailReady() {
  return smtpReady() && Boolean(process.env.CONTACT_TO);
}

function transporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: Number(process.env.SMTP_PORT || 587),
    secure: false,
    connectionTimeout: 8000,
    greetingTimeout: 8000,
    socketTimeout: 10000,
    auth: {
      user: process.env.SMTP_USER,
      pass: String(process.env.SMTP_PASS || "").replace(/\s+/g, ""),
    },
  });
}

const esc = (s) =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

function brandMail({ eyebrow, title, rows = [], body = "", footer = "LocaleEstate · India listings desk" }) {
  const rowHtml = rows
    .map(
      ([k, v]) =>
        `<tr><td style="padding:10px 0;border-bottom:1px solid #e6e2d9;width:34%;font:600 12px/1.3 Georgia,serif;color:#1f4d3a;text-transform:uppercase;letter-spacing:.06em">${esc(k)}</td><td style="padding:10px 0;border-bottom:1px solid #e6e2d9;font:500 15px/1.45 system-ui,sans-serif;color:#141414">${esc(v)}</td></tr>`
    )
    .join("");
  const html = `<!doctype html><html><body style="margin:0;background:#0c1f2e;padding:28px 12px;font-family:Georgia,serif">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr><td align="center">
  <table role="presentation" width="560" style="max-width:560px;width:100%;background:#f7f9fb;border:1px solid #c5d0d8">
    <tr><td style="background:#0c1f2e;padding:22px 28px">
      <div style="font:800 11px/1 system-ui,sans-serif;letter-spacing:.18em;text-transform:uppercase;color:#b8892d">LocaleEstate</div>
      <div style="margin-top:8px;font:700 13px/1.2 Georgia,serif;color:#c9b27a">${esc(eyebrow)}</div>
      <h1 style="margin:10px 0 0;font:700 28px/1.15 Georgia,serif;color:#fff">${esc(title)}</h1>
    </td></tr>
    <tr><td style="padding:26px 28px">
      ${rows.length ? `<table width="100%" cellspacing="0" cellpadding="0">${rowHtml}</table>` : ""}
      ${body ? `<p style="margin:18px 0 0;font:400 16px/1.55 Georgia,serif;color:#1a1a1a">${esc(body).replace(/\n/g, "<br>")}</p>` : ""}
    </td></tr>
    <tr><td style="padding:16px 28px;background:#e8eef3;font:600 12px/1.4 system-ui,sans-serif;color:#2a3f4f;letter-spacing:.04em">${esc(footer)}</td></tr>
  </table>
  </td></tr></table>
  </body></html>`;
  const text = [`LocaleEstate — ${title}`, ...rows.map(([k, v]) => `${k}: ${v}`), "", body, "", footer].filter(Boolean).join("\n");
  return { html, text };
}

async function send(payload) {
  if (!smtpReady()) return { sent: false, reason: "not_configured" };
  const to = payload.to || process.env.CONTACT_TO;
  if (!to) return { sent: false, reason: "no_recipient" };
  const { to: _t, ...rest } = payload;
  const info = await transporter().sendMail({
    from: `"LocaleEstate" <${process.env.SMTP_USER}>`,
    to,
    ...rest,
  });
  return { sent: true, id: info.messageId };
}

async function sendContactMail(entry) {
  const { html, text } = brandMail({
    eyebrow: "Desk alert",
    title: "New buyer note on the board",
    rows: [
      ["Name", entry.name],
      ["Email", entry.email],
      ["Phone", entry.phone || "—"],
      ["Channel", entry.channel],
    ],
    body: entry.message,
  });
  return send({ replyTo: entry.email, subject: `LocaleEstate · Note from ${entry.name}`, html, text });
}

async function sendSubscribeMail(email) {
  const { html, text } = brandMail({
    eyebrow: "Mailing list",
    title: "New street-list signup",
    rows: [["Email", email], ["Intent", "Wants future India listing drops"]],
    body: "Keep this address on the LocaleEstate street list.",
  });
  return send({ subject: `LocaleEstate · List signup · ${email}`, html, text });
}

async function sendRegisterMail(user) {
  const { html, text } = brandMail({
    eyebrow: "Account opened",
    title: "New buyer account created",
    rows: [
      ["Name", user.name],
      ["Email", user.email],
      ["User ID", user.id],
      ["Opened", user.created_at || new Date().toISOString()],
    ],
    body: "A fresh account just joined LocaleEstate.",
  });
  return send({ subject: `LocaleEstate · New account · ${user.name}`, html, text });
}

async function sendWelcomeToUser(user) {
  const { html, text } = brandMail({
    eyebrow: "Welcome",
    title: "Your account has been created",
    rows: [
      ["Name", user.name],
      ["Email", user.email],
    ],
    body: `Hi ${user.name},\n\nYour LocaleEstate account is ready. You can save homes, book tours, and leave reviews on the board.\n\nIf this wasn’t you, reply to this email and we’ll help.`,
  });
  return send({
    to: user.email,
    subject: "LocaleEstate · Account created successfully",
    html,
    text,
  });
}

async function sendLoginMail(user) {
  const when = new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }) + " IST";
  const { html, text } = brandMail({
    eyebrow: "Session alert",
    title: "Buyer signed in",
    rows: [
      ["Name", user.name],
      ["Email", user.email],
      ["When", when],
    ],
    body: "Someone signed into LocaleEstate with this account.",
  });
  return send({ subject: `LocaleEstate · Sign-in · ${user.email}`, html, text });
}

async function sendLoginToUser(user) {
  const when = new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }) + " IST";
  const { html, text } = brandMail({
    eyebrow: "You’re in",
    title: "You have signed in",
    rows: [
      ["Name", user.name],
      ["Email", user.email],
      ["When", when],
    ],
    body: `Hi ${user.name},\n\nYou just signed in to LocaleEstate. If that wasn’t you, change your password and reply to this email.`,
  });
  return send({
    to: user.email,
    subject: "LocaleEstate · You signed in",
    html,
    text,
  });
}

async function sendTourMail({ user, tour, property }) {
  const { html, text } = brandMail({
    eyebrow: "Tour booked",
    title: "Site visit on the calendar",
    rows: [
      ["Buyer", `${user.name} · ${user.email}`],
      ["Home", property?.title || `#${tour.propertyId}`],
      ["Pin", property?.location || "—"],
      ["When", `${tour.date} · ${tour.time}`],
      ["Note", tour.note || "—"],
    ],
    body: "Pack the visit kit: ID, questions on society fees, and a daylight walk of the lane.",
  });
  return send({ subject: `LocaleEstate · Tour · ${property?.title || tour.propertyId}`, html, text });
}

async function sendTourToUser({ user, tour, property }) {
  const { html, text } = brandMail({
    eyebrow: "Tour confirmed",
    title: "Your site visit is booked",
    rows: [
      ["Home", property?.title || `#${tour.propertyId}`],
      ["When", `${tour.date} · ${tour.time}`],
      ["Note", tour.note || "—"],
    ],
    body: `Hi ${user.name},\n\nYour LocaleEstate tour is scheduled. Bring ID, ask about society fees, and walk the lane in daylight.`,
  });
  return send({
    to: user.email,
    subject: `LocaleEstate · Tour booked · ${property?.title || tour.propertyId}`,
    html,
    text,
  });
}

module.exports = {
  mailReady,
  sendContactMail,
  sendSubscribeMail,
  sendRegisterMail,
  sendWelcomeToUser,
  sendLoginMail,
  sendLoginToUser,
  sendTourMail,
  sendTourToUser,
};
