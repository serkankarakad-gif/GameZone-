// ============================================================
// CakeSmash - Ekonomi & Oyun Sistemi Modülü
// Geliştirici: Serkan Karakaş
// İçerik: altın, can, enerji, çark, günlük ödül, mağaza,
// envanter (güçlendiriciler), seviye/XP, başarımlar, görevler,
// liderlik tablosu, posta kutusu, mini puzzle skoru.
// ============================================================

import { FB } from "./firebase-init.js";
import { Session } from "./giriş.js";

// ---------- Sabitler ----------
export const CONFIG = {
  LIFE_REGEN_MS: 30 * 60 * 1000,    // 30 dakikada 1 can
  ENERGY_REGEN_MS: 5 * 60 * 1000,   // 5 dakikada 1 enerji
  XP_PER_LEVEL: 250,                // Her oyuncu seviyesi
  WHEEL_COOLDOWN_MS: 24 * 60 * 60 * 1000, // Çarkı 24 saatte bir
  MAX_DAILY_STREAK: 30,
  WORLDS: [
    { id: 1, name: "Tatlı Krallık", levels: 30, color: "#ff5fa2" },
    { id: 2, name: "Çikolata Ormanı", levels: 30, color: "#7a4a2a" },
    { id: 3, name: "Şekerli Vadi", levels: 30, color: "#ffb627" },
    { id: 4, name: "Karamel Kalesi", levels: 30, color: "#c97a3a" },
    { id: 5, name: "Donut Adası", levels: 30, color: "#f471b5" },
    { id: 6, name: "Pasta Diyarı", levels: 30, color: "#a78bfa" }
  ],
  POWERUPS: {
    hammer:     { name: "Çekiç",          desc: "Tek bir kareyi parçala.",       price: 250 },
    bomb:       { name: "Bomba",          desc: "3x3 alanı patlat.",             price: 450 },
    rainbow:    { name: "Gökkuşağı",      desc: "Aynı renkleri toplar.",         price: 600 },
    shuffle:    { name: "Karıştır",       desc: "Tahtayı yeniden karıştır.",     price: 200 },
    extraMoves: { name: "+5 Hamle",       desc: "Hamle hakkı ekler.",            price: 300 },
    timeFreeze: { name: "Zaman Donut",    desc: "Süreyi 10 sn dondurur.",        price: 350 },
    magnet:     { name: "Mıknatıs",       desc: "Aynı renkleri çeker.",          price: 400 },
    doubleScore:{ name: "Çift Skor",      desc: "Tur boyunca 2x puan.",          price: 500 }
  },
  WHEEL_REWARDS: [
    { type: "gold",   amount: 50,  weight: 30, label: "50 Altın" },
    { type: "gold",   amount: 200, weight: 12, label: "200 Altın" },
    { type: "gold",   amount: 1000,weight: 2,  label: "1000 Altın" },
    { type: "lives",  amount: 5,   weight: 18, label: "5 Can" },
    { type: "gems",   amount: 5,   weight: 8,  label: "5 Elmas" },
    { type: "gems",   amount: 25,  weight: 3,  label: "25 Elmas" },
    { type: "powerup",item: "hammer",  amount: 1, weight: 10, label: "Çekiç" },
    { type: "powerup",item: "bomb",    amount: 1, weight: 7,  label: "Bomba" },
    { type: "powerup",item: "rainbow", amount: 1, weight: 5,  label: "Gökkuşağı" },
    { type: "powerup",item: "shuffle", amount: 1, weight: 5,  label: "Karıştır" }
  ],
  DAILY_REWARDS: [
    { day: 1,  type: "gold",  amount: 100 },
    { day: 2,  type: "gold",  amount: 150 },
    { day: 3,  type: "lives", amount: 3 },
    { day: 4,  type: "gold",  amount: 250 },
    { day: 5,  type: "gems",  amount: 5 },
    { day: 6,  type: "powerup", item: "bomb", amount: 1 },
    { day: 7,  type: "gold",  amount: 1000 },
    { day: 8,  type: "gold",  amount: 200 },
    { day: 9,  type: "lives", amount: 5 },
    { day: 10, type: "gems",  amount: 10 },
    { day: 11, type: "gold",  amount: 300 },
    { day: 12, type: "powerup", item: "rainbow", amount: 1 },
    { day: 13, type: "gold",  amount: 400 },
    { day: 14, type: "gems",  amount: 25 },
    { day: 15, type: "gold",  amount: 1500 },
    { day: 16, type: "powerup", item: "magnet", amount: 1 },
    { day: 17, type: "gold",  amount: 350 },
    { day: 18, type: "lives", amount: 10 },
    { day: 19, type: "gems",  amount: 15 },
    { day: 20, type: "gold",  amount: 800 },
    { day: 21, type: "powerup", item: "doubleScore", amount: 1 },
    { day: 22, type: "gold",  amount: 500 },
    { day: 23, type: "gems",  amount: 20 },
    { day: 24, type: "powerup", item: "extraMoves", amount: 2 },
    { day: 25, type: "gold",  amount: 1200 },
    { day: 26, type: "lives", amount: 8 },
    { day: 27, type: "gems",  amount: 30 },
    { day: 28, type: "powerup", item: "timeFreeze", amount: 1 },
    { day: 29, type: "gold",  amount: 2000 },
    { day: 30, type: "gems",  amount: 100 }
  ],
  SHOP_PACKS: [
    { id: "gold_10",    label: "10 Altın",   price_try: 99.99,  reward: { gold: 10 } },
    { id: "gold_50",    label: "50 Altın",   price_try: 349.99, reward: { gold: 50 } },
    { id: "gold_100",   label: "100 Altın",  price_try: 699.99, reward: { gold: 100 } },
    { id: "gold_250",   label: "250 Altın",  price_try: 1299.99,reward: { gold: 250 } },
    { id: "gold_500",   label: "500 Altın",  price_try: 2499.99,reward: { gold: 500 } },
    { id: "gold_1000",  label: "1000 Altın", price_try: 4499.99,reward: { gold: 1000 } },
    { id: "weekly",     label: "Haftalık Teklif", price_try: 229.99,
      reward: { gold: 50, lives: 5, powerups: { rainbow: 1 } } },
    { id: "starter",    label: "Başlangıç Paketi", price_try: 449.99,
      reward: { gold: 50, gems: 10, powerups: { hammer: 2 } } },
    { id: "mega",       label: "Mega Paket",       price_try: 899.99,
      reward: { gold: 100, gems: 25, lives: 10, powerups: { bomb: 2, rainbow: 1 } } }
  ],
  ACHIEVEMENTS: [
    { id: "first_smash",   name: "İlk Vuruş",       desc: "İlk bölümü tamamla.",          gold: 50 },
    { id: "ten_levels",    name: "Acemi Çırak",     desc: "10 bölüm tamamla.",            gold: 200 },
    { id: "fifty_levels",  name: "Tatlıcı",         desc: "50 bölüm tamamla.",            gold: 500 },
    { id: "world_clear_1", name: "Krallık Fatihi",  desc: "1. dünyayı bitir.",            gold: 1000 },
    { id: "combo_master",  name: "Kombo Ustası",    desc: "8'li kombo yap.",              gold: 300 },
    { id: "smash_1000",    name: "Pasta Avcısı",    desc: "1000 pasta parçala.",          gold: 750 },
    { id: "daily_7",       name: "Sadık Oyuncu",    desc: "7 gün üst üste giriş.",        gold: 400 },
    { id: "wheel_lucky",   name: "Şanslı",          desc: "Çarkta 1000 altın kazan.",     gold: 0 },
    { id: "vip_member",    name: "VIP Tatlı",       desc: "VIP üye ol.",                  gold: 0 }
  ],
  MISSIONS: [
    { id: "play_3",      desc: "3 bölüm oyna",                target: 3,   reward: { gold: 100 } },
    { id: "win_5",       desc: "5 bölüm kazan",               target: 5,   reward: { gold: 200 } },
    { id: "smash_50",    desc: "50 pasta parçala",            target: 50,  reward: { gold: 150 } },
    { id: "combo_5",     desc: "5'li kombo yap",              target: 1,   reward: { gold: 120 } },
    { id: "use_powerup", desc: "Bir güçlendirici kullan",     target: 1,   reward: { gold: 80 } }
  ]
};

