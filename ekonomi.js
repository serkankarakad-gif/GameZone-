/* ==========================================================================
   ekonomi.js — Ekonomi Çekirdeği
   - Dükkanlar (Reyon sistemi: ürün YOKKEN satış YOK)
   - Bahçe / Çiftlik / Fabrika / Maden (üretim hatları)
   - Lojistik (depo)
   - İhracat (gerçek talep listesi, oyuncu üretiminden satış)
   - İhale (gerçek zamanlı geri sayım, en yüksek teklif kazanır)
   - Kripto (rastgele dalgalanma, gerçek alım-satım)
   - Marka (oyuncu kurar, üyeler katılır)
   - Banka (vadeli, kredi, işletme gideri, maaş)
   - Pazar (kendi reyonlarından il halkına otomatik satış)
   - Mağaza (elmas paketleri, robot)
   ========================================================================== */

/* ============== ÜRÜN VERİTABANI ============== */
const URUNLER = {
  // Temel Gıda
  bugday_unu:      { name:"Buğday Unu",     emo:"🌾", base:4.50, cat:"temel", unit:"Kilo", lv:1 },
  ayicicek_yagi:   { name:"Ayçiçek Yağı",   emo:"🌻", base:8.50, cat:"temel", unit:"Litre", lv:1 },
  zeytinyagi:      { name:"Zeytinyağı",     emo:"🫒", base:12.0, cat:"temel", unit:"Litre", lv:2 },
  misir_unu:       { name:"Mısır Unu",      emo:"🌽", base:5.20, cat:"temel", unit:"Kilo", lv:1 },
  siyah_cay:       { name:"Siyah Çay",      emo:"🍵", base:14.0, cat:"temel", unit:"Kilo", lv:2 },
  yesil_cay:       { name:"Yeşil Çay",      emo:"🍃", base:18.0, cat:"temel", unit:"Kilo", lv:3 },
  seker:           { name:"Şeker",          emo:"🍬", base:6.80, cat:"temel", unit:"Kilo", lv:1 },
  findik_yagi:     { name:"Fındık Yağı",    emo:"🥜", base:22.0, cat:"temel", unit:"Litre", lv:4 },

  // Kahvaltılık & Süt
  tavuk_yumurtasi: { name:"Tavuk Yumurtası",emo:"🥚", base:1.20, cat:"kahvalti", unit:"Adet", lv:1 },
  hindi_yumurtasi: { name:"Hindi Yumurtası",emo:"🥚", base:2.40, cat:"kahvalti", unit:"Adet", lv:5 },
  kaz_yumurtasi:   { name:"Kaz Yumurtası",  emo:"🥚", base:3.80, cat:"kahvalti", unit:"Adet", lv:6 },
  inek_sutu:       { name:"İnek Sütü",      emo:"🥛", base:5.50, cat:"kahvalti", unit:"Litre", lv:1 },
  keci_sutu:       { name:"Keçi Sütü",      emo:"🥛", base:9.20, cat:"kahvalti", unit:"Litre", lv:3 },
  beyaz_peynir:    { name:"Beyaz Peynir",   emo:"🧀", base:32.0, cat:"kahvalti", unit:"Kilo", lv:2 },
  kasar_peyniri:   { name:"Kaşar Peyniri",  emo:"🧀", base:48.0, cat:"kahvalti", unit:"Kilo", lv:3 },
  zeytin:          { name:"Zeytin",         emo:"🫒", base:18.5, cat:"kahvalti", unit:"Kilo", lv:2 },
  petek_bal:       { name:"Petek Bal",      emo:"🍯", base:85.0, cat:"kahvalti", unit:"Kilo", lv:5 },
  suzme_bal:       { name:"Süzme Bal",      emo:"🍯", base:65.0, cat:"kahvalti", unit:"Kilo", lv:4 },
  polen:           { name:"Polen",          emo:"🌼", base:32.0, cat:"kahvalti", unit:"Kilo", lv:5 },

  // Meyve & Sebze
  domates:         { name:"Domates",        emo:"🍅", base:8.50, cat:"meyve", unit:"Kilo", lv:1 },
  patates:         { name:"Patates",        emo:"🥔", base:6.00, cat:"meyve", unit:"Kilo", lv:1 },
  sogan:           { name:"Soğan",          emo:"🧅", base:5.50, cat:"meyve", unit:"Kilo", lv:1 },
  elma:            { name:"Elma",           emo:"🍎", base:9.00, cat:"meyve", unit:"Kilo", lv:1 },
  uzum:            { name:"Üzüm",           emo:"🍇", base:14.0, cat:"meyve", unit:"Kilo", lv:2 },
  kiraz:           { name:"Kiraz",          emo:"🍒", base:24.0, cat:"meyve", unit:"Kilo", lv:3 },
  kayisi:          { name:"Kayısı",         emo:"🍑", base:16.0, cat:"meyve", unit:"Kilo", lv:2 },
  findik:          { name:"Fındık",         emo:"🥜", base:55.0, cat:"meyve", unit:"Kilo", lv:4 },

  // Et Ürünleri
  tavuk_eti:       { name:"Tavuk Eti",      emo:"🍗", base:48.0, cat:"et", unit:"Kilo", lv:3 },
  dana_eti:        { name:"Dana Eti",       emo:"🥩", base:185.0,cat:"et", unit:"Kilo", lv:5 },
  kuzu_eti:        { name:"Kuzu Eti",       emo:"🥩", base:220.0,cat:"et", unit:"Kilo", lv:6 },

  // Madenler
  altin:           { name:"Altın",          emo:"🥇", base:2400.0,cat:"maden", unit:"Gram", lv:30 },
  gumus:           { name:"Gümüş",          emo:"🥈", base:32.0, cat:"maden", unit:"Gram", lv:30 },
  bakir:           { name:"Bakır",          emo:"🟫", base:2.20, cat:"maden", unit:"Kilo", lv:30 },
  demir:           { name:"Demir",          emo:"⚙️", base:1.80, cat:"maden", unit:"Kilo", lv:30 },
  kromit:          { name:"Krom",           emo:"⛏️", base:4.50, cat:"maden", unit:"Kilo", lv:30 },

  // Fabrika ürünleri
  ekmek:           { name:"Ekmek",          emo:"🍞", base:5.00, cat:"firin", unit:"Adet", lv:2 },
  pasta:           { name:"Pasta",          emo:"🎂", base:120.0,cat:"firin", unit:"Adet", lv:4 },
  dondurma:        { name:"Dondurma",       emo:"🍦", base:18.0, cat:"firin", unit:"Adet", lv:3 },
  kimyasal_cozucu: { name:"Kimyasal Çözücü",emo:"⚗️", base:15.0, cat:"sanayi",unit:"Litre", lv:10 },
  cimento:         { name:"Çimento",        emo:"🧱", base:3.50, cat:"sanayi",unit:"Kilo", lv:8 },
  yun:             { name:"Yün",            emo:"🧶", base:28.0, cat:"sanayi",unit:"Kilo", lv:5 },
  keten_kumas:     { name:"Keten Kumaş",    emo:"🧵", base:65.0, cat:"sanayi",unit:"m²", lv:6 },
  eldiven:         { name:"Çift Eldiven",   emo:"🧤", base:42.0, cat:"sanayi",unit:"Çift", lv:5 },
};
window.URUNLER = URUNLER;

const URUN_KATEGORI = {
  temel: "Temel Gıda",
  kahvalti: "Kahvaltılık ve Süt",
  meyve: "Meyve ve Sebze",
  et: "Et Ürünleri",
  firin: "Fırın",
  sanayi: "Sanayi",
  maden: "Madenler"
};

/* ============== KRİPTO LİSTESİ ============== */
const KRIPTO = [
  { sym:"VGN", name:"Vortigon",   color:"#0ea5e9", base:54000, supply:350000000, vol:0.04 },
  { sym:"NNX", name:"Neonix",     color:"#eab308", base:430000, supply:120000000, vol:0.05 },
  { sym:"STC", name:"Solstice",   color:"#fb923c", base:75,    supply:9000000000, vol:0.06 },
  { sym:"HYN", name:"Hyperion",   color:"#7c3aed", base:0.0055,supply:8e11, vol:0.08 },
  { sym:"CLM", name:"Celestium",  color:"#22c55e", base:61000, supply:80000000, vol:0.04 },
  { sym:"AST", name:"Astrium",    color:"#ef4444", base:617,   supply:1500000000, vol:0.05 },
  { sym:"GLX", name:"Galactix",   color:"#dc2626", base:18.9,  supply:9e9, vol:0.05 },
  { sym:"ZTH", name:"Zenithium",  color:"#6366f1", base:28.3,  supply:3e9, vol:0.04 },
  { sym:"XEN", name:"Xenon",      color:"#f97316", base:68500000, supply:21000, vol:0.03 },
  { sym:"ORN", name:"Orionium",   color:"#3b82f6", base:3350000, supply:500000, vol:0.04 },
  { sym:"ZPH", name:"Zephyria",   color:"#06b6d4", base:14000, supply:1e8, vol:0.05 },
  { sym:"MTX", name:"Meteorix",   color:"#f43f5e", base:1.47,  supply:5e10, vol:0.07 },
  { sym:"LMX", name:"Luminex",    color:"#e11d48", base:94000, supply:8e7, vol:0.04 },
  { sym:"ECP", name:"Eclipsium",  color:"#1e40af", base:3.64,  supply:2e10, vol:0.06 },
  { sym:"ASL", name:"Astrolis",   color:"#10b981", base:0.137, supply:5e11, vol:0.07 },
  { sym:"CMX", name:"Cometrix",   color:"#ec4899", base:1.05,  supply:4e10, vol:0.07 },
  { sym:"QSR", name:"Quasarium",  color:"#a855f7", base:202,   supply:6e8, vol:0.05 },
  { sym:"SLR", name:"Solara",     color:"#f59e0b", base:467000,supply:1e7, vol:0.04 },
  { sym:"PAR", name:"Partion",    color:"#8b5cf6", base:351000,supply:1.2e7, vol:0.04 },
  { sym:"NBL", name:"Nebulon",    color:"#14b8a6", base:1677,  supply:8e8, vol:0.06 },
  { sym:"QNT", name:"Quantix",    color:"#0891b2", base:42.5,  supply:2e9, vol:0.05 },
  { sym:"VRX", name:"Vortexa",    color:"#7e22ce", base:8800,  supply:5e7, vol:0.05 },
  { sym:"OMG", name:"Omegium",    color:"#be123c", base:0.42,  supply:1e11, vol:0.08 },
  { sym:"PLX", name:"Pulsex",     color:"#0d9488", base:165,   supply:9e8, vol:0.05 },
  { sym:"NOV", name:"Novarium",   color:"#1d4ed8", base:1240000, supply:3e6, vol:0.04 },
];
window.KRIPTO = KRIPTO;

/* ============== İHRACAT ŞABLONLARI ============== */
const IHRACAT_SIRKETLER = [
  { name:"Siam Group Co., Ltd.",      country:"Tayland",   flag:"🇹🇭" },
  { name:"Volga Holdings OOO",        country:"Rusya",     flag:"🇷🇺" },
  { name:"Azteca Group SA de CV",     country:"Meksika",   flag:"🇲🇽" },
  { name:"Royal Union Ltd.",          country:"İngiltere", flag:"🇬🇧" },
  { name:"Alpine Partners AG",        country:"İsviçre",   flag:"🇨🇭" },
  { name:"Lumière Groupe SAS",        country:"Fransa",    flag:"🇫🇷" },
  { name:"Kaiser Handels GmbH",       country:"Almanya",   flag:"🇩🇪" },
  { name:"Sakura Trading K.K.",       country:"Japonya",   flag:"🇯🇵" },
  { name:"Nile Commerce Co.",         country:"Mısır",     flag:"🇪🇬" },
  { name:"Pampas SRL",                country:"Arjantin",  flag:"🇦🇷" },
  { name:"Maple Leaf Inc.",           country:"Kanada",    flag:"🇨🇦" },
  { name:"Liberty Trade LLC",         country:"ABD",       flag:"🇺🇸" },
  { name:"Outback Pty Ltd.",          country:"Avustralya",flag:"🇦🇺" },
  { name:"Iberia Comercial SA",       country:"İspanya",   flag:"🇪🇸" },
  { name:"Hellas Emporiki AE",        country:"Yunanistan",flag:"🇬🇷" },
];

/* ============== INIT ============== */
function initEkonomi(){
  // Kripto fiyat döngüsü (sadece bir kullanıcı çalıştırsın diye admin değil ama hep çalışır)
  initCryptoEngine();
  // İhracat talep listesi yenileme
  initExportEngine();
  // İhale döngüsü
  initAuctionEngine();
  // Banka periyodik ödemeler
  initBankEngine();
  // Pazar otomatik satışları
  initMarketSalesEngine();
}
window.initEkonomi = initEkonomi;

/* ============================================================
   KRİPTO MOTORU — fiyatları her 30 saniyede bir günceller
   ============================================================ */
async function initCryptoEngine(){
  // İlk kurulum
  const exists = await dbGet('crypto/prices');
  if (!exists){
    const init = {};
    KRIPTO.forEach(k => {
      init[k.sym] = { current: k.base, prev: k.base, ts: now() };
    });
    await dbSet('crypto/prices', init);
  }

  // Fiyatları dinle
  if (GZ.pricesUnsub) GZ.pricesUnsub();
  const ref = db.ref('crypto/prices');
  ref.on('value', s => { GZ.prices = s.val() || {}; if (GZ.currentTab === 'kripto') renderKripto(); });
  GZ.pricesUnsub = () => ref.off();

  // Kripto fiyatı 10-30 dakikada bir güncellenir (gerçekçi borsa simülasyonu)
  function scheduleCryptoTick(){
    const delay = (10 + Math.random() * 20) * 60 * 1000; // 10-30 dakika
    setTimeout(async () => { await tickCrypto(); scheduleCryptoTick(); }, delay);
  }
  scheduleCryptoTick();
  setTimeout(tickCrypto, 3000); // ilk yükleme
}

async function tickCrypto(){
  // Lock al — son 25 sn'de kim tick yaptıysa o devam etsin
  const lockRef = db.ref('crypto/_tickLock');
  const r = await lockRef.transaction(cur => {
    if (cur && (now() - cur.ts) < 25000) return; // başka biri yaptı
    return { uid: GZ.uid, ts: now() };
  });
  if (!r.committed) return;

  // Fiyatları güncelle
  const updates = {};
  for (const k of KRIPTO){
    const cur = (GZ.prices[k.sym]?.current) || k.base;
    // Genelde aşağı eğilimli (kullanıcı: "adamı zarara götürmemiz lazım"), bazen yukarı
    // %60 düşüş, %40 yükseliş; volatilite kripto bazlı
    const direction = Math.random() < 0.55 ? -1 : 1;
    const change = direction * (Math.random() * k.vol);
    let next = cur * (1 + change);
    // Tabanın %10'u altına / 5 katı üstüne çıkmasın
    next = Math.max(k.base * 0.1, Math.min(k.base * 5, next));
    updates[`${k.sym}/prev`] = cur;
    updates[`${k.sym}/current`] = next;
    updates[`${k.sym}/ts`] = now();
  }
  await db.ref('crypto/prices').update(updates);
}

/* ============================================================
   İHRACAT MOTORU
   ============================================================ */
async function initExportEngine(){
  // Eğer talepler yoksa veya hepsi eski ise yenile
  const list = await dbGet('exports/list');
  if (!list || Object.keys(list).length < 15 || (now() - (await dbGet('exports/_renewedAt')||0)) > 30*60*1000){
    await renewExports();
  }
  // 30 dk'da bir lock'lı yenile
  setInterval(async () => {
    const r = await db.ref('exports/_renewLock').transaction(cur => {
      if (cur && (now() - cur) < 25*60*1000) return;
      return now();
    });
    if (r.committed) await renewExports();
  }, 60*1000);
}

async function renewExports(){
  const updates = {};
  const items = Object.keys(URUNLER);
  for (let i=0;i<20;i++){
    const sirket = IHRACAT_SIRKETLER[Math.floor(Math.random()*IHRACAT_SIRKETLER.length)];
    const itemKey = items[Math.floor(Math.random()*items.length)];
    const u = URUNLER[itemKey];
    const demand = (Math.floor(Math.random()*8)+1) * 500000;
    const price = +(u.base * (1.5 + Math.random()*1.5)).toFixed(2); // taban x 1.5-3
    const minOrder = Math.max(2000, Math.floor(demand * 0.005));
    const id = 'ex_' + Math.random().toString(36).slice(2,10);
    updates[id] = {
      id, sirket: sirket.name, country: sirket.country, flag: sirket.flag,
      item: itemKey, demand, fulfilled: 0,
      pricePerUnit: price, minOrder,
      createdAt: now()
    };
  }
  await db.ref('exports/list').set(updates);
  await db.ref('exports/_renewedAt').set(now());
}

/* Kullanıcı bir ihracat talebine gönderim yapsın */
async function exportShip(exId, qty){
  const ex = await dbGet(`exports/list/${exId}`);
  if (!ex) return toast('Talep bulunamadı', 'error');
  if (qty < ex.minOrder) return toast(`Min sipariş: ${fmtInt(ex.minOrder)} ${URUNLER[ex.item].unit}`, 'warn');
  const remaining = ex.demand - (ex.fulfilled||0);
  if (qty > remaining) qty = remaining;
  if (qty <= 0) return toast('Talep doldu', 'warn');

  // Kullanıcının bu üründen depoda var mı? (Lojistik depolardan tüketir)
  const total = await getTotalStock(GZ.uid, ex.item);
  if (total < qty) return toast(`Yeterli stok yok. Var: ${fmtInt(total)} ${URUNLER[ex.item].unit}`, 'error');

  // Stok düş
  await consumeStock(GZ.uid, ex.item, qty);
  // Ödeme al
  const earn = +(qty * ex.pricePerUnit).toFixed(2);
  await addCash(GZ.uid, earn, 'export');
  await addXP(GZ.uid, Math.floor(earn / 100));
  // İhracat fulfillment güncelle
  await dbUpdate(`exports/list/${exId}`, { fulfilled: (ex.fulfilled||0) + qty });

  toast(`💰 +${cashFmt(earn)} ihracat geliri`, 'success');
  if (GZ.currentTab === 'ihracat') render('ihracat');
  if (GZ.currentTab === 'lojistik') render('lojistik');
}
window.exportShip = exportShip;

