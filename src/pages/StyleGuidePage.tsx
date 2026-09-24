import React from 'react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/Table';
import { Toast } from '../components/ui/Toast';
import { ProductTile } from '../components/ui/ProductTile';

export const StyleGuidePage: React.FC = () => {
  const [showToast, setShowToast] = React.useState(true);
  const [inputValue, setInputValue] = React.useState('Crafted stoneware');

  const colorTokens = [
    { name: '--color-ink', hex: '#17181C', bg: 'bg-[#17181C]', text: 'text-[#F2F1ED]', role: 'Primary text, primary button background' },
    { name: '--color-paper', hex: '#F2F1ED', bg: 'bg-[#F2F1ED]', text: 'text-[#17181C]', role: 'Page background' },
    { name: '--color-forest', hex: '#2F4739', bg: 'bg-[#2F4739]', text: 'text-[#F2F1ED]', role: 'Brand color, active/selected states' },
    { name: '--color-brass', hex: '#A6824C', bg: 'bg-[#A6824C]', text: 'text-[#17181C]', role: 'Hover states, focus rings, small accents' },
    { name: '--color-stone', hex: '#8B7A72', bg: 'bg-[#8B7A72]', text: 'text-[#F2F1ED]', role: 'Secondary text, metadata, borders/dividers' },
  ];

  return (
    <div className="max-w-5xl mx-auto px-6 py-16 space-y-16">
      {/* Header */}
      <div className="border-b border-[rgba(139,122,114,0.2)] pb-8">
        <p className="text-xs text-[#8B7A72] tracking-wider uppercase mb-2">Design system specification</p>
        <h1 className="text-4xl font-serif text-[#17181C] font-normal">
          Style guide & token audit
        </h1>
        <p className="mt-3 text-sm text-[#8B7A72] max-w-2xl">
          Complete rendering of color tokens, typography scales, hairline borders, and zero-shadow component overrides strictly matching Section 18.
        </p>
      </div>

      {/* 1. Color Swatches */}
      <section className="space-y-6">
        <div>
          <h2 className="text-2xl font-serif text-[#17181C]">1. Color tokens</h2>
          <p className="text-xs text-[#8B7A72] mt-1">
            Zero default Tailwind/zinc colors. Every token directly derives from the mandatory palette.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
          {colorTokens.map((token) => (
            <div
              key={token.name}
              className="border border-[rgba(139,122,114,0.2)] bg-[#F2F1ED] p-4 flex flex-col justify-between h-40"
              style={{ borderRadius: 0, boxShadow: 'none' }}
            >
              <div className={`h-16 w-full border border-[rgba(139,122,114,0.2)] ${token.bg} flex items-center justify-center`}>
                <span className={`text-xs font-mono tabular-nums ${token.text}`}>{token.hex}</span>
              </div>
              <div className="pt-2">
                <p className="text-xs font-medium text-[#17181C] font-mono">{token.name}</p>
                <p className="text-[11px] text-[#8B7A72] mt-0.5 leading-tight">{token.role}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 2. Typography */}
      <section className="space-y-6 border-t border-[rgba(139,122,114,0.2)] pt-12">
        <div>
          <h2 className="text-2xl font-serif text-[#17181C]">2. Typography hierarchy</h2>
          <p className="text-xs text-[#8B7A72] mt-1">
            Fraunces (serif) for H1/H2 headlines and hero. Work Sans for H3, body, buttons, and tables. Sentence case only.
          </p>
        </div>

        <div className="space-y-8 bg-[rgba(139,122,114,0.04)] p-8 border border-[rgba(139,122,114,0.15)]">
          <div className="border-b border-[rgba(139,122,114,0.15)] pb-4">
            <span className="text-[11px] text-[#8B7A72] font-mono block mb-1">H1 — Fraunces 500 (36px)</span>
            <h1 className="text-4xl font-serif text-[#17181C] font-normal">
              A serene synthesis of wood, stone, and time
            </h1>
          </div>

          <div className="border-b border-[rgba(139,122,114,0.15)] pb-4">
            <span className="text-[11px] text-[#8B7A72] font-mono block mb-1">H2 — Fraunces 500 (28px)</span>
            <h2 className="text-2xl font-serif text-[#17181C] font-normal">
              Hand-thrown stoneware vessels from Kyoto
            </h2>
          </div>

          <div className="border-b border-[rgba(139,122,114,0.15)] pb-4">
            <span className="text-[11px] text-[#8B7A72] font-mono block mb-1">H3 — Work Sans 500 (18px)</span>
            <h3 className="text-lg font-sans font-medium text-[#17181C]">
              Material tactile provenance and craftsman notes
            </h3>
          </div>

          <div>
            <span className="text-[11px] text-[#8B7A72] font-mono block mb-1">Body text — Work Sans 400 (15px)</span>
            <p className="text-sm text-[#17181C] leading-relaxed max-w-2xl font-sans">
              Every piece in our catalog is shaped in small studios using indigenous clays and naturally oiled timber. We eschew superfluous polish in favor of raw tactile integrity that acquires a gentle patina over years of quiet daily use.
            </p>
          </div>
        </div>
      </section>

      {/* 3. Buttons & Inputs */}
      <section className="space-y-6 border-t border-[rgba(139,122,114,0.2)] pt-12">
        <div>
          <h2 className="text-2xl font-serif text-[#17181C]">3. Interactive elements</h2>
          <p className="text-xs text-[#8B7A72] mt-1">
            Primary (ink with hover to brass), secondary (ink outline), inputs (max 2px radius, hairline border, brass focus ring).
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4 border border-[rgba(139,122,114,0.2)] p-6 bg-[#F2F1ED]">
            <p className="text-xs text-[#8B7A72] font-medium">Button variants (no icons appended, sentence case)</p>
            <div className="flex flex-wrap items-center gap-4">
              <Button variant="primary">Add to basket</Button>
              <Button variant="secondary">View specifications</Button>
              <Button variant="danger" size="sm">Remove item</Button>
            </div>
            <p className="text-xs text-[#8B7A72] pt-2">
              Hover states seamlessly transition to brass (<span className="font-mono">#A6824C</span>).
            </p>
          </div>

          <div className="space-y-4 border border-[rgba(139,122,114,0.2)] p-6 bg-[#F2F1ED]">
            <p className="text-xs text-[#8B7A72] font-medium">Form input (max 2px radius, hairline border)</p>
            <Input
              label="Product label"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Enter product title..."
            />
            <div className="flex items-center gap-2 pt-2">
              <Badge variant="forest">In stock</Badge>
              <Badge variant="stone">Archived</Badge>
              <Badge variant="brass">Limited run</Badge>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Table Row & Toast */}
      <section className="space-y-6 border-t border-[rgba(139,122,114,0.2)] pt-12">
        <div>
          <h2 className="text-2xl font-serif text-[#17181C]">4. Data table & toast notifications</h2>
          <p className="text-xs text-[#8B7A72] mt-1">
            Hairline borders, tabular figures, zero radius, zero shadow.
          </p>
        </div>

        <div className="border border-[rgba(139,122,114,0.2)] bg-[#F2F1ED]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order number</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-mono text-xs">#ORD-9024</TableCell>
                <TableCell>Eleanor Vance</TableCell>
                <TableCell>
                  <Badge variant="forest">Processing</Badge>
                </TableCell>
                <TableCell className="font-medium">$340.00</TableCell>
                <TableCell className="text-right">
                  <button className="text-xs text-[#17181C] hover:text-[#A6824C] underline cursor-pointer">
                    Inspect
                  </button>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-mono text-xs">#ORD-9025</TableCell>
                <TableCell>Marcus Aurelius</TableCell>
                <TableCell>
                  <Badge variant="stone">Shipped</Badge>
                </TableCell>
                <TableCell className="font-medium">$125.00</TableCell>
                <TableCell className="text-right">
                  <button className="text-xs text-[#17181C] hover:text-[#A6824C] underline cursor-pointer">
                    Inspect
                  </button>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>

        {/* Toast rendering */}
        <div className="pt-4">
          <p className="text-xs text-[#8B7A72] font-medium mb-3">Notification toast component</p>
          {showToast ? (
            <Toast
              title="Cart updated"
              description="Stoneware Ceramic Vessel added to your shopping bag."
              variant="ink"
              onClose={() => setShowToast(false)}
            />
          ) : (
            <Button variant="secondary" size="sm" onClick={() => setShowToast(true)}>
              Show toast
            </Button>
          )}
        </div>
      </section>

      {/* 5. ProductTile Component */}
      <section className="space-y-6 border-t border-[rgba(139,122,114,0.2)] pt-12">
        <div>
          <h2 className="text-2xl font-serif text-[#17181C]">5. ProductTile component</h2>
          <p className="text-xs text-[#8B7A72] mt-1">
            Flat image, 0px border-radius, zero shadow, thin hairline divider separating image from name/price.
          </p>
        </div>

        <div className="max-w-xs">
          <ProductTile
            id="sample-1"
            name="Stoneware Ceramic Vessel"
            category="Ceramics & Homeware"
            price={148.00}
            stock={12}
            image="/src/assets/images/product_ceramic_vessel_1790242838659.jpg"
            onAddToCart={() => alert('Added to cart')}
            onBuyNow={() => alert('Proceeding to buy now')}
          />
        </div>
      </section>
    </div>
  );
};
