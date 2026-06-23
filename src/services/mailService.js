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

const buildInvitationEmail = ({ portalName, inviteCode }) => {
  const loginUrl = `${FRONTEND_URL}/login?invite=${encodeURIComponent(inviteCode)}`;

  return {
    subject: `Invitacion a ${portalName}`,
    text: [
      `Has recibido una invitacion para unirte al portal "${portalName}".`,
      `Codigo de invitacion: ${inviteCode}`,
      `Accede aqui para iniciar sesion: ${loginUrl}`,
      'Despues de iniciar sesion podras aceptar o rechazar la invitacion desde la pantalla de unirse al portal.',
    ].join('\n\n'),
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #431407;">
        <h2 style="margin-bottom: 12px;">Invitacion a ${portalName}</h2>
        <p>Has recibido una invitacion para unirte al portal <strong>${portalName}</strong>.</p>
        <p style="margin: 18px 0;">
          <span style="display: inline-block; padding: 10px 16px; border-radius: 10px; background: #fff7ed; border: 1px solid #fdba74; font-size: 18px; letter-spacing: 2px;">
            ${inviteCode}
          </span>
        </p>
        <p>
          <a href="${loginUrl}" style="display: inline-block; padding: 12px 18px; border-radius: 10px; background: linear-gradient(90deg, #f97316, #ef4444); color: #ffffff; text-decoration: none; font-weight: 700;">
            Iniciar sesion y gestionar invitacion
          </a>
        </p>
        <p>Despues de iniciar sesion podras aceptar o rechazar la invitacion desde la pantalla de unirse al portal.</p>
      </div>
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
