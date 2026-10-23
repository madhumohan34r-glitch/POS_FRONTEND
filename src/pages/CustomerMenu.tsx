// import React, { useState, useMemo, Suspense } from 'react';
// import LiveClock from '@/components/LiveClock';
// import { useSearchParams, Link, useNavigate } from 'react-router-dom';
// import { motion, AnimatePresence } from 'framer-motion';
// import { ShoppingCart, Plus, Minus, ArrowLeft, Trash2, Leaf, Star, X, Receipt, Clock, CheckCircle2, ChefHat, LogOut, Search, Sparkles, Banknote, CreditCard, Smartphone, MessageCircle, Eye } from 'lucide-react';
// import { Button } from '@/components/ui/button';
// import { Badge } from '@/components/ui/badge';
// import { Input } from '@/components/ui/input';
// import { Label } from '@/components/ui/label';
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
// import { TAX_RATE, GST_NUMBER, menuAllergyData } from '@/lib/menu-data';
// import { useOrderStore } from '@/lib/order-store';
// import { useAuthStore } from '@/lib/auth-store';
// import { useCafeStore } from '@/lib/cafe-store';
// import { useI18nStore, type Language } from '@/lib/i18n-store';
// import { useStockStore } from '@/lib/stock-store';
// import { toast } from 'sonner';
// import type { MenuItem } from '@/lib/menu-data';
// import { FastSellingBadge } from '@/components/FastSellingBadge';

// const LazyMenuItem3DViewer = React.lazy(() => import('@/components/MenuItem3DViewer'));

// // Dynamic, scalable language picker driven by useI18nStore.supportedLanguages
// const LanguageDropdown = () => {
//   const { language, setLanguage, supportedLanguages } = useI18nStore();
//   return (
//     <Select value={language} onValueChange={(v) => setLanguage(v)}>
//       <SelectTrigger className="h-9 w-[130px] rounded-xl text-xs">
//         <SelectValue />
//       </SelectTrigger>
//       <SelectContent className="z-50 bg-popover">
//         {supportedLanguages.map(l => (
//           <SelectItem key={l.code} value={l.code} className="text-xs">
//             <span className="font-medium">{l.nativeLabel}</span>
//             <span className="ml-2 text-muted-foreground">({l.label})</span>
//           </SelectItem>
//         ))}
//       </SelectContent>
//     </Select>
//   );
// };

// // Privacy guard: block requests for personal/PII data
// const PRIVACY_PATTERNS = [
//   /\b(my|your|staff|owner|manager|chef)?\s*(name|phone|mobile|email|address|home|salary|aadhaar|pan|otp|password)\b/i,
//   /\bcontact (number|info|details)\b/i,
//   /\bwho (works|is working|is the (owner|manager|chef))\b/i,
// ];
// const PRIVACY_REPLY = 'Please contact store staff for assistance.';

// // Smart chatbot reply based on menu data
// const getChatbotReply = (msg: string, items: MenuItem[], settings: any): string => {
//   if (PRIVACY_PATTERNS.some(p => p.test(msg))) return PRIVACY_REPLY;
//   const lower = msg.toLowerCase();
//   const popularItems = items.filter(i => i.popular && i.available);
//   const vegItems = items.filter(i => i.vegetarian && i.available);
//   const nonVegItems = items.filter(i => !i.vegetarian && i.available && i.type === 'food');
//   const drinks = items.filter(i => i.type === 'drink' && i.available);
//   const desserts = items.filter(i => i.category === 'Desserts' && i.available);
//   const starters = items.filter(i => i.category === 'Starters' && i.available);
//   const mains = items.filter(i => i.category === 'Mains' && i.available);
//   const snacks = items.filter(i => i.category === 'Snacks' && i.available);

//   // 1. Recommendations & Favorites
//   if (lower.includes('must-try dish') || lower.includes('must try dish') || lower.includes('best dish')) {
//     const top = popularItems.filter(i => i.type === 'food').slice(0, 3);
//     return top.length > 0 ? `🌟 Must-try dishes: ${top.map(i => `${i.name} (₹${i.price})`).join(', ')}. You won't be disappointed!` : 'All our dishes are must-tries! Check out our menu above.';
//   }
//   if (lower.includes('must-try drink') || lower.includes('must try drink') || lower.includes('best drink') || lower.includes('best beverage')) {
//     const top = drinks.filter(i => i.popular).slice(0, 3);
//     return top.length > 0 ? `🥤 Must-try drinks: ${top.map(i => `${i.name} (₹${i.price})`).join(', ')}. Absolutely refreshing!` : `🥤 Our beverages: ${drinks.slice(0, 3).map(i => `${i.name} (₹${i.price})`).join(', ')}`;
//   }
//   if (lower.includes('most ordered') || lower.includes('trending') || lower.includes('popular')) {
//     const names = popularItems.slice(0, 5).map(i => `${i.name} (₹${i.price})`).join(', ');
//     return popularItems.length > 0 ? `🔥 Most ordered today: ${names}. These are flying off the kitchen!` : 'All items are popular here! Browse our full menu.';
//   }
//   if (lower.includes('chef') && lower.includes('special')) {
//     const specials = popularItems.slice(0, 2);
//     return specials.length > 0 ? `👨‍🍳 Chef's Special today: ${specials.map(i => `${i.name} (₹${i.price}) — ${i.description}`).join(' | ')}` : 'Ask our staff about today\'s Chef Special!';
//   }
//   if (lower.includes('spicy') || lower.includes('hot')) {
//     const spicy = nonVegItems.slice(0, 3);
//     return spicy.length > 0 ? `🌶️ Spicy recommendations: ${spicy.map(i => `${i.name} (₹${i.price})`).join(', ')}. For the adventurous palate!` : 'Check our Mains section for bold flavors!';
//   }
//   if (lower.includes('best-selling') || lower.includes('bestselling') || lower.includes('best selling')) {
//     const match = lower.includes('dessert') ? desserts : lower.includes('beverage') || lower.includes('drink') ? drinks : popularItems;
//     const names = match.filter(i => i.popular).slice(0, 3).map(i => `${i.name} (₹${i.price})`).join(', ');
//     return names ? `⭐ Best sellers: ${names}` : 'All our items are loved! Check the menu for options.';
//   }
//   if (lower.includes('recommend') || lower.includes('suggest')) {
//     const names = popularItems.slice(0, 4).map(i => `${i.name} (₹${i.price})`).join(', ');
//     return `⭐ I recommend: ${names}. Would you like to add any to your cart?`;
//   }

//   // 2. Operational & General Info
//   if (lower.includes('opening') || lower.includes('closing') || lower.includes('hours') || lower.includes('timing') || lower.includes('open') || lower.includes('close')) {
//     return `🕐 We are open from ${settings.openingTime || '08:00'} to ${settings.closingTime || '22:00'}, ${(settings.operationalDays || []).join(', ')}. Come visit us!`;
//   }
//   if (lower.includes('pet friendly') || lower.includes('pets')) {
//     return '🐾 Yes, we are pet-friendly! Well-behaved pets on leashes are welcome in our outdoor seating area.';
//   }
//   if (lower.includes('parking') || lower.includes('park')) {
//     return '🅿️ Yes, we have free parking available for our guests. There\'s a dedicated parking area right outside.';
//   }
//   if (lower.includes('takeaway') || lower.includes('take away') || lower.includes('parcel') || lower.includes('to go')) {
//     return '📦 Yes, we accept takeaway orders! You can place your order here and pick it up at the counter.';
//   }
//   if (lower.includes('hall') || lower.includes('meeting') || lower.includes('party') || lower.includes('event room')) {
//     return '🎉 Yes, we have a party hall / meeting room available! Please contact our staff at the counter for availability and booking.';
//   }
//   if (lower.includes('wifi') || lower.includes('wi-fi') || lower.includes('internet')) {
//     return '📶 Yes, we have free Wi-Fi! Network: CafeFlow_Guest | Password: coffee2024. Enjoy!';
//   }
//   if (lower.includes('washroom') || lower.includes('restroom') || lower.includes('toilet') || lower.includes('bathroom')) {
//     return '🚻 Washrooms are located near the back of the café, past the counter area. Look for the signs!';
//   }
//   if (lower.includes('smoking') || lower.includes('smoke')) {
//     return '🚭 We have a designated smoking area outside on the terrace. The indoor area is non-smoking.';
//   }
//   if (lower.includes('waiting time') || lower.includes('how long') || lower.includes('wait')) {
//     return '⏱️ Average waiting time is 15-20 minutes for food items and 5-7 minutes for beverages. During peak hours, it may take slightly longer.';
//   }
//   if (lower.includes('event') || lower.includes('upcoming')) {
//     return '🎶 Check our social media pages for upcoming events! We regularly host live music nights and themed food festivals.';
//   }

