// stores/gameStore.js
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

// Card suits and values
const SUITS = ['denari', 'coppe', 'spade', 'bastoni'];
const VALUES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
const RANKS = {3: 10, 2: 9, 1: 8, 10: 7, 9: 6, 8: 5, 7: 4, 6: 3, 5: 2, 4: 1};
const SUIT_RANKS = {denari: 4, coppe: 3, spade: 2, bastoni: 1};

export const useGameStore = defineStore('game', () => {
    // State
    const players = ref([]);
    const currentRound = ref(1);
    const cardsPerRound = ref(5);
    const currentPlayer = ref(0);
    const tableCards = ref([]);
    const deck = ref([]);
    const gamePhase = ref('login'); // login, declaration, playing, scoring, finished
    const leadPlayer = ref(0); // Player who starts the current trick
    const currentTrick = ref([]); // Cards played in the current trick

    // Getters
    const currentPlayerObj = computed(() => players.value[currentPlayer.value]);
    const isHumanTurn = computed(() => currentPlayer.value === 0);
    const playableCards = computed(() => {
        if (gamePhase.value !== 'playing' || !isHumanTurn.value) return [];

        const hand = players.value[0].hand;
        if (currentTrick.value.length === 0) {
            // Lead - can play any card
            return hand;
        }

        // Follow - must follow suit if possible
        const leadSuit = currentTrick.value[0].suit;
        const hasSuit = hand.some(card => card.suit === leadSuit);

        if (hasSuit) {
            return hand.filter(card => card.suit === leadSuit);
        }

        // No cards of the lead suit - can play anything
        return hand;
    });

    // Actions
    function startGame(playerName, numPlayers) {
        // Initialize players
        players.value = [];
        players.value.push({
            id: 0,
            name: playerName,
            score: 0,
            hand: [],
            declaration: null,
            tricksWon: 0,
            isHuman: true
        });

        // Add bot players
        for (let i = 1; i < numPlayers; i++) {
            players.value.push({
                id: i,
                name: `Bot ${i}`,
                score: 0,
                hand: [],
                declaration: null,
                tricksWon: 0,
                isHuman: false
            });
        }

        // Initialize game state
        currentRound.value = 1;
        cardsPerRound.value = 5;
        currentPlayer.value = 0;
        tableCards.value = [];

        // Create and shuffle deck
        createDeck();

        // Deal cards
        dealCards();

        // Set game phase to declaration after cards are dealt
        gamePhase.value = 'declaration';

        // Save game state
        saveGameState();
    }

    function createDeck() {
        deck.value = [];
        let id = 0;

        for (const suit of SUITS) {
            for (const value of VALUES) {
                deck.value.push({
                    id: id++,
                    suit,
                    value,
                    rank: RANKS[value],
                    image: `/cards/${suit}_${value}.png`
                });
            }
        }

        // Shuffle deck
        for (let i = deck.value.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [deck.value[i], deck.value[j]] = [deck.value[j], deck.value[i]];
        }
    }

    function dealCards() {
        // Clear current hands
        for (const player of players.value) {
            player.hand = [];
            player.tricksWon = 0;
            player.declaration = null; // Reset declarations to null
        }

        // Deal cards based on current round
        for (let i = 0; i < cardsPerRound.value; i++) {
            for (let j = 0; j < players.value.length; j++) {
                const card = deck.value.pop();
                if (card) {
                    players.value[j].hand.push(card);
                }
            }
        }

        // Sort human player's hand
        sortPlayerHand(0);
    }

    function sortPlayerHand(playerIndex) {
        players.value[playerIndex].hand.sort((a, b) => {
            // Sort by suit first
            if (a.suit !== b.suit) {
                return SUIT_RANKS[b.suit] - SUIT_RANKS[a.suit];
            }
            // Then by rank
            return b.rank - a.rank;
        });
    }

    function makeDeclaration(playerId, declaration) {
        const player = players.value.find(p => p.id === playerId);
        if (player) {
            player.declaration = declaration;

            // If all players have made declarations, move to playing phase
            if (players.value.every(p => p.declaration !== null)) {
                gamePhase.value = 'playing';
                currentPlayer.value = 0;
                leadPlayer.value = 0;
            } else {
                // Move to next player
                currentPlayer.value = (currentPlayer.value + 1) % players.value.length;

                // If it's a bot's turn, make automatic declaration
                if (!players.value[currentPlayer.value].isHuman) {
                    makeBotDeclaration(currentPlayer.value);
                }
            }

            saveGameState();
        }
    }

    function makeBotDeclaration(botIndex) {
        const bot = players.value[botIndex];

        // Simple AI for declaration:
        // Count high cards (rank 7 and above) and declare that number
        let highCards = 0;
        for (const card of bot.hand) {
            if (card.rank >= 7) {
                highCards++;
            }
        }

        // Adjust declaration based on random factor
        const adjustment = Math.floor(Math.random() * 2) - 1; // -1, 0, or 1
        const declaration = Math.max(0, Math.min(highCards + adjustment, cardsPerRound.value));

        setTimeout(() => {
            makeDeclaration(bot.id, declaration);
        }, 1000);
    }

    function playCard(playerId, cardId) {
        if (gamePhase.value !== 'playing') return;

        const player = players.value.find(p => p.id === playerId);
        if (!player || player.id !== currentPlayer.value) return;

        // Find the card in the player's hand
        const cardIndex = player.hand.findIndex(c => c.id === cardId);
        if (cardIndex === -1) return;

        // If it's the human player, check if the card is playable
        if (player.isHuman && !isCardPlayable(player.hand[cardIndex])) {
            return;
        }

        // Remove the card from hand and add to current trick
        const card = player.hand.splice(cardIndex, 1)[0];
        currentTrick.value.push({...card, playerId});

        // Move to next player
        currentPlayer.value = (currentPlayer.value + 1) % players.value.length;

        // If all players have played a card, evaluate the trick
        if (currentTrick.value.length === players.value.length) {
            evaluateTrick();
        } else if (!players.value[currentPlayer.value].isHuman) {
            // If it's a bot's turn, make automatic play
            setTimeout(() => {
                playBotCard(currentPlayer.value);
            }, 1000);
        }

        saveGameState();
    }

    function isCardPlayable(card) {
        if (currentTrick.value.length === 0) return true;

        const leadSuit = currentTrick.value[0].suit;
        const hand = players.value[0].hand;

        // If player has cards of lead suit, they must play one
        if (hand.some(c => c.suit === leadSuit)) {
            return card.suit === leadSuit;
        }

        // Player has no cards of lead suit, can play anything
        return true;
    }

    function playBotCard(botIndex) {
        const bot = players.value[botIndex];
        let cardToPlay;

        if (currentTrick.value.length === 0) {
            // Leading - play highest card
            cardToPlay = [...bot.hand].sort((a, b) => b.rank - a.rank)[0];
        } else {
            const leadSuit = currentTrick.value[0].suit;
            const sameSuitCards = bot.hand.filter(c => c.suit === leadSuit);

            if (sameSuitCards.length > 0) {
                // Follow suit - play highest card of same suit
                cardToPlay = [...sameSuitCards].sort((a, b) => b.rank - a.rank)[0];
            } else {
                // No cards of lead suit - play lowest card
                cardToPlay = [...bot.hand].sort((a, b) => a.rank - b.rank)[0];
            }
        }

        if (cardToPlay) {
            playCard(bot.id, cardToPlay.id);
        }
    }

    function evaluateTrick() {
        // Find winning card
        let winningCard = currentTrick.value[0];

        for (let i = 1; i < currentTrick.value.length; i++) {
            const card = currentTrick.value[i];

            // If same suit, compare ranks
            if (card.suit === winningCard.suit) {
                if (card.rank > winningCard.rank) {
                    winningCard = card;
                }
            } else if (card.suit === 'denari') {
                // Denari trumps other suits
                if (winningCard.suit !== 'denari') {
                    winningCard = card;
                }
            }
        }

        // Award trick to winner
        const winner = players.value.find(p => p.id === winningCard.playerId);
        winner.tricksWon++;

        // Set winner as lead player for next trick
        leadPlayer.value = winner.id;
        currentPlayer.value = winner.id;

        // Clear current trick
        tableCards.value = [...currentTrick.value];
        currentTrick.value = [];

        // Check if round is over
        if (players.value.every(p => p.hand.length === 0)) {
            // Calculate scores
            calculateScore();
        } else {
            // Clear table after a delay
            setTimeout(() => {
                tableCards.value = [];

                // If it's a bot's turn, make automatic play
                if (!players.value[currentPlayer.value].isHuman) {
                    playBotCard(currentPlayer.value);
                }
            }, 2000);
        }

        saveGameState();
    }

    function calculateScore() {
        for (const player of players.value) {
            // Score is the absolute difference between declaration and tricks won
            const roundScore = Math.abs(player.declaration - player.tricksWon);
            player.score += roundScore;
        }

        gamePhase.value = 'scoring';

        // Check if game is over
        if (cardsPerRound.value === 1) {
            gamePhase.value = 'finished';
        } else {
            // Setup for next round
            setTimeout(() => {
                nextRound();
            }, 3000);
        }

        saveGameState();
    }

    function nextRound() {
        currentRound.value++;
        cardsPerRound.value = Math.max(1, 6 - currentRound.value);
        currentPlayer.value = 0;
        leadPlayer.value = 0;

        // Reset declarations
        for (const player of players.value) {
            player.declaration = null;
        }

        // Create new deck and deal cards
        createDeck();
        dealCards();

        // Move to declaration phase after cards are dealt
        gamePhase.value = 'declaration';

        saveGameState();
    }

    function saveGameState() {
        // Save to localStorage
        const gameState = {
            players: players.value,
            currentRound: currentRound.value,
            cardsPerRound: cardsPerRound.value,
            currentPlayer: currentPlayer.value,
            tableCards: tableCards.value,
            deck: deck.value,
            gamePhase: gamePhase.value,
            leadPlayer: leadPlayer.value,
            currentTrick: currentTrick.value
        };

        localStorage.setItem('biscaGameState', JSON.stringify(gameState));
    }

    function loadGame(gameState) {
        players.value = gameState.players;
        currentRound.value = gameState.currentRound;
        cardsPerRound.value = gameState.cardsPerRound;
        currentPlayer.value = gameState.currentPlayer;
        tableCards.value = gameState.tableCards;
        deck.value = gameState.deck;
        gamePhase.value = gameState.gamePhase;
        leadPlayer.value = gameState.leadPlayer;
        currentTrick.value = gameState.currentTrick;

        // If it's a bot's turn, trigger its play
        if (gamePhase.value === 'playing' &&
            !players.value[currentPlayer.value].isHuman) {
            setTimeout(() => {
                playBotCard(currentPlayer.value);
            }, 1000);
        } else if (gamePhase.value === 'declaration' &&
            !players.value[currentPlayer.value].isHuman) {
            setTimeout(() => {
                makeBotDeclaration(currentPlayer.value);
            }, 1000);
        }
    }

    function restartGame() {
        gamePhase.value = 'login';
        localStorage.removeItem('biscaGameState');
    }

    return {
        // State
        players,
        currentRound,
        cardsPerRound,
        currentPlayer,
        tableCards,
        deck,
        gamePhase,
        leadPlayer,
        currentTrick,

        // Getters
        currentPlayerObj,
        isHumanTurn,
        playableCards,

        // Actions
        startGame,
        makeDeclaration,
        playCard,
        restartGame,
        loadGame
    };
});