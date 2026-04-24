/* ================================================================
   ui-manager.js — Game Zone ERP v5.0
   Tüm sayfa render fonksiyonları ve navigation yönetimi
   ================================================================ */

/* ---- LEVEL & XP ---- */
function checkLevel() {
  const cap = state.level * 500;
  while (state.xp >= cap) { state.xp -= cap; state.level++; toast('🎉 SEVİYE ' + state.level + '!', 'success'); confetti(); }
}

/* ---- TOPBAR ---- */
function renderTopbar() {
  document.getElementById('level-num').textContent = state.level;
  const cap = state.level * 500;
  document.getElementById('xp-text').textContent = state.xp + '/' + cap;
  document.getElementById('xp-fill').style.width = (Math.min(state.xp / cap, 1) * 100) + '%';
  document.getElementById('diamond-count').textContent = state.diamonds || 0;
  document.getElementById('money-count').textContent = fmt(state.money) + ' ₺';
  const unread = (state.notifications || []).filter(n => !n.read).length;
  const badge = document.getElementById('notif-badge');
  if (badge) { badge.textContent = unread; badge.style.display = unread > 0 ? 'grid' : 'none'; }
  const cc = document.getElementById('coupon-cnt'); if (cc) cc.textContent = state.coupons || 0;
  const tb = document.getElementById('tycoon-bal'); if (tb) tb.textContent = fmt(state.money) + ' ₺';
}

/* ---- RENDER ALL ---- */
function renderAll() {
  renderTopbar();
  const active = document.querySelector('.page.active'); if (!active) return;
  const id = active.id.replace('page-', '');
  const map = {
    dukkanlar: renderShops, bahceler: renderBahceler, ciftlikler: renderCiftlikler,
    fabrikalar: renderFabrikalar, madenler: renderMadenler, bank: renderBank,
    profile: renderProfile, notifications: renderNotifications, ranking: renderRanking,
    nakit: renderNakitTycoon, lojistik: renderLojistik, ihracat: renderIhracat,
    ihale: renderIhale, kripto: renderKriptoPage, enerji: renderEnerji,
    marka: renderMarka, news: renderNews, cities: renderCities,
    faq: renderFaq, settings: renderSettings, pazar: renderPazar
  };
  if (map[id]) map[id]();
}

/* ---- NAVIGATION ---- */
let currentNav = 'isletme';

function toggleNav() {
  if (currentNav === 'isletme') {
    currentNav = 'piyasa';
    document.getElementById('nav-isletme').style.display = 'none';
    document.getElementById('nav-piyasa').style.display = 'flex';
    switchTab('nakit');
  } else {
    currentNav = 'isletme';
    document.getElementById('nav-piyasa').style.display = 'none';
    document.getElementById('nav-isletme').style.display = 'flex';
    switchTab('dukkanlar');
  }
}

function switchTab(tab) {
  document.querySelectorAll('.bottomnav .nav-item').forEach(b => b.classList.remove('active'));
  const btn = document.querySelector(`.nav-item[data-tab="${tab}"]`); if (btn) btn.classList.add('active');
  document.querySelectorAll('.page').forEach(p => { p.classList.remove('active'); p.style.display = 'none'; });
  const pg = document.getElementById('page-' + tab); if (pg) { pg.style.removeProperty('display'); pg.classList.add('active'); }
  const ca = document.getElementById('content-area'); if (ca) ca.scrollTop = 0;
  renderAll();
}

function openPage(id) {
  document.querySelectorAll('.page').forEach(p => { p.classList.remove('active'); p.style.display = 'none'; });
  const pg = document.getElementById('page-' + id); if (pg) { pg.style.removeProperty('display'); pg.classList.add('active'); }
  const ca = document.getElementById('content-area'); if (ca) ca.scrollTop = 0;
  renderAll();
}

function backToMain() {
  if (currentNav === 'isletme') switchTab('dukkanlar'); else switchTab('nakit');
}

/* ================================================================
   SAYFA RENDER FONKSİYONLARI
   ================================================================ */

/* ---- DÜKKANLAR ---- */
function renderShops() {
  const body = document.getElementById('dukkanlar-body');
  if (!state.shops.length) {
    body.innerHTML = '<div class="empty"><div class="empty-lock">🏪</div><div class="empty-big">Henüz işletmeniz yok</div><div class="empty-text">İlk dükkanını aç ve para kazanmaya başla!</div><button class="btn-create" onclick="openShopModal()">+ Yeni Dükkan Aç</button></div>';
    return;
  }
  body.innerHTML = state.shops.map((s, i) => {
    const t = SHOP_TYPES.find(x => x.id === s.type); const c = CITIES.find(x => x.id === s.cityId);
    const reyonlar = s.reyonlar || []; const totalStock = reyonlar.reduce((a, r) => a + (r.stock || 0), 0);
    const stokUyarisi = reyonlar.length > 0 && totalStock <= 0;
    const elapsed = (Date.now() - (s.lastCollect || Date.now())) / 3600000;
    const pending = Math.floor(t.income * (s.lvl || 1) * Math.min(8, elapsed));
    return `<div class="card" style="cursor:pointer" onclick="openShopDetail(${i})">
      <div class="card-header">
        <div class="card-icon cat-${t.cat}">${t.emoji}</div>
        <div style="flex:1">
          <div class="card-title">${t.name}</div>
          <div class="card-sub">${c.name} · Sv${s.lvl || 1}${stokUyarisi ? ' · ⚠️ Stok Yok!' : ' · Stok: ' + totalStock}</div>
        </div>
        <div style="text-align:right">
          <div style="font-size:10px;color:var(--tm)">Birikmiş</div>
          <div style="font-weight:800;color:#10b981">${fmt(pending)} ₺</div>
        </div>
      </div>
      <div style="display:flex;gap:8px">
        <button class="btn-green" style="flex:1;padding:10px" onclick="event.stopPropagation();collectIncome(${i})">💰 Topla</button>
        <button class="btn-yellow" style="flex:1;padding:10px" onclick="event.stopPropagation();upgradeShop(${i})">⬆️ Yükselt</button>
      </div>
    </div>`;
  }).join('') + '<div style="padding:12px"><button class="btn-create" style="width:100%" onclick="openShopModal()">+ Yeni Dükkan Aç</button></div>';
}

