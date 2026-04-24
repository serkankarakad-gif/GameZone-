import { db, currentUser, userData, ref, update, get, runTransaction, push } from './firebase-init.js';

function xpForLevel(level) {
  return Math.floor(100 * Math.pow(level, 1.8));
}

window.addXP = async (amount) => {
  if (!currentUser) return;
  const userRef = ref(db, 'users/' + currentUser.uid);
  await runTransaction(userRef, (data) => {
    if (data) {
      data.xp = (data.xp || 0) + amount;
      while (data.xp >= xpForLevel(data.level)) {
        data.xp -= xpForLevel(data.level);
        data.level = (data.level || 1) + 1;
        data.gems = (data.gems || 0) + 5;
        document.dispatchEvent(new CustomEvent('levelUp', { detail: { level: data.level } }));
      }
      return data;
    }
  });
};

window.addCoins = async (amount) => {
  if (!currentUser) return;
  const userRef = ref(db, 'users/' + currentUser.uid);
  await runTransaction(userRef, (data) => {
    if (data) { data.coins = Math.max(0, (data.coins || 0) + amount); return data; }
  });
};

window.addGems = async (amount) => {
  if (!currentUser) return;
  const userRef = ref(db, 'users/' + currentUser.uid);
  await runTransaction(userRef, (data) => {
    if (data) { data.gems = Math.max(0, (data.gems || 0) + amount); return data; }
  });
};

window.unlockLevel = async (chapter, level) => {
  if (!currentUser) return;
  await update(ref(db, `users/${currentUser.uid}/unlockedLevels`), { [chapter]: level });
};

window.buyVIP = async (days = 30) => {
  if (!currentUser || !userData) return;
  if (userData.gems < 100) return alert('Yetersiz elmas! VIP için 100 💎 gerek.');
  await addGems(-100);
  const expiry = Date.now() + days * 86400000;
  await update(ref(db, 'users/' + currentUser.uid), { vip: true, vipExpiry: expiry });
  alert('VIP üyeliğin aktif! 🎉');
};

window.claimDailyGift = async () => {
  if (!currentUser) return;
  const gift = { type: 'coins', amount: 300, date: Date.now() };
  await push(ref(db, `users/${currentUser.uid}/gifts`), gift);
  await addCoins(300);
  alert('Günlük hediye: 300 altın! 🪙');
};

window.incrementCakesSmashed = async () => {
  if (!currentUser) return;
  const userRef = ref(db, 'users/' + currentUser.uid);
  await runTransaction(userRef, (data) => {
    if (data) { data.totalCakesSmashed = (data.totalCakesSmashed || 0) + 1; return data; }
  });
};

window.updateHighScore = async (score) => {
  if (!currentUser) return;
  const userRef = ref(db, 'users/' + currentUser.uid);
  await runTransaction(userRef, (data) => {
    if (data && score > (data.highScore || 0)) { data.highScore = score; }
    return data;
  });
};

window.getLeaderboard = async () => {
  const snap = await get(ref(db, 'users'));
  if (!snap.exists()) return [];
  return Object.values(snap.val())
    .filter(u => u.highScore)
    .sort((a,b) => b.highScore - a.highScore)
    .slice(0, 10);
};