/* ============================================================
   İHALE MOTORU
   ============================================================ */
async function initAuctionEngine(){
  // İhaleler yoksa oluştur
  const list = await dbGet('auctions/list');
  if (!list || Object.keys(list).length < 5){
    await createAuctions();
  }
  // Bitenleri sonlandır + yenile
  setInterval(processAuctions, 5000);
}

async function createAuctions(){
  const updates = {};
  const items = Object.keys(URUNLER);
  for (let i=0;i<6;i++){
    const sirket = IHRACAT_SIRKETLER[Math.floor(Math.random()*IHRACAT_SIRKETLER.length)];
    const itemKey = items[Math.floor(Math.random()*items.length)];
    const u = URUNLER[itemKey];
    const qty = (Math.floor(Math.random()*6)+1) * 100000;
    const minBid = +(u.base * (1.2 + Math.random()*0.8)).toFixed(2);
    const id = 'au_' + Math.random().toString(36).slice(2,10);
    const duration = (Math.floor(Math.random()*5)+1) * 60 * 1000; // 1-5 dk
    updates[id] = {
      id, sirket: sirket.name, country: sirket.country, flag: sirket.flag,
      item: itemKey, qty, minBid, currentBid: minBid,
      currentBidder: null, currentBidderName: null,
      endsAt: now() + duration, createdAt: now(), finalized: false
    };
  }
  await db.ref('auctions/list').update(updates);
}

async function processAuctions(){
  const list = await dbGet('auctions/list') || {};
  const ids = Object.keys(list);
  const expired = ids.filter(id => list[id].endsAt < now() && !list[id].finalized);

  // Lock — sadece bir kullanıcı sonlandırsın
  if (expired.length){
    const r = await db.ref('auctions/_finLock').transaction(cur => {
      if (cur && (now() - cur) < 4000) return;
      return now();
    });
    if (r.committed){
      for (const id of expired){
        const a = list[id];
        await dbUpdate(`auctions/list/${id}`, { finalized: true });
        if (a.currentBidder){
          // Kazanan stok alır, parası daha önce çekildi (teklif ederken)
          await addStock(a.currentBidder, a.item, a.qty, 'mainWarehouse');
          await pushNotif(a.currentBidder, `🏆 İhaleyi kazandın: ${fmtInt(a.qty)} ${URUNLER[a.item].unit} ${URUNLER[a.item].name}`);
        }
        // Bittiğinde yenisini oluşturmak için sil
        await db.ref(`auctions/list/${id}`).remove();
      }
      // Yeni ihaleler ekle
      const remaining = Object.keys(list).filter(id=>!list[id].finalized).length;
      if (remaining < 5) await createAuctions();
    }
  }
  if (GZ.currentTab === 'ihale') renderIhale();
}

/* Teklif ver */
async function placeBid(auId, bidAmount){
  const a = await dbGet(`auctions/list/${auId}`);
  if (!a) return toast('İhale bulunamadı', 'error');
  if (a.finalized) return toast('İhale bitti', 'warn');
  if (a.endsAt < now()) return toast('İhale süresi doldu', 'warn');
  if (bidAmount <= a.currentBid) return toast(`En düşük teklif: ${cashFmt(a.currentBid + 0.01)}`, 'warn');

  const totalCost = bidAmount * a.qty;
  // Önceki teklifi iade et + yeni teklifi al — transactional bir flow yapalım
  const ok = await spendCash(GZ.uid, totalCost, 'auction-bid');
  if (!ok) return toast(`Yetersiz bakiye. Gerekli: ${cashFmt(totalCost)}`, 'error');

  // Önceki teklif sahibine iade
  if (a.currentBidder && a.currentBidder !== GZ.uid){
    await addCash(a.currentBidder, a.currentBid * a.qty, 'auction-refund');
    await pushNotif(a.currentBidder, `İhalede teklifin geçildi, paran iade edildi.`);
  } else if (a.currentBidder === GZ.uid){
    // Aynı kullanıcı yeniden teklif verdi: önceki tutarı iade et
    await addCash(GZ.uid, a.currentBid * a.qty, 'auction-self-refund');
  }

  await dbUpdate(`auctions/list/${auId}`, {
    currentBid: bidAmount,
    currentBidder: GZ.uid,
    currentBidderName: GZ.data.username,
    endsAt: Math.max(a.endsAt, now() + 30000) // son 30 sn'de teklif gelirse uzat
  });
  toast('Teklif kaydedildi', 'success');
}
window.placeBid = placeBid;

/* ============================================================
   BANKA MOTORU
   ============================================================ */
async function initBankEngine(){
  // Her dakika kullanıcının bankasını kontrol et: yatırım faizi & ödeme tarihleri
  setInterval(processBankUser, 60000);
  setTimeout(processBankUser, 5000);
}

async function processBankUser(){
  if (!GZ.uid || !GZ.data) return;
  const bank = await dbGet(`bank/${GZ.uid}`);
  if (!bank) return;

  const t = now();

  // Yatırım hesabına faiz: günlük %0.3 (yıllık ~%109 ama oyun)
  if (bank.investment > 0){
    const elapsedMs = t - (bank.investmentDate || t);
    if (elapsedMs > 60000){
      const days = elapsedMs / (24*3600*1000);
      const interest = bank.investment * 0.003 * days; // birikmiş
      // SADECE her tam dakika için yaz
      await dbUpdate(`bank/${GZ.uid}`, {
        investment: +(bank.investment + interest).toFixed(2),
        investmentDate: t
      });
    }
  }

  // İşletme gideri (haftalık) — sadece dolduğunda bir kez
  if (t > (bank.nextBusinessExpense||t+1)){
    const businesses = await countBusinesses(GZ.uid);
    const expense = businesses * 200; // her işletme 200₺/hafta
    if (expense > 0){
      const ok = await spendCash(GZ.uid, expense, 'business-exp');
      if (ok){
        await pushNotif(GZ.uid, `🏢 İşletme gideri ödendi: ${cashFmt(expense)}`);
      } else {
        // Para yoksa — borç olarak ekle
        await dbUpdate(`bank/${GZ.uid}`, { loan: (bank.loan||0) + expense });
        await pushNotif(GZ.uid, `⚠️ İşletme gideri ödenemedi, ${cashFmt(expense)} kredi olarak eklendi.`);
      }
    }
    await dbUpdate(`bank/${GZ.uid}`, { nextBusinessExpense: t + 7*24*3600*1000 });
  }

  // Çalışan maaşları (haftalık)
  if (t > (bank.nextSalary||t+1)){
    const employees = await countEmployees(GZ.uid);
    const salary = employees * 350;
    if (salary > 0){
      const ok = await spendCash(GZ.uid, salary, 'salary');
      if (ok) await pushNotif(GZ.uid, `👥 Çalışan maaşları ödendi: ${cashFmt(salary)}`);
      else {
        await dbUpdate(`bank/${GZ.uid}`, { loan: (bank.loan||0) + salary });
        await pushNotif(GZ.uid, `⚠️ Maaşlar ödenemedi, ${cashFmt(salary)} krediye eklendi.`);
      }
    }
    await dbUpdate(`bank/${GZ.uid}`, { nextSalary: t + 7*24*3600*1000 });
  }
}

async function bankDeposit(amount){
  if (!amount || amount <= 0 || !isFinite(amount)) return toast('Geçersiz tutar','error');
  amount = Math.floor(amount * 100) / 100;
  const ok = await spendCash(GZ.uid, amount, 'bank-deposit');
  if (!ok) return toast('Yetersiz bakiye', 'error');
  await db.ref(`bank/${GZ.uid}/balance`).transaction(c => (c||0)+amount);
  toast(`✅ +${cashFmt(amount)} hesaba yatırıldı`, 'success');
  return true;
}
window.bankDeposit = bankDeposit;

async function bankWithdraw(amount){
  if (!amount || amount <= 0 || !isFinite(amount)) return toast('Geçersiz tutar','error');
  amount = Math.floor(amount * 100) / 100;
  const r = await db.ref(`bank/${GZ.uid}/balance`).transaction(c => {
    if ((c||0) < amount) return;
    return c - amount;
  });
  if (!r.committed) return toast('Yetersiz hesap bakiyesi','error');
  await addCash(GZ.uid, amount, 'bank-withdraw');
  toast(`✅ +${cashFmt(amount)} hesaptan çekildi`, 'success');
  return true;
}
window.bankWithdraw = bankWithdraw;

async function bankInvest(amount){
  if (!amount || amount <= 0 || !isFinite(amount)) return toast('Geçersiz tutar','error');
  amount = Math.floor(amount * 100) / 100;
  const ok = await spendCash(GZ.uid, amount, 'invest');
  if (!ok) return toast('Yetersiz bakiye', 'error');
  await db.ref(`bank/${GZ.uid}`).transaction(b => {
    b = b || { investment:0, investmentDate: now() };
    b.investment = (b.investment||0) + amount;
    b.investmentDate = now();
    return b;
  });
  toast(`✅ +${cashFmt(amount)} yatırım yapıldı (%0.3 günlük faiz)`, 'success');
  return true;
}
window.bankInvest = bankInvest;

async function bankInvestWithdraw(amount){
  if (!amount || amount <= 0 || !isFinite(amount)) return toast('Geçersiz tutar','error');
  amount = Math.floor(amount * 100) / 100;
  const r = await db.ref(`bank/${GZ.uid}/investment`).transaction(c => {
    if ((c||0) < amount) return;
    return +(c - amount).toFixed(2);
  });
  if (!r.committed) return toast('Yetersiz yatırım', 'error');
  await addCash(GZ.uid, amount, 'invest-withdraw');
  toast(`✅ +${cashFmt(amount)} yatırım çekildi`, 'success');
  return true;
}
window.bankInvestWithdraw = bankInvestWithdraw;

async function bankBorrow(amount){
  if (!amount || amount <= 0 || !isFinite(amount)) return toast('Geçersiz tutar','error');
  amount = Math.floor(amount);
  const lv = (GZ.data.level||1);
  const max = lv * 5000;
  const cur = (await dbGet(`bank/${GZ.uid}/loan`))||0;
  if (cur + amount > max) return toast(`Kredi limitiniz: ${cashFmt(max)} (Mevcut: ${cashFmt(cur)})`, 'warn');
  await db.ref(`bank/${GZ.uid}/loan`).transaction(c => (c||0)+amount);
  await addCash(GZ.uid, amount, 'borrow');
  toast(`+${cashFmt(amount)} kredi çekildi`, 'success');
  return true;
}
window.bankBorrow = bankBorrow;

async function bankRepay(amount){
  if (!amount || amount <= 0 || !isFinite(amount)) return toast('Geçersiz tutar','error');
  amount = Math.floor(amount);

  // Kredi var mı?
  const cur = (await dbGet(`bank/${GZ.uid}/loan`)) || 0;
  if (cur <= 0) return toast('Krediniz yok!', 'warn');

  // Fazla ödemeyi engelle
  if (amount > cur) {
    amount = cur;
    toast(`Kredi tutarı ₺${cur} - sadece bu kadarı ödendi`, 'info', 4000);
  }

  // Bakiye kontrolü
  const myMoney = GZ.data?.money || 0;
  if (amount > myMoney) {
    return toast(`Yetersiz bakiye! Mevcut: ${cashFmt(myMoney)}`, 'error');
  }

  const ok = await spendCash(GZ.uid, amount, 'repay');
  if (!ok) return toast('Yetersiz bakiye', 'error');

  await db.ref(`bank/${GZ.uid}/loan`).transaction(c => Math.max(0,(c||0)-amount));
  toast(`✅ -${cashFmt(amount)} kredi ödendi`, 'success');
  return true;
}
window.bankRepay = bankRepay;

/* ============================================================
   PAZAR — DÜKKAN OTOMATİK SATIŞ MOTORU
   YALNIZCA REYONA ÜRÜN EKLENMİŞSE SATIŞ OLUR (kafasına göre satış YOK)
   ============================================================ */
async function initMarketSalesEngine(){
  setInterval(processSales, 90000); // her 90 sn
  setTimeout(processSales, 7000);
}

async function processSales(){
  if (!GZ.uid) return;
  // Kullanıcının dükkanlarını gez
  const shops = await dbGet(`businesses/${GZ.uid}/shops`) || {};
  const profitRate = (await dbGet(`businesses/${GZ.uid}/profitRate`)) || 0.20;

  for (const sid of Object.keys(shops)){
    const shop = shops[sid];
    const shelves = shop.shelves || {};
    let totalSale = 0;
    const updates = {};
    for (const item of Object.keys(shelves)){
      const sh = shelves[item];
      // **REYONDA STOK YOKSA SATIŞ YOK**
      if (!sh || (sh.stock||0) <= 0) continue;
      if (!sh.price || sh.price <= 0) continue;

      const u = URUNLER[item];
      if (!u) continue;

      // Fiyat-talep eğrisi: fiyat tabanın 1.5x üstünde ise satış %50 düşer
      const ratio = sh.price / u.base;
      let demandFactor = 1;
      if (ratio < 1) demandFactor = 1.5;
      else if (ratio < 1.5) demandFactor = 1;
      else if (ratio < 2) demandFactor = 0.6;
      else if (ratio < 3) demandFactor = 0.3;
      else demandFactor = 0.1;

      // Açılış bonus: ilk 24 saatte +5x
      const since = now() - (shop.createdAt||now());
      const opening = since < 24*3600*1000 ? 5 : 1;

      const baseRate = 6 * demandFactor * opening * (shop.level||1);
      const sold = Math.min(sh.stock, Math.floor(baseRate * (0.7 + Math.random()*0.6)));
      if (sold <= 0) continue;

      const revenue = +(sold * sh.price).toFixed(2);
      totalSale += revenue;

      updates[`${sid}/shelves/${item}/stock`] = sh.stock - sold;
      updates[`${sid}/shelves/${item}/totalSold`] = (sh.totalSold||0) + sold;
      updates[`${sid}/shelves/${item}/totalRevenue`] = +((sh.totalRevenue||0) + revenue).toFixed(2);
    }

    if (totalSale > 0){
      // Para ekle, XP ekle
      await addCash(GZ.uid, totalSale, 'shop-sale');
      await addXP(GZ.uid, Math.floor(totalSale/50));
      await db.ref(`businesses/${GZ.uid}/shops`).update(updates);
    }
  }
  // Bahçe / Çiftlik / Fabrika / Maden hasatlarını işle
  await processProductions();
}

async function processProductions(){
  // Bahçeler hasada hazır mı?
  const gardens = await dbGet(`businesses/${GZ.uid}/gardens`) || {};
  const farms   = await dbGet(`businesses/${GZ.uid}/farms`) || {};
  const factories = await dbGet(`businesses/${GZ.uid}/factories`) || {};
  const mines   = await dbGet(`businesses/${GZ.uid}/mines`) || {};

  const t = now();
  // Bahçe & çiftlik & fabrika & maden ortak: harvestAt geldiyse stok ekle
  const allLists = [
    { col:'gardens', items: gardens },
    { col:'farms', items: farms },
    { col:'factories', items: factories },
    { col:'mines', items: mines }
  ];
  for (const grp of allLists){
    for (const id of Object.keys(grp.items)){
      const it = grp.items[id];
      if (it.crop && it.harvestAt && t >= it.harvestAt && !it.harvested){
        // Hasada hazır — kullanıcı tıklayınca alacak; otomatik EKLEMİYORUZ
        // Sadece bayrak göster
        if (!it.ready){
          await dbUpdate(`businesses/${GZ.uid}/${grp.col}/${id}`, { ready: true });
        }
      }
    }
  }
}

/* ============================================================
   STOK / DEPO YARDIMCILARI
   ============================================================ */
// Tüm depolardaki + reyonlardaki + hammadde stoğu = toplam
async function getTotalStock(uid, item){
  let total = 0;
  const wh = await dbGet(`businesses/${uid}/warehouses`) || {};
  for (const city of Object.keys(wh)){
    total += (wh[city].items?.[item]) || 0;
  }
  // Ana depo
  const main = (await dbGet(`businesses/${uid}/mainWarehouse/${item}`)) || 0;
  total += main;
  return total;
}
window.getTotalStock = getTotalStock;

async function addStock(uid, item, qty, target='mainWarehouse'){
  if (qty <= 0) return;
  if (target === 'mainWarehouse'){
    await db.ref(`businesses/${uid}/mainWarehouse/${item}`).transaction(c => (c||0)+qty);
  } else {
    await db.ref(`businesses/${uid}/warehouses/${target}/items/${item}`).transaction(c => (c||0)+qty);
  }
}
window.addStock = addStock;

async function consumeStock(uid, item, qty){
  // Önce mainWarehouse'tan, sonra şehirlerden tüket
  let need = qty;
  const main = (await dbGet(`businesses/${uid}/mainWarehouse/${item}`)) || 0;
  if (main >= need){
    await db.ref(`businesses/${uid}/mainWarehouse/${item}`).set(main - need);
    return true;
  } else {
    if (main > 0){
      need -= main;
      await db.ref(`businesses/${uid}/mainWarehouse/${item}`).set(0);
    }
    const wh = await dbGet(`businesses/${uid}/warehouses`) || {};
    for (const city of Object.keys(wh)){
      const cur = (wh[city].items?.[item]) || 0;
      if (cur <= 0) continue;
      if (cur >= need){
        await db.ref(`businesses/${uid}/warehouses/${city}/items/${item}`).set(cur - need);
        return true;
      } else {
        need -= cur;
        await db.ref(`businesses/${uid}/warehouses/${city}/items/${item}`).set(0);
      }
    }
    if (need > 0) return false;
    return true;
  }
}
window.consumeStock = consumeStock;