/* ---- ÜRETİM ---- */
function renderBahceler()   { renderUretimPage('bahceler-body',  BAHCE_T,   'bahce',   5,  '5. Seviyede Açılacak');  }
function renderCiftlikler() { renderUretimPage('ciftlikler-body',CIFTLIK_T, 'ciftlik', 10, '10. Seviyede Açılacak'); }
function renderFabrikalar() { renderUretimPage('fabrikalar-body',FABRIKA_T, 'fabrika', 20, '20. Seviyede Açılacak'); }
function renderMadenler()   { renderUretimPage('madenler-body',  MADEN_T,   'maden',   30, '30. Seviyede Açılacak'); }

/* ---- BANKA ---- */
function renderBank() {
  const b = state.bank || {}; const limit = state.level * 10000;
  const totalVarlik = state.money + (b.balance || 0) + (b.investment || 0) - (b.credit || 0);
  const faiz = ((b.investment || 0) * 0.08 / 365).toFixed(2);
  document.getElementById('bank-body').innerHTML = `
    <div class="card" style="background:linear-gradient(135deg,#1e1b4b,#312e81);border-color:rgba(99,102,241,.3)">
      <div style="font-size:12px;opacity:.7;margin-bottom:4px">TOPLAM VARLIK</div>
      <div style="font-size:28px;font-weight:800;color:#fbbf24">${fmtShort(totalVarlik)}</div>
      <div style="font-size:11px;opacity:.6;margin-top:4px">Nakit + Banka + Yatırım - Kredi</div>
    </div>
    <div class="sec-label">HESAPLAR</div>
    <div style="padding:0 14px">
      <div class="action-row" onclick="bankAction('deposit')"><div style="flex:1"><div style="font-size:12px;color:var(--tm);margin-bottom:2px">Vadesiz Hesap</div><div style="font-size:16px;font-weight:700">${fmt(b.balance || 0)} ₺</div></div><div class="action-icon ai-blue">💸</div></div>
      <div class="action-row" onclick="bankAction('invest')"><div style="flex:1"><div style="font-size:12px;color:var(--tm);margin-bottom:2px">Yatırım Hesabı (%8/yıl) · Günlük: +${fmt(faiz)} ₺</div><div style="font-size:16px;font-weight:700;color:#10b981">${fmt(b.investment || 0)} ₺</div></div><div class="action-icon ai-green">📈</div></div>
      <div class="action-row" onclick="bankAction('credit')"><div style="flex:1"><div style="font-size:12px;color:var(--tm);margin-bottom:2px">Kredi Borcu · Limit: ${fmt(limit)} ₺</div><div style="font-size:16px;font-weight:700;color:${(b.credit || 0) > 0 ? '#ef4444' : 'var(--tx)'}">${fmt(b.credit || 0)} ₺</div></div><div class="action-icon ai-red">💳</div></div>
    </div>
    <div class="sec-label">ÖDEMELER</div>
    <div style="padding:0 14px 20px">
      <div class="action-row" onclick="payExpense()"><div style="flex:1"><div style="font-size:12px;color:var(--tm);margin-bottom:2px">İşletme Giderleri (haftalık)</div><div style="font-size:15px;font-weight:700;color:#ef4444">${fmt(state.weeklyExpense || 0)} ₺</div></div><div class="action-icon ai-yellow">💵</div></div>
      <div class="action-row" onclick="paySalary()"><div style="flex:1"><div style="font-size:12px;color:var(--tm);margin-bottom:2px">Çalışan Maaşları (haftalık)</div><div style="font-size:15px;font-weight:700;color:#ef4444">${fmt(state.weeklySalary || 0)} ₺</div></div><div class="action-icon ai-yellow">💵</div></div>
    </div>`;
  // Günlük faiz
  if ((b.investment || 0) > 0) {
    const gunlukFaiz = parseFloat(faiz);
    if (gunlukFaiz > 0 && !b._lastFaiz) { b._lastFaiz = Date.now(); }
    if (b._lastFaiz && Date.now() - b._lastFaiz > 86400000) { b.profit = (b.profit || 0) + gunlukFaiz; b.balance = (b.balance || 0) + gunlukFaiz; b._lastFaiz = Date.now(); saveState(); }
  }
}

/* ---- BİLDİRİMLER ---- */
function renderNotifications() {
  const body = document.getElementById('notif-body');
  if (!(state.notifications || []).length) { body.innerHTML = '<div class="empty"><div class="empty-lock">🔔</div><div class="empty-text">Bildirim yok.</div></div>'; return; }
  body.innerHTML = state.notifications.map(n => `<div class="card" style="margin:8px 12px;padding:12px;border-left:3px solid ${n.read ? 'var(--br)' : '#6366f1'}"><div style="font-size:13px;line-height:1.5">${n.text}</div><div style="font-size:11px;color:var(--tm);margin-top:4px">${n.time}</div></div>`).join('');
  state.notifications.forEach(n => n.read = true); saveState(); setTimeout(renderTopbar, 500);
}

