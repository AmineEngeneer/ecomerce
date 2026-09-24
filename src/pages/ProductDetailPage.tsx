import React, { useState, useEffect } from 'react';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Product, api } from '../lib/api';

interface ProductDetailPageProps {
  productId: string;
  onNavigate: (route: string) => void;
  onAddToCart: (productId: string, quantity: number) => void;
  onBuyNowDirect: (productId: string, quantity: number) => void;
}

export const ProductDetailPage: React.FC<ProductDetailPageProps> = ({
  productId,
  onNavigate,
  onAddToCart,
  onBuyNowDirect,
}) => {
  const [product, setProduct] = useState<Product | null>(null);
  const [activeImageIndex, setActiveImageIndex] = useState<number>(0);
  const [quantity, setQuantity] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadProduct();
  }, [productId]);

  const loadProduct = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getProduct(productId);
      setProduct(res.product);
      setActiveImageIndex(0);
      setQuantity(1);
    } catch (err: any) {
      setError(err.message || 'Product not found');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-24 text-center text-sm text-[#8B7A72]">
        Loading product details...
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-24 text-center space-y-4">
        <h2 className="text-2xl font-serif text-[#17181C]">Piece not found</h2>
        <p className="text-sm text-[#8B7A72]">This item might have been archived or removed from the catalog.</p>
        <Button variant="secondary" onClick={() => onNavigate('/products')}>
          Back to collection
        </Button>
      </div>
    );
  }

  const inStock = product.stock > 0;
  const activeImage = product.images[activeImageIndex]?.url || product.images[0]?.url || '/placeholder.png';

  const handleIncrement = () => {
    if (quantity < product.stock) {
      setQuantity(quantity + 1);
    }
  };

  const handleDecrement = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-12 space-y-12">
      {/* Breadcrumb navigation */}
      <div className="flex items-center gap-2 text-xs text-[#8B7A72]">
        <button onClick={() => onNavigate('/')} className="hover:text-[#17181C] cursor-pointer">
          Home
        </button>
        <span>/</span>
        <button onClick={() => onNavigate('/products')} className="hover:text-[#17181C] cursor-pointer">
          Catalog
        </button>
        {product.category && (
          <>
            <span>/</span>
            <button
              onClick={() => onNavigate(`/products?category=${product.category?.slug}`)}
              className="hover:text-[#17181C] cursor-pointer"
            >
              {product.category.name}
            </button>
          </>
        )}
        <span>/</span>
        <span className="text-[#17181C] truncate max-w-xs">{product.name}</span>
      </div>

      {/* Main product view: 2-column layout with sticky purchase module */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
        {/* Left Column: Image Gallery */}
        <div className="lg:col-span-7 space-y-4">
          <div
            className="aspect-[4/3] w-full overflow-hidden bg-[#E8E6DF] border border-[rgba(139,122,114,0.2)]"
            style={{ borderRadius: 0, boxShadow: 'none' }}
          >
            <img
              src={activeImage}
              alt={product.name}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
          </div>

          {/* Additional gallery thumbnails if multiple images exist */}
          {product.images.length > 1 && (
            <div className="flex items-center gap-3 overflow-x-auto pb-2">
              {product.images.map((img, idx) => (
                <button
                  key={img.id || idx}
                  onClick={() => setActiveImageIndex(idx)}
                  className={`w-20 h-20 overflow-hidden border cursor-pointer ${
                    activeImageIndex === idx
                      ? 'border-[#17181C] ring-1 ring-[#17181C]'
                      : 'border-[rgba(139,122,114,0.3)] opacity-70 hover:opacity-100'
                  }`}
                  style={{ borderRadius: 0 }}
                >
                  <img src={img.url} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Contiguous Purchase Module */}
        <div className="lg:col-span-5 lg:sticky lg:top-24 space-y-8 bg-[#F2F1ED] p-8 border border-[rgba(139,122,114,0.2)]">
          {/* Header & Category */}
          <div className="space-y-2 border-b border-[rgba(139,122,114,0.2)] pb-6">
            {product.category && (
              <p className="text-xs text-[#8B7A72] tracking-wider uppercase font-sans">
                {product.category.name}
              </p>
            )}
            <h1 className="text-3xl font-serif text-[#17181C] font-normal leading-snug">
              {product.name}
            </h1>
            <div className="flex items-center justify-between pt-2">
              <span className="text-2xl font-normal tabular-nums text-[#17181C]">
                ${product.price.toFixed(2)}
              </span>
              {inStock ? (
                <Badge variant="forest">
                  {product.stock <= 3 ? `Only ${product.stock} remaining` : `${product.stock} in stock`}
                </Badge>
              ) : (
                <Badge variant="stone">Out of stock</Badge>
              )}
            </div>
          </div>

          {/* Description */}
          <div className="space-y-3">
            <h3 className="text-xs text-[#8B7A72] uppercase tracking-wider font-medium">
              Curator’s description
            </h3>
            <p className="text-sm text-[#17181C]/90 leading-relaxed font-sans">
              {product.description}
            </p>
          </div>

          {/* Quantity selector & Actions */}
          {inStock ? (
            <div className="space-y-6 pt-2 border-t border-[rgba(139,122,114,0.15)]">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-[#17181C]">Quantity</span>
                <div className="flex items-center border border-[rgba(139,122,114,0.3)]">
                  <button
                    type="button"
                    onClick={handleDecrement}
                    disabled={quantity <= 1}
                    className="w-9 h-9 flex items-center justify-center text-sm hover:bg-[rgba(139,122,114,0.1)] disabled:opacity-30 cursor-pointer"
                  >
                    –
                  </button>
                  <span className="w-12 text-center text-sm font-medium tabular-nums">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    onClick={handleIncrement}
                    disabled={quantity >= product.stock}
                    className="w-9 h-9 flex items-center justify-center text-sm hover:bg-[rgba(139,122,114,0.1)] disabled:opacity-30 cursor-pointer"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Add to Cart and Buy Now buttons */}
              <div className="space-y-3">
                <Button
                  variant="secondary"
                  fullWidth
                  size="lg"
                  onClick={() => onAddToCart(product.id, quantity)}
                >
                  Add to cart
                </Button>
                <Button
                  variant="primary"
                  fullWidth
                  size="lg"
                  onClick={() => onBuyNowDirect(product.id, quantity)}
                >
                  Buy now
                </Button>
              </div>
            </div>
          ) : (
            <div className="pt-4 border-t border-[rgba(139,122,114,0.2)]">
              <p className="text-xs text-[#8B7A72]">
                This limited edition piece is currently out of stock. Contact our studio for future firings.
              </p>
            </div>
          )}

          {/* Provenance guarantee */}
          <div className="pt-6 border-t border-[rgba(139,122,114,0.15)] space-y-2 text-xs text-[#8B7A72]">
            <p className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-[#2F4739] inline-block" />
              Direct studio dispatch within 48 hours
            </p>
            <p className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-[#2F4739] inline-block" />
              100% recyclable molded paper packaging
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
