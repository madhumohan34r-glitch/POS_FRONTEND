import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Language = string; // dynamic — any language code (e.g. 'en', 'hi', 'te', 'ta', 'fr')

export interface SupportedLanguage {
  code: Language;
  label: string;       // English name e.g. "Hindi"
  nativeLabel: string; // Native script e.g. "हिन्दी"
}

export interface Translation {
  menuItemId: string;
  name: string;
  description: string;
}

interface I18nStore {
  language: Language;        // customer-facing language
  adminLanguage: Language;   // admin-panel language
  supportedLanguages: SupportedLanguage[];
  translations: Record<string, Partial<Record<Language, Translation>>>;
  uiTranslations: Record<string, Record<Language, string>>;
  setLanguage: (lang: Language) => void;
  setAdminLanguage: (lang: Language) => void;
  setSupportedLanguages: (langs: SupportedLanguage[]) => void;
  loadLanguages: () => Promise<void>;
  addLanguage: (lang: SupportedLanguage) => void;
  removeLanguage: (code: Language) => void;
  setTranslation: (menuItemId: string, lang: Language, name: string, description: string) => void;
  setUiTranslation: (key: string, lang: Language, value: string) => void;
  getTranslation: (menuItemId: string) => Translation | null;
  t: (key: string, scope?: 'customer' | 'admin') => string;
}

const defaultSupportedLanguages: SupportedLanguage[] = [
  { code: 'en', label: 'English',   nativeLabel: 'English' },
  { code: 'hi', label: 'Hindi',     nativeLabel: 'हिन्दी' },
  { code: 'te', label: 'Telugu',    nativeLabel: 'తెలుగు' },
  { code: 'ta', label: 'Tamil',     nativeLabel: 'தமிழ்' },
  { code: 'kn', label: 'Kannada',   nativeLabel: 'ಕನ್ನಡ' },
  { code: 'ml', label: 'Malayalam', nativeLabel: 'മലയാളം' },
  { code: 'bn', label: 'Bengali',   nativeLabel: 'বাংলা' },
  { code: 'mr', label: 'Marathi',   nativeLabel: 'मराठी' },
  { code: 'gu', label: 'Gujarati',  nativeLabel: 'ગુજરાતી' },
  { code: 'pa', label: 'Punjabi',   nativeLabel: 'ਪੰਜਾਬੀ' },
  { code: 'fr', label: 'French',    nativeLabel: 'Français' },
  { code: 'es', label: 'Spanish',   nativeLabel: 'Español' },
];

