/**
 * NULL Card Game - Main Portal & Arena Controller
 */

const THEMES = {
  default:   { label: 'NULL — DEFAULT EDITION',   folder: './themes/default',   accent: '#ff3b30', preview: './themes/default/PREVIEW_NUMBERS.png' },
  pokemon:   { label: 'NULL — POKÉMON EDITION',    folder: './themes/pokemon',   accent: '#ffd60a', preview: './themes/pokemon/PREVIEW_NUMBERS.png' },
  naruto:    { label: 'NULL — NARUTO EDITION',     folder: './themes/naruto',    accent: '#ff6b00', preview: './themes/naruto/PREVIEW_NUMBERS.png' },
  minecraft: { label: 'NULL — MINECRAFT EDITION',  folder: './themes/minecraft', accent: '#3c7a34', preview: './themes/minecraft/PREVIEW_NUMBERS.png' },
  f1:        { label: 'NULL — FORMULA 1 EDITION',  folder: './themes/f1',        accent: '#e8002d', preview: './themes/f1/PREVIEW_NUMBERS.png' },
  football:  { label: 'NULL — FOOTBALL EDITION',   folder: './themes/football',  accent: '#1e8449', preview: './themes/football/PREVIEW_NUMBERS.png' },
};

let activeTheme = 'default';

/**
 * Returns the URL of the themed card image for a given card object.
 * File layout: themes/{theme}/{color}/{color}_{value}.png
 *              themes/{theme}/actions/{action_id}.png
 * Action file name mapping:
 *   draw2    → draw_2.png
 *   wild4    → wild_draw_4.png
 *   skip     → skip.png
 *   reverse  → reverse.png
 *   wild     → wild.png
 *   null     → null.png
 */
function getThemeCardUrl(card) {
  const t = THEMES[activeTheme];
  if (!t) return null;

  const base = t.folder;

  if (card.type === 'number') {
    // e.g. ./themes/pokemon/red/red_5.png
    return `${base}/${card.color}/${card.color}_${card.value}.png`;
  }

  // Action / wild / null
  const id = card.id || card.value;
  const ACTION_FILE = {
    skip:    'skip.png',
    reverse: 'reverse.png',
    draw2:   'draw_2.png',
    wild:    'wild.png',
    wild4:   'wild_draw_4.png',
    null:    'null.png',
  };
  const filename = ACTION_FILE[id];
  if (!filename) return null;
  return `${base}/actions/${filename}`;
}



document.addEventListener('DOMContentLoaded', () => {
  // Initialize UI components
  renderDeckExplorer();
  initTabNavigation();
  initFeaturedCardInspector();
  initThemeSwitcher();
  initGameArena();
});

/* ========================================================
   THEME SWITCHER
   ======================================================== */
function initThemeSwitcher() {
  const pills = document.querySelectorAll('.theme-pill');
  pills.forEach(pill => {
    pill.addEventListener('click', () => {
      const theme = pill.dataset.theme;
      if (theme === activeTheme) return;
      SFX.playClick();
      setTheme(theme);
    });
  });

  // Click poster to open fullscreen/lightbox
  const posterImg = document.getElementById('themed-poster-img');
  if (posterImg) {
    posterImg.addEventListener('click', () => {
      const t = THEMES[activeTheme];
      if (t && t.preview) window.open(t.preview, '_blank');
    });
  }
}

