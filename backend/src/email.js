import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'mail.agentmail.io',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER || 'clientdrop-aa731675@ctomail.io',
    pass: process.env.SMTP_PASS || '',
  },
});

export async function sendWelcomeEmail(toEmail, userName) {
  try {
    await transporter.sendMail({
      from: process.env.FROM_EMAIL || 'ClientDrop <clientdrop-aa731675@ctomail.io>',
      to: toEmail,
      subject: 'Welcome to ClientDrop 🚀',
      html: `<div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:32px;">
<h2>Welcome to ClientDrop, ${userName}! 🎉</h2>
<p>Thanks for signing up! Create your first client portal and share the link to get started.</p>
<a href="https://clientdrop.app/dashboard" style="display:inline-block;background:#2563EB;color:white;padding:14px 32px;border-radius:8px;text-decoration:none;margin-top:16px;">Create Your First Portal →</a>
</div>`,
    });
    return { success: true };
  } catch (err) {
    console.error('Welcome email failed:', err.message);
    return { success: false, error: err.message };
  }
}