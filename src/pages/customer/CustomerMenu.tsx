import React, { useState, useMemo, Suspense } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Clock, Search, Star, Eye, LogOut, ShoppingCart, Receipt, Plus, Minus, X } from 'lucide-react';
import LiveClock from '@/components/LiveClock';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/lib/auth-context';
import { useI18nStore } from '@/lib/i18n-store';
import { FastSellingBadge } from '@/components/FastSellingBadge';

// Imported modular widgets
import ChatbotWidget from './tabs/ChatbotWidget';
import FeedbackWidget from './tabs/FeedbackWidget';
import CartAndCheckout from './tabs/CartAndCheckout';
import OrderHistory from './tabs/OrderHistory';
const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';
import {
  useActiveOrders,
  usePastOrders,
  useCustomerMenu,
  useCart,
  useAddToCart,
  useUpdateCart,
  useDeleteCartItem,
} from '@/tanstack/alltanstack';

const LazyMenuItem3DViewer = React.lazy(() => import('@/components/MenuItem3DViewer'));

type DietFilter = 'all' | 'veg' | 'nonveg';
type TypeFilter = 'all' | 'food' | 'drink';

export interface MenuItem {
  id: number;
  name: string;
  description: string;
  price: number;
  image: string;
  category: string;
  type: 'food' | 'drink';
  vegetarian: boolean;
  todaysSpecial: boolean;
  available: boolean;
  popular?: boolean;
}

function normalizeMenuItem(raw: any): MenuItem {
  const vegRaw = String(raw.type ?? '').toLowerCase();
  const rawImage: string = raw.image_url ?? '';
  const image = rawImage && rawImage.startsWith('/')
    ? `${API_URL}${rawImage}`
    : rawImage;

  return {
    id: raw.item_id,
    name: raw.item_name,
    description: raw.description ?? '',
    price: Number(raw.price),
    image,
    category: raw.category ?? '',
    type: String(raw.category_type ?? 'food').toLowerCase().includes('drink') ? 'drink' : 'food',
    vegetarian: vegRaw.includes('veg') && !vegRaw.includes('non'),
    todaysSpecial: !!raw.is_today_special,
    available: raw.is_available ?? true,
    popular: !!raw.is_popular,
  };
}

interface ServerCartItem {
  item_id: number;
  item_name: string;
  quantity: number;
  price_per_item: number;
  total_price: number;
}

// Known backend category names map onto translation keys already defined in
// i18n-store.ts. Anything else falls back to the raw backend name.
const categoryKeyMap: Record<string, string> = {
  starters: 'starters',
  mains: 'mains',
  beverages: 'beverages',
  desserts: 'desserts',
  snacks: 'snacks',
};

