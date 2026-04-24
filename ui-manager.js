// ============================================================
// CakeSmash - Arayüz (UI) Yöneticisi
// Geliştirici: Serkan Karakaş
// İçerik: ekran (screen) geçişleri, kayıt/giriş ekranları, ana
// menü, harita (bölüm/seviye seçimi), oyun ekranı (mini Pasta
// Smash), mağaza, çark, günlük ödül, profil, ayarlar, hakkında,
// nasıl oynanır, hediye kodu, posta kutusu, liderlik tablosu.
// ============================================================

import { Auth, Session, on as onAuth } from "./giriş.js";
import {
  CONFIG, Board, regenerateLivesAndEnergy, nextLifeCountdownMs,
  addGold, spendGold, addGems, addLives, consumeLife, completeLevel,
  buyPowerup, usePowerup, claimDailyReward, spinWheel, buyShopPack,
  saveSettings, redeemGiftCode, getTopLeaderboard, applyReward
} from "./ekonomi.js";

// --- Yardımcı: $ seçici ---
const $ = (s, root = document) => root.querySelector(s);
const $$ = (s, root = document) => Array.from(root.querySelectorAll(s));
const fmt = (n) => (n || 0).toLocaleString("tr-TR");

// --- Toast ---
function toast(msg, kind = "info") {
  const t = document.createElement("div");
  t.className = "toast toast-" + kind;
  t.textContent = msg;
  $("#toastHost").appendChild(t);
  requestAnimationFrame(() => t.classList.add("show"));
  setTimeout(() => { t.classList.remove("show"); setTimeout(() => t.remove(), 300); }, 2400);
}
window.toast = toast;

// --- Yükleyici ---
function showLoader(on) { $("#loader").classList.toggle("show", !!on); }

// --- Ekran geçişleri ---
const SCREENS = ["splash","auth","menu","map","game","shop","wheel","daily","profile","settings","about","howto","gift","mail","leaderboard","powerups","missions","achievements","events","friends","accountHelp"];
function show(screen) {
  SCREENS.forEach(s => { const el = $("#screen-" + s); if (el) el.hidden = (s !== screen); });
  if (screen !== "splash") regenerateLivesAndEnergy().catch(() => {});
  refreshHeader();
  if (screen === "menu") renderMenu();
  if (screen === "map") renderMap();
  if (screen === "shop") renderShop();
  if (screen === "wheel") renderWheel();
  if (screen === "daily") renderDaily();
  if (screen === "profile") renderProfile();
  if (screen === "settings") renderSettings();
  if (screen === "leaderboard") renderLeaderboard();
  if (screen === "powerups") renderPowerups();
  if (screen === "missions") renderMissions();
  if (screen === "achievements") renderAchievements();
  if (screen === "mail") renderMail();
  if (screen === "events") renderEvents();
  if (screen === "friends") renderFriends();
  if (screen === "accountHelp") renderAccountHelp();
}
window.show = show;

// --- Üst bilgi (altın, can, elmas) ---
function refreshHeader() {
  const e = Session.data?.economy || {}; const p = Session.data?.profile || {};
  const goldEl = $("#hdrGold"); const livesEl = $("#hdrLives"); const gemsEl = $("#hdrGems");
  const lvlEl = $("#hdrLvl"); const nickEl = $("#hdrNick");
  if (goldEl) goldEl.textContent = fmt(e.gold);
  if (livesEl) livesEl.textContent = e.maxLives && e.lives >= e.maxLives ? "Dolu" : fmt(e.lives || 0);
  if (gemsEl) gemsEl.textContent = fmt(e.gems);
  if (lvlEl) lvlEl.textContent = "Seviye " + (p.level || 1);
  if (nickEl) nickEl.textContent = p.displayName || "Oyuncu";
  // Can geri sayımı
  const tEl = $("#hdrLifeTimer");
  if (tEl) {
    const ms = nextLifeCountdownMs();
    if (ms > 0) {
      const m = Math.floor(ms/60000); const s = Math.floor((ms%60000)/1000);
      tEl.textContent = `+1 can: ${m}:${String(s).padStart(2,"0")}`;
      tEl.hidden = false;
    } else { tEl.hidden = true; }
  }
}
setInterval(refreshHeader, 1000);

