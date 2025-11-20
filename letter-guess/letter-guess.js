/**
 * Letter Guess Game - Example implementation following GAME_TEMPLATE.md
 *
 * This game demonstrates:
 * - Loading letter data from letter-images.json
 * - Settings modal integration
 * - Confetti and game-over.wav on completion
 * - Proper screen transitions
 */

class LetterGuessGame {
    constructor() {
        // Game state
        this.isPlaying = false;
        this.selectedLetters = [];
        this.letterData = null;
        this.currentLetter = null;
        this.currentRound = 0;
        this.totalRounds = 5;
        this.score = 0;
        this.currentAudioPath = null; // Store current audio for replay

        // Initialize
        this.init();
    }

    async init() {
        await this.loadLetterData();
        await this.loadSettingsModal();
        this.setupEventListeners();
        this.initializeLetterSelection();
    }

    /**
     * Load letter data from letter-images.json
     */
    async loadLetterData() {
        try {
            const response = await fetch('../letter-images.json');
            this.letterData = await response.json();
            console.log('Letter data loaded successfully');
        } catch (error) {
            console.error('Error loading letter data:', error);
            alert('Kunne ikke laste bokstavdata. Prøv å laste siden på nytt.');
        }
    }

    /**
     * Load the settings modal from shared component
     */
    async loadSettingsModal() {
        try {
            const response = await fetch('../shared/settings-modal.html');
            const html = await response.text();
            document.getElementById('settings-modal-container').innerHTML = html;
            this.setupSettingsModal();
        } catch (error) {
            console.error('Error loading settings modal:', error);
        }
    }

    /**
     * Setup event listeners for all screens
     */
    setupEventListeners() {
        // Setup screen
        document.getElementById('start-game-btn')?.addEventListener('click', () => this.startGame());
        document.getElementById('back-btn')?.addEventListener('click', () => this.goBack());

        // Game screen
        document.getElementById('replay-word-btn')?.addEventListener('click', () => this.replayWordSound());

        // Victory screen
        document.getElementById('play-again-btn')?.addEventListener('click', () => this.playAgain());
        document.getElementById('main-menu-btn')?.addEventListener('click', () => this.goToMainMenu());
    }

    /**
     * Setup settings modal functionality
     */
    setupSettingsModal() {
        const settingsBtn = document.getElementById('settings-btn');
        const closeBtn = document.getElementById('close-settings-btn');
        const restartBtn = document.getElementById('restart-btn');
        const overlay = document.getElementById('settings-overlay');
        const modal = document.getElementById('settings-modal');

        const closeModal = () => {
            modal?.classList.add('hidden');
            overlay?.classList.add('hidden');
        };

        // Open modal
        settingsBtn?.addEventListener('click', () => {
            modal?.classList.remove('hidden');
            overlay?.classList.remove('hidden');
        });

        // Close modal
        closeBtn?.addEventListener('click', closeModal);
        overlay?.addEventListener('click', closeModal);

        // Restart game
        restartBtn?.addEventListener('click', () => {
            closeModal();
            this.restartGame();
        });
    }

    /**
     * Initialize letter selection using shared component
     */
    initializeLetterSelection() {
        // Initialize the letter selection component
        this.letterSelection = new LetterSelection({
            containerSelector: '#letter-selection',
            selectAllBtnSelector: '#select-all-btn',
            selectNoneBtnSelector: '#select-none-btn',
            minSelections: 2,
            defaultSelections: 5,
            onSelectionChange: (selectedLetters) => {
                this.selectedLetters = selectedLetters;
            }
        });

        // Set initial selected letters
        this.selectedLetters = this.letterSelection.getSelectedLetters();
    }

    /**
     * Start the game
     */
    startGame() {
        if (this.selectedLetters.length < 2) {
            alert('Velg minst 2 bokstaver for å spille!');
            return;
        }

        // Get selected rounds
        const roundsSelect = document.getElementById('rounds-to-play');
        this.totalRounds = parseInt(roundsSelect.value);

        // Reset game state
        this.currentRound = 0;
        this.score = 0;
        this.isPlaying = true;

        // Update UI
        document.getElementById('total-rounds').textContent = this.totalRounds;

        // Transition to game screen
        document.getElementById('setup-screen').classList.add('hidden');
        document.getElementById('game-screen').classList.remove('hidden');

        // Start first round
        this.nextRound();
    }

    /**
     * Start next round
     */
    async nextRound() {
        if (this.currentRound >= this.totalRounds) {
            this.gameComplete();
            return;
        }

        this.currentRound++;
        this.updateScore();

        // Pick a random letter and show it
        await this.pickRandomLetter();
    }