async function countBusinesses(uid){
  const shops = await dbGet(`businesses/${uid}/shops`) || {};
  const gardens = await dbGet(`businesses/${uid}/gardens`) || {};
  const farms = await dbGet(`businesses/${uid}/farms`) || {};
  const factories = await dbGet(`businesses/${uid}/factories`) || {};
  const mines = await dbGet(`businesses/${uid}/mines`) || {};
  return Object.keys(shops).length + Object.keys(gardens).length + Object.keys(farms).length + Object.keys(factories).length + Object.keys(mines).length;
}

async function countEmployees(uid){
  const shops = await dbGet(`businesses/${uid}/shops`) || {};
  let total = 0;
  for (const id of Object.keys(shops)) total += (shops[id].employees||1);
  return total;
}

/* ============================================================
   REYON / DÜKKAN İŞLEMLERİ
   ============================================================ */
async function buyShop(type, city){
  const costs = { market: 5000, elektronik: 12000, mobilya: 18000, kuyumcu: 35000,
                  beyazesya: 22000, otomotiv: 60000, benzin: 45000 };
  const lvReq = { market:1, elektronik:5, mobilya:8, kuyumcu:15, beyazesya:10, otomotiv:18, benzin:12 };
  const cost = costs[type];
  const lv = GZ.data.level||1;
  if (lv < lvReq[type]) return toast(`${lvReq[type]}. seviyede açılır`, 'warn');
  const ok = await spendCash(GZ.uid, cost, 'buy-shop');
  if (!ok) return toast('Yetersiz bakiye', 'error');
  const id = 'sh_' + Math.random().toString(36).slice(2,8);
  await dbSet(`businesses/${GZ.uid}/shops/${id}`, {
    id, type, city, level:1, employees:1, createdAt: now(), shelves:{}
  });
  toast(`${type} açıldı!`, 'success');
}
window.buyShop = buyShop;

async function addShelf(shopId, itemKey){
  const item = URUNLER[itemKey];
  if (!item) return toast('Geçersiz ürün','error');
  if ((GZ.data.level||1) < item.lv) return toast(`${item.lv}. seviyede açılır`, 'warn');
  const exist = await dbGet(`businesses/${GZ.uid}/shops/${shopId}/shelves/${itemKey}`);
  if (exist) return toast('Bu reyon zaten var','warn');
  const cost = 500;
  const ok = await spendCash(GZ.uid, cost, 'add-shelf');
  if (!ok) return toast(`Reyon kurulum: ${cashFmt(cost)} gerekli`, 'error');
  await dbSet(`businesses/${GZ.uid}/shops/${shopId}/shelves/${itemKey}`, {
    item: itemKey, stock:0, max:50, price: +(item.base * 1.2).toFixed(2),
    cost: 0, totalSold:0, totalRevenue:0
  });
  toast('Reyon eklendi', 'success');
}
window.addShelf = addShelf;

async function buyShelfStock(shopId, itemKey, qty){
  const sh = await dbGet(`businesses/${GZ.uid}/shops/${shopId}/shelves/${itemKey}`);
  if (!sh) return toast('Reyon bulunamadı','error');
  const u = URUNLER[itemKey];
  if (qty <= 0) return toast('Geçersiz miktar','error');
  if (sh.stock + qty > sh.max) qty = sh.max - sh.stock;
  if (qty <= 0) return toast('Reyon dolu','warn');
  const cost = +(qty * u.base).toFixed(2);
  const ok = await spendCash(GZ.uid, cost, 'shelf-stock');
  if (!ok) return toast(`Yetersiz bakiye (${cashFmt(cost)})`, 'error');
  await dbUpdate(`businesses/${GZ.uid}/shops/${shopId}/shelves/${itemKey}`, {
    stock: sh.stock + qty,
    cost: +((sh.cost*sh.stock + cost)/(sh.stock+qty)).toFixed(2) // ortalama maliyet
  });
  toast(`+${qty} ${u.unit} eklendi`, 'success');
}
window.buyShelfStock = buyShelfStock;

async function setShelfPrice(shopId, itemKey, price){
  if (price <= 0) return toast('Geçersiz fiyat','error');
  const item = URUNLER[itemKey];
  if (item){
    const maxAllowed = +(item.base * 3).toFixed(2);
    if (price > maxAllowed){
      return toast(`❌ Maksimum fiyat: ${cashFmt(maxAllowed)} (taban × 3). Bu fiyatta hiç satış olmaz.`, 'error');
    }
    if (price < item.base * 0.5){
      return toast(`⚠️ Çok düşük fiyat! Tabanın yarısından az — zarar edersin.`, 'warn');
    }
  }
  await dbUpdate(`businesses/${GZ.uid}/shops/${shopId}/shelves/${itemKey}`, { price });
  toast('Fiyat güncellendi', 'success');
}
window.setShelfPrice = setShelfPrice;

async function deleteShelf(shopId, itemKey){
  await db.ref(`businesses/${GZ.uid}/shops/${shopId}/shelves/${itemKey}`).remove();
  toast('Reyon kapatıldı','success');
}
window.deleteShelf = deleteShelf;

async function upgradeShop(shopId){
  const shop = await dbGet(`businesses/${GZ.uid}/shops/${shopId}`);
  if (!shop) return;
  const next = (shop.level||1)+1;
  const cost = next * 5000;
  const ok = await spendCash(GZ.uid, cost, 'upgrade-shop');
  if (!ok) return toast(`Yetersiz bakiye (${cashFmt(cost)})`, 'error');
  await dbUpdate(`businesses/${GZ.uid}/shops/${shopId}`, {
    level: next,
    employees: (shop.employees||1)+1
  });
  toast(`Dükkan Lv ${next}`, 'success');
}
window.upgradeShop = upgradeShop;

/* ============================================================
   BAHÇE / ÇİFTLİK / FABRİKA / MADEN
   ============================================================ */
async function buyProductionUnit(kind){
  const map = {
    gardens:    { cost:3000, lv:2,  name:"Bahçe" },
    farms:     { cost:8000, lv:5,  name:"Çiftlik" },
    factories: { cost:25000,lv:8,  name:"Fabrika" },
    mines:     { cost:80000,lv:30, name:"Maden" }
  };
  const m = map[kind]; if (!m) return;
  if ((GZ.data.level||1) < m.lv) return toast(`${m.lv}. seviyede açılır`, 'warn');
  const ok = await spendCash(GZ.uid, m.cost, 'buy-prod');
  if (!ok) return toast('Yetersiz bakiye', 'error');
  const id = kind.slice(0,2) + '_' + Math.random().toString(36).slice(2,8);
  await dbSet(`businesses/${GZ.uid}/${kind}/${id}`, {
    id, level:1, createdAt: now(), crop:null, harvestAt:null, ready:false
  });
  toast(`${m.name} açıldı`, 'success');
}
window.buyProductionUnit = buyProductionUnit;

async function plantCrop(kind, unitId, itemKey){
  const u = URUNLER[itemKey];
  if (!u) return toast('Geçersiz ürün','error');
  if ((GZ.data.level||1) < u.lv) return toast(`${u.lv}. seviyede açılır`,'warn');
  const cropCost = +(u.base * 0.4 * 100).toFixed(2); // 100 birim ekim maliyeti
  const ok = await spendCash(GZ.uid, cropCost, 'plant');
  if (!ok) return toast(`Yetersiz bakiye (${cashFmt(cropCost)})`, 'error');
  const grow = (kind==='gardens'? 5 : kind==='farms'? 8 : kind==='factories'? 4 : 12) * 60 * 1000;
  await dbUpdate(`businesses/${GZ.uid}/${kind}/${unitId}`, {
    crop: itemKey,
    harvestAt: now() + grow,
    ready: false
  });
  toast(`${u.name} ekildi`, 'success');
}
window.plantCrop = plantCrop;

async function harvest(kind, unitId){
  const u = await dbGet(`businesses/${GZ.uid}/${kind}/${unitId}`);
  if (!u || !u.crop) return;
  if (now() < u.harvestAt) return toast(`Henüz hazır değil`, 'warn');
  const yieldQty = (u.level||1) * 100; // her seviyede 100 birim
  await addStock(GZ.uid, u.crop, yieldQty, 'mainWarehouse');
  await dbUpdate(`businesses/${GZ.uid}/${kind}/${unitId}`, {
    crop:null, harvestAt:null, ready:false
  });
  await addXP(GZ.uid, Math.floor(yieldQty * URUNLER[u.crop].base / 50));
  toast(`+${yieldQty} ${URUNLER[u.crop].unit} ${URUNLER[u.crop].name} hasat edildi`, 'success');
}
window.harvest = harvest;

async function upgradeProductionUnit(kind, unitId){
  const u = await dbGet(`businesses/${GZ.uid}/${kind}/${unitId}`);
  if (!u) return;
  const cost = (u.level||1) * 2500;
  const ok = await spendCash(GZ.uid, cost, 'upgrade-prod');
  if (!ok) return toast('Yetersiz bakiye','error');
  await dbUpdate(`businesses/${GZ.uid}/${kind}/${unitId}`, { level:(u.level||1)+1 });
  toast(`Yükseltildi → Lv ${(u.level||1)+1}`, 'success');
}
window.upgradeProductionUnit = upgradeProductionUnit;

/* ============================================================
   LOJİSTİK — DEPO
   ============================================================ */
async function buyWarehouse(city, payment){
  const exist = await dbGet(`businesses/${GZ.uid}/warehouses/${city}`);
  if (exist) return toast('Bu şehirde deponuz zaten var','warn');
  if (payment === 'diamond'){
    const ok = await spendDiamonds(GZ.uid, 100);
    if (!ok) return toast('Yetersiz elmas (100 gerekli)','error');
  } else {
    const ok = await spendCash(GZ.uid, 25000, 'warehouse');
    if (!ok) return toast('Yetersiz bakiye (25.000 ₺ gerekli)','error');
  }
  await dbSet(`businesses/${GZ.uid}/warehouses/${city}`, {
    city, capacity: 100000, items: {}, createdAt: now()
  });
  toast(`${city} deposu açıldı`, 'success');
}
window.buyWarehouse = buyWarehouse;

async function transferStock(item, qty, fromCity, toCity){
  // basit transfer
  const f = await dbGet(`businesses/${GZ.uid}/warehouses/${fromCity}/items/${item}`) || 0;
  if (f < qty) return toast('Yetersiz stok','error');
  await db.ref(`businesses/${GZ.uid}/warehouses/${fromCity}/items/${item}`).set(f - qty);
  await db.ref(`businesses/${GZ.uid}/warehouses/${toCity}/items/${item}`).transaction(c => (c||0)+qty);
  toast('Transfer tamam', 'success');
}
window.transferStock = transferStock;

/* ============================================================
   KRİPTO ALIM-SATIM (v2 - bug fix + güvenli)
   ============================================================ */
async function buyCrypto(sym, tlAmount){
  if (!tlAmount || tlAmount <= 0 || !isFinite(tlAmount)) {
    toast('Geçersiz tutar','error');
    return false;
  }
  const price = GZ.prices[sym]?.current;
  if (!price || price <= 0) {
    toast('Fiyat alınamadı','error');
    return false;
  }
  // Min alım kontrolü
  if (tlAmount < 1) {
    toast('Min alım: ₺1','error');
    return false;
  }
  // Bakiye kontrolü
  const myMoney = GZ.data?.money || 0;
  if (tlAmount > myMoney) {
    toast(`Yetersiz bakiye! Mevcut: ${cashFmt(myMoney)}`,'error');
    return false;
  }

  const ok = await spendCash(GZ.uid, tlAmount, 'crypto-buy');
  if (!ok) {
    toast('Yetersiz bakiye','error');
    return false;
  }
  const fee = tlAmount * 0.005;  // %0.5 komisyon
  const qty = (tlAmount - fee) / price;

  await db.ref(`crypto/holdings/${GZ.uid}/${sym}`).transaction(c => (c||0) + qty);

  toast(`✅ Aldın: ${qty.toFixed(6)} ${sym} (Komisyon: ${cashFmt(fee)})`, 'success', 4000);

  // Günlük görev güncellemesi
  if (tlAmount >= 1000 && typeof updateDailyTask === 'function') {
    await updateDailyTask('crypto_1', 1);
  }

  return true;
}
window.buyCrypto = buyCrypto;

async function sellCrypto(sym, qty){
  if (!qty || qty <= 0 || !isFinite(qty)) {
    toast('Geçersiz miktar','error');
    return false;
  }
  const price = GZ.prices[sym]?.current;
  if (!price || price <= 0) {
    toast('Fiyat alınamadı','error');
    return false;
  }

  // Atomik kontrol + güncelleme (race condition fix)
  let success = false;
  let actualQty = 0;
  await db.ref(`crypto/holdings/${GZ.uid}/${sym}`).transaction(cur => {
    cur = cur || 0;
    if (cur < qty) {
      // Yetersiz - işlemi iptal et
      return cur;
    }
    success = true;
    actualQty = qty;
    const remaining = cur - qty;
    // Çok küçük artıkları sıfırla (floating-point hatası önlemi)
    return remaining < 0.000001 ? 0 : remaining;
  });

  if (!success) {
    toast('Yetersiz miktar','error');
    return false;
  }

  const grossTl = actualQty * price;
  const fee = grossTl * 0.005;  // %0.5 komisyon
  const netTl = grossTl - fee;

  await addCash(GZ.uid, netTl, 'crypto-sell');

  toast(`✅ Sattın: ${actualQty.toFixed(6)} ${sym} → +${cashFmt(netTl)} (Komisyon: ${cashFmt(fee)})`, 'success', 4000);

  // Günlük görev
  if (netTl >= 1000 && typeof updateDailyTask === 'function') {
    await updateDailyTask('crypto_1', 1);
  }

  return true;
}
window.sellCrypto = sellCrypto;

/* ============================================================
   MARKA
   ============================================================ */
async function createBrand(name){
  if (!name || name.length<3 || name.length>20) return toast('İsim 3-20 karakter olmalı','error');
  if (!/^[a-zA-Z0-9_ ]+$/.test(name)) return toast('Sadece harf/rakam','error');
  const lv = GZ.data.level||1;
  if (lv < 10) return toast('10. seviyede açılır','warn');
  const ok = await spendCash(GZ.uid, 25000, 'brand');
  if (!ok) return toast('25.000 ₺ gerekli','error');
  const id = 'br_' + Math.random().toString(36).slice(2,8);
  await dbSet(`brands/${id}`, {
    id, name, leader: GZ.uid, leaderName: GZ.data.username,
    members: { [GZ.uid]: { joinedAt: now(), role:'leader' } },
    points: 100, power: 1, createdAt: now()
  });
  await dbUpdate(`users/${GZ.uid}`, { brand: id });
  toast(`Marka kuruldu: ${name}`, 'success');
}
window.createBrand = createBrand;

async function joinBrand(id){
  const b = await dbGet(`brands/${id}`);
  if (!b) return toast('Marka bulunamadı','error');
  if (Object.keys(b.members||{}).length >= 20) return toast('Marka dolu','warn');
  await dbSet(`brands/${id}/members/${GZ.uid}`, { joinedAt: now(), role:'member' });
  await dbUpdate(`users/${GZ.uid}`, { brand: id });
  toast('Markaya katıldın', 'success');
}
window.joinBrand = joinBrand;

async function leaveBrand(){
  const id = GZ.data.brand;
  if (!id) return;
  const b = await dbGet(`brands/${id}`);
  if (b && b.leader === GZ.uid){
    // Lider çıkıyorsa marka dağılır
    await db.ref(`brands/${id}`).remove();
  } else {
    await db.ref(`brands/${id}/members/${GZ.uid}`).remove();
  }
  await dbUpdate(`users/${GZ.uid}`, { brand: null });
  toast('Markadan ayrıldın', 'success');
}
window.leaveBrand = leaveBrand;

/* ============================================================
   MAĞAZA — Elmas paketleri & robot
   ============================================================ */
const ELMAS_PAKETLERI = [
  { id:'p1', dia:50,    tl:60,   bonus:0   },
  { id:'p2', dia:200,   tl:300,  bonus:20  },
  { id:'p3', dia:500,   tl:600,  bonus:80  },
  { id:'p4', dia:1200,  tl:1200, bonus:300 },
  { id:'p5', dia:3000,  tl:2400, bonus:1000},
  { id:'p6', dia:10000, tl:6000, bonus:5000}
];
window.ELMAS_PAKETLERI = ELMAS_PAKETLERI;

const ROBOT_PAKETLERI = [
  { id:'r_h', name:'Saatlik Robot',   diamonds:30,   hours:1   },
  { id:'r_d', name:'Günlük Robot',    diamonds:200,  hours:24  },
  { id:'r_w', name:'Haftalık Robot',  diamonds:1000, hours:168 },
  { id:'r_m', name:'Aylık Robot',     diamonds:3500, hours:720 }
];
window.ROBOT_PAKETLERI = ROBOT_PAKETLERI;

async function buyRobot(rid){
  const r = ROBOT_PAKETLERI.find(x=>x.id===rid);
  if (!r) return;
  const ok = await spendDiamonds(GZ.uid, r.diamonds);
  if (!ok) return toast('Yetersiz elmas','error');
  const cur = await dbGet(`users/${GZ.uid}/robotUntil`) || 0;
  const start = Math.max(now(), cur);
  await dbUpdate(`users/${GZ.uid}`, { robotUntil: start + r.hours*3600*1000 });
  toast(`Robot aktif: ${r.hours} saat`, 'success');
}
window.buyRobot = buyRobot;

/* ============================================================
   BİLDİRİMLER
   ============================================================ */
async function pushNotif(uid, msg){
  const id = await dbPush(`notifs/${uid}`, { msg, ts: now(), read:false });
  return id;
}
window.pushNotif = pushNotif;

/* ============================================================
   OYUNCU PAZARI — Gerçek Zamanlı Alışveriş Sistemi
   Oyuncular ürün satışa koyar, diğerleri satın alır
   ============================================================ */

