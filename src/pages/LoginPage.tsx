import React, { useState } from 'react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { User, api } from '../lib/api';

interface LoginPageProps {
  onLoginSuccess: (user: User) => void;
  onNavigate: (route: string) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess, onNavigate }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await api.login({ email, password });
      onLoginSuccess(res.user);
      onNavigate('/');
    } catch (err: any) {
      setError(err.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  const fillCustomerDemo = () => {
    setEmail('customer@atelier.com');
    setPassword('CustomerPassword123!');
    setError(null);
  };

  return (
    <div className="max-w-md mx-auto px-6 py-20">
      <div className="bg-[#F2F1ED] border border-[rgba(139,122,114,0.2)] p-8 space-y-6">
        <div className="space-y-1">
          <p className="text-xs text-[#8B7A72] tracking-wider uppercase">Customer account</p>
          <h1 className="text-3xl font-serif text-[#17181C] font-normal">
            Sign in
          </h1>
          <p className="text-xs text-[#8B7A72]">
            Access your orders, saved addresses, and active shopping basket.
          </p>
        </div>

        {error && (
          <div className="p-3 bg-[rgba(139,38,29,0.06)] border border-[#8B261D] text-xs text-[#8B261D] space-y-1">
            <p>{error}</p>
            {error.includes('No account found') && (
              <button
                type="button"
                onClick={() => onNavigate('/signup')}
                className="underline font-medium hover:text-[#17181C] cursor-pointer block mt-1"
              >
                Click here to create a new account →
              </button>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Email address"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@domain.com"
            required
          />

          <Input
            label="Password"
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
              {loading ? 'Signing in...' : 'Sign in'}
            </Button>
          </div>
        </form>

        <div className="pt-3 border-t border-[rgba(139,122,114,0.15)] flex flex-col items-center gap-3 text-xs">
          <button
            type="button"
            onClick={fillCustomerDemo}
            className="text-[#2F4739] hover:underline cursor-pointer font-medium"
          >
            Fill demo customer credentials (Clara O’Neill)
          </button>

          <div className="flex items-center gap-2 text-[#8B7A72]">
            <span>Don’t have an account?</span>
            <button
              onClick={() => onNavigate('/signup')}
              className="text-[#17181C] hover:text-[#A6824C] underline cursor-pointer font-medium"
            >
              Create an account
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
