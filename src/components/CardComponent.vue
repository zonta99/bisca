<!-- components/CardComponent.vue -->
<template>
  <div class="card" :class="{ 'card-back': !showFront }">
    <div class="card-inner" :class="{ 'flipped': showFront }">
      <div class="card-front">
        <img v-if="card.image && false" :src="getImageUrl()" :alt="`${getSuitName(card.suit)} ${card.value}`" class="card-image">
        <div v-else class="card-placeholder">
          <div class="card-value">{{ card.value }}</div>
          <div class="card-suit" :class="card.suit">{{ getSuitSymbol(card.suit) }}</div>
        </div>
      </div>
      <div class="card-back">
        <div class="back-design"></div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { defineProps } from 'vue';

const props = defineProps({
  card: {
    type: Object,
    required: true
  },
  showFront: {
    type: Boolean,
    default: false
  }
});

const getImageUrl = () => {
  try {
    // Try to load the image from the public folder
    return props.card.image;
  } catch (e) {
    // Fallback to placeholder
    return null;
  }
};

const getSuitName = (suit) => {
  const suitNames = {
    'denari': 'Denari',
    'coppe': 'Coppe',
    'spade': 'Spade',
    'bastoni': 'Bastoni'
  };
  return suitNames[suit] || suit;
};

const getSuitSymbol = (suit) => {
  const symbols = {
    'denari': '💰',
    'coppe': '🏆',
    'spade': '⚔️',
    'bastoni': '🏑'
  };
  return symbols[suit] || '?';
};
</script>

<style lang="scss" scoped>
.card {
  width: 100px;
  height: 150px;
  perspective: 1000px;
  user-select: none;
  border-radius: 10px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.5);

  .card-inner {
    position: relative;
    width: 100%;
    height: 100%;
    transition: transform 0.6s;
    transform-style: preserve-3d;

    &.flipped {
      transform: rotateY(0deg);
    }
  }

  &.card-back .card-inner {
    transform: rotateY(180deg);
  }
}

.card-front, .card-back {
  position: absolute;
  width: 100%;
  height: 100%;
  backface-visibility: hidden;
  border-radius: 10px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
  overflow: hidden;
}

.card-front {
  background-color: white;
  display: flex;
  justify-content: center;
  align-items: center;
  transform: rotateY(0deg);
}

.card-back {
  background-color: #800020;
  transform: rotateY(180deg);
  display: flex;
  justify-content: center;
  align-items: center;
}

.card-image {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.card-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 10px;

  .card-value {
    font-size: 24px;
    font-weight: bold;
    color: #333;
  }

  .card-suit {
    font-size: 40px;
    align-self: center;
    margin-bottom: 10px;

    &.denari {
      color: #FFD700;
    }

    &.coppe {
      color: #c72c41;
    }

    &.spade {
      color: #000;
    }

    &.bastoni {
      color: #8B4513;
    }
  }
}

.back-design {
  width: 80%;
  height: 80%;
  background-color: #600010;
  border: 2px solid #FFD700;
  border-radius: 5px;
}
</style>