//   // 3. Dietary, Ingredient, Allergen & Spice Queries
//   // Allergen lookup: "does X contain dairy?" / "is X gluten-free?"
//   const allergenKeywords = ['dairy', 'gluten', 'eggs', 'nuts', 'peanut', 'soy', 'shellfish'];
//   const hitAllergen = allergenKeywords.find(a => lower.includes(a));
//   if (hitAllergen && (lower.includes('contain') || lower.includes('allerg') || lower.includes('free'))) {
//     const matchedItem = items.find(i => lower.includes(i.name.toLowerCase().split(' ')[0]));
//     if (matchedItem) {
//       const info = menuAllergyData[matchedItem.id];
//       if (info) {
//         const has = info.allergens.some(a => a.toLowerCase().includes(hitAllergen));
//         return has
//           ? `⚠️ Yes, ${matchedItem.name} contains ${hitAllergen}. Full allergens: ${info.allergens.join(', ') || 'none listed'}.`
//           : `✅ ${matchedItem.name} is ${hitAllergen}-free. Allergens present: ${info.allergens.join(', ') || 'none'}.`;
//       }
//     }
//     const safe = items.filter(i => i.available && !(menuAllergyData[i.id]?.allergens || []).some(a => a.toLowerCase().includes(hitAllergen))).slice(0, 5);
//     return `✅ ${hitAllergen}-free options: ${safe.map(i => i.name).join(', ') || 'Please ask staff'}.`;
//   }
//   // Ingredient lookup: "what's in X?" / "ingredients of X"
//   if (lower.includes('ingredient') || lower.includes("what's in") || lower.includes('what is in') || lower.includes('made of') || lower.includes('made with')) {
//     const matchedItem = items.find(i => lower.includes(i.name.toLowerCase().split(' ')[0]));
//     if (matchedItem) {
//       const info = menuAllergyData[matchedItem.id];
//       return info
//         ? `🥘 ${matchedItem.name} ingredients: ${info.ingredients.join(', ')}.${info.calories ? ` (~${info.calories} kcal)` : ''}`
//         : `Sorry, no ingredient info for ${matchedItem.name}. Please ask our staff.`;
//     }
//     return 'Which item would you like ingredient info for? Mention it by name.';
//   }
//   // Spice level lookup
//   if (lower.includes('spice level') || lower.includes('how spicy') || (lower.includes('spicy') && lower.includes('?'))) {
//     const matchedItem = items.find(i => lower.includes(i.name.toLowerCase().split(' ')[0]));
//     if (matchedItem) {
//       const info = menuAllergyData[matchedItem.id];
//       const emoji = { none: '⚪ Not spicy', mild: '🌶️ Mild', medium: '🌶️🌶️ Medium', hot: '🌶️🌶️🌶️ Hot', 'extra-hot': '🌶️🌶️🌶️🌶️ Extra Hot' };
//       return info ? `${emoji[info.spiceLevel]} — ${matchedItem.name}` : `Spice info unavailable for ${matchedItem.name}.`;
//     }
//     const spicyItems = items.filter(i => ['hot', 'extra-hot'].includes(menuAllergyData[i.id]?.spiceLevel || '')).slice(0, 4);
//     return spicyItems.length ? `🌶️ Spicy items: ${spicyItems.map(i => i.name).join(', ')}.` : 'Most of our menu is mild. Ask staff to customize.';
//   }
//   if (lower.includes('vegetarian') || lower.includes('veg option') || lower.includes('veg food')) {
//     const names = vegItems.slice(0, 5).map(i => `${i.name} (₹${i.price})`).join(', ');
//     return `🟢 Vegetarian options: ${names}. Use the Veg filter above to see all!`;
//   }
//   if (lower.includes('non-veg') || lower.includes('nonveg') || lower.includes('non veg') || lower.includes('chicken') || lower.includes('meat')) {
//     const names = nonVegItems.slice(0, 4).map(i => `${i.name} (₹${i.price})`).join(', ');
//     return `🔴 Non-veg options: ${names}. Check them out!`;
//   }
//   if (lower.includes('gluten') && lower.includes('free')) {
//     return '🌾 For gluten-free options, we recommend our salads and grilled items. Please inform our staff about allergies when ordering.';
//   }
//   if (lower.includes('sugar') && lower.includes('free')) {
//     return '🍬 We offer sugar-free versions of our beverages. Ask our staff for sugar-free sweetener options with any drink!';
//   }

//   // 4. Offers & Loyalty
//   if (lower.includes('discount') || lower.includes('offer') || lower.includes('combo') || lower.includes('deal')) {
//     return '🎁 Check with our staff for today\'s special offers and combo deals! We regularly run Happy Hour discounts.';
//   }
//   if (lower.includes('happy hour')) {
//     return '🍻 Happy Hour runs from 4 PM to 7 PM with special discounts on selected beverages. Don\'t miss it!';
//   }
//   if (lower.includes('loyalty') || lower.includes('membership') || lower.includes('reward')) {
//     return '💳 Ask our staff about our loyalty program! Earn points with every purchase and redeem them for free items.';
//   }

//   // 5. Service Escalation
//   if (lower.includes('talk to') || lower.includes('human') || lower.includes('staff member') || lower.includes('waiter') || lower.includes('call staff')) {
//     return '👋 I\'ll notify a staff member to assist you! In the meantime, you can also press the bell at your table.';
//   }
//   if (lower.includes('bill') || lower.includes('problem') || lower.includes('issue') || lower.includes('complaint')) {
//     return '⚠️ I\'m sorry to hear that! Please let our staff know about the issue — they\'ll resolve it right away. You can also leave feedback using the feedback option.';
//   }
//   if (lower.includes('refill') || lower.includes('top up') || lower.includes('more water')) {
//     return '☕ For refills, just tap the bell icon or let any passing staff member know. We\'re happy to help!';
//   }

//   // General queries
//   if (lower.includes('drink') || lower.includes('beverage') || lower.includes('coffee') || lower.includes('juice') || lower.includes('tea')) {
//     const names = drinks.slice(0, 4).map(i => `${i.name} (₹${i.price})`).join(', ');
//     return `🥤 Our beverages: ${names}. Perfect to complement your meal!`;
//   }
//   if (lower.includes('dessert') || lower.includes('sweet') || lower.includes('cake')) {
//     const names = desserts.slice(0, 4).map(i => `${i.name} (₹${i.price})`).join(', ');
//     return `🍰 Desserts: ${names}. A sweet ending to your meal!`;
//   }
//   if (lower.includes('starter') || lower.includes('appetizer')) {
//     const names = starters.slice(0, 4).map(i => `${i.name} (₹${i.price})`).join(', ');
//     return `🥗 Starters: ${names}. Great way to begin!`;
//   }
//   if (lower.includes('snack')) {
//     const names = snacks.slice(0, 4).map(i => `${i.name} (₹${i.price})`).join(', ');
//     return `🍟 Snacks: ${names}. Perfect for a quick bite!`;
//   }
//   if (lower.includes('cheap') || lower.includes('affordable') || lower.includes('budget') || lower.includes('lowest')) {
//     const sorted = [...items].filter(i => i.available).sort((a, b) => a.price - b.price).slice(0, 3);
//     const names = sorted.map(i => `${i.name} (₹${i.price})`).join(', ');
//     return `💰 Most affordable: ${names}. Great value!`;
//   }
//   if (lower.includes('expensive') || lower.includes('premium') || lower.includes('special')) {
//     const sorted = [...items].filter(i => i.available).sort((a, b) => b.price - a.price).slice(0, 3);
//     const names = sorted.map(i => `${i.name} (₹${i.price})`).join(', ');
//     return `✨ Premium picks: ${names}. Worth every penny!`;
//   }
//   if (lower.includes('price') || lower.includes('cost') || lower.includes('how much')) {
//     const match = items.find(i => lower.includes(i.name.toLowerCase()));
//     if (match) return `${match.name} costs ₹${match.price}. ${match.vegetarian ? '🟢 Veg' : '🔴 Non-Veg'}. ${match.description}`;
//     return 'Which item would you like to know the price of? Ask about any item by name!';
//   }
//   if (lower.includes('hello') || lower.includes('hi') || lower.includes('hey')) {
//     return 'Hello! 👋 How can I help? I can suggest popular items, answer questions about our menu, dietary options, offers, and more!';
//   }
//   if (lower.includes('thank')) {
//     return 'You\'re welcome! 😊 Enjoy your meal. Let me know if you need anything else!';
//   }
//   if (lower.includes('menu') || lower.includes('what do you have') || lower.includes('what\'s available')) {
//     return `📋 We have ${starters.length} Starters, ${mains.length} Mains, ${drinks.length} Beverages, ${desserts.length} Desserts, and ${snacks.length} Snacks. Use the category filters above to browse!`;
//   }

