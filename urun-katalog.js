/* ==========================================================================
   urun-katalog.js — DÜKKAN-KATEGORİ EŞLEŞMESİ + GENİŞLETİLMİŞ ÜRÜN KATALOĞU
   ─────────────────────────────────────────────────────────────────────────
   PROBLEM: Önceden her dükkana her ürün konabiliyordu (markette et, vs.)
   ÇÖZÜM: Her dükkan TÜRÜ sadece kendi kategorisindeki ürünleri satabilir.
   ─────────────────────────────────────────────────────────────────────────
   Dükkan tipleri:
   ▸ market         (Lv 1)  → temel gıda + kahvaltı + kuru bakliyat
   ▸ manav          (Lv 1)  → meyve + sebze
   ▸ kasap          (Lv 3)  → et ürünleri
   ▸ firin          (Lv 2)  → ekmek, pasta, fırın ürünleri
   ▸ sutcu          (Lv 2)  → süt, peynir, yumurta, bal
   ▸ tuhafiye       (Lv 5)  → tekstil (yün, kumaş, eldiven)
   ▸ elektronik     (Lv 5)  → TV, telefon, laptop...
   ▸ beyazesya      (Lv 8)  → buzdolabı, çamaşır makinesi...
   ▸ mobilya        (Lv 8)  → koltuk, masa, dolap...
   ▸ kuyumcu        (Lv 12) → altın takı, gümüş, mücevher
   ▸ otomotiv       (Lv 15) → oto-parça, lastik, yağ
   ▸ benzin         (Lv 12) → akaryakıt, motor yağı
   ▸ yapi_market    (Lv 8)  → çimento, demir, hırdavat
   ▸ eczane         (Lv 6)  → ilaç, kozmetik
   ========================================================================== */

