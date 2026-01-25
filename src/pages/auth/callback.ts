import type { APIRoute } from 'astro';

export const prerender = false;

/**
 * GET /auth/callback
 * Handles email verification and password reset callbacks from Supabase
 * 
 * This endpoint is called when user clicks verification link in email
 * Supabase sends token_hash and type parameters
 * 
 * Flow:
 * 1. Extract token_hash and type from URL
 * 2. Exchange token for session using Supabase
 * 3. Redirect to appropriate page based on type
 * 
 * @returns Redirect to login (email verification) or update-password (password reset)
 */
export const GET: APIRoute = async ({ url, locals, redirect }) => {
  const token_hash = url.searchParams.get('token_hash');
  const type = url.searchParams.get('type');

  // Validate required parameters
  if (!token_hash || !type) {
    console.error('Missing token_hash or type in callback URL');
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