//   // Try to match item name
//   const match = items.find(i => lower.includes(i.name.toLowerCase().split(' ')[0].toLowerCase()));
//   if (match) {
//     return `${match.name} — ₹${match.price}. ${match.vegetarian ? '🟢 Veg' : '🔴 Non-Veg'}. ${match.description}. ${match.popular ? '⭐ Popular choice!' : ''}`;
//   }

//   return `I can help you with:\n• "Must-try dish/drink" — our best picks\n• "Popular items" — today's trending\n• "Veg / Non-Veg options"\n• "Opening hours" — our timings\n• "Wi-Fi / Parking / Washrooms"\n• "Discounts / Offers"\n• "Talk to staff" — human assistance\n• Ask about any item by name!\nWhat would you like to know? 😊`;
// };

// type PaymentTiming = 'prepayment' | 'postpayment';
// type DietFilter = 'all' | 'veg' | 'nonveg';
// type TypeFilter = 'all' | 'food' | 'drink';

// const CustomerMenu = () => {
//   const [searchParams] = useSearchParams();
//   const isPickup = searchParams.get('mode') === 'pickup';
//   const tableNumber = isPickup ? 0 : parseInt(searchParams.get('table') || '1');
//   const [pickupAt, setPickupAt] = useState<string>('');
//   const [pickupName, setPickupName] = useState<string>('');
//   const [pickupPhone, setPickupPhone] = useState<string>('');
//   const [activeCategory, setActiveCategory] = useState("Today's Special");
//   const [search, setSearch] = useState('');
//   const [dietFilter, setDietFilter] = useState<DietFilter>('all');
//   const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
//   const [showCart, setShowCart] = useState(false);
//   const [showReceipt, setShowReceipt] = useState(false);
//   const [showOrderTracker, setShowOrderTracker] = useState(false);
//   const [showPastOrders, setShowPastOrders] = useState(false);
//   const [lastOrder, setLastOrder] = useState<ReturnType<typeof placeOrder> | null>(null);
//   const [paymentTiming, setPaymentTiming] = useState<PaymentTiming>('postpayment');
//   const [selectedPayMethod, setSelectedPayMethod] = useState<'cash' | 'card' | 'upi'>(searchParams.get('mode') === 'pickup' ? 'card' : 'cash');
//   const [showPaymentProcess, setShowPaymentProcess] = useState(false);
//   const [showChatbot, setShowChatbot] = useState(false);
//   const [chatMessage, setChatMessage] = useState('');
//   const [chatMessages, setChatMessages] = useState<{ from: 'user' | 'bot'; text: string }[]>([
//     { from: 'bot', text: 'Hi! 👋 I\'m your CaféFlow assistant. I can help you with menu recommendations, dietary info, or any questions!' },
//   ]);
//   const [selected3DItem, setSelected3DItem] = useState<MenuItem | null>(null);
//   const navigate = useNavigate();

//   const { user, isAuthenticated, logout } = useAuthStore();
//   const { settings, addFeedback } = useCafeStore();
//   const { language, setLanguage, getTranslation, t } = useI18nStore();
//   const { isOutOfStock, getStock } = useStockStore();
//   const { cart, addToCart, removeFromCart, updateQuantity, updateNotes, getCartTotal, getCartTax, getCartGrandTotal, placeOrder, menuItems, orders, getAllCategories } = useOrderStore();
//   const [feedbackRating, setFeedbackRating] = useState(0);
//   const [feedbackMessage, setFeedbackMessage] = useState('');
//   const [showFeedback, setShowFeedback] = useState(false);
//   const [feedbackOrderId, setFeedbackOrderId] = useState('');
//   const [feedbackItemId, setFeedbackItemId] = useState('');
//   const [feedbackItemName, setFeedbackItemName] = useState('');

//   const allCategories = ["Today's Special", ...getAllCategories()];
//   const myOrders = orders.filter(o => o.tableNumber === tableNumber && !['paid'].includes(o.status));
//   const myPastOrders = orders.filter(o => o.tableNumber === tableNumber && ['paid', 'served'].includes(o.status));

//   const filteredItems = useMemo(() => {
//     let items: typeof menuItems;
//     if (activeCategory === "Today's Special") {
//       items = menuItems.filter(i => i.todaysSpecial && i.available);
//     } else {
//       items = activeCategory === 'All' ? menuItems.filter(i => i.available) : menuItems.filter(i => i.category === activeCategory && i.available);
//     }
//     // Hide out-of-stock items from customer menu
//     items = items.filter(i => !isOutOfStock(i.id));
//     if (search) items = items.filter(i => i.name.toLowerCase().includes(search.toLowerCase()));
//     if (dietFilter === 'veg') items = items.filter(i => i.vegetarian);
//     if (dietFilter === 'nonveg') items = items.filter(i => !i.vegetarian);
//     if (typeFilter !== 'all') items = items.filter(i => i.type === typeFilter);
//     return items;
//   }, [activeCategory, menuItems, search, dietFilter, typeFilter, isOutOfStock]);

//   const cartCount = cart.reduce((s, i) => s + i.quantity, 0);

//   const effectivePaymentTiming = isPickup ? 'prepayment' : (settings.paymentMode === 'both' ? paymentTiming : settings.paymentMode);

//   const handlePlaceOrder = () => {
//     if (cart.length === 0) return;
//     if (isPickup) {
//       if (!pickupAt) { toast.error('Please select a pickup time.'); return; }
//       if (!pickupName.trim() || !pickupPhone.trim()) { toast.error('Please enter your name and phone.'); return; }
//       setShowPaymentProcess(true);
//       return;
//     }
//     if (effectivePaymentTiming === 'prepayment') {
//       setShowPaymentProcess(true);
//     } else {
//       const order = placeOrder(tableNumber, selectedPayMethod, 'postpayment');
//       setLastOrder(order);
//       setShowCart(false);
//       setShowReceipt(true);
//       toast.success('Order placed! Your food is being prepared.');
//     }
//   };

//   const handleConfirmPayment = () => {
//     const extras = isPickup
//       ? { orderType: 'pickup' as const, pickupAt, customerName: pickupName, customerPhone: pickupPhone }
//       : undefined;
//     const order = placeOrder(tableNumber, selectedPayMethod, 'prepayment', extras);
//     setLastOrder(order);
//     setShowPaymentProcess(false);
//     setShowCart(false);
//     setShowReceipt(true);
//     toast.success(isPickup ? 'Pickup order confirmed!' : 'Payment confirmed & order placed!');
//   };

//   const handleLogout = () => { logout(); navigate('/login'); };

//   const statusSteps = ['pending', 'preparing', 'ready', 'served'];
//   const statusLabel = (s: string) => ({ pending: 'Order Received', preparing: 'Being Prepared', ready: 'Ready!', served: 'Served' }[s] || s);
//   const statusIcon = (s: string) => {
//     switch (s) {
//       case 'pending': return <Clock className="h-4 w-4 text-accent" />;
//       case 'preparing': return <ChefHat className="h-4 w-4 text-info" />;
//       case 'ready': return <CheckCircle2 className="h-4 w-4 text-success" />;
//       case 'served': return <CheckCircle2 className="h-4 w-4 text-primary" />;
//       default: return <Clock className="h-4 w-4" />;
//     }
//   };

