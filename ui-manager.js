// Arayüz yönetimi ve oyun ekranları
import { currentUser, userData } from './firebase-init.js';
import { addXP, addCoins, incrementCakesSmashed, updateHighScore, getLeaderboard } from './ekonomi.js';

// Ekran göster/gizle
window.showScreen = (screenId) => {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  const target = document.getElementById(screenId);
  if (target) target.classList.add('active');
};

// Oyun seçim (bölüm/seviye)
window.showLevelSelect = () => {
  const container = document.getElementById('levelSelectContainer');
  if (!container) return;
  container.innerHTML = '';
  const chapters = ['chapter1', 'chapter2', 'chapter3'];
  chapters.forEach(ch => {
    const unlocked = userData?.unlockedLevels?.[ch] || 0;
    const btn = document.createElement('button');
    btn.textContent = `${ch} (${unlocked} seviye açık)`;
    btn.onclick = () => startGame(ch, 1);
    container.appendChild(btn);
  });
  showScreen('levelSelectScreen');
};

// Oyunu başlat
window.startGame = (chapter, level) => {
  showScreen('gameScreen');
  // Basit Cake Smash oyunu başlat
  if (window.gameLoop) cancelAnimationFrame(window.gameLoop);
  CakeSmashGame.init(chapter, level);
};

// CakeSmash oyun motoru (temel)
const CakeSmashGame = {
  score: 0,
  clicks: 0,
  combo: 0,
  lastClickTime: 0,
  init(chapter, level) {
    this.score = 0;
    this.clicks = 0;
    this.combo = 0;
    this.updateUI();
    // Canvas veya DOM tabanlı pasta
    const area = document.getElementById('gameArea');
    if (area) {
      area.innerHTML = '<div id="cake" style="width:150px;height:150px;background:pink;border-radius:50%;margin:auto;cursor:pointer;"></div>';
      document.getElementById('cake').addEventListener('click', () => this.smashCake());
    }
    this.gameTimer = setTimeout(() => this.endGame(), 30000); // 30 saniye
  },
  smashCake() {
    const now = Date.now();
    if (now - this.lastClickTime < 500) {
      this.combo++;
    } else {
      this.combo = 1;
    }
    this.lastClickTime = now;
    this.clicks++;
    this.score += 10 * this.combo;
    incrementCakesSmashed();
    this.updateUI();
    // Animasyon
    const cake = document.getElementById('cake');
    if (cake) {
      cake.style.transform = 'scale(0.9)';
      setTimeout(() => cake.style.transform = 'scale(1)', 100);
    }
  },
  updateUI() {
    document.getElementById('scoreDisplay').textContent = `Skor: ${this.score}`;
    document.getElementById('comboDisplay').textContent = `Combo: x${this.combo}`;
  },
  async endGame() {
    clearTimeout(this.gameTimer);
    await addXP(this.score);
    await addCoins(Math.floor(this.score / 2));
    await updateHighScore(this.score);
    alert(`Oyun bitti! Skor: ${this.score}`);
    showScreen('mainMenu');
  }
};

// Menü olayları
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('playBtn')?.addEventListener('click', () => showLevelSelect());
  document.getElementById('profileBtn')?.addEventListener('click', () => {
    renderProfile();
    showScreen('profileScreen');
  });
  document.getElementById('aboutBtn')?.addEventListener('click', () => showScreen('aboutScreen'));
  document.getElementById('howToPlayBtn')?.addEventListener('click', () => showScreen('howToPlayScreen'));
  document.getElementById('leaderboardBtn')?.addEventListener('click', async () => {
    const list = await getLeaderboard();
    const ol = document.getElementById('leaderboardList');
    ol.innerHTML = list.map((u,i) => `<li>${i+1}. ${u.username} - ${u.highScore}</li>`).join('');
    showScreen('leaderboardScreen');
  });
});

// Profil render
function renderProfile() {
  if (!userData) return;
  document.getElementById('profileName').textContent = userData.username;
  document.getElementById('profileLevel').textContent = userData.level;
  document.getElementById('profileXP').textContent = userData.xp;
  document.getElementById('profileCoins').textContent = userData.coins;
  document.getElementById('profileGems').textContent = userData.gems;
  document.getElementById('profileVIP').textContent = userData.vip ? 'Aktif' : 'Pasif';
}

// Oturum durumu değiştiğinde
document.addEventListener('authStateChanged', (e) => {
  if (e.detail.loggedIn) {
    showScreen('mainMenu');
  } else {
    showScreen('authScreen');
  }
});
