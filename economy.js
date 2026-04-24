/* ================================================================
   economy.js — Game Zone ERP v5.0
   Tüm oyun sabitleri, state yönetimi, ekonomi hesaplamaları
   ================================================================ */

/* ---- SABİTLER ---- */
const CITIES = [["İstanbul",15840900],["Ankara",5803482],["İzmir",4462056],["Bursa",3214571],["Antalya",2688004],["Konya",2296347],["Adana",2270298],["Şanlıurfa",2170110],["Gaziantep",2154051],["Kocaeli",2079072],["Mersin",1916432],["Diyarbakır",1804880],["Hatay",1686043],["Manisa",1468279],["Kayseri",1441523],["Samsun",1377546],["Balıkesir",1257590],["Kahramanmaraş",1177436],["Van",1135410],["Aydın",1148241],["Tekirdağ",1155066],["Sakarya",1098115],["Denizli",1063077],["Muğla",1050160],["Eskişehir",898369],["Mardin",870374],["Malatya",806156],["Trabzon",820152],["Ordu",761400],["Afyonkarahisar",747555],["Erzurum",749754],["Sivas",634924],["Tokat",594223],["Adıyaman",632459],["Elazığ",591497],["Çorum",528422],["Batman",647205],["Aksaray",438504],["Kütahya",576688],["Zonguldak",587783],["Isparta",444914],["Edirne",414714],["Osmaniye",559405],["Çanakkale",559383],["Giresun",446090],["Şırnak",569278],["Düzce",407283],["Kastamonu",382330],["Uşak",375454],["Niğde",365419],["Nevşehir",310827],["Rize",343212],["Bolu",324789],["Bitlis",349396],["Bingöl",285655],["Yalova",308335],["Amasya",337508],["Karabük",252058],["Kırklareli",369347],["Kırıkkale",277046],["Kırşehir",243042],["Muş",406886],["Yozgat",420699],["Siirt",331311],["Ağrı",510626],["Bilecik",228334],["Bayburt",82514],["Burdur",273488],["Sinop",215193],["Artvin",169403],["Karaman",258838],["Kars",281032],["Çankırı",198255],["Gümüşhane",151682],["Iğdır",203155],["Erzincan",239247],["Hakkari",275761],["Tunceli",85062],["Ardahan",92819],["Kilis",148098]].map(([name, pop], id) => ({ id, name, pop }));

const SHOP_TYPES = [
  { id: 'market',    name: 'Market',           price: 14000,  income: 800,   cat: 'market',    emoji: '🛒', minLevel: 1 },
  { id: 'butik',     name: 'Butik',            price: 21000,  income: 1200,  cat: 'butik',     emoji: '👔', minLevel: 1 },
  { id: 'elektronik',name: 'Elektronik',       price: 27000,  income: 1800,  cat: 'elektronik',emoji: '📱', minLevel: 2 },
  { id: 'mobilya',   name: 'Mobilya',          price: 29000,  income: 2200,  cat: 'mobilya',   emoji: '🛋️', minLevel: 2 },
  { id: 'beyaz',     name: 'Beyaz Eşya',       price: 30000,  income: 2600,  cat: 'beyaz',     emoji: '🧺', minLevel: 3 },
  { id: 'kuyumcu',   name: 'Kuyumcu',          price: 42000,  income: 4000,  cat: 'kuyumcu',   emoji: '💍', minLevel: 4 },
  { id: 'oto',       name: 'Otomotiv',         price: 56000,  income: 7000,  cat: 'oto',       emoji: '🚗', minLevel: 5 },
  { id: 'benzin',    name: 'Benzin İstasyonu', price: 92000,  income: 14000, cat: 'benzin',    emoji: '⛽', minLevel: 6 }
];

const BAHCE_T = [
  { id: 'b1', name: 'Domates Bahçesi', emoji: '🍅', price: 8000,  income: 300, ht: 3600,  minLevel: 5,  urun: 'Domates' },
  { id: 'b2', name: 'Elma Bahçesi',    emoji: '🍎', price: 10000, income: 450, ht: 5400,  minLevel: 5,  urun: 'Elma'    },
  { id: 'b3', name: 'Üzüm Bağı',       emoji: '🍇', price: 15000, income: 700, ht: 7200,  minLevel: 6,  urun: 'Üzüm'   },
  { id: 'b4', name: 'Limon Bahçesi',   emoji: '🍋', price: 12000, income: 550, ht: 6000,  minLevel: 6,  urun: 'Limon'  },
  { id: 'b5', name: 'Fındık Bahçesi',  emoji: '🌰', price: 20000, income: 900, ht: 9000,  minLevel: 7,  urun: 'Fındık' },
  { id: 'b6', name: 'Kayısı Bahçesi',  emoji: '🍑', price: 13000, income: 600, ht: 6600,  minLevel: 7,  urun: 'Kayısı' }
];

const CIFTLIK_T = [
  { id: 'c1', name: 'Tavuk Çiftliği', emoji: '🐔', price: 25000, income: 600,  ht: 3600,  minLevel: 10, urun: 'Yumurta'  },
  { id: 'c2', name: 'Süt Çiftliği',   emoji: '🐄', price: 35000, income: 900,  ht: 7200,  minLevel: 10, urun: 'Süt'      },
  { id: 'c3', name: 'Koyun Çiftliği', emoji: '🐑', price: 30000, income: 750,  ht: 5400,  minLevel: 11, urun: 'Yün'      },
  { id: 'c4', name: 'Arı Çiftliği',   emoji: '🐝', price: 20000, income: 1100, ht: 10800, minLevel: 11, urun: 'Bal'      },
  { id: 'c5', name: 'Balık Çiftliği', emoji: '🐟', price: 40000, income: 1200, ht: 9000,  minLevel: 12, urun: 'Alabalık' },
  { id: 'c6', name: 'Hindi Çiftliği', emoji: '🦃', price: 28000, income: 800,  ht: 6000,  minLevel: 12, urun: 'Hindi'    }
];

const FABRIKA_T = [
  { id: 'f1', name: 'Un Fabrikası',       emoji: '🌾', price: 80000,  income: 3000,  ht: 7200,  minLevel: 20, urun: 'Un'          },
  { id: 'f2', name: 'Tekstil Fabrikası',  emoji: '🧵', price: 100000, income: 4000,  ht: 9000,  minLevel: 20, urun: 'Kumaş'       },
  { id: 'f3', name: 'Gıda İşleme',        emoji: '🏭', price: 90000,  income: 3500,  ht: 8100,  minLevel: 21, urun: 'Konserve'    },
  { id: 'f4', name: 'Plastik Fabrikası',  emoji: '♻️', price: 75000,  income: 2800,  ht: 6600,  minLevel: 21, urun: 'Plastik'     },
  { id: 'f5', name: 'Elektronik Fabrika', emoji: '⚙️', price: 150000, income: 7000,  ht: 14400, minLevel: 22, urun: 'Devre Kartı' },
  { id: 'f6', name: 'İlaç Fabrikası',     emoji: '💊', price: 200000, income: 10000, ht: 18000, minLevel: 25, urun: 'İlaç'        }
];

