/* ============================================================
   oyun-guncellemeler.js — v2.0 Oyun Güncellemeleri
   ─────────────────────────────────────────────────────────
   index.html'e admin-panel.js'den SONRA ekle:
     <script src="oyun-guncellemeler.js"></script>

   İÇERİK:
   1. Dükkan Tekil Kilidi — Her tür dükkan sadece 1 kez açılabilir
   2. Market Fiyat Karşılaştırma — Reyona tıklayınca rakip fiyatlar
   3. Bahçe/Üretim Görsel Detayları — İsimli bahçeler, görseller
   4. Satış Geliri Toplama — Para otomatik eklenmiyor, tıklayarak toplanır
   5. Marka Detayları — Tıklanabilir, katıl/çık, ortaklaşa üretim
   6. Çalışan Otomatik Atama — Şubeye göre, tek tıklama maaş
   ============================================================ */

(function GameUpdates() {
  'use strict';

  /* ════════════════════════════════════════════════════════
     1. DÜKKAN TEKİL KİLİDİ
     Her türden sadece 1 dükkan açılabilir.
     ════════════════════════════════════════════════════════ */
  const _origBuyShop = window.buyShop;
  window.buyShop = async function (type, city) {
    const shops = await dbGet(`businesses/${GZ.uid}/shops`) || {};
    const existing = Object.values(shops).find(s => s.type === type);
    if (existing) {
      const def = window.SHOP_CATALOG?.[type];
      const name = def ? def.name : type;
      toast(`❌ Zaten bir ${name} var! Her türden sadece 1 dükkan açılabilir.`, 'error', 4000);
      return;
    }
    if (typeof _origBuyShop === 'function') return _origBuyShop(type, city);
  };

  /* ════════════════════════════════════════════════════════
     2. MARKET FIYAT KARŞILAŞTIRMA
     Reyona tıklayınca: stok ekle + firma fiyatları göster
     ════════════════════════════════════════════════════════ */

  // Piyasadaki firmalar — gerçekçi Türk market zincirleri
  const MARKET_FIRMALARI = {
    temel: [
      { firma: 'BİM', logo: '🟦' },
      { firma: 'A101', logo: '🟥' },
      { firma: 'ŞOK', logo: '🟧' },
      { firma: 'MİGROS', logo: '🟩' },
      { firma: 'CarrefourSA', logo: '⬛' },
    ],
    kahvalti: [
      { firma: 'BİM', logo: '🟦' },
      { firma: 'A101', logo: '🟥' },
      { firma: 'ŞOK', logo: '🟧' },
      { firma: 'MİGROS', logo: '🟩' },
    ],
    sebze: [
      { firma: 'Semt Pazarı', logo: '🟫' },
      { firma: 'Manav Zinciri', logo: '🟢' },
      { firma: 'Yeşilçarşı', logo: '🌿' },
    ],
    et: [
      { firma: 'Güven Et', logo: '🥩' },
      { firma: 'Aşçıoğlu', logo: '🔴' },
      { firma: 'Halk Et', logo: '🟤' },
    ],
    elektronik: [
      { firma: 'Teknosa', logo: '🔵' },
      { firma: 'MediaMarkt', logo: '⭕' },
      { firma: 'Vatan', logo: '🟡' },
      { firma: 'D&R', logo: '🟣' },
    ],
    beyazesya: [
      { firma: 'Arçelik', logo: '🔵' },
      { firma: 'Beko', logo: '🟦' },
      { firma: 'Vestel', logo: '🔴' },
    ],
    mobilya: [
      { firma: 'İkea', logo: '💛' },
      { firma: 'Bellona', logo: '🟤' },
      { firma: 'İstikbal', logo: '🟥' },
    ],
    kuyumcu: [
      { firma: 'Altın Pazarı', logo: '🌟' },
      { firma: 'Kuyum Atölyesi', logo: '💛' },
    ],
    otomotiv: [
      { firma: 'Bosch Servis', logo: '🔴' },
      { firma: 'Oto Teknik', logo: '⚙️' },
    ],
    akaryakit: [
      { firma: 'Opet', logo: '🟠' },
      { firma: 'Shell', logo: '🐚' },
      { firma: 'BP', logo: '🟢' },
      { firma: 'Total', logo: '🔴' },
    ],
    yapi: [
      { firma: 'Bauhaus', logo: '🟡' },
      { firma: 'Koçtaş', logo: '🟠' },
    ],
    eczane: [
      { firma: 'Eczacıbaşı', logo: '💊' },
      { firma: 'Sağlıklı Yaşam', logo: '🌿' },
    ],
    firin: [
      { firma: 'Ekmek Fırını', logo: '🍞' },
      { firma: 'Lezzet Pastanesi', logo: '🎂' },
    ],
  };

  // Fiyat dalgalanması — gerçekçi günlük değişim simüle eder
  function _firmaFiyat(basePrice) {
    // -15% ile +25% arası rastgele değişim
    const delta = (Math.random() * 0.40) - 0.15;
    return Math.round(basePrice * (1 + delta) * 100) / 100;
  }

  // Reyona tıklayınca fiyat karşılaştırma + stok modalı aç
  window.openShelfDetail = async function (sid, itemKey) {
    const shop = await dbGet(`businesses/${GZ.uid}/shops/${sid}`);
    if (!shop) return;
    const shelves = shop.shelves || {};
    const sh = shelves[itemKey];
    if (!sh) return;
    const u = URUNLER?.[itemKey];
    if (!u) return;

    const cat = u.cat;
    const firmalar = MARKET_FIRMALARI[cat] || MARKET_FIRMALARI.temel;

    // Rastgele ama tutarlı (aynı gün hep aynı) fiyat
    const seed = new Date().toDateString() + itemKey;
    const seedNum = [...seed].reduce((a, c) => a + c.charCodeAt(0), 0);
    const rng = (i) => {
      const x = Math.sin(seedNum + i * 9301) * 9301;
      return x - Math.floor(x);
    };

    const firmaFiyatlari = firmalar.map((f, i) => ({
      ...f,
      fiyat: Math.round(u.base * (0.88 + rng(i) * 0.42) * 100) / 100,
    })).sort((a, b) => a.fiyat - b.fiyat);

    const enUcuz = firmaFiyatlari[0];
    const benimFiyat = sh.price || u.base;
    const stokPct = Math.min(100, ((sh.stock || 0) / (sh.max || 50)) * 100);
    const stokCls = stokPct < 20 ? 'color:#ef4444' : stokPct < 50 ? 'color:#f59e0b' : 'color:#22c55e';

    // Bekleyen gelir hesapla
    const bekleyenGelir = sh.pendingRevenue || 0;

    const body = `
      <div style="background:#1e293b;border-radius:12px;padding:14px;margin-bottom:12px;">
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px;">
          <span style="font-size:32px">${u.emo}</span>
          <div>
            <div style="font-weight:700;color:#e2e8f0;font-size:15px">${u.name}</div>
            <div style="color:#64748b;font-size:12px">${u.unit} birimi</div>
          </div>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:10px;">
          <div style="background:#0f172a;border-radius:8px;padding:10px;text-align:center;">
            <div style="color:#64748b;font-size:11px">Stok</div>
            <div style="font-weight:700;font-size:16px;${stokCls}">${sh.stock || 0}/${sh.max || 50}</div>
          </div>
          <div style="background:#0f172a;border-radius:8px;padding:10px;text-align:center;">
            <div style="color:#64748b;font-size:11px">Satış Fiyatın</div>
            <div style="font-weight:700;font-size:16px;color:#22c55e">${cashFmt(benimFiyat)}</div>
          </div>
        </div>
        ${bekleyenGelir > 0 ? `
        <div style="background:linear-gradient(135deg,#065f46,#047857);border-radius:10px;padding:12px;margin-bottom:10px;display:flex;align-items:center;justify-content:space-between;">
          <div>
            <div style="color:#a7f3d0;font-size:12px">💰 Toplanacak Gelir</div>
            <div style="color:#fff;font-weight:800;font-size:18px">${cashFmt(bekleyenGelir)}</div>
          </div>
          <button onclick="collectShelfRevenue('${sid}','${itemKey}',${bekleyenGelir})" style="background:#10b981;border:none;color:#fff;padding:10px 16px;border-radius:8px;cursor:pointer;font-weight:700;font-size:14px;">
            TOPLA 💰
          </button>
        </div>` : `
        <div style="background:#0f172a;border-radius:8px;padding:8px 12px;margin-bottom:10px;color:#475569;font-size:13px;">
          📭 Henüz toplanacak gelir yok
        </div>`}
        <div style="display:flex;gap:8px;">
          <button onclick="askBuyStock('${sid}','${itemKey}')" style="flex:1;padding:10px;background:#3b82f6;border:none;color:#fff;border-radius:8px;cursor:pointer;font-size:13px;font-weight:600;">+ Stok Al</button>
          <button onclick="askSetPrice('${sid}','${itemKey}',${benimFiyat})" style="flex:1;padding:10px;background:#7c3aed;border:none;color:#fff;border-radius:8px;cursor:pointer;font-size:13px;font-weight:600;">💰 Fiyat Ayarla</button>
          <button onclick="askDeleteShelf('${sid}','${itemKey}')" style="padding:10px 14px;background:#dc2626;border:none;color:#fff;border-radius:8px;cursor:pointer;font-size:13px;">🗑️</button>
        </div>
      </div>

      <div style="background:#1e293b;border-radius:12px;padding:14px;">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;">
          <h3 style="margin:0;color:#e2e8f0;font-size:14px;">📊 Piyasa Fiyat Karşılaştırması</h3>
          <span style="color:#64748b;font-size:11px">Bugünkü fiyatlar</span>
        </div>
        ${firmaFiyatlari.map((f, i) => {
          const isMin = i === 0;
          const isMax = i === firmaFiyatlari.length - 1;
          const isMine = Math.abs(benimFiyat - f.fiyat) < 1;
          const diff = ((benimFiyat - f.fiyat) / f.fiyat * 100).toFixed(1);
          return `
            <div style="display:flex;align-items:center;justify-content:space-between;padding:8px 10px;border-radius:8px;margin-bottom:6px;background:${isMin ? 'rgba(34,197,94,0.1)' : '#0f172a'};border:1px solid ${isMin ? 'rgba(34,197,94,0.3)' : '#1e293b'};">
              <div style="display:flex;align-items:center;gap:8px;">
                <span style="font-size:18px">${f.logo}</span>
                <div>
                  <div style="color:#e2e8f0;font-size:13px;font-weight:600">${f.firma}</div>
                  ${isMin ? '<div style="color:#22c55e;font-size:11px">✓ En ucuz</div>' : ''}
                  ${isMax ? '<div style="color:#ef4444;font-size:11px">En pahalı</div>' : ''}
                </div>
              </div>
              <div style="text-align:right;">
                <div style="font-weight:700;color:${isMin ? '#22c55e' : '#e2e8f0'};font-size:14px">${cashFmt(f.fiyat)}</div>
                <div style="font-size:11px;color:#64748b">/${u.unit}</div>
              </div>
            </div>
          `;
        }).join('')}
        <div style="margin-top:10px;padding:10px;background:#0f172a;border-radius:8px;text-align:center;">
          <span style="color:#94a3b8;font-size:12px">Senin fiyatın: </span>
          <span style="color:#22c55e;font-weight:700">${cashFmt(benimFiyat)}</span>
          <span style="color:#64748b;font-size:12px"> · En ucuz olan ${enUcuz.firma}'dan </span>
          <span style="color:${benimFiyat <= enUcuz.fiyat ? '#22c55e' : '#f59e0b'};font-weight:700">${benimFiyat <= enUcuz.fiyat ? '✓ Rekabetçi' : '⬆️ Daha pahalı'}</span>
        </div>
        <div style="margin-top:8px;padding:10px;background:#1e3a5f;border-radius:8px;font-size:12px;color:#93c5fd;">
          💡 <b>İpucu:</b> ${enUcuz.firma} en ucuz fiyatla ${cashFmt(enUcuz.fiyat)}/${u.unit} satıyor. ${benimFiyat > enUcuz.fiyat ? 'Fiyatını düşürmeyi düşün!' : 'Harika! En uygun fiyatla rekabet ediyorsun.'}
        </div>
      </div>
    `;

    showModal(`${u.emo} ${u.name}`, body);
  };

  // Gelir toplama fonksiyonu
  window.collectShelfRevenue = async function (sid, itemKey, amount) {
    closeModal();
    await dbUpdate(`businesses/${GZ.uid}/shops/${sid}/shelves/${itemKey}`, {
      pendingRevenue: 0
    });
    await addCash(GZ.uid, amount, 'shelf-revenue-collect');
    toast(`💰 ${cashFmt(amount)} hesabına eklendi!`, 'success', 3000);
    await addXP(GZ.uid, Math.floor(amount / 100));

    // Dükkan sayfasını yenile
    if (typeof openShop === 'function') openShop(sid);
  };
  window.collectShelfRevenue = window.collectShelfRevenue;

  /* ════════════════════════════════════════════════════════
     3. REYONA TIKLANDIĞINDA MODAL AÇ (openShop override)
     ════════════════════════════════════════════════════════ */
  const _origOpenShop = window.openShop;
  window.openShop = async function (sid) {
    const s = await dbGet(`businesses/${GZ.uid}/shops/${sid}`);
    if (!s) return;
    const shelves = s.shelves || {};
    const totalPendingRevenue = Object.values(shelves).reduce((a, sh) => a + (sh.pendingRevenue || 0), 0);

    let body = `
      <div class="stats-grid">
        <div class="stat-box"><div class="lbl">Seviye</div><div class="val">${s.level || 1}</div></div>
        <div class="stat-box"><div class="lbl">Çalışan</div><div class="val">${s.employees || 1}</div></div>
        <div class="stat-box"><div class="lbl">Şehir</div><div class="val" style="font-size:13px">${s.city}</div></div>
        <div class="stat-box"><div class="lbl">Reyonlar</div><div class="val">${Object.keys(shelves).length}</div></div>
      </div>
      ${totalPendingRevenue > 0 ? `
      <div onclick="collectAllRevenue('${sid}')" style="background:linear-gradient(135deg,#065f46,#047857);border-radius:12px;padding:14px;margin-bottom:12px;cursor:pointer;display:flex;align-items:center;justify-content:space-between;">
        <div>
          <div style="color:#a7f3d0;font-size:12px">💰 Toplam Bekleyen Gelir</div>
          <div style="color:#fff;font-weight:800;font-size:20px">${cashFmt(totalPendingRevenue)}</div>
        </div>
        <div style="background:#10b981;padding:10px 16px;border-radius:8px;color:#fff;font-weight:700;">TÜMÜNÜ TOPLA</div>
      </div>` : ''}
      <div class="flex gap-8 mb-12">
        <button class="btn-primary" style="flex:1" onclick="openShelfPicker('${sid}')">+ Yeni Reyon</button>
        <button class="btn-secondary" style="flex:1" onclick="upgradeShop('${sid}').then(()=>{closeModal();openShop('${sid}')})">⬆️ Yükselt</button>
      </div>
      <div class="section-title">REYONLAR (Detay için tıkla)</div>
    `;

    if (Object.keys(shelves).length === 0) {
      body += `<div class="empty-state"><div class="emoji">📦</div><h3>Boş reyon</h3><p>Reyona ürün eklemeden satış olmaz</p></div>`;
    } else {
      for (const k of Object.keys(shelves)) {
        const sh = shelves[k];
        const u = URUNLER?.[k]; if (!u) continue;
        const pct = Math.min(100, ((sh.stock || 0) / (sh.max || 1)) * 100);
        const cls = pct < 20 ? 'empty' : pct < 50 ? 'warn' : '';
        const pending = sh.pendingRevenue || 0;
        body += `
          <div class="shelf-item" onclick="openShelfDetail('${sid}','${k}')" style="cursor:pointer;position:relative;">
            ${pending > 0 ? `<div style="position:absolute;top:8px;right:8px;background:#10b981;color:#fff;padding:2px 8px;border-radius:99px;font-size:11px;font-weight:700;">💰 ${cashFmt(pending)}</div>` : ''}
            <div class="shelf-head">
              <div class="shelf-emoji">${u.emo}</div>
              <div class="shelf-name">
                ${u.name}
                <div class="shelf-stock">${sh.stock || 0} / ${sh.max || 50} ${u.unit}</div>
              </div>
            </div>
            <div class="shelf-prog"><div class="shelf-prog-fill ${cls}" style="width:${pct}%"></div></div>
            <div class="shelf-row">
              <span class="muted">Satış: ${fmtInt(sh.totalSold || 0)}</span>
              <span class="price">${cashFmt(sh.price || 0)}</span>
            </div>
          </div>
        `;
      }
    }
    showModal((window.SHOP_CATALOG?.[s.type]?.name || s.type) + ' • ' + s.city, body);
  };

  window.collectAllRevenue = async function (sid) {
    const shelves = await dbGet(`businesses/${GZ.uid}/shops/${sid}/shelves`) || {};
    let total = 0;
    const updates = {};
    Object.entries(shelves).forEach(([k, sh]) => {
      if ((sh.pendingRevenue || 0) > 0) {
        total += sh.pendingRevenue;
        updates[`businesses/${GZ.uid}/shops/${sid}/shelves/${k}/pendingRevenue`] = 0;
      }
    });
    if (total === 0) return toast('Toplanacak gelir yok', 'info');
    await firebase.database().ref().update(updates);
    await addCash(GZ.uid, total, 'collect-all-revenue');
    toast(`💰 ${cashFmt(total)} hesabına eklendi!`, 'success', 4000);
    closeModal();
    openShop(sid);
  };
  window.collectAllRevenue = window.collectAllRevenue;

  /* ════════════════════════════════════════════════════════
     4. BAHÇE GELİŞTİRME — İsimli bahçeler, görsel ikonlar
     ════════════════════════════════════════════════════════ */

  const BAHCE_TIPLERI = {
    domates:  { name: 'Domates Bahçesi',   emo: '🍅', bgColor: '#7f1d1d', items: ['domates'] },
    elma:     { name: 'Elma Bahçesi',      emo: '🍎', bgColor: '#14532d', items: ['elma','armut'] },
    bugday:   { name: 'Buğday Tarlası',    emo: '🌾', bgColor: '#713f12', items: ['bugday','misir'] },
    findik:   { name: 'Fındık Bahçesi',    emo: '🌰', bgColor: '#431407', items: ['findik'] },
    sebze:    { name: 'Sebze Bahçesi',     emo: '🥦', bgColor: '#14532d', items: ['salatalik','biber','havuc','marul'] },
    meyve:    { name: 'Meyve Bahçesi',     emo: '🍊', bgColor: '#7c2d12', items: ['portakal','muz','cilek','karpuz'] },
    zeytin:   { name: 'Zeytin Bahçesi',    emo: '🫒', bgColor: '#365314', items: ['zeytin'] },
    genel:    { name: 'Genel Tarla',       emo: '🌱', bgColor: '#1a2e05', items: [] },
  };
  window.BAHCE_TIPLERI = BAHCE_TIPLERI;

  // Bahçe render override — görsel isimli kartlar
  const _origRenderBahce = window.render;
  window._renderBahceDetayli = async function () {
    const main = document.getElementById('appMain');
    if (!main) return;
    const list = await dbGet(`businesses/${GZ.uid}/gardens`) || {};
    const lvl = GZ.data?.level || 1;

    let html = `<div class="page-title">🌱 Bahçelerim</div>
      <button class="btn-primary mb-12" onclick="buyNewBahce()" style="width:100%">+ Yeni Bahçe Aç</button>`;

    if (Object.keys(list).length === 0) {
      html += `<div class="empty-state"><div class="emoji">🌱</div><h3>Henüz bahçen yok</h3><p>İlk bahçeni aç, ürün yetiştir, para kazan!</p></div>`;
    } else {
      for (const id of Object.keys(list)) {
        const garden = list[id];
        const tip = garden.tipKey ? BAHCE_TIPLERI[garden.tipKey] : BAHCE_TIPLERI.genel;
        const isReady = garden.crop && garden.harvestAt && now() >= garden.harvestAt;
        const isGrowing = garden.crop && garden.harvestAt && now() < garden.harvestAt;
        const crop = URUNLER?.[garden.crop];

        let statusHtml = '';
        let actionHtml = '';

        if (isReady) {
          statusHtml = `<div style="color:#22c55e;font-weight:700;font-size:13px">✓ HASAT HAZIR: ${crop?.name || garden.crop}</div>`;
          actionHtml = `<button class="btn-primary" onclick="harvestAndOpenDetail('gardens','${id}')" style="width:100%">🌾 HASAT ET</button>`;
        } else if (isGrowing) {
          const rem = Math.max(0, garden.harvestAt - now());
          const m = Math.floor(rem / 60000), s = Math.floor((rem % 60000) / 1000);
          statusHtml = `
            <div style="color:#94a3b8;font-size:13px">${crop?.emo || '🌱'} ${crop?.name || garden.crop} büyüyor</div>
            <div style="color:#f59e0b;font-size:12px;margin-top:2px">⏱ ${m}d ${s}s kaldı</div>
            <div style="height:6px;background:#1e293b;border-radius:3px;margin-top:6px;overflow:hidden;">
              <div style="height:100%;background:linear-gradient(90deg,#22c55e,#86efac);border-radius:3px;width:${Math.min(100,100-(rem/(garden.growTime||3600000))*100)}%;transition:width 1s;"></div>
            </div>`;
          actionHtml = `<button class="btn-secondary" disabled style="width:100%;opacity:.5">⏳ Büyüyor...</button>`;
        } else {
          statusHtml = `<div style="color:#475569;font-size:13px">Boş — ekim yapılmadı</div>`;
          actionHtml = `<button class="btn-primary" onclick="openGardenDetail('${id}')" style="width:100%">🌱 Ekim Yap</button>`;
        }

        html += `
          <div style="background:linear-gradient(135deg,${tip.bgColor}44,#1e293b);border-radius:16px;border:1px solid ${tip.bgColor}66;margin-bottom:12px;overflow:hidden;">
            <div style="padding:14px;display:flex;align-items:center;gap:12px;border-bottom:1px solid rgba(255,255,255,0.05);">
              <div style="font-size:36px;line-height:1">${tip.emo}</div>
              <div style="flex:1">
                <div style="color:#e2e8f0;font-weight:700;font-size:15px">${garden.name || tip.name}</div>
                <div style="color:#64748b;font-size:12px">Lv ${garden.level || 1} · ID: ${id.slice(-4)}</div>
              </div>
              <button onclick="openGardenDetail('${id}')" style="background:rgba(255,255,255,0.1);border:none;color:#e2e8f0;padding:6px 10px;border-radius:8px;cursor:pointer;font-size:12px;">⚙️</button>
            </div>
            <div style="padding:12px 14px;">
              ${statusHtml}
              <div style="margin-top:10px">${actionHtml}</div>
            </div>
          </div>
        `;
      }
    }

    main.innerHTML = html;

    // Canlı geri sayım
    if (Object.values(list).some(g => g.crop && g.harvestAt && now() < g.harvestAt)) {
      setTimeout(() => {
        if (GZ.currentTab === 'bahce') window._renderBahceDetayli();
      }, 1000);
    }
  };

  // Bahçe detay modal
  window.openGardenDetail = async function (gardenId) {
    const garden = await dbGet(`businesses/${GZ.uid}/gardens/${gardenId}`);
    if (!garden) return;
    const tip = garden.tipKey ? BAHCE_TIPLERI[garden.tipKey] : BAHCE_TIPLERI.genel;

    // Ekim yapılabilecek ürünler
    const allItems = Object.entries(URUNLER || {}).filter(([k, u]) =>
      ['sebze', 'meyve', 'temel', 'kahvalti'].includes(u.cat)
    );

    let itemGrid = '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:10px;">';
    allItems.forEach(([k, u]) => {
      const locked = (GZ.data?.level || 1) < (u.lv || 1);
      itemGrid += `
        <div onclick="${locked ? '' : `plantCropAndRefresh('gardens','${gardenId}','${k}')`}" style="background:${locked ? '#0f172a' : '#1e293b'};border-radius:10px;padding:10px;text-align:center;cursor:${locked ? 'default' : 'pointer'};border:1px solid ${locked ? '#1e293b' : '#334155'};opacity:${locked ? '.4' : '1'};">
          <div style="font-size:24px">${u.emo}</div>
          <div style="color:#e2e8f0;font-size:11px;font-weight:600;margin-top:4px">${u.name}</div>
          ${locked ? `<div style="color:#64748b;font-size:10px">🔒 Lv${u.lv}</div>` : `<div style="color:#22c55e;font-size:10px">${cashFmt(u.base)}</div>`}
        </div>
      `;
    });
    itemGrid += '</div>';

    const body = `
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:14px;background:#1e293b;padding:12px;border-radius:12px;">
        <span style="font-size:40px">${tip.emo}</span>
        <div>
          <div style="color:#e2e8f0;font-weight:700">${garden.name || tip.name}</div>
          <div style="color:#64748b;font-size:12px">Seviye ${garden.level || 1}</div>
        </div>
      </div>
      <div style="display:flex;gap:8px;margin-bottom:14px;">
        <button onclick="upgradeProductionUnit('gardens','${gardenId}').then(()=>{closeModal();openGardenDetail('${gardenId}')})" style="flex:1;padding:10px;background:#3b82f6;border:none;color:#fff;border-radius:8px;cursor:pointer;font-size:13px;font-weight:600;">⬆️ Seviye Yükselt (${cashFmt((garden.level||1)*2500)})</button>
        <button onclick="renameGarden('${gardenId}')" style="padding:10px 14px;background:#7c3aed;border:none;color:#fff;border-radius:8px;cursor:pointer;font-size:13px;">✏️ Yeniden Adlandır</button>
      </div>
      <div style="color:#94a3b8;font-size:14px;margin-bottom:8px;font-weight:600;">🌱 Ne Ekmek İstersin?</div>
      ${itemGrid}
    `;
    showModal(`${tip.emo} ${garden.name || tip.name}`, body);
  };

  window.plantCropAndRefresh = async function (kind, id, cropKey) {
    closeModal();
    if (typeof plantCrop === 'function') {
      await plantCrop(kind, id, cropKey);
    }
    window._renderBahceDetayli();
  };

  window.harvestAndOpenDetail = async function (kind, id) {
    if (typeof harvest === 'function') await harvest(kind, id);
    window._renderBahceDetayli();
  };

  window.renameGarden = async function (gardenId) {
    const yeniIsim = prompt('Bahçene yeni isim ver:');
    if (!yeniIsim || !yeniIsim.trim()) return;
    await dbUpdate(`businesses/${GZ.uid}/gardens/${gardenId}`, { name: yeniIsim.trim() });
    toast('✅ Bahçe adı güncellendi', 'success');
    openGardenDetail(gardenId);
  };

  window.buyNewBahce = function () {
    const tipleri = Object.entries(BAHCE_TIPLERI);
    const lv = GZ.data?.level || 1;
    const maliyet = 3500;
    let html = `<p style="color:#94a3b8;font-size:13px;margin-bottom:12px;">Bahçe türü seç — Maliyet: ${cashFmt(maliyet)}</p><div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">`;
    tipleri.forEach(([key, tip]) => {
      html += `
        <div onclick="buyBahceTipi('${key}')" style="background:#1e293b;border-radius:12px;padding:14px;text-align:center;cursor:pointer;border:1px solid #334155;">
          <div style="font-size:30px">${tip.emo}</div>
          <div style="color:#e2e8f0;font-weight:600;font-size:13px;margin-top:6px">${tip.name}</div>
        </div>
      `;
    });
    html += '</div>';
    showModal('Yeni Bahçe Türü', html);
  };

  window.buyBahceTipi = async function (tipKey) {
    closeModal();
    const tip = BAHCE_TIPLERI[tipKey];
    const maliyet = 3500;
    const ok = await spendCash(GZ.uid, maliyet, 'buy-garden');
    if (!ok) return toast(`Yetersiz bakiye (${cashFmt(maliyet)})`, 'error');
    const id = 'grd_' + Math.random().toString(36).slice(2, 8);
    await dbSet(`businesses/${GZ.uid}/gardens/${id}`, {
      id, tipKey, name: tip.name, level: 1, createdAt: now()
    });
    toast(`${tip.emo} ${tip.name} açıldı!`, 'success', 3000);
    window._renderBahceDetayli();
  };

  /* ════════════════════════════════════════════════════════
     5. MARKA DETAYLARI — Katıl/Çık, Ortaklaşa Üretim
     ════════════════════════════════════════════════════════ */

  window.openBrandDetail = async function (brandId) {
    const brand = await dbGet(`brands/${brandId}`);
    if (!brand) return toast('Marka bulunamadı', 'error');
    const members = brand.members || {};
    const isMember = members[GZ.uid] !== undefined;
    const isOwner = brand.ownerId === GZ.uid;
    const memberCount = Object.keys(members).length;
    const myRole = members[GZ.uid]?.role || 'Üye';

    // Ortak üretim listesi
    const productions = brand.productions || {};
    const prodList = Object.entries(productions);

    const body = `
      <div style="background:linear-gradient(135deg,#1e3a5f,#1e293b);border-radius:12px;padding:16px;margin-bottom:12px;border:1px solid #3b82f6;">
        <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px;">
          <div style="font-size:40px">${brand.logo || '🏢'}</div>
          <div>
            <div style="color:#e2e8f0;font-weight:800;font-size:16px">${brand.name}</div>
            <div style="color:#93c5fd;font-size:12px">👥 ${memberCount} üye · ${isOwner ? '👑 Kurucu' : isMember ? `✅ ${myRole}` : '⬜ Üye değil'}</div>
          </div>
        </div>
        <div style="color:#94a3b8;font-size:13px;margin-bottom:12px">${brand.description || 'Açıklama yok'}</div>
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-bottom:12px;">
          <div style="background:#0f172a;border-radius:8px;padding:10px;text-align:center;">
            <div style="color:#64748b;font-size:11px">Seviye</div>
            <div style="color:#e2e8f0;font-weight:700">${brand.level || 1}</div>
          </div>
          <div style="background:#0f172a;border-radius:8px;padding:10px;text-align:center;">
            <div style="color:#64748b;font-size:11px">Üye</div>
            <div style="color:#e2e8f0;font-weight:700">${memberCount}</div>
          </div>
          <div style="background:#0f172a;border-radius:8px;padding:10px;text-align:center;">
            <div style="color:#64748b;font-size:11px">Gelir</div>
            <div style="color:#22c55e;font-weight:700">${cashFmt(brand.totalRevenue || 0)}</div>
          </div>
        </div>
        <div style="display:flex;gap:8px;">
          ${!isMember && !isOwner ? `<button onclick="joinBrand('${brandId}')" style="flex:1;padding:10px;background:#3b82f6;border:none;color:#fff;border-radius:8px;cursor:pointer;font-weight:700;">✅ Katıl</button>` : ''}
          ${isMember && !isOwner ? `<button onclick="leaveBrand('${brandId}')" style="flex:1;padding:10px;background:#dc2626;border:none;color:#fff;border-radius:8px;cursor:pointer;font-weight:700;">🚪 Ayrıl</button>` : ''}
          ${isOwner ? `<button onclick="openBrandManage('${brandId}')" style="flex:1;padding:10px;background:#7c3aed;border:none;color:#fff;border-radius:8px;cursor:pointer;font-weight:700;">⚙️ Yönet</button>` : ''}
          ${isMember || isOwner ? `<button onclick="openBrandProduction('${brandId}')" style="flex:1;padding:10px;background:#059669;border:none;color:#fff;border-radius:8px;cursor:pointer;font-weight:700;">🏭 Ortak Üretim</button>` : ''}
        </div>
      </div>

      <div style="background:#1e293b;border-radius:12px;padding:14px;margin-bottom:12px;">
        <h3 style="margin:0 0 10px;color:#e2e8f0;font-size:14px;">👥 Üyeler</h3>
        ${Object.entries(members).slice(0, 10).map(([uid, m]) => `
          <div style="display:flex;align-items:center;justify-content:space-between;padding:8px 0;border-bottom:1px solid #0f172a;">
            <div>
              <span style="color:#e2e8f0;font-size:13px">${m.username || uid.slice(-6)}</span>
              <span style="color:#64748b;font-size:11px;margin-left:6px">${m.role || 'Üye'}</span>
            </div>
            ${isOwner && uid !== GZ.uid ? `<button onclick="grantBrandRole('${brandId}','${uid}')" style="padding:4px 8px;background:#334155;border:none;color:#e2e8f0;border-radius:6px;cursor:pointer;font-size:11px;">Rol Ver</button>` : ''}
          </div>
        `).join('')}
      </div>

      ${prodList.length > 0 ? `
      <div style="background:#1e293b;border-radius:12px;padding:14px;">
        <h3 style="margin:0 0 10px;color:#e2e8f0;font-size:14px;">🏭 Aktif Üretimler</h3>
        ${prodList.map(([pid, p]) => {
          const u = URUNLER?.[p.item];
          return `<div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #0f172a;">
            <span style="color:#e2e8f0;font-size:13px">${u?.emo || '📦'} ${u?.name || p.item}</span>
            <span style="color:#22c55e;font-size:13px">${fmtInt(p.amount || 0)} ${u?.unit || ''}</span>
          </div>`;
        }).join('')}
      </div>` : ''}
    `;

    showModal(`${brand.logo || '🏢'} ${brand.name}`, body);
  };

  window.joinBrand = async function (brandId) {
    const brand = await dbGet(`brands/${brandId}`);
    if (!brand) return;
    const userData = GZ.data || {};
    await dbUpdate(`brands/${brandId}/members/${GZ.uid}`, {
      username: userData.username || 'Anonim',
      joinedAt: now(),
      role: 'Üye',
      level: userData.level || 1,
    });
    toast(`✅ ${brand.name} markasına katıldın!`, 'success');
    openBrandDetail(brandId);
  };

  window.leaveBrand = async function (brandId) {
    if (!confirm('Markadan ayrılmak istiyor musun?')) return;
    await dbRemove(`brands/${brandId}/members/${GZ.uid}`);
    toast('🚪 Markadan ayrıldın', 'info');
    closeModal();
  };

  async function dbRemove(path) {
    try { await firebase.database().ref(path).remove(); return true; }
    catch (e) { return false; }
  }

  window.openBrandProduction = async function (brandId) {
    const allItems = Object.entries(URUNLER || {}).filter(([k, u]) =>
      ['temel', 'kahvalti', 'sebze', 'et', 'firin'].includes(u.cat)
    );
    let grid = '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:10px;">';
    allItems.slice(0, 18).forEach(([k, u]) => {
      grid += `<div onclick="startBrandProduction('${brandId}','${k}')" style="background:#1e293b;border-radius:10px;padding:10px;text-align:center;cursor:pointer;border:1px solid #334155;">
        <div style="font-size:24px">${u.emo}</div>
        <div style="color:#e2e8f0;font-size:11px;font-weight:600;margin-top:4px">${u.name}</div>
        <div style="color:#64748b;font-size:10px">${cashFmt(u.base)}</div>
      </div>`;
    });
    grid += '</div>';
    showModal('🏭 Ortak Üretim Başlat', `<p style="color:#94a3b8;font-size:13px;margin-bottom:8px;">Tüm üyeler katkıda bulunur, kazanç paylaşılır.</p>${grid}`);
  };

  window.startBrandProduction = async function (brandId, itemKey) {
    const amount = parseInt(prompt(`Kaç birim ${URUNLER?.[itemKey]?.name} üretelim?`) || '0');
    if (!amount || amount <= 0) return;
    const cost = (URUNLER?.[itemKey]?.base || 0) * amount * 0.7;
    const ok = await spendCash(GZ.uid, cost, 'brand-production');
    if (!ok) return toast(`Yetersiz bakiye (${cashFmt(cost)})`, 'error');
    const pid = 'prod_' + Math.random().toString(36).slice(2, 8);
    await dbSet(`brands/${brandId}/productions/${pid}`, {
      item: itemKey, amount, startedBy: GZ.uid, startedAt: now(), cost
    });
    toast(`🏭 Ortak üretim başlatıldı!`, 'success');
    closeModal();
  };

  window.grantBrandRole = async function (brandId, targetUid) {
    const role = prompt('Rol adı gir (örn: Müdür, Muhasebeci, Denetçi):');
    if (!role) return;
    await dbUpdate(`brands/${brandId}/members/${targetUid}`, { role: role.trim() });
    toast(`✅ Rol verildi: ${role}`, 'success');
  };

  window.openBrandManage = async function (brandId) {
    const brand = await dbGet(`brands/${brandId}`);
    showModal('⚙️ Marka Yönetimi', `
      <div style="display:flex;flex-direction:column;gap:10px;">
        <button onclick="upgradeBrand('${brandId}')" style="padding:12px;background:#3b82f6;border:none;color:#fff;border-radius:8px;cursor:pointer;font-weight:700;">⬆️ Marka Seviye Yükselt</button>
        <button onclick="sendBrandAnnouncement('${brandId}')" style="padding:12px;background:#7c3aed;border:none;color:#fff;border-radius:8px;cursor:pointer;font-weight:700;">📢 Üyelere Duyuru Gönder</button>
        <button onclick="openBrandProduction('${brandId}')" style="padding:12px;background:#059669;border:none;color:#fff;border-radius:8px;cursor:pointer;font-weight:700;">🏭 Ortak Üretim Başlat</button>
      </div>
    `);
  };

  window.sendBrandAnnouncement = async function (brandId) {
    const msg = prompt('Üyelere duyurmak istediğin mesaj:');
    if (!msg) return;
    const brand = await dbGet(`brands/${brandId}`);
    const members = brand?.members || {};
    const batch = {};
    Object.keys(members).forEach(uid => {
      const key = firebase.database().ref().push().key;
      batch[`users/${uid}/notifications/${key}`] = {
        text: `📢 [${brand.name}] ${msg}`, icon: '🏢', read: false, ts: now()
      };
    });
    await firebase.database().ref().update(batch);
    toast('📢 Duyuru gönderildi', 'success');
  };

  /* ════════════════════════════════════════════════════════
     6. ÇALIŞAN OTOMATİK ATAMA + TEK TIKLA MAAŞ
     ════════════════════════════════════════════════════════ */

  window.autoAssignEmployees = async function () {
    const shops = await dbGet(`businesses/${GZ.uid}/shops`) || {};
    const gardens = await dbGet(`businesses/${GZ.uid}/gardens`) || {};
    const factories = await dbGet(`businesses/${GZ.uid}/factories`) || {};
    const workers = await dbGet(`businesses/${GZ.uid}/workers`) || {};

    const totalWorkers = Object.keys(workers).length;
    const assignments = {};
    const allUnits = [
      ...Object.entries(shops).map(([id, s]) => ({ id, kind: 'shops', name: s.type, type: 'Dükkan' })),
      ...Object.entries(gardens).map(([id, g]) => ({ id, kind: 'gardens', name: g.name || 'Bahçe', type: 'Bahçe' })),
      ...Object.entries(factories).map(([id, f]) => ({ id, kind: 'factories', name: f.name || 'Fabrika', type: 'Fabrika' })),
    ];

    let assigned = 0;
    for (const unit of allUnits) {
      if (assigned >= totalWorkers) break;
      const needed = unit.kind === 'shops' ? 2 : 1;
      assignments[`businesses/${GZ.uid}/${unit.kind}/${unit.id}/employees`] = Math.min(needed, totalWorkers - assigned);
      assigned += needed;
    }

    if (Object.keys(assignments).length > 0) {
      await firebase.database().ref().update(assignments);
      toast(`✅ ${Object.keys(assignments).length} şubeye otomatik atama yapıldı!`, 'success', 3000);
    } else {
      toast('Atanacak çalışan veya şube yok', 'info');
    }
  };

  window.payAllSalaries = async function () {
    const workers = await dbGet(`businesses/${GZ.uid}/workers`) || {};
    const workerList = Object.entries(workers);
    if (workerList.length === 0) return toast('Çalışan yok', 'info');

    let totalSalary = 0;
    workerList.forEach(([wid, w]) => { totalSalary += (w.salary || 5000); });

    if (!confirm(`Toplam ${cashFmt(totalSalary)} maaş ödenecek. Devam?`)) return;

    const ok = await spendCash(GZ.uid, totalSalary, 'salary-payment');
    if (!ok) return toast(`Yetersiz bakiye (${cashFmt(totalSalary)})`, 'error');

    const now_ = now();
    const updates = {};
    workerList.forEach(([wid, w]) => {
      updates[`businesses/${GZ.uid}/workers/${wid}/lastPaid`] = now_;
    });
    await firebase.database().ref().update(updates);
    toast(`✅ ${workerList.length} çalışana toplam ${cashFmt(totalSalary)} maaş ödendi!`, 'success', 4000);
  };

  /* ════════════════════════════════════════════════════════
     7. RENDER TAB HOOK — Bahçe sekmesini yeni render ile değiştir
     ════════════════════════════════════════════════════════ */
  const _origRender = window.render;
  window.render = function (tab) {
    if (tab === 'bahce') {
      GZ.currentTab = 'bahce';
      window._renderBahceDetayli();
      return;
    }
    if (typeof _origRender === 'function') return _origRender(tab);
  };

  /* ════════════════════════════════════════════════════════
     8. MARKA LİSTESİ — Tıklanabilir markalar
     ════════════════════════════════════════════════════════ */
  const _origRenderMarka = window.renderMarka;
  window.renderMarka = async function () {
    const main = document.getElementById('appMain');
    if (!main) { if (typeof _origRenderMarka === 'function') return _origRenderMarka(); return; }

    const lv = GZ.data?.level || 1;
    if (lv < 10) {
      main.innerHTML = `<div class="locked-state"><div class="lock-icon">🔒</div><h3>10. Seviyede Açılacak</h3><p>Şu anki seviyen: ${lv}</p></div>`;
      return;
    }

    const brands = await dbGet('brands') || {};
    const myBrands = await dbGet(`users/${GZ.uid}/brands`) || {};

    let html = `<div class="page-title">🏢 Markalar</div>
      <button class="btn-primary mb-12" onclick="openCreateBrand()" style="width:100%">+ Yeni Marka Kur (10.000 ₺)</button>`;

    const brandList = Object.entries(brands);
    if (brandList.length === 0) {
      html += `<div class="empty-state"><div class="emoji">🏢</div><h3>Henüz marka yok</h3><p>İlk markayı sen kur!</p></div>`;
    } else {
      brandList.forEach(([bid, brand]) => {
        const members = brand.members || {};
        const isMember = members[GZ.uid] !== undefined;
        const isOwner = brand.ownerId === GZ.uid;
        html += `
          <div onclick="openBrandDetail('${bid}')" style="background:#1e293b;border-radius:14px;padding:14px;margin-bottom:10px;cursor:pointer;border:1px solid ${isMember || isOwner ? '#3b82f6' : '#334155'};">
            <div style="display:flex;align-items:center;gap:12px;">
              <span style="font-size:32px">${brand.logo || '🏢'}</span>
              <div style="flex:1">
                <div style="color:#e2e8f0;font-weight:700;font-size:15px">${brand.name} ${isOwner ? '👑' : isMember ? '✅' : ''}</div>
                <div style="color:#64748b;font-size:12px">👥 ${Object.keys(members).length} üye · Lv ${brand.level || 1}</div>
              </div>
              <span style="color:#64748b">›</span>
            </div>
            ${brand.description ? `<div style="color:#94a3b8;font-size:12px;margin-top:8px">${brand.description}</div>` : ''}
          </div>
        `;
      });
    }
    main.innerHTML = html;
  };

  window.openCreateBrand = function () {
    showModal('🏢 Yeni Marka Kur', `
      <p style="color:#94a3b8;font-size:13px;margin-bottom:12px;">Maliyet: 10.000 ₺. Markana üye toplayabilir, ortaklaşa üretim yapabilirsin.</p>
      <div class="input-group">
        <label>Marka Adı</label>
        <input type="text" id="newBrandName" placeholder="Örn: Karakaş Holding" maxlength="30">
      </div>
      <div class="input-group">
        <label>Logo (emoji)</label>
        <input type="text" id="newBrandLogo" placeholder="🏢" maxlength="5" value="🏢">
      </div>
      <div class="input-group">
        <label>Açıklama</label>
        <textarea id="newBrandDesc" placeholder="Marka hakkında kısa açıklama..." rows="2"></textarea>
      </div>
      <button class="btn-primary" style="width:100%" onclick="confirmCreateBrand()">Markayı Kur</button>
    `);
  };

  window.confirmCreateBrand = async function () {
    const name = document.getElementById('newBrandName')?.value.trim();
    const logo = document.getElementById('newBrandLogo')?.value.trim() || '🏢';
    const desc = document.getElementById('newBrandDesc')?.value.trim() || '';
    if (!name) return toast('Marka adı gerekli', 'error');

    const cost = 10000;
    const ok = await spendCash(GZ.uid, cost, 'create-brand');
    if (!ok) return toast(`Yetersiz bakiye (${cashFmt(cost)})`, 'error');

    const bid = 'brand_' + Math.random().toString(36).slice(2, 10);
    const userData = GZ.data || {};
    await dbSet(`brands/${bid}`, {
      id: bid, name, logo, description: desc,
      ownerId: GZ.uid, level: 1, createdAt: now(),
      members: {
        [GZ.uid]: { username: userData.username || 'Kurucu', role: 'Kurucu', joinedAt: now() }
      },
      totalRevenue: 0,
    });
    await dbUpdate(`users/${GZ.uid}/brands`, { [bid]: true });
    toast(`🏢 ${name} markası kuruldu!`, 'success', 4000);
    closeModal();
    window.renderMarka();
  };

  /* ════════════════════════════════════════════════════════
     9. BAŞLANGIÇ — Tüm özellikleri hazırla
     ════════════════════════════════════════════════════════ */
  console.log('%c[OyunGuncellemeler] ✅ v2.0 yüklendi', 'color:#22c55e;font-weight:bold');

})();
