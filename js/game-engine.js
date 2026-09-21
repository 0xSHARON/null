/**
 * NULL - Uno-Inspired Game Engine
 * Features: Classic matching, turn direction inversion, skips, draw penalties,
 * wild color overrides, and the signature NULL card mechanic.
 */

class NullGame {
  constructor(listeners = {}) {
    this.listeners = listeners;
    this.players = [
      { id: 0, name: 'YOU', isBot: false, hand: [], hasCalledNull: false },
      { id: 1, name: 'BOT-ALPHA', isBot: true, hand: [], hasCalledNull: false },
      { id: 2, name: 'BOT-BETA', isBot: true, hand: [], hasCalledNull: false },
      { id: 3, name: 'BOT-OMEGA', isBot: true, hand: [], hasCalledNull: false }
    ];
    this.deck = [];
    this.discardPile = [];
    this.currentTurn = 0;
    this.direction = 1; // 1 = clockwise, -1 = counter-clockwise
    this.activeColor = 'red';
    this.activeValue = null;
    this.pendingDraws = 0;
    this.statusMessage = 'STARTING NEW ROUND. DUMP ALL POINTERS.';
    this.isProcessing = false;
    this.gameOver = false;
    this.winner = null;
  }

  emit(event, data) {
    if (this.listeners[event]) {
      this.listeners[event](data);
    }
  }

  shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  start() {
    this.deck = this.shuffle(buildDeck());
    this.discardPile = [];
    this.currentTurn = 0;
    this.direction = 1;
    this.pendingDraws = 0;
    this.gameOver = false;
    this.winner = null;
    this.isProcessing = false;

    // Deal 7 cards to each player
    this.players.forEach(p => {
      p.hand = [];
      p.hasCalledNull = false;
      for (let i = 0; i < 7; i++) {
        p.hand.push(this.drawFromDeck());
      }
    });

    // Flip top starting card (ensure not wild or null at start)
    let startCard = this.drawFromDeck();
    while (startCard.color === 'black' || startCard.type !== 'number') {
      this.deck.push(startCard);
      this.shuffle(this.deck);
      startCard = this.drawFromDeck();
    }

    this.discardPile.push(startCard);
    this.activeColor = startCard.color;
    this.activeValue = startCard.value;
    this.statusMessage = `GAME STARTED. ACTIVE COLOR: ${this.activeColor.toUpperCase()}`;

    this.emit('stateChange', this.getState());
  }

  drawFromDeck() {
    if (this.deck.length === 0) {
      if (this.discardPile.length <= 1) {
        // Emergency re-gen if all cards in hands
        this.deck = this.shuffle(buildDeck());
      } else {
        // Keep top card on discard, reshuffle rest
        const top = this.discardPile.pop();
        this.deck = this.shuffle(this.discardPile);
        this.discardPile = [top];
      }
    }
    return this.deck.pop();
  }

  isValidPlay(card) {
    if (!card) return false;
    // Wild and NULL cards can always be played
    if (card.color === 'black' || card.type === 'wild' || card.type === 'wild4' || card.type === 'null_wipe') {
      return true;
    }
    // Color matches active color
    if (card.color === this.activeColor) {
      return true;
    }
    // Number or action matches active value
    if (card.value === this.activeValue) {
      return true;
    }
    return false;
  }

  playerPlayCard(cardId, chosenColor = null) {
    if (this.currentTurn !== 0 || this.isProcessing || this.gameOver) return false;

    const player = this.players[0];
    const cardIndex = player.hand.findIndex(c => c.id === cardId);
    if (cardIndex === -1) return false;

    const card = player.hand[cardIndex];
    if (!this.isValidPlay(card)) {
      this.emit('invalidMove', { message: 'ILLEGAL MOVE. Color or digit mismatch.' });
      return false;
    }

    // If wild and color not chosen, notify caller to show picker
    if ((card.color === 'black' || card.type === 'wild' || card.type === 'wild4') && !chosenColor) {
      this.emit('chooseColorRequired', { card });
      return false;
    }

    // Execute card play
    player.hand.splice(cardIndex, 1);
    this.executeCardAction(player, card, chosenColor);
    return true;
  }

