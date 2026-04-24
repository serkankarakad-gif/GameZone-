/* ============================================================
   GAME ZONE ERP — ui-manager.js
   Page navigation, rendering, tab switching, modal management,
   topbar, shop detail, tesis panels, kripto, bank, etc.
   ============================================================ */

'use strict';

/* ================================================================
   SCREEN ROUTING
   ================================================================ */
function showScreen(id) {
  ['welcome', 'login', 'register', 'forgot'].forEach(s => {
    const el = document.getElementById(s);
    if (el) el.style.display = 'none';
  });
  const el = document.getElementById(id);
  if (el) {
    el.style.display = 'flex';
    // animation
    el.style.opacity = '0';
    setTimeout(() => { el.style.transition = 'opacity 0.3s'; el.style.opacity = '1'; }, 10);
  }
}

function openLogin()    { showScreen('login');    }
function openRegister() { showScreen('register'); }
function openForgot()   { showScreen('forgot');   }

/* ================================================================
   MAIN APP INIT
   ================================================================ */
function showMain(isNew = false) {
  if (typeof hideLS === 'function') hideLS();
  if (typeof hideNoNet === 'function') hideNoNet();
  ['welcome', 'login', 'register', 'forgot'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.display = 'none';
  });
  const mainEl = document.getElementById('main');
  if (mainEl) mainEl.classList.add('active');

  // Ensure state defaults
  if (!state.tesisler) state.tesisler = { bahce: [], ciftlik: [], fabrika: [], maden: [] };
  ['bahce', 'ciftlik', 'fabrika', 'maden'].forEach(k => {
    if (!state.tesisler[k]) state.tesisler[k] = [];
  });
  if (!state.depolar) state.depolar = [];
  if (!state.kripto) state.kripto = {};
  if (!state.kriptoHistory) state.kriptoHistory = [];
  if (!state.exportOrders || !state.exportOrders.length) {
    if (typeof generateExportOrders === 'function') generateExportOrders();
  }
  if (!state.pazarListings) state.pazarListings = [];

  // Kick ihale
  if (typeof generateIhaleler === 'function') generateIhaleler();

  renderAll();
  if (typeof checkBanned === 'function') checkBanned();

  const av = document.getElementById('chat-av-display');
  if (av) av.textContent = state.user?.name ? state.user.name[0].toUpperCase() : '🙂';

  setTimeout(() => {
    if (typeof initRealtimeChat === 'function') initRealtimeChat();
  }, 800);

  if (isNew || (state.user && state.user.isNew)) {
    setTimeout(() => openModal('welcome-modal'), 600);
  }
}

function closeWelcomeModal() {
  closeModal('welcome-modal');
  if (state.user) state.user.isNew = false;
  if (typeof saveState === 'function') saveState();
  if (typeof confetti === 'function') confetti();
}

/* ================================================================
   MODAL HELPERS
   ================================================================ */
function openModal(id) {
  const el = document.getElementById(id);
  if (el) el.classList.add('active');
}

function closeModal(id) {
  const el = document.getElementById(id);
  if (el) el.classList.remove('active');
}

/* ================================================================
   TOPBAR
   ================================================================ */
function renderTopbar() {
  const s = window.state;
  const lvlEl = document.getElementById('level-num');
  if (lvlEl) lvlEl.textContent = s.level;

  const cap = s.level * 500;
  const xpTextEl = document.getElementById('xp-text');
  if (xpTextEl) xpTextEl.textContent = s.xp + '/' + cap;

  const xpFill = document.getElementById('xp-fill');
  if (xpFill) xpFill.style.width = (Math.min(s.xp / cap, 1) * 100) + '%';

  const diaEl = document.getElementById('diamond-count');
  if (diaEl) diaEl.textContent = s.diamonds || 0;

  const moneyEl = document.getElementById('money-count');
  if (moneyEl) moneyEl.textContent = fmt(s.money) + ' ₺';

  const unread = (s.notifications || []).filter(n => !n.read).length;
  const badge = document.getElementById('notif-badge');
  if (badge) { badge.textContent = unread; badge.style.display = unread > 0 ? 'grid' : 'none'; }

  const cc = document.getElementById('coupon-cnt');
  if (cc) cc.textContent = s.coupons || 0;

  const tb = document.getElementById('tycoon-bal');
  if (tb) tb.textContent = fmt(s.money) + ' ₺';
}

/* ================================================================
   NAVIGATION
   ================================================================ */
let currentNav = 'isletme';

function toggleNav() {
  if (currentNav === 'isletme') {
    currentNav = 'piyasa';
    const ni = document.getElementById('nav-isletme');
    const np = document.getElementById('nav-piyasa');
    if (ni) ni.style.display = 'none';
    if (np) np.style.display = 'flex';
    switchTab('nakit');
  } else {
    currentNav = 'isletme';
    const ni = document.getElementById('nav-isletme');
    const np = document.getElementById('nav-piyasa');
    if (ni) ni.style.display = 'flex';
    if (np) np.style.display = 'none';
    switchTab('dukkanlar');
  }
}

function switchTab(tab) {
  document.querySelectorAll('.bottomnav .nav-item').forEach(b => b.classList.remove('active'));
  const btn = document.querySelector(`.nav-item[data-tab="${tab}"]`);
  if (btn) btn.classList.add('active');
  document.querySelectorAll('.page').forEach(p => { p.classList.remove('active'); p.style.display = 'none'; });
  const pg = document.getElementById('page-' + tab);
  if (pg) { pg.style.removeProperty('display'); pg.classList.add('active'); }
  const ca = document.getElementById('content-area');
  if (ca) ca.scrollTop = 0;
  renderAll();
}

function openPage(id) {
  document.querySelectorAll('.page').forEach(p => { p.classList.remove('active'); p.style.display = 'none'; });
  const pg = document.getElementById('page-' + id);
  if (pg) { pg.style.removeProperty('display'); pg.classList.add('active'); }
  const ca = document.getElementById('content-area');
  if (ca) ca.scrollTop = 0;
  renderAll();
}

function backToMain() {
  if (currentNav === 'isletme') switchTab('dukkanlar');
  else switchTab('nakit');
}

/* ================================================================
   RENDER ALL
   ================================================================ */
function renderAll() {
  renderTopbar();
  const active = document.querySelector('.page.active');
  if (!active) return;
  const id = active.id.replace('page-', '');
  const map = {
    dukkanlar:    renderShops,
    bahceler:     renderBahceler,
    ciftlikler:   renderCiftlikler,
    fabrikalar:   renderFabrikalar,
    madenler:     renderMadenler,
    bank:         renderBank,
    profile:      renderProfile,
    notifications: renderNotifications,
    ranking:      renderRanking,
    nakit:        renderNakitTycoon,
    lojistik:     renderLojistik,
    ihracat:      renderIhracat,
    ihale:        renderIhale,
    kripto:       renderKriptoPage,
    marka:        renderMarka,
    news:         renderNews,
    cities:       renderCities,
    faq:          renderFaq,
    settings:     renderSettings,
    pazar:        renderPazar,
    chat:         renderChatPage,
    menu:         renderMenu
  };
  if (map[id]) map[id]();
}

/* ================================================================
   SHOPS
   ================================================================ */
function renderShops() {
  const body = document.getElementById('dukkanlar-body');
  if (!body) return;
  if (!state.shops.length) {
    body.innerHTML = `
      <div class="empty">
        <div class="empty-lock">🏪</div>
        <div class="empty-big">Henüz işletmeniz yok</div>
        <div class="empty-text">İlk dükkanını aç ve para kazanmaya başla!</div>
        <button class="btn-create" onclick="openShopModal()">+ Yeni Dükkan Aç</button>
      </div>`;
    return;
  }
  body.innerHTML = state.shops.map((s, i) => {
    const t = SHOP_TYPES.find(x => x.id === s.type);
    const c = CITIES.find(x => x.id === s.cityId);
    const reyonlar = s.reyonlar || [];
    const totalStock = reyonlar.reduce((a, r) => a + (r.stock || 0), 0);
    const stokUyarisi = reyonlar.length > 0 && totalStock <= 0;
    const elapsed = (Date.now() - (s.lastCollect || Date.now())) / 3600000;
    const pending = Math.floor(t.income * (s.lvl || 1) * Math.min(8, elapsed) * (c?.mult || 1));
    return `
      <div class="card" style="cursor:pointer" onclick="openShopDetail(${i})">
        <div class="card-header">
          <div class="card-icon cat-${t.cat}">${t.emoji}</div>
          <div style="flex:1">
            <div class="card-title">${t.name}</div>
            <div class="card-sub">${c?.name || '—'} · Sv${s.lvl || 1}${stokUyarisi ? ' · ⚠️ Stok Yok!' : ' · Stok: ' + totalStock}</div>
          </div>
          <div style="text-align:right">
            <div style="font-size:10px;color:var(--tm)">Birikmiş</div>
            <div style="font-weight:800;color:var(--neon)">${fmt(pending)} ₺</div>
          </div>
        </div>
        <div style="display:flex;gap:8px">
          <button class="btn-green" style="flex:1;padding:10px" onclick="event.stopPropagation();collectIncome(${i})">💰 Topla</button>
          <button class="btn-yellow" style="flex:1;padding:10px" onclick="event.stopPropagation();upgradeShop(${i})">⬆️ Yükselt</button>
        </div>
      </div>`;
  }).join('') + `<div style="padding:12px"><button class="btn-create" style="width:100%" onclick="openShopModal()">+ Yeni Dükkan Aç</button></div>`;
}

function openShopModal() { openModal('shop-modal'); renderShopModal(); }

function renderShopModal() {
  const grid = document.getElementById('shop-modal-grid');
  if (!grid) return;
  grid.innerHTML = SHOP_TYPES.map(t => {
    const locked = state.level < t.minLvl;
    return `
      <div class="shop-tile ${locked ? 'shop-tile--locked' : ''}" onclick="${locked ? '' : `selectShopType('${t.id}')`}" style="${locked ? 'opacity:0.4' : ''}">
        <div class="shop-tile-icon cat-${t.cat}">${t.emoji}</div>
        <div class="shop-tile-name">${t.name}</div>
        <div class="shop-tile-lvl">${locked ? '🔒 Sv' + t.minLvl : fmt(t.price) + ' ₺'}</div>
      </div>`;
  }).join('');
}

