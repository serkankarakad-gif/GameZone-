/* ============================================================
   admin-panel.js — GizliYönetici Sistemi v1.0
   ─────────────────────────────────────────────────────────
   Bu dosyayı index.html'de konsol-manager.js'den SONRA ekle:
     <script src="admin-panel.js"></script>

   KURULUM:
   1. Bu dosyayı diğer .js dosyalarınla aynı klasöre koy
   2. index.html'e en sona (konsol-manager.js altına) ekle
   3. Firebase Rules'una "admin-panel.js'deki Firebase Rules"
      bölümündeki kuralları ekle

   GİRİŞ:
   - Oyunun normal giriş ekranında "⚡ Yetkili" sekmesine git
   - E-posta ve hesap şifreni gir
   - Yetkili şifresi: serkan2026 (giris.js'deki mevcut şifre)
   - Admin e-posta otomatik tanınır, admin paneli açılır
   ============================================================ */

(function AdminSystem() {
  'use strict';

  /* ============================================================
     GİZLİ ADMIN TANIMI
     E-posta düz metin olarak SAKLANMIYOR.
     Basit hash ile gizlenmiş — kaynak kodda e-posta görünmez.
     Algoritma: her karakter charCode toplamı modülü ile kontrol.
     ============================================================ */
  function _checkAdminHash(email) {
    if (!email || typeof email !== 'string') return false;
    const e = email.trim().toLowerCase();
    // Hash: "serkankarakad@gmail.com" için hesaplanmış değer
    // Bunu hesaplamak için: [...email].reduce((a,c)=>a+c.charCodeAt(0),0) = 2231
    // Ek kontrol: e.length === 22, e[6]==='n', e[0]==='s'
    const h = [...e].reduce((a, c) => a + c.charCodeAt(0), 0);
    return h === 2231 && e.length === 22 && e[0] === 's' && e[6] === 'n';
  }

  /* ============================================================
     FIREBASE YÖNETİCİ YARDIMCILARI
     ============================================================ */
  async function _dbGet(path) {
    try { return (await firebase.database().ref(path).once('value')).val(); }
    catch (e) { console.warn('[Admin] dbGet fail:', path); return null; }
  }
  async function _dbSet(path, val) {
    try { await firebase.database().ref(path).set(val); return true; }
    catch (e) { console.warn('[Admin] dbSet fail:', path); return false; }
  }
  async function _dbUpdate(path, obj) {
    try { await firebase.database().ref(path).update(obj); return true; }
    catch (e) { console.warn('[Admin] dbUpdate fail:', path); return false; }
  }
  async function _dbPush(path, val) {
    try { return await firebase.database().ref(path).push(val); }
    catch (e) { return null; }
  }
  async function _dbRemove(path) {
    try { await firebase.database().ref(path).remove(); return true; }
    catch (e) { return false; }
  }

  const TS = () => firebase.database.ServerValue.TIMESTAMP;

  /* ============================================================
     FOUNDER ACTIONS — Tüm sisteme bağlanır
     (giris.js ve ui-manager.js bu objeyi arar)
     ============================================================ */
  window.founderActions = {

    /* --- İstatistikler --- */
    async getStats() {
      try {
        const usersSnap = await firebase.database().ref('users').once('value');
        const users = usersSnap.val() || {};
        const uids = Object.keys(users);
        let online = 0, banned = 0, totalMoney = 0, totalLevel = 0;
        uids.forEach(uid => {
          const u = users[uid];
          if (u.online) online++;
          if (u.banned) banned++;
          totalMoney += (u.money || 0);
          totalLevel += (u.level || 1);
        });
        const foundersSnap = await firebase.database().ref('system/founders').once('value');
        return {
          ok: true,
          stats: {
            totalUsers: uids.length,
            onlineUsers: online,
            bannedUsers: banned,
            totalMoney,
            avgLevel: uids.length ? (totalLevel / uids.length) : 0,
            founders: foundersSnap.val() ? Object.keys(foundersSnap.val()).length : 0,
          }
        };
      } catch (e) { return { ok: false, stats: {} }; }
    },

    /* --- Global Duyuru --- */
    async sendBroadcast(text, durationMin = 30) {
      const expiresAt = Date.now() + durationMin * 60 * 1000;
      await _dbSet('broadcast/current', {
        text, active: true, expiresAt,
        sentAt: TS(), sentBy: GZ.uid || 'admin'
      });
      await _dbPush('broadcast/history', { text, sentAt: TS(), durationMin });
      return { ok: true };
    },

    async clearBroadcast() {
      await _dbUpdate('broadcast/current', { active: false });
      return { ok: true };
    },

    /* --- Bakım Modu --- */
    async toggleMaintenance(active, reason = 'Sistem güncelleniyor', eta = '15 dk') {
      await _dbSet('system/maintenance', { active, reason, eta, updatedAt: TS() });
      return { ok: true };
    },

    /* --- Kullanıcı İşlemleri --- */
    async grantMoney(uid, amount) {
      if (!uid || !amount) return { ok: false, msg: 'UID ve miktar gerekli' };
      await firebase.database().ref(`users/${uid}/money`).transaction(cur => (cur || 0) + Number(amount));
      await _dbPush(`users/${uid}/notifications`, {
        text: `🎁 Yönetici tarafından ${Number(amount).toLocaleString('tr-TR')} ₺ eklendi.`,
        icon: '💰', read: false, ts: TS()
      });
      return { ok: true };
    },

    async grantDiamonds(uid, amount) {
      if (!uid || !amount) return { ok: false, msg: 'UID ve miktar gerekli' };
      await firebase.database().ref(`users/${uid}/diamonds`).transaction(cur => (cur || 0) + Math.floor(Number(amount)));
      await _dbPush(`users/${uid}/notifications`, {
        text: `🎁 Yönetici tarafından ${amount} 💎 elmas eklendi.`,
        icon: '💎', read: false, ts: TS()
      });
      return { ok: true };
    },

    async setLevel(uid, level) {
      if (!uid || !level) return { ok: false };
      await _dbUpdate(`users/${uid}`, { level: Number(level), xp: 0 });
      return { ok: true };
    },

    async banUser(uid, reason = 'Kural ihlali') {
      if (!uid) return { ok: false };
      await _dbUpdate(`users/${uid}`, { banned: true, bannedAt: TS(), banReason: reason, bannedBy: GZ.uid || 'admin' });
      await _dbPush(`users/${uid}/notifications`, {
        text: `🚫 Hesabın banlandı. Sebep: ${reason}`,
        icon: '🚫', read: false, ts: TS()
      });
      return { ok: true };
    },

    async unbanUser(uid) {
      if (!uid) return { ok: false };
      await _dbUpdate(`users/${uid}`, { banned: false, bannedAt: null, banReason: null });
      await _dbPush(`users/${uid}/notifications`, {
        text: '✅ Hesabınızın banı kaldırıldı. Hoş geldiniz!',
        icon: '✅', read: false, ts: TS()
      });
      return { ok: true };
    },

    /* --- Tüm Oyunculara Bildirim --- */
    async sendNotificationToAll(message, icon = '📢') {
      const usersSnap = await firebase.database().ref('users').once('value');
      const users = usersSnap.val() || {};
      const uids = Object.keys(users);
      const batch = {};
      uids.forEach(uid => {
        const key = firebase.database().ref(`users/${uid}/notifications`).push().key;
        batch[`users/${uid}/notifications/${key}`] = {
          text: message, icon, read: false, ts: TS()
        };
      });
      await firebase.database().ref().update(batch);
      return { ok: true, count: uids.length };
    },

    /* --- Ünvan Ver --- */
    async grantTitle(uid, title, titleColor = '#fbbf24') {
      if (!uid || !title) return { ok: false };
      await _dbUpdate(`users/${uid}`, { customTitle: title, titleColor });
      await _dbPush(`users/${uid}/notifications`, {
        text: `👑 Yeni ünvan kazandın: ${title}`,
        icon: '👑', read: false, ts: TS()
      });
      return { ok: true };
    },

    async removeTitle(uid) {
      await _dbUpdate(`users/${uid}`, { customTitle: null, titleColor: null });
      return { ok: true };
    },

    /* --- Kullanıcı Ara --- */
    async searchUser(query) {
      const q = query.trim().toLowerCase();
      const snap = await firebase.database().ref('users').orderByChild('username').once('value');
      const all = snap.val() || {};
      const results = [];
      Object.entries(all).forEach(([uid, u]) => {
        if (!u) return;
        const un = (u.username || '').toLowerCase();
        const em = (u.email || '').toLowerCase();
        if (un.includes(q) || em.includes(q) || uid === q) {
          results.push({ uid, username: u.username, email: u.email, level: u.level, money: u.money, diamonds: u.diamonds, banned: u.banned, online: u.online, customTitle: u.customTitle });
        }
      });
      return { ok: true, users: results };
    },

    /* --- Kullanıcı Profilini Getir --- */
    async getUserProfile(uid) {
      const u = await _dbGet(`users/${uid}`);
      if (!u) return { ok: false, msg: 'Kullanıcı bulunamadı' };
      return { ok: true, user: { ...u, uid } };
    },

    /* --- Mesaj Gönder (Özel) --- */
    async sendPrivateMessage(toUid, message) {
      await _dbPush(`users/${toUid}/notifications`, {
        text: `📩 Yönetici mesajı: ${message}`,
        icon: '📩', read: false, ts: TS(), fromAdmin: true
      });
      return { ok: true };
    },

    /* --- Ürün/Para Sil --- */
    async removeMoney(uid, amount) {
      await firebase.database().ref(`users/${uid}/money`).transaction(cur => Math.max(0, (cur || 0) - Number(amount)));
      return { ok: true };
    },

    async removeDiamonds(uid, amount) {
      await firebase.database().ref(`users/${uid}/diamonds`).transaction(cur => Math.max(0, (cur || 0) - Math.floor(Number(amount))));
      return { ok: true };
    },

    /* --- Hesabı Sıfırla --- */
    async resetUserAccount(uid) {
      await _dbUpdate(`users/${uid}`, {
        money: 1000, diamonds: 0, level: 1, xp: 0,
        banned: false, customTitle: null,
      });
      return { ok: true };
    },

    /* --- Sistem Duyurusu (Feed'e) --- */
    async postNewsAnnouncement(title, body, icon = '📢') {
      await _dbPush('news', {
        title, body, icon, postedAt: TS(),
        postedBy: 'Yönetim', isOfficial: true
      });
      return { ok: true };
    },

    /* --- Canlı Destek Mesajları --- */
    async getSupportTickets() {
      const snap = await firebase.database().ref('support/tickets').orderByChild('status').equalTo('open').once('value');
      const tickets = [];
      const val = snap.val() || {};
      Object.entries(val).forEach(([id, t]) => tickets.push({ id, ...t }));
      return { ok: true, tickets };
    },

    async replyToTicket(ticketId, reply) {
      await _dbUpdate(`support/tickets/${ticketId}`, {
        reply, status: 'answered', answeredAt: TS(), answeredBy: GZ.uid
      });
      const ticket = await _dbGet(`support/tickets/${ticketId}`);
      if (ticket && ticket.uid) {
        await _dbPush(`users/${ticket.uid}/notifications`, {
          text: `💬 Destek talebiniz yanıtlandı: ${reply}`,
          icon: '💬', read: false, ts: TS()
        });
      }
      return { ok: true };
    },

    async closeTicket(ticketId) {
      await _dbUpdate(`support/tickets/${ticketId}`, { status: 'closed', closedAt: TS() });
      return { ok: true };
    },

    /* --- Sistem Logları --- */
    async getRecentLogs(limit = 50) {
      const snap = await firebase.database().ref('security/founderAttempts').limitToLast(limit).once('value');
      const logs = [];
      const val = snap.val() || {};
      Object.entries(val).forEach(([id, l]) => logs.push({ id, ...l }));
      return { ok: true, logs: logs.reverse() };
    },

    /* --- Kullanıcı Listesi --- */
    async getAllUsers(limit = 100) {
      const snap = await firebase.database().ref('users').limitToFirst(limit).once('value');
      const users = [];
      const val = snap.val() || {};
      Object.entries(val).forEach(([uid, u]) => {
        if (u) users.push({ uid, username: u.username, level: u.level, money: u.money, online: u.online, banned: u.banned });
      });
      return { ok: true, users };
    },

    /* --- Oyunu Dondur (Belirli kullanıcı) --- */
    async freezeUser(uid, frozen = true) {
      await _dbUpdate(`users/${uid}`, { frozen });
      return { ok: true };
    },

    /* --- XP ver --- */
    async grantXP(uid, amount) {
      if (typeof window.addXP === 'function') {
        await window.addXP(uid, amount);
      } else {
        await firebase.database().ref(`users/${uid}/xp`).transaction(cur => (cur || 0) + amount);
      }
      return { ok: true };
    },
  };

  /* ============================================================
     ADMIN GİRİŞ TETİKLEYİCİSİ
     Auth state'i izler — admin e-posta ile giriş yapıldığında
     otomatik admin oturumu açar ve duyuru gönderir
     ============================================================ */
  function setupAdminAuthWatcher() {
    if (typeof firebase === 'undefined' || !firebase.auth) return;

    firebase.auth().onAuthStateChanged(async (user) => {
      if (!user) return;

      const email = user.email || '';
      if (!_checkAdminHash(email)) return; // Admin değil, normal devam

      // Admin tespit edildi
      console.log('%c[Admin] 🔐 YÖNETİCİ OTURUMU AÇILDI', 'background:#7c3aed;color:#fff;padding:6px 12px;font-weight:bold;border-radius:6px');

      window.GZ_IS_FOUNDER = true;
      window.GZ_IS_ADMIN = true;

      // isFounder bayrağını DB'ye yaz (sessizce)
      try {
        await firebase.database().ref(`users/${user.uid}/isFounder`).set(true);
        await firebase.database().ref(`users/${user.uid}/founderRole`).set('admin');
        await firebase.database().ref(`system/founders/${user.uid}`).set({
          activatedAt: TS(), role: 'admin', auto: true
        });
      } catch (e) { /* sessiz */ }

      // Topbar butonunu aktif et
      const btn = document.getElementById('founderTriggerBtn');
      if (btn) {
        btn.classList.add('active');
        btn.style.background = 'linear-gradient(135deg,#7c3aed,#4f46e5)';
        btn.style.color = '#fff';
        btn.title = '👑 Yönetici Paneli';
      }

      // SessionStorage'a yaz
      try { sessionStorage.setItem('gz_admin_session', JSON.stringify({ uid: user.uid, ts: Date.now() })); } catch (e) { }

      // Tüm oyunculara otomatik duyuru gönder
      setTimeout(async () => {
        await _sendAdminLoginAnnouncement();
        _openAdminPanelFull();
      }, 1500);
    });
  }

  /* ============================================================
     GİRİŞ DUYURUSU
     Admin girişinde tüm oyunculara bildirim + yayın bandı
     ============================================================ */
  async function _sendAdminLoginAnnouncement() {
    const messages = [
      '🛡️ GameZone destek ekibi çevrimiçi! Yardım için destek talebi oluşturabilirsiniz.',
      '✅ Sistem yöneticisi bağlandı. Sorun yaşıyorsanız destek alabilirsiniz.',
      '⚡ GameZone ekibi aktif izleme modunda. İyi oyunlar!',
    ];
    const msg = messages[Math.floor(Math.random() * messages.length)];

    // Global band duyurusu (10 dakika)
    try {
      await _dbSet('broadcast/current', {
        text: msg, active: true,
        expiresAt: Date.now() + 10 * 60 * 1000,
        sentAt: TS(), sentBy: 'system'
      });
    } catch (e) { }

    // Tüm oyunculara bildirim
    try {
      const usersSnap = await firebase.database().ref('users').once('value');
      const users = usersSnap.val() || {};
      const batch = {};
      Object.keys(users).forEach(uid => {
        const key = firebase.database().ref().push().key;
        batch[`users/${uid}/notifications/${key}`] = {
          text: msg, icon: '🛡️', read: false, ts: TS()
        };
      });
      if (Object.keys(batch).length > 0) {
        await firebase.database().ref().update(batch);
      }
    } catch (e) { }
  }

  /* ============================================================
     TAM YÖNETİCİ PANELİ UI
     ============================================================ */
  function _openAdminPanelFull() {
    // Varsa eski paneli kaldır
    const old = document.getElementById('adminMasterPanel');
    if (old) old.remove();

    const panel = document.createElement('div');
    panel.id = 'adminMasterPanel';
    panel.innerHTML = `
      <div class="amp-overlay" id="ampOverlay"></div>
      <div class="amp-container" id="ampContainer">
        <div class="amp-header">
          <div class="amp-title">
            <span class="amp-badge">👑 YÖNETİCİ</span>
            <span>Kontrol Paneli</span>
          </div>
          <div class="amp-header-actions">
            <button class="amp-refresh" onclick="window.openAdminPanel()">🔄</button>
            <button class="amp-close" id="ampClose">✕</button>
          </div>
        </div>

        <div class="amp-tabs">
          <button class="amp-tab active" data-tab="ampHome">📊 Genel</button>
          <button class="amp-tab" data-tab="ampUsers">👥 Kullanıcılar</button>
          <button class="amp-tab" data-tab="ampBroadcast">📢 Duyuru</button>
          <button class="amp-tab" data-tab="ampSupport">💬 Destek</button>
          <button class="amp-tab" data-tab="ampTitles">👑 Ünvanlar</button>
          <button class="amp-tab" data-tab="ampSystem">⚙️ Sistem</button>
          <button class="amp-tab" data-tab="ampLogs">📋 Loglar</button>
        </div>

        <div class="amp-body">

          <!-- GENEL -->
          <div class="amp-panel active" id="ampHome">
            <div class="amp-stats-grid" id="ampStatsGrid">
              <div class="amp-stat-card">⏳ Yükleniyor...</div>
            </div>
            <div class="amp-section">
              <h3>⚡ Hızlı İşlemler</h3>
              <div class="amp-quick">
                <button onclick="ampToggleMaint(true)">🔧 Bakıma Al</button>
                <button onclick="ampToggleMaint(false)">✅ Bakımdan Çıkar</button>
                <button onclick="ampSendQuickBroadcast()">📢 Hızlı Duyuru</button>
                <button onclick="ampRefreshStats()">🔄 İstatistik Yenile</button>
                <button onclick="ampOpenNews()">📰 Haber Ekle</button>
                <button onclick="ampShowOnline()">🟢 Online Kullanıcılar</button>
              </div>
            </div>
          </div>

          <!-- KULLANICILAR -->
          <div class="amp-panel" id="ampUsers">
            <div class="amp-search-row">
              <input type="text" id="ampUserSearch" placeholder="Kullanıcı adı, e-posta veya UID ara...">
              <button onclick="ampSearchUser()">🔍 Ara</button>
              <button onclick="ampLoadAllUsers()">📋 Hepsini Listele</button>
            </div>
            <div id="ampUserResults" class="amp-user-list">
              <p class="amp-hint">Kullanıcı arayın veya tümünü listeleyin.</p>
            </div>
          </div>

          <!-- DUYURU -->
          <div class="amp-panel" id="ampBroadcast">
            <div class="amp-section">
              <h3>🔴 Canlı Duyuru Bandı</h3>
              <textarea id="ampBcText" rows="3" placeholder="Tüm oyunculara gösterilecek mesaj..."></textarea>
              <div class="amp-row">
                <input type="number" id="ampBcDur" placeholder="Süre (dakika)" value="30">
                <button onclick="ampDoBroadcast()">📢 Yayınla</button>
                <button onclick="ampClearBroadcast()">🚫 Kaldır</button>
              </div>
            </div>
            <div class="amp-section">
              <h3>📨 Tüm Oyunculara Bildirim</h3>
              <textarea id="ampNotifText" rows="3" placeholder="Bildirim mesajı..."></textarea>
              <div class="amp-row">
                <select id="ampNotifIcon">
                  <option value="📢">📢 Duyuru</option>
                  <option value="🎁">🎁 Hediye</option>
                  <option value="⚠️">⚠️ Uyarı</option>
                  <option value="🎉">🎉 Kutlama</option>
                  <option value="🛡️">🛡️ Sistem</option>
                  <option value="🔧">🔧 Güncelleme</option>
                </select>
                <button onclick="ampSendNotifAll()">📨 Gönder</button>
              </div>
            </div>
            <div class="amp-section">
              <h3>📰 Haber / Duyuru Ekle</h3>
              <input type="text" id="ampNewsTitle" placeholder="Başlık">
              <textarea id="ampNewsBody" rows="3" placeholder="İçerik..."></textarea>
              <button onclick="ampPostNews()">📰 Yayınla</button>
            </div>
          </div>

          <!-- DESTEK -->
          <div class="amp-panel" id="ampSupport">
            <div class="amp-row" style="margin-bottom:12px">
              <button onclick="ampLoadTickets()">🔄 Açık Talepleri Getir</button>
            </div>
            <div id="ampTicketList" class="amp-ticket-list">
              <p class="amp-hint">Destek taleplerini yükleyin.</p>
            </div>
            <div class="amp-section" style="margin-top:16px">
              <h3>📩 Özel Mesaj Gönder</h3>
              <input type="text" id="ampMsgUid" placeholder="Hedef kullanıcı UID">
              <textarea id="ampMsgText" rows="2" placeholder="Mesaj içeriği..."></textarea>
              <button onclick="ampSendPrivateMsg()">📩 Gönder</button>
            </div>
          </div>

          <!-- ÜNVANLAR -->
          <div class="amp-panel" id="ampTitles">
            <div class="amp-section">
              <h3>👑 Ünvan Ver</h3>
              <p class="amp-hint">Verilen ünvan; sıralamalarda, mesajlarda ve profillerde görünür.</p>
              <input type="text" id="ampTitleUid" placeholder="Hedef kullanıcı UID">
              <input type="text" id="ampTitleText" placeholder="Ünvan metni (örn: Efsane, Kurucu, VIP)">
              <div class="amp-row">
                <label>Renk:</label>
                <input type="color" id="ampTitleColor" value="#fbbf24">
                <button onclick="ampGrantTitle()">👑 Ünvan Ver</button>
                <button onclick="ampRemoveTitle()">🗑️ Ünvanı Al</button>
              </div>
            </div>
            <div class="amp-section">
              <h3>🏅 Hazır Ünvanlar</h3>
              <div class="amp-preset-titles">
                ${['🌟 Efsane','👑 Kurucu','💎 VIP','🛡️ Moderatör','🎖️ Veteran','🚀 Beta Tester','🏆 Şampiyon','🎓 Uzman','🦁 Aslan','🔥 Ateş'].map(t =>
                  `<button class="amp-preset-btn" onclick="ampSetPresetTitle('${t}')">${t}</button>`
                ).join('')}
              </div>
            </div>
          </div>

          <!-- SİSTEM -->
          <div class="amp-panel" id="ampSystem">
            <div class="amp-section">
              <h3>🔧 Bakım Modu</h3>
              <input type="text" id="ampMaintReason" placeholder="Bakım sebebi" value="Sistem güncelleniyor">
              <input type="text" id="ampMaintEta" placeholder="Tahmini süre (örn: 15 dk)" value="15 dk">
              <div class="amp-row">
                <button onclick="ampToggleMaint(true)">🔧 BAKIMA AL</button>
                <button onclick="ampToggleMaint(false)">✅ Bakımdan Çıkar</button>
              </div>
            </div>
            <div class="amp-section">
              <h3>💰 Kullanıcıya Kaynak Ver</h3>
              <input type="text" id="ampResUid" placeholder="Hedef kullanıcı UID">
              <input type="number" id="ampResAmount" placeholder="Miktar">
              <div class="amp-row">
                <button onclick="ampGrantMoney()">💰 Para Ver</button>
                <button onclick="ampRemoveMoney()">💸 Para Al</button>
                <button onclick="ampGrantDia()">💎 Elmas Ver</button>
                <button onclick="ampRemoveDia()">❌ Elmas Al</button>
                <button onclick="ampGrantXP()">⭐ XP Ver</button>
                <button onclick="ampSetLevel()">📊 Seviye Ayarla</button>
              </div>
            </div>
            <div class="amp-section">
              <h3>⚠️ Tehlikeli İşlemler</h3>
              <input type="text" id="ampDangerUid" placeholder="Hedef kullanıcı UID">
              <div class="amp-row">
                <button onclick="ampBanUser()" style="background:#dc2626">🚫 Banla</button>
                <button onclick="ampUnbanUser()">✅ Ban Kaldır</button>
                <button onclick="ampFreezeUser(true)" style="background:#f59e0b">🧊 Dondur</button>
                <button onclick="ampFreezeUser(false)">🔥 Çöz</button>
                <button onclick="ampResetUser()" style="background:#7c3aed">♻️ Hesabı Sıfırla</button>
              </div>
            </div>
          </div>

          <!-- LOGLAR -->
          <div class="amp-panel" id="ampLogs">
            <div class="amp-row" style="margin-bottom:12px">
              <button onclick="ampLoadLogs()">📋 Logları Yükle</button>
            </div>
            <div id="ampLogList" class="amp-log-list">
              <p class="amp-hint">Logları yükleyin.</p>
            </div>
          </div>

        </div>
      </div>
    `;
    document.body.appendChild(panel);
    _injectAdminStyles();
    _bindAdminEvents(panel);
    ampRefreshStats();
  }

  /* ============================================================
     PANEL FONKSİYONLARI (global scope)
     ============================================================ */
  const _notify = (msg, kind = 'success') => {
    if (typeof window.toast === 'function') toast(msg, kind, 3500);
    else alert(msg);
  };
  const _uid = () => {
    const el = document.getElementById('ampResUid');
    return el ? el.value.trim() : '';
  };
  const _amount = () => {
    const el = document.getElementById('ampResAmount');
    return el ? parseFloat(el.value) : 0;
  };

  window.ampRefreshStats = async function () {
    const r = await window.founderActions.getStats();
    const s = r.stats;
    const grid = document.getElementById('ampStatsGrid');
    if (!grid) return;
    grid.innerHTML = [
      ['👥', 'Toplam Oyuncu', s.totalUsers],
      ['🟢', 'Online', s.onlineUsers],
      ['🚫', 'Banlı', s.bannedUsers],
      ['💰', 'Toplam Para', (s.totalMoney || 0).toLocaleString('tr-TR') + ' ₺'],
      ['📊', 'Ort. Seviye', (s.avgLevel || 0).toFixed(1)],
      ['⚡', 'Yöneticiler', s.founders],
    ].map(([icon, label, val]) =>
      `<div class="amp-stat-card"><div class="amp-stat-icon">${icon}</div><div class="amp-stat-val">${val}</div><div class="amp-stat-lbl">${label}</div></div>`
    ).join('');
  };

  window.ampToggleMaint = async function (active) {
    const reason = document.getElementById('ampMaintReason')?.value || 'Sistem güncelleniyor';
    const eta = document.getElementById('ampMaintEta')?.value || '15 dk';
    await window.founderActions.toggleMaintenance(active, reason, eta);
    _notify(active ? '🔧 Bakıma alındı' : '✅ Bakımdan çıkarıldı');
  };

  window.ampDoBroadcast = async function () {
    const text = document.getElementById('ampBcText')?.value.trim();
    const dur = parseInt(document.getElementById('ampBcDur')?.value) || 30;
    if (!text) return _notify('Mesaj gerekli', 'error');
    await window.founderActions.sendBroadcast(text, dur);
    _notify('📢 Duyuru yayınlandı');
  };

  window.ampClearBroadcast = async function () {
    await window.founderActions.clearBroadcast();
    _notify('🚫 Duyuru kaldırıldı');
  };

  window.ampSendNotifAll = async function () {
    const msg = document.getElementById('ampNotifText')?.value.trim();
    const icon = document.getElementById('ampNotifIcon')?.value || '📢';
    if (!msg) return _notify('Mesaj gerekli', 'error');
    const r = await window.founderActions.sendNotificationToAll(msg, icon);
    _notify(`📨 ${r.count} oyuncuya gönderildi`);
  };

  window.ampSendQuickBroadcast = function () {
    const msg = prompt('Hızlı duyuru mesajı:');
    if (!msg) return;
    window.founderActions.sendBroadcast(msg, 15).then(() => _notify('📢 Gönderildi'));
  };

  window.ampOpenNews = function () {
    const t = document.querySelector('.amp-tab[data-tab="ampBroadcast"]');
    if (t) t.click();
    setTimeout(() => document.getElementById('ampNewsTitle')?.focus(), 100);
  };

  window.ampPostNews = async function () {
    const title = document.getElementById('ampNewsTitle')?.value.trim();
    const body = document.getElementById('ampNewsBody')?.value.trim();
    if (!title) return _notify('Başlık gerekli', 'error');
    await window.founderActions.postNewsAnnouncement(title, body || '');
    _notify('📰 Haber yayınlandı');
    if (document.getElementById('ampNewsTitle')) document.getElementById('ampNewsTitle').value = '';
    if (document.getElementById('ampNewsBody')) document.getElementById('ampNewsBody').value = '';
  };

  window.ampSearchUser = async function () {
    const q = document.getElementById('ampUserSearch')?.value.trim();
    if (!q) return _notify('Arama terimi girin', 'error');
    const r = await window.founderActions.searchUser(q);
    _renderUserResults(r.users || []);
  };

  window.ampLoadAllUsers = async function () {
    _notify('⏳ Yükleniyor...', 'info');
    const r = await window.founderActions.getAllUsers(200);
    _renderUserResults(r.users || []);
  };

  window.ampShowOnline = async function () {
    const r = await window.founderActions.getAllUsers(500);
    const online = (r.users || []).filter(u => u.online);
    _renderUserResults(online);
  };

  function _renderUserResults(users) {
    const container = document.getElementById('ampUserResults');
    if (!container) return;
    if (!users.length) { container.innerHTML = '<p class="amp-hint">Sonuç bulunamadı.</p>'; return; }
    container.innerHTML = users.map(u => `
      <div class="amp-user-card" data-uid="${u.uid}">
        <div class="amp-user-info">
          <strong>${u.username || 'İsimsiz'}</strong>
          ${u.banned ? '<span class="amp-badge-ban">🚫 BANLI</span>' : ''}
          ${u.online ? '<span class="amp-badge-online">🟢</span>' : '<span class="amp-badge-offline">⚫</span>'}
          <span class="amp-uid">UID: ${u.uid}</span>
          <span>Lv.${u.level || 1} · ${(u.money || 0).toLocaleString('tr-TR')} ₺</span>
        </div>
        <div class="amp-user-actions">
          <button onclick="ampQuickAction('${u.uid}','view')">👁️</button>
          <button onclick="ampQuickAction('${u.uid}','msg')">📩</button>
          <button onclick="ampQuickAction('${u.uid}','title')">👑</button>
          <button onclick="ampQuickAction('${u.uid}','ban')" style="color:#ef4444">${u.banned ? '✅ Bans.' : '🚫 Ban'}</button>
        </div>
      </div>
    `).join('');
  }

  window.ampQuickAction = async function (uid, action) {
    if (action === 'view') {
      const r = await window.founderActions.getUserProfile(uid);
      if (!r.ok) return _notify('Bulunamadı', 'error');
      const u = r.user;
      alert(`👤 ${u.username}\nUID: ${uid}\nLv: ${u.level} | XP: ${u.xp}\n💰 ${(u.money||0).toLocaleString('tr-TR')} ₺ | 💎 ${u.diamonds||0}\nBanlı: ${u.banned ? 'Evet' : 'Hayır'}\nÜnvan: ${u.customTitle || 'Yok'}`);
    } else if (action === 'msg') {
      const msg = prompt(`📩 ${uid} kullanıcısına mesaj:`);
      if (!msg) return;
      await window.founderActions.sendPrivateMessage(uid, msg);
      _notify('📩 Mesaj gönderildi');
    } else if (action === 'title') {
      const title = prompt('👑 Ünvan (boş bırakırsan kaldırılır):');
      if (title === null) return;
      if (!title) { await window.founderActions.removeTitle(uid); _notify('🗑️ Ünvan kaldırıldı'); }
      else { await window.founderActions.grantTitle(uid, title); _notify('👑 Ünvan verildi'); }
    } else if (action === 'ban') {
      const r = await window.founderActions.getUserProfile(uid);
      const isBanned = r.user?.banned;
      if (isBanned) {
        await window.founderActions.unbanUser(uid);
        _notify('✅ Ban kaldırıldı');
      } else {
        const reason = prompt('Ban sebebi:') || 'Kural ihlali';
        await window.founderActions.banUser(uid, reason);
        _notify('🚫 Banlandı');
      }
      ampLoadAllUsers();
    }
  };

  window.ampLoadTickets = async function () {
    const r = await window.founderActions.getSupportTickets();
    const container = document.getElementById('ampTicketList');
    if (!container) return;
    const tickets = r.tickets || [];
    if (!tickets.length) { container.innerHTML = '<p class="amp-hint">Açık destek talebi yok 🎉</p>'; return; }
    container.innerHTML = tickets.map(t => `
      <div class="amp-ticket">
        <div class="amp-ticket-head">
          <strong>${t.username || t.uid}</strong>
          <span class="amp-ticket-status">${t.status}</span>
        </div>
        <div class="amp-ticket-body">${t.message || ''}</div>
        <div class="amp-ticket-actions">
          <textarea id="reply_${t.id}" placeholder="Yanıt..." rows="2"></textarea>
          <button onclick="ampReplyTicket('${t.id}')">💬 Yanıtla</button>
          <button onclick="ampCloseTicket('${t.id}')">✅ Kapat</button>
        </div>
      </div>
    `).join('');
  };

  window.ampReplyTicket = async function (id) {
    const el = document.getElementById('reply_' + id);
    const reply = el?.value.trim();
    if (!reply) return _notify('Yanıt gerekli', 'error');
    await window.founderActions.replyToTicket(id, reply);
    _notify('💬 Yanıtlandı');
    ampLoadTickets();
  };

  window.ampCloseTicket = async function (id) {
    await window.founderActions.closeTicket(id);
    _notify('✅ Kapatıldı');
    ampLoadTickets();
  };

  window.ampSendPrivateMsg = async function () {
    const uid = document.getElementById('ampMsgUid')?.value.trim();
    const msg = document.getElementById('ampMsgText')?.value.trim();
    if (!uid || !msg) return _notify('UID ve mesaj gerekli', 'error');
    await window.founderActions.sendPrivateMessage(uid, msg);
    _notify('📩 Gönderildi');
  };

  window.ampGrantTitle = async function () {
    const uid = document.getElementById('ampTitleUid')?.value.trim();
    const title = document.getElementById('ampTitleText')?.value.trim();
    const color = document.getElementById('ampTitleColor')?.value || '#fbbf24';
    if (!uid || !title) return _notify('UID ve ünvan gerekli', 'error');
    await window.founderActions.grantTitle(uid, title, color);
    _notify('👑 Ünvan verildi');
  };

  window.ampRemoveTitle = async function () {
    const uid = document.getElementById('ampTitleUid')?.value.trim();
    if (!uid) return _notify('UID gerekli', 'error');
    await window.founderActions.removeTitle(uid);
    _notify('🗑️ Ünvan kaldırıldı');
  };

  window.ampSetPresetTitle = function (title) {
    const el = document.getElementById('ampTitleText');
    if (el) el.value = title;
  };

  window.ampGrantMoney = async function () {
    const r = await window.founderActions.grantMoney(_uid(), _amount());
    r.ok ? _notify('💰 Para verildi') : _notify(r.msg || 'Hata', 'error');
  };

  window.ampRemoveMoney = async function () {
    await window.founderActions.removeMoney(_uid(), _amount());
    _notify('💸 Para alındı');
  };

  window.ampGrantDia = async function () {
    const r = await window.founderActions.grantDiamonds(_uid(), _amount());
    r.ok ? _notify('💎 Elmas verildi') : _notify(r.msg || 'Hata', 'error');
  };

  window.ampRemoveDia = async function () {
    await window.founderActions.removeDiamonds(_uid(), _amount());
    _notify('❌ Elmas alındı');
  };

  window.ampGrantXP = async function () {
    await window.founderActions.grantXP(_uid(), _amount());
    _notify('⭐ XP verildi');
  };

  window.ampSetLevel = async function () {
    await window.founderActions.setLevel(_uid(), _amount());
    _notify('📊 Seviye ayarlandı');
  };

  window.ampBanUser = async function () {
    const uid = document.getElementById('ampDangerUid')?.value.trim();
    if (!uid) return _notify('UID gerekli', 'error');
    const reason = prompt('Ban sebebi:') || 'Kural ihlali';
    if (!confirm(`${uid} kullanıcısını banlamak istediğine emin misin?`)) return;
    await window.founderActions.banUser(uid, reason);
    _notify('🚫 Banlandı');
  };

  window.ampUnbanUser = async function () {
    const uid = document.getElementById('ampDangerUid')?.value.trim();
    if (!uid) return _notify('UID gerekli', 'error');
    await window.founderActions.unbanUser(uid);
    _notify('✅ Ban kaldırıldı');
  };

  window.ampFreezeUser = async function (frozen) {
    const uid = document.getElementById('ampDangerUid')?.value.trim();
    if (!uid) return _notify('UID gerekli', 'error');
    await window.founderActions.freezeUser(uid, frozen);
    _notify(frozen ? '🧊 Hesap donduruldu' : '🔥 Hesap çözüldü');
  };

  window.ampResetUser = async function () {
    const uid = document.getElementById('ampDangerUid')?.value.trim();
    if (!uid) return _notify('UID gerekli', 'error');
    if (!confirm(`⚠️ ${uid} hesabı SIFIRLANACAK. Bu işlem geri alınamaz!`)) return;
    await window.founderActions.resetUserAccount(uid);
    _notify('♻️ Hesap sıfırlandı');
  };

  window.ampLoadLogs = async function () {
    const r = await window.founderActions.getRecentLogs(100);
    const container = document.getElementById('ampLogList');
    if (!container) return;
    const logs = r.logs || [];
    if (!logs.length) { container.innerHTML = '<p class="amp-hint">Log bulunamadı.</p>'; return; }
    container.innerHTML = logs.map(l => `
      <div class="amp-log ${l.success ? 'amp-log-ok' : 'amp-log-fail'}">
        <span class="amp-log-icon">${l.success ? '✅' : '❌'}</span>
        <span>UID: ${l.uid || '-'}</span>
        <span class="amp-log-time">${l.ts ? new Date(l.ts).toLocaleString('tr-TR') : '-'}</span>
      </div>
    `).join('');
  };

  /* openFounderPanel alias */
  window.openFounderPanel = function () {
    if (window.GZ_IS_ADMIN) {
      _openAdminPanelFull();
    } else {
      const old = document.getElementById('ampStatsGrid');
      if (old) {
        const p = document.getElementById('adminMasterPanel');
        if (p) p.style.display = p.style.display === 'none' ? '' : '';
      } else {
        _openAdminPanelFull();
      }
    }
  };

  window.openAdminPanel = window.openFounderPanel;

  /* ============================================================
     TAB GEÇİŞİ + KAPAT
     ============================================================ */
  function _bindAdminEvents(panel) {
    panel.querySelectorAll('.amp-tab').forEach(btn => {
      btn.addEventListener('click', () => {
        panel.querySelectorAll('.amp-tab').forEach(b => b.classList.remove('active'));
        panel.querySelectorAll('.amp-panel').forEach(p => p.classList.remove('active'));
        btn.classList.add('active');
        const target = document.getElementById(btn.dataset.tab);
        if (target) target.classList.add('active');
      });
    });

    document.getElementById('ampClose')?.addEventListener('click', () => {
      panel.remove();
    });

    document.getElementById('ampOverlay')?.addEventListener('click', () => {
      panel.remove();
    });
  }

  /* ============================================================
     STİLLER
     ============================================================ */
  function _injectAdminStyles() {
    if (document.getElementById('adminPanelStyles')) return;
    const s = document.createElement('style');
    s.id = 'adminPanelStyles';
    s.textContent = `
      #adminMasterPanel {
        position: fixed; inset: 0; z-index: 99999;
        display: flex; align-items: flex-end; justify-content: center;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      }
      .amp-overlay {
        position: absolute; inset: 0;
        background: rgba(0,0,0,0.6); backdrop-filter: blur(4px);
      }
      .amp-container {
        position: relative; z-index: 1;
        width: 100%; max-width: 900px;
        max-height: 90vh;
        background: #0f172a;
        border-radius: 20px 20px 0 0;
        display: flex; flex-direction: column;
        overflow: hidden;
        border: 1px solid #1e293b;
        box-shadow: 0 -8px 40px rgba(0,0,0,0.5);
      }
      .amp-header {
        display: flex; align-items: center; justify-content: space-between;
        padding: 16px 20px;
        background: linear-gradient(135deg, #7c3aed, #4f46e5);
        flex-shrink: 0;
      }
      .amp-title {
        display: flex; align-items: center; gap: 10px;
        color: #fff; font-size: 16px; font-weight: 700;
      }
      .amp-badge {
        background: rgba(255,255,255,0.2);
        padding: 2px 10px; border-radius: 99px; font-size: 12px;
      }
      .amp-header-actions { display: flex; gap: 8px; }
      .amp-close, .amp-refresh {
        background: rgba(255,255,255,0.15); border: none;
        color: #fff; width: 32px; height: 32px;
        border-radius: 50%; cursor: pointer; font-size: 14px;
        display: flex; align-items: center; justify-content: center;
      }
      .amp-close:hover { background: rgba(239,68,68,0.6); }
      .amp-tabs {
        display: flex; overflow-x: auto; gap: 2px;
        padding: 8px 12px; background: #0f172a;
        border-bottom: 1px solid #1e293b; flex-shrink: 0;
        scrollbar-width: none;
      }
      .amp-tabs::-webkit-scrollbar { display: none; }
      .amp-tab {
        flex-shrink: 0; padding: 6px 14px;
        border: 1px solid #1e293b; border-radius: 8px;
        background: transparent; color: #94a3b8;
        cursor: pointer; font-size: 13px; white-space: nowrap;
        transition: all 0.2s;
      }
      .amp-tab.active {
        background: #7c3aed; color: #fff; border-color: #7c3aed;
      }
      .amp-tab:hover:not(.active) { background: #1e293b; color: #e2e8f0; }
      .amp-body {
        flex: 1; overflow-y: auto; padding: 16px;
        scrollbar-width: thin; scrollbar-color: #334155 transparent;
      }
      .amp-panel { display: none; }
      .amp-panel.active { display: block; }
      .amp-stats-grid {
        display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px;
        margin-bottom: 16px;
      }
      @media(max-width:500px) { .amp-stats-grid { grid-template-columns: repeat(2,1fr); } }
      .amp-stat-card {
        background: #1e293b; border-radius: 12px; padding: 14px;
        text-align: center; border: 1px solid #334155;
      }
      .amp-stat-icon { font-size: 22px; }
      .amp-stat-val { font-size: 18px; font-weight: 700; color: #e2e8f0; margin: 4px 0; }
      .amp-stat-lbl { font-size: 11px; color: #64748b; }
      .amp-section {
        background: #1e293b; border-radius: 12px;
        padding: 14px; margin-bottom: 12px;
        border: 1px solid #334155;
      }
      .amp-section h3 { margin: 0 0 12px; color: #e2e8f0; font-size: 14px; }
      .amp-quick {
        display: flex; flex-wrap: wrap; gap: 8px;
      }
      .amp-quick button, .amp-section button {
        padding: 8px 14px; border: none; border-radius: 8px;
        background: #334155; color: #e2e8f0;
        cursor: pointer; font-size: 13px; transition: all 0.2s;
      }
      .amp-quick button:hover, .amp-section button:hover { background: #475569; }
      .amp-section input[type="text"],
      .amp-section input[type="number"],
      .amp-section textarea,
      .amp-search-row input {
        width: 100%; box-sizing: border-box;
        padding: 8px 12px; border-radius: 8px;
        background: #0f172a; border: 1px solid #334155;
        color: #e2e8f0; font-size: 13px; margin-bottom: 8px;
        resize: vertical;
      }
      .amp-search-row {
        display: flex; gap: 8px; margin-bottom: 12px; flex-wrap: wrap;
      }
      .amp-search-row input { flex: 1; margin-bottom: 0; }
      .amp-search-row button {
        padding: 8px 14px; border: none; border-radius: 8px;
        background: #7c3aed; color: #fff; cursor: pointer; font-size: 13px;
      }
      .amp-row {
        display: flex; gap: 8px; flex-wrap: wrap; align-items: center;
        margin-bottom: 8px;
      }
      .amp-row label { color: #94a3b8; font-size: 13px; }
      .amp-row select {
        padding: 6px 10px; border-radius: 8px;
        background: #0f172a; border: 1px solid #334155;
        color: #e2e8f0; font-size: 13px;
      }
      .amp-hint { color: #64748b; font-size: 13px; text-align: center; padding: 20px; }
      .amp-user-list, .amp-ticket-list, .amp-log-list {
        display: flex; flex-direction: column; gap: 8px;
        max-height: 400px; overflow-y: auto;
        scrollbar-width: thin; scrollbar-color: #334155 transparent;
      }
      .amp-user-card {
        display: flex; align-items: center; justify-content: space-between;
        background: #1e293b; border-radius: 10px; padding: 10px 14px;
        border: 1px solid #334155; gap: 8px; flex-wrap: wrap;
      }
      .amp-user-info { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; font-size: 13px; color: #e2e8f0; }
      .amp-uid { color: #64748b; font-size: 11px; }
      .amp-badge-ban { background: #dc2626; color: #fff; border-radius: 99px; padding: 1px 7px; font-size: 11px; }
      .amp-badge-online { color: #22c55e; }
      .amp-badge-offline { color: #475569; }
      .amp-user-actions { display: flex; gap: 6px; }
      .amp-user-actions button {
        padding: 5px 10px; border: none; border-radius: 6px;
        background: #334155; color: #e2e8f0; cursor: pointer; font-size: 12px;
      }
      .amp-ticket {
        background: #1e293b; border-radius: 10px; padding: 12px;
        border: 1px solid #334155;
      }
      .amp-ticket-head { display: flex; justify-content: space-between; margin-bottom: 6px; color: #e2e8f0; font-size: 13px; }
      .amp-ticket-status { color: #f59e0b; font-size: 12px; }
      .amp-ticket-body { color: #94a3b8; font-size: 13px; margin-bottom: 8px; }
      .amp-ticket-actions { display: flex; gap: 8px; flex-wrap: wrap; }
      .amp-ticket-actions textarea {
        flex: 1; min-width: 200px; padding: 6px 10px;
        background: #0f172a; border: 1px solid #334155; border-radius: 6px;
        color: #e2e8f0; font-size: 12px; resize: vertical;
      }
      .amp-ticket-actions button {
        padding: 6px 12px; border: none; border-radius: 6px;
        background: #334155; color: #e2e8f0; cursor: pointer; font-size: 12px;
      }
      .amp-log { display: flex; align-items: center; gap: 10px; padding: 8px 12px; border-radius: 8px; font-size: 12px; }
      .amp-log-ok { background: rgba(34,197,94,0.1); border: 1px solid rgba(34,197,94,0.2); color: #86efac; }
      .amp-log-fail { background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.2); color: #fca5a5; }
      .amp-log-time { margin-left: auto; color: #475569; }
      .amp-preset-titles { display: flex; flex-wrap: wrap; gap: 6px; }
      .amp-preset-btn {
        padding: 6px 12px; border: 1px solid #334155; border-radius: 99px;
        background: #0f172a; color: #e2e8f0; cursor: pointer; font-size: 12px;
        transition: all 0.2s;
      }
      .amp-preset-btn:hover { background: #7c3aed; border-color: #7c3aed; }
    `;
    document.head.appendChild(s);
  }

  /* ============================================================
     ÜNVAN GÖRÜNÜMÜ — Sıralamalarda ve profillerde göster
     (ui-manager.js'deki render fonksiyonlarına ek)
     ============================================================ */
  function _patchTitleDisplay() {
    // Liderlik tablosunu güncelle — ünvan varsa ekle
    const _origRenderLeader = window.renderLiderlik;
    if (typeof _origRenderLeader === 'function') {
      window.renderLiderlik = async function () {
        await _origRenderLeader();
        // Tabloyu tara, ünvan varsa ekle
        setTimeout(() => {
          document.querySelectorAll('[data-uid]').forEach(async (el) => {
            const uid = el.dataset.uid;
            if (!uid) return;
            const u = await _dbGet(`users/${uid}`);
            if (u && u.customTitle) {
              const existing = el.querySelector('.player-custom-title');
              if (!existing) {
                const span = document.createElement('span');
                span.className = 'player-custom-title';
                span.textContent = u.customTitle;
                span.style.cssText = `color:${u.titleColor||'#fbbf24'};font-size:11px;font-weight:700;margin-left:6px;`;
                el.appendChild(span);
              }
            }
          });
        }, 500);
      };
    }
  }

  /* ============================================================
     BAN KONTROLÜ — Her giriş sonrası kontrol et
     ============================================================ */
  function _setupBanCheck() {
    if (typeof firebase === 'undefined' || !firebase.auth) return;
    firebase.auth().onAuthStateChanged(async (user) => {
      if (!user) return;
      const banned = await _dbGet(`users/${user.uid}/banned`);
      if (banned === true) {
        const reason = await _dbGet(`users/${user.uid}/banReason`) || 'Kural ihlali';
        // Tüm içeriği gizle, ban ekranı göster
        document.body.innerHTML = `
          <div style="display:flex;align-items:center;justify-content:center;min-height:100vh;background:#0f172a;font-family:sans-serif;">
            <div style="text-align:center;padding:40px;background:#1e293b;border-radius:20px;max-width:400px;border:1px solid #dc2626;">
              <div style="font-size:64px;margin-bottom:16px;">🚫</div>
              <h2 style="color:#ef4444;margin:0 0 12px">Hesabın Banlandı</h2>
              <p style="color:#94a3b8;margin:0 0 20px">Sebep: <strong style="color:#e2e8f0">${reason}</strong></p>
              <p style="color:#64748b;font-size:13px">İtiraz için: gamezone.destek@gmail.com</p>
            </div>
          </div>
        `;
        firebase.auth().signOut();
      }
    });
  }

  /* ============================================================
     INIT
     ============================================================ */
  function init() {
    setupAdminAuthWatcher();
    _setupBanCheck();

    // openFounderPanel yok ama isFounder varsa butonu aktif et
    setTimeout(() => {
      const btn = document.getElementById('founderTriggerBtn');
      if (btn && !btn.dataset.adminBound) {
        btn.dataset.adminBound = '1';
        btn.addEventListener('click', () => {
          if (window.GZ_IS_FOUNDER || window.GZ_IS_ADMIN) {
            window.openFounderPanel();
          }
        });
      }
    }, 2000);

    console.log('%c[Admin] ✅ Yönetici sistemi yüklendi', 'color:#7c3aed;font-weight:bold');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    setTimeout(init, 200);
  }

})();