const MADEN_T = [
  { id: 'm1', name: 'Kömür Madeni', emoji: '⚫', price: 200000, income: 8000,  ht: 14400, minLevel: 30, urun: 'Kömür'  },
  { id: 'm2', name: 'Demir Madeni', emoji: '🔩', price: 250000, income: 10000, ht: 18000, minLevel: 30, urun: 'Demir'  },
  { id: 'm3', name: 'Bakır Madeni', emoji: '🟠', price: 300000, income: 13000, ht: 21600, minLevel: 32, urun: 'Bakır'  },
  { id: 'm4', name: 'Altın Madeni', emoji: '🥇', price: 500000, income: 25000, ht: 36000, minLevel: 35, urun: 'Altın'  },
  { id: 'm5', name: 'Mermer Ocağı', emoji: '🪨', price: 180000, income: 7000,  ht: 12600, minLevel: 30, urun: 'Mermer' },
  { id: 'm6', name: 'Bor Madeni',   emoji: '🔵', price: 400000, income: 18000, ht: 28800, minLevel: 33, urun: 'Bor'    }
];

const DEPO_TYPES = [
  { id: 'kucuk', name: 'Küçük Depo', cap: 1000,   price: 500000,  minLevel: 1,  emoji: '🏠', desc: '1.000 birim · 5. Sv öncesi' },
  { id: 'orta',  name: 'Orta Depo',  cap: 5000,   price: 2000000, minLevel: 5,  emoji: '🏢', desc: '5.000 birim · Sv5+'          },
  { id: 'buyuk', name: 'Büyük Depo', cap: 20000,  price: 5000000, minLevel: 10, emoji: '🏭', desc: '20.000 birim · Sv10+'        },
  { id: 'dev',   name: 'Dev Depo',   cap: 100000, price:15000000, minLevel: 20, emoji: '🌆', desc: '100.000 birim · Sv20+'       },
  { id: 'mega',  name: 'Mega Depo',  cap: 500000, price: 0,       minLevel: 30, emoji: '🏙️', desc: '500.000 birim · 💎 500 Elmas' }
];

const MOCK_PLAYERS = [
  { name: 'YAKISIKLI',  emoji: '🐱', lvl: 132, money: 440700000000 },
  { name: 'Bukubey_52', emoji: '👨‍💼', lvl: 130, money: 526200000000 },
  { name: 'Pamela',     emoji: '👸', lvl: 122, money: 432800000000 },
  { name: 'kdr',        emoji: '✨', lvl: 135, money: 381300000000 },
  { name: 'okan',       emoji: '🇹🇷', lvl: 129, money: 339400000000 },
  { name: 'TIRTIL',     emoji: '🌴', lvl: 124, money: 329300000000 },
  { name: 'Legend1907', emoji: '⚽', lvl: 113, money: 308800000000 },
  { name: 'Gold',       emoji: '🥇', lvl: 104, money: 271000000000 },
  { name: 'LEOPAR',     emoji: '🐆', lvl: 123, money: 260800000000 },
  { name: 'Atomikjack', emoji: '👯', lvl: 124, money: 252900000000 }
];

const CHAT_SEED = [
  { user: 'htatli46', av: '👨', time: '2 dk',  text: 'Vgn ucusta' },
  { user: 'Aladeen',  av: '🪖', time: '3 dk',  text: 'brifing işleri var 😂' },
  { user: 'ByKeskin', av: '🙂', time: '5 dk',  text: 'Marka sistemi güzel olmuş' },
  { user: 'Utk',      av: '🤴', time: '7 dk',  text: 'Kripto sistemi açıldı mı?' },
  { user: 'Bolero',   av: '🎩', time: '11 dk', text: 'İhaleyi kazandım 🏆' }
];

const REYON_PRODUCTS = {
  'Temel Gıda': [
    { name: 'Buğday Unu',    emoji: '🌾', unit: 'kg',   basePrice: 4.44  },
    { name: 'Ayçiçek Yağı', emoji: '🫙', unit: 'lt',   basePrice: 28.5  },
    { name: 'Zeytinyağı',   emoji: '🫒', unit: 'lt',   basePrice: 85    },
    { name: 'Şeker',         emoji: '🍚', unit: 'kg',   basePrice: 18    },
    { name: 'Çay',           emoji: '🍵', unit: 'kg',   basePrice: 120   }
  ],
  'Kahvaltılık': [
    { name: 'Yumurta',      emoji: '🥚', unit: 'adet', basePrice: 3.5   },
    { name: 'Süt',          emoji: '🥛', unit: 'lt',   basePrice: 8.5   },
    { name: 'Zeytin',       emoji: '🫒', unit: 'kg',   basePrice: 45    },
    { name: 'Beyaz Peynir', emoji: '🧀', unit: 'kg',   basePrice: 120   },
    { name: 'Bal',          emoji: '🍯', unit: 'kg',   basePrice: 250   }
  ],
  'Meyve & Sebze': [
    { name: 'Domates', emoji: '🍅', unit: 'kg', basePrice: 12 },
    { name: 'Elma',    emoji: '🍎', unit: 'kg', basePrice: 18 },
    { name: 'Portakal',emoji: '🍊', unit: 'kg', basePrice: 22 },
    { name: 'Muz',     emoji: '🍌', unit: 'kg', basePrice: 30 },
    { name: 'Biber',   emoji: '🫑', unit: 'kg', basePrice: 15 }
  ],
  'Et Ürünleri': [
    { name: 'Tavuk Göğsü', emoji: '🍗', unit: 'kg', basePrice: 95  },
    { name: 'Dana Kıyma',  emoji: '🥩', unit: 'kg', basePrice: 280 },
    { name: 'Sucuk',       emoji: '🌭', unit: 'kg', basePrice: 150 },
    { name: 'Pastırma',    emoji: '🥓', unit: 'kg', basePrice: 200 }
  ],
  'Fırın': [
    { name: 'Ekmek',   emoji: '🍞', unit: 'adet', basePrice: 4  },
    { name: 'Simit',   emoji: '🥨', unit: 'adet', basePrice: 6  },
    { name: 'Poğaça', emoji: '🥐', unit: 'adet', basePrice: 12 },
    { name: 'Pide',    emoji: '🫓', unit: 'adet', basePrice: 20 }
  ]
};

const KRIPTOLAR = [
  { name: 'Vortigon',  sym: 'VGN', emoji: '⚡', color: '#6366f1', price: 54174,   change: 9.86,  dir: 'up'   },
  { name: 'Neonix',    sym: 'NNX', emoji: '🔶', color: '#f59e0b', price: 431595,  change: -0.88, dir: 'down' },
  { name: 'Celestium', sym: 'CLM', emoji: '🌊', color: '#06b6d4', price: 61367,   change: 1.04,  dir: 'up'   },
  { name: 'Astrium',   sym: 'AST', emoji: '🚀', color: '#f97316', price: 616.99,  change: -0.42, dir: 'down' },
  { name: 'Galactix',  sym: 'GLX', emoji: '⭐', color: '#eab308', price: 18.89,   change: -1.06, dir: 'down' },
  { name: 'Novalis',   sym: 'NVL', emoji: '✨', color: '#fbbf24', price: 8920.5,  change: 3.44,  dir: 'up'   },
  { name: 'Meteorix',  sym: 'MTX', emoji: '☄️', color: '#f43f5e', price: 1.472,   change: 0.63,  dir: 'up'   },
  { name: 'Luminex',   sym: 'LMX', emoji: '💡', color: '#a78bfa', price: 94324,   change: 0.32,  dir: 'up'   }
];