let _selectedShopType = null;
function selectShopType(id) {
  _selectedShopType = id;
  document.querySelectorAll('.shop-tile').forEach(el => el.style.outline = 'none');
  const t = SHOP_TYPES.find(x => x.id === id);
  toast(t.name + ' seçildi. Şehir seçin!', '');
  renderShopCitySelect(id);
}

function renderShopCitySelect(typeId) {
  const sel = document.getElementById('shop-city-sel');
  if (!sel) return;
  sel.innerHTML = '<option value="">Şehir seçin</option>' +
    CITIES.map(c => `<option value="${c.id}">${c.emoji} ${c.name}</option>`).join('');
  const step2 = document.getElementById('shop-step2');
  if (step2) step2.style.display = 'block';
}

function confirmShopBuy() {
  const city = document.getElementById('shop-city-sel')?.value;
  if (!_selectedShopType || !city) { toast('Tür ve şehir seçin', 'error'); return; }
  buyShop(_selectedShopType, city);
  _selectedShopType = null;
}

function openShopDetail(i) {
  const s = state.shops[i];
  const t = SHOP_TYPES.find(x => x.id === s.type);
  const c = CITIES.find(x => x.id === s.cityId);
  _currentShopIdx = i;
  document.getElementById('detail-title').textContent = t.name;
  document.getElementById('detail-city').textContent = c?.name || '—';
  document.getElementById('detail-lvl').textContent = 'Sv' + (s.lvl || 1);
  renderReyonList(i);
  openModal('shop-detail-modal');
}

let _currentShopIdx = null;

function renderReyonList(i) {
  const s = state.shops[i];
  const body = document.getElementById('reyon-list-body');
  if (!body) return;
  const reyonlar = s.reyonlar || [];
  if (!reyonlar.length) {
    body.innerHTML = '<div style="padding:20px;text-align:center;color:var(--tm)">Henüz reyon yok. Reyon ekle!</div>';
    return;
  }
  body.innerHTML = reyonlar.map((r, ri) => `
    <div class="reyon-card">
      <div class="reyon-icon">${r.emoji || '📦'}</div>
      <div class="reyon-info">
        <div class="reyon-name">${r.name}</div>
        <div class="reyon-meta">Stok: ${r.stock || 0} · Maliyet: ${fmt(r.cost)} ₺ · Satış: ${fmt(r.price)} ₺</div>
      </div>
      <div class="reyon-actions">
        <button class="reyon-btn" onclick="buyStock(${i},${ri})">📦</button>
        <button class="reyon-btn red" onclick="removeReyon(${i},${ri})">🗑️</button>
      </div>
    </div>`).join('');
}

function addReyonToShop(catName) {
  if (_currentShopIdx === null) return;
  const s = state.shops[_currentShopIdx];
  if (!s.reyonlar) s.reyonlar = [];
  const products = REYON_PRODUCTS[catName];
  if (!products) return;
  const reyonNames = {
    'Temel Gıda': 'Temel Gıda Reyon', 'Kahvaltılık': 'Kahvaltılık Reyon',
    'Meyve & Sebze': 'Meyve & Sebze Reyon', 'Et Ürünleri': 'Et Ürünleri Reyon',
    'İçecek': 'İçecek Reyonu', 'Temizlik': 'Temizlik Reyonu'
  };
  s.reyonlar.push({ name: reyonNames[catName] || catName, cat: catName, emoji: products[0]?.emoji || '📦', stock: 0, cost: products[0].basePrice, price: parseFloat((products[0].basePrice * 2.5).toFixed(2)) });
  if (typeof saveState === 'function') saveState();
  renderReyonList(_currentShopIdx);
  toast(reyonNames[catName] + ' eklendi!', 'success');
}

function removeReyon(shopIdx, reyonIdx) {
  state.shops[shopIdx].reyonlar.splice(reyonIdx, 1);
  if (typeof saveState === 'function') saveState();
  renderReyonList(shopIdx);
}

function buyStock(shopIdx, reyonIdx) {
  const r = state.shops[shopIdx].reyonlar[reyonIdx];
  const qty = 100;
  const cost = r.cost * qty;
  if (state.money < cost) { toast('Yetersiz para! ' + fmt(cost) + ' ₺ gerekli', 'error'); return; }
  state.money -= cost;
  r.stock = (r.stock || 0) + qty;
  window._lastMoney = state.money;
  window._lastCheck = Date.now();
  if (typeof saveState === 'function') saveState();
  renderTopbar();
  renderReyonList(shopIdx);
  toast('+' + qty + ' stok alındı 📦', 'success');
}

/* ================================================================
   BAHÇELER
   ================================================================ */
/* ================================================================
   TESİS DETAY MODAL
   ================================================================ */
function openTesisDetail(type, i) {
  const typeMap = { bahce: BAHCE_TYPES, ciftlik: CIFTLIK_TYPES, fabrika: FABRIKA_TYPES, maden: MADEN_TYPES };
  const items = state.tesisler[type];
  const item = items[i];
  if (!item) return;
  const def = (typeMap[type] || []).find(x => x.id === item.id);
  if (!def) return;

  const modal = document.getElementById('tesis-detail-modal');
  if (!modal) { toast(def.name + ' — Sv' + (item.lvl || 1), ''); return; }

  document.getElementById('td-title').textContent = def.emoji + ' ' + def.name;

  const rem = (def.hasat !== undefined)
    ? Math.max(0, def.hasat - Math.floor((Date.now() - (item.lastHasat || 0)) / 1000))
    : 0;
  const ready = rem === 0;
  const stock = item.stock || 0;
  const upgCost = fmt(Math.floor(def.price * (item.lvl || 1) * 0.4));

  document.getElementById('td-body').innerHTML = `
    <div style="text-align:center;padding:16px 0;border-bottom:1px solid var(--br);margin-bottom:14px">
      <div style="font-size:56px;margin-bottom:8px">${def.emoji}</div>
      <div style="font-size:20px;font-weight:900">${def.name}</div>
      <div style="font-size:12px;color:var(--tm);margin-top:4px">Seviye ${item.lvl || 1}</div>
    </div>

    <div class="row"><span class="row-label">Ürün</span><span class="row-value">${def.urun}</span></div>
    <div class="row"><span class="row-label">Stok</span><span class="row-value yellow">${stock} ${def.unit}</span></div>
    <div class="row"><span class="row-label">Satış Fiyatı</span><span class="row-value green">${fmt(def.sellPrice)} ₺/${def.unit}</span></div>
    ${def.hasat !== undefined ? `<div class="row"><span class="row-label">Hasat Kalan</span><span class="row-value ${ready ? 'green' : ''}">${ready ? '✅ HAZIR' : fmtTime(rem)}</span></div>` : ''}
    <div class="row"><span class="row-label">Hasat Miktarı</span><span class="row-value">${def.yield} ${def.unit}/hasat</span></div>
    ${def.input ? `<div class="row"><span class="row-label">Üretim</span><span class="row-value">${def.input} → ${def.output}</span></div>` : ''}

    <div style="margin-top:14px;padding:10px;background:rgba(16,185,129,.06);border-radius:12px;border:1px solid rgba(16,185,129,.2);font-size:12px;color:var(--tm)">
      💡 Bu tesiste ürettiğin ${def.urun}'i <b style="color:var(--neon)">İhracat</b> sayfasından yurt dışına sat!
    </div>

    <div style="display:flex;gap:8px;margin-top:14px">
      ${ready && def.hasat !== undefined ? `<button class="btn-green" style="flex:1" onclick="hasat('${type}',${i});renderAll();closeModal('tesis-detail-modal')">🌿 Hasat Al</button>` : ''}
      <button class="btn-yellow" style="flex:1" onclick="upgradeTesis('${type}',${i});closeModal('tesis-detail-modal')">⬆️ Yükselt — ${upgCost} ₺</button>
    </div>`;

  openModal('tesis-detail-modal');
}
window.openTesisDetail = openTesisDetail;

function renderBahceler() {
  const body = document.getElementById('bahceler-body');
  if (!body) return;
  const items = state.tesisler.bahce || [];
  if (!items.length) {
    body.innerHTML = `
      <div class="empty">
        <div class="empty-lock">🌿</div>
        <div class="empty-big">Henüz bahçeniz yok</div>
        <div class="empty-text">Zeytin, fındık, elma bahçesi kur. Hasat yap, kazan!</div>
        <button class="btn-create" onclick="openTesisModal('bahce')">+ Yeni Bahçe Kur</button>
      </div>`;
    return;
  }
  body.innerHTML = items.map((item, i) => {
    const def = BAHCE_TYPES.find(x => x.id === item.id);
    if (!def) return '';
    const rem = Math.max(0, def.hasat - Math.floor((Date.now() - (item.lastHasat || 0)) / 1000));
    const ready = rem === 0;
    return `
      <div class="card" onclick="openTesisDetail('bahce',${i})" style="cursor:pointer">
        <div class="card-header">
          <div class="card-icon cat-bahce">${def.emoji}</div>
          <div style="flex:1">
            <div class="card-title">${def.name}</div>
            <div class="card-sub">Sv${item.lvl || 1} · Stok: ${item.stock || 0} ${def.unit}</div>
          </div>
        </div>
        <div class="row">
          <span class="row-label">Hasat Süresi</span>
          <span class="row-value">${fmtTime(def.hasat)}</span>
        </div>
        <div class="row">
          <span class="row-label">Kalan</span>
          <span class="row-value ${ready ? 'green' : ''}">${ready ? '✅ HAZIR' : fmtTime(rem)}</span>
        </div>
        <div style="display:flex;gap:8px;margin-top:8px">
          <button class="btn-green" style="flex:1" onclick="hasat('bahce',${i})" ${!ready ? 'disabled style="opacity:0.5;cursor:not-allowed"' : ''}>🌿 Hasat Al</button>
          <button class="btn-yellow" style="flex:1" onclick="upgradeTesis('bahce',${i})">⬆️ Yükselt</button>
        </div>
      </div>`;
  }).join('') + `<div style="padding:12px"><button class="btn-create" style="width:100%" onclick="openTesisModal('bahce')">+ Yeni Bahçe Kur</button></div>`;
}

/* ================================================================
   ÇİFTLİKLER
   ================================================================ */