    /**
     * Pick a random letter from selected letters and display its content
     */
    async pickRandomLetter() {
        // Pick random letter from selected letters
        const randomIndex = Math.floor(Math.random() * this.selectedLetters.length);
        this.currentLetter = this.selectedLetters[randomIndex];

        // Get letter content
        const content = await this.getLetterContent(this.currentLetter);

        if (!content) {
            console.error('Could not get content for letter:', this.currentLetter);
            this.nextRound();
            return;
        }

        // Display image or emoji
        const imageContent = document.getElementById('image-content');
        if (content.image.startsWith('images/') || content.image.startsWith('http')) {
            imageContent.innerHTML = `<img src="../${content.image}" alt="${content.word}">`;
        } else {
            // It's an emoji
            imageContent.textContent = content.image;
        }

        // Don't display the word - that would make it too easy!
        // The player should guess based on the image and sound only
        document.getElementById('word-label').textContent = '';

        // Store the audio path for replay functionality
        this.currentAudioPath = content.audio;

        // Play word sound (not letter sound)
        if (content.audio) {
            try {
                const audio = new Audio(`../${content.audio}`);
                await audio.play();
            } catch (error) {
                console.log('Could not play word sound:', error);
            }
        }

        // Show letter options
        this.showLetterOptions();
    }

    /**
     * Replay the current word sound
     */
    async replayWordSound() {
        if (this.currentAudioPath) {
            try {
                const audio = new Audio(`../${this.currentAudioPath}`);
                await audio.play();
            } catch (error) {
                console.log('Could not replay word sound:', error);
            }
        }
    }

    /**
     * Get content (word, image, audio) for a specific letter
     */
    async getLetterContent(letter) {
        if (!this.letterData || !this.letterData[letter]) {
            return null;
        }

        const data = this.letterData[letter];
        const randomIndex = Math.floor(Math.random() * data.words.length);

        return {
            word: data.words[randomIndex],
            image: data.images[randomIndex],
            audio: data.audio[randomIndex],
            difficulty: data.difficulty[randomIndex],
            letterSound: data.letterSound
        };
    }

    /**
     * Show letter options for the player to choose from
     */
    showLetterOptions() {
        const optionsContainer = document.getElementById('letter-options');
        optionsContainer.innerHTML = '';

        // Create a set of 4 random letters including the correct one
        const options = [this.currentLetter];

        // First, try to use letters from the selected pool
        const selectedPool = this.selectedLetters.filter(l => l !== this.currentLetter);
        while (options.length < 4 && selectedPool.length > 0) {
            const randomIndex = Math.floor(Math.random() * selectedPool.length);
            options.push(selectedPool[randomIndex]);
            selectedPool.splice(randomIndex, 1);
        }

        // If we still need more options, add from all available letters
        if (options.length < 4) {
            const allLetters = Object.keys(this.letterData).filter(l => !options.includes(l));
            while (options.length < 4 && allLetters.length > 0) {
                const randomIndex = Math.floor(Math.random() * allLetters.length);
                options.push(allLetters[randomIndex]);
                allLetters.splice(randomIndex, 1);
            }
        }

        // Shuffle options
        options.sort(() => Math.random() - 0.5);

        // Create buttons
        options.forEach(letter => {
            const button = document.createElement('button');
            button.className = 'letter-btn';
            button.textContent = letter;
            button.addEventListener('click', () => this.checkAnswer(letter, button));
            optionsContainer.appendChild(button);
        });
    }

    /**
     * Check if the player's answer is correct
     */
    async checkAnswer(selectedLetter, button) {
        if (selectedLetter === this.currentLetter) {
            // Correct answer!
            const allButtons = document.querySelectorAll('.letter-btn');
            allButtons.forEach(btn => btn.disabled = true);

            button.classList.add('correct');
            this.score++;
            this.updateScore();

            // Wait a moment, then go to next round
            setTimeout(() => {
                this.nextRound();
            }, 1500);
        } else {
            // Wrong answer - just mark this button as incorrect
            button.classList.add('incorrect');
            button.disabled = true;

            // Shake animation feedback
            setTimeout(() => {
                button.classList.remove('incorrect');
            }, 600);
        }
    }

    /**
     * Update score display
     */
    updateScore() {
        document.getElementById('current-score').textContent = this.score;
    }

    /**
     * Game completed - show victory screen with confetti and sound
     */
    async gameComplete() {
        this.isPlaying = false;

        // Update victory stats
        document.getElementById('final-score').textContent = this.score;
        document.getElementById('final-total').textContent = this.totalRounds;

        // Transition to victory screen
        document.getElementById('game-screen').classList.add('hidden');
        document.getElementById('victory-screen').classList.remove('hidden');

        // Trigger confetti animation (from game-effects.js)
        if (typeof triggerConfetti === 'function') {
            triggerConfetti();
        }

        // Play game over sound (from game-effects.js)
        if (typeof playGameOverSound === 'function') {
            playGameOverSound();
        }
    }

    /**
     * Restart the game (back to setup screen)
     */
    restartGame() {
        this.isPlaying = false;
        this.currentRound = 0;
        this.score = 0;

        // Hide all screens
        document.getElementById('game-screen').classList.add('hidden');
        document.getElementById('victory-screen').classList.add('hidden');

        // Show setup screen
        document.getElementById('setup-screen').classList.remove('hidden');
    }

    /**
     * Play again (restart to setup)
     */
    playAgain() {
        this.restartGame();
    }

    /**
     * Go back to main menu
     */
    goToMainMenu() {
        window.location.href = '../index.html';
    }

    /**
     * Go back from setup screen
     */
    goBack() {
        window.location.href = '../index.html';
    }
}

// Initialize game when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new LetterGuessGame();
});
