import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { CheckCircle, AlertCircle, ArrowRight } from "lucide-react";
// @ts-expect-error: No type declarations for supabase.js
import { supabase } from "../lib/supabase";

const EmailVerification = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<"verifying" | "success" | "error">(
    "verifying"
  );
  const [message, setMessage] = useState("");

  useEffect(() => {
    let mounted = true;

    const verifyEmail = async () => {
      console.log('🔄 Starting email verification process...');

      try {
        // Stage 1: Verify Session
        if (!mounted) return;
        
        setMessage("Verifying your email address...");

        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (!mounted) return;
        
        if (sessionError) {
          console.error('❌ Session error:', sessionError);
          throw new Error(`Session verification failed: ${sessionError.message}`);
        }

        if (!session || !session.user) {
          console.error('❌ No session found');
          throw new Error('No authentication session found. Please try signing in again.');
        }

        console.log('✅ Session verified for user:', session.user.email);
        
        // Brief pause for UX
        await new Promise(resolve => setTimeout(resolve, 300));
        if (!mounted) return;

        // Stage 2: Check if user exists in users table
        setMessage("Checking your account status...");
        
        const { data: existingUser, error: fetchError } = await supabase
          .from('users')
          .select('id, email, website, niche, api_key, credits, plan')
          .eq('id', session.user.id)
          .maybeSingle();

        if (!mounted) return;

        if (fetchError) {
          console.error('❌ Error checking user existence:', fetchError);
          throw new Error(`Failed to check account status: ${fetchError.message}`);
        }

        let userProfile = existingUser;
        let apiKey = existingUser?.api_key;

        if (!existingUser) {
          console.log('👤 New user detected, creating account...');
          
          setMessage("Creating your new account...");
          
          // Generate API key
          apiKey = `linkzy_${session.user.email?.replace('@', '_').replace(/\./g, '_')}_${Date.now()}`;
          
          // Create user via Edge Function (bypasses RLS using service role)
          const createUserResponse = await fetch('https://sljlwvrtwqmhmjunyplr.supabase.co/functions/v1/create-user', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNsamx3dnJ0d3FtaG1qdW55cGxyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA4NTkzMDMsImV4cCI6MjA2NjQzNTMwM30.xJNGPIQ51XpdekFSQQ0Ymk4G3A86PZ4KRqKptRb-ozU`
            },
            body: JSON.stringify({
              userId: session.user.id,
              email: session.user.email,
              website: '', // Default value triggers onboarding
              niche: '' // Default value triggers onboarding
            })
          });

          const createUserResult = await createUserResponse.json();

          if (!mounted) return;

          if (!createUserResult.success) {
            console.error('❌ User creation error:', createUserResult.error);
            throw new Error(`Failed to create user account: ${createUserResult.error}`);
          }

          // User created successfully
          userProfile = createUserResult.user;
          apiKey = createUserResult.user.api_key;
          
          console.log('✅ New account created successfully');
        } else {
          console.log('👤 Existing user found:', existingUser.email);
        }

        // Store user data and API key in localStorage
        if (apiKey) {
          localStorage.setItem('linkzy_api_key', apiKey);
          console.log('✅ API key stored');
        }

        if (userProfile) {
          const userData = {
            id: userProfile.id,
            email: userProfile.email,
            website: userProfile.website,
            niche: userProfile.niche,
            api_key: apiKey,
            credits: userProfile.credits,
            plan: userProfile.plan
          };
          localStorage.setItem('linkzy_user', JSON.stringify(userData));
          console.log('✅ User data stored');
        }

        if (!mounted) return;

        // Success!
        setStatus("success");
        setMessage(
          "Your email has been verified successfully! You can now access all features."
        );
        console.log('🎉 Success! Redirecting to dashboard...');
        
        // Redirect to dashboard after 3 seconds
        setTimeout(() => {
          if (mounted) {
            console.log('🚀 Navigating to dashboard...');
            navigate("/dashboard", { replace: true });
          }
        }, 3000);
        
      } catch (error) {
        if (!mounted) return;
        
        console.error("Email verification failed:", error);
        const errorMessage = error instanceof Error ? error.message : "Email verification failed. The link may be expired or invalid.";
        setStatus("error");
        setMessage(errorMessage);
      }
    };

    verifyEmail();

    // Cleanup function
    return () => {
      mounted = false;
    };
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="bg-gray-900 border border-gray-700 rounded-2xl p-8">
          {status === "verifying" && (
            <>
              <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
              <h1 className="text-2xl font-bold text-white mb-4">
                Verifying Your Email
              </h1>
              <p className="text-gray-300">
                {message || "Please wait while we verify your email address..."}
              </p>
            </>
          )}

          {status === "success" && (
            <>
              <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-10 h-10 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-white mb-4">
                Email Verified! ✅
              </h1>
              <p className="text-gray-300 mb-6">{message}</p>

              <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-4 mb-6">
                <h3 className="text-green-400 font-medium mb-2">
                  What's Next?
                </h3>
                <ul className="text-green-300 text-sm space-y-1 text-left">
                  <li>• Access your full dashboard</li>
                  <li>• Submit backlink requests</li>
                  <li>• Track your SEO performance</li>
                  <li>• Use all premium features</li>
                </ul>
              </div>

              <button
                onClick={() => navigate("/dashboard", { replace: true })}
                className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 rounded-lg transition-colors flex items-center justify-center space-x-2"
              >
                <span>Go to Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </>
          )}

          {status === "error" && (
            <>
              <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <AlertCircle className="w-10 h-10 text-red-400" />
              </div>
              <h1 className="text-2xl font-bold text-white mb-4">
                Verification Failed
              </h1>
              <p className="text-gray-300 mb-6">{message}</p>

              <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4 mb-6">
                <h3 className="text-red-400 font-medium mb-2">Need Help?</h3>
                <ul className="text-red-300 text-sm space-y-1 text-left">
                  <li>• Check your email for a new verification link</li>
                  <li>• Make sure you clicked the correct link</li>
                  <li>• Contact support if the issue persists</li>
                </ul>
              </div>

              <div className="space-y-3">
                <button
                  onClick={() => navigate("/", { replace: true })}
                  className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 rounded-lg transition-colors"
                >
                  Try Again
                </button>

                <button
                  onClick={() => navigate("/")}
                  className="w-full bg-gray-800 hover:bg-gray-700 text-white py-3 rounded-lg transition-colors border border-gray-600"
                >
                  Back to Home
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmailVerification;
