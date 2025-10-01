/**
 * Word Safari Game - Norwegian Phonics Safari Game
 * Find all the words that start with the selected letter
 */

class WordSafari {
    constructor() {
        this.letterData = null;
        this.currentLetter = null;
        this.wordsToFind = [];
        this.wrongWords = [];
        this.allWords = [];
        this.foundWords = new Set();
        this.gameSettings = {
            wordsToFind: 5,
            totalWords: 10
        };
        this.letterSelection = null;
        this.audioCache = new Map();
        
        this.init();
    }

    async init() {
        try {
            await this.loadLetterData();
            this.initializeLetterSelection();
            this.setupEventListeners();
        } catch (error) {
            console.error('Failed to initialize Word Safari:', error);
        }
    }

    async loadLetterData() {
        try {
            const response = await fetch('../letter-images.json');
            if (!response.ok) {
                throw new Error('Could not load letter data');
            }
            const rawData = await response.json();
            // Apply difficulty filter
            this.letterData = applyDifficultyFilter(rawData);
            console.log(`Loaded letter data with difficulty: ${getDifficultyLabel()}`);
        } catch (error) {
            console.error('Error loading letter data:', error);
            throw error;
        }
    }

    initializeLetterSelection() {
        // Initialize the letter selection component
        this.letterSelection = new LetterSelection({
            containerSelector: '#letter-selection',
            selectAllBtnSelector: '#select-all-btn',
            selectNoneBtnSelector: '#select-none-btn',
            maxSelections: 1,
            minSelections: 1,
            defaultSelections: 1,
            onSelectionChange: (selectedLetters) => {
                this.updateStartButton();
            }
        });
    }

    setupEventListeners() {
        // Setup screen buttons
        document.getElementById('start-game-btn').addEventListener('click', () => {
            this.startGame();
        });

        document.getElementById('back-btn').addEventListener('click', () => {
            window.location.href = '../index.html';
        });

        // Game screen buttons
        document.getElementById('letter-sound-btn').addEventListener('click', () => {
            this.playLetterSound();
        });

        // Victory screen buttons
        document.getElementById('play-again-btn').addEventListener('click', () => {
            this.resetToSetup();
        });

        document.getElementById('main-menu-btn').addEventListener('click', () => {
            window.location.href = '../index.html';
        });

        // Settings change listeners
        document.getElementById('words-to-find').addEventListener('change', (e) => {
            this.gameSettings.wordsToFind = parseInt(e.target.value);
            this.updateTotalWordsMinimum();
        });

        document.getElementById('total-words').addEventListener('change', (e) => {
            this.gameSettings.totalWords = parseInt(e.target.value);
        });
    }

    updateTotalWordsMinimum() {
        const totalWordsSelect = document.getElementById('total-words');
        const minTotal = this.gameSettings.wordsToFind + 1; // At least one wrong word
        
        // Update options to ensure minimum
        Array.from(totalWordsSelect.options).forEach(option => {
            const value = parseInt(option.value);
            if (value < minTotal) {
                option.disabled = true;
            } else {
                option.disabled = false;
            }
        });

        // If current selection is too low, update it
        if (this.gameSettings.totalWords < minTotal) {
            const availableOptions = Array.from(totalWordsSelect.options)
                .filter(option => !option.disabled);
            if (availableOptions.length > 0) {
                totalWordsSelect.value = availableOptions[0].value;
                this.gameSettings.totalWords = parseInt(availableOptions[0].value);
            }
        }
    }

    updateStartButton() {
        const startBtn = document.getElementById('start-game-btn');
        const selectedLetters = this.letterSelection.getSelectedLetters();
        
        if (selectedLetters.length === 1) {
            startBtn.disabled = false;
            startBtn.textContent = 'Start Safari!';
        } else {
            startBtn.disabled = true;
            startBtn.textContent = 'Velg en bokstav';
        }
    }

    async startGame() {
        const selectedLetters = this.letterSelection.getSelectedLetters();
        if (selectedLetters.length !== 1) {
            alert('Vennligst velg nøyaktig én bokstav!');
            return;
        }

        this.currentLetter = selectedLetters[0];
        
        // Show loading indicator
        document.getElementById('audio-loading').classList.remove('hidden');
        
        try {
            await this.prepareGameWords();
            await this.preloadAudio();
            
            this.showGameScreen();
            this.renderGameField();
        } catch (error) {
            console.error('Error starting game:', error);
            alert('Kunne ikke starte spillet. Prøv igjen.');
        } finally {
            document.getElementById('audio-loading').classList.add('hidden');
        }
    }

