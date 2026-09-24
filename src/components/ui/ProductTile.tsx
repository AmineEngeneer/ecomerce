import React from 'react';

export interface ProductTileProps {
  id: string;
  name: string;
  price: number;
  category?: string;
  image: string;
  stock?: number;
  onSelect?: (id: string) => void;
  onAddToCart?: (id: string, e: React.MouseEvent) => void;
  onBuyNow?: (id: string, e: React.MouseEvent) => void;
}

export const ProductTile: React.FC<ProductTileProps> = ({
  id,
  name,
  price,
  category,
  image,
  stock,
  onSelect,
  onAddToCart,
  onBuyNow,
}) => {
  return (
    <div
      onClick={() => onSelect?.(id)}
      className="group flex flex-col bg-[#F2F1ED] cursor-pointer border border-[rgba(139,122,114,0.15)] hover:border-[rgba(139,122,114,0.4)] transition-colors"
      style={{ borderRadius: 0, boxShadow: 'none' }}
    >
      {/* Flat product image - no border radius, no shadow */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-[#E8E6DF]">
        <img
          src={image}
          alt={name}
          referrerPolicy="no-referrer"
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-102"
        />
        {stock !== undefined && stock <= 0 && (
          <div className="absolute top-2 left-2 bg-[#17181C] text-[#F2F1ED] text-[11px] font-medium px-2 py-0.5">
            Out of stock
          </div>
        )}
      </div>

      {/* Thin hairline divider below image separating it from name/price */}
      <div className="border-b border-[rgba(139,122,114,0.2)]" />

      {/* Metadata, Name, Price */}
      <div className="p-4 flex flex-col justify-between flex-1 space-y-3">
        <div>
          {category && (
            <p className="text-xs text-[#8B7A72] tracking-wide mb-1 font-sans">
              {category}
            </p>
          )}
          <h3 className="text-base font-normal font-sans text-[#17181C] group-hover:text-[#A6824C] transition-colors leading-snug">
            {name}
          </h3>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-[rgba(139,122,114,0.1)]">
          <span className="text-sm font-medium tabular-nums text-[#17181C]">
            ${price.toFixed(2)}
          </span>

          <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
            {onAddToCart && (
              <button
                type="button"
                onClick={(e) => onAddToCart(id, e)}
                disabled={stock !== undefined && stock <= 0}
                className="text-xs px-2.5 py-1.5 border border-[#17181C] text-[#17181C] hover:border-[#A6824C] hover:text-[#A6824C] bg-transparent cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                style={{ borderRadius: 0 }}
              >
                Add to cart
              </button>
            )}
            {onBuyNow && (
              <button
                type="button"
                onClick={(e) => onBuyNow(id, e)}
                disabled={stock !== undefined && stock <= 0}
                className="text-xs px-2.5 py-1.5 bg-[#17181C] text-[#F2F1ED] hover:bg-[#A6824C] cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                style={{ borderRadius: 0 }}
              >
                Buy now
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
