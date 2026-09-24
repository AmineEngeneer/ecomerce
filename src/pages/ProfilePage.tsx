import React, { useState, useEffect } from 'react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { User, PaymentMethod, api } from '../lib/api';

interface ProfilePageProps {
  user: User | null;
  onUpdateUser: (user: User) => void;
  onLogout: () => void;
  onNavigate: (route: string) => void;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({
  user,
  onUpdateUser,
  onLogout,
  onNavigate,
}) => {
  const [profileForm, setProfileForm] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    address: user?.address || '',
    city: user?.city || '',
    country: user?.country || '',
    postalCode: user?.postalCode || '',
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [newCardForm, setNewCardForm] = useState({
    provider: 'Visa',
    last4: '4242',
    expMonth: 12,
    expYear: 2028,
  });
  const [showAddCard, setShowAddCard] = useState(false);

  const [profileMsg, setProfileMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [passwordMsg, setPasswordMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  useEffect(() => {
    if (user) {
      setProfileForm({
        name: user.name || '',
        phone: user.phone || '',
        address: user.address || '',
        city: user.city || '',
        country: user.country || '',
        postalCode: user.postalCode || '',
      });
      loadPaymentMethods();
    }
  }, [user]);

  const loadPaymentMethods = async () => {
    try {
      const res = await api.getPaymentMethods();
      setPaymentMethods(res.paymentMethods);
    } catch (err) {
      console.error(err);
    }
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileMsg(null);
    setSavingProfile(true);
    try {
      const res = await api.updateProfile(profileForm);
      onUpdateUser(res.user);
      setProfileMsg({ type: 'success', text: 'Profile details successfully updated.' });
    } catch (err: any) {
      setProfileMsg({ type: 'error', text: err.message || 'Failed to update profile' });
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMsg(null);

    if (passwordForm.newPassword.length < 6) {
      setPasswordMsg({ type: 'error', text: 'New password must be at least 6 characters' });
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordMsg({ type: 'error', text: 'New passwords do not match' });
      return;
    }

    setSavingPassword(true);
    try {
      await api.changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      setPasswordMsg({ type: 'success', text: 'Password successfully modified.' });
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err: any) {
      setPasswordMsg({ type: 'error', text: err.message || 'Password update failed' });
    } finally {
      setSavingPassword(false);
    }
  };

  const handleAddCard = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.addPaymentMethod({
        type: 'card',
        provider: newCardForm.provider,
        last4: newCardForm.last4,
        expMonth: Number(newCardForm.expMonth),
        expYear: Number(newCardForm.expYear),
        isDefault: paymentMethods.length === 0,
      });
      setShowAddCard(false);
      await loadPaymentMethods();
    } catch (err: any) {
      alert(err.message || 'Could not add payment method');
    }
  };

  const handleDeleteCard = async (id: string) => {
    if (!confirm('Remove this saved payment method?')) return;
    try {
      await api.deletePaymentMethod(id);
      await loadPaymentMethods();
    } catch (err: any) {
      alert(err.message || 'Failed to remove card');
    }
  };

  if (!user) {
    return (
      <div className="max-w-md mx-auto px-6 py-24 text-center space-y-4">
        <h2 className="text-2xl font-serif text-[#17181C]">Sign in to access your profile</h2>
        <div className="flex justify-center gap-4 pt-2">
          <Button variant="primary" onClick={() => onNavigate('/login')}>
            Sign in
          </Button>
          <Button variant="secondary" onClick={() => onNavigate('/signup')}>
            Create account
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-12 space-y-16">
      {/* Header */}
      <div className="border-b border-[rgba(139,122,114,0.2)] pb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-xs text-[#8B7A72] tracking-wider uppercase mb-1">
            Customer credentials & preferences
          </p>
          <h1 className="text-4xl font-serif text-[#17181C] font-normal">
            Account profile
          </h1>
          <p className="text-xs text-[#8B7A72] mt-1 font-mono">{user.email}</p>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="secondary" size="sm" onClick={() => onNavigate('/orders')}>
            View orders
          </Button>
          <Button variant="danger" size="sm" onClick={onLogout}>
            Sign out
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Left Column: Personal info form */}
        <div className="lg:col-span-7 space-y-8">
          <div className="bg-[#F2F1ED] p-8 border border-[rgba(139,122,114,0.2)] space-y-6">
            <div>
              <h2 className="text-xl font-serif text-[#17181C]">Delivery & personal info</h2>
              <p className="text-xs text-[#8B7A72] mt-1">
                Your defaults used during one-click checkout.
              </p>
            </div>

            {profileMsg && (
              <div
                className={`p-3 text-xs border ${
                  profileMsg.type === 'success'
                    ? 'border-[#2F4739] text-[#2F4739] bg-[rgba(47,71,57,0.06)]'
                    : 'border-[#8B261D] text-[#8B261D] bg-[rgba(139,38,29,0.06)]'
                }`}
              >
                {profileMsg.text}
              </div>
            )}

            <form onSubmit={handleProfileSubmit} className="space-y-4">
              <Input
                label="Full name"
                value={profileForm.name}
                onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                required
              />

              <Input
                label="Phone number"
                value={profileForm.phone}
                onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                placeholder="+1 (503) 555-0199"
              />

              <Input
                label="Street address"
                value={profileForm.address}
                onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
                placeholder="742 Evergreen Terrace"
              />

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Input
                  label="City"
                  value={profileForm.city}
                  onChange={(e) => setProfileForm({ ...profileForm, city: e.target.value })}
                  placeholder="Portland"
                />
                <Input
                  label="Postal code"
                  value={profileForm.postalCode}
                  onChange={(e) => setProfileForm({ ...profileForm, postalCode: e.target.value })}
                  placeholder="97201"
                />
                <Input
                  label="Country"
                  value={profileForm.country}
                  onChange={(e) => setProfileForm({ ...profileForm, country: e.target.value })}
                  placeholder="United States"
                />
              </div>

              <div className="pt-2">
                <Button type="submit" variant="primary" disabled={savingProfile}>
                  {savingProfile ? 'Saving updates...' : 'Save changes'}
                </Button>
              </div>
            </form>
          </div>

          {/* Payment Methods Section (Section 6) */}
          <div className="bg-[#F2F1ED] p-8 border border-[rgba(139,122,114,0.2)] space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-serif text-[#17181C]">Saved payment methods</h2>
                <p className="text-xs text-[#8B7A72] mt-1">
                  Safe payment abstraction. No raw card numbers or CVVs are stored.
                </p>
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setShowAddCard(!showAddCard)}
              >
                {showAddCard ? 'Cancel' : 'Add card'}
              </Button>
            </div>

            {showAddCard && (
              <form onSubmit={handleAddCard} className="p-4 border border-[rgba(139,122,114,0.2)] space-y-4 bg-white/40">
                <p className="text-xs font-medium text-[#17181C]">Add payment method token</p>
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    label="Card brand"
                    value={newCardForm.provider}
                    onChange={(e) => setNewCardForm({ ...newCardForm, provider: e.target.value })}
                    placeholder="Visa, Mastercard, Amex"
                    required
                  />
                  <Input
                    label="Last 4 digits"
                    value={newCardForm.last4}
                    maxLength={4}
                    onChange={(e) => setNewCardForm({ ...newCardForm, last4: e.target.value })}
                    placeholder="4242"
                    required
                  />
                  <Input
                    label="Expiry month (1-12)"
                    type="number"
                    min={1}
                    max={12}
                    value={newCardForm.expMonth}
                    onChange={(e) => setNewCardForm({ ...newCardForm, expMonth: Number(e.target.value) })}
                    required
                  />
                  <Input
                    label="Expiry year"
                    type="number"
                    min={2025}
                    max={2040}
                    value={newCardForm.expYear}
                    onChange={(e) => setNewCardForm({ ...newCardForm, expYear: Number(e.target.value) })}
                    required
                  />
                </div>
                <Button type="submit" variant="primary" size="sm">
                  Save payment token
                </Button>
              </form>
            )}

            <div className="space-y-3">
              {paymentMethods.length === 0 ? (
                <p className="text-xs text-[#8B7A72]">No saved payment methods yet.</p>
              ) : (
                paymentMethods.map((pm) => (
                  <div
                    key={pm.id}
                    className="flex items-center justify-between p-3.5 border border-[rgba(139,122,114,0.2)] bg-[#F2F1ED]"
                  >
                    <div>
                      <p className="text-xs font-medium text-[#17181C]">
                        {pm.provider} •••• {pm.last4}
                        {pm.isDefault && (
                          <span className="ml-2 text-[10px] text-[#2F4739] border border-[rgba(47,71,57,0.3)] px-1.5 py-0.5">
                            Default
                          </span>
                        )}
                      </p>
                      <p className="text-[11px] text-[#8B7A72]">
                        Expires {pm.expMonth}/{pm.expYear}
                      </p>
                    </div>
                    <button
                      onClick={() => handleDeleteCard(pm.id)}
                      className="text-xs text-[#8B7A72] hover:text-[#8B261D] underline cursor-pointer"
                    >
                      Delete
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Password and Quick Links */}
        <div className="lg:col-span-5 space-y-8">
          <div className="bg-[#F2F1ED] p-8 border border-[rgba(139,122,114,0.2)] space-y-6">
            <div>
              <h2 className="text-xl font-serif text-[#17181C]">Change password</h2>
              <p className="text-xs text-[#8B7A72] mt-1">
                Protect your account with a unique passphrase.
              </p>
            </div>

            {passwordMsg && (
              <div
                className={`p-3 text-xs border ${
                  passwordMsg.type === 'success'
                    ? 'border-[#2F4739] text-[#2F4739] bg-[rgba(47,71,57,0.06)]'
                    : 'border-[#8B261D] text-[#8B261D] bg-[rgba(139,38,29,0.06)]'
                }`}
              >
                {passwordMsg.text}
              </div>
            )}

            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <Input
                label="Current password"
                type="password"
                value={passwordForm.currentPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                required
              />
              <Input
                label="New password"
                type="password"
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                required
              />
              <Input
                label="Confirm new password"
                type="password"
                value={passwordForm.confirmPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                required
              />

              <div className="pt-2">
                <Button type="submit" variant="secondary" fullWidth disabled={savingPassword}>
                  {savingPassword ? 'Updating...' : 'Update password'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
