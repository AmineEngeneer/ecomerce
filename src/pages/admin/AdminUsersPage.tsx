import React, { useState, useEffect } from 'react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Dialog } from '../../components/ui/Dialog';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/Table';
import { User, api } from '../../lib/api';

export const AdminUsersPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('United States');
  const [postalCode, setPostalCode] = useState('');

  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const res = await api.getAdminUsers();
      setUsers(res.users);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditingUser(null);
    setName('');
    setEmail('');
    setPassword('');
    setPhone('');
    setAddress('');
    setCity('');
    setCountry('United States');
    setPostalCode('');
    setError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (u: User) => {
    setEditingUser(u);
    setName(u.name);
    setEmail(u.email);
    setPassword('');
    setPhone(u.phone || '');
    setAddress(u.address || '');
    setCity(u.city || '');
    setCountry(u.country || 'United States');
    setPostalCode(u.postalCode || '');
    setError(null);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) return setError('Name is required');

    setSaving(true);
    try {
      if (editingUser) {
        await api.updateAdminUser(editingUser.id, {
          name,
          phone: phone || null,
          address: address || null,
          city: city || null,
          country: country || null,
          postalCode: postalCode || null,
        });
      } else {
        if (!email.trim()) return setError('Email is required');
        if (password.length < 6) return setError('Password must be at least 6 characters');
        await api.createAdminUser({
          name,
          email,
          password,
          phone: phone || null,
          address: address || null,
          city: city || null,
          country: country || null,
          postalCode: postalCode || null,
        });
      }

      setIsModalOpen(false);
      await loadUsers();
    } catch (err: any) {
      setError(err.message || 'Failed to save customer');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (u: User) => {
    if (!confirm(`Delete client account for ${u.name} (${u.email})?`)) return;
    try {
      await api.deleteAdminUser(u.id);
      await loadUsers();
    } catch (err: any) {
      alert(err.message || 'Failed to delete client');
    }
  };

  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-8">
      <div className="border-b border-[rgba(139,122,114,0.2)] pb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-xs text-[#8B7A72] tracking-wider uppercase mb-1">Customer registry</p>
          <h1 className="text-3xl font-serif text-[#17181C] font-normal">
            Customer accounts
          </h1>
        </div>

        <Button variant="primary" onClick={openCreateModal}>
          Register new customer
        </Button>
      </div>

      <div className="flex items-center justify-between gap-4">
        <div className="w-72">
          <Input
            placeholder="Search by client name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="py-1.5 text-xs"
          />
        </div>
        <p className="text-xs text-[#8B7A72]">
          {filteredUsers.length} customer records
        </p>
      </div>

      <div className="border border-[rgba(139,122,114,0.2)] bg-[#F2F1ED]">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Customer</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Location</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-12 text-xs text-[#8B7A72]">
                  Loading customer records...
                </TableCell>
              </TableRow>
            ) : filteredUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-12 text-xs text-[#8B7A72]">
                  No customers found.
                </TableCell>
              </TableRow>
            ) : (
              filteredUsers.map((u) => (
                <TableRow key={u.id}>
                  <TableCell className="font-medium text-xs text-[#17181C]">
                    {u.name}
                  </TableCell>
                  <TableCell className="text-xs text-[#8B7A72] font-mono">
                    {u.email}
                  </TableCell>
                  <TableCell className="text-xs text-[#8B7A72]">
                    {u.phone || '—'}
                  </TableCell>
                  <TableCell className="text-xs text-[#8B7A72]">
                    {u.city ? `${u.city}, ${u.country || ''}` : '—'}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-3 text-xs">
                      <button
                        onClick={() => openEditModal(u)}
                        className="text-[#17181C] hover:text-[#A6824C] underline cursor-pointer"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(u)}
                        className="text-[#8B7A72] hover:text-[#8B261D] underline cursor-pointer"
                      >
                        Delete
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* User Modal */}
      <Dialog
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingUser ? 'Edit customer profile' : 'Create customer account'}
      >
        {error && (
          <div className="p-3 mb-4 bg-[rgba(139,38,29,0.06)] border border-[#8B261D] text-xs text-[#8B261D]">
            {error}
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-4">
          <Input
            label="Full name *"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Marcus Aurelius"
            required
          />

          {!editingUser && (
            <>
              <Input
                label="Email address *"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="client@atelier.com"
                required
              />

              <Input
                label="Initial password *"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </>
          )}

          <Input
            label="Phone number"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+1 (503) 555-0199"
          />

          <Input
            label="Street address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="742 Evergreen Terrace"
          />

          <div className="grid grid-cols-3 gap-3">
            <Input
              label="City"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Portland"
            />
            <Input
              label="Postal code"
              value={postalCode}
              onChange={(e) => setPostalCode(e.target.value)}
              placeholder="97201"
            />
            <Input
              label="Country"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              placeholder="United States"
            />
          </div>

          <div className="pt-4 border-t border-[rgba(139,122,114,0.2)] flex justify-end gap-3">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setIsModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={saving}
            >
              {saving ? 'Saving...' : editingUser ? 'Update customer' : 'Create customer'}
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
};