const defaultUiTranslations: Record<string, Record<Language, string>> = {
  // Customer panel
  'menu':            { en: 'Menu',            hi: 'मेन्यू',           te: 'మెనూ',          ta: 'மெனு',            fr: 'Menu',         es: 'Menú' },
  'cart':            { en: 'Cart',            hi: 'कार्ट',            te: 'కార్ట్',         ta: 'வண்டி',           fr: 'Panier',       es: 'Carrito' },
  'search_menu':     { en: 'Search menu...',  hi: 'मेन्यू खोजें...',   te: 'మెనూ వెతకండి...',ta: 'மெனு தேடு...',    fr: 'Rechercher...',es: 'Buscar...' },
  'add_to_cart':     { en: 'Add',             hi: 'जोड़ें',            te: 'జోడించు',        ta: 'சேர்',             fr: 'Ajouter',      es: 'Añadir' },
  'place_order':     { en: 'Place Order',     hi: 'ऑर्डर करें',       te: 'ఆర్డర్ చేయండి',  ta: 'ஆர்டர் செய்',     fr: 'Commander',    es: 'Ordenar' },
  'your_order':      { en: 'Your Order',      hi: 'आपका ऑर्डर',       te: 'మీ ఆర్డర్',     ta: 'உங்கள் ஆர்டர்',    fr: 'Votre commande',es: 'Tu pedido' },
  'subtotal':        { en: 'Subtotal',        hi: 'उप-कुल',           te: 'ఉప మొత్తం',      ta: 'கூட்டுத்தொகை',    fr: 'Sous-total',   es: 'Subtotal' },
  'total':           { en: 'Total',           hi: 'कुल',              te: 'మొత్తం',         ta: 'மொத்தம்',          fr: 'Total',        es: 'Total' },
  'veg':             { en: 'Veg',             hi: 'शाकाहारी',         te: 'శాకాహారం',       ta: 'சைவம்',            fr: 'Vég',          es: 'Veg' },
  'non_veg':         { en: 'Non-Veg',         hi: 'मांसाहारी',        te: 'మాంసాహారం',     ta: 'அசைவம்',          fr: 'Non-Vég',      es: 'No-Veg' },
  'popular':         { en: 'Popular',         hi: 'लोकप्रिय',         te: 'జనాదరణ',         ta: 'பிரபலம்',          fr: 'Populaire',    es: 'Popular' },
  'todays_special':  { en: "Today's Special", hi: 'आज का स्पेशल',     te: 'నేటి స్పెషల్',    ta: 'இன்றைய சிறப்பு',  fr: 'Spécial du jour',es: 'Especial' },
  'all':             { en: 'All',             hi: 'सभी',              te: 'అన్నీ',         ta: 'அனைத்தும்',        fr: 'Tout',         es: 'Todo' },
  'starters':        { en: 'Starters',        hi: 'स्टार्टर्स',       te: 'స్టార్టర్స్',     ta: 'தொடக்கம்',         fr: 'Entrées',      es: 'Entrantes' },
  'mains':           { en: 'Mains',           hi: 'मुख्य',            te: 'మెయిన్స్',       ta: 'முதன்மை',          fr: 'Plats',        es: 'Principales' },
  'beverages':       { en: 'Beverages',       hi: 'पेय',              te: 'పానీయాలు',     ta: 'பானங்கள்',         fr: 'Boissons',     es: 'Bebidas' },
  'desserts':        { en: 'Desserts',        hi: 'मिठाई',            te: 'తీపి',          ta: 'இனிப்பு',          fr: 'Desserts',     es: 'Postres' },
  'snacks':          { en: 'Snacks',          hi: 'स्नैक्स',          te: 'స్నాక్స్',       ta: 'சிற்றுண்டி',       fr: 'En-cas',       es: 'Aperitivos' },
  'food':            { en: 'Food',            hi: 'खाना',             te: 'ఆహారం',         ta: 'உணவு',             fr: 'Nourriture',   es: 'Comida' },
  'drinks':          { en: 'Drinks',          hi: 'पेय पदार्थ',       te: 'పానీయాలు',     ta: 'பானங்கள்',         fr: 'Boissons',     es: 'Bebidas' },
  'past_orders':     { en: 'Past Orders',     hi: 'पिछले ऑर्डर',      te: 'గత ఆర్డర్లు',    ta: 'முந்தைய ஆர்டர்',  fr: 'Commandes',    es: 'Pedidos' },
  'orders':          { en: 'Orders',          hi: 'ऑर्डर',            te: 'ఆర్డర్లు',       ta: 'ஆர்டர்கள்',        fr: 'Commandes',    es: 'Pedidos' },
  'table':           { en: 'Table',           hi: 'टेबल',             te: 'టేబుల్',        ta: 'மேசை',             fr: 'Table',        es: 'Mesa' },

  // Admin panel
  'dashboard':       { en: 'Dashboard',       hi: 'डैशबोर्ड',         te: 'డాష్‌బోర్డ్',     ta: 'டாஷ்போர்டு',       fr: 'Tableau',      es: 'Panel' },
  'menu_items':      { en: 'Menu',            hi: 'मेन्यू',           te: 'మెనూ',          ta: 'மெனு',             fr: 'Menu',         es: 'Menú' },
  'staff':           { en: 'Staff',           hi: 'स्टाफ',            te: 'సిబ్బంది',       ta: 'பணியாளர்கள்',      fr: 'Personnel',    es: 'Personal' },
  'payments':        { en: 'Payments',        hi: 'भुगतान',           te: 'చెల్లింపులు',     ta: 'கட்டணங்கள்',       fr: 'Paiements',    es: 'Pagos' },
  'tables_qr':       { en: 'Tables & QR',     hi: 'टेबल और QR',       te: 'టేబుళ్ళు & QR',  ta: 'மேசைகள் & QR',    fr: 'Tables & QR',  es: 'Mesas & QR' },
  'reservations':    { en: 'Reservations',    hi: 'आरक्षण',           te: 'రిజర్వేషన్లు',   ta: 'முன்பதிவுகள்',     fr: 'Réservations', es: 'Reservas' },
  'languages':       { en: 'Languages',       hi: 'भाषाएँ',           te: 'భాషలు',         ta: 'மொழிகள்',          fr: 'Langues',      es: 'Idiomas' },
  'settings':        { en: 'Settings',        hi: 'सेटिंग्स',         te: 'సెట్టింగ్‌లు',    ta: 'அமைப்புகள்',       fr: 'Paramètres',   es: 'Ajustes' },
  'stock':           { en: 'Stock',           hi: 'स्टॉक',            te: 'నిల్వ',         ta: 'கையிருப்பு',       fr: 'Stock',        es: 'Inventario' },
  'feedback':        { en: 'Feedback',        hi: 'प्रतिक्रिया',      te: 'అభిప్రాయం',     ta: 'கருத்து',          fr: 'Retour',       es: 'Opiniones' },
  'interface_language':{ en: 'Interface Language', hi: 'इंटरफ़ेस भाषा', te: 'ఇంటర్‌ఫేస్ భాష', ta: 'இடைமுக மொழி',  fr: 'Langue',       es: 'Idioma' },
  'logout':          { en: 'Logout',          hi: 'लॉगआउट',           te: 'లాగౌట్',         ta: 'வெளியேறு',         fr: 'Déconnexion',  es: 'Salir' },
};