const MARKALAR = [
  { name: 'Lodos',     emoji: '🐝', rank: 1,  tp: 41142, guc: 1.32, uyeler: 20, lider: 'Berna',      color: '#f59e0b' },
  { name: 'PatRiotSS', emoji: '🌍', rank: 2,  tp: 36173, guc: 1.31, uyeler: 1,  lider: 'NUL',        color: '#6b7280' },
  { name: 'PARAMARA',  emoji: '🚀', rank: 3,  tp: 30835, guc: 1.29, uyeler: 19, lider: 'mikailssah', color: '#6366f1' },
  { name: 'ERGENEKON', emoji: '🐺', rank: 4,  tp: 25729, guc: 1.26, uyeler: 20, lider: 'BOZKURT_TR', color: '#374151' },
  { name: 'ATOMİK',    emoji: '🐰', rank: 5,  tp: 25545, guc: 1.26, uyeler: 20, lider: 'AtomiKarinca',color:'#ef4444' },
  { name: 'NOVA',      emoji: '🚀', rank: 6,  tp: 21558, guc: 1.24, uyeler: 16, lider: 'Trump',      color: '#3b82f6' },
  { name: 'YAMYAMLAR', emoji: '🐰', rank: 7,  tp: 17302, guc: 1.22, uyeler: 4,  lider: 'Akin',       color: '#8b5cf6' },
  { name: 'RiseNShine',emoji: '🚀', rank: 8,  tp: 16724, guc: 1.22, uyeler: 18, lider: 'Utku_33',    color: '#0ea5e9' },
  { name: 'KARTELL',   emoji: '🐂', rank: 9,  tp: 15744, guc: 1.21, uyeler: 14, lider: 'ErayReis',   color: '#374151' },
  { name: 'ROTASIZ',   emoji: '⛵', rank: 10, tp: 15013, guc: 1.21, uyeler: 3,  lider: 'Ruem',       color: '#3b82f6' }
];

const FAQ = [
  { q: 'Nasıl para kazanırım?',           a: 'Dükkan aç → reyon ekle → stok satın al → kazanç topla. Bahçe/Çiftlik/Fabrika/Maden kurarak hasat geliri de elde edebilirsin.' },
  { q: 'Stok olmadan satış yapabilir miyim?', a: 'HAYIR! Reyon varsa stok sıfırsa kazanç toplanamaz. Önce stok satın al.' },
  { q: 'Giriş yaptıktan sonra atılıyorum?',   a: 'Bu sorun düzeltildi. DeviceID artık güncellemeden etkilenmez. Oturumun aktif kalır.' },
  { q: 'Depo fiyatları neden yüksek?',         a: 'Depo seviyelidir. Küçük depo 500K₺, Orta 2M₺, Büyük 5M₺, Dev 15M₺, Mega ise 500 elmas.' },
  { q: 'Level nasıl hızlı çıkarım?',           a: 'Kazanç topla, hasat al, ihale kazan, kripto sat. Her işlem XP verir. Level başına XP azaldı, daha hızlı çıkabilirsin.' },
  { q: 'Oyuncu pazarı nedir?',                 a: "Kendi ürünlerini diğer oyunculara satabilirsin. Menü → Oyuncu Pazarı" },
  { q: 'Kripto/Enerji ne zaman açılır?',       a: 'Kripto: Sv5 · Enerji: Sv8' }
];

const EXPORT_COUNTRIES = [
  { flag: '🇩🇪', name: 'Kaiser/Almanya'   },
  { flag: '🇫🇷', name: 'Lumière/Fransa'   },
  { flag: '🇬🇧', name: 'Royal/İngiltere'  },
  { flag: '🇯🇵', name: 'Yamamoto/Japonya' },
  { flag: '🇺🇸', name: 'Atlantic/ABD'     },
  { flag: '🇨🇳', name: 'Zhonghe/Çin'      }
];

const EXPORT_PRODUCTS = [
  { name: 'Buğday Unu', unit: 'kg',   emoji: '🌾' },
  { name: 'Zeytinyağı', unit: 'lt',   emoji: '🫙' },
  { name: 'Fındık',     unit: 'kg',   emoji: '🌰' },
  { name: 'Altın',      unit: 'gram', emoji: '🥇' },
  { name: 'Mermer',     unit: 'ton',  emoji: '🪨' }
];

const IHALE_DATA = [
  { flag: '🇩🇪', company: 'Kaiser',    product: 'Kimyasal', unit: 'lt',   qty: 701200, budgetBase: 4.15,  emoji: '🧪' },
  { flag: '🇫🇷', company: 'Lumière',   product: 'Polen',    unit: 'kg',   qty: 13200,  budgetBase: 37,    emoji: '🍯' },
  { flag: '🇬🇧', company: 'Royal',     product: 'Mermer',   unit: 'ton',  qty: 450,    budgetBase: 820,   emoji: '🪨' },
  { flag: '🇺🇸', company: 'Atlantic',  product: 'Altın',    unit: 'gram', qty: 500,    budgetBase: 1850,  emoji: '🥇' },
  { flag: '🇯🇵', company: 'Yamamoto',  product: 'Fındık',   unit: 'kg',   qty: 30000,  budgetBase: 18,    emoji: '🌰' }
];

/* ================================================================
   STATE
   ================================================================ */
let state = {
  user: null,
  money: 20000,
  bank: { balance: 0, investment: 0, credit: 0, profit: 0 },
  diamonds: 10,
  coupons: 1,
  level: 1,
  xp: 0,
  shops: [],
  tesisler: { bahce: [], ciftlik: [], fabrika: [], maden: [] },
  employees: 0,
  moral: 100,
  weeklyExpense: 0,
  weeklySalary: 0,
  joinDate: Date.now(),
  lotteryJoined: false,
  assistants: [],
  notifications: [{ id: 1, text: 'Hoş geldin! 20.000 TL başlangıç sermayen yatırıldı 💰', time: 'az önce', read: false }],
  chatHistory: [],
  depolar: [],
  kripto: {},
  kriptoHistory: [],
  exportOrders: [],
  exportLastGen: 0,
  ihaleData: null,
  ihaleLastGen: 0,
  myMarka: null,
  pazarListings: [],
  banned: false,
  banReason: ''
};

const LS_KEY = 'gamezoneERP_v5';

function saveState() {
  try { localStorage.setItem(LS_KEY, JSON.stringify(state)); } catch (e) {}
}

function loadState() {
  try {
    const d = localStorage.getItem(LS_KEY);
    if (d) {
      const p = JSON.parse(d);
      state = Object.assign({}, state, p);
      if (!state.bank) state.bank = { balance: 0, investment: 0, credit: 0, profit: 0 };
      if (!state.tesisler) state.tesisler = { bahce: [], ciftlik: [], fabrika: [], maden: [] };
      ['bahce', 'ciftlik', 'fabrika', 'maden'].forEach(k => { if (!state.tesisler[k]) state.tesisler[k] = []; });
      if (!state.depolar) state.depolar = [];
      if (!state.kripto) state.kripto = {};
      if (!state.kriptoHistory) state.kriptoHistory = [];
      if (!state.exportOrders) state.exportOrders = [];
      if (!state.notifications) state.notifications = [];
      if (!state.pazarListings) state.pazarListings = [];
    }
  } catch (e) {}
}

