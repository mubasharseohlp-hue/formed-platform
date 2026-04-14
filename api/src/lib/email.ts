import nodemailer from 'nodemailer';
import dotenv from "dotenv";
dotenv.config();

// SMTP client (primary - only use this)
let smtpTransporter: any = null;

if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
  smtpTransporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
  console.log('✅ SMTP configured and ready');
} else {
  console.log('⚠️ SMTP not configured. Email sending will fail.');
}

export const FROM = `${process.env.EMAIL_FROM_NAME ?? "FORMED"} <${process.env.EMAIL_FROM ?? "notifications@formed.fit"}>`;

// Main send function - SMTP only (no Resend fallback)
export async function sendEmail(to: string, subject: string, html: string): Promise<boolean> {
  console.log(`\n📧 SENDING EMAIL:`);
  console.log(`   To: ${to}`);
  console.log(`   Subject: ${subject}`);
  
  // Only use SMTP
  if (smtpTransporter) {
    try {
      const info = await smtpTransporter.sendMail({
        from: FROM,
        to,
        subject,
        html,
      });
      console.log(`✅ Email sent via SMTP to ${to}: ${subject}`);
      return true;
    } catch (smtpError: any) {
      console.error(`❌ SMTP failed for ${to}:`, smtpError.message);
      return false;
    }
  }

  console.error(`❌ SMTP not configured. Cannot send to ${to}`);
  return false;
}