// =============== AUTH EKRANI ===============
function bindAuthForms() {
  const tabLogin = $("#tabLogin"); const tabRegister = $("#tabRegister");
  const formLogin = $("#formLogin"); const formRegister = $("#formRegister");
  tabLogin.addEventListener("click", () => {
    tabLogin.classList.add("active"); tabRegister.classList.remove("active");
    formLogin.hidden = false; formRegister.hidden = true;
  });
  tabRegister.addEventListener("click", () => {
    tabRegister.classList.add("active"); tabLogin.classList.remove("active");
    formRegister.hidden = false; formLogin.hidden = true;
  });

  formLogin.addEventListener("submit", async (ev) => {
    ev.preventDefault(); showLoader(true);
    try {
      const email = $("#li_email").value; const password = $("#li_pw").value;
      await Auth.login({ email, password });
      toast("Hoş geldin!", "ok");
    } catch (e) { toast(e.message, "err"); }
    finally { showLoader(false); }
  });
  formRegister.addEventListener("submit", async (ev) => {
    ev.preventDefault(); showLoader(true);
    try {
      const email = $("#rg_email").value; const password = $("#rg_pw").value;
      const nick = $("#rg_nick").value;
      await Auth.register({ email, password, nick });
      toast("Hesap oluşturuldu! 100 altın hediyemiz olsun.", "ok");
    } catch (e) { toast(e.message, "err"); }
    finally { showLoader(false); }
  });

  $("#btnGuest").addEventListener("click", async () => {
    showLoader(true);
    try { await Auth.loginGuest(); toast("Misafir olarak giriş yaptın.", "ok"); }
    catch (e) { toast(e.message, "err"); } finally { showLoader(false); }
  });
  $("#btnGoogle").addEventListener("click", async () => {
    showLoader(true);
    try { await Auth.loginGoogle(); toast("Google ile giriş tamam!", "ok"); }
    catch (e) { toast(e.message, "err"); } finally { showLoader(false); }
  });
  $("#btnReset").addEventListener("click", async () => {
    const email = prompt("Şifre sıfırlama için e-postanı gir:");
    if (!email) return;
    try { await Auth.sendReset(email); toast("Sıfırlama maili gönderildi.", "ok"); }
    catch (e) { toast(e.message, "err"); }
  });
}

// =============== ANA MENÜ ===============
function renderMenu() {
  // Sosyal sayaçlar / hızlı bilgiler
  const e = Session.data?.economy || {};
  $("#menuStreak").textContent = "Seri: " + (e.streakDay || 0) + " gün";
  $("#menuVipBadge").hidden = !(Session.data?.profile?.vip);
}

// =============== HARİTA / BÖLÜMLER ===============
function renderMap() {
  const host = $("#mapList"); host.innerHTML = "";
  const prog = Session.data?.progress || { world: 1, level: 1 };
  CONFIG.WORLDS.forEach(w => {
    const wEl = document.createElement("div");
    wEl.className = "world-card"; wEl.style.borderColor = w.color;
    wEl.innerHTML = `<div class="world-title" style="color:${w.color}">${w.id}. ${w.name}</div>`;
    const grid = document.createElement("div"); grid.className = "level-grid";
    for (let i = 1; i <= w.levels; i++) {
      const cleared = (w.id < prog.world) || (w.id === prog.world && i < prog.level);
      const current = (w.id === prog.world && i === prog.level);
      const locked = (w.id > prog.world) || (w.id === prog.world && i > prog.level);
      const b = document.createElement("button");
      b.className = "lvl " + (cleared ? "done" : current ? "now" : locked ? "lock" : "");
      b.textContent = locked ? "🔒" : i;
      b.disabled = locked;
      b.addEventListener("click", () => startLevel(w.id, i));
      grid.appendChild(b);
    }
    wEl.appendChild(grid);
    host.appendChild(wEl);
  });
}