// Oyuncu ürün satışa koyar (açık veya gizli)
async function listPlayerItem(itemKey, qty, price, isPublic = true){
  const item = URUNLER[itemKey];
  if (!item) return toast('Geçersiz ürün', 'error');

  // Fiyat limiti: tabanın %50'si ile 5 katı arası
  const minP = +(item.base * 0.5).toFixed(2);
  const maxP = +(item.base * 5).toFixed(2);
  if (price < minP || price > maxP){
    return toast(`Fiyat ${cashFmt(minP)} - ${cashFmt(maxP)} arasında olmalı`, 'error');
  }
  if (qty <= 0) return toast('Geçersiz miktar', 'error');

  // Stoktan düş
  const ok = await consumeStock(GZ.uid, itemKey, qty);
  if (!ok) return toast('Yeterli stok yok', 'error');

  const listingId = 'pl_' + Date.now().toString(36) + Math.random().toString(36).slice(2,5);
  await dbSet(`playerMarket/${listingId}`, {
    id: listingId,
    sellerUid: GZ.uid,
    sellerName: GZ.data.username,
    item: itemKey,
    qty,
    remaining: qty,
    price,
    isPublic,
    createdAt: now(),
    sold: 0
  });
  toast(`${item.emo} ${item.name} satışa çıkarıldı!`, 'success');
  await pushNotif(GZ.uid, `📦 ${qty} ${item.unit} ${item.name} — ${cashFmt(price)}/${item.unit} fiyatıyla satışa çıktı`);
}
window.listPlayerItem = listPlayerItem;

// Oyuncu ilanı iptal eder — kalan stok geri döner
async function cancelPlayerListing(listingId){
  const listing = await dbGet(`playerMarket/${listingId}`);
  if (!listing) return toast('İlan bulunamadı', 'error');
  if (listing.sellerUid !== GZ.uid) return toast('Bu ilan sana ait değil', 'error');
  if (listing.remaining > 0){
    await addStock(GZ.uid, listing.item, listing.remaining, 'mainWarehouse');
  }
  await db.ref(`playerMarket/${listingId}`).remove();
  toast('İlan kaldırıldı, stok geri eklendi', 'success');
}
window.cancelPlayerListing = cancelPlayerListing;

// Oyuncu ilanından satın alır
async function buyFromPlayerMarket(listingId, qty){
  const listing = await dbGet(`playerMarket/${listingId}`);
  if (!listing) return toast('İlan artık mevcut değil', 'error');
  if (!listing.isPublic && listing.sellerUid !== GZ.uid) return toast('Bu ilan gizli', 'error');
  if (qty <= 0 || qty > listing.remaining) return toast(`Maksimum ${listing.remaining} alabilirsin`, 'error');

  const total = +(qty * listing.price).toFixed(2);
  const ok = await spendCash(GZ.uid, total, 'player-market-buy');
  if (!ok) return toast('Yetersiz bakiye', 'error');

  // Stoğu alıcıya ver
  await addStock(GZ.uid, listing.item, qty, 'mainWarehouse');
  // Parayı satıcıya ver (%2 komisyon kesilir)
  const commission = +(total * 0.02).toFixed(2);
  await addCash(listing.sellerUid, total - commission, 'player-market-sale');
  await addXP(GZ.uid, Math.floor(qty * URUNLER[listing.item].base / 100));

  // İlanı güncelle
  const newRemaining = listing.remaining - qty;
  if (newRemaining <= 0){
    await db.ref(`playerMarket/${listingId}`).remove();
  } else {
    await dbUpdate(`playerMarket/${listingId}`, {
      remaining: newRemaining,
      sold: (listing.sold || 0) + qty
    });
  }

  toast(`✅ ${qty} ${URUNLER[listing.item].unit} ${URUNLER[listing.item].name} satın alındı!`, 'success');
  await pushNotif(listing.sellerUid, `💰 ${GZ.data.username}, ${qty} ${URUNLER[listing.item].unit} ${URUNLER[listing.item].name} satın aldı (+${cashFmt(total - commission)})`);
}
window.buyFromPlayerMarket = buyFromPlayerMarket;

/* ============================================================
   VERGİ & MAAŞ — Pazar Günü Otomatik Kesinti
   Cumartesi günü geldiğinde sistem maaş ve vergiyi keser
   ============================================================ */
async function processTaxAndSalaryIfDue(){
  const bank = await dbGet(`bank/${GZ.uid}`) || {};
  const t = now();
  const today = new Date(t);
  const isSaturday = today.getDay() === 6; // 0=Pazar, 6=Cumartesi

  // Maaş: sadece cumartesi ve 7 gün geçtiyse
  if (isSaturday && t > (bank.nextSalary || 0)){
    const employees = await countEmployees(GZ.uid);
    const salary = employees * 350;
    const shops = await dbGet(`businesses/${GZ.uid}/shops`) || {};
    const gardens = await dbGet(`businesses/${GZ.uid}/gardens`) || {};
    const farms = await dbGet(`businesses/${GZ.uid}/farms`) || {};
    const factories = await dbGet(`businesses/${GZ.uid}/factories`) || {};
    const mines = await dbGet(`businesses/${GZ.uid}/mines`) || {};

    // İşletme gideri
    const bizCount = Object.keys(shops).length + Object.keys(gardens).length +
                     Object.keys(farms).length + Object.keys(factories).length + Object.keys(mines).length;
    const expense = bizCount * 200;

    // Vergi: kârın %8'i (geçen haftanın geliri hesaplanamıyorsa sabit)
    const taxBase = (GZ.data.weeklyRevenue || 0);
    const tax = +(taxBase * 0.08).toFixed(2);

    const totalDue = salary + expense + tax;
    if (totalDue > 0){
      const ok = await spendCash(GZ.uid, totalDue, 'weekly-payment');
      if (ok){
        await pushNotif(GZ.uid, `📅 Cumartesi kesintisi: Maaş ${cashFmt(salary)} + Gider ${cashFmt(expense)} + Vergi ${cashFmt(tax)} = ${cashFmt(totalDue)}`);
      } else {
        await dbUpdate(`bank/${GZ.uid}`, { loan: (bank.loan||0) + totalDue });
        await pushNotif(GZ.uid, `⚠️ Haftalık ödeme yapılamadı (${cashFmt(totalDue)}), krediye eklendi`);
      }
      // Haftalık geliri sıfırla
      await dbUpdate(`users/${GZ.uid}`, { weeklyRevenue: 0 });
    }
    // Bir sonraki cumartesi için ayarla
    const nextSat = new Date(t);
    nextSat.setDate(nextSat.getDate() + (7 - nextSat.getDay() + 6) % 7 || 7);
    nextSat.setHours(0, 0, 0, 0);
    await dbUpdate(`bank/${GZ.uid}`, {
      nextSalary: nextSat.getTime(),
      nextBusinessExpense: nextSat.getTime()
    });
  }
}
window.processTaxAndSalaryIfDue = processTaxAndSalaryIfDue;

/* ============================================================
   BAŞARIMLAR SİSTEMİ
   ============================================================ */
const ACHIEVEMENTS = [
  { id:'first_sale',     name:'İlk Satış',        emo:'🎉', desc:'İlk ürününü sat',                  xp:100 },
  { id:'merchant_1',    name:'Küçük Tüccar',      emo:'🛒', desc:'1.000 ₺ kazanç',                   xp:200 },
  { id:'merchant_2',    name:'Tüccar',            emo:'💼', desc:'100.000 ₺ kazanç',                 xp:500 },
  { id:'merchant_3',    name:'Büyük Tüccar',      emo:'💰', desc:'1.000.000 ₺ kazanç',               xp:1500 },
  { id:'shop_5',        name:'Dükkan Zinciri',    emo:'🏪', desc:'5 dükkan aç',                      xp:400 },
  { id:'crypto_win',    name:'Kripto Zengini',    emo:'📈', desc:'Kripto\'dan 50.000 ₺ kazan',       xp:300 },
  { id:'export_10',     name:'İhracatçı',         emo:'🚢', desc:'10 ihracat işlemi',                xp:350 },
  { id:'harvest_100',   name:'Çiftçi',            emo:'🌾', desc:'100 hasat yap',                    xp:250 },
  { id:'lv10',          name:'Deneyimli',         emo:'⭐', desc:'Seviye 10\'a ulaş',               xp:600 },
  { id:'lv25',          name:'Usta',              emo:'🌟', desc:'Seviye 25\'e ulaş',               xp:1000 },
  { id:'lv50',          name:'Efsane',            emo:'💫', desc:'Seviye 50\'ye ulaş',              xp:2500 },
  { id:'brand_leader',  name:'Marka Lideri',      emo:'🏢', desc:'Marka kur',                        xp:500 },
  { id:'market_seller', name:'Pazar Satıcısı',    emo:'🏬', desc:'Oyuncu pazarına 10 ilan koy',     xp:300 },
  { id:'rich_1',        name:'Milyoner',          emo:'💎', desc:'Net servet 1.000.000 ₺',           xp:1000 },
  { id:'rich_2',        name:'Milyarder',         emo:'👑', desc:'Net servet 1.000.000.000 ₺',       xp:5000 },
];
window.ACHIEVEMENTS = ACHIEVEMENTS;

async function checkAndGrantAchievement(uid, achievementId){
  const already = await dbGet(`users/${uid}/achievements/${achievementId}`);
  if (already) return;
  const ach = ACHIEVEMENTS.find(a => a.id === achievementId);
  if (!ach) return;
  await dbSet(`users/${uid}/achievements/${achievementId}`, { ts: now() });
  await addXP(uid, ach.xp);
  await pushNotif(uid, `🏅 Başarım kazandın: ${ach.emo} ${ach.name} — +${ach.xp} XP`);
  // Toast göster (eğer bu kullanıcıysa)
  if (uid === GZ.uid) toast(`🏅 ${ach.emo} ${ach.name}!`, 'success');
}
window.checkAndGrantAchievement = checkAndGrantAchievement;

/* ============================================================
   GÜNLÜK GÖREVLER
   ============================================================ */
const DAILY_TASKS = [
  { id:'sell_100', name:'Günlük Satış',       desc:'100 birim herhangi bir ürün sat',      reward:500,   xp:50  },
  { id:'harvest_3',name:'Hasat Ustası',       desc:'3 hasat yap',                          reward:1000,  xp:100 },
  { id:'trade_1',  name:'Tüccar Ruhu',        desc:'Oyuncu pazarından 1 satın al',         reward:750,   xp:75  },
  { id:'chat_5',   name:'Sosyal Kelebek',     desc:'Sohbette 5 mesaj gönder',              reward:200,   xp:30  },
  { id:'crypto_1', name:'Kripto Günü',        desc:'Kripto al veya sat (min 1000 ₺)',      reward:800,   xp:80  },
  { id:'login',    name:'Günlük Giriş',       desc:'Oyuna giriş yap',                      reward:100,   xp:20  },
];
window.DAILY_TASKS = DAILY_TASKS;

async function checkDailyLogin(){
  const today = new Date().toDateString();
  const lastLogin = await dbGet(`users/${GZ.uid}/lastDailyBonus`);
  if (lastLogin === today) return;
  await dbUpdate(`users/${GZ.uid}`, { lastDailyBonus: today });
  await addCash(GZ.uid, 100, 'daily-login');
  await addXP(GZ.uid, 20);
  toast('🎁 Günlük giriş bonusu: +100 ₺ +20 XP', 'success');
  await checkAndGrantAchievement(GZ.uid, 'login');
}
window.checkDailyLogin = checkDailyLogin;

async function updateDailyTask(taskId, increment = 1){
  const today = new Date().toDateString();
  const key = `users/${GZ.uid}/dailyTasks/${today}/${taskId}`;
  const task = DAILY_TASKS.find(t => t.id === taskId);
  if (!task) return;
  const cur = (await dbGet(key)) || { count: 0, done: false };
  if (cur.done) return;
  const newCount = (cur.count || 0) + increment;
  const targets = { sell_100:100, harvest_3:3, trade_1:1, chat_5:5, crypto_1:1, login:1 };
  const target = targets[taskId] || 1;
  if (newCount >= target){
    await dbSet(key, { count: newCount, done: true });
    await addCash(GZ.uid, task.reward, 'daily-task');
    await addXP(GZ.uid, task.xp);
    toast(`✅ Görev tamamlandı: ${task.name} → +${cashFmt(task.reward)} +${task.xp} XP`, 'success');
  } else {
    await dbSet(key, { count: newCount, done: false });
  }
}
window.updateDailyTask = updateDailyTask;


/* ╔══════════════════════════════════════════════════════════════════════════╗
   ║                                                                          ║
   ║   ███████  ██╗   ██╗ █████╗ ██╗  ██╗ ███████  ██╗   ██╗ ███████          ║
   ║      ██╔   ██║   ██║██╔══██╗██║ ██╔╝ ██╔════╝ ██║   ██║ ██╔════          ║
   ║      ██║   ██║   ██║███████║█████╔╝  █████╗   ██║   ██║ █████╗           ║
   ║      ██║   ╚██╗ ██╔╝██╔══██║██╔═██╗  ██╔══╝   ╚██╗ ██╔╝ ██╔══╝           ║
   ║      ██║    ╚████╔╝ ██║  ██║██║  ██╗ ███████╗  ╚████╔╝  ███████          ║
   ║      ╚═╝     ╚═══╝  ╚═╝  ╚═╝╚═╝  ╚═╝ ╚══════╝   ╚═══╝   ╚══════          ║
   ║                                                                          ║
   ║   GAMEZONE ERP — v2.0 EKONOMİ GENİŞLETMESİ                              ║
   ║   ─────────────────────────────────────────────────                     ║
   ║   • BORSA (Hisse Senedi & IPO)                                          ║
   ║   • EMLAK (Arazi/Bina)                                                  ║
   ║   • SİGORTA                                                             ║
   ║   • FRANCHISE                                                           ║
   ║   • ULUSLARARASI TİCARET                                                ║
   ║   • KARABORSA                                                           ║
   ║   • TAHVİL                                                              ║
   ║   • VADELİ İŞLEMLER (Futures)                                           ║
   ║   • HEDGE FONU                                                          ║
   ║   • HAVA DURUMU & MEVSİM & AFET                                         ║
   ║   • ÇALIŞAN YÖNETİMİ                                                    ║
   ║   • AR-GE / TEKNOLOJİ AĞACI                                             ║
   ║   • EĞİTİM MERKEZİ                                                      ║
   ║   • SÖZLEŞME                                                            ║
   ║   • BELEDİYE SEÇİM                                                      ║
   ║   • TİCARET SAVAŞLARI                                                   ║
   ║   • DÜELLO (1v1 ticaret)                                                ║
   ║   • SEFER / KAMPANYA                                                    ║
   ║   • PRESTİJ                                                             ║
   ║   • KOLEKSİYON KARTLARI                                                 ║
   ║   • TR HARİTASI BÖLGE KONTROLÜ                                          ║
   ║   • AVATAR / UNVAN / DEKORASYON                                         ║
   ║                                                                          ║
   ╚══════════════════════════════════════════════════════════════════════════╝ */


/* ════════════════════════════════════════════════════════════════════════════
   ████ 1. BORSA — HİSSE SENEDİ SİSTEMİ
   ──────────────────────────────────────────────────────────────────────────── */

const STOCKS_DATA = [
  { sym:'TKBNK', name:'Türk Bankası A.Ş.',       sector:'finans',  basePrice:142.50, vol:0.025, divRate:0.04, marketCap:8500000000  },
  { sym:'AYPRT', name:'Ayparti Holding',          sector:'sanayi',  basePrice:78.25,  vol:0.030, divRate:0.03, marketCap:5200000000  },
  { sym:'TCMRT', name:'TC Marketler',             sector:'gida',    basePrice:32.80,  vol:0.022, divRate:0.05, marketCap:3100000000  },
  { sym:'ANRJ',  name:'Anadolu Enerji',           sector:'enerji',  basePrice:215.00, vol:0.035, divRate:0.06, marketCap:12800000000 },
  { sym:'GMSAN', name:'Gemi Sanayi A.Ş.',         sector:'sanayi',  basePrice:96.40,  vol:0.040, divRate:0.02, marketCap:4500000000  },
  { sym:'IZAUT', name:'İzmir Otomotiv',           sector:'otomotiv',basePrice:188.75, vol:0.045, divRate:0.025,marketCap:9200000000  },
  { sym:'BURTKS',name:'Bursa Tekstil',            sector:'tekstil', basePrice:54.20,  vol:0.038, divRate:0.04, marketCap:2800000000  },
  { sym:'KSAYL', name:'Kayseri Yapı',             sector:'insaat',  basePrice:41.60,  vol:0.042, divRate:0.035,marketCap:1900000000  },
  { sym:'MRMRD', name:'Marmara Madencilik',       sector:'maden',   basePrice:312.00, vol:0.055, divRate:0.05, marketCap:15400000000 },
  { sym:'IGDTR', name:'IG Türk Telekom',          sector:'iletisim',basePrice:67.90,  vol:0.020, divRate:0.07, marketCap:7300000000  },
  { sym:'ANKLJ', name:'Ankara Lojistik',          sector:'lojistik',basePrice:23.45,  vol:0.028, divRate:0.04, marketCap:1200000000  },
  { sym:'TRGY',  name:'Turkogyat Gıda',           sector:'gida',    basePrice:18.90,  vol:0.025, divRate:0.05, marketCap:850000000   },
  { sym:'ISTHV', name:'İstanbul Havayolları',     sector:'ulasim',  basePrice:175.30, vol:0.060, divRate:0.02, marketCap:8800000000  },
  { sym:'ADNKM', name:'Adana Kimya',              sector:'kimya',   basePrice:89.50,  vol:0.034, divRate:0.045,marketCap:4200000000  },
  { sym:'TZBYL', name:'Trabzon Balık',            sector:'gida',    basePrice:12.75,  vol:0.030, divRate:0.06, marketCap:520000000   },
  { sym:'TKMD',  name:'Türk Medya Grubu',         sector:'medya',   basePrice:45.80,  vol:0.048, divRate:0.025,marketCap:2100000000  },
  { sym:'GZTRP', name:'GameZone Turizm Pazarl.',  sector:'turizm',  basePrice:28.65,  vol:0.052, divRate:0.03, marketCap:1100000000  },
  { sym:'SERKR', name:'Serkan Karakaş Holding',   sector:'holding', basePrice:520.00, vol:0.025, divRate:0.08, marketCap:25000000000 },
  { sym:'RESL',  name:'Resul Investments',        sector:'finans',  basePrice:485.50, vol:0.022, divRate:0.075,marketCap:22000000000 },
  { sym:'GZTECH',name:'GameZone Tech AŞ',         sector:'teknoloji',basePrice:1250.0,vol:0.065, divRate:0.015,marketCap:48000000000 }
];
window.STOCKS_DATA = STOCKS_DATA;