function renderCiftlikler() {
  const body = document.getElementById('ciftlikler-body');
  if (!body) return;
  const items = state.tesisler.ciftlik || [];
  if (!items.length) {
    body.innerHTML = `
      <div class="empty">
        <div class="empty-lock">🐄</div>
        <div class="empty-big">Henüz çiftliğiniz yok</div>
        <div class="empty-text">Süt, yumurta, bal çiftliği kur!</div>
        <button class="btn-create" onclick="openTesisModal('ciftlik')">+ Yeni Çiftlik Kur</button>
      </div>`;
    return;
  }
  body.innerHTML = items.map((item, i) => {
    const def = CIFTLIK_TYPES.find(x => x.id === item.id);
    if (!def) return '';
    const rem = Math.max(0, def.hasat - Math.floor((Date.now() - (item.lastHasat || 0)) / 1000));
    const ready = rem === 0;
    return `
      <div class="card">
        <div class="card-header">
          <div class="card-icon cat-ciftlik">${def.emoji}</div>
          <div style="flex:1">
            <div class="card-title">${def.name}</div>
            <div class="card-sub">Sv${item.lvl || 1} · Stok: ${item.stock || 0} ${def.unit}</div>
          </div>
        </div>
        <div class="row">
          <span class="row-label">Üretim</span>
          <span class="row-value">${def.yield} ${def.unit}/${fmtTime(def.hasat)}</span>
        </div>
        <div class="row">
          <span class="row-label">Kalan</span>
          <span class="row-value ${ready ? 'green' : ''}">${ready ? '✅ HAZIR' : fmtTime(rem)}</span>
        </div>
        <div style="display:flex;gap:8px;margin-top:8px">
          <button class="btn-green" style="flex:1" onclick="hasat('ciftlik',${i})" ${!ready ? 'disabled style="opacity:0.5"' : ''}>🥛 Hasat Al</button>
          <button class="btn-yellow" style="flex:1" onclick="upgradeTesis('ciftlik',${i})">⬆️ Yükselt</button>
        </div>
      </div>`;
  }).join('') + `<div style="padding:12px"><button class="btn-create" style="width:100%" onclick="openTesisModal('ciftlik')">+ Yeni Çiftlik Kur</button></div>`;
}

/* ================================================================
   FABRİKALAR
   ================================================================ */
function renderFabrikalar() {
  const body = document.getElementById('fabrikalar-body');
  if (!body) return;
  const items = state.tesisler.fabrika || [];
  if (!items.length) {
    body.innerHTML = `
      <div class="empty">
        <div class="empty-lock">🏭</div>
        <div class="empty-big">Henüz fabrikanız yok</div>
        <div class="empty-text">Üretim fabrikası kurarak hammaddeyi ürüne dönüştür!</div>
        <button class="btn-create" onclick="openTesisModal('fabrika')">+ Yeni Fabrika Kur</button>
      </div>`;
    return;
  }
  body.innerHTML = items.map((item, i) => {
    const def = FABRIKA_TYPES.find(x => x.id === item.id);
    if (!def) return '';
    return `
      <div class="card">
        <div class="card-header">
          <div class="card-icon cat-fabrika">${def.emoji}</div>
          <div style="flex:1">
            <div class="card-title">${def.name}</div>
            <div class="card-sub">Sv${item.lvl || 1} · Depo: ${item.depo || 0}</div>
          </div>
        </div>
        <div class="row">
          <span class="row-label">Üretim</span>
          <span class="row-value">${def.input} → ${def.output}</span>
        </div>
        <div class="row">
          <span class="row-label">Hız</span>
          <span class="row-value">${def.prodRate}/${fmtTime(def.prodInterval)}</span>
        </div>
        <button class="btn-yellow" style="width:100%;margin-top:8px" onclick="upgradeTesis('fabrika',${i})">⬆️ Seviye Yükselt — ${fmt(Math.floor(def.price * (item.lvl || 1) * 0.4))} ₺</button>
      </div>`;
  }).join('') + `<div style="padding:12px"><button class="btn-create" style="width:100%" onclick="openTesisModal('fabrika')">+ Yeni Fabrika Kur</button></div>`;
}

/* ================================================================
   MADENLER
   ================================================================ */
function renderMadenler() {
  const body = document.getElementById('madenler-body');
  if (!body) return;
  const items = state.tesisler.maden || [];
  if (!items.length) {
    body.innerHTML = `
      <div class="empty">
        <div class="empty-lock">⛏️</div>
        <div class="empty-big">Henüz madeniniz yok</div>
        <div class="empty-text">Altın, gümüş, bakır madeni aç!</div>
        <button class="btn-create" onclick="openTesisModal('maden')">+ Yeni Maden Aç</button>
      </div>`;
    return;
  }
  body.innerHTML = items.map((item, i) => {
    const def = MADEN_TYPES.find(x => x.id === item.id);
    if (!def) return '';
    const rem = Math.max(0, def.hasat - Math.floor((Date.now() - (item.lastHasat || 0)) / 1000));
    const ready = rem === 0;
    return `
      <div class="card">
        <div class="card-header">
          <div class="card-icon cat-maden">${def.emoji}</div>
          <div style="flex:1">
            <div class="card-title">${def.name}</div>
            <div class="card-sub">Sv${item.lvl || 1} · Stok: ${item.stock || 0} ${def.unit}</div>
          </div>
        </div>
        <div class="row">
          <span class="row-label">Üretim</span>
          <span class="row-value">${def.yield} ${def.unit}/${fmtTime(def.hasat)}</span>
        </div>
        <div class="row">
          <span class="row-label">Kalan</span>
          <span class="row-value ${ready ? 'green' : ''}">${ready ? '✅ HAZIR' : fmtTime(rem)}</span>
        </div>
        <div style="display:flex;gap:8px;margin-top:8px">
          <button class="btn-green" style="flex:1" onclick="hasat('maden',${i})" ${!ready ? 'disabled style="opacity:0.5"' : ''}>⛏️ Hasat Al</button>
          <button class="btn-yellow" style="flex:1" onclick="upgradeTesis('maden',${i})">⬆️ Yükselt</button>
        </div>
      </div>`;
  }).join('') + `<div style="padding:12px"><button class="btn-create" style="width:100%" onclick="openTesisModal('maden')">+ Yeni Maden Aç</button></div>`;
}

/* ================================================================
   TESIS MODAL
   ================================================================ */
function openTesisModal(type) {
  _currentTesisType = type;
  const typeMap = { bahce: BAHCE_TYPES, ciftlik: CIFTLIK_TYPES, fabrika: FABRIKA_TYPES, maden: MADEN_TYPES };
  const titles = { bahce: 'Bahçe Kur', ciftlik: 'Çiftlik Kur', fabrika: 'Fabrika Kur', maden: 'Maden Aç' };
  const types = typeMap[type];
  document.getElementById('tesis-modal-title').textContent = titles[type] || 'Tesis Kur';
  const body = document.getElementById('tesis-modal-body');
  body.innerHTML = types.map(t => {
    const locked = state.level < t.minLvl;
    return `
      <div class="action-row ${locked ? '' : 'cursor-pointer'}" onclick="${locked ? '' : `selectTesis('${t.id}')`}" style="${locked ? 'opacity:0.4' : ''}">
        <div style="display:flex;align-items:center;gap:12px;flex:1">
          <div class="action-icon ai-yellow">${t.emoji}</div>
          <div>
            <div style="font-weight:700">${t.name}</div>
            <div style="font-size:11px;color:var(--tm)">${locked ? '🔒 Seviye ' + t.minLvl + ' gerekli' : fmt(t.price) + ' ₺'}</div>
          </div>
        </div>
        ${!locked ? `<button class="btn-green" style="padding:7px 14px;font-size:12px" onclick="event.stopPropagation();buyTesis('${type}','${t.id}')">Kur</button>` : ''}
      </div>`;
  }).join('');
  openModal('tesis-modal');
}

let _currentTesisType = null;
function selectTesis(id) { /* handled by buyTesis directly */ }

/* ================================================================
   NAKIT TYCOON
   ================================================================ */
function renderNakitTycoon() {
  const body = document.getElementById('tycoon-bal');
  if (body) body.textContent = fmt(state.money) + ' ₺';

  // Günlük kazanç hesabı
  const dailyShop = state.shops.reduce((sum, s) => {
    const t = SHOP_TYPES.find(x => x.id === s.type);
    const hasStock = (s.reyonlar || []).some(r => (r.stock || 0) > 0);
    return sum + (hasStock ? (t?.income || 0) * (s.lvl || 1) * 24 : 0);
  }, 0);

  const tcIsletme = document.getElementById('tc-isletme');
  if (tcIsletme) tcIsletme.innerHTML = `
    <div class="tycoon-card" onclick="switchTab('dukkanlar')">
      <div style="font-size:28px">🏪</div>
      <div class="tc-val">${state.shops.length}</div>
      <div class="tc-label">Dükkan</div>
      <div style="font-size:10px;color:var(--neon);margin-top:2px">+${fmtShort(dailyShop)}/gün</div>
    </div>
    <div class="tycoon-card" onclick="switchTab('bahceler')">
      <div style="font-size:28px">🌿</div>
      <div class="tc-val">${state.tesisler?.bahce?.length || 0}</div>
      <div class="tc-label">Bahçe</div>
    </div>
    <div class="tycoon-card" onclick="switchTab('ciftlikler')">
      <div style="font-size:28px">🐄</div>
      <div class="tc-val">${state.tesisler?.ciftlik?.length || 0}</div>
      <div class="tc-label">Çiftlik</div>
    </div>
    <div class="tycoon-card" onclick="switchTab('fabrikalar')">
      <div style="font-size:28px">🏭</div>
      <div class="tc-val">${state.tesisler?.fabrika?.length || 0}</div>
      <div class="tc-label">Fabrika</div>
    </div>
    <div class="tycoon-card" onclick="switchTab('madenler')">
      <div style="font-size:28px">⛏️</div>
      <div class="tc-val">${state.tesisler?.maden?.length || 0}</div>
      <div class="tc-label">Maden</div>
    </div>`;

  const tcPazar = document.getElementById('tc-pazar');
  if (tcPazar) tcPazar.innerHTML = `
    <div class="tycoon-card" onclick="switchTab('lojistik')">
      <div style="font-size:28px">🚚</div>
      <div class="tc-val">${state.depolar?.length || 0}</div>
      <div class="tc-label">Depo</div>
    </div>
    <div class="tycoon-card" onclick="switchTab('ihracat')">
      <div style="font-size:28px">🚢</div>
      <div class="tc-val">${state.exportOrders?.length || 0}</div>
      <div class="tc-label">İhracat</div>
    </div>
    <div class="tycoon-card" onclick="openPage('pazar')">
      <div style="font-size:28px">🛍️</div>
      <div class="tc-val">${state.pazarListings?.length || 0}</div>
      <div class="tc-label">Pazar</div>
    </div>
    <div class="tycoon-card" onclick="switchTab('ihracat')">
      <div style="font-size:28px">🔨</div>
      <div class="tc-val">${(state.ihaleData || []).filter(d => d.won).length}</div>
      <div class="tc-label">İhale Kazan.</div>
    </div>`;

  // Kripto portföy değeri
  let kriptoVal = 0;
  KRIPTOLAR.forEach(k => {
    const qty = state.kripto[k.sym]?.qty || 0;
    kriptoVal += qty * k.price;
  });

  const tcFinans = document.getElementById('tc-finans');
  if (tcFinans) tcFinans.innerHTML = `
    <div class="tycoon-card" onclick="openPage('bank')">
      <div style="font-size:28px">🏦</div>
      <div class="tc-val">${fmtShort(state.bank?.investment || 0)}</div>
      <div class="tc-label">Yatırım ₺</div>
    </div>
    <div class="tycoon-card" onclick="switchTab('kripto')">
      <div style="font-size:28px">📈</div>
      <div class="tc-val">${fmtShort(kriptoVal)}</div>
      <div class="tc-label">Kripto ₺</div>
    </div>
    <div class="tycoon-card">
      <div style="font-size:28px">💎</div>
      <div class="tc-val">${state.diamonds || 0}</div>
      <div class="tc-label">Elmas</div>
    </div>
    <div class="tycoon-card">
      <div style="font-size:28px">📊</div>
      <div class="tc-val">${fmtShort(state.bank?.profit || 0)}</div>
      <div class="tc-label">Faiz Kar ₺</div>
    </div>`;
}


