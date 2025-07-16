import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
// @ts-expect-error: No type declarations for supabase.js
import { supabase } from '../lib/supabase'
import { Link as LinkIcon, CheckCircle, AlertCircle } from 'lucide-react';

export default function AuthCallback() {
  const navigate = useNavigate();
  const [status, setStatus] = useState('Processing your authentication...')
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        setStatus('Verifying your authentication...');
        
        // Get the current session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        
        if (sessionError) {
          throw new Error(sessionError.message);
        }

        if (session && session.user) {
          setStatus('Authentication successful! Setting up your account...');
          
          // Check if user exists in users table
          const { data: existingUser, error: fetchError } = await supabase
            .from('users')
            .select('id, email, website, niche, api_key, credits, plan')
            .eq('id', session.user.id)
            .single();

          if (fetchError && fetchError.code !== 'PGRST116') {
            // PGRST116 is "no rows returned", which is fine for new users
            console.error('Error fetching user:', fetchError);
          }

          if (!existingUser) {
            // User doesn't exist, create them with default values
            setStatus('Creating your account...');
            
            const apiKey = `linkzy_${session.user.email?.replace('@', '_').replace(/\./g, '_')}_${Date.now()}`;
            
            const { error: insertError } = await supabase
              .from('users')
              .insert([{
                id: session.user.id,
                email: session.user.email,
                website: 'yourdomain.com', // Default value for onboarding
                niche: 'technology', // Default value for onboarding
                api_key: apiKey,
                credits: 3,
                plan: 'free'
              }]);

            if (insertError) {
              console.error('Database insert error:', insertError);
              throw new Error('Failed to create user account: ' + insertError.message);
            }

            // Store API key locally
            localStorage.setItem('linkzy_api_key', apiKey);
          } else {
            // User exists, store their API key
            if (existingUser.api_key) {
              localStorage.setItem('linkzy_api_key', existingUser.api_key);
            }
          }

          // Store user session info
          localStorage.setItem('linkzy_user', JSON.stringify(session.user));
          
          setStatus('Success! Redirecting to your dashboard...');
          setSuccess(true);
          
          // Redirect to dashboard after short delay
          setTimeout(() => {
            navigate('/dashboard', { replace: true });
          }, 1500);
          
        } else {
          throw new Error('No authentication session found. Please try signing in again.');
        }
      } catch (err) {
        console.error('Auth callback error:', err);
        const errorMessage = err instanceof Error ? err.message : 'Authentication failed';
        setError(errorMessage);
        setStatus('Authentication failed');
      }
    }

    handleAuthCallback()
  }, [navigate])

  const handleRetryAuth = () => {
    navigate('/', { replace: true });
  };

  const handleGoToDashboard = () => {
    navigate('/dashboard', { replace: true });
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #000000 0%, #1a1a1a 100%)', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      padding: '2rem' 
    }}>
      <div style={{ 
        maxWidth: 450, 
        width: '100%', 
        background: '#18181b', 
        borderRadius: 20, 
        boxShadow: '0 8px 32px rgba(0,0,0,0.3)', 
        padding: 40, 
        textAlign: 'center', 
        color: '#fff',
        border: '1px solid #333'
      }}>
        {/* Header */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          marginBottom: 32 
        }}>
          <div style={{ 
            background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)', 
            borderRadius: 12, 
            width: 56, 
            height: 56, 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            marginRight: 16,
            boxShadow: '0 4px 16px rgba(249, 115, 22, 0.3)'
          }}>
            <LinkIcon size={32} color="#fff" />
          </div>
          <span style={{ 
            fontSize: 32, 
            fontWeight: 700, 
            background: 'linear-gradient(135deg, #fff 0%, #d1d5db 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            Linkzy
          </span>
        </div>

        {/* Content */}
        {error ? (
          <div style={{ marginBottom: 32 }}>
            <div style={{ 
              background: '#ef4444', 
              borderRadius: '50%', 
              width: 64, 
              height: 64, 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              margin: '0 auto 24px',
              boxShadow: '0 4px 16px rgba(239, 68, 68, 0.3)'
            }}>
              <AlertCircle size={32} color="#fff" />
            </div>
            <h2 style={{ 
              fontSize: 24, 
              fontWeight: 600, 
              marginBottom: 12,
              color: '#fff'
            }}>
              Authentication Failed
            </h2>
            <p style={{ 
              color: '#ef4444', 
              marginBottom: 24,
              fontSize: 16,
              lineHeight: 1.5
            }}>
              {error}
            </p>
            <button
              style={{ 
                width: '100%', 
                background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)', 
                color: '#fff', 
                fontWeight: 600, 
                padding: '16px 0', 
                borderRadius: 12, 
                border: 'none', 
                fontSize: 16, 
                cursor: 'pointer',
                boxShadow: '0 4px 16px rgba(249, 115, 22, 0.3)',
                transition: 'all 0.2s ease'
              }}
              onClick={handleRetryAuth}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 6px 20px rgba(249, 115, 22, 0.4)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 16px rgba(249, 115, 22, 0.3)';
              }}
            >
              Try Again
            </button>
          </div>
        ) : success ? (
          <div style={{ marginBottom: 32 }}>
            <div style={{ 
              background: '#22c55e', 
              borderRadius: '50%', 
              width: 64, 
              height: 64, 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              margin: '0 auto 24px',
              boxShadow: '0 4px 16px rgba(34, 197, 94, 0.3)'
            }}>
              <CheckCircle size={32} color="#fff" />
            </div>
            <h2 style={{ 
              fontSize: 24, 
              fontWeight: 600, 
              marginBottom: 12,
              color: '#fff'
            }}>
              Welcome to Linkzy!
            </h2>
            <p style={{ 
              color: '#22c55e', 
              marginBottom: 24,
              fontSize: 16,
              lineHeight: 1.5
            }}>
              {status}
            </p>
            <button
              style={{ 
                width: '100%', 
                background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)', 
                color: '#fff', 
                fontWeight: 600, 
                padding: '16px 0', 
                borderRadius: 12, 
                border: 'none', 
                fontSize: 16, 
                cursor: 'pointer',
                boxShadow: '0 4px 16px rgba(34, 197, 94, 0.3)',
                transition: 'all 0.2s ease'
              }}
              onClick={handleGoToDashboard}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 6px 20px rgba(34, 197, 94, 0.4)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 16px rgba(34, 197, 94, 0.3)';
              }}
            >
              Go to Dashboard
            </button>
          </div>
        ) : (
          <div style={{ marginBottom: 32 }}>
            <div style={{ 
              width: 64, 
              height: 64, 
              border: '4px solid #f97316', 
              borderTop: '4px solid transparent', 
              borderRadius: '50%', 
              margin: '0 auto 24px', 
              animation: 'spin 1s linear infinite'
            }} />
            <h2 style={{ 
              fontSize: 24, 
              fontWeight: 600, 
              marginBottom: 12,
              color: '#fff'
            }}>
              Setting Up Your Account
            </h2>
            <p style={{ 
              color: '#a3a3a3', 
              marginBottom: 24,
              fontSize: 16,
              lineHeight: 1.5
            }}>
              {status}
            </p>
          </div>
        )}

        {/* Footer */}
        <div style={{ 
          paddingTop: 24, 
          borderTop: '1px solid #333',
          fontSize: 14,
          color: '#666'
        }}>
          <p>Having trouble? Contact us at <span style={{ color: '#f97316' }}>hello@linkzy.ai</span></p>
        </div>

        <style>{`
          @keyframes spin { 
            0% { transform: rotate(0deg); } 
            100% { transform: rotate(360deg); } 
          }
        `}</style>
      </div>
    </div>
  )
}