    async prepareGameWords() {
        const letterInfo = this.letterData[this.currentLetter];
        if (!letterInfo || !letterInfo.words || letterInfo.words.length === 0) {
            throw new Error(`No words found for letter ${this.currentLetter}`);
        }

        // Get correct words (words that start with the current letter)
        const correctWords = letterInfo.words.map((word, index) => ({
            word: word,
            image: letterInfo.images[index],
            audio: letterInfo.audio[index],
            letter: this.currentLetter,
            isCorrect: true
        }));

        // Shuffle and select the required number of correct words
        const shuffledCorrect = this.shuffleArray([...correctWords]);
        const availableCorrectWords = Math.min(correctWords.length, this.gameSettings.wordsToFind);
        this.wordsToFind = shuffledCorrect.slice(0, availableCorrectWords);

        // Update game settings to reflect actual available words
        if (this.wordsToFind.length < this.gameSettings.wordsToFind) {
            const originalCount = this.gameSettings.wordsToFind;
            this.gameSettings.wordsToFind = this.wordsToFind.length;
            console.log(`Note: Letter ${this.currentLetter} only has ${this.wordsToFind.length} words available, adjusting from ${originalCount} to ${this.wordsToFind.length}`);
            
            // Show user notification
            setTimeout(() => {
                alert(`Obs! Bokstav ${this.currentLetter} har bare ${this.wordsToFind.length} ord tilgjengelig.\nSpillet justeres til å finne ${this.wordsToFind.length} ord i stedet for ${originalCount}.`);
            }, 100);
        }

        // Get wrong words from other letters
        const wrongWordsNeeded = this.gameSettings.totalWords - this.wordsToFind.length;
        this.wrongWords = await this.getWrongWords(wrongWordsNeeded);

        // Combine all words and shuffle
        this.allWords = this.shuffleArray([...this.wordsToFind, ...this.wrongWords]);
        this.foundWords.clear();
    }

    async getWrongWords(count) {
        const wrongWords = [];
        const otherLetters = Object.keys(this.letterData).filter(letter => letter !== this.currentLetter);
        
        // Collect all wrong words from other letters
        const allWrongWords = [];
        otherLetters.forEach(letter => {
            const letterInfo = this.letterData[letter];
            if (letterInfo && letterInfo.words) {
                letterInfo.words.forEach((word, index) => {
                    allWrongWords.push({
                        word: word,
                        image: letterInfo.images[index],
                        audio: letterInfo.audio[index],
                        letter: letter,
                        isCorrect: false
                    });
                });
            }
        });

        // Shuffle and select the required number
        const shuffled = this.shuffleArray(allWrongWords);
        return shuffled.slice(0, count);
    }

    async preloadAudio() {
        const audioPromises = [];
        
        // Preload find_words.wav
        audioPromises.push(this.loadAudio('./find_words.wav', 'find_words'));
        
        // Preload letter sound
        const letterInfo = this.letterData[this.currentLetter];
        if (letterInfo && letterInfo.letterSound) {
            const audioPath = `../${letterInfo.letterSound}`;
            audioPromises.push(this.loadAudio(audioPath, `letter-${this.currentLetter}`));
        }

        // Preload all word sounds
        this.allWords.forEach((wordObj, index) => {
            if (wordObj.audio) {
                const audioPath = `../${wordObj.audio}`;
                audioPromises.push(this.loadAudio(audioPath, `word-${index}`));
            }
        });

        try {
            await Promise.all(audioPromises);
        } catch (error) {
            console.warn('Some audio files could not be loaded:', error);
        }
    }

    loadAudio(src, key) {
        return new Promise((resolve) => {
            const audio = new Audio(src);
            audio.preload = 'auto';
            
            const handleLoad = () => {
                this.audioCache.set(key, audio);
                audio.removeEventListener('canplaythrough', handleLoad);
                audio.removeEventListener('error', handleError);
                resolve();
            };

            const handleError = () => {
                console.warn(`Could not load audio: ${src}`);
                audio.removeEventListener('canplaythrough', handleLoad);
                audio.removeEventListener('error', handleError);
                resolve(); // Resolve anyway to not block the game
            };

            audio.addEventListener('canplaythrough', handleLoad);
            audio.addEventListener('error', handleError);
        });
    }

    showGameScreen() {
        document.getElementById('setup-screen').classList.add('hidden');
        document.getElementById('game-screen').classList.remove('hidden');
        
        // Update UI elements
        document.getElementById('current-letter').textContent = this.currentLetter;
        document.getElementById('found-count').textContent = '0';
        document.getElementById('total-to-find').textContent = this.gameSettings.wordsToFind.toString();
        
        // Play intro audio sequence
        this.playIntroAudio();
    }

    async playIntroAudio() {
        try {
            // First play find_words.wav
            const findWordsAudio = this.audioCache.get('find_words');
            if (findWordsAudio) {
                await findWordsAudio.play();
                
                // Wait for it to finish playing before playing letter sound
                await new Promise(resolve => {
                    findWordsAudio.addEventListener('ended', resolve, { once: true });
                });
                
                // Then play letter sound
                await this.playLetterSound();
            } else {
                console.warn('find_words.wav not loaded, playing letter sound only');
                await this.playLetterSound();
            }
        } catch (error) {
            console.warn('Could not play intro audio:', error);
        }
    }

