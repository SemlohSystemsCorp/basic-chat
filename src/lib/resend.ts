import { Resend } from 'resend';

export const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendVerificationCode(email: string, code: string) {
  await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL!,
    to: email,
    subject: `${code} is your Chatterbox verification code`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: 'Inter', -apple-system, sans-serif; background: #F6F9FC; margin: 0; padding: 40px 20px; }
            .container { max-width: 480px; margin: 0 auto; background: #FFFFFF; border-radius: 4px; border: 1px solid #E1E4E8; padding: 40px; }
            .logo { font-size: 24px; font-weight: 700; color: #0A2540; margin-bottom: 24px; }
            p { color: #425466; font-size: 14px; line-height: 1.6; margin: 0 0 16px; }
            .code { font-size: 36px; font-weight: 700; letter-spacing: 6px; color: #0A2540; text-align: center; padding: 24px 0; margin: 8px 0 24px; background: #F6F9FC; border-radius: 4px; border: 1px solid #E1E4E8; }
            .footer { margin-top: 32px; padding-top: 16px; border-top: 1px solid #E1E4E8; }
            .footer p { color: #8898AA; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="logo">Chatterbox</div>
            <p>Enter this code to verify your email address and activate your Chatterbox account.</p>
            <div class="code">${code}</div>
            <p>This code expires in 10 minutes.</p>
            <div class="footer">
              <p>If you didn&rsquo;t create a Chatterbox account, you can safely ignore this email.</p>
            </div>
          </div>
        </body>
      </html>
    `,
  });
}

export async function sendInviteEmail(email: string, boxName: string, inviterName: string, inviteCode: string) {
  const joinUrl = `${process.env.NEXT_PUBLIC_APP_URL}/onboarding?invite=${inviteCode}`;

  await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL!,
    to: email,
    subject: `You've been invited to ${boxName} on Chatterbox`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: 'Inter', -apple-system, sans-serif; background: #F6F9FC; margin: 0; padding: 40px 20px; }
            .container { max-width: 480px; margin: 0 auto; background: #FFFFFF; border-radius: 4px; border: 1px solid #E1E4E8; padding: 40px; }
            .logo { font-size: 24px; font-weight: 700; color: #0A2540; margin-bottom: 24px; }
            p { color: #425466; font-size: 14px; line-height: 1.6; margin: 0 0 16px; }
            .btn { display: inline-block; background: #635BFF; color: #FFFFFF !important; text-decoration: none; padding: 12px 32px; border-radius: 4px; font-size: 14px; font-weight: 600; }
            .box-name { font-weight: 600; color: #0A2540; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="logo">Chatterbox</div>
            <p><span class="box-name">${inviterName}</span> invited you to join <span class="box-name">${boxName}</span> on Chatterbox.</p>
            <p><a href="${joinUrl}" class="btn">Join ${boxName}</a></p>
            <p style="margin-top: 24px;">Or use this invite code: <strong>${inviteCode}</strong></p>
          </div>
        </body>
      </html>
    `,
  });
}
