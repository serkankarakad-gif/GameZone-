/* ============================================================
   GAME ZONE ERP — economy.js
   Game data constants, state, economic logic & anti-cheat
   ============================================================ */

'use strict';

/* ================================================================
   CONSTANTS — SHOP TYPES
   ================================================================ */
const SHOP_TYPES = [
  { id:'market',    name:'Market',          emoji:'🏪', cat:'market',    price:20000,   income:280,  minLvl:1  },
  { id:'butik',     name:'Butik',           emoji:'👗', cat:'butik',     price:40000,   income:520,  minLvl:1  },
  { id:'elektronik',name:'Elektronik',      emoji:'📱', cat:'elektronik',price:70000,   income:900,  minLvl:2  },
  { id:'mobilya',   name:'Mobilya',         emoji:'🛋️', cat:'mobilya',   price:60000,   income:760,  minLvl:2  },
  { id:'kuyumcu',   name:'Kuyumcu',         emoji:'💍', cat:'kuyumcu',   price:120000,  income:1600, minLvl:3  },
  { id:'beyaz',     name:'Beyaz Eşya',      emoji:'🧊', cat:'beyaz',     price:90000,   income:1180, minLvl:3  },
  { id:'oto',       name:'Otomotiv',        emoji:'🚗', cat:'oto',       price:200000,  income:2600, minLvl:5  },
  { id:'benzin',    name:'Benzin İst.',     emoji:'⛽', cat:'benzin',    price:150000,  income:1950, minLvl:4  },
  { id:'bahce_d',   name:'Bahçe Market',    emoji:'🌿', cat:'bahce',     price:35000,   income:440,  minLvl:1  },
  { id:'ciftlik_d', name:'Çiftlik Ürünleri',emoji:'🥚', cat:'ciftlik',   price:45000,   income:580,  minLvl:2  },
  { id:'fabrika_d', name:'Fabrika Satış',   emoji:'🏭', cat:'fabrika',   price:250000,  income:3200, minLvl:7  },
  { id:'ihracat_d', name:'İhracat',         emoji:'🚢', cat:'maden',     price:500000,  income:6500, minLvl:10 }
];

/* ================================================================
   CONSTANTS — CITIES (81 iller)
   ================================================================ */
const CITIES = [
  {id:'istanbul',  name:'İstanbul',  emoji:'🌉', region:'Marmara',    mult:1.4},
  {id:'ankara',    name:'Ankara',    emoji:'🏛️', region:'İç Anadolu', mult:1.2},
  {id:'izmir',     name:'İzmir',     emoji:'🌊', region:'Ege',        mult:1.2},
  {id:'bursa',     name:'Bursa',     emoji:'🏔️', region:'Marmara',    mult:1.1},
  {id:'antalya',   name:'Antalya',   emoji:'🏖️', region:'Akdeniz',    mult:1.15},
  {id:'adana',     name:'Adana',     emoji:'🌶️', region:'Akdeniz',    mult:1.0},
  {id:'konya',     name:'Konya',     emoji:'🌾', region:'İç Anadolu', mult:1.0},
  {id:'gaziantep', name:'Gaziantep', emoji:'🫙', region:'Güneydoğu',  mult:1.05},
  {id:'mersin',    name:'Mersin',    emoji:'🛳️', region:'Akdeniz',    mult:1.0},
  {id:'kayseri',   name:'Kayseri',   emoji:'🏔️', region:'İç Anadolu', mult:0.95},
  {id:'trabzon',   name:'Trabzon',   emoji:'🫐', region:'Karadeniz',  mult:0.95},
  {id:'samsun',    name:'Samsun',    emoji:'🌿', region:'Karadeniz',  mult:0.9 },
  {id:'erzurum',   name:'Erzurum',   emoji:'❄️', region:'Doğu',       mult:0.85},
  {id:'diyarbakir',name:'Diyarbakır',emoji:'🏯', region:'Güneydoğu',  mult:0.85},
  {id:'eskisehir', name:'Eskişehir', emoji:'🚂', region:'İç Anadolu', mult:0.9 },
  {id:'denizli',   name:'Denizli',   emoji:'🐓', region:'Ege',        mult:0.9 },
  {id:'sakarya',   name:'Sakarya',   emoji:'🏞️', region:'Marmara',    mult:0.9 },
  {id:'tekirdag',  name:'Tekirdağ',  emoji:'🍷', region:'Marmara',    mult:0.9 },
  {id:'bodrum',    name:'Bodrum',    emoji:'⛵', region:'Ege',        mult:1.1 },
  {id:'van',       name:'Van',       emoji:'🦆', region:'Doğu',       mult:0.8 }
];

/* ================================================================
   CONSTANTS — TESIS (bahçe, çiftlik, fabrika, maden)
   ================================================================ */
const BAHCE_TYPES = [
  {id:'zeytin',  name:'Zeytin Bahçesi',  emoji:'🫒', urun:'Zeytin',    unit:'kg', hasat:3600,  yield:120,  price:80000,  minLvl:2,  sellPrice:45 },
  {id:'findik',  name:'Fındık Bahçesi',  emoji:'🌰', urun:'Fındık',    unit:'kg', hasat:5400,  yield:80,   price:120000, minLvl:3,  sellPrice:68 },
  {id:'elma',    name:'Elma Bahçesi',    emoji:'🍎', urun:'Elma',      unit:'kg', hasat:2700,  yield:200,  price:60000,  minLvl:2,  sellPrice:18 },
  {id:'portakal',name:'Portakal Bahçesi',emoji:'🍊', urun:'Portakal',  unit:'kg', hasat:3200,  yield:180,  price:70000,  minLvl:2,  sellPrice:22 },
  {id:'nar',     name:'Nar Bahçesi',     emoji:'🍑', urun:'Nar',       unit:'kg', hasat:4200,  yield:150,  price:90000,  minLvl:3,  sellPrice:30 },
  {id:'baga',    name:'Bağ (Üzüm)',      emoji:'🍇', urun:'Üzüm',      unit:'kg', hasat:6000,  yield:300,  price:100000, minLvl:4,  sellPrice:20 }
];