/* ---- CHAT ---- */
let _chatInited = false;

function initRealtimeChat() {
  if (_chatInited || !fbRtdb) return;
  _chatInited = true;

  const chatRef = fbRtdb.ref('chat').orderByChild('ts').limitToLast(60);

  /* Eski listener'ı temizle */
  if (fbChatUnsub) { try { fbChatUnsub(); } catch(_) {} }

  /* Yeni listener — compat API */
  chatRef.on('value', snap => {
    const msgs = [];
    snap.forEach(c => { msgs.push(c.val()); });
    msgs.reverse();
    renderChatMessages(msgs);
  });

  /* Unsubscribe fonksiyonu olarak off() referansını sakla */
  fbChatUnsub = () => chatRef.off('value');
}

function renderChatMessages(msgs) {
  const el = document.getElementById('chat-messages'); if (!el) return;
  if (!msgs || !msgs.length) {
    el.innerHTML = '<div class="empty"><div class="empty-lock">💬</div><div class="empty-text">İlk mesajı sen gönder!</div></div>';
    return;
  }
  const myName = state.user?.name || '';
  el.innerHTML = msgs.map(m =>
    `<div class="chat-msg ${m.user === myName ? 'mine' : ''}">
      <div class="chat-msg-av">${(m.user || '?')[0]?.toUpperCase()}</div>
      <div class="chat-msg-body">
        <div class="chat-msg-head"><span class="chat-msg-name">${m.user || '?'}</span><span class="chat-msg-time">· ${m.time || ''}</span></div>
        <div class="chat-msg-text">${m.text || ''}</div>
      </div>
    </div>`
  ).join('');
}

function renderChat() {
  if (fbRtdb) initRealtimeChat();
  else renderChatMessages([...state.chatHistory, ...CHAT_SEED]);
}

function sendChat() {
  const inp = document.getElementById('chat-text');
  const txt = inp.value.trim(); if (!txt) return;

  if (['hack','hile','exploit','cheat'].some(w => txt.toLowerCase().includes(w))) {
    toast('Bu içerik gönderilemez', 'error'); return;
  }

  const name = state.user?.name || 'Oyuncu';
  const now  = new Date();
  const time = now.getHours() + ':' + String(now.getMinutes()).padStart(2, '0');

  if (fbRtdb) {
    fbRtdb.ref('chat').push({ user: name, text: txt, time, ts: Date.now() })
      .catch(e => console.warn('chat push:', e));
  } else {
    state.chatHistory.unshift({ user: name, text: txt, time: 'şimdi' });
    renderChat();
    saveState();
  }

  inp.value = '';
}

/* ---- PROFİL ---- */
function renderProfile() {
  const body = document.getElementById('profile-body'); const name = state.user?.name || 'Oyuncu';
  const totalVarlik = state.money + (state.bank?.balance || 0) + (state.bank?.investment || 0);
  const uid = state.user?.uid || fbUser?.uid || '—';
  body.innerHTML = `
    <div class="profile-hero">
      <div class="profile-avatar">${name[0]?.toUpperCase() || '?'}</div>
      <div style="flex:1">
        <div class="profile-name">${name}</div>
        <div class="profile-id">ID: ${uid.slice(0, 8)}...</div>
        <div style="margin-top:6px"><span style="background:rgba(99,102,241,.2);color:#818cf8;padding:3px 10px;border-radius:20px;font-size:12px;font-weight:700">Seviye ${state.level}</span></div>
      </div>
      <button style="width:38px;height:38px;border-radius:12px;background:rgba(255,255,255,.08);display:grid;place-items:center;font-size:18px;border:1px solid rgba(255,255,255,.1)" onclick="openPage('settings')">⚙️</button>
    </div>
    <div style="padding:12px;background:rgba(99,102,241,.06);border-bottom:1px solid var(--br)">
      <div style="font-size:11px;color:var(--tm);margin-bottom:4px">TOPLAM NET VARLIK</div>
      <div style="font-size:24px;font-weight:800;color:#fbbf24">${fmtShort(totalVarlik)}</div>
    </div>
    <div class="profile-stats">
      <div class="profile-stat"><div class="profile-stat-label">Nakit</div><div class="profile-stat-value" style="color:#10b981">💵 ${fmtShort(state.money)}</div></div>
      <div class="profile-stat"><div class="profile-stat-label">Banka</div><div class="profile-stat-value">🏦 ${fmtShort(state.bank?.balance || 0)}</div></div>
      <div class="profile-stat"><div class="profile-stat-label">Yatırım</div><div class="profile-stat-value" style="color:#6366f1">📈 ${fmtShort(state.bank?.investment || 0)}</div></div>
      <div class="profile-stat"><div class="profile-stat-label">Elmas</div><div class="profile-stat-value">💎 ${state.diamonds || 0}</div></div>
      <div class="profile-stat"><div class="profile-stat-label">Haftalık Gider</div><div class="profile-stat-value" style="color:#ef4444">💸 ${fmtShort(state.weeklyExpense || 0)}</div></div>
      <div class="profile-stat"><div class="profile-stat-label">Maaş</div><div class="profile-stat-value" style="color:#ef4444">💸 ${fmtShort(state.weeklySalary || 0)}</div></div>
      <div class="profile-stat"><div class="profile-stat-label">Çalışan</div><div class="profile-stat-value">👥 ${state.employees || 0}</div></div>
      <div class="profile-stat"><div class="profile-stat-label">Moral</div><div class="profile-stat-value" style="color:${(state.moral || 100) >= 80 ? '#10b981' : '#ef4444'}">${(state.moral || 100) >= 80 ? '😊' : '😢'} %${state.moral || 100}</div></div>
    </div>
    <div style="padding:0 14px 14px;display:flex;gap:8px">
      <button class="btn-create" style="flex:1" onclick="openPage('ranking')">🏆 Liderlik</button>
      <button class="btn-green" style="flex:1" onclick="openPage('bank')">🏦 Banka</button>
    </div>`;
}

