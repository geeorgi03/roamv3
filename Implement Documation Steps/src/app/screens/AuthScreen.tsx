import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';

export function AuthScreen() {
  const { signIn, signUp, resetPassword } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setLoading(true);

    try {
      if (isForgotPassword) {
        await resetPassword(email);
        setSuccessMessage('Password reset instructions sent to your email!');
        setTimeout(() => {
          setIsForgotPassword(false);
          setSuccessMessage('');
        }, 3000);
      } else if (isSignUp) {
        await signUp(email, password, name);
      } else {
        await signIn(email, password);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleModeSwitch = () => {
    setError('');
    setSuccessMessage('');
    setIsForgotPassword(false);
    setIsSignUp(!isSignUp);
  };

  const handleForgotPassword = () => {
    setError('');
    setSuccessMessage('');
    setIsForgotPassword(true);
    setIsSignUp(false);
  };

  const handleBackToSignIn = () => {
    setError('');
    setSuccessMessage('');
    setIsForgotPassword(false);
    setIsSignUp(false);
  };

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="font-syne text-[32px] font-bold text-[var(--accent-primary)] mb-2">
            Roam
          </h1>
          <p className="text-[var(--text-secondary)] text-sm">
            Capture-first choreography tool
          </p>
        </div>

        <div className="bg-[var(--bg-secondary)] rounded-2xl p-6 border border-[var(--border-subtle)]">
          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignUp && !isForgotPassword && (
              <div>
                <Label htmlFor="name" className="text-[var(--text-primary)]">Name</Label>
                <Input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required={isSignUp}
                  className="mt-1 bg-[var(--bg-tertiary)] border-[var(--border-subtle)] text-[var(--text-primary)]"
                  placeholder="Your name"
                />
              </div>
            )}

            <div>
              <Label htmlFor="email" className="text-[var(--text-primary)]">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="mt-1 bg-[var(--bg-tertiary)] border-[var(--border-subtle)] text-[var(--text-primary)]"
                placeholder="you@example.com"
              />
            </div>

            {!isForgotPassword && (
              <div>
                <Label htmlFor="password" className="text-[var(--text-primary)]">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="mt-1 bg-[var(--bg-tertiary)] border-[var(--border-subtle)] text-[var(--text-primary)]"
                  placeholder="••••••••"
                />
              </div>
            )}

            {error && (
              <div className="text-red-500 text-sm bg-red-500/10 rounded-lg p-3">
                {error}
              </div>
            )}

            {successMessage && (
              <div className="text-green-500 text-sm bg-green-500/10 rounded-lg p-3">
                {successMessage}
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-[var(--accent-primary)] text-black hover:bg-[var(--accent-primary)]/90 font-semibold"
            >
              {loading 
                ? 'Please wait...' 
                : isForgotPassword 
                  ? 'Send Reset Link'
                  : isSignUp 
                    ? 'Sign Up' 
                    : 'Sign In'}
            </Button>

            {!isForgotPassword && (
              <>
                <button
                  type="button"
                  onClick={handleModeSwitch}
                  className="w-full text-[var(--text-secondary)] text-sm hover:text-[var(--text-primary)] transition"
                >
                  {isSignUp
                    ? 'Already have an account? Sign in'
                    : "Don't have an account? Sign up"}
                </button>

                {!isSignUp && (
                  <button
                    type="button"
                    onClick={handleForgotPassword}
                    className="w-full text-[var(--text-secondary)] text-sm hover:text-[var(--text-primary)] transition"
                  >
                    Forgot password?
                  </button>
                )}
              </>
            )}

            {isForgotPassword && (
              <button
                type="button"
                onClick={handleBackToSignIn}
                className="w-full text-[var(--text-secondary)] text-sm hover:text-[var(--text-primary)] transition"
              >
                Back to Sign In
              </button>
            )}
          </form>
        </div>

        <div className="mt-6 text-center text-xs text-[var(--text-tertiary)]">
          <p>This is a prototype app built with Figma Make.</p>
          <p>Not intended for production use or sensitive data.</p>
        </div>
      </div>
    </div>
  );
}