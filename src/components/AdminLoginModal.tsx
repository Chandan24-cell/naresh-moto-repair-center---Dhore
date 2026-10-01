import { FormEvent, useState } from 'react';
import { ArrowRight, LockKeyhole } from 'lucide-react';
import type { Theme } from '../App';
import { supabase } from '../utils/supabase';

interface AdminLoginModalProps {
  theme?: Theme;
  title?: string;
  passwordLabel?: string;
  submitLabel?: string;
  onAuthenticated: () => void;
}

export default function AdminLoginModal({
  theme = 'dark',
  title = 'Admin Portal',
  passwordLabel = 'Password',
  submitLabel = 'Sign in',
  onAuthenticated
}: AdminLoginModalProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const isDark = theme === 'dark';

  // Clear credentials only after Supabase returns a valid session.
  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (signInError) throw signInError;
      if (!data.session) throw new Error('No session returned.');

      setEmail('');
      setPassword('');
      onAuthenticated();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not sign in. Please check your credentials.');
    } finally {
      setSubmitting(false);
    }
  };

  // Supabase sends the reset link back to the existing admin path.
  const handleForgotPassword = async () => {
    if (!email.trim()) {
      setError('Enter your admin email first so we can send the reset link.');
      return;
    }
    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/admin`
      });
      
      if (resetError) throw resetError;
      
      setError('');
      setShowForgotPassword(false);
      alert('Password reset instructions have been sent to your email.');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Password reset request failed.');
    }
  };

  return (
    <div
      className={`animate-view-fade mx-auto flex w-full max-w-md flex-col justify-center p-6 sm:p-10 ${isDark ? 'text-white' : 'text-black'}`}
    >
      <div className="mb-6 flex h-11 w-11 items-center justify-center rounded-full bg-accent text-white">
        <LockKeyhole className="h-5 w-5" aria-hidden="true" />
      </div>
      <h2 className="text-2xl font-bold">{title}</h2>
      <p className="mt-2 text-sm text-[var(--text-muted)]">Sign in to manage your workshop dashboard.</p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <label className="block text-sm font-semibold">
          Admin email
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="email"
            required
            className="mt-2 w-full rounded border border-[var(--border-mid)] bg-[var(--bg-base)] px-3 py-2.5 font-normal text-[var(--text-base)]"
          />
        </label>
        <label className="block text-sm font-semibold">
          {passwordLabel}
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
            required
            className="mt-2 w-full rounded border border-[var(--border-mid)] bg-[var(--bg-base)] px-3 py-2.5 font-normal text-[var(--text-base)]"
          />
        </label>
        {error && <p role="alert" className="text-sm text-red-500">{error}</p>}
        <button type="submit" disabled={submitting} className="inline-flex w-full items-center justify-center gap-2 rounded bg-accent px-4 py-3 text-sm font-bold text-white disabled:opacity-60">
          {submitting ? 'Signing in...' : submitLabel}
          {!submitting && <ArrowRight className="h-4 w-4" aria-hidden="true" />}
        </button>
      </form>

      <button
        type="button"
        onClick={() => { setShowForgotPassword((visible) => !visible); setError(''); }}
        className="mt-4 text-left text-sm font-semibold text-accent-text"
      >
        Forgot password?
      </button>
      {showForgotPassword && (
        <button type="button" onClick={handleForgotPassword} className="mt-2 text-left text-sm text-[var(--text-muted)] underline">
          Send reset instructions
        </button>
      )}
    </div>
  );
}
