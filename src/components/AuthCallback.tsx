import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
// @ts-expect-error: No type declarations for supabase.js
import { supabase } from '../lib/supabase'
import { Link as LinkIcon, CheckCircle, AlertCircle, User, Database, Shield } from 'lucide-react';

interface ProcessingStage {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  icon: React.ReactElement;
}

export default function AuthCallback() {
  const navigate = useNavigate();
  const [currentStage, setCurrentStage] = useState(0);
  const [stages, setStages] = useState<ProcessingStage[]>([
    {
      id: 'session',
      title: 'Verifying Session',
      description: 'Checking your authentication status...',
      status: 'processing',
      icon: <Shield size={20} />
    },
    {
      id: 'user-check',
      title: 'Checking Account',
      description: 'Looking up your account information...',
      status: 'pending',
      icon: <User size={20} />
    },
    {
      id: 'setup',
      title: 'Setting Up Account',
      description: 'Preparing your dashboard...',
      status: 'pending',
      icon: <Database size={20} />
    }
  ]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [processing, setProcessing] = useState(true);

  const updateStage = (stageId: string, status: ProcessingStage['status'], description?: string) => {
    setStages(prev => prev.map(stage => 
      stage.id === stageId 
        ? { ...stage, status, ...(description && { description }) }
        : stage
    ));
  };

  const moveToNextStage = () => {
    setCurrentStage(prev => Math.min(prev + 1, 2)); // Max 2 since we have 3 stages (0,1,2)
  };

  useEffect(() => {
    let mounted = true;
    
    const handleAuthCallback = async () => {
      console.log('🔄 Starting auth callback process...');
      
      try {
        // Ensure UI is visible immediately
        setProcessing(true);
        setError(null);
        setSuccess(false);
        
        // Stage 1: Verify Session
        if (!mounted) return;
        updateStage('session', 'processing', 'Verifying your authentication...');
        
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
        updateStage('session', 'completed', 'Authentication verified successfully');
        
        // Brief pause for UX but don't block
        await new Promise(resolve => setTimeout(resolve, 300));
        if (!mounted) return;
        moveToNextStage();

        // Stage 2: Check if user exists
        updateStage('user-check', 'processing', 'Checking your account status...');
        
        const { data: existingUser, error: fetchError } = await supabase
          .from('users')
          .select('id, email, website, niche, api_key, credits, plan, is_pro')
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
          // User doesn't exist, create new account
          updateStage('user-check', 'completed', 'New account detected');
          await new Promise(resolve => setTimeout(resolve, 200));
          if (!mounted) return;
          moveToNextStage();
          
          updateStage('setup', 'processing', 'Creating your new account...');
          
          // Generate API key
          apiKey = `linkzy_${session.user.email?.replace('@', '_').replace(/\./g, '_')}_${Date.now()}`;
          
          // Insert new user with default values for onboarding
          const { data: newUser, error: insertError } = await supabase
            .from('users')
            .insert([{
              id: session.user.id,
              email: session.user.email,
              website: 'yourdomain.com', // Default value triggers onboarding
              niche: 'technology', // Default value triggers onboarding
              api_key: apiKey,
              credits: 3,
              plan: 'free',
              is_pro: false
            }])
            .select()
            .single();

          if (!mounted) return;

          if (insertError) {
            console.error('❌ Database insert error:', insertError);
            
            // Check if it's a duplicate key error (user already exists)
            if (insertError.code === '23505' || insertError.message?.includes('duplicate')) {
              console.log('🔄 User already exists, fetching existing data...');
              // User was created by another process, fetch their data
              const { data: fetchedUser, error: refetchError } = await supabase
                .from('users')
                .select('id, email, website, niche, api_key, credits, plan, is_pro')
                .eq('id', session.user.id)
                .single();
                
              if (refetchError) {
                throw new Error(`Failed to fetch existing user: ${refetchError.message}`);
              }
              
              userProfile = fetchedUser;
              apiKey = fetchedUser.api_key;
            } else {
              throw new Error(`Failed to create account: ${insertError.message}`);
            }
          } else {
            userProfile = newUser;
          }
          
          updateStage('setup', 'completed', 'New account created successfully');
        } else {
          console.log('👤 Existing user found:', existingUser.email);
          // User exists
          updateStage('user-check', 'completed', 'Existing account found');
          await new Promise(resolve => setTimeout(resolve, 200));
          if (!mounted) return;
          moveToNextStage();
          
          updateStage('setup', 'processing', 'Loading your account data...');
          await new Promise(resolve => setTimeout(resolve, 400));
          if (!mounted) return;
          updateStage('setup', 'completed', 'Account data loaded successfully');
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
            plan: userProfile.plan,
            is_pro: userProfile.is_pro
          };
          localStorage.setItem('linkzy_user', JSON.stringify(userData));
          console.log('✅ User data stored');
        }

        if (!mounted) return;

        // Success - redirect to dashboard
        setSuccess(true);
        setProcessing(false);
        console.log('🎉 Success! Redirecting to dashboard...');
        
        // Shorter redirect delay for better UX
        setTimeout(() => {
          if (mounted) {
            console.log('🚀 Navigating to dashboard...');
            navigate('/dashboard', { replace: true });
          }
        }, 1500);
        
      } catch (err) {
        if (!mounted) return;
        
        console.error('❌ Auth callback error:', err);
        const errorMessage = err instanceof Error ? err.message : 'Authentication failed';
        setError(errorMessage);
        setProcessing(false);
        
        // Mark current stage as error
        if (stages[currentStage]) {
          updateStage(stages[currentStage].id, 'error', errorMessage);
        }
      }
    };

    // Start the process immediately
    handleAuthCallback();
    
    // Cleanup function
    return () => {
      mounted = false;
    };
  }, []); // Remove dependencies to prevent infinite loops

  const handleRetryAuth = () => {
    console.log('🔄 Retrying authentication...');
    navigate('/', { replace: true });
  };

  const handleGoToDashboard = () => {
    console.log('🚀 Manual navigation to dashboard...');
    navigate('/dashboard', { replace: true });
  };

  const getStageStatusColor = (status: ProcessingStage['status']) => {
    switch (status) {
      case 'completed': return '#22c55e';
      case 'processing': return '#f97316';
      case 'error': return '#ef4444';
      default: return '#64748b';
    }
  };

  const getStageIcon = (stage: ProcessingStage) => {
    if (stage.status === 'completed') {
      return <CheckCircle size={20} color="#22c55e" />;
    } else if (stage.status === 'error') {
      return <AlertCircle size={20} color="#ef4444" />;
    } else if (stage.status === 'processing') {
      return (
        <div style={{ 
          width: 20, 
          height: 20, 
          border: '2px solid #f97316', 
          borderTop: '2px solid transparent', 
          borderRadius: '50%', 
          animation: 'spin 1s linear infinite'
        }} />
      );
    } else {
      return React.cloneElement(stage.icon, { color: '#64748b' });
    }
  };

  // Show loading immediately if still processing
  if (processing && !error && !success) {
    console.log('📊 Rendering processing state');
  }

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
        maxWidth: 500, 
        width: '100%', 
        background: '#18181b', 
        borderRadius: 20, 
        boxShadow: '0 8px 32px rgba(0,0,0,0.3)', 
        padding: 40, 
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
          <div style={{ textAlign: 'center' }}>
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
          <div style={{ textAlign: 'center' }}>
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
              Welcome to Linkzy! 🎉
            </h2>
            <p style={{ 
              color: '#22c55e', 
              marginBottom: 24,
              fontSize: 16,
              lineHeight: 1.5
            }}>
              Your account is ready! Redirecting to dashboard...
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
          <div>
            <h2 style={{ 
              fontSize: 24, 
              fontWeight: 600, 
              marginBottom: 32,
              color: '#fff',
              textAlign: 'center'
            }}>
              Processing Authentication
            </h2>
            
            {/* Processing Stages */}
            <div style={{ marginBottom: 32 }}>
              {stages.map((stage, index) => (
                <div key={stage.id} style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  marginBottom: 24,
                  opacity: index <= currentStage ? 1 : 0.5,
                  transition: 'opacity 0.3s ease'
                }}>
                  <div style={{ 
                    width: 40, 
                    height: 40, 
                    borderRadius: '50%', 
                    background: index < currentStage ? '#22c55e' : (index === currentStage ? '#f97316' : '#333'),
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    marginRight: 16,
                    transition: 'background 0.3s ease'
                  }}>
                    {getStageIcon(stage)}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ 
                      fontSize: 16, 
                      fontWeight: 600, 
                      color: getStageStatusColor(stage.status),
                      marginBottom: 4
                    }}>
                      {stage.title}
                    </div>
                    <div style={{ 
                      fontSize: 14, 
                      color: '#a3a3a3',
                      lineHeight: 1.4
                    }}>
                      {stage.description}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div style={{ 
          paddingTop: 24, 
          borderTop: '1px solid #333',
          fontSize: 14,
          color: '#666',
          textAlign: 'center'
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