/* ================================================================
   BANK
   ================================================================ */
function renderBank() {
  const body = document.getElementById('bank-body');
  if (!body) return;

  const deposits = state.bank?.deposits || [];
  const activeDeposit = deposits.filter(d => Date.now() < d.maturity);

  body.innerHTML = `
    <div class="card">
      <div class="card-header">
        <div class="card-icon ai-blue">🏦</div>
        <div>
          <div class="card-title">Vadeli Hesaplar</div>
          <div class="card-sub">Yatırımınızı büyütün</div>
        </div>
      </div>
      ${BANKA_RATES.map((r, i) => `
        <div class="bank-investment-row">
          <div>
            <div style="font-weight:700">${r.label}</div>
            <div class="bank-duration">Faiz oranı</div>
          </div>
          <div class="bank-rate">%${Math.round(r.rate * 100)}</div>
          <button class="btn-green" style="padding:8px 14px;font-size:12px" onclick="openDepositModal(${i})">Yatır</button>
        </div>`).join('')}
    </div>
    ${activeDeposit.length ? `
    <div class="sec-label">AKTİF YATIRIMLAR</div>
    ${activeDeposit.map(d => {
      const rem = Math.max(0, Math.ceil((d.maturity - Date.now()) / 86400000));
      return `
        <div class="card">
          <div class="row"><span class="row-label">Tutar</span><span class="row-value yellow">${fmt(d.amount)} ₺</span></div>
          <div class="row"><span class="row-label">Faiz</span><span class="row-value green">%${Math.round(d.rate * 100)}</span></div>
          <div class="row"><span class="row-label">Kalan</span><span class="row-value">${rem} gün</span></div>
          <div class="row"><span class="row-label">Toplam</span><span class="row-value green">${fmt(d.amount * (1 + d.rate))} ₺</span></div>
        </div>`;
    }).join('')}` : ''}
    <div class="sec-label">ÖZET</div>
    <div class="card">
      <div class="row"><span class="row-label">Toplam Yatırım</span><span class="row-value yellow">${fmt(state.bank?.investment || 0)} ₺</span></div>
      <div class="row"><span class="row-label">Kazanılan Faiz</span><span class="row-value green">${fmt(state.bank?.profit || 0)} ₺</span></div>
    </div>`;
}

function openDepositModal(rateIdx) {
  document.getElementById('deposit-rate-idx').value = rateIdx;
  const r = BANKA_RATES[rateIdx];
  document.getElementById('deposit-rate-label').textContent = r.label + ' · %' + Math.round(r.rate * 100) + ' faiz';
  openModal('bank-deposit-modal');
}

function confirmDeposit() {
  const rateIdx = parseInt(document.getElementById('deposit-rate-idx').value);
  const amount = parseFloat(document.getElementById('deposit-amount').value);
  if (typeof doDeposit === 'function') doDeposit(rateIdx, amount);
}

/* ================================================================
   KRİPTO
   ================================================================ */
function renderKriptoPage() {
  const body = document.getElementById('kripto-body');
  if (!body) return;
  if (state.level < 5) {
    body.innerHTML = `<div class="empty"><div class="empty-lock">📈</div><div class="empty-big">Kripto için Seviye 5 gerekli</div><div class="empty-text">Mevcut seviye: ${state.level}</div></div>`;
    return;
  }
  body.innerHTML = KRIPTOLAR.map(k => {
    const held = state.kripto[k.sym]?.qty || 0;
    return `
      <div class="kripto-item">
        <div class="kripto-icon" style="background:${k.color}22;color:${k.color}">${k.emoji}</div>
        <div class="kripto-info">
          <div class="kripto-name">${k.name}</div>
          <div class="kripto-sym">${k.sym}${held > 0 ? ' · ' + held.toFixed(4) + ' adet' : ''}</div>
        </div>
        <div class="kripto-price">
          <div class="kripto-val">${fmt(k.price)} ₺</div>
          <div class="kripto-change ${k.dir}">${k.dir === 'up' ? '▲' : '▼'} %${Math.abs(k.change)}</div>
        </div>
        <div style="display:flex;flex-direction:column;gap:4px;margin-left:8px">
          <button class="btn-green" style="padding:5px 10px;font-size:11px" onclick="quickBuyKripto('${k.sym}')">Al</button>
          ${held > 0 ? `<button class="btn-red" style="padding:5px 10px;font-size:11px" onclick="quickSellKripto('${k.sym}')">Sat</button>` : ''}
        </div>
      </div>`;
  }).join('');
}

function quickBuyKripto(sym) {
  const k = KRIPTOLAR.find(x => x.sym === sym);
  const amt = Math.max(0.001, Math.floor(state.money * 0.01 / k.price * 1000) / 1000);
  if (amt <= 0) { toast('Yetersiz bakiye', 'error'); return; }
  buyKripto(sym, amt);
}

function quickSellKripto(sym) {
  const qty = state.kripto[sym]?.qty || 0;
  if (!qty) { toast('Kripto yok', 'error'); return; }
  sellKripto(sym, qty);
}

/* ================================================================
   LO­JİSTİK
   ================================================================ */
function renderLojistik() {
  const body = document.getElementById('lojistik-body');
  if (!body) return;
  const depolar = state.depolar || [];
  if (!depolar.length) {
    body.innerHTML = `
      <div class="empty">
        <div class="empty-lock">📦</div>
        <div class="empty-big">Henüz deponuz yok</div>
        <div class="empty-text">İhracat yapmak için depo gerekli.</div>
        <button class="btn-create" onclick="openDepoModal()">+ Yeni Depo Aç</button>
      </div>`;
    return;
  }
  body.innerHTML = depolar.map((d, i) => {
    const pct = Math.round((d.used || 0) / d.cap * 100);
    return `
      <div class="depo-card">
        <div class="depo-icon">🏢</div>
        <div class="depo-info">
          <div class="depo-name">${d.tip} — ${d.city}</div>
          <div style="font-size:11px;color:var(--tm);margin-top:2px">${(d.used || 0).toLocaleString()} / ${d.cap.toLocaleString()}</div>
          <div class="depo-bar"><div class="depo-bar-fill" style="width:${pct}%"></div></div>
        </div>
        <div style="font-size:11px;color:var(--tm)">${pct}%</div>
      </div>`;
  }).join('') + `<div style="padding:12px"><button class="btn-create" style="width:100%" onclick="openDepoModal()">+ Yeni Depo Aç</button></div>`;
}

function openDepoModal() { openModal('depo-modal'); renderDepoModal(); }

function renderDepoModal() {
  const citySel = document.getElementById('depo-city-sel');
  const capSel = document.getElementById('depo-cap-sel');
  if (!citySel || !capSel) return;
  citySel.innerHTML = '<option value="">Şehir seçin</option>' +
    CITIES.map(c => `<option value="${c.id}">${c.emoji} ${c.name}</option>`).join('');
  capSel.innerHTML = DEPO_TYPES.map(d => {
    const locked = state.level < d.minLevel;
    return `<option value="${d.id}" ${locked ? 'disabled' : ''}>${locked ? '🔒 ' : d.emoji + ' '}${d.name} — ${d.price > 0 ? fmt(d.price) + ' ₺' : '💎 500'}${locked ? ' (Sv' + d.minLevel + ')' : ''}</option>`;
  }).join('');
}

function submitDepo() {
  const city = document.getElementById('depo-city-sel')?.value;
  const capId = document.getElementById('depo-cap-sel')?.value;
  if (typeof confirmDepo === 'function') confirmDepo(city, capId);
}

/* ================================================================
   İHRACAT
   ================================================================ */
