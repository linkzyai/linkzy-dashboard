import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
}

// Resend API configuration
const RESEND_API_KEY = 're_Z2VQjCsS_9t2uN61rLbR4G2RQRRwMXpEt';

interface WelcomeEmailRequest {
  email: string;
  apiKey: string;
  website?: string;
  niche?: string;
  verificationToken?: string;
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
    const { email, apiKey, website, niche, verificationToken }: WelcomeEmailRequest = await req.json();

    // Validate required fields
    if (!email || !apiKey) {
      return new Response(
        JSON.stringify({ error: "Email and API key are required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log(`📧 Sending welcome email via Resend to: ${email}`);

    // Create verification URL
    const verificationUrl = verificationToken 
      ? `https://linkzy.ai/verify-email?token=${verificationToken}&type=signup`
      : `https://linkzy.ai/dashboard`;

    // Determine niche emoji and description
    const getNicheDisplay = (niche: string) => {
      const niches: Record<string, string> = {
        'technology': '🖥️ Technology & Software',
        'home-services': '🏠 Home Services & Contractors',
        'creative-arts': '🎨 Creative Services & Arts',
        'food-restaurants': '🍕 Food, Restaurants & Recipes',
        'health-wellness': '💊 Health & Wellness',
        'finance-business': '💰 Finance & Business',
        'travel-lifestyle': '✈️ Travel & Lifestyle',
        'education': '📚 Education & Learning',
        'ecommerce': '🛒 E-commerce & Retail',
        'automotive': '🚗 Automotive & Transportation',
        'real-estate': '🏡 Real Estate & Property',
        'sports-outdoors': '⚽ Sports & Outdoors',
        'beauty-fashion': '💄 Beauty & Fashion',
        'pets-animals': '🐕 Pets & Animals',
        'gaming-entertainment': '🎮 Gaming & Entertainment',
        'parenting-family': '👶 Parenting & Family',
        'diy-crafts': '🔨 DIY & Crafts',
        'legal-professional': '⚖️ Legal & Professional Services',
        'marketing-advertising': '📈 Marketing & Advertising',
        'news-media': '📰 News & Media',
        'spirituality-religion': '🙏 Spirituality & Religion',
        'green-sustainability': '🌱 Green Living & Sustainability',
        'self-improvement': '🚀 Self-Improvement & Productivity',
        'politics-advocacy': '🗳️ Politics & Advocacy',
        'local-community': '🏘️ Local & Community'
      };
      return niches[niche] || niche;
    };

    // Create comprehensive onboarding email content
    const emailContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>🎉 Welcome to Linkzy - Your Account is Ready!</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 0; background: #f8fafc; }
        .container { background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1); margin: 20px; }
        .header { background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); color: white; padding: 40px 30px; text-align: center; }
        .header h1 { margin: 0; font-size: 32px; font-weight: 700; }
        .header p { margin: 10px 0 0 0; font-size: 18px; opacity: 0.95; }
        .content { padding: 40px 30px; }
        .verify-section { background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%); border: 2px solid #3b82f6; border-radius: 12px; padding: 30px; text-align: center; margin: 30px 0; }
        .verify-button { background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: white; padding: 16px 32px; text-decoration: none; border-radius: 10px; display: inline-block; font-weight: 600; margin: 20px 0; font-size: 16px; box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3); transition: all 0.3s ease; }
        .verify-button:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(59, 130, 246, 0.4); }
        .step { background: #f8fafc; margin: 25px 0; padding: 25px; border-radius: 10px; border-left: 5px solid #f97316; }
        .step-number { background: #f97316; color: white; width: 36px; height: 36px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-weight: 700; margin-right: 20px; font-size: 16px; }
        .api-key { background: #1e293b; color: #22c55e; padding: 20px; border-radius: 10px; font-family: 'Monaco', 'Menlo', monospace; word-break: break-all; margin: 20px 0; font-size: 14px; border: 2px solid #22c55e; }
        .dashboard-button { background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); color: white; padding: 16px 32px; text-decoration: none; border-radius: 10px; display: inline-block; margin: 20px 0; font-weight: 600; font-size: 16px; box-shadow: 0 4px 12px rgba(249, 115, 22, 0.3); transition: all 0.3s ease; }
        .dashboard-button:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(249, 115, 22, 0.4); }
        .footer { text-align: center; padding: 30px; color: #64748b; font-size: 14px; background: #f1f5f9; }
        .highlight { background: #fef3c7; padding: 4px 8px; border-radius: 6px; font-weight: 600; color: #92400e; }
        .warning { background: #fef2f2; border: 2px solid #fecaca; border-radius: 10px; padding: 20px; margin: 25px 0; }
        .warning-icon { color: #dc2626; font-size: 20px; margin-right: 12px; }
        .feature-list { background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); border-radius: 10px; padding: 25px; margin: 25px 0; border: 2px solid #22c55e; }
        .feature-list h3 { color: #166534; margin-top: 0; font-size: 20px; }
        .feature-list ul { margin: 0; }
        .feature-list li { color: #166534; margin: 10px 0; font-weight: 500; }
        .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 15px; margin: 20px 0; }
        .stat-item { background: #f8fafc; padding: 15px; border-radius: 8px; text-align: center; border: 1px solid #e2e8f0; }
        .stat-number { font-size: 24px; font-weight: 700; color: #f97316; }
        .stat-label { font-size: 12px; color: #64748b; margin-top: 5px; }
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
            <h1>🎉 Welcome to Linkzy!</h1>
            <p>Your premium backlink platform is ready to boost your SEO</p>
        </div>
        
        <div class="content">
            ${verificationToken ? `
            <!-- Email Verification Section -->
            <div class="verify-section">
                <h2 style="color: #3b82f6; margin-top: 0; font-size: 24px;">📧 Verify Your Email Address</h2>
                <p style="font-size: 16px;"><strong>Important:</strong> Please verify your email to unlock all Linkzy features!</p>
                <p>Click the button below to verify your email address and complete your account setup:</p>
                <a href="${verificationUrl}" class="verify-button">
                    ✅ Verify Email Address
                </a>
                <p style="font-size: 12px; color: #64748b; margin-top: 15px;">
                    If the button doesn't work, copy and paste this link:<br>
                    <span style="word-break: break-all; color: #3b82f6;">${verificationUrl}</span>
                </p>
            </div>
            ` : ''}

            <h2 style="color: #1e293b; font-size: 28px;">🎯 Your Account Details</h2>
            <div style="background: #f8fafc; padding: 25px; border-radius: 10px; margin: 25px 0; border: 2px solid #e2e8f0;">
                <div class="stats-grid">
                    <div class="stat-item">
                        <div class="stat-number">3</div>
                        <div class="stat-label">Free Credits</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-number">24-48h</div>
                        <div class="stat-label">Placement Time</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-number">DA 20+</div>
                        <div class="stat-label">Min Authority</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-number">100%</div>
                        <div class="stat-label">Manual Review</div>
                    </div>
                </div>
                
                <div style="margin-top: 20px;">
                    <p><strong>📧 Email:</strong> ${email}</p>
                    ${website ? `<p><strong>🌐 Website:</strong> <a href="${website}" style="color: #f97316;">${website}</a></p>` : ''}
                    ${niche ? `<p><strong>🎯 Niche:</strong> ${getNicheDisplay(niche)}</p>` : ''}
                    <p><strong>📊 Plan:</strong> <span class="highlight">Free Starter</span> (can upgrade anytime)</p>
                </div>
            </div>
            
            <div class="api-key">
                <strong>🔑 Your API Key:</strong><br>
                ${apiKey}
            </div>
            
            <div class="warning">
                <span class="warning-icon">⚠️</span>
                <strong>Keep Your API Key Safe:</strong> This key provides access to your account. Store it securely and never share it publicly. We'll never ask for it via email.
            </div>

            <div class="feature-list">
                <h3>🚀 What You Get With Your Free Account:</h3>
                <ul>
                    <li>✅ <strong>3 high-quality backlink placements</strong> on DA 20+ websites</li>
                    <li>✅ <strong>Real-time analytics dashboard</strong> with click tracking</li>
                    <li>✅ <strong>Niche-specific targeting</strong> in ${niche ? getNicheDisplay(niche) : 'your industry'}</li>
                    <li>✅ <strong>24-48 hour placement guarantee</strong> or money back</li>
                    <li>✅ <strong>Manual quality review</strong> of every placement</li>
                    <li>✅ <strong>Full API access</strong> for automation and integration</li>
                    <li>✅ <strong>Performance tracking & reports</strong> with ROI metrics</li>
                    <li>✅ <strong>Email notifications</strong> for new placements</li>
                </ul>
            </div>
            
            <div style="text-align: center; margin: 40px 0;">
                <a href="https://linkzy.ai/dashboard" class="dashboard-button">
                    🚀 Access Your Dashboard Now
                </a>
            </div>
            
            <h2 style="color: #1e293b; font-size: 28px;">📈 Get Started in 3 Easy Steps</h2>
            
            <div class="step">
                <div style="display: flex; align-items: flex-start;">
                    <span class="step-number">1</span>
                    <div>
                        <h3 style="margin-top: 0; color: #1e293b;">${verificationToken ? 'Verify Your Email (Required)' : 'Access Your Dashboard'}</h3>
                        <p>${verificationToken 
                          ? 'Click the verification button above to unlock all features. This ensures account security and enables email notifications.'
                          : 'Your dashboard is ready! You have 3 free backlink credits to get started.'
                        }</p>
                    </div>
                </div>
            </div>
            
            <div class="step">
                <div style="display: flex; align-items: flex-start;">
                    <span class="step-number">2</span>
                    <div>
                        <h3 style="margin-top: 0; color: #1e293b;">Submit Your First Backlink Request</h3>
                        <p>In your dashboard, click <strong>"New Request"</strong> and provide:</p>
                        <ul>
                            <li>🎯 <strong>Target URL:</strong> The exact page you want to rank higher</li>
                            <li>🔗 <strong>Anchor Text:</strong> Keywords you want to link with (e.g., "best SEO tools")</li>
                            <li>📝 <strong>Special Notes:</strong> Any specific requirements or preferences</li>
                            <li>🎪 <strong>Niche Targeting:</strong> We'll match ${niche ? getNicheDisplay(niche) : 'your niche'} automatically</li>
                        </ul>
                    </div>
                </div>
            </div>
            
            <div class="step">
                <div style="display: flex; align-items: flex-start;">
                    <span class="step-number">3</span>
                    <div>
                        <h3 style="margin-top: 0; color: #1e293b;">Track Your Results</h3>
                        <p>Watch as your backlinks are placed within <span class="highlight">24-48 hours</span>. Monitor performance with our real-time analytics:</p>
                        <ul>
                            <li>📊 <strong>Click tracking</strong> and traffic attribution</li>
                            <li>🔍 <strong>Domain authority</strong> and placement quality metrics</li>
                            <li>📈 <strong>SEO impact measurements</strong> and ranking improvements</li>
                            <li>📧 <strong>Email notifications</strong> for new placements and milestones</li>
                        </ul>
                    </div>
                </div>
            </div>
            
            <h2 style="color: #1e293b; font-size: 28px;">💡 Pro Tips for Maximum SEO Impact</h2>
            <div style="background: #fffbeb; border-radius: 10px; padding: 25px; margin: 25px 0; border: 2px solid #f59e0b;">
                <ul style="margin: 0; color: #92400e;">
                    <li><strong>Quality First:</strong> We only place links on sites with DA 20+ in your specific niche</li>
                    <li><strong>Natural Anchor Text:</strong> Use variations like "best [keyword]", "top [keyword]", your brand name</li>
                    <li><strong>Target Specific Pages:</strong> Link to your best converting pages for maximum ROI</li>
                    <li><strong>Be Patient:</strong> SEO results typically show within 2-8 weeks of placement</li>
                    <li><strong>Scale Gradually:</strong> Start with 3-5 links, then increase based on results</li>
                    <li><strong>Track Everything:</strong> Use our analytics to measure traffic and conversion impact</li>
                </ul>
            </div>
            
            <h2 style="color: #1e293b; font-size: 28px;">🎯 What to Expect Next</h2>
            <div style="background: linear-gradient(135deg, #e0f2fe 0%, #b3e5fc 100%); padding: 25px; border-radius: 10px; margin: 25px 0; border: 2px solid #0ea5e9;">
                <p><strong>⏰ Within 24-48 hours:</strong> Your first backlinks will be placed on relevant, high-authority websites</p>
                <p><strong>📧 Within 1-2 hours:</strong> Email confirmation with placement details and live links</p>
                <p><strong>📈 Within 1-2 weeks:</strong> Links indexed by Google and other search engines</p>
                <p><strong>🚀 Within 2-8 weeks:</strong> Measurable improvements in search rankings and organic traffic</p>
                <p><strong>💰 ROI Impact:</strong> Most customers see 300-500% ROI within 90 days</p>
            </div>
            
            <h2 style="color: #1e293b; font-size: 28px;">🔗 Quick Access Links</h2>
            <div style="text-align: center; margin: 30px 0;">
                <p>
                    <a href="https://linkzy.ai/dashboard" class="dashboard-button" style="margin: 8px;">📊 Dashboard</a>
                    <a href="https://linkzy.ai/demo" class="dashboard-button" style="margin: 8px; background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);">🎬 Live Demo</a>
                </p>
            </div>
            
            <h2 style="color: #1e293b; font-size: 28px;">💬 Need Help? We're Here!</h2>
            <div style="background: #f0f9ff; border-radius: 10px; padding: 25px; margin: 25px 0; border: 2px solid #3b82f6;">
                <p>Our team responds to all support requests within 2-4 hours:</p>
                <p>📧 <strong>Email:</strong> <a href="mailto:hello@linkzy.ai" style="color: #3b82f6;">hello@linkzy.ai</a></p>
                <p>💬 <strong>Live Chat:</strong> Available in your dashboard</p>
                <p>📚 <strong>Knowledge Base:</strong> <a href="https://linkzy.ai/docs" style="color: #3b82f6;">linkzy.ai/docs</a></p>
                <p>🎯 <strong>API Documentation:</strong> <a href="https://linkzy.ai/api" style="color: #3b82f6;">linkzy.ai/api</a></p>
            </div>

            <div class="warning">
                <span class="warning-icon">🔒</span>
                <strong>Account Security:</strong> We'll never ask for your password or API key via email. If you receive suspicious emails, forward them to security@linkzy.ai
            </div>
        </div>
        
        <div class="footer">
            <p><strong>Thanks for choosing Linkzy! 🚀</strong></p>
            <p>Building better backlinks, one link at a time.</p>
            <p style="margin-top: 20px; font-size: 12px;">
                📧 You received this email because you created a Linkzy account with ${email}<br>
                🔗 Linkzy - Premium Backlink Platform | <a href="https://linkzy.ai" style="color: #3b82f6;">linkzy.ai</a><br>
                📞 Questions? Reply to this email or contact hello@linkzy.ai
            </p>
            <p style="font-size: 11px; color: #94a3b8; margin-top: 15px;">
                Linkzy, LLC | Built with ❤️ for better SEO
            </p>
        </div>
    </div>
</body>
</html>
    `.trim();

    // Send email using Resend API
    console.log('🚀 Sending email via Resend API...');
    
    // For welcome emails, we can either:
    // 1. Send directly via Resend API (current implementation)
    // 2. Use the resend-email function for consistency
    
    // Using direct Resend API for welcome emails (keeps the rich HTML template)
    try {
      const resendResponse = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
        from: 'Linkzy Team <hello@linkzy.ai>',
        to: [email],
        subject: `🎉 Welcome to Linkzy - Your Account is Ready! ${verificationToken ? '(Verification Required)' : ''}`,
        html: emailContent,
        tags: [
          { name: 'category', value: 'welcome' },
          { name: 'user_type', value: 'new_user' },
          { name: 'niche', value: niche || 'unknown' }
        ]
        })
      });

      if (!resendResponse.ok) {
        const errorText = await resendResponse.text();
        console.error('❌ Resend API error:', errorText);
        throw new Error(`Resend API error: ${resendResponse.status} - ${errorText}`);
      }

      const resendResult = await resendResponse.json();
      console.log('✅ Welcome email sent successfully via Resend:', resendResult.id);
    } catch (fetchError) {
      console.error('❌ Failed to send welcome email:', fetchError);
      throw fetchError;
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        message: "Welcome email sent successfully via Resend",
        recipient: email,
        emailId: resendResult?.id || 'unknown',
        apiKey: apiKey,
        features: [
          verificationToken ? "Email verification required" : "Email verification complete",
          "3 free backlink credits included", 
          "Real-time dashboard access",
          "API integration ready",
          "24-48 hour placement guarantee",
          "Sent via Resend with your domain"
        ]
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );

  } catch (error) {
    console.error('❌ Error sending welcome email via Resend:', error);
    
    return new Response(
      JSON.stringify({ 
        error: "Failed to send welcome email via Resend",
        details: error.message 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});