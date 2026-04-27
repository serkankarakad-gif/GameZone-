/* ==========================================================================
   mini-oyunlar-2.js — Beceri (15) + Zeka (10) Oyunları
   ─────────────────────────────────────────────────────────────────────────
   Bu dosya mini-oyunlar.js'in HANDLERS objesine 25 oyun ekler.
   Beceri/zeka oyunları skor-bazlı (bahis yok), settleSkill ile ödüllenir.
   ========================================================================== */

(function () {
  if (!window._GAME_HANDLERS) { console.warn('mini-oyunlar.js önce yüklenmeli'); return; }

  const H = window._GAME_HANDLERS;
  const settle = window._settle;
  const settleSkill = window._settleSkill;
  const canPlay = window._canPlay;
  const takeBet = window._takeBet;
  const bonus = window._bonus;
  const getBet = window._getBet;
  const betBar = window._betBar;

  const $r = () => document.getElementById('mgArea');

/* ══════════════════ 26. REAKSİYON HIZI ══════════════════ */
H['reaksiyon'] = g => {
  $r().innerHTML = `<p class="small muted mb-8">Yeşil olunca tıkla. <250ms = mükemmel · 250-400ms = iyi · 400ms+ = yavaş</p>
    <div id="rxBox" class="rx-box red" onclick="rxClick()">Bekle...</div>
    <p class="tac small muted" id="rxInfo">5 tur · ortalama hesaplanır</p>
    <div id="mgResult" class="mg-result"></div>`;
  rxStart();
};
let rxState = null;
function rxStart() {
  rxState = { round: 0, times: [], waiting: false, startTs: 0 };
  rxNext();
}
function rxNext() {
  if (rxState.round >= 5) return rxFinish();
  const box = document.getElementById('rxBox');
  if (!box) return;
  box.className = 'rx-box red';
  box.textContent = `Tur ${rxState.round+1}/5 · Bekle...`;
  rxState.waiting = false;
  const wait = 800 + Math.random() * 2500;
  rxState.timer = setTimeout(() => {
    if (!box) return;
    box.className = 'rx-box green';
    box.textContent = 'TIKLA!';
    rxState.startTs = Date.now();
    rxState.waiting = true;
  }, wait);
}
window.rxClick = () => {
  if (!rxState) return;
  if (!rxState.waiting) {
    clearTimeout(rxState.timer);
    toast('Erken tıkladın! Tur baştan.', 'warn');
    rxNext();
    return;
  }
  const dt = Date.now() - rxState.startTs;
  rxState.times.push(dt);
  rxState.round++;
  document.getElementById('rxBox').textContent = dt + ' ms';
  setTimeout(rxNext, 600);
};
async function rxFinish() {
  const avg = Math.round(rxState.times.reduce((a,b)=>a+b,0) / 5);
  // Skor: 1000 - avg (düşük = iyi)
  const score = Math.max(0, Math.round((1000 - avg) / 10)); // 0-100
  const r = await settleSkill('reaksiyon', score, 50, 200);
  document.getElementById('mgResult').innerHTML = `<div class="${r.won?'mg-win':'mg-loss'}">
    Ortalama: <b>${avg}ms</b> · Skor: ${score}<br>${r.payout > 0 ? '+'+cashFmt(r.payout) : 'kazanç yok'}</div>`;
}

/* ══════════════════ 27. HIZLI TIKLA (5sn) — v2 BUG FIX ══════════════════
   ┌─────────────────────────────────────────────────────────────────────┐
   │  DÜZELTİLEN BUG'LAR:                                                 │
   │  1. Süre bittikten sonra tıklamanın hâlâ sayılması → STATE.done      │
   │     kontrolü hem başlangıçta hem her tıklamada                       │
   │  2. Çift settleSkill çağrılma riski → settled flag                    │
   │  3. Bot/auto-clicker tespiti → CPS hesaplaması, 15+ ise kırpılır    │
   │  4. Mobile çift sayma (mousedown + touchstart) → tek event türü      │
   │  5. Süre bittikten sonra butonu disable et                           │
   │  6. Buton tekrar tıklanırsa eski state'i temizle                    │
   └─────────────────────────────────────────────────────────────────────┘ */
H['tap_fast'] = g => {
  $r().innerHTML = `<p class="small muted mb-8">5 saniyede ne kadar çok tıklayabilirsin? <b>30+ tıklama = ödül</b><br>
    <small style="color:#dc2626">⚠️ Otomatik tıklama (15 tps üstü) tespit edilirse kazanç iptal olur</small></p>
    <div class="tap-display" id="tapDisp">
      <div class="tap-counter" id="tapCount">0</div>
      <div class="tap-time" id="tapTime">5.0s</div>
    </div>
    <button class="btn-primary tap-btn" style="width:100%;font-size:18px" id="tapBtn">▶ BAŞLAT</button>
    <div id="mgResult" class="mg-result"></div>`;

  // İlk yüklemede event listener'ı bağla
  setTimeout(() => {
    const btn = document.getElementById('tapBtn');
    if (btn) {
      btn.onclick = null;
      btn.removeEventListener('click', tapClick);
      btn.addEventListener('click', tapClick);
    }
  }, 100);
};

let tapState = null;

window.tapClick = async function(ev) {
  if (ev) ev.preventDefault();
  const btn = document.getElementById('tapBtn');
  if (!btn) return;

  // ── Durum 1: Henüz başlamadı veya tamamlandı → YENİ TUR BAŞLAT ──
  if (!tapState || tapState.done || tapState.settled) {
    // Eski interval'ı temizle (varsa)
    if (tapState && tapState.iv) { clearInterval(tapState.iv); tapState.iv = null; }

    tapState = {
      count: 0,
      start: Date.now(),
      end: Date.now() + 5000,
      done: false,
      settled: false,
      iv: null,
      tapTimes: []   // CPS hesaplaması için
    };

    btn.textContent = '👆 TIKLA TIKLA TIKLA';
    document.getElementById('tapCount').textContent = '0';
    document.getElementById('tapTime').textContent = '5.0s';
    document.getElementById('mgResult').innerHTML = '';

    // Süre dolma kontrolü için interval (50ms - smooth)
    tapState.iv = setInterval(async () => {
      if (!tapState || tapState.done) {
        if (tapState && tapState.iv) clearInterval(tapState.iv);
        return;
      }

      const left = (tapState.end - Date.now()) / 1000;

      if (left <= 0) {
        // SÜRE BİTTİ
        tapState.done = true;
        clearInterval(tapState.iv);
        tapState.iv = null;

        const finalCount = tapState.count;
        document.getElementById('tapTime').textContent = '0.0s';
        btn.textContent = '⏳ Hesaplanıyor...';
        btn.disabled = true;

        // CPS hesapla (bot tespiti)
        const elapsed = (Date.now() - tapState.start) / 1000;
        const cps = elapsed > 0 ? finalCount / elapsed : 0;

        // Çift settle koruması
        if (tapState.settled) return;
        tapState.settled = true;

        try {
          const r = await settleSkill('tap_fast', finalCount, 30, 150, {
            cps: cps,
            maxScore: 90,         // 5sn × 18cps insan üst limiti
            dailyMaxWin: 5000     // günlük max bu oyundan
          });

          let msg = '';
          if (cps > 15) {
            msg = `<div class="mg-loss">🤖 Bot tespit edildi! (${cps.toFixed(1)} TPS)<br>Kazanç iptal.</div>`;
          } else if (r.payout > 0) {
            msg = `<div class="mg-win">${finalCount} tıklama · ${cps.toFixed(1)} TPS<br>+${cashFmt(r.payout)}</div>`;
          } else {
            msg = `<div class="mg-loss">${finalCount} tıklama · ${cps.toFixed(1)} TPS<br>En az 30 lazım</div>`;
          }
          document.getElementById('mgResult').innerHTML = msg;

        } catch(e) {
          console.error('[tap_fast] settle error:', e);
        } finally {
          btn.disabled = false;
          btn.textContent = '🔄 TEKRAR OYNA';
        }
        return;
      }

      document.getElementById('tapTime').textContent = left.toFixed(1) + 's';
    }, 50);

    return; // YENİ TUR BAŞLATTI, BU TIKLAMA SAYILMAZ
  }

  // ── Durum 2: Tur aktif → tıklamayı say ──
  // KORUMA: Süre kesin bitmiş mi tekrar kontrol et (race condition)
  if (Date.now() >= tapState.end) {
    return; // süre bittiyse kesinlikle sayma
  }

  if (tapState.done || tapState.settled) {
    return; // settle sürecinde / bitti
  }

  tapState.count++;
  tapState.tapTimes.push(Date.now());

  const counter = document.getElementById('tapCount');
  if (counter) counter.textContent = tapState.count;
};

/* ══════════════════ 28. NİŞAN EĞİTİMİ ══════════════════ */
H['aim_trainer'] = g => {
  $r().innerHTML = `<p class="small muted mb-8">10 hedefi vur, hızını ölç</p>
    <div class="aim-board" id="aimBoard"></div>
    <p class="tac" id="aimInfo">Hedef: 0/10 · Süre: 0s</p>
    <button class="btn-primary" style="width:100%" onclick="aimStart()">▶ Başla</button>
    <div id="mgResult" class="mg-result"></div>`;
};
let aimState = null;
window.aimStart = () => {
  aimState = { hits: 0, start: Date.now() };
  aimSpawn();
};
function aimSpawn() {
  const board = document.getElementById('aimBoard');
  if (!board || aimState.hits >= 10) { aimFinish(); return; }
  board.innerHTML = '';
  const t = document.createElement('button');
  t.className = 'aim-target';
  t.textContent = '🎯';
  const x = 5 + Math.random() * 80;
  const y = 5 + Math.random() * 70;
  t.style.left = x + '%';
  t.style.top = y + '%';
  t.onclick = () => {
    aimState.hits++;
    document.getElementById('aimInfo').textContent = `Hedef: ${aimState.hits}/10 · Süre: ${((Date.now()-aimState.start)/1000).toFixed(1)}s`;
    aimSpawn();
  };
  board.appendChild(t);
}
async function aimFinish() {
  const total = (Date.now() - aimState.start) / 1000;
  const score = Math.max(0, Math.round((30 - total) * 5));
  const r = await settleSkill('aim_trainer', score, 50, 200);
  document.getElementById('mgResult').innerHTML = `<div class="${r.won?'mg-win':'mg-loss'}">
    10 hedef · ${total.toFixed(1)}s · skor ${score}<br>${r.payout > 0 ? '+'+cashFmt(r.payout) : 'çok yavaş'}</div>`;
}

/* ══════════════════ 29. TIC-TAC-TOE (XOX) ══════════════════ */
H['tic_tac_toe'] = g => {
  $r().innerHTML = `${betBar(g)}
    <p class="small muted mb-8">3x3 tahta. Sen X, AI O. Kazanırsan 1.94x</p>
    <button class="btn-primary" style="width:100%" onclick="tttStart()">▶ Başlat</button>
    <div id="tttBoard" class="ttt-board"></div>
    <div id="mgResult" class="mg-result"></div>`;
};
let tttState = null;
window.tttStart = async () => {
  const bet = getBet();
  const c = await canPlay('tic_tac_toe', bet); if (!c.ok) return toast(c.msg,'warn');
  if (!await takeBet(bet)) return toast('Bahis hatası','error');
  tttState = { bet, board: Array(9).fill(null), turn: 'X', active: true };
  document.getElementById('mgResult').innerHTML = '';
  tttRender();
};
function tttRender() {
  document.getElementById('tttBoard').innerHTML = tttState.board.map((c, i) =>
    `<button class="ttt-cell" onclick="tttPlay(${i})" ${c ? 'disabled' : ''}>${c || ''}</button>`
  ).join('');
}
function tttCheck(b) {
  const lines = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
  for (const [a,bb,c] of lines) if (b[a] && b[a]===b[bb] && b[bb]===b[c]) return b[a];
  if (b.every(x => x)) return 'draw';
  return null;
}
window.tttPlay = i => {
  if (!tttState.active || tttState.board[i]) return;
  tttState.board[i] = 'X';
  tttRender();
  const w1 = tttCheck(tttState.board);
  if (w1) return tttEnd(w1);
  // AI: önce kazanç hamlesi, sonra blok, sonra rastgele
  const empty = tttState.board.map((c,i) => c?null:i).filter(x => x !== null);
  let move = null;
  // Kazanmaya çalış
  for (const e of empty) { const t = [...tttState.board]; t[e] = 'O'; if (tttCheck(t) === 'O') { move = e; break; } }
  // Blokla
  if (move === null) for (const e of empty) { const t = [...tttState.board]; t[e] = 'X'; if (tttCheck(t) === 'X') { move = e; break; } }
  // Merkez
  if (move === null && empty.includes(4)) move = 4;
  // Rastgele
  if (move === null) move = empty[Math.floor(Math.random()*empty.length)];
  tttState.board[move] = 'O';
  tttRender();
  const w2 = tttCheck(tttState.board);
  if (w2) return tttEnd(w2);
};
async function tttEnd(w) {
  tttState.active = false;
  let m = 0, msg = '';
  if (w === 'X') { m = 1.94; msg = '🎉 Kazandın!'; }
  else if (w === 'draw') { m = 1.0; msg = '🤝 Beraberlik (iade)'; }
  else { msg = '😞 AI kazandı'; }
  const fm = m > 0 ? await bonus('tic_tac_toe', m) : 0;
  const p = Math.floor(tttState.bet * fm);
  const won = m >= 2;
  await settle('tic_tac_toe', tttState.bet, won, p, won?15:5);
  document.getElementById('mgResult').innerHTML = `<div class="${won?'mg-win':(m===1?'mg-warn':'mg-loss')}">${msg}${p>0?' → +'+cashFmt(p):''}</div>`;
}

/* ══════════════════ 30. TAŞ-KAĞIT-MAKAS ══════════════════ */
H['tas_kagit'] = g => {
  $r().innerHTML = `${betBar(g)}
    <p class="small muted mb-8">Kazan: 1.95x · Beraberlik: iade</p>
    <div class="rps-row">
      <button class="rps-btn" onclick="playRPS('rock')">🪨<br>Taş</button>
      <button class="rps-btn" onclick="playRPS('paper')">📄<br>Kağıt</button>
      <button class="rps-btn" onclick="playRPS('scissors')">✂️<br>Makas</button>
    </div>
    <div id="mgResult" class="mg-result"></div>`;
};
window.playRPS = async pick => {
  const bet = getBet();
  const c = await canPlay('tas_kagit', bet); if (!c.ok) return toast(c.msg,'warn');
  if (!await takeBet(bet)) return toast('Bahis hatası','error');
  const opts = ['rock','paper','scissors'];
  const ai = opts[Math.floor(Math.random()*3)];
  const wins = { rock:'scissors', paper:'rock', scissors:'paper' };
  let m = 0, msg = '';
  if (pick === ai) { m = 1.0; msg = '🤝 Beraberlik'; }
  else if (wins[pick] === ai) { m = 1.95; msg = '🎉 Kazandın!'; }
  else msg = '😞 Kaybettin';
  const fm = m > 0 ? await bonus('tas_kagit', m) : 0;
  const p = Math.floor(bet * fm);
  const won = m >= 2;
  await settle('tas_kagit', bet, won, p, won?12:(m===1?6:4));
  const emo = { rock:'🪨', paper:'📄', scissors:'✂️' };
  document.getElementById('mgResult').innerHTML = `<div class="rps-result">
    Sen: ${emo[pick]} · AI: ${emo[ai]}</div>
    <div class="${won?'mg-win':(m===1?'mg-warn':'mg-loss')}">${msg}${p>0?' → '+cashFmt(p):''}</div>`;
};

/* ══════════════════ 31. YILAN ══════════════════ */
H['snake_mini'] = g => {
  $r().innerHTML = `<p class="small muted mb-8">Yön tuşları (oklar veya WASD) ile yeşil yemi ye. Skor 30+ ödül.</p>
    <canvas id="snakeCanvas" width="280" height="280" style="border:2px solid #1f2937;border-radius:8px;background:#111827;display:block;margin:0 auto"></canvas>
    <div class="dir-pad">
      <button onclick="snakeDir(0,-1)">▲</button>
      <div><button onclick="snakeDir(-1,0)">◀</button><button onclick="snakeDir(1,0)">▶</button></div>
      <button onclick="snakeDir(0,1)">▼</button>
    </div>
    <button class="btn-primary" style="width:100%;margin-top:8px" onclick="snakeStart()">▶ Başla</button>
    <div id="mgResult" class="mg-result"></div>`;
};
let snk = null;
window.snakeStart = () => {
  if (snk?.iv) clearInterval(snk.iv);
  snk = { snake: [{x:7,y:7}], dir:{x:1,y:0}, food:{x:10,y:7}, score:0, dead:false };
  snk.iv = setInterval(snakeStep, 150);
};
window.snakeDir = (x, y) => {
  if (!snk || snk.dead) return;
  if (snk.dir.x === -x && snk.dir.y === -y) return; // ters dönme yok
  snk.dir = { x, y };
};
function snakeStep() {
  if (!snk || snk.dead) return;
  const head = { x: snk.snake[0].x + snk.dir.x, y: snk.snake[0].y + snk.dir.y };
  if (head.x < 0 || head.x >= 14 || head.y < 0 || head.y >= 14 || snk.snake.some(s => s.x === head.x && s.y === head.y)) {
    snk.dead = true;
    clearInterval(snk.iv);
    snakeFinish();
    return;
  }
  snk.snake.unshift(head);
  if (head.x === snk.food.x && head.y === snk.food.y) {
    snk.score++;
    do {
      snk.food = { x: Math.floor(Math.random()*14), y: Math.floor(Math.random()*14) };
    } while (snk.snake.some(s => s.x === snk.food.x && s.y === snk.food.y));
  } else snk.snake.pop();
  snakeDraw();
}
function snakeDraw() {
  const c = document.getElementById('snakeCanvas');
  if (!c) return;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#111827'; ctx.fillRect(0, 0, 280, 280);
  ctx.fillStyle = '#22c55e';
  snk.snake.forEach((s, i) => { ctx.fillRect(s.x*20+1, s.y*20+1, 18, 18); });
  ctx.fillStyle = '#dc2626';
  ctx.fillRect(snk.food.x*20+2, snk.food.y*20+2, 16, 16);
  ctx.fillStyle = '#fff';
  ctx.font = '12px sans-serif';
  ctx.fillText('Skor: ' + snk.score, 8, 14);
}
async function snakeFinish() {
  const r = await settleSkill('snake_mini', snk.score, 30, 250);
  document.getElementById('mgResult').innerHTML = `<div class="${r.won?'mg-win':'mg-loss'}">
    Skor: ${snk.score} · ${r.payout > 0 ? '+'+cashFmt(r.payout) : '30 lazım'}</div>`;
}
// Klavye desteği
document.addEventListener('keydown', e => {
  if (!snk || snk.dead) return;
  const m = { ArrowUp:[0,-1], ArrowDown:[0,1], ArrowLeft:[-1,0], ArrowRight:[1,0],
              w:[0,-1], s:[0,1], a:[-1,0], d:[1,0], W:[0,-1], S:[0,1], A:[-1,0], D:[1,0] };
  if (m[e.key]) { snakeDir(...m[e.key]); e.preventDefault(); }
});

/* ══════════════════ 32. BALON PATLAT ══════════════════ */
H['bubble_pop'] = g => {
  $r().innerHTML = `<p class="small muted mb-8">10 saniyede çıkan balonları patlat. 20+ patlama ödül.</p>
    <div class="bubble-arena" id="bubbleArena"></div>
    <p class="tac" id="bubInfo">Patlatılan: 0 · Süre: 10.0s</p>
    <button class="btn-primary" style="width:100%" onclick="bubStart()">▶ Başla</button>
    <div id="mgResult" class="mg-result"></div>`;
};
let bub = null;
window.bubStart = () => {
  bub = { count: 0, end: Date.now() + 10000, done: false };
  bubSpawn();
  const iv = setInterval(() => {
    const left = (bub.end - Date.now()) / 1000;
    if (left <= 0) { clearInterval(iv); bubFinish(); }
    else document.getElementById('bubInfo').textContent = `Patlatılan: ${bub.count} · Süre: ${left.toFixed(1)}s`;
  }, 50);
};
function bubSpawn() {
  if (!bub || bub.done) return;
  const arena = document.getElementById('bubbleArena');
  if (!arena) return;
  const b = document.createElement('div');
  b.className = 'bubble';
  b.textContent = '🎈';
  b.style.left = (5 + Math.random()*80) + '%';
  b.style.top = (5 + Math.random()*70) + '%';
  b.onclick = () => {
    // BUG FIX: süre bittiyse veya tur bittiyse sayma
    if (!bub || bub.done || Date.now() >= bub.end) { b.remove(); return; }
    bub.count++; b.remove();
  };
  arena.appendChild(b);
  setTimeout(() => b.remove(), 1500);
  if (Date.now() < bub.end) setTimeout(bubSpawn, 200 + Math.random()*200);
}
async function bubFinish() {
  bub.done = true;
  const arena = document.getElementById('bubbleArena');
  if (arena) arena.innerHTML = '';
  const r = await settleSkill('bubble_pop', bub.count, 20, 150);
  document.getElementById('mgResult').innerHTML = `<div class="${r.won?'mg-win':'mg-loss'}">
    ${bub.count} patlatıldı · ${r.payout > 0 ? '+'+cashFmt(r.payout) : 'en az 20 lazım'}</div>`;
}

/* ══════════════════ 33. KÖSTEBEK VURMA ══════════════════ */
H['whack_mole'] = g => {
  $r().innerHTML = `<p class="small muted mb-8">15 saniye boyunca çıkan köstebekleri vur. 20+ ödül.</p>
    <div class="mole-grid" id="moleGrid">
      ${Array.from({length:9}, (_,i) => `<div class="mole-hole" id="mh${i}"></div>`).join('')}
    </div>
    <p class="tac" id="moleInfo">Vurulan: 0 · Süre: 15.0s</p>
    <button class="btn-primary" style="width:100%" onclick="moleStart()">▶ Başla</button>
    <div id="mgResult" class="mg-result"></div>`;
};
let mole = null;
window.moleStart = () => {
  mole = { count: 0, end: Date.now() + 15000, done: false };
  moleSpawn();
  const iv = setInterval(() => {
    const left = (mole.end - Date.now()) / 1000;
    if (left <= 0) { clearInterval(iv); moleFinish(); }
    else document.getElementById('moleInfo').textContent = `Vurulan: ${mole.count} · Süre: ${left.toFixed(1)}s`;
  }, 50);
};
function moleSpawn() {
  if (!mole || mole.done) return;
  const idx = Math.floor(Math.random()*9);
  const hole = document.getElementById('mh'+idx);
  if (!hole || hole.classList.contains('active')) { setTimeout(moleSpawn, 200); return; }
  hole.classList.add('active');
  hole.textContent = '🐀';
  const onClick = () => {
    // BUG FIX: süre bittiyse veya tur bittiyse sayma
    if (!mole || mole.done || Date.now() >= mole.end) return;
    if (hole.classList.contains('active')) {
      mole.count++; hole.classList.remove('active'); hole.textContent='';
    }
  };
  hole.onclick = onClick;
  setTimeout(() => { hole.classList.remove('active'); hole.textContent=''; hole.onclick = null; }, 800);
  if (Date.now() < mole.end) setTimeout(moleSpawn, 400 + Math.random()*400);
}
async function moleFinish() {
  mole.done = true;
  const r = await settleSkill('whack_mole', mole.count, 20, 150);
  document.getElementById('mgResult').innerHTML = `<div class="${r.won?'mg-win':'mg-loss'}">
    ${mole.count} vurdun · ${r.payout > 0 ? '+'+cashFmt(r.payout) : 'en az 20'}</div>`;
}

/* ══════════════════ 34. DÜŞENİ YAKALA ══════════════════ */
H['catch_drop'] = g => {
  $r().innerHTML = `<p class="small muted mb-8">Sol/Sağ ile sepeti hareket ettir, düşen meyveleri yakala. 15+ ödül.</p>
    <canvas id="catchCanvas" width="280" height="320" style="border:2px solid #1f2937;border-radius:8px;background:#0c4a6e;display:block;margin:0 auto"></canvas>
    <div class="dir-pad" style="grid-template-columns:1fr 1fr"><button onclick="catchMove(-1)">◀</button><button onclick="catchMove(1)">▶</button></div>
    <button class="btn-primary" style="width:100%;margin-top:6px" onclick="catchStart()">▶ Başla</button>
    <div id="mgResult" class="mg-result"></div>`;
};
let ctch = null;
window.catchStart = () => {
  if (ctch?.iv) clearInterval(ctch.iv);
  ctch = { px: 130, items: [], score: 0, miss: 0, end: Date.now() + 30000, done: false };
  ctch.iv = setInterval(catchStep, 50);
};
window.catchMove = d => { if (ctch && !ctch.done) ctch.px = Math.max(0, Math.min(240, ctch.px + d * 25)); };
function catchStep() {
  if (!ctch || ctch.done) return;
  if (Date.now() > ctch.end || ctch.miss >= 5) { ctch.done = true; clearInterval(ctch.iv); catchFinish(); return; }
  // Spawn
  if (Math.random() < 0.05) ctch.items.push({ x: 20 + Math.random()*240, y: 0, emo: ['🍎','🍌','🍓','🍊'][Math.floor(Math.random()*4)] });
  // Move
  ctch.items.forEach(it => it.y += 4);
  // Catch
  ctch.items = ctch.items.filter(it => {
    if (it.y >= 280 && it.y <= 310 && it.x >= ctch.px && it.x <= ctch.px+40) { ctch.score++; return false; }
    if (it.y > 320) { ctch.miss++; return false; }
    return true;
  });
  // Draw
  const c = document.getElementById('catchCanvas');
  if (!c) return;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#0c4a6e'; ctx.fillRect(0,0,280,320);
  ctx.fillStyle = '#fff';
  ctx.font = '24px sans-serif';
  ctch.items.forEach(it => ctx.fillText(it.emo, it.x, it.y));
  ctx.fillStyle = '#f59e0b';
  ctx.fillRect(ctch.px, 295, 40, 18);
  ctx.fillStyle = '#fff';
  ctx.font = '12px sans-serif';
  ctx.fillText(`Skor: ${ctch.score} · Kaçırma: ${ctch.miss}/5`, 8, 16);
}
async function catchFinish() {
  const r = await settleSkill('catch_drop', ctch.score, 15, 250);
  document.getElementById('mgResult').innerHTML = `<div class="${r.won?'mg-win':'mg-loss'}">
    Yakalanan: ${ctch.score} · ${r.payout > 0 ? '+'+cashFmt(r.payout) : 'en az 15'}</div>`;
}

/* ══════════════════ 35. ENGELDEN KAÇ ══════════════════ */
H['dodge'] = g => {
  $r().innerHTML = `<p class="small muted mb-8">Aşağıdan gelen engellerden kaç. 30 saniye dayan, ödül kap.</p>
    <canvas id="dodgeCanvas" width="280" height="320" style="border:2px solid #1f2937;border-radius:8px;background:#1f2937;display:block;margin:0 auto"></canvas>
    <div class="dir-pad" style="grid-template-columns:1fr 1fr"><button onclick="dodgeMove(-1)">◀</button><button onclick="dodgeMove(1)">▶</button></div>
    <button class="btn-primary" style="width:100%;margin-top:6px" onclick="dodgeStart()">▶ Başla</button>
    <div id="mgResult" class="mg-result"></div>`;
};
let dgs = null;
window.dodgeStart = () => {
  if (dgs?.iv) clearInterval(dgs.iv);
  dgs = { px: 130, obs: [], dead: false, start: Date.now(), score: 0 };
  dgs.iv = setInterval(dodgeStep, 40);
};
window.dodgeMove = d => { if (dgs && !dgs.dead) dgs.px = Math.max(0, Math.min(248, dgs.px + d * 22)); };
function dodgeStep() {
  if (!dgs || dgs.dead) return;
  dgs.score = Math.floor((Date.now() - dgs.start) / 100);
  if (Math.random() < 0.06) dgs.obs.push({ x: Math.random()*250, y: 0, w: 30 + Math.random()*40 });
  dgs.obs.forEach(o => o.y += 5);
  dgs.obs = dgs.obs.filter(o => o.y < 320);
  // Çarpışma
  for (const o of dgs.obs) {
    if (o.y > 280 && o.y < 320 && o.x < dgs.px+32 && o.x+o.w > dgs.px) {
      dgs.dead = true; clearInterval(dgs.iv); dodgeFinish(); return;
    }
  }
  if (Date.now() - dgs.start > 30000) { dgs.dead = true; clearInterval(dgs.iv); dodgeFinish(); return; }
  const c = document.getElementById('dodgeCanvas');
  if (!c) return;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#1f2937'; ctx.fillRect(0,0,280,320);
  ctx.fillStyle = '#dc2626';
  dgs.obs.forEach(o => ctx.fillRect(o.x, o.y, o.w, 16));
  ctx.fillStyle = '#22c55e';
  ctx.fillRect(dgs.px, 290, 32, 24);
  ctx.fillStyle = '#fff';
  ctx.font = '12px sans-serif';
  ctx.fillText(`Skor: ${dgs.score}`, 8, 16);
}
async function dodgeFinish() {
  const r = await settleSkill('dodge', dgs.score, 100, 350);
  document.getElementById('mgResult').innerHTML = `<div class="${r.won?'mg-win':'mg-loss'}">
    Skor: ${dgs.score} · ${r.payout > 0 ? '+'+cashFmt(r.payout) : 'en az 100'}</div>`;
}

/* ══════════════════ 36. SEK SEK (Flappy benzeri) ══════════════════ */
H['flappy'] = g => {
  $r().innerHTML = `<p class="small muted mb-8">Tıklayarak kuşu uçur, borulardan geç. 5+ ödül.</p>
    <canvas id="flapCanvas" width="280" height="380" style="border:2px solid #1f2937;border-radius:8px;background:#0ea5e9;display:block;margin:0 auto" onclick="flapJump()"></canvas>
    <button class="btn-primary" style="width:100%;margin-top:6px" onclick="flapStart()">▶ Başla</button>
    <div id="mgResult" class="mg-result"></div>`;
};
let flap = null;
window.flapStart = () => {
  if (flap?.iv) clearInterval(flap.iv);
  flap = { y: 190, vy: 0, pipes: [], score: 0, dead: false };
  flap.iv = setInterval(flapStep, 40);
};
window.flapJump = () => { if (flap && !flap.dead) flap.vy = -7; };
function flapStep() {
  if (!flap || flap.dead) return;
  flap.vy += 0.5;
  flap.y += flap.vy;
  if (flap.y < 0 || flap.y > 360) { flap.dead = true; clearInterval(flap.iv); flapFinish(); return; }
  if (flap.pipes.length === 0 || flap.pipes[flap.pipes.length-1].x < 180) {
    flap.pipes.push({ x: 280, gap: 80 + Math.random()*200, scored: false });
  }
  flap.pipes.forEach(p => p.x -= 3);
  flap.pipes = flap.pipes.filter(p => p.x > -50);
  for (const p of flap.pipes) {
    if (p.x < 60 && p.x > 20 && (flap.y < p.gap || flap.y > p.gap + 100)) {
      flap.dead = true; clearInterval(flap.iv); flapFinish(); return;
    }
    if (!p.scored && p.x < 30) { p.scored = true; flap.score++; }
  }
  const c = document.getElementById('flapCanvas');
  if (!c) return;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#0ea5e9'; ctx.fillRect(0,0,280,380);
  ctx.fillStyle = '#16a34a';
  flap.pipes.forEach(p => { ctx.fillRect(p.x, 0, 40, p.gap); ctx.fillRect(p.x, p.gap+100, 40, 380); });
  ctx.font = '24px sans-serif'; ctx.fillText('🐦', 30, flap.y);
  ctx.fillStyle = '#fff'; ctx.font = 'bold 18px sans-serif';
  ctx.fillText(flap.score, 130, 30);
}
async function flapFinish() {
  const r = await settleSkill('flappy', flap.score, 5, 250);
  document.getElementById('mgResult').innerHTML = `<div class="${r.won?'mg-win':'mg-loss'}">
    Skor: ${flap.score} · ${r.payout > 0 ? '+'+cashFmt(r.payout) : 'en az 5'}</div>`;
}

/* ══════════════════ 37. HIZLI YAZMA ══════════════════ */
const TYPE_WORDS = ['merhaba','dünya','oyun','kazanç','seviye','başarı','bilgisayar','kahraman','ekonomi','market','dükkan','ürün','satış','liderlik','elmas','para','yatırım','ihracat','ihale','kripto','marka','şehir','reyon','stok','fiyat','kalite','güven','başlangıç','rekabet','strateji'];
H['type_speed'] = g => {
  $r().innerHTML = `<p class="small muted mb-8">15 saniyede mümkün olduğunca çok kelime yaz. 8+ kelime ödül.</p>
    <div class="type-target" id="typeTarget">tıkla başla</div>
    <input type="text" id="typeInput" placeholder="kelimeyi yaz" autocomplete="off" autocapitalize="off" disabled>
    <p class="tac" id="typeInfo">Yazılan: 0 · Süre: 15.0s</p>
    <button class="btn-primary" style="width:100%" onclick="typeStart()">▶ Başla</button>
    <div id="mgResult" class="mg-result"></div>`;
};
let typ = null;
window.typeStart = () => {
  typ = { count: 0, end: Date.now() + 15000, current: '', done: false };
  typeNext();
  const inp = document.getElementById('typeInput');
  inp.disabled = false; inp.value = ''; inp.focus();
  inp.oninput = e => {
    if (typ.done) return;
    if (e.target.value.toLowerCase().trim() === typ.current) {
      typ.count++; e.target.value = ''; typeNext();
    }
  };
  const iv = setInterval(() => {
    const left = (typ.end - Date.now()) / 1000;
    if (left <= 0) { clearInterval(iv); typeFinish(); }
    else document.getElementById('typeInfo').textContent = `Yazılan: ${typ.count} · Süre: ${left.toFixed(1)}s`;
  }, 50);
};
function typeNext() {
  typ.current = TYPE_WORDS[Math.floor(Math.random()*TYPE_WORDS.length)];
  document.getElementById('typeTarget').textContent = typ.current;
}
async function typeFinish() {
  typ.done = true;
  document.getElementById('typeInput').disabled = true;
  const r = await settleSkill('type_speed', typ.count, 8, 200);
  document.getElementById('mgResult').innerHTML = `<div class="${r.won?'mg-win':'mg-loss'}">
    ${typ.count} kelime · ${r.payout > 0 ? '+'+cashFmt(r.payout) : 'en az 8'}</div>`;
}

/* ══════════════════ 38. HASSAS TIKLA ══════════════════ */
H['precision'] = g => {
  $r().innerHTML = `<p class="small muted mb-8">5 hedef, küçükten küçüğe. Kaç tanesini vurabilirsin?</p>
    <div class="aim-board" id="precBoard"></div>
    <p class="tac" id="precInfo">Hedef: 0/5</p>
    <button class="btn-primary" style="width:100%" onclick="precStart()">▶ Başla</button>
    <div id="mgResult" class="mg-result"></div>`;
};
let prec = null;
window.precStart = () => {
  prec = { hits: 0, round: 0 };
  precSpawn();
};
function precSpawn() {
  if (prec.round >= 5) { precFinish(); return; }
  const board = document.getElementById('precBoard');
  if (!board) return;
  board.innerHTML = '';
  const t = document.createElement('button');
  t.className = 'aim-target';
  t.textContent = '⊕';
  const sz = 40 - prec.round * 6; // 40, 34, 28, 22, 16
  t.style.width = sz + 'px';
  t.style.height = sz + 'px';
  t.style.fontSize = (sz - 8) + 'px';
  t.style.left = (5 + Math.random()*80) + '%';
  t.style.top = (5 + Math.random()*70) + '%';
  let timer = setTimeout(() => { prec.round++; precSpawn(); }, 2000);
  t.onclick = () => { clearTimeout(timer); prec.hits++; prec.round++; document.getElementById('precInfo').textContent = `Hedef: ${prec.hits}/${prec.round}`; precSpawn(); };
  board.appendChild(t);
}
async function precFinish() {
  const r = await settleSkill('precision', prec.hits, 3, 200);
  document.getElementById('mgResult').innerHTML = `<div class="${r.won?'mg-win':'mg-loss'}">
    ${prec.hits}/5 vurdun · ${r.payout > 0 ? '+'+cashFmt(r.payout) : 'en az 3'}</div>`;
}

/* ══════════════════ 39. RENK EŞLEŞTİR ══════════════════ */
const COLOR_NAMES = { '#dc2626':'KIRMIZI', '#16a34a':'YEŞİL', '#1e5cb8':'MAVİ', '#f59e0b':'SARI', '#7c3aed':'MOR' };
H['color_match'] = g => {
  $r().innerHTML = `<p class="small muted mb-8">Yazıyı OKU değil, RENGİNE göre tıkla. Stroop testi! 8/10 ödül.</p>
    <div id="colorWord" class="color-word">Hazır?</div>
    <div class="color-options" id="colorOpts"></div>
    <p class="tac" id="colorInfo">Tur: 0/10 · Doğru: 0</p>
    <button class="btn-primary" style="width:100%" onclick="colorStart()">▶ Başla</button>
    <div id="mgResult" class="mg-result"></div>`;
};
let col = null;
window.colorStart = () => {
  col = { round: 0, correct: 0 };
  colorNext();
};
function colorNext() {
  if (col.round >= 10) { colorFinish(); return; }
  const colors = Object.keys(COLOR_NAMES);
  const wordCol = colors[Math.floor(Math.random()*colors.length)];
  const wordTxt = COLOR_NAMES[colors[Math.floor(Math.random()*colors.length)]];
  col.target = wordCol;
  const word = document.getElementById('colorWord');
  word.textContent = wordTxt;
  word.style.color = wordCol;
  // Seçenekler
  const opts = document.getElementById('colorOpts');
  opts.innerHTML = colors.map(c => `<button class="color-opt" style="background:${c}" onclick="colorPick('${c}')">${COLOR_NAMES[c]}</button>`).join('');
}
window.colorPick = c => {
  if (c === col.target) col.correct++;
  col.round++;
  document.getElementById('colorInfo').textContent = `Tur: ${col.round}/10 · Doğru: ${col.correct}`;
  colorNext();
};
async function colorFinish() {
  const r = await settleSkill('color_match', col.correct, 8, 200);
  document.getElementById('mgResult').innerHTML = `<div class="${r.won?'mg-win':'mg-loss'}">
    Doğru: ${col.correct}/10 · ${r.payout > 0 ? '+'+cashFmt(r.payout) : 'en az 8'}</div>`;
}

/* ══════════════════ 40. SIRALI TIKLA ══════════════════ */
H['sequence_tap'] = g => {
  $r().innerHTML = `<p class="small muted mb-8">1'den 16'ya kadar sıralı tıkla. Hızını ölçeriz.</p>
    <div class="seq-grid" id="seqGrid"></div>
    <p class="tac" id="seqInfo">Sırada: 1 · Süre: 0s</p>
    <button class="btn-primary" style="width:100%" onclick="seqStart()">▶ Başla</button>
    <div id="mgResult" class="mg-result"></div>`;
};
let seq = null;
window.seqStart = () => {
  seq = { current: 1, start: Date.now() };
  const arr = Array.from({length:16}, (_,i)=>i+1);
  for (let i = arr.length-1; i > 0; i--) { const j = Math.floor(Math.random()*(i+1)); [arr[i],arr[j]] = [arr[j],arr[i]]; }
  document.getElementById('seqGrid').innerHTML = arr.map(n => `<button class="seq-cell" data-n="${n}" onclick="seqTap(${n})">${n}</button>`).join('');
};
window.seqTap = n => {
  if (!seq) return;
  if (n === seq.current) {
    document.querySelector(`.seq-cell[data-n="${n}"]`).classList.add('done');
    seq.current++;
    if (seq.current > 16) { seqFinish(); return; }
    document.getElementById('seqInfo').textContent = `Sırada: ${seq.current} · Süre: ${((Date.now()-seq.start)/1000).toFixed(1)}s`;
  } else {
    toast('Yanlış sıra!', 'warn');
  }
};
async function seqFinish() {
  const total = (Date.now() - seq.start) / 1000;
  const score = Math.max(0, Math.round((30 - total) * 4));
  const r = await settleSkill('sequence_tap', score, 50, 200);
  document.getElementById('mgResult').innerHTML = `<div class="${r.won?'mg-win':'mg-loss'}">
    ${total.toFixed(1)}s · skor ${score} · ${r.payout > 0 ? '+'+cashFmt(r.payout) : 'çok yavaş'}</div>`;
}

/* ╔══════════════════════════════════════════════════════════════════╗
   ║                            🧠 ZEKA (10)                          ║
   ╚══════════════════════════════════════════════════════════════════╝ */

/* ══════════════════ 41. HAFIZA EŞLEŞTİR ══════════════════ */
H['memory_grid'] = g => {
  const emos = ['🍎','🍌','🍇','🍒','🥝','🍑','🥭','🍓'];
  const cards = [...emos, ...emos];
  for (let i = cards.length-1; i > 0; i--) { const j = Math.floor(Math.random()*(i+1)); [cards[i],cards[j]] = [cards[j],cards[i]]; }
  $r().innerHTML = `<p class="small muted mb-8">8 çift kart, eşleştir. Az sürede tamamla, ödül kap.</p>
    <div class="memo-grid" id="memoGrid">${cards.map((c,i)=>`<button class="memo-card" data-i="${i}" data-e="${c}" onclick="memoFlip(${i})"><span>${c}</span></button>`).join('')}</div>
    <p class="tac" id="memoInfo">Eşleşen: 0/8 · Hamle: 0</p>
    <div id="mgResult" class="mg-result"></div>`;
  window.memoState = { flipped:[], matched:0, moves:0, start:Date.now() };
};
window.memoFlip = i => {
  const m = window.memoState;
  if (m.flipped.length >= 2) return;
  const card = document.querySelector(`.memo-card[data-i="${i}"]`);
  if (!card || card.classList.contains('flipped') || card.classList.contains('matched')) return;
  card.classList.add('flipped');
  m.flipped.push(i);
  if (m.flipped.length === 2) {
    m.moves++;
    const [a,b] = m.flipped;
    const ea = document.querySelector(`.memo-card[data-i="${a}"]`).dataset.e;
    const eb = document.querySelector(`.memo-card[data-i="${b}"]`).dataset.e;
    setTimeout(async () => {
      if (ea === eb) {
        document.querySelector(`.memo-card[data-i="${a}"]`).classList.add('matched');
        document.querySelector(`.memo-card[data-i="${b}"]`).classList.add('matched');
        m.matched++;
      } else {
        document.querySelector(`.memo-card[data-i="${a}"]`).classList.remove('flipped');
        document.querySelector(`.memo-card[data-i="${b}"]`).classList.remove('flipped');
      }
      m.flipped = [];
      document.getElementById('memoInfo').textContent = `Eşleşen: ${m.matched}/8 · Hamle: ${m.moves}`;
      if (m.matched >= 8) {
        const t = (Date.now()-m.start)/1000;
        const score = Math.max(0, Math.round(100 - m.moves*3 - t/2));
        const r = await settleSkill('memory_grid', score, 50, 250);
        document.getElementById('mgResult').innerHTML = `<div class="${r.won?'mg-win':'mg-loss'}">
          ${m.moves} hamle, ${t.toFixed(1)}s · skor ${score} · ${r.payout > 0 ? '+'+cashFmt(r.payout) : ''}</div>`;
      }
    }, 700);
  }
};

/* ══════════════════ 42. SIMON DİYOR ══════════════════ */
H['simon_says'] = g => {
  $r().innerHTML = `<p class="small muted mb-8">Yanan sıraya göre tıkla. Her doğru tur seviye atlar. 5+ ödül.</p>
    <div class="simon-grid">
      <button class="simon-btn red" data-c="0" onclick="simonPress(0)"></button>
      <button class="simon-btn green" data-c="1" onclick="simonPress(1)"></button>
      <button class="simon-btn blue" data-c="2" onclick="simonPress(2)"></button>
      <button class="simon-btn yellow" data-c="3" onclick="simonPress(3)"></button>
    </div>
    <p class="tac" id="simonInfo">Seviye: 0</p>
    <button class="btn-primary" style="width:100%" onclick="simonStart()">▶ Başla</button>
    <div id="mgResult" class="mg-result"></div>`;
};
let sim = null;
window.simonStart = () => {
  sim = { seq: [], userIdx: 0, level: 0, locked: true };
  simonNext();
};
function simonNext() {
  sim.seq.push(Math.floor(Math.random()*4));
  sim.level++;
  sim.userIdx = 0;
  document.getElementById('simonInfo').textContent = `Seviye: ${sim.level}`;
  simonPlay(0);
}
function simonPlay(i) {
  if (i >= sim.seq.length) { sim.locked = false; return; }
  sim.locked = true;
  const btn = document.querySelector(`.simon-btn[data-c="${sim.seq[i]}"]`);
  btn.classList.add('lit');
  setTimeout(() => { btn.classList.remove('lit'); setTimeout(()=>simonPlay(i+1), 200); }, 500);
}
window.simonPress = async c => {
  if (!sim || sim.locked) return;
  const btn = document.querySelector(`.simon-btn[data-c="${c}"]`);
  btn.classList.add('lit'); setTimeout(()=>btn.classList.remove('lit'), 250);
  if (sim.seq[sim.userIdx] !== c) {
    // Yanlış
    sim.locked = true;
    const r = await settleSkill('simon_says', sim.level - 1, 5, 250);
    document.getElementById('mgResult').innerHTML = `<div class="${r.won?'mg-win':'mg-loss'}">
      Seviye ${sim.level-1} · ${r.payout > 0 ? '+'+cashFmt(r.payout) : 'en az 5'}</div>`;
    return;
  }
  sim.userIdx++;
  if (sim.userIdx >= sim.seq.length) setTimeout(simonNext, 600);
};

/* ══════════════════ 43. HIZLI MATEMATİK ══════════════════ */
H['math_quick'] = g => {
  $r().innerHTML = `<p class="small muted mb-8">30 saniyede mümkün olduğunca çok soru çöz. 10+ ödül.</p>
    <div class="math-q" id="mathQ">tıkla başla</div>
    <input type="number" id="mathA" placeholder="cevap" autocomplete="off" disabled>
    <p class="tac" id="mathInfo">Doğru: 0 · Süre: 30.0s</p>
    <button class="btn-primary" style="width:100%" onclick="mathStart()">▶ Başla</button>
    <div id="mgResult" class="mg-result"></div>`;
};
let mth = null;
window.mathStart = () => {
  mth = { count: 0, end: Date.now() + 30000, ans: 0, done: false };
  mathNext();
  const inp = document.getElementById('mathA');
  inp.disabled = false; inp.value = ''; inp.focus();
  inp.oninput = e => {
    if (mth.done) return;
    if (parseInt(e.target.value) === mth.ans) { mth.count++; e.target.value = ''; mathNext(); }
  };
  const iv = setInterval(() => {
    const left = (mth.end - Date.now()) / 1000;
    if (left <= 0) { clearInterval(iv); mathFinish(); }
    else document.getElementById('mathInfo').textContent = `Doğru: ${mth.count} · Süre: ${left.toFixed(1)}s`;
  }, 50);
};
function mathNext() {
  const ops = ['+','-','×'];
  const op = ops[Math.floor(Math.random()*3)];
  let a = Math.floor(Math.random()*20)+1, b = Math.floor(Math.random()*20)+1;
  if (op === '×') { a = Math.floor(Math.random()*10)+1; b = Math.floor(Math.random()*10)+1; }
  mth.ans = op === '+' ? a+b : op === '-' ? a-b : a*b;
  document.getElementById('mathQ').textContent = `${a} ${op} ${b} = ?`;
}
async function mathFinish() {
  mth.done = true;
  document.getElementById('mathA').disabled = true;
  const r = await settleSkill('math_quick', mth.count, 10, 200);
  document.getElementById('mgResult').innerHTML = `<div class="${r.won?'mg-win':'mg-loss'}">
    ${mth.count} doğru · ${r.payout > 0 ? '+'+cashFmt(r.payout) : 'en az 10'}</div>`;
}

/* ══════════════════ 44. SAYI SIRALA ══════════════════ */
H['order_numbers'] = g => {
  const arr = [];
  while (arr.length < 9) { const n = Math.floor(Math.random()*100); if (!arr.includes(n)) arr.push(n); }
  window.ordState = { arr: [...arr], sorted: [], target: [...arr].sort((a,b)=>a-b), start: Date.now() };
  $r().innerHTML = `<p class="small muted mb-8">9 sayıyı küçükten büyüğe sırala. Hızlı ol!</p>
    <div class="ord-row"><b>Hedef:</b> küçükten büyüğe</div>
    <div class="ord-grid" id="ordGrid">${arr.map((n,i)=>`<button class="ord-btn" data-i="${i}" data-n="${n}" onclick="ordPick(${i},${n})">${n}</button>`).join('')}</div>
    <div class="ord-row"><b>Sıralananlar:</b> <span id="ordPicked">—</span></div>
    <button class="btn-secondary" style="width:100%;margin-top:6px" onclick="ordReset()">↺ Sıfırla</button>
    <div id="mgResult" class="mg-result"></div>`;
};
window.ordPick = (i, n) => {
  const o = window.ordState;
  o.sorted.push(n);
  document.querySelector(`.ord-btn[data-i="${i}"]`).disabled = true;
  document.querySelector(`.ord-btn[data-i="${i}"]`).classList.add('done');
  document.getElementById('ordPicked').textContent = o.sorted.join(' → ');
  if (o.sorted.length === 9) ordFinish();
};
window.ordReset = () => {
  const o = window.ordState;
  o.sorted = [];
  document.querySelectorAll('.ord-btn').forEach(b => { b.disabled = false; b.classList.remove('done'); });
  document.getElementById('ordPicked').textContent = '—';
};
async function ordFinish() {
  const o = window.ordState;
  const correct = JSON.stringify(o.sorted) === JSON.stringify(o.target);
  const t = (Date.now() - o.start) / 1000;
  const score = correct ? Math.max(0, Math.round(50 - t)) : 0;
  const r = await settleSkill('order_numbers', score, 20, 150);
  document.getElementById('mgResult').innerHTML = `<div class="${r.won?'mg-win':'mg-loss'}">
    ${correct ? '✅ Doğru' : '❌ Yanlış sıra'} · ${t.toFixed(1)}s · ${r.payout > 0 ? '+'+cashFmt(r.payout) : ''}</div>`;
}

/* ══════════════════ 45. SIRADAKİ SAYI ══════════════════ */
H['next_in_seq'] = g => {
  // Aritmetik veya geometrik dizi
  const isGeo = Math.random() < 0.4;
  let nums = [];
  let answer = 0;
  if (isGeo) {
    const a = Math.floor(Math.random()*5)+2, r = Math.floor(Math.random()*3)+2;
    for (let i = 0; i < 4; i++) nums.push(a * Math.pow(r, i));
    answer = a * Math.pow(r, 4);
  } else {
    const a = Math.floor(Math.random()*20)+1, d = Math.floor(Math.random()*10)+1;
    for (let i = 0; i < 4; i++) nums.push(a + i*d);
    answer = a + 4*d;
  }
  window.nseqState = { ans: answer };
  $r().innerHTML = `${betBar(g)}
    <p class="small muted mb-8">Sıradaki sayıyı tahmin et. Doğru cevap: 1.95x</p>
    <div class="nseq-display">${nums.join(' , ')} , <b>?</b></div>
    <input type="number" id="nseqA" placeholder="cevap" autocomplete="off">
    <button class="btn-primary" style="width:100%;margin-top:8px" onclick="nseqSubmit()">Cevapla</button>
    <div id="mgResult" class="mg-result"></div>`;
};
window.nseqSubmit = async () => {
  const bet = getBet();
  const c = await canPlay('next_in_seq', bet); if (!c.ok) return toast(c.msg,'warn');
  if (!await takeBet(bet)) return toast('Bahis hatası','error');
  const a = parseInt(document.getElementById('nseqA').value);
  const won = a === window.nseqState.ans;
  const m = won ? await bonus('next_in_seq', 1.95) : 0;
  const p = won ? Math.floor(bet*m) : 0;
  await settle('next_in_seq', bet, won, p, won?15:5);
  document.getElementById('mgResult').innerHTML = `<div class="${won?'mg-win':'mg-loss'}">
    Doğru: ${window.nseqState.ans} · ${won ? '+'+cashFmt(p) : '😞'}</div>`;
};

/* ══════════════════ 46. KELİME ÇÖZ ══════════════════ */
const SCRAMBLE_WORDS = ['merhaba','dünya','oyun','kazanç','elmas','market','bilgisayar','şehir','başarı','strateji','rekabet','geliştirici','telefon','ekonomi'];
H['word_scramble'] = g => {
  const w = SCRAMBLE_WORDS[Math.floor(Math.random()*SCRAMBLE_WORDS.length)];
  const sc = w.split('').sort(()=>Math.random()-0.5).join('');
  window.wsState = { word: w };
  $r().innerHTML = `${betBar(g)}
    <p class="small muted mb-8">Karışık harfleri düzgün kelime yap. Doğru: 1.95x</p>
    <div class="ws-display">${sc}</div>
    <input type="text" id="wsA" placeholder="cevap" autocomplete="off" autocapitalize="off">
    <button class="btn-primary" style="width:100%;margin-top:8px" onclick="wsSubmit()">Cevapla</button>
    <div id="mgResult" class="mg-result"></div>`;
};
window.wsSubmit = async () => {
  const bet = getBet();
  const c = await canPlay('word_scramble', bet); if (!c.ok) return toast(c.msg,'warn');
  if (!await takeBet(bet)) return toast('Bahis hatası','error');
  const a = document.getElementById('wsA').value.toLowerCase().trim();
  const won = a === window.wsState.word.toLowerCase();
  const m = won ? await bonus('word_scramble', 1.95) : 0;
  const p = won ? Math.floor(bet*m) : 0;
  await settle('word_scramble', bet, won, p, won?15:5);
  document.getElementById('mgResult').innerHTML = `<div class="${won?'mg-win':'mg-loss'}">
    Doğru: ${window.wsState.word} · ${won ? '+'+cashFmt(p) : '😞'}</div>`;
};

/* ══════════════════ 47. MİNİ MAYIN TEMİZLE ══════════════════ */
H['mini_sweeper'] = g => {
  // 5x5, 5 mayın
  const N = 5, M = 5;
  const cells = Array.from({length:N*N}, (_,i)=>({i, mine:false, open:false, val:0}));
  const minePool = [...Array(N*N).keys()];
  for (let i = 0; i < M; i++) { const idx = Math.floor(Math.random()*minePool.length); cells[minePool[idx]].mine = true; minePool.splice(idx,1); }
  for (let i = 0; i < N*N; i++) {
    if (cells[i].mine) continue;
    const x = i%N, y = Math.floor(i/N);
    let cnt = 0;
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
      if (dx===0 && dy===0) continue;
      const nx = x+dx, ny = y+dy;
      if (nx<0||nx>=N||ny<0||ny>=N) continue;
      if (cells[ny*N+nx].mine) cnt++;
    }
    cells[i].val = cnt;
  }
  window.swpState = { cells, opened: 0, dead: false, won: false, N };
  $r().innerHTML = `${betBar(g)}
    <p class="small muted mb-8">5x5, 5 mayın. Mayına basmadan tüm güvenli hücreleri aç. Başarı: 3.5x</p>
    <button class="btn-primary" style="width:100%;margin-bottom:8px" onclick="swpStart()">▶ Başlat</button>
    <div class="swp-grid" id="swpGrid"></div>
    <div id="mgResult" class="mg-result"></div>`;
};
window.swpStart = async () => {
  const bet = getBet();
  const c = await canPlay('mini_sweeper', bet); if (!c.ok) return toast(c.msg,'warn');
  if (!await takeBet(bet)) return toast('Bahis hatası','error');
  window.swpState.bet = bet;
  swpRender();
};
function swpRender() {
  const s = window.swpState;
  document.getElementById('swpGrid').innerHTML = s.cells.map(c => {
    if (c.open) return `<div class="swp-cell open ${c.mine?'mine':''}">${c.mine?'💣':(c.val||'')}</div>`;
    return `<button class="swp-cell" onclick="swpOpen(${c.i})"></button>`;
  }).join('');
}
window.swpOpen = async i => {
  const s = window.swpState;
  if (s.dead || s.won || !s.bet) return;
  const c = s.cells[i];
  if (c.open) return;
  c.open = true;
  if (c.mine) {
    s.dead = true;
    s.cells.forEach(x => { if (x.mine) x.open = true; });
    swpRender();
    await settle('mini_sweeper', s.bet, false, 0, 5);
    document.getElementById('mgResult').innerHTML = `<div class="mg-loss">💥 Mayın!</div>`;
    return;
  }
  s.opened++;
  // Boşsa komşuları aç (basit flood fill)
  if (c.val === 0) {
    const x = i%s.N, y = Math.floor(i/s.N);
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
      const nx = x+dx, ny = y+dy;
      if (nx<0||nx>=s.N||ny<0||ny>=s.N) continue;
      const nc = s.cells[ny*s.N+nx];
      if (!nc.open && !nc.mine) { swpOpen(ny*s.N+nx); }
    }
  }
  swpRender();
  if (s.opened >= s.N*s.N - 5) {
    s.won = true;
    const m = await bonus('mini_sweeper', 3.5);
    const p = Math.floor(s.bet * m);
    await settle('mini_sweeper', s.bet, true, p, 30);
    document.getElementById('mgResult').innerHTML = `<div class="mg-win">🎉 Temiz! +${cashFmt(p)}</div>`;
  }
};

