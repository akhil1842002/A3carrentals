const nodemailer = require('nodemailer');

/**
 * Creates a configured Nodemailer transporter using environment variables.
 */
function getEmailTransporter() {
  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!user || !pass) {
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass }
  });
}

/**
 * Sends a real 6-digit OTP email with a branded HTML template.
 */
async function sendEmailOtp({ toEmail, otp, name = 'Customer' }) {
  const transporter = getEmailTransporter();
  
  if (!transporter) {
    console.log(`\n======================================================`);
    console.log(`[CARBOOK EMAIL OTP] Real email sending requires SMTP_USER and SMTP_PASS in backend/.env`);
    console.log(`Recipient: ${toEmail} | Verification Code: ${otp}`);
    console.log(`======================================================\n`);
    return { sent: false, reason: 'smtp_not_configured' };
  }

  const sender = process.env.SMTP_FROM || `"CarBook Security" <${process.env.SMTP_USER}>`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 20px; color: #1e293b; }
        .card { max-width: 500px; margin: 0 auto; background: #ffffff; border-radius: 16px; padding: 32px; border: 1px solid #e2e8f0; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
        .logo { font-size: 22px; font-weight: 800; color: #f96d00; text-align: center; margin-bottom: 24px; }
        .otp-box { background: #fff7ed; border: 2px dashed #f97316; border-radius: 12px; padding: 18px; text-align: center; margin: 24px 0; }
        .otp-code { font-size: 34px; font-weight: 800; letter-spacing: 8px; color: #c2410c; }
        .footer { font-size: 12px; color: #94a3b8; text-align: center; margin-top: 24px; line-height: 1.5; }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="logo">🚗 CarBook Fleet</div>
        <h2 style="margin: 0 0 10px; font-size: 20px; color: #0f172a;">Password Reset Verification</h2>
        <p style="font-size: 14px; color: #475569; line-height: 1.5;">
          Hello <strong>${name}</strong>,<br>
          We received a request to reset your CarBook account password. Use the single-use verification code below:
        </p>
        <div class="otp-box">
          <div class="otp-code">${otp}</div>
          <div style="font-size: 12px; color: #ea580c; margin-top: 6px; font-weight: 600;">Valid for 10 minutes</div>
        </div>
        <p style="font-size: 13px; color: #64748b; line-height: 1.5;">
          If you did not request this password reset, please ignore this email. Your account remains secure.
        </p>
        <div class="footer">
          &copy; ${new Date().getFullYear()} CarBook Car Rental & Services. All rights reserved.
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    const info = await transporter.sendMail({
      from: sender,
      to: toEmail,
      subject: `CarBook Security: ${otp} is your verification code`,
      text: `Your CarBook verification code is ${otp}. Valid for 10 minutes.`,
      html
    });
    console.log(`[CARBOOK EMAIL OTP] Dispatched successfully to ${toEmail}. Message ID: ${info.messageId}`);
    return { sent: true, messageId: info.messageId };
  } catch (error) {
    console.error(`[CARBOOK EMAIL OTP ERROR] Failed to send email:`, error.message);
    return { sent: false, error: error.message };
  }
}

/**
 * Sends a real 6-digit OTP SMS via Fast2SMS (India) or Twilio.
 */
async function sendSmsOtp({ phoneNumber, otp }) {
  const cleanPhone = (phoneNumber || '').replace(/\D/g, '');
  const tenDigitPhone = cleanPhone.slice(-10);

  if (!tenDigitPhone || tenDigitPhone.length !== 10) {
    return { sent: false, reason: 'invalid_phone_number' };
  }

  // 1. Fast2SMS Integration (Fastest & standard Indian SMS gateway)
  const fast2SmsKey = process.env.FAST2SMS_API_KEY;
  if (fast2SmsKey) {
    try {
      const url = `https://www.fast2sms.com/dev/bulkV2?authorization=${encodeURIComponent(fast2SmsKey)}&route=otp&variables_values=${encodeURIComponent(otp)}&numbers=${encodeURIComponent(tenDigitPhone)}`;
      const response = await fetch(url, { method: 'GET' });
      const data = await response.json();
      if (data.return) {
        console.log(`[CARBOOK SMS OTP] Dispatched via Fast2SMS to +91 ${tenDigitPhone}`);
        return { sent: true, provider: 'fast2sms', data };
      } else {
        console.error(`[CARBOOK SMS OTP] Fast2SMS error:`, data.message);
        return { sent: false, error: data.message };
      }
    } catch (err) {
      console.error(`[CARBOOK SMS OTP] Fast2SMS network error:`, err.message);
      return { sent: false, error: err.message };
    }
  }

  // 2. Twilio SMS Integration (Standard international)
  const twilioSid = process.env.TWILIO_ACCOUNT_SID;
  const twilioAuth = process.env.TWILIO_AUTH_TOKEN;
  const twilioFrom = process.env.TWILIO_PHONE_NUMBER;
  if (twilioSid && twilioAuth && twilioFrom) {
    try {
      const authHeader = 'Basic ' + Buffer.from(`${twilioSid}:${twilioAuth}`).toString('base64');
      const params = new URLSearchParams({
        To: `+91${tenDigitPhone}`,
        From: twilioFrom,
        Body: `CarBook: Your verification code is ${otp}. Valid for 10 minutes. Do not share this code.`
      });

      const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`, {
        method: 'POST',
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: params.toString()
      });

      const data = await response.json();
      if (data.sid) {
        console.log(`[CARBOOK SMS OTP] Dispatched via Twilio to +91 ${tenDigitPhone}. SID: ${data.sid}`);
        return { sent: true, provider: 'twilio', sid: data.sid };
      } else {
        console.error(`[CARBOOK SMS OTP] Twilio error:`, data.message);
        return { sent: false, error: data.message };
      }
    } catch (err) {
      console.error(`[CARBOOK SMS OTP] Twilio network error:`, err.message);
      return { sent: false, error: err.message };
    }
  }

  // Fallback log when no SMS API key is configured in .env yet
  console.log(`\n======================================================`);
  console.log(`[CARBOOK SMS OTP DISPATCHER]`);
  console.log(`Target Mobile: +91 ${tenDigitPhone}`);
  console.log(`Verification Code (OTP): ${otp}`);
  console.log(`NOTE: To send real SMS to phones, add FAST2SMS_API_KEY in backend/.env`);
  console.log(`======================================================\n`);

  return { sent: false, reason: 'sms_gateway_not_configured' };
}

module.exports = {
  sendEmailOtp,
  sendSmsOtp
};
