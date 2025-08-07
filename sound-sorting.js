class SoundSortingGame {
    constructor() {
        this.letterData = {};
        this.selectedLetters = new Set();
        this.wordCount = 5;
        this.gameWords = [];
        this.score = 0;
        this.currentAudio = null;
        this.lastPlayedAudio = null;
        
        // Touch drag variables
        this.isDragging = false;
        this.draggedCard = null;
        this.touchOffset = { x: 0, y: 0 };
        this.dragClone = null;
        
        this.setupScreen = document.getElementById('setup-screen');
        this.gameScreen = document.getElementById('game-screen');
        this.completionScreen = document.getElementById('completion-screen');
        
        this.init();
    }

    async init() {
        await this.loadLetterData();
        this.setupEventListeners();
        this.createLetterSelection();
    }

    async loadLetterData() {
        try {
            const response = await fetch('letter-images.json');
            this.letterData = await response.json();
        } catch (error) {
            console.error('Error loading letter data:', error);
        }
    }

    setupEventListeners() {
        // Setup screen events
        document.getElementById('select-all').addEventListener('click', () => this.selectAllLetters());
        document.getElementById('select-none').addEventListener('click', () => this.selectNoLetters());
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

    createLetterSelection() {
        const letterGrid = document.getElementById('letter-grid');
        letterGrid.innerHTML = '';

        Object.keys(this.letterData).forEach(letter => {
            const letterBtn = document.createElement('button');
            letterBtn.className = 'letter-btn';
            letterBtn.textContent = letter;
            letterBtn.addEventListener('click', () => this.toggleLetter(letter, letterBtn));
            letterGrid.appendChild(letterBtn);
        });

        // Select first 5 letters by default
        const defaultLetters = Object.keys(this.letterData).slice(0, 5);
        defaultLetters.forEach(letter => {
            this.selectedLetters.add(letter);
            const btn = letterGrid.querySelector(`button:nth-child(${Object.keys(this.letterData).indexOf(letter) + 1})`);
            btn.classList.add('selected');
        });
    }

    toggleLetter(letter, btn) {
        if (this.selectedLetters.has(letter)) {
            this.selectedLetters.delete(letter);
            btn.classList.remove('selected');
        } else {
            this.selectedLetters.add(letter);
            btn.classList.add('selected');
        }
    }

    selectAllLetters() {
        const letterGrid = document.getElementById('letter-grid');
        Object.keys(this.letterData).forEach(letter => {
            this.selectedLetters.add(letter);
        });
        letterGrid.querySelectorAll('.letter-btn').forEach(btn => {
            btn.classList.add('selected');
        });
    }

    selectNoLetters() {
        const letterGrid = document.getElementById('letter-grid');
        this.selectedLetters.clear();
        letterGrid.querySelectorAll('.letter-btn').forEach(btn => {
            btn.classList.remove('selected');
        });
    }

    selectWordCount(btn) {
        document.querySelectorAll('.word-count-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.wordCount = parseInt(btn.dataset.count);
    }

    startGame() {
        if (this.selectedLetters.size === 0) {
            alert('Vennligst velg minst én bokstav for å spille!');
            return;
        }

        this.generateGameWords();
        this.createGameBoard();
        this.showGameScreen();
        this.score = 0;
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
                    audio: letterAudio[index],
                    image: letterImages[index]
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
                <div class="letter-box-header">${letter}</div>
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
            card.addEventListener('click', () => this.playWordSound(wordData.audio));
            
            // Touch events for mobile support
            card.addEventListener('touchstart', (e) => this.touchStart(e), { passive: false });
            card.addEventListener('touchmove', (e) => this.touchMove(e), { passive: false });
            card.addEventListener('touchend', (e) => this.touchEnd(e), { passive: false });

            wordCards.appendChild(card);
        });
    }

    playWordSound(audioPath) {
        if (this.currentAudio) {
            this.currentAudio.pause();
        }

        this.currentAudio = new Audio(audioPath);
        this.lastPlayedAudio = audioPath;
        this.currentAudio.play().catch(error => {
            console.error('Error playing audio:', error);
        });
    }

    replayLastSound() {
        if (this.lastPlayedAudio) {
            this.playWordSound(this.lastPlayedAudio);
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
            
            // Update stack order - latest card on top (use setTimeout to ensure DOM is updated)
            setTimeout(() => {
                this.updateCardStack(droppedCardsArea);
            }, 0);
            
            this.score += 10;
            this.updateScore();
            this.checkGameComplete();
        } else {
            // Incorrect placement - flash the dropzone red
            const dropzone = letterBox.querySelector('.letter-dropzone');
            card.classList.add('incorrect');
            dropzone.classList.add('flash-red');
            
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
            this.playWordSound(audioPath);
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
                
                // Update stack order - latest card on top (use setTimeout to ensure DOM is updated)
                setTimeout(() => {
                    this.updateCardStack(droppedCardsArea);
                }, 0);
                
                this.score += 10;
                this.updateScore();
                this.checkGameComplete();
            } else {
                // Incorrect placement
                const dropzone = letterBox.querySelector('.letter-dropzone');
                this.draggedCard.classList.add('incorrect');
                dropzone.classList.add('flash-red');
                
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
}

// Initialize the game when the page loads
let game;
window.addEventListener('DOMContentLoaded', () => {
    game = new SoundSortingGame();
});