/* ---- RANKING ---- */
function renderRanking() {
  const body = document.getElementById('ranking-body');
  const myTotal = state.money + (state.bank?.balance || 0) + (state.bank?.investment || 0);
  const myName = state.user?.name || 'Sen';
  const combined = [...MOCK_PLAYERS.map(p => ({ ...p, total: p.money })), { name: myName, emoji: '⭐', lvl: state.level, total: myTotal, isMe: true }].sort((a, b) => b.total - a.total).slice(0, 10);
  const posC = ['p1', 'p2', 'p3', 'pn', 'pn', 'pn', 'pn', 'pn', 'pn', 'pn'];
  body.innerHTML = '<div style="padding:10px 14px 4px;font-size:14px;font-weight:700;color:var(--tx)">🏆 En Zengin 10 Oyuncu</div>' +
    combined.map((p, i) => `<div class="ranking-item" style="${p.isMe ? 'background:rgba(99,102,241,.08);border-left:3px solid #6366f1;' : ''}"><div class="ranking-pos ${posC[i]}">${i + 1}</div><div class="ranking-av">${p.emoji || '🙂'}</div><div class="ranking-info"><div class="ranking-name">${p.name}${p.isMe ? ' (Sen)' : ''}</div><div class="ranking-level">Seviye ${p.lvl || 1}</div></div><div class="ranking-money">${fmtShort(p.total)}</div></div>`).join('');
}

/* ---- HABERLER ---- */
function renderNews() {
  document.getElementById('news-body').innerHTML = `
    <div class="news-card"><div class="news-hero" style="background:linear-gradient(135deg,#4c1d95,#6d28d9)">🔥</div><div class="news-bi"><div class="news-title">Oyuncu Pazarı Açıldı!</div><div class="news-text">Artık kendi ürünlerini diğer oyunculara satabilirsin. Menü → Oyuncu Pazarı</div><div class="news-date">23 Nisan 2026</div><div class="news-reactions"><span class="reaction">🎉 812</span><span class="reaction">❤️ 234</span></div></div></div>
    <div class="news-card"><div class="news-hero" style="background:linear-gradient(135deg,#7c2d12,#ea580c)">🔥</div><div class="news-bi"><div class="news-title">Fırınlarda Ramazan Mesaisi Başladı!</div><div class="news-text">Ekmek fabrikaları Ramazan için tam kapasite çalışıyor.</div><div class="news-date">21 Nisan 2026</div><div class="news-reactions"><span class="reaction">😊 534</span><span class="reaction">🤣 69</span></div></div></div>
    <div class="news-card"><div class="news-hero" style="background:linear-gradient(135deg,#1e1b4b,#4f46e5);font-size:56px">📈</div><div class="news-bi"><div class="news-title">Bahar Gelişi Tüketimi Artırdı</div><div class="news-text">Butik ve kuyumcu işletmeleri cirolarını ikiye katladı.</div><div class="news-date">19 Nisan 2026</div><div class="news-reactions"><span class="reaction">😊 412</span><span class="reaction">😱 14</span></div></div></div>`;
}

/* ---- ŞEHİRLER ---- */
function renderCities() {
  document.getElementById('city-list').innerHTML = CITIES.map((c, i) => `<div class="city-card"><div style="width:32px;height:32px;border-radius:10px;background:rgba(99,102,241,.15);color:#818cf8;font-weight:800;font-size:13px;display:grid;place-items:center;flex-shrink:0">${i + 1}</div><div><div style="font-weight:800;font-size:14px">${c.name}</div><div style="font-size:12px;color:var(--tm)">${(c.pop / 1000000).toFixed(1)}M nüfus</div></div></div>`).join('');
}

/* ---- SSS ---- */
function renderFaq() {
  document.getElementById('faq-body').innerHTML = FAQ.map((f, i) => `<div style="background:var(--card2);border-radius:12px;margin:8px 14px;padding:14px;border:1px solid var(--br)"><div style="font-weight:700;font-size:14px;margin-bottom:6px;display:flex;gap:8px"><span style="color:#6366f1">${i + 1}.</span><div>${f.q}</div></div><div style="font-size:13px;color:var(--tm);line-height:1.6;padding-left:20px">${f.a}</div></div>`).join('');
}

/* ---- AYARLAR ---- */
function renderSettings() {
  document.getElementById('settings-body').innerHTML = `<div style="padding:14px"><div class="card"><div class="card-header"><div class="card-icon" style="background:linear-gradient(135deg,#ef4444,#991b1b)">⚠️</div><div><div class="card-title">Hesap</div><div class="card-sub">Oturum ve sıfırlama</div></div></div><button class="btn-yellow" style="width:100%;margin-bottom:8px;padding:12px" onclick="logoutGame()">🚪 Çıkış Yap</button><button class="btn-red" style="width:100%;padding:12px" onclick="resetGame()">🗑️ Hesabı Sıfırla</button></div></div>`;
}