const CIFTLIK_TYPES = [
  {id:'sut',    name:'Süt Çiftliği',  emoji:'🐄', urun:'Süt',   unit:'lt', hasat:1800, yield:90,  price:150000, minLvl:3, sellPrice:8.5 },
  {id:'yumurta',name:'Yumurta Çiftliği',emoji:'🐔',urun:'Yumurta',unit:'adet',hasat:2400,yield:500,price:100000,minLvl:2,sellPrice:3.5 },
  {id:'bal',    name:'Bal Çiftliği',  emoji:'🐝', urun:'Bal',   unit:'kg', hasat:7200, yield:30,  price:180000, minLvl:5, sellPrice:250 },
  {id:'koyun',  name:'Koyun Çiftliği',emoji:'🐑', urun:'Yün',   unit:'kg', hasat:10800,yield:50,  price:200000, minLvl:6, sellPrice:35  }
];

const FABRIKA_TYPES = [
  {id:'un',     name:'Un Fabrikası',    emoji:'🌾', input:'Buğday', output:'Un',      price:500000,  minLvl:5,  prodRate:40, prodInterval:60  },
  {id:'yag',    name:'Yağ Fabrikası',   emoji:'🫙', input:'Ayçiçek',output:'Yağ',     price:600000,  minLvl:6,  prodRate:25, prodInterval:90  },
  {id:'oto',    name:'Otomobil Fab.',   emoji:'🚗', input:'Çelik',  output:'Araç',    price:5000000, minLvl:15, prodRate:1,  prodInterval:3600},
  {id:'tekstil',name:'Tekstil Fabrikası',emoji:'🧵',input:'Pamuk',  output:'Kumaş',   price:800000,  minLvl:8,  prodRate:60, prodInterval:120 },
  {id:'ambalaj',name:'Ambalaj Fabrikası',emoji:'📦',input:'Kağıt',  output:'Ambalaj', price:300000,  minLvl:4,  prodRate:100,prodInterval:60  }
];

const MADEN_TYPES = [
  {id:'altin',  name:'Altın Madeni',  emoji:'🥇', urun:'Altın',  unit:'gram', hasat:10800, yield:15,  price:1000000, minLvl:8,  sellPrice:1850 },
  {id:'gumus',  name:'Gümüş Madeni', emoji:'🥈', urun:'Gümüş',  unit:'gram', hasat:7200,  yield:40,  price:500000,  minLvl:5,  sellPrice:260  },
  {id:'bakir',  name:'Bakır Madeni', emoji:'🟤', urun:'Bakır',  unit:'kg',   hasat:5400,  yield:80,  price:350000,  minLvl:4,  sellPrice:45   },
  {id:'mermer', name:'Mermer Ocağı', emoji:'🪨', urun:'Mermer', unit:'ton',  hasat:14400, yield:5,   price:400000,  minLvl:6,  sellPrice:820  },
  {id:'linyit', name:'Kömür Madeni', emoji:'⚫', urun:'Kömür',  unit:'ton',  hasat:3600,  yield:20,  price:200000,  minLvl:3,  sellPrice:180  }
];

/* ================================================================
   CONSTANTS — DEPO (warehouse)
   ================================================================ */
const DEPO_TYPES = [
  {id:'kucuk', name:'Küçük Depo', emoji:'📦', cap:5000,   price:500000,  minLevel:1,  desc:'500 ürün kapasitesi'},
  {id:'orta',  name:'Orta Depo',  emoji:'🏪', cap:15000,  price:2000000, minLevel:3,  desc:'2.000 ürün kapasitesi'},
  {id:'buyuk', name:'Büyük Depo', emoji:'🏬', cap:50000,  price:5000000, minLevel:5,  desc:'5.000 ürün kapasitesi'},
  {id:'dev',   name:'Dev Depo',   emoji:'🏭', cap:200000, price:15000000,minLevel:8,  desc:'20.000 ürün kapasitesi'},
  {id:'mega',  name:'Mega Depo',  emoji:'🌐', cap:1000000,price:0,       minLevel:10, desc:'Sınırsız kapasite · 💎 500 elmas'}
];

/* ================================================================
   CONSTANTS — KRIPTO
   ================================================================ */
const KRIPTOLAR = [
  {name:'Vortigon',   sym:'VGN', emoji:'⚡', color:'#6366f1', price:54174,   change:9.86,  dir:'up'  },
  {name:'Neonix',     sym:'NNX', emoji:'🔶', color:'#f59e0b', price:431595,  change:-0.88, dir:'down'},
  {name:'Celestium',  sym:'CLM', emoji:'🌊', color:'#06b6d4', price:61367,   change:1.04,  dir:'up'  },
  {name:'Astrium',    sym:'AST', emoji:'🚀', color:'#f97316', price:616.99,  change:-0.42, dir:'down'},
  {name:'Galactix',   sym:'GLX', emoji:'⭐', color:'#eab308', price:18.89,   change:-1.06, dir:'down'},
  {name:'Novalis',    sym:'NVL', emoji:'✨', color:'#fbbf24', price:8920.5,  change:3.44,  dir:'up'  },
  {name:'Meteorix',   sym:'MTX', emoji:'☄️', color:'#f43f5e', price:1.472,   change:0.63,  dir:'up'  },
  {name:'Luminex',    sym:'LMX', emoji:'💡', color:'#a78bfa', price:94324,   change:0.32,  dir:'up'  }
];