// =============== OYUN (Mini Pasta Smash) ===============
const Game = {
  rows: 8, cols: 8, grid: null, score: 0, moves: 25, smashed: 0, combo: 0, bestCombo: 0,
  world: 1, level: 1, doubleScore: false, timeFreezeUntil: 0,
  start(world, level) {
    this.world = world; this.level = level;
    this.rows = 8 + Math.min(2, Math.floor((level-1)/10));
    this.cols = 8;
    this.grid = Board.newBoard(this.rows, this.cols);
    this.score = 0; this.moves = Math.max(15, 30 - Math.floor(level/2)); this.smashed = 0; this.combo = 0;
    this.bestCombo = 0; this.doubleScore = false; this.timeFreezeUntil = 0;
    this.target = 30 + level * 8; // hedef puan
    this.draw(); this.updateHud();
    show("game");
  },
  draw() {
    const host = $("#gameBoard"); host.innerHTML = "";
    host.style.setProperty("--cols", this.cols);
    host.style.setProperty("--rows", this.rows);
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        const cell = document.createElement("button");
        cell.className = "cell";
        cell.style.background = this.grid[r][c];
        cell.dataset.r = r; cell.dataset.c = c;
        cell.addEventListener("click", () => this.tap(r, c));
        host.appendChild(cell);
      }
    }
  },
  updateHud() {
    $("#gScore").textContent = fmt(this.score);
    $("#gMoves").textContent = this.moves;
    $("#gTarget").textContent = this.target;
    $("#gWorld").textContent = `${this.world}-${this.level}`;
    $("#gCombo").textContent = "x" + Math.max(1, this.combo || 1);
  },
  async tap(r, c) {
    if (this.moves <= 0) return;
    const group = Board.findGroup(this.grid, r, c);
    if (group.length < 2) { this.combo = 0; return this.updateHud(); }
    const res = Board.smashGroup(this.grid, group);
    this.grid = res.grid;
    let scored = res.score;
    this.combo += 1; if (this.combo > this.bestCombo) this.bestCombo = this.combo;
    if (this.doubleScore) scored *= 2;
    if (this.combo >= 3) scored = Math.floor(scored * (1 + (this.combo-2) * 0.15));
    this.score += scored; this.smashed += res.smashed;
    this.moves -= 1;
    this.draw(); this.updateHud();
    if (this.score >= this.target) return this.win();
    if (this.moves <= 0) return this.lose();
  },
  async usePower(item) {
    try { await usePowerup(item); }
    catch (e) { toast(e.message, "err"); return; }
    if (item === "extraMoves") { this.moves += 5; this.updateHud(); toast("+5 hamle", "ok"); }
    if (item === "shuffle") { this.grid = Board.newBoard(this.rows, this.cols); this.draw(); toast("Tahta karıştırıldı", "ok"); }
    if (item === "doubleScore") { this.doubleScore = true; toast("Çift skor aktif", "ok"); }
    if (item === "rainbow") {
      const counts = {};
      for (let r=0;r<this.rows;r++) for (let c=0;c<this.cols;c++) counts[this.grid[r][c]] = (counts[this.grid[r][c]]||0)+1;
      const top = Object.entries(counts).sort((a,b)=>b[1]-a[1])[0][0];
      let n = 0;
      for (let r=0;r<this.rows;r++) for (let c=0;c<this.cols;c++) if (this.grid[r][c]===top) { this.grid[r][c]=null; n++; }
      // çek
      for (let x=0;x<this.cols;x++) {
        const stack = [];
        for (let y=this.rows-1;y>=0;y--) if (this.grid[y][x]) stack.push(this.grid[y][x]);
        for (let y=this.rows-1;y>=0;y--) this.grid[y][x] = stack.shift() || Board.randomColor();
      }
      this.score += n * 25 * (this.doubleScore?2:1);
      this.smashed += n; this.draw(); this.updateHud();
      if (this.score >= this.target) return this.win();
    }
    if (item === "hammer") { toast("Bir kareye dokun: çekiç hazır", "info"); /* basitleştirildi */ }
    if (item === "bomb") {
      const r = Math.floor(this.rows/2), c = Math.floor(this.cols/2);
      let n = 0;
      for (let dy=-1;dy<=1;dy++) for (let dx=-1;dx<=1;dx++) {
        const y = r+dy, x = c+dx;
        if (y>=0 && y<this.rows && x>=0 && x<this.cols) { this.grid[y][x] = null; n++; }
      }
      for (let x=0;x<this.cols;x++) {
        const stack = [];
        for (let y=this.rows-1;y>=0;y--) if (this.grid[y][x]) stack.push(this.grid[y][x]);
        for (let y=this.rows-1;y>=0;y--) this.grid[y][x] = stack.shift() || Board.randomColor();
      }
      this.score += n * 20; this.smashed += n; this.draw(); this.updateHud();
    }
  },
  async win() {
    const stars = this.score >= this.target * 2 ? 3 : this.score >= this.target * 1.5 ? 2 : 1;
    showResult(true, this.score, stars);
    await completeLevel({
      world: this.world, level: this.level, score: this.score, stars,
      smashed: this.smashed, combo: this.bestCombo
    });
  },
  async lose() {
    showResult(false, this.score, 0);
    try { await consumeLife(); } catch (_) {}
  }
};

