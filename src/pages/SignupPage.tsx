import React, { useState } from 'react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { User, api } from '../lib/api';

interface SignupPageProps {
  onSignupSuccess: (user: User) => void;
  onNavigate: (route: string) => void;
}

export const SignupPage: React.FC<SignupPageProps> = ({ onSignupSuccess, onNavigate }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    address: '',
    city: '',
    country: 'United States',
    postalCode: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      const res = await api.signup({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        phone: formData.phone || undefined,
        address: formData.address || undefined,
        city: formData.city || undefined,
        country: formData.country || undefined,
        postalCode: formData.postalCode || undefined,
      });

      onSignupSuccess(res.user);
      onNavigate('/');
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto px-6 py-16">
      <div className="bg-[#F2F1ED] border border-[rgba(139,122,114,0.2)] p-8 space-y-6">
        <div className="space-y-1">
          <p className="text-xs text-[#8B7A72] tracking-wider uppercase">New client registration</p>
          <h1 className="text-3xl font-serif text-[#17181C] font-normal">
            Create an account
          </h1>
          <p className="text-xs text-[#8B7A72]">
            Save delivery addresses, track craftsmanship orders, and maintain your collection basket.
          </p>
        </div>

        {error && (
          <div className="p-3 bg-[rgba(139,38,29,0.06)] border border-[#8B261D] text-xs text-[#8B261D]">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Full name *"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Eleanor Vance"
            required
          />

          <Input
            label="Email address *"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            placeholder="name@domain.com"
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Password *"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
            />
            <Input
              label="Confirm password *"
              type="password"
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              required
            />
          </div>

          <div className="pt-2 border-t border-[rgba(139,122,114,0.15)] space-y-4">
            <p className="text-xs text-[#8B7A72]">Optional default delivery details:</p>
            <Input
              label="Phone number"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="+1 (555) 000-0000"
            />
            <Input
              label="Street address"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="123 Artisan Way"
            />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Input
                label="City"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                placeholder="Portland"
              />
              <Input
                label="Postal code"
                value={formData.postalCode}
                onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                placeholder="97201"
              />
              <Input
                label="Country"
                value={formData.country}
                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                placeholder="United States"
              />
            </div>
          </div>

          <div className="pt-2">
            <Button
              type="submit"
              variant="primary"
              fullWidth
              size="lg"
              disabled={loading}
            >
              {loading ? 'Creating account...' : 'Create account'}
            </Button>
          </div>
        </form>

        <div className="pt-4 border-t border-[rgba(139,122,114,0.15)] text-center text-xs text-[#8B7A72]">
          <span>Already have an account? </span>
          <button
            onClick={() => onNavigate('/login')}
            className="text-[#17181C] hover:text-[#A6824C] underline cursor-pointer"
          >
            Sign in here
          </button>
        </div>
      </div>
    </div>
  );
};