const STOCK_SECTORS = {
  finans:'💰 Finans', sanayi:'🏭 Sanayi', gida:'🍞 Gıda', enerji:'⚡ Enerji',
  otomotiv:'🚗 Otomotiv', tekstil:'🧵 Tekstil', insaat:'🏗️ İnşaat',
  maden:'⛏️ Madencilik', iletisim:'📡 İletişim', lojistik:'🚚 Lojistik',
  ulasim:'✈️ Ulaşım', kimya:'⚗️ Kimya', medya:'📺 Medya',
  turizm:'🏖️ Turizm', holding:'🏛️ Holding', teknoloji:'💻 Teknoloji'
};
window.STOCK_SECTORS = STOCK_SECTORS;

/* Hisse fiyat tick (1 dakikada bir) */
async function tickStockPrices() {
  const lockRef = db.ref('stocks/_tickLock');
  const lockResult = await lockRef.transaction(cur => {
    if (cur && (Date.now() - cur) < 50000) return;
    return Date.now();
  });
  if (!lockResult.committed) return;

  const updates = {};
  for (const stock of STOCKS_DATA) {
    const cur = await dbGet('stocks/prices/' + stock.sym + '/current') || stock.basePrice;
    const drift = (Math.random() - 0.5) * stock.vol * 2;
    const trend = Math.sin(Date.now() / 86400000) * 0.005; // günlük dalga
    const newPrice = Math.max(stock.basePrice * 0.3, Math.min(stock.basePrice * 5, cur * (1 + drift + trend)));

    updates['stocks/prices/' + stock.sym + '/current'] = newPrice;
    updates['stocks/prices/' + stock.sym + '/prev'] = cur;
    updates['stocks/prices/' + stock.sym + '/changePct'] = ((newPrice - cur) / cur) * 100;
    updates['stocks/prices/' + stock.sym + '/ts'] = firebase.database.ServerValue.TIMESTAMP;

    // Tarihçe (son 50 nokta)
    await db.ref('stocks/history/' + stock.sym).push({ p: newPrice, t: Date.now() });
  }
  await db.ref().update(updates);

  // History trim
  for (const stock of STOCKS_DATA) {
    const histRef = db.ref('stocks/history/' + stock.sym);
    const histSnap = await histRef.limitToLast(50).once('value');
    const keys = Object.keys(histSnap.val() || {});
    if (keys.length >= 50) {
      const allSnap = await histRef.once('value');
      const allKeys = Object.keys(allSnap.val() || {});
      if (allKeys.length > 50) {
        const removeUpdate = {};
        allKeys.slice(0, allKeys.length - 50).forEach(k => removeUpdate[k] = null);
        await histRef.update(removeUpdate);
      }
    }
  }
}
window.tickStockPrices = tickStockPrices;

/* Hisse al */
async function buyStock(sym, qty) {
  const stock = STOCKS_DATA.find(s => s.sym === sym);
  if (!stock) return { ok:false, msg:'Hisse bulunamadı' };
  if (qty <= 0) return { ok:false, msg:'Miktar pozitif olmalı' };

  const price = await dbGet('stocks/prices/' + sym + '/current') || stock.basePrice;
  const cost = price * qty;
  const commission = cost * 0.002; // %0.2 komisyon
  const total = cost + commission;

  const ok = await spendCash(GZ.uid, total, 'stock_buy');
  if (!ok) return { ok:false, msg:'Yetersiz bakiye' };

  await db.ref('stocks/holdings/' + GZ.uid + '/' + sym).transaction(cur => {
    cur = cur || { qty:0, avgPrice:0, totalCost:0 };
    const newTotalCost = cur.totalCost + cost;
    const newQty = cur.qty + qty;
    return { qty:newQty, avgPrice:newTotalCost/newQty, totalCost:newTotalCost };
  });

  return { ok:true, msg:'Alındı! Komisyon: ₺' + commission.toFixed(2), price, qty };
}
window.buyStock = buyStock;

/* Hisse sat */
async function sellStock(sym, qty) {
  const stock = STOCKS_DATA.find(s => s.sym === sym);
  if (!stock) return { ok:false, msg:'Hisse bulunamadı' };

  const holding = await dbGet('stocks/holdings/' + GZ.uid + '/' + sym);
  if (!holding || holding.qty < qty) return { ok:false, msg:'Yetersiz hisse' };

  const price = await dbGet('stocks/prices/' + sym + '/current') || stock.basePrice;
  const revenue = price * qty;
  const commission = revenue * 0.002;
  const tax = (price > holding.avgPrice) ? (revenue - holding.avgPrice * qty) * 0.10 : 0; // %10 sermaye kazancı vergisi
  const net = revenue - commission - tax;

  await addCash(GZ.uid, net, 'stock_sell');

  await db.ref('stocks/holdings/' + GZ.uid + '/' + sym).transaction(cur => {
    if (!cur) return null;
    const newQty = cur.qty - qty;
    if (newQty <= 0) return null;
    return { qty:newQty, avgPrice:cur.avgPrice, totalCost:cur.avgPrice * newQty };
  });

  return { ok:true, msg:`Satıldı! Net: ₺${net.toFixed(2)} (Komisyon: ₺${commission.toFixed(2)}, Vergi: ₺${tax.toFixed(2)})`, price, qty };
}
window.sellStock = sellStock;

/* Temettü dağıtımı (her hafta otomatik) */
async function distributeDividends() {
  const lastRef = db.ref('stocks/_lastDividend');
  const lastResult = await lastRef.transaction(cur => {
    if (cur && (Date.now() - cur) < 7 * 24 * 3600 * 1000 - 60000) return;
    return Date.now();
  });
  if (!lastResult.committed) return;

  const allHoldings = await dbGet('stocks/holdings') || {};
  for (const uid of Object.keys(allHoldings)) {
    let totalDiv = 0;
    for (const sym of Object.keys(allHoldings[uid])) {
      const stock = STOCKS_DATA.find(s => s.sym === sym);
      if (!stock) continue;
      const holding = allHoldings[uid][sym];
      const price = await dbGet('stocks/prices/' + sym + '/current') || stock.basePrice;
      const yearlyDiv = price * stock.divRate;
      const weeklyDiv = (yearlyDiv / 52) * holding.qty;
      totalDiv += weeklyDiv;
    }
    if (totalDiv > 0) {
      await addCash(uid, totalDiv, 'dividend');
      await db.ref('stocks/dividends/' + uid).push({
        amount: totalDiv,
        ts: firebase.database.ServerValue.TIMESTAMP
      });
      await db.ref('notifs/' + uid).push({
        type:'dividend', icon:'💰',
        msg:`📊 Temettü ödemesi: ₺${totalDiv.toFixed(2)}`,
        ts: firebase.database.ServerValue.TIMESTAMP, read:false
      });
    }
  }
}
window.distributeDividends = distributeDividends;

/* IPO oluşturma — Kullanıcı kendi şirketini halka açar */
async function createIPO(companyName, totalShares, sharePrice) {
  if (totalShares < 1000 || totalShares > 1000000) return { ok:false, msg:'Hisse: 1000-1.000.000 arası' };
  if (sharePrice < 1 || sharePrice > 1000) return { ok:false, msg:'Fiyat: 1-1000 ₺ arası' };

  const userData = GZ.data;
  if ((userData.level || 1) < 25) return { ok:false, msg:'Min. 25 seviye gerekli (IPO)' };
  if ((userData.netWorth || 0) < 500000) return { ok:false, msg:'Min. 500.000₺ servet gerekli' };

  const fee = totalShares * sharePrice * 0.05; // %5 listeleme ücreti
  const ok = await spendCash(GZ.uid, fee, 'ipo_fee');
  if (!ok) return { ok:false, msg:'Yetersiz bakiye (Listeleme ücreti: ₺' + fee.toFixed(0) + ')' };

  const sym = (userData.username || 'USR').slice(0, 5).toUpperCase();
  const ipoData = {
    sym, founderUid: GZ.uid, companyName,
    totalShares, sharePrice,
    sharesAvailable: totalShares,
    listedAt: firebase.database.ServerValue.TIMESTAMP,
    status: 'open',
    expiresAt: Date.now() + 7 * 24 * 3600 * 1000
  };
  const newRef = await db.ref('stocks/ipos').push(ipoData);
  return { ok:true, ipoId: newRef.key, sym };
}
window.createIPO = createIPO;


/* ════════════════════════════════════════════════════════════════════════════
   ████ 2. EMLAK SİSTEMİ
   ──────────────────────────────────────────────────────────────────────────── */

const EMLAK_TIPLERI = [
  { type:'arsa_kucuk',   name:'Küçük Arsa',           emo:'🟫', basePrice:50000,    rentMin:0,    rentMax:0,    growth:0.02,  buildable:true,  desc:'İmar izinli, küçük arsa' },
  { type:'arsa_orta',    name:'Orta Arsa',            emo:'🟫', basePrice:250000,   rentMin:0,    rentMax:0,    growth:0.025, buildable:true,  desc:'İmar izinli, orta arsa' },
  { type:'arsa_buyuk',   name:'Büyük Arsa',           emo:'🟫', basePrice:1500000,  rentMin:0,    rentMax:0,    growth:0.03,  buildable:true,  desc:'İmar izinli, büyük arsa' },
  { type:'tarla',        name:'Tarım Arazisi',        emo:'🌾', basePrice:120000,   rentMin:800,  rentMax:2000, growth:0.015, buildable:false, desc:'Bahçe/çiftlik kapasitesi +1' },
  { type:'daire_1',      name:'1+1 Daire',            emo:'🏠', basePrice:380000,   rentMin:2500, rentMax:5500, growth:0.04,  buildable:false, desc:'Aylık kira geliri' },
  { type:'daire_2',      name:'2+1 Daire',            emo:'🏠', basePrice:680000,   rentMin:4500, rentMax:9500, growth:0.04,  buildable:false, desc:'Aylık kira geliri' },
  { type:'daire_3',      name:'3+1 Daire',            emo:'🏘️', basePrice:1200000,  rentMin:7500, rentMax:14500,growth:0.045, buildable:false, desc:'Aylık kira geliri' },
  { type:'villa',        name:'Lüks Villa',           emo:'🏖️', basePrice:5500000,  rentMin:25000,rentMax:55000,growth:0.05,  buildable:false, desc:'Premium kira' },
  { type:'plaza',        name:'Ofis Plaza Katı',      emo:'🏢', basePrice:8500000,  rentMin:35000,rentMax:75000,growth:0.06,  buildable:false, desc:'Aylık ofis kira' },
  { type:'avm_dukkan',   name:'AVM Dükkanı',          emo:'🛍️', basePrice:3500000,  rentMin:15000,rentMax:38000,growth:0.05,  buildable:false, desc:'Reyon kapasitesi +2' },
  { type:'fabrika_arsa', name:'Sanayi Bölgesi Arsa',  emo:'🏭', basePrice:2500000,  rentMin:0,    rentMax:0,    growth:0.035, buildable:true,  desc:'Fabrika kapasitesi +1' },
  { type:'maden_sahasi', name:'Maden Sahası',         emo:'⛰️', basePrice:15000000, rentMin:0,    rentMax:0,    growth:0.08,  buildable:false, desc:'Maden kapasitesi +1 (Lv 30)' },
  { type:'sahil_arazi',  name:'Sahil Arazi',          emo:'🏝️', basePrice:25000000, rentMin:80000,rentMax:200000,growth:0.10, buildable:true,  desc:'Turizm yatırımı, çok değerli' },
];
window.EMLAK_TIPLERI = EMLAK_TIPLERI;

/* Emlak satın al */
async function buyProperty(typeId, cityName) {
  const tip = EMLAK_TIPLERI.find(t => t.type === typeId);
  if (!tip) return { ok:false, msg:'Emlak tipi bulunamadı' };

  // Şehir çarpanı: İstanbul %150, Ankara %120, İzmir %110, diğer %100
  let cityMult = 1.0;
  if (cityName === 'İstanbul') cityMult = 1.5;
  else if (cityName === 'Ankara' || cityName === 'İzmir') cityMult = 1.2;
  else if (['Bursa','Antalya','Adana','Gaziantep'].includes(cityName)) cityMult = 1.1;

  const price = Math.floor(tip.basePrice * cityMult);
  const ok = await spendCash(GZ.uid, price, 'realestate_buy');
  if (!ok) return { ok:false, msg:`Yetersiz bakiye (₺${price.toLocaleString('tr-TR')})` };

  const propId = 'p_' + Date.now() + '_' + Math.floor(Math.random()*9999);
  const property = {
    id: propId, type: typeId, city: cityName, owner: GZ.uid,
    purchasePrice: price, currentValue: price,
    rentMin: Math.floor(tip.rentMin * cityMult), rentMax: Math.floor(tip.rentMax * cityMult),
    rented: false, tenantName: null, monthlyRent: 0,
    purchasedAt: firebase.database.ServerValue.TIMESTAMP,
    nextRentDate: Date.now() + 30 * 24 * 3600 * 1000,
    buildings: []
  };
  await db.ref('realestate/owned/' + GZ.uid + '/' + propId).set(property);
  return { ok:true, propId, price };
}
window.buyProperty = buyProperty;

/* Emlak sat (mevcut değerin %95'iyle - %5 komisyon) */
async function sellProperty(propId) {
  const prop = await dbGet('realestate/owned/' + GZ.uid + '/' + propId);
  if (!prop) return { ok:false, msg:'Emlak bulunamadı' };
  const sellPrice = Math.floor(prop.currentValue * 0.95);
  await addCash(GZ.uid, sellPrice, 'realestate_sell');
  await db.ref('realestate/owned/' + GZ.uid + '/' + propId).remove();
  return { ok:true, sellPrice };
}
window.sellProperty = sellProperty;

/* Kiracı bul (NPC, otomatik) */
async function findTenant(propId) {
  const prop = await dbGet('realestate/owned/' + GZ.uid + '/' + propId);
  if (!prop) return { ok:false, msg:'Emlak bulunamadı' };
  if (prop.rented) return { ok:false, msg:'Zaten kiracı var' };
  if (prop.rentMax === 0) return { ok:false, msg:'Bu emlak kiraya verilemez (arsa)' };

  const rent = Math.floor(prop.rentMin + Math.random() * (prop.rentMax - prop.rentMin));
  const tenantNames = ['Mehmet Yılmaz','Ayşe Demir','Mustafa Kaya','Fatma Şahin','Ali Çelik','Zeynep Arslan',
                       'Hüseyin Öztürk','Hatice Yıldız','Ahmet Aydın','Emine Polat','İbrahim Doğan','Elif Çetin'];
  const tenant = tenantNames[Math.floor(Math.random() * tenantNames.length)];

  await db.ref('realestate/owned/' + GZ.uid + '/' + propId).update({
    rented: true, tenantName: tenant, monthlyRent: rent,
    rentStartDate: Date.now()
  });
  return { ok:true, rent, tenant };
}
window.findTenant = findTenant;

/* Bina inşa et */
const INSAAT_TIPLERI = [
  { code:'fabrika',  name:'Fabrika Binası',     cost:1500000, days:14, output:'fabrika kapasitesi +2' },
  { code:'depo',     name:'Depo Binası',        cost:800000,  days:7,  output:'lojistik depo +500m³' },
  { code:'avm',      name:'Mini AVM',           cost:5500000, days:30, output:'reyon kapasitesi +5' },
  { code:'apt',      name:'Apartman (10 daire)',cost:3500000, days:45, output:'10 kira birimi (her ay)' },
  { code:'otel',     name:'Otel (40 oda)',      cost:8500000, days:60, output:'turizm geliri günlük' }
];
window.INSAAT_TIPLERI = INSAAT_TIPLERI;

async function startConstruction(propId, buildCode) {
  const prop = await dbGet('realestate/owned/' + GZ.uid + '/' + propId);
  if (!prop) return { ok:false, msg:'Emlak yok' };
  const tip = EMLAK_TIPLERI.find(t => t.type === prop.type);
  if (!tip || !tip.buildable) return { ok:false, msg:'Bu emlağa inşaat yapılamaz' };
  const build = INSAAT_TIPLERI.find(b => b.code === buildCode);
  if (!build) return { ok:false, msg:'İnşaat tipi yok' };

  const ok = await spendCash(GZ.uid, build.cost, 'construction');
  if (!ok) return { ok:false, msg:'Yetersiz bakiye' };

  const construction = {
    id: 'c_' + Date.now(),
    propId, buildCode, buildName: build.name,
    startedAt: Date.now(),
    completesAt: Date.now() + build.days * 24 * 3600 * 1000,
    status: 'in_progress'
  };
  await db.ref('realestate/constructions/' + GZ.uid).push(construction);
  return { ok:true };
}
window.startConstruction = startConstruction;


/* ════════════════════════════════════════════════════════════════════════════
   ████ 3. SİGORTA SİSTEMİ
   ──────────────────────────────────────────────────────────────────────────── */