/* ---- UTILS ---- */
function fmt(n) { return new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(n) || 0); }
function fmtShort(n) {
  n = Number(n) || 0;
  if (n >= 1e12) return (n / 1e12).toFixed(1) + ' TRİLYON';
  if (n >= 1e9)  return (n / 1e9).toFixed(1)  + ' MİLYAR';
  if (n >= 1e6)  return (n / 1e6).toFixed(1)  + ' MİLYON';
  if (n >= 1e3)  return (n / 1e3).toFixed(1)  + ' BİN';
  return fmt(n);
}
function fmtTime(s) {
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sc = s % 60;
  if (h > 0) return h + 's ' + m + 'd';
  if (m > 0) return m + 'd ' + sc + 'sn';
  return sc + 'sn';
}
function toast(msg, type = '') {
  const t = document.getElementById('toast');
  t.textContent = msg; t.className = 'toast show ' + (type || '');
  setTimeout(() => t.classList.remove('show'), 2800);
}
function confetti() {
  const h = document.getElementById('confetti-host');
  h.style.display = 'block'; h.innerHTML = '';
  const c = ['#fbbf24', '#6366f1', '#ef4444', '#10b981', '#8b5cf6', '#f472b6'];
  for (let i = 0; i < 50; i++) {
    const s = document.createElement('span');
    s.style.left = Math.random() * 100 + '%';
    s.style.background = c[Math.floor(Math.random() * c.length)];
    s.style.animationDelay = (Math.random() * .5) + 's';
    s.style.animationDuration = (2 + Math.random() * 1.5) + 's';
    h.appendChild(s);
  }
  setTimeout(() => { h.style.display = 'none'; h.innerHTML = ''; }, 3500);
}
function openModal(id)  { const el = document.getElementById(id); if (el) el.classList.add('active'); }
function closeModal(id) { const el = document.getElementById(id); if (el) el.classList.remove('active'); }

/* ---- ANTI-CHEAT ---- */
let _lastMoney = 20000, _lastCheck = Date.now();

function antiCheatTick() {
  const now = Date.now(); const elapsed = (now - _lastCheck) / 1000; const diff = state.money - _lastMoney;
  if (elapsed > 0 && diff / elapsed > 200000 && elapsed < 5 && state.user) {
    triggerBan('Hız hilesi: Saniyede ' + Math.floor(diff / elapsed).toLocaleString() + ' ₺');
    return;
  }
  _lastMoney = state.money; _lastCheck = now;
}
setInterval(antiCheatTick, 5000);

function triggerBan(reason) {
  state.banned = true; state.banReason = reason; saveState();
  if (fbDb && fbUser) {
    fbDb.collection('bans').doc(fbUser.uid).set({ reason, ts: Date.now() }).catch(() => {});
  }
  showBanScreen(reason);
}

function showBanScreen(r) {
  document.getElementById('ban-reason-txt').textContent = r || 'Kural ihlali.';
  document.getElementById('ban-scr').classList.add('show');
}
function checkBanned() { if (state.banned) showBanScreen(state.banReason); }

/* ================================================================
   EKONOMI FONKSİYONLARI
   ================================================================ */

/* ---- DÜKKANLAR ---- */
let selShop = null;

function openShopModal() {
  selShop = null;
  const sel = document.getElementById('shop-city');
  sel.innerHTML = '<option value="">Şehir Seçin...</option>' + CITIES.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
  document.getElementById('shop-grid').innerHTML = SHOP_TYPES.map((t, i) => {
    const lk = state.level < t.minLevel;
    return `<div class="shop-card ${lk ? 'disabled' : ''}" onclick="selectShop(${i})">
      <div class="shop-img cat-${t.cat}">${t.emoji}<div class="shop-price">${fmt(t.price)} ₺</div></div>
      <div class="shop-info"><div class="shop-name">${t.name}</div><div class="shop-income">${lk ? '🔒 Sv' + t.minLevel : 'Gelir: ' + fmt(t.income) + ' ₺/saat'}</div></div>
    </div>`;
  }).join('');
  document.getElementById('shop-confirm').disabled = true;
  openModal('shop-modal');
  document.getElementById('shop-city').onchange = () => {
    document.getElementById('shop-confirm').disabled = !(selShop !== null && document.getElementById('shop-city').value);
  };
}

function selectShop(i) {
  const t = SHOP_TYPES[i];
  if (state.level < t.minLevel) { toast('Seviye ' + t.minLevel + ' gerekli', 'error'); return; }
  if (state.money < t.price) { toast('Yetersiz bakiye! ' + fmt(t.price) + ' ₺ gerekli', 'error'); return; }
  selShop = i;
  document.querySelectorAll('.shop-card').forEach((c, j) => c.classList.toggle('selected', j === i));
  document.getElementById('shop-confirm').disabled = !(selShop !== null && document.getElementById('shop-city').value);
}

function confirmShop() {
  const t = SHOP_TYPES[selShop]; const cityId = parseInt(document.getElementById('shop-city').value);
  if (isNaN(cityId)) { toast('Şehir seçin', 'error'); return; }
  if (state.money < t.price) { toast('Yetersiz bakiye!', 'error'); return; }
  state.money -= t.price;
  state.shops.push({ type: t.id, cityId, lvl: 1, bought: Date.now(), lastCollect: Date.now(), reyonlar: [] });
  state.employees += 2; state.weeklyExpense += t.price * 0.02; state.weeklySalary += 500;
  state.xp += 200; checkLevel(); _lastMoney = state.money; _lastCheck = Date.now();
  state.notifications.unshift({ id: Date.now(), text: `🏪 ${CITIES.find(c => c.id === cityId).name}'da ${t.name} açıldı!`, time: 'az önce', read: false });
  saveState(); closeModal('shop-modal'); renderAll(); toast(t.name + ' açıldı! 🎉', 'success'); confetti();
}

function collectIncome(i) {
  const s = state.shops[i]; const t = SHOP_TYPES.find(x => x.id === s.type); const reyonlar = s.reyonlar || [];
  if (reyonlar.length > 0) {
    const totalStock = reyonlar.reduce((a, r) => a + (r.stock || 0), 0);
    if (totalStock <= 0) { toast('⚠️ Depoda stok yok! Önce 📦 butonuna bas ve stok satın al.', 'error'); return; }
  }
  const last = s.lastCollect || Date.now(); const hours = Math.min(8, (Date.now() - last) / 3600000);
  if (hours < 0.0167) { toast('Henüz kazanç birikmedi', 'error'); return; }
  const earned = Math.floor(t.income * (s.lvl || 1) * hours);
  if (reyonlar.length > 0) {
    let kalan = Math.ceil(earned / 100);
    for (const r of reyonlar) { const al = Math.min(r.stock || 0, kalan); r.stock = (r.stock || 0) - al; kalan -= al; if (kalan <= 0) break; }
  }
  state.money += earned; state.xp += Math.floor(earned / 50); checkLevel(); s.lastCollect = Date.now();
  _lastMoney = state.money; _lastCheck = Date.now();
  saveState(); if (fbDb && fbUser) saveFsState(); renderAll(); toast('+' + fmt(earned) + ' ₺ kazandın! 💰', 'success');
}