/* ================================================================
   CONSTANTS — REYON PRODUCTS
   ================================================================ */
const REYON_PRODUCTS = {
  'Temel Gıda': [
    {name:'Buğday Unu',   emoji:'🌾', unit:'kg',  basePrice:4.44 },
    {name:'Ayçiçek Yağı', emoji:'🫙', unit:'lt',  basePrice:28.5 },
    {name:'Zeytinyağı',   emoji:'🫒', unit:'lt',  basePrice:85   },
    {name:'Şeker',        emoji:'🍚', unit:'kg',  basePrice:18   },
    {name:'Çay',          emoji:'🍵', unit:'kg',  basePrice:120  }
  ],
  'Kahvaltılık': [
    {name:'Yumurta',      emoji:'🥚', unit:'adet',basePrice:3.5  },
    {name:'Süt',          emoji:'🥛', unit:'lt',  basePrice:8.5  },
    {name:'Zeytin',       emoji:'🫒', unit:'kg',  basePrice:45   },
    {name:'Beyaz Peynir', emoji:'🧀', unit:'kg',  basePrice:120  },
    {name:'Bal',          emoji:'🍯', unit:'kg',  basePrice:250  }
  ],
  'Meyve & Sebze': [
    {name:'Domates',      emoji:'🍅', unit:'kg',  basePrice:12   },
    {name:'Elma',         emoji:'🍎', unit:'kg',  basePrice:18   },
    {name:'Portakal',     emoji:'🍊', unit:'kg',  basePrice:22   },
    {name:'Muz',          emoji:'🍌', unit:'kg',  basePrice:30   },
    {name:'Biber',        emoji:'🫑', unit:'kg',  basePrice:15   }
  ],
  'Et Ürünleri': [
    {name:'Tavuk Göğsü',  emoji:'🍗', unit:'kg',  basePrice:95   },
    {name:'Dana Kıyma',   emoji:'🥩', unit:'kg',  basePrice:280  },
    {name:'Sucuk',        emoji:'🌭', unit:'kg',  basePrice:150  },
    {name:'Pastırma',     emoji:'🥓', unit:'kg',  basePrice:200  }
  ],
  'İçecek': [
    {name:'Su 0.5L',      emoji:'💧', unit:'şişe',basePrice:3    },
    {name:'Cola 1L',      emoji:'🥤', unit:'şişe',basePrice:18   },
    {name:'Meyve Suyu',   emoji:'🍹', unit:'lt',  basePrice:15   },
    {name:'Enerji İçeceği',emoji:'⚡',unit:'kutu',basePrice:25   }
  ],
  'Temizlik': [
    {name:'Deterjan',     emoji:'🧴', unit:'lt',  basePrice:45   },
    {name:'Çamaşır Suyu', emoji:'🫧', unit:'lt',  basePrice:30   },
    {name:'Sabun',        emoji:'🧼', unit:'adet',basePrice:8    }
  ]
};

/* ================================================================
   CONSTANTS — EXPORT
   ================================================================ */
const EXPORT_COUNTRIES = [
  {flag:'🇩🇪', name:'Kaiser/Almanya'  },
  {flag:'🇫🇷', name:'Lumière/Fransa'  },
  {flag:'🇬🇧', name:'Royal/İngiltere' },
  {flag:'🇯🇵', name:'Yamamoto/Japonya'},
  {flag:'🇺🇸', name:'Atlantic/ABD'    },
  {flag:'🇨🇳', name:'Zhonghe/Çin'     },
  {flag:'🇸🇦', name:'Khalid/S.Arabistan'},
  {flag:'🇦🇪', name:'Emirates/BAE'    }
];

const EXPORT_PRODUCTS = [
  {name:'Buğday Unu', unit:'kg',   emoji:'🌾'},
  {name:'Zeytinyağı', unit:'lt',   emoji:'🫙'},
  {name:'Fındık',     unit:'kg',   emoji:'🌰'},
  {name:'Altın',      unit:'gram', emoji:'🥇'},
  {name:'Mermer',     unit:'ton',  emoji:'🪨'},
  {name:'Çelik',      unit:'ton',  emoji:'⚙️'},
  {name:'Tekstil',    unit:'m²',   emoji:'🧵'}
];

/* ================================================================
   CONSTANTS — IHALE
   ================================================================ */
const IHALE_DATA = [
  {flag:'🇩🇪', company:'Kaiser',    product:'Kimyasal', unit:'lt',   qty:701200, budgetBase:4.15,  emoji:'🧪'},
  {flag:'🇫🇷', company:'Lumière',   product:'Polen',    unit:'kg',   qty:13200,  budgetBase:37,    emoji:'🍯'},
  {flag:'🇬🇧', company:'Royal',     product:'Mermer',   unit:'ton',  qty:450,    budgetBase:820,   emoji:'🪨'},
  {flag:'🇺🇸', company:'Atlantic',  product:'Altın',    unit:'gram', qty:500,    budgetBase:1850,  emoji:'🥇'},
  {flag:'🇯🇵', company:'Yamamoto',  product:'Fındık',   unit:'kg',   qty:30000,  budgetBase:18,    emoji:'🌰'}
];

/* ================================================================
   CONSTANTS — MARKALAR (guilds)
   ================================================================ */
