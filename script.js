const suits = [
  { symbol: '♠', name: 'spades', color: 'black' },
  { symbol: '♥', name: 'hearts', color: 'red' },
  { symbol: '♦', name: 'diamonds', color: 'red' },
  { symbol: '♣', name: 'clubs', color: 'black' },
];
const ranks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
const players = [
  { name: 'Player One', key: 'one', cards: [], stood: false, busted: false },
  { name: 'Player Two', key: 'two', cards: [], stood: false, busted: false },
];

let deck = [];
let dealerCards = [];
let activePlayer = 0;
let roundNumber = 0;
let roundOver = true;
let hideDealerHoleCard = false;

const elements = {
  start: document.querySelector('#start-button'),
  hit: document.querySelector('#hit-button'),
  stand: document.querySelector('#stand-button'),
  rulesButton: document.querySelector('#rules-button'),
  rulesPanel: document.querySelector('#rules-panel'),
  dealerCards: document.querySelector('#dealer-cards'),
  dealerScore: document.querySelector('#dealer-score'),
  dealerCaption: document.querySelector('#dealer-caption'),
  roundLabel: document.querySelector('#round-label'),
  roundMessage: document.querySelector('#round-message'),
  turnText: document.querySelector('#turn-text'),
  turnDot: document.querySelector('#turn-dot'),
  roundCount: document.querySelector('#round-count'),
  announcer: document.querySelector('#announcer'),
};

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
  elements.dealerCaption.textContent = hideDealerHoleCard ? 'One card showing' : (roundOver && dealerCards.length ? 'House hand' : 'House hand');

  players.forEach((player, index) => {
    const handElement = document.querySelector(`#player-${player.key}-area`);
    const cardsElement = document.querySelector(`#player-${player.key}-cards`);
    const scoreElement = document.querySelector(`#player-${player.key}-score`);
    const captionElement = document.querySelector(`#player-${player.key}-caption`);
    renderHand(cardsElement, player.cards);
    scoreElement.textContent = player.cards.length ? handValue(player.cards) : '—';
    handElement.classList.toggle('active', !roundOver && index === activePlayer);
    handElement.classList.toggle('finished', roundOver || player.stood || player.busted);
    if (!player.cards.length) captionElement.textContent = 'Waiting';
    else if (player.busted) captionElement.textContent = 'Bust';
    else if (player.stood) captionElement.textContent = 'Standing';
    else if (roundOver) captionElement.textContent = 'Round complete';
    else captionElement.textContent = index === activePlayer ? 'Your turn' : 'Waiting';
  });

  elements.hit.disabled = roundOver;
  elements.stand.disabled = roundOver;
  elements.start.textContent = roundOver && roundNumber ? 'Play again →' : 'Deal cards →';
  elements.start.setAttribute('aria-label', roundNumber ? 'Start a new round' : 'Deal cards and start round');
  elements.roundCount.textContent = `ROUND ${String(roundNumber).padStart(2, '0')}`;
  elements.turnText.textContent = roundOver
    ? (roundNumber ? 'Round complete · deal again to play' : 'Start a round to play')
    : `${players[activePlayer].name} · choose Hit or Stand`;
  elements.turnDot.style.background = roundOver ? '#8cd2a3' : 'var(--gold)';
}

function setMessage(label, message, announce = false) {
  elements.roundLabel.textContent = label;
  elements.roundMessage.textContent = message;
  if (announce) elements.announcer.textContent = `${label}. ${message}`;
}

function startRound() {
  deck = createDeck();
  dealerCards = [];
  players.forEach((player) => {
    player.cards = [];
    player.stood = false;
    player.busted = false;
  });
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
    if (player.busted) return `${player.name} busts`;
    if (dealerTotal > 21 || total > dealerTotal) return `${player.name} wins`;
    if (total === dealerTotal) return `${player.name} pushes`;
    return `${player.name} loses`;
  });
  const winners = summaries.filter((result) => result.endsWith('wins'));
  const headline = winners.length === 2 ? 'Both players win!' : winners.length === 1 ? `${winners[0].replace(' wins', '')} wins!` : 'Round complete';
  const details = `${summaries.join(' · ')}. Dealer: ${dealerTotal}${dealerTotal > 21 ? ' (bust)' : ''}.`;
  setMessage('FINAL SCORES', `${headline} ${details}`, true);
  updateView();
}

elements.start.addEventListener('click', startRound);
elements.hit.addEventListener('click', hit);
elements.stand.addEventListener('click', stand);
elements.rulesButton.addEventListener('click', () => {
  const expanded = elements.rulesButton.getAttribute('aria-expanded') === 'true';
  elements.rulesButton.setAttribute('aria-expanded', String(!expanded));
  elements.rulesPanel.hidden = expanded;
});

updateView();