async function startLevel(world, level) {
  try { await consumeLife(); }
  catch (e) { toast(e.message, "err"); return; }
  Game.start(world, level);
}
window.startLevel = startLevel;

function showResult(win, score, stars) {
  const m = $("#resultModal");
  $("#resultTitle").textContent = win ? "Bölümü Geçtin!" : "Yine Dene!";
  $("#resultScore").textContent = fmt(score);
  $("#resultStars").innerHTML = "★★★".split("").map((s,i)=> `<span class="${i<stars?'on':'off'}">${s}</span>`).join("");
  m.classList.add("show");
  $("#resultClose").onclick = () => { m.classList.remove("show"); show("map"); };
  $("#resultRetry").onclick = () => { m.classList.remove("show"); startLevel(Game.world, Game.level); };
}

// =============== MAĞAZA ===============
function renderShop() {
  const host = $("#shopList"); host.innerHTML = "";
  CONFIG.SHOP_PACKS.forEach(p => {
    const card = document.createElement("div"); card.className = "shop-card";
    card.innerHTML = `
      <div class="shop-title">${p.label}</div>
      <ul class="shop-rewards">
        ${p.reward.gold ? `<li>🪙 ${p.reward.gold} altın</li>` : ""}
        ${p.reward.gems ? `<li>💎 ${p.reward.gems} elmas</li>` : ""}
        ${p.reward.lives ? `<li>❤ ${p.reward.lives} can</li>` : ""}
        ${p.reward.powerups ? Object.entries(p.reward.powerups).map(([k,v]) => `<li>✨ ${v}× ${CONFIG.POWERUPS[k]?.name || k}</li>`).join("") : ""}
      </ul>
      <button class="btn-buy">₺${p.price_try.toFixed(2)}</button>
    `;
    card.querySelector("button").addEventListener("click", async () => {
      try { await buyShopPack(p.id); toast("Paket teslim edildi.", "ok"); }
      catch (e) { toast(e.message, "err"); }
    });
    host.appendChild(card);
  });
}

// =============== ÇARK ===============
function renderWheel() {
  const wheel = $("#wheelDisc"); wheel.innerHTML = "";
  const rewards = CONFIG.WHEEL_REWARDS;
  const slice = 360 / rewards.length;
  rewards.forEach((r, i) => {
    const span = document.createElement("div");
    span.className = "wheel-slice";
    span.style.transform = `rotate(${i*slice}deg) skewY(-${90 - slice}deg)`;
    span.style.background = i % 2 ? "#ffd1e6" : "#ffe6f1";
    span.innerHTML = `<span class="wheel-label" style="transform: skewY(${90-slice}deg) rotate(${slice/2}deg)">${r.label}</span>`;
    wheel.appendChild(span);
  });
  $("#btnSpin").onclick = async () => {
    try {
      const r = await spinWheel();
      const idx = rewards.indexOf(r);
      const turns = 5 + Math.random() * 2;
      const finalDeg = turns * 360 + (idx * slice + slice/2);
      wheel.style.transition = "transform 3s cubic-bezier(.2,.8,.2,1)";
      wheel.style.transform = `rotate(${finalDeg}deg)`;
      setTimeout(() => toast("Kazandın: " + r.label, "ok"), 3100);
    } catch (e) { toast(e.message, "err"); }
  };
}