const MARKALAR = [
  {name:'Lodos',      emoji:'🐝', rank:1, tp:41142, guc:1.32, uyeler:20, lider:'Berna',        color:'#f59e0b'},
  {name:'PatRiotSS',  emoji:'🌍', rank:2, tp:36173, guc:1.31, uyeler:1,  lider:'NUL',          color:'#6b7280'},
  {name:'PARAMARA',   emoji:'🚀', rank:3, tp:30835, guc:1.29, uyeler:19, lider:'mikailssah',   color:'#6366f1'},
  {name:'ERGENEKON',  emoji:'🐺', rank:4, tp:25729, guc:1.26, uyeler:20, lider:'BOZKURT_TR',   color:'#374151'},
  {name:'ATOMİK',     emoji:'🐰', rank:5, tp:25545, guc:1.26, uyeler:20, lider:'AtomiKarinca', color:'#ef4444'},
  {name:'NOVA',       emoji:'🚀', rank:6, tp:21558, guc:1.24, uyeler:16, lider:'Trump',         color:'#3b82f6'},
  {name:'YAMYAMLAR',  emoji:'🐰', rank:7, tp:17302, guc:1.22, uyeler:4,  lider:'Akin',         color:'#8b5cf6'},
  {name:'RiseNShine', emoji:'🚀', rank:8, tp:16724, guc:1.22, uyeler:18, lider:'Utku_33',      color:'#0ea5e9'},
  {name:'KARTELL',    emoji:'🐂', rank:9, tp:15744, guc:1.21, uyeler:14, lider:'ErayReis',     color:'#374151'},
  {name:'ROTASIZ',    emoji:'⛵', rank:10,tp:15013, guc:1.21, uyeler:3,  lider:'Ruem',         color:'#3b82f6'}
];

/* ================================================================
   CONSTANTS — MOCK PLAYERS (leaderboard)
   ================================================================ */
const MOCK_PLAYERS = [
  {name:'YAKISIKLI',  emoji:'🐱', lvl:132, money:440700000000},
  {name:'Bukubey_52', emoji:'👨‍💼', lvl:130, money:526200000000},
  {name:'Pamela',     emoji:'👸', lvl:122, money:432800000000},
  {name:'kdr',        emoji:'✨', lvl:135, money:381300000000},
  {name:'okan',       emoji:'🇹🇷', lvl:129, money:339400000000},
  {name:'TIRTIL',     emoji:'🌴', lvl:124, money:329300000000},
  {name:'Legend1907', emoji:'⚽', lvl:113, money:308800000000},
  {name:'Gold',       emoji:'🥇', lvl:104, money:271000000000},
  {name:'LEOPAR',     emoji:'🐆', lvl:123, money:260800000000},
  {name:'Atomikjack', emoji:'👯', lvl:124, money:252900000000}
];

/* ================================================================
   CONSTANTS — CHAT SEED
   ================================================================ */
const CHAT_SEED = [
  {user:'htatli46', av:'👨', time:'2 dk', text:'Vgn ucusta'},
  {user:'Aladeen',  av:'🪖', time:'3 dk', text:'brifing işleri var 😂'},
  {user:'ByKeskin', av:'🙂', time:'5 dk', text:'Marka sistemi güzel olmuş'},
  {user:'Utk',      av:'🤴', time:'7 dk', text:'Kripto sistemi açıldı mı?'},
  {user:'Bolero',   av:'🎩', time:'11 dk',text:'İhaleyi kazandım 🏆'}
];

/* ================================================================
   CONSTANTS — FAQ
   ================================================================ */
const FAQ = [
  {q:'Nasıl para kazanırım?',       a:'Dükkan aç → reyon ekle → stok satın al → kazanç topla. Bahçe/Çiftlik/Fabrika/Maden kurarak hasat geliri de elde edebilirsin.'},
  {q:'Stok olmadan satış yapabilir miyim?', a:'HAYIR! Reyon varsa stok sıfırsa kazanç toplanamaz. Önce stok satın al.'},
  {q:'Giriş yaptıktan sonra atılıyorum?',   a:'Bu sorun düzeltildi. DeviceID artık güncellemeden etkilenmez. Oturumun aktif kalır.'},
  {q:'Depo fiyatları neden yüksek?',         a:'Depo seviyelidir. Küçük: 500K₺, Orta: 2M₺, Büyük: 5M₺, Dev: 15M₺, Mega: 500 elmas.'},
  {q:'Level nasıl hızlı çıkarım?',           a:'Kazanç topla, hasat al, ihale kazan, kripto sat. Her işlem XP verir.'},
  {q:'Oyuncu pazarı nedir?',                 a:"Kendi ürünlerini diğer oyunculara satabilirsin. Menü → Oyuncu Pazarı"},
  {q:'Kripto/Enerji ne zaman açılır?',        a:'Kripto: Sv5 · Enerji: Sv8'}
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

window.state = state;

/* ================================================================
   PERSISTENCE
   ================================================================ */
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
      window.state = state;
      _ensureStateDefaults();
    }
  } catch (e) {}
}

function _ensureStateDefaults() {
  if (!state.bank) state.bank = { balance: 0, investment: 0, credit: 0, profit: 0 };
  if (!state.tesisler) state.tesisler = { bahce: [], ciftlik: [], fabrika: [], maden: [] };
  ['bahce', 'ciftlik', 'fabrika', 'maden'].forEach(k => {
    if (!state.tesisler[k]) state.tesisler[k] = [];
  });
  if (!state.depolar) state.depolar = [];
  if (!state.kripto) state.kripto = {};
  if (!state.kriptoHistory) state.kriptoHistory = [];
  if (!state.exportOrders) state.exportOrders = [];
  if (!state.notifications) state.notifications = [];
  if (!state.pazarListings) state.pazarListings = [];
  if (!state.chatHistory) state.chatHistory = [];
}