const INSURANCE_TYPES = {
  'tesis': {
    name:'🏭 Tesis Sigortası',
    coverPct: [0.5, 0.7, 0.9, 1.0],          // teminat oranı (kademeli)
    premiumPct:[0.005, 0.008, 0.012, 0.020], // aylık prim (varlık değerinin yüzdesi)
    risks:['yangın','sel','deprem','sabotaj']
  },
  'urun': {
    name:'📦 Ürün Stok Sigortası',
    coverPct: [0.4, 0.6, 0.8],
    premiumPct:[0.003, 0.006, 0.012],
    risks:['hasar','hırsızlık','bozulma']
  },
  'arac': {
    name:'🚛 Lojistik Araç Sigortası',
    coverPct: [0.5, 0.75, 1.0],
    premiumPct:[0.008, 0.014, 0.025],
    risks:['kaza','hırsızlık','arıza']
  },
  'emlak': {
    name:'🏘️ Emlak Sigortası',
    coverPct: [0.6, 0.85, 1.0],
    premiumPct:[0.004, 0.007, 0.012],
    risks:['deprem','yangın','sel']
  },
  'kasko': {
    name:'🚗 Kasko (Genel)',
    coverPct: [0.7, 0.9, 1.0],
    premiumPct:[0.010, 0.018, 0.030],
    risks:['her şey']
  }
};
window.INSURANCE_TYPES = INSURANCE_TYPES;

async function buyInsurance(typeKey, tier, assetValue, assetRef) {
  const cfg = INSURANCE_TYPES[typeKey];
  if (!cfg) return { ok:false, msg:'Sigorta tipi yok' };
  if (tier < 0 || tier >= cfg.coverPct.length) return { ok:false, msg:'Geçersiz kademe' };
  if (assetValue <= 0) return { ok:false, msg:'Varlık değeri pozitif olmalı' };

  const monthlyPremium = Math.floor(assetValue * cfg.premiumPct[tier]);
  const ok = await spendCash(GZ.uid, monthlyPremium, 'insurance_premium');
  if (!ok) return { ok:false, msg:'Yetersiz bakiye (Prim: ₺'+monthlyPremium.toLocaleString('tr-TR')+')' };

  const policy = {
    id: 'pol_' + Date.now(),
    typeKey, type: cfg.name, tier,
    coverPct: cfg.coverPct[tier],
    coverage: Math.floor(assetValue * cfg.coverPct[tier]),
    premium: monthlyPremium,
    assetValue, assetRef: assetRef || null,
    startDate: Date.now(),
    nextPremiumDate: Date.now() + 30 * 24 * 3600 * 1000,
    status: 'active',
    claims: 0
  };
  await db.ref('insurance/policies/' + GZ.uid).push(policy);
  return { ok:true, policy };
}
window.buyInsurance = buyInsurance;

async function fileInsuranceClaim(policyId, lossAmount, reason) {
  const policiesSnap = await db.ref('insurance/policies/' + GZ.uid).once('value');
  const policies = policiesSnap.val() || {};
  const polKey = Object.keys(policies).find(k => policies[k].id === policyId);
  if (!polKey) return { ok:false, msg:'Poliçe yok' };
  const pol = policies[polKey];
  if (pol.status !== 'active') return { ok:false, msg:'Poliçe pasif' };

  // Hasar / kapsam değerlendirmesi
  const payout = Math.min(lossAmount * pol.coverPct, pol.coverage);
  const deductible = payout * 0.10; // %10 muafiyet
  const finalPayout = Math.max(0, payout - deductible);

  // %15 ihtimalle red (gerçekçilik)
  if (Math.random() < 0.15) {
    await db.ref('insurance/claims/' + GZ.uid).push({
      policyId, lossAmount, reason, status:'denied',
      ts: firebase.database.ServerValue.TIMESTAMP
    });
    return { ok:false, msg:'❌ Talep reddedildi (sigorta uzmanı incelemesi)' };
  }

  await addCash(GZ.uid, finalPayout, 'insurance_claim');
  await db.ref('insurance/claims/' + GZ.uid).push({
    policyId, lossAmount, reason, status:'approved', payout: finalPayout,
    ts: firebase.database.ServerValue.TIMESTAMP
  });

  // Prim artırımı (claim sonrası %20 artış)
  await db.ref('insurance/policies/' + GZ.uid + '/' + polKey).update({
    premium: Math.floor(pol.premium * 1.2),
    claims: (pol.claims || 0) + 1
  });

  return { ok:true, payout: finalPayout };
}
window.fileInsuranceClaim = fileInsuranceClaim;


/* ════════════════════════════════════════════════════════════════════════════
   ████ 4. FRANCHISE SİSTEMİ
   ──────────────────────────────────────────────────────────────────────────── */

async function createFranchiseOffer(brandName, royaltyPct, initialFee, productType) {
  if (royaltyPct < 5 || royaltyPct > 30) return { ok:false, msg:'Royalty %5-30 arası' };
  if (initialFee < 10000) return { ok:false, msg:'Min başlangıç ücreti ₺10.000' };
  if ((GZ.data.level||1) < 20) return { ok:false, msg:'Min Lv 20 gerekli' };

  const offer = {
    id: 'fr_' + Date.now(),
    ownerUid: GZ.uid,
    ownerName: GZ.data.username,
    brandName, royaltyPct, initialFee, productType,
    description: '',
    createdAt: firebase.database.ServerValue.TIMESTAMP,
    activeFranchisees: 0,
    status: 'open'
  };
  await db.ref('franchise/offers').push(offer);
  return { ok:true, offer };
}
window.createFranchiseOffer = createFranchiseOffer;

async function buyFranchise(offerKey) {
  const offer = await dbGet('franchise/offers/' + offerKey);
  if (!offer) return { ok:false, msg:'Teklif yok' };
  if (offer.ownerUid === GZ.uid) return { ok:false, msg:'Kendi franchise\'ını alamazsın' };
  if (offer.status !== 'open') return { ok:false, msg:'Teklif kapalı' };

  const ok = await spendCash(GZ.uid, offer.initialFee, 'franchise_buy');
  if (!ok) return { ok:false, msg:'Yetersiz bakiye' };

  // Sahip kullanıcısı %50'sini alır
  await addCash(offer.ownerUid, Math.floor(offer.initialFee * 0.5), 'franchise_initial');

  const active = {
    id: 'fr_active_' + Date.now(),
    offerKey, offerOwnerUid: offer.ownerUid, offerOwnerName: offer.ownerName,
    franchiseeUid: GZ.uid, franchiseeName: GZ.data.username,
    brandName: offer.brandName, royaltyPct: offer.royaltyPct,
    productType: offer.productType,
    startedAt: firebase.database.ServerValue.TIMESTAMP,
    totalRevenue: 0, totalRoyaltyPaid: 0
  };
  await db.ref('franchise/active').push(active);
  await db.ref('franchise/offers/' + offerKey + '/activeFranchisees').transaction(c => (c||0) + 1);

  return { ok:true };
}
window.buyFranchise = buyFranchise;


/* ════════════════════════════════════════════════════════════════════════════
   ████ 5. ULUSLARARASI TİCARET
   ──────────────────────────────────────────────────────────────────────────── */

const COUNTRIES = [
  { code:'DE', name:'Almanya',   flag:'🇩🇪', currency:'EUR', rateUsd:1.08, demandMult:1.4, distance:2400, tariff:0.05 },
  { code:'US', name:'ABD',       flag:'🇺🇸', currency:'USD', rateUsd:1.00, demandMult:1.6, distance:8500, tariff:0.08 },
  { code:'GB', name:'İngiltere', flag:'🇬🇧', currency:'GBP', rateUsd:1.27, demandMult:1.3, distance:2900, tariff:0.06 },
  { code:'FR', name:'Fransa',    flag:'🇫🇷', currency:'EUR', rateUsd:1.08, demandMult:1.2, distance:2700, tariff:0.05 },
  { code:'IT', name:'İtalya',    flag:'🇮🇹', currency:'EUR', rateUsd:1.08, demandMult:1.1, distance:1800, tariff:0.04 },
  { code:'NL', name:'Hollanda',  flag:'🇳🇱', currency:'EUR', rateUsd:1.08, demandMult:1.25,distance:2500, tariff:0.05 },
  { code:'CN', name:'Çin',       flag:'🇨🇳', currency:'CNY', rateUsd:0.14, demandMult:0.9, distance:7500, tariff:0.10 },
  { code:'JP', name:'Japonya',   flag:'🇯🇵', currency:'JPY', rateUsd:0.0067,demandMult:1.5,distance:9000, tariff:0.07 },
  { code:'RU', name:'Rusya',     flag:'🇷🇺', currency:'RUB', rateUsd:0.011, demandMult:1.0,distance:2000, tariff:0.12 },
  { code:'SA', name:'S.Arabistan',flag:'🇸🇦',currency:'SAR', rateUsd:0.27, demandMult:1.1, distance:2200, tariff:0.06 }
];
window.COUNTRIES = COUNTRIES;

async function exportInternational(countryCode, productKey, qty) {
  const country = COUNTRIES.find(c => c.code === countryCode);
  if (!country) return { ok:false, msg:'Ülke yok' };
  const product = URUNLER[productKey];
  if (!product) return { ok:false, msg:'Ürün yok' };

  // Stok kontrolü
  const warehouse = await dbGet(`businesses/${GZ.uid}/warehouse/${productKey}`) || 0;
  if (warehouse < qty) return { ok:false, msg:'Yetersiz stok' };

  // Fiyat hesapla
  const usdPrice = product.base / 30; // basit kur (1 USD ≈ 30 TL)
  const localPrice = usdPrice * country.demandMult / country.rateUsd;
  const tlRevenue = localPrice * country.rateUsd * 30 * qty;
  const tariffCost = tlRevenue * country.tariff;
  const shipping = country.distance * 0.5 * qty * (product.unit === 'Kilo' ? 1 : 0.3);
  const netRevenue = tlRevenue - tariffCost - shipping;

  if (netRevenue <= 0) return { ok:false, msg:'Maliyet > Gelir, kar yok!' };

  // Stok düş
  await db.ref(`businesses/${GZ.uid}/warehouse/${productKey}`).transaction(c => Math.max(0, (c||0) - qty));

  // Sevkiyat oluştur (teslimat süreli)
  const shipmentId = 'sh_' + Date.now();
  const days = Math.ceil(country.distance / 800); // 800km/gün
  const shipment = {
    id: shipmentId, country: countryCode, countryName: country.name,
    product: productKey, qty,
    departedAt: Date.now(),
    arrivesAt: Date.now() + days * 24 * 3600 * 1000,
    netRevenue: Math.floor(netRevenue),
    status: 'in_transit'
  };
  await db.ref(`intl_trade/shipments/${GZ.uid}`).push(shipment);

  return { ok:true, shipmentId, days, netRevenue: Math.floor(netRevenue) };
}
window.exportInternational = exportInternational;

async function processIntlShipments() {
  const shipsSnap = await db.ref(`intl_trade/shipments/${GZ.uid}`).once('value');
  const ships = shipsSnap.val() || {};
  for (const key of Object.keys(ships)) {
    const sh = ships[key];
    if (sh.status === 'in_transit' && Date.now() >= sh.arrivesAt) {
      await addCash(GZ.uid, sh.netRevenue, 'intl_export');
      await db.ref(`intl_trade/shipments/${GZ.uid}/${key}/status`).set('delivered');
      await addXP(GZ.uid, 50);
    }
  }
}
window.processIntlShipments = processIntlShipments;


/* ════════════════════════════════════════════════════════════════════════════
   ████ 6. KARABORSA — RİSKLİ TİCARET
   ──────────────────────────────────────────────────────────────────────────── */

const BLACKMARKET_ITEMS = [
  { code:'kacak_sigara', name:'Kaçak Sigara',         emo:'🚬', priceMin:50,    priceMax:120,    risk:0.18, profit:2.5 },
  { code:'sahte_marka',  name:'Sahte Marka Ürün',     emo:'👜', priceMin:300,   priceMax:1500,   risk:0.25, profit:3.0 },
  { code:'antika',       name:'Şüpheli Antika',       emo:'🏺', priceMin:5000,  priceMax:80000,  risk:0.30, profit:4.0 },
  { code:'nadir_para',   name:'Nadir Koleksiyon Para',emo:'🪙', priceMin:1000,  priceMax:25000,  risk:0.20, profit:3.5 },
  { code:'gizli_belge',  name:'Eski Gizli Belge',     emo:'📜', priceMin:2500,  priceMax:50000,  risk:0.35, profit:5.0 },
  { code:'kacak_kahve',  name:'Kaçak Kahve',          emo:'☕', priceMin:200,   priceMax:800,    risk:0.10, profit:2.0 },
  { code:'kayit_disi',   name:'Kayıt Dışı Mücevher',  emo:'💎', priceMin:10000, priceMax:200000, risk:0.40, profit:6.0 },
];
window.BLACKMARKET_ITEMS = BLACKMARKET_ITEMS;

async function blackmarketBuy(itemCode, qty) {
  if ((GZ.data.level || 1) < 15) return { ok:false, msg:'Min Lv 15 gerekli (karaborsa)' };
  const item = BLACKMARKET_ITEMS.find(i => i.code === itemCode);
  if (!item) return { ok:false, msg:'Mal yok' };

  const price = item.priceMin + Math.random() * (item.priceMax - item.priceMin);
  const total = price * qty;
  const ok = await spendCash(GZ.uid, total, 'blackmarket_buy');
  if (!ok) return { ok:false, msg:'Yetersiz bakiye' };

  // Yakalanma riski (alış sırasında daha düşük)
  if (Math.random() < item.risk * 0.4) {
    // Para gitti, mal yok
    await db.ref(`blackmarket/history/${GZ.uid}`).push({
      action:'caught_buy', item:itemCode, qty, lostAmount:total,
      ts: firebase.database.ServerValue.TIMESTAMP
    });
    // Wanted listesine ekle (bir süre)
    await db.ref(`blackmarket/wanted/${GZ.uid}`).set({
      reason:'illegal_buy', until: Date.now() + 3 * 3600 * 1000,
      level: 1
    });
    return { ok:false, msg:'🚨 YAKALANDIN! Mallar el konuldu, ₺'+total.toFixed(0)+' kayıp.' };
  }

  await db.ref(`blackmarket/inventory/${GZ.uid}/${itemCode}`).transaction(c => (c||0) + qty);
  await db.ref(`blackmarket/history/${GZ.uid}`).push({
    action:'buy', item:itemCode, qty, price, total,
    ts: firebase.database.ServerValue.TIMESTAMP
  });

  return { ok:true, total };
}
window.blackmarketBuy = blackmarketBuy;

async function blackmarketSell(itemCode, qty) {
  const item = BLACKMARKET_ITEMS.find(i => i.code === itemCode);
  if (!item) return { ok:false, msg:'Mal yok' };
  const inv = await dbGet(`blackmarket/inventory/${GZ.uid}/${itemCode}`) || 0;
  if (inv < qty) return { ok:false, msg:'Yetersiz envanter' };

  const sellPrice = (item.priceMin + Math.random() * (item.priceMax - item.priceMin)) * item.profit;
  const total = sellPrice * qty;

  // Yakalanma riski (satışta daha yüksek)
  if (Math.random() < item.risk) {
    await db.ref(`blackmarket/inventory/${GZ.uid}/${itemCode}`).set(0);
    await db.ref(`blackmarket/history/${GZ.uid}`).push({
      action:'caught_sell', item:itemCode, qty,
      ts: firebase.database.ServerValue.TIMESTAMP
    });

    // Para cezası (satılacak değerin %50'si)
    const fine = Math.floor(total * 0.5);
    await spendCash(GZ.uid, fine, 'blackmarket_fine');

    await db.ref(`blackmarket/wanted/${GZ.uid}`).set({
      reason:'illegal_sell', until: Date.now() + 12 * 3600 * 1000,
      level: 2
    });

    return { ok:false, msg:`🚨 YAKALANDIN! ₺${fine.toLocaleString('tr-TR')} ceza, mallar el konuldu.` };
  }

  await db.ref(`blackmarket/inventory/${GZ.uid}/${itemCode}`).transaction(c => Math.max(0, (c||0) - qty));
  await addCash(GZ.uid, total, 'blackmarket_sell');
  await db.ref(`blackmarket/history/${GZ.uid}`).push({
    action:'sell', item:itemCode, qty, price:sellPrice, total,
    ts: firebase.database.ServerValue.TIMESTAMP
  });

  return { ok:true, total };
}
window.blackmarketSell = blackmarketSell;


/* ════════════════════════════════════════════════════════════════════════════
   ████ 7. TAHVİL (BONDS)
   ──────────────────────────────────────────────────────────────────────────── */

const BONDS = [
  { code:'TR_2YR',  name:'Devlet Tahvili 2 Yıl',  emo:'🇹🇷', face:1000,  yieldRate:0.18, term:730,  riskLevel:1, issuer:'Türkiye Hazinesi' },
  { code:'TR_5YR',  name:'Devlet Tahvili 5 Yıl',  emo:'🇹🇷', face:1000,  yieldRate:0.22, term:1825, riskLevel:1, issuer:'Türkiye Hazinesi' },
  { code:'TR_10YR', name:'Devlet Tahvili 10 Yıl', emo:'🇹🇷', face:1000,  yieldRate:0.28, term:3650, riskLevel:1, issuer:'Türkiye Hazinesi' },
  { code:'CORP_A',  name:'Akbank Tahvili',        emo:'🏦', face:5000,  yieldRate:0.32, term:1095, riskLevel:2, issuer:'Türkiye Bankaları' },
  { code:'CORP_B',  name:'Holding Tahvili',       emo:'🏛️', face:10000, yieldRate:0.40, term:730,  riskLevel:3, issuer:'Karakaş Holding' },
  { code:'CORP_C',  name:'Yüksek Getiri (junk)',  emo:'⚠️', face:5000,  yieldRate:0.65, term:365,  riskLevel:5, issuer:'Riskli Şirket A.Ş.' },
];
window.BONDS = BONDS;

