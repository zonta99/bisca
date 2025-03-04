<!-- components/PlayerHandComponent.vue -->
<template>
  <div class="player-hand-container">
    <h3 class="hand-title">Le tue carte</h3>
    <div class="hand">
      <div
          v-for="(card, index) in cards"
          :key="card.id"
          :class="['card-wrapper', { 'playable': isCardPlayable(card) }]"
          :style="{ 
          transform: `translateX(${getCardOffset(index, cards.length)}px) rotate(${getCardRotation(index, cards.length)}deg)`,
          zIndex: index
        }"
          @click="playCard(card)"
      >
        <CardComponent
            :card="card"
            :show-front="true"
            :class="{ 'card-hover': isCardPlayable(card) }"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { defineProps, defineEmits } from 'vue';
import CardComponent from './CardComponent.vue';

const props = defineProps({
  cards: {
    type: Array,
    required: true
  },
  playableCards: {
    type: Array,
    required: true
  }
});

const emit = defineEmits(['play-card']);

const isCardPlayable = (card) => {
  return props.playableCards.some(playableCard => playableCard.id === card.id);
};

const playCard = (card) => {
  if (isCardPlayable(card)) {
    emit('play-card', card.id);
  }
};

// Calculate card positioning in the hand
const getCardOffset = (index, totalCards) => {
  // Calculate the offset based on the position in hand and total cards
  const maxWidth = 600; // Max width of the hand
  const cardWidth = 120; // Width of a card

  if (totalCards <= 1) return 0;

  const availableWidth = Math.min(maxWidth, totalCards * cardWidth * 0.7);
  const cardSpacing = availableWidth / (totalCards - 1);

  return (index * cardSpacing) - (availableWidth / 2);
};

// Calculate card rotation for a fan effect
const getCardRotation = (index, totalCards) => {
  if (totalCards <= 1) return 0;

  // Calculate rotation angle for fan effect
  const maxAngle = 20; // Max angle of rotation
  const middleIndex = (totalCards - 1) / 2;
  const offset = index - middleIndex;

  return offset * (maxAngle / middleIndex);
};
</script>

<style lang="scss" scoped>
.player-hand-container {
  padding: 1rem;
  margin-top: 1rem;
}

.hand-title {
  text-align: center;
  margin-bottom: 1rem;
  color: white;
}

.hand {
  position: relative;
  height: 180px;
  display: flex;
  justify-content: center;
  align-items: flex-end;
  perspective: 1000px;
}

.card-wrapper {
  position: absolute;
  transform-origin: bottom center;
  cursor: pointer;

  &:not(.playable) {
    filter: grayscale(50%) brightness(70%);
    cursor: not-allowed;
  }
}

.playable {
  z-index: 10 !important;

  &:hover {
    transform: translateY(-20px) !important;
  }
}

.card-hover {
  box-shadow: 0 0 15px rgba(255, 255, 0, 0.8);

  &:hover {
    box-shadow: 0 0 20px rgba(255, 255, 0, 1);
  }
}
</style>