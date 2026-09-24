import React, { useState, useEffect } from 'react';
import { Badge } from '../../components/ui/Badge';
import { Input } from '../../components/ui/Input';
import { Dialog } from '../../components/ui/Dialog';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/Table';
import { Order, api } from '../../lib/api';

export const AdminOrdersPage: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');

  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);

  useEffect(() => {
    loadOrders();
  }, [statusFilter, search]);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const res = await api.getAdminOrders({
        status: statusFilter === 'all' ? undefined : statusFilter,
        search: search || undefined,
      });
      setOrders(res.orders);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    setUpdatingStatus(orderId);
    try {
      await api.updateOrderStatus(orderId, newStatus);
      await loadOrders();
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder((prev) => (prev ? { ...prev, status: newStatus as any } : null));
      }
    } catch (err: any) {
      alert(err.message || 'Failed to update order status');
    } finally {
      setUpdatingStatus(null);
    }
  };

  const openOrderDetail = (order: Order) => {
    setSelectedOrder(order);
    setIsDetailOpen(true);
  };

  const statusOptions = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];

  return (
    <div className="space-y-8">
      <div className="border-b border-[rgba(139,122,114,0.2)] pb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-xs text-[#8B7A72] tracking-wider uppercase mb-1">Fulfillment ledger</p>
          <h1 className="text-3xl font-serif text-[#17181C] font-normal">
            Customer orders
          </h1>
        </div>

        <p className="text-xs text-[#8B7A72]">
          {orders.length} orders recorded
        </p>
      </div>

      {/* Filter and Search Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="w-72">
          <Input
            placeholder="Search order # or customer..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="py-1.5 text-xs"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={() => setStatusFilter('all')}
            className={`text-xs px-3 py-1.5 border transition-colors cursor-pointer whitespace-nowrap ${
              statusFilter === 'all'
                ? 'bg-[#17181C] text-[#F2F1ED] border-[#17181C]'
                : 'bg-transparent text-[#17181C] border-[rgba(139,122,114,0.3)] hover:border-[#17181C]'
            }`}
            style={{ borderRadius: 0 }}
          >
            All statuses
          </button>
          {statusOptions.map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`text-xs px-3 py-1.5 border transition-colors cursor-pointer capitalize whitespace-nowrap ${
                statusFilter === st
                  ? 'bg-[#17181C] text-[#F2F1ED] border-[#17181C]'
                  : 'bg-transparent text-[#17181C] border-[rgba(139,122,114,0.3)] hover:border-[#17181C]'
              }`}
              style={{ borderRadius: 0 }}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Orders Table */}
      <div className="border border-[rgba(139,122,114,0.2)] bg-[#F2F1ED]">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order #</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Items</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12 text-xs text-[#8B7A72]">
                  Loading orders...
                </TableCell>
              </TableRow>
            ) : orders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12 text-xs text-[#8B7A72]">
                  No orders found.
                </TableCell>
              </TableRow>
            ) : (
              orders.map((o) => (
                <TableRow key={o.id}>
                  <TableCell className="font-mono text-xs font-medium">
                    {o.orderNumber}
                  </TableCell>
                  <TableCell className="text-xs text-[#8B7A72]">
                    {new Date(o.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <p className="text-xs font-medium text-[#17181C]">{o.customerName}</p>
                    <p className="text-[11px] text-[#8B7A72]">{o.customerEmail}</p>
                  </TableCell>
                  <TableCell className="text-xs max-w-xs truncate">
                    {o.items.map((it) => `${it.quantity}× ${it.productName}`).join(', ')}
                  </TableCell>
                  <TableCell className="text-xs font-medium tabular-nums">
                    ${o.totalAmount.toFixed(2)}
                  </TableCell>
                  <TableCell>
                    <select
                      value={o.status}
                      disabled={updatingStatus === o.id}
                      onChange={(e) => handleStatusChange(o.id, e.target.value)}
                      className="text-xs bg-[#F2F1ED] border border-[rgba(139,122,114,0.3)] px-2 py-1 text-[#17181C] focus:border-[#A6824C] focus:outline-none capitalize cursor-pointer"
                      style={{ borderRadius: '2px' }}
                    >
                      {statusOptions.map((st) => (
                        <option key={st} value={st}>
                          {st}
                        </option>
                      ))}
                    </select>
                  </TableCell>
                  <TableCell className="text-right">
                    <button
                      onClick={() => openOrderDetail(o)}
                      className="text-xs text-[#17181C] hover:text-[#A6824C] underline cursor-pointer"
                    >
                      Inspect
                    </button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Order Detail Modal */}
      <Dialog
        open={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        title={selectedOrder ? `Order invoice ${selectedOrder.orderNumber}` : 'Order details'}
      >
        {selectedOrder && (
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-[rgba(139,122,114,0.15)] pb-3">
              <div>
                <p className="text-xs text-[#8B7A72]">Order date</p>
                <p className="text-xs font-medium text-[#17181C]">
                  {new Date(selectedOrder.createdAt).toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-xs text-[#8B7A72]">Status</p>
                <Badge variant={selectedOrder.status === 'delivered' ? 'forest' : 'brass'}>
                  {selectedOrder.status}
                </Badge>
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-xs font-medium text-[#17181C]">Ordered pieces</p>
              <div className="divide-y divide-[rgba(139,122,114,0.15)] max-h-48 overflow-y-auto">
                {selectedOrder.items.map((item) => (
                  <div key={item.id} className="py-2 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-medium text-[#17181C]">{item.productName}</span>
                      <span className="text-[#8B7A72] ml-2">Qty {item.quantity}</span>
                    </div>
                    <span className="font-medium tabular-nums">${item.total.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-2 border-t border-[rgba(139,122,114,0.15)] space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-[#8B7A72]">Subtotal</span>
                <span className="tabular-nums font-medium">${selectedOrder.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-baseline pt-2 border-t border-[rgba(139,122,114,0.15)]">
                <span className="font-medium text-[#17181C]">Total authoritative amount</span>
                <span className="text-base font-normal tabular-nums text-[#17181C]">
                  ${selectedOrder.totalAmount.toFixed(2)}
                </span>
              </div>
            </div>

            <div className="pt-2 border-t border-[rgba(139,122,114,0.15)] space-y-2 text-xs">
              <p className="font-medium text-[#17181C]">Shipping destination</p>
              <p className="text-[#8B7A72] leading-relaxed">
                {selectedOrder.customerName} <br />
                {selectedOrder.customerEmail} · {selectedOrder.customerPhone || 'No phone'} <br />
                {selectedOrder.shippingAddress} <br />
                {selectedOrder.city}, {selectedOrder.postalCode} <br />
                {selectedOrder.country}
              </p>
            </div>
          </div>
        )}
      </Dialog>
    </div>
  );
};