async function buyBond(code, qty) {
  const bond = BONDS.find(b => b.code === code);
  if (!bond) return { ok:false, msg:'Tahvil yok' };
  const cost = bond.face * qty;
  const ok = await spendCash(GZ.uid, cost, 'bond_buy');
  if (!ok) return { ok:false, msg:'Yetersiz bakiye' };

  const holding = {
    code, qty, face:bond.face, totalCost:cost,
    purchaseDate: Date.now(),
    maturityDate: Date.now() + bond.term * 24 * 3600 * 1000,
    yieldRate:bond.yieldRate, riskLevel:bond.riskLevel,
    nextCouponDate: Date.now() + 90 * 24 * 3600 * 1000  // 3 ayda bir kupon
  };
  await db.ref(`bonds/holdings/${GZ.uid}`).push(holding);

  return { ok:true, cost };
}
window.buyBond = buyBond;

async function processBondCoupons() {
  const holdSnap = await db.ref(`bonds/holdings/${GZ.uid}`).once('value');
  const hs = holdSnap.val() || {};
  for (const k of Object.keys(hs)) {
    const h = hs[k];
    if (Date.now() >= h.nextCouponDate) {
      // Yıllık getirinin 1/4'ü (3 aylık kupon)
      const coupon = h.face * h.qty * h.yieldRate / 4;

      // Risk: junk bond %3 ihtimalle default
      if (h.riskLevel >= 5 && Math.random() < 0.03) {
        await db.ref(`bonds/holdings/${GZ.uid}/${k}/status`).set('defaulted');
        await db.ref('notifs/' + GZ.uid).push({
          type:'bond_default', icon:'⚠️',
          msg:`⚠️ Tahvil default! ${h.code} ödeme yapamadı.`,
          ts: firebase.database.ServerValue.TIMESTAMP, read:false
        });
        continue;
      }

      await addCash(GZ.uid, coupon, 'bond_coupon');
      await db.ref(`bonds/holdings/${GZ.uid}/${k}/nextCouponDate`).set(Date.now() + 90 * 24 * 3600 * 1000);

      // Vade dolduysa anaparayı geri ver
      if (Date.now() >= h.maturityDate) {
        await addCash(GZ.uid, h.totalCost, 'bond_principal');
        await db.ref(`bonds/holdings/${GZ.uid}/${k}/status`).set('matured');
      }
    }
  }
}
window.processBondCoupons = processBondCoupons;


/* ════════════════════════════════════════════════════════════════════════════
   ████ 8. VADELİ İŞLEMLER (FUTURES)
   ──────────────────────────────────────────────────────────────────────────── */

async function openFuturesPosition(symbol, direction, lotSize, leverage) {
  // direction: 'long' veya 'short'
  // leverage: 1, 2, 5, 10
  if (![1,2,5,10].includes(leverage)) return { ok:false, msg:'Kaldıraç 1/2/5/10' };
  const stock = STOCKS_DATA.find(s => s.sym === symbol);
  if (!stock) return { ok:false, msg:'Sembol yok' };

  const price = await dbGet('stocks/prices/' + symbol + '/current') || stock.basePrice;
  const notional = price * lotSize;
  const margin = notional / leverage;

  const ok = await spendCash(GZ.uid, margin, 'futures_margin');
  if (!ok) return { ok:false, msg:'Yetersiz teminat' };

  const position = {
    id: 'fut_' + Date.now(),
    symbol, direction, lotSize, leverage,
    entryPrice: price, notional, margin,
    openedAt: Date.now(),
    status: 'open',
    expiresAt: Date.now() + 30 * 24 * 3600 * 1000  // 1 ay vade
  };
  await db.ref(`futures/positions/${GZ.uid}`).push(position);
  return { ok:true, position };
}
window.openFuturesPosition = openFuturesPosition;

async function closeFuturesPosition(posKey) {
  const pos = await dbGet(`futures/positions/${GZ.uid}/${posKey}`);
  if (!pos || pos.status !== 'open') return { ok:false, msg:'Pozisyon yok/kapalı' };

  const curPrice = await dbGet('stocks/prices/' + pos.symbol + '/current') || pos.entryPrice;
  const priceDiff = pos.direction === 'long' ? (curPrice - pos.entryPrice) : (pos.entryPrice - curPrice);
  const pnl = priceDiff * pos.lotSize * pos.leverage;
  const finalAmount = pos.margin + pnl;

  // Liquidation: kayıp marginden büyükse pozisyon sıfırlanır
  if (finalAmount <= 0) {
    await db.ref(`futures/positions/${GZ.uid}/${posKey}/status`).set('liquidated');
    return { ok:true, liquidated:true, pnl: -pos.margin };
  }

  await addCash(GZ.uid, finalAmount, 'futures_close');
  await db.ref(`futures/positions/${GZ.uid}/${posKey}`).update({
    status:'closed', exitPrice:curPrice, pnl, closedAt:Date.now()
  });
  return { ok:true, pnl, finalAmount };
}
window.closeFuturesPosition = closeFuturesPosition;


/* ════════════════════════════════════════════════════════════════════════════
   ████ 9. HEDGE FONU
   ──────────────────────────────────────────────────────────────────────────── */

async function createHedgeFund(fundName, mgmtFee, perfFee, minInvest, strategy) {
  if (mgmtFee < 0.005 || mgmtFee > 0.05) return { ok:false, msg:'Yönetim ücreti %0.5-5' };
  if (perfFee < 0.05 || perfFee > 0.30) return { ok:false, msg:'Performans ücreti %5-30' };
  if ((GZ.data.level||1) < 35) return { ok:false, msg:'Min Lv 35 gerekli' };
  if ((GZ.data.netWorth||0) < 5000000) return { ok:false, msg:'Min ₺5M servet gerekli' };

  const fund = {
    id: 'hf_' + Date.now(),
    fundName, managerUid: GZ.uid, managerName: GZ.data.username,
    mgmtFee, perfFee, minInvest,
    strategy: strategy || 'balanced',
    nav: 1.00,
    aum: 0,  // Assets Under Management
    investorCount: 0,
    createdAt: firebase.database.ServerValue.TIMESTAMP,
    status: 'open'
  };
  await db.ref('hedgefunds/list').push(fund);
  return { ok:true, fund };
}
window.createHedgeFund = createHedgeFund;

async function investInHedgeFund(fundKey, amount) {
  const fund = await dbGet('hedgefunds/list/' + fundKey);
  if (!fund) return { ok:false, msg:'Fon yok' };
  if (fund.managerUid === GZ.uid) return { ok:false, msg:'Kendi fonuna yatıramazsın' };
  if (amount < fund.minInvest) return { ok:false, msg:`Min yatırım ₺${fund.minInvest.toLocaleString('tr-TR')}` };

  const ok = await spendCash(GZ.uid, amount, 'hedgefund_invest');
  if (!ok) return { ok:false, msg:'Yetersiz bakiye' };

  // Manager'a anlık olarak yatırım miktarının %1'i ücret olarak akar
  await addCash(fund.managerUid, amount * 0.01, 'hedgefund_setup_fee');

  const shares = amount / fund.nav;
  await db.ref(`hedgefunds/investors/${fundKey}/${GZ.uid}`).transaction(cur => {
    cur = cur || { shares:0, totalInvested:0 };
    return { shares: cur.shares + shares, totalInvested: cur.totalInvested + amount };
  });
  await db.ref(`hedgefunds/list/${fundKey}/aum`).transaction(c => (c||0) + amount * 0.99);
  await db.ref(`hedgefunds/list/${fundKey}/investorCount`).transaction(c => (c||0) + 1);

  return { ok:true, shares };
}
window.investInHedgeFund = investInHedgeFund;


/* ════════════════════════════════════════════════════════════════════════════
   ████ 10. HAVA DURUMU + MEVSİM + AFET SİSTEMİ
   ──────────────────────────────────────────────────────────────────────────── */

const SEASONS = [
  { code:'ilkbahar', name:'İlkbahar', emo:'🌸', months:[3,4,5],   tarımMult:1.20, satışMult:1.05 },
  { code:'yaz',      name:'Yaz',      emo:'☀️', months:[6,7,8],   tarımMult:1.30, satışMult:1.15 },
  { code:'sonbahar', name:'Sonbahar', emo:'🍂', months:[9,10,11], tarımMult:1.10, satışMult:1.00 },
  { code:'kis',      name:'Kış',     emo:'❄️', months:[12,1,2],  tarımMult:0.60, satışMult:1.10 }
];
window.SEASONS = SEASONS;

const WEATHER_TYPES = [
  { code:'gunes',     emo:'☀️', name:'Güneşli',       prod:1.10, prob:0.40 },
  { code:'parcabulutlu',emo:'⛅', name:'Parçalı Bulutlu',prod:1.00, prob:0.20 },
  { code:'bulutlu',   emo:'☁️', name:'Bulutlu',       prod:0.95, prob:0.15 },
  { code:'yagmur',    emo:'🌧️', name:'Yağmurlu',      prod:0.90, prob:0.10 },
  { code:'firtina',   emo:'⛈️', name:'Fırtına',       prod:0.60, prob:0.05 },
  { code:'kar',       emo:'🌨️', name:'Kar',           prod:0.50, prob:0.05 },
  { code:'sicakHava', emo:'🥵', name:'Aşırı Sıcak',   prod:0.70, prob:0.03 },
  { code:'donus',     emo:'🥶', name:'Don Olayı',     prod:0.30, prob:0.02 }
];
window.WEATHER_TYPES = WEATHER_TYPES;

function getCurrentSeason() {
  const m = new Date().getMonth() + 1;
  return SEASONS.find(s => s.months.includes(m)) || SEASONS[0];
}
window.getCurrentSeason = getCurrentSeason;

async function tickWeather() {
  // 6 saatte bir hava değişir
  const lastTick = await dbGet('weather/_lastTick') || 0;
  if (Date.now() - lastTick < 6 * 3600 * 1000) return;

  const lockResult = await db.ref('weather/_lastTick').transaction(c => {
    if (c && Date.now() - c < 6 * 3600 * 1000) return;
    return Date.now();
  });
  if (!lockResult.committed) return;

  // 81 il için ayrı hava
  const cities = window.ILLER || [];
  const updates = {};
  for (const city of cities) {
    const r = Math.random();
    let acc = 0;
    let weather = WEATHER_TYPES[0];
    for (const w of WEATHER_TYPES) {
      acc += w.prob;
      if (r < acc) { weather = w; break; }
    }
    const baseTemp = getBaseTempForCity(city);
    const temp = Math.floor(baseTemp + (Math.random() - 0.5) * 8);

    updates['weather/current/' + city] = {
      code: weather.code, name: weather.name, emo: weather.emo,
      prod: weather.prod, temp, ts: Date.now()
    };
  }
  await db.ref().update(updates);
}
window.tickWeather = tickWeather;

function getBaseTempForCity(city) {
  const m = new Date().getMonth() + 1;
  const isWinter = [12,1,2].includes(m);
  const isSummer = [6,7,8].includes(m);
  // Akdeniz/Ege sıcak, İç/Doğu Anadolu serin
  const sicakIller = ['Antalya','Mersin','Adana','Hatay','Muğla','İzmir','Aydın'];
  const soguk = ['Erzurum','Kars','Ardahan','Ağrı','Bayburt','Sivas','Erzincan'];
  let base = 18;
  if (sicakIller.includes(city)) base = 25;
  else if (soguk.includes(city)) base = 8;
  if (isWinter) base -= 12;
  else if (isSummer) base += 8;
  return base;
}

const DISASTERS = [
  { code:'deprem',  name:'Deprem',  emo:'🌍', prob:0.0008, damage:0.30, regions:['Bolu','İstanbul','Kocaeli','Sakarya','Düzce','Yalova','Hatay','Kahramanmaraş','Malatya','Adıyaman','Elazığ','Van','Bingöl','Erzincan'] },
  { code:'sel',     name:'Sel',     emo:'🌊', prob:0.0015, damage:0.20, regions:['Rize','Trabzon','Giresun','Ordu','Samsun','Sinop','Kastamonu','Bartın','Zonguldak','Artvin'] },
  { code:'yangin',  name:'Orman Yangını',emo:'🔥',prob:0.0020, damage:0.25, regions:['Antalya','Muğla','İzmir','Manisa','Aydın','Çanakkale','Adana','Mersin','Hatay'] },
  { code:'kuraklik',name:'Kuraklık',emo:'🌵', prob:0.0010, damage:0.15, regions:['Konya','Karaman','Aksaray','Niğde','Nevşehir','Şanlıurfa','Diyarbakır','Mardin'] },
  { code:'firtina', name:'Şiddetli Fırtına',emo:'🌪️',prob:0.0025, damage:0.10, regions:[] },  // her yere
];
window.DISASTERS = DISASTERS;

async function checkDisasters() {
  // 1 saatte bir kontrol
  const lastTick = await dbGet('disasters/_lastTick') || 0;
  if (Date.now() - lastTick < 3600 * 1000) return;
  const lockResult = await db.ref('disasters/_lastTick').transaction(c => {
    if (c && Date.now() - c < 3600 * 1000) return;
    return Date.now();
  });
  if (!lockResult.committed) return;

  for (const d of DISASTERS) {
    if (Math.random() < d.prob) {
      // Afet patladı!
      const targetRegions = d.regions.length ? d.regions : (window.ILLER || []);
      const city = targetRegions[Math.floor(Math.random() * targetRegions.length)];
      const disaster = {
        code: d.code, name: d.name, emo: d.emo,
        damage: d.damage, city,
        startedAt: Date.now(),
        endsAt: Date.now() + (4 + Math.random() * 20) * 3600 * 1000,
        affected: 0
      };
      await db.ref('disasters/active').push(disaster);
      await db.ref('disasters/history').push(disaster);

      // Etkilenen kullanıcılara bildirim
      // (Production'da: o şehirde tesisi/emlağı olan kullanıcılara mesaj)
    }
  }
}
window.checkDisasters = checkDisasters;


/* ════════════════════════════════════════════════════════════════════════════
   ████ 11. ÇALIŞAN YÖNETİMİ
   ──────────────────────────────────────────────────────────────────────────── */

const EMPLOYEE_POSITIONS = [
  { code:'isci',         name:'İşçi',                 emo:'👷', minSalary:8500,   maxSalary:14000,  productivityBonus:0.05, skills:['gen'] },
  { code:'usta',         name:'Usta İşçi',           emo:'🛠️', minSalary:14000,  maxSalary:22000,  productivityBonus:0.10, skills:['gen','uretim'] },
  { code:'muhasebeci',   name:'Muhasebeci',          emo:'📊', minSalary:18000,  maxSalary:32000,  productivityBonus:0.08, skills:['finans'] },
  { code:'pazarlamaci',  name:'Pazarlamacı',         emo:'📢', minSalary:16000,  maxSalary:30000,  productivityBonus:0.12, skills:['satis'] },
  { code:'guvenlik',     name:'Güvenlik',            emo:'🛡️', minSalary:11000,  maxSalary:18000,  productivityBonus:0.0,  skills:['guv'], theftReduce:0.5 },
  { code:'muhendis',     name:'Mühendis',            emo:'🔧', minSalary:35000,  maxSalary:60000,  productivityBonus:0.20, skills:['teknik'] },
  { code:'avukat',       name:'Avukat',              emo:'⚖️', minSalary:45000,  maxSalary:90000,  productivityBonus:0.0,  skills:['yasal'], lawsuitReduce:0.7 },
  { code:'CEO_yardimci', name:'CEO Yardımcısı',      emo:'🎩', minSalary:80000,  maxSalary:200000, productivityBonus:0.30, skills:['yonetim'] }
];
window.EMPLOYEE_POSITIONS = EMPLOYEE_POSITIONS;

async function hireEmployee(positionCode, salary) {
  const pos = EMPLOYEE_POSITIONS.find(p => p.code === positionCode);
  if (!pos) return { ok:false, msg:'Pozisyon yok' };
  if (salary < pos.minSalary) return { ok:false, msg:`Min maaş ₺${pos.minSalary.toLocaleString('tr-TR')}` };
  if (salary > pos.maxSalary) return { ok:false, msg:`Max maaş ₺${pos.maxSalary.toLocaleString('tr-TR')}` };

  // İşe alma ücreti (1 maaş)
  const ok = await spendCash(GZ.uid, salary, 'employee_hire');
  if (!ok) return { ok:false, msg:'Yetersiz bakiye (1 maaş peşin)' };

  const names = ['Ahmet Yılmaz','Mehmet Demir','Ayşe Kaya','Fatma Şahin','Mustafa Çelik','Zeynep Arslan',
                 'Ali Öztürk','Hatice Yıldız','Hüseyin Aydın','Emine Polat','İbrahim Doğan','Elif Çetin',
                 'Hasan Kara','Selin Akın','Burak Erdem','Deniz Sözer','Yiğit Korkmaz','Ceren Türk'];
  const surname = ['(deneyimli)','(yetenekli)','(motiveli)','(çalışkan)','(profesyonel)'][Math.floor(Math.random()*5)];

  const employee = {
    id: 'emp_' + Date.now(),
    name: names[Math.floor(Math.random()*names.length)] + ' ' + surname,
    position: positionCode, positionName: pos.name,
    salary, productivityBonus: pos.productivityBonus,
    morale: 70 + Math.floor(Math.random() * 20),  // 70-90
    hiredAt: Date.now(),
    nextSalaryDate: Date.now() + 30 * 24 * 3600 * 1000,
    skills: pos.skills,
    onStrike: false
  };
  await db.ref(`employees/${GZ.uid}`).push(employee);
  return { ok:true, employee };
}
window.hireEmployee = hireEmployee;

async function fireEmployee(empKey) {
  const emp = await dbGet(`employees/${GZ.uid}/${empKey}`);
  if (!emp) return { ok:false, msg:'Çalışan yok' };

  // Tazminat: 2 maaş
  const severance = emp.salary * 2;
  const ok = await spendCash(GZ.uid, severance, 'severance');
  if (!ok) return { ok:false, msg:`Tazminat ₺${severance.toLocaleString('tr-TR')} gerekli` };

  await db.ref(`employees/${GZ.uid}/${empKey}`).remove();
  return { ok:true, severance };
}
window.fireEmployee = fireEmployee;