/* ================================================================
   UTILS
   ================================================================ */
function fmt(n) {
  return new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(n) || 0);
}

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
  if (!t) return;
  t.textContent = msg;
  t.className = 'toast show ' + (type || '');
  setTimeout(() => t.classList.remove('show'), 2800);
}

function confetti() {
  const h = document.getElementById('confetti-host');
  if (!h) return;
  h.style.display = 'block';
  h.innerHTML = '';
  const c = ['#fbbf24', '#6366f1', '#ef4444', '#10b981', '#8b5cf6', '#f472b6', '#34d399'];
  for (let i = 0; i < 60; i++) {
    const s = document.createElement('span');
    s.style.left = Math.random() * 100 + '%';
    s.style.background = c[Math.floor(Math.random() * c.length)];
    s.style.animationDelay = (Math.random() * 0.5) + 's';
    s.style.animationDuration = (2 + Math.random() * 1.5) + 's';
    s.style.transform = `rotate(${Math.random() * 360}deg)`;
    h.appendChild(s);
  }
  setTimeout(() => { h.style.display = 'none'; h.innerHTML = ''; }, 3500);
}

/* ================================================================
   ANTI-CHEAT
   ================================================================ */
let _lastMoney = 20000;
let _lastCheck = Date.now();

function antiCheatTick() {
  const now = Date.now();
  const elapsed = (now - _lastCheck) / 1000;
  const diff = state.money - _lastMoney;
  if (elapsed > 0 && diff / elapsed > 200000 && elapsed < 5 && state.user) {
    if (typeof triggerBan === 'function') {
      triggerBan('Hız hilesi: Saniyede ' + Math.floor(diff / elapsed).toLocaleString() + ' ₺');
    }
    return;
  }
  _lastMoney = state.money;
  _lastCheck = now;
}

setInterval(antiCheatTick, 5000);

/* ================================================================
   LEVEL SYSTEM
   ================================================================ */
function checkLevel() {
  const cap = state.level * 500;
  while (state.xp >= cap) {
    state.xp -= cap;
    state.level++;
    toast('🎉 SEVİYE ' + state.level + '!', 'success');
    confetti();
    addNotification('🎉 Seviye ' + state.level + `'e ulaştınız! Yeni içerikler açıldı.`);
    saveState();
  }
}

/* ================================================================
   NOTIFICATIONS
   ================================================================ */
function addNotification(text, icon = '🔔') {
  if (!state.notifications) state.notifications = [];
  state.notifications.unshift({ id: Date.now(), text, icon, time: 'az önce', read: false });
  if (state.notifications.length > 50) state.notifications.pop();
  const badge = document.getElementById('notif-badge');
  const unread = state.notifications.filter(n => !n.read).length;
  if (badge) { badge.textContent = unread; badge.style.display = unread > 0 ? 'grid' : 'none'; }
}

/* ================================================================
   SHOP INCOME
   ================================================================ */
function collectIncome(i) {
  const s = state.shops[i];
  const t = SHOP_TYPES.find(x => x.id === s.type);
  const reyonlar = s.reyonlar || [];

  if (reyonlar.length > 0) {
    const totalStock = reyonlar.reduce((a, r) => a + (r.stock || 0), 0);
    if (totalStock <= 0) {
      toast('⚠️ Depoda stok yok! Önce 📦 butonuna bas ve stok satın al.', 'error');
      return;
    }
  }

  const last = s.lastCollect || Date.now();
  const hours = Math.min(8, (Date.now() - last) / 3600000);
  if (hours < 0.0167) { toast('Henüz kazanç birikmedi', 'error'); return; }

  const cityMult = CITIES.find(c => c.id === s.cityId)?.mult || 1;
  const earned = Math.floor(t.income * (s.lvl || 1) * hours * cityMult);

  if (reyonlar.length > 0) {
    let kalan = Math.ceil(earned / 100);
    for (const r of reyonlar) {
      const al = Math.min(r.stock || 0, kalan);
      r.stock = (r.stock || 0) - al;
      kalan -= al;
      if (kalan <= 0) break;
    }
  }

  state.money += earned;
  state.xp += Math.floor(earned / 50);
  checkLevel();
  s.lastCollect = Date.now();
  _lastMoney = state.money;
  _lastCheck = Date.now();
  saveState();
  if (typeof saveFsState === 'function' && typeof fbDb !== 'undefined' && fbDb && typeof fbUser !== 'undefined' && fbUser) saveFsState();
  if (typeof renderAll === 'function') renderAll();
  toast('+' + fmt(earned) + ' ₺ kazandın! 💰', 'success');
}

function upgradeShop(i) {
  const s = state.shops[i];
  const t = SHOP_TYPES.find(x => x.id === s.type);
  const cost = Math.floor(t.price * (s.lvl || 1) * 0.5);
  if (state.money < cost) { toast('Yetersiz para! ' + fmt(cost) + ' ₺ gerekli', 'error'); return; }
  state.money -= cost;
  s.lvl = (s.lvl || 1) + 1;
  state.xp += 100;
  checkLevel();
  _lastMoney = state.money;
  _lastCheck = Date.now();
  saveState();
  if (typeof saveFsState === 'function' && window.fbDb && window.fbUser) saveFsState();
  if (typeof renderAll === 'function') renderAll();
  toast('Dükkan Sv' + s.lvl + `'e yükseltildi 🎉`, 'success');
  confetti();
}

