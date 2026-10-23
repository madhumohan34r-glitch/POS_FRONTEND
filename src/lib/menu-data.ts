export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image: string;
  available: boolean;
  vegetarian?: boolean;
  popular?: boolean;
  type?: 'food' | 'drink';
  todaysSpecial?: boolean;
}

export interface CartItem extends MenuItem {
  quantity: number;
  notes?: string;
  served?: boolean; // fulfillment checklist
}

export interface MenuItemAllergyInfo {
  allergens: string[];
  ingredients: string[];
  spiceLevel: 'none' | 'mild' | 'medium' | 'hot' | 'extra-hot';
  calories?: number;
}

// Allergy & ingredient data for chatbot
export const menuAllergyData: Record<string, MenuItemAllergyInfo> = {
  '1': { allergens: ['gluten', 'dairy'], ingredients: ['sourdough bread', 'wild mushrooms', 'truffle oil', 'thyme', 'garlic', 'butter'], spiceLevel: 'none', calories: 280 },
  '2': { allergens: ['gluten', 'dairy', 'eggs'], ingredients: ['romaine lettuce', 'parmesan', 'croutons', 'caesar dressing', 'anchovies'], spiceLevel: 'none', calories: 350 },
  '3': { allergens: ['gluten', 'dairy'], ingredients: ['chicken breast', 'sun-dried tomatoes', 'mozzarella', 'ciabatta', 'herbs', 'olive oil'], spiceLevel: 'mild', calories: 520 },
  '4': { allergens: ['gluten', 'dairy'], ingredients: ['flatbread dough', 'San Marzano tomatoes', 'buffalo mozzarella', 'basil', 'olive oil'], spiceLevel: 'none', calories: 450 },
  '5': { allergens: ['dairy', 'nuts'], ingredients: ['chicken', 'tomato', 'cream', 'butter', 'cashews', 'spices', 'basmati rice'], spiceLevel: 'medium', calories: 680 },
  '6': { allergens: [], ingredients: ['espresso coffee beans', 'water'], spiceLevel: 'none', calories: 10 },
  '7': { allergens: ['dairy'], ingredients: ['espresso', 'milk', 'caramel syrup', 'ice'], spiceLevel: 'none', calories: 250 },
  '8': { allergens: [], ingredients: ['fresh mint', 'lime', 'soda water', 'sugar'], spiceLevel: 'none', calories: 120 },
  '9': { allergens: ['gluten', 'dairy', 'eggs'], ingredients: ['ladyfingers', 'espresso', 'mascarpone', 'cocoa powder', 'eggs', 'sugar'], spiceLevel: 'none', calories: 400 },
  '10': { allergens: ['gluten', 'dairy', 'eggs'], ingredients: ['dark chocolate', 'butter', 'eggs', 'flour', 'sugar', 'vanilla ice cream'], spiceLevel: 'none', calories: 520 },
  '11': { allergens: ['gluten', 'dairy'], ingredients: ['tortilla chips', 'cheddar cheese', 'jalapeños', 'salsa', 'sour cream'], spiceLevel: 'hot', calories: 480 },
  '12': { allergens: [], ingredients: ['chicken wings', 'hot sauce', 'ranch dressing', 'celery'], spiceLevel: 'hot', calories: 550 },
};

export interface OrderPaymentSplit {
  method: 'cash' | 'card' | 'upi';
  amount: number;
  cashTendered?: number;
}

export interface Order {
  id: string;
  tableNumber: number;
  items: CartItem[];
  status: 'pending' | 'preparing' | 'ready' | 'issue' | 'served' | 'paid';
  total: number;
  tax: number;
  grandTotal: number;
  discount?: number; // applied at checkout
  discountReason?: string;
  paymentMethod?: 'cash' | 'card' | 'upi';
  paymentTiming?: 'prepayment' | 'postpayment';
  paymentSplits?: OrderPaymentSplit[];
  changeReturned?: number;
  routedToKitchen?: boolean;
  createdAt: Date;
  customerName?: string;
  customerPhone?: string;
  issueNote?: string;
  // Order channel
  orderType?: 'dine-in' | 'pickup';
  pickupAt?: string; // ISO datetime for pickup orders
  // Table transfer history e.g. [1, 7] when 1 -> 7
  tableHistory?: number[];
}

