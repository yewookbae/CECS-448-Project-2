const suits = [
  { symbol: '♠', name: 'spades', color: 'black' },
  { symbol: '♥', name: 'hearts', color: 'red' },
  { symbol: '♦', name: 'diamonds', color: 'red' },
  { symbol: '♣', name: 'clubs', color: 'black' },
];
const ranks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
const players = [
  { name: 'Player One', key: 'one', cards: [], stood: false, busted: false, result: null, bankroll: 2500, bet: 0, roundBet: 0 },
  { name: 'Player Two', key: 'two', cards: [], stood: false, busted: false, result: null, bankroll: 2500, bet: 0, roundBet: 0 },
];

let deck = [];
let dealerCards = [];
let activePlayer = 0;
let roundNumber = 0;
let roundOver = true;
let hideDealerHoleCard = false;
let dealerResult = null;

const elements = {
  start: document.querySelector('#start-button'),
  hit: document.querySelector('#hit-button'),
  stand: document.querySelector('#stand-button'),
  rulesButton: document.querySelector('#rules-button'),
  rulesPanel: document.querySelector('#rules-panel'),
  dealerCards: document.querySelector('#dealer-cards'),
  dealerArea: document.querySelector('.dealer-area'),
  dealerScore: document.querySelector('#dealer-score'),
  dealerCaption: document.querySelector('#dealer-caption'),
  turnText: document.querySelector('#turn-text'),
  turnDot: document.querySelector('#turn-dot'),
  roundCount: document.querySelector('#round-count'),
  announcer: document.querySelector('#announcer'),
};
const money = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

function createDeck() {
  const cards = [];
  for (const suit of suits) {
    for (const rank of ranks) cards.push({ rank, ...suit });
  }
  for (let i = cards.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [cards[i], cards[j]] = [cards[j], cards[i]];
  }
  return cards;
}

function drawCard() {
  if (deck.length === 0) deck = createDeck();
  return deck.pop();
}

function handValue(cards) {
  let total = 0;
  let aces = 0;
  for (const card of cards) {
    if (card.rank === 'A') {
      total += 11;
      aces += 1;
    } else if (['J', 'Q', 'K'].includes(card.rank)) {
      total += 10;
    } else {
      total += Number(card.rank);
    }
  }
  while (total > 21 && aces > 0) {
    total -= 10;
    aces -= 1;
  }
  return total;
}

function cardLabel(card) {
  const rankNames = { A: 'Ace', J: 'Jack', Q: 'Queen', K: 'King' };
  return `${rankNames[card.rank] || card.rank} of ${card.name}`;
}

function renderCard(card, hidden = false) {
  const article = document.createElement('div');
  if (hidden) {
    article.className = 'card card-back';
    article.setAttribute('aria-label', 'Face-down card');
    article.setAttribute('role', 'img');
    article.innerHTML = '<span aria-hidden="true">21</span>';
    return article;
  }
  article.className = `card${card.color === 'red' ? ' red' : ''}`;
  article.setAttribute('role', 'img');
  article.setAttribute('aria-label', cardLabel(card));
  article.innerHTML = `<span class="card-rank" aria-hidden="true">${card.rank}</span><span class="card-suit" aria-hidden="true">${card.symbol}</span><span class="card-corner" aria-hidden="true">${card.rank}${card.symbol}</span>`;
  return article;
}

function renderHand(container, cards, hiddenIndex = -1) {
  container.replaceChildren();
  cards.forEach((card, index) => container.append(renderCard(card, index === hiddenIndex)));
}

