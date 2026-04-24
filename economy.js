// Ekonomi ve seviye sistemi
import { getDatabase, ref, update, get, set, push, runTransaction } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";
import { currentUser, userData } from './firebase-init.js';

const db = getDatabase();

// Seviye atlama için gerekli XP eşikleri (her seviye için)
function xpForLevel(level) {
  return Math.floor(100 * Math.pow(level, 1.8));
}

// Kullanıcıya XP ekle
window.addXP = async (amount) => {
  if (!currentUser) return;
  const userRef = ref(db, 'users/' + currentUser.uid);
  await runTransaction(userRef, (data) => {
    if (data) {
      data.xp = (data.xp || 0) + amount;
      // Seviye atlama kontrolü
      while (data.xp >= xpForLevel(data.level)) {
        data.xp -= xpForLevel(data.level);
        data.level += 1;
        data.gems = (data.gems || 0) + 5; // seviye atlayınca hediye elmas
        // Seviye atlama bildirimi
        document.dispatchEvent(new CustomEvent('levelUp', { detail: { level: data.level } }));
      }
      return data;
    }
  });
};

// Para ekle/çıkar
window.addCoins = async (amount) => {
  if (!currentUser) return;
  const userRef = ref(db, 'users/' + currentUser.uid);
  await runTransaction(userRef, (data) => {
    if (data) {
      data.coins = Math.max(0, (data.coins || 0) + amount);
      return data;
    }
  });
};

// Elmas ekle/çıkar
window.addGems = async (amount) => {
  if (!currentUser) return;
  const userRef = ref(db, 'users/' + currentUser.uid);
  await runTransaction(userRef, (data) => {
    if (data) {
      data.gems = Math.max(0, (data.gems || 0) + amount);
      return data;
    }
  });
};

// Bölüm/bölüm ilerlemesi - yeni seviye aç
window.unlockLevel = async (chapter, level) => {
  if (!currentUser) return;
  const path = `users/${currentUser.uid}/unlockedLevels/${chapter}`;
  await update(ref(db), { [path]: level });
};

// VIP satın al (placeholder)
window.buyVIP = async (durationDays = 30) => {
  if (!currentUser) return;
  // Burada gerçek ödeme sistemi entegre edilecek, şimdilik elmas ile al
  if (userData.gems < 100) {
    alert('Yetersiz elmas! VIP için 100 elmas gerekli.');
    return;
  }
  await addGems(-100);
  const expiry = Date.now() + durationDays * 86400000;
  await update(ref(db, 'users/' + currentUser.uid), { vip: true, vipExpiry: expiry });
  alert('VIP üyeliğiniz aktif!');
};

// Hediye sistemi temel fonksiyon (yer tutucu)
window.claimDailyGift = async () => {
  if (!currentUser) return;
  const gift = { type: 'coins', amount: 200, date: Date.now() };
  await push(ref(db, 'users/' + currentUser.uid + '/gifts'), gift);
  await addCoins(200);
  alert('Günlük hediyeniz: 200 altın!');
};

// Toplam pasta kırma sayacı
window.incrementCakesSmashed = async () => {
  if (!currentUser) return;
  const userRef = ref(db, 'users/' + currentUser.uid);
  await runTransaction(userRef, (data) => {
    if (data) {
      data.totalCakesSmashed = (data.totalCakesSmashed || 0) + 1;
      return data;
    }
  });
};

// Yüksek skoru güncelle
window.updateHighScore = async (score) => {
  if (!currentUser) return;
  const userRef = ref(db, 'users/' + currentUser.uid);
  await runTransaction(userRef, (data) => {
    if (data && score > (data.highScore || 0)) {
      data.highScore = score;
    }
    return data;
  });
};

// Lider tablosu verisi çek (ilk 10)
window.getLeaderboard = async () => {
  const snapshot = await get(ref(db, 'users'));
  if (!snapshot.exists()) return [];
  const users = snapshot.val();
  const list = Object.values(users)
    .filter(u => u.highScore)
    .sort((a, b) => b.highScore - a.highScore)
    .slice(0, 10);
  return list;
};
