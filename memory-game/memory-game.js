class MemoryGame {
    constructor() {
        this.letters = [];
        
        this.cards = [];
        this.selectedLetters = []; // Letters chosen by user
        this.selectedPairs = 4; // Number of pairs to play with
        this.canContinueAfterRecording = false;
        this.shouldCheckMatchAfterRecording = false;
        this.isCurrentMatch = false;
        this.isSecondCardRecording = false;
        this.mediaRecorder = null;
        this.audioChunks = [];
        this.recordedAudio = null;
        this.currentFlippedCard = null;
        this.recordingRequired = false;
        this.gameBlocked = false;
        this.flippedCards = [];
        this.matchedPairs = 0;
        this.attempts = 0;
        
        // Multiplayer properties
        this.playerCount = 1;
        this.players = [];
        this.currentPlayerIndex = 0;
        this.gameBoard = document.getElementById('game-board');
        this.attemptsEl = document.getElementById('attempts');
        this.pairsEl = document.getElementById('pairs');
        this.totalPairsEl = document.getElementById('total-pairs');
        this.winMessage = document.getElementById('win-message');
        this.voiceControls = document.getElementById('voice-controls');
        this.setupScreen = document.getElementById('setup-screen');
        this.gameArea = document.getElementById('game-area');
        
        // Ensure elements start in correct state
        this.voiceControls.classList.add('hidden');
        this.gameArea.style.display = 'none';
        
        this.initializeEventListeners();
        this.initializeVoiceRecording();
        this.initializeApp();
    }

    async initializeApp() {
        await this.loadCustomImagesFromJSON();
        this.initializeSetupScreen();
    }
    
    initializeEventListeners() {
        // Settings modal event listeners
        document.getElementById('settings-btn').addEventListener('click', () => {
            this.showSettingsModal();
        });

        document.getElementById('close-settings-btn').addEventListener('click', () => {
            this.hideSettingsModal();
        });

        document.getElementById('settings-overlay').addEventListener('click', () => {
            this.hideSettingsModal();
        });

        document.getElementById('restart-btn').addEventListener('click', () => {
            this.restartGame();
            this.hideSettingsModal();
        });
        
        document.getElementById('play-again-btn').addEventListener('click', () => {
            this.restartGame();
        });
        
        
        document.getElementById('record-btn').addEventListener('click', () => {
            this.toggleRecording();
        });
        
        document.getElementById('play-btn').addEventListener('click', () => {
            this.playRecording();
        });
        
        document.getElementById('continue-btn').addEventListener('click', () => {
            this.continueAfterRecording();
        });
        
        document.getElementById('listen-btn').addEventListener('click', () => {
            this.playPreRecordedAudio();
        });
        
        // Setup screen event listeners
        document.getElementById('start-game-btn').addEventListener('click', () => {
            this.startGame();
        });
        
        document.getElementById('select-all-btn').addEventListener('click', () => {
            this.selectAllLetters();
        });
        
        document.getElementById('select-none-btn').addEventListener('click', () => {
            this.selectNoLetters();
        });
        
    }
    
    setupTileCountListener() {
        const tileCountInput = document.getElementById('tile-count');
        const pairsInfo = document.getElementById('pairs-info');
        const maxTilesInfo = document.getElementById('max-tiles-info');
        
        const updateTileInfo = () => {
            const tileCount = parseInt(tileCountInput.value);
            const pairCount = tileCount / 2;
            const maxPossibleTiles = this.selectedLetters.length * 4 * 2; // Each letter has 4 different words, 2 tiles per pair
            
            pairsInfo.textContent = `${pairCount} par`;
            maxTilesInfo.textContent = `Maksimalt mulig: ${maxPossibleTiles} kort`;
            
            // Update input styling based on validity
            if (tileCount > maxPossibleTiles) {
                tileCountInput.style.borderColor = '#ff6b6b';
                maxTilesInfo.style.color = '#ff6b6b';
            } else {
                tileCountInput.style.borderColor = '#ddd';
                maxTilesInfo.style.color = '#666';
            }
        };
        
        // Update on input change
        tileCountInput.addEventListener('input', updateTileInfo);
        
        // Update when letters change
        this.updateTileInfo = updateTileInfo;
        
        // Initial update
        updateTileInfo();
    }
    
    initializeGame() {
        // Create all possible word/image combinations from selected letters
        const allPossiblePairs = [];
        this.selectedLetters.forEach(letterObj => {
            letterObj.words.forEach((word, index) => {
                const rawImage = letterObj.customImages[index] || letterObj.images[index];
                const image = rawImage && (rawImage.startsWith('http') || rawImage.length <= 4) ? rawImage : `../${rawImage}`;
                const audio = letterObj.audio[index] ? `../${letterObj.audio[index]}` : "";
                allPossiblePairs.push({
                    letter: letterObj.letter,
                    word: word,
                    image: image,
                    audio: audio
                });
            });
        });
        
        // Shuffle and select random pairs up to the requested count
        const shuffledPairs = this.shuffle([...allPossiblePairs]);
        const selectedPairs = shuffledPairs.slice(0, this.selectedPairs);
        
        // Create two identical cards for each selected pair
        const pairs = [];
        selectedPairs.forEach(pairData => {
            // Create two identical cards
            for (let i = 0; i < 2; i++) {
                pairs.push({
                    letter: pairData.letter,
                    word: pairData.word,
                    image: pairData.image,
                    audio: pairData.audio
                });
            }
        });
        
        this.cards = this.shuffle(pairs).map((item, index) => ({
            id: index,
            letter: item.letter,
            word: item.word,
            image: item.image,
            audio: item.audio,
            isFlipped: false,
            isMatched: false
        }));
        
        this.totalPairsEl.textContent = this.selectedPairs;
        this.renderBoard();
        this.updateScore();
    }
    
    shuffle(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }
    
    renderBoard() {
        this.gameBoard.innerHTML = '';
        
        this.cards.forEach(card => {
            const cardElement = document.createElement('div');
            cardElement.className = 'card';
            cardElement.dataset.cardId = card.id;
            
            cardElement.innerHTML = `
                <div class="card-inner">
                    <div class="card-front">
                        ?
                    </div>
                    <div class="card-back ${card.isMatched ? 'matched' : ''}">
                        <div class="letter">${card.letter}</div>
                        <div class="word">${card.word}</div>
                        <div class="image">${this.renderImage(card.image)}</div>
                    </div>
                </div>
            `;
            
            if (card.isFlipped || card.isMatched) {
                cardElement.classList.add('flipped');
            }
            
            cardElement.addEventListener('click', () => this.flipCard(card.id));
            this.gameBoard.appendChild(cardElement);
        });
    }
    
    flipCard(cardId) {
        const card = this.cards[cardId];
        const cardElement = document.querySelector(`[data-card-id="${cardId}"]`);

        // Block ALL card interactions after second flip - only Continue button allowed
        /*if (this.isSecondCardRecording) {
            this.showFeedback('Vennligst bruk Fortsett-knappen for å gå videre!', 'error');
            this.shakeRecordButton();
            return;
        }*/
        
        // Block further interaction until recording is complete
        if (this.recordingRequired) {
            // Allow continuing if recording is done and played back
            if (this.canContinueAfterRecording) {
                this.continueAfterRecording();
                // After continuing, flip the new card
                setTimeout(() => {
                    this.flipCard(cardId);
                }, 100);
                return;
            } else {
                this.showFeedback('Vennligst fullfør opptaket først!', 'error');
                this.shakeRecordButton();
                return;
            }
        } else if (this.gameBlocked) {
            // Block if game is blocked but recording isn't required (shouldn't happen normally)
            return;
        }

        if (card.isFlipped || card.isMatched || this.flippedCards.length >= 2) {
            return;
        }

        card.isFlipped = true;
        cardElement.classList.add('flipped');
        this.flippedCards.push(card);
        
        // Show voice controls and require recording
        this.currentFlippedCard = card;
        this.recordingRequired = true;
        this.gameBlocked = true;
        this.showVoiceControls();
        
        // Auto-play pre-recorded audio if available
        setTimeout(() => {
            this.playPreRecordedAudio();
        }, 300);
        
        // If this is the second card, show match result immediately but don't flip back yet
        if (this.flippedCards.length === 2) {
            this.isSecondCardRecording = true;
            this.showMatchResult();
            this.shouldCheckMatchAfterRecording = true;
        }
    }
    
    checkMatch() {
        this.attempts++;
        const [card1, card2] = this.flippedCards;
        
        if (card1.letter === card2.letter && card1.word === card2.word) {
            card1.isMatched = true;
            card2.isMatched = true;
            this.matchedPairs++;
            
            // Update the visual state for matched cards
            const card1Element = document.querySelector(`[data-card-id="${card1.id}"] .card-back`);
            const card2Element = document.querySelector(`[data-card-id="${card2.id}"] .card-back`);
            card1Element.classList.add('matched');
            card2Element.classList.add('matched');
            
            this.showFeedback(`🎉 Match! ${card1.letter} for ${card1.word}!`, 'success');
        } else {
            setTimeout(() => {
                card1.isFlipped = false;
                card2.isFlipped = false;
                
                const card1Element = document.querySelector(`[data-card-id="${card1.id}"]`);
                const card2Element = document.querySelector(`[data-card-id="${card2.id}"]`);
                card1Element.classList.remove('flipped');
                card2Element.classList.remove('flipped');
            }, 500);
            
            this.showFeedback('❌ Ikke match. Prøv igjen!', 'error');
        }
        
        this.flippedCards = [];
        this.updateScore();
        
        if (this.isGameWon()) {
            this.hideVoiceControls();
            setTimeout(() => this.showWinMessage(), 1000);
        } else if (this.flippedCards.length === 0) {
            this.hideVoiceControls();
        }
    }
    
    checkMatchImmediately() {
        this.attempts++;
        const [card1, card2] = this.flippedCards;
        
        if (card1.letter === card2.letter && card1.word === card2.word) {
            card1.isMatched = true;
            card2.isMatched = true;
            this.matchedPairs++;
            
            // Update the visual state for matched cards
            const card1Element = document.querySelector(`[data-card-id="${card1.id}"] .card-back`);
            const card2Element = document.querySelector(`[data-card-id="${card2.id}"] .card-back`);
            card1Element.classList.add('matched');
            card2Element.classList.add('matched');
            
            this.showFeedback(`🎉 Match! ${card1.letter} for ${card1.word}!`, 'success');
            
            // Clear flipped cards immediately for matches
            this.flippedCards = [];
            
            // Update status message to allow continuing to next round
            setTimeout(() => {
                if (this.isGameWon()) {
                    setTimeout(() => this.showWinMessage(), 1000);
                } else {
                    document.getElementById('recording-status').textContent = 'Perfekt match! Klikk på et nytt kort for å fortsette å spille.';
                }
            }, 1500);
            
        } else {
            this.showFeedback('❌ Ikke match. Prøv igjen!', 'error');
            
            // For non-matches, flip cards back after a delay
            setTimeout(() => {
                card1.isFlipped = false;
                card2.isFlipped = false;
                
                const card1Element = document.querySelector(`[data-card-id="${card1.id}"]`);
                const card2Element = document.querySelector(`[data-card-id="${card2.id}"]`);
                card1Element.classList.remove('flipped');
                card2Element.classList.remove('flipped');
                
                // Clear flipped cards and update status
                this.flippedCards = [];
                document.getElementById('recording-status').textContent = 'Ikke match. Klikk på et nytt kort for å prøve igjen.';
            }, 1500);
        }
        
        this.updateScore();
    }
    
    showMatchResult() {
        this.attempts++;
        const [card1, card2] = this.flippedCards;
        
        if (card1.letter === card2.letter && card1.word === card2.word) {
            this.isCurrentMatch = true;
            card1.isMatched = true;
            card2.isMatched = true;
            this.matchedPairs++;
            
            // Update current player score in multiplayer
            if (this.playerCount > 1) {
                this.players[this.currentPlayerIndex].matches++;
            }
            
            // Update the visual state for matched cards
            const card1Element = document.querySelector(`[data-card-id="${card1.id}"] .card-back`);
            const card2Element = document.querySelector(`[data-card-id="${card2.id}"] .card-back`);
            card1Element.classList.add('matched');
            card2Element.classList.add('matched');
            
            this.showFeedback(`🎉 Match! ${card1.letter} for ${card1.word}!`, 'success');
        } else {
            this.isCurrentMatch = false;
            this.showFeedback('❌ Ikke match. Prøv igjen!', 'error');
        }
        
        this.updateScore();
        this.updatePlayerDisplay();
    }

    showFeedback(message, type) {
        const feedback = document.createElement('div');
        feedback.textContent = message;
        feedback.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: ${type === 'success' ? '#4caf50' : '#ff6b6b'};
            color: white;
            padding: 10px 20px;
            border-radius: 10px;
            font-weight: bold;
            z-index: 1000;
            animation: fadeInOut 2s ease-in-out forwards;
        `;
        
        const style = document.createElement('style');
        style.textContent = `
            @keyframes fadeInOut {
                0% { opacity: 0; transform: translateX(-50%) translateY(-20px); }
                20%, 80% { opacity: 1; transform: translateX(-50%) translateY(0); }
                100% { opacity: 0; transform: translateX(-50%) translateY(-20px); }
            }
        `;
        
        document.head.appendChild(style);
        document.body.appendChild(feedback);
        
        setTimeout(() => {
            document.body.removeChild(feedback);
            document.head.removeChild(style);
        }, 2000);
    }
    
    updateScore() {
        this.attemptsEl.textContent = this.attempts;
        this.pairsEl.textContent = this.matchedPairs;
    }
    
    isGameWon() {
        return this.matchedPairs === this.selectedPairs;
    }
    
    showWinMessage() {
        // Update win message for multiplayer
        if (this.playerCount > 1) {
            // Find the winner(s)
            const maxMatches = Math.max(...this.players.map(p => p.matches));
            const winners = this.players.filter(p => p.matches === maxMatches);
            
            const winMessageElement = this.winMessage;
            const titleElement = winMessageElement.querySelector('h2');
            const messageElement = winMessageElement.querySelector('p');
            
            if (winners.length === 1) {
                titleElement.textContent = `🏆 ${winners[0].name} vinner!`;
                messageElement.textContent = `Gratulerer! Du fant ${winners[0].matches} par av ${this.selectedPairs} totalt.`;
            } else {
                titleElement.textContent = '🏆 Uavgjort!';
                const winnerNames = winners.map(w => w.name).join(' og ');
                messageElement.textContent = `${winnerNames} delte seieren med ${maxMatches} par hver!`;
            }
        } else {
            // Single player - use original message
            const titleElement = this.winMessage.querySelector('h2');
            const messageElement = this.winMessage.querySelector('p');
            titleElement.textContent = '🏆 Gratulerer!';
            messageElement.textContent = 'Du fant alle parene!';
        }
        
        this.winMessage.classList.remove('hidden');
        triggerConfetti();
        playGameOverSound();
    }
    
    restartGame() {
        // Reset all game state variables
        this.matchedPairs = 0;
        this.attempts = 0;
        this.flippedCards = [];
        this.recordingRequired = false;
        this.gameBlocked = false;
        this.canContinueAfterRecording = false;
        this.shouldCheckMatchAfterRecording = false;
        this.isCurrentMatch = false;
        this.isSecondCardRecording = false;
        this.currentFlippedCard = null;
        this.recordedAudio = null;
        this.singleLetterMode = false;
        
        // Reset multiplayer state
        this.playerCount = 1;
        this.players = [];
        this.currentPlayerIndex = 0;
        
        // Reset audio chunks if recording was in progress
        this.audioChunks = [];
        
        // Stop any ongoing recording
        if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
            this.mediaRecorder.stop();
        }
        
        // Reset UI elements
        this.winMessage.classList.add('hidden');
        this.hideVoiceControls();
        
        // Clear the game board
        this.gameBoard.innerHTML = '';
        this.cards = [];
        
        // Return to setup screen
        this.gameArea.style.display = 'none';
        this.gameArea.classList.remove('active');
        this.setupScreen.classList.remove('hidden');
    }
    
    // Custom Image Functions
    async loadCustomImagesFromJSON() {
        try {
            const response = await fetch('../letter-images.json');
            const lettersData = await response.json();
            
            this.letters = Object.keys(lettersData).map(letter => ({
                letter: letter,
                words: lettersData[letter].words || [],
                images: lettersData[letter].images || [],
                customImages: lettersData[letter].customImages || [],
                audio: lettersData[letter].audio || []
            }));
        } catch (error) {
            console.log('Error loading letter data from JSON, using fallback');
            this.letters = [];
        }
    }
    
    renderImage(image) {
        if (image && (image.startsWith('http') || image.startsWith('data:') || image.startsWith('images/') || image.startsWith('../images/'))) {
            return `<img src="${image}" alt="Custom image" class="custom-image" onerror="this.style.display='none'; this.nextElementSibling.style.display='inline';"><span style="display:none;">❓</span>`;
        }
        return image;
    }
    
    // Game Flow Functions
    continueGameAfterRecording() {
        this.gameBlocked = false;
        
        // Check if we have two flipped cards
        if (this.flippedCards.length === 2) {
            setTimeout(() => this.checkMatch(), 1000);
        }
    }
    
    continueAfterRecording() {
        this.hideVoiceControls();
        this.recordingRequired = false;
        this.gameBlocked = false;
        this.canContinueAfterRecording = false;
        
        // Check if we need to process the match after recording
        if (this.shouldCheckMatchAfterRecording && this.flippedCards.length === 2) {
            this.shouldCheckMatchAfterRecording = false;
            this.isSecondCardRecording = false; // Reset second card flag
            
            // If it was not a match, flip the cards back and switch players (in multiplayer)
            if (!this.isCurrentMatch) {
                const [card1, card2] = this.flippedCards;
                card1.isFlipped = false;
                card2.isFlipped = false;
                
                const card1Element = document.querySelector(`[data-card-id="${card1.id}"]`);
                const card2Element = document.querySelector(`[data-card-id="${card2.id}"]`);
                card1Element.classList.remove('flipped');
                card2Element.classList.remove('flipped');
                
                // Switch to next player in multiplayer if no match
                if (this.playerCount > 1) {
                    this.nextPlayer();
                }
            }
            // If it was a match, the current player gets to continue (no player switch)
            
            // Clear flipped cards and reset for next turn
            this.flippedCards = [];
            
            // Check if game is won
            if (this.isGameWon()) {
                setTimeout(() => this.showWinMessage(), 500);
            }
        }
    }
    
    shakeRecordButton() {
        const recordBtn = document.getElementById('record-btn');
        const voiceControls = this.voiceControls;
        
        recordBtn.classList.add('shake');
        voiceControls.classList.add('attention');
        
        setTimeout(() => {
            recordBtn.classList.remove('shake');
            voiceControls.classList.remove('attention');
        }, 500);
    }
    
    // Voice Recording Functions
    async initializeVoiceRecording() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            this.mediaRecorder = new MediaRecorder(stream);
            
            this.mediaRecorder.ondataavailable = (event) => {
                this.audioChunks.push(event.data);
            };
            
            this.mediaRecorder.onstop = () => {
                const audioBlob = new Blob(this.audioChunks, { type: 'audio/wav' });
                this.recordedAudio = new Audio(URL.createObjectURL(audioBlob));
                this.audioChunks = [];
                
                // Auto-play the recording
                setTimeout(() => {
                    this.playRecording(true); // true indicates auto-play
                }, 100);
            };
            
        } catch (error) {
            console.error('Error accessing microphone:', error);
            document.getElementById('recording-status').textContent = 'Mikrofon-tilgang nektet. Taleopptak ikke tilgjengelig.';
        }
    }
    
    toggleRecording() {
        const recordBtn = document.getElementById('record-btn');
        const statusEl = document.getElementById('recording-status');
        
        if (!this.mediaRecorder) {
            statusEl.textContent = 'Taleopptak ikke tilgjengelig.';
            return;
        }
        
        if (this.mediaRecorder.state === 'recording') {
            this.mediaRecorder.stop();
            recordBtn.textContent = '🎤 Ta opp';
            recordBtn.classList.remove('recording');
            statusEl.textContent = 'Behandler opptak...';
        } else {
            this.audioChunks = [];
            this.mediaRecorder.start();
            recordBtn.textContent = '⏹️ Stop';
            recordBtn.classList.add('recording');
            document.getElementById('play-btn').classList.add('hidden');
            
            if (this.currentFlippedCard) {
                statusEl.textContent = `Tar opp uttale for "${this.currentFlippedCard.letter}"...`;
            } else {
                statusEl.textContent = 'Tar opp...';
            }
        }
    }
    
    playRecording(isAutoPlay = false) {
        if (this.recordedAudio) {
            this.recordedAudio.play();
            document.getElementById('recording-status').textContent = 'Spiller av opptaket ditt...';
            
            this.recordedAudio.onended = () => {
                if (isAutoPlay) {
                    document.getElementById('recording-status').textContent = 'Flott! Klikk Fortsett, Spill av igjen, eller klikk på et nytt kort for å fortsette.';
                    document.getElementById('play-btn').classList.remove('hidden');
                    document.getElementById('continue-btn').classList.remove('hidden');
                    
                    // Enable click-to-continue functionality
                    this.canContinueAfterRecording = true;
                } else {
                    document.getElementById('recording-status').textContent = 'Opptak avspilt. Klikk Fortsett eller klikk på et nytt kort når du er klar.';
                    document.getElementById('continue-btn').classList.remove('hidden');
                    
                    // Enable click-to-continue functionality
                    this.canContinueAfterRecording = true;
                }
            };
        }
    }
    
    playPreRecordedAudio() {
        if (this.currentFlippedCard && this.currentFlippedCard.audio) {
            const audioUrl = this.currentFlippedCard.audio;
            if (audioUrl && audioUrl.trim() !== '') {
                const audio = new Audio(audioUrl);
                audio.play().catch(error => {
                    console.log('Could not play pre-recorded audio:', error);
                    document.getElementById('recording-status').textContent = 
                        `Lydfil ikke tilgjengelig for "${this.currentFlippedCard.word}". Klikk ta opp og si ordet!`;
                });
                
                audio.onended = () => {
                    document.getElementById('recording-status').textContent = 
                        `Nå er det din tur! Klikk ta opp og si "${this.currentFlippedCard.word}"!`;
                };
            } else {
                document.getElementById('recording-status').textContent = 
                    `Ingen lydfil for "${this.currentFlippedCard.word}". Klikk ta opp og si ordet!`;
            }
        }
    }
    
    showVoiceControls() {
        if (this.currentFlippedCard) {
            this.voiceControls.classList.remove('hidden');
            this.voiceControls.classList.add('attention');
            
            // Check if audio file exists for this card
            const hasAudio = this.currentFlippedCard.audio && this.currentFlippedCard.audio.trim() !== '';
            
            if (hasAudio) {
                document.getElementById('recording-status').textContent = 
                    `Hør uttalen først, deretter klikk ta opp og si ordet "${this.currentFlippedCard.word}"!`;
                document.getElementById('listen-btn').classList.remove('hidden');
            } else {
                document.getElementById('recording-status').textContent = 
                    `Ingen lydfil for "${this.currentFlippedCard.word}". Klikk ta opp og si ordet!`;
                document.getElementById('listen-btn').classList.add('hidden');
            }
            
            document.getElementById('play-btn').classList.add('hidden');
            document.getElementById('continue-btn').classList.add('hidden');
        }
    }
    
    hideVoiceControls() {
        this.voiceControls.classList.add('hidden');
        this.voiceControls.classList.remove('attention');
        document.getElementById('record-btn').textContent = '🎤 Ta opp';
        document.getElementById('record-btn').classList.remove('recording');
        document.getElementById('listen-btn').classList.add('hidden');
        document.getElementById('play-btn').classList.add('hidden');
        document.getElementById('continue-btn').classList.add('hidden');
        document.getElementById('recording-status').textContent = '';
        this.currentFlippedCard = null;
        
        if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
            this.mediaRecorder.stop();
        }
    }
    
    // Setup Screen Functions
    initializeSetupScreen() {
        const letterGrid = document.getElementById('letter-selection');
        
        // Create clickable letter options
        this.letters.forEach(letterObj => {
            const letterOption = document.createElement('div');
            letterOption.className = 'letter-option';
            letterOption.textContent = letterObj.letter;
            letterOption.dataset.letter = letterObj.letter;
            
            letterOption.addEventListener('click', () => {
                this.toggleLetterSelection(letterObj.letter);
            });
            
            letterGrid.appendChild(letterOption);
        });
        
        // Select 2 random letters by default
        const shuffledLetters = this.shuffle([...this.letters]);
        this.selectedLetters = shuffledLetters.slice(0, 2);
        this.updateLetterSelectionUI();
        
        // Set up tile count input listener
        this.setupTileCountListener();
    }
    
    toggleLetterSelection(letter) {
        const letterObj = this.letters.find(l => l.letter === letter);
        const letterOption = document.querySelector(`[data-letter="${letter}"]`);
        
        const index = this.selectedLetters.findIndex(l => l.letter === letter);
        if (index === -1) {
            // Add letter
            this.selectedLetters.push(letterObj);
            letterOption.classList.add('selected');
        } else {
            // Remove letter
            this.selectedLetters.splice(index, 1);
            letterOption.classList.remove('selected');
        }
        
        // Update tile count info when letters change
        if (this.updateTileInfo) {
            this.updateTileInfo();
        }
    }
    
    updateLetterSelectionUI() {
        // Update visual selection state
        document.querySelectorAll('.letter-option').forEach(option => {
            const letter = option.dataset.letter;
            const isSelected = this.selectedLetters.some(l => l.letter === letter);
            
            if (isSelected) {
                option.classList.add('selected');
            } else {
                option.classList.remove('selected');
            }
        });
    }
    
    selectAllLetters() {
        this.selectedLetters = [...this.letters];
        this.updateLetterSelectionUI();
        if (this.updateTileInfo) {
            this.updateTileInfo();
        }
    }
    
    selectNoLetters() {
        this.selectedLetters = [];
        this.updateLetterSelectionUI();
        if (this.updateTileInfo) {
            this.updateTileInfo();
        }
    }
    
    startGame() {
        // Validate selection
        if (this.selectedLetters.length === 0) {
            alert('Vennligst velg minst én bokstav for å spille!');
            return;
        }
        
        // Get tile count and player count
        const tileCount = parseInt(document.getElementById('tile-count').value);
        this.playerCount = parseInt(document.getElementById('player-count').value);
        const maxPossibleTiles = this.selectedLetters.length * 4 * 2; // Each letter has 4 words, 2 tiles per pair
        
        // Initialize players
        this.initializePlayers();
        
        // Validate tile count
        if (tileCount < 4) {
            alert('Du trenger minst 4 kort (2 par) for å spille!');
            return;
        }
        
        if (tileCount % 2 !== 0) {
            alert('Antall kort må være et partall!');
            return;
        }
        
        if (tileCount > maxPossibleTiles) {
            alert(`For mange kort! Maksimalt ${maxPossibleTiles} kort med ${this.selectedLetters.length} valgte bokstaver.`);
            return;
        }
        
        this.selectedPairs = tileCount / 2;
        this.singleLetterMode = false;
        
        // Hide setup screen and show game area
        this.setupScreen.classList.add('hidden');
        this.gameArea.style.display = 'block';
        this.gameArea.classList.add('active');
        
        // Initialize and start the game
        this.initializeGame();
        this.updatePlayerDisplay();
    }
    
    initializePlayers() {
        this.players = [];
        this.currentPlayerIndex = 0;
        
        for (let i = 1; i <= this.playerCount; i++) {
            this.players.push({
                id: i,
                name: `Spiller ${i}`,
                score: 0,
                matches: 0
            });
        }
    }
    
    updatePlayerDisplay() {
        const playersInfo = document.getElementById('players-info');
        
        if (this.playerCount === 1) {
            playersInfo.style.display = 'none';
            return;
        }
        
        playersInfo.style.display = 'block';
        playersInfo.innerHTML = '';
        
        // Current player indicator
        const currentPlayerDiv = document.createElement('div');
        currentPlayerDiv.className = 'current-player';
        currentPlayerDiv.innerHTML = `<strong>Tur: ${this.players[this.currentPlayerIndex].name}</strong>`;
        playersInfo.appendChild(currentPlayerDiv);
        
        // Player scores
        const scoresDiv = document.createElement('div');
        scoresDiv.className = 'player-scores';
        
        this.players.forEach((player, index) => {
            const playerDiv = document.createElement('div');
            playerDiv.className = `player-score ${index === this.currentPlayerIndex ? 'active' : ''}`;
            playerDiv.innerHTML = `${player.name}: ${player.matches} par`;
            scoresDiv.appendChild(playerDiv);
        });
        
        playersInfo.appendChild(scoresDiv);
    }

    nextPlayer() {
        this.currentPlayerIndex = (this.currentPlayerIndex + 1) % this.playerCount;
        this.updatePlayerDisplay();
    }



    // Settings Modal Functions
    showSettingsModal() {
        document.getElementById('settings-modal').classList.remove('hidden');
        document.getElementById('settings-overlay').classList.remove('hidden');
    }

    hideSettingsModal() {
        document.getElementById('settings-modal').classList.add('hidden');
        document.getElementById('settings-overlay').classList.add('hidden');
    }
}

// Start the game when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new MemoryGame();
});