//   // Veg/Non-veg indicator
//   const VegIcon = ({ veg }: { veg?: boolean }) => (
//     <div className={`h-5 w-5 rounded border-2 flex items-center justify-center flex-shrink-0 ${veg ? 'border-success' : 'border-destructive'}`}>
//       <span className={`h-2.5 w-2.5 rounded-full ${veg ? 'bg-success' : 'bg-destructive'}`} />
//     </div>
//   );

//   return (
//     <div className="min-h-screen bg-background font-body">
//       {/* Header */}
//       <div className="bg-primary/10 border-b border-primary/20 px-4 py-2 text-center text-xs sm:text-sm">
//         <Clock className="inline h-3.5 w-3.5 mr-1 text-primary" />
//         Open today: <span className="font-semibold text-foreground">{settings.openingTime || '08:00'} – {settings.closingTime || '22:00'}</span>
//         <span className="text-muted-foreground"> • {(settings.operationalDays || []).join(', ')}</span>
//       </div>
//       <header className="sticky top-0 z-40 glass border-b border-border">
//         <div className="container mx-auto px-4 py-3 flex items-center justify-between">
//           <div className="flex items-center gap-3">
//             <Link to="/" className="text-muted-foreground hover:text-foreground"><ArrowLeft className="h-5 w-5" /></Link>
//             <div className="flex items-center gap-2">
//               {settings.logo && <img src={settings.logo} alt="Logo" className="h-8 w-8 rounded-lg object-contain" />}
//               <div>
//                 <h1 className="text-lg font-heading font-bold text-foreground">{settings.name}</h1>
//                 <p className="text-xs text-muted-foreground">{isPickup ? '📦 Pickup Order' : `Table ${tableNumber}`} • <LiveClock /></p>
//               </div>
//             </div>
//           </div>
//           <div className="flex items-center gap-2">
//             <Button variant="outline" size="sm" onClick={() => setShowPastOrders(true)} className="rounded-xl text-xs">
//               <Clock className="h-3 w-3 mr-1" /> Past Orders
//               {myPastOrders.length > 0 && <span className="ml-1 h-4 w-4 rounded-full bg-muted text-muted-foreground text-[10px] flex items-center justify-center">{myPastOrders.length}</span>}
//             </Button>
//             {myOrders.length > 0 && (
//               <Button variant="outline" size="sm" onClick={() => setShowOrderTracker(true)} className="relative rounded-xl">
//                 <Receipt className="h-4 w-4 mr-1" /> Orders
//                 <span className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-primary text-primary-foreground text-[10px] flex items-center justify-center font-bold">{myOrders.length}</span>
//               </Button>
//             )}
//             <Button variant="outline" size="sm" className="relative rounded-xl" onClick={() => setShowCart(true)}>
//               <ShoppingCart className="h-4 w-4 mr-1" /> Cart
//               {cartCount > 0 && <span className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-accent text-accent-foreground text-xs flex items-center justify-center font-bold">{cartCount}</span>}
//             </Button>
//             {/* Language dropdown — dynamic, scalable */}
//             <LanguageDropdown />

//             {isAuthenticated && user && (
//               <Button variant="ghost" size="icon" onClick={handleLogout} className="text-muted-foreground hover:text-destructive h-8 w-8"><LogOut className="h-4 w-4" /></Button>
//             )}
//           </div>
//         </div>
//       </header>

//       {/* Search & Filters */}
//       <div className="sticky top-[57px] z-30 bg-background/95 backdrop-blur-sm border-b border-border">
//         <div className="container mx-auto px-4 py-3 space-y-3">
//           <div className="relative">
//             <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
//             <Input placeholder="Search menu..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 rounded-xl h-10" />
//           </div>
//           <div className="flex items-center gap-3 flex-wrap">
//             {/* Veg/Non-veg filter */}
//             <div className="flex gap-1 bg-muted rounded-xl p-1">
//               {([{ id: 'all' as DietFilter, label: 'All' }, { id: 'veg' as DietFilter, label: '🟢 Veg' }, { id: 'nonveg' as DietFilter, label: '🔴 Non-Veg' }]).map(f => (
//                 <button key={f.id} onClick={() => setDietFilter(f.id)}
//                   className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${dietFilter === f.id ? 'bg-card text-foreground cafe-shadow' : 'text-muted-foreground'}`}>
//                   {f.label}
//                 </button>
//               ))}
//             </div>
//             {/* Food/Drinks filter */}
//             <div className="flex gap-1 bg-muted rounded-xl p-1">
//               {([{ id: 'all' as TypeFilter, label: 'All' }, { id: 'food' as TypeFilter, label: '🍽️ Food' }, { id: 'drink' as TypeFilter, label: '🥤 Drinks' }]).map(f => (
//                 <button key={f.id} onClick={() => setTypeFilter(f.id)}
//                   className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${typeFilter === f.id ? 'bg-card text-foreground cafe-shadow' : 'text-muted-foreground'}`}>
//                   {f.label}
//                 </button>
//               ))}
//             </div>
//           </div>
//           <div className="flex gap-2 overflow-x-auto scrollbar-none pb-1">
//             {allCategories.map(cat => (
//               <button key={cat} onClick={() => setActiveCategory(cat)}
//                 className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
//                   activeCategory === cat
//                     ? cat === "Today's Special"
//                       ? 'bg-gradient-to-r from-accent to-accent/80 text-accent-foreground glow-primary'
//                       : 'bg-gradient-to-r from-primary to-primary/80 text-primary-foreground glow-primary'
//                     : cat === "Today's Special"
//                       ? 'bg-accent/10 border border-accent/30 text-accent hover:bg-accent/20 font-semibold'
//                       : 'bg-card border border-border text-muted-foreground hover:text-foreground'
//                 }`}>
//                 {cat === "Today's Special" ? '⭐ ' : ''}{cat}
//               </button>
//             ))}
//           </div>
//         </div>
//       </div>

//       {/* Menu Items */}
//       <main className="container mx-auto px-4 py-6">
//         <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
//           {filteredItems.map((item, i) => {
//             const inCart = cart.find(c => c.id === item.id);
//             const tx = getTranslation(item.id);
//             const displayName = tx?.name || item.name;
//             const displayDesc = tx?.description || item.description;
//             return (
//               <motion.div key={item.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
//                 className="card-3d group">
//                 <div className="card-3d-inner flex gap-4 p-4 rounded-2xl bg-card border border-border cafe-shadow hover:cafe-shadow-lg transition-all">
//                   <div className="relative w-28 h-28 flex-shrink-0 rounded-xl overflow-hidden cursor-pointer" onClick={() => setSelected3DItem(item)}>
//                     <img src={item.image} alt={item.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" loading="lazy" />
//                     <div className="absolute inset-0 bg-gradient-to-t from-foreground/20 to-transparent" />
//                     <div className="absolute bottom-1.5 right-1.5 h-7 w-7 rounded-lg bg-background/80 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
//                       <Eye className="h-3.5 w-3.5 text-primary" />
//                     </div>
//                     {item.popular && (
//                       <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-accent/90 text-accent-foreground text-[10px] font-bold flex items-center gap-1">
//                         <Star className="h-3 w-3 fill-current" /> Popular
//                       </div>
//                     )}
//                     <div className="absolute bottom-2 left-2"><FastSellingBadge itemId={item.id} /></div>
//                   </div>
//                   <div className="flex-1 min-w-0 flex flex-col">
//                     <div className="flex items-start justify-between gap-2">
//                       <h3 className="font-heading font-semibold text-foreground text-base leading-tight">{displayName}</h3>
//                       <VegIcon veg={item.vegetarian} />
//                     </div>
//                     <p className="text-sm text-muted-foreground mt-1 line-clamp-2 flex-1">{displayDesc}</p>
//                     <div className="flex items-center justify-between mt-2">
//                       <span className="text-xl font-bold text-foreground">₹{item.price}</span>
//                       {(() => {
//                         const stockQty = getStock(item.id);
//                         const cartQty = inCart?.quantity || 0;
//                         const remaining = stockQty === -1 ? Infinity : Math.max(0, stockQty - cartQty);
//                         const canAddMore = remaining > 0;
//                         if (inCart) {
//                           return (
//                             <div className="flex items-center gap-1.5">
//                               <button onClick={() => updateQuantity(item.id, inCart.quantity - 1)} className="h-9 w-9 rounded-xl bg-muted flex items-center justify-center hover:bg-secondary transition-colors"><Minus className="h-4 w-4" /></button>
//                               <span className="text-base font-bold w-7 text-center">{inCart.quantity}</span>
//                               <button disabled={!canAddMore} onClick={() => { if (canAddMore) updateQuantity(item.id, inCart.quantity + 1); else toast.error('Reached stock limit'); }}
//                                 className="h-9 w-9 rounded-xl bg-gradient-to-r from-primary to-primary/80 text-primary-foreground flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed"><Plus className="h-4 w-4" /></button>
//                             </div>
//                           );
//                         }
//                         return (
//                           <Button size="sm" disabled={!canAddMore} className="h-9 rounded-xl bg-gradient-to-r from-primary to-primary/80 text-primary-foreground text-sm disabled:opacity-40"
//                             onClick={() => { if (canAddMore) addToCart({ ...item, quantity: 1 }); else toast.error('Out of stock'); }}>
//                             <Plus className="h-3.5 w-3.5 mr-1" /> Add
//                           </Button>
//                         );
//                       })()}
//                     </div>
//                   </div>
//                 </div>
//               </motion.div>
//             );
//           })}
//         </div>
//         {filteredItems.length === 0 && (
//           <div className="text-center py-16 text-muted-foreground"><p className="text-lg font-heading">No items found</p></div>
//         )}
//       </main>