function buyShop(typeId, cityId) {
  const t = SHOP_TYPES.find(x => x.id === typeId);
  if (!t) return;
  if (state.level < t.minLvl) { toast('Seviye ' + t.minLvl + ' gerekli!', 'error'); return; }
  if (state.money < t.price) { toast('Yetersiz bakiye! ' + fmt(t.price) + ' ₺ gerekli', 'error'); return; }
  state.money -= t.price;
  state.shops.push({ type: typeId, cityId, lvl: 1, reyonlar: [], lastCollect: Date.now() });
  state.xp += 200;
  checkLevel();
  _lastMoney = state.money;
  _lastCheck = Date.now();
  addNotification('🏪 ' + t.name + ' açıldı!');
  saveState();
  if (typeof saveFsState === 'function' && window.fbDb && window.fbUser) saveFsState();
  if (typeof renderAll === 'function') renderAll();
  toast(t.name + ' açıldı! 🎉', 'success');
  confetti();
  if (typeof closeModal === 'function') closeModal('shop-modal');
}

/* ================================================================
   TESIS (bahçe, çiftlik, fabrika, maden)
   ================================================================ */
function hasat(type, i) {
  const typeMap = { bahce: BAHCE_TYPES, ciftlik: CIFTLIK_TYPES, maden: MADEN_TYPES };
  const types = typeMap[type];
  const items = state.tesisler[type];
  if (!items) return;
  const item = items[i];
  if (!item) return;
  const def = types.find(x => x.id === item.id);
  if (!def) return;
  const last = item.lastHasat || 0;
  const elapsed = (Date.now() - last) / 1000;
  if (elapsed < def.hasat) {
    const rem = Math.ceil(def.hasat - elapsed);
    toast('⏳ ' + fmtTime(rem) + ' kaldı', 'error');
    return;
  }
  const earned = def.yield * def.sellPrice * (item.lvl || 1);
  state.money += earned;
  state.xp += Math.floor(earned / 100);
  checkLevel();
  item.lastHasat = Date.now();
  item.stock = (item.stock || 0) + def.yield;
  _lastMoney = state.money;
  _lastCheck = Date.now();
  saveState();
  if (typeof saveFsState === 'function' && window.fbDb && window.fbUser) saveFsState();
  if (typeof renderAll === 'function') renderAll();
  toast('+' + fmt(earned) + ' ₺ hasat geliri 🌾', 'success');
}

function buyTesis(type, defId) {
  const typeMap = { bahce: BAHCE_TYPES, ciftlik: CIFTLIK_TYPES, fabrika: FABRIKA_TYPES, maden: MADEN_TYPES };
  const def = typeMap[type]?.find(x => x.id === defId);
  if (!def) return;
  if (state.level < def.minLvl) { toast('Seviye ' + def.minLvl + ' gerekli!', 'error'); return; }
  if (state.money < def.price) { toast('Yetersiz bakiye! ' + fmt(def.price) + ' ₺ gerekli', 'error'); return; }
  state.money -= def.price;
  const newItem = { id: defId, lvl: 1, lastHasat: 0, stock: 0 };
  if (type === 'fabrika') { newItem.depo = 0; newItem.lastProd = 0; }
  state.tesisler[type].push(newItem);
  state.xp += 300;
  checkLevel();
  _lastMoney = state.money;
  _lastCheck = Date.now();
  addNotification(def.emoji + ' ' + def.name + ' kuruldu!');
  saveState();
  if (typeof saveFsState === 'function' && window.fbDb && window.fbUser) saveFsState();
  if (typeof renderAll === 'function') renderAll();
  toast(def.name + ' kuruldu! 🎉', 'success');
  confetti();
  if (typeof closeModal === 'function') closeModal('tesis-modal');
}

function upgradeTesis(type, i) {
  const typeMap = { bahce: BAHCE_TYPES, ciftlik: CIFTLIK_TYPES, fabrika: FABRIKA_TYPES, maden: MADEN_TYPES };
  const items = state.tesisler[type];
  const item = items[i];
  const def = typeMap[type]?.find(x => x.id === item.id);
  if (!def) return;
  const cost = Math.floor(def.price * (item.lvl || 1) * 0.4);
  if (state.money < cost) { toast('Yetersiz para! ' + fmt(cost) + ' ₺ gerekli', 'error'); return; }
  state.money -= cost;
  item.lvl = (item.lvl || 1) + 1;
  state.xp += 150;
  checkLevel();
  _lastMoney = state.money;
  _lastCheck = Date.now();
  saveState();
  if (typeof saveFsState === 'function' && window.fbDb && window.fbUser) saveFsState();
  if (typeof renderAll === 'function') renderAll();
  toast(def.name + ' Sv' + item.lvl + `'e yükseltildi 🎉`, 'success');
}

/* ================================================================
   DEPO
   ================================================================ */
function confirmDepo(city, capId) {
  if (!city || !capId) { toast('Şehir ve depo tipini seçin', 'error'); return; }
  const tip = DEPO_TYPES.find(d => d.id === capId);
  if (!tip) { toast('Geçersiz seçim', 'error'); return; }
  if (state.level < tip.minLevel) { toast('Seviye ' + tip.minLevel + ' gerekli', 'error'); return; }
  if (tip.id === 'mega') {
    if ((state.diamonds || 0) < 500) { toast('Yetersiz elmas! 💎 500 gerekli', 'error'); return; }
    state.diamonds -= 500;
  } else {
    if (state.money < tip.price) { toast('Yetersiz bakiye! ' + fmt(tip.price) + ' ₺ gerekli', 'error'); return; }
    state.money -= tip.price;
    _lastMoney = state.money;
    _lastCheck = Date.now();
  }
  if (!state.depolar) state.depolar = [];
  state.depolar.push({ city, cap: tip.cap, used: 0, tip: tip.name });
  toast(tip.name + ' açıldı! 🏢', 'success');
  confetti();
  if (typeof closeModal === 'function') closeModal('depo-modal');
  saveState();
  if (typeof saveFsState === 'function' && window.fbDb && window.fbUser) saveFsState();
  if (typeof renderAll === 'function') renderAll();
}

