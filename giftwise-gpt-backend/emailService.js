import { Resend } from 'resend';

export async function sendEmail({ to, subject, html }) {
  // Initialize Resend here, not at the top level!
  const resend = new Resend(process.env.RESEND_API_KEY);

  try {
    const { data, error } = await resend.emails.send({
      from: 'GiftWise SG <noreply@giftwisesg.com>',
      to,
      subject,
      html,
    });
    if (error) {
      console.error('Resend error:', error);
      throw new Error(error.message || 'Failed to send email');
    }
    return data;
  } catch (err) {
    console.error('Email send error:', err);
    throw err;
  }
}
