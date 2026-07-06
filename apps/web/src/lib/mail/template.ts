const BRAND = {
  name: "LendTrack",
  primary: "#0d6b47",
  muted: "#666666",
  bg: "#f4f7f4",
};

export function appUrl(path = "") {
  const base = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  return `${base}${path}`;
}

export function greeting(name?: string) {
  return `<p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#333;">Hi ${name?.trim() || "there"},</p>`;
}

export function paragraph(text: string) {
  return `<p style="margin:0 0 14px;font-size:15px;line-height:1.6;color:#333;">${text}</p>`;
}

export function bulletList(items: string[]) {
  return `<ul style="margin:0 0 16px;padding-left:20px;color:#444;line-height:1.7;font-size:14px;">${items
    .map((item) => `<li>${item}</li>`)
    .join("")}</ul>`;
}

export function keyValueTable(rows: { label: string; value: string }[]) {
  const body = rows
    .map(
      (row) =>
        `<tr><td style="padding:8px 12px 8px 0;color:${BRAND.muted};font-size:14px;white-space:nowrap;">${row.label}</td><td style="padding:8px 0;font-size:14px;font-weight:600;color:#111;">${row.value}</td></tr>`
    )
    .join("");

  return `<table style="width:100%;border-collapse:collapse;margin:16px 0;">${body}</table>`;
}

export function alertBox(text: string, tone: "warning" | "info" = "warning") {
  const bg = tone === "warning" ? "#fef3c7" : "#ecfdf5";
  const color = tone === "warning" ? "#92400e" : "#065f46";
  return `<div style="background:${bg};color:${color};padding:14px 16px;border-radius:10px;margin:16px 0;font-size:14px;line-height:1.5;">${text}</div>`;
}

export function ctaButton(label: string, href: string) {
  return `
    <p style="margin:24px 0 8px;">
      <a href="${href}" style="display:inline-block;background:${BRAND.primary};color:#fff;padding:12px 24px;border-radius:10px;text-decoration:none;font-weight:600;font-size:14px;">
        ${label}
      </a>
    </p>`;
}

export function buildHeader(title: string) {
  return `
    <tr>
      <td style="padding:28px 32px 8px;">
        <p style="margin:0 0 6px;font-size:12px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:${BRAND.primary};">${BRAND.name}</p>
        <h1 style="margin:0;font-size:22px;line-height:1.3;color:#111;font-weight:700;">${title}</h1>
      </td>
    </tr>`;
}

export function buildFooter() {
  return `
    <tr>
      <td style="padding:8px 32px 28px;">
        <p style="margin:0;font-size:12px;color:#999;line-height:1.5;">
          You received this email from ${BRAND.name}. Manage notification preferences in Settings.
        </p>
      </td>
    </tr>`;
}

export function buildBody(content: string) {
  return `
    <tr>
      <td style="padding:8px 32px 16px;">
        ${content}
      </td>
    </tr>`;
}

export function assembleEmail(title: string, bodyContent: string) {
  const html = `
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:${BRAND.bg};">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:${BRAND.bg};padding:24px 12px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.06);">
        ${buildHeader(title)}
        ${buildBody(bodyContent)}
        ${buildFooter()}
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  const text = bodyContent
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return { html, text: `${title}\n\n${text}` };
}

export function buildMail(title: string, sections: string[]) {
  return assembleEmail(title, sections.join(""));
}