function renderIhracat() {
  if (typeof generateExportOrders === 'function') generateExportOrders();
  const body = document.getElementById('ihracat-body');
  if (!body) return;
  body.innerHTML = state.exportOrders.map((o, i) => {
    const pct = Math.round(o.sent / o.qty * 100);
    return `
      <div class="card" style="margin:8px 12px;padding:12px">
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px">
          <span style="font-size:22px">${o.country.flag}</span>
          <div style="flex:1">
            <div style="font-weight:700;font-size:13px">${o.country.name}</div>
            <div style="font-size:12px;color:var(--tm)">${o.qty.toLocaleString()} ${o.product.unit} ${o.product.name} ${o.product.emoji}</div>
          </div>
          <button class="btn-green" style="padding:7px 12px;font-size:12px" onclick="shipExport(${i})">🚢 Gönder</button>
        </div>
        <div style="display:flex;justify-content:space-between;font-size:11px;color:var(--tm);margin-bottom:4px">
          <span>Fiyat: <b style="color:var(--neon)">${fmt(o.price)} ₺/${o.product.unit}</b></span>
          <span>Min: ${o.minQty.toLocaleString()}</span>
        </div>
        <div style="height:4px;background:rgba(255,255,255,.08);border-radius:4px">
          <div style="width:${pct}%;height:100%;border-radius:4px;background:${pct < 30 ? '#ef4444' : pct < 70 ? '#f59e0b' : '#10b981'}"></div>
        </div>
      </div>`;
  }).join('');
}

/* ================================================================
   İHALE
   ================================================================ */
let ihaleTimers = {};
let ihaleState = null;

function generateIhaleler() {
  if (!state.ihaleData || Date.now() - (state.ihaleLastGen || 0) > 300000) {
    state.ihaleData = IHALE_DATA.map((d, i) => ({
      ...d, budget: parseFloat((d.budgetBase * (0.9 + Math.random() * 0.2)).toFixed(2)),
      deadline: Date.now() + Math.floor(Math.random() * 90 + 10) * 1000,
      bids: [], won: false, id: i
    }));
    state.ihaleLastGen = Date.now();
    if (typeof saveState === 'function') saveState();
  }
}

function renderIhale() {
  if (typeof generateIhaleler === 'function') generateIhaleler();
  const body = document.getElementById('ihale-body');
  if (!body) return;
  body.innerHTML = state.ihaleData.map((d, i) => `
    <div class="card" id="ihale-${i}">
      <div class="card-header">
        <div style="width:52px;height:52px;background:rgba(255,255,255,.05);border-radius:14px;display:grid;place-items:center;font-size:26px;border:1px solid var(--br)">${d.emoji}</div>
        <div>
          <div style="font-size:12px;color:var(--tm)">${d.flag} ${d.company}</div>
          <div style="font-weight:800;font-size:14px">${d.qty.toLocaleString()} ${d.unit} ${d.product}</div>
          <div style="font-size:13px;color:#818cf8;font-weight:700">Bütçe: ${fmt(d.budget)} ₺</div>
        </div>
      </div>
      <div style="display:flex;align-items:center;gap:8px;padding:10px;background:rgba(251,191,36,.05);border-radius:10px;margin-bottom:8px;border:1px solid rgba(251,191,36,.15)">
        <span style="font-size:12px;font-weight:700;color:var(--acc)">⏱ Kalan:</span>
        <span style="background:rgba(0,0,0,.3);padding:5px 10px;border-radius:6px;font-size:18px;font-weight:800;font-family:'Space Grotesk'" id="im-${i}-m">00</span>
        <span style="font-size:18px;font-weight:800;color:var(--acc)">:</span>
        <span style="background:rgba(0,0,0,.3);padding:5px 10px;border-radius:6px;font-size:18px;font-weight:800;font-family:'Space Grotesk'" id="im-${i}-s">00</span>
        <button class="btn-blue" style="margin-left:auto;padding:7px 12px;font-size:12px" onclick="openIhaleBid(${i})">🔨 Teklif</button>
      </div>
      <div style="font-size:12px;color:var(--tm);padding:8px 10px;background:rgba(255,255,255,.03);border-radius:8px;border:1px solid var(--br)" id="ihale-log-${i}">${d.won ? '🏆 İhaleyi kazandınız!' : 'Henüz teklif yok.'}</div>
    </div>`).join('');

  Object.values(ihaleTimers).forEach(clearInterval);
  ihaleTimers = {};
  state.ihaleData.forEach((d, i) => {
    ihaleTimers[i] = setInterval(() => {
      const rem = Math.max(0, Math.floor((d.deadline - Date.now()) / 1000));
      const mEl = document.getElementById('im-' + i + '-m');
      const sEl = document.getElementById('im-' + i + '-s');
      if (!mEl) return;
      mEl.textContent = String(Math.floor(rem / 60)).padStart(2, '0');
      sEl.textContent = String(rem % 60).padStart(2, '0');
      if (rem <= 0) {
        clearInterval(ihaleTimers[i]);
        d.deadline = Date.now() + Math.floor(Math.random() * 90 + 20) * 1000;
        d.bids = []; d.won = false;
        d.budget = parseFloat((d.budgetBase * (0.9 + Math.random() * 0.2)).toFixed(2));
        const lg = document.getElementById('ihale-log-' + i);
        if (lg) lg.textContent = 'Yeni ihale başladı.';
      }
    }, 1000);
  });
}

function openIhaleBid(i) {
  const d = state.ihaleData[i];
  ihaleState = i;
  document.getElementById('ibm-title').textContent = d.product + ' İhalesi';
  document.getElementById('ibm-desc').textContent = `${d.flag} ${d.company} · Bütçe: ${fmt(d.budget)} ₺`;
  document.getElementById('ibm-tip').textContent = 'Son: ' + (d.bids.length ? fmt(d.bids.slice(-1)[0].amount) + ' ₺' : 'Henüz yok');
  document.getElementById('ibm-amount').value = '';
  openModal('ihale-bid-modal');
}

function submitIhaleBid() {
  if (ihaleState === null) return;
  const d = state.ihaleData[ihaleState];
  const amount = parseFloat(document.getElementById('ibm-amount').value);
  if (isNaN(amount) || amount <= 0) { toast('Geçerli teklif girin', 'error'); return; }
  if (amount > d.budget) { toast('Teklifiniz bütçeyi aşıyor!', 'error'); return; }
  const myName = state.user?.name || 'Sen';
  const reward = Math.floor(d.qty * amount * 0.01);
  d.bids.push({ amount, text: `${myName} kazandı. +${fmt(reward)} ₺`, user: myName });
  d.won = true;
  state.money += reward;
  state.xp += 300;
  checkLevel();
  window._lastMoney = state.money;
  window._lastCheck = Date.now();
  const lg = document.getElementById('ihale-log-' + ihaleState);
  if (lg) lg.textContent = `🏆 ${myName} kazandı! +${fmt(reward)} ₺`;
  closeModal('ihale-bid-modal');
  if (typeof saveState === 'function') saveState();
  if (typeof saveFsState === 'function' && window.fbDb && window.fbUser) saveFsState();
  renderTopbar();
  toast('İhaleyi kazandın! +' + fmt(reward) + ' ₺ 🏆', 'success');
  if (typeof confetti === 'function') confetti();
}

/* ================================================================
   RANKING
   ================================================================ */
function renderRanking() {
  const body = document.getElementById('ranking-body');
  if (!body) return;
  const myName = state.user?.name;
  const tab = state._rankTab || 'alltime';

  // Sadece gerçek oyuncular: kendimiz
  let players = [];
  if (myName) {
    players.push({ name: myName, emoji: state.user?.emoji || '😊', lvl: state.level, money: state.money, isMe: true });
  }

  body.innerHTML = `
    <div style="display:flex;gap:6px;padding:10px 12px 0">
      ${[['alltime','Tüm Zamanlar'],['weekly','Haftalık'],['daily','Günlük']].map(([k,l]) => `
        <button onclick="setRankTab('${k}')" style="flex:1;padding:7px;border-radius:10px;font-size:12px;font-weight:700;border:none;cursor:pointer;${tab===k ? 'background:#6366f1;color:#fff' : 'background:rgba(255,255,255,.06);color:var(--tm)'}">${l}</button>
      `).join('')}
    </div>
    ${players.length ? players.map((p, i) => {
      const pos = i + 1;
      const cls = pos === 1 ? 'gold' : pos === 2 ? 'silver' : pos === 3 ? 'bronze' : '';
      return `
        <div class="rank-item" style="${p.isMe ? 'background:rgba(99,102,241,.06);border-left:2px solid #6366f1' : ''}" onclick="openPlayerProfile('${p.name}')">
          <div class="rank-pos ${cls}">${pos}</div>
          <div class="rank-av">${p.emoji}</div>
          <div class="rank-info">
            <div class="rank-name">${p.name}${p.isMe ? ' (Sen)' : ''}</div>
            <div class="rank-sub">Sv${p.lvl}</div>
          </div>
          <div class="rank-money">${fmtShort(p.money)} ₺</div>
        </div>`;
    }).join('') : `
      <div class="empty" style="padding:40px 20px">
        <div class="empty-lock">🏆</div>
        <div class="empty-big">Liderlik Tablosu</div>
        <div class="empty-text">Henüz yeterli oyuncu yok. İlk sıraya sen gir!</div>
      </div>`}
    <div style="padding:12px;font-size:11px;color:var(--tm);text-align:center">
      Sıralama gerçek zamanlı güncellenir · Veriler Firebase'den çekilir
    </div>`;
}
window.renderRanking = renderRanking;

function setRankTab(tab) {
  state._rankTab = tab;
  renderRanking();
}
window.setRankTab = setRankTab;

function openPlayerProfile(name) {
  const isMe = name === state.user?.name;
  const modal = document.getElementById('player-profile-modal');
  if (!modal) return;
  document.getElementById('pp-name').textContent = name;
  document.getElementById('pp-emoji').textContent = isMe ? (state.user?.emoji || '😊') : '👤';
  document.getElementById('pp-level').textContent = isMe ? 'Sv' + state.level : 'Sv?';
  document.getElementById('pp-money').textContent = isMe ? fmtShort(state.money) + ' ₺' : 'Gizli';
  document.getElementById('pp-shops').textContent = isMe ? state.shops.length : '?';
  document.getElementById('pp-isMe').style.display = isMe ? 'none' : 'flex';
  openModal('player-profile-modal');
}
window.openPlayerProfile = openPlayerProfile;

/* ================================================================
   NOTIFICATIONS
   ================================================================ */
