import React, { useState, useEffect } from 'react';
import { Badge } from '../../components/ui/Badge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/Table';
import { AdminStats, api } from '../../lib/api';

interface AdminOverviewPageProps {
  onNavigate: (route: string) => void;
}

export const AdminOverviewPage: React.FC<AdminOverviewPageProps> = ({ onNavigate }) => {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    setLoading(true);
    try {
      const res = await api.getAdminStats();
      setStats(res);
    } catch (err: any) {
      setError(err.message || 'Failed to load statistics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24 text-center text-sm text-[#8B7A72]">
        Loading management metrics...
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="py-24 text-center space-y-4">
        <p className="text-sm text-[#8B261D]">{error || 'Could not load metrics'}</p>
        <button onClick={loadStats} className="text-xs underline text-[#17181C]">
          Retry
        </button>
      </div>
    );
  }

  const metricCards = [
    { label: 'Total revenue', value: `$${stats.totalRevenue.toFixed(2)}`, desc: 'Verified ledger settlements' },
    { label: 'Total orders', value: stats.totalOrders.toString(), desc: `${stats.pendingOrders} awaiting fulfillment` },
    { label: 'Active catalog', value: stats.totalProducts.toString(), desc: 'Crafted pieces' },
    { label: 'Registered clients', value: stats.totalUsers.toString(), desc: 'Customer accounts' },
    { label: 'Low stock alerts', value: stats.lowStockProducts.toString(), desc: 'Items with ≤ 5 available units' },
  ];

  return (
    <div className="space-y-12">
      <div className="border-b border-[rgba(139,122,114,0.2)] pb-6 flex items-end justify-between">
        <div>
          <p className="text-xs text-[#8B7A72] tracking-wider uppercase mb-1">Administrative analytics</p>
          <h1 className="text-3xl font-serif text-[#17181C] font-normal">
            Store operations overview
          </h1>
        </div>
        <p className="text-xs text-[#8B7A72] font-mono">
          Last refreshed: {new Date().toLocaleTimeString()}
        </p>
      </div>

      {/* Metrics Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {metricCards.map((card) => (
          <div
            key={card.label}
            className="border border-[rgba(139,122,114,0.2)] bg-[#F2F1ED] p-5 space-y-2"
            style={{ borderRadius: 0, boxShadow: 'none' }}
          >
            <p className="text-xs text-[#8B7A72] tracking-wider uppercase">{card.label}</p>
            <p className="text-2xl font-serif text-[#17181C] font-normal tabular-nums">{card.value}</p>
            <p className="text-[11px] text-[#8B7A72]">{card.desc}</p>
          </div>
        ))}
      </div>

      {/* Recent Orders Overview */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-serif text-[#17181C]">Recent transactions</h2>
          <button
            onClick={() => onNavigate('/admin/orders')}
            className="text-xs text-[#17181C] hover:text-[#A6824C] underline cursor-pointer"
          >
            Manage all orders →
          </button>
        </div>

        <div className="border border-[rgba(139,122,114,0.2)] bg-[#F2F1ED]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order #</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Total</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stats.recentOrders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-xs text-[#8B7A72]">
                    No orders logged in system yet.
                  </TableCell>
                </TableRow>
              ) : (
                stats.recentOrders.map((ord) => (
                  <TableRow key={ord.id}>
                    <TableCell className="font-mono text-xs">{ord.orderNumber}</TableCell>
                    <TableCell className="text-xs text-[#8B7A72]">
                      {new Date(ord.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-xs">{ord.customerName}</TableCell>
                    <TableCell>
                      <Badge variant={ord.status === 'delivered' ? 'forest' : 'stone'}>
                        {ord.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium tabular-nums text-xs">
                      ${ord.totalAmount.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right">
                      <button
                        onClick={() => onNavigate('/admin/orders')}
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
      </div>
    </div>
  );
};