/* ══════════════════ 48. 2048 ══════════════════ */
H['puzzle_2048'] = g => {
  $r().innerHTML = `<p class="small muted mb-8">Aynı sayıları birleştir, 2048'e ulaş. 256+ ödül.</p>
    <div class="g2-board" id="g2Board"></div>
    <div class="dir-pad">
      <button onclick="g2Move('up')">▲</button>
      <div><button onclick="g2Move('left')">◀</button><button onclick="g2Move('right')">▶</button></div>
      <button onclick="g2Move('down')">▼</button>
    </div>
    <p class="tac" id="g2Info">Skor: 0 · En yüksek: 0</p>
    <button class="btn-primary" style="width:100%" onclick="g2Start()">▶ Başla</button>
    <div id="mgResult" class="mg-result"></div>`;
};
let g2 = null;
window.g2Start = () => {
  g2 = { board: Array(16).fill(0), score: 0, max: 0, dead: false };
  g2Add(); g2Add(); g2Render();
};
function g2Add() {
  const empty = g2.board.map((v,i) => v===0?i:null).filter(x => x !== null);
  if (!empty.length) return;
  g2.board[empty[Math.floor(Math.random()*empty.length)]] = Math.random() < 0.9 ? 2 : 4;
}
function g2Render() {
  const b = document.getElementById('g2Board');
  if (!b) return;
  b.innerHTML = g2.board.map(v => {
    if (v === 0) return '<div class="g2-cell empty"></div>';
    g2.max = Math.max(g2.max, v);
    return `<div class="g2-cell" data-v="${v}">${v}</div>`;
  }).join('');
  document.getElementById('g2Info').textContent = `Skor: ${g2.score} · En yüksek: ${g2.max}`;
}
window.g2Move = async dir => {
  if (!g2 || g2.dead) return;
  const N = 4;
  const old = JSON.stringify(g2.board);
  const moveLine = (line) => {
    const filtered = line.filter(v => v !== 0);
    for (let i = 0; i < filtered.length-1; i++) {
      if (filtered[i] === filtered[i+1]) {
        filtered[i] *= 2;
        g2.score += filtered[i];
        filtered.splice(i+1, 1);
      }
    }
    while (filtered.length < N) filtered.push(0);
    return filtered;
  };
  const get = (x,y) => g2.board[y*N+x];
  const set = (x,y,v) => g2.board[y*N+x] = v;
  if (dir === 'left') for (let y = 0; y < N; y++) { const l = moveLine([get(0,y),get(1,y),get(2,y),get(3,y)]); l.forEach((v,x)=>set(x,y,v)); }
  if (dir === 'right') for (let y = 0; y < N; y++) { const l = moveLine([get(3,y),get(2,y),get(1,y),get(0,y)]); l.forEach((v,x)=>set(3-x,y,v)); }
  if (dir === 'up') for (let x = 0; x < N; x++) { const l = moveLine([get(x,0),get(x,1),get(x,2),get(x,3)]); l.forEach((v,y)=>set(x,y,v)); }
  if (dir === 'down') for (let x = 0; x < N; x++) { const l = moveLine([get(x,3),get(x,2),get(x,1),get(x,0)]); l.forEach((v,y)=>set(x,3-y,v)); }
  if (JSON.stringify(g2.board) !== old) g2Add();
  g2Render();
  // Game over kontrolü
  if (g2.board.every(v => v !== 0)) {
    let canMove = false;
    for (let i = 0; i < 16 && !canMove; i++) {
      const x = i%N, y = Math.floor(i/N);
      if (x < N-1 && g2.board[i] === g2.board[i+1]) canMove = true;
      if (y < N-1 && g2.board[i] === g2.board[i+N]) canMove = true;
    }
    if (!canMove) {
      g2.dead = true;
      const r = await settleSkill('puzzle_2048', g2.max, 256, 350);
      document.getElementById('mgResult').innerHTML = `<div class="${r.won?'mg-win':'mg-loss'}">
        En yüksek: ${g2.max} · ${r.payout > 0 ? '+'+cashFmt(r.payout) : '256 lazım'}</div>`;
    }
  }
};

