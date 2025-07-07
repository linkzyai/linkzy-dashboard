import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
}

// Resend API configuration
const RESEND_API_KEY = 're_Z2VQjCsS_9t2uN61rLbR4G2RQRRwMXpEt';

interface PasswordResetRequest {
  email: string;
  resetUrl: string;
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
    const { email, resetUrl }: PasswordResetRequest = await req.json();

    // Validate required fields
    if (!email || !resetUrl) {
      return new Response(
        JSON.stringify({ error: "Email and reset URL are required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log(`📧 Sending password reset email via Resend to: ${email}`);

    // Create professional password reset email content
    const emailContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>🔐 Reset Your Linkzy Password</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 0; background: #f8fafc; }
        .container { background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1); margin: 20px; }
        .header { background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: white; padding: 40px 30px; text-align: center; }
        .header h1 { margin: 0; font-size: 28px; font-weight: 700; }
        .header p { margin: 10px 0 0 0; font-size: 16px; opacity: 0.95; }
        .content { padding: 40px 30px; text-align: center; }
        .reset-section { background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%); border: 2px solid #3b82f6; border-radius: 12px; padding: 30px; margin: 30px 0; }
        .reset-button { background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: white; padding: 16px 32px; text-decoration: none; border-radius: 10px; display: inline-block; font-weight: 600; margin: 20px 0; font-size: 16px; box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3); transition: all 0.3s ease; }
        .reset-button:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(59, 130, 246, 0.4); }
        .footer { text-align: center; padding: 30px; color: #64748b; font-size: 14px; background: #f1f5f9; }
        .security-notice { background: #fef2f2; border: 2px solid #fecaca; border-radius: 10px; padding: 20px; margin: 25px 0; }
        .warning-icon { color: #dc2626; font-size: 20px; margin-right: 12px; }
        .highlight { background: #fef3c7; padding: 4px 8px; border-radius: 6px; font-weight: 600; color: #92400e; }
        @media (max-width: 600px) {
          .container { margin: 10px; }
          .content { padding: 20px; }
          .header { padding: 30px 20px; }
          .header h1 { font-size: 24px; }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🔐 Reset Your Password</h1>
            <p>We received a request to reset your Linkzy password</p>
        </div>
        
        <div class="content">
            <div class="reset-section">
                <h2 style="color: #3b82f6; margin-top: 0; font-size: 24px;">🔒 Password Reset Request</h2>
                <p style="font-size: 16px; margin-bottom: 20px;">
                    Someone (hopefully you!) requested a password reset for your Linkzy account with this email address.
                </p>
                <p style="margin-bottom: 25px;">Click the button below to set a new password:</p>
                <a href="${resetUrl}" class="reset-button">
                    🔐 Reset My Password
                </a>
                <p style="font-size: 12px; color: #64748b; margin-top: 20px;">
                    If the button doesn't work, copy and paste this link into your browser:<br>
                    <span style="word-break: break-all; color: #3b82f6;">${resetUrl}</span>
                </p>
            </div>

            <div style="background: #f0f9ff; border-radius: 10px; padding: 25px; margin: 25px 0; border: 2px solid #3b82f6;">
                <h3 style="color: #1e40af; margin-top: 0;">⏰ Important Details</h3>
                <ul style="text-align: left; max-width: 400px; margin: 0 auto; color: #1e40af;">
                    <li><strong>Link expires in 24 hours</strong> for security</li>
                    <li><strong>One-time use only</strong> - link becomes invalid after use</li>
                    <li><strong>Secure process</strong> - your current password remains active until reset</li>
                    <li><strong>Account access</strong> - all devices will require new password</li>
                </ul>
            </div>

            <div class="security-notice">
                <div style="display: flex; align-items: flex-start; text-align: left;">
                    <span class="warning-icon">🚨</span>
                    <div>
                        <p style="margin: 0; color: #dc2626; font-weight: 600;">Security Alert</p>
                        <p style="margin: 5px 0 0 0; color: #dc2626; font-size: 14px;">
                            <strong>If you didn't request this password reset:</strong>
                        </p>
                        <ul style="margin: 10px 0 0 0; color: #dc2626; font-size: 14px;">
                            <li>Your account is still secure - no changes have been made</li>
                            <li>Simply ignore this email and delete it</li>
                            <li>Consider enabling two-factor authentication</li>
                            <li>Contact our support team if you're concerned: hello@linkzy.ai</li>
                        </ul>
                    </div>
                </div>
            </div>

            <div style="background: #f8fafc; border-radius: 10px; padding: 20px; margin: 25px 0; border: 1px solid #e2e8f0;">
                <h4 style="color: #1e293b; margin-top: 0;">🛡️ After Resetting Your Password</h4>
                <ul style="text-align: left; color: #64748b; font-size: 14px; margin: 0;">
                    <li>You'll be automatically signed out of all devices</li>
                    <li>Use your new password to sign in to your dashboard</li>
                    <li>Your API keys and account data remain unchanged</li>
                    <li>Consider updating any saved passwords in your browser</li>
                </ul>
            </div>
        </div>
        
        <div class="footer">
            <p><strong>Linkzy Security Team</strong></p>
            <p>Keeping your account safe and secure</p>
            <p style="margin-top: 15px; font-size: 12px;">
                🔗 <a href="https://linkzy.ai" style="color: #3b82f6;">linkzy.ai</a> | 
                🛡️ <a href="https://linkzy.ai/security" style="color: #3b82f6;">Security Center</a> | 
                📧 <a href="mailto:hello@linkzy.ai" style="color: #3b82f6;">hello@linkzy.ai</a>
            </p>
            <p style="font-size: 11px; color: #94a3b8; margin-top: 15px;">
                This email was sent to ${email} because a password reset was requested for your Linkzy account.
                <br>If you didn't request this, please contact our support team immediately.
            </p>
        </div>
    </div>
</body>
</html>
    `.trim();

    // Send email using Resend API
    console.log('🚀 Sending password reset email via Resend API...');
    
    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Linkzy Security <hello@linkzy.ai>',
        to: [email],
        subject: '🔐 Reset Your Linkzy Password - Action Required',
        html: emailContent,
        tags: [
          { name: 'category', value: 'password_reset' },
          { name: 'priority', value: 'high' },
          { name: 'security', value: 'critical' }
        ]
      })
    });

    if (!resendResponse.ok) {
      const errorText = await resendResponse.text();
      console.error('❌ Resend API error:', errorText);
      throw new Error(`Resend API error: ${resendResponse.status} - ${errorText}`);
    }

    const resendResult = await resendResponse.json();
    console.log('✅ Password reset email sent successfully via Resend:', resendResult.id);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Password reset email sent successfully via Resend",
        recipient: email,
        emailId: resendResult.id,
        resetUrl: resetUrl,
        expiresIn: "24 hours"
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );

  } catch (error) {
    console.error('❌ Error sending password reset email via Resend:', error);
    
    return new Response(
      JSON.stringify({ 
        error: "Failed to send password reset email via Resend",
        details: error.message 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});