function renderNotifications() {
  const body = document.getElementById('notif-body');
  if (!body) return;
  const notifs = state.notifications || [];
  notifs.forEach(n => { n.read = true; });
  if (typeof saveState === 'function') saveState();
  renderTopbar();
  if (!notifs.length) {
    body.innerHTML = '<div class="empty"><div class="empty-lock">🔔</div><div class="empty-big">Bildirim yok</div></div>';
    return;
  }
  body.innerHTML = notifs.map(n => `
    <div class="notif-item ${n.read ? '' : 'unread'}">
      <div class="notif-icon">${n.icon || '🔔'}</div>
      <div style="flex:1">
        <div class="notif-text">${n.text}</div>
        <div class="notif-time">${n.time}</div>
      </div>
    </div>`).join('');
}

/* ================================================================
   CHAT
   ================================================================ */
function renderChatPage() {
  // seed if empty
  if (state.chatHistory && !state.chatHistory.length) {
    state.chatHistory = [...CHAT_SEED];
  }
  renderChatMessages(state.chatHistory);
}

function renderChatMessages(msgs) {
  const body = document.getElementById('chat-messages');
  if (!body) return;
  const myName = state.user?.name;
  body.innerHTML = msgs.map(m => `
    <div class="chat-msg ${m.user === myName ? 'mine' : ''}">
      <div class="chat-msg-av">${m.av || m.user?.[0]?.toUpperCase() || '😊'}</div>
      <div class="chat-msg-body">
        <div class="chat-msg-head">
          <span class="chat-msg-name">${m.user}</span>
          <span class="chat-msg-time">${m.time || 'az önce'}</span>
        </div>
        <div class="chat-msg-text">${m.text}</div>
      </div>
    </div>`).join('');
  body.scrollTop = body.scrollHeight;
}

function sendChat() {
  const input = document.getElementById('chat-text');
  if (!input) return;
  const text = input.value.trim();
  if (!text) return;
  if (!state.user) { toast('Giriş yapman gerekiyor', 'error'); return; }
  // Küfür/hakaret filtresi
  const banned_words = ['küfür', 'lanet', 'sik', 'orospu', 'göt', 'amk', 'pic'];
  if (banned_words.some(w => text.toLowerCase().includes(w))) {
    toast('⚠️ Uygunsuz içerik tespit edildi! Hesabın ban riski altında.', 'error');
    return;
  }
  input.value = '';
  const msg = { user: state.user?.name || 'Misafir', av: state.user?.name?.[0]?.toUpperCase() || '😊', text, time: 'az önce' };
  if (!state.chatHistory) state.chatHistory = [];
  state.chatHistory.push(msg);
  if (state.chatHistory.length > 50) state.chatHistory.shift();
  renderChatMessages(state.chatHistory);
  if (typeof sendChatMessage === 'function') sendChatMessage(text);
}

/* ================================================================
   PROFILE
   ================================================================ */
function renderProfile() {
  const body = document.getElementById('profile-body');
  if (!body) return;
  const name = state.user?.name || '—';
  const joinDays = Math.floor((Date.now() - (state.joinDate || Date.now())) / 86400000);
  body.innerHTML = `
    <div class="profile-hero">
      <div class="profile-av">${name[0]?.toUpperCase() || '😊'}</div>
      <div class="profile-name">${name}</div>
      <div class="profile-level">Seviye ${state.level} · ${joinDays} gün önce katıldı</div>
    </div>
    <div class="profile-stats">
      <div class="profile-stat">
        <div class="profile-stat-val">${fmt(state.money)} ₺</div>
        <div class="profile-stat-label">Bakiye</div>
      </div>
      <div class="profile-stat">
        <div class="profile-stat-val">${state.shops.length}</div>
        <div class="profile-stat-label">Dükkan</div>
      </div>
      <div class="profile-stat">
        <div class="profile-stat-val">${state.level}</div>
        <div class="profile-stat-label">Seviye</div>
      </div>
    </div>
    <div class="sec-label">HESAP BİLGİLERİ</div>
    <div class="card">
      <div class="row"><span class="row-label">E-posta</span><span class="row-value">${state.user?.email || '—'}</span></div>
      <div class="row"><span class="row-label">Kullanıcı</span><span class="row-value">${name}</span></div>
      <div class="row"><span class="row-label">Marka</span><span class="row-value yellow">${state.myMarka || 'Yok'}</span></div>
      <div class="row"><span class="row-label">Elmas</span><span class="row-value yellow">💎 ${state.diamonds || 0}</span></div>
    </div>
    <div style="padding:12px;margin-top:8px">
      <button class="btn-red" style="width:100%" onclick="confirmSignOut()">🚪 Çıkış Yap</button>
    </div>`;
}

function confirmSignOut() {
  if (confirm('Çıkış yapmak istediğinizden emin misiniz?')) {
    if (typeof doSignOut === 'function') doSignOut();
    else { state.user = null; if (typeof showScreen === 'function') showScreen('welcome'); }
  }
}

/* ================================================================
   MARKA
   ================================================================ */
function renderMarka() {
  const body = document.getElementById('marka-body');
  if (!body) return;
  const myBrand = state.myMarka;

  if (myBrand) {
    body.innerHTML = `
      <div style="background:linear-gradient(135deg,#1e1b4b,#312e81);border-radius:18px;margin:12px;padding:20px;text-align:center;border:1px solid rgba(99,102,241,.4)">
        <div style="font-size:52px;margin-bottom:8px">${state.markaEmoji || '🏆'}</div>
        <div style="font-size:22px;font-weight:900;color:#fff;margin-bottom:4px">${myBrand}</div>
        <div style="font-size:12px;color:rgba(255,255,255,.6);margin-bottom:16px">Kurucu: ${state.user?.name || 'Sen'}</div>
        <div style="display:flex;justify-content:center;gap:12px;margin-bottom:16px">
          <div class="marka-chip">🏆 ${(state.markaTP || 0).toLocaleString()} TP</div>
          <div class="marka-chip">👥 1 Üye</div>
          <div class="marka-chip">⚡ x${(1 + (state.level || 1) * 0.01).toFixed(2)}</div>
        </div>
      </div>
      <div class="sec-label">MARKA YÖNETİMİ</div>
      <div class="card">
        <div class="action-row" onclick="toast('Yakında 🚀','')">
          <div style="display:flex;align-items:center;gap:12px">
            <div class="action-icon ai-yellow">🏭</div>
            <div><div style="font-weight:700">Üretim Tesisi Kur</div><div style="font-size:11px;color:var(--tm)">Araç, tekstil ve daha fazlası</div></div>
          </div>
          <div style="color:var(--tm)">›</div>
        </div>
        <div class="action-row" onclick="toast('Yakında 🚀','')">
          <div style="display:flex;align-items:center;gap:12px">
            <div class="action-icon ai-blue">👥</div>
            <div><div style="font-weight:700">Üye Davet Et</div><div style="font-size:11px;color:var(--tm)">Markana üye kabul et</div></div>
          </div>
          <div style="color:var(--tm)">›</div>
        </div>
        <div class="action-row" onclick="toast('Yakında 🚀','')">
          <div style="display:flex;align-items:center;gap:12px">
            <div class="action-icon ai-green">🚗</div>
            <div><div style="font-weight:700">Araç Üretimi</div><div style="font-size:11px;color:var(--tm)">Otomobil, motosiklet fabrikası</div></div>
          </div>
          <div style="color:var(--tm)">›</div>
        </div>
      </div>
      <div style="padding:12px">
        <button class="btn-red" style="width:100%" onclick="leaveMarka()">🚪 Markadan Ayrıl</button>
      </div>`;
  } else {
    body.innerHTML = `
      <div class="empty">
        <div class="empty-lock">🏆</div>
        <div class="empty-big">Kendi Markamı Kur</div>
        <div class="empty-text">Bir marka kurarak üretim tesisleri aç, üyeler topla ve sıralamada yüksel!</div>
      </div>
      <div style="padding:14px">
        <div class="card">
          <div style="font-weight:700;margin-bottom:10px">🏗️ Yeni Marka Kur</div>
          <div style="margin-bottom:10px">
            <input id="brand-name-input" class="input-dark" placeholder="Marka adı (3-20 karakter)" maxlength="20">
          </div>
          <div style="margin-bottom:10px">
            <label style="font-size:12px;color:var(--tm);display:block;margin-bottom:6px">Marka Emojisi</label>
            <div style="display:flex;flex-wrap:wrap;gap:8px">
              ${['🏆','🦁','🦅','🐺','🔥','⚡','🚀','💎','🏰','🌊'].map(e => `
                <button onclick="selectMarkaEmoji('${e}')" id="me-${e}" style="width:40px;height:40px;border-radius:10px;border:1px solid var(--br);background:rgba(255,255,255,.04);font-size:20px;cursor:pointer">${e}</button>
              `).join('')}
            </div>
          </div>
          <button class="btn-create" style="width:100%" onclick="createMarka()">🏗️ Markamı Kur — 💎 50 Elmas</button>
        </div>
        <div style="text-align:center;font-size:11px;color:var(--tm);margin-top:8px">
          Şu an liderlik tablosunda hiç marka yok.<br>İlk markayı sen kur!
        </div>
      </div>`;
  }
}
window.renderMarka = renderMarka;

let _selectedMarkaEmoji = '🏆';
function selectMarkaEmoji(e) {
  _selectedMarkaEmoji = e;
  document.querySelectorAll('[id^="me-"]').forEach(b => b.style.borderColor = 'var(--br)');
  const btn = document.getElementById('me-' + e);
  if (btn) btn.style.borderColor = '#6366f1';
}
window.selectMarkaEmoji = selectMarkaEmoji;

function createMarka() {
  const name = (document.getElementById('brand-name-input')?.value || '').trim();
  if (!name || name.length < 3) { toast('Marka adı en az 3 karakter olmalı', 'error'); return; }
  if ((state.diamonds || 0) < 50) { toast('Yetersiz elmas! 💎 50 gerekli', 'error'); return; }
  state.diamonds -= 50;
  state.myMarka = name;
  state.markaEmoji = _selectedMarkaEmoji;
  state.markaTP = 0;
  saveState();
  if (typeof saveFsState === 'function' && window.fbDb && window.fbUser) saveFsState();
  toast(name + ' markası kuruldu! 🎉', 'success');
  confetti();
  renderMarka();
}
window.createMarka = createMarka;