// ---------- İç yardımcılar ----------
function requireUser() {
  if (!Session.user) throw new Error("Önce giriş yapmalısın.");
  return Session.user.uid;
}
function clamp(n, a, b) { return Math.max(a, Math.min(b, n)); }

async function patch(path, obj) {
  const uid = requireUser();
  await FB.update(FB.ref(FB.db, FB.PATHS[path](uid)), obj);
}
async function readPath(path) {
  const uid = requireUser();
  const snap = await FB.get(FB.ref(FB.db, FB.PATHS[path](uid)));
  return snap.val() || {};
}

// ---------- Can / Enerji yenileme ----------
export async function regenerateLivesAndEnergy() {
  if (!Session.data) return;
  const e = { ...(Session.data.economy || {}) };
  const now = Date.now();
  const maxL = e.maxLives || 5;
  const maxE = e.maxEnergy || 30;
  let changed = false;

  if (e.lives < maxL) {
    const last = e.lastLifeAt || now;
    const passed = Math.floor((now - last) / CONFIG.LIFE_REGEN_MS);
    if (passed > 0) {
      e.lives = clamp((e.lives || 0) + passed, 0, maxL);
      e.lastLifeAt = last + passed * CONFIG.LIFE_REGEN_MS;
      changed = true;
    }
  } else {
    e.lastLifeAt = now;
    changed = true;
  }

  if (e.energy < maxE) {
    const last = e.lastEnergyAt || now;
    const passed = Math.floor((now - last) / CONFIG.ENERGY_REGEN_MS);
    if (passed > 0) {
      e.energy = clamp((e.energy || 0) + passed, 0, maxE);
      e.lastEnergyAt = last + passed * CONFIG.ENERGY_REGEN_MS;
      changed = true;
    }
  } else {
    e.lastEnergyAt = now;
    changed = true;
  }

  if (changed) await patch("economy", e);
  return e;
}

