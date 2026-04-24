import { db, currentUser, userData, ref, update, get, runTransaction, push } from './firebase-init.js';

function xpForLevel(lvl) { return Math.floor(100 * Math.pow(lvl, 1.6)); }

window.addXP = async (amount) => {
  if (!currentUser) return;
  const userRef = ref(db, 'users/' + currentUser.uid);
  await runTransaction(userRef, (data) => {
    if (data) {
      data.xp = (data.xp || 0) + amount;
      while (data.xp >= xpForLevel(data.level)) {
        data.xp -= xpForLevel(data.level);
        data.level = (data.level || 1) + 1;
        data.gems = (data.gems || 0) + 3;
        document.dispatchEvent(new CustomEvent('levelUp', { detail: { level: data.level } }));
      }
      return data;
    }
  });
};

window.addCoins = async (amount) => {
  if (!currentUser) return;
  await runTransaction(ref(db, 'users/' + currentUser.uid), (data) => {
    if (data) { data.coins = Math.max(0, (data.coins || 0) + amount); return data; }
  });
};

window.addGems = async (amount) => {
  if (!currentUser) return;
  await runTransaction(ref(db, 'users/' + currentUser.uid), (data) => {
    if (data) { data.gems = Math.max(0, (data.gems || 0) + amount); return data; }
  });
};

window.addBooster = async (type, count) => {
  if (!currentUser) return;
  await runTransaction(ref(db, 'users/' + currentUser.uid + '/boosters'), (data) => {
    if (data) { data[type] = (data[type] || 0) + count; return data; }
  });
};

window.useBooster = async (type) => {
  if (!currentUser || !userData) return false;
  if ((userData.boosters?.[type] || 0) <= 0) { alert('Yetersiz güçlendirici!'); return false; }
  await addBooster(type, -1);
  return true;
};

window.claimDailyGift = async () => {
  if (!currentUser) return;
  await addCoins(300);
  await addGems(2);
  alert('Günlük hediye: +300 Altın +2 Elmas! 🎁');
};

window.buyVIP = async (days = 30) => {
  if (!currentUser || !userData) return;
  if (userData.gems < 100) return alert('Yetersiz elmas! 100 💎 gerek.');
  await addGems(-100);
  const expiry = Date.now() + days * 86400000;
  await update(ref(db, 'users/' + currentUser.uid), { vip: true, vipExpiry: expiry });
  alert('VIP aktif!');
};

window.buyCoinPack = async (coins, costGems) => {
  if (!currentUser || userData.gems < costGems) return alert('Yetersiz elmas!');
  await addGems(-costGems);
  await addCoins(coins);
  alert(`${coins} Altın satın alındı!`);
};

window.updateHighScore = async (score) => {
  if (!currentUser) return;
  await runTransaction(ref(db, 'users/' + currentUser.uid), (data) => {
    if (data && score > (data.highScore || 0)) { data.highScore = score; }
    return data;
  });
};

window.getLeaderboard = async () => {
  const snap = await get(ref(db, 'users'));
  if (!snap.exists()) return [];
  return Object.values(snap.val()).filter(u => u.highScore).sort((a,b) => b.highScore - a.highScore).slice(0, 20);
};

// Can sistemi
window.refillLives = async () => {
  if (!currentUser || !userData) return;
  const now = Date.now();
  const elapsed = now - (userData.lastLifeRefill || now);
  const refillCount = Math.floor(elapsed / (30 * 60 * 1000));
  if (refillCount > 0 && userData.lives < 5) {
    const newLives = Math.min(5, userData.lives + refillCount);
    await update(ref(db, 'users/' + currentUser.uid), { lives: newLives, lastLifeRefill: now });
  }
};
window.consumeLife = async () => {
  if (!currentUser || !userData) return false;
  await window.refillLives();
  if (userData.lives <= 0) { alert('Canın kalmadı! Bekleyin veya satın alın.'); return false; }
  await runTransaction(ref(db, 'users/' + currentUser.uid), (data) => {
    if (data && data.lives > 0) { data.lives--; return data; }
  });
  return true;
};
