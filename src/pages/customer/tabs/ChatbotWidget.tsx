import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Sparkles } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import type { MenuItem } from '../CustomerMenu';

// Privacy guard
const PRIVACY_PATTERNS = [
  /\b(my|your|staff|owner|manager|chef)?\s*(name|phone|mobile|email|address|home|salary|aadhaar|pan|otp|password)\b/i,
  /\bcontact (number|info|details)\b/i,
  /\bwho (works|is working|is the (owner|manager|chef))\b/i,
];
const PRIVACY_REPLY = 'Please contact store staff for assistance.';

// Chatbot logic
const getChatbotReply = (msg: string, items: MenuItem[]): string => {
  if (PRIVACY_PATTERNS.some(p => p.test(msg))) return PRIVACY_REPLY;
  const lower = msg.toLowerCase();
  const popularItems = items.filter(i => i.popular && i.available);
  const vegItems = items.filter(i => i.vegetarian && i.available);
  const nonVegItems = items.filter(i => !i.vegetarian && i.available && i.type === 'food');
  const drinks = items.filter(i => i.type === 'drink' && i.available);
  const desserts = items.filter(i => i.category === 'Desserts' && i.available);
  const starters = items.filter(i => i.category === 'Starters' && i.available);
  const mains = items.filter(i => i.category === 'Mains' && i.available);
  const snacks = items.filter(i => i.category === 'Snacks' && i.available);

  // Recommendations & Favorites
  if (lower.includes('must-try dish') || lower.includes('best dish')) {
    const top = popularItems.filter(i => i.type === 'food').slice(0, 3);
    return top.length > 0 ? `🌟 Must-try dishes: ${top.map(i => `${i.name} (₹${i.price})`).join(', ')}.` : 'Browse our full menu!';
  }
  if (lower.includes('must-try drink') || lower.includes('best drink')) {
    const top = drinks.filter(i => i.popular).slice(0, 3);
    return top.length > 0 ? `🥤 Must-try drinks: ${top.map(i => `${i.name} (₹${i.price})`).join(', ')}.` : `🥤 Our beverages: ${drinks.slice(0, 3).map(i => `${i.name} (₹${i.price})`).join(', ')}`;
  }
  if (lower.includes('most ordered') || lower.includes('trending') || lower.includes('popular')) {
    const names = popularItems.slice(0, 5).map(i => `${i.name} (₹${i.price})`).join(', ');
    return popularItems.length > 0 ? `🔥 Most ordered today: ${names}.` : 'All items are popular here!';
  }
  if (lower.includes('chef') && lower.includes('special')) {
    const specials = popularItems.slice(0, 2);
    return specials.length > 0 ? `👨‍🍳 Chef's Special today: ${specials.map(i => `${i.name} (₹${i.price})`).join(' | ')}` : 'Ask our staff about today\'s Chef Special!';
  }
  if (lower.includes('spicy') || lower.includes('hot')) {
    const spicy = nonVegItems.slice(0, 3);
    return spicy.length > 0 ? `🌶️ Spicy recommendations: ${spicy.map(i => `${i.name} (₹${i.price})`).join(', ')}.` : 'Check our Mains section for bold flavors!';
  }

  // Operational & General Info
  if (lower.includes('opening') || lower.includes('hours') || lower.includes('open') || lower.includes('close')) {
    return '🕐 Please check with our staff for today\'s opening hours.';
  }
  if (lower.includes('pet friendly') || lower.includes('pets')) return '🐾 Yes, we are pet-friendly in our outdoor seating area.';
  if (lower.includes('parking') || lower.includes('park')) return '🅿️ Yes, we have free parking available right outside.';
  if (lower.includes('takeaway') || lower.includes('parcel')) return '📦 Yes, we accept takeaway orders! You can order here and pick it up.';
  if (lower.includes('wifi') || lower.includes('wi-fi')) return '📶 Yes, we have free Wi-Fi! Network: CafeFlow_Guest | Password: coffee2024';
  if (lower.includes('waiting time') || lower.includes('wait')) return '⏱️ Average wait is 15-20 mins for food, 5-7 mins for drinks.';

  // Try to match specific items by name
  const match = items.find(i => lower.includes(i.name.toLowerCase().split(' ')[0].toLowerCase()));
  if (match) {
    return `${match.name} — ₹${match.price}. ${match.vegetarian ? '🟢 Veg' : '🔴 Non-Veg'}. ${match.description}.`;
  }

  return `I can help you with:\n• "Popular items"\n• "Veg options"\n• "Opening hours"\n• "Wi-Fi / Parking"\nWhat would you like to know? 😊`;
};

