import type { APIRoute } from 'astro';

export const prerender = false;

/**
 * GET /auth/callback
 * Handles email verification and password reset callbacks from Supabase
 * 
 * This endpoint is called when user clicks verification link in email
 * Supabase can send either:
 * - token_hash and type parameters (OTP flow)
 * - code parameter (PKCE flow for both password reset and email confirmation)
 * 
 * Flow:
 * 1. Check for PKCE code or token_hash
 * 2. Exchange token for session using Supabase
 * 3. Redirect to appropriate page based on type or next parameter
 * 
 * @returns Redirect to appropriate page based on the auth flow
 */
export const GET: APIRoute = async ({ url, locals, redirect, cookies }) => {
  const token_hash = url.searchParams.get('token_hash');
  const type = url.searchParams.get('type');
  const code = url.searchParams.get('code');
  const next = url.searchParams.get('next'); // Optional parameter to specify redirect destination

  // Handle PKCE flow (used for both password reset and email confirmation)
  if (code) {
    try {
      const { data, error } = await locals.supabase.auth.exchangeCodeForSession(code);

      if (error) {
        console.error('PKCE code exchange error:', error);
        return redirect('/forgot-password?error=invalid_code');
      }

      console.log('PKCE code exchange successful');
      
      // Determine where to redirect based on the 'next' parameter or user metadata
      // If 'next' parameter is provided, use it
      if (next === 'email-confirmed') {
        return redirect('/email-confirmed');
      }
      
      // Check if this is a password recovery flow
      // Password recovery is indicated by the user's app_metadata or the absence of 'next' parameter
      // For password reset, redirect to update-password page
      return redirect('/update-password');
    } catch (error) {
      console.error('PKCE callback error:', error);
      return redirect('/forgot-password?error=unexpected');
    }
  }

  // Handle OTP flow (email verification with token_hash)
  if (!token_hash || !type) {
    console.error('Missing required parameters in callback URL');
    return redirect('/login?error=invalid_callback');
  }

  try {
    // Verify the token with Supabase
    const { error } = await locals.supabase.auth.verifyOtp({
      token_hash,
      type: type as 'email' | 'recovery' | 'invite' | 'magiclink' | 'signup',
    });

    if (error) {
      console.error('Token verification error:', error);
      
      // Handle specific errors
      if (error.message.includes('expired')) {
        return redirect('/login?error=link_expired');
      }
      
      return redirect('/login?error=verification_failed');
    }

    // Redirect based on callback type
    switch (type) {
      case 'signup':
      case 'email':
        // Email verification successful - redirect to login with success message
        return redirect('/login?verified=true');
      
      case 'recovery':
        // Password reset - redirect to update password page
        return redirect('/update-password');
      
      default:
        return redirect('/login');
    }
  } catch (error) {
    console.error('Callback error:', error);
    return redirect('/login?error=unexpected');
  }
};