/* ================================================================
   IHRACAT
   ================================================================ */
function generateExportOrders() {
  if (!state.exportOrders || state.exportOrders.length < 15 || Date.now() - (state.exportLastGen || 0) > 900000) {
    state.exportOrders = [];
    for (let i = 0; i < 15; i++) {
      const c = EXPORT_COUNTRIES[Math.floor(Math.random() * EXPORT_COUNTRIES.length)];
      const p = EXPORT_PRODUCTS[Math.floor(Math.random() * EXPORT_PRODUCTS.length)];
      const qty = Math.floor(Math.random() * 4000000 + 100000);
      state.exportOrders.push({
        country: c, product: p, qty,
        price: parseFloat((Math.random() * 50 + 3).toFixed(2)),
        sent: Math.floor(Math.random() * qty * 0.4),
        minQty: Math.floor(Math.random() * 9000 + 1000),
        id: Date.now() + i
      });
    }
    state.exportLastGen = Date.now();
  }
}

function shipExport(i) {
  const o = state.exportOrders[i];
  if (!(state.depolar || []).length) { toast('Önce depo açın!', 'error'); return; }
  const earned = Math.floor(o.minQty * o.price);
  state.money += earned;
  state.xp += Math.floor(earned / 200);
  checkLevel();
  o.sent = Math.min(o.sent + o.minQty, o.qty);
  o.price = parseFloat((o.price * (0.92 + Math.random() * 0.18)).toFixed(2));
  _lastMoney = state.money;
  _lastCheck = Date.now();
  saveState();
  if (typeof saveFsState === 'function' && window.fbDb && window.fbUser) saveFsState();
  if (typeof renderAll === 'function') renderAll();
  toast('+' + fmt(earned) + ' ₺ ihracat geliri 🚢', 'success');
}

/* Fluctuate export prices every 2 min */
setInterval(() => {
  if (state.exportOrders) {
    state.exportOrders.forEach(o => {
      o.price = parseFloat((o.price * (0.95 + Math.random() * 0.12)).toFixed(2));
    });
  }
}, 120000);

/* ================================================================
   BANKA
   ================================================================ */
const BANKA_RATES = [
  { days: 10, rate: 0.15, label: '10 Gün', emoji: '🏦' },
  { days: 20, rate: 0.28, label: '20 Gün', emoji: '💰' },
  { days: 30, rate: 0.45, label: '30 Gün', emoji: '📈' },
  { days: 60, rate: 0.90, label: '60 Gün', emoji: '💎' },
  { days: 365,rate: 2.00, label: '1 Yıl',  emoji: '🚀' }
];

function doDeposit(rateIdx, amount) {
  if (!amount || isNaN(amount) || amount <= 0) { toast('Geçerli miktar girin', 'error'); return; }
  if (state.money < amount) { toast('Yetersiz bakiye', 'error'); return; }
  const r = BANKA_RATES[rateIdx];
  if (!r) return;
  state.money -= amount;
  if (!state.bank.deposits) state.bank.deposits = [];
  state.bank.deposits.push({ amount, rate: r.rate, days: r.days, ts: Date.now(), maturity: Date.now() + r.days * 86400000 });
  state.bank.investment = (state.bank.investment || 0) + amount;
  _lastMoney = state.money;
  _lastCheck = Date.now();
  saveState();
  if (typeof renderAll === 'function') renderAll();
  toast(fmt(amount) + ' ₺ yatırıldı! 🏦', 'success');
  if (typeof closeModal === 'function') closeModal('bank-deposit-modal');
}

function checkDeposits() {
  if (!state.bank?.deposits) return;
  const now = Date.now();
  let changed = false;
  state.bank.deposits = state.bank.deposits.filter(d => {
    if (now >= d.maturity) {
      const profit = Math.floor(d.amount * d.rate);
      state.money += d.amount + profit;
      state.bank.profit = (state.bank.profit || 0) + profit;
      state.bank.investment = Math.max(0, (state.bank.investment || 0) - d.amount);
      _lastMoney = state.money;
      _lastCheck = Date.now();
      addNotification('🏦 Vade sona erdi! +' + fmt(d.amount + profit) + ' ₺ hesabınıza aktarıldı.');
      toast('+' + fmt(d.amount + profit) + ' ₺ vade geliri! 🏦', 'success');
      changed = true;
      return false;
    }
    return true;
  });
  if (changed) { saveState(); if (typeof renderAll === 'function') renderAll(); }
}

setInterval(checkDeposits, 60000);

/* ================================================================
   KRİPTO
   ================================================================ */
function buyKripto(sym, amount) {
  const k = KRIPTOLAR.find(x => x.sym === sym);
  if (!k) return;
  if (state.level < 5) { toast('Kripto için Seviye 5 gerekli!', 'error'); return; }
  const cost = k.price * amount;
  if (state.money < cost) { toast('Yetersiz bakiye', 'error'); return; }
  state.money -= cost;
  if (!state.kripto[sym]) state.kripto[sym] = { qty: 0, avgPrice: 0 };
  const prev = state.kripto[sym];
  prev.avgPrice = (prev.avgPrice * prev.qty + k.price * amount) / (prev.qty + amount);
  prev.qty += amount;
  _lastMoney = state.money;
  _lastCheck = Date.now();
  saveState();
  if (typeof renderAll === 'function') renderAll();
  toast(amount + ' ' + sym + ' satın alındı 📈', 'success');
}