//       {/* Cart Drawer */}
//       <AnimatePresence>
//         {showCart && (
//           <>
//             <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-foreground/30 backdrop-blur-sm z-50" onClick={() => setShowCart(false)} />
//             <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 25 }}
//               className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-background border-l border-border z-50 flex flex-col">
//               <div className="p-5 border-b border-border flex items-center justify-between">
//                 <h2 className="text-lg font-heading font-bold">Your Order — Table {tableNumber}</h2>
//                 <button onClick={() => setShowCart(false)} className="h-8 w-8 rounded-xl bg-muted flex items-center justify-center"><X className="h-4 w-4" /></button>
//               </div>
//               <div className="flex-1 overflow-y-auto p-4 space-y-3">
//                 {cart.length === 0 ? (
//                   <div className="text-center py-12"><ShoppingCart className="h-12 w-12 mx-auto text-muted-foreground/20 mb-3" /><p className="text-muted-foreground">Your cart is empty</p></div>
//                 ) : cart.map(item => {
//                   const ctx = getTranslation(item.id);
//                   const cName = ctx?.name || item.name;
//                   return (
//                   <div key={item.id} className="p-4 rounded-2xl bg-card border border-border cafe-shadow">
//                     <div className="flex items-start justify-between">
//                       <div className="flex items-start gap-2 flex-1">
//                         <VegIcon veg={item.vegetarian} />
//                         <div><h4 className="font-medium text-sm text-foreground">{cName}</h4><p className="text-xs text-muted-foreground">₹{item.price} each</p></div>
//                       </div>
//                       <button onClick={() => removeFromCart(item.id)} className="text-destructive/60 hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
//                     </div>
//                     <div className="flex items-center justify-between mt-3">
//                       <div className="flex items-center gap-2">
//                         <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="h-7 w-7 rounded-lg bg-muted flex items-center justify-center"><Minus className="h-3 w-3" /></button>
//                         <span className="text-sm font-bold">{item.quantity}</span>
//                         <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="h-7 w-7 rounded-lg bg-primary text-primary-foreground flex items-center justify-center"><Plus className="h-3 w-3" /></button>
//                       </div>
//                       <span className="font-bold text-sm">₹{item.price * item.quantity}</span>
//                     </div>
//                     <Input placeholder="Special notes (e.g., no onions)..." value={item.notes || ''} onChange={(e) => updateNotes(item.id, e.target.value)} className="mt-2 text-xs h-8 rounded-lg" />
//                   </div>
//                   );
//                 })}
//               </div>
//               {cart.length > 0 && (
//                 <div className="p-5 border-t border-border space-y-4 bg-card">
//                   <div className="space-y-1.5 text-sm">
//                     <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>₹{getCartTotal().toFixed(0)}</span></div>
//                     <div className="flex justify-between"><span className="text-muted-foreground">CGST (2.5%)</span><span>₹{(getCartTax() / 2).toFixed(0)}</span></div>
//                     <div className="flex justify-between"><span className="text-muted-foreground">SGST (2.5%)</span><span>₹{(getCartTax() / 2).toFixed(0)}</span></div>
//                     <div className="flex justify-between font-bold text-lg border-t border-border pt-2"><span>Total</span><span>₹{getCartGrandTotal().toFixed(0)}</span></div>
//                   </div>

//                   {/* Pickup details (Universal QR) */}
//                   {isPickup && (
//                     <div className="space-y-2 bg-accent/5 border border-accent/30 rounded-xl p-3">
//                       <p className="text-xs font-semibold text-accent">📦 Pickup Order — Prepaid only</p>
//                       <div className="grid grid-cols-2 gap-2">
//                         <div>
//                           <Label className="text-xs text-muted-foreground">Your Name</Label>
//                           <Input value={pickupName} onChange={e => setPickupName(e.target.value)} className="h-9 rounded-lg text-sm mt-1" placeholder="Name" />
//                         </div>
//                         <div>
//                           <Label className="text-xs text-muted-foreground">Phone</Label>
//                           <Input value={pickupPhone} onChange={e => setPickupPhone(e.target.value)} className="h-9 rounded-lg text-sm mt-1" placeholder="10-digit" />
//                         </div>
//                       </div>
//                       <div>
//                         <Label className="text-xs text-muted-foreground">Pickup Time</Label>
//                         <Input type="datetime-local" value={pickupAt} onChange={e => setPickupAt(e.target.value)} className="h-9 rounded-lg text-sm mt-1" />
//                       </div>
//                     </div>
//                   )}

//                   {/* Payment Timing - based on admin setting (locked to prepayment for pickup) */}
//                   {isPickup ? (
//                     <p className="text-xs text-muted-foreground bg-muted/30 rounded-xl p-2 text-center">
//                       Payment: <strong>💳 Pre-Payment (Required)</strong>
//                     </p>
//                   ) : settings.paymentMode === 'both' ? (
//                     <div>
//                       <Label className="text-xs font-medium text-muted-foreground">Payment Type</Label>
//                       <div className="grid grid-cols-2 gap-2 mt-1.5">
//                         {(['prepayment', 'postpayment'] as const).map(t => (
//                           <button key={t} onClick={() => setPaymentTiming(t)}
//                             className={`p-2 rounded-xl border-2 text-xs font-medium transition-all ${paymentTiming === t ? 'border-primary bg-primary/5' : 'border-border'}`}>
//                             {t === 'prepayment' ? '💳 Pre-Payment' : '🧾 Post-Payment'}
//                           </button>
//                         ))}
//                       </div>
//                     </div>
//                   ) : (
//                     <p className="text-xs text-muted-foreground bg-muted/30 rounded-xl p-2 text-center">
//                       Payment: <strong>{settings.paymentMode === 'prepayment' ? '💳 Pre-Payment' : '🧾 Post-Payment'}</strong>
//                     </p>
//                   )}

//                   {/* Payment Method - only show for pre-payment */}
//                   {(isPickup || (settings.paymentMode === 'both' && paymentTiming === 'prepayment') || settings.paymentMode === 'prepayment') && (
//                     <div>
//                       <Label className="text-xs font-medium text-muted-foreground">Payment Method</Label>
//                       <div className={`grid ${isPickup ? 'grid-cols-2' : 'grid-cols-3'} gap-2 mt-1.5`}>
//                         {(isPickup ? (['card', 'upi'] as const) : (['cash', 'card', 'upi'] as const)).map(m => (
//                           <button key={m} onClick={() => setSelectedPayMethod(m)}
//                             className={`p-2 rounded-xl border-2 text-xs font-medium text-center transition-all ${selectedPayMethod === m ? 'border-primary bg-primary/5' : 'border-border'}`}>
//                             {m === 'upi' ? '📱 UPI' : m === 'cash' ? '💵 Cash' : '💳 Card'}
//                           </button>
//                         ))}
//                       </div>
//                     </div>
//                   )}

