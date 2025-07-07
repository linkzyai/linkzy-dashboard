import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
}

// Resend API configuration
const RESEND_API_KEY = 're_Z2VQjCsS_9t2uN61rLbR4G2RQRRwMXpEt';

interface VerificationEmailRequest {
  email: string;
  verificationToken: string;
  type: 'signup' | 'recovery' | 'email_change';
}

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const { email, verificationToken, type }: VerificationEmailRequest = await req.json();

    // Validate required fields
    if (!email || !verificationToken || !type) {
      return new Response(
        JSON.stringify({ error: "Email, verification token, and type are required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log(`📧 Sending ${type} verification email via Resend to: ${email}`);

    // Create verification URL
    const verificationUrl = `https://linkzy.ai/verify-email?token=${verificationToken}&type=${type}`;

    // Different email content based on type
    let subject = '';
    let mainHeading = '';
    let description = '';
    let buttonText = '';

    switch (type) {
      case 'signup':
        subject = '🎉 Welcome to Linkzy - Please Verify Your Email';
        mainHeading = '📧 Verify Your Email Address';
        description = 'Welcome to Linkzy! Please verify your email address to complete your account setup and unlock all features.';
        buttonText = '✅ Verify Email Address';
        break;
      case 'recovery':
        subject = '🔐 Reset Your Linkzy Password';
        mainHeading = '🔐 Reset Your Password';
        description = 'You requested a password reset for your Linkzy account. Click the button below to set a new password.';
        buttonText = '🔐 Reset Password';
        break;
      case 'email_change':
        subject = '📧 Confirm Your New Email Address';
        mainHeading = '📧 Confirm Email Change';
        description = 'You requested to change your email address. Please verify your new email address to complete the change.';
        buttonText = '✅ Confirm New Email';
        break;
      default:
        subject = '📧 Verify Your Email - Linkzy';
        mainHeading = '📧 Email Verification';
        description = 'Please verify your email address to continue using Linkzy.';
        buttonText = '✅ Verify Email';
    }

    // Create clean verification email template
    const emailContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>${subject}</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 0; background: #f8fafc; }
        .container { background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1); margin: 20px; }
        .header { background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); color: white; padding: 40px 30px; text-align: center; }
        .header h1 { margin: 0; font-size: 28px; font-weight: 700; }
        .content { padding: 40px 30px; text-align: center; }
        .verify-section { background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%); border: 2px solid #3b82f6; border-radius: 12px; padding: 30px; margin: 30px 0; }
        .verify-button { background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: white; padding: 16px 32px; text-decoration: none; border-radius: 10px; display: inline-block; font-weight: 600; margin: 20px 0; font-size: 16px; box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3); }
        .footer { text-align: center; padding: 30px; color: #64748b; font-size: 14px; background: #f1f5f9; }
        .security-notice { background: #fef2f2; border: 2px solid #fecaca; border-radius: 10px; padding: 20px; margin: 25px 0; }
        @media (max-width: 600px) {
          .container { margin: 10px; }
          .content { padding: 20px; }
          .header { padding: 30px 20px; }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>${mainHeading}</h1>
        </div>
        
        <div class="content">
            <div class="verify-section">
                <h2 style="color: #3b82f6; margin-top: 0; font-size: 24px;">${mainHeading}</h2>
                <p style="font-size: 16px; margin-bottom: 20px;">${description}</p>
                <p style="margin-bottom: 25px;">Click the button below to continue:</p>
                <a href="${verificationUrl}" class="verify-button">
                    ${buttonText}
                </a>
                <p style="font-size: 12px; color: #64748b; margin-top: 20px;">
                    If the button doesn't work, copy and paste this link into your browser:<br>
                    <span style="word-break: break-all; color: #3b82f6;">${verificationUrl}</span>
                </p>
            </div>

            ${type === 'signup' ? `
            <div style="margin: 30px 0;">
                <h3 style="color: #1e293b;">🚀 What's Next?</h3>
                <ul style="text-align: left; max-width: 400px; margin: 0 auto; color: #64748b;">
                    <li>Access your full dashboard</li>
                    <li>Submit backlink requests</li>
                    <li>Track your SEO performance</li>
                    <li>Use all premium features</li>
                </ul>
            </div>
            ` : ''}

            <div class="security-notice">
                <p style="margin: 0; color: #dc2626;"><strong>🔒 Security Notice:</strong></p>
                <p style="margin: 5px 0 0 0; color: #dc2626; font-size: 14px;">
                    If you didn't request this ${type === 'signup' ? 'account creation' : type === 'recovery' ? 'password reset' : 'email change'}, please ignore this email or contact our support team.
                </p>
            </div>
        </div>
        
        <div class="footer">
            <p><strong>Linkzy Team</strong></p>
            <p>Building better backlinks, one link at a time.</p>
            <p style="margin-top: 15px; font-size: 12px;">
                🔗 <a href="https://linkzy.ai" style="color: #3b82f6;">linkzy.ai</a> | 
                📧 <a href="mailto:hello@linkzy.ai" style="color: #3b82f6;">hello@linkzy.ai</a>
            </p>
        </div>
    </div>
</body>
</html>
    `.trim();

    // Send email using Resend API
    console.log('🚀 Sending verification email via Resend API...');
    
    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Linkzy Team <hello@linkzy.ai>',
        to: [email],
        subject: subject,
        html: emailContent,
        tags: [
          { name: 'category', value: 'verification' },
          { name: 'type', value: type },
          { name: 'priority', value: 'high' }
        ]
      })
    });

    if (!resendResponse.ok) {
      const errorText = await resendResponse.text();
      console.error('❌ Resend API error:', errorText);
      throw new Error(`Resend API error: ${resendResponse.status} - ${errorText}`);
    }

    const resendResult = await resendResponse.json();
    console.log('✅ Verification email sent successfully via Resend:', resendResult.id);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `${type} verification email sent successfully via Resend`,
        recipient: email,
        emailId: resendResult.id,
        verificationUrl: verificationUrl
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );

  } catch (error) {
    console.error('❌ Error sending verification email via Resend:', error);
    
    return new Response(
      JSON.stringify({ 
        error: "Failed to send verification email via Resend",
        details: error.message 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});