/* ---- NAKIT TYCOON ---- */
function renderNakitTycoon() {
  const tb = document.getElementById('tycoon-bal'); if (tb) tb.textContent = fmt(state.money) + ' ₺';
  const lvl = state.level;
  const cards = (list) => list.map(c => `<div class="tycoon-card ${c.locked ? 'locked' : ''}" onclick="${c.locked ? `toast('Seviye ${c.minLvl} gerekli','error')` : c.page ? `openPage('${c.page}')` : c.tab ? `switchTab('${c.tab}')` : ''}">
    <div class="tycoon-card-emoji">${c.emoji}</div><div class="tycoon-card-name">${c.name}</div><div class="tycoon-card-desc">${c.desc}</div>
    <span class="tycoon-card-badge ${c.locked ? 'tc-badge-lock' : 'tc-badge-ok'}">${c.locked ? '🔒 Sv' + c.minLvl : c.badge}</span></div>`).join('');
  const i = document.getElementById('tc-isletme');
  if (i) i.innerHTML = cards([
    { emoji: '🏪', name: 'Dükkanlar',  desc: 'Ürün sat, kazanç topla',    tab: 'dukkanlar',  locked: false,       badge: 'Aktif' },
    { emoji: '🌾', name: 'Bahçeler',   desc: 'Doğal ürün üretimi',        tab: 'bahceler',   locked: lvl < 5,  minLvl: 5,  badge: 'Aktif' },
    { emoji: '🥚', name: 'Çiftlikler', desc: 'Hayvancılık geliri',        tab: 'ciftlikler', locked: lvl < 10, minLvl: 10, badge: 'Aktif' },
    { emoji: '🏭', name: 'Fabrikalar', desc: 'Seri üretim',               tab: 'fabrikalar', locked: lvl < 20, minLvl: 20, badge: 'Aktif' },
    { emoji: '⛏️', name: 'Madenler',   desc: 'Ham madde',                  tab: 'madenler',   locked: lvl < 30, minLvl: 30, badge: 'Aktif' }
  ]);
  const p = document.getElementById('tc-pazar');
  if (p) p.innerHTML = cards([
    { emoji: '🚚', name: 'Lojistik', desc: 'Depo & taşıma',      tab: 'lojistik', locked: false, badge: 'Aktif' },
    { emoji: '🚢', name: 'İhracat',  desc: 'Dünyaya sat',         tab: 'ihracat',  locked: false, badge: 'Aktif' },
    { emoji: '🔨', name: 'İhale',    desc: 'İhaleler',             tab: 'ihale',    locked: false, badge: 'Aktif' },
    { emoji: '⚡', name: 'Enerji',   desc: 'Enerji piyasası',     tab: 'enerji',   locked: lvl < 8, minLvl: 8, badge: 'Aktif' },
    { emoji: '🛍️', name: 'Pazar',    desc: 'Oyuncu alışverişi',  page: 'pazar',   locked: false, badge: 'Aktif' }
  ]);
  const f = document.getElementById('tc-finans');
  if (f) f.innerHTML = cards([
    { emoji: '💰', name: 'Kripto',   desc: 'Kripto al-sat',       tab: 'kripto', locked: lvl < 5, minLvl: 5, badge: 'Aktif' },
    { emoji: '🏆', name: 'Markalar', desc: 'Marka sıralaması',    tab: 'marka',  locked: false, badge: 'Aktif' },
    { emoji: '🏦', name: 'Banka',    desc: 'Gelişmiş bankacılık', page: 'bank',  locked: false, badge: 'Aktif' }
  ]);
}

/* ---- LOJİSTİK ---- */
function renderLojistik() {
  const body = document.getElementById('lojistik-body'); const dep = state.depolar || [];
  if (!dep.length) { body.innerHTML = '<div class="empty"><div class="empty-lock">🏢</div><div class="empty-big">Depo Bulunmamaktadır!</div><div class="empty-text">Seviyene uygun depo aç ve ihracat yap!</div><button class="btn-create" onclick="openDepoModal()">Depo Aç</button></div>'; return; }
  body.innerHTML = dep.map(d => `<div class="card"><div style="display:flex;align-items:center;gap:12px;margin-bottom:12px"><div style="width:48px;height:48px;border-radius:12px;background:linear-gradient(135deg,#f59e0b,#d97706);display:grid;place-items:center;font-size:24px">🏢</div><div style="flex:1"><div style="font-weight:800;font-size:15px">${d.city}</div><div style="font-size:12px;color:var(--tm)">${d.tip || 'Depo'} · ${d.cap.toLocaleString()} birim</div></div><div style="text-align:right"><div style="font-size:11px;color:var(--tm)">Doluluk</div><div style="font-weight:800;color:#6366f1">${Math.floor(((d.used || 0) / d.cap) * 100)}%</div></div></div><div style="height:5px;background:rgba(255,255,255,.1);border-radius:3px;margin-bottom:10px"><div style="width:${Math.floor(((d.used || 0) / d.cap) * 100)}%;height:100%;background:linear-gradient(90deg,#6366f1,#4f46e5);border-radius:3px"></div></div><div class="row"><span class="row-label">Depolanan</span><span class="row-value">${(d.used || 0).toLocaleString()} birim</span></div><div class="row"><span class="row-label">Aylık Maliyet</span><span class="row-value red">${fmt(d.cap * 0.5)} ₺</span></div></div>`).join('') +
    '<div style="padding:12px"><button class="btn-create" style="width:100%" onclick="openDepoModal()">+ Yeni Depo Aç</button></div>';
}

