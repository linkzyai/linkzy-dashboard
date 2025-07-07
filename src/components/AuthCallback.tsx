import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export default function AuthCallback() {
  const [status, setStatus] = useState('Confirming your email...')
  
  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          setStatus('Confirmation failed: ' + error.message)
          return
        }

        if (session && session.user) {
          const user = session.user
          const website = user.user_metadata?.website || ''
          const niche = user.user_metadata?.niche || ''
          const apiKey = `linkzy_${user.email.replace('@', '_').replace(/\./g, '_')}_${Date.now()}`
          
          setStatus('Creating your account...')
          
          const { error: insertError } = await supabase
            .from('users')
            .insert([{
              id: user.id,
              email: user.email,
              website: website,
              niche: niche,
              api_key: apiKey,
              credits: 3,
              plan: 'free'
            }])
          
          if (insertError) {
            console.error('Database insert error details:', insertError)
            setStatus('Database error: ' + insertError.message)
            return
          }
          
          localStorage.setItem('linkzy_user', JSON.stringify(user))
          localStorage.setItem('linkzy_api_key', apiKey)
          
          setStatus('Success! Redirecting to dashboard...')
          setTimeout(() => {
            window.location.href = '/dashboard'
          }, 1500)
        } else {
          setStatus('No valid session found')
        }
      } catch (err) {
        console.error('Callback error:', err)
        setStatus('Confirmation failed: ' + err.message)
      }
    }

    handleAuthCallback()
  }, [])

  return (
    <div style={{ padding: '2rem', textAlign: 'center' }}>
      <h2>Email Confirmation</h2>
      <p>{status}</p>
    </div>
  )
}