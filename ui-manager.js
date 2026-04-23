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
      <div class="card">
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
  renderTycoonSection('tc-isletme', [
    { emoji: '🏪', name: 'Dükkanlar',   val: state.shops.length + ' Dükkan', tab: 'dukkanlar' },
    { emoji: '🌿', name: 'Bahçeler',    val: (state.tesisler.bahce?.length || 0) + ' Bahçe', tab: 'bahceler' },
    { emoji: '🐄', name: 'Çiftlikler',  val: (state.tesisler.ciftlik?.length || 0) + ' Çiftlik', tab: 'ciftlikler' },
    { emoji: '🏭', name: 'Fabrikalar',  val: (state.tesisler.fabrika?.length || 0) + ' Fabrika', tab: 'fabrikalar' },
    { emoji: '⛏️', name: 'Madenler',    val: (state.tesisler.maden?.length || 0) + ' Maden', tab: 'madenler' }
  ]);
  renderTycoonSection('tc-pazar', [
    { emoji: '📦', name: 'Lojistik', val: (state.depolar?.length || 0) + ' Depo', tab: 'lojistik' },
    { emoji: '🌍', name: 'İhracat',  val: (state.exportOrders?.length || 0) + ' Sipariş', tab: 'ihracat' },
    { emoji: '🔨', name: 'İhale',    val: 'Aktif', tab: 'ihale' },
    { emoji: '🛒', name: 'Oyuncu Pazarı', val: (state.pazarListings?.length || 0) + ' İlan', tab: 'pazar' }
  ]);
  renderTycoonSection('tc-finans', [
    { emoji: '🏦', name: 'Banka',    val: fmt(state.bank?.balance || 0) + ' ₺', tab: 'bank' },
    { emoji: '📈', name: 'Kripto',   val: 'Piyasa', tab: 'kripto' },
    { emoji: '🎰', name: 'Çark',     val: 'Günlük', tab: 'menu' },
    { emoji: '🏢', name: 'Marka',    val: state.myMarka || 'Yok', tab: 'marka' }
  ]);
}

function renderTycoonSection(id, items) {
  const el = document.getElementById(id);
  if (!el) return;
  el.innerHTML = items.map(item => `
    <div class="tc-card" onclick="switchTab('${item.tab}')">
      <div class="tc-card-emoji">${item.emoji}</div>
      <div class="tc-card-name">${item.name}</div>
      <div class="tc-card-val">${item.val}</div>
    </div>`).join('');
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
  let players = [...MOCK_PLAYERS];
  if (myName) {
    players.push({ name: myName, emoji: '😊', lvl: state.level, money: state.money });
    players.sort((a, b) => b.money - a.money);
    players = players.slice(0, 20);
  }
  body.innerHTML = players.map((p, i) => {
    const pos = i + 1;
    const cls = pos === 1 ? 'gold' : pos === 2 ? 'silver' : pos === 3 ? 'bronze' : '';
    const isMe = p.name === myName;
    return `
      <div class="rank-item" ${isMe ? 'style="background:rgba(99,102,241,.06);border-left:2px solid #6366f1"' : ''}>
        <div class="rank-pos ${cls}">${pos}</div>
        <div class="rank-av">${p.emoji}</div>
        <div class="rank-info">
          <div class="rank-name">${p.name}${isMe ? ' (Sen)' : ''}</div>
          <div class="rank-sub">Sv${p.lvl}</div>
        </div>
        <div class="rank-money">${fmtShort(p.money)} ₺</div>
      </div>`;
  }).join('');
}

/* ================================================================
   NOTIFICATIONS
   ================================================================ */
function renderNotifications() {
  const body = document.getElementById('notifications-body');
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
  const body = document.getElementById('chat-messages-body');
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
  const input = document.getElementById('chat-input');
  if (!input) return;
  const text = input.value.trim();
  if (!text) return;
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
  body.innerHTML = MARKALAR.map(m => `
    <div class="marka-item">
      <div class="marka-rank ${m.rank === 1 ? 'gold' : m.rank === 2 ? 'silver' : m.rank === 3 ? 'bronze' : ''}">#${m.rank}</div>
      <div class="marka-logo" style="background:${m.color};color:#fff">${m.emoji}</div>
      <div class="marka-info">
        <div class="marka-name">${m.name}</div>
        <div class="marka-meta">Lider: ${m.lider}</div>
        <div style="margin-top:4px">
          <span class="marka-chip">🏆 ${m.tp.toLocaleString()}</span>
          <span class="marka-chip">⚡ x${m.guc}</span>
          <span class="marka-chip">👥 ${m.uyeler}</span>
        </div>
      </div>
      <button class="btn-blue" style="padding:7px 12px;font-size:11px;flex-shrink:0" onclick="joinMarka('${m.name}')">+ Katıl</button>
    </div>`).join('') + `
    <div style="padding:14px">
      <button class="btn-create" style="width:100%" onclick="toast('Marka kurma yakında 🚀','')">🏗️ Kendi Markamı Kur</button>
    </div>`;
}