/* ---- İHRACAT ---- */
function renderIhracat() {
  generateExportOrders(); const body = document.getElementById('ihracat-body');
  body.innerHTML = state.exportOrders.map((o, i) => {
    const pct = Math.round(o.sent / o.qty * 100);
    return `<div class="card" style="margin:8px 12px;padding:12px"><div style="display:flex;align-items:center;gap:10px;margin-bottom:8px"><span style="font-size:20px">${o.country.flag}</span><div style="flex:1"><div style="font-weight:700;font-size:13px">${o.country.name}</div><div style="font-size:12px;color:var(--tm)">${o.qty.toLocaleString()} ${o.product.unit} ${o.product.name} ${o.product.emoji}</div></div><button style="padding:7px 12px;border-radius:8px;background:rgba(99,102,241,.2);color:#818cf8;font-weight:700;font-size:12px;border:1px solid rgba(99,102,241,.3)" onclick="shipExport(${i})">🚢 Gönder</button></div><div style="display:flex;justify-content:space-between;font-size:11px;color:var(--tm);margin-bottom:4px"><span>Fiyat: <b style="color:#10b981">${fmt(o.price)} ₺/${o.product.unit}</b></span><span>Min: ${o.minQty.toLocaleString()}</span></div><div style="height:4px;background:rgba(255,255,255,.1);border-radius:4px"><div style="width:${pct}%;height:100%;border-radius:4px;background:${pct < 30 ? '#ef4444' : pct < 70 ? '#f59e0b' : '#10b981'}"></div></div></div>`;
  }).join('');
}

/* ---- İHALE ---- */
function renderIhale() {
  generateIhaleler(); const body = document.getElementById('ihale-body');
  body.innerHTML = state.ihaleData.map((d, i) => `<div class="card" id="ihale-${i}" style="margin:10px 12px">
    <div class="card-header"><div style="width:56px;height:56px;background:rgba(255,255,255,.06);border-radius:14px;display:grid;place-items:center;font-size:28px;border:1px solid var(--br)">${d.emoji}</div><div><div style="font-size:12px;color:var(--tm)">${d.flag} ${d.company}</div><div style="font-weight:800;font-size:14px">${d.qty.toLocaleString()} ${d.unit} ${d.product}</div><div style="font-size:13px;color:#6366f1;font-weight:700">Bütçe: ${fmt(d.budget)} ₺</div></div></div>
    <div style="display:flex;align-items:center;gap:8px;padding:10px;background:rgba(251,191,36,.06);border-radius:10px;margin-bottom:8px;border:1px solid rgba(251,191,36,.2)"><span style="font-size:12px;font-weight:700;color:#fbbf24">⏱ Kalan:</span><span style="background:rgba(0,0,0,.3);padding:5px 10px;border-radius:6px;font-size:18px;font-weight:800;font-family:'Space Grotesk'" id="im-${i}-m">00</span><span style="font-size:18px;font-weight:800;color:#fbbf24">:</span><span style="background:rgba(0,0,0,.3);padding:5px 10px;border-radius:6px;font-size:18px;font-weight:800;font-family:'Space Grotesk'" id="im-${i}-s">00</span><button style="margin-left:auto;padding:7px 12px;border-radius:8px;background:rgba(99,102,241,.2);color:#818cf8;font-weight:700;font-size:12px;border:1px solid rgba(99,102,241,.3)" onclick="openIhaleBid(${i})">🔨 Teklif</button></div>
    <div style="font-size:12px;color:var(--tm);padding:8px 10px;background:rgba(255,255,255,.04);border-radius:8px;border:1px solid var(--br)" id="ihale-log-${i}">${d.won ? '🏆 İhaleyi kazandınız!' : 'Henüz teklif yok.'}</div>
  </div>`).join('');
  Object.values(ihaleTimers).forEach(clearInterval); ihaleTimers = {};
  state.ihaleData.forEach((d, i) => {
    ihaleTimers[i] = setInterval(() => {
      const rem = Math.max(0, Math.floor((d.deadline - Date.now()) / 1000));
      const mEl = document.getElementById('im-' + i + '-m'); const sEl = document.getElementById('im-' + i + '-s');
      if (!mEl) return;
      mEl.textContent = String(Math.floor(rem / 60)).padStart(2, '0');
      sEl.textContent = String(rem % 60).padStart(2, '0');
      if (rem <= 0) {
        clearInterval(ihaleTimers[i]);
        d.deadline = Date.now() + Math.floor(Math.random() * 90 + 20) * 1000;
        d.bids = []; d.won = false;
        d.budget = parseFloat((d.budgetBase * (.9 + Math.random() * .2)).toFixed(2));
        const lg = document.getElementById('ihale-log-' + i); if (lg) lg.textContent = 'Yeni ihale başladı.';
      }
    }, 1000);
  });
}