export const categories = [
  'All', 'Starters', 'Mains', 'Beverages', 'Desserts', 'Snacks'
];

export const menuItems: MenuItem[] = [
  {
    id: '1', name: 'Truffle Mushroom Bruschetta', description: 'Crispy sourdough topped with sautéed wild mushrooms, truffle oil, and fresh thyme',
    price: 320, category: 'Starters', image: 'https://images.unsplash.com/photo-1572695157366-5e585ab2b69f?w=400&h=300&fit=crop', available: true, vegetarian: true, popular: true, type: 'food',
  },
  {
    id: '2', name: 'Classic Caesar Salad', description: 'Crisp romaine lettuce, parmesan, croutons, and house-made caesar dressing',
    price: 280, category: 'Starters', image: 'https://images.unsplash.com/photo-1546793665-c74683f339c1?w=400&h=300&fit=crop', available: true, vegetarian: true, type: 'food',
  },
  {
    id: '3', name: 'Grilled Chicken Panini', description: 'Herb-marinated chicken, sun-dried tomatoes, mozzarella on artisan ciabatta',
    price: 420, category: 'Mains', image: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=400&h=300&fit=crop', available: true, popular: true, type: 'food',
  },
  {
    id: '4', name: 'Margherita Flatbread', description: 'San Marzano tomatoes, fresh buffalo mozzarella, basil on thin-crust flatbread',
    price: 380, category: 'Mains', image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&h=300&fit=crop', available: true, vegetarian: true, type: 'food',
  },
  {
    id: '5', name: 'Butter Chicken Bowl', description: 'Tender chicken in creamy tomato gravy, served with fragrant basmati rice',
    price: 450, category: 'Mains', image: 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=400&h=300&fit=crop', available: true, popular: true, type: 'food',
  },
  {
    id: '6', name: 'Espresso', description: 'Double shot of our signature house blend, rich and bold',
    price: 150, category: 'Beverages', image: 'https://images.unsplash.com/photo-1510707577719-ae7c14805e3a?w=400&h=300&fit=crop', available: true, type: 'drink',
  },
  {
    id: '7', name: 'Iced Caramel Latte', description: 'Smooth espresso, caramel, steamed milk over ice',
    price: 220, category: 'Beverages', image: 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=400&h=300&fit=crop', available: true, popular: true, type: 'drink',
  },
  {
    id: '8', name: 'Fresh Mint Mojito', description: 'Refreshing blend of fresh mint, lime, soda, and a hint of sweetness',
    price: 180, category: 'Beverages', image: 'https://images.unsplash.com/photo-1551538827-9c037cb4f32a?w=400&h=300&fit=crop', available: true, vegetarian: true, type: 'drink',
  },
  {
    id: '9', name: 'Tiramisu', description: 'Classic Italian dessert with espresso-soaked ladyfingers and mascarpone cream',
    price: 320, category: 'Desserts', image: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=400&h=300&fit=crop', available: true, popular: true, type: 'food',
  },
  {
    id: '10', name: 'Chocolate Lava Cake', description: 'Warm dark chocolate cake with a molten center, served with vanilla ice cream',
    price: 350, category: 'Desserts', image: 'https://images.unsplash.com/photo-1624353365286-3f8d62daad51?w=400&h=300&fit=crop', available: true, vegetarian: true, type: 'food',
  },
  {
    id: '11', name: 'Loaded Nachos', description: 'Crispy tortilla chips with melted cheese, jalapeños, salsa, and sour cream',
    price: 260, category: 'Snacks', image: 'https://images.unsplash.com/photo-1513456852971-30c0b8199d4d?w=400&h=300&fit=crop', available: true, vegetarian: true, type: 'food',
  },
  {
    id: '12', name: 'Chicken Wings', description: 'Crispy fried wings tossed in our house hot sauce, served with ranch dip',
    price: 340, category: 'Snacks', image: 'https://images.unsplash.com/photo-1567620832903-9fc6debc209f?w=400&h=300&fit=crop', available: true, popular: true, type: 'food',
  },
];

export const TAX_RATE = 0.05; // 5% GST
export const GST_NUMBER = '29ABCDE1234F1Z5';
