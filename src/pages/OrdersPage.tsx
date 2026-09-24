import React, { useState, useEffect } from 'react';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/Table';
import { Order, api } from '../lib/api';

interface OrdersPageProps {
  onNavigate: (route: string) => void;
}

export const OrdersPage: React.FC<OrdersPageProps> = ({ onNavigate }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const res = await api.getOrders();
      setOrders(res.orders);
    } catch (err: any) {
      setError(err.message || 'Please sign in to view past orders');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: Order['status']) => {
    switch (status) {
      case 'delivered':
        return <Badge variant="forest">Delivered</Badge>;
      case 'shipped':
        return <Badge variant="forest">Shipped</Badge>;
      case 'processing':
        return <Badge variant="brass">Processing</Badge>;
      case 'confirmed':
        return <Badge variant="stone">Confirmed</Badge>;
      case 'cancelled':
        return <Badge variant="stone">Cancelled</Badge>;
      case 'pending':
      default:
        return <Badge variant="stone">Pending</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-24 text-center text-sm text-[#8B7A72]">
        Loading order records...
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-md mx-auto px-6 py-24 text-center space-y-4">
        <h2 className="text-2xl font-serif text-[#17181C]">Authentication required</h2>
        <p className="text-sm text-[#8B7A72]">{error}</p>
        <Button variant="primary" onClick={() => onNavigate('/login')}>
          Sign in
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-12 space-y-8">
      <div className="border-b border-[rgba(139,122,114,0.2)] pb-6 flex items-end justify-between">
        <div>
          <p className="text-xs text-[#8B7A72] tracking-wider uppercase mb-1">Account records</p>
          <h1 className="text-4xl font-serif text-[#17181C] font-normal">
            Order history
          </h1>
        </div>
        <Button variant="secondary" size="sm" onClick={() => onNavigate('/products')}>
          Shop more pieces
        </Button>
      </div>

      {orders.length === 0 ? (
        <div className="py-24 text-center space-y-4 border border-[rgba(139,122,114,0.2)] bg-[#F2F1ED]">
          <h2 className="text-2xl font-serif text-[#17181C]">No orders placed yet</h2>
          <p className="text-sm text-[#8B7A72]">
            When you purchase handcrafted items, your transaction receipts and tracking details appear here.
          </p>
          <Button variant="primary" onClick={() => onNavigate('/products')}>
            Explore catalog
          </Button>
        </div>
      ) : (
        <div className="border border-[rgba(139,122,114,0.2)] bg-[#F2F1ED]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order #</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Total amount</TableHead>
                <TableHead className="text-right">Receipt</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((o) => (
                <TableRow key={o.id}>
                  <TableCell className="font-mono text-xs font-medium">
                    {o.orderNumber}
                  </TableCell>
                  <TableCell className="text-xs text-[#8B7A72]">
                    {new Date(o.createdAt).toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(o.status)}
                  </TableCell>
                  <TableCell className="text-xs">
                    {o.items.map((it) => `${it.quantity}× ${it.productName}`).join(', ')}
                  </TableCell>
                  <TableCell className="font-medium tabular-nums">
                    ${o.totalAmount.toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right">
                    <button
                      onClick={() => onNavigate(`/order/${o.id}`)}
                      className="text-xs text-[#17181C] hover:text-[#A6824C] underline cursor-pointer"
                    >
                      View receipt
                    </button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
};