// =============== GÜNLÜK ÖDÜL ===============
function renderDaily() {
  const host = $("#dailyGrid"); host.innerHTML = "";
  const cur = Session.data?.economy?.streakDay || 0;
  CONFIG.DAILY_REWARDS.forEach(r => {
    const c = document.createElement("div"); c.className = "daily-card " + (r.day <= cur ? "done" : "");
    c.innerHTML = `<div class="d-day">Gün ${r.day}</div>
      <div class="d-reward">${r.type === "gold" ? "🪙 " + r.amount : r.type === "gems" ? "💎 " + r.amount : r.type === "lives" ? "❤ " + r.amount : "✨ " + (CONFIG.POWERUPS[r.item]?.name || r.item)}</div>`;
    host.appendChild(c);
  });
  $("#btnClaimDaily").onclick = async () => {
    try { const res = await claimDailyReward(); toast(`${res.day}. gün ödülü alındı!`, "ok"); renderDaily(); }
    catch (e) { toast(e.message, "err"); }
  };
}

// =============== PROFİL ===============
function renderProfile() {
  const p = Session.data?.profile || {}; const prog = Session.data?.progress || {};
  $("#prfNick").value = p.displayName || "";
  $("#prfBio").value = p.bio || "";
  $("#prfCountry").value = p.country || "TR";
  $("#prfUid").textContent = Session.user?.uid || "—";
  $("#prfLevel").textContent = "Seviye " + (p.level || 1);
  $("#prfXP").textContent = (p.xp || 0) + " / " + CONFIG.XP_PER_LEVEL;
  $("#prfTotalScore").textContent = fmt(prog.totalScore || 0);
  $("#prfStars").textContent = (prog.stars || 0);
  $("#prfBestCombo").textContent = (prog.bestCombo || 0);
  $("#prfSmashed").textContent = fmt(prog.cakesSmashed || 0);
  $("#prfVip").textContent = p.vip ? "VIP" : "Normal";
}
function bindProfile() {
  $("#btnSaveProfile").onclick = async () => {
    try {
      await Auth.updateMyProfile({ nick: $("#prfNick").value, bio: $("#prfBio").value, country: $("#prfCountry").value });
      toast("Profil güncellendi.", "ok");
    } catch (e) { toast(e.message, "err"); }
  };
  $("#btnCopyUid").onclick = async () => {
    try { await navigator.clipboard.writeText(Session.user?.uid || ""); toast("Kullanıcı kimliği kopyalandı.", "ok"); }
    catch (_) { toast("Kopyalanamadı.", "err"); }
  };
  $("#btnLogout").onclick = async () => { await Auth.logout(); toast("Çıkış yapıldı.", "info"); };
  $("#btnDeleteAcc").onclick = async () => {
    if (!confirm("Hesabını silmek istediğine emin misin? Bu işlem geri alınamaz.")) return;
    try { await Auth.deleteAccount(); toast("Hesap silindi.", "ok"); }
    catch (e) { toast(e.message, "err"); }
  };
  $("#btnChangePw").onclick = async () => {
    const pw = prompt("Yeni şifre (en az 6 karakter):"); if (!pw) return;
    try { await Auth.changePassword(pw); toast("Şifre güncellendi.", "ok"); }
    catch (e) { toast(e.message, "err"); }
  };
}