/* ================================================================
   NEWS
   ================================================================ */
const NEWS_DATA = [
  { emoji: '📈', title: 'Kripto Piyasasında Rekor Kırıldı!', text: 'Vortigon bugün tarihi zirvesine ulaştı. Yatırımcılar %40 getiri elde etti.', date: '2 saat önce', color: 'linear-gradient(135deg,#6366f1,#4f46e5)' },
  { emoji: '🏭', title: 'Yeni Fabrika Bölgesi Açıldı', text: 'Ankara\'da yeni sanayi bölgesi kuruluyor. Fabrika maliyetleri düşecek!', date: '5 saat önce', color: 'linear-gradient(135deg,#64748b,#475569)' },
  { emoji: '🌍', title: 'İhracat Rekor Kırdı', text: 'Bu ay ihracat rakamları geçen yılın aynı dönemine göre %35 arttı.', date: '1 gün önce', color: 'linear-gradient(135deg,#10b981,#059669)' },
  { emoji: '🥇', title: 'Altın Fiyatları Yükseliyor', text: 'Global belirsizlik altın madenlerine olan ilgiyi artırdı.', date: '2 gün önce', color: 'linear-gradient(135deg,#fbbf24,#d97706)' }
];

function renderNews() {
  const body = document.getElementById('news-body');
  if (!body) return;
  body.innerHTML = NEWS_DATA.map(n => `
    <div class="news-card">
      <div class="news-hero" style="background:${n.color}">${n.emoji}</div>
      <div class="news-bi">
        <div class="news-title">${n.title}</div>
        <div class="news-text">${n.text}</div>
        <div class="news-date">⏰ ${n.date}</div>
        <div class="news-reactions">
          <div class="reaction">👍 ${Math.floor(Math.random() * 200 + 10)}</div>
          <div class="reaction">🔥 ${Math.floor(Math.random() * 100 + 5)}</div>
          <div class="reaction">💬 ${Math.floor(Math.random() * 50)}</div>
        </div>
      </div>
    </div>`).join('');
}

/* ================================================================
   CITIES
   ================================================================ */
function renderCities() {
  const body = document.getElementById('cities-body');
  if (!body) return;
  body.innerHTML = `
    <div style="padding:12px 14px;color:var(--tm);font-size:13px">81 ilde dükkan açabilirsin. Büyük şehirlerde gelir çarpanı daha yüksek.</div>
    ${CITIES.map(c => {
      const shopsHere = state.shops.filter(s => s.cityId === c.id).length;
      return `
        <div class="city-card">
          <div style="font-size:28px">${c.emoji}</div>
          <div style="flex:1">
            <div style="font-weight:700">${c.name}</div>
            <div style="font-size:11px;color:var(--tm)">${c.region} · x${c.mult} çarpan</div>
          </div>
          <div style="text-align:right">
            <div style="font-size:12px;color:var(--neon)">${shopsHere} dükkan</div>
          </div>
        </div>`;
    }).join('')}`;
}

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
  body.innerHTML = `
    <div class="sec-label">GÖRÜNÜM</div>
    <div class="settings-row">
      <div><div class="settings-label">Ses</div><div class="settings-sub">Oyun sesleri</div></div>
      <div class="toggle on" onclick="this.classList.toggle('on')"></div>
    </div>
    <div class="settings-row">
      <div><div class="settings-label">Müzik</div><div class="settings-sub">Arka plan müziği</div></div>
      <div class="toggle on" onclick="this.classList.toggle('on')"></div>
    </div>
    <div class="settings-row">
      <div><div class="settings-label">Bildirimler</div><div class="settings-sub">Anlık bildirimler</div></div>
      <div class="toggle on" onclick="this.classList.toggle('on')"></div>
    </div>
    <div class="sec-label">HESAP</div>
    <div class="settings-row">
      <div><div class="settings-label">Dil</div><div class="settings-sub">Arayüz dili</div></div>
      <div style="color:var(--tm);font-size:13px">Türkçe ▼</div>
    </div>
    <div class="settings-row">
      <div><div class="settings-label">Tema</div><div class="settings-sub">Karanlık mod</div></div>
      <div class="toggle on" onclick="this.classList.toggle('on')"></div>
    </div>
    <div class="sec-label">GÜVENLİK</div>
    <div class="settings-row" onclick="toast('Yakında 🔜','')">
      <div><div class="settings-label">Gizlilik Ayarları</div></div>
      <div style="color:var(--tm)">›</div>
    </div>
    <div class="settings-row" onclick="toast('Yakında 🔜','')">
      <div><div class="settings-label">Hesap Bağlantıları</div></div>
      <div style="color:var(--tm)">›</div>
    </div>
    <div style="padding:16px;margin-top:8px">
      <button class="btn-red" style="width:100%" onclick="confirmSignOut()">🚪 Çıkış Yap</button>
    </div>`;
}

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