function updateView() {
  renderHand(elements.dealerCards, dealerCards, hideDealerHoleCard ? 1 : -1);
  const dealerVisibleCards = hideDealerHoleCard ? dealerCards.slice(0, 1) : dealerCards;
  elements.dealerScore.textContent = dealerCards.length ? handValue(dealerVisibleCards) : '—';
  elements.dealerArea.classList.toggle('house-winner', roundOver && dealerResult === 'win');
  elements.dealerArea.classList.toggle('house-loser', roundOver && dealerResult === 'lose');
  elements.dealerArea.classList.toggle('house-push', roundOver && dealerResult === 'push');
  elements.dealerCaption.textContent = hideDealerHoleCard
    ? 'One card showing'
    : dealerResult === 'win' ? 'HOUSE WINS'
      : dealerResult === 'lose' ? 'HOUSE LOSES'
        : dealerResult === 'mixed' ? 'HOUSE WINS 1 · LOSES 1'
        : dealerResult === 'push' ? 'PUSH · BETS RETURNED' : 'House hand';

  players.forEach((player, index) => {
    const handElement = document.querySelector(`#player-${player.key}-area`);
    const cardsElement = document.querySelector(`#player-${player.key}-cards`);
    const scoreElement = document.querySelector(`#player-${player.key}-score`);
    const captionElement = document.querySelector(`#player-${player.key}-caption`);
    document.querySelector(`#balance-${player.key}`).textContent = money.format(player.bankroll);
    document.querySelector(`#wager-${player.key}`).textContent = money.format(player.bet);
    renderHand(cardsElement, player.cards);
    scoreElement.textContent = player.cards.length ? handValue(player.cards) : '—';
    handElement.classList.toggle('active', !roundOver && index === activePlayer);
    handElement.classList.toggle('finished', roundOver || player.stood || player.busted);
    handElement.classList.toggle('winner', roundOver && player.result === 'win');
    handElement.classList.toggle('loser', roundOver && player.result === 'lose');
    handElement.classList.toggle('push', roundOver && player.result === 'push');
    if (roundOver && player.result === 'win') captionElement.textContent = `WINNER · ${handValue(player.cards)} POINTS`;
    else if (roundOver && player.result === 'lose') captionElement.textContent = player.busted ? 'BUST · YOU LOSE' : 'YOU LOSE';
    else if (roundOver && player.result === 'push') captionElement.textContent = 'PUSH · BET RETURNED';
    else if (!player.cards.length) captionElement.textContent = 'Waiting';
    else if (player.busted) captionElement.textContent = 'Bust';
    else if (player.stood) captionElement.textContent = 'Standing';
    else if (roundOver) captionElement.textContent = 'Round complete';
    else captionElement.textContent = index === activePlayer ? 'Your turn' : 'Waiting';
  });

  elements.hit.disabled = roundOver;
  elements.stand.disabled = roundOver;
  document.querySelectorAll('.chip').forEach((chip) => {
    const player = players.find((entry) => entry.key === chip.dataset.player);
    chip.disabled = !roundOver || player.bet + Number(chip.dataset.value) > player.bankroll;
  });
  document.querySelectorAll('.clear-bet').forEach((button) => {
    const player = players.find((entry) => entry.key === button.dataset.player);
    button.disabled = !roundOver || player.bet === 0;
  });
  elements.start.disabled = !roundOver || players.some((player) => player.bet <= 0);
  elements.start.textContent = roundOver && roundNumber ? 'Play again →' : 'Deal cards →';
  elements.start.setAttribute('aria-label', roundNumber ? 'Start a new round' : 'Deal cards and start round');
  elements.roundCount.textContent = `ROUND ${String(roundNumber).padStart(2, '0')}`;
  elements.turnText.textContent = roundOver
    ? (players.every((player) => player.bet > 0)
      ? (roundNumber ? 'Bets are set · ready for the next round' : 'Both bets are set · deal when ready')
      : (roundNumber ? 'Place both bets to continue' : 'Place both bets to start'))
    : `${players[activePlayer].name} · choose Hit or Stand`;
  elements.turnDot.style.background = roundOver ? '#8cd2a3' : 'var(--gold)';
}

function setMessage(label, message, announce = false) {
  if (announce) elements.announcer.textContent = `${label}. ${message}`;
}

function startRound() {
  if (!roundOver || players.some((player) => player.bet < 1 || player.bet > player.bankroll)) return;
  players.forEach((player) => {
    player.roundBet = player.bet;
    player.bankroll -= player.bet;
  });
  deck = createDeck();
  dealerCards = [];
  players.forEach((player) => {
    player.cards = [];
    player.stood = false;
    player.busted = false;
    player.result = null;
  });
  dealerResult = null;
  roundNumber += 1;
  activePlayer = 0;
  roundOver = false;
  hideDealerHoleCard = true;
  // Deal in turn order, then give the dealer one visible and one hidden card.
  players[0].cards.push(drawCard());
  players[1].cards.push(drawCard());
  dealerCards.push(drawCard());
  players[0].cards.push(drawCard());
  players[1].cards.push(drawCard());
  dealerCards.push(drawCard());
  setMessage('ROUND IN PROGRESS', 'Player One is up first.');
  updateView();
}