  playerDrawCard() {
    if (this.currentTurn !== 0 || this.isProcessing || this.gameOver) return;

    const player = this.players[0];

    // If there were pending draws from +2 or +4 and player couldn't counter
    if (this.pendingDraws > 0) {
      const drawn = [];
      for (let i = 0; i < this.pendingDraws; i++) {
        drawn.push(this.drawFromDeck());
      }
      player.hand.push(...drawn);
      this.statusMessage = `PENALTY INGESTED: +${this.pendingDraws} CARDS.`;
      this.pendingDraws = 0;
      this.advanceTurn();
      return;
    }

    const card = this.drawFromDeck();
    player.hand.push(card);
    this.statusMessage = `YOU DREW ${card.color.toUpperCase()} ${card.value.toUpperCase()}.`;
    
    // Check if newly drawn card is immediately playable
    if (this.isValidPlay(card)) {
      this.emit('playableDraw', { card });
    } else {
      this.advanceTurn();
    }
    this.emit('stateChange', this.getState());
  }

  callNull(playerId) {
    const p = this.players[playerId];
    if (p && p.hand.length <= 2) {
      p.hasCalledNull = true;
      this.statusMessage = `[ALARM] ${p.name} CALLED NULL! DUMP IMMINENT!`;
      this.emit('nullCalled', { player: p });
      this.emit('stateChange', this.getState());
    }
  }

  executeCardAction(player, card, chosenColor = null) {
    this.discardPile.push(card);
    this.activeValue = card.value;

    // If player has 1 card left and did not call NULL, add penalty
    if (player.hand.length === 1 && !player.hasCalledNull) {
      // 2 card penalty for failure to call NULL
      const penalty1 = this.drawFromDeck();
      const penalty2 = this.drawFromDeck();
      player.hand.push(penalty1, penalty2);
      this.statusMessage = `${player.name} FAILED TO DECLARE NULL! +2 PENALTY APPLIED.`;
    }

    // Reset call status if hand is not 1
    if (player.hand.length !== 1) {
      player.hasCalledNull = false;
    }

    // Check Win
    if (player.hand.length === 0) {
      this.gameOver = true;
      this.winner = player;
      this.statusMessage = `SYSTEM PURGE: ${player.name} WON THE ROUND!`;
      this.emit('gameOver', { winner: player });
      this.emit('stateChange', this.getState());
      return;
    }

    // Special card actions
    if (card.type === 'null_wipe') {
      // Signature NULL card: Nullifies all penalties, wipes color restriction to player's choice or neutral
      this.pendingDraws = 0;
      this.activeColor = chosenColor || (player.isBot ? this.botPickColor(player) : 'red');
      this.statusMessage = `${player.name} DEPLOYED NULL! BUFFER WIPED TO ${this.activeColor.toUpperCase()}.`;
      this.emit('nullWipe', { player });
      this.advanceTurn();
      return;
    }

    if (card.type === 'wild' || card.type === 'wild4') {
      this.activeColor = chosenColor || (player.isBot ? this.botPickColor(player) : 'red');
      if (card.type === 'wild4') {
        this.pendingDraws += 4;
        this.statusMessage = `${player.name} PLAYED WILD +4! NEW COLOR: ${this.activeColor.toUpperCase()}.`;
      } else {
        this.statusMessage = `${player.name} PLAYED WILD! NEW COLOR: ${this.activeColor.toUpperCase()}.`;
      }
      this.advanceTurn(card.type === 'wild4'); // wild4 also skips victim if applied
      return;
    }

    this.activeColor = card.color;

    if (card.value === 'skip') {
      this.statusMessage = `${player.name} SKIPPED THE NEXT THREAD!`;
      this.advanceTurn(true); // skip next
      return;
    }

    if (card.value === 'reverse') {
      this.direction *= -1;
      this.statusMessage = `TRAVERSAL INVERTED: DIRECTION IS NOW ${this.direction === 1 ? 'CLOCKWISE' : 'COUNTER-CLOCKWISE'}.`;
      if (this.players.length === 2) {
        this.advanceTurn(true);
      } else {
        this.advanceTurn(false);
      }
      return;
    }

    if (card.value === 'draw2') {
      this.pendingDraws += 2;
      this.statusMessage = `${player.name} INFLICTED +2 PENALTY!`;
      this.advanceTurn(true); // skip victim turn & apply penalty
      return;
    }

    this.statusMessage = `${player.name} PLAYED ${card.color.toUpperCase()} ${card.value.toUpperCase()}.`;
    this.advanceTurn(false);
  }