function upgradeShop(i) {
  const s = state.shops[i]; const t = SHOP_TYPES.find(x => x.id === s.type); const cost = Math.floor(t.price * (s.lvl || 1) * 0.5);
  if (state.money < cost) { toast('Yetersiz bakiye! ' + fmt(cost) + ' ₺ gerekli', 'error'); return; }
  state.money -= cost; s.lvl = (s.lvl || 1) + 1; state.xp += 100; checkLevel();
  _lastMoney = state.money; _lastCheck = Date.now();
  saveState(); renderAll(); toast('Dükkan Seviye ' + s.lvl + '! 🎉', 'success');
}

/* SHOP DETAIL + REYON */
let curShop = null, curReyon = null;

function openShopDetail(i) {
  curShop = i;
  const s = state.shops[i]; const t = SHOP_TYPES.find(x => x.id === s.type); const c = CITIES.find(x => x.id === s.cityId); const reyonlar = s.reyonlar || [];
  document.getElementById('sd-title').textContent = t.name + ' — ' + c.name;
  let rHTML = `<div style="font-weight:800;font-size:14px;margin-bottom:8px;color:var(--tx)">📦 Reyonlar</div><button class="btn-create" style="margin-bottom:10px;padding:9px 16px;font-size:13px" onclick="openReyonModal(${i})">+ Reyon Ekle</button>`;
  if (!reyonlar.length) { rHTML += '<div style="text-align:center;padding:14px;color:var(--tm);font-size:13px;background:rgba(255,255,255,.04);border-radius:10px;border:1px solid var(--br)">Henüz reyon yok!</div>'; }
  else {
    reyonlar.forEach((r, ri) => {
      const stokRenk = r.stock <= 0 ? '#ef4444' : r.stock < 10 ? '#f59e0b' : '#10b981';
      rHTML += `<div class="reyon-card"><div class="reyon-icon">${r.emoji}</div><div class="reyon-info"><div class="reyon-name">${r.name}</div><div class="reyon-meta">Stok: <span style="color:${stokRenk}">${r.stock || 0}</span>/${r.maxStock || 50} ${r.unit} · ${fmt(r.sellPrice)} ₺</div></div><div class="reyon-actions"><button class="reyon-btn green" onclick="openStokModal(${i},${ri})">📦</button><button class="reyon-btn" onclick="openReyonPrice(${i},${ri})">₺</button><button class="reyon-btn red" onclick="removeReyon(${i},${ri})">🗑</button></div></div>`;
    });
  }
  document.getElementById('sd-body').innerHTML = `
    <div style="text-align:center;padding:14px 0"><div style="font-size:56px">${t.emoji}</div><div style="font-size:16px;font-weight:800;margin-top:6px">Seviye ${s.lvl || 1}</div></div>
    <div class="row"><span class="row-label">Günlük Gelir</span><span class="row-value green">${fmt(t.income * (s.lvl || 1))} ₺</span></div>
    <div class="row"><span class="row-label">Haftalık Gider</span><span class="row-value red">${fmt(t.price * 0.02)} ₺</span></div>
    <div class="row"><span class="row-label">Şehir</span><span class="row-value">${c.name}</span></div>
    <div style="padding:10px 0 6px">${rHTML}</div>
    <button class="btn-yellow" style="width:100%;margin-top:8px;padding:12px" onclick="closeModal('shop-detail-modal');upgradeShop(${i})">⬆️ Yükselt (${fmt(Math.floor(t.price * (s.lvl || 1) * 0.5))} ₺)</button>`;
  openModal('shop-detail-modal');
}

function openReyonModal(si) {
  curShop = si;
  const list = document.getElementById('reyon-product-list'); let html = '';
  Object.entries(REYON_PRODUCTS).forEach(([cat, prods]) => {
    html += `<div class="product-cat-title">${cat}</div><div class="product-grid">`;
    prods.forEach((p, pi) => { html += `<div class="product-cell" onclick="addReyon('${cat}',${pi})"><div class="product-cell-icon">${p.emoji}</div><div class="product-cell-name">${p.name}</div></div>`; });
    html += '</div>';
  });
  list.innerHTML = html; openModal('reyon-modal');
}

function addReyon(cat, pi) {
  const p = REYON_PRODUCTS[cat][pi]; const shop = state.shops[curShop];
  if (!shop.reyonlar) shop.reyonlar = [];
  if (shop.reyonlar.find(r => r.name === p.name)) { toast('Bu reyon zaten var', 'error'); return; }
  shop.reyonlar.push({ name: p.name, emoji: p.emoji, unit: p.unit, basePrice: p.basePrice, sellPrice: parseFloat((p.basePrice * 1.25).toFixed(2)), stock: 0, maxStock: 50 });
  closeModal('reyon-modal'); saveState(); openShopDetail(curShop); toast(p.name + ' eklendi 📦', 'success');
}

function openReyonPrice(si, ri) {
  curShop = si; curReyon = ri; const r = state.shops[si].reyonlar[ri];
  document.getElementById('rpm-icon').textContent = r.emoji;
  document.getElementById('rpm-title').textContent = r.name + ' Fiyat Ayarla';
  document.getElementById('rpm-price').value = r.sellPrice;
  document.getElementById('rpm-tip').textContent = `Alış: ${fmt(r.basePrice)} ₺ · Önerilen: ${fmt(r.basePrice * 1.25)} ₺ · Rakip: ${fmt(r.basePrice * 1.35)} ₺`;
  closeModal('shop-detail-modal'); openModal('reyon-price-modal');
}

function saveReyonPrice() {
  const v = parseFloat(document.getElementById('rpm-price').value);
  if (isNaN(v) || v <= 0) { toast('Geçerli fiyat girin', 'error'); return; }
  state.shops[curShop].reyonlar[curReyon].sellPrice = v;
  saveState(); closeModal('reyon-price-modal'); openShopDetail(curShop); toast('Fiyat güncellendi ✅', 'success');
}

function removeReyon(si, ri) { state.shops[si].reyonlar.splice(ri, 1); saveState(); openShopDetail(si); toast('Reyon kaldırıldı', ''); }

/* STOK MODAL */
let _stokSi = null, _stokRi = null;

function openStokModal(si, ri) {
  _stokSi = si; _stokRi = ri; const r = state.shops[si].reyonlar[ri];
  document.getElementById('stok-modal-title').textContent = 'Stok Al — ' + r.name;
  document.getElementById('stok-emoji').textContent = r.emoji;
  document.getElementById('stok-name').textContent = r.name;
  document.getElementById('stok-cur').textContent = r.stock || 0;
  document.getElementById('stok-max').textContent = r.maxStock || 50;
  document.getElementById('stok-bp').textContent = fmt(r.basePrice);
  const qi = document.getElementById('stok-qty'); qi.value = '';
  qi.oninput = () => { const q = parseInt(qi.value) || 0; document.getElementById('stok-cost').textContent = fmt(q * r.basePrice) + ' ₺'; };
  closeModal('shop-detail-modal'); openModal('stok-modal');
}

