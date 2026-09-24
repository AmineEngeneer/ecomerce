import React from 'react';
import { Button } from '../components/ui/Button';
import { ProductTile } from '../components/ui/ProductTile';
import { Product, Category } from '../lib/api';

interface HomePageProps {
  products: Product[];
  categories: Category[];
  onNavigate: (route: string) => void;
  onAddToCart: (productId: string, e: React.MouseEvent) => void;
  onBuyNow: (productId: string, e: React.MouseEvent) => void;
}

export const HomePage: React.FC<HomePageProps> = ({
  products,
  categories,
  onNavigate,
  onAddToCart,
  onBuyNow,
}) => {
  const featured = products.slice(0, 4);

  return (
    <div className="space-y-24 pb-24">
      {/* Asymmetric Two-Column Hero (Section 18 requirement: never centered with a gradient) */}
      <section className="border-b border-[rgba(139,122,114,0.2)]">
        <div className="max-w-7xl mx-auto px-6 py-12 md:py-20 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Column: Fraunces Headline, sentence case prose, primary button */}
          <div className="lg:col-span-6 space-y-6">
            <p className="text-xs text-[#8B7A72] tracking-wider uppercase">
              Autumn collection · Limited edition
            </p>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-serif text-[#17181C] font-normal leading-[1.12]">
              Objects shaped by hand, tuned for living
            </h1>
            <p className="text-base text-[#17181C]/80 max-w-lg leading-relaxed font-sans">
              We collaborate directly with independent European ceramicists, weavers, and metalworkers. Every piece is crafted in small, numbered batches designed to age with quiet dignity.
            </p>
            <div className="pt-2 flex flex-wrap items-center gap-4">
              <Button
                variant="primary"
                size="lg"
                onClick={() => onNavigate('/products')}
              >
                Explore collection
              </Button>
              <Button
                variant="secondary"
                size="lg"
                onClick={() => onNavigate('/categories')}
              >
                Browse ateliers
              </Button>
            </div>
          </div>

          {/* Right Column: Flat Large Architectural Image */}
          <div className="lg:col-span-6">
            <div
              className="aspect-[16/10] w-full overflow-hidden bg-[#E8E6DF] border border-[rgba(139,122,114,0.2)]"
              style={{ borderRadius: 0, boxShadow: 'none' }}
            >
              <img
                src="/src/assets/images/hero_atelier_living_1790242826551.jpg"
                alt="Atelier interior"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Featured Collection Section */}
      <section className="max-w-7xl mx-auto px-6 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[rgba(139,122,114,0.2)] pb-4">
          <div>
            <p className="text-xs text-[#8B7A72] tracking-wider uppercase mb-1">Curation</p>
            <h2 className="text-3xl font-serif text-[#17181C] font-normal">
              Featured works
            </h2>
          </div>
          <button
            onClick={() => onNavigate('/products')}
            className="text-xs text-[#17181C] hover:text-[#A6824C] underline underline-offset-4 cursor-pointer self-start sm:self-auto"
          >
            View all works
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {featured.map((p) => (
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
      </section>

      {/* Categories Spotlight */}
      <section className="max-w-7xl mx-auto px-6 space-y-8">
        <div className="border-b border-[rgba(139,122,114,0.2)] pb-4">
          <p className="text-xs text-[#8B7A72] tracking-wider uppercase mb-1">Disciplines</p>
          <h2 className="text-3xl font-serif text-[#17181C] font-normal">
            Browse by medium
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {categories.map((cat) => (
            <div
              key={cat.id}
              onClick={() => onNavigate(`/products?category=${cat.slug}`)}
              className="group border border-[rgba(139,122,114,0.2)] p-6 bg-[#F2F1ED] hover:border-[#A6824C] transition-colors cursor-pointer flex flex-col justify-between h-48"
              style={{ borderRadius: 0, boxShadow: 'none' }}
            >
              <div>
                <p className="text-xs text-[#8B7A72] tabular-nums font-mono mb-2">
                  {cat._count?.products || 0} pieces
                </p>
                <h3 className="text-xl font-serif text-[#17181C] group-hover:text-[#A6824C] transition-colors">
                  {cat.name}
                </h3>
                <p className="text-xs text-[#8B7A72] mt-2 line-clamp-2 leading-relaxed">
                  {cat.description || 'Artisanal homeware crafted with timeless integrity.'}
                </p>
              </div>
              <div className="pt-4 border-t border-[rgba(139,122,114,0.15)] flex items-center justify-between text-xs text-[#17181C]">
                <span>Explore pieces</span>
                <span>→</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Craftsmanship Narrative Section */}
      <section className="border-t border-b border-[rgba(139,122,114,0.2)] bg-[rgba(139,122,114,0.04)] py-16">
        <div className="max-w-4xl mx-auto px-6 text-center space-y-6">
          <p className="text-xs text-[#8B7A72] tracking-wider uppercase">Our philosophy</p>
          <h2 className="text-3xl sm:text-4xl font-serif text-[#17181C] font-normal">
            No mass production, no artificial coatings
          </h2>
          <p className="text-sm text-[#17181C]/80 leading-relaxed font-sans max-w-2xl mx-auto">
            Each ceramic vessel retains the faint pressure of the potter's fingers; our brassware is left unlacquered so the atmosphere writes its honest history across the metal; our linens are woven on antique shuttles in Kortrijk.
          </p>
          <div className="pt-2">
            <Button variant="secondary" onClick={() => onNavigate('/style-guide')}>
              View design tokens & style guide
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="max-w-7xl mx-auto px-6 pt-12 text-xs text-[#8B7A72] border-t border-[rgba(139,122,114,0.2)] flex flex-col sm:flex-row items-center justify-between gap-4">
        <p>© 2026 Atelier Commerce. Designed with bespoke typography & hairline borders.</p>
        <div className="flex items-center gap-6 text-[#17181C]">
          <button onClick={() => onNavigate('/style-guide')} className="hover:text-[#A6824C] cursor-pointer">
            Style guide
          </button>
          <button onClick={() => onNavigate('/products')} className="hover:text-[#A6824C] cursor-pointer">
            Catalog
          </button>
          <button onClick={() => onNavigate('/admin/login')} className="hover:text-[#A6824C] cursor-pointer">
            Admin portal
          </button>
        </div>
      </footer>
    </div>
  );
};