// Saniye cinsinden bir sonraki can geri sayımı
export function nextLifeCountdownMs() {
  const e = Session.data?.economy; if (!e) return 0;
  const maxL = e.maxLives || 5;
  if ((e.lives || 0) >= maxL) return 0;
  const last = e.lastLifeAt || Date.now();
  const delta = (last + CONFIG.LIFE_REGEN_MS) - Date.now();
  return Math.max(0, delta);
}

// ---------- Para işlemleri ----------
export async function addGold(amount, reason = "") {
  const e = Session.data?.economy || {};
  const next = (e.gold || 0) + Math.max(0, Math.floor(amount));
  await patch("economy", { gold: next });
  await logEvent("gold_added", { amount, reason });
}
export async function spendGold(amount, reason = "") {
  const e = Session.data?.economy || {};
  if ((e.gold || 0) < amount) throw new Error("Altının yetmiyor.");
  await patch("economy", { gold: (e.gold || 0) - Math.floor(amount) });
  await logEvent("gold_spent", { amount, reason });
}
export async function addGems(amount) {
  const e = Session.data?.economy || {};
  await patch("economy", { gems: (e.gems || 0) + Math.max(0, Math.floor(amount)) });
}
export async function addLives(amount) {
  const e = Session.data?.economy || {};
  const maxL = e.maxLives || 5;
  await patch("economy", { lives: clamp((e.lives || 0) + amount, 0, maxL) });
}
export async function consumeLife() {
  const e = Session.data?.economy || {};
  if ((e.lives || 0) <= 0) throw new Error("Canın bitti! Bekle ya da satın al.");
  await patch("economy", { lives: e.lives - 1, lastLifeAt: Date.now() });
}

// ---------- Envanter (güçlendiriciler) ----------
export async function addPowerup(item, amount = 1) {
  if (!CONFIG.POWERUPS[item]) throw new Error("Bilinmeyen güçlendirici: " + item);
  const inv = Session.data?.inventory || {};
  await patch("inventory", { [item]: (inv[item] || 0) + amount });
}
export async function buyPowerup(item) {
  const def = CONFIG.POWERUPS[item];
  if (!def) throw new Error("Geçersiz ürün.");
  await spendGold(def.price, "buy_" + item);
  await addPowerup(item, 1);
}
export async function usePowerup(item) {
  const inv = Session.data?.inventory || {};
  if ((inv[item] || 0) <= 0) throw new Error("Bu güçlendiriciden yok.");
  await patch("inventory", { [item]: inv[item] - 1 });
  await logEvent("powerup_used", { item });
}

