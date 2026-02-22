/* ============================================
   Authentication Module — Supabase Auth
   Signup, Login, Logout, Session Guard
   ============================================ */

/**
 * Sign up a new teacher account
 */
async function authSignUp(email, password, displayName) {
  const { data, error } = await sb.auth.signUp({
    email,
    password,
    options: { data: { display_name: displayName || '' } }
  });
  if (error) throw error;
  return data;
}

/**
 * Sign in an existing teacher
 */
async function authSignIn(email, password) {
  const { data, error } = await sb.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

/**
 * Sign out the current teacher
 */
async function authSignOut() {
  const { error } = await sb.auth.signOut();
  if (error) throw error;
  window.location.href = 'login';
}

/**
 * Get the current authenticated user (or null)
 */
async function getUser() {
  const { data: { user } } = await sb.auth.getUser();
  return user;
}

/**
 * Redirect to login if not authenticated.
 * Call this at the top of every protected page.
 */
async function requireAuth() {
  const user = await getUser();
  if (!user) {
    window.location.href = 'login';
    return null;
  }
  return user;
}

/**
 * Redirect to sections if already logged in.
 * Call this on login/signup pages.
 */
async function redirectIfLoggedIn() {
  const user = await getUser();
  if (user) {
    window.location.href = 'sections';
  }
}
