<!-- components/GameboardComponent.vue -->
<template>
  <div class="gameboard">
    <!-- Game info header -->
    <div class="game-info">
      <div class="round-info">
        <h2>Round: {{ gameStore.currentRound }} ({{ gameStore.cardsPerRound }} Carte)</h2>
      </div>
      <div class="game-phase">
        <span v-if="gameStore.gamePhase === 'declaration'">Fase: Dichiarazione</span>
        <span v-else-if="gameStore.gamePhase === 'playing'">Fase: Gioco</span>
        <span v-else-if="gameStore.gamePhase === 'scoring'">Fase: Punteggio</span>
        <span v-else-if="gameStore.gamePhase === 'finished'">Gioco Terminato</span>
      </div>
      <button @click="gameStore.restartGame" class="restart-btn">Nuova Partita</button>
    </div>

    <!-- Scoreboard -->
    <ScoreboardComponent />

    <!-- Game area -->
    <div class="game-area">
      <!-- Declaration phase -->
      <div v-if="gameStore.gamePhase === 'declaration' && gameStore.isHumanTurn" class="declaration-area">
        <h3>Dichiarazione</h3>
        <p>Osserva le tue carte e dichiara quante mani pensi di vincere:</p>
        <div class="player-cards-display">
          <div v-for="card in gameStore.players[0]?.hand" :key="card.id" class="preview-card">
            <CardComponent :card="card" :show-front="true" />
          </div>
        </div>
        <div class="declaration-buttons">
          <button
              v-for="n in gameStore.cardsPerRound + 1"
              :key="n-1"
              @click="makeDeclaration(n-1)"
              class="declaration-btn"
          >
            {{ n-1 }}
          </button>
        </div>
      </div>

      <!-- Player waiting for other declarations -->
      <div v-else-if="gameStore.gamePhase === 'declaration' && !gameStore.isHumanTurn" class="waiting-area">
        <p>In attesa della dichiarazione di {{ gameStore.currentPlayerObj.name }}...</p>
        <div class="spinner"></div>
      </div>

      <!-- Playing area -->
      <div v-if="gameStore.gamePhase === 'playing'" class="playing-area">
        <!-- Indicatore del turno corrente -->
        <div class="current-player-indicator"
             :class="{ 'is-human': gameStore.isHumanTurn, 'is-waiting': !gameStore.isHumanTurn }">
          <p>Turno di: <strong>{{ gameStore.currentPlayerObj.name }}</strong></p>

          <!-- Informazioni sui giocatori precedenti -->
          <div v-if="previousPlayersInfo.length > 0" class="previous-players-info">
            <p>Carte giocate in questo turno:</p>
            <ul class="previous-cards-list">
              <li v-for="(info, index) in previousPlayersInfo" :key="index" class="previous-card-info">
                <span class="previous-player-name">{{ info.playerName }}</span>
                <span class="previous-player-card">{{ getCardDescription(info.card) }}</span>
              </li>
            </ul>
          </div>
        </div>

        <!-- Table cards -->
        <div class="table-cards">
          <div
              v-for="(card, index) in gameStore.tableCards"
              :key="card.id"
              class="table-card-slot"
              :style="{ 
                transform: getTableCardPosition(index, gameStore.tableCards.length),
                zIndex: index + 1,
                opacity: 1
              }"
          >
            <CardComponent :card="card" :show-front="true" />
            <div class="player-indicator" :class="{ 'winning-card': winningCard && card.id === winningCard.id }">
              {{ getPlayerName(card.playerId) }}
              <span class="play-order">{{ index + 1 }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Scoring phase -->
      <div v-if="gameStore.gamePhase === 'scoring'" class="scoring-area">
        <h3>Risultati Round {{ gameStore.currentRound }}</h3>
        <div class="round-results">
          <div v-for="player in gameStore.players" :key="player.id" class="player-result">
            <div class="player-name">{{ player.name }}</div>
            <div class="player-stats">
              <div>Dichiarato: {{ player.declaration }}</div>
              <div>Vinto: {{ player.tricksWon }}</div>
              <div class="score-difference">
                Differenza: {{ Math.abs(player.declaration - player.tricksWon) }}
              </div>
            </div>
          </div>
        </div>
        <p v-if="gameStore.currentRound < 5" class="next-round-info">
          Il prossimo round inizierà tra poco...
        </p>
      </div>

      <!-- Game finished -->
      <div v-if="gameStore.gamePhase === 'finished'" class="finished-area">
        <h3>Gioco Terminato!</h3>
        <div class="final-results">
          <div
              v-for="player in sortedFinalPlayers"
              :key="player.id"
              class="final-player-result"
              :class="{ 'winner': player.id === winnerId }"
          >
            <div class="position">
              {{ sortedFinalPlayers.indexOf(player) + 1 }}
            </div>
            <div class="player-name">{{ player.name }}</div>
            <div class="final-score">{{ player.score }} punti</div>
          </div>
        </div>
        <div class="winner-announcement" v-if="winner">
          <h2>{{ winner.name }} ha vinto!</h2>
        </div>
        <button @click="gameStore.restartGame" class="new-game-btn">Nuova Partita</button>
      </div>
    </div>

    <!-- Player hand -->
    <PlayerHandComponent
        v-if="gameStore.gamePhase === 'playing'"
        :cards="gameStore.players[0]?.hand || []"
        :playable-cards="gameStore.playableCards"
        @play-card="playCard"
    />
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useGameStore } from '../stores/gameStore';
import CardComponent from './CardComponent.vue';
import PlayerHandComponent from './PlayerHandComponent.vue';
import ScoreboardComponent from './ScoreboardComponent.vue';

