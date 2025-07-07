import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
}

// Resend API configuration
const RESEND_API_KEY = 're_Z2VQjCsS_9t2uN61rLbR4G2RQRRwMXpEt';

interface EmailRequest {
  to: string;
  subject: string;
  html: string;
  from?: string;
  tags?: Array<{ name: string; value: string }>;
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
    const { to, subject, html, from, tags }: EmailRequest = await req.json();

    // Validate required fields
    if (!to || !subject || !html) {
      return new Response(
        JSON.stringify({ error: "to, subject, and html are required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log(`📧 Sending email via Resend to: ${to}`);

    // Send email using Resend API
    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: from || 'Linkzy Team <hello@linkzy.ai>',
        to: [to],
        subject: subject,
        html: html,
        tags: tags || [
          { name: 'category', value: 'general' },
          { name: 'source', value: 'resend-email-function' }
        ]
      })
    });

    if (!resendResponse.ok) {
      const errorText = await resendResponse.text();
      console.error('❌ Resend API error:', errorText);
      throw new Error(`Resend API error: ${resendResponse.status} - ${errorText}`);
    }

    const resendResult = await resendResponse.json();
    console.log('✅ Email sent successfully via Resend:', resendResult.id);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Email sent successfully via Resend",
        recipient: to,
        emailId: resendResult.id,
        subject: subject
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );

  } catch (error) {
    console.error('❌ Error sending email via Resend:', error);
    
    return new Response(
      JSON.stringify({ 
        error: "Failed to send email via Resend",
        details: error.message 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});