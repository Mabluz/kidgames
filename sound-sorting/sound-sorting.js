class SoundSortingGame {
    constructor() {
        this.letterData = {};
        this.selectedLetters = new Set();
        this.wordCount = 5;
        this.letterSelection = null;
        this.gameWords = [];
        this.score = 0;
        this.currentAudio = null;
        this.lastPlayedAudio = null;
        
        // Touch drag variables
        this.isDragging = false;
        this.draggedCard = null;
        this.touchOffset = { x: 0, y: 0 };
        this.dragClone = null;
        
        // Scoring and timing variables
        this.cardTimers = new Map(); // Track start time for each card
        this.wrongAttempts = new Map(); // Track wrong attempts per card
        this.gameStartTime = null;
        
        this.setupScreen = document.getElementById('setup-screen');
        this.gameScreen = document.getElementById('game-screen');
        this.completionScreen = document.getElementById('completion-screen');
        
        this.init();
    }

    async init() {
        await this.loadLetterData();
        this.setupEventListeners();
        this.initializeLetterSelection();
    }

    async loadLetterData() {
        try {
            const response = await fetch('../letter-images.json');
            const rawData = await response.json();
            // Apply difficulty filter
            this.letterData = applyDifficultyFilter(rawData);
            console.log(`Loaded letter data with difficulty: ${getDifficultyLabel()}`);
        } catch (error) {
            console.error('Error loading letter data:', error);
        }
    }

    setupEventListeners() {
        // Setup screen events
        document.getElementById('start-game').addEventListener('click', () => this.startGame());

        // Word count selection
        document.querySelectorAll('.word-count-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.selectWordCount(e.target));
        });

        // Game controls
        document.getElementById('new-game').addEventListener('click', () => this.showSetupScreen());
        document.getElementById('replay-sound').addEventListener('click', () => this.replayLastSound());
        document.getElementById('play-again').addEventListener('click', () => this.showSetupScreen());
    }

    initializeLetterSelection() {
        this.letterSelection = new LetterSelection({
            containerSelector: '#letter-selection',
            selectAllBtnSelector: '#select-all-btn',
            selectNoneBtnSelector: '#select-none-btn',
            letters: Object.keys(this.letterData),
            minSelections: 1,
            defaultSelections: 5,
            onSelectionChange: (selectedLetters) => {
                console.log('Selected letters for sorting:', selectedLetters);
            }
        });
    }

    selectWordCount(btn) {
        document.querySelectorAll('.word-count-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.wordCount = parseInt(btn.dataset.count);
    }

    startGame() {
        if (!this.letterSelection.isValidSelection()) {
            alert(this.letterSelection.getValidationMessage());
            return;
        }
        this.selectedLetters = new Set(this.letterSelection.getSelectedLetters());

        this.generateGameWords();
        this.createGameBoard();
        this.showGameScreen();
        this.score = 0;
        this.gameStartTime = Date.now();
        this.cardTimers.clear();
        this.wrongAttempts.clear();
        this.updateScore();
    }

    generateGameWords() {
        this.gameWords = [];
        const selectedLettersArray = Array.from(this.selectedLetters);

        // Get all possible words from selected letters
        const allWords = [];
        selectedLettersArray.forEach(letter => {
            const letterWords = this.letterData[letter].words;
            const letterAudio = this.letterData[letter].audio;
            const letterImages = this.letterData[letter].images;
            
            letterWords.forEach((word, index) => {
                allWords.push({
                    word,
                    letter,
                    audio: `../${letterAudio[index]}`,
                    image: letterImages[index].startsWith('http') || letterImages[index].length <= 4 ? letterImages[index] : `../${letterImages[index]}`
                });
            });
        });

        // Shuffle and select the required number of words
        this.shuffleArray(allWords);
        this.gameWords = allWords.slice(0, this.wordCount);
        this.shuffleArray(this.gameWords);
    }

    createGameBoard() {
        this.createLetterBoxes();
        this.createWordCards();
    }

    createLetterBoxes() {
        const letterBoxes = document.getElementById('letter-boxes');
        letterBoxes.innerHTML = '';

        const uniqueLetters = [...new Set(this.gameWords.map(word => word.letter))];
        uniqueLetters.sort();

        uniqueLetters.forEach(letter => {
            const box = document.createElement('div');
            box.className = 'letter-box';
            box.dataset.letter = letter;
            box.innerHTML = `
                <div class="letter-box-header">
                    <span class="letter-title">${letter}</span>
                    <button class="letter-play-btn" onclick="game.playLetterSound('${letter}')" title="Spill av bokstavlyd">
                        🔊
                    </button>
                </div>
                <div class="letter-dropzone" ondrop="game.drop(event)" ondragover="game.allowDrop(event)" ondragenter="game.dragEnter(event)" ondragleave="game.dragLeave(event)">
                    <div class="drop-zone-indicator">Slipp her</div>
                </div>
                <div class="dropped-cards-area" data-letter="${letter}"></div>
            `;
            letterBoxes.appendChild(box);
        });
    }

    createWordCards() {
        const wordCards = document.getElementById('word-cards');
        wordCards.innerHTML = '';

        this.gameWords.forEach((wordData, index) => {
            const card = document.createElement('div');
            card.className = 'word-card';
            card.draggable = true;
            card.dataset.word = wordData.word;
            card.dataset.letter = wordData.letter;
            card.dataset.audio = wordData.audio;
            card.id = `card-${index}`;

            // Determine if image is emoji or file path
            const isEmoji = wordData.image.length <= 4 && !/\.(jpg|jpeg|png|gif|webp)$/i.test(wordData.image);
            const imageElement = isEmoji ? 
                `<div class="card-emoji">${wordData.image}</div>` :
                `<img src="${wordData.image}" alt="${wordData.word}" class="card-image">`;

            card.innerHTML = `
                ${imageElement}
            `;

            card.addEventListener('dragstart', (e) => this.dragStart(e));
            card.addEventListener('click', () => this.playWordSound(wordData.audio, card.id));
            
            // Touch events for mobile support
            card.addEventListener('touchstart', (e) => this.touchStart(e), { passive: false });
            card.addEventListener('touchmove', (e) => this.touchMove(e), { passive: false });
            card.addEventListener('touchend', (e) => this.touchEnd(e), { passive: false });

            wordCards.appendChild(card);
        });
    }

    playWordSound(audioPath, cardId = null) {
        if (this.currentAudio) {
            this.currentAudio.pause();
        }

        this.currentAudio = new Audio(audioPath);
        this.lastPlayedAudio = audioPath;
        this.currentAudio.play().catch(error => {
            console.error('Error playing audio:', error);
        });

        // Start timer for this card if not already started
        if (cardId && !this.cardTimers.has(cardId)) {
            this.cardTimers.set(cardId, Date.now());
        }
    }

    replayLastSound() {
        if (this.lastPlayedAudio) {
            this.playWordSound(this.lastPlayedAudio);
        }
    }

    playLetterSound(letter) {
        if (this.letterData[letter] && this.letterData[letter].letterSound) {
            const letterSoundPath = `../${this.letterData[letter].letterSound}`;
            
            if (this.currentAudio) {
                this.currentAudio.pause();
            }

            this.currentAudio = new Audio(letterSoundPath);
            this.lastPlayedAudio = letterSoundPath;
            this.currentAudio.play().catch(error => {
                console.error('Error playing letter sound:', error);
                console.warn(`Could not play letter sound: ${letterSoundPath}`);
            });
        } else {
            console.warn(`No letter sound available for letter: ${letter}`);
        }
    }

    dragStart(e) {
        e.dataTransfer.setData('text/plain', e.target.id);
        e.target.classList.add('dragging');
        
        // Add drag feedback to all letter boxes
        document.querySelectorAll('.letter-box').forEach(box => {
            box.classList.add('drag-active');
        });
    }

    allowDrop(e) {
        e.preventDefault();
    }
    
    dragEnter(e) {
        e.preventDefault();
        const dropzone = e.target.closest('.letter-dropzone');
        if (dropzone) {
            dropzone.classList.add('drag-over');
        }
    }
    
    dragLeave(e) {
        const dropzone = e.target.closest('.letter-dropzone');
        if (dropzone && !dropzone.contains(e.relatedTarget)) {
            dropzone.classList.remove('drag-over');
        }
    }

    drop(e) {
        e.preventDefault();
        const cardId = e.dataTransfer.getData('text/plain');
        const card = document.getElementById(cardId);
        const letterBox = e.target.closest('.letter-box');
        
        if (!letterBox || !card) return;

        const cardLetter = card.dataset.letter;
        const boxLetter = letterBox.dataset.letter;

        card.classList.remove('dragging');
        
        // Remove drag feedback from all elements
        document.querySelectorAll('.letter-box').forEach(box => {
            box.classList.remove('drag-active');
        });
        document.querySelectorAll('.letter-dropzone').forEach(zone => {
            zone.classList.remove('drag-over');
        });

        if (cardLetter === boxLetter) {
            // Correct placement - add to dropped cards area
            const droppedCardsArea = letterBox.querySelector('.dropped-cards-area');
            droppedCardsArea.appendChild(card);
            card.classList.add('placed-correct');
            card.draggable = false;
            
            // Calculate and add speed-based score
            const points = this.calculateScore(card.id);
            this.score += points;
            this.showScorePopup(card, points);
            
            // Update stack order - latest card on top (use setTimeout to ensure DOM is updated)
            setTimeout(() => {
                this.updateCardStack(droppedCardsArea);
            }, 0);
            
            this.updateScore();
            this.checkGameComplete();
        } else {
            // Incorrect placement - flash the dropzone red and apply penalty
            const dropzone = letterBox.querySelector('.letter-dropzone');
            card.classList.add('incorrect');
            dropzone.classList.add('flash-red');
            
            // Track wrong attempt for penalty calculation
            const wrongCount = this.wrongAttempts.get(card.id) || 0;
            this.wrongAttempts.set(card.id, wrongCount + 1);
            
            setTimeout(() => {
                card.classList.remove('incorrect');
                dropzone.classList.remove('flash-red');
            }, 600);
        }
    }

    checkGameComplete() {
        const remainingCards = document.querySelectorAll('.word-card:not(.placed-correct)').length;
        document.getElementById('remaining').textContent = `Gjenstående: ${remainingCards}`;

        if (remainingCards === 0) {
            this.showCompletionScreen();
        }
    }

    updateScore() {
        document.getElementById('score').textContent = `Poeng: ${this.score}`;
        const remainingCards = document.querySelectorAll('.word-card:not(.placed-correct)').length;
        document.getElementById('remaining').textContent = `Gjenstående: ${remainingCards}`;
    }

    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }

    showSetupScreen() {
        this.setupScreen.classList.remove('hidden');
        this.gameScreen.classList.add('hidden');
        this.completionScreen.classList.add('hidden');
        
        if (this.currentAudio) {
            this.currentAudio.pause();
        }
    }

    showGameScreen() {
        this.setupScreen.classList.add('hidden');
        this.gameScreen.classList.remove('hidden');
        this.completionScreen.classList.add('hidden');
    }

    showCompletionScreen() {
        this.gameScreen.classList.add('hidden');
        this.completionScreen.classList.remove('hidden');
        
        document.getElementById('final-score').innerHTML = `
            <h2>Sluttpoeng: ${this.score}</h2>
            <p>Du sorterte ${this.wordCount} ord riktig!</p>
        `;
        
        if (this.currentAudio) {
            this.currentAudio.pause();
        }
        
        // Trigger confetti and game over sound effects
        triggerConfetti();
        playGameOverSound();
    }

    updateCardStack(droppedCardsArea) {
        const cards = droppedCardsArea.querySelectorAll('.word-card.placed-correct');
        const totalCards = cards.length;
        
        cards.forEach((card, index) => {
            // Last card (highest index) gets highest z-index and full opacity
            const stackIndex = index + 10; // Later cards get higher z-index
            const opacity = Math.max(0.4, 1 - ((totalCards - 1 - index) * 0.15)); // Last card = opacity 1
            
            card.style.setProperty('--stack-index', stackIndex);
            card.style.setProperty('--stack-opacity', opacity);
        });
    }

    // Touch event handlers for mobile drag and drop
    touchStart(e) {
        if (e.target.classList.contains('placed-correct')) return;
        
        e.preventDefault();
        const touch = e.touches[0];
        const card = e.target.closest('.word-card');
        
        if (!card) return;

        // Start timer for this card if not already started
        if (!this.cardTimers.has(card.id)) {
            this.cardTimers.set(card.id, Date.now());
        }

        this.isDragging = true;
        this.draggedCard = card;
        
        // Calculate touch offset relative to card
        const cardRect = card.getBoundingClientRect();
        this.touchOffset.x = touch.clientX - cardRect.left;
        this.touchOffset.y = touch.clientY - cardRect.top;
        
        // Create a clone for dragging
        this.dragClone = card.cloneNode(true);
        this.dragClone.id = card.id + '-clone';
        this.dragClone.classList.add('drag-clone');
        this.dragClone.style.position = 'fixed';
        this.dragClone.style.pointerEvents = 'none';
        this.dragClone.style.zIndex = '1000';
        this.dragClone.style.left = (touch.clientX - this.touchOffset.x) + 'px';
        this.dragClone.style.top = (touch.clientY - this.touchOffset.y) + 'px';
        
        document.body.appendChild(this.dragClone);
        
        // Add dragging class to original card
        card.classList.add('dragging');
        
        // Add drag feedback to all letter boxes
        document.querySelectorAll('.letter-box').forEach(box => {
            box.classList.add('drag-active');
        });
        
        // Play sound
        const audioPath = card.dataset.audio;
        if (audioPath) {
            this.playWordSound(audioPath, card.id);
        }
    }

    touchMove(e) {
        if (!this.isDragging || !this.dragClone) return;
        
        e.preventDefault();
        const touch = e.touches[0];
        
        // Update clone position
        this.dragClone.style.left = (touch.clientX - this.touchOffset.x) + 'px';
        this.dragClone.style.top = (touch.clientY - this.touchOffset.y) + 'px';
        
        // Handle drag over effects
        const elementBelow = document.elementFromPoint(touch.clientX, touch.clientY);
        const dropzone = elementBelow?.closest('.letter-dropzone');
        
        // Remove all drag-over classes
        document.querySelectorAll('.letter-dropzone').forEach(zone => {
            zone.classList.remove('drag-over');
        });
        
        // Add drag-over to current dropzone
        if (dropzone) {
            dropzone.classList.add('drag-over');
        }
    }

    touchEnd(e) {
        if (!this.isDragging || !this.draggedCard) return;
        
        e.preventDefault();
        const touch = e.changedTouches[0];
        
        // Find element below touch point
        const elementBelow = document.elementFromPoint(touch.clientX, touch.clientY);
        const letterBox = elementBelow?.closest('.letter-box');
        
        // Clean up
        if (this.dragClone) {
            document.body.removeChild(this.dragClone);
            this.dragClone = null;
        }
        
        this.draggedCard.classList.remove('dragging');
        
        // Remove drag feedback from all elements
        document.querySelectorAll('.letter-box').forEach(box => {
            box.classList.remove('drag-active');
        });
        document.querySelectorAll('.letter-dropzone').forEach(zone => {
            zone.classList.remove('drag-over');
        });
        
        // Handle drop
        if (letterBox) {
            const cardLetter = this.draggedCard.dataset.letter;
            const boxLetter = letterBox.dataset.letter;
            
            if (cardLetter === boxLetter) {
                // Correct placement
                const droppedCardsArea = letterBox.querySelector('.dropped-cards-area');
                droppedCardsArea.appendChild(this.draggedCard);
                this.draggedCard.classList.add('placed-correct');
                this.draggedCard.draggable = false;
                
                // Calculate and add speed-based score
                const points = this.calculateScore(this.draggedCard.id);
                this.score += points;
                this.showScorePopup(this.draggedCard, points);
                
                // Update stack order - latest card on top (use setTimeout to ensure DOM is updated)
                setTimeout(() => {
                    this.updateCardStack(droppedCardsArea);
                }, 0);
                
                this.updateScore();
                this.checkGameComplete();
            } else {
                // Incorrect placement
                const dropzone = letterBox.querySelector('.letter-dropzone');
                this.draggedCard.classList.add('incorrect');
                dropzone.classList.add('flash-red');
                
                // Track wrong attempt for penalty calculation
                const wrongCount = this.wrongAttempts.get(this.draggedCard.id) || 0;
                this.wrongAttempts.set(this.draggedCard.id, wrongCount + 1);
                
                setTimeout(() => {
                    this.draggedCard.classList.remove('incorrect');
                    dropzone.classList.remove('flash-red');
                }, 600);
            }
        }
        
        // Reset touch drag variables
        this.isDragging = false;
        this.draggedCard = null;
    }

    calculateScore(cardId) {
        const startTime = this.cardTimers.get(cardId);
        if (!startTime) {
            // Fallback if no timer found
            return 50;
        }

        const timeElapsed = (Date.now() - startTime) / 1000; // Convert to seconds
        const wrongAttempts = this.wrongAttempts.get(cardId) || 0;

        // Base score: 100 points
        let baseScore = 100;

        // Speed bonus: More points for faster completion (max 50 bonus points)
        // Perfect time: 3 seconds = 50 bonus, 10+ seconds = 0 bonus
        const speedBonus = Math.max(0, Math.round(50 - (timeElapsed - 3) * 5));

        // Penalty for wrong attempts: -20 points per wrong attempt
        const wrongPenalty = wrongAttempts * 20;

        // Calculate final score (minimum 10 points)
        const finalScore = Math.max(10, baseScore + speedBonus - wrongPenalty);

        return finalScore;
    }

    showScorePopup(card, points) {
        // Create floating score popup
        const popup = document.createElement('div');
        popup.className = 'score-popup';
        popup.textContent = `+${points}`;
        
        // Position relative to the card
        const cardRect = card.getBoundingClientRect();
        popup.style.position = 'fixed';
        popup.style.left = (cardRect.left + cardRect.width / 2) + 'px';
        popup.style.top = (cardRect.top - 10) + 'px';
        popup.style.transform = 'translateX(-50%)';
        popup.style.zIndex = '1000';
        
        document.body.appendChild(popup);

        // Animate and remove
        setTimeout(() => {
            if (popup.parentNode) {
                popup.parentNode.removeChild(popup);
            }
        }, 2000);
    }

}

// Initialize the game when the page loads
let game;
window.addEventListener('DOMContentLoaded', () => {
    game = new SoundSortingGame();
});