function setTheme(theme) {
  activeTheme = theme;
  const t = THEMES[theme];

  // Update pill active state
  document.querySelectorAll('.theme-pill').forEach(p => {
    p.classList.toggle('active', p.dataset.theme === theme);
  });

  // Apply theme to body for CSS-driven card back + accent colour
  document.body.dataset.theme = theme;
  document.documentElement.style.setProperty(
    '--theme-card-back',
    t.preview ? `url('${t.preview}')` : 'none'
  );
  document.documentElement.style.setProperty('--theme-accent', t.accent);

  const classicView  = document.getElementById('classic-deck-view');
  const themedView   = document.getElementById('themed-deck-view');
  const posterImg    = document.getElementById('themed-poster-img');
  const posterLabel  = document.getElementById('themed-poster-label');
  const deckHeadline = document.getElementById('deck-headline-text');
  const deckSubtitle = document.getElementById('deck-subtitle-text');

  if (theme === 'default') {
    classicView.style.display = '';
    themedView.style.display  = 'none';
    // Re-render deck explorer with default theme card art
    document.getElementById('number-cards-grid').innerHTML = '';
    document.getElementById('action-cards-grid').innerHTML = '';
    renderDeckExplorer();
    if (deckHeadline) deckHeadline.textContent = 'THE DECK';
    if (deckSubtitle) deckSubtitle.textContent = 'CLASSIC. CLEAN. CHAOTIC.';
  } else {
    classicView.style.display = 'none';
    themedView.style.display  = '';
    if (posterImg)   { posterImg.src = t.preview; posterImg.alt = t.label; }
    if (posterLabel) posterLabel.textContent = t.label;
    if (deckHeadline) deckHeadline.textContent = 'THE DECK — ' + theme.toUpperCase();
    if (deckSubtitle) deckSubtitle.textContent = t.label;
  }

  // Re-render arena hand cards if game is active (refreshes card art)
  if (typeof activeGame !== 'undefined' && activeGame && !activeGame.gameOver) {
    if (typeof renderArenaState === 'function') renderArenaState(activeGame.getState());
  }
}


/* ========================================================
   1. DECK EXPLORER GENERATOR
   ======================================================== */
function renderDeckExplorer() {
  const numberCardsContainer = document.getElementById('number-cards-grid');
  const actionCardsContainer = document.getElementById('action-cards-grid');

  if (!numberCardsContainer || !actionCardsContainer) return;

  // Render 4 Color Rows (0 to 9)
  COLORS.forEach(color => {
    const row = document.createElement('div');
    row.className = 'color-row';

    for (let num = 0; num <= 9; num++) {
      const cardEl = createCardElement({
        color: color,
        value: String(num),
        type: 'number'
      });

      // Hover / Click binds to Featured Inspector
      cardEl.addEventListener('mouseenter', () => updateFeaturedCard({
        color: color,
        value: String(num),
        type: 'number',
        name: `${color.toUpperCase()} ${num}`,
        title: `${color.toUpperCase()} ${num}`,
        lore: CARDS_DATA.numbers.find(n => n.value === String(num))?.description || 'Standard value card.',
        rule: `Matches any ${color.toUpperCase()} card or any other digit ${num}.`
      }));

      cardEl.addEventListener('click', () => {
        SFX.playClick();
        updateFeaturedCard({
          color: color,
          value: String(num),
          type: 'number',
          name: `${color.toUpperCase()} ${num}`,
          title: `${color.toUpperCase()} ${num}`,
          lore: CARDS_DATA.numbers.find(n => n.value === String(num))?.description || 'Standard value card.',
          rule: `Matches any ${color.toUpperCase()} card or any other digit ${num}.`
        });
      });

      row.appendChild(cardEl);
    }

    numberCardsContainer.appendChild(row);
  });

  // Render Action Cards row
  CARDS_DATA.actions.forEach(action => {
    const cardEl = createCardElement(action);

    cardEl.addEventListener('mouseenter', () => updateFeaturedCard(action));
    cardEl.addEventListener('click', () => {
      SFX.playActionGlitch();
      updateFeaturedCard(action);
    });

    actionCardsContainer.appendChild(cardEl);
  });
}

/**
 * Creates an HTML Uno card matching the exact brutalist reference design.
 * When a theme is active the card's interior is replaced with the sprite
 * artwork cropped from the themed poster image.
 */
