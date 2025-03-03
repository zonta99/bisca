<!-- App.vue -->
<template>
  <div class="bisca-app">
    <h1 class="app-title">BISCA</h1>
    <LoginComponent v-if="gameStore.gamePhase === 'login'" @start-game="startGame" />
    <GameboardComponent v-else />
  </div>
</template>

<script setup>
import { onMounted } from 'vue';
import { useGameStore } from './stores/gameStore';
import LoginComponent from './components/LoginComponent.vue';
import GameboardComponent from './components/GameboardComponent.vue';

const gameStore = useGameStore();

onMounted(() => {
  // Check for saved game in localStorage
  const savedGame = localStorage.getItem('biscaGameState');
  if (savedGame) {
    try {
      const gameState = JSON.parse(savedGame);
      gameStore.loadGame(gameState);
    } catch (e) {
      console.error('Error loading saved game:', e);
      localStorage.removeItem('biscaGameState');
    }
  }
});

const startGame = (playerName, numPlayers) => {
  gameStore.startGame(playerName, numPlayers);
};
</script>

<style lang="scss">
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Arial', sans-serif;
  background: #007c3e;
  color: #fff;
}

.bisca-app {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.app-title {
  text-align: center;
  font-size: 3rem;
  margin-bottom: 2rem;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
}
</style>