const defaultTranslations: Record<string, Partial<Record<Language, Translation>>> = {
  '1': {
    en: { menuItemId: '1', name: 'Truffle Mushroom Bruschetta', description: 'Crispy sourdough topped with sautéed wild mushrooms, truffle oil, and fresh thyme' },
    hi: { menuItemId: '1', name: 'ट्रफल मशरूम ब्रुशेटा', description: 'भुने जंगली मशरूम, ट्रफल ऑयल और ताजी थाइम के साथ कुरकुरा ब्रेड' },
    te: { menuItemId: '1', name: 'ట్రఫుల్ మష్రూమ్ బ్రుషెట్టా', description: 'వేయించిన అడవి పుట్టగొడుగులు, ట్రఫుల్ నూనె, తాజా థైమ్‌తో క్రిస్పీ బ్రెడ్' },
  },
  '2': {
    en: { menuItemId: '2', name: 'Classic Caesar Salad', description: 'Crisp romaine lettuce, parmesan, croutons, and house-made caesar dressing' },
    hi: { menuItemId: '2', name: 'क्लासिक सीज़र सलाद', description: 'ताजा रोमेन लेट्यूस, परमेसन, क्रुटन और घर का बना ड्रेसिंग' },
    te: { menuItemId: '2', name: 'క్లాసిక్ సీజర్ సలాడ్', description: 'తాజా రోమైన్ ఆకులు, పార్మెజాన్, క్రూటాన్లు, ఇంటి సీజర్ డ్రెస్సింగ్' },
  },
  '3': {
    en: { menuItemId: '3', name: 'Grilled Chicken Panini', description: 'Herb-marinated chicken, sun-dried tomatoes, mozzarella on artisan ciabatta' },
    hi: { menuItemId: '3', name: 'ग्रिल्ड चिकन पनीनी', description: 'मसालेदार चिकन, सूखे टमाटर, मोज़ेरेला आर्टिज़न ब्रेड पर' },
    te: { menuItemId: '3', name: 'గ్రిల్డ్ చికెన్ పనీని', description: 'మూలికలతో మెరినేట్ చేసిన చికెన్, ఎండు టమోటాలు, మోజరెల్లా చియాబట్టా బ్రెడ్‌పై' },
  },
  '5': {
    en: { menuItemId: '5', name: 'Butter Chicken Bowl', description: 'Tender chicken in creamy tomato gravy, served with fragrant basmati rice' },
    hi: { menuItemId: '5', name: 'बटर चिकन बाउल', description: 'मलाईदार टमाटर ग्रेवी में कोमल चिकन, खुशबूदार बासमती चावल के साथ' },
    te: { menuItemId: '5', name: 'బటర్ చికెన్ బౌల్', description: 'మెత్తని చికెన్ క్రీమీ టమోటా గ్రేవీలో, సుగంధ బాస్మతి అన్నంతో' },
  },
  '6': {
    en: { menuItemId: '6', name: 'Espresso', description: 'Double shot of our signature house blend, rich and bold' },
    hi: { menuItemId: '6', name: 'एस्प्रेसो', description: 'हमारे सिग्नेचर ब्लेंड का डबल शॉट, समृद्ध और बोल्ड' },
    te: { menuItemId: '6', name: 'ఎస్ప్రెసో', description: 'మా సిగ్నేచర్ బ్లెండ్ డబుల్ షాట్, బలమైన రుచి' },
  },
  '9': {
    en: { menuItemId: '9', name: 'Tiramisu', description: 'Classic Italian dessert with espresso-soaked ladyfingers and mascarpone cream' },
    hi: { menuItemId: '9', name: 'तिरामिसू', description: 'एस्प्रेसो में भिगोई लेडीफिंगर्स और मस्कारपोन क्रीम का इटालियन डेज़र्ट' },
    te: { menuItemId: '9', name: 'తిరామిసు', description: 'ఎస్ప్రెసోలో నానబెట్టిన లేడీఫింగర్స్, మస్కార్పోనే క్రీముతో ఇటాలియన్ తీపి' },
  },
};

