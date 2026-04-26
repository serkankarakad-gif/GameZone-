/* ==========================================================================
   konsol-manager.js — Modern Alt Konsol v2
   ─────────────────────────────────────────────────────────────────────────
   - 5 sabit alt sekme (Anasayfa, Üretim, Menü FAB, Ticaret, Profil-kısayol)
   - Ortadaki büyük FAB butonu → Kategori-bazlı GRID menü açar
   - Tüm 18+ sekme: kategorilere ayrılmış (ÜRETİM, TİCARET, SOSYAL, EĞLENCE, BİLGİ)
   - Modal şeklinde alt-yarı sayfa, swipe-to-close
   - Aktif sekme highlight, smooth animasyonlar
   - localStorage'da son kullanılanlar listesi
   ========================================================================== */

(function () {

  /* ─── Sabit alt 5 sekme ─── */
  const PRIMARY_TABS = [
    { id: 'dukkan',   icon: '🏪', label: 'Dükkan'    },
    { id: 'bahce',    icon: '🌱', label: 'Üretim'    },
    { id: '__menu__', icon: '⚏',  label: 'Menü'      , isFab: true },
    { id: 'ihracat',  icon: '🚢', label: 'Ticaret'   },
    { id: 'liderlik', icon: '🏆', label: 'Liderlik'  },
  ];

  /* ─── Kategorize edilmiş tüm sekmeler (Menü FAB'da açılır) ─── */
  const CATEGORIES = [
    {
      id: 'uretim', name: 'ÜRETİM', icon: '🏭', color: '#16a34a',
      items: [
        { id: 'bahce',    icon: '🌱', label: 'Bahçeler',    desc: 'Meyve & sebze yetiştir' },
        { id: 'ciftlik',  icon: '🐄', label: 'Çiftlikler',  desc: 'Hayvancılık & et/süt' },
        { id: 'fabrika',  icon: '🏭', label: 'Fabrikalar',  desc: 'İşlenmiş ürün üretimi' },
        { id: 'maden',    icon: '⛏️', label: 'Madenler',    desc: 'Altın, gümüş, demir... (Lv 30+)' },
      ]
    },
    {
      id: 'ticaret', name: 'TİCARET', icon: '💼', color: '#1e5cb8',
      items: [
        { id: 'dukkan',   icon: '🏪', label: 'Dükkanlar',  desc: 'Reyon kur, ürün sat' },
        { id: 'pazar',    icon: '🛒', label: 'Pazar',      desc: 'Otomatik satış istatistikleri' },
        { id: 'lojistik', icon: '🚚', label: 'Lojistik',   desc: '81 ilde depo ağı' },
        { id: 'ihracat',  icon: '🚢', label: 'İhracat',    desc: 'Yabancı şirketlere sat' },
        { id: 'ihale',    icon: '⚖️', label: 'İhaleler',   desc: 'Canlı geri sayımlı teklif' },
        { id: 'kripto',   icon: '📈', label: 'Kripto Borsa', desc: 'Al-sat, dalgalanma' },
      ]
    },
    {
      id: 'sosyal', name: 'SOSYAL', icon: '👥', color: '#7c3aed',
      items: [
        { id: 'marka',    icon: '🏢', label: 'Markalar',  desc: 'Klan kur veya katıl (Lv 10+)' },
        { id: 'liderlik', icon: '🏆', label: 'Liderlik',  desc: 'En zenginler tablosu' },
        { id: 'sehirler', icon: '🏙️', label: 'Şehirler',  desc: '81 il, taşın' },
        { id: 'haberler', icon: '📰', label: 'Haberler',  desc: 'Güncel piyasa & ihaleler' },
      ]
    },
    {
      id: 'eglence', name: 'EĞLENCE', icon: '🎮', color: '#f59e0b',
      items: [
        { id: 'oyunlar',  icon: '🎮', label: 'Mini Oyunlar', desc: '50 oyun, seviye sistemli', highlight: true },
        { id: 'magaza',   icon: '💎', label: 'Elmas Mağaza',  desc: 'Elmas paketleri & robot' },
      ]
    },
    {
      id: 'bilgi', name: 'BİLGİ', icon: '📚', color: '#6b7280',
      items: [
        { id: 'hikaye',   icon: '📖', label: 'Hikaye',  desc: 'Oyun ve geliştiriciler hakkında' },
        { id: 'sss',      icon: '❓', label: 'SSS',     desc: 'Sıkça sorulan sorular' },
      ]
    },
  ];

  let konsol = null;
  let menuSheet = null;

  /* ═══════════════════════ ALT KONSOL OLUŞTUR ═══════════════════════ */
  function buildKonsol() {
    const old = document.getElementById('mainKonsol');
    if (old) old.remove();
    const oldFab = document.getElementById('konsolFabBackdrop');
    if (oldFab) oldFab.remove();

    const nav = document.createElement('nav');
    nav.id = 'mainKonsol';
    nav.className = 'main-konsol';
    nav.setAttribute('role', 'navigation');

    nav.innerHTML = PRIMARY_TABS.map(t => {
      if (t.isFab) {
        return `
          <button class="mk-fab" id="mkFab" title="Tüm Menü">
            <div class="mk-fab-inner">
              <span class="mk-fab-icon">${t.icon}</span>
            </div>
            <span class="mk-fab-label">${t.label}</span>
          </button>
        `;
      }
      return `
        <button class="mk-tab" data-tab="${t.id}" title="${t.label}">
          <span class="mk-icon">${t.icon}</span>
          <span class="mk-label">${t.label}</span>
        </button>
      `;
    }).join('');

    document.body.appendChild(nav);
    konsol = nav;

    // Tab tıklamaları
    nav.querySelectorAll('.mk-tab').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.tab;
        if (typeof window.switchTab === 'function') window.switchTab(id);
        setActive(id);
        addToRecents(id);
      });
    });

    // FAB tıklama → menü grid aç
    document.getElementById('mkFab').addEventListener('click', openMenuSheet);
  }

  /* ═══════════════════════ AKTİF SEKMEYİ İŞARETLE ═══════════════════════ */
  function setActive(id) {
    if (!konsol) return;
    konsol.querySelectorAll('.mk-tab').forEach(b => b.classList.toggle('active', b.dataset.tab === id));
    // Eğer aktif sekme alt 5'te yoksa hiçbiri aktif değildir, FAB hafif vurgulanır
    const inPrimary = PRIMARY_TABS.some(t => t.id === id);
    document.getElementById('mkFab')?.classList.toggle('has-active', !inPrimary);
  }
  window.renderKonsolActive = setActive;

  /* ═══════════════════════ MENÜ SHEET (FAB) ═══════════════════════ */
  function openMenuSheet() {
    closeMenuSheet();
    const recents = loadRecents();
    const sheet = document.createElement('div');
    sheet.id = 'konsolFabBackdrop';
    sheet.className = 'mk-sheet-bg';

    const recentItems = recents.length ? `
      <div class="mk-cat" style="background:linear-gradient(135deg,#fef3c7 0%,#fde68a 100%);border-color:#f59e0b">
        <div class="mk-cat-head" style="color:#92400e">
          <span class="mk-cat-icon">⭐</span>
          <span class="mk-cat-name">SON KULLANILAN</span>
        </div>
        <div class="mk-cat-grid">
          ${recents.map(id => {
            const found = findItem(id);
            if (!found) return '';
            return renderMenuItem(found);
          }).join('')}
        </div>
      </div>
    ` : '';

    const catsHtml = CATEGORIES.map(cat => `
      <div class="mk-cat" data-cat="${cat.id}">
        <div class="mk-cat-head">
          <span class="mk-cat-icon" style="color:${cat.color}">${cat.icon}</span>
          <span class="mk-cat-name">${cat.name}</span>
          <span class="mk-cat-count">${cat.items.length}</span>
        </div>
        <div class="mk-cat-grid">
          ${cat.items.map(renderMenuItem).join('')}
        </div>
      </div>
    `).join('');

    sheet.innerHTML = `
      <div class="mk-sheet" onclick="event.stopPropagation()">
        <div class="mk-sheet-grabber"></div>
        <div class="mk-sheet-head">
          <h3>Tüm Sekmeler</h3>
          <button class="mk-sheet-close" id="mkSheetClose">✕</button>
        </div>
        <div class="mk-sheet-body">
          ${recentItems}
          ${catsHtml}
        </div>
      </div>
    `;

    document.body.appendChild(sheet);
    menuSheet = sheet;

    // Animasyon trigger
    requestAnimationFrame(() => sheet.classList.add('open'));

    // Backdrop click → kapat
    sheet.addEventListener('click', closeMenuSheet);
    document.getElementById('mkSheetClose').addEventListener('click', closeMenuSheet);

    // Item tıklamaları
    sheet.querySelectorAll('[data-tab]').forEach(el => {
      el.addEventListener('click', e => {
        e.stopPropagation();
        const id = el.dataset.tab;
        if (typeof window.switchTab === 'function') window.switchTab(id);
        setActive(id);
        addToRecents(id);
        closeMenuSheet();
      });
    });

    // Swipe-to-close (touch)
    let startY = null;
    const sheetEl = sheet.querySelector('.mk-sheet');
    sheetEl.querySelector('.mk-sheet-grabber').addEventListener('touchstart', e => {
      startY = e.touches[0].clientY;
    }, { passive: true });
    sheetEl.querySelector('.mk-sheet-grabber').addEventListener('touchmove', e => {
      if (startY === null) return;
      const dy = e.touches[0].clientY - startY;
      if (dy > 0) {
        sheetEl.style.transform = `translateY(${dy}px)`;
      }
    }, { passive: true });
    sheetEl.querySelector('.mk-sheet-grabber').addEventListener('touchend', e => {
      if (startY === null) return;
      sheetEl.style.transform = '';
      const last = e.changedTouches[0].clientY - startY;
      startY = null;
      if (last > 100) closeMenuSheet();
    });
  }

  function closeMenuSheet() {
    if (!menuSheet) return;
    menuSheet.classList.remove('open');
    setTimeout(() => { menuSheet?.remove(); menuSheet = null; }, 250);
  }

  function renderMenuItem(item) {
    const hl = item.highlight ? ' mk-item-highlight' : '';
    const desc = item.desc ? `<div class="mk-item-desc">${item.desc}</div>` : '';
    return `
      <button class="mk-item${hl}" data-tab="${item.id}">
        <span class="mk-item-icon">${item.icon}</span>
        <div class="mk-item-text">
          <div class="mk-item-label">${item.label}</div>
          ${desc}
        </div>
        <span class="mk-item-arrow">›</span>
      </button>
    `;
  }

  function findItem(id) {
    for (const cat of CATEGORIES) {
      for (const it of cat.items) if (it.id === id) return it;
    }
    return null;
  }

  /* ─── Son kullanılanlar (localStorage) ─── */
  function loadRecents() {
    try {
      const arr = JSON.parse(localStorage.getItem('mk_recents') || '[]');
      return Array.isArray(arr) ? arr.filter(id => findItem(id)).slice(0, 4) : [];
    } catch { return []; }
  }
  function addToRecents(id) {
    if (!findItem(id)) return;
    let r = loadRecents();
    r = r.filter(x => x !== id);
    r.unshift(id);
    r = r.slice(0, 4);
    localStorage.setItem('mk_recents', JSON.stringify(r));
  }

  /* ═══════════════════════ INIT ═══════════════════════ */
  window.initKonsol = function () {
    // Eski yatay nav'ı tamamen gizle
    const oldNav = document.getElementById('bottomNav');
    if (oldNav) oldNav.style.display = 'none';
    const oldDk = document.getElementById('dynamicKonsol');
    if (oldDk) oldDk.remove();
    const oldShow = document.getElementById('dkShowBtn');
    if (oldShow) oldShow.remove();

    buildKonsol();

    // switchTab hook
    const orig = window.switchTab;
    window.switchTab = function (tab) {
      if (typeof orig === 'function') orig(tab);
      setActive(tab);
    };

    // İlk açılışta aktif sekmeyi işaretle
    setActive(GZ?.currentTab || 'dukkan');
  };

})();
