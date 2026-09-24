import React, { useState } from 'react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { User, api } from '../lib/api';

interface AdminLoginPageProps {
  onAdminLoginSuccess: (user: User) => void;
  onNavigate: (route: string) => void;
}

export const AdminLoginPage: React.FC<AdminLoginPageProps> = ({
  onAdminLoginSuccess,
  onNavigate,
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [authSuccess, setAuthSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await api.adminLogin({ email, password });
      if (res && res.user) {
        // 1. Correctly update local component state
        setError(null);
        setPassword('');
        setAuthSuccess(true);

        // 2. Propagate authenticated user data to parent state
        onAdminLoginSuccess(res.user);

        // 3. Explicitly redirect to /admin console
        onNavigate('/admin');
      } else {
        throw new Error('Authentication succeeded but administrator credentials could not be verified.');
      }
    } catch (err: any) {
      setError(err.message || 'Invalid administrator credentials');
      setAuthSuccess(false);
    } finally {
      setLoading(false);
    }
  };

  const fillAdminCredentials = () => {
    setEmail('admin@atelier.com');
    setPassword('AdminPassword123!');
    setError(null);
  };

  return (
    <div className="max-w-md mx-auto px-6 py-20">
      <div className="bg-[#F2F1ED] border-2 border-[#17181C] p-8 space-y-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-[#2F4739] inline-block" />
            <p className="text-xs text-[#8B7A72] tracking-wider uppercase font-mono">
              Restricted management console
            </p>
          </div>
          <h1 className="text-3xl font-serif text-[#17181C] font-normal">
            Administrator login
          </h1>
          <p className="text-xs text-[#8B7A72]">
            Access restricted strictly to accounts with administrator privileges (<span className="font-mono">role = admin</span>).
          </p>
        </div>

        {error && (
          <div className="p-3 bg-[rgba(139,38,29,0.06)] border border-[#8B261D] text-xs text-[#8B261D]">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Administrator email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="admin@atelier.com"
            required
          />

          <Input
            label="Passphrase"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <div className="pt-2">
            <Button
              type="submit"
              variant="primary"
              fullWidth
              size="lg"
              disabled={loading}
            >
              {loading ? 'Authenticating...' : 'Access console'}
            </Button>
          </div>
        </form>

        <div className="pt-3 border-t border-[rgba(139,122,114,0.15)] flex flex-col items-center gap-3 text-xs">
          <button
            type="button"
            onClick={fillAdminCredentials}
            className="text-[#2F4739] hover:underline cursor-pointer font-medium"
          >
            Fill pre-configured administrator credentials
          </button>

          <button
            type="button"
            onClick={() => onNavigate('/')}
            className="text-[#8B7A72] hover:text-[#17181C] underline cursor-pointer"
          >
            ← Return to public storefront
          </button>
        </div>
      </div>
    </div>
  );
};