const gameStore = useGameStore();

// Calculate positions for cards on the table
const getTableCardPosition = (index, totalCards) => {
  if (totalCards <= 0) return '';

  // Posiziona le carte in sequenza con ampia spaziatura per maggiore visibilità
  const offsetX = (index - (totalCards - 1) / 2) * 80; // Aumentato spazio orizzontale
  const offsetY = -index * 8;

  return `translate(${offsetX}px, ${offsetY}px)`;
};

const getPlayerName = (playerId) => {
  const player = gameStore.players.find(p => p.id === playerId);
  return player ? player.name : '';
};

// Aggiungi questa funzione per ottenere la descrizione della carta
const getCardDescription = (card) => {
  const suitSymbols = {
    'denari': '💰',
    'coppe': '🏆',
    'spade': '⚔️',
    'bastoni': '🏑'
  };

  return `${card.value} ${suitSymbols[card.suit] || card.suit}`;
};

// Calcola informazioni sui giocatori che hanno già giocato in questo turno
const previousPlayersInfo = computed(() => {
  if (gameStore.gamePhase !== 'playing' || gameStore.tableCards.length === 0) return [];

  return gameStore.tableCards.map(card => ({
    playerId: card.playerId,
    playerName: getPlayerName(card.playerId),
    card: card
  }));
});

// Identifica la carta vincente nella mano corrente
const winningCard = computed(() => {
  if (gameStore.tableCards.length === 0) return null;

  // Inizia con la prima carta come vincente
  let currentWinner = gameStore.tableCards[0];

  // Confronta con le altre carte usando l'ordine assoluto
  for (let i = 1; i < gameStore.tableCards.length; i++) {
    const card = gameStore.tableCards[i];

    // Prima confronta per valore numerico (3, 2, 1, ecc.)
    const RANKS = {3: 10, 2: 9, 1: 8, 10: 7, 9: 6, 8: 5, 7: 4, 6: 3, 5: 2, 4: 1};
    const SUIT_RANKS = {denari: 4, coppe: 3, spade: 2, bastoni: 1};

    if (RANKS[card.value] > RANKS[currentWinner.value]) {
      currentWinner = card;
    }
    else if (RANKS[card.value] === RANKS[currentWinner.value]) {
      // A parità di valore, vince il seme più forte
      if (SUIT_RANKS[card.suit] > SUIT_RANKS[currentWinner.suit]) {
        currentWinner = card;
      }
    }
  }

  return currentWinner;
});

