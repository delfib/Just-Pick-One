const WIN_PHRASES = [
  "The cosmos have aligned. This is your destiny.",
  "The stars don't lie. Trust the process.",
  "Resistance is futile. This was always the answer.",
  "The universe chose wisely. As always.",
  "Written in the stars since the beginning. Congrats.",
  "The planets aligned just for this decision.",
  "Cosmic forces have reached a consensus.",
  "This path was inevitable.",
  "I checked with the universe. It didn't hesitate.",
  "We asked the stars. They rolled their eyes and picked this.",
  "Blame the universe, not us.",
  "Trust us. Or don't. But this is the answer.",
];

const REDECIDE_PHRASES = [
  "Are you seriously questioning the universe right now?",
  "The cosmos are disappointed. Do you really want to proceed?",
  "WARNING: Going against fate may cause chaos.",
  "Oh honey... the universe doesn't do do-overs.",
  "You sure? Mercury is in retrograde, or whatever.",
  "The universe is watching. Still want to re-roll?",
  "The stars chose FOR you. Don't be ungrateful.",
  "Rejecting fate has consequences. Just sayin'.",
  "Fine. But don't blame us when it all goes wrong.",
  "The cosmos have spoken. Are you SURE about this?",
  "Woah. Trust issues already?",
  "You asked for an answer, not a debate.",
  "Bold of you to doubt us.",
  "We literally JUST decided.",
  "Second-guessing? Classic.",
  "Okay, but this is on you.",
  "This is why decisions hate you.",
  "You can re-roll, but we'll judge silently.",
  "You're going to re-roll until it says what you want, aren't you?",
  "Let's be honest, you already had a favorite.",
  "This is exactly why this site exists. *rolling my eyes*",
];

const ORACLE_STATUS_MESSAGES = [
  "The universe is consulting the stars…",
  "Weighing the cosmic forces…",
  "Reading the galactic currents…",
  "The oracle is meditating…",
  "Aligning the celestial bodies…",
];

let currentOptions  = [];
let optionCount     = 2;
let isConfirmMode   = false;
let orbitAnimFrame  = null;   // requestAnimationFrame handle for orbit loop
let orbitAngles     = [];     // current angle (radians) for each pill
let orbitSpeeds     = [];     // radians per frame for each pill


/* ============================================================
   STARS CANVAS
   Draws a twinkling, drifting starfield on a <canvas>.
   ============================================================ */

(function initStars() {
  const canvas = document.getElementById('starsCanvas');
  const ctx    = canvas.getContext('2d');
  let stars    = [];
  let W, H;

  function resize() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
    buildStars();
  }

  function buildStars() {
    stars = [];
    const count = Math.floor((W * H) / 3500);
    for (let i = 0; i < count; i++) {
      stars.push(makeStar());
    }
  }

  function makeStar() {
    const angle = Math.random() * Math.PI * 2;
    const speed = 0.009 + Math.random() * 0.05;
    return {
      x:            Math.random() * W,
      y:            Math.random() * H,
      r:            Math.random() * 1.5 + 0.2,
      vx:           Math.cos(angle) * speed,
      vy:           Math.sin(angle) * speed,
      phase:        Math.random() * Math.PI * 2,
      twinkleSpeed: 0.004 + Math.random() * 0.018,
      hue:          Math.random() > 0.8 ? (Math.random() > 0.5 ? 255 + Math.random() * 40 : 300 + Math.random() * 30) : 0,
      sat:          Math.random() > 0.8 ? 50 + Math.random() * 30 : 0,
    };
  }

  function drawStars() {
    ctx.clearRect(0, 0, W, H);
    stars.forEach(s => {
      s.x += s.vx;
      s.y += s.vy;
      if (s.x < -4)  s.x = W + 4;
      if (s.x > W+4) s.x = -4;
      if (s.y < -4)  s.y = H + 4;
      if (s.y > H+4) s.y = -4;

      s.phase += s.twinkleSpeed;
      const t     = (Math.sin(s.phase) + 1) / 2;
      const alpha = 0.15 + 0.85 * t;
      const r     = s.r * (0.85 + 0.15 * t);

      ctx.beginPath();
      ctx.arc(s.x, s.y, r, 0, Math.PI * 2);
      ctx.fillStyle = s.sat
        ? `hsla(${s.hue}, ${s.sat}%, 92%, ${alpha})`
        : `rgba(255, 255, 255, ${alpha})`;
      ctx.fill();
    });
    requestAnimationFrame(drawStars);
  }

  window.addEventListener('resize', resize);
  resize();
  requestAnimationFrame(drawStars);
})();


