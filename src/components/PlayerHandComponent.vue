<!-- components/PlayerHandComponent.vue -->
<template>
  <div class="player-hand-container" :class="{ 'your-turn': isYourTurn }">
    <h3 class="hand-title">Le tue carte</h3>

    <!-- Turn indicator -->
    <div v-if="isYourTurn" class="turn-indicator">
      È il tuo turno!
    </div>

    <!-- Quick play toggle -->
    <div class="quick-play-option">
      <label>
        <input type="checkbox" v-model="quickPlay">
        <span>Gioco veloce</span>
      </label>
    </div>

    <!-- Cards layout -->
    <div class="hand-area">
      <div class="cards-container">
        <div
            v-for="(card, index) in cards"
            :key="card.id"
            class="card-wrapper"
            :class="{
            'playable': isCardPlayable(card),
            'unplayable': !isCardPlayable(card),
            'selected': selectedCard && selectedCard.id === card.id,
            'unselected': selectedCard && selectedCard.id !== card.id
          }"
            :style="getCardStyle(index, cards.length)"
            @click="onCardClick(card)"
        >
          <CardComponent
              :card="card"
              :show-front="true"
          />

          <!-- Green indicator dot for playable cards -->
          <div v-if="isCardPlayable(card)" class="playable-indicator"></div>
        </div>
      </div>
    </div>

    <!-- Confirmation panel -->
    <div v-if="selectedCard" class="confirmation-panel">
      <div class="card-name">{{ getCardName(selectedCard) }}</div>
      <div class="action-buttons">
        <button class="cancel-button" @click="cancelSelection">Annulla</button>
        <button class="confirm-button" @click="confirmSelection">Gioca</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import CardComponent from './CardComponent.vue';

const props = defineProps({
  cards: {
    type: Array,
    required: true
  },
  playableCards: {
    type: Array,
    required: true
  },
  isYourTurn: {
    type: Boolean,
    default: true
  }
});

const emit = defineEmits(['play-card']);

// States
const selectedCard = ref(null);
const quickPlay = ref(false);

// Check if a card is playable
const isCardPlayable = (card) => {
  return props.playableCards.some(playableCard => playableCard.id === card.id);
};

// Handle card click
const onCardClick = (card) => {
  if (!isCardPlayable(card)) return;

  if (quickPlay.value) {
    // Play immediately in quick play mode
    emit('play-card', card.id);
  } else {
    if (selectedCard.value && selectedCard.value.id === card.id) {
      // If clicking the same card twice, play it
      confirmSelection();
    } else {
      // First click - select the card
      selectedCard.value = card;
    }
  }
};

// Cancel selection
const cancelSelection = () => {
  selectedCard.value = null;
};

// Confirm and play the selected card
const confirmSelection = () => {
  if (selectedCard.value) {
    emit('play-card', selectedCard.value.id);
    selectedCard.value = null;
  }
};

// Get card styling based on position
const getCardStyle = (index, totalCards) => {
  if (totalCards <= 1) {
    // Center the single card
    return {
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 10
    };
  }

  // Calculate the total width needed for all cards in the fan
  // Use a wider fan when it's the player's turn
  const cardWidth = 100;
  const cardSpacing = props.isYourTurn ? 60 : 40;
  const totalWidth = (totalCards - 1) * cardSpacing + cardWidth;

  // Start position (left edge of the fan)
  const startPos = -totalWidth / 2 + cardWidth / 2;

  // Position of this card in the fan
  const position = startPos + (index * cardSpacing);

  // Base z-index (cards to the right appear on top of cards to the left)
  const zIndex = index + 10;

  // Rotation for a slight fan effect
  const minRotation = -8;
  const maxRotation = 8;
  let rotation = 0;

  if (totalCards > 1) {
    // Calculate rotation to create a mild fan effect
    const rotationStep = (maxRotation - minRotation) / (totalCards - 1);
    rotation = minRotation + (index * rotationStep);
  }

  return {
    left: `calc(50% + ${position}px)`,
    transform: `rotate(${rotation}deg)`,
    zIndex
  };
};

