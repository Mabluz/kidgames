class SnakeLadderGame {
    constructor() {
        this.letters = []; // Array of letter objects
        this.selectedLetters = []; // Array of selected letter objects
        this.playerCount = 2;
        this.players = [];
        this.currentPlayerIndex = 0;
        this.boardSquares = [];
        this.snakes = [];
        this.ladders = [];
        this.gameActive = false;
        this.mediaRecorder = null;
        this.audioChunks = [];
        this.recordedAudio = null;
        this.currentSquare = null;
        this.gameBlocked = false;
        this.isRecording = false;
        this.currentWordAudioUrl = null;
        this.pendingSnakeLadder = null; // Stores {type: 'snake'/'ladder', from: number, to: number}

        // Game settings
        this.numSnakes = 5;
        this.numLadders = 5;
        this.snakeMaxDistance = 20;
        this.ladderMaxDistance = 20;

        this.playerColors = ['#e74c3c', '#3498db', '#27ae60', '#f39c12'];
        this.playerNames = ['Spiller 1', 'Spiller 2', 'Spiller 3', 'Spiller 4'];

        this.initializeApp();
    }

    async initializeApp() {
        await this.loadLetterData();
        this.setupEventListeners();
        this.initializeSetupScreen();
        await this.initializeVoiceRecording();
    }

    async loadLetterData() {
        try {
            const response = await fetch('../letter-images.json');
            const rawData = await response.json();

            // Apply difficulty filter
            const difficultySetting = getDifficultySetting();
            const filteredData = filterLetterDataByDifficulty(rawData, difficultySetting);

            // Convert to array format similar to memory game
            this.letters = Object.entries(filteredData).map(([letter, data]) => ({
                letter: letter,
                words: data.words || [],
                images: data.images || [],
                audio: data.audio || [],
                emoji: letter,
                repeatable: data.repeatable || false
            }));
        } catch (error) {
            console.error('Failed to load letter data:', error);
            alert('Kunne ikke laste bokstaver. Vennligst last siden på nytt.');
        }
    }

    setupEventListeners() {
        // Setup screen
        document.getElementById('startGameBtn').addEventListener('click', () => this.startGame());
        document.getElementById('selectAllBtn').addEventListener('click', () => this.selectAllLetters());
        document.getElementById('selectNoneBtn').addEventListener('click', () => this.selectNoLetters());

        // Player selection
        document.querySelectorAll('.player-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.player-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.playerCount = parseInt(e.target.dataset.players);
            });
        });

        // Game controls
        document.getElementById('rollDiceBtn').addEventListener('click', () => this.rollDice());
        document.getElementById('newGameBtn').addEventListener('click', () => this.resetGame());

        // Voice controls
        document.getElementById('playWordBtn').addEventListener('click', () => this.playPreRecordedAudio());
        document.getElementById('recordBtn').addEventListener('click', () => this.toggleRecording());
        document.getElementById('playRecordingBtn').addEventListener('click', () => this.playRecording());
        document.getElementById('continueBtn').addEventListener('click', () => this.continueAfterRecording());

        // Redraw connectors on window resize
        window.addEventListener('resize', () => {
            if (this.gameActive) {
                this.drawConnectors();
            }
        });
    }

    selectAllLetters() {
        this.selectedLetters = [...this.letters];
        this.updateLetterSelectionUI();
    }

    selectNoLetters() {
        this.selectedLetters = [];
        this.updateLetterSelectionUI();
    }

    initializeSetupScreen() {
        const letterGrid = document.getElementById('letterGrid');

        // Create clickable letter options
        this.letters.forEach(letterObj => {
            const letterOption = document.createElement('div');
            letterOption.className = 'letter-btn';
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
    }

    toggleLetterSelection(letter) {
        const letterObj = this.letters.find(l => l.letter === letter);
        const letterOption = document.querySelector(`[data-letter="${letter}"]`);

        const index = this.selectedLetters.findIndex(l => l.letter === letter);

        if (index > -1) {
            // Deselect
            this.selectedLetters.splice(index, 1);
            letterOption.classList.remove('selected');
        } else {
            // Select
            this.selectedLetters.push(letterObj);
            letterOption.classList.add('selected');
        }

        this.updateLetterSelectionUI();
    }

    updateLetterSelectionUI() {
        // Update visual state of all letter buttons
        this.letters.forEach(letterObj => {
            const letterOption = document.querySelector(`[data-letter="${letterObj.letter}"]`);
            if (letterOption) {
                const isSelected = this.selectedLetters.some(l => l.letter === letterObj.letter);
                if (isSelected) {
                    letterOption.classList.add('selected');
                } else {
                    letterOption.classList.remove('selected');
                }
            }
        });

        // Update counter
        document.getElementById('letterCount').textContent = this.selectedLetters.length;

        // Enable/disable start button
        document.getElementById('startGameBtn').disabled = this.selectedLetters.length < 2;
    }

    shuffle(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }

    async initializeVoiceRecording() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            this.mediaRecorder = new MediaRecorder(stream);

            this.mediaRecorder.ondataavailable = (event) => {
                this.audioChunks.push(event.data);
            };

            this.mediaRecorder.onstop = () => {
                const audioBlob = new Blob(this.audioChunks, { type: 'audio/wav' });
                this.recordedAudio = audioBlob;
                this.audioChunks = [];
                this.playRecordingAuto();
            };
        } catch (error) {
            console.error('Microphone access denied:', error);
            alert('Mikrofontilgang er nødvendig for dette spillet. Vennligst gi tilgang og last siden på nytt.');
        }
    }

    startGame() {
        if (this.selectedLetters.length < 2) {
            alert('Vennligst velg minst 2 bokstaver!');
            return;
        }

        // Read game settings from dropdowns
        this.numSnakes = parseInt(document.getElementById('numSnakes').value);
        this.numLadders = parseInt(document.getElementById('numLadders').value);
        this.snakeMaxDistance = parseInt(document.getElementById('snakeMaxDistance').value);
        this.ladderMaxDistance = parseInt(document.getElementById('ladderMaxDistance').value);

        this.initializePlayers();
        this.generateBoard();
        this.placeSnakes();
        this.placeLadders();
        this.renderBoard();
        this.updatePlayersStatus();

        document.getElementById('setupScreen').classList.add('hidden');
        document.getElementById('gameScreen').classList.remove('hidden');

        this.gameActive = true;
        this.updateCurrentPlayerIndicator();
    }

    initializePlayers() {
        this.players = [];
        for (let i = 0; i < this.playerCount; i++) {
            this.players.push({
                name: this.playerNames[i],
                color: this.playerColors[i],
                position: 0
            });
        }
    }

    generateBoard() {
        this.boardSquares = [];
        const allWords = [];

        // Collect all words from selected letters
        this.selectedLetters.forEach(letterObj => {
            if (letterObj.words && letterObj.words.length > 0) {
                letterObj.words.forEach((word, index) => {
                    // Get the raw image path (could be emoji, URL, or relative path)
                    const rawImage = letterObj.images[index];
                    // Process image path - if it contains a path separator or starts with http, it's a file path
                    const isFilePath = rawImage && (rawImage.includes('/') || rawImage.includes('\\'));
                    const image = isFilePath ? `../${rawImage}` : rawImage;
                    const audio = letterObj.audio[index] ? `../${letterObj.audio[index]}` : null;

                    allWords.push({
                        word: word,
                        image: image,
                        audio: audio,
                        letter: letterObj.letter
                    });
                });
            }
        });

        // Shuffle all words
        const shuffledWords = this.shuffle([...allWords]);

        // Select 30 words (or all if less than 30)
        for (let i = 0; i < 30; i++) {
            if (shuffledWords.length === 0) break;
            const wordIndex = i % shuffledWords.length; // Cycle through if not enough words
            this.boardSquares.push({
                number: i + 1,
                ...shuffledWords[wordIndex]
            });
        }
    }

    placeSnakes() {
        this.snakes = [];
        const attempts = 100;

        for (let i = 0; i < this.numSnakes; i++) {
            for (let attempt = 0; attempt < attempts; attempt++) {
                // Head can be anywhere from square 9 to 29
                const head = Math.floor(Math.random() * 21) + 9; // 9-29

                // Calculate minimum tail position (at least 3, but respect max distance)
                const minTail = Math.max(3, head - this.snakeMaxDistance);
                const maxTail = head - 3; // At least 3 squares down

                if (maxTail < minTail) continue; // Not enough range

                const tail = Math.floor(Math.random() * (maxTail - minTail + 1)) + minTail;

                if (head <= 3 || head >= 28 || tail <= 3) continue;
                if (this.hasOverlap(head, tail)) continue;

                this.snakes.push({ head, tail });
                break;
            }
        }
    }

    placeLadders() {
        this.ladders = [];
        const attempts = 100;

        for (let i = 0; i < this.numLadders; i++) {
            for (let attempt = 0; attempt < attempts; attempt++) {
                // Bottom can be anywhere from square 3 to 22
                const bottom = Math.floor(Math.random() * 20) + 3; // 3-22

                // Calculate maximum top position (at most 27, but respect max distance)
                const minTop = bottom + 3; // At least 3 squares up
                const maxTop = Math.min(27, bottom + this.ladderMaxDistance);

                if (minTop > maxTop) continue; // Not enough range

                const top = Math.floor(Math.random() * (maxTop - minTop + 1)) + minTop;

                if (bottom <= 3 || top >= 28) continue;
                if (this.hasOverlap(bottom, top)) continue;

                this.ladders.push({ bottom, top });
                break;
            }
        }
    }

    hasOverlap(pos1, pos2) {
        const positions = [pos1, pos2];
        for (const snake of this.snakes) {
            if (positions.includes(snake.head) || positions.includes(snake.tail)) return true;
        }
        for (const ladder of this.ladders) {
            if (positions.includes(ladder.bottom) || positions.includes(ladder.top)) return true;
        }
        return false;
    }

    renderBoard() {
        const board = document.getElementById('gameBoard');
        board.innerHTML = '';

        // Create connector overlay container
        const connectorsOverlay = document.createElement('div');
        connectorsOverlay.className = 'connectors-overlay';
        connectorsOverlay.id = 'connectorsOverlay';

        // Render all squares first
        for (let row = 4; row >= 0; row--) {
            for (let col = 0; col < 6; col++) {
                let squareIndex;
                if (row % 2 === 0) {
                    squareIndex = row * 6 + col;
                } else {
                    squareIndex = row * 6 + (5 - col);
                }

                if (squareIndex >= 30) continue;

                const square = this.boardSquares[squareIndex];
                const squareDiv = document.createElement('div');
                squareDiv.className = 'board-square';
                squareDiv.dataset.position = square.number;

                const numberDiv = document.createElement('div');
                numberDiv.className = 'square-number';
                numberDiv.textContent = square.number;

                const imageDiv = document.createElement('div');
                imageDiv.className = 'square-image';
                // Handle both emoji and image URLs
                const isImagePath = square.image && (
                    square.image.startsWith('http') ||
                    square.image.startsWith('../') ||
                    square.image.includes('/')
                );

                if (isImagePath) {
                    const img = document.createElement('img');
                    img.src = square.image;
                    img.style.maxWidth = '100%';
                    img.style.maxHeight = '100%';
                    img.style.objectFit = 'contain';
                    imageDiv.appendChild(img);
                } else {
                    imageDiv.textContent = square.image;
                }

                const wordDiv = document.createElement('div');
                wordDiv.className = 'square-word';
                wordDiv.textContent = square.word;

                squareDiv.appendChild(numberDiv);
                squareDiv.appendChild(imageDiv);
                squareDiv.appendChild(wordDiv);

                // Add special markers
                const snake = this.snakes.find(s => s.head === square.number);
                const ladder = this.ladders.find(l => l.bottom === square.number);

                if (snake || ladder) {
                    const specialDiv = document.createElement('div');
                    specialDiv.className = 'square-special';
                    specialDiv.textContent = snake ? '🐍' : '🪜';
                    squareDiv.appendChild(specialDiv);
                }

                // Add player tokens container
                const tokensDiv = document.createElement('div');
                tokensDiv.className = 'player-tokens';
                squareDiv.appendChild(tokensDiv);

                board.appendChild(squareDiv);
            }
        }

        // Add connectors overlay after all squares
        board.appendChild(connectorsOverlay);

        // Wait a bit for layout, then draw connectors
        setTimeout(() => this.drawConnectors(), 100);

        this.updatePlayerPositions();
    }

    getSquarePosition(squareNumber) {
        const squareEl = document.querySelector(`[data-position="${squareNumber}"]`);
        if (!squareEl) return null;

        const rect = squareEl.getBoundingClientRect();
        const boardRect = document.getElementById('gameBoard').getBoundingClientRect();

        return {
            x: rect.left - boardRect.left + rect.width / 2,
            y: rect.top - boardRect.top + rect.height / 2
        };
    }

    drawConnectors() {
        const overlay = document.getElementById('connectorsOverlay');
        if (!overlay) return;

        // Clear existing connectors
        overlay.innerHTML = '';

        // Draw snakes
        this.snakes.forEach(snake => {
            const startPos = this.getSquarePosition(snake.head);
            const endPos = this.getSquarePosition(snake.tail);

            if (startPos && endPos) {
                const line = document.createElement('div');
                line.className = 'snake-line';

                const length = Math.sqrt(
                    Math.pow(endPos.x - startPos.x, 2) +
                    Math.pow(endPos.y - startPos.y, 2)
                );

                const angle = Math.atan2(endPos.y - startPos.y, endPos.x - startPos.x) * 180 / Math.PI;

                line.style.width = length + 'px';
                line.style.left = startPos.x + 'px';
                line.style.top = startPos.y + 'px';
                line.style.transform = `rotate(${angle}deg)`;
                line.style.transformOrigin = '0 0';

                overlay.appendChild(line);
            }
        });

        // Draw ladders
        this.ladders.forEach(ladder => {
            const startPos = this.getSquarePosition(ladder.bottom);
            const endPos = this.getSquarePosition(ladder.top);

            if (startPos && endPos) {
                const line = document.createElement('div');
                line.className = 'ladder-line';

                const length = Math.sqrt(
                    Math.pow(endPos.x - startPos.x, 2) +
                    Math.pow(endPos.y - startPos.y, 2)
                );

                const angle = Math.atan2(endPos.y - startPos.y, endPos.x - startPos.x) * 180 / Math.PI;

                line.style.width = length + 'px';
                line.style.left = startPos.x + 'px';
                line.style.top = startPos.y + 'px';
                line.style.transform = `rotate(${angle}deg)`;
                line.style.transformOrigin = '0 0';

                overlay.appendChild(line);
            }
        });
    }

    highlightConnector(startPosition, type) {
        const overlay = document.getElementById('connectorsOverlay');
        if (!overlay) return;

        const lines = overlay.querySelectorAll(type === 'snake' ? '.snake-line' : '.ladder-line');
        lines.forEach(line => {
            // Check if this line starts at the given position by checking its position
            const lineLeft = parseFloat(line.style.left);
            const lineTop = parseFloat(line.style.top);

            const startSquare = document.querySelector(`[data-position="${startPosition}"]`);
            if (startSquare) {
                const startPos = this.getSquarePosition(startPosition);
                if (startPos && Math.abs(lineLeft - startPos.x) < 5 && Math.abs(lineTop - startPos.y) < 5) {
                    line.classList.add('highlighted');
                }
            }
        });
    }

    unhighlightConnector() {
        document.querySelectorAll('.snake-line.highlighted, .ladder-line.highlighted').forEach(line => {
            line.classList.remove('highlighted');
        });
    }

    updatePlayerPositions() {
        // Clear all tokens
        document.querySelectorAll('.player-tokens').forEach(div => div.innerHTML = '');

        // Add tokens to current positions
        this.players.forEach((player, index) => {
            const square = document.querySelector(`[data-position="${player.position}"]`);
            if (square) {
                const tokensDiv = square.querySelector('.player-tokens');
                const token = document.createElement('div');
                token.className = 'player-token';
                token.style.backgroundColor = player.color;
                token.dataset.playerIndex = index; // Add player index as data attribute
                tokensDiv.appendChild(token);
            }
        });
    }

    updateCurrentPlayerIndicator() {
        const currentPlayer = this.players[this.currentPlayerIndex];
        const indicator = document.getElementById('currentPlayerName');
        indicator.textContent = currentPlayer.name;
    }

    updatePlayersStatus() {
        const statusDiv = document.getElementById('playersStatus');
        statusDiv.innerHTML = '';

        this.players.forEach((player, index) => {
            const playerDiv = document.createElement('div');
            playerDiv.className = 'player-status';
            if (index === this.currentPlayerIndex) {
                playerDiv.classList.add('active');
                playerDiv.style.setProperty('--player-color', player.color);
            }
            playerDiv.style.borderLeftColor = player.color;

            const nameDiv = document.createElement('div');
            nameDiv.className = 'player-name';
            nameDiv.textContent = player.name;

            const positionDiv = document.createElement('div');
            positionDiv.className = 'player-position';
            positionDiv.textContent = `Posisjon: ${player.position}`;

            playerDiv.appendChild(nameDiv);
            playerDiv.appendChild(positionDiv);
            statusDiv.appendChild(playerDiv);
        });
    }

    async rollDice() {
        if (!this.gameActive || this.gameBlocked) return;

        const rollBtn = document.getElementById('rollDiceBtn');
        const diceDisplay = document.getElementById('diceDisplay');

        rollBtn.disabled = true;
        diceDisplay.classList.add('rolling');

        // Animate dice roll
        let rolls = 0;
        const rollInterval = setInterval(() => {
            diceDisplay.textContent = Math.floor(Math.random() * 6) + 1;
            rolls++;
            if (rolls >= 10) {
                clearInterval(rollInterval);
                const finalRoll = Math.floor(Math.random() * 6) + 1;
                diceDisplay.textContent = finalRoll;
                diceDisplay.classList.remove('rolling');

                // Add reveal animation
                diceDisplay.classList.add('reveal');
                setTimeout(() => {
                    diceDisplay.classList.remove('reveal');
                }, 600);

                // Wait a bit before moving player to let reveal animation finish
                setTimeout(() => {
                    this.movePlayer(finalRoll);
                }, 400);
            }
        }, 100);
    }

    async movePlayer(steps) {
        const currentPlayer = this.players[this.currentPlayerIndex];
        let newPosition = currentPlayer.position + steps;
        const startPos = currentPlayer.position;

        // Check win condition - going past 30
        if (newPosition > 30) {
            // Go directly to Mål and win (skip word practice on 30)
            // For first move from position 0, place token at position 1 first
            if (startPos === 0) {
                currentPlayer.position = 1;
                this.updatePlayerPositions();
                await this.delay(100);
            }

            // Create animated token (now at position 1 if it was first move)
            const animToken = await this.createAnimatedToken(startPos === 0 ? 1 : startPos);
            if (animToken) {
                // Animate through remaining steps to 30
                const firstStep = startPos === 0 ? 2 : startPos + 1;
                for (let pos = firstStep; pos <= 30; pos++) {
                    await this.animateTokenToPosition(animToken, pos);
                }

                // Brief pause at 30 before continuing to goal
                await this.delay(100);

                // Continue to Mål (position 31)
                await this.animateTokenToPosition(animToken, 31);

                // Remove animated token
                document.body.removeChild(animToken);
            }

            currentPlayer.position = 31;
            this.updatePlayerPositions();
            await this.delay(500);
            this.showWinScreen();
            return;
        }

        // Landing exactly on 30 - practice word but don't win yet
        if (newPosition === 30) {
            // For first move from position 0, place token at position 1 first
            if (startPos === 0) {
                currentPlayer.position = 1;
                this.updatePlayerPositions();
                await this.delay(100);
            }

            // Create animated token (now at position 1 if it was first move)
            const animToken = await this.createAnimatedToken(startPos === 0 ? 1 : startPos);
            if (animToken) {
                // Animate through remaining steps
                const firstStep = startPos === 0 ? 2 : startPos + 1;
                for (let pos = firstStep; pos <= 30; pos++) {
                    await this.animateTokenToPosition(animToken, pos);
                }

                // Pause to show token at center of final tile
                await this.delay(300);

                // Animate from center to bottom-right corner of final tile
                await this.animateTokenToCorner(animToken, 30);

                // Remove animated token
                document.body.removeChild(animToken);
            }

            currentPlayer.position = 30;
            // Now update positions to place token in corner
            this.updatePlayerPositions();
            this.updatePlayersStatus();
            await this.delay(100);

            // Practice pronunciation on square 30 (but won't win after)
            await this.handleSquareLanding(30);
            return;
        }

        // For first move from position 0, place token at position 1 first
        if (startPos === 0) {
            currentPlayer.position = 1;
            this.updatePlayerPositions();
            await this.delay(100);
        }

        // Create animated token (now at position 1 if it was first move)
        const animToken = await this.createAnimatedToken(startPos === 0 ? 1 : startPos);
        if (animToken) {
            // Animate through remaining steps
            const firstStep = startPos === 0 ? 2 : startPos + 1;
            for (let pos = firstStep; pos <= newPosition; pos++) {
                await this.animateTokenToPosition(animToken, pos);
            }

            // Pause to show token at center of final tile
            await this.delay(300);

            // Animate from center to bottom-right corner of final tile
            await this.animateTokenToCorner(animToken, newPosition);

            // Remove animated token
            document.body.removeChild(animToken);
        }

        currentPlayer.position = newPosition;
        // Now update positions to place token in corner
        this.updatePlayerPositions();
        this.updatePlayersStatus();
        await this.delay(100);

        // Check for snake or ladder
        const snake = this.snakes.find(s => s.head === newPosition);
        const ladder = this.ladders.find(l => l.bottom === newPosition);

        if (snake) {
            // Store pending snake transition
            this.pendingSnakeLadder = {
                type: 'snake',
                from: snake.head,
                to: snake.tail
            };
            // First record the word at the snake head
            await this.handleSquareLanding(newPosition);
        } else if (ladder) {
            // Store pending ladder transition
            this.pendingSnakeLadder = {
                type: 'ladder',
                from: ladder.bottom,
                to: ladder.top
            };
            // First record the word at the ladder bottom
            await this.handleSquareLanding(newPosition);
        } else {
            // No snake or ladder, just handle normal landing
            await this.delay(100);
            await this.handleSquareLanding(newPosition);
        }
    }

    async createAnimatedToken(position) {
        const currentPlayer = this.players[this.currentPlayerIndex];
        const square = document.querySelector(`[data-position="${position}"]`);

        if (!square) return null;

        const tokensDiv = square.querySelector('.player-tokens');
        const playerTokens = tokensDiv ? Array.from(tokensDiv.children) : [];
        const token = playerTokens.find(t => parseInt(t.dataset.playerIndex) === this.currentPlayerIndex);

        if (!token) return null;

        // Clone token for animation
        const animToken = token.cloneNode(true);
        animToken.classList.add('moving');

        const rect = square.getBoundingClientRect();
        const x = rect.left + rect.width / 2 - 12.5;
        const y = rect.top + rect.height / 2 - 12.5;

        animToken.style.left = x + 'px';
        animToken.style.top = y + 'px';
        document.body.appendChild(animToken);

        // Hide original token
        token.style.opacity = '0';

        return animToken;
    }

    async animateTokenToPosition(animToken, toPos) {
        const toSquare = document.querySelector(`[data-position="${toPos}"]`);
        if (!toSquare) return;

        const toRect = toSquare.getBoundingClientRect();

        const startX = parseFloat(animToken.style.left);
        const startY = parseFloat(animToken.style.top);
        const endX = toRect.left + toRect.width / 2 - 12.5;
        const endY = toRect.top + toRect.height / 2 - 12.5;

        // Calculate distance and duration for constant speed
        const distance = Math.sqrt((endX - startX) ** 2 + (endY - startY) ** 2);
        const speed = 400; // pixels per second - adjust for faster/slower movement
        const duration = (distance / speed) * 1000; // convert to milliseconds

        return new Promise(resolve => {
            const startTime = performance.now();

            const animate = (currentTime) => {
                const elapsed = currentTime - startTime;
                const progress = Math.min(elapsed / duration, 1);

                // Use easeInOut for smooth start and stop
                const eased = progress < 0.5
                    ? 2 * progress * progress
                    : 1 - Math.pow(-2 * progress + 2, 2) / 2;

                const x = startX + (endX - startX) * eased;
                const y = startY + (endY - startY) * eased;

                animToken.style.left = x + 'px';
                animToken.style.top = y + 'px';

                if (progress < 1) {
                    requestAnimationFrame(animate);
                } else {
                    // Ensure final position is exact
                    animToken.style.left = endX + 'px';
                    animToken.style.top = endY + 'px';
                    resolve();
                }
            };

            requestAnimationFrame(animate);
        });
    }

    async animateTokenToCorner(animToken, position) {
        const square = document.querySelector(`[data-position="${position}"]`);
        if (!square) return;

        const rect = square.getBoundingClientRect();
        const tokensDiv = square.querySelector('.player-tokens');
        const tokensRect = tokensDiv.getBoundingClientRect();

        const startX = parseFloat(animToken.style.left);
        const startY = parseFloat(animToken.style.top);

        // Calculate bottom-right position (where the token normally sits)
        const endX = tokensRect.right - 30;
        const endY = tokensRect.bottom - 30;

        // Use same smooth animation as position movement
        const distance = Math.sqrt((endX - startX) ** 2 + (endY - startY) ** 2);
        const speed = 300; // Slightly slower for the final settling movement
        const duration = Math.max((distance / speed) * 1000, 200); // Minimum 200ms

        return new Promise(resolve => {
            const startTime = performance.now();

            const animate = (currentTime) => {
                const elapsed = currentTime - startTime;
                const progress = Math.min(elapsed / duration, 1);

                // Use easeOut for smooth deceleration into position
                const eased = 1 - Math.pow(1 - progress, 3);

                const x = startX + (endX - startX) * eased;
                const y = startY + (endY - startY) * eased;

                animToken.style.left = x + 'px';
                animToken.style.top = y + 'px';

                if (progress < 1) {
                    requestAnimationFrame(animate);
                } else {
                    // Ensure final position is exact
                    animToken.style.left = endX + 'px';
                    animToken.style.top = endY + 'px';
                    resolve();
                }
            };

            requestAnimationFrame(animate);
        });
    }

    async animatePlayerMove(fromPos, toPos, type = 'normal') {
        const currentPlayer = this.players[this.currentPlayerIndex];

        // Get square positions
        const fromSquare = document.querySelector(`[data-position="${fromPos}"]`);
        const toSquare = document.querySelector(`[data-position="${toPos}"]`);

        if (!toSquare) return;

        // If starting from position 0 (off board), just appear at target
        if (fromPos === 0) return;

        if (!fromSquare) return;

        // Find player token in the from square
        const fromTokensDiv = fromSquare.querySelector('.player-tokens');
        const playerTokens = fromTokensDiv ? Array.from(fromTokensDiv.children) : [];

        // Find the token for current player by index
        const token = playerTokens.find(t => parseInt(t.dataset.playerIndex) === this.currentPlayerIndex);
        if (!token) return;

        // Get positions (center of tiles)
        const fromRect = fromSquare.getBoundingClientRect();
        const toRect = toSquare.getBoundingClientRect();

        // Clone token for animation
        const animToken = token.cloneNode(true);
        animToken.classList.add('moving');

        // Add special animation class for snakes and ladders
        if (type === 'snake') {
            animToken.classList.add('sliding-snake');
        } else if (type === 'ladder') {
            animToken.classList.add('climbing-ladder');
        }

        // Always use center positions for animation
        const startX = fromRect.left + fromRect.width / 2 - 12.5;
        const startY = fromRect.top + fromRect.height / 2 - 12.5;
        const endX = toRect.left + toRect.width / 2 - 12.5;
        const endY = toRect.top + toRect.height / 2 - 12.5;

        animToken.style.left = startX + 'px';
        animToken.style.top = startY + 'px';
        document.body.appendChild(animToken);

        // Hide original token
        token.style.opacity = '0';

        // For snakes and ladders, animate along a curved path
        if (type === 'snake' || type === 'ladder') {
            const steps = 30;
            const duration = 1500; // 1.5 seconds total
            const stepDelay = duration / steps;

            // Calculate control point for curve (arc)
            const midX = (startX + endX) / 2;
            const midY = (startY + endY) / 2;

            // Add perpendicular offset for curve effect
            const dx = endX - startX;
            const dy = endY - startY;
            const distance = Math.sqrt(dx * dx + dy * dy);
            const curveOffset = distance * 0.4; // 40% of distance as curve depth

            // Perpendicular direction - make ladders arc upward
            let perpX = -dy / distance * curveOffset;
            let perpY = dx / distance * curveOffset;

            // For ladders going up, ensure the arc goes outward from the board
            if (type === 'ladder') {
                // Flip the perpendicular direction if needed to make it more visible
                perpX = Math.abs(perpX) * (dx > 0 ? 1 : -1);
            }

            const controlX = midX + perpX;
            const controlY = midY + perpY;

            // Animate along quadratic bezier curve
            for (let i = 0; i <= steps; i++) {
                const t = i / steps;

                // Quadratic bezier formula
                const x = Math.pow(1 - t, 2) * startX +
                         2 * (1 - t) * t * controlX +
                         Math.pow(t, 2) * endX;

                const y = Math.pow(1 - t, 2) * startY +
                         2 * (1 - t) * t * controlY +
                         Math.pow(t, 2) * endY;

                animToken.style.left = x + 'px';
                animToken.style.top = y + 'px';

                await this.delay(stepDelay);
            }
        } else {
            // Normal straight line movement with hopping effect
            const hopSteps = 20;
            const duration = 400; // 400ms per hop
            const stepDelay = duration / hopSteps;

            for (let i = 0; i <= hopSteps; i++) {
                const t = i / hopSteps;

                // Linear interpolation for position
                const x = startX + (endX - startX) * t;
                const y = startY + (endY - startY) * t;

                // Parabolic curve for scale (makes it bigger in the middle of the hop)
                // Goes from 1.0 -> 1.5 -> 1.0
                const scaleFactor = 1 + 0.5 * Math.sin(t * Math.PI);

                animToken.style.left = x + 'px';
                animToken.style.top = y + 'px';
                animToken.style.transform = `scale(${scaleFactor})`;

                await this.delay(stepDelay);
            }
        }

        // Clean up
        document.body.removeChild(animToken);
        token.style.opacity = '1';
    }

    async handleSquareLanding(position) {
        if (position === 30) {
            // Practice pronunciation on square 30
            const square = this.boardSquares[position - 1];
            this.currentSquare = square;

            // Highlight square
            document.querySelectorAll('.board-square').forEach(s => s.classList.remove('active'));
            const squareEl = document.querySelector(`[data-position="${position}"]`);
            if (squareEl) squareEl.classList.add('active');

            // Show voice modal and play word
            this.showVoiceControls();
            await this.delay(500);
            this.playPreRecordedAudio();
            return;
        }

        const square = this.boardSquares[position - 1];
        this.currentSquare = square;

        // Highlight square
        document.querySelectorAll('.board-square').forEach(s => s.classList.remove('active'));
        const squareEl = document.querySelector(`[data-position="${position}"]`);
        if (squareEl) squareEl.classList.add('active');

        // Show voice modal and play word
        this.showVoiceControls();
        await this.delay(500);
        this.playPreRecordedAudio();
    }

    showVoiceControls() {
        this.gameBlocked = true;
        const modal = document.getElementById('voiceModal');
        const wordImage = document.getElementById('modalWordImage');
        const wordText = document.getElementById('modalWordText');
        const status = document.getElementById('recordingStatus');

        // Handle both emoji and image URLs
        wordImage.innerHTML = '';
        const isImagePath = this.currentSquare.image && (
            this.currentSquare.image.startsWith('http') ||
            this.currentSquare.image.startsWith('../') ||
            this.currentSquare.image.includes('/')
        );

        if (isImagePath) {
            const img = document.createElement('img');
            img.src = this.currentSquare.image;
            img.style.maxWidth = '100%';
            img.style.maxHeight = '200px';
            img.style.objectFit = 'contain';
            wordImage.appendChild(img);
        } else {
            wordImage.textContent = this.currentSquare.image;
        }

        wordText.textContent = this.currentSquare.word;
        status.textContent = `Klikk ta opp og si "${this.currentSquare.word}"`;

        document.getElementById('playbackGroup').classList.add('hidden');
        document.getElementById('recordBtn').textContent = '🎤 Ta opp';
        document.getElementById('recordBtn').classList.remove('recording');

        modal.classList.remove('hidden');
    }

    hideVoiceControls() {
        document.getElementById('voiceModal').classList.add('hidden');
        document.querySelectorAll('.board-square').forEach(s => s.classList.remove('active'));
        this.gameBlocked = false;
        this.recordedAudio = null;
    }

    playPreRecordedAudio() {
        if (this.currentSquare && this.currentSquare.audio) {
            const audio = new Audio(this.currentSquare.audio);
            audio.play().catch(err => console.error('Audio playback failed:', err));
        } else if (this.currentSquare && this.currentSquare.letter) {
            playLetterSound(this.currentSquare.letter);
        }
    }

    async toggleRecording() {
        if (!this.mediaRecorder) {
            alert('Mikrofon er ikke tilgjengelig');
            return;
        }

        if (this.isRecording) {
            this.stopRecording();
        } else {
            this.startRecording();
        }
    }

    startRecording() {
        this.audioChunks = [];
        this.recordedAudio = null;
        this.isRecording = true;

        const recordBtn = document.getElementById('recordBtn');
        const status = document.getElementById('recordingStatus');

        recordBtn.textContent = '⏹️ Stopp';
        recordBtn.classList.add('recording');
        status.textContent = `Spiller inn... Si "${this.currentSquare.word}"`;

        this.mediaRecorder.start();

        // Auto-stop after 3 seconds
        setTimeout(() => {
            if (this.isRecording) {
                this.stopRecording();
            }
        }, 3000);
    }

    stopRecording() {
        if (!this.isRecording) return;

        this.isRecording = false;
        this.mediaRecorder.stop();

        const recordBtn = document.getElementById('recordBtn');
        recordBtn.textContent = '🎤 Ta opp på nytt';
        recordBtn.classList.remove('recording');
    }

    async playRecordingAuto() {
        if (!this.recordedAudio) return;

        const audioUrl = URL.createObjectURL(this.recordedAudio);
        const audio = new Audio(audioUrl);

        try {
            await audio.play();

            const status = document.getElementById('recordingStatus');
            status.textContent = 'Hør opptaket ditt! Klikk fortsett når du er klar';

            document.getElementById('playbackGroup').classList.remove('hidden');
        } catch (error) {
            console.error('Playback failed:', error);
        }
    }

    async playRecording() {
        if (!this.recordedAudio) return;

        const audioUrl = URL.createObjectURL(this.recordedAudio);
        const audio = new Audio(audioUrl);
        await audio.play().catch(err => console.error('Playback failed:', err));
    }

    async continueAfterRecording() {
        this.hideVoiceControls();

        // Check if there's a pending snake or ladder transition
        if (this.pendingSnakeLadder) {
            const transition = this.pendingSnakeLadder;
            const currentPlayer = this.players[this.currentPlayerIndex];

            await this.delay(300);
            // Highlight the connector
            this.highlightConnector(transition.from, transition.type);
            // Animate the snake/ladder movement
            await this.animatePlayerMove(transition.from, transition.to, transition.type);
            this.unhighlightConnector();

            // Update player position to destination
            currentPlayer.position = transition.to;
            this.updatePlayerPositions();
            this.updatePlayersStatus();

            // Clear the pending transition
            this.pendingSnakeLadder = null;

            // Now record the word at the destination
            await this.delay(300);
            await this.handleSquareLanding(transition.to);
            return;
        }

        // Continue to next player (removed the check for position 30 winning)
        this.nextPlayer();
    }

    nextPlayer() {
        this.currentPlayerIndex = (this.currentPlayerIndex + 1) % this.players.length;
        this.updateCurrentPlayerIndicator();
        this.updatePlayersStatus();
        document.getElementById('rollDiceBtn').disabled = false;
    }

    showWinScreen() {
        this.gameActive = false;
        const currentPlayer = this.players[this.currentPlayerIndex];
        document.getElementById('winnerText').textContent = `${currentPlayer.name} vant!`;
        document.getElementById('winScreen').classList.remove('hidden');

        // Trigger confetti
        if (typeof triggerConfetti === 'function') {
            triggerConfetti();
        }

        // Play game over sound
        if (typeof playGameOverSound === 'function') {
            playGameOverSound();
        }
    }

    resetGame() {
        document.getElementById('winScreen').classList.add('hidden');
        document.getElementById('gameScreen').classList.add('hidden');
        document.getElementById('setupScreen').classList.remove('hidden');

        this.selectedLetters = [];
        this.currentPlayerIndex = 0;
        this.gameActive = false;
        this.gameBlocked = false;
        this.pendingSnakeLadder = null;

        document.querySelectorAll('.letter-btn').forEach(btn => btn.classList.remove('selected'));
        document.getElementById('letterCount').textContent = '0';
        document.getElementById('startGameBtn').disabled = true;
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Initialize game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new SnakeLadderGame();
});
