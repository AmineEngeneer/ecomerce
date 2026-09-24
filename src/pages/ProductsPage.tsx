import React, { useState, useEffect } from 'react';
import { ProductTile } from '../components/ui/ProductTile';
import { Input } from '../components/ui/Input';
import { Product, Category, api } from '../lib/api';

interface ProductsPageProps {
  initialCategory?: string;
  onNavigate: (route: string) => void;
  onAddToCart: (productId: string, e: React.MouseEvent) => void;
  onBuyNow: (productId: string, e: React.MouseEvent) => void;
}

export const ProductsPage: React.FC<ProductsPageProps> = ({
  initialCategory,
  onNavigate,
  onAddToCart,
  onBuyNow,
}) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory || 'all');
  const [search, setSearch] = useState<string>('');
  const [sort, setSort] = useState<string>('newest');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    loadProducts();
  }, [selectedCategory, search, sort]);

  const loadCategories = async () => {
    try {
      const res = await api.getCategories();
      setCategories(res.categories);
    } catch (err) {
      console.error(err);
    }
  };

  const loadProducts = async () => {
    setLoading(true);
    try {
      const res = await api.getProducts({
        category: selectedCategory === 'all' ? undefined : selectedCategory,
        search: search || undefined,
        sort: sort === 'newest' ? undefined : sort,
      });
      setProducts(res.products);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-12 space-y-12">
      {/* Header */}
      <div className="border-b border-[rgba(139,122,114,0.2)] pb-6">
        <p className="text-xs text-[#8B7A72] tracking-wider uppercase mb-1">Storefront catalog</p>
        <h1 className="text-4xl font-serif text-[#17181C] font-normal">
          All creations
        </h1>
        <p className="mt-2 text-sm text-[#8B7A72]">
          Curated collection of functional objects, stoneware ceramics, European flax linens, and unlacquered brass.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 pb-6 border-b border-[rgba(139,122,114,0.15)]">
        {/* Category tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-none">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`text-xs px-3 py-1.5 border transition-colors cursor-pointer whitespace-nowrap ${
              selectedCategory === 'all'
                ? 'bg-[#17181C] text-[#F2F1ED] border-[#17181C]'
                : 'bg-transparent text-[#17181C] border-[rgba(139,122,114,0.3)] hover:border-[#17181C]'
            }`}
            style={{ borderRadius: 0 }}
          >
            All mediums
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.slug)}
              className={`text-xs px-3 py-1.5 border transition-colors cursor-pointer whitespace-nowrap ${
                selectedCategory === cat.slug
                  ? 'bg-[#17181C] text-[#F2F1ED] border-[#17181C]'
                  : 'bg-transparent text-[#17181C] border-[rgba(139,122,114,0.3)] hover:border-[#17181C]'
              }`}
              style={{ borderRadius: 0 }}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Search & Sort Controls */}
        <div className="flex items-center gap-3">
          <div className="w-48 sm:w-64">
            <Input
              placeholder="Search catalog..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="py-1.5 text-xs"
            />
          </div>

          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="text-xs bg-[#F2F1ED] border border-[rgba(139,122,114,0.3)] px-3 py-2 text-[#17181C] focus:border-[#A6824C] focus:outline-none cursor-pointer"
            style={{ borderRadius: '2px' }}
          >
            <option value="newest">Newest first</option>
            <option value="price-asc">Price: low to high</option>
            <option value="price-desc">Price: high to low</option>
            <option value="name-asc">Name: A to Z</option>
          </select>
        </div>
      </div>

      {/* Product Grid */}
      {loading ? (
        <div className="py-24 text-center text-sm text-[#8B7A72]">
          Loading pieces...
        </div>
      ) : products.length === 0 ? (
        <div className="py-24 text-center space-y-3 border border-dashed border-[rgba(139,122,114,0.25)]">
          <p className="text-base font-serif text-[#17181C]">No items match your criteria</p>
          <p className="text-xs text-[#8B7A72]">Try clearing your search query or choosing another category filter.</p>
          <button
            onClick={() => {
              setSelectedCategory('all');
              setSearch('');
            }}
            className="text-xs underline text-[#17181C] hover:text-[#A6824C] cursor-pointer pt-2"
          >
            Reset filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.map((p) => (
            <ProductTile
              key={p.id}
              id={p.id}
              name={p.name}
              price={p.price}
              stock={p.stock}
              category={p.category?.name}
              image={p.images[0]?.url || '/placeholder.png'}
              onSelect={(id) => onNavigate(`/product/${id}`)}
              onAddToCart={onAddToCart}
              onBuyNow={onBuyNow}
            />
          ))}
        </div>
      )}
    </div>
  );
};
