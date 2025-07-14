import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { Link as LinkIcon } from 'lucide-react';

export default function AuthCallback() {
  const [status, setStatus] = useState('Confirming your email...')
  const [success, setSuccess] = useState(false);
  const [needsProfile, setNeedsProfile] = useState(false);
  const [website, setWebsite] = useState('');
  const [niche, setNiche] = useState('');
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          setStatus('Confirmation failed: ' + error.message)
          return
        }

        if (session && session.user) {
          setUser(session.user);
          // Check if user already exists in custom users table
          const { data: existingUser } = await supabase
            .from('users')
            .select('id, website, niche')
            .eq('id', session.user.id)
            .single();

          if (existingUser && existingUser.website && existingUser.niche) {
            // User already has profile, redirect
            setStatus('Success! Redirecting to homepage...');
            setSuccess(true);
            setTimeout(() => {
              window.location.href = '/';
            }, 2000);
            return;
          }

          // If missing website or niche, show form
          const websiteVal = session.user.user_metadata?.website || '';
          const nicheVal = session.user.user_metadata?.niche || '';
          if (!websiteVal || !nicheVal) {
            setNeedsProfile(true);
            setStatus('Please complete your profile to finish sign up.');
            setWebsite(websiteVal);
            setNiche(nicheVal);
            return;
          }

          // If metadata is present, insert into users table
          // const apiKey = `linkzy_${session.user.email.replace('@', '_').replace(/\./g, '_')}_${Date.now()}`;
          // setStatus('Creating your account...');
          // const { error: insertError } = await supabase
          //   .from('users')
          //   .insert([{
          //     id: session.user.id,
          //     email: session.user.email,
          //     website: websiteVal,
          //     niche: nicheVal,
          //     api_key: apiKey,
          //     credits: 3,
          //     plan: 'free'
          //   }]);
          // if (insertError) {
          //   console.error('Database insert error details:', insertError)
          //   setStatus('Database error: ' + insertError.message)
          //   return
          // }
          // localStorage.setItem('linkzy_user', JSON.stringify(session.user))
          // localStorage.setItem('linkzy_api_key', apiKey)
          setStatus('Success! Redirecting to homepage...')
          setSuccess(true);
          setTimeout(() => {
            window.location.href = '/';
          }, 2000);
        } else {
          setStatus('No valid session found')
        }
      } catch (err) {
        console.error('Callback error:', err)
        setStatus('Confirmation failed: ' + (err as Error).message)
      }
    }

    handleAuthCallback()
  }, [])

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!website || !niche || !user) return;
    setStatus('Saving your profile...');
    // Instead of inserting, update the user's metadata or just reload
    setStatus('Success! Redirecting to homepage...');
    setSuccess(true);
    setNeedsProfile(false);
    setTimeout(() => {
      window.location.href = '/';
    }, 2000);
  };

  return (
    <div style={{ minHeight: '100vh', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
      <div style={{ maxWidth: 400, width: '100%', background: '#18181b', borderRadius: 16, boxShadow: '0 4px 24px rgba(0,0,0,0.2)', padding: 32, textAlign: 'center', color: '#fff' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24 }}>
          <div style={{ background: '#f97316', borderRadius: 12, width: 48, height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
            <LinkIcon size={28} color="#fff" />
          </div>
          <span style={{ fontSize: 28, fontWeight: 700 }}>Linkzy</span>
        </div>
        {needsProfile ? (
          <form onSubmit={handleProfileSubmit} style={{ marginBottom: 24 }}>
            <h2 style={{ fontSize: 22, fontWeight: 600, marginBottom: 16 }}>Complete Your Profile</h2>
            <div style={{ marginBottom: 16 }}>
              <input
                type="text"
                placeholder="Your Website (e.g. https://example.com)"
                value={website}
                onChange={e => setWebsite(e.target.value)}
                style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #333', marginBottom: 12, fontSize: 16 }}
                required
              />
              <select
                value={niche}
                onChange={e => setNiche(e.target.value)}
                style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #333', fontSize: 16 }}
                required
              >
                <option value="">Select your niche</option>
                <option value="technology">Technology</option>
                <option value="health">Health</option>
                <option value="finance">Finance</option>
                <option value="education">Education</option>
                <option value="creative-arts">Creative Arts</option>
                <option value="marketing">Marketing</option>
                <option value="other">Other</option>
              </select>
            </div>
            <button
              type="submit"
              style={{ width: '100%', background: '#f97316', color: '#fff', fontWeight: 600, padding: '12px 0', borderRadius: 8, border: 'none', fontSize: 16, cursor: 'pointer' }}
            >
              Finish Sign Up
            </button>
          </form>
        ) : success ? (
          <div style={{ marginBottom: 24 }}>
            <div style={{ background: '#22c55e', borderRadius: '50%', width: 48, height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <span style={{ fontSize: 28 }}>✅</span>
            </div>
            <h2 style={{ fontSize: 22, fontWeight: 600, marginBottom: 8 }}>Email Confirmed!</h2>
            <p style={{ color: '#a3a3a3', marginBottom: 16 }}>{status}</p>
          </div>
        ) : (
          <div style={{ marginBottom: 24 }}>
            <div style={{ width: 48, height: 48, border: '4px solid #f97316', borderTop: '4px solid transparent', borderRadius: '50%', margin: '0 auto 16px', animation: 'spin 1s linear infinite' }} />
            <h2 style={{ fontSize: 22, fontWeight: 600, marginBottom: 8 }}>Email Confirmation</h2>
            <p style={{ color: '#a3a3a3', marginBottom: 16 }}>{status}</p>
          </div>
        )}
        <button
          style={{ width: '100%', background: '#f97316', color: '#fff', fontWeight: 600, padding: '12px 0', borderRadius: 8, border: 'none', marginTop: 8, fontSize: 16, cursor: 'pointer' }}
          onClick={() => (window.location.href = '/')}
        >
          Go to Homepage
        </button>
        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  )
}