// =============== AYARLAR ===============
function renderSettings() {
  const s = Session.data?.settings || {};
  $("#stMusic").checked = !!s.music;
  $("#stSfx").checked = !!s.sfx;
  $("#stHints").checked = !!s.hints;
  $("#stFlash").checked = !!s.flashEffects;
  $("#stMono").checked = !!s.mono;
  $("#stGray").checked = !!s.grayscale;
  $("#stMusicVol").value = s.musicVolume ?? 0.7;
  $("#stSfxVol").value = s.sfxVolume ?? 1;
  $("#stBalance").value = s.balance ?? 0;
  $("#stBass").value = s.bass ?? 0.5;
  $("#stTreble").value = s.treble ?? 0.5;
  $("#stLang").value = s.language || "tr";
  document.body.classList.toggle("grayscale", !!s.grayscale);
}
function bindSettings() {
  const save = async () => {
    try {
      await saveSettings({
        music: $("#stMusic").checked, sfx: $("#stSfx").checked,
        hints: $("#stHints").checked, flashEffects: $("#stFlash").checked,
        mono: $("#stMono").checked, grayscale: $("#stGray").checked,
        musicVolume: parseFloat($("#stMusicVol").value),
        sfxVolume: parseFloat($("#stSfxVol").value),
        balance: parseFloat($("#stBalance").value),
        bass: parseFloat($("#stBass").value),
        treble: parseFloat($("#stTreble").value),
        language: $("#stLang").value
      });
      document.body.classList.toggle("grayscale", $("#stGray").checked);
      toast("Ayarlar kaydedildi.", "ok");
    } catch (e) { toast(e.message, "err"); }
  };
  ["change","input"].forEach(ev => $$("#screen-settings input,#screen-settings select").forEach(el => el.addEventListener(ev, () => clearTimeout(window.__stT) || (window.__stT = setTimeout(save, 500)))));
}

// =============== LİDERLİK ===============
async function renderLeaderboard() {
  const host = $("#lbList"); host.innerHTML = "Yükleniyor...";
  try {
    const arr = await getTopLeaderboard(50);
    host.innerHTML = "";
    if (!arr.length) { host.innerHTML = "<div class='muted'>Henüz kayıt yok.</div>"; return; }
    arr.forEach((r, i) => {
      const row = document.createElement("div"); row.className = "lb-row";
      row.innerHTML = `<div class="lb-rank">#${i+1}</div><div class="lb-nick">${r.nick}</div><div class="lb-score">${fmt(r.score)}</div>`;
      host.appendChild(row);
    });
  } catch (e) { host.innerHTML = "Hata: " + e.message; }
}

// =============== GÜÇLENDİRİCİLER ===============
function renderPowerups() {
  const host = $("#puList"); host.innerHTML = "";
  const inv = Session.data?.inventory || {};
  Object.entries(CONFIG.POWERUPS).forEach(([k, def]) => {
    const c = document.createElement("div"); c.className = "pu-card";
    c.innerHTML = `<div class="pu-name">${def.name}</div>
      <div class="pu-desc">${def.desc}</div>
      <div class="pu-row"><span>Sahip: ${inv[k] || 0}</span>
      <button data-k="${k}">Satın Al · ${def.price} 🪙</button></div>`;
    c.querySelector("button").addEventListener("click", async () => {
      try { await buyPowerup(k); toast(def.name + " alındı.", "ok"); renderPowerups(); }
      catch (e) { toast(e.message, "err"); }
    });
    host.appendChild(c);
  });
  // Oyun ekranındaki bar (eğer oyundaysak)
  const bar = $("#gPowerBar"); if (bar) {
    bar.innerHTML = "";
    Object.entries(CONFIG.POWERUPS).forEach(([k, def]) => {
      const b = document.createElement("button"); b.className = "pu-btn";
      b.innerHTML = `${def.name}<small>${inv[k]||0}</small>`;
      b.onclick = () => Game.usePower(k);
      bar.appendChild(b);
    });
  }
}

// =============== GÖREVLER ===============
function renderMissions() {
  const host = $("#msList"); host.innerHTML = "";
  const m = Session.data?.missions || {};
  CONFIG.MISSIONS.forEach(def => {
    const cur = m[def.id] || { progress: 0, claimed: false };
    const row = document.createElement("div"); row.className = "ms-row";
    row.innerHTML = `<div class="ms-desc">${def.desc}</div>
      <div class="ms-prog">${cur.progress}/${def.target}</div>
      <div class="ms-rwd">🪙 ${def.reward.gold || 0}</div>`;
    host.appendChild(row);
  });
}

// =============== BAŞARIMLAR ===============
function renderAchievements() {
  const host = $("#achList"); host.innerHTML = "";
  const a = Session.data?.achievements || {};
  CONFIG.ACHIEVEMENTS.forEach(def => {
    const got = !!a[def.id];
    const c = document.createElement("div"); c.className = "ach-card " + (got ? "done" : "");
    c.innerHTML = `<div class="ach-name">${def.name} ${got ? "✓" : ""}</div>
      <div class="ach-desc">${def.desc}</div>
      <div class="ach-rwd">${def.gold ? "🪙 " + def.gold : ""}</div>`;
    host.appendChild(c);
  });
}