/* ============================================================
   ADDING & REMOVING OPTIONS
   ============================================================ */

function addOption() {
  optionCount++;
  const list = document.getElementById('optionsList');
  const row  = document.createElement('div');
  row.className = 'option-row';
  row.innerHTML = `
    <input type="text" placeholder="Option ${optionCount}" class="option-input">
    <button class="remove-btn" onclick="removeOption(this)" title="Remove">×</button>
  `;
  list.appendChild(row);
}

function removeOption(button) {
  const allRows = document.querySelectorAll('.option-row');
  if (allRows.length <= 2) return;
  button.closest('.option-row').remove();
}


/* ============================================================
   DECISION FLOW
   ============================================================ */
function decide() {
  const question     = document.getElementById('question').value.trim();
  const optionInputs = document.querySelectorAll('.option-input');
  const options      = Array.from(optionInputs)
                         .map(i => i.value.trim())
                         .filter(v => v !== '');

  if (!question || options.length < 2) {
    showError();
    return;
  }

  currentOptions = options;
  const chosenIndex = Math.floor(Math.random() * options.length);

  showScreen('oracle-screen');
  runOracleAnimation(options, chosenIndex, question);
}


/* ============================================================
   ORACLE ANIMATION
   Options orbit the central core, then the winner is chosen.
   ============================================================ */

function runOracleAnimation(options, chosenIndex, question) {
  const arena    = document.getElementById('orbitContainer');
  const statusEl = document.getElementById('oracleStatus');
  arena.innerHTML = '';

  const ORBIT_RADIUS   = 120;   // px from center of arena
  const ORBIT_DURATION = 2800;  // ms the orbiting phase lasts

  // Spread pills evenly and give each a slightly different speed
  orbitAngles = options.map((_, i) => (i / options.length) * Math.PI * 2);
  orbitSpeeds = options.map(() => 0.012 + Math.random() * 0.008);

  // Build the pill elements
  const pills = options.map((text) => {
    const pill = document.createElement('div');
    pill.className   = 'orbit-pill';
    pill.textContent = text;
    arena.appendChild(pill);
    return pill;
  });

  // --- Status messages ---
  // Shuffle so the sequence is different every time
  const shuffled = [...ORACLE_STATUS_MESSAGES].sort(() => Math.random() - 0.5);

  // Divide ORBIT_DURATION evenly: one slot per message + 1 final slot for "The universe has decided"
  // e.g. 5 messages + 1 final = 6 slots → each slot = ~467ms
  const MESSAGE_INTERVAL = ORBIT_DURATION / (shuffled.length + 1);

  let statusIndex = 0;
  statusEl.textContent = shuffled[0];  // show first message immediately

  const statusInterval = setInterval(() => {
    statusIndex++;
    // Cycle through the shuffled messages only — the final slot is left empty
    // so "The universe has decided" appears cleanly at the very end
    if (statusIndex < shuffled.length) {
      statusEl.textContent = shuffled[statusIndex];
    }
  }, MESSAGE_INTERVAL);

  // Animation loop: move each pill along its orbit
  function animateOrbit() {
    pills.forEach((pill, i) => {
      orbitAngles[i] += orbitSpeeds[i];
      const x = Math.cos(orbitAngles[i]) * ORBIT_RADIUS;
      const y = Math.sin(orbitAngles[i]) * ORBIT_RADIUS;
      pill.style.transform = `translate(calc(${x}px - 50%), calc(${y}px - 50%))`;
    });
    orbitAnimFrame = requestAnimationFrame(animateOrbit);
  }

  animateOrbit();

  // After ORBIT_DURATION: stop orbiting, pick the winner, dismiss the rest
  setTimeout(() => {
    clearInterval(statusInterval);
    cancelAnimationFrame(orbitAnimFrame);

    // "The universe has decided" appears exactly once, right here
    statusEl.textContent = 'The universe has decided…';

    // Highlight winner
    pills[chosenIndex].classList.add('chosen');

    // Drift losers outward and fade them out
    pills.forEach((pill, i) => {
      if (i !== chosenIndex) {
        pill.classList.add('dismissed');
        const dx = Math.cos(orbitAngles[i]) * 200;
        const dy = Math.sin(orbitAngles[i]) * 200;
        pill.style.transform += ` translate(${dx}px, ${dy}px)`;
      }
    });

    // Zoom winner to center
    setTimeout(() => {
      pills[chosenIndex].style.transition = 'transform 0.7s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
      pills[chosenIndex].style.transform  = 'translate(-50%, -50%)';
    }, 300);

    // Show result screen
    setTimeout(() => {
      showResult(options[chosenIndex], question);
    }, 1200);

  }, ORBIT_DURATION);
}