// Language Dropdown (UI language only — there is no backend API for this)
const LanguageDropdown = () => {
  const { language, setLanguage, supportedLanguages } = useI18nStore();
  return (
    <Select value={language} onValueChange={(v) => setLanguage(v)}>
      <SelectTrigger className="h-9 w-[130px] rounded-xl text-xs">
        <SelectValue />
      </SelectTrigger>
      <SelectContent className="z-50 bg-popover">
        {supportedLanguages.map(l => (
          <SelectItem key={l.code} value={l.code} className="text-xs">
            <span className="font-medium">{l.nativeLabel}</span>
            <span className="ml-2 text-muted-foreground">({l.label})</span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

const VegIcon = ({ veg }: { veg?: boolean }) => (
  <div className={`h-5 w-5 rounded border-2 flex items-center justify-center flex-shrink-0 ${veg ? 'border-success' : 'border-destructive'}`}>
    <span className={`h-2.5 w-2.5 rounded-full ${veg ? 'bg-success' : 'bg-destructive'}`} />
  </div>
);

export default function CustomerMenu() {
  const [searchParams] = useSearchParams();
  const isPickup = searchParams.get('mode') === 'pickup';
  const tableNumber = isPickup ? 0 : parseInt(searchParams.get('table') || '1');
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Auth comes from AuthContext (token), not zustand.
  const auth: any = useAuth();

  const { getTranslation, t } = useI18nStore();

  const categoryLabel = (cat: string): string => {
    const key = categoryKeyMap[cat.toLowerCase()];
    return key ? t(key) : cat;
  };

  const { data: menuData, isLoading: isMenuLoading, isError: isMenuError } = useCustomerMenu();

  const menuItems: MenuItem[] = useMemo(() => {
    const rawItems = menuData?.menu_items ?? [];
    if (!Array.isArray(rawItems)) return [];
    return rawItems.map(normalizeMenuItem);
  }, [menuData]);

  const getAllCategories = () => {
    const cats = new Set(menuItems.map((i) => i.category).filter(Boolean));
    return Array.from(cats);
  };

  const { data: cartData } = useCart();
  const serverCartItems: ServerCartItem[] = cartData?.cart_items ?? [];
  const cartSubtotal = cartData?.subtotal ?? 0;
  const cartCgst = cartData?.cgst ?? 0;
  const cartSgst = cartData?.sgst ?? 0;
  const cartTotal = cartData?.total_amount ?? 0;

  const addToCartMutation = useAddToCart();
  const updateCartMutation = useUpdateCart();
  const deleteCartItemMutation = useDeleteCartItem();
  // Per-item busy flag: only the card whose request is in flight is locked
  // (double-click protection). A global flag made every Add button blink.
  const isItemBusy = (itemId: number) =>
    (addToCartMutation.isPending && addToCartMutation.variables?.item_id === itemId) ||
    (updateCartMutation.isPending && updateCartMutation.variables?.item_id === itemId) ||
    (deleteCartItemMutation.isPending && deleteCartItemMutation.variables?.item_id === itemId);

  const addToCart = (item: MenuItem) => {
    addToCartMutation.mutate({ item_id: item.id, table_no: tableNumber, quantity: 1 });
  };

  // FIX: minus on quantity 1 used to do nothing (backend update_cart would
  // keep the row). Now quantity <= 0 deletes the cart item, so the card goes
  // back to the "Add to cart" button.
  const updateQuantity = (itemId: number, quantity: number) => {
    if (quantity <= 0) {
      deleteCartItemMutation.mutate({ item_id: itemId });
      return;
    }
    updateCartMutation.mutate({ item_id: itemId, quantity });
  };

  const [activeCategory, setActiveCategory] = useState("Today's Special");
  const [search, setSearch] = useState('');
  const [dietFilter, setDietFilter] = useState<DietFilter>('all');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [selected3DItem, setSelected3DItem] = useState<MenuItem | null>(null);

  const [showCart, setShowCart] = useState(false);
  const [showOrderTracker, setShowOrderTracker] = useState(false);
  const [showPastOrders, setShowPastOrders] = useState(false);

  const allCategories = ["Today's Special", ...getAllCategories()];

  const { data: activeOrdersData } = useActiveOrders();
  const { data: pastOrdersData } = usePastOrders();
  const myOrders = activeOrdersData?.orders ?? [];
  const myPastOrders = pastOrdersData?.orders ?? [];

  const filteredItems = useMemo(() => {
    let items = activeCategory === "Today's Special"
      ? menuItems.filter(i => i.todaysSpecial && i.available)
      : activeCategory === 'All'
        ? menuItems.filter(i => i.available)
        : menuItems.filter(i => i.category === activeCategory && i.available);

    if (search) items = items.filter(i => i.name.toLowerCase().includes(search.toLowerCase()));
    if (dietFilter === 'veg') items = items.filter(i => i.vegetarian);
    if (dietFilter === 'nonveg') items = items.filter(i => !i.vegetarian);
    if (typeFilter !== 'all') items = items.filter(i => i.type === typeFilter);
    return items;
  }, [activeCategory, menuItems, search, dietFilter, typeFilter]);

  const cartCount = serverCartItems.reduce((s, i) => s + i.quantity, 0);

  // Logout: clear auth, wipe cached customer data, go to the login page.
  const handleLogout = () => {
    try { auth?.logout?.(); } catch { /* ignore */ }
    try { localStorage.removeItem('access_token'); } catch { /* ignore */ }
    queryClient.clear();
    navigate('/login', { replace: true });
  };

  // Backend returns 200 + { success:false, message } when the subscription
  // doesn't include the customer dashboard feature.
  const menuBlockedMessage: string | null =
    menuData && menuData.success === false ? (menuData.message || 'Menu is not available') : null;

  return (
    <div className="min-h-screen bg-background font-body">
      {/* Header */}
      <header className="sticky top-0 z-40 glass border-b border-border">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/" className="text-muted-foreground hover:text-foreground"><ArrowLeft className="h-5 w-5" /></Link>
            <div>
              <h1 className="text-lg font-heading font-bold text-foreground">Menu</h1>
              <p className="text-xs text-muted-foreground">{isPickup ? '📦 Pickup Order' : `${t('table')} ${tableNumber}`} • <LiveClock /></p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowPastOrders(true)} className="rounded-xl text-xs">
              <Clock className="h-3 w-3 mr-1" /> {t('past_orders')}
              {myPastOrders.length > 0 && <span className="ml-1 h-4 w-4 rounded-full bg-muted text-muted-foreground text-[10px] flex items-center justify-center">{myPastOrders.length}</span>}
            </Button>
            {myOrders.length > 0 && (
              <Button variant="outline" size="sm" onClick={() => setShowOrderTracker(true)} className="relative rounded-xl">
                <Receipt className="h-4 w-4 mr-1" /> {t('orders')}
                <span className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-primary text-primary-foreground text-[10px] flex items-center justify-center font-bold">{myOrders.length}</span>
              </Button>
            )}
            <Button variant="outline" size="sm" className="relative rounded-xl" onClick={() => setShowCart(true)}>
              <ShoppingCart className="h-4 w-4 mr-1" /> {t('cart')}
              {cartCount > 0 && <span className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-accent text-accent-foreground text-xs flex items-center justify-center font-bold">{cartCount}</span>}
            </Button>
            <LanguageDropdown />
            {/* Always visible — tapping it logs out and opens the login page */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              title="Logout"
              className="rounded-xl text-xs text-muted-foreground hover:text-destructive"
            >
              <LogOut className="h-4 w-4 sm:mr-1" />
              <span className="hidden sm:inline">Logout</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Search & Filters */}
      <div className="sticky top-[57px] z-30 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="container mx-auto px-4 py-3 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder={t('search_menu')} value={search} onChange={e => setSearch(e.target.value)} className="pl-9 rounded-xl h-10" />
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex gap-1 bg-muted rounded-xl p-1">
              {([{ id: 'all' as DietFilter, label: t('all') }, { id: 'veg' as DietFilter, label: `🟢 ${t('veg')}` }, { id: 'nonveg' as DietFilter, label: `🔴 ${t('non_veg')}` }]).map(f => (
                <button key={f.id} onClick={() => setDietFilter(f.id)}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${dietFilter === f.id ? 'bg-card text-foreground cafe-shadow' : 'text-muted-foreground'}`}>
                  {f.label}
                </button>
              ))}
            </div>
            <div className="flex gap-1 bg-muted rounded-xl p-1">
              {([{ id: 'all' as TypeFilter, label: t('all') }, { id: 'food' as TypeFilter, label: `🍽️ ${t('food')}` }, { id: 'drink' as TypeFilter, label: `🥤 ${t('drinks')}` }]).map(f => (
                <button key={f.id} onClick={() => setTypeFilter(f.id)}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${typeFilter === f.id ? 'bg-card text-foreground cafe-shadow' : 'text-muted-foreground'}`}>
                  {f.label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-2 overflow-x-auto scrollbar-none pb-1">
            {allCategories.map(cat => (
              <button key={cat} onClick={() => setActiveCategory(cat)}
                className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                  activeCategory === cat
                    ? cat === "Today's Special"
                      ? 'bg-gradient-to-r from-accent to-accent/80 text-accent-foreground glow-primary'
                      : 'bg-gradient-to-r from-primary to-primary/80 text-primary-foreground glow-primary'
                    : cat === "Today's Special"
                      ? 'bg-accent/10 border border-accent/30 text-accent hover:bg-accent/20 font-semibold'
                      : 'bg-card border border-border text-muted-foreground hover:text-foreground'
                }`}>
                {cat === "Today's Special" ? `⭐ ${t('todays_special')}` : categoryLabel(cat)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Menu Grid */}
      <main className="container mx-auto px-4 py-6">
        {isMenuLoading && (
          <div className="text-center py-16 text-muted-foreground">
            <p className="text-lg font-heading">Loading menu…</p>
          </div>
        )}
        {isMenuError && (
          <div className="text-center py-16 text-destructive">
            <p className="text-lg font-heading">Couldn't load the menu. Please try again.</p>
          </div>
        )}
        {menuBlockedMessage && (
          <div className="text-center py-16 text-destructive">
            <p className="text-lg font-heading">{menuBlockedMessage}</p>
          </div>
        )}

        {!isMenuLoading && !isMenuError && !menuBlockedMessage && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {filteredItems.map((item, i) => {
              const inCart = serverCartItems.find(c => c.item_id === item.id);
              const tx = getTranslation(String(item.id));
              const displayName = tx?.name || item.name;
              const displayDesc = tx?.description || item.description;

              return (
                <motion.div key={item.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }} className="card-3d group">
                  <div className="card-3d-inner flex gap-4 p-4 rounded-2xl bg-card border border-border cafe-shadow hover:cafe-shadow-lg transition-all">
                    <div className="relative w-28 h-28 flex-shrink-0 rounded-xl overflow-hidden cursor-pointer" onClick={() => setSelected3DItem(item)}>
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" loading="lazy" />
                      <div className="absolute inset-0 bg-gradient-to-t from-foreground/20 to-transparent" />
                      <div className="absolute bottom-1.5 right-1.5 h-7 w-7 rounded-lg bg-background/80 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Eye className="h-3.5 w-3.5 text-primary" />
                      </div>
                      {item.popular && (
                        <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-accent/90 text-accent-foreground text-[10px] font-bold flex items-center gap-1">
                          <Star className="h-3 w-3 fill-current" /> {t('popular')}
                        </div>
                      )}
                      <div className="absolute bottom-2 left-2"><FastSellingBadge itemId={String(item.id)} /></div>
                    </div>
                    <div className="flex-1 min-w-0 flex flex-col">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-heading font-semibold text-foreground text-base leading-tight">{displayName}</h3>
                        <VegIcon veg={item.vegetarian} />
                      </div>
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2 flex-1">{displayDesc}</p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xl font-bold text-foreground">₹{item.price}</span>
                        {inCart ? (
                          <div className="flex items-center gap-1.5">
                            <button
                              disabled={isItemBusy(item.id)}
                              onClick={() => updateQuantity(item.id, inCart.quantity - 1)}
                              className="h-9 w-9 rounded-xl bg-muted flex items-center justify-center hover:bg-secondary transition-colors disabled:opacity-100"
                            >
                              <Minus className="h-4 w-4" />
                            </button>
                            <span className="text-base font-bold w-7 text-center">{inCart.quantity}</span>
                            <button
                              disabled={isItemBusy(item.id)}
                              onClick={() => updateQuantity(item.id, inCart.quantity + 1)}
                              className="h-9 w-9 rounded-xl bg-gradient-to-r from-primary to-primary/80 text-primary-foreground flex items-center justify-center disabled:opacity-100"
                            >
                              <Plus className="h-4 w-4" />
                            </button>
                          </div>
                        ) : (
                          <Button
                            size="sm"
                            disabled={isItemBusy(item.id)}
                            className="h-9 rounded-xl bg-gradient-to-r from-primary to-primary/80 text-primary-foreground text-sm disabled:opacity-100"
                            onClick={() => addToCart(item)}
                          >
                            <Plus className="h-3.5 w-3.5 mr-1" /> {t('add_to_cart')}
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
        {!isMenuLoading && !isMenuError && !menuBlockedMessage && filteredItems.length === 0 && (
          <div className="text-center py-16 text-muted-foreground"><p className="text-lg font-heading">No items found</p></div>
        )}
      </main>

      {/* Sub-Components */}
      <CartAndCheckout
        tableNumber={tableNumber}
        isPickup={isPickup}
        showCart={showCart}
        setShowCart={setShowCart}
        openOrderTracker={() => setShowOrderTracker(true)}
        cartItems={serverCartItems}
        subtotal={cartSubtotal}
        cgst={cartCgst}
        sgst={cartSgst}
        total={cartTotal}
      />

      <OrderHistory
        tableNumber={tableNumber}
        showOrderTracker={showOrderTracker}
        setShowOrderTracker={setShowOrderTracker}
        showPastOrders={showPastOrders}
        setShowPastOrders={setShowPastOrders}
      />

      <FeedbackWidget tableNumber={tableNumber} />

      <ChatbotWidget menuItems={menuItems} />

      {/* 3D Viewer Modal */}
      <AnimatePresence>
        {selected3DItem && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-foreground/40 backdrop-blur-sm z-50" onClick={() => setSelected3DItem(null)} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[calc(100%-2rem)] max-w-lg bg-background rounded-2xl border border-border p-5 z-50 cafe-shadow-lg">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <VegIcon veg={selected3DItem.vegetarian} />
                  <h3 className="font-heading font-bold text-lg">{selected3DItem.name}</h3>
                </div>
                <button onClick={() => setSelected3DItem(null)} className="h-8 w-8 rounded-xl bg-muted flex items-center justify-center"><X className="h-4 w-4" /></button>
              </div>
              <div className="relative w-full h-64 sm:h-80 rounded-xl overflow-hidden border border-border">
                <Suspense fallback={
                  <div className="w-full h-full flex items-center justify-center bg-muted/20">
                    <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
                  </div>
                }>
                  <LazyMenuItem3DViewer
                    category={selected3DItem.category}
                    vegetarian={selected3DItem.vegetarian}
                    itemName={selected3DItem.name}
                    fallbackImage={selected3DItem.image}
                  />
                </Suspense>
              </div>
              <div className="mt-3 space-y-2">
                <p className="text-sm text-muted-foreground">{selected3DItem.description}</p>
                <div className="flex items-center justify-between">
                  <span className="text-xl font-bold text-foreground">₹{selected3DItem.price}</span>
                  <Button size="sm" className="rounded-xl bg-gradient-to-r from-primary to-primary/80 text-primary-foreground"
                    onClick={() => { addToCart(selected3DItem); setSelected3DItem(null); }}>
                    <Plus className="h-3 w-3 mr-1" /> {t('add_to_cart')}
                  </Button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

    </div>
  );
}