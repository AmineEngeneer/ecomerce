import React, { useState, useEffect } from 'react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Dialog } from '../../components/ui/Dialog';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/Table';
import { Category, api } from '../../lib/api';

export const AdminCategoriesPage: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    setLoading(true);
    try {
      const res = await api.getAdminCategories();
      setCategories(res.categories);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditingCategory(null);
    setName('');
    setSlug('');
    setDescription('');
    setError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (cat: Category) => {
    setEditingCategory(cat);
    setName(cat.name);
    setSlug(cat.slug);
    setDescription(cat.description || '');
    setError(null);
    setIsModalOpen(true);
  };

  const handleNameChange = (val: string) => {
    setName(val);
    if (!editingCategory) {
      setSlug(
        val
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)+/g, ''),
      );
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim() || !slug.trim()) {
      return setError('Name and slug are required');
    }

    setSaving(true);
    try {
      const payload = {
        name,
        slug,
        description: description.trim() || undefined,
      };

      if (editingCategory) {
        await api.updateCategory(editingCategory.id, payload);
      } else {
        await api.createCategory(payload);
      }

      setIsModalOpen(false);
      await loadCategories();
    } catch (err: any) {
      setError(err.message || 'Failed to save category');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (cat: Category) => {
    if (cat._count && cat._count.products > 0) {
      alert(`Cannot delete "${cat.name}": It has ${cat._count.products} active piece(s) assigned to it.`);
      return;
    }

    if (!confirm(`Delete category "${cat.name}"?`)) return;

    try {
      await api.deleteCategory(cat.id);
      await loadCategories();
    } catch (err: any) {
      alert(err.message || 'Failed to delete category');
    }
  };

  return (
    <div className="space-y-8">
      <div className="border-b border-[rgba(139,122,114,0.2)] pb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-xs text-[#8B7A72] tracking-wider uppercase mb-1">Catalog taxonomy</p>
          <h1 className="text-3xl font-serif text-[#17181C] font-normal">
            Product categories
          </h1>
        </div>

        <Button variant="primary" onClick={openCreateModal}>
          Add new category
        </Button>
      </div>

      <div className="border border-[rgba(139,122,114,0.2)] bg-[#F2F1ED]">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Category name</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Assigned pieces</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-12 text-xs text-[#8B7A72]">
                  Loading categories...
                </TableCell>
              </TableRow>
            ) : categories.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-12 text-xs text-[#8B7A72]">
                  No categories defined.
                </TableCell>
              </TableRow>
            ) : (
              categories.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium text-xs text-[#17181C]">
                    {c.name}
                  </TableCell>
                  <TableCell className="font-mono text-xs text-[#8B7A72]">
                    {c.slug}
                  </TableCell>
                  <TableCell className="text-xs text-[#8B7A72] max-w-sm line-clamp-1">
                    {c.description || '—'}
                  </TableCell>
                  <TableCell className="text-xs tabular-nums">
                    <span className="font-medium">{c._count?.products || 0}</span> pieces
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-3 text-xs">
                      <button
                        onClick={() => openEditModal(c)}
                        className="text-[#17181C] hover:text-[#A6824C] underline cursor-pointer"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(c)}
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

      {/* Category Modal */}
      <Dialog
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingCategory ? 'Edit category' : 'Create category'}
      >
        {error && (
          <div className="p-3 mb-4 bg-[rgba(139,38,29,0.06)] border border-[#8B261D] text-xs text-[#8B261D]">
            {error}
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-4">
          <Input
            label="Category name *"
            value={name}
            onChange={(e) => handleNameChange(e.target.value)}
            placeholder="e.g. Sculptural Glass"
            required
          />

          <Input
            label="URL slug *"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            placeholder="sculptural-glass"
            required
          />

          <div>
            <label className="block text-xs font-medium text-[#17181C] mb-1">
              Description
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Craft description or historical medium background..."
              className="w-full bg-[#F2F1ED] border border-[rgba(139,122,114,0.3)] p-3 text-xs text-[#17181C] focus:border-[#A6824C] focus:outline-none"
              style={{ borderRadius: '2px' }}
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
              {saving ? 'Saving...' : editingCategory ? 'Save changes' : 'Create category'}
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
};