//                   <Button onClick={handlePlaceOrder} className="w-full bg-gradient-to-r from-primary to-primary/80 text-primary-foreground rounded-xl py-5 glow-primary">
//                     <ShoppingCart className="h-4 w-4 mr-2" /> Place Order — ₹{getCartGrandTotal().toFixed(0)}
//                   </Button>
//                 </div>
//               )}
//             </motion.div>
//           </>
//         )}
//       </AnimatePresence>

//       {/* Payment Process Dialog (centered) - Pre-Payment */}
//       <AnimatePresence>
//         {showPaymentProcess && (
//           <>
//             <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-foreground/40 backdrop-blur-sm z-50" onClick={() => setShowPaymentProcess(false)} />
//             <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
//               className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm bg-background rounded-2xl border border-border p-6 z-50 cafe-shadow-lg">
//               <div className="text-center">
//                 {selectedPayMethod === 'upi' && (
//                   <>
//                     <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-3"><Smartphone className="h-7 w-7 text-primary" /></div>
//                     <h3 className="font-heading font-bold text-lg mb-2">UPI Payment</h3>
//                     <div className="bg-muted/30 rounded-xl p-6 mb-4">
//                       <p className="text-sm text-muted-foreground mb-2">Scan QR code to pay</p>
//                       <div className="h-32 w-32 mx-auto bg-card border border-border rounded-xl flex items-center justify-center text-3xl">📱</div>
//                       <p className="text-xs text-muted-foreground mt-2 font-mono">cafeflow@upi</p>
//                       <p className="text-lg font-bold mt-2">₹{getCartGrandTotal().toFixed(0)}</p>
//                     </div>
//                   </>
//                 )}
//                 {selectedPayMethod === 'cash' && (
//                   <>
//                     <div className="h-14 w-14 rounded-2xl bg-success/10 flex items-center justify-center mx-auto mb-3"><Banknote className="h-7 w-7 text-success" /></div>
//                     <h3 className="font-heading font-bold text-lg mb-2">Cash Payment</h3>
//                     <div className="bg-muted/30 rounded-xl p-4 mb-4">
//                       <p className="text-sm text-muted-foreground">Pay at the counter</p>
//                       <p className="text-2xl font-bold mt-2">₹{getCartGrandTotal().toFixed(0)}</p>
//                     </div>
//                   </>
//                 )}
//                 {selectedPayMethod === 'card' && (
//                   <>
//                     <div className="h-14 w-14 rounded-2xl bg-info/10 flex items-center justify-center mx-auto mb-3"><CreditCard className="h-7 w-7 text-info" /></div>
//                     <h3 className="font-heading font-bold text-lg mb-2">Card Payment</h3>
//                     <div className="bg-muted/30 rounded-xl p-4 mb-4 space-y-3">
//                       <div className="text-left space-y-2">
//                         <div><Label className="text-xs">Card Number</Label><Input placeholder="XXXX XXXX XXXX XXXX" className="mt-1 rounded-xl text-sm" maxLength={19} /></div>
//                         <div className="grid grid-cols-2 gap-2">
//                           <div><Label className="text-xs">Expiry</Label><Input placeholder="MM/YY" className="mt-1 rounded-xl text-sm" maxLength={5} /></div>
//                           <div><Label className="text-xs">CVV</Label><Input placeholder="•••" type="password" maxLength={4} className="mt-1 rounded-xl text-sm" /></div>
//                         </div>
//                         <div><Label className="text-xs">Name on Card</Label><Input placeholder="Full name" className="mt-1 rounded-xl text-sm" /></div>
//                       </div>
//                       <p className="text-lg font-bold mt-2 text-center">₹{getCartGrandTotal().toFixed(0)}</p>
//                     </div>
//                   </>
//                 )}
//                 <div className="flex gap-2">
//                   <Button variant="outline" className="flex-1 rounded-xl" onClick={() => setShowPaymentProcess(false)}>Cancel</Button>
//                   <Button className="flex-1 bg-gradient-to-r from-success to-success/80 text-success-foreground rounded-xl" onClick={handleConfirmPayment}>
//                     <CheckCircle2 className="h-4 w-4 mr-1" /> Confirm Payment
//                   </Button>
//                 </div>
//               </div>
//             </motion.div>
//           </>
//         )}
//       </AnimatePresence>

//       {/* Order Tracker Modal (centered) */}
//       <AnimatePresence>
//         {showOrderTracker && (
//           <>
//             <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-foreground/40 backdrop-blur-sm z-50" onClick={() => setShowOrderTracker(false)} />
//             <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
//               className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm bg-background rounded-2xl border border-border p-6 z-50 cafe-shadow-lg max-h-[80vh] overflow-y-auto">
//               <div className="flex items-center justify-between mb-4">
//                 <h3 className="font-heading font-bold text-lg">Your Orders</h3>
//                 <button onClick={() => setShowOrderTracker(false)} className="h-8 w-8 rounded-xl bg-muted flex items-center justify-center"><X className="h-4 w-4" /></button>
//               </div>
//               {myOrders.length === 0 ? <p className="text-center text-muted-foreground py-6">No active orders</p> : (
//                 <div className="space-y-4">
//                   {myOrders.map(order => (
//                     <div key={order.id} className="p-4 rounded-2xl bg-card border border-border cafe-shadow">
//                       <div className="flex items-center justify-between mb-2">
//                         <span className="font-mono font-bold text-sm">{order.id}</span>
//                         <div className="flex items-center gap-1.5">{statusIcon(order.status)}<span className="text-xs font-medium">{statusLabel(order.status)}</span></div>
//                       </div>
//                       <div className="flex gap-1 mb-3">{statusSteps.map((step, idx) => {
//                         const currentIdx = statusSteps.indexOf(order.status);
//                         return <div key={step} className={`flex-1 h-2 rounded-full transition-all ${idx <= currentIdx ? 'bg-gradient-to-r from-primary to-accent' : 'bg-muted'}`} />;
//                       })}</div>
//                       <div className="space-y-1">{order.items.map(item => {
//                         const tx2 = getTranslation(item.id);
//                         return (
//                         <div key={item.id} className="flex justify-between text-xs">
//                           <span className="flex items-center gap-1.5"><VegIcon veg={item.vegetarian} />{item.quantity}x {tx2?.name || item.name}</span>
//                           <span className="text-muted-foreground">₹{item.price * item.quantity}</span>
//                         </div>
//                         );
//                       })}</div>
//                       <div className="flex justify-between font-bold text-sm mt-2 pt-2 border-t border-border"><span>Total</span><span>₹{order.grandTotal.toFixed(0)}</span></div>
//                     </div>
//                   ))}
//                 </div>
//               )}
//             </motion.div>
//           </>
//         )}
//       </AnimatePresence>