// Menu comes from the customer dashboard API (passed in by CustomerMenu), not a local store.
export default function ChatbotWidget({ menuItems }: { menuItems: MenuItem[] }) {
  const [showChatbot, setShowChatbot] = useState(false);
  const [chatMessage, setChatMessage] = useState('');
  const [chatMessages, setChatMessages] = useState<{ from: 'user' | 'bot'; text: string }[]>([
    { from: 'bot', text: 'Hi! 👋 I\'m your CaféFlow assistant. I can help you with menu recommendations, dietary info, or any questions!' },
  ]);

  const handleSend = () => {
    if (chatMessage.trim()) {
      const userMsg = chatMessage.trim().slice(0, 120);
      const botReply = getChatbotReply(userMsg, menuItems);
      setChatMessages(prev => [...prev, { from: 'user', text: userMsg }, { from: 'bot', text: botReply }]);
      setChatMessage('');
    }
  };

  return (
    <>
      {/* Floating Action Button */}
      <button onClick={() => setShowChatbot(true)}
        className="fixed bottom-4 right-4 h-12 w-12 rounded-full bg-gradient-to-r from-primary to-accent text-primary-foreground flex items-center justify-center z-30 cafe-shadow-lg hover:scale-110 transition-transform">
        <MessageCircle className="h-5 w-5" />
      </button>

      {/* Chatbot Dialog */}
      <AnimatePresence>
        {showChatbot && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} 
              className="fixed inset-0 bg-foreground/30 backdrop-blur-sm z-50" onClick={() => setShowChatbot(false)} />
            
            <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 50 }}
              className="fixed bottom-4 right-4 w-[calc(100%-2rem)] max-w-sm h-[28rem] bg-background rounded-2xl border border-border z-50 cafe-shadow-lg flex flex-col overflow-hidden sm:bottom-6 sm:right-6">
              
              <div className="p-4 border-b border-border flex items-center justify-between bg-gradient-to-r from-primary/10 to-accent/10">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-xl bg-gradient-to-r from-primary to-accent flex items-center justify-center"><Sparkles className="h-4 w-4 text-primary-foreground" /></div>
                  <div><h3 className="text-sm font-heading font-bold">AI Assistant</h3><p className="text-[10px] text-muted-foreground">Ask me anything about our menu</p></div>
                </div>
                <button onClick={() => setShowChatbot(false)} className="h-7 w-7 rounded-lg bg-muted flex items-center justify-center"><X className="h-3 w-3" /></button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-3 space-y-2">
                {chatMessages.map((msg, i) => (
                  <div key={i} className={`flex ${msg.from === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] px-3 py-2 rounded-xl text-xs ${msg.from === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground'}`}>
                      {msg.text}
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="p-3 border-t border-border flex gap-2">
                <Input placeholder="Ask about our menu..." value={chatMessage}
                  maxLength={120}
                  onPaste={e => { e.preventDefault(); toast.message('Pasting is disabled — please type your question.'); }}
                  onChange={e => setChatMessage(e.target.value.slice(0, 120))}
                  onKeyDown={e => { if (e.key === 'Enter') handleSend(); }}
                  className="rounded-xl text-xs h-9" />
                <Button size="sm" className="rounded-xl h-9 px-3" onClick={handleSend}>Send</Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}