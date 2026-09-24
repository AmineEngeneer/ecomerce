import React, { useState, useEffect } from 'react';
import { Category, api } from '../lib/api';

interface CategoriesPageProps {
  onNavigate: (route: string) => void;
}

export const CategoriesPage: React.FC<CategoriesPageProps> = ({ onNavigate }) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const res = await api.getCategories();
      setCategories(res.categories);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-12 space-y-12">
      <div className="border-b border-[rgba(139,122,114,0.2)] pb-6">
        <p className="text-xs text-[#8B7A72] tracking-wider uppercase mb-1">Catalog taxonomy</p>
        <h1 className="text-4xl font-serif text-[#17181C] font-normal">
          Disciplines & mediums
        </h1>
        <p className="mt-2 text-sm text-[#8B7A72]">
          Browse our collections structured by material craftsmanship and technique.
        </p>
      </div>

      {loading ? (
        <div className="py-24 text-center text-sm text-[#8B7A72]">
          Loading mediums...
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {categories.map((cat) => (
            <div
              key={cat.id}
              onClick={() => onNavigate(`/products?category=${cat.slug}`)}
              className="group border border-[rgba(139,122,114,0.2)] bg-[#F2F1ED] p-8 hover:border-[#A6824C] transition-colors cursor-pointer flex flex-col justify-between min-h-[220px]"
              style={{ borderRadius: 0 }}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono text-[#8B7A72] tracking-wide uppercase">
                    {cat.slug}
                  </span>
                  <span className="text-xs font-medium tabular-nums text-[#2F4739] bg-[rgba(47,71,57,0.08)] px-2 py-0.5 border border-[rgba(47,71,57,0.2)]">
                    {cat._count?.products || 0} active pieces
                  </span>
                </div>
                <h2 className="text-2xl font-serif text-[#17181C] group-hover:text-[#A6824C] transition-colors">
                  {cat.name}
                </h2>
                <p className="text-sm text-[#8B7A72] leading-relaxed">
                  {cat.description || 'Artisanal homeware crafted with natural materials and traditional methods.'}
                </p>
              </div>

              <div className="pt-6 border-t border-[rgba(139,122,114,0.15)] flex items-center justify-between text-xs text-[#17181C] font-medium">
                <span>View collection pieces</span>
                <span className="group-hover:translate-x-1 transition-transform">→</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