/* ---- KRİPTO ---- */
function renderKriptoPage() {
  const body = document.getElementById('kripto-body');
  if (state.level < 5) { body.innerHTML = '<div class="empty"><div class="empty-lock">🔒</div><div class="empty-big">5. Seviyede Açılacak</div><div class="empty-text" style="margin-top:8px">Daha fazla XP kazan!</div></div>'; return; }
  const wallet = state.kripto || {};
  body.innerHTML = `<div class="kripto-tab"><button class="kripto-tab-btn active" onclick="kriptoTab('alsat',this)">AL-SAT</button><button class="kripto-tab-btn" onclick="kriptoTab('cuzdanim',this)">CÜZDANIM</button><button class="kripto-tab-btn" onclick="kriptoTab('gecmis',this)">GEÇMİŞ</button></div>
    <div id="k-alsat">${KRIPTOLAR.map((k, i) => `<div class="kripto-item" onclick="openKriptoDetail(${i})"><div class="kripto-logo" style="background:${k.color}">${k.emoji}</div><div class="kripto-info"><div class="kripto-name">${k.name}</div><div class="kripto-sym">${k.sym}${wallet[k.sym] ? ' · 💰' + wallet[k.sym].toFixed(4) : ''}</div></div><svg class="kripto-chart" viewBox="0 0 70 28"><polyline fill="none" stroke="${k.dir === 'up' ? '#10b981' : '#ef4444'}" stroke-width="1.5" points="${Array.from({ length: 8 }, (_, j) => `${j * 10},${14 + Math.sin(j * 0.8 + i) * 7 + (k.dir === 'up' ? -j * 1.2 : j * 1.2)}`).join(' ')}"/></svg><div class="kripto-price"><div class="kripto-pval">${k.price > 1000 ? fmtShort(k.price) : fmt(k.price)} ₺</div><div class="kripto-chg ${k.dir}">${k.dir === 'up' ? '▲' : '▼'} %${Math.abs(k.change)}</div></div></div>`).join('')}</div>
    <div id="k-cuzdanim" style="display:none">${Object.entries(wallet).filter(([, q]) => q > 0).map(([sym, qty]) => { const k = KRIPTOLAR.find(x => x.sym === sym); if (!k) return ''; return `<div class="kripto-item"><div class="kripto-logo" style="background:${k.color}">${k.emoji}</div><div class="kripto-info"><div class="kripto-name">${k.name}</div><div class="kripto-sym">${qty.toFixed(4)} ${sym}</div></div><div class="kripto-price"><div class="kripto-pval">${fmt(qty * k.price)} ₺</div><div style="font-size:11px;color:var(--tm)">Piyasa değeri</div></div></div>`; }).join('') || '<div class="empty"><div class="empty-lock">💼</div><div class="empty-text">Cüzdan boş.</div></div>'}</div>
    <div id="k-gecmis" style="display:none">${!(state.kriptoHistory || []).length ? '<div class="empty"><div class="empty-lock">📋</div><div class="empty-text">İşlem geçmişi yok.</div></div>' : (state.kriptoHistory || []).slice(0, 20).map(h => `<div class="row" style="margin:6px 12px;border-radius:10px;padding:12px"><div><div style="font-weight:700;font-size:13px">${h.type === 'buy' ? '✅ Alış' : '🔴 Satış'} · ${h.sym}</div><div style="font-size:11px;color:var(--tm)">${h.qty.toFixed(4)} · ${h.time}</div></div><div style="font-weight:800;color:${h.type === 'buy' ? '#ef4444' : '#10b981'}">${h.type === 'buy' ? '-' : '+'} ${fmt(h.total)} ₺</div></div>`).join('')}</div>`;
  clearInterval(window._kInt);
  window._kInt = setInterval(() => {
    KRIPTOLAR.forEach(k => { const chg = (Math.random() - .5) * .04; k.price = Math.max(.0001, k.price * (1 + chg)); k.change = parseFloat((k.change * .8 + chg * 100 * .2).toFixed(2)); k.dir = k.change >= 0 ? 'up' : 'down'; });
    if (document.querySelector('#page-kripto.active')) renderKriptoPage();
  }, 8000);
}

function kriptoTab(tab, btn) {
  document.querySelectorAll('.kripto-tab-btn').forEach(b => b.classList.remove('active')); btn.classList.add('active');
  ['alsat', 'cuzdanim', 'gecmis'].forEach(t => { const el = document.getElementById('k-' + t); if (el) el.style.display = t === tab ? 'block' : 'none'; });
}

function openKriptoDetail(i) {
  if (state.level < 5) { toast('Kripto için Seviye 5 gerekli', 'error'); return; }
  const k = KRIPTOLAR[i]; const wallet = state.kripto || {}; const held = wallet[k.sym] || 0;
  document.getElementById('km-title').textContent = k.name + ' (' + k.sym + ')';
  document.getElementById('km-body').innerHTML = `<div style="text-align:center;padding:14px 0"><div style="width:66px;height:66px;border-radius:18px;background:${k.color};display:grid;place-items:center;font-size:34px;margin:0 auto 10px">${k.emoji}</div><div style="font-size:26px;font-weight:800">${k.price > 1000 ? fmtShort(k.price) : fmt(k.price)} ₺</div><div style="color:${k.dir === 'up' ? '#10b981' : '#ef4444'};font-weight:700">${k.dir === 'up' ? '▲' : '▼'} %${Math.abs(k.change)}</div></div><div class="row"><span class="row-label">Elinde</span><span class="row-value">${held.toFixed(4)} ${k.sym}</span></div><div class="row"><span class="row-label">TL Değeri</span><span class="row-value green">${fmt(held * k.price)} ₺</span></div><div style="margin:14px 0 8px"><label style="font-size:12px;color:var(--tm);display:block;margin-bottom:6px">Miktar (${k.sym})</label><input id="km-amount" type="number" min="0.0001" step="0.0001" placeholder="0" class="input-dark" style="font-size:16px;font-weight:800;text-align:center"><button onclick="document.getElementById('km-amount').value=(state.money/${k.price}).toFixed(4)" style="width:100%;margin-top:6px;padding:8px;background:rgba(255,255,255,.06);border-radius:8px;font-size:12px;font-weight:700;color:var(--tm)">Maks Al</button></div><div style="display:grid;grid-template-columns:1fr 1fr;gap:10px"><button class="btn-green" style="padding:14px;font-size:15px" onclick="kriptoBuy(${i})">✅ AL</button><button class="btn-red" style="padding:14px;font-size:15px" onclick="kriptoSell(${i})">🔴 SAT</button></div>`;
  openModal('kripto-modal');
}