function confirmStokAl() {
  const r = state.shops[_stokSi].reyonlar[_stokRi]; const qty = parseInt(document.getElementById('stok-qty').value) || 0;
  if (qty <= 0) { toast('Geçerli miktar girin', 'error'); return; }
  const maxAl = (r.maxStock || 50) - (r.stock || 0);
  if (qty > maxAl) { toast('Maks ' + maxAl + ' birim alabilirsin', 'error'); return; }
  const maliyet = qty * r.basePrice;
  if (state.money < maliyet) { toast('Yetersiz bakiye! ' + fmt(maliyet) + ' ₺ gerekli', 'error'); return; }
  state.money -= maliyet; r.stock = (r.stock || 0) + qty;
  _lastMoney = state.money; _lastCheck = Date.now(); state.xp += 10; checkLevel();
  saveState(); if (fbDb && fbUser) saveFsState(); closeModal('stok-modal'); renderAll();
  toast(qty + ' adet stok alındı 📦', 'success'); openShopDetail(_stokSi);
}

/* ---- ÜRETİM TESİSLERİ ---- */
function renderUretimPage(bodyId, tesisler, stateKey, minLvl, lockedMsg) {
  const body = document.getElementById(bodyId);
  if (state.level < minLvl) { body.innerHTML = `<div class="empty"><div class="empty-lock">🔒</div><div class="empty-big">${lockedMsg}</div><div class="empty-text" style="margin-top:8px">Daha fazla XP kazan ve seviye atla!</div></div>`; return; }
  const owned = state.tesisler[stateKey] || []; const now = Date.now();
  let html = '<div class="uretim-grid">';
  tesisler.forEach((t, i) => {
    const locked = state.level < t.minLevel; const ownerIdx = owned.findIndex(o => o.id === t.id); const isOwned = ownerIdx >= 0; const o = isOwned ? owned[ownerIdx] : null;
    let badge = '', extra = '';
    if (locked) { badge = `<span class="uretim-badge badge-lock">🔒 Sv${t.minLevel}</span>`; }
    else if (isOwned) {
      const elapsed = Math.floor((now - (o.lastHarvest || o.bought || now)) / 1000);
      const ready = elapsed >= t.ht; const pct = Math.min(elapsed / t.ht, 1) * 100;
      badge = `<span class="uretim-badge badge-own">${ready ? '✅ Hazır' : '⏳ ' + fmtTime(Math.max(0, t.ht - elapsed))}</span>`;
      extra = `<div class="uretim-progress"><div class="uretim-progress-fill" style="width:${pct}%;background:${ready ? '#10b981' : '#6366f1'}"></div></div>${ready ? `<button class="harvest-btn" onclick="harvestTesis('${stateKey}',${ownerIdx},'${t.urun}',${t.income})">🌾 Hasat Al (+${fmt(t.income)} ₺)</button>` : ''}`;
    } else { badge = `<span class="uretim-badge badge-ok">💰 ${fmt(t.price)} ₺</span>`; }
    html += `<div class="uretim-card ${locked ? 'locked' : ''} ${isOwned ? 'owned' : ''}" onclick="${locked ? `toast('Seviye ${t.minLevel} gerekli','error')` : isOwned ? '' : `buyTesis('${stateKey}',${i})`}">
      <div class="uretim-icon">${t.emoji}</div><div class="uretim-name">${t.name}</div>
      <div class="uretim-desc">${t.urun} · ${fmt(t.income)} ₺</div>${badge}${extra}</div>`;
  });
  html += '</div>'; body.innerHTML = html;
}

function buyTesis(key, idx) {
  const map = { bahce: BAHCE_T, ciftlik: CIFTLIK_T, fabrika: FABRIKA_T, maden: MADEN_T }; const t = map[key][idx];
  if (state.level < t.minLevel) { toast('Seviye ' + t.minLevel + ' gerekli', 'error'); return; }
  if (state.money < t.price) { toast('Yetersiz bakiye! ' + fmt(t.price) + ' ₺ gerekli', 'error'); return; }
  state.money -= t.price; state.xp += 150; checkLevel(); _lastMoney = state.money; _lastCheck = Date.now();
  if (!state.tesisler[key]) state.tesisler[key] = [];
  state.tesisler[key].push({ id: t.id, bought: Date.now(), lastHarvest: 0, lvl: 1 });
  state.weeklyExpense += t.price * 0.01;
  saveState(); renderAll(); toast(t.name + ' kuruldu! 🎉', 'success'); confetti();
}

function harvestTesis(key, ownerIdx, urun, income) {
  const o = state.tesisler[key][ownerIdx];
  state.money += income; state.xp += Math.floor(income / 50); checkLevel();
  o.lastHarvest = Date.now(); _lastMoney = state.money; _lastCheck = Date.now();
  saveState(); if (fbDb && fbUser) saveFsState(); renderAll();
  toast('+' + fmt(income) + ' ₺ hasat (' + urun + ')! 🌾', 'success');
}

/* ---- BANKA ---- */
function bankAction(type) {
  const b = state.bank || {};
  const dep = document.getElementById('bam-deposit'); const wit = document.getElementById('bam-withdraw');
  document.getElementById('bam-amount').value = '';
  if (type === 'deposit') {
    document.getElementById('bam-title').textContent = 'Vadesiz Hesap';
    document.getElementById('bam-desc').textContent = 'Nakit bakiyenizden banka hesabına aktarın veya çekin.';
    dep.textContent = '💸 Yatır'; wit.textContent = '↩️ Çek';
    dep.onclick = () => bankTx('deposit', 'in'); wit.onclick = () => bankTx('deposit', 'out');
  } else if (type === 'invest') {
    document.getElementById('bam-title').textContent = 'Yatırım Hesabı';
    document.getElementById('bam-desc').textContent = 'Vadesiz hesabınızdan yatırım hesabına aktarın (%8 yıllık faiz).';
    dep.textContent = '📈 Yatır'; wit.textContent = '↩️ Çek';
    dep.onclick = () => bankTx('invest', 'in'); wit.onclick = () => bankTx('invest', 'out');
  } else {
    document.getElementById('bam-title').textContent = 'Kredi (Limit: ' + fmt(state.level * 10000) + ' ₺)';
    document.getElementById('bam-desc').textContent = 'Kredi çekin ya da borcunuzu ödeyin.';
    dep.textContent = '💳 Çek'; wit.textContent = '✅ Öde';
    dep.onclick = () => bankTx('credit', 'in'); wit.onclick = () => bankTx('credit', 'out');
  }
  openModal('bank-action-modal');
}

function bankTx(type, dir) {
  const n = parseFloat(document.getElementById('bam-amount').value);
  if (isNaN(n) || n <= 0) { toast('Geçerli tutar girin', 'error'); return; }
  const b = state.bank;
  if (type === 'deposit') {
    if (dir === 'in') { if (state.money < n) { toast('Yetersiz nakit', 'error'); return; } state.money -= n; b.balance = (b.balance || 0) + n; toast(fmt(n) + ' ₺ yatırıldı ✅', 'success'); }
    else { if ((b.balance || 0) < n) { toast('Yetersiz bakiye', 'error'); return; } b.balance -= n; state.money += n; toast(fmt(n) + ' ₺ çekildi ✅', 'success'); }
  } else if (type === 'invest') {
    if (dir === 'in') { if ((b.balance || 0) < n) { toast('Yetersiz vadesiz bakiye', 'error'); return; } b.balance -= n; b.investment = (b.investment || 0) + n; toast(fmt(n) + ' ₺ yatırıma aktarıldı 📈', 'success'); }
    else { if ((b.investment || 0) < n) { toast('Yetersiz yatırım bakiyesi', 'error'); return; } b.investment -= n; b.balance = (b.balance || 0) + n; toast(fmt(n) + ' ₺ çekildi', 'success'); }
  } else {
    const lim = state.level * 10000;
    if (dir === 'in') { if ((b.credit || 0) + n > lim) { toast('Limit aşıldı! Max: ' + fmt(lim), 'error'); return; } b.credit = (b.credit || 0) + n; state.money += n; toast(fmt(n) + ' ₺ kredi çekildi 💳', 'success'); }
    else { if (state.money < n) { toast('Yetersiz nakit', 'error'); return; } if ((b.credit || 0) < n) { toast('Borç bu kadar değil', 'error'); return; } b.credit -= n; state.money -= n; toast(fmt(n) + ' ₺ ödendi ✅', 'success'); }
  }
  _lastMoney = state.money; _lastCheck = Date.now();
  closeModal('bank-action-modal'); saveState(); if (fbDb && fbUser) saveFsState(); renderBank(); renderTopbar();
}