// ---------- XP & Seviye ----------
export async function addXP(amount) {
  const p = Session.data?.profile || {};
  let xp = (p.xp || 0) + Math.max(0, Math.floor(amount));
  let level = p.level || 1;
  while (xp >= CONFIG.XP_PER_LEVEL) {
    xp -= CONFIG.XP_PER_LEVEL;
    level += 1;
    await addGold(50 + level * 10, "level_up");
  }
  await patch("profile", { xp, level });
}

// ---------- İlerleme (Bölüm tamamlama) ----------
export async function completeLevel({ world, level, score, stars, smashed, combo }) {
  const prog = Session.data?.progress || { world: 1, level: 1, stars: 0, totalScore: 0 };
  const updates = {
    totalScore: (prog.totalScore || 0) + (score || 0),
    cakesSmashed: (prog.cakesSmashed || 0) + (smashed || 0),
    bestCombo: Math.max(prog.bestCombo || 0, combo || 0)
  };
  // Bir sonraki bölüme aç
  const sameOrNext = (world > prog.world) || (world === prog.world && level >= prog.level);
  if (sameOrNext) {
    const w = CONFIG.WORLDS.find(w => w.id === world);
    const lastLevelOfWorld = w ? w.levels : 30;
    if (level >= lastLevelOfWorld) {
      updates.world = world + 1; updates.level = 1;
    } else {
      updates.world = world; updates.level = level + 1;
    }
  }
  // Yıldızları topla (basit)
  updates.stars = (prog.stars || 0) + Math.max(0, Math.min(3, stars || 0));
  await patch("progress", updates);
  await addXP(20 + (stars || 0) * 10);
  // Görevler
  await tickMission("win_5", 1);
  await tickMission("smash_50", smashed || 0);
  if ((combo || 0) >= 5) await tickMission("combo_5", 1);
  // Başarımlar
  await checkAchievements();
}

// ---------- Mini Pasta Smash mantığı (yardımcı saf fonksiyonlar) ----------
// ui-manager.js bunu çağırır. Şebeke (grid) üzerinde aynı renkli komşuları
// bulup parçalar. Bu modül DOM'a dokunmaz, sadece veri döndürür.
export const Board = {
  COLORS: ["#ff5fa2", "#ffb627", "#7c3aed", "#22d3ee", "#84cc16", "#f97316"],

  newBoard(rows = 8, cols = 8) {
    const grid = [];
    for (let r = 0; r < rows; r++) {
      const row = [];
      for (let c = 0; c < cols; c++) row.push(this.randomColor());
      grid.push(row);
    }
    return grid;
  },
  randomColor() {
    return this.COLORS[Math.floor(Math.random() * this.COLORS.length)];
  },
  // Aynı renkli bağlı bileşeni bul
  findGroup(grid, r, c) {
    const target = grid[r]?.[c]; if (!target) return [];
    const rows = grid.length, cols = grid[0].length;
    const seen = Array.from({ length: rows }, () => Array(cols).fill(false));
    const stack = [[r, c]]; const group = [];
    while (stack.length) {
      const [y, x] = stack.pop();
      if (y < 0 || y >= rows || x < 0 || x >= cols) continue;
      if (seen[y][x]) continue;
      if (grid[y][x] !== target) continue;
      seen[y][x] = true; group.push([y, x]);
      stack.push([y+1,x],[y-1,x],[y,x+1],[y,x-1]);
    }
    return group;
  },
  // Bir grubu parçala, üstten yer çek, boşlukları yeniden doldur
  smashGroup(grid, group) {
    if (group.length < 2) return { grid, score: 0, smashed: 0 };
    const cols = grid[0].length, rows = grid.length;
    const score = Math.round(Math.pow(group.length, 1.6)) * 10;
    const newGrid = grid.map(r => r.slice());
    for (const [y, x] of group) newGrid[y][x] = null;
    // Çek
    for (let x = 0; x < cols; x++) {
      const stack = [];
      for (let y = rows - 1; y >= 0; y--) if (newGrid[y][x]) stack.push(newGrid[y][x]);
      for (let y = rows - 1; y >= 0; y--) newGrid[y][x] = stack.shift() || this.randomColor();
    }
    return { grid: newGrid, score, smashed: group.length };
  }
};