function advanceTurn() {
  if (activePlayer === 0) {
    activePlayer = 1;
    setMessage('PLAYER TWO', 'Player One is done. Player Two, you’re up.');
  } else {
    finishRound();
    return;
  }
  updateView();
}

function hit() {
  if (roundOver) return;
  const player = players[activePlayer];
  player.cards.push(drawCard());
  const value = handValue(player.cards);
  if (value > 21) {
    player.busted = true;
    setMessage('BUST', `${player.name} went over 21.`);
    advanceTurn();
  } else if (value === 21) {
    player.stood = true;
    setMessage('21!', `${player.name} has 21 and stands.`);
    advanceTurn();
  } else {
    setMessage(`${player.name.toUpperCase()} · ${value} POINTS`, 'Would you like another card?');
    updateView();
  }
}

function stand() {
  if (roundOver) return;
  players[activePlayer].stood = true;
  setMessage(`${players[activePlayer].name.toUpperCase()} STANDS`, 'Let’s see how the other hand does.');
  advanceTurn();
}

function finishRound() {
  hideDealerHoleCard = false;
  // The dealer draws to 17, but never needs to draw if both players have busted.
  if (players.some((player) => !player.busted)) {
    while (handValue(dealerCards) < 17) dealerCards.push(drawCard());
  }
  roundOver = true;
  const dealerTotal = handValue(dealerCards);
  const summaries = players.map((player) => {
    const total = handValue(player.cards);
    if (player.busted) {
      player.result = 'lose';
      player.bet = 0;
      return `${player.name} loses (bust)`;
    }
    if (dealerTotal > 21 || total > dealerTotal) {
      player.result = 'win';
      player.bankroll += player.roundBet * 2;
      player.bet = 0;
      return `${player.name} wins`;
    }
    if (total === dealerTotal) {
      player.result = 'push';
      player.bankroll += player.roundBet;
      player.bet = 0;
      return `${player.name} pushes`;
    }
    player.result = 'lose';
    player.bet = 0;
    return `${player.name} loses`;
  });
  const hasPlayerWin = players.some((player) => player.result === 'win');
  const hasPlayerLoss = players.some((player) => player.result === 'lose');
  dealerResult = hasPlayerWin && !hasPlayerLoss ? 'lose' : hasPlayerLoss && !hasPlayerWin ? 'win' : hasPlayerWin && hasPlayerLoss ? 'mixed' : 'push';
  const winners = players.filter((player) => player.result === 'win');
  const headline = winners.length === 2 ? 'Both players win!' : winners.length === 1 ? `${winners[0].name} wins!` : hasPlayerLoss ? 'House wins!' : 'Push · bets returned';
  const details = `${summaries.join(' · ')}. Dealer: ${dealerTotal}${dealerTotal > 21 ? ' (bust)' : ''}.`;
  setMessage('FINAL SCORES', `${headline} ${details}`, true);
  updateView();
}

elements.start.addEventListener('click', startRound);
elements.hit.addEventListener('click', hit);
elements.stand.addEventListener('click', stand);
document.addEventListener('keydown', (event) => {
  if (event.repeat || event.target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(event.target.tagName)) return;

  const shortcuts = {
    a: { player: 0, action: hit },
    s: { player: 0, action: stand },
    ';': { player: 1, action: hit },
    "'": { player: 1, action: stand },
  };
  const shortcut = shortcuts[event.key.toLowerCase()];
  if (!shortcut || roundOver || activePlayer !== shortcut.player) return;

  event.preventDefault();
  shortcut.action();
});
document.querySelectorAll('.clear-bet').forEach((button) => {
  button.addEventListener('click', () => {
    const player = players.find((entry) => entry.key === button.dataset.player);
    if (!roundOver) return;
    player.bet = 0;
    updateView();
  });
});
document.querySelectorAll('.chip').forEach((chip) => {
  chip.addEventListener('click', () => {
    const player = players.find((entry) => entry.key === chip.dataset.player);
    const amount = Number(chip.dataset.value);
    if (!roundOver || player.bet + amount > player.bankroll) return;
    player.bet += amount;
    updateView();
  });
});
elements.rulesButton.addEventListener('click', () => {
  const expanded = elements.rulesButton.getAttribute('aria-expanded') === 'true';
  elements.rulesButton.setAttribute('aria-expanded', String(!expanded));
  elements.rulesPanel.hidden = expanded;
});

updateView();