function payExpense() {
  if (!(state.weeklyExpense > 0)) { toast('Ödenecek gider yok', 'error'); return; }
  if (state.money < state.weeklyExpense) { toast('Yetersiz bakiye', 'error'); return; }
  state.money -= state.weeklyExpense; _lastMoney = state.money;
  toast(fmt(state.weeklyExpense) + ' ₺ gider ödendi', 'success'); saveState(); renderAll();
}

function paySalary() {
  if (!(state.weeklySalary > 0)) { toast('Ödenecek maaş yok', 'error'); return; }
  if (state.money < state.weeklySalary) { toast('Yetersiz bakiye, moral düşüyor!', 'error'); state.moral = Math.max(0, (state.moral || 100) - 10); saveState(); renderAll(); return; }
  state.money -= state.weeklySalary; state.moral = 100; _lastMoney = state.money;
  toast('Maaşlar ödendi 💵', 'success'); saveState(); renderAll();
}

/* ---- KRIPTO ---- */
function kriptoBuy(i) {
  const k = KRIPTOLAR[i]; const qty = parseFloat(document.getElementById('km-amount').value);
  if (isNaN(qty) || qty <= 0) { toast('Geçerli miktar girin', 'error'); return; }
  const total = qty * k.price; const comm = total * .001;
  if (state.money < total + comm) { toast('Yetersiz bakiye!', 'error'); return; }
  state.money -= (total + comm);
  if (!state.kripto) state.kripto = {};
  state.kripto[k.sym] = (state.kripto[k.sym] || 0) + qty;
  if (!state.kriptoHistory) state.kriptoHistory = [];
  state.kriptoHistory.unshift({ type: 'buy', sym: k.sym, qty, total: total + comm, time: new Date().toLocaleTimeString('tr') });
  state.xp += 20; checkLevel(); _lastMoney = state.money; _lastCheck = Date.now();
  saveState(); if (fbDb && fbUser) saveFsState(); closeModal('kripto-modal'); renderTopbar();
  toast(qty.toFixed(4) + ' ' + k.sym + ' alındı ✅', 'success');
}

function kriptoSell(i) {
  const k = KRIPTOLAR[i]; const qty = parseFloat(document.getElementById('km-amount').value);
  if (isNaN(qty) || qty <= 0) { toast('Geçerli miktar girin', 'error'); return; }
  const held = (state.kripto || {})[k.sym] || 0;
  if (held < qty) { toast('Yetersiz ' + k.sym, 'error'); return; }
  const total = qty * k.price; const comm = total * .001;
  state.money += (total - comm); state.kripto[k.sym] = held - qty;
  if (!state.kriptoHistory) state.kriptoHistory = [];
  state.kriptoHistory.unshift({ type: 'sell', sym: k.sym, qty, total: total - comm, time: new Date().toLocaleTimeString('tr') });
  state.xp += 20; checkLevel(); _lastMoney = state.money; _lastCheck = Date.now();
  saveState(); if (fbDb && fbUser) saveFsState(); closeModal('kripto-modal'); renderTopbar();
  toast(qty.toFixed(4) + ' ' + k.sym + ' satıldı 🔴', 'success');
}

/* ---- İHRACAT ---- */
function generateExportOrders() {
  if (!state.exportOrders || state.exportOrders.length < 15 || Date.now() - (state.exportLastGen || 0) > 900000) {
    state.exportOrders = [];
    for (let i = 0; i < 15; i++) {
      const c = EXPORT_COUNTRIES[Math.floor(Math.random() * EXPORT_COUNTRIES.length)];
      const p = EXPORT_PRODUCTS[Math.floor(Math.random() * EXPORT_PRODUCTS.length)];
      const qty = Math.floor(Math.random() * 4000000 + 100000);
      state.exportOrders.push({ country: c, product: p, qty, price: parseFloat((Math.random() * 50 + 3).toFixed(2)), sent: Math.floor(Math.random() * qty * .4), minQty: Math.floor(Math.random() * 9000 + 1000), id: Date.now() + i });
    }
    state.exportLastGen = Date.now();
  }
}

function shipExport(i) {
  const o = state.exportOrders[i];
  if (!(state.depolar || []).length) { toast('Önce depo açın!', 'error'); return; }
  const earned = Math.floor(o.minQty * o.price);
  state.money += earned; state.xp += Math.floor(earned / 200); checkLevel();
  o.sent = Math.min(o.sent + o.minQty, o.qty);
  o.price = parseFloat((o.price * (.92 + Math.random() * .18)).toFixed(2));
  _lastMoney = state.money; _lastCheck = Date.now();
  saveState(); if (fbDb && fbUser) saveFsState(); renderTopbar(); renderIhracat();
  toast('+' + fmt(earned) + ' ₺ ihracat geliri 🚢', 'success');
}

setInterval(() => {
  if (state.exportOrders) {
    state.exportOrders.forEach(o => { o.price = parseFloat((o.price * (.95 + Math.random() * .12)).toFixed(2)); });
    if (document.querySelector('#page-ihracat.active')) renderIhracat();
  }
}, 120000);

/* ---- İHALE ---- */
let ihaleTimers = {}, ihaleState = null;

function generateIhaleler() {
  if (!state.ihaleData || Date.now() - (state.ihaleLastGen || 0) > 300000) {
    state.ihaleData = IHALE_DATA.map((d, i) => ({ ...d, budget: parseFloat((d.budgetBase * (.9 + Math.random() * .2)).toFixed(2)), deadline: Date.now() + Math.floor(Math.random() * 90 + 10) * 1000, bids: [], won: false, id: i }));
    state.ihaleLastGen = Date.now(); saveState();
  }
}

function openIhaleBid(i) {
  const d = state.ihaleData[i]; ihaleState = i;
  document.getElementById('ibm-title').textContent = d.product + ' İhalesi';
  document.getElementById('ibm-desc').textContent = `${d.flag} ${d.company} · Bütçe: ${fmt(d.budget)} ₺`;
  document.getElementById('ibm-tip').textContent = 'Son: ' + (d.bids.length ? fmt(d.bids.slice(-1)[0].amount) + ' ₺' : 'Henüz yok');
  document.getElementById('ibm-amount').value = ''; openModal('ihale-bid-modal');
}