function leaveMarka() {
  if (!confirm) { doLeaveMarka(); return; }
  // Use toast confirm
  state.myMarka = null;
  state.markaEmoji = null;
  saveState();
  toast('Markadan ayrıldın', '');
  renderMarka();
}
window.leaveMarka = leaveMarka;

/* ================================================================
   NEWS
   ================================================================ */
function renderNews() {
  const body = document.getElementById('news-body');
  if (!body) return;

  // Dinamik haberler — kripto fiyatları, oyun istatistiklerine göre
  const news = generateDynamicNews();

  body.innerHTML = news.map(n => `
    <div class="news-card">
      <div class="news-hero" style="background:${n.color}">${n.emoji}</div>
      <div class="news-bi">
        <div class="news-title">${n.title}</div>
        <div class="news-text">${n.text}</div>
        <div class="news-date">⏰ ${n.date}</div>
        <div class="news-reactions">
          <div class="reaction">👍 ${n.likes || Math.floor(Math.random() * 200 + 10)}</div>
          <div class="reaction">🔥 ${n.fires || Math.floor(Math.random() * 100 + 5)}</div>
          <div class="reaction">💬 ${n.comments || Math.floor(Math.random() * 50)}</div>
        </div>
      </div>
    </div>`).join('');
}

function generateDynamicNews() {
  const news = [];
  const now = Date.now();

  // Kripto haberleri — gerçek fiyatlara göre
  const topKripto = [...KRIPTOLAR].sort((a, b) => Math.abs(b.change) - Math.abs(a.change))[0];
  if (topKripto) {
    const isUp = topKripto.dir === 'up';
    news.push({
      emoji: topKripto.emoji,
      title: `${topKripto.name} (${topKripto.sym}) ${isUp ? '📈 Yükselişte' : '📉 Düşüşte'}!`,
      text: `${topKripto.name} son işlemlerde %${Math.abs(topKripto.change).toFixed(1)} ${isUp ? 'artarak' : 'düşerek'} ${fmt(topKripto.price)} ₺'ye ${isUp ? 'ulaştı' : 'geriledi'}. Uzmanlar ${isUp ? 'temkinli olmayı' : 'alım fırsatı olduğunu'} söylüyor.`,
      date: 'Az önce',
      color: isUp ? 'linear-gradient(135deg,#10b981,#059669)' : 'linear-gradient(135deg,#ef4444,#dc2626)',
      likes: 234, fires: 87, comments: 45
    });
  }

  // Altın haberi
  const altin = KRIPTOLAR.find(k => k.sym === 'NVL');
  news.push({
    emoji: '🥇',
    title: 'Altın Madeni Sahipleri Kazanıyor',
    text: 'Küresel belirsizlik ortamında altın madeni sahipleri günde binlerce lira kazanıyor. Sv8+ oyuncular maden açmaya koşuyor.',
    date: '15 dk önce',
    color: 'linear-gradient(135deg,#fbbf24,#d97706)',
    likes: 189, fires: 92, comments: 38
  });

  // Oyuncu istatistikleri haberi
  const totalShops = state.shops.length;
  if (totalShops > 0) {
    news.push({
      emoji: '🏪',
      title: `${state.user?.name || 'Oyuncu'} ${totalShops} Dükkanla Büyüyor`,
      text: `${state.user?.name || 'Anonim oyuncu'} toplamda ${totalShops} dükkan açarak ${fmtShort(state.money)} ₺ biriktime ulaştı. Ekonomik imparatorluk inşaatı devam ediyor.`,
      date: '1 saat önce',
      color: 'linear-gradient(135deg,#6366f1,#4f46e5)',
      likes: 42, fires: 18, comments: 9
    });
  }

  // İhracat haberi
  news.push({
    emoji: '🚢',
    title: 'İhracat Piyasasında Yoğunluk',
    text: 'Bu hafta Almanya ve Japonya kaynaklı ihracat talepleri artış gösterdi. Fındık ve zeytinyağı ihracatçıları rekor gelir elde etti.',
    date: '2 saat önce',
    color: 'linear-gradient(135deg,#0ea5e9,#0284c7)',
    likes: 156, fires: 63, comments: 27
  });

  // Banka faiz haberi
  news.push({
    emoji: '🏦',
    title: 'Vade Hesapları %200 Getiri Sunuyor',
    text: '1 yıllık vadeli hesap sahipleri bu yıl parasını ikiye katladı. Bankacılık uzmanları uzun vadeli yatırımı tavsiye ediyor.',
    date: '4 saat önce',
    color: 'linear-gradient(135deg,#14b8a6,#0d9488)',
    likes: 301, fires: 124, comments: 58
  });

  // Hasat haberi
  const totalTesis = (state.tesisler?.bahce?.length || 0) + (state.tesisler?.ciftlik?.length || 0) +
                     (state.tesisler?.fabrika?.length || 0) + (state.tesisler?.maden?.length || 0);
  if (totalTesis === 0) {
    news.push({
      emoji: '🌾',
      title: 'Üretim Tesisleri Kuranlar Önde',
      text: 'Bahçe, çiftlik ve maden sahibi oyuncular dükkan gelirlerinin yanı sıra hasat geliriyle de servetlerini artırıyor. Henüz tesis kurmadıysan geç kalıyorsun!',
      date: '6 saat önce',
      color: 'linear-gradient(135deg,#84cc16,#65a30d)',
      likes: 112, fires: 45, comments: 23
    });
  }

  return news;
}
window.generateDynamicNews = generateDynamicNews;

/* ================================================================
   CITIES
   ================================================================ */
function renderCities() {
  const body = document.getElementById('city-list');
  if (!body) return;
  body.innerHTML = `
    <div style="padding:0 0 8px;color:var(--tm);font-size:13px">81 ilde dükkan açabilirsin. Büyük şehirlerde gelir çarpanı daha yüksek. Şehre tıkla, detayları gör.</div>
    ${CITIES.map(c => {
      const shopsHere = state.shops.filter(s => s.cityId === c.id).length;
      return \`
        <div class="city-card" onclick="openCityDetail('${c.id}')" style="cursor:pointer">
          <div style="font-size:28px">${c.emoji}</div>
          <div style="flex:1">
            <div style="font-weight:700">${c.name}</div>
            <div style="font-size:11px;color:var(--tm)">${c.region} · x${c.mult} çarpan</div>
          </div>
          <div style="text-align:right">
            <div style="font-size:12px;color:var(--neon)">${shopsHere} dükkan</div>
            <div style="font-size:10px;color:var(--tm)">›</div>
          </div>
        </div>\`;
    }).join('')}`;
}

