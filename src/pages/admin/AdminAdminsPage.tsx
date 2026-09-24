import React, { useState, useEffect } from 'react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Dialog } from '../../components/ui/Dialog';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/Table';
import { User, api } from '../../lib/api';

interface AdminAdminsPageProps {
  currentUser: User | null;
}

export const AdminAdminsPage: React.FC<AdminAdminsPageProps> = ({ currentUser }) => {
  const [admins, setAdmins] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState<User | null>(null);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadAdmins();
  }, []);

  const loadAdmins = async () => {
    setLoading(true);
    try {
      const res = await api.getAdminAdmins();
      setAdmins(res.admins);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditingAdmin(null);
    setName('');
    setEmail('');
    setPassword('');
    setError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (a: User) => {
    setEditingAdmin(a);
    setName(a.name);
    setEmail(a.email);
    setPassword('');
    setError(null);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim() || !email.trim()) {
      return setError('Name and email are required');
    }

    setSaving(true);
    try {
      if (editingAdmin) {
        await api.updateAdmin(editingAdmin.id, {
          name,
          email,
          password: password ? password : undefined,
        });
      } else {
        if (password.length < 8) {
          setSaving(false);
          return setError('Admin password must be at least 8 characters');
        }
        await api.createAdmin({ name, email, password });
      }

      setIsModalOpen(false);
      await loadAdmins();
    } catch (err: any) {
      setError(err.message || 'Failed to save administrator');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (a: User) => {
    if (admins.length <= 1) {
      alert('Action blocked: Cannot delete the last administrator in the system.');
      return;
    }

    if (currentUser?.id === a.id) {
      alert('You cannot delete your own administrator account while logged in.');
      return;
    }

    if (!confirm(`Are you sure you want to revoke administrator access for ${a.name} (${a.email})?`)) {
      return;
    }

    try {
      await api.deleteAdmin(a.id);
      await loadAdmins();
    } catch (err: any) {
      alert(err.message || 'Failed to remove administrator');
    }
  };

  return (
    <div className="space-y-8">
      <div className="border-b border-[rgba(139,122,114,0.2)] pb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-xs text-[#8B7A72] tracking-wider uppercase mb-1">Security & privileges</p>
          <h1 className="text-3xl font-serif text-[#17181C] font-normal">
            Administrator accounts
          </h1>
          <p className="text-xs text-[#8B7A72] mt-1">
            Accounts with full console privileges (<span className="font-mono">role = admin</span>). Cannot delete the last active administrator.
          </p>
        </div>

        <Button variant="primary" onClick={openCreateModal}>
          Add administrator
        </Button>
      </div>

      <div className="border border-[rgba(139,122,114,0.2)] bg-[#F2F1ED]">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Administrator</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-12 text-xs text-[#8B7A72]">
                  Loading administrators...
                </TableCell>
              </TableRow>
            ) : (
              admins.map((a) => {
                const isSelf = currentUser?.id === a.id;
                const isOnlyAdmin = admins.length <= 1;

                return (
                  <TableRow key={a.id}>
                    <TableCell className="font-medium text-xs text-[#17181C]">
                      {a.name} {isSelf && <span className="text-[#2F4739] text-[10px] ml-1">(You)</span>}
                    </TableCell>
                    <TableCell className="text-xs text-[#8B7A72] font-mono">
                      {a.email}
                    </TableCell>
                    <TableCell>
                      <span className="text-[11px] bg-[#17181C] text-[#F2F1ED] px-2 py-0.5 uppercase tracking-wider font-mono">
                        admin
                      </span>
                    </TableCell>
                    <TableCell className="text-xs text-[#8B7A72]">
                      {a.createdAt ? new Date(a.createdAt).toLocaleDateString() : '—'}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-3 text-xs">
                        <button
                          onClick={() => openEditModal(a)}
                          className="text-[#17181C] hover:text-[#A6824C] underline cursor-pointer"
                        >
                          Edit
                        </button>
                        {!isOnlyAdmin && !isSelf && (
                          <button
                            onClick={() => handleDelete(a)}
                            className="text-[#8B7A72] hover:text-[#8B261D] underline cursor-pointer"
                          >
                            Revoke
                          </button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Admin Modal */}
      <Dialog
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingAdmin ? 'Edit administrator' : 'Grant administrator privileges'}
      >
        {error && (
          <div className="p-3 mb-4 bg-[rgba(139,38,29,0.06)] border border-[#8B261D] text-xs text-[#8B261D]">
            {error}
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-4">
          <Input
            label="Administrator name *"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Lead Curator"
            required
          />

          <Input
            label="Email address *"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="admin@domain.com"
            required
          />

          <Input
            label={editingAdmin ? 'New passphrase (leave blank to retain current)' : 'Passphrase *'}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required={!editingAdmin}
            placeholder={editingAdmin ? '••••••••' : 'Minimum 8 characters'}
          />

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
              {saving ? 'Saving...' : editingAdmin ? 'Update admin' : 'Create administrator'}
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
};
