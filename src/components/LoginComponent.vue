<!-- components/LoginComponent.vue -->
<template>
  <div class="login-container">
    <div class="login-card">
      <h2>Benvenuto a BISCA</h2>
      <p class="login-description">Un tradizionale gioco di carte italiano</p>

      <form @submit.prevent="handleSubmit" class="login-form">
        <div class="form-group">
          <label for="playerName">Il tuo nome:</label>
          <input
              type="text"
              id="playerName"
              v-model="playerName"
              placeholder="Inserisci il tuo nome"
              required
              maxlength="20"
          >
        </div>

        <div class="form-group">
          <label for="playerCount">Numero di giocatori:</label>
          <div class="player-count-selector">
            <button
                v-for="num in 7"
                :key="num"
                type="button"
                :class="['player-count-btn', { active: playerCount === num+1 }]"
                @click="playerCount = num+1"
            >
              {{ num+1 }}
            </button>
          </div>
        </div>

        <div class="form-group rules-container">
          <h3>Regole del gioco:</h3>
          <ul class="rules-list">
            <li>Dopo aver ricevuto le carte, ogni giocatore dichiara quante mani pensa di vincere</li>
            <li>A turno, ogni giocatore gioca una carta</li>
            <li>La carta più alta vince la mano</li>
            <li>Ordine delle carte: 3, 2, 1, 10, 9, 8, 7, 6, 5, 4</li>
            <li>Ordine dei semi: denari, coppe, spade, bastoni</li>
            <li>Ricevi punti in base alla differenza tra dichiarazione e mani vinte</li>
            <li>Chi ha meno punti alla fine vince!</li>
          </ul>
        </div>

        <button type="submit" class="start-btn">Inizia Partita</button>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';

const playerName = ref('');
const playerCount = ref(4); // Default player count

const emit = defineEmits(['start-game']);

const handleSubmit = () => {
  if (playerName.value.trim()) {
    emit('start-game', playerName.value, playerCount.value);
  }
};
</script>

<style lang="scss" scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 70vh;
}

.login-card {
  background-color: #fff;
  border-radius: 10px;
  padding: 2rem;
  width: 100%;
  max-width: 500px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
  color: #333;

  h2 {
    text-align: center;
    font-size: 2rem;
    margin-bottom: 0.5rem;
    color: #c72c41;
  }

  .login-description {
    text-align: center;
    font-style: italic;
    margin-bottom: 2rem;
    color: #666;
  }
}

.login-form {
  .form-group {
    margin-bottom: 1.5rem;

    label {
      display: block;
      margin-bottom: 0.5rem;
      font-weight: bold;
    }

    input {
      width: 100%;
      padding: 0.75rem;
      border: 1px solid #ccc;
      border-radius: 5px;
      font-size: 1rem;

      &:focus {
        border-color: #c72c41;
        outline: none;
      }
    }
  }
}

.player-count-selector {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 0.5rem;
}

.player-count-btn {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: 2px solid #c72c41;
  background-color: white;
  color: #c72c41;
  font-weight: bold;
  cursor: pointer;
  display: flex;
  justify-content: center;
  align-items: center;
  transition: all 0.2s ease;

  &:hover {
    background-color: rgba(199, 44, 65, 0.1);
  }

  &.active {
    background-color: #c72c41;
    color: white;
  }
}

.rules-container {
  background-color: #f8f8f8;
  border-radius: 5px;
  padding: 1rem;

  h3 {
    margin-top: 0;
    color: #c72c41;
  }
}

.rules-list {
  padding-left: 1.5rem;

  li {
    margin-bottom: 0.5rem;
    font-size: 0.9rem;
  }
}

.start-btn {
  display: block;
  width: 100%;
  padding: 1rem;
  background-color: #c72c41;
  color: white;
  border: none;
  border-radius: 5px;
  font-size: 1.1rem;
  font-weight: bold;
  cursor: pointer;
  transition: background-color 0.2s ease;

  &:hover {
    background-color: darken(#c72c41, 10%);
  }
}
</style>