/* ══════════════════ 49. ADAM ASMACA ══════════════════ */
H['hangman'] = g => {
  const w = SCRAMBLE_WORDS[Math.floor(Math.random()*SCRAMBLE_WORDS.length)].toLowerCase();
  window.hmState = { word: w, guessed: new Set(), wrong: 0, max: 6, won: false };
  $r().innerHTML = `${betBar(g)}
    <p class="small muted mb-8">Harfleri tahmin et, kelimeyi bul. 6 yanlış hak. Doğru: 1.97x</p>
    <button class="btn-primary" style="width:100%;margin-bottom:8px" onclick="hmStart()">▶ Başlat</button>
    <div id="hmArea"></div>
    <div id="mgResult" class="mg-result"></div>`;
};
window.hmStart = async () => {
  const bet = getBet();
  const c = await canPlay('hangman', bet); if (!c.ok) return toast(c.msg,'warn');
  if (!await takeBet(bet)) return toast('Bahis hatası','error');
  window.hmState.bet = bet;
  hmRender();
};
function hmRender() {
  const h = window.hmState;
  const display = h.word.split('').map(c => h.guessed.has(c) ? c : '_').join(' ');
  const letters = 'abcçdefgğhıijklmnoöprsştuüvyz'.split('');
  document.getElementById('hmArea').innerHTML = `
    <div class="hm-display">${display}</div>
    <div class="hm-stat">Yanlış: ${h.wrong}/${h.max}</div>
    <div class="hm-letters">${letters.map(l => `<button class="hm-letter ${h.guessed.has(l)?'used':''}" ${h.guessed.has(l)?'disabled':''} onclick="hmGuess('${l}')">${l}</button>`).join('')}</div>`;
}
window.hmGuess = async l => {
  const h = window.hmState;
  if (h.guessed.has(l) || h.won || h.wrong >= h.max) return;
  h.guessed.add(l);
  if (!h.word.includes(l)) h.wrong++;
  // Kelime tamam mı?
  const all = h.word.split('').every(c => h.guessed.has(c));
  if (all) {
    h.won = true;
    const m = await bonus('hangman', 1.97);
    const p = Math.floor(h.bet * m);
    await settle('hangman', h.bet, true, p, 25);
    hmRender();
    document.getElementById('mgResult').innerHTML = `<div class="mg-win">🎉 ${h.word} · +${cashFmt(p)}</div>`;
    return;
  }
  if (h.wrong >= h.max) {
    await settle('hangman', h.bet, false, 0, 6);
    hmRender();
    document.getElementById('mgResult').innerHTML = `<div class="mg-loss">💀 Asıldı! Kelime: ${h.word}</div>`;
    return;
  }
  hmRender();
};