function createCardElement(card) {
  const cardDiv = document.createElement('div');
  cardDiv.className = `uno-card card-${card.color}`;
  cardDiv.dataset.type = card.type || 'number';
  cardDiv.dataset.value = card.value || card.id;

  // ── Build inner markup (default brutalist text) ──────────────────────
  if (card.type === 'number') {
    cardDiv.innerHTML = `
      <div class="card-corner card-corner-tl">${card.value}</div>
      <div class="card-center-oval">
        <span class="card-center-val">${card.value}</span>
      </div>
      <div class="card-corner card-corner-br">${card.value}</div>
    `;
  } else if (card.id === 'skip' || card.value === 'skip') {
    cardDiv.innerHTML = `
      <div class="action-card-name-top">SKIP</div>
      <div class="card-center-oval">
        <span class="card-action-symbol" style="color: #d62828;">⊘</span>
      </div>
      <div class="action-card-name-bot">SKIP</div>
    `;
  } else if (card.id === 'reverse' || card.value === 'reverse') {
    cardDiv.innerHTML = `
      <div class="action-card-name-top">REVERSE</div>
      <div class="card-center-oval">
        <span class="card-action-symbol" style="color: #000;">⇄</span>
      </div>
      <div class="action-card-name-bot">REVERSE</div>
    `;
  } else if (card.id === 'draw2' || card.value === 'draw2') {
    cardDiv.innerHTML = `
      <div class="action-card-name-top">+2</div>
      <div class="card-center-oval">
        <span class="card-action-symbol" style="color: #059669; font-size: 1.5rem;">+2</span>
      </div>
      <div class="action-card-name-bot">+2</div>
    `;
  } else if (card.id === 'wild' || card.value === 'wild') {
    cardDiv.innerHTML = `
      <div class="action-card-name-top" style="color:#fff;">WILD</div>
      <div class="wild-pie-badge">
        <div class="wild-pie-red"></div>
        <div class="wild-pie-blue"></div>
        <div class="wild-pie-yellow"></div>
        <div class="wild-pie-green"></div>
      </div>
      <div class="action-card-name-bot" style="color:#fff;">WILD</div>
    `;
  } else if (card.id === 'wild4' || card.value === 'wild4') {
    cardDiv.innerHTML = `
      <div class="action-card-name-top" style="color:#fff;">WILD +4</div>
      <div class="wild-fan-graphic">
        <div class="fan-mini-card fan-c1"></div>
        <div class="fan-mini-card fan-c2"></div>
        <div class="fan-mini-card fan-c3"></div>
        <div class="fan-mini-card fan-c4"></div>
      </div>
      <div class="action-card-name-bot" style="color:#fff;">WILD +4</div>
    `;
  } else if (card.id === 'null' || card.value === 'null') {
    cardDiv.innerHTML = `
      <div class="action-card-name-top" style="color:#ff3b30;">NULL</div>
      <div class="null-cross-symbol">✕</div>
      <div class="action-card-name-bot" style="color:#ff3b30;">NULL</div>
    `;
  }

  // ── Direct themed card image overlay ────────────────────────────────
  const cardUrl = getThemeCardUrl(card);
  if (cardUrl) {
    const overlay = document.createElement('div');
    overlay.className = 'card-theme-sprite-overlay';
    overlay.style.backgroundImage    = `url('${cardUrl}')`;
    overlay.style.backgroundSize     = '100% 100%';
    overlay.style.backgroundPosition = 'center';
    overlay.style.backgroundRepeat   = 'no-repeat';
    cardDiv.appendChild(overlay);
    cardDiv.classList.add('has-theme-sprite');
  }

  return cardDiv;
}



/* ========================================================
   2. FEATURED CARD INSPECTOR
   ======================================================== */
function initFeaturedCardInspector() {
  // Default to WILD card as seen in the visual reference
  const defaultWild = CARDS_DATA.actions.find(a => a.id === 'wild');
  updateFeaturedCard(defaultWild);
}

function updateFeaturedCard(card) {
  const container = document.getElementById('featured-card-target');
  const titleEl = document.getElementById('featured-card-title');
  const descEl = document.getElementById('featured-card-desc');

  if (!container || !titleEl || !descEl) return;

  container.innerHTML = '';
  const cardClone = createCardElement(card);
  container.appendChild(cardClone);

  titleEl.textContent = card.name || card.title || 'CARD';
  descEl.innerHTML = `
    <strong>${card.title || card.name}</strong><br><br>
    ${card.lore || ''}<br><br>
    <span style="color: #ff3b30;">RULE:</span> ${card.rule || 'Follow standard color or digit matching.'}
  `;
}

/* ========================================================
   3. TAB NAVIGATION
   ======================================================== */