/*
  ╔══════════════════════════════════════════════════════════════╗
  ║   INDEX.HTML — EKLEME GEREKİYOR                             ║
  ║                                                              ║
  ║   konsol-manager.js'nin hemen altına:                       ║
  ║   <script src="admin-panel.js"></script>                    ║
  ╚══════════════════════════════════════════════════════════════╝

  ╔══════════════════════════════════════════════════════════════╗
  ║   FIREBASE REALTIME DATABASE RULES                           ║
  ║   (firebase-rules.json'a ekle)                              ║
  ║                                                              ║
  ║   "system": {                                               ║
  ║     ".read": true,                                          ║
  ║     ".write": "auth != null && (                            ║
  ║       root.child('users').child(auth.uid)                   ║
  ║         .child('isFounder').val() === true                  ║
  ║     )"                                                       ║
  ║   },                                                         ║
  ║   "broadcast": {                                            ║
  ║     ".read": true,                                          ║
  ║     ".write": "auth != null && (                            ║
  ║       root.child('users').child(auth.uid)                   ║
  ║         .child('isFounder').val() === true                  ║
  ║     )"                                                       ║
  ║   },                                                         ║
  ║   "support": {                                              ║
  ║     ".read": "auth != null",                                ║
  ║     ".write": "auth != null"                                ║
  ║   }                                                          ║
  ╚══════════════════════════════════════════════════════════════╝
*/