/* ══════════════════ 50. SUDOKU 4x4 ══════════════════ */
H['sudoku_mini'] = g => {
  // 4x4 puzzle: 1-4, her satır/sütun/2x2 bölge tekil
  const solutions = [
    [1,2,3,4, 3,4,1,2, 2,1,4,3, 4,3,2,1],
    [1,3,2,4, 2,4,1,3, 3,1,4,2, 4,2,3,1],
    [2,1,4,3, 3,4,1,2, 1,3,2,4, 4,2,3,1],
    [4,3,1,2, 1,2,4,3, 3,4,2,1, 2,1,3,4],
  ];
  const sol = solutions[Math.floor(Math.random()*solutions.length)];
  const puzzle = [...sol];
  // 8 hücre boşalt
  const idxs = Array.from({length:16}, (_,i)=>i);
  for (let i = 0; i < 8; i++) { const j = Math.floor(Math.random()*idxs.length); puzzle[idxs[j]] = 0; idxs.splice(j,1); }
  window.sdkState = { puzzle: [...puzzle], sol, given: puzzle.map(v => v !== 0) };
  $r().innerHTML = `${betBar(g)}
    <p class="small muted mb-8">4x4 sudoku. 1-4 her satır/sütun/2x2'de bir kez. Doğru: 1.97x</p>
    <button class="btn-primary" style="width:100%;margin-bottom:8px" onclick="sdkStart()">▶ Başlat</button>
    <div id="sdkArea"></div>
    <div id="mgResult" class="mg-result"></div>`;
};
window.sdkStart = async () => {
  const bet = getBet();
  const c = await canPlay('sudoku_mini', bet); if (!c.ok) return toast(c.msg,'warn');
  if (!await takeBet(bet)) return toast('Bahis hatası','error');
  window.sdkState.bet = bet;
  sdkRender();
};
function sdkRender() {
  const s = window.sdkState;
  document.getElementById('sdkArea').innerHTML = `
    <div class="sdk-grid">${s.puzzle.map((v,i) =>
      s.given[i]
        ? `<div class="sdk-cell given">${v}</div>`
        : `<input class="sdk-cell" type="number" min="1" max="4" data-i="${i}" value="${v||''}" oninput="sdkInput(${i}, this.value)">`
    ).join('')}</div>
    <button class="btn-success" style="width:100%;margin-top:8px" onclick="sdkCheck()">✓ Kontrol Et</button>`;
}
window.sdkInput = (i, v) => {
  const n = parseInt(v);
  window.sdkState.puzzle[i] = (n >= 1 && n <= 4) ? n : 0;
};
window.sdkCheck = async () => {
  const s = window.sdkState;
  const correct = JSON.stringify(s.puzzle) === JSON.stringify(s.sol);
  if (correct) {
    const m = await bonus('sudoku_mini', 1.97);
    const p = Math.floor(s.bet * m);
    await settle('sudoku_mini', s.bet, true, p, 35);
    document.getElementById('mgResult').innerHTML = `<div class="mg-win">🎉 Mükemmel! +${cashFmt(p)}</div>`;
  } else {
    await settle('sudoku_mini', s.bet, false, 0, 8);
    document.getElementById('mgResult').innerHTML = `<div class="mg-loss">❌ Yanlış. Doğru çözüm:<br><code>${s.sol.join(',')}</code></div>`;
  }
};