export const useI18nStore = create<I18nStore>()(
  persist(
    (set, get) => ({
      language: 'en',
      adminLanguage: 'en',
      supportedLanguages: defaultSupportedLanguages,
      translations: defaultTranslations,
      uiTranslations: defaultUiTranslations,
      setLanguage: (lang) => set({ language: lang }),
      setAdminLanguage: (lang) => set({ adminLanguage: lang }),
      setSupportedLanguages: (langs) => set({
        supportedLanguages: langs.some(l => l.code === 'en')
          ? langs
          : [{ code: 'en', label: 'English', nativeLabel: 'English' }, ...langs],
      }),
      loadLanguages: async () => {
        try {
          const res = await fetch(`${import.meta.env.VITE_API_URL}/languages`);
          if (!res.ok) return;
          const langs: SupportedLanguage[] = await res.json();
          get().setSupportedLanguages(langs);
        } catch (e) {
          console.error('Failed to load languages', e);
        }
      },
      addLanguage: (lang) => set(s => ({
        supportedLanguages: s.supportedLanguages.find(l => l.code === lang.code)
          ? s.supportedLanguages
          : [...s.supportedLanguages, lang],
      })),
      removeLanguage: (code) => set(s => ({
        supportedLanguages: s.supportedLanguages.filter(l => l.code !== code || code === 'en'),
      })),
      setTranslation: (menuItemId, lang, name, description) => set(s => ({
        translations: {
          ...s.translations,
          [menuItemId]: {
            ...s.translations[menuItemId],
            [lang]: { menuItemId, name, description },
          },
        },
      })),
      setUiTranslation: (key, lang, value) => set(s => ({
        uiTranslations: {
          ...s.uiTranslations,
          [key]: { ...(s.uiTranslations[key] || { en: key }), [lang]: value },
        },
      })),
      getTranslation: (menuItemId) => {
        const { language, translations } = get();
        return translations[menuItemId]?.[language] || translations[menuItemId]?.en || null;
      },
      t: (key, scope = 'customer') => {
        const { language, adminLanguage, uiTranslations } = get();
        const lang = scope === 'admin' ? adminLanguage : language;
        return uiTranslations[key]?.[lang] || uiTranslations[key]?.en || key;
      },
    }),
    {
      name: 'i18n-store',
      version: 4, // bumped so old (English-only) localStorage data gets replaced
      migrate: () => ({
        language: 'en',
        adminLanguage: 'en',
        supportedLanguages: defaultSupportedLanguages,
        translations: defaultTranslations,
        uiTranslations: defaultUiTranslations,
      }),
    },
  ),
);