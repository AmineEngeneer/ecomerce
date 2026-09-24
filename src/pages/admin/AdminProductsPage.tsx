import React, { useState, useEffect, useRef } from 'react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { Dialog } from '../../components/ui/Dialog';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/Table';
import { Product, Category, api } from '../../lib/api';

export const AdminProductsPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modal form state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formName, setFormName] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formPrice, setFormPrice] = useState<string>('0');
  const [formStock, setFormStock] = useState<string>('0');
  const [formCategoryId, setFormCategoryId] = useState('');
  const [formImages, setFormImages] = useState<string[]>([]);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [prodRes, catRes] = await Promise.all([
        api.getAdminProducts(),
        api.getAdminCategories(),
      ]);
      setProducts(prodRes.products);
      setCategories(catRes.categories);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditingProduct(null);
    setFormName('');
    setFormDesc('');
    setFormPrice('0');
    setFormStock('10');
    setFormCategoryId(categories[0]?.id || '');
    setFormImages([]);
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (p: Product) => {
    setEditingProduct(p);
    setFormName(p.name);
    setFormDesc(p.description);
    setFormPrice(p.price.toString());
    setFormStock(p.stock.toString());
    setFormCategoryId(p.categoryId);
    setFormImages(p.images.map((img) => img.url));
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    setFormError(null);
    try {
      const res = await api.uploadImage(file);
      setFormImages((prev) => [...prev, res.url]);
    } catch (err: any) {
      setFormError(err.message || 'Image upload failed');
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemoveImage = (index: number) => {
    setFormImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const price = parseFloat(formPrice);
    const stock = parseInt(formStock, 10);

    if (!formName.trim()) return setFormError('Product name is required');
    if (!formDesc.trim()) return setFormError('Product description is required');
    if (isNaN(price) || price <= 0) return setFormError('Price must be greater than 0');
    if (isNaN(stock) || stock < 0) return setFormError('Stock cannot be negative');
    if (!formCategoryId) return setFormError('Please select a category');

    setSaving(true);
    try {
      const payload = {
        name: formName,
        description: formDesc,
        price,
        stock,
        categoryId: formCategoryId,
        images: formImages.length > 0 ? formImages : ['/src/assets/images/product_ceramic_vessel_1790242838659.jpg'],
      };

      if (editingProduct) {
        await api.updateProduct(editingProduct.id, payload);
      } else {
        await api.createProduct(payload);
      }

      setIsModalOpen(false);
      await loadData();
    } catch (err: any) {
      setFormError(err.message || 'Failed to save product');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteProduct = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to remove "${name}" from the catalog?`)) return;
    try {
      const res = await api.deleteProduct(id);
      if (res.message) alert(res.message);
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to delete product');
    }
  };

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.category?.name.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="border-b border-[rgba(139,122,114,0.2)] pb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-xs text-[#8B7A72] tracking-wider uppercase mb-1">Catalog management</p>
          <h1 className="text-3xl font-serif text-[#17181C] font-normal">
            Products & inventory
          </h1>
        </div>

        <Button variant="primary" onClick={openCreateModal}>
          Add new piece
        </Button>
      </div>

      {/* Filter and Search */}
      <div className="flex items-center justify-between gap-4">
        <div className="w-72">
          <Input
            placeholder="Search piece by title or discipline..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="py-1.5 text-xs"
          />
        </div>
        <p className="text-xs text-[#8B7A72]">
          {filteredProducts.length} pieces registered
        </p>
      </div>

      {/* Table */}
      <div className="border border-[rgba(139,122,114,0.2)] bg-[#F2F1ED]">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Piece</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Inventory</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12 text-xs text-[#8B7A72]">
                  Loading catalog records...
                </TableCell>
              </TableRow>
            ) : filteredProducts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12 text-xs text-[#8B7A72]">
                  No products found.
                </TableCell>
              </TableRow>
            ) : (
              filteredProducts.map((p) => {
                const primaryImage = p.images[0]?.url || '/placeholder.png';
                return (
                  <TableRow key={p.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-[#E8E6DF] border border-[rgba(139,122,114,0.2)] overflow-hidden shrink-0">
                          <img src={primaryImage} alt="" className="w-full h-full object-cover" />
                        </div>
                        <div>
                          <p className="text-xs font-medium text-[#17181C]">{p.name}</p>
                          <p className="text-[11px] text-[#8B7A72] line-clamp-1 max-w-xs">{p.description}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs">
                      {p.category?.name || 'Unassigned'}
                    </TableCell>
                    <TableCell className="text-xs font-medium tabular-nums">
                      ${p.price.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-xs tabular-nums">
                      {p.stock} units
                    </TableCell>
                    <TableCell>
                      {p.stock > 5 ? (
                        <Badge variant="forest">In stock</Badge>
                      ) : p.stock > 0 ? (
                        <Badge variant="brass">Low stock</Badge>
                      ) : (
                        <Badge variant="stone">Depleted</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-3 text-xs">
                        <button
                          onClick={() => openEditModal(p)}
                          className="text-[#17181C] hover:text-[#A6824C] underline cursor-pointer"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(p.id, p.name)}
                          className="text-[#8B7A72] hover:text-[#8B261D] underline cursor-pointer"
                        >
                          Delete
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Product Form Modal */}
      <Dialog
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingProduct ? 'Edit product piece' : 'Register new piece'}
      >
        {formError && (
          <div className="p-3 mb-4 bg-[rgba(139,38,29,0.06)] border border-[#8B261D] text-xs text-[#8B261D]">
            {formError}
          </div>
        )}

        <form onSubmit={handleSaveProduct} className="space-y-4">
          <Input
            label="Product name *"
            value={formName}
            onChange={(e) => setFormName(e.target.value)}
            placeholder="e.g. Stoneware Ceramic Vessel"
            required
          />

          <div>
            <label className="block text-xs font-medium text-[#17181C] mb-1">
              Category medium *
            </label>
            <select
              value={formCategoryId}
              onChange={(e) => setFormCategoryId(e.target.value)}
              className="w-full bg-[#F2F1ED] border border-[rgba(139,122,114,0.3)] px-3 py-2 text-xs text-[#17181C] focus:border-[#A6824C] focus:outline-none"
              style={{ borderRadius: '2px' }}
              required
            >
              <option value="" disabled>Select category discipline</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Price (USD) *"
              type="number"
              step="0.01"
              min="0.01"
              value={formPrice}
              onChange={(e) => setFormPrice(e.target.value)}
              required
            />
            <Input
              label="Initial stock units *"
              type="number"
              min="0"
              value={formStock}
              onChange={(e) => setFormStock(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#17181C] mb-1">
              Curator description *
            </label>
            <textarea
              rows={3}
              value={formDesc}
              onChange={(e) => setFormDesc(e.target.value)}
              placeholder="Materials, origin studio, tactile finish..."
              className="w-full bg-[#F2F1ED] border border-[rgba(139,122,114,0.3)] p-3 text-xs text-[#17181C] focus:border-[#A6824C] focus:outline-none"
              style={{ borderRadius: '2px' }}
              required
            />
          </div>

          {/* Local File Upload Section */}
          <div className="space-y-2 pt-2 border-t border-[rgba(139,122,114,0.15)]">
            <label className="block text-xs font-medium text-[#17181C]">
              Product imagery (Local disk uploads)
            </label>

            <div className="flex items-center gap-3">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
              />
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingImage}
              >
                {uploadingImage ? 'Uploading file...' : 'Choose image from disk'}
              </Button>
              <span className="text-[11px] text-[#8B7A72]">
                Supports PNG, JPEG, WebP (Max 10MB)
              </span>
            </div>

            {/* Images Preview Grid */}
            <div className="flex flex-wrap gap-3 pt-2">
              {formImages.map((url, i) => (
                <div key={i} className="relative w-16 h-16 border border-[rgba(139,122,114,0.3)] group overflow-hidden">
                  <img src={url} alt="" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(i)}
                    className="absolute inset-0 bg-[#17181C]/70 text-[#F2F1ED] text-[10px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                  >
                    Remove
                  </button>
                </div>
              ))}
              {formImages.length === 0 && (
                <p className="text-[11px] text-[#8B7A72] italic">
                  No custom images uploaded yet. Default atelier asset will be assigned.
                </p>
              )}
            </div>
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
              {saving ? 'Saving...' : editingProduct ? 'Save changes' : 'Create piece'}
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
};