//       {/* Past Orders Modal (centered) */}
//       <AnimatePresence>
//         {showPastOrders && (
//           <>
//             <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-foreground/40 backdrop-blur-sm z-50" onClick={() => setShowPastOrders(false)} />
//             <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
//               className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm bg-background rounded-2xl border border-border p-6 z-50 cafe-shadow-lg max-h-[80vh] overflow-y-auto">
//               <div className="flex items-center justify-between mb-4">
//                 <h3 className="font-heading font-bold text-lg">Past Orders</h3>
//                 <button onClick={() => setShowPastOrders(false)} className="h-8 w-8 rounded-xl bg-muted flex items-center justify-center"><X className="h-4 w-4" /></button>
//               </div>
//               {myPastOrders.length === 0 ? <p className="text-center text-muted-foreground py-6">No past orders</p> : (
//                 <div className="space-y-3">
//                   {myPastOrders.map(order => (
//                     <div key={order.id} className="p-4 rounded-2xl bg-card border border-border cafe-shadow">
//                       <div className="flex items-center justify-between mb-2">
//                         <span className="font-mono font-bold text-sm">{order.id}</span>
//                         <Badge variant="outline" className="text-[10px] uppercase">{order.paymentMethod}</Badge>
//                       </div>
//                       <div className="space-y-1">{order.items.map(item => {
//                         const tx3 = getTranslation(item.id);
//                         return (
//                         <div key={item.id} className="flex justify-between text-xs">
//                           <span className="flex items-center gap-1.5">
//                             <VegIcon veg={item.vegetarian} />
//                             {item.quantity}x {tx3?.name || item.name}
//                           </span>
//                           <span className="text-muted-foreground">₹{item.price * item.quantity}</span>
//                         </div>
//                         );
//                       })}</div>
//                       <div className="flex justify-between font-bold text-sm mt-2 pt-2 border-t border-border">
//                         <span>Total</span><span>₹{order.grandTotal.toFixed(0)}</span>
//                       </div>
//                       <p className="text-[10px] text-muted-foreground mt-1">{new Date(order.createdAt).toLocaleString()}</p>
//                     </div>
//                   ))}
//                 </div>
//               )}
//             </motion.div>
//           </>
//         )}
//       </AnimatePresence>

//       {/* Receipt Modal (centered) */}
//       <AnimatePresence>
//         {showReceipt && lastOrder && (
//           <>
//             <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-foreground/40 backdrop-blur-sm z-50" onClick={() => setShowReceipt(false)} />
//             <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
//               className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm bg-background rounded-2xl border border-border p-6 z-50 cafe-shadow-lg">
//               <div className="text-center mb-4">
//                 <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-success to-success/60 flex items-center justify-center mx-auto mb-3">
//                   <CheckCircle2 className="h-7 w-7 text-success-foreground" />
//                 </div>
//                 <h3 className="font-heading font-bold text-xl">Order Confirmed!</h3>
//                 <p className="text-xs text-muted-foreground">Your order has been sent to the kitchen</p>
//               </div>
//               <div className="bg-card rounded-xl p-4 space-y-2 text-sm border border-border">
//                 <div className="flex justify-between"><span className="text-muted-foreground">Order ID</span><span className="font-mono font-bold">{lastOrder.id}</span></div>
//                 <div className="flex justify-between"><span className="text-muted-foreground">{lastOrder.orderType === 'pickup' ? 'Type' : 'Table'}</span><span>{lastOrder.orderType === 'pickup' ? '📦 Pickup' : lastOrder.tableNumber}</span></div>
//                 <div className="flex justify-between"><span className="text-muted-foreground">Date</span><span>{lastOrder.createdAt.toLocaleString()}</span></div>
//                 {lastOrder.orderType === 'pickup' && lastOrder.pickupAt && (
//                   <div className="flex justify-between"><span className="text-muted-foreground">Pickup at</span><span className="font-semibold">{new Date(lastOrder.pickupAt).toLocaleString()}</span></div>
//                 )}
//                 <div className="flex justify-between"><span className="text-muted-foreground">GST No.</span><span className="font-mono text-xs">{GST_NUMBER}</span></div>
//                 <hr className="border-border" />
//                 {lastOrder.items.map(item => { const tx4 = getTranslation(item.id); return (<div key={item.id} className="flex justify-between"><span>{tx4?.name || item.name} x{item.quantity}</span><span>₹{item.price * item.quantity}</span></div>); })}
//                 <hr className="border-border" />
//                 <div className="flex justify-between"><span>Subtotal</span><span>₹{lastOrder.total.toFixed(0)}</span></div>
//                 <div className="flex justify-between"><span>CGST (2.5%)</span><span>₹{(lastOrder.tax / 2).toFixed(0)}</span></div>
//                 <div className="flex justify-between"><span>SGST (2.5%)</span><span>₹{(lastOrder.tax / 2).toFixed(0)}</span></div>
//                 <div className="flex justify-between font-bold text-base"><span>Grand Total</span><span>₹{lastOrder.grandTotal.toFixed(0)}</span></div>
//                 <div className="flex justify-between text-xs"><span>Payment</span><span className="uppercase">{lastOrder.paymentMethod}</span></div>
//               </div>
//               <div className="flex gap-2 mt-4">
//                 <Button onClick={() => { setShowReceipt(false); setShowOrderTracker(true); }} variant="outline" className="flex-1 rounded-xl"><Receipt className="h-4 w-4 mr-1" /> Track Order</Button>
//                 <Button onClick={() => setShowReceipt(false)} className="flex-1 bg-gradient-to-r from-primary to-primary/80 text-primary-foreground rounded-xl">Continue</Button>
//               </div>
//             </motion.div>
//           </>
//         )}
//       </AnimatePresence>

//       {/* 3D Model Viewer Modal */}
//       <AnimatePresence>
//         {selected3DItem && (
//           <>
//             <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-foreground/40 backdrop-blur-sm z-50" onClick={() => setSelected3DItem(null)} />
//             <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
//               className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[calc(100%-2rem)] max-w-lg bg-background rounded-2xl border border-border p-5 z-50 cafe-shadow-lg">
//               <div className="flex items-center justify-between mb-3">
//                 <div className="flex items-center gap-2">
//                   <VegIcon veg={selected3DItem.vegetarian} />
//                   <h3 className="font-heading font-bold text-lg">{selected3DItem.name}</h3>
//                 </div>
//                 <button onClick={() => setSelected3DItem(null)} className="h-8 w-8 rounded-xl bg-muted flex items-center justify-center"><X className="h-4 w-4" /></button>
//               </div>
//               <div className="relative w-full h-64 sm:h-80 rounded-xl overflow-hidden border border-border">
//                 <Suspense fallback={
//                   <div className="w-full h-full flex items-center justify-center bg-muted/20">
//                     <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
//                   </div>
//                 }>
//                   <LazyMenuItem3DViewer
//                     category={selected3DItem.category}
//                     vegetarian={selected3DItem.vegetarian}
//                     itemName={selected3DItem.name}
//                     fallbackImage={selected3DItem.image}
//                   />
//                 </Suspense>
//               </div>
//               <div className="mt-3 space-y-2">
//                 <p className="text-sm text-muted-foreground">{selected3DItem.description}</p>
//                 <div className="flex items-center justify-between">
//                   <span className="text-xl font-bold text-foreground">₹{selected3DItem.price}</span>
//                   <Button size="sm" className="rounded-xl bg-gradient-to-r from-primary to-primary/80 text-primary-foreground"
//                     onClick={() => { addToCart({ ...selected3DItem, quantity: 1 }); setSelected3DItem(null); toast.success('Added to cart!'); }}>
//                     <Plus className="h-3 w-3 mr-1" /> Add to Cart
//                   </Button>
//                 </div>
//               </div>
//             </motion.div>
//           </>
//         )}
//       </AnimatePresence>

//       {/* Floating cart button */}
//       {cartCount > 0 && !showCart && (
//         <motion.div initial={{ y: 100 }} animate={{ y: 0 }} className="fixed bottom-4 left-1/2 -translate-x-1/2 z-30 w-auto">
//           <Button onClick={() => setShowCart(true)} className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground py-3 px-6 rounded-2xl cafe-shadow-lg text-sm glow-primary">
//             <ShoppingCart className="mr-2 h-4 w-4" /> Cart ({cartCount}) — ₹{getCartGrandTotal().toFixed(0)}
//           </Button>
//         </motion.div>
//       )}

