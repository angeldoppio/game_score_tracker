const { createApp } = Vue;

createApp({
    data() {
        return {
            players: [],
            newPlayerName: '',
            newStartingScore: -6, // Default starting score
            borrowHistory: [],
            showRemoveModal: false,
            playerToRemove: null,
        };
    },
    computed: {
        totalPositive() {
            return this.players.reduce((sum, player) => sum + (player.score > 0 ? player.score : 0), 0);
        },
        totalNegative() {
            return this.players.reduce((sum, player) => sum + (player.score < 0 ? player.score : 0), 0);
        },
        startingScore() {
            return this.players.reduce((sum, player) => sum + (player.startingScore || 0), 0);
        }
    },
    methods: {
        async fetchPlayers() {
            try {
                const response = await axios.get('http://localhost:3000/players');
                this.players = response.data.map(player => ({
                    ...player,
                    score: player.score || player.startingScore, // Ensure score is initialized
                }));
            } catch (error) {
                console.error('Failed to fetch players:', error);
            }
        },
        async addPlayer() {
            if (this.newPlayerName && this.newStartingScore) {
                try {
                    const response = await axios.post('http://localhost:3000/players', {
                        name: this.newPlayerName,
                        startingScore: this.newStartingScore,
                    });
                    this.players.push({
                        id: response.data.id, // Use the ID from the response
                        name: this.newPlayerName,
                        score: this.newStartingScore,
                        startingScore: this.newStartingScore,
                        borrowAmount: '',
                        lender: null,
                    });
                    this.newPlayerName = '';
                    this.newStartingScore = -6; // Reset to default
                } catch (error) {
                    console.error('Failed to add player:', error);
                }
            }
        },
        openRemoveModal(player) {
            this.playerToRemove = player;
            this.showRemoveModal = true;
        },
        async confirmRemove() {
            const playerId = this.playerToRemove.id;
            try {
                await axios.delete(`http://localhost:3000/players/${playerId}`);
                this.players = this.players.filter(player => player !== this.playerToRemove);
                this.showRemoveModal = false;
                this.playerToRemove = null;
            } catch (error) {
                console.error('Failed to remove player:', error);
            }
        },
        cancelRemove() {
            this.showRemoveModal = false;
            this.playerToRemove = null;
        },
        async endTurn(index) {
            if (this.players.length <= 1) return; // Prevent action if there's only one player
            const player = this.players[index];
            
            console.log('End turn for player:', player); // Debug log
        
            if (player.borrowAmount > 0 && player.lender !== null) {
                const lender = this.players[player.lender];
                
                if (lender.id === player.id) return; // Prevent borrowing from themselves
        
                lender.score += player.borrowAmount;
                player.score -= player.borrowAmount;
        
                await this.updateScore(lender.id, lender.score);
                await this.updateScore(player.id, player.score);
                
                this.updateBorrowHistory(player, lender, player.borrowAmount);
                
                console.log('Scores updated:', lender, player); // Debug log
            } else {
                console.log('Borrow amount or lender is invalid:', player.borrowAmount, player.lender); // Debug log
            }
        },
        
        async updateScore(playerId, newScore) {
            try {
                await axios.put(`http://localhost:3000/players/${playerId}`, {
                    score: newScore,
                });
            } catch (error) {
                console.error('Failed to update score:', error);
            }
        },
        updateBorrowHistory(borrower, lender, amount) {
            const transactionEntry = this.players.map(player => {
                if (player.id === borrower.id) {
                    return -amount; // Negative for the borrower
                } else if (player.id === lender.id) {
                    return amount; // Positive for the lender
                }
                return ''; // Empty for players with no transaction
            });
            this.borrowHistory.push(transactionEntry);
        }
    },
    mounted() {
        this.fetchPlayers(); // Fetch players when the component mounts
    }
}).mount('#app');
