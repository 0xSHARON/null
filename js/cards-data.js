/**
 * NULL Card Game - Card Definitions & Lore
 */

const COLORS = ['red', 'yellow', 'green', 'blue'];
const COLOR_HEX = {
  red: '#e63946',
  yellow: '#f4c430',
  green: '#10b981',
  blue: '#0284c7',
  black: '#111113'
};

const CARDS_DATA = {
  numbers: [
    { value: '0', count: 1, type: 'number', description: 'Zero pointer. Safe, stable, and the ultimate destination of any memory deallocation.' },
    { value: '1', count: 2, type: 'number', description: 'Single entity. One card away from victory or one mistake from complete chaos.' },
    { value: '2', count: 2, type: 'number', description: 'Binary pair. The foundation of all digital logic and early game pacing.' },
    { value: '3', count: 2, type: 'number', description: 'Triad balance. Creates offensive momentum across identical color stacks.' },
    { value: '4', count: 2, type: 'number', description: 'Quarter mark. Predictable yet dangerous when comboed with suit changes.' },
    { value: '5', count: 2, type: 'number', description: 'Median digit. Splits the table and sets up color-locking traps.' },
    { value: '6', count: 2, type: 'number', description: 'High frequency. Often mistaken for nine in the heat of fast-paced rounds.' },
    { value: '7', count: 2, type: 'number', description: 'Lucky prime. In some alternate house rules, forces card swaps across the board.' },
    { value: '8', count: 2, type: 'number', description: 'Infinity rotated. Maximum standard power card before the single-digit ceiling.' },
    { value: '9', count: 2, type: 'number', description: 'Peak value. Heavy penalty points if caught in your hand when round concludes.' }
  ],
  actions: [
    {
      id: 'skip',
      name: 'SKIP',
      symbol: '⊘',
      color: 'red',
      type: 'action',
      title: 'SKIP — HALT EXECUTION',
      lore: 'Immediately suppresses the next player’s turn. Execution skips the target thread without evaluation.',
      rule: 'Next player in turn order forfeits their turn immediately.'
    },
    {
      id: 'reverse',
      name: 'REVERSE',
      symbol: '⇄',
      color: 'yellow',
      type: 'action',
      title: 'REVERSE — INVERT TRAVERSAL',
      lore: 'Flips clock cycle direction. Turns predator into prey in a single microsecond.',
      rule: 'Inverts current play direction (clockwise ↔ counter-clockwise).'
    },
    {
      id: 'draw2',
      name: '+2',
      symbol: '+2',
      color: 'green',
      type: 'action',
      title: '+2 — MEMORY OVERFLOW',
      lore: 'Forces the succeeding player to ingest 2 additional card pointers and sacrifice their turn.',
      rule: 'Next player must draw 2 cards and skip their turn.'
    },
    {
      id: 'wild',
      name: 'WILD',
      symbol: 'WILD',
      color: 'black',
      type: 'wild',
      title: 'WILD — COLOR OVERRIDE',
      lore: 'Universal polymorphic adapter. Can be deployed on any card regardless of color or digit.',
      rule: 'Play on any turn. The player declares the active color for the next round of plays.'
    },
    {
      id: 'wild4',
      name: 'WILD +4',
      symbol: '+4',
      color: 'black',
      type: 'wild4',
      title: 'WILD +4 — SEGMENTATION FAULT',
      lore: 'The apex offensive weapon. Blasts four incoming penalty cards and rewires the active color spectrum.',
      rule: 'Play on any turn. Next player draws 4 cards and loses their turn. You declare new active color.'
    },
    {
      id: 'null',
      name: 'NULL',
      symbol: 'X',
      color: 'black',
      type: 'null_wipe',
      title: 'NULL — SYSTEM RESET',
      lore: 'The namesake anomaly. Wipes the active penalty buffer, purges the discard history, and zeros all pending penalties.',
      rule: 'Universal counter. Can be played anytime to nullify active +2/+4 attacks or reset the table stack to neutral.'
    }
  ]
};

// Full standard 108 card deck generator
function buildDeck() {
  const deck = [];
  let id = 1;

  COLORS.forEach(color => {
    // One 0 per color
    deck.push({ id: `c_${id++}`, color, value: '0', type: 'number' });
    
    // Two 1-9 per color
    for (let num = 1; num <= 9; num++) {
      deck.push({ id: `c_${id++}`, color, value: String(num), type: 'number' });
      deck.push({ id: `c_${id++}`, color, value: String(num), type: 'number' });
    }
    
    // Two of each action per color
    ['skip', 'reverse', 'draw2'].forEach(act => {
      deck.push({ id: `c_${id++}`, color, value: act, type: 'action' });
      deck.push({ id: `c_${id++}`, color, value: act, type: 'action' });
    });
  });

  // Wild cards: 4 Wild, 4 Wild+4, 2 NULL cards
  for (let i = 0; i < 4; i++) {
    deck.push({ id: `c_${id++}`, color: 'black', value: 'wild', type: 'wild' });
    deck.push({ id: `c_${id++}`, color: 'black', value: 'wild4', type: 'wild4' });
  }
  for (let i = 0; i < 2; i++) {
    deck.push({ id: `c_${id++}`, color: 'black', value: 'null', type: 'null_wipe' });
  }

  return deck;
}