/* ---- ENERJİ ---- */
function renderEnerji() {
  const body = document.getElementById('enerji-body');
  if (state.level < 8) { body.innerHTML = '<div class="empty"><div class="empty-lock">🔒</div><div class="empty-big">8. Seviyede Açılacak</div><div class="empty-text" style="margin-top:8px">Enerji piyasasına girmek için büyü!</div></div>'; return; }
  body.innerHTML = `<div style="padding:14px"><div class="card"><div class="card-header"><div class="card-icon" style="background:linear-gradient(135deg,#fbbf24,#d97706)">⚡</div><div><div class="card-title">Enerji Piyasası</div><div class="card-sub">Elektrik üret ve sat</div></div></div><div class="row"><span class="row-label">Güneş Enerjisi</span><span class="row-value green">${fmt(0.85 + Math.random() * 0.3)} ₺/kWh</span></div><div class="row"><span class="row-label">Rüzgar Enerjisi</span><span class="row-value green">${fmt(0.72 + Math.random() * 0.25)} ₺/kWh</span></div><div class="row"><span class="row-label">Doğalgaz</span><span class="row-value red">${fmt(1.2 + Math.random() * 0.4)} ₺/m³</span></div></div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:10px"><div class="uretim-card" onclick="toast('Güneş santrali yakında! ☀️','')"><div class="uretim-icon">☀️</div><div class="uretim-name">Güneş Santrali</div><div class="uretim-desc">500.000 ₺ · 15.000 ₺/gün</div><span class="uretim-badge badge-ok">Yakında</span></div><div class="uretim-card" onclick="toast('Rüzgar çiftliği yakında! 🌬️','')"><div class="uretim-icon">🌬️</div><div class="uretim-name">Rüzgar Çiftliği</div><div class="uretim-desc">380.000 ₺ · 11.000 ₺/gün</div><span class="uretim-badge badge-ok">Yakında</span></div></div></div>`;
}

/* ---- MARKA ---- */
function renderMarka() {
  const body = document.getElementById('marka-body');
  body.innerHTML = MARKALAR.map(m => `<div class="marka-item"><div class="marka-rank ${m.rank === 1 ? 'gold' : m.rank === 2 ? 'silver' : m.rank === 3 ? 'bronze' : ''}">#${m.rank}</div><div class="marka-logo" style="background:${m.color};color:#fff">${m.emoji}</div><div class="marka-info"><div class="marka-name">${m.name}</div><div class="marka-meta">Lider: ${m.lider}</div><div style="margin-top:4px"><span class="marka-chip">🏆 ${m.tp.toLocaleString()}</span><span class="marka-chip">⚡ x${m.guc}</span><span class="marka-chip">👥 ${m.uyeler}</span></div></div><button style="background:rgba(99,102,241,.2);color:#818cf8;padding:7px 12px;border-radius:8px;font-weight:700;font-size:11px;flex-shrink:0;border:1px solid rgba(99,102,241,.3)" onclick="joinMarka('${m.name}')">+ Katıl</button></div>`).join('') +
    '<div style="padding:14px"><button class="btn-green" style="width:100%" onclick="toast(\'Marka kurma yakında 🚀\',\'\')">🏗️ Kendi Markamı Kur</button></div>';
}

/* ---- PAZAR ---- */
function renderPazar() {
  const body = document.getElementById('pazar-body'); const all = state.pazarListings || [];
  body.innerHTML = `<div style="padding:12px;border-bottom:1px solid var(--br);display:flex;gap:8px"><button class="btn-create" style="flex:1;padding:10px;font-size:13px" onclick="openModal('pazar-sat-modal')">+ Ürün Ekle</button></div>
  <div style="padding:8px 0">
    ${!all.length ? `<div class="empty"><div class="empty-lock">🛍️</div><div class="empty-big">Pazar Boş</div><div class="empty-text">İlk ürünü sen ekle!</div></div>` :
      all.map((item, i) => `<div class="market-item">
      <div class="market-item-icon">${item.emoji || '🛒'}</div>
      <div class="market-item-info">
        <div class="market-item-name">${item.name}</div>
        <div class="market-item-seller">Satıcı: ${item.seller} · ${item.qty} adet · ${item.desc || ''}</div>
      </div>
      <div style="text-align:right">
        <div class="market-item-price">${fmt(item.price)} ₺</div>
        ${item.seller === state.user?.name ?
          `<button style="background:rgba(239,68,68,.15);color:#f87171;padding:4px 8px;border-radius:6px;font-size:11px;font-weight:700;margin-top:4px" onclick="removePazarItem(${i})">Kaldır</button>` :
          `<button class="market-buy-btn" style="margin-top:4px" onclick="buyPazarItem(${i})">Satın Al</button>`}
      </div>
    </div>`).join('')}
  </div>`;
}