//       {/* Feedback Widget */}
//       {settings.feedbackEnabled && (
//         <>
//           <AnimatePresence>
//             {showFeedback && (
//               <>
//                 <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-foreground/30 backdrop-blur-sm z-50" onClick={() => setShowFeedback(false)} />
//                 <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
//                   className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm bg-background rounded-2xl border border-border p-6 z-50 cafe-shadow-lg max-h-[85vh] overflow-y-auto">
//                   <div className="flex items-center justify-between mb-4">
//                     <h3 className="font-heading font-bold text-lg">Your Feedback</h3>
//                     <button onClick={() => setShowFeedback(false)} className="h-8 w-8 rounded-xl bg-muted flex items-center justify-center"><X className="h-4 w-4" /></button>
//                   </div>
//                   <div className="space-y-4">
//                     {/* Select order for feedback */}
//                     {myPastOrders.length > 0 && (
//                       <div>
//                         <p className="text-xs font-medium text-muted-foreground mb-1.5">Feedback for (optional)</p>
//                         <select value={feedbackOrderId} onChange={e => { setFeedbackOrderId(e.target.value); setFeedbackItemId(''); setFeedbackItemName(''); }}
//                           className="w-full h-9 rounded-xl border border-border bg-background text-sm px-3">
//                           <option value="">General feedback</option>
//                           {myPastOrders.map(o => <option key={o.id} value={o.id}>{o.id} — ₹{o.grandTotal.toFixed(0)}</option>)}
//                           {myOrders.map(o => <option key={o.id} value={o.id}>{o.id} — ₹{o.grandTotal.toFixed(0)}</option>)}
//                         </select>
//                       </div>
//                     )}
//                     {feedbackOrderId && (
//                       <div>
//                         <p className="text-xs font-medium text-muted-foreground mb-1.5">Rate specific item (optional)</p>
//                         <select value={feedbackItemId} onChange={e => {
//                           setFeedbackItemId(e.target.value);
//                           const order = [...myPastOrders, ...myOrders].find(o => o.id === feedbackOrderId);
//                           const item = order?.items.find(i => i.id === e.target.value);
//                           setFeedbackItemName(item?.name || '');
//                         }}
//                           className="w-full h-9 rounded-xl border border-border bg-background text-sm px-3">
//                           <option value="">Entire order</option>
//                           {[...myPastOrders, ...myOrders].find(o => o.id === feedbackOrderId)?.items.map(item => (
//                             <option key={item.id} value={item.id}>{item.name}</option>
//                           ))}
//                         </select>
//                       </div>
//                     )}
//                     <div className="text-center">
//                       <p className="text-sm text-muted-foreground mb-2">How was your experience?</p>
//                       <div className="flex justify-center gap-2">
//                         {[1, 2, 3, 4, 5].map(star => (
//                           <button key={star} onClick={() => setFeedbackRating(star)} className={`text-3xl transition-transform hover:scale-110 ${star <= feedbackRating ? 'text-accent' : 'text-muted-foreground/30'}`}>
//                             ★
//                           </button>
//                         ))}
//                       </div>
//                       {feedbackRating > 0 && (
//                         <Badge className={`mt-2 text-sm ${feedbackRating <= 1 ? 'bg-destructive/10 text-destructive' : feedbackRating <= 2 ? 'bg-accent/10 text-accent' : feedbackRating <= 3 ? 'bg-info/10 text-info' : feedbackRating <= 4 ? 'bg-success/10 text-success' : 'bg-primary/10 text-primary'}`}>
//                           {feedbackRating <= 1 ? '😞 Bad' : feedbackRating <= 2 ? '😐 Average' : feedbackRating <= 3 ? '🙂 Good' : feedbackRating <= 4 ? '😊 Very Good' : '🤩 Excellent'}
//                         </Badge>
//                       )}
//                     </div>
//                     <Input placeholder="Share your thoughts (optional)..." value={feedbackMessage} onChange={e => setFeedbackMessage(e.target.value)} className="rounded-xl" />
//                     <Button disabled={feedbackRating === 0} className="w-full bg-gradient-to-r from-primary to-primary/80 text-primary-foreground rounded-xl" onClick={() => {
//                       addFeedback({
//                         rating: feedbackRating,
//                         message: feedbackMessage,
//                         tableNumber,
//                         orderId: feedbackOrderId || undefined,
//                         itemId: feedbackItemId || undefined,
//                         itemName: feedbackItemName || undefined,
//                       });
//                       toast.success('Thank you for your feedback! ⭐');
//                       setFeedbackRating(0);
//                       setFeedbackMessage('');
//                       setFeedbackOrderId('');
//                       setFeedbackItemId('');
//                       setFeedbackItemName('');
//                       setShowFeedback(false);
//                     }}>
//                       Submit Feedback
//                     </Button>
//                   </div>
//                 </motion.div>
//               </>
//             )}
//           </AnimatePresence>
//           <button onClick={() => { setFeedbackOrderId(''); setFeedbackItemId(''); setFeedbackItemName(''); setShowFeedback(true); }}
//             className="fixed bottom-4 left-4 h-12 px-4 rounded-full bg-gradient-to-r from-accent to-accent/80 text-accent-foreground flex items-center gap-2 z-30 cafe-shadow-lg hover:scale-105 transition-transform text-sm font-medium">
//             ⭐ Feedback
//           </button>
//         </>
//       )}

//       {/* AI Chatbot FAB */}
//       <button onClick={() => setShowChatbot(true)}
//         className="fixed bottom-4 right-4 h-12 w-12 rounded-full bg-gradient-to-r from-primary to-accent text-primary-foreground flex items-center justify-center z-30 cafe-shadow-lg hover:scale-110 transition-transform">
//         <MessageCircle className="h-5 w-5" />
//       </button>

//       {/* AI Chatbot Dialog */}
//       <AnimatePresence>
//         {showChatbot && (
//           <>
//             <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-foreground/30 backdrop-blur-sm z-50" onClick={() => setShowChatbot(false)} />
//             <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 50 }}
//               className="fixed bottom-4 right-4 w-[calc(100%-2rem)] max-w-sm h-[28rem] bg-background rounded-2xl border border-border z-50 cafe-shadow-lg flex flex-col overflow-hidden sm:bottom-6 sm:right-6">
//               <div className="p-4 border-b border-border flex items-center justify-between bg-gradient-to-r from-primary/10 to-accent/10">
//                 <div className="flex items-center gap-2">
//                   <div className="h-8 w-8 rounded-xl bg-gradient-to-r from-primary to-accent flex items-center justify-center"><Sparkles className="h-4 w-4 text-primary-foreground" /></div>
//                   <div><h3 className="text-sm font-heading font-bold">AI Assistant</h3><p className="text-[10px] text-muted-foreground">Ask me anything about our menu</p></div>
//                 </div>
//                 <button onClick={() => setShowChatbot(false)} className="h-7 w-7 rounded-lg bg-muted flex items-center justify-center"><X className="h-3 w-3" /></button>
//               </div>
//               <div className="flex-1 overflow-y-auto p-3 space-y-2">
//                 {chatMessages.map((msg, i) => (
//                   <div key={i} className={`flex ${msg.from === 'user' ? 'justify-end' : 'justify-start'}`}>
//                     <div className={`max-w-[80%] px-3 py-2 rounded-xl text-xs ${msg.from === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground'}`}>
//                       {msg.text}
//                     </div>
//                   </div>
//                 ))}
//               </div>
//               <div className="p-3 border-t border-border flex gap-2">
//                 <Input placeholder="Ask about our menu (max 120 chars)..." value={chatMessage}
//                   maxLength={120}
//                   onPaste={e => { e.preventDefault(); toast.message('Pasting is disabled — please type your question.'); }}
//                   onChange={e => setChatMessage(e.target.value.slice(0, 120))}
//                   onKeyDown={e => {
//                     if (e.key === 'Enter' && chatMessage.trim()) {
//                       const userMsg = chatMessage.trim().slice(0, 120);
//                       const botReply = getChatbotReply(userMsg, menuItems, settings);
//                       setChatMessages(prev => [...prev, { from: 'user', text: userMsg }, { from: 'bot', text: botReply }]);
//                       setChatMessage('');
//                     }
//                   }}
//                   className="rounded-xl text-xs h-9" />
//                 <Button size="sm" className="rounded-xl h-9 px-3" onClick={() => {
//                   if (chatMessage.trim()) {
//                     const userMsg = chatMessage.trim().slice(0, 120);
//                     const botReply = getChatbotReply(userMsg, menuItems, settings);
//                     setChatMessages(prev => [...prev, { from: 'user', text: userMsg }, { from: 'bot', text: botReply }]);
//                     setChatMessage('');
//                   }
//                 }}>Send</Button>
//               </div>
//             </motion.div>
//           </>
//         )}
//       </AnimatePresence>
//     </div>
//   );
// };

// export default CustomerMenu;