  advanceTurn(skipNext = false) {
    const total = this.players.length;
    let step = this.direction;
    if (skipNext) {
      step = this.direction * 2;
    }

    this.currentTurn = (this.currentTurn + step) % total;
    if (this.currentTurn < 0) {
      this.currentTurn += total;
    }

    this.emit('stateChange', this.getState());

    // If bot turn, schedule bot AI with human-like thought delay
    if (this.players[this.currentTurn].isBot && !this.gameOver) {
      this.scheduleBotTurn();
    }
  }

  scheduleBotTurn() {
    this.isProcessing = true;
    const bot = this.players[this.currentTurn];

    setTimeout(() => {
      if (this.gameOver) {
        this.isProcessing = false;
        return;
      }
      this.executeBotTurn(bot);
      this.isProcessing = false;
    }, 900 + Math.random() * 400);
  }

  botPickColor(bot) {
    const counts = { red: 0, yellow: 0, green: 0, blue: 0 };
    bot.hand.forEach(c => {
      if (counts[c.color] !== undefined) counts[c.color]++;
    });
    let best = 'red';
    let max = -1;
    for (const [col, count] of Object.entries(counts)) {
      if (count > max) {
        max = count;
        best = col;
      }
    }
    return best;
  }

  executeBotTurn(bot) {
    // If pending draws exist from +2 / +4 and bot doesn't counter
    if (this.pendingDraws > 0) {
      // Check if bot has NULL card to counter
      const nullCard = bot.hand.find(c => c.type === 'null_wipe');
      if (nullCard) {
        const botColor = this.botPickColor(bot);
        bot.hand.splice(bot.hand.indexOf(nullCard), 1);
        this.executeCardAction(bot, nullCard, botColor);
        return;
      }

      // Ingest penalty
      const drawn = [];
      for (let i = 0; i < this.pendingDraws; i++) {
        drawn.push(this.drawFromDeck());
      }
      bot.hand.push(...drawn);
      this.statusMessage = `${bot.name} INGESTED +${this.pendingDraws} CARDS.`;
      this.pendingDraws = 0;
      this.advanceTurn(false);
      return;
    }

    // Call NULL if bot has 2 cards (will have 1 card after play) with 85% probability
    if (bot.hand.length === 2 && Math.random() < 0.85) {
      this.callNull(bot.id);
    }

    // Find valid playable cards
    const validCards = bot.hand.filter(c => this.isValidPlay(c));

    if (validCards.length > 0) {
      // Prioritize: Actions/+2/Reverse first, then matching numbers, then Wilds as backup
      validCards.sort((a, b) => {
        if (a.color !== 'black' && b.color === 'black') return -1;
        if (a.color === 'black' && b.color !== 'black') return 1;
        if (a.type === 'action' && b.type === 'number') return -1;
        return 0;
      });

      const chosenCard = validCards[0];
      const botChosenColor = (chosenCard.color === 'black' || chosenCard.type === 'wild' || chosenCard.type === 'wild4')
        ? this.botPickColor(bot)
        : null;

      bot.hand.splice(bot.hand.indexOf(chosenCard), 1);
      this.executeCardAction(bot, chosenCard, botChosenColor);
    } else {
      // Draw card
      const newCard = this.drawFromDeck();
      bot.hand.push(newCard);
      this.statusMessage = `${bot.name} DREW A CARD.`;

      // Play immediately if valid
      if (this.isValidPlay(newCard)) {
        setTimeout(() => {
          if (this.gameOver) return;
          const botColor = (newCard.color === 'black') ? this.botPickColor(bot) : null;
          bot.hand.splice(bot.hand.indexOf(newCard), 1);
          this.executeCardAction(bot, newCard, botColor);
        }, 500);
      } else {
        this.advanceTurn(false);
      }
    }
  }

  getState() {
    return {
      players: this.players.map(p => ({
        id: p.id,
        name: p.name,
        isBot: p.isBot,
        cardCount: p.hand.length,
        hasCalledNull: p.hasCalledNull,
        hand: p.id === 0 ? p.hand : [] // only expose human hand
      })),
      topCard: this.discardPile[this.discardPile.length - 1] || null,
      activeColor: this.activeColor,
      activeValue: this.activeValue,
      direction: this.direction,
      currentTurn: this.currentTurn,
      pendingDraws: this.pendingDraws,
      deckCount: this.deck.length,
      discardCount: this.discardPile.length,
      statusMessage: this.statusMessage,
      isPlayerTurn: this.currentTurn === 0,
      gameOver: this.gameOver,
      winner: this.winner
    };
  }
}
