import React, { useState, useEffect } from 'react';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Order, api } from '../lib/api';

interface OrderDetailPageProps {
  orderId: string;
  onNavigate: (route: string) => void;
}

export const OrderDetailPage: React.FC<OrderDetailPageProps> = ({ orderId, onNavigate }) => {
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadOrder();
  }, [orderId]);

  const loadOrder = async () => {
    setLoading(true);
    try {
      const res = await api.getOrder(orderId);
      setOrder(res.order);
    } catch (err: any) {
      setError(err.message || 'Could not load order');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-24 text-center text-sm text-[#8B7A72]">
        Loading order receipt...
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="max-w-md mx-auto px-6 py-24 text-center space-y-4">
        <h2 className="text-2xl font-serif text-[#17181C]">Order not found</h2>
        <p className="text-sm text-[#8B7A72]">{error || 'This order could not be retrieved.'}</p>
        <Button variant="secondary" onClick={() => onNavigate('/orders')}>
          Return to orders
        </Button>
      </div>
    );
  }

  const statuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered'];
  const currentIndex = statuses.indexOf(order.status);

  return (
    <div className="max-w-4xl mx-auto px-6 py-12 space-y-12">
      {/* Header */}
      <div className="border-b border-[rgba(139,122,114,0.2)] pb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <span className="text-xs font-mono text-[#8B7A72]">{order.orderNumber}</span>
            <Badge variant={order.status === 'delivered' ? 'forest' : 'brass'}>
              {order.status}
            </Badge>
          </div>
          <h1 className="text-3xl font-serif text-[#17181C] font-normal">
            Order confirmed & logged
          </h1>
          <p className="text-xs text-[#8B7A72] mt-1">
            Placed on {new Date(order.createdAt).toLocaleDateString(undefined, {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        </div>

        <Button variant="secondary" size="sm" onClick={() => onNavigate('/orders')}>
          Back to all orders
        </Button>
      </div>

      {/* Progress tracker */}
      {order.status !== 'cancelled' && (
        <div className="bg-[#F2F1ED] p-6 border border-[rgba(139,122,114,0.2)]">
          <p className="text-xs text-[#8B7A72] tracking-wider uppercase mb-4">Fulfillment timeline</p>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {statuses.map((st, i) => {
              const isPastOrCurrent = currentIndex >= i;
              return (
                <div key={st} className="space-y-1">
                  <div
                    className={`h-1.5 w-full ${
                      isPastOrCurrent ? 'bg-[#2F4739]' : 'bg-[rgba(139,122,114,0.2)]'
                    }`}
                  />
                  <p
                    className={`text-[11px] capitalize ${
                      isPastOrCurrent ? 'text-[#17181C] font-medium' : 'text-[#8B7A72]'
                    }`}
                  >
                    {st}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Itemized summary */}
      <div className="bg-[#F2F1ED] border border-[rgba(139,122,114,0.2)] p-6 space-y-6">
        <h2 className="text-lg font-serif text-[#17181C]">Itemized receipt</h2>
        <div className="divide-y divide-[rgba(139,122,114,0.15)]">
          {order.items.map((item) => (
            <div key={item.id} className="py-3 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[#17181C]">{item.productName}</p>
                <p className="text-xs text-[#8B7A72]">
                  Quantity: {item.quantity} × ${item.productPrice.toFixed(2)}
                </p>
              </div>
              <span className="text-sm font-medium tabular-nums text-[#17181C]">
                ${item.total.toFixed(2)}
              </span>
            </div>
          ))}
        </div>

        <div className="pt-4 border-t border-[rgba(139,122,114,0.2)] space-y-2 text-xs">
          <div className="flex justify-between">
            <span className="text-[#8B7A72]">Subtotal</span>
            <span className="tabular-nums font-medium text-[#17181C]">${order.subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#8B7A72]">Packaging & shipping</span>
            <span className="text-[#2F4739] font-medium">Complimentary</span>
          </div>
          <div className="flex justify-between items-baseline pt-3 border-t border-[rgba(139,122,114,0.2)]">
            <span className="text-base font-serif text-[#17181C]">Total paid</span>
            <span className="text-xl font-normal tabular-nums text-[#17181C]">
              ${order.totalAmount.toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      {/* Customer & Delivery Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-[#F2F1ED] border border-[rgba(139,122,114,0.2)] p-6 space-y-3">
          <h3 className="text-sm font-serif text-[#17181C]">Customer info</h3>
          <div className="text-xs text-[#17181C] space-y-1">
            <p className="font-medium">{order.customerName}</p>
            <p className="text-[#8B7A72]">{order.customerEmail}</p>
            {order.customerPhone && <p className="text-[#8B7A72]">{order.customerPhone}</p>}
          </div>
        </div>

        <div className="bg-[#F2F1ED] border border-[rgba(139,122,114,0.2)] p-6 space-y-3">
          <h3 className="text-sm font-serif text-[#17181C]">Shipping address</h3>
          <div className="text-xs text-[#17181C] space-y-1">
            <p>{order.shippingAddress}</p>
            <p>{order.city}, {order.postalCode}</p>
            <p>{order.country}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