function submitIhaleBid() {
  if (ihaleState === null) return;
  const d = state.ihaleData[ihaleState]; const amount = parseFloat(document.getElementById('ibm-amount').value);
  if (isNaN(amount) || amount <= 0) { toast('Geçerli teklif girin', 'error'); return; }
  if (amount > d.budget) { toast('Teklifiniz bütçeyi aşıyor!', 'error'); return; }
  const myName = state.user?.name || 'Sen'; const reward = Math.floor(d.qty * amount * .01);
  d.bids.push({ amount, text: `${myName} kazandı. +${fmt(reward)} ₺`, user: myName }); d.won = true;
  state.money += reward; state.xp += 300; checkLevel(); _lastMoney = state.money; _lastCheck = Date.now();
  const lg = document.getElementById('ihale-log-' + ihaleState);
  if (lg) lg.textContent = `🏆 ${myName} kazandı! +${fmt(reward)} ₺`;
  closeModal('ihale-bid-modal'); saveState(); if (fbDb && fbUser) saveFsState(); renderTopbar();
  toast('İhaleyi kazandın! +' + fmt(reward) + ' ₺ 🏆', 'success'); confetti();
}

/* ---- LOJİSTİK ---- */
function openDepoModal() {
  const sel = document.getElementById('depo-city-sel');
  sel.innerHTML = '<option value="">Şehir Seçin...</option>' + CITIES.map(c => `<option value="${c.name}">${c.name}</option>`).join('');
  const capSel = document.getElementById('depo-cap-sel');
  capSel.innerHTML = DEPO_TYPES.map(d => {
    const locked = state.level < d.minLevel;
    return `<option value="${d.id}" ${locked ? 'disabled' : ''}>${locked ? '🔒 ' : d.emoji + ' '}${d.name} — ${d.price > 0 ? fmt(d.price) + ' ₺' : '💎 500'} ${locked ? '(Sv' + d.minLevel + ')' : ''}</option>`;
  }).join('');
  const infoBox = document.getElementById('depo-info-box');
  capSel.onchange = () => {
    const selected = DEPO_TYPES.find(d => d.id === capSel.value);
    if (selected) { infoBox.style.display = 'block'; infoBox.innerHTML = `${selected.emoji} ${selected.name} · ${selected.desc}<br>💰 Maliyet: ${selected.price > 0 ? fmt(selected.price) + ' ₺' : '💎 500 Elmas'}`; }
    else infoBox.style.display = 'none';
  };
  openModal('depo-modal');
}

function confirmDepo() {
  const city = document.getElementById('depo-city-sel').value; const capId = document.getElementById('depo-cap-sel').value;
  if (!city || !capId) { toast('Şehir ve depo tipini seçin', 'error'); return; }
  const tip = DEPO_TYPES.find(d => d.id === capId);
  if (!tip) { toast('Geçersiz seçim', 'error'); return; }
  if (state.level < tip.minLevel) { toast('Seviye ' + tip.minLevel + ' gerekli', 'error'); return; }
  if (tip.id === 'mega') { if ((state.diamonds || 0) < 500) { toast('Yetersiz elmas! 💎 500 gerekli', 'error'); return; } state.diamonds -= 500; }
  else { if (state.money < tip.price) { toast('Yetersiz bakiye! ' + fmt(tip.price) + ' ₺ gerekli', 'error'); return; } state.money -= tip.price; _lastMoney = state.money; _lastCheck = Date.now(); }
  if (!state.depolar) state.depolar = [];
  state.depolar.push({ city, cap: tip.cap, used: 0, tip: tip.name });
  toast(tip.name + ' açıldı! 🏢', 'success'); confetti(); closeModal('depo-modal');
  saveState(); if (fbDb && fbUser) saveFsState(); renderLojistik(); renderTopbar();
}

/* ---- OYUNCU PAZARI ---- */
function addToPazar() {
  const name = document.getElementById('ps-name').value.trim();
  const emoji = document.getElementById('ps-emoji').value.trim() || '🛒';
  const price = parseFloat(document.getElementById('ps-price').value);
  const qty = parseInt(document.getElementById('ps-qty').value);
  const desc = document.getElementById('ps-desc').value.trim();
  if (!name || isNaN(price) || price <= 0 || isNaN(qty) || qty <= 0) { toast('Tüm alanları doldurun', 'error'); return; }
  if (!state.pazarListings) state.pazarListings = [];
  state.pazarListings.unshift({ name, emoji, price, qty, desc, seller: state.user?.name || 'Oyuncu', ts: Date.now() });
  saveState(); closeModal('pazar-sat-modal'); renderPazar(); toast(name + ' pazara eklendi 🛍️', 'success');
}

function buyPazarItem(i) {
  const item = state.pazarListings[i]; if (!item) return;
  if (state.money < item.price) { toast('Yetersiz bakiye! ' + fmt(item.price) + ' ₺ gerekli', 'error'); return; }
  state.money -= item.price; _lastMoney = state.money; _lastCheck = Date.now();
  toast(item.name + ' satın alındı! 🛍️', 'success');
  state.pazarListings.splice(i, 1); saveState(); renderPazar(); renderTopbar();
}

function removePazarItem(i) { state.pazarListings.splice(i, 1); saveState(); renderPazar(); toast('Ürün kaldırıldı', ''); }

/* ---- ÇEKİLİŞ ---- */
function joinLottery() {
  if ((state.coupons || 0) < 1) { toast('Yeterli kupon yok', 'error'); return; }
  if (state.lotteryJoined) { toast('Bu hafta zaten katıldın', 'error'); return; }
  state.coupons--; state.lotteryJoined = true; saveState(); renderAll();
  toast('Çekilişe katıldın 🍀', 'success'); confetti();
}

function updateLotteryTimer() {
  const el = document.getElementById('lottery-timer'); if (!el) return;
  const now = new Date(), end = new Date();
  end.setDate(now.getDate() + (7 - now.getDay()) % 7); end.setHours(23, 59, 59);
  const diff = end - now; if (diff <= 0) { el.textContent = 'Çekiliş yapılıyor...'; return; }
  const d = Math.floor(diff / 86400000), h = Math.floor((diff % 86400000) / 3600000), m = Math.floor((diff % 3600000) / 60000), s = Math.floor((diff % 60000) / 1000);
  el.textContent = `${d}g ${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}
setInterval(updateLotteryTimer, 1000);

/* ---- MARKA ---- */
function joinMarka(name) {
  if (state.myMarka === name) { toast('Zaten bu markasın!', 'error'); return; }
  state.myMarka = name; saveState(); toast(name + ' markasına katıldın 🎉', 'success');
}

/* ---- DESTAN ---- */
function playDestan() {
  const txt = "İki kardeş, bir hayaldi bu oyun. Serkan ile Resul, geceyi gündüze kattı. Her satır kod bir umuttu, her bug bir ders. Türkiye'nin 81 iline açılan kapı, sizin için örüldü.";
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(txt); u.lang = 'tr-TR'; u.rate = .85; u.pitch = 1.1;
    const v = window.speechSynthesis.getVoices(); const tr = v.find(x => x.lang.startsWith('tr'));
    if (tr) u.voice = tr; window.speechSynthesis.speak(u); toast('🎻 Destan okunuyor...', 'success');
  } else toast('TTS desteklenmiyor', 'error');
}

/* ---- INIT ---- */
loadState();
window.addEventListener('beforeunload', saveState);
