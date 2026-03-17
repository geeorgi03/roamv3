import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';

export function ResetPasswordScreen() {
  const navigate = useNavigate();
  const { updatePassword } = useAuth();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validate passwords match
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    // Validate password length
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      await updatePassword(newPassword);
      setSuccess(true);
      
      // Redirect to home after 2 seconds
      setTimeout(() => {
        navigate('/');
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center p-4">
        <div className="w-full max-w-md text-center">
          <div className="bg-[var(--bg-secondary)] rounded-2xl p-8 border border-[var(--border-subtle)]">
            <div className="text-green-500 text-5xl mb-4">✓</div>
            <h2 className="text-[var(--text-primary)] text-xl font-semibold mb-2">
              Password Updated!
            </h2>
            <p className="text-[var(--text-secondary)] text-sm">
              Redirecting you to the app...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="font-syne text-[32px] font-bold text-[var(--accent-primary)] mb-2">
            Roam
          </h1>
          <p className="text-[var(--text-secondary)] text-sm">
            Reset your password
          </p>
        </div>

        <div className="bg-[var(--bg-secondary)] rounded-2xl p-6 border border-[var(--border-subtle)]">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="newPassword" className="text-[var(--text-primary)]">
                New Password
              </Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={6}
                className="mt-1 bg-[var(--bg-tertiary)] border-[var(--border-subtle)] text-[var(--text-primary)]"
                placeholder="Enter new password"
              />
            </div>

            <div>
              <Label htmlFor="confirmPassword" className="text-[var(--text-primary)]">
                Confirm Password
              </Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
                className="mt-1 bg-[var(--bg-tertiary)] border-[var(--border-subtle)] text-[var(--text-primary)]"
                placeholder="Confirm new password"
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
              {loading ? 'Updating...' : 'Update Password'}
            </Button>

            <button
              type="button"
              onClick={() => navigate('/')}
              className="w-full text-[var(--text-secondary)] text-sm hover:text-[var(--text-primary)] transition"
            >
              Cancel
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
