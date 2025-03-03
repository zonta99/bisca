<!-- components/ScoreboardComponent.vue -->
<template>
  <div class="scoreboard">
    <h3 class="scoreboard-title">Punteggio</h3>
    <div class="scoreboard-content">
      <table class="score-table">
        <thead>
        <tr>
          <th>Giocatore</th>
          <th v-if="showDeclarations">Dichiarazione</th>
          <th v-if="showTricksWon">Mani vinte</th>
          <th>Punteggio</th>
        </tr>
        </thead>
        <tbody>
        <tr v-for="player in gameStore.players" :key="player.id" :class="{ 'current-player': player.id === gameStore.currentPlayer }">
          <td class="player-name">{{ player.name }}</td>
          <td v-if="showDeclarations" class="declaration">
            <span v-if="player.declaration !== null">{{ player.declaration }}</span>
            <span v-else>-</span>
          </td>
          <td v-if="showTricksWon" class="tricks-won">{{ player.tricksWon }}</td>
          <td class="score">{{ player.score }}</td>
        </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useGameStore } from '../stores/gameStore';

const gameStore = useGameStore();

const showDeclarations = computed(() => {
  return gameStore.gamePhase === 'declaration' ||
      gameStore.gamePhase === 'playing' ||
      gameStore.gamePhase === 'scoring';
});

const showTricksWon = computed(() => {
  return gameStore.gamePhase === 'playing' ||
      gameStore.gamePhase === 'scoring';
});
</script>

<style lang="scss" scoped>
.scoreboard {
  background-color: rgba(0, 0, 0, 0.2);
  border-radius: 8px;
  padding: 1rem;
}

.scoreboard-title {
  margin-top: 0;
  margin-bottom: 1rem;
  text-align: center;
  font-size: 1.2rem;
}

.scoreboard-content {
  overflow-x: auto;
}

.score-table {
  width: 100%;
  border-collapse: collapse;

  th, td {
    padding: 0.5rem 1rem;
    text-align: center;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  }

  th {
    background-color: rgba(0, 0, 0, 0.3);
    font-weight: bold;
  }

  .player-name {
    text-align: left;
    font-weight: bold;
  }

  .score {
    font-weight: bold;
  }

  tr.current-player {
    background-color: rgba(199, 44, 65, 0.3);
  }
}
</style>