class FindSoundsGame {
    constructor() {
        this.letterData = null;
        this.currentWord = '';
        this.currentLetterKey = '';
        this.wordIndex = 0;
        this.guessedLetters = [];
        this.wrongGuesses = 0;
        this.maxWrongGuesses = 7;
        this.gameEnded = false;
        this.currentLetterIndex = 0;
        this.uniqueLetters = [];
        this.selectedLetters = new Set();
        this.letterSelection = null;
        this.skipLettersEnabled = false;
        this.lettersToSkip = new Set();
        this.skipLetterSelection = null;
        
        this.flowerPetals = ['petal1', 'petal2', 'petal3', 'petal4', 'petal5', 'petal6', 'petal7'];
        
        this.initializeGame();
    }

    async initializeGame() {
        await this.loadLetterData();
        this.setupEventListeners();
        this.initializeLetterSelection();
        this.initializeSkipLetterSelection();
        this.setupSkipLettersToggle();
        this.showStartScreen();
    }

    async loadLetterData() {
        try {
            const response = await fetch('../letter-images.json');
            this.letterData = await response.json();
        } catch (error) {
            console.error('Error loading letter data:', error);
        }
    }

    setupEventListeners() {
        document.getElementById('start-game-btn').addEventListener('click', () => {
            if (!this.letterSelection.isValidSelection()) {
                alert(this.letterSelection.getValidationMessage());
                return;
            }
            this.selectedLetters = new Set(this.letterSelection.getSelectedLetters());

            // Handle skip letters option
            const mainSkipCheckbox = document.getElementById('skip-letters-checkbox');
            const autoSkipUnselected = document.getElementById('auto-skip-unselected-checkbox').checked;

            // If auto-skip is enabled, automatically enable the main skip feature
            if (autoSkipUnselected) {
                mainSkipCheckbox.checked = true;
            }

            this.skipLettersEnabled = mainSkipCheckbox.checked;

            console.log('Before setting skip options:', {
                skipLettersEnabled: this.skipLettersEnabled,
                autoSkipUnselected: autoSkipUnselected,
                lettersToSkip: Array.from(this.lettersToSkip)
            });

            if (this.skipLettersEnabled) {
                if (autoSkipUnselected) {
                    // Auto-populate skip letters with unselected letters
                    this.updateAutoSkipSelection();
                }
                this.lettersToSkip = new Set(this.skipLetterSelection.getSelectedLetters());
            } else {
                this.lettersToSkip = new Set();
            }

            console.log('After setting skip options:', {
                skipLettersEnabled: this.skipLettersEnabled,
                lettersToSkip: Array.from(this.lettersToSkip)
            });

            this.hideStartScreen();
            this.showGameScreen();
            this.startNewGame();
        });

        document.querySelectorAll('.letter-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                if (!this.gameEnded && !btn.disabled) {
                    this.guessLetter(btn.dataset.letter);
                }
            });
        });

        document.querySelectorAll('.sound-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.playLetterSound(btn.dataset.letter);
            });
        });

        document.getElementById('new-game-btn').addEventListener('click', () => {
            this.startNewGame();
        });

        document.getElementById('replay-letter-btn').addEventListener('click', () => {
            this.playCurrentLetterSound();
        });

        document.getElementById('play-found-letters-btn').addEventListener('click', () => {
            this.playFoundLetters();
        });

        document.addEventListener('keydown', (e) => {
            const key = e.key.toUpperCase();
            if (!this.gameEnded && this.isValidLetter(key)) {
                const btn = document.querySelector(`[data-letter="${key}"]`);
                if (btn && !btn.disabled) {
                    this.guessLetter(key);
                }
            }
        });
        
    }

    isValidLetter(letter) {
        const validLetters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZÆØÅ';
        return validLetters.includes(letter);
    }

    startNewGame() {
        if (!this.letterData) {
            console.error('Letter data not loaded yet');
            return;
        }
        
        this.selectRandomWord();
        this.guessedLetters = [];
        this.wrongGuesses = 0;
        this.gameEnded = false;
        this.currentLetterIndex = 0;
        this.createUniqueLettersList();
        
        this.resetDisplay();
        this.createWordDisplay();
        this.updateGameInfo();
        this.hideGameResult();
        
        // Play the first letter sound immediately after setup
        this.playNextLetterSound();
    }

    selectRandomWord() {
        const availableLetters = Object.keys(this.letterData).filter(letter => 
            this.selectedLetters.has(letter)
        );
        
        if (availableLetters.length === 0) {
            console.error('No available letters selected');
            return;
        }
        
        this.currentLetterKey = availableLetters[Math.floor(Math.random() * availableLetters.length)];
        
        const letterInfo = this.letterData[this.currentLetterKey];
        this.wordIndex = Math.floor(Math.random() * letterInfo.words.length);
        this.currentWord = letterInfo.words[this.wordIndex].toUpperCase();
        
        console.log('Selected word:', this.currentWord, 'from letter:', this.currentLetterKey);
    }

    createUniqueLettersList() {
        this.uniqueLetters = [];
        const seen = new Set();

        for (let letter of this.currentWord) {
            if (!seen.has(letter) && letter !== ' ') {
                this.uniqueLetters.push(letter);
                seen.add(letter);
            }
        }
        console.log('Unique letters in order:', this.uniqueLetters);
        console.log('Letters to skip:', Array.from(this.lettersToSkip));
    }

    async playNextLetterSound() {
        if (this.currentLetterIndex < this.uniqueLetters.length) {
            const nextLetter = this.uniqueLetters[this.currentLetterIndex];

            console.log(`Playing letter: ${nextLetter}, Skip enabled: ${this.skipLettersEnabled}, Should skip: ${this.lettersToSkip.has(nextLetter)}`);
            console.log(`Letters to skip:`, Array.from(this.lettersToSkip));

            // Check if letter should be skipped
            if (this.skipLettersEnabled && this.lettersToSkip.has(nextLetter)) {
                console.log(`Auto-progressing through skipped letter: ${nextLetter}`);
                await this.autoProgressSkippedLetter(nextLetter);
                return;
            }

            this.updateReplayButton();
            await playLetterSound(nextLetter);
        } else {
            this.updateReplayButton();
        }
    }

    async playCurrentLetterSound() {
        if (this.currentLetterIndex < this.uniqueLetters.length) {
            const currentLetter = this.uniqueLetters[this.currentLetterIndex];
            await playLetterSound(currentLetter);
        }
    }

    async playLetterSound(letter) {
        await playLetterSound(letter);
    }

    async playFoundLetters() {
        await playFoundLetters(this.currentWord, this.guessedLetters, 1000);
    }

    updateReplayButton() {
        const replayBtn = document.getElementById('replay-letter-btn');
        if (this.currentLetterIndex < this.uniqueLetters.length && !this.gameEnded) {
            replayBtn.textContent = '🔊 Spill av bokstav igjen';
            replayBtn.disabled = false;
        } else {
            replayBtn.textContent = '🔊 Spill av bokstav igjen';
            replayBtn.disabled = true;
        }
        
        this.updateFoundLettersButton();
    }

    updateFoundLettersButton() {
        const foundLettersBtn = document.getElementById('play-found-letters-btn');
        
        // Check if any letters have been found
        const hasFoundLetters = this.guessedLetters.some(letter => 
            this.currentWord.includes(letter)
        );
        
        foundLettersBtn.disabled = !hasFoundLetters || this.gameEnded;
    }

    createWordDisplay() {
        const wordContainer = document.getElementById('word-container');
        wordContainer.innerHTML = '';
        
        for (let i = 0; i < this.currentWord.length; i++) {
            const letterSlot = document.createElement('div');
            letterSlot.className = 'letter-slot';
            letterSlot.dataset.index = i;
            
            if (this.guessedLetters.includes(this.currentWord[i]) || this.currentWord[i] === ' ') {
                letterSlot.textContent = this.currentWord[i];
                letterSlot.classList.add('filled');
            }
            
            wordContainer.appendChild(letterSlot);
        }
    }

    resetDisplay() {
        document.querySelectorAll('.letter-btn').forEach(btn => {
            btn.disabled = false;
            btn.classList.remove('correct', 'incorrect');
        });
        
        // Show all flower petals
        this.flowerPetals.forEach(petal => {
            document.getElementById(petal).style.display = 'block';
        });
        
        // Show smile, hide frown
        document.getElementById('smile').style.display = 'block';
        document.getElementById('frown').style.display = 'none';
        
        this.updateReplayButton();
    }

    guessLetter(letter) {
        if (this.guessedLetters.includes(letter)) {
            return;
        }
        
        this.guessedLetters.push(letter);
        const btn = document.querySelector(`[data-letter="${letter}"]`);
        btn.disabled = true;
        
        if (this.currentWord.includes(letter)) {
            btn.classList.add('correct');
            this.revealLetters(letter);
            
            // Check if this was the expected next letter
            if (this.currentLetterIndex < this.uniqueLetters.length && 
                letter === this.uniqueLetters[this.currentLetterIndex]) {
                this.currentLetterIndex++;
                
                // Play next letter sound after a short delay
                setTimeout(() => {
                    this.playNextLetterSound();
                }, 500);
            }
            
            if (this.isWordComplete()) {
                this.endGame(true);
            }
        } else {
            btn.classList.add('incorrect');
            this.wrongGuesses++;
            this.removeFlowerPetal();
            
            if (this.wrongGuesses >= this.maxWrongGuesses) {
                this.endGame(false);
            }
        }
        
        this.updateGameInfo();
    }

    revealLetters(letter) {
        const letterSlots = document.querySelectorAll('.letter-slot');
        
        for (let i = 0; i < this.currentWord.length; i++) {
            if (this.currentWord[i] === letter) {
                letterSlots[i].textContent = letter;
                letterSlots[i].classList.add('filled');
            }
        }
    }


    removeFlowerPetal() {
        if (this.wrongGuesses <= this.flowerPetals.length) {
            const petalToRemove = this.flowerPetals[this.wrongGuesses - 1];
            document.getElementById(petalToRemove).style.display = 'none';
        }
        
        // Change to sad face when losing petals
        if (this.wrongGuesses >= 4) {
            document.getElementById('smile').style.display = 'none';
            document.getElementById('frown').style.display = 'block';
        }
    }

    isWordComplete() {
        for (let letter of this.currentWord) {
            if (letter !== ' ' && !this.guessedLetters.includes(letter)) {
                return false;
            }
        }
        return true;
    }

    updateGameInfo() {
        document.getElementById('attempts-left').textContent = this.maxWrongGuesses - this.wrongGuesses;
        document.getElementById('used-letters').textContent = this.guessedLetters.join(', ');
    }

    async endGame(won) {
        this.gameEnded = true;
        this.updateReplayButton();
        this.updateFoundLettersButton();
        
        if (won) {
            this.showGameResult('Du vant! 🎉', true);
            triggerConfetti();
            await this.playFoundLetters();
            setTimeout(async () => {
                await this.playWordSounds();
            }, 1000);
        } else {
            this.revealWord();
            this.showGameResult('Du tapte! 😢', false);
        }
    }


    revealWord() {
        const letterSlots = document.querySelectorAll('.letter-slot');
        for (let i = 0; i < this.currentWord.length; i++) {
            letterSlots[i].textContent = this.currentWord[i];
            letterSlots[i].classList.add('filled');
        }
    }

    async playWordSounds() {
        const letterInfo = this.letterData[this.currentLetterKey];
        const wordAudio = letterInfo.audio[this.wordIndex];
        
        if (wordAudio) {
            try {
                const audio = new Audio(`../${wordAudio}`);
                await audio.play();
            } catch (error) {
                console.log('Could not play word sound:', error);
            }
        }
    }

    showGameResult(message, won) {
        const resultDiv = document.getElementById('game-result');
        const messageDiv = document.getElementById('result-message');
        const imageContainer = document.getElementById('word-image-container');
        
        messageDiv.textContent = message;
        messageDiv.className = won ? 'win' : 'lose';
        
        if (won) {
            this.displayWordImage(imageContainer);
        } else {
            imageContainer.innerHTML = `<p>Ordet var: <strong>${this.currentWord}</strong></p>`;
        }
        
        resultDiv.style.display = 'flex';
    }

    displayWordImage(container) {
        const letterInfo = this.letterData[this.currentLetterKey];
        const imageData = letterInfo.images[this.wordIndex];
        
        container.innerHTML = `<p>Ordet var: <strong>${this.currentWord}</strong></p>`;
        
        if (imageData) {
            // Check if it's a URL/file path or an emoji
            if (imageData.startsWith('http') || imageData.includes('/')) {
                // It's a URL or file path - use img tag
                const img = document.createElement('img');
                img.id = 'word-image';
                img.alt = this.currentWord;
                img.src = imageData.startsWith('http') ? imageData : `../${imageData}`;
                
                img.onerror = () => {
                    img.style.display = 'none';
                    const emojiDiv = document.createElement('div');
                    emojiDiv.style.fontSize = '4rem';
                    emojiDiv.style.textAlign = 'center';
                    emojiDiv.style.margin = '1rem auto';
                    emojiDiv.textContent = '🖼️'; // Fallback icon
                    container.appendChild(emojiDiv);
                };
                
                container.appendChild(img);
            } else {
                // It's an emoji or text - use div
                const emojiDiv = document.createElement('div');
                emojiDiv.id = 'word-emoji';
                emojiDiv.style.fontSize = '4rem';
                emojiDiv.style.textAlign = 'center';
                emojiDiv.style.margin = '1rem auto';
                emojiDiv.textContent = imageData;
                container.appendChild(emojiDiv);
            }
        }
    }

    hideGameResult() {
        document.getElementById('game-result').style.display = 'none';
    }

    showStartScreen() {
        document.getElementById('start-screen').style.display = 'block';
        document.getElementById('game-screen').style.display = 'none';
    }

    hideStartScreen() {
        document.getElementById('start-screen').style.display = 'none';
    }

    showGameScreen() {
        document.getElementById('game-screen').style.display = 'block';
    }
    
    initializeLetterSelection() {
        this.letterSelection = new LetterSelection({
            containerSelector: '#letter-selection',
            selectAllBtnSelector: '#select-all-btn',
            selectNoneBtnSelector: '#select-none-btn',
            letters: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z', 'Æ', 'Ø', 'Å'],
            minSelections: 1,
            defaultSelections: 3,
            onSelectionChange: (selectedLetters) => {
                console.log('Selected letters:', selectedLetters);
                // Update auto-skip selection if that option is enabled
                const autoSkipCheckbox = document.getElementById('auto-skip-unselected-checkbox');
                if (autoSkipCheckbox && autoSkipCheckbox.checked) {
                    this.updateAutoSkipSelection();
                }
            }
        });
    }

    initializeSkipLetterSelection() {
        this.skipLetterSelection = new LetterSelection({
            containerSelector: '#skip-letter-selection',
            selectAllBtnSelector: '#skip-select-all-btn',
            selectNoneBtnSelector: '#skip-select-none-btn',
            letters: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z', 'Æ', 'Ø', 'Å'],
            minSelections: 0,
            defaultSelections: 0,
            onSelectionChange: (selectedLetters) => {
                console.log('Letters to skip:', selectedLetters);
            }
        });
    }

    setupSkipLettersToggle() {
        const checkbox = document.getElementById('skip-letters-checkbox');
        const autoSkipCheckbox = document.getElementById('auto-skip-unselected-checkbox');
        const skipLettersContainer = document.getElementById('skip-letters-selection');

        checkbox.addEventListener('change', () => {
            this.updateSkipLettersVisibility();
        });

        autoSkipCheckbox.addEventListener('change', () => {
            // Auto-enable the main skip checkbox when auto-skip is enabled
            if (autoSkipCheckbox.checked) {
                checkbox.checked = true;
                this.updateAutoSkipSelection();
            }
            this.updateSkipLettersVisibility();
        });
    }

    updateSkipLettersVisibility() {
        const checkbox = document.getElementById('skip-letters-checkbox');
        const autoSkipCheckbox = document.getElementById('auto-skip-unselected-checkbox');
        const skipLettersContainer = document.getElementById('skip-letters-selection');

        const shouldShowContainer = checkbox.checked && !autoSkipCheckbox.checked;
        skipLettersContainer.style.display = shouldShowContainer ? 'block' : 'none';
    }

    updateAutoSkipSelection() {
        const autoSkipCheckbox = document.getElementById('auto-skip-unselected-checkbox');
        if (!autoSkipCheckbox.checked) return;

        // Get all letters that are NOT selected in the main selection
        const selectedLetters = this.letterSelection.getSelectedLetters();
        const allLetters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z', 'Æ', 'Ø', 'Å'];
        const unselectedLetters = allLetters.filter(letter => !selectedLetters.includes(letter));

        // Set these as the letters to skip
        this.skipLetterSelection.setSelectedLetters(unselectedLetters);
    }


    async autoProgressSkippedLetter(letter) {
        // Play the letter sound first
        this.updateReplayButton();
        await playLetterSound(letter);

        // Automatically reveal and progress after sound finishes
        setTimeout(() => {
            if (!this.guessedLetters.includes(letter)) {
                this.guessedLetters.push(letter);
                const btn = document.querySelector(`[data-letter="${letter}"]`);
                if (btn) {
                    btn.disabled = true;
                    btn.classList.add('correct');
                }

                this.revealLetters(letter);

                // Move to next letter
                this.currentLetterIndex++;

                // Check if word is complete first
                if (this.isWordComplete()) {
                    this.endGame(true);
                } else {
                    // Play next letter sound after a short delay
                    setTimeout(() => {
                        this.playNextLetterSound();
                    }, 500);
                }
            }
        }, 1000); // Wait 1 second after sound finishes before auto-progressing
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new FindSoundsGame();
});