
export function tutorWelcomeEmailTemplate({ name, email, tempPassword, loginUrl }) {
  const subject = "Welcome to the Platform — Your Tutor Account Details";

  const html = `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${subject}</title>
  </head>
  <body style="margin:0; padding:0; background-color:#f4f5f7; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f5f7; padding: 40px 0;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" style="max-width:560px; background-color:#ffffff; border-radius:8px; overflow:hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.08);">
            
            <!-- Header -->
            <tr>
              <td style="background-color:#1a56db; padding: 32px 40px;">
                <h1 style="margin:0; color:#ffffff; font-size:20px; font-weight:600;">
                  Tutor Platform
                </h1>
              </td>
            </tr>

            <!-- Body -->
            <tr>
              <td style="padding: 40px;">
                <h2 style="margin:0 0 16px; color:#111827; font-size:20px;">
                  Welcome, ${escapeHtml(name)} 👋
                </h2>
                <p style="margin:0 0 16px; color:#374151; font-size:15px; line-height:1.6;">
                  An account has been created for you as a <strong>Tutor</strong> on our platform.
                  Below are your login credentials to get started.
                </p>

                <table role="presentation" width="100%" style="background-color:#f9fafb; border:1px solid #e5e7eb; border-radius:6px; margin: 24px 0;">
                  <tr>
                    <td style="padding: 20px 24px;">
                      <p style="margin:0 0 8px; font-size:13px; color:#6b7280; text-transform:uppercase; letter-spacing:0.05em;">Email</p>
                      <p style="margin:0 0 16px; font-size:15px; color:#111827; font-weight:600;">${escapeHtml(email)}</p>

                      <p style="margin:0 0 8px; font-size:13px; color:#6b7280; text-transform:uppercase; letter-spacing:0.05em;">Temporary Password</p>
                      <p style="margin:0; font-size:15px; color:#111827; font-weight:600; font-family: 'Courier New', monospace;">${escapeHtml(tempPassword)}</p>
                    </td>
                  </tr>
                </table>

                <p style="margin:0 0 24px; color:#374151; font-size:14px; line-height:1.6;">
                  For security reasons, please log in and change this password as soon as possible.
                  Do not share these credentials with anyone.
                </p>

                <table role="presentation" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="border-radius:6px; background-color:#1a56db;">
                      <a href="${loginUrl}" target="_blank" style="display:inline-block; padding: 12px 28px; color:#ffffff; font-size:14px; font-weight:600; text-decoration:none; border-radius:6px;">
                        Log In to Your Account
                      </a>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td style="padding: 24px 40px; border-top:1px solid #e5e7eb;">
                <p style="margin:0; color:#9ca3af; font-size:12px; line-height:1.6;">
                  This is an automated message. If you did not expect this email, please contact support
                  or ignore it — no account access will occur without the password above.
                </p>
              </td>
            </tr>

          </table>
        </td>
      </tr>
    </table>
  </body>
  </html>
  `;

  const text = `
Welcome, ${name}!

An account has been created for you as a Tutor on our platform.

Email: ${email}
Temporary Password: ${tempPassword}

For security reasons, please log in and change this password as soon as possible.
Do not share these credentials with anyone.

Log in here: ${loginUrl}

If you did not expect this email, please contact support.
  `.trim();

  return { subject, html, text };
}

// Basic escaping to avoid HTML injection if name/email ever contain special chars
function escapeHtml(str = "") {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}