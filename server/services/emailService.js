import sgMail from '@sendgrid/mail';
import nodemailer from 'nodemailer';

// Initialize SendGrid if API key is available
const SENDGRID_ENABLED = !!process.env.SENDGRID_API_KEY;
if (SENDGRID_ENABLED) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

// Fallback to Nodemailer for development/testing
let nodemailerTransporter = null;

const FROM_EMAIL = process.env.EMAIL_FROM || 'noreply@nexprompt.site';
const FROM_NAME = process.env.EMAIL_FROM_NAME || 'NexPrompt';
// CLIENT_URL may be a comma-separated list (for CORS); use only the first entry for links
const CLIENT_URL = (process.env.CLIENT_URL || 'http://localhost:5173').split(',')[0].trim();

/**
 * Initialize Nodemailer transporter (fallback or SMTP mode)
 */
async function initNodemailer() {
  if (nodemailerTransporter) return nodemailerTransporter;

  // If SMTP credentials provided, use them
  if (process.env.SMTP_HOST && process.env.SMTP_USER) {
    nodemailerTransporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    });
    console.log('✓ Email service: SMTP configured');
  } else {
    // Use Ethereal for testing (creates temporary test account)
    const testAccount = await nodemailer.createTestAccount();
    nodemailerTransporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
    console.log('⚠️  Email service: Using Ethereal test account (emails not delivered)');
    console.log(`   Preview emails at: https://ethereal.email`);
  }

  return nodemailerTransporter;
}

/**
 * Core email sending function
 */