console.log('[mini-oyunlar-2] 25 beceri/zeka oyunu yüklendi');
})();

/* ============================================================
   PvP UI — Render (mini-oyunlar sekmesinde gösterilir)
   ============================================================ */
if (typeof window.renderPvpSection === 'undefined'){
  window.renderPvpSection = async function(){
    const challenges = await dbGet('pvp') || {};
    const open = Object.values(challenges).filter(c=>c.status==='waiting' && c.creator !== GZ.uid);
    let html = `<div class="section-title">⚔️ PvP Meydan Okumalar</div>`;
    html += `<button class="btn-primary mb-12" style="width:100%" onclick="askCreatePvp()">+ Meydan Oku</button>`;
    if (open.length === 0){
      html += `<p class="small muted tac">Şu an açık meydan okuma yok</p>`;
    } else {
      for (const ch of open){
        html += `<div class="card">
          <div class="card-row">
            <div class="card-thumb">⚔️</div>
            <div class="card-body">
              <div class="card-title">${escapeHtml(ch.creatorName)}'nin Meydan Okuması</div>
              <div class="card-sub">Bahis: <b class="green">${cashFmt(ch.bet)}</b> × 2 = ${cashFmt(ch.bet*2*0.95)} (kazanç)</div>
            </div>
          </div>
          <button class="btn-primary mt-12" style="width:100%" onclick="joinPvpChallenge('${ch.id}').then(()=>render('oyunlar'))">Kabul Et</button>
        </div>`;
      }
    }
    return html;
  };
  window.askCreatePvp = function(){
    showModal('⚔️ Meydan Oku', `
      <p class="small muted mb-8">Bahis koy, rakip kabul etsin — zar atan kazanır. Kazanç %5 komisyon düşülür.</p>
      <div class="input-group">
        <label>Bahis Miktarı (₺)</label>
        <input type="number" id="pvpBet" value="1000" min="500" step="100">
      </div>
      <button class="btn-primary" onclick="createPvpChallenge(parseInt($('#pvpBet').value)).then(()=>{closeModal();render('oyunlar')})">Meydan Oku</button>
    `);
  };
}