function openCityDetail(cityId) {
  const c = CITIES.find(x => x.id === cityId);
  if (!c) return;
  const shopsHere = state.shops.filter(s => s.cityId === cityId);
  const modal = document.getElementById('city-detail-modal');
  if (!modal) { toast(c.name + ' - ' + c.region + ' · x' + c.mult + ' çarpan', ''); return; }
  document.getElementById('cd-title').textContent = c.emoji + ' ' + c.name;
  document.getElementById('cd-body').innerHTML = \`
    <div style="text-align:center;padding:16px 0;border-bottom:1px solid var(--br);margin-bottom:14px">
      <div style="font-size:52px;margin-bottom:8px">\${c.emoji}</div>
      <div style="font-size:22px;font-weight:900">\${c.name}</div>
      <div style="font-size:13px;color:var(--tm);margin-top:4px">\${c.region} Bölgesi</div>
    </div>
    <div class="row"><span class="row-label">Gelir Çarpanı</span><span class="row-value green">x\${c.mult}</span></div>
    <div class="row"><span class="row-label">Bölge</span><span class="row-value">\${c.region}</span></div>
    <div class="row"><span class="row-label">Dükkanların</span><span class="row-value">\${shopsHere.length} Dükkan</span></div>
    \${shopsHere.length ? \`
    <div style="margin-top:14px;font-weight:700;font-size:13px;margin-bottom:8px">📍 Bu İldeki Dükkanların</div>
    \${shopsHere.map(s => {
      const t = SHOP_TYPES.find(x => x.id === s.type);
      return \`<div class="action-row"><span>\${t?.emoji || '🏪'} \${t?.name || s.type}</span><span style="color:var(--neon)">Sv\${s.lvl || 1}</span></div>\`;
    }).join('')}\` : \`
    <div style="margin-top:14px;text-align:center;font-size:13px;color:var(--tm)">Bu ilde henüz dükkanın yok.</div>\`}
    <div style="margin-top:14px">
      <button class="btn-create" style="width:100%" onclick="closeModal('city-detail-modal');openModal('shop-modal')">+ Bu İlde Dükkan Aç</button>
    </div>\`;
  openModal('city-detail-modal');
}
window.openCityDetail = openCityDetail;

/* ================================================================
   FAQ
   ================================================================ */
function renderFaq() {
  const body = document.getElementById('faq-body');
  if (!body) return;
  body.innerHTML = FAQ.map((f, i) => `
    <div class="card" style="cursor:pointer" onclick="toggleFaq(${i})">
      <div style="display:flex;align-items:center;justify-content:space-between">
        <div style="font-weight:700;font-size:14px">${f.q}</div>
        <div id="faq-arrow-${i}" style="font-size:12px;color:var(--tm)">▼</div>
      </div>
      <div id="faq-ans-${i}" style="display:none;font-size:13px;color:var(--tm);margin-top:10px;line-height:1.6">${f.a}</div>
    </div>`).join('');
}

function toggleFaq(i) {
  const el = document.getElementById('faq-ans-' + i);
  const arrow = document.getElementById('faq-arrow-' + i);
  if (!el) return;
  if (el.style.display === 'none') { el.style.display = 'block'; if (arrow) arrow.textContent = '▲'; }
  else { el.style.display = 'none'; if (arrow) arrow.textContent = '▼'; }
}

/* ================================================================
   SETTINGS
   ================================================================ */
function renderSettings() {
  const body = document.getElementById('settings-body');
  if (!body) return;
  const s = state.settings || {};
  body.innerHTML = `
    <div class="sec-label">GÖRÜNÜM & SES</div>
    <div class="settings-row">
      <div><div class="settings-label">🔔 Bildirimler</div><div class="settings-sub">Hasat, vade ve oyun bildirimleri</div></div>
      <div class="toggle ${s.notif !== false ? 'on' : ''}" onclick="toggleSetting('notif',this)"></div>
    </div>
    <div class="settings-row">
      <div><div class="settings-label">🔊 Ses Efektleri</div><div class="settings-sub">Satış, kazanç sesleri</div></div>
      <div class="toggle ${s.sound !== false ? 'on' : ''}" onclick="toggleSetting('sound',this)"></div>
    </div>
    <div class="settings-row">
      <div><div class="settings-label">🎵 Arka Plan Müziği</div><div class="settings-sub">Oyun içi müzik</div></div>
      <div class="toggle ${s.music ? 'on' : ''}" onclick="toggleSetting('music',this)"></div>
    </div>
    <div class="settings-row">
      <div><div class="settings-label">📳 Titreşim</div><div class="settings-sub">Önemli olaylarda titreşim</div></div>
      <div class="toggle ${s.vibrate !== false ? 'on' : ''}" onclick="toggleSetting('vibrate',this)"></div>
    </div>

    <div class="sec-label">OYUN HIZLANDIRICILARI</div>
    <div class="settings-row" onclick="toast('Yakında gelecek 🚀','')">
      <div><div class="settings-label">🤖 Robot Asistanı</div><div class="settings-sub">Satışları otomatik yönetir</div></div>
      <div style="color:#fbbf24;font-size:12px;font-weight:700">Mağazadan Al ›</div>
    </div>
    <div class="settings-row" onclick="toast('Yakında gelecek 🚀','')">
      <div><div class="settings-label">📊 Otomatik Hasat</div><div class="settings-sub">Bahçe/Çiftlik hasatını otomatikleştir</div></div>
      <div style="color:#fbbf24;font-size:12px;font-weight:700">Yakında ›</div>
    </div>

    <div class="sec-label">HESAP BİLGİLERİ</div>
    <div class="settings-row">
      <div><div class="settings-label">👤 Kullanıcı Adı</div><div class="settings-sub">${state.user?.name || '—'}</div></div>
      <div style="color:var(--tm)">›</div>
    </div>
    <div class="settings-row">
      <div><div class="settings-label">📧 E-posta</div><div class="settings-sub">${state.user?.email || '—'}</div></div>
      <div style="color:var(--tm)">›</div>
    </div>
    <div class="settings-row">
      <div><div class="settings-label">📅 Katılım Tarihi</div><div class="settings-sub">${new Date(state.joinDate || Date.now()).toLocaleDateString('tr-TR')}</div></div>
    </div>

    <div class="sec-label">GİZLİLİK & GÜVENLİK</div>
    <div class="settings-row">
      <div><div class="settings-label">🔒 Profil Gizliliği</div><div class="settings-sub">Diğer oyuncular profilini görsün</div></div>
      <div class="toggle ${s.publicProfile !== false ? 'on' : ''}" onclick="toggleSetting('publicProfile',this)"></div>
    </div>
    <div class="settings-row" onclick="toast('Destek: gamezone@support.tr','')">
      <div><div class="settings-label">🆘 Haksız Ban İtiraz</div><div class="settings-sub">Bana ulaş</div></div>
      <div style="color:var(--tm)">›</div>
    </div>

    <div class="sec-label">VERİ</div>
    <div class="settings-row" onclick="toast('Verileriniz Firebase\\'de güvende 🔒','success')">
      <div><div class="settings-label">☁️ Bulut Yedekleme</div><div class="settings-sub">Firebase - otomatik senkronize</div></div>
      <div style="color:var(--neon);font-size:12px">Aktif ✓</div>
    </div>

    <div style="padding:16px;display:flex;flex-direction:column;gap:8px">
      <button class="btn-red" style="width:100%" onclick="confirmSignOut()">🚪 Çıkış Yap</button>
      <button style="width:100%;padding:12px;border-radius:12px;background:rgba(239,68,68,.1);color:#ef4444;font-weight:700;border:1px solid rgba(239,68,68,.2)" onclick="confirmReset()">🗑️ Hesabı Sıfırla</button>
    </div>
    <div style="text-align:center;font-size:10px;color:var(--tm);padding:8px">v5.0 · © 2026 GameZone ERP</div>`;
}
window.renderSettings = renderSettings;

function toggleSetting(key, el) {
  if (!state.settings) state.settings = {};
  state.settings[key] = !state.settings[key];
  el.classList.toggle('on');
  saveState();
}
window.toggleSetting = toggleSetting;

function confirmReset() {
  // Basit doğrulama
  const name = state.user?.name || '';
  const input = prompt('Hesabını sıfırlamak için kullanıcı adını gir:');
  if (input === name) {
    state.money = 20000; state.level = 1; state.xp = 0;
    state.shops = []; state.tesisler = {bahce:[],ciftlik:[],fabrika:[],maden:[]};
    state.depolar = []; state.kripto = {}; state.bank = {balance:0,investment:0,profit:0};
    saveState();
    if (typeof saveFsState === 'function' && window.fbDb && window.fbUser) saveFsState();
    toast('Hesap sıfırlandı!', '');
    if (typeof renderAll === 'function') renderAll();
  } else if (input !== null) {
    toast('Kullanıcı adı yanlış!', 'error');
  }
}
window.confirmReset = confirmReset;

/* ================================================================
   PAZAR (player market)
   ================================================================ */
function renderPazar() {
  const body = document.getElementById('pazar-body');
  if (!body) return;
  const listings = state.pazarListings || [];
  body.innerHTML = `
    <div style="padding:12px">
      <button class="btn-create" style="width:100%" onclick="openModal('pazar-add-modal')">+ Ürün Sat</button>
    </div>
    ${!listings.length ? '<div class="empty"><div class="empty-lock">🛒</div><div class="empty-big">Pazar boş</div><div class="empty-text">İlk ürünü ekleyen ol!</div></div>' :
    listings.map((l, i) => `
      <div class="market-item">
        <div class="market-item-icon">📦</div>
        <div class="market-item-info">
          <div class="market-item-name">${l.item}</div>
          <div class="market-item-seller">${l.seller} · ${l.qty} adet</div>
        </div>
        <div class="market-item-price">${fmt(l.price)} ₺</div>
        <button class="market-buy-btn" onclick="buyFromPazar(${i})">Satın Al</button>
      </div>`).join('')}`;
}

function submitPazarListing() {
  const item = document.getElementById('pazar-item-name')?.value;
  const price = document.getElementById('pazar-item-price')?.value;
  const qty = document.getElementById('pazar-item-qty')?.value;
  if (typeof addPazarListing === 'function') addPazarListing(item, price, qty);
}

/* ================================================================
   MENU PAGE
   ================================================================ */
function renderMenu() {
  const body = document.getElementById('menu-body');
  if (!body) return;
  const tiles = [
    { emoji: '🏆', label: 'Sıralama',    tab: 'ranking'     },
    { emoji: '📰', label: 'Haberler',    tab: 'news'        },
    { emoji: '🏙️', label: 'Şehirler',   tab: 'cities'      },
    { emoji: '❓', label: 'SSS',         tab: 'faq'         },
    { emoji: '⚙️', label: 'Ayarlar',    tab: 'settings'    },
    { emoji: '🔨', label: 'İhale',       tab: 'ihale'       },
    { emoji: '🤝', label: 'Markalar',    tab: 'marka'       },
    { emoji: '🌍', label: 'İhracat',     tab: 'ihracat'     },
    { emoji: '🎰', label: 'Çark',        fn: 'toast(\'Yakında!\',\'\')' },
    { emoji: '💬', label: 'Sohbet',      tab: 'chat'        },
    { emoji: '📊', label: 'Pazar',       tab: 'pazar'       },
    { emoji: '👤', label: 'Profil',      tab: 'profile'     }
  ];
  body.innerHTML = `<div class="menu-grid">${tiles.map(t => `
    <div class="menu-tile" onclick="${t.fn || `openPage('${t.tab}')`}">
      <div class="menu-tile-icon">${t.emoji}</div>
      <div class="menu-tile-label">${t.label}</div>
    </div>`).join('')}</div>`;
}

/* ================================================================
   EXPOSE GLOBALS
   ================================================================ */
window.showScreen = showScreen;
window.openLogin = openLogin;
window.openRegister = openRegister;
window.openForgot = openForgot;
window.showMain = showMain;
window.closeWelcomeModal = closeWelcomeModal;
window.openModal = openModal;
window.closeModal = closeModal;
window.renderTopbar = renderTopbar;
window.toggleNav = toggleNav;
window.switchTab = switchTab;
window.openPage = openPage;
window.backToMain = backToMain;
window.renderAll = renderAll;
window.renderShops = renderShops;
window.openShopModal = openShopModal;
window.selectShopType = selectShopType;
window.confirmShopBuy = confirmShopBuy;
window.openShopDetail = openShopDetail;
window.addReyonToShop = addReyonToShop;
window.removeReyon = removeReyon;
window.buyStock = buyStock;
window.renderBahceler = renderBahceler;
window.renderCiftlikler = renderCiftlikler;
window.renderFabrikalar = renderFabrikalar;
window.renderMadenler = renderMadenler;
window.openTesisModal = openTesisModal;
window.renderBank = renderBank;
window.openDepositModal = openDepositModal;
window.confirmDeposit = confirmDeposit;
window.renderKriptoPage = renderKriptoPage;
window.quickBuyKripto = quickBuyKripto;
window.quickSellKripto = quickSellKripto;
window.renderLojistik = renderLojistik;
window.openDepoModal = openDepoModal;
window.submitDepo = submitDepo;
window.renderIhracat = renderIhracat;
window.renderIhale = renderIhale;
window.generateIhaleler = generateIhaleler;
window.openIhaleBid = openIhaleBid;
window.submitIhaleBid = submitIhaleBid;
window.renderRanking = renderRanking;
window.renderNotifications = renderNotifications;
window.renderChatPage = renderChatPage;
window.renderChatMessages = renderChatMessages;
window.sendChat = sendChat;
window.renderProfile = renderProfile;
window.confirmSignOut = confirmSignOut;
window.renderMarka = renderMarka;
window.renderNews = renderNews;
window.renderCities = renderCities;
window.renderFaq = renderFaq;
window.toggleFaq = toggleFaq;
window.renderSettings = renderSettings;
window.renderPazar = renderPazar;
window.submitPazarListing = submitPazarListing;
window.renderMenu = renderMenu;
window.renderNakitTycoon = renderNakitTycoon;