// ---------- Günlük Ödüller ----------
export async function claimDailyReward() {
  const eco = Session.data?.economy || {};
  const daily = Session.data?.daily || { claimedDays: {} };
  const now = Date.now();
  const last = eco.lastDailyClaimAt || 0;
  // 20 saatten kısa süre olduysa hala bekleme süresi var
  if (now - last < 20 * 60 * 60 * 1000) {
    throw new Error("Bir sonraki günlük ödül için bekle.");
  }
  // Streak hesabı: son hak ediş 48 saatten yeniyse devam, değilse 1'den başla
  let streakDay = (now - last < 48 * 60 * 60 * 1000) ? Math.min(CONFIG.MAX_DAILY_STREAK, (eco.streakDay || 0) + 1) : 1;
  const reward = CONFIG.DAILY_REWARDS[streakDay - 1] || CONFIG.DAILY_REWARDS[0];
  await applyReward(reward);
  await patch("economy", { lastDailyClaimAt: now, streakDay });
  const claimed = { ...(daily.claimedDays || {}) }; claimed[streakDay] = now;
  await patch("daily", { claimedDays: claimed });
  return { day: streakDay, reward };
}

// ---------- Çark ----------
export function pickWheelReward() {
  const total = CONFIG.WHEEL_REWARDS.reduce((s, r) => s + r.weight, 0);
  let n = Math.random() * total;
  for (const r of CONFIG.WHEEL_REWARDS) { n -= r.weight; if (n <= 0) return r; }
  return CONFIG.WHEEL_REWARDS[0];
}
export async function spinWheel() {
  const w = Session.data?.wheel || { totalSpins: 0 };
  const eco = Session.data?.economy || {};
  const now = Date.now();
  if ((eco.wheelSpinAt || 0) + CONFIG.WHEEL_COOLDOWN_MS > now) {
    throw new Error("Çarkı çevirmek için bekle.");
  }
  const reward = pickWheelReward();
  await applyReward(reward);
  await patch("economy", { wheelSpinAt: now });
  await patch("wheel", { totalSpins: (w.totalSpins || 0) + 1, lastReward: reward });
  return reward;
}

// ---------- Mağaza ----------
export async function buyShopPack(packId) {
  const pack = CONFIG.SHOP_PACKS.find(p => p.id === packId);
  if (!pack) throw new Error("Paket bulunamadı.");
  // Bu örnekte gerçek ödeme yok; ödülü doğrudan ver (UI uyarı verir).
  if (pack.reward.gold)  await addGold(pack.reward.gold, "shop");
  if (pack.reward.gems)  await addGems(pack.reward.gems);
  if (pack.reward.lives) await addLives(pack.reward.lives);
  if (pack.reward.powerups) {
    for (const [k, v] of Object.entries(pack.reward.powerups)) await addPowerup(k, v);
  }
  return pack;
}

// ---------- Ödülleri uygula (genel) ----------
export async function applyReward(r) {
  if (!r) return;
  if (r.type === "gold")    await addGold(r.amount || 0, "reward");
  if (r.type === "gems")    await addGems(r.amount || 0);
  if (r.type === "lives")   await addLives(r.amount || 0);
  if (r.type === "powerup") await addPowerup(r.item, r.amount || 1);
}

// ---------- Görevler ----------
export async function tickMission(id, amount = 1) {
  const m = Session.data?.missions || {};
  const cur = m[id] || { progress: 0, claimed: false };
  const def = CONFIG.MISSIONS.find(x => x.id === id);
  if (!def) return;
  cur.progress = Math.min(def.target, (cur.progress || 0) + amount);
  m[id] = cur;
  await patch("user", { missions: m });
}
export async function claimMission(id) {
  const m = Session.data?.missions || {};
  const cur = m[id]; const def = CONFIG.MISSIONS.find(x => x.id === id);
  if (!def || !cur || cur.progress < def.target) throw new Error("Görev henüz tamam değil.");
  if (cur.claimed) throw new Error("Bu görev zaten alındı.");
  if (def.reward.gold) await addGold(def.reward.gold, "mission_" + id);
  cur.claimed = true; m[id] = cur;
  await patch("user", { missions: m });
}

