import React, { useState, useEffect } from 'react';
import { Button } from '../components/ui/Button';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/Table';
import { CartResponse, api } from '../lib/api';

interface CartPageProps {
  onNavigate: (route: string) => void;
  onCartChange?: () => void;
}

export const CartPage: React.FC<CartPageProps> = ({ onNavigate, onCartChange }) => {
  const [cart, setCart] = useState<CartResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadCart();
  }, []);

  const loadCart = async () => {
    setLoading(true);
    try {
      const res = await api.getCart();
      setCart(res);
      onCartChange?.();
    } catch (err: any) {
      setError(err.message || 'Please sign in to view your shopping basket');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateQuantity = async (itemId: string, newQty: number) => {
    if (newQty < 1) return;
    try {
      await api.updateCartItem(itemId, newQty);
      await loadCart();
    } catch (err: any) {
      alert(err.message || 'Could not update quantity');
    }
  };

  const handleRemoveItem = async (itemId: string) => {
    try {
      await api.removeCartItem(itemId);
      await loadCart();
    } catch (err: any) {
      alert(err.message || 'Could not remove item');
    }
  };

  const handleClearCart = async () => {
    if (!confirm('Clear all items from your basket?')) return;
    try {
      await api.clearCart();
      await loadCart();
    } catch (err: any) {
      alert(err.message || 'Could not clear basket');
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-24 text-center text-sm text-[#8B7A72]">
        Loading your shopping basket...
      </div>
    );
  }

  if (error || !cart) {
    return (
      <div className="max-w-md mx-auto px-6 py-24 text-center space-y-4">
        <h2 className="text-2xl font-serif text-[#17181C]">Sign in to access your basket</h2>
        <p className="text-sm text-[#8B7A72]">Your basket is saved to your account across sessions.</p>
        <div className="flex justify-center gap-4 pt-2">
          <Button variant="primary" onClick={() => onNavigate('/login')}>
            Sign in
          </Button>
          <Button variant="secondary" onClick={() => onNavigate('/signup')}>
            Register
          </Button>
        </div>
      </div>
    );
  }

  const items = cart.items || [];

  if (items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-24 text-center space-y-6">
        <h1 className="text-3xl font-serif text-[#17181C]">Your basket is empty</h1>
        <p className="text-sm text-[#8B7A72]">
          Explore our collection of hand-thrown ceramics, linens, and architectural brassware.
        </p>
        <Button variant="primary" onClick={() => onNavigate('/products')}>
          Discover collection
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-12 space-y-12">
      <div className="border-b border-[rgba(139,122,114,0.2)] pb-6 flex items-end justify-between">
        <div>
          <p className="text-xs text-[#8B7A72] tracking-wider uppercase mb-1">Review selection</p>
          <h1 className="text-4xl font-serif text-[#17181C] font-normal">
            Shopping basket
          </h1>
        </div>
        <button
          onClick={handleClearCart}
          className="text-xs text-[#8B7A72] hover:text-[#8B261D] underline cursor-pointer"
        >
          Clear basket
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
        {/* Cart items table */}
        <div className="lg:col-span-8 border border-[rgba(139,122,114,0.2)] bg-[#F2F1ED]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Piece</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Subtotal</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 bg-[#E8E6DF] border border-[rgba(139,122,114,0.2)] overflow-hidden shrink-0">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div>
                        {item.category && (
                          <p className="text-[11px] text-[#8B7A72]">{item.category}</p>
                        )}
                        <button
                          onClick={() => onNavigate(`/product/${item.productId}`)}
                          className="text-sm font-medium text-[#17181C] hover:text-[#A6824C] text-left cursor-pointer"
                        >
                          {item.name}
                        </button>
                        <p className="text-[11px] text-[#8B7A72]">
                          {item.stock} in stock
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="tabular-nums">
                    ${item.price.toFixed(2)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center border border-[rgba(139,122,114,0.3)] w-24">
                      <button
                        onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                        disabled={item.quantity <= 1}
                        className="w-7 h-7 flex items-center justify-center text-xs hover:bg-[rgba(139,122,114,0.1)] disabled:opacity-30 cursor-pointer"
                      >
                        –
                      </button>
                      <span className="flex-1 text-center text-xs tabular-nums font-medium">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                        disabled={item.quantity >= item.stock}
                        className="w-7 h-7 flex items-center justify-center text-xs hover:bg-[rgba(139,122,114,0.1)] disabled:opacity-30 cursor-pointer"
                      >
                        +
                      </button>
                    </div>
                  </TableCell>
                  <TableCell className="tabular-nums font-medium">
                    ${item.total.toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right">
                    <button
                      onClick={() => handleRemoveItem(item.id)}
                      className="text-xs text-[#8B7A72] hover:text-[#8B261D] underline cursor-pointer"
                    >
                      Remove
                    </button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Order summary card */}
        <div className="lg:col-span-4 bg-[#F2F1ED] border border-[rgba(139,122,114,0.2)] p-6 space-y-6">
          <h2 className="text-xl font-serif text-[#17181C]">Summary</h2>

          <div className="space-y-3 text-sm border-b border-[rgba(139,122,114,0.15)] pb-4">
            <div className="flex justify-between">
              <span className="text-[#8B7A72]">Subtotal</span>
              <span className="tabular-nums font-medium">${cart.subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#8B7A72]">Standard shipping</span>
              <span className="text-[#2F4739] text-xs font-medium">Complimentary</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#8B7A72]">Sales tax</span>
              <span className="text-xs text-[#8B7A72]">Included</span>
            </div>
          </div>

          <div className="flex justify-between items-baseline pt-2">
            <span className="text-base font-serif text-[#17181C]">Total amount</span>
            <span className="text-2xl font-normal tabular-nums text-[#17181C]">
              ${cart.total.toFixed(2)}
            </span>
          </div>

          <div className="pt-2 space-y-3">
            <Button
              variant="primary"
              fullWidth
              size="lg"
              onClick={() => onNavigate('/checkout')}
            >
              Proceed to checkout
            </Button>
            <Button
              variant="secondary"
              fullWidth
              onClick={() => onNavigate('/products')}
            >
              Continue browsing
            </Button>
          </div>

          <p className="text-[11px] text-[#8B7A72] text-center leading-relaxed">
            All prices are verified and guaranteed by our backend ledger.
          </p>
        </div>
      </div>
    </div>
  );
};