(function () {
  if (!window.URUNLER) { console.warn('URUNLER yok, ekonomi.js yüklenmemiş'); return; }

  /* ══════════════════════════════════════════════════════════════════════
     YENİ ÜRÜNLER — Mevcut URUNLER objesine ekleniyor
     ══════════════════════════════════════════════════════════════════════ */

  const YENI_URUNLER = {
    /* ─── MANAV (sebze) ─── */
    salatalik:        { name:"Salatalık",        emo:"🥒", base:7.50,  cat:"sebze",   unit:"Kilo",  lv:1 },
    biber:            { name:"Yeşil Biber",      emo:"🫑", base:18.0,  cat:"sebze",   unit:"Kilo",  lv:1 },
    marul:            { name:"Marul",            emo:"🥬", base:12.0,  cat:"sebze",   unit:"Adet",  lv:1 },
    havuc:            { name:"Havuç",            emo:"🥕", base:9.50,  cat:"sebze",   unit:"Kilo",  lv:1 },
    karpuz:            { name:"Karpuz",          emo:"🍉", base:11.0,  cat:"sebze",   unit:"Kilo",  lv:2 },
    portakal:         { name:"Portakal",         emo:"🍊", base:13.5,  cat:"sebze",   unit:"Kilo",  lv:2 },
    muz:              { name:"Muz",              emo:"🍌", base:32.0,  cat:"sebze",   unit:"Kilo",  lv:3 },
    cilek:            { name:"Çilek",            emo:"🍓", base:35.0,  cat:"sebze",   unit:"Kilo",  lv:3 },

    /* ─── KASAP (et ürünleri) ─── */
    kiyma:            { name:"Kıyma",            emo:"🥩", base:240.0, cat:"et",      unit:"Kilo",  lv:3 },
    kanat:            { name:"Tavuk Kanat",      emo:"🍗", base:55.0,  cat:"et",      unit:"Kilo",  lv:3 },
    sucuk:            { name:"Sucuk",            emo:"🌭", base:280.0, cat:"et",      unit:"Kilo",  lv:5 },
    salam:            { name:"Salam",            emo:"🥓", base:150.0, cat:"et",      unit:"Kilo",  lv:4 },
    pasturma:         { name:"Pastırma",         emo:"🥩", base:520.0, cat:"et",      unit:"Kilo",  lv:7 },
    balik_levrek:     { name:"Levrek",           emo:"🐟", base:180.0, cat:"et",      unit:"Kilo",  lv:5 },

    /* ─── FIRIN (ek) ─── */
    simit:            { name:"Simit",            emo:"🥯", base:8.00,  cat:"firin",   unit:"Adet",  lv:2 },
    pogaca:           { name:"Poğaça",           emo:"🥐", base:10.0,  cat:"firin",   unit:"Adet",  lv:2 },
    kek:              { name:"Kek",              emo:"🧁", base:35.0,  cat:"firin",   unit:"Adet",  lv:3 },
    boregek:          { name:"Börek",            emo:"🥧", base:65.0,  cat:"firin",   unit:"Adet",  lv:4 },
    kurabiye:         { name:"Kurabiye",         emo:"🍪", base:42.0,  cat:"firin",   unit:"Kilo",  lv:3 },

    /* ─── ELEKTRONİK ─── */
    el_telefon_basit: { name:"Tuşlu Telefon",    emo:"📞", base:850.0,  cat:"elektronik", unit:"Adet", lv:5 },
    el_telefon_akilli:{ name:"Akıllı Telefon",   emo:"📱", base:18500.0,cat:"elektronik", unit:"Adet", lv:8 },
    el_tablet:        { name:"Tablet",           emo:"📲", base:9500.0, cat:"elektronik", unit:"Adet", lv:7 },
    el_laptop:        { name:"Laptop",           emo:"💻", base:32000.0,cat:"elektronik", unit:"Adet", lv:10 },
    el_tv_lcd:        { name:"LCD TV 43''",      emo:"📺", base:14500.0,cat:"elektronik", unit:"Adet", lv:8 },
    el_tv_oled:       { name:"OLED TV 65''",     emo:"📺", base:48000.0,cat:"elektronik", unit:"Adet", lv:14 },
    el_kulaklik:      { name:"Kulaklık",         emo:"🎧", base:680.0,  cat:"elektronik", unit:"Adet", lv:5 },
    el_oyun_konsol:   { name:"Oyun Konsolu",     emo:"🎮", base:24500.0,cat:"elektronik", unit:"Adet", lv:12 },
    el_kamera:        { name:"Fotoğraf Makinesi",emo:"📷", base:12500.0,cat:"elektronik", unit:"Adet", lv:9 },
    el_powerbank:     { name:"Powerbank",        emo:"🔋", base:380.0,  cat:"elektronik", unit:"Adet", lv:5 },

    /* ─── BEYAZ EŞYA ─── */
    be_buzdolabi:     { name:"Buzdolabı",        emo:"🧊", base:18500.0,cat:"beyazesya",  unit:"Adet", lv:10 },
    be_camasir:       { name:"Çamaşır Makinesi", emo:"🌀", base:14500.0,cat:"beyazesya",  unit:"Adet", lv:10 },
    be_bulasik:       { name:"Bulaşık Makinesi", emo:"🍽️", base:13500.0,cat:"beyazesya",  unit:"Adet", lv:10 },
    be_firin:         { name:"Ankastre Fırın",   emo:"♨️", base:11500.0,cat:"beyazesya",  unit:"Adet", lv:10 },
    be_klima:         { name:"Klima",            emo:"❄️", base:9500.0, cat:"beyazesya",  unit:"Adet", lv:10 },
    be_supurge:       { name:"Elektrik Süpürgesi",emo:"🧹", base:2800.0, cat:"beyazesya",  unit:"Adet", lv:10 },

    /* ─── MOBİLYA ─── */
    mb_koltuk:        { name:"Koltuk Takımı",    emo:"🛋️", base:24500.0,cat:"mobilya",  unit:"Set",  lv:8 },
    mb_yatak:         { name:"Yatak",            emo:"🛏️", base:8500.0, cat:"mobilya",  unit:"Adet", lv:8 },
    mb_masa:          { name:"Yemek Masası",     emo:"🪑", base:4500.0, cat:"mobilya",  unit:"Adet", lv:8 },
    mb_sandalye:      { name:"Sandalye",         emo:"🪑", base:680.0,  cat:"mobilya",  unit:"Adet", lv:8 },
    mb_dolap:         { name:"Gardırop",         emo:"🚪", base:9500.0, cat:"mobilya",  unit:"Adet", lv:9 },
    mb_kitaplik:      { name:"Kitaplık",         emo:"📚", base:3200.0, cat:"mobilya",  unit:"Adet", lv:8 },
    mb_hali:          { name:"Halı",             emo:"🪀", base:5500.0, cat:"mobilya",  unit:"Adet", lv:9 },

    /* ─── KUYUMCU (mevcut maden + takı) ─── */
    ku_alyans:        { name:"Alyans",           emo:"💍", base:18500.0,cat:"kuyumcu",  unit:"Çift", lv:12 },
    ku_kolye:         { name:"Altın Kolye",      emo:"📿", base:32500.0,cat:"kuyumcu",  unit:"Adet", lv:12 },
    ku_kupe:          { name:"Altın Küpe",       emo:"💎", base:15500.0,cat:"kuyumcu",  unit:"Çift", lv:12 },
    ku_bilezik:       { name:"Bilezik",          emo:"🔗", base:22500.0,cat:"kuyumcu",  unit:"Adet", lv:13 },
    ku_pirlanta:      { name:"Pırlanta Yüzük",   emo:"💎", base:85000.0,cat:"kuyumcu",  unit:"Adet", lv:18 },

    /* ─── OTOMOTİV ─── */
    ot_lastik:        { name:"Lastik",           emo:"🛞", base:3200.0, cat:"otomotiv", unit:"Adet", lv:15 },
    ot_motor_yagi:    { name:"Motor Yağı",       emo:"🛢️", base:850.0,  cat:"otomotiv", unit:"Litre",lv:15 },
    ot_far:           { name:"Far",              emo:"🚗", base:1850.0, cat:"otomotiv", unit:"Adet", lv:15 },
    ot_akü:           { name:"Akü",              emo:"🔋", base:4500.0, cat:"otomotiv", unit:"Adet", lv:15 },
    ot_silecek:       { name:"Silecek",          emo:"🌧️", base:280.0,  cat:"otomotiv", unit:"Çift", lv:15 },
    ot_jant:          { name:"Jant",             emo:"⚙️", base:5500.0, cat:"otomotiv", unit:"Adet", lv:16 },

    /* ─── BENZİN İSTASYONU ─── */
    bn_benzin:        { name:"Benzin",           emo:"⛽", base:42.50,  cat:"akaryakit",unit:"Litre",lv:12 },
    bn_motorin:       { name:"Motorin",          emo:"⛽", base:46.20,  cat:"akaryakit",unit:"Litre",lv:12 },
    bn_lpg:           { name:"LPG",              emo:"🔥", base:24.80,  cat:"akaryakit",unit:"Litre",lv:12 },
    bn_adblue:        { name:"AdBlue",           emo:"💧", base:38.00,  cat:"akaryakit",unit:"Litre",lv:12 },

    /* ─── YAPI MARKETİ ─── */
    ym_civi:          { name:"Çivi",             emo:"📍", base:25.00,  cat:"yapi",    unit:"Kilo", lv:8 },
    ym_vida:          { name:"Vida",             emo:"🔩", base:35.00,  cat:"yapi",    unit:"Kilo", lv:8 },
    ym_boya:          { name:"Plastik Boya",     emo:"🎨", base:480.0,  cat:"yapi",    unit:"Litre",lv:8 },
    ym_seramik:       { name:"Seramik",          emo:"🧱", base:185.0,  cat:"yapi",    unit:"m²",   lv:8 },
    ym_alci:          { name:"Alçı",             emo:"⬜", base:42.00,  cat:"yapi",    unit:"Kilo", lv:8 },
    ym_kablo:         { name:"Kablo",            emo:"🔌", base:18.00,  cat:"yapi",    unit:"Metre",lv:8 },

    /* ─── ECZANE ─── */
    ec_agrikesici:    { name:"Ağrı Kesici",      emo:"💊", base:48.00,  cat:"eczane",  unit:"Kutu", lv:6 },
    ec_vitamin:       { name:"Multivitamin",     emo:"💊", base:185.0,  cat:"eczane",  unit:"Kutu", lv:6 },
    ec_band:          { name:"Yara Bandı",       emo:"🩹", base:28.00,  cat:"eczane",  unit:"Kutu", lv:6 },
    ec_termometre:    { name:"Termometre",       emo:"🌡️", base:120.0,  cat:"eczane",  unit:"Adet", lv:6 },
    ec_sampuan:       { name:"Şampuan",          emo:"🧴", base:85.00,  cat:"eczane",  unit:"Adet", lv:6 },
    ec_dis_macunu:    { name:"Diş Macunu",       emo:"🪥", base:42.00,  cat:"eczane",  unit:"Adet", lv:6 },
    ec_makyaj:        { name:"Ruj",              emo:"💄", base:225.0,  cat:"eczane",  unit:"Adet", lv:7 },
  };

  // Mevcut URUNLER objesine ekle
  Object.assign(window.URUNLER, YENI_URUNLER);

  /* ══════════════════════════════════════════════════════════════════════
     KATEGORI → İSİM HARİTASI (UI için)
     ══════════════════════════════════════════════════════════════════════ */
  const NEW_KAT = {
    sebze:      "Meyve & Sebze",
    elektronik: "Elektronik",
    beyazesya:  "Beyaz Eşya",
    mobilya:    "Mobilya",
    kuyumcu:    "Kuyumcu / Takı",
    otomotiv:   "Oto-Parça",
    akaryakit:  "Akaryakıt",
    yapi:       "Yapı / Hırdavat",
    eczane:     "Eczane / Kozmetik",
  };
  if (window.URUN_KATEGORI) Object.assign(window.URUN_KATEGORI, NEW_KAT);
  window.URUN_KATEGORI_TUM = Object.assign({
    temel: "Temel Gıda",
    kahvalti: "Kahvaltılık & Süt",
    meyve: "Meyve & Sebze (eski)",
    et: "Et Ürünleri",
    firin: "Fırın",
    sanayi: "Tekstil / Sanayi",
    maden: "Madenler"
  }, NEW_KAT);

  /* ══════════════════════════════════════════════════════════════════════
     DÜKKAN TÜRÜ → İZİN VERİLEN ÜRÜN KATEGORİLERİ
     ══════════════════════════════════════════════════════════════════════ */

  const SHOP_CATALOG = {
    // (icon, isim, açılış-seviyesi, açılış-maliyeti, izin verilen kategoriler)
    market:     { icon:'🏪', name:'Market / Bakkal',      lv:1,  cost:5000,    cats:['temel', 'kahvalti'] },
    manav:      { icon:'🥬', name:'Manav (Meyve-Sebze)',  lv:1,  cost:4500,    cats:['meyve', 'sebze'] },
    kasap:      { icon:'🥩', name:'Kasap',                lv:3,  cost:8500,    cats:['et'] },
    firin:      { icon:'🥖', name:'Fırın / Pastane',      lv:2,  cost:6500,    cats:['firin'] },
    sutcu:      { icon:'🥛', name:'Sütçü / Mandıra',      lv:2,  cost:6000,    cats:['kahvalti'] },
    tuhafiye:   { icon:'🧵', name:'Tuhafiye / Manifatura',lv:5,  cost:12000,   cats:['sanayi'] },
    elektronik: { icon:'📱', name:'Elektronik Mağaza',    lv:5,  cost:25000,   cats:['elektronik'] },
    beyazesya:  { icon:'🧊', name:'Beyaz Eşya',           lv:8,  cost:55000,   cats:['beyazesya'] },
    mobilya:    { icon:'🛋️', name:'Mobilyacı',            lv:8,  cost:65000,   cats:['mobilya'] },
    kuyumcu:    { icon:'💍', name:'Kuyumcu',              lv:12, cost:120000,  cats:['kuyumcu','maden'] },
    otomotiv:   { icon:'🛞', name:'Oto-Yedek Parça',      lv:15, cost:95000,   cats:['otomotiv'] },
    benzin:     { icon:'⛽', name:'Akaryakıt İstasyonu',  lv:12, cost:180000,  cats:['akaryakit'] },
    yapi_market:{ icon:'🧱', name:'Yapı Marketi',         lv:8,  cost:48000,   cats:['yapi'] },
    eczane:     { icon:'💊', name:'Eczane / Kozmetik',    lv:6,  cost:32000,   cats:['eczane'] },
  };
  window.SHOP_CATALOG = SHOP_CATALOG;

  /* ══════════════════════════════════════════════════════════════════════
     YARDIMCI: Bu dükkan tipi şu ürünü satabilir mi?
     ══════════════════════════════════════════════════════════════════════ */

  window.canSellInShop = function (shopType, itemKey) {
    const def = SHOP_CATALOG[shopType];
    const item = window.URUNLER[itemKey];
    if (!def || !item) return false;
    return def.cats.includes(item.cat);
  };

  // Dükkan tipinin satabileceği tüm ürünleri listele
  window.getAllowedItems = function (shopType) {
    const def = SHOP_CATALOG[shopType];
    if (!def) return [];
    return Object.entries(window.URUNLER)
      .filter(([k, v]) => def.cats.includes(v.cat))
      .map(([k, v]) => Object.assign({ key: k }, v));
  };

  /* ══════════════════════════════════════════════════════════════════════
     ESKİ FONKSİYONLARI OVERRIDE ET
     ══════════════════════════════════════════════════════════════════════ */

  /* ─── buyShop: yeni dükkan tipleri + maliyet/seviye SHOP_CATALOG'tan ─── */
  const _origBuyShop = window.buyShop;
  window.buyShop = async function (type, city) {
    const def = SHOP_CATALOG[type];
    if (!def) return toast('Geçersiz dükkan türü', 'error');
    const lv = GZ.data?.level || 1;
    if (lv < def.lv) return toast(`${def.lv}. seviyede açılır`, 'warn');
    const ok = await spendCash(GZ.uid, def.cost, 'buy-shop');
    if (!ok) return toast(`Yetersiz bakiye (${cashFmt(def.cost)})`, 'error');
    const id = 'sh_' + Math.random().toString(36).slice(2, 8);
    await dbSet(`businesses/${GZ.uid}/shops/${id}`, {
      id, type, city, level: 1, employees: 1, createdAt: now(), shelves: {}
    });
    toast(`${def.icon} ${def.name} açıldı! (${city})`, 'success', 4000);
  };

  /* ─── addShelf: dükkan tipine uygun ürünü kontrol et ─── */
  const _origAddShelf = window.addShelf;
  window.addShelf = async function (shopId, itemKey) {
    const item = window.URUNLER[itemKey];
    if (!item) return toast('Geçersiz ürün', 'error');

    // Dükkan türünü çek
    const shop = await dbGet(`businesses/${GZ.uid}/shops/${shopId}`);
    if (!shop) return toast('Dükkan bulunamadı', 'error');
    const def = SHOP_CATALOG[shop.type];
    if (!def) return toast('Bilinmeyen dükkan türü', 'error');

    // ⛔ KATEGORİ KONTROLÜ
    if (!def.cats.includes(item.cat)) {
      const allowed = def.cats.map(c => window.URUN_KATEGORI_TUM[c] || c).join(', ');
      return toast(`❌ ${item.name} burada satılmaz! ${def.name} sadece şunları satabilir: ${allowed}`, 'error', 5000);
    }

    if ((GZ.data?.level || 1) < item.lv) return toast(`${item.lv}. seviyede açılır`, 'warn');
    const exist = await dbGet(`businesses/${GZ.uid}/shops/${shopId}/shelves/${itemKey}`);
    if (exist) return toast('Bu reyon zaten var', 'warn');

    const cost = 500;
    const ok = await spendCash(GZ.uid, cost, 'add-shelf');
    if (!ok) return toast(`Reyon kurulum: ${cashFmt(cost)} gerekli`, 'error');

    await dbSet(`businesses/${GZ.uid}/shops/${shopId}/shelves/${itemKey}`, {
      item: itemKey, stock: 0, max: 50,
      price: +(item.base * 1.2).toFixed(2),
      cost: 0, totalSold: 0, totalRevenue: 0
    });
    toast(`${item.emo} ${item.name} reyonu eklendi`, 'success');
  };

  /* ══════════════════════════════════════════════════════════════════════
     UI YARDIMCISI: Reyon seçici (ui-manager'ın eski seçicisini geçersiz kılar)
     ══════════════════════════════════════════════════════════════════════ */

  // Bu fonksiyon ui-manager.js'de "<select>" yerine kullanılır.
  // Sadece dükkan tipinin izin verdiği ürünleri gösterir, kategoriye gruplar.
  window.renderShelfPicker = function (shopType, currentlyShelvedKeys = []) {
    const def = SHOP_CATALOG[shopType];
    if (!def) return '<div class="empty-state">Bilinmeyen dükkan türü</div>';
    const lv = GZ.data?.level || 1;
    const items = window.getAllowedItems(shopType);
    if (!items.length) return '<div class="empty-state">Bu dükkan türü için ürün tanımlı değil</div>';

    // Kategoriye göre grupla
    const byCat = {};
    items.forEach(it => {
      const k = it.cat;
      if (!byCat[k]) byCat[k] = [];
      byCat[k].push(it);
    });

    let html = `<div class="shelf-picker-info">
      <b>${def.icon} ${def.name}</b> · Sadece şu kategorilerden ürün satılabilir:
      <span class="muted">${def.cats.map(c => window.URUN_KATEGORI_TUM[c] || c).join(', ')}</span>
    </div>`;

    for (const cat of Object.keys(byCat)) {
      html += `<div class="shelf-picker-cat-name">${window.URUN_KATEGORI_TUM[cat] || cat}</div>`;
      html += '<div class="shelf-picker-grid">';
      for (const item of byCat[cat]) {
        const locked = lv < item.lv;
        const exists = currentlyShelvedKeys.includes(item.key);
        const klass = locked ? 'locked' : exists ? 'exists' : '';
        const action = (locked || exists) ? '' : `onclick="addShelfFromPicker('${item.key}')"`;
        const status = exists ? '✓ Var' : locked ? `🔒 Lv ${item.lv}` : '500₺';
        html += `
          <div class="shelf-picker-item ${klass}" ${action}>
            <span class="spi-emo">${item.emo}</span>
            <div class="spi-info">
              <div class="spi-name">${item.name}</div>
              <div class="spi-base">Maliyet: ${cashFmt(item.base)}/${item.unit}</div>
            </div>
            <span class="spi-status">${status}</span>
          </div>`;
      }
      html += '</div>';
    }
    return html;
  };

  // Reyon seçicisinden ürün ekleme — açık olan dükkan id'sini global tutar
  window._shelfPickerShopId = null;
  window.openShelfPicker = async function (shopId) {
    const shop = await dbGet(`businesses/${GZ.uid}/shops/${shopId}`);
    if (!shop) return toast('Dükkan yok', 'error');
    window._shelfPickerShopId = shopId;
    const shelves = Object.keys(shop.shelves || {});
    showModal('Reyon Ekle', window.renderShelfPicker(shop.type, shelves));
  };
  window.addShelfFromPicker = async function (itemKey) {
    if (!window._shelfPickerShopId) return;
    await window.addShelf(window._shelfPickerShopId, itemKey);
    closeModal();
    // dükkan sayfasını yenile
    if (typeof window.refreshCurrentTab === 'function') window.refreshCurrentTab();
    else if (typeof window.switchTab === 'function') window.switchTab(GZ.currentTab || 'dukkan');
  };

  /* ══════════════════════════════════════════════════════════════════════
     YENİ DÜKKAN AÇMA SAYFASI (kategori-bazlı, görsel)
     ══════════════════════════════════════════════════════════════════════ */
  window.renderShopBuilder = function (city) {
    const lv = GZ.data?.level || 1;
    let html = `<div class="page-title">🏪 Yeni Dükkan Aç <span class="muted">${city}</span></div>
      <p class="small muted mb-12">Her dükkan türü <b>sadece kendi kategorisindeki ürünleri</b> satabilir. Et market'te değil kasapta, telefon manavda değil elektronikçide!</p>`;

    html += '<div class="shop-builder-grid">';
    Object.entries(SHOP_CATALOG).forEach(([type, def]) => {
      const locked = lv < def.lv;
      const cats = def.cats.map(c => window.URUN_KATEGORI_TUM[c] || c).join(' · ');
      html += `
        <div class="shop-build-card ${locked ? 'locked' : ''}">
          <div class="sbc-icon">${def.icon}</div>
          <div class="sbc-name">${def.name}</div>
          <div class="sbc-cats">${cats}</div>
          <div class="sbc-meta">
            <span>Lv ${def.lv}</span>
            <span class="green">${cashFmt(def.cost)}</span>
          </div>
          ${locked
            ? `<button class="btn-secondary" disabled>🔒 Lv ${def.lv}</button>`
            : `<button class="btn-primary" onclick="window.buyShop('${type}','${city}'); closeModal();">Aç</button>`
          }
        </div>`;
    });
    html += '</div>';
    return html;
  };

  console.log('[urun-katalog] Yüklendi: ' + Object.keys(SHOP_CATALOG).length + ' dükkan türü, ' + Object.keys(window.URUNLER).length + ' ürün');
})();