async function payEmployeeSalaries() {
  const empSnap = await db.ref(`employees/${GZ.uid}`).once('value');
  const emps = empSnap.val() || {};
  let totalPaid = 0;
  for (const k of Object.keys(emps)) {
    const emp = emps[k];
    if (Date.now() < emp.nextSalaryDate) continue;
    const ok = await spendCash(GZ.uid, emp.salary, 'salary');
    if (!ok) {
      // Maaş ödenemedi → moral düşer, grev riski
      await db.ref(`employees/${GZ.uid}/${k}/morale`).transaction(c => Math.max(0, (c||50) - 20));
      const newMorale = (await dbGet(`employees/${GZ.uid}/${k}/morale`)) || 0;
      if (newMorale < 30 && Math.random() < 0.4) {
        await db.ref(`employees/${GZ.uid}/${k}/onStrike`).set(true);
      }
      continue;
    }
    totalPaid += emp.salary;
    await db.ref(`employees/${GZ.uid}/${k}/nextSalaryDate`).set(Date.now() + 30 * 24 * 3600 * 1000);
    // Moral artışı (zamanında maaş)
    await db.ref(`employees/${GZ.uid}/${k}/morale`).transaction(c => Math.min(100, (c||80) + 3));
  }
  return totalPaid;
}
window.payEmployeeSalaries = payEmployeeSalaries;


/* ════════════════════════════════════════════════════════════════════════════
   ████ 12. AR-GE / TEKNOLOJİ AĞACI
   ──────────────────────────────────────────────────────────────────────────── */

const TECH_TREE = {
  'tarim_t1': { name:'Modern Tarım Aletleri',cost:50000,    days:3,  prereq:[],          effect:{tarimMult:1.10}, desc:'Bahçe üretiminde +%10' },
  'tarim_t2': { name:'Sera Teknolojisi',     cost:250000,   days:7,  prereq:['tarim_t1'],effect:{tarimMult:1.25}, desc:'Bahçe üretiminde +%25' },
  'tarim_t3': { name:'GMO Tohumlar',         cost:1500000,  days:15, prereq:['tarim_t2'],effect:{tarimMult:1.50}, desc:'Bahçe üretiminde +%50' },
  'hayvan_t1':{ name:'Otomatik Sağım',       cost:75000,    days:4,  prereq:[],          effect:{ciftlikMult:1.15}, desc:'Çiftlik üretiminde +%15' },
  'hayvan_t2':{ name:'Genetik Yem',          cost:400000,   days:8,  prereq:['hayvan_t1'],effect:{ciftlikMult:1.30}, desc:'Çiftlik üretiminde +%30' },
  'fab_t1':   { name:'Otomasyon Robotları',  cost:300000,   days:7,  prereq:[],          effect:{fabrikaMult:1.20}, desc:'Fabrika üretiminde +%20' },
  'fab_t2':   { name:'AI Yapılandırma',      cost:1800000,  days:14, prereq:['fab_t1'],  effect:{fabrikaMult:1.40}, desc:'Fabrika üretiminde +%40' },
  'fab_t3':   { name:'Kuantum Endüstri',     cost:8500000,  days:30, prereq:['fab_t2'],  effect:{fabrikaMult:1.80}, desc:'Fabrika üretiminde +%80' },
  'maden_t1': { name:'Sismik Tarama',        cost:600000,   days:10, prereq:[],          effect:{madenMult:1.20}, desc:'Maden üretiminde +%20' },
  'maden_t2': { name:'Derin Sondaj',         cost:3500000,  days:18, prereq:['maden_t1'],effect:{madenMult:1.50}, desc:'Maden üretiminde +%50' },
  'lojistik': { name:'Drone Teslimat',       cost:1200000,  days:12, prereq:[],          effect:{lojistikSpeed:1.5}, desc:'Sevkiyat hızı +%50' },
  'pazarlama':{ name:'Dijital Pazarlama',    cost:200000,   days:5,  prereq:[],          effect:{satisMult:1.15}, desc:'Tüm satışlar +%15' },
  'finans':   { name:'Algoritma Trade',      cost:5000000,  days:20, prereq:['pazarlama'],effect:{tradeProfit:1.25}, desc:'Hisse/kripto karı +%25' },
};
window.TECH_TREE = TECH_TREE;

async function startResearch(techCode) {
  const tech = TECH_TREE[techCode];
  if (!tech) return { ok:false, msg:'Teknoloji yok' };

  const research = await dbGet(`rd_tech/${GZ.uid}`) || {};
  if (research[techCode] && research[techCode].status === 'completed') return { ok:false, msg:'Zaten tamamlandı' };
  if (research[techCode] && research[techCode].status === 'in_progress') return { ok:false, msg:'Zaten araştırılıyor' };

  // Önkoşul kontrolü
  for (const pre of tech.prereq) {
    if (!research[pre] || research[pre].status !== 'completed') {
      return { ok:false, msg:`Önce gerekli: ${TECH_TREE[pre].name}` };
    }
  }

  const ok = await spendCash(GZ.uid, tech.cost, 'rd_research');
  if (!ok) return { ok:false, msg:`Yetersiz bakiye (₺${tech.cost.toLocaleString('tr-TR')})` };

  await db.ref(`rd_tech/${GZ.uid}/${techCode}`).set({
    code: techCode, name: tech.name,
    status: 'in_progress',
    startedAt: Date.now(),
    completesAt: Date.now() + tech.days * 24 * 3600 * 1000
  });
  return { ok:true };
}
window.startResearch = startResearch;

async function checkResearchCompletion() {
  const research = await dbGet(`rd_tech/${GZ.uid}`) || {};
  for (const code of Object.keys(research)) {
    if (research[code].status === 'in_progress' && Date.now() >= research[code].completesAt) {
      await db.ref(`rd_tech/${GZ.uid}/${code}/status`).set('completed');
      await db.ref(`rd_tech/${GZ.uid}/${code}/completedAt`).set(Date.now());
      await db.ref('notifs/' + GZ.uid).push({
        type:'research', icon:'🔬',
        msg:`🔬 Araştırma tamamlandı: ${research[code].name}`,
        ts: firebase.database.ServerValue.TIMESTAMP, read:false
      });
      await addXP(GZ.uid, 200);
    }
  }
}
window.checkResearchCompletion = checkResearchCompletion;


/* ════════════════════════════════════════════════════════════════════════════
   ████ 13. EĞİTİM MERKEZİ
   ──────────────────────────────────────────────────────────────────────────── */

const COURSES = [
  { code:'business_101', name:'İşletme Temelleri', cost:5000,  days:1, branch:'genel',   bonus:{xpRate:1.05}, desc:'XP +%5' },
  { code:'sales_pro',    name:'Satış Profesyonelliği',cost:25000,days:3, branch:'satis',  bonus:{satisMult:1.05}, desc:'Tüm satışlar +%5' },
  { code:'finance_adv',  name:'İleri Finans',     cost:75000, days:5, branch:'finans',   bonus:{tradeFee:0.8},  desc:'Komisyonlar -%20' },
  { code:'tech_lead',    name:'Tech Liderliği',   cost:150000,days:7, branch:'teknik',   bonus:{rdSpeed:1.3},   desc:'AR-GE %30 hızlı' },
  { code:'mba',          name:'MBA',              cost:500000,days:14,branch:'yonetim',  bonus:{empProd:1.10},  desc:'Çalışan verimliliği +%10' },
  { code:'crypto_master',name:'Kripto Uzmanı',    cost:200000,days:6, branch:'finans',   bonus:{cryptoFee:0.5}, desc:'Kripto komisyonu yarıya' },
  { code:'real_estate',  name:'Emlak Yatırımı',   cost:120000,days:5, branch:'finans',   bonus:{rentMult:1.15}, desc:'Kira gelirleri +%15' },
  { code:'logistics',    name:'Lojistik Optimizasyonu',cost:80000,days:4,branch:'teknik',bonus:{shipCost:0.85}, desc:'Nakliye %15 ucuz' },
  { code:'leadership',   name:'Liderlik',         cost:300000,days:10,branch:'yonetim',  bonus:{empMorale:1.15},desc:'Çalışan morali +%15' },
  { code:'marketing_adv',name:'İleri Pazarlama',  cost:100000,days:5, branch:'satis',    bonus:{ihaleAdv:1.10}, desc:'İhalelerde +%10 avantaj' }
];
window.COURSES = COURSES;

async function enrollCourse(code) {
  const course = COURSES.find(c => c.code === code);
  if (!course) return { ok:false, msg:'Kurs yok' };
  const edu = await dbGet(`education/${GZ.uid}`) || {};
  if (edu[code]) return { ok:false, msg:'Zaten kayıtlısın/tamamlandı' };

  const ok = await spendCash(GZ.uid, course.cost, 'education');
  if (!ok) return { ok:false, msg:`Yetersiz bakiye ₺${course.cost.toLocaleString('tr-TR')}` };

  await db.ref(`education/${GZ.uid}/${code}`).set({
    code, name: course.name,
    status: 'in_progress',
    startedAt: Date.now(),
    completesAt: Date.now() + course.days * 24 * 3600 * 1000
  });
  return { ok:true };
}
window.enrollCourse = enrollCourse;


/* ════════════════════════════════════════════════════════════════════════════
   ████ 14. SÖZLEŞME SİSTEMİ
   ──────────────────────────────────────────────────────────────────────────── */

async function createContract(targetUid, contractType, terms) {
  // contractType: 'tedarik', 'satis', 'ortak_yatirim', 'isbirligi'
  const contract = {
    id: 'ct_' + Date.now(),
    creator: GZ.uid, creatorName: GZ.data.username,
    target: targetUid,
    type: contractType,
    terms,  // { product, qtyPerWeek, pricePerUnit, durationWeeks, ... }
    status: 'pending',
    createdAt: firebase.database.ServerValue.TIMESTAMP,
    expiresAt: Date.now() + 7 * 24 * 3600 * 1000  // 7 gün karar süresi
  };
  await db.ref('contracts').push(contract);

  // Hedef kullanıcıya bildirim
  await db.ref('notifs/' + targetUid).push({
    type:'contract_offer', icon:'📝',
    msg:`${GZ.data.username} sana sözleşme önerdi: ${contractType}`,
    ts: firebase.database.ServerValue.TIMESTAMP, read:false
  });
  return { ok:true };
}
window.createContract = createContract;

async function acceptContract(contractKey) {
  const ct = await dbGet('contracts/' + contractKey);
  if (!ct) return { ok:false, msg:'Sözleşme yok' };
  if (ct.target !== GZ.uid) return { ok:false, msg:'Bu sözleşme sana değil' };
  if (ct.status !== 'pending') return { ok:false, msg:'Sözleşme zaten kapanmış' };
  if (Date.now() > ct.expiresAt) return { ok:false, msg:'Sözleşme süresi doldu' };

  await db.ref('contracts/' + contractKey + '/status').set('active');
  await db.ref('contracts/' + contractKey + '/acceptedAt').set(Date.now());
  return { ok:true };
}
window.acceptContract = acceptContract;


/* ════════════════════════════════════════════════════════════════════════════
   ████ 15. BELEDİYE SEÇİM SİSTEMİ
   ──────────────────────────────────────────────────────────────────────────── */

async function runForMayor(cityName, manifesto, taxPolicy) {
  // taxPolicy: 0.0-0.20 (vergi oranı)
  if (taxPolicy < 0 || taxPolicy > 0.20) return { ok:false, msg:'Vergi %0-20 arası' };
  if ((GZ.data.level||1) < 30) return { ok:false, msg:'Min Lv 30 gerekli' };
  if ((GZ.data.netWorth||0) < 1000000) return { ok:false, msg:'Min ₺1M servet gerekli' };

  // Kampanya ücreti: 50.000 ₺
  const ok = await spendCash(GZ.uid, 50000, 'mayor_campaign');
  if (!ok) return { ok:false, msg:'₺50.000 kampanya ücreti gerekli' };

  const election = await dbGet('city_mayor/elections/' + cityName) || { candidates: {}, votes: {}, endsAt: Date.now() + 7 * 24 * 3600 * 1000 };
  election.candidates[GZ.uid] = {
    uid: GZ.uid, name: GZ.data.username,
    manifesto, taxPolicy,
    registeredAt: Date.now()
  };
  if (!election.endsAt) election.endsAt = Date.now() + 7 * 24 * 3600 * 1000;
  await db.ref('city_mayor/elections/' + cityName).set(election);
  return { ok:true };
}
window.runForMayor = runForMayor;

async function voteForMayor(cityName, candidateUid) {
  const voteRef = db.ref(`city_mayor/votes/${cityName}/${GZ.uid}`);
  const existingVote = await voteRef.once('value');
  if (existingVote.val()) return { ok:false, msg:'Zaten oy verdin' };

  await voteRef.set({ candidateUid, ts: Date.now() });
  await db.ref(`city_mayor/elections/${cityName}/votes/${candidateUid}`).transaction(c => (c||0) + 1);
  return { ok:true };
}
window.voteForMayor = voteForMayor;


/* ════════════════════════════════════════════════════════════════════════════
   ████ 16. TİCARET SAVAŞLARI
   ──────────────────────────────────────────────────────────────────────────── */

async function declareTradeWar(targetUid, durationDays, weaponType) {
  // weaponType: 'fiyat_dampingi', 'boykot', 'reklam_savasi', 'lobi'
  if ((GZ.data.netWorth||0) < 500000) return { ok:false, msg:'Min ₺500K servet gerekli' };

  const cost = 100000;
  const ok = await spendCash(GZ.uid, cost, 'trade_war');
  if (!ok) return { ok:false, msg:'₺100K savaş ilanı ücreti gerekli' };

  const war = {
    id: 'tw_' + Date.now(),
    aggressor: GZ.uid, aggressorName: GZ.data.username,
    target: targetUid,
    weapon: weaponType,
    declaredAt: Date.now(),
    endsAt: Date.now() + durationDays * 24 * 3600 * 1000,
    status: 'active',
    aggressorScore: 0, targetScore: 0
  };
  await db.ref('trade_war/active').push(war);

  await db.ref('notifs/' + targetUid).push({
    type:'trade_war', icon:'⚔️',
    msg:`⚔️ ${GZ.data.username} sana ticaret savaşı ilan etti! (${weaponType})`,
    ts: firebase.database.ServerValue.TIMESTAMP, read:false
  });

  return { ok:true };
}
window.declareTradeWar = declareTradeWar;


/* ════════════════════════════════════════════════════════════════════════════
   ████ 17. DÜELLO (1v1 Ticaret)
   ──────────────────────────────────────────────────────────────────────────── */

async function createDuel(opponentUid, betAmount, durationMinutes) {
  if (betAmount < 10000) return { ok:false, msg:'Min bahis ₺10.000' };
  if (durationMinutes < 5 || durationMinutes > 60) return { ok:false, msg:'5-60 dk arası' };

  const ok = await spendCash(GZ.uid, betAmount, 'duel_bet');
  if (!ok) return { ok:false, msg:'Yetersiz bakiye' };

  const duel = {
    id: 'du_' + Date.now(),
    creator: GZ.uid, creatorName: GZ.data.username,
    opponent: opponentUid,
    betAmount, escrow: betAmount,
    durationMinutes,
    status: 'pending',
    createdAt: Date.now(),
    expiresAt: Date.now() + 30 * 60 * 1000  // 30 dk kabul süresi
  };
  await db.ref('duels/active').push(duel);

  await db.ref('notifs/' + opponentUid).push({
    type:'duel_challenge', icon:'🤜',
    msg:`🤜 ${GZ.data.username} seni düelloya çağırdı! Bahis: ₺${betAmount.toLocaleString('tr-TR')}`,
    ts: firebase.database.ServerValue.TIMESTAMP, read:false
  });
  return { ok:true };
}
window.createDuel = createDuel;

async function acceptDuel(duelKey) {
  const duel = await dbGet('duels/active/' + duelKey);
  if (!duel) return { ok:false, msg:'Düello yok' };
  if (duel.opponent !== GZ.uid) return { ok:false, msg:'Senin düellon değil' };
  if (duel.status !== 'pending') return { ok:false, msg:'Düello kabul edilemez' };

  const ok = await spendCash(GZ.uid, duel.betAmount, 'duel_bet');
  if (!ok) return { ok:false, msg:'Yetersiz bakiye' };

  await db.ref('duels/active/' + duelKey).update({
    status:'in_progress',
    startedAt: Date.now(),
    endsAt: Date.now() + duel.durationMinutes * 60 * 1000,
    escrow: duel.betAmount * 2,
    creatorScore: 0, opponentScore: 0
  });
  return { ok:true };
}
window.acceptDuel = acceptDuel;


/* ════════════════════════════════════════════════════════════════════════════
   ████ 24. TICK ORCHESTRATOR
   ──────────────────────────────────────────────────────────────────────────── */

let _v2Intervals = [];

function initV2Systems() {
  if (_v2Intervals.length > 0) return;
  _v2Intervals.push(setInterval(() => tickStockPrices().catch(()=>{}), 60000));
  _v2Intervals.push(setInterval(() => tickWeather().catch(()=>{}), 30 * 60 * 1000));
  _v2Intervals.push(setInterval(() => checkDisasters().catch(()=>{}), 60 * 60 * 1000));
  _v2Intervals.push(setInterval(() => distributeDividends().catch(()=>{}), 60 * 60 * 1000));
  _v2Intervals.push(setInterval(() => processBondCoupons().catch(()=>{}), 60 * 60 * 1000));
  _v2Intervals.push(setInterval(() => processIntlShipments().catch(()=>{}), 5 * 60 * 1000));
  _v2Intervals.push(setInterval(() => checkResearchCompletion().catch(()=>{}), 5 * 60 * 1000));
  _v2Intervals.push(setInterval(() => payEmployeeSalaries().catch(()=>{}), 60 * 60 * 1000));

  setTimeout(() => tickStockPrices().catch(()=>{}), 3000);
  setTimeout(() => tickWeather().catch(()=>{}), 5000);
  setTimeout(() => checkDisasters().catch(()=>{}), 8000);
}
window.initV2Systems = initV2Systems;

if (typeof auth !== 'undefined') {
  auth.onAuthStateChanged(u => { if (u) setTimeout(initV2Systems, 5000); });
}