function sellKripto(sym, amount) {
  const k = KRIPTOLAR.find(x => x.sym === sym);
  if (!k || !state.kripto[sym] || state.kripto[sym].qty < amount) { toast('Yetersiz kripto', 'error'); return; }
  const earned = k.price * amount;
  state.money += earned;
  state.kripto[sym].qty -= amount;
  state.xp += Math.floor(earned / 500);
  checkLevel();
  _lastMoney = state.money;
  _lastCheck = Date.now();
  saveState();
  if (typeof saveFsState === 'function' && window.fbDb && window.fbUser) saveFsState();
  if (typeof renderAll === 'function') renderAll();
  toast('+' + fmt(earned) + ' ₺ kripto satışı 📉', 'success');
}

/* Fluctuate crypto prices every 30s */
setInterval(() => {
  KRIPTOLAR.forEach(k => {
    const change = (Math.random() - 0.48) * k.price * 0.03;
    k.price = Math.max(0.001, parseFloat((k.price + change).toFixed(k.price < 10 ? 4 : 2)));
    k.change = parseFloat((change / k.price * 100).toFixed(2));
    k.dir = change >= 0 ? 'up' : 'down';
  });
}, 30000);

/* ================================================================
   MARKA (guilds)
   ================================================================ */
function joinMarka(name) {
  if (state.myMarka === name) { toast('Zaten bu markasın!', 'error'); return; }
  state.myMarka = name;
  saveState();
  toast(name + ' markasına katıldın 🎉', 'success');
}

/* ================================================================
   OYUNCU PAZARI
   ================================================================ */
function addPazarListing(item, price, qty) {
  if (!item || !price || !qty) { toast('Tüm alanları doldurun', 'error'); return; }
  if (!state.pazarListings) state.pazarListings = [];
  state.pazarListings.push({ item, price: parseFloat(price), qty: parseInt(qty), seller: state.user?.name || 'Sen', ts: Date.now() });
  saveState();
  if (typeof renderAll === 'function') renderAll();
  toast('Ürün pazara eklendi! 🛒', 'success');
  if (typeof closeModal === 'function') closeModal('pazar-add-modal');
}

function buyFromPazar(i) {
  const listing = state.pazarListings[i];
  if (!listing) return;
  const cost = listing.price * listing.qty;
  if (state.money < cost) { toast('Yetersiz bakiye', 'error'); return; }
  state.money -= cost;
  state.pazarListings.splice(i, 1);
  state.xp += 50;
  _lastMoney = state.money;
  _lastCheck = Date.now();
  saveState();
  if (typeof renderAll === 'function') renderAll();
  toast('Satın alındı! 🛒', 'success');
}

/* ================================================================
   DESTAN (text-to-speech)
   ================================================================ */
function playDestan() {
  const txt = 'İki kardeş, bir hayaldi bu oyun. Serkan ile Resul, geceyi gündüze kattı. Her satır kod bir umuttu, her bug bir ders. Türkiye\'nin 81 iline açılan kapı, sizin için örüldü.';
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(txt);
    u.lang = 'tr-TR'; u.rate = 0.85; u.pitch = 1.1;
    const v = window.speechSynthesis.getVoices();
    const tr = v.find(x => x.lang.startsWith('tr'));
    if (tr) u.voice = tr;
    window.speechSynthesis.speak(u);
    toast('🎻 Destan okunuyor...', 'success');
  } else {
    toast('TTS desteklenmiyor', 'error');
  }
}

/* ================================================================
   EXPOSE GLOBALS
   ================================================================ */
window.state = state;
window.saveState = saveState;
window.loadState = loadState;
window.fmt = fmt;
window.fmtShort = fmtShort;
window.fmtTime = fmtTime;
window.toast = toast;
window.confetti = confetti;
window.checkLevel = checkLevel;
window.addNotification = addNotification;
window.collectIncome = collectIncome;
window.upgradeShop = upgradeShop;
window.buyShop = buyShop;
window.hasat = hasat;
window.buyTesis = buyTesis;
window.upgradeTesis = upgradeTesis;
window.confirmDepo = confirmDepo;
window.generateExportOrders = generateExportOrders;
window.shipExport = shipExport;
window.doDeposit = doDeposit;
window.buyKripto = buyKripto;
window.sellKripto = sellKripto;
window.joinMarka = joinMarka;
window.addPazarListing = addPazarListing;
window.buyFromPazar = buyFromPazar;
window.playDestan = playDestan;
window.SHOP_TYPES = SHOP_TYPES;
window.CITIES = CITIES;
window.BAHCE_TYPES = BAHCE_TYPES;
window.CIFTLIK_TYPES = CIFTLIK_TYPES;
window.FABRIKA_TYPES = FABRIKA_TYPES;
window.MADEN_TYPES = MADEN_TYPES;
window.DEPO_TYPES = DEPO_TYPES;
window.KRIPTOLAR = KRIPTOLAR;
window.REYON_PRODUCTS = REYON_PRODUCTS;
window.EXPORT_COUNTRIES = EXPORT_COUNTRIES;
window.EXPORT_PRODUCTS = EXPORT_PRODUCTS;
window.IHALE_DATA = IHALE_DATA;
window.MARKALAR = MARKALAR;
window.MOCK_PLAYERS = MOCK_PLAYERS;
window.CHAT_SEED = CHAT_SEED;
window.FAQ = FAQ;
window.BANKA_RATES = BANKA_RATES;
window._lastMoney = _lastMoney;
window._lastCheck = _lastCheck;