// ---------- Başarımlar ----------
export async function checkAchievements() {
  const a = Session.data?.achievements || {};
  const prog = Session.data?.progress || {};
  const eco = Session.data?.economy || {};
  const profile = Session.data?.profile || {};
  const giveIf = async (id, cond) => {
    if (cond && !a[id]) {
      a[id] = { unlockedAt: Date.now() };
      const def = CONFIG.ACHIEVEMENTS.find(x => x.id === id);
      if (def?.gold) await addGold(def.gold, "ach_" + id);
    }
  };
  await giveIf("first_smash",  (prog.totalScore || 0) > 0 || (prog.level || 1) > 1);
  await giveIf("ten_levels",   ((prog.world - 1) * 30 + (prog.level - 1)) >= 10);
  await giveIf("fifty_levels", ((prog.world - 1) * 30 + (prog.level - 1)) >= 50);
  await giveIf("world_clear_1", (prog.world || 1) >= 2);
  await giveIf("combo_master",  (prog.bestCombo || 0) >= 8);
  await giveIf("smash_1000",    (prog.cakesSmashed || 0) >= 1000);
  await giveIf("daily_7",       (eco.streakDay || 0) >= 7);
  await giveIf("vip_member",    !!profile.vip);
  await patch("achievements", a);
}

// ---------- Liderlik tablosu ----------
export async function submitScore(score) {
  const uid = requireUser();
  const profile = Session.data?.profile || {};
  await FB.set(FB.ref(FB.db, `${FB.PATHS.leaderboard()}/${uid}`), {
    nick: profile.displayName || "Oyuncu",
    avatar: profile.avatar || "default",
    country: profile.country || "TR",
    score,
    updatedAt: Date.now()
  });
}
export async function getTopLeaderboard(limit = 25) {
  const q = FB.query(FB.ref(FB.db, FB.PATHS.leaderboard()), FB.orderByChild("score"), FB.limitToLast(limit));
  const snap = await FB.get(q);
  const arr = [];
  snap.forEach(c => arr.push({ uid: c.key, ...c.val() }));
  return arr.sort((a,b) => (b.score||0) - (a.score||0));
}

// ---------- Posta kutusu ----------
export async function sendMail(toUid, subject, body, reward = null) {
  const node = FB.push(FB.ref(FB.db, FB.PATHS.mailbox(toUid)));
  await FB.set(node, { subject, body, reward, fromUid: Session.user?.uid || null, createdAt: Date.now(), read: false, claimed: false });
}
export async function claimMail(mailId) {
  const uid = requireUser();
  const r = FB.ref(FB.db, `${FB.PATHS.mailbox(uid)}/${mailId}`);
  const snap = await FB.get(r);
  if (!snap.exists()) throw new Error("Posta yok.");
  const m = snap.val();
  if (m.claimed) throw new Error("Zaten alındı.");
  if (m.reward) await applyReward(m.reward);
  await FB.update(r, { claimed: true, read: true });
}

// ---------- Ayarlar ----------
export async function saveSettings(partial) {
  const s = Session.data?.settings || {};
  await patch("settings", { ...s, ...partial });
}

// ---------- Hediye kodu (placeholder; ileride aktifleşecek) ----------
export async function redeemGiftCode(code) {
  if (!code || code.length < 4) throw new Error("Kod geçersiz.");
  // Gelecekte sunucu tarafında doğrulanacak; şimdilik basit ödüller:
  const map = {
    "SERKAN":   { gold: 500, gems: 5,  lives: 5 },
    "WELCOME":  { gold: 200, lives: 3 },
    "CAKEPARTY":{ gold: 1000, gems: 10 }
  };
  const reward = map[code.toUpperCase()];
  if (!reward) throw new Error("Bu kod tanınmıyor.");
  if (reward.gold) await addGold(reward.gold, "gift_" + code);
  if (reward.gems) await addGems(reward.gems);
  if (reward.lives) await addLives(reward.lives);
  return reward;
}

// ---------- Etkinlik / olay log (analitik amaçlı) ----------
export async function logEvent(name, payload = {}) {
  try {
    const uid = Session.user?.uid || "anon";
    const node = FB.push(FB.ref(FB.db, `events/log/${uid}`));
    await FB.set(node, { name, payload, t: Date.now() });
  } catch (_) { /* sessiz geç */ }
}

// Tarayıcıdan kolay erişim
if (typeof window !== "undefined") {
  window.Eco = {
    CONFIG, addGold, spendGold, addGems, addLives, consumeLife,
    addPowerup, buyPowerup, usePowerup, addXP, completeLevel,
    Board, claimDailyReward, spinWheel, buyShopPack, applyReward,
    tickMission, claimMission, checkAchievements, submitScore, getTopLeaderboard,
    sendMail, claimMail, saveSettings, redeemGiftCode, regenerateLivesAndEnergy, nextLifeCountdownMs
  };
}