export async function sendEmail({ to, subject, html, text }) {
  // Skip if no email service configured
  if (!SENDGRID_ENABLED && !process.env.SMTP_HOST) {
    console.log(`📧 [DEV MODE] Email would be sent to ${to}: ${subject}`);
    return { success: true, mode: 'disabled' };
  }

  try {
    // Try SendGrid first
    if (SENDGRID_ENABLED) {
      await sgMail.send({
        to,
        from: { email: FROM_EMAIL, name: FROM_NAME },
        subject,
        html,
        text: text || stripHtml(html),
      });
      console.log(`✓ Email sent via SendGrid to ${to}: ${subject}`);
      return { success: true, provider: 'sendgrid' };
    }

    // Fallback to Nodemailer
    const transporter = await initNodemailer();
    const info = await transporter.sendMail({
      from: `"${FROM_NAME}" <${FROM_EMAIL}>`,
      to,
      subject,
      html,
      text: text || stripHtml(html),
    });

    console.log(`✓ Email sent via Nodemailer to ${to}: ${subject}`);
    if (info.messageId && !process.env.SMTP_HOST) {
      console.log(`   Preview: ${nodemailer.getTestMessageUrl(info)}`);
    }

    return { success: true, provider: 'nodemailer', messageId: info.messageId };
  } catch (error) {
    console.error('❌ Email send error:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Strip HTML tags for plain text version
 */
function stripHtml(html) {
  return html
    .replace(/<style[^>]*>.*?<\/style>/gi, '')
    .replace(/<script[^>]*>.*?<\/script>/gi, '')
    .replace(/<[^>]+>/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Base email template wrapper
 */
function emailTemplate(content) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4; }
    .container { max-width: 600px; margin: 20px auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; padding: 30px 20px; text-align: center; }
    .header h1 { margin: 0; font-size: 28px; font-weight: 600; }
    .content { padding: 30px 20px; }
    .button { display: inline-block; padding: 12px 30px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff !important; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 20px 0; }
    .footer { background: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #6c757d; border-top: 1px solid #e9ecef; }
    .footer a { color: #667eea; text-decoration: none; }
    h2 { color: #667eea; margin-top: 0; }
    .info-box { background: #f8f9fa; border-left: 4px solid #667eea; padding: 15px; margin: 20px 0; border-radius: 4px; }
    .info-box strong { color: #333; }
    ul { padding-left: 20px; }
    li { margin: 8px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>✨ NexPrompt</h1>
    </div>
    <div class="content">
      ${content}
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} NexPrompt. All rights reserved.</p>
      <p>
        <a href="${CLIENT_URL}/legal/terms">Terms of Service</a> • 
        <a href="${CLIENT_URL}/legal/privacy">Privacy Policy</a>
      </p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Welcome email for new users
 */
export async function sendWelcomeEmail(user, credits = 0) {
  const content = `
    <h2>Welcome to NexPrompt, ${user.name}! 🎉</h2>
    <p>Your account has been successfully created. We're excited to have you on board!</p>
    
    <div class="info-box">
      <strong>🎁 Your account has been credited with ${credits} credits to get started!</strong>
    </div>
    
    <p>With NexPrompt, you can:</p>
    <ul>
      <li>Generate optimized AI prompts for any use case</li>
      <li>Access pre-built templates for common scenarios</li>
      <li>Save and organize your favorite prompts</li>
      <li>Track your prompt history and conversations</li>
    </ul>
    
    <p style="text-align: center;">
      <a href="${CLIENT_URL}/dashboard" class="button">Start Creating Prompts</a>
    </p>
    
    <p>Need help getting started? Check out our <a href="${CLIENT_URL}/templates">template library</a> for inspiration.</p>
    
    <p>Happy prompting!<br>The NexPrompt Team</p>
  `;

  return sendEmail({
    to: user.email,
    subject: 'Welcome to NexPrompt! 🎉',
    html: emailTemplate(content),
  });
}

/**
 * Password reset email
 */
export async function sendPasswordResetEmail(user, resetToken) {
  const resetUrl = `${CLIENT_URL}/reset-password?token=${resetToken}`;
  
  const content = `
    <h2>Password Reset Request</h2>
    <p>Hi ${user.name},</p>
    <p>We received a request to reset your password for your NexPrompt account.</p>
    
    <p style="text-align: center;">
      <a href="${resetUrl}" class="button">Reset Your Password</a>
    </p>
    
    <div class="info-box">
      <strong>⏰ This link expires in 1 hour</strong><br>
      For security reasons, this password reset link will only work once.
    </div>
    
    <p>If the button doesn't work, copy and paste this link into your browser:</p>
    <p style="word-break: break-all; color: #667eea;">${resetUrl}</p>
    
    <p><strong>Didn't request this?</strong><br>
    If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.</p>
    
    <p>Best regards,<br>The NexPrompt Team</p>
  `;

  return sendEmail({
    to: user.email,
    subject: 'Reset Your NexPrompt Password',
    html: emailTemplate(content),
  });
}

/**
 * Password reset confirmation email
 */
export async function sendPasswordResetConfirmation(user) {
  const content = `
    <h2>Password Changed Successfully ✓</h2>
    <p>Hi ${user.name},</p>
    <p>This is a confirmation that your NexPrompt account password was successfully changed.</p>
    
    <div class="info-box">
      <strong>Changed on:</strong> ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST
    </div>
    
    <p><strong>Didn't make this change?</strong><br>
    If you didn't change your password, please contact our support team immediately at <a href="mailto:support@nexprompt.site">support@nexprompt.site</a></p>
    
    <p style="text-align: center;">
      <a href="${CLIENT_URL}/login" class="button">Login to Your Account</a>
    </p>
    
    <p>Best regards,<br>The NexPrompt Team</p>
  `;

  return sendEmail({
    to: user.email,
    subject: 'Your Password Has Been Changed',
    html: emailTemplate(content),
  });
}

/**
 * Credit pack purchase confirmation
 */
export async function sendPurchaseConfirmation(user, payment, pack) {
  const totalCredits = pack.credits + pack.bonusCredits;
  const amountInRupees = (payment.amount / 100).toFixed(2);
  
  const content = `
    <h2>Purchase Confirmation 🎉</h2>
    <p>Hi ${user.name},</p>
    <p>Thank you for your purchase! Your credits have been added to your account.</p>
    
    <div class="info-box">
      <h3 style="margin-top: 0;">Order Details</h3>
      <ul style="list-style: none; padding: 0;">
        <li><strong>Pack:</strong> ${pack.name}</li>
        <li><strong>Base Credits:</strong> ${pack.credits}</li>
        <li><strong>Bonus Credits:</strong> ${pack.bonusCredits}</li>
        <li><strong>Total Credits:</strong> ${totalCredits}</li>
        <li style="margin-top: 10px; padding-top: 10px; border-top: 1px solid #dee2e6;">
          <strong>Amount Paid:</strong> ₹${amountInRupees}
        </li>
        <li><strong>Order ID:</strong> ${payment.razorpayOrderId}</li>
        <li><strong>Payment ID:</strong> ${payment.razorpayPaymentId || 'Processing'}</li>
        <li><strong>Date:</strong> ${new Date(payment.createdAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST</li>
      </ul>
    </div>
    
    <p style="text-align: center;">
      <a href="${CLIENT_URL}/dashboard" class="button">Start Creating Prompts</a>
    </p>
    
    <p><small>This email serves as your receipt. Please keep it for your records.</small></p>
    
    <p>Thank you for choosing NexPrompt!<br>The NexPrompt Team</p>
  `;

  return sendEmail({
    to: user.email,
    subject: `Purchase Confirmation - ${pack.name}`,
    html: emailTemplate(content),
  });
}

/**
 * Payment success notification (webhook)
 */
export async function sendPaymentSuccessEmail(user, payment, pack) {
  const totalCredits = pack.credits + pack.bonusCredits;
  const amountInRupees = (payment.amount / 100).toFixed(2);
  
  const content = `
    <h2>Payment Successful! ✓</h2>
    <p>Hi ${user.name},</p>
    <p>Great news! Your payment has been successfully processed and your credits are now available.</p>
    
    <div class="info-box">
      <strong>💳 Payment Details</strong><br>
      Amount: ₹${amountInRupees}<br>
      Credits Added: ${totalCredits}<br>
      Payment ID: ${payment.razorpayPaymentId}
    </div>
    
    <p style="text-align: center;">
      <a href="${CLIENT_URL}/dashboard" class="button">View Your Credits</a>
    </p>
    
    <p>Happy prompting!<br>The NexPrompt Team</p>
  `;

  return sendEmail({
    to: user.email,
    subject: 'Payment Successful - Credits Added',
    html: emailTemplate(content),
  });
}

/**
 * Payment failure notification
 */
export async function sendPaymentFailureEmail(user, payment, reason = 'Unknown error') {
  const amountInRupees = (payment.amount / 100).toFixed(2);
  
  const content = `
    <h2>Payment Failed</h2>
    <p>Hi ${user.name},</p>
    <p>We're sorry, but your recent payment could not be processed.</p>
    
    <div class="info-box">
      <strong>❌ Payment Details</strong><br>
      Amount: ₹${amountInRupees}<br>
      Order ID: ${payment.razorpayOrderId}<br>
      Reason: ${reason}
    </div>
    
    <p><strong>What you can do:</strong></p>
    <ul>
      <li>Check if your card has sufficient balance</li>
      <li>Verify your card details are correct</li>
      <li>Try a different payment method</li>
      <li>Contact your bank if the issue persists</li>
    </ul>
    
    <p style="text-align: center;">
      <a href="${CLIENT_URL}/credits" class="button">Try Again</a>
    </p>
    
    <p>If you continue to experience issues, please contact us at <a href="mailto:support@nexprompt.site">support@nexprompt.site</a></p>
    
    <p>Best regards,<br>The NexPrompt Team</p>
  `;

  return sendEmail({
    to: user.email,
    subject: 'Payment Failed - Action Required',
    html: emailTemplate(content),
  });
}

/**
 * Low credits warning email
 */
export async function sendLowCreditsWarning(user, remainingCredits) {
  const content = `
    <h2>Low Credits Warning ⚠️</h2>
    <p>Hi ${user.name},</p>
    <p>Your NexPrompt account is running low on credits.</p>
    
    <div class="info-box">
      <strong>Current Balance:</strong> ${remainingCredits} credits remaining
    </div>
    
    <p>To continue creating amazing prompts without interruption, consider purchasing more credits.</p>
    
    <p style="text-align: center;">
      <a href="${CLIENT_URL}/credits" class="button">Buy More Credits</a>
    </p>
    
    <p>Thank you for using NexPrompt!<br>The NexPrompt Team</p>
  `;

  return sendEmail({
    to: user.email,
    subject: 'Low Credits Warning - NexPrompt',
    html: emailTemplate(content),
  });
}

/**
 * Email verification (for future implementation)
 */
export async function sendEmailVerification(user, verificationToken) {
  const verifyUrl = `${CLIENT_URL}/verify-email?token=${verificationToken}`;
  
  const content = `
    <h2>Verify Your Email Address</h2>
    <p>Hi ${user.name},</p>
    <p>Please verify your email address to complete your NexPrompt registration.</p>
    
    <p style="text-align: center;">
      <a href="${verifyUrl}" class="button">Verify Email Address</a>
    </p>
    
    <p>If the button doesn't work, copy and paste this link into your browser:</p>
    <p style="word-break: break-all; color: #667eea;">${verifyUrl}</p>
    
    <div class="info-box">
      <strong>⏰ This link expires in 24 hours</strong>
    </div>
    
    <p>If you didn't create this account, you can safely ignore this email.</p>
    
    <p>Best regards,<br>The NexPrompt Team</p>
  `;

  return sendEmail({
    to: user.email,
    subject: 'Verify Your Email - NexPrompt',
    html: emailTemplate(content),
  });
}

// Log email service status on startup
if (SENDGRID_ENABLED) {
  console.log('✓ Email service: SendGrid enabled');
} else if (process.env.SMTP_HOST) {
  console.log('✓ Email service: SMTP configured');
} else {
  console.log('⚠️  Email service: Not configured (emails will be logged only)');
  console.log('   Set SENDGRID_API_KEY or SMTP credentials to enable email delivery');
}