    renderGameField() {
        const safariField = document.getElementById('safari-field');
        safariField.innerHTML = '';

        this.allWords.forEach((wordObj, index) => {
            const wordCard = this.createWordCard(wordObj, index);
            safariField.appendChild(wordCard);
        });
    }

    createWordCard(wordObj, index) {
        // Create a container for the card and button
        const container = document.createElement('div');
        container.className = 'word-container';
        
        const card = document.createElement('div');
        card.className = 'word-card';
        card.dataset.index = index;
        card.dataset.correct = wordObj.isCorrect;

        const image = document.createElement('div');
        image.className = 'word-image';
        
        if (wordObj.image.startsWith('images/') || wordObj.image.includes('.')) {
            // It's an image file
            const img = document.createElement('img');
            img.src = `../${wordObj.image}`;
            img.alt = wordObj.word;
            img.onerror = () => {
                // Fallback to emoji or text if image fails to load
                image.textContent = '🖼️';
            };
            image.appendChild(img);
        } else {
            // It's an emoji
            image.textContent = wordObj.image;
        }

        const text = document.createElement('div');
        text.className = 'word-text';
        text.textContent = wordObj.word;

        card.appendChild(image);

        // Create the play button separately
        const playButton = document.createElement('button');
        playButton.className = 'play-word-btn';
        playButton.textContent = '🔊 Hør ordet';
        playButton.addEventListener('click', () => {
            this.playWordSound(index);
        });

        // Simple click handler for the card (no event conflicts now)
        card.addEventListener('click', () => {
            this.handleWordClick(index);
        });

        // Add both to the container
        container.appendChild(card);
        container.appendChild(playButton);

        return container;
    }

    async playWordSound(index) {
        const audio = this.audioCache.get(`word-${index}`);
        if (audio) {
            try {
                await audio.play();
            } catch (error) {
                console.warn('Could not play word sound:', error);
            }
        } else {
            // Fallback: try to play directly
            try {
                const wordObj = this.allWords[index];
                if (wordObj && wordObj.audio) {
                    const audio = new Audio(`../${wordObj.audio}`);
                    await audio.play();
                }
            } catch (error) {
                console.warn('Could not play word sound:', error);
            }
        }
    }

    async playLetterSound() {
        const audio = this.audioCache.get(`letter-${this.currentLetter}`);
        if (audio) {
            try {
                await audio.play();
            } catch (error) {
                console.warn('Could not play letter sound:', error);
            }
        } else {
            // Fallback
            try {
                const letterInfo = this.letterData[this.currentLetter];
                if (letterInfo && letterInfo.letterSound) {
                    const audio = new Audio(`../${letterInfo.letterSound}`);
                    await audio.play();
                }
            } catch (error) {
                console.warn('Could not play letter sound:', error);
            }
        }
    }

    handleWordClick(index) {
        const card = document.querySelector(`[data-index="${index}"]`);
        if (card.classList.contains('found')) return; // Already found

        const wordObj = this.allWords[index];
        
        if (wordObj.isCorrect) {
            // Correct answer
            card.classList.add('correct');
            this.foundWords.add(index);
            
            setTimeout(() => {
                card.classList.remove('correct');
                card.classList.add('found');
                
                // Also disable the button for this card
                const container = card.parentElement;
                const button = container.querySelector('.play-word-btn');
                if (button) {
                    button.disabled = true;
                }
                
                this.updateScore();
                this.checkGameComplete();
            }, 600);
        } else {
            // Wrong answer
            card.classList.add('incorrect');
            
            setTimeout(() => {
                card.classList.remove('incorrect');
            }, 600);
        }
    }

    updateScore() {
        document.getElementById('found-count').textContent = this.foundWords.size.toString();
    }

    checkGameComplete() {
        if (this.foundWords.size === this.gameSettings.wordsToFind) {
            setTimeout(() => {
                this.showVictoryScreen();
            }, 800);
        }
    }

    showVictoryScreen() {
        document.getElementById('game-screen').classList.add('hidden');
        document.getElementById('victory-screen').classList.remove('hidden');
        
        // Update victory stats
        document.getElementById('final-count').textContent = this.gameSettings.wordsToFind.toString();
        document.getElementById('final-letter').textContent = this.currentLetter;
        
        // Trigger confetti and sound effects
        if (typeof triggerConfetti === 'function') {
            triggerConfetti();
        }
        if (typeof playGameOverSound === 'function') {
            playGameOverSound();
        }
    }

    resetToSetup() {
        // Reset game state
        this.foundWords.clear();
        this.wordsToFind = [];
        this.wrongWords = [];
        this.allWords = [];
        this.currentLetter = null;
        
        // Show setup screen
        document.getElementById('victory-screen').classList.add('hidden');
        document.getElementById('setup-screen').classList.remove('hidden');
        
        // Re-initialize letter selection
        this.letterSelection.selectNone();
        this.updateStartButton();
    }

    shuffleArray(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }
}

// Initialize the game when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new WordSafari();
});