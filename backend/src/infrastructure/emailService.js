import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

let transporter;

// Configurar transporter (simulación por defecto)
export function createTransporter() {
  // SIMULACIÓN: console.log en lugar de email real hasta config .env
  transporter = {
    sendMail: async (options) => {
      console.log('📧 SIMULANDO ENVÍO DE EMAIL:');
      console.log('Para:', options.to);
      console.log('Asunto:', options.subject);
      console.log('Link reset:', options.html.match(/http[^<]+/)[0] || 'No link');
      console.log('---');
      return { messageId: 'simulated-123' };
    }
  };
  
  // REAL: Descomentar cuando .env listo
  /*
  transporter = nodemailer.createTransporter({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
  */
  
  return transporter;
}

export async function sendResetPasswordEmail(email, token, userNombre) {
  if (!transporter) createTransporter();
  
const resetUrl = `http://localhost:5000/perfil.html?resetToken=${token}`;
  
  const mailOptions = {
    from: process.env.EMAIL_USER || '"Plataforma Verde" <noreply@verde.com>',
    to: email,
    subject: '🔒 Recupera tu contraseña - Plataforma Sostenible',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #059669;">Hola ${userNombre || 'usuario'},</h2>
        <p>Haz clic en el siguiente enlace para restablecer tu contraseña:</p>
        <a href="${resetUrl}" style="background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Restablecer Contraseña</a>
        <p><small>El enlace expira en 1 hora. Si no solicitaste esto, ignora este email.</small></p>
        <hr style="margin: 30px 0;">
        <p style="color: #6b7280;">🌱 Plataforma de Productos Sostenibles</p>
      </div>
    `
  };
  
  try {
    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Error enviando email:', error);
    return false;
  }
}