/* ============================================================
   RESULT SCREEN
   ============================================================ */

function showResult(chosen, question) {
  const phrase = pickRandom(WIN_PHRASES);

  document.getElementById('questionDisplay').textContent = `"${question}"`;
  document.getElementById('chosenAnswer').textContent    = chosen;
  document.getElementById('funPhrase').textContent       = phrase;

  resetRedecideButton();
  showScreen('result-screen');

  // Trigger shockwave ripple
  const shockwave = document.getElementById('shockwave');
  shockwave.classList.remove('active');
  void shockwave.offsetWidth; // force reflow so animation restarts
  shockwave.classList.add('active');
}


/* ============================================================
   RE-DECIDE & RESTART
   ============================================================ */

function handleRedecide() {
  const btn = document.getElementById('redecideBtn');

  if (!isConfirmMode) {
    // First click: show snarky confirmation phrase
    btn.textContent = pickRandom(REDECIDE_PHRASES);
    btn.classList.add('confirm-mode');
    isConfirmMode = true;
  } else {
    // Second click: re-run oracle with same options
    const question    = document.getElementById('questionDisplay').textContent.replace(/^"|"$/g, '');
    const chosenIndex = Math.floor(Math.random() * currentOptions.length);
    showScreen('oracle-screen');
    runOracleAnimation(currentOptions, chosenIndex, question);
    resetRedecideButton();
  }
}

function restart() {
  cancelAnimationFrame(orbitAnimFrame);
  document.getElementById('question').value = '';
  document.querySelectorAll('.option-input').forEach(input => input.value = '');
  currentOptions = [];
  isConfirmMode  = false;
  showScreen('form-screen');
}


/* ============================================================
   HELPERS
   ============================================================ */

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function showScreen(screenId) {
  ['form-screen', 'oracle-screen', 'result-screen'].forEach(id => {
    document.getElementById(id).style.display = id === screenId ? 'flex' : 'none';
  });
}

function resetRedecideButton() {
  const btn = document.getElementById('redecideBtn');
  btn.textContent = '↺ Re-decide';
  btn.classList.remove('confirm-mode');
  isConfirmMode = false;
}

function showError() {
  const msg = document.getElementById('errorMsg');
  msg.style.display = 'block';
  setTimeout(() => msg.style.display = 'none', 3000);
}