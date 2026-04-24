import { currentUser, userData } from './firebase-init.js';
import { addXP, addCoins, incrementCakesSmashed, updateHighScore, getLeaderboard, claimDailyGift, buyVIP } from './ekonomi.js';

// Ekran geçişleri
window.showScreen = (id) => {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
};

// Bölüm/Seviye seçme
window.showLevelSelect = () => {
  const container = document.getElementById('levelSelectContainer');
  container.innerHTML = '';
  const chapters = ['chapter1', 'chapter2', 'chapter3'];
  chapters.forEach(ch => {
    const unlocked = userData?.unlockedLevels?.[ch] || 1;
    const btn = document.createElement('button');
    btn.textContent = `${ch} (${unlocked} seviye)`;
    btn.onclick = () => startGame(ch, 1);
    container.appendChild(btn);
  });
  showScreen('levelSelectScreen');
};

// OYUN MOTORU (CakeSmash)
const Game = {
  score: 0,
  comboCnt: 1,
  lastHit: 0,
  timeLeft: 30,
  timer: null,
  cakeHP: 5,
  currentCake: 0,
  comboText: '',
  init() {
    this.score = 0;
    this.comboCnt = 1;
    this.timeLeft = 30;
    this.cakeHP = 5;
    this.spawnCake();
    this.updateDisplay();
    this.startTimer();
  },
  spawnCake() {
    const area = document.getElementById('gameArea');
    area.innerHTML = '';
    const cake = document.createElement('div');
    cake.className = 'cake';
    cake.style.background = `radial-gradient(circle, #${Math.floor(Math.random()*16777215).toString(16)} 30%, #f9ca24)`;
    cake.style.width = '120px';
    cake.style.height = '120px';
    cake.style.borderRadius = '50%';
    cake.style.cursor = 'pointer';
    cake.style.boxShadow = '0 0 25px gold';
    cake.addEventListener('click', (e) => this.hitCake(e));
    area.appendChild(cake);
  },
  hitCake(e) {
    const now = Date.now();
    if (now - this.lastHit < 600) {
      this.comboCnt++;
    } else {
      this.comboCnt = 1;
    }
    this.lastHit = now;
    this.score += 10 * this.comboCnt;
    this.cakeHP--;
    incrementCakesSmashed();
    // Efekt
    const cake = e.target;
    cake.style.transform = 'scale(0.8)';
    setTimeout(() => { if(cake) cake.style.transform = 'scale(1)'; }, 100);
    this.showCombo();
    if (this.cakeHP <= 0) {
      this.cakeHP = 5 + Math.floor(Math.random() * 5);
      this.spawnCake();
    }
    this.updateDisplay();
  },
  showCombo() {
    const comboEl = document.getElementById('comboPop');
    comboEl.textContent = `🔥 x${this.comboCnt}`;
    comboEl.style.opacity = 1;
    comboEl.style.transform = 'translate(-50%, -80px)';
    setTimeout(() => {
      comboEl.style.opacity = 0;
      comboEl.style.transform = 'translate(-50%, -120px)';
    }, 300);
  },
  updateDisplay() {
    document.getElementById('scoreDisplay').textContent = `Skor: ${this.score}`;
    document.getElementById('timerDisplay').textContent = `⏱️ ${this.timeLeft}s`;
  },
  startTimer() {
    this.timer = setInterval(() => {
      this.timeLeft--;
      this.updateDisplay();
      if (this.timeLeft <= 0) {
        clearInterval(this.timer);
        this.endGame();
      }
    }, 1000);
  },
  async endGame() {
    clearInterval(this.timer);
    await addXP(this.score);
    await addCoins(Math.floor(this.score / 2));
    await updateHighScore(this.score);
    alert(`Oyun bitti! Skor: ${this.score} 🎉\n+${this.score} XP, +${Math.floor(this.score/2)} Altın`);
    showScreen('mainMenu');
  }
};

window.startGame = (chapter, level) => {
  showScreen('gameScreen');
  Game.init();
};

// Olaylar
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
    ol.innerHTML = list.map((u,i) => `<li>${i+1}. ${u.username} - ${u.highScore} puan</li>`).join('');
    showScreen('leaderboardScreen');
  });
});

function renderProfile() {
  if (!userData) return;
  document.getElementById('profileName').textContent = userData.username;
  document.getElementById('profileLevel').textContent = userData.level;
  document.getElementById('profileXP').textContent = userData.xp;
  document.getElementById('profileCoins').textContent = userData.coins;
  document.getElementById('profileGems').textContent = userData.gems;
  document.getElementById('profileVIP').textContent = userData.vip ? 'Aktif' : 'Pasif';
}

document.addEventListener('authStateChanged', (e) => {
  if (e.detail.loggedIn) showScreen('mainMenu');
  else showScreen('authScreen');
});

document.getElementById('endGameBtn')?.addEventListener('click', () => Game.endGame());
