import nodemailer from 'nodemailer';
import {
  FRONTEND_URL,
  MAIL_FROM,
  SMTP_HOST,
  SMTP_PASS,
  SMTP_PORT,
  SMTP_SECURE,
  SMTP_USER,
} from '../config/env.js';

let transporter;

const ensureMailConfig = () => {
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS || !MAIL_FROM) {
    const error = new Error(
      'La configuración SMTP no está completa en el servidor. Faltan SMTP_HOST, SMTP_USER, SMTP_PASS o MAIL_FROM.'
    );
    error.statusCode = 500;
    throw error;
  }
};

const getTransporter = () => {
  ensureMailConfig();

  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_SECURE,
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS,
      },
    });
  }

  return transporter;
};

const escapeHtml = (value) =>
  String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');

const buildInvitationEmail = ({ portalName, inviteCode }) => {
  const loginUrl = `${FRONTEND_URL}/login?invite=${encodeURIComponent(inviteCode)}`;
  const safePortalName = escapeHtml(portalName);
  const safeInviteCode = escapeHtml(inviteCode);
  const safeLoginUrl = escapeHtml(loginUrl);

  return {
    subject: `Te han invitado a ${portalName} en Gestiona-2`,
    text: [
      `Has recibido una invitacion para unirte al portal "${portalName}" en Gestiona-2.`,
      `Codigo de invitacion: ${inviteCode}`,
      `Entra aqui para iniciar sesion y gestionar la invitacion: ${loginUrl}`,
      'Si el boton no funciona, copia el codigo y pegalo en la pantalla "Unirme a un portal".',
    ].join('\n\n'),
    html: `
      <!doctype html>
      <html lang="es">
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <title>Invitacion a Gestiona-2</title>
        </head>
        <body style="margin:0; padding:0; background:#fff7ed;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#fff7ed; margin:0; padding:32px 12px;">
            <tr>
              <td align="center">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:640px; background:#ffffff; border:1px solid #fed7aa; border-radius:22px; overflow:hidden; box-shadow:0 18px 48px rgba(124,45,18,0.10);">
                  <tr>
                    <td style="padding:0; background:linear-gradient(135deg,#fff7ed 0%,#ffedd5 42%,#ffe4e6 100%);">
                      <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                        <tr>
                          <td style="padding:34px 34px 26px 34px;">
                            <p style="margin:0 0 12px 0; font-family:Georgia, 'Times New Roman', serif; font-size:15px; color:#fb7185; font-weight:700; letter-spacing:1.4px; text-transform:uppercase;">
                              Gestiona-2
                            </p>
                            <h1 style="margin:0; font-family:Georgia, 'Times New Roman', serif; font-size:34px; line-height:1.12; color:#431407;">
                              Te han invitado a un portal
                            </h1>
                            <p style="margin:14px 0 0 0; font-family:Arial, Helvetica, sans-serif; font-size:12px; line-height:1.35; color:#9a3412;">
                              Unete a <strong style="color:#431407;">${safePortalName}</strong> y colabora desde Gestiona-2.
                            </p>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>

                  <tr>
                    <td style="padding:32px 34px 8px 34px;">
                      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border:1px solid #fed7aa; background:#fffaf5; border-radius:18px;">
                        <tr>
                          <td align="center" style="padding:26px 18px;">
                            <p style="margin:0 0 10px 0; font-family:Arial, Helvetica, sans-serif; font-size:13px; color:#fb923c; font-weight:700; letter-spacing:1px; text-transform:uppercase;">
                              Codigo de invitacion
                            </p>
                            <p style="margin:0; font-family:'Courier New', Courier, monospace; font-size:30px; line-height:1.2; color:#431407; letter-spacing:6px; font-weight:700;">
                              ${safeInviteCode}
                            </p>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>

                  <tr>
                    <td align="center" style="padding:24px 34px 8px 34px;">
                      <a href="${safeLoginUrl}" style="display:inline-block; padding:15px 24px; border-radius:14px; background:#f97316; background-image:linear-gradient(90deg,#f97316,#ef4444); color:#ffffff; font-family:Arial, Helvetica, sans-serif; font-size:15px; font-weight:700; text-decoration:none; box-shadow:0 10px 24px rgba(239,68,68,0.24);">
                        Iniciar sesion y gestionar invitacion
                      </a>
                    </td>
                  </tr>

                  <tr>
                    <td style="padding:18px 34px 30px 34px;">
                      <p style="margin:0; font-family:Arial, Helvetica, sans-serif; font-size:14px; line-height:1.7; color:#9a3412;">
                        Al entrar con tu cuenta veras la pantalla <strong style="color:#431407;">Unirme a un portal</strong>, donde podras aceptar o rechazar esta invitacion. Si el boton no abre correctamente, copia el codigo de arriba y pegalo manualmente.
                      </p>
                    </td>
                  </tr>

                  <tr>
                    <td style="padding:20px 34px; background:#fff7ed; border-top:1px solid #fed7aa;">
                      <p style="margin:0; font-family:Arial, Helvetica, sans-serif; font-size:12px; line-height:1.6; color:#c2410c;">
                        Este correo se ha enviado porque alguien ha introducido tu direccion como invitado en Gestiona-2. Si no esperabas esta invitacion, puedes ignorar este mensaje.
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `,
  };
};

const mailService = {
  sendPortalInvitation: async ({ to, portalName, inviteCode }) => {
    const transport = getTransporter();
    const email = buildInvitationEmail({ portalName, inviteCode });

    try {
      await transport.sendMail({
        from: MAIL_FROM,
        to,
        subject: email.subject,
        text: email.text,
        html: email.html,
      });
    } catch (error) {
      error.statusCode = error.statusCode || 502;
      error.message = `No se pudo enviar el correo a ${to}: ${error.message}`;
      throw error;
    }
  },
};

export default mailService;