// =============== POSTA ===============
function renderMail() {
  const host = $("#mailList"); host.innerHTML = "";
  const mb = Session.data?.mailbox || {};
  const arr = Object.entries(mb).sort((a,b) => (b[1].createdAt||0) - (a[1].createdAt||0));
  if (!arr.length) { host.innerHTML = "<div class='muted'>Posta kutun boş.</div>"; return; }
  arr.forEach(([id, m]) => {
    const c = document.createElement("div"); c.className = "mail-card " + (m.read ? "read" : "");
    c.innerHTML = `<div class="mail-subject">${m.subject || "Mektup"}</div>
      <div class="mail-body">${m.body || ""}</div>
      <div class="mail-row">
        <small>${new Date(m.createdAt||0).toLocaleString("tr-TR")}</small>
        <button>${m.claimed ? "Alındı" : "Ödülü Al"}</button>
      </div>`;
    c.querySelector("button").addEventListener("click", async () => {
      try { const { claimMail } = await import("./ekonomi.js"); await claimMail(id); toast("Ödül alındı.", "ok"); renderMail(); }
      catch (e) { toast(e.message, "err"); }
    });
    host.appendChild(c);
  });
}

// =============== ETKİNLİKLER ===============
function renderEvents() {
  const host = $("#evList"); host.innerHTML = "";
  // Şimdilik statik bir etkinlik kartı (Çark)
  const c = document.createElement("div"); c.className = "ev-card";
  c.innerHTML = `<div class="ev-title">Güçlendirici Çarkı</div>
    <div class="ev-desc">Her gün bedava bir çevirme hakkın var.</div>
    <button onclick="show('wheel')">Aç</button>`;
  host.appendChild(c);
}

// =============== ARKADAŞLAR ===============
function renderFriends() {
  const host = $("#frList"); host.innerHTML = "<div class='muted'>Yakında: arkadaş ekleme, can gönderme, davet sistemi.</div>";
}

// =============== HESAP & YARDIM ===============
function renderAccountHelp() {
  $("#ahUid").textContent = Session.user?.uid || "—";
  $("#ahEmail").textContent = Session.user?.email || "Misafir";
  $("#ahCopy").onclick = async () => {
    try { await navigator.clipboard.writeText(Session.user?.uid || ""); toast("Kullanıcı kimliği kopyalandı.", "ok"); }
    catch (_) {}
  };
  $("#ahForum").onclick = () => window.open("https://community.king.com", "_blank");
  $("#ahHelp").onclick  = () => window.open("https://www.support.king.com", "_blank");
  $("#ahDelete").onclick = async () => {
    if (!confirm("Hesabını silmek istediğinden emin misin?")) return;
    try { await Auth.deleteAccount(); toast("Hesap silindi.", "ok"); } catch (e) { toast(e.message, "err"); }
  };
}

// =============== HEDİYE KODU ===============
function bindGift() {
  $("#btnRedeem").addEventListener("click", async () => {
    const code = $("#giftInput").value.trim();
    try { const r = await redeemGiftCode(code); toast("Ödül alındı: " + JSON.stringify(r), "ok"); }
    catch (e) { toast(e.message, "err"); }
  });
}

// =============== Üst düğme bağlamaları ===============
function bindTop() {
  $$("[data-go]").forEach(b => b.addEventListener("click", () => show(b.dataset.go)));
}

// =============== Splash & ilk yükleme ===============
function init() {
  bindAuthForms(); bindProfile(); bindSettings(); bindGift(); bindTop();

  onAuth("ready", () => { showLoader(false); show("menu"); });
  onAuth("change", () => { refreshHeader(); });
  onAuth("logout", () => { showLoader(false); show("auth"); });

  // 1.2 saniyelik splash sonra durum kontrolü
  setTimeout(() => {
    if (!Session.user) show("auth");
  }, 1200);
}

document.addEventListener("DOMContentLoaded", init);
