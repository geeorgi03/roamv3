import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';

export function AuthScreen() {
  const { signIn, signUp } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isSignUp) {
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
            {isSignUp && (
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

            {error && (
              <div className="text-red-500 text-sm bg-red-500/10 rounded-lg p-3">
                {error}
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-[var(--accent-primary)] text-black hover:bg-[var(--accent-primary)]/90 font-semibold"
            >
              {loading ? 'Please wait...' : isSignUp ? 'Sign Up' : 'Sign In'}
            </Button>

            <button
              type="button"
              onClick={() => setIsSignUp(!isSignUp)}
              className="w-full text-[var(--text-secondary)] text-sm hover:text-[var(--text-primary)] transition"
            >
              {isSignUp
                ? 'Already have an account? Sign in'
                : "Don't have an account? Sign up"}
            </button>
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
