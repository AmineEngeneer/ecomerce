import React, { useState, useEffect } from 'react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { CartResponse, PaymentMethod, User, Product, api } from '../lib/api';

interface CheckoutPageProps {
  directProductId?: string | null;
  directQuantity?: number;
  user: User | null;
  onNavigate: (route: string) => void;
  onOrderSuccess: (orderId: string) => void;
}

export const CheckoutPage: React.FC<CheckoutPageProps> = ({
  directProductId,
  directQuantity = 1,
  user,
  onNavigate,
  onOrderSuccess,
}) => {
  const [cart, setCart] = useState<CartResponse | null>(null);
  const [directProduct, setDirectProduct] = useState<Product | null>(null);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [selectedPaymentMethodId, setSelectedPaymentMethodId] = useState<string>('');
  
  // Checkout Form
  const [formData, setFormData] = useState({
    customerName: user?.name || '',
    customerEmail: user?.email || '',
    customerPhone: user?.phone || '',
    shippingAddress: user?.address || '',
    city: user?.city || '',
    country: user?.country || 'United States',
    postalCode: user?.postalCode || '',
  });

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadCheckoutData();
  }, [directProductId, user]);

  const loadCheckoutData = async () => {
    setLoading(true);
    setError(null);
    try {
      if (directProductId) {
        const pRes = await api.getProduct(directProductId);
        setDirectProduct(pRes.product);
      } else {
        const cRes = await api.getCart();
        setCart(cRes);
      }

      if (user) {
        const pmRes = await api.getPaymentMethods().catch(() => ({ paymentMethods: [] }));
        setPaymentMethods(pmRes.paymentMethods);
        const defaultMethod = pmRes.paymentMethods.find((m) => m.isDefault);
        if (defaultMethod) {
          setSelectedPaymentMethodId(defaultMethod.id);
        } else if (pmRes.paymentMethods.length > 0) {
          setSelectedPaymentMethodId(pmRes.paymentMethods[0].id);
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to prepare checkout');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!formData.customerName.trim()) return setError('Full name is required');
    if (!formData.customerEmail.trim()) return setError('Email is required');
    if (!formData.shippingAddress.trim()) return setError('Shipping address is required');
    if (!formData.city.trim()) return setError('City is required');
    if (!formData.postalCode.trim()) return setError('Postal code is required');

    setSubmitting(true);
    try {
      const payload: any = {
        customerName: formData.customerName,
        customerEmail: formData.customerEmail,
        customerPhone: formData.customerPhone || 'Not provided',
        shippingAddress: formData.shippingAddress,
        city: formData.city,
        country: formData.country,
        postalCode: formData.postalCode,
        paymentMethodId: selectedPaymentMethodId || null,
      };

      if (directProductId) {
        payload.directProductId = directProductId;
        payload.directQuantity = directQuantity;
      }

      const res = await api.checkout(payload);
      onOrderSuccess(res.orderId);
    } catch (err: any) {
      setError(err.message || 'Checkout failed. Please review your information.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-24 text-center text-sm text-[#8B7A72]">
        Preparing secure checkout...
      </div>
    );
  }

  // Calculate review items
  interface DisplayItem {
    id: string;
    name: string;
    quantity: number;
    price: number;
    total: number;
  }

  let items: DisplayItem[] = [];
  let subtotal = 0;

  if (directProductId && directProduct) {
    items = [
      {
        id: directProduct.id,
        name: directProduct.name,
        quantity: directQuantity,
        price: directProduct.price,
        total: directProduct.price * directQuantity,
      },
    ];
    subtotal = directProduct.price * directQuantity;
  } else if (cart) {
    items = cart.items.map((i) => ({
      id: i.id,
      name: i.name,
      quantity: i.quantity,
      price: i.price,
      total: i.total,
    }));
    subtotal = cart.subtotal;
  }

  if (items.length === 0) {
    return (
      <div className="max-w-md mx-auto px-6 py-24 text-center space-y-4">
        <h2 className="text-2xl font-serif text-[#17181C]">Nothing to checkout</h2>
        <p className="text-sm text-[#8B7A72]">Your basket is empty or no item was selected.</p>
        <Button variant="primary" onClick={() => onNavigate('/products')}>
          Browse catalog
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-12 space-y-12">
      <div className="border-b border-[rgba(139,122,114,0.2)] pb-6">
        <p className="text-xs text-[#8B7A72] tracking-wider uppercase mb-1">
          {directProductId ? 'Direct checkout' : 'Finalize transaction'}
        </p>
        <h1 className="text-4xl font-serif text-[#17181C] font-normal">
          Order fulfillment & dispatch
        </h1>
      </div>

      {error && (
        <div className="p-4 bg-[rgba(139,38,29,0.08)] border border-[#8B261D] text-xs text-[#8B261D]">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmitOrder}>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          {/* Customer & Shipping information */}
          <div className="lg:col-span-7 space-y-10">
            {/* Contact details */}
            <div className="space-y-4 bg-[#F2F1ED] p-6 border border-[rgba(139,122,114,0.2)]">
              <h2 className="text-lg font-serif text-[#17181C]">1. Contact details</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Full name *"
                  value={formData.customerName}
                  onChange={(e) => handleInputChange('customerName', e.target.value)}
                  placeholder="e.g. Clara O’Neill"
                  required
                />
                <Input
                  label="Email address *"
                  type="email"
                  value={formData.customerEmail}
                  onChange={(e) => handleInputChange('customerEmail', e.target.value)}
                  placeholder="name@domain.com"
                  required
                />
                <div className="sm:col-span-2">
                  <Input
                    label="Phone number *"
                    value={formData.customerPhone}
                    onChange={(e) => handleInputChange('customerPhone', e.target.value)}
                    placeholder="+1 (503) 555-0199"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Shipping address */}
            <div className="space-y-4 bg-[#F2F1ED] p-6 border border-[rgba(139,122,114,0.2)]">
              <h2 className="text-lg font-serif text-[#17181C]">2. Delivery address</h2>
              <div className="space-y-4">
                <Input
                  label="Street address *"
                  value={formData.shippingAddress}
                  onChange={(e) => handleInputChange('shippingAddress', e.target.value)}
                  placeholder="Apartment, suite, unit, or street number"
                  required
                />
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <Input
                    label="City *"
                    value={formData.city}
                    onChange={(e) => handleInputChange('city', e.target.value)}
                    placeholder="Portland"
                    required
                  />
                  <Input
                    label="Postal code *"
                    value={formData.postalCode}
                    onChange={(e) => handleInputChange('postalCode', e.target.value)}
                    placeholder="97201"
                    required
                  />
                  <Input
                    label="Country *"
                    value={formData.country}
                    onChange={(e) => handleInputChange('country', e.target.value)}
                    placeholder="United States"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Payment method selection */}
            <div className="space-y-4 bg-[#F2F1ED] p-6 border border-[rgba(139,122,114,0.2)]">
              <h2 className="text-lg font-serif text-[#17181C]">3. Payment method</h2>
              <p className="text-xs text-[#8B7A72]">
                Modular payment gateway. No raw credit card credentials or CVVs are transmitted to or stored on our server.
              </p>

              <div className="space-y-3 pt-2">
                {paymentMethods.length > 0 ? (
                  paymentMethods.map((pm) => (
                    <label
                      key={pm.id}
                      className={`flex items-center justify-between p-3 border cursor-pointer ${
                        selectedPaymentMethodId === pm.id
                          ? 'border-[#17181C] bg-[rgba(23,24,28,0.03)]'
                          : 'border-[rgba(139,122,114,0.2)]'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="radio"
                          name="paymentMethod"
                          checked={selectedPaymentMethodId === pm.id}
                          onChange={() => setSelectedPaymentMethodId(pm.id)}
                          className="accent-[#17181C]"
                        />
                        <span className="text-xs font-medium text-[#17181C]">
                          {pm.provider} ending in {pm.last4}
                        </span>
                      </div>
                      <span className="text-xs text-[#8B7A72] tabular-nums">
                        Expires {pm.expMonth}/{pm.expYear}
                      </span>
                    </label>
                  ))
                ) : (
                  <div className="p-4 border border-[rgba(139,122,114,0.2)] text-xs text-[#8B7A72] space-y-2">
                    <p className="font-medium text-[#17181C]">Verified Atelier Direct Invoice / Card on File</p>
                    <p>
                      An order invoice with secure payment link will be confirmed upon submission.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Order Review */}
          <div className="lg:col-span-5 bg-[#F2F1ED] border border-[rgba(139,122,114,0.2)] p-6 space-y-6 lg:sticky lg:top-24">
            <h2 className="text-xl font-serif text-[#17181C]">Review items</h2>

            <div className="divide-y divide-[rgba(139,122,114,0.15)] max-h-72 overflow-y-auto">
              {items.map((item) => (
                <div key={item.id} className="py-3 flex justify-between items-start gap-4">
                  <div>
                    <p className="text-xs font-medium text-[#17181C]">{item.name}</p>
                    <p className="text-[11px] text-[#8B7A72]">
                      Qty {item.quantity} × ${item.price.toFixed(2)}
                    </p>
                  </div>
                  <span className="text-xs font-medium tabular-nums text-[#17181C]">
                    ${item.total.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>

            <div className="space-y-2 pt-4 border-t border-[rgba(139,122,114,0.2)] text-xs">
              <div className="flex justify-between">
                <span className="text-[#8B7A72]">Server-calculated subtotal</span>
                <span className="tabular-nums font-medium text-[#17181C]">${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#8B7A72]">Packaging & delivery</span>
                <span className="text-[#2F4739] font-medium">Free</span>
              </div>
              <div className="flex justify-between items-baseline pt-3 border-t border-[rgba(139,122,114,0.2)]">
                <span className="text-sm font-serif text-[#17181C]">Authoritative total</span>
                <span className="text-xl font-normal tabular-nums text-[#17181C]">
                  ${subtotal.toFixed(2)}
                </span>
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              fullWidth
              size="lg"
              disabled={submitting}
            >
              {submitting ? 'Confirming order...' : 'Authorize & place order'}
            </Button>

            <p className="text-[11px] text-[#8B7A72] text-center leading-relaxed">
              By placing this order, you confirm the delivery information. Server recalculates and registers the ledger records directly into PostgreSQL.
            </p>
          </div>
        </div>
      </form>
    </div>
  );
};