function initTabNavigation() {
  const tabButtons = document.querySelectorAll('.tab-btn');
  const panels = document.querySelectorAll('.tab-content-panel');

  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      SFX.playClick();
      tabButtons.forEach(b => b.classList.remove('active'));
      panels.forEach(p => p.classList.remove('active'));

      btn.classList.add('active');
      const targetId = btn.dataset.target;
      const targetPanel = document.getElementById(targetId);
      if (targetPanel) {
        targetPanel.classList.add('active');
      }
    });
  });

  // Left sidebar navigation links
  const sidebarLinks = document.querySelectorAll('.sidebar-left .nav-link');
  sidebarLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      SFX.playClick();
      sidebarLinks.forEach(l => l.classList.remove('active'));
      link.classList.add('active');

      const action = link.dataset.action;
      if (action === 'play') {
        openArena();
      } else if (action === 'cards') {
        activateTab('tab-cards');
      } else if (action === 'rules') {
        activateTab('tab-rules');
      } else if (action === 'home') {
        activateTab('tab-cards');
      } else if (action === 'leaderboard') {
        activateTab('tab-leaderboard');
      }
    });
  });
}

function activateTab(tabId) {
  const tabBtn = document.querySelector(`.tab-btn[data-target="${tabId}"]`);
  if (tabBtn) {
    tabBtn.click();
  }
}

/* ========================================================
   4. PLAYABLE UNO GAME ARENA
   ======================================================== */
let activeGame = null;
let pendingWildCard = null;

function initGameArena() {
  const arenaOverlay = document.getElementById('game-arena-modal');
  const btnClose = document.getElementById('btn-close-arena');
  const btnPlayTop = document.getElementById('btn-play-top');
  const btnPlayDiscord = document.getElementById('btn-play-discord');
  const btnCreateLobby = document.getElementById('btn-create-lobby');
  const btnMute = document.getElementById('btn-arena-mute');
  const btnRestart = document.getElementById('btn-restart-game');
  const btnCallNull = document.getElementById('btn-call-null');
  const drawDeckPile = document.getElementById('arena-draw-pile');

  if (btnPlayTop) btnPlayTop.addEventListener('click', openArena);
  if (btnPlayDiscord) btnPlayDiscord.addEventListener('click', openArena);
  if (btnCreateLobby) btnCreateLobby.addEventListener('click', openArena);
  if (btnClose) btnClose.addEventListener('click', closeArena);

  if (btnMute) {
    btnMute.addEventListener('click', () => {
      const isMuted = SFX.toggleMute();
      btnMute.textContent = isMuted ? 'AUDIO: OFF' : 'AUDIO: ON';
    });
  }

  if (btnRestart) {
    btnRestart.addEventListener('click', () => {
      const gameoverDialog = document.getElementById('gameover-modal');
      if (gameoverDialog) gameoverDialog.classList.remove('active');
      startNewArenaGame();
    });
  }

  if (btnCallNull) {
    btnCallNull.addEventListener('click', () => {
      if (activeGame) {
        SFX.playAlert();
        activeGame.callNull(0);
      }
    });
  }

  if (drawDeckPile) {
    drawDeckPile.addEventListener('click', () => {
      if (activeGame && activeGame.currentTurn === 0) {
        SFX.playDeal();
        activeGame.playerDrawCard();
      }
    });
  }

  // Wild Color Picker buttons
  document.querySelectorAll('.color-picker-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const chosenColor = btn.dataset.color;
      const picker = document.getElementById('color-picker-modal');
      if (picker) picker.classList.remove('active');

      if (activeGame && pendingWildCard) {
        SFX.playCardSnap();
        activeGame.playerPlayCard(pendingWildCard.id, chosenColor);
        pendingWildCard = null;
      }
    });
  });
}

function openArena() {
  SFX.init();
  SFX.playDeal();
  const arenaOverlay = document.getElementById('game-arena-modal');
  if (arenaOverlay) {
    arenaOverlay.classList.add('active');
  }
  startNewArenaGame();
}

function closeArena() {
  SFX.playClick();
  const arenaOverlay = document.getElementById('game-arena-modal');
  if (arenaOverlay) {
    arenaOverlay.classList.remove('active');
  }
}

