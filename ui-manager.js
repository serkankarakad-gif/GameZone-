import { currentUser, userData } from './firebase-init.js';

window.showScreen = (id) => {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
};

// Oyun Motoru
const Game = {
  score: 0, combo: 1, lastHit: 0, timeLeft: 30, timer: null,
  init() {
    this.score = 0; this.combo = 1; this.timeLeft = 30;
    this.spawnCake(); this.updateUI();
    this.timer = setInterval(() => { this.timeLeft--; this.updateUI(); if (this.timeLeft <= 0) this.endGame(); }, 1000);
  },
  spawnCake() {
    const area = document.getElementById('gameArea');
    area.innerHTML = '<div id="comboPop"></div>';
    const cake = document.createElement('div');
    cake.className = 'cake'; cake.addEventListener('click', (e) => this.hitCake(e));
    area.appendChild(cake);
  },
  hitCake(e) {
    const now = Date.now();
    if (now - this.lastHit < 500) this.combo++; else this.combo = 1;
    this.lastHit = now;
    this.score += 10 * this.combo;
    e.target.style.transform = 'scale(0.8)'; setTimeout(() => { if(e.target) e.target.style.transform = 'scale(1)'; }, 100);
    const pop = document.getElementById('comboPop');
    if (pop) { pop.textContent = `🔥 x${this.combo}`; pop.classList.add('pop'); setTimeout(() => pop.classList.remove('pop'), 300); }
    this.updateUI();
  },
  updateUI() {
    document.getElementById('scoreDisplay').textContent = `Skor: ${this.score}`;
    document.getElementById('timerDisplay').textContent = `⏱️ ${this.timeLeft}s`;
  },
  async endGame() {
    clearInterval(this.timer);
    await window.addXP(this.score);
    await window.addCoins(Math.floor(this.score / 2));
    await window.updateHighScore(this.score);
    alert(`Oyun bitti! Skor: ${this.score}\n+${this.score} XP, +${Math.floor(this.score/2)} Altın`);
    window.showScreen('mainMenu');
  }
};

window.startGame = async () => {
  await window.refillLives();
  const canPlay = await window.consumeLife();
  if (!canPlay) return;
  window.showScreen('gameScreen');
  Game.init();
};

window.purchaseLives = async () => { await window.addGems(-4); await window.update(ref(db, 'users/'+currentUser.uid), { lives: 5 }); alert('Canlar dolduruldu!'); };

// Olay dinleyiciler
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('playBtn')?.addEventListener('click', window.startGame);
  document.getElementById('shopBtn')?.addEventListener('click', () => window.showScreen('shopScreen'));
  document.getElementById('friendsBtn')?.addEventListener('click', () => window.showScreen('friendsScreen'));
  document.getElementById('collectionBtn')?.addEventListener('click', () => window.showScreen('collectionScreen'));
  document.getElementById('settingsBtn')?.addEventListener('click', () => {
    window.renderSettings(); window.showScreen('settingsScreen');
  });
  document.getElementById('popupTermsAccept')?.addEventListener('click', () => {
    window.showScreen('authScreen');
  });
});

window.renderSettings = () => {
  const s = userData?.settings || {};
  document.getElementById('musicToggle').checked = s.music !== false;
  document.getElementById('sfxToggle').checked = s.sfx !== false;
};

document.addEventListener('authStateChanged', (e) => {
  if (e.detail.loggedIn) {
    // Kullanım şartları kabul edilmemişse göster
    if (!userData?.termsAccepted) window.showScreen('termsScreen');
    else window.showScreen('mainMenu');
  } else window.showScreen('authScreen');
});