const makeDeclaration = (declaration) => {
  gameStore.makeDeclaration(0, declaration);
};

const playCard = (cardId) => {
  gameStore.playCard(0, cardId);
};

const sortedFinalPlayers = computed(() => {
  return [...gameStore.players].sort((a, b) => a.score - b.score);
});

const winnerId = computed(() => {
  if (gameStore.gamePhase !== 'finished') return null;
  return sortedFinalPlayers.value[0]?.id;
});

const winner = computed(() => {
  if (gameStore.gamePhase !== 'finished') return null;
  return sortedFinalPlayers.value[0];
});
</script>

<style lang="scss" scoped>
.gameboard {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.game-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: rgba(0, 0, 0, 0.2);
  padding: 1rem;
  border-radius: 8px;

  h2 {
    margin: 0;
    font-size: 1.2rem;
  }
}

.game-phase {
  font-weight: bold;
  font-size: 1.2rem;
}

.restart-btn {
  background-color: #c72c41;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 0.5rem 1rem;
  cursor: pointer;
  font-weight: bold;

  &:hover {
    background-color: darken(#c72c41, 10%);
  }
}

.game-area {
  background-color: rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  padding: 2rem;
  min-height: 300px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.declaration-area {
  text-align: center;

  h3 {
    margin-top: 0;
    font-size: 1.5rem;
  }

  p {
    margin-bottom: 1rem;
  }
}

.player-cards-display {
  display: flex;
  justify-content: center;
  gap: 10px;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;

  .preview-card {
    transform: scale(0.8);
    transition: transform 0.2s;

    &:hover {
      transform: scale(0.9);
    }
  }
}

.declaration-buttons {
  display: flex;
  gap: 0.5rem;
  justify-content: center;
  margin-top: 1rem;
}

.declaration-btn {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: none;
  background-color: #c72c41;
  color: white;
  font-weight: bold;
  font-size: 1.2rem;
  cursor: pointer;
  transition: transform 0.2s;

  &:hover {
    transform: scale(1.1);
    background-color: darken(#c72c41, 10%);
  }
}

.waiting-area {
  text-align: center;

  p {
    margin-bottom: 1rem;
  }
}

.spinner {
  display: inline-block;
  width: 40px;
  height: 40px;
  border: 4px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top-color: #fff;
  animation: spin 1s ease-in-out infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.playing-area {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.previous-players-info {
  margin-top: 10px;
  background-color: rgba(0, 0, 0, 0.5);
  padding: 10px;
  border-radius: 5px;
  font-size: 0.9rem;
  max-width: 400px;

  p {
    margin-bottom: 8px;
    font-weight: bold;
  }
}

.previous-cards-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.previous-card-info {
  display: flex;
  justify-content: space-between;
  padding: 4px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);

  &:last-child {
    border-bottom: none;
  }
}

.previous-player-name {
  font-weight: bold;
  color: #ffcc00;
}

.previous-player-card {
  background-color: rgba(255, 255, 255, 0.1);
  padding: 2px 8px;
  border-radius: 4px;
  transition: all 0.3s ease;

  &.winning-card-text {
    background-color: rgba(255, 215, 0, 0.3);
    border: 1px solid gold;
    color: white;
    font-weight: bold;
  }
}

.winning-indicator {
  margin-left: 5px;
  animation: float 1.5s ease-in-out infinite;
}

@keyframes float {
  0% { transform: translateY(0); }
  50% { transform: translateY(-3px); }
  100% { transform: translateY(0); }
}

.table-cards {
  position: relative;
  height: 220px;
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: 20px;
  background-color: rgba(0, 0, 0, 0.2);
  border-radius: 15px;
  padding: 20px;
}

.table-card-slot {
  position: absolute;
  transform-origin: center bottom;
  transition: transform 0.5s ease, opacity 0.5s ease, box-shadow 0.5s ease;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.3);

  &:has(.player-indicator.winning-card) {
    box-shadow: 0 0 15px gold;
    z-index: 100 !important;
  }
}

.player-indicator {
  position: absolute;
  bottom: -30px;
  left: 50%;
  transform: translateX(-50%);
  background-color: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 0.8rem;
  white-space: nowrap;
  display: flex;
  align-items: center;
  gap: 5px;
  transition: all 0.3s ease;

  &.winning-card {
    background-color: rgba(255, 215, 0, 0.8);
    color: black;
    font-weight: bold;
    box-shadow: 0 0 10px gold;
    transform: translateX(-50%) scale(1.05);
  }
}

.play-order {
  display: inline-flex;
  width: 18px;
  height: 18px;
  align-items: center;
  justify-content: center;
  background-color: rgba(255, 215, 0, 0.7);
  color: #000;
  border-radius: 50%;
  font-weight: bold;
  font-size: 0.7rem;
}

.current-player-indicator {
  margin-top: 1.5rem;
  padding: 0.5rem 1rem;
  background-color: rgba(0, 0, 0, 0.7);
  border-radius: 5px;
  font-size: 1.1rem;
  transition: all 0.3s ease;
}

.current-player-indicator.is-human {
  background-color: rgba(199, 44, 65, 0.8);
  animation: pulse 1.5s infinite;
  border: 2px solid gold;
}

.current-player-indicator.is-waiting {
  background-color: rgba(30, 30, 30, 0.8);
}

.waiting-message {
  font-style: italic;
  font-size: 0.9rem;
  margin-top: 0.5rem;
  color: #ccc;
}

@keyframes pulse {
  0% { box-shadow: 0 0 0 0 rgba(255, 215, 0, 0.4); }
  70% { box-shadow: 0 0 0 10px rgba(255, 215, 0, 0); }
  100% { box-shadow: 0 0 0 0 rgba(255, 215, 0, 0); }
}

.scoring-area {
  text-align: center;
  width: 100%;

  h3 {
    margin-top: 0;
    font-size: 1.5rem;
    margin-bottom: 1.5rem;
  }
}

.round-results {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.player-result {
  background-color: rgba(0, 0, 0, 0.2);
  border-radius: 8px;
  padding: 1rem;
  min-width: 200px;

  .player-name {
    font-weight: bold;
    font-size: 1.2rem;
    margin-bottom: 0.5rem;
  }

  .player-stats {
    display: flex;
    flex-direction: column;
    gap: 5px;
  }

  .score-difference {
    margin-top: 5px;
    font-weight: bold;
    color: #ffcc00;
  }
}

.next-round-info {
  font-style: italic;
  margin-top: 1.5rem;
}

.finished-area {
  text-align: center;
  width: 100%;

  h3 {
    margin-top: 0;
    font-size: 1.8rem;
    margin-bottom: 1.5rem;
  }
}

.final-results {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  max-width: 500px;
  margin: 0 auto 2rem;
}

.final-player-result {
  display: flex;
  align-items: center;
  padding: 0.8rem 1rem;
  background-color: rgba(0, 0, 0, 0.2);
  border-radius: 5px;
  transition: background-color 0.2s ease;

  &.winner {
    background-color: rgba(255, 215, 0, 0.3);
    border: 2px solid gold;
  }

  .position {
    width: 30px;
    height: 30px;
    border-radius: 50%;
    background-color: rgba(0, 0, 0, 0.3);
    display: flex;
    justify-content: center;
    align-items: center;
    font-weight: bold;
    margin-right: 1rem;
  }

  .player-name {
    flex: 1;
    text-align: left;
    font-weight: bold;
  }

  .final-score {
    font-weight: bold;
  }
}

.winner-announcement {
  margin: 2rem 0;

  h2 {
    color: gold;
    text-shadow: 0 0 10px rgba(255, 215, 0, 0.5);
    animation: pulse 2s infinite;
  }
}

@keyframes pulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
}

.new-game-btn {
  background-color: #c72c41;
  color: white;
  border: none;
  border-radius: 5px;
  padding: 0.8rem 1.5rem;
  font-size: 1.2rem;
  font-weight: bold;
  cursor: pointer;
  transition: background-color 0.2s ease;

  &:hover {
    background-color: darken(#c72c41, 10%);
  }
}
</style>