function startNewArenaGame() {
  activeGame = new NullGame({
    stateChange: renderArenaState,
    chooseColorRequired: ({ card }) => {
      pendingWildCard = card;
      const picker = document.getElementById('color-picker-modal');
      if (picker) picker.classList.add('active');
    },
    invalidMove: ({ message }) => {
      SFX.playAlert();
      const ticker = document.getElementById('arena-ticker');
      if (ticker) ticker.textContent = `[!] ${message}`;
    },
    nullWipe: () => {
      SFX.playNullWipe();
    },
    gameOver: ({ winner }) => {
      SFX.playVictory();
      const modal = document.getElementById('gameover-modal');
      const title = document.getElementById('gameover-winner-title');
      const desc = document.getElementById('gameover-winner-desc');
      if (modal && title && desc) {
        title.textContent = winner.id === 0 ? 'VICTORY — SYSTEM DEALLOCATED' : `${winner.name} CONQUERED`;
        desc.textContent = winner.id === 0 
          ? 'You successfully dumped all your pointers to null before the bots.'
          : `${winner.name} dumped their hand first. Run execution cycle again.`;
        modal.classList.add('active');
      }
    }
  });

  activeGame.start();
}

function renderArenaState(state) {
  // Update Ticker
  const ticker = document.getElementById('arena-ticker');
  if (ticker) ticker.textContent = state.statusMessage;

  // Update Turn Direction
  const dirBadge = document.getElementById('arena-dir-badge');
  if (dirBadge) {
    dirBadge.textContent = state.direction === 1 ? 'TRAVERSAL: ↻ CLOCKWISE' : 'TRAVERSAL: ↺ COUNTER-CLOCKWISE';
  }

  // Update Bot Seats
  state.players.forEach(p => {
    if (p.isBot) {
      const seatEl = document.getElementById(`bot-seat-${p.id}`);
      if (seatEl) {
        if (state.currentTurn === p.id) {
          seatEl.classList.add('turn-active');
        } else {
          seatEl.classList.remove('turn-active');
        }
        const countEl = seatEl.querySelector('.bot-card-count');
        if (countEl) countEl.textContent = `${p.cardCount} CARDS`;

        // Render mini card backs
        const fanEl = seatEl.querySelector('.bot-cards-fan');
        if (fanEl) {
          fanEl.innerHTML = '';
          const displayCount = Math.min(p.cardCount, 8);
          for (let i = 0; i < displayCount; i++) {
            const cardBack = document.createElement('div');
            cardBack.className = 'card-back-mini';
            fanEl.appendChild(cardBack);
          }
        }
      }
    }
  });

  // Update Discard Pile Top Card
  const discardContainer = document.getElementById('arena-discard-pile');
  if (discardContainer && state.topCard) {
    discardContainer.innerHTML = '';
    const topCardEl = createCardElement(state.topCard);
    discardContainer.appendChild(topCardEl);
  }

  // Update Active Color Indicator
  const colorSwatch = document.getElementById('active-color-swatch');
  const colorLabel = document.getElementById('active-color-label');
  if (colorSwatch && colorLabel) {
    colorSwatch.style.background = COLOR_HEX[state.activeColor] || '#fff';
    colorLabel.textContent = `COLOR: ${state.activeColor.toUpperCase()}`;
  }

  // Update Player Hand
  const playerHandContainer = document.getElementById('player-cards-hand');
  if (playerHandContainer) {
    playerHandContainer.innerHTML = '';
    const player = state.players[0];

    player.hand.forEach(card => {
      const cardEl = createCardElement(card);
      const isPlayable = activeGame.isValidPlay(card);

      if (state.isPlayerTurn && isPlayable) {
        cardEl.classList.add('playable');
      } else {
        cardEl.classList.add('unplayable');
      }

      cardEl.addEventListener('click', () => {
        if (state.isPlayerTurn) {
          SFX.playCardSnap();
          activeGame.playerPlayCard(card.id);
        }
      });

      playerHandContainer.appendChild(cardEl);
    });
  }

  // Update Deck count label
  const deckCountText = document.getElementById('deck-count-text');
  if (deckCountText) {
    deckCountText.textContent = `${state.deckCount} CARDS`;
  }
}