// Get a formatted card name for the confirmation panel
const getCardName = (card) => {
  if (!card) return '';

  const suitSymbols = {
    'denari': '💰',
    'coppe': '🏆',
    'spade': '⚔️',
    'bastoni': '🏑'
  };

  return `${card.value} ${suitSymbols[card.suit] || card.suit}`;
};
</script>

<style lang="scss" scoped>
.player-hand-container {
  position: relative;
  padding: 20px;
  margin-top: 20px;
  transition: all 0.4s ease-out;

  &.your-turn {
    animation: highlightTurn 1s ease;
  }
}

@keyframes highlightTurn {
  0% { transform: scale(1); }
  50% { transform: scale(1.03); }
  100% { transform: scale(1); }
}

.hand-title {
  text-align: center;
  margin-bottom: 10px;
  color: white;
}

.turn-indicator {
  text-align: center;
  margin-bottom: 10px;
  font-weight: bold;
  color: #ffcc00;
  font-size: 18px;
  text-shadow: 0 0 10px rgba(255, 204, 0, 0.5);
  animation: pulseTurn 1.5s infinite;
}

@keyframes pulseTurn {
  0% { opacity: 0.7; }
  50% { opacity: 1; }
  100% { opacity: 0.7; }
}

.quick-play-option {
  text-align: center;
  margin-bottom: 15px;

  label {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    color: white;
    font-size: 14px;
    cursor: pointer;
  }
}

.hand-area {
  position: relative;
  height: 180px;
}

.cards-container {
  position: relative;
  height: 100%;
  width: 100%;
  transition: all 0.3s ease;

  // Expand cards spacing on player's turn
  .your-turn & {
    height: 110%;
  }
}

.card-wrapper {
  position: absolute;
  width: 100px;
  height: 150px;
  transform-origin: bottom center;
  transition: all 0.3s ease-out;

  &.playable {
    cursor: pointer;
    box-shadow: 0 3px 8px rgba(0, 0, 0, 0.5);

    &:hover {
      box-shadow: 0 0 12px rgba(255, 215, 0, 0.7);
      filter: brightness(1.1);
    }

    // Lift cards slightly when it's your turn
    .your-turn & {
      transform: translateY(-10px);

      &:hover {
        transform: translateY(-15px);
      }
    }
  }

  &.unplayable {
    cursor: not-allowed;
    filter: grayscale(60%) brightness(70%);
  }

  &.selected {
    transform: scale(1.1);
    z-index: 100 !important;
    box-shadow: 0 0 20px rgba(255, 215, 0, 0.8);
    filter: brightness(1.15);

    // Lift selected card more on your turn
    .your-turn & {
      transform: translateY(-20px) scale(1.15);
    }
  }

  &.unselected {
    transform: translateY(40px) scale(0.85);
    filter: brightness(60%) grayscale(30%);
    opacity: 0.7;
  }
}

.playable-indicator {
  position: absolute;
  bottom: -4px;
  left: 50%;
  transform: translateX(-50%);
  width: 8px;
  height: 8px;
  background-color: #4caf50;
  border-radius: 50%;
  box-shadow: 0 0 5px rgba(76, 175, 80, 0.7);
}

.confirmation-panel {
  position: absolute;
  bottom: -50px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  background-color: rgba(0, 0, 0, 0.7);
  border-radius: 8px;
  padding: 12px 20px;
  min-width: 250px;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
  animation: fadeIn 0.3s ease;
}

.card-name {
  color: white;
  font-weight: bold;
  font-size: 16px;
}

.action-buttons {
  display: flex;
  gap: 15px;
}

button {
  border: none;
  border-radius: 4px;
  padding: 8px 16px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    transform: scale(1.05);
  }
}

.cancel-button {
  background-color: #777;
  color: white;

  &:hover {
    background-color: #666;
  }
}

.confirm-button {
  background-color: #4caf50;
  color: white;

  &:hover {
    background-color: #3d9140;
  }
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateX(-50%) translateY(10px); }
  to { opacity: 1; transform: translateX(-50%) translateY(0); }
}
</style>