class LetterTraceGame {
    constructor() {
        this.letterData = {};
        this.selectedLetters = [];
        this.currentLetterIndex = 0;
        this.mode = 'guided'; // 'guided' or 'challenge'
        this.repetitionCount = 7; // Default number of times to draw
        this.pronunciationPractice = false; // Whether to practice pronunciation
        this.letterSelection = null;
        this.completedLetters = [];
        this.currentAccuracy = 0;

        // Recording related
        this.mediaRecorder = null;
        this.audioChunks = [];
        this.recordedAudioBlob = null;

        // Canvas and drawing
        this.canvas = null;
        this.ctx = null;
        this.isDrawing = false;
        this.isLetterComplete = false; // Lock drawing when letter is complete
        this.lastPoint = null;
        this.drawnPath = [];
        this.letterPaths = this.initializeLetterPaths();

        // Screens
        this.setupScreen = document.getElementById('setup-screen');
        this.gameScreen = document.getElementById('game-screen');
        this.completionScreen = document.getElementById('completion-screen');

        this.init();
    }

    async init() {
        await this.loadLetterData();
        this.setupEventListeners();
        this.initializeLetterSelection();
        this.setupCanvas();
        this.initializeSettingsModal();
    }

    initializeSettingsModal() {
        // Wait for modal HTML to be loaded
        const checkModal = setInterval(() => {
            if (document.getElementById('settings-modal')) {
                clearInterval(checkModal);
                this.settingsModal = new SettingsModal({
                    onRestart: () => this.showSetupScreen()
                });
            }
        }, 100);
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

        // Mode selection
        document.querySelectorAll('.mode-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.selectMode(e.target.closest('.mode-btn')));
        });

        // Repetition count selection
        document.getElementById('repetition-count').addEventListener('change', (e) => {
            this.repetitionCount = parseInt(e.target.value);
        });

        // Pronunciation practice checkbox
        document.getElementById('pronunciation-practice').addEventListener('change', (e) => {
            this.pronunciationPractice = e.target.checked;
        });

        // Pronunciation controls
        document.getElementById('replay-word-btn').addEventListener('click', () => this.replayWord());
        document.getElementById('record-btn').addEventListener('click', () => this.toggleRecording());
        document.getElementById('replay-recording-btn').addEventListener('click', () => this.replayRecording());
        document.getElementById('next-letter-btn').addEventListener('click', () => this.proceedToNextLetter());

        // Game controls
        document.getElementById('clear-btn').addEventListener('click', () => this.clearCanvas());
        document.getElementById('settings-btn').addEventListener('click', () => {
            if (this.settingsModal) {
                this.settingsModal.show();
            }
        });
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
                console.log('Selected letters for tracing:', selectedLetters);
            }
        });
    }

    selectMode(btn) {
        document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.mode = btn.dataset.mode;
    }

    setupCanvas() {
        this.canvas = document.getElementById('trace-canvas');
        this.ctx = this.canvas.getContext('2d');

        // Set canvas size to match container
        const resizeCanvas = () => {
            const container = this.canvas.parentElement;
            const size = Math.min(container.clientWidth, container.clientHeight);
            this.canvas.width = size;
            this.canvas.height = size;
            this.redrawCanvas();
        };

        window.addEventListener('resize', resizeCanvas);
        resizeCanvas();

        // Mouse events
        this.canvas.addEventListener('mousedown', (e) => this.startDrawing(e));
        this.canvas.addEventListener('mousemove', (e) => this.draw(e));
        this.canvas.addEventListener('mouseup', () => this.stopDrawing());
        this.canvas.addEventListener('mouseleave', () => this.stopDrawing());

        // Touch events
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.startDrawing(e.touches[0]);
        }, { passive: false });

        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            this.draw(e.touches[0]);
        }, { passive: false });

        this.canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.stopDrawing();
        }, { passive: false });
    }

    startGame() {
        if (!this.letterSelection.isValidSelection()) {
            alert(this.letterSelection.getValidationMessage());
            return;
        }

        const baseLetters = this.letterSelection.getSelectedLetters();
        this.currentLetterIndex = 0;
        this.completedLetters = [];

        // Generate a random sequence of letters based on repetition count
        // Avoid picking the same letter consecutively
        this.selectedLetters = [];
        let lastLetter = null;

        for (let i = 0; i < this.repetitionCount; i++) {
            let randomLetter;

            // If there's only one letter, we have to use it
            if (baseLetters.length === 1) {
                randomLetter = baseLetters[0];
            } else {
                // Pick a random letter that's different from the last one
                do {
                    randomLetter = baseLetters[Math.floor(Math.random() * baseLetters.length)];
                } while (randomLetter === lastLetter);
            }

            this.selectedLetters.push(randomLetter);
            lastLetter = randomLetter;
        }

        this.showGameScreen();

        // Resize canvas now that the game screen is visible
        setTimeout(() => {
            const container = this.canvas.parentElement;
            const size = Math.min(container.clientWidth, container.clientHeight);
            this.canvas.width = size;
            this.canvas.height = size;
            this.loadNextLetter();
        }, 100);
    }

    async loadNextLetter() {
        if (this.currentLetterIndex >= this.selectedLetters.length) {
            this.showCompletionScreen();
            return;
        }

        const letter = this.selectedLetters[this.currentLetterIndex];
        this.currentLetter = letter;
        this.isLetterComplete = false; // Allow drawing for new letter

        // Always hide pronunciation section when loading a new letter
        document.getElementById('pronunciation-section').classList.add('hidden');
        document.getElementById('next-letter-btn').classList.add('hidden');
        document.getElementById('replay-recording-btn').classList.add('hidden');

        // Re-enable the clear button for the new letter
        document.getElementById('clear-btn').disabled = false;

        // Update UI
        document.getElementById('current-letter').textContent = `Bokstav: ${letter}`;
        document.getElementById('progress').textContent =
            `Fremdrift: ${this.currentLetterIndex + 1}/${this.selectedLetters.length}`;
        document.getElementById('letter-display').textContent = letter;
        document.getElementById('feedback-text').textContent = 'Tegn bokstaven ved å følge linjen';

        // Show word and image
        const wordImage = document.getElementById('word-image');
        const wordText = document.getElementById('word-text');

        // Get a word for this letter
        const letterInfo = this.letterData[letter];
        if (letterInfo && letterInfo.words && letterInfo.words.length > 0) {
            const randomIndex = Math.floor(Math.random() * letterInfo.words.length);
            const word = letterInfo.words[randomIndex];
            const image = letterInfo.images[randomIndex];

            // Store the current word info for playing audio later
            this.currentWordIndex = randomIndex;

            // Determine if image is emoji or file path
            const isEmoji = image.length <= 4 && !/\.(jpg|jpeg|png|gif|webp)$/i.test(image);

            if (isEmoji) {
                wordImage.textContent = image;
                wordImage.innerHTML = image;
            } else {
                const imgPath = image.startsWith('http') || image.length <= 4 ? image : `../${image}`;
                wordImage.innerHTML = `<img src="${imgPath}" alt="${word}" style="max-width: 150px; max-height: 150px; border-radius: 10px;">`;
            }

            wordText.textContent = word;

            // Play letter sound first
            await playLetterSound(letter);

            // Wait 1 second
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Then play word audio if available
            if (letterInfo.audio && letterInfo.audio[randomIndex]) {
                const audioPath = `../${letterInfo.audio[randomIndex]}`;
                const audio = new Audio(audioPath);
                await audio.play().catch(err => console.log('Could not play word audio:', err));
            }
        }

        // Reset canvas
        this.clearCanvas();
        this.redrawCanvas();
    }

    clearCanvas() {
        this.drawnPath = [];
        this.currentAccuracy = 0;
        this.updateAccuracyBar();
        this.redrawCanvas();
    }

    redrawCanvas() {
        if (!this.ctx || !this.canvas) return;

        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw letter guideline if in guided mode
        if (this.mode === 'guided' && this.currentLetter) {
            this.drawLetterGuideline(this.currentLetter);
        }

        // Draw start point
        if (this.currentLetter && this.mode === 'challenge') {
            this.drawStartPoint();
        }

        // Redraw user's path
        if (this.drawnPath.length > 0) {
            this.ctx.strokeStyle = '#667eea';
            this.ctx.lineWidth = 8;
            this.ctx.lineCap = 'round';
            this.ctx.lineJoin = 'round';

            this.ctx.beginPath();
            this.ctx.moveTo(this.drawnPath[0].x, this.drawnPath[0].y);
            for (let i = 1; i < this.drawnPath.length; i++) {
                this.ctx.lineTo(this.drawnPath[i].x, this.drawnPath[i].y);
            }
            this.ctx.stroke();
        }
    }

    drawLetterGuideline(letter) {
        const path = this.letterPaths[letter];
        if (!path) return;

        const scale = this.canvas.width / 100;

        this.ctx.strokeStyle = 'rgba(102, 126, 234, 0.3)';
        this.ctx.lineWidth = 6;
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';

        for (const stroke of path) {
            this.ctx.beginPath();
            this.ctx.moveTo(stroke[0].x * scale, stroke[0].y * scale);
            for (let i = 1; i < stroke.length; i++) {
                this.ctx.lineTo(stroke[i].x * scale, stroke[i].y * scale);
            }
            this.ctx.stroke();

            // Draw start point for this stroke
            this.ctx.fillStyle = '#48bb78';
            this.ctx.beginPath();
            this.ctx.arc(stroke[0].x * scale, stroke[0].y * scale, 8, 0, Math.PI * 2);
            this.ctx.fill();
        }
    }

    drawStartPoint() {
        const path = this.letterPaths[this.currentLetter];
        if (!path || path.length === 0) return;

        const scale = this.canvas.width / 100;

        // Draw multiple guide points along the letter path for challenge mode
        for (const stroke of path) {
            // Draw dots at regular intervals along each stroke
            for (let i = 0; i < stroke.length; i++) {
                const point = stroke[i];
                const isStartOfStroke = i === 0;

                // Start points are larger and have a pulsing circle
                if (isStartOfStroke) {
                    this.ctx.fillStyle = '#48bb78';
                    this.ctx.beginPath();
                    this.ctx.arc(point.x * scale, point.y * scale, 12, 0, Math.PI * 2);
                    this.ctx.fill();

                    // Draw pulsing circle animation for start point
                    this.ctx.strokeStyle = 'rgba(72, 187, 120, 0.5)';
                    this.ctx.lineWidth = 3;
                    this.ctx.beginPath();
                    this.ctx.arc(point.x * scale, point.y * scale, 18, 0, Math.PI * 2);
                    this.ctx.stroke();
                } else {
                    // Other points are smaller guide dots
                    this.ctx.fillStyle = 'rgba(72, 187, 120, 0.4)';
                    this.ctx.beginPath();
                    this.ctx.arc(point.x * scale, point.y * scale, 5, 0, Math.PI * 2);
                    this.ctx.fill();
                }
            }
        }
    }

    getCanvasPoint(e) {
        const rect = this.canvas.getBoundingClientRect();
        return {
            x: (e.clientX - rect.left) * (this.canvas.width / rect.width),
            y: (e.clientY - rect.top) * (this.canvas.height / rect.height)
        };
    }

    startDrawing(e) {
        // Prevent drawing if letter is already completed
        if (this.isLetterComplete) {
            return;
        }

        this.isDrawing = true;
        const point = this.getCanvasPoint(e);
        this.lastPoint = point;
        this.drawnPath.push(point);
        console.log('Started drawing at:', point, 'Canvas size:', this.canvas.width, 'x', this.canvas.height);
    }

    draw(e) {
        if (!this.isDrawing) return;

        const point = this.getCanvasPoint(e);
        this.drawnPath.push(point);

        // Draw line segment
        this.ctx.strokeStyle = '#667eea';
        this.ctx.lineWidth = 8;
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';

        this.ctx.beginPath();
        this.ctx.moveTo(this.lastPoint.x, this.lastPoint.y);
        this.ctx.lineTo(point.x, point.y);
        this.ctx.stroke();

        this.lastPoint = point;

        // Calculate accuracy (throttled - only every 5 points for performance)
        if (this.drawnPath.length % 5 === 0) {
            this.calculateAccuracy();
        }
    }

    stopDrawing() {
        if (!this.isDrawing) return;
        this.isDrawing = false;
        this.lastPoint = null;

        // Final accuracy calculation when done drawing
        this.calculateAccuracy();

        // Check if letter is complete
        this.checkCompletion();
    }

    // Helper function to interpolate points between two points
    interpolatePoints(p1, p2, spacing = 10) {
        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const numPoints = Math.max(2, Math.floor(distance / spacing));

        const points = [];
        for (let i = 0; i < numPoints; i++) {
            const t = i / (numPoints - 1);
            points.push({
                x: p1.x + dx * t,
                y: p1.y + dy * t
            });
        }
        return points;
    }

    calculateAccuracy() {
        if (!this.currentLetter || this.drawnPath.length === 0) {
            this.currentAccuracy = 0;
            this.updateAccuracyBar();
            return;
        }

        const letterPath = this.letterPaths[this.currentLetter];
        if (!letterPath) {
            this.currentAccuracy = 0;
            this.updateAccuracyBar();
            return;
        }

        const scale = this.canvas.width / 100;
        const tolerance = 35; // pixels - reduced for more precision

        // Generate interpolated points along the letter path for better validation
        const letterPoints = [];
        for (const stroke of letterPath) {
            for (let i = 0; i < stroke.length - 1; i++) {
                const p1 = { x: stroke[i].x * scale, y: stroke[i].y * scale };
                const p2 = { x: stroke[i + 1].x * scale, y: stroke[i + 1].y * scale };
                const interpolated = this.interpolatePoints(p1, p2, 15);
                letterPoints.push(...interpolated);
            }
        }

        // Check what percentage of the LETTER PATH has been covered
        let coveredLetterPoints = 0;
        for (const letterPoint of letterPoints) {
            const isCovered = this.drawnPath.some(drawnPoint => {
                const dx = drawnPoint.x - letterPoint.x;
                const dy = drawnPoint.y - letterPoint.y;
                return Math.sqrt(dx * dx + dy * dy) < tolerance;
            });
            if (isCovered) coveredLetterPoints++;
        }

        // Calculate what percentage of the letter has been traced
        const coveragePercentage = (coveredLetterPoints / letterPoints.length) * 100;

        // Also check that drawn points are actually on the path (not just random)
        let validDrawnPoints = 0;
        for (const drawnPoint of this.drawnPath) {
            const isValid = letterPoints.some(letterPoint => {
                const dx = drawnPoint.x - letterPoint.x;
                const dy = drawnPoint.y - letterPoint.y;
                return Math.sqrt(dx * dx + dy * dy) < tolerance;
            });
            if (isValid) validDrawnPoints++;
        }

        const validityPercentage = this.drawnPath.length > 0
            ? (validDrawnPoints / this.drawnPath.length) * 100
            : 0;

        // Accuracy is the minimum of coverage and validity (both need to be good)
        this.currentAccuracy = Math.min(coveragePercentage, validityPercentage);
        this.updateAccuracyBar();
    }

    updateAccuracyBar() {
        const fill = document.getElementById('accuracy-fill');
        fill.style.width = `${this.currentAccuracy}%`;

        // Update feedback text with accuracy
        const feedbackText = document.getElementById('feedback-text');
        if (this.currentAccuracy >= 92) {
            feedbackText.textContent = `Perfekt! ${Math.round(this.currentAccuracy)}% - Løft fingeren for å fullføre`;
        } else if (this.currentAccuracy >= 85) {
            feedbackText.textContent = `Veldig bra! ${Math.round(this.currentAccuracy)}% - Fullfør bokstaven`;
        } else if (this.currentAccuracy >= 70) {
            feedbackText.textContent = `Nesten der! ${Math.round(this.currentAccuracy)}% - Tegn mer av bokstaven`;
        } else if (this.currentAccuracy >= 40) {
            feedbackText.textContent = `Bra start! ${Math.round(this.currentAccuracy)}% - Fortsett å følge linjen`;
        } else if (this.currentAccuracy > 0) {
            feedbackText.textContent = `Fortsett å tegne bokstaven... ${Math.round(this.currentAccuracy)}%`;
        } else {
            feedbackText.textContent = 'Tegn bokstaven ved å følge linjen';
        }

        // Change color based on accuracy
        if (this.currentAccuracy >= 92) {
            fill.style.background = 'linear-gradient(90deg, #48bb78, #38a169)';
        } else if (this.currentAccuracy >= 85) {
            fill.style.background = 'linear-gradient(90deg, #68d391, #48bb78)';
        } else if (this.currentAccuracy >= 70) {
            fill.style.background = 'linear-gradient(90deg, #9ae6b4, #68d391)';
        } else if (this.currentAccuracy >= 50) {
            fill.style.background = 'linear-gradient(90deg, #ecc94b, #d69e2e)';
        } else {
            fill.style.background = 'linear-gradient(90deg, #f56565, #e53e3e)';
        }
    }

    checkCompletion() {
        // Consider letter complete if enough of the letter path has been covered
        // Require 92% coverage to ensure the entire letter is traced
        console.log('Checking completion: accuracy =', this.currentAccuracy, '%, drawn points =', this.drawnPath.length);
        if (this.currentAccuracy >= 92 && this.drawnPath.length > 50) {
            console.log('Letter completed!');
            this.completeCurrentLetter();
        }
    }

    async completeCurrentLetter() {
        const letter = this.currentLetter;

        // Lock drawing to prevent skipping letters
        this.isLetterComplete = true;

        // Disable clear button to prevent accidental clearing
        document.getElementById('clear-btn').disabled = true;

        // Mark as completed
        this.completedLetters.push({
            letter: letter,
            accuracy: this.currentAccuracy
        });

        // Update feedback
        document.getElementById('feedback-text').textContent = 'Flott jobba!';

        // Show confetti
        triggerConfetti();

        // Check if pronunciation practice is enabled
        if (this.pronunciationPractice) {
            // Show pronunciation section
            document.getElementById('pronunciation-section').classList.remove('hidden');
            document.getElementById('record-btn').disabled = false;
            document.getElementById('recording-status').textContent = '';
            this.recordedAudioBlob = null;

            // Hide next button and replay recording button initially
            document.getElementById('next-letter-btn').classList.add('hidden');
            document.getElementById('replay-recording-btn').classList.add('hidden');
        } else {
            // Ensure pronunciation section is hidden
            document.getElementById('pronunciation-section').classList.add('hidden');

            // Move to next letter after delay (sounds will play when new letter loads)
            setTimeout(() => {
                this.currentLetterIndex++;
                this.loadNextLetter();
            }, 2000);
        }
    }

    async replayWord() {
        const letterInfo = this.letterData[this.currentLetter];
        if (letterInfo && letterInfo.audio && letterInfo.audio[this.currentWordIndex]) {
            const audioPath = `../${letterInfo.audio[this.currentWordIndex]}`;
            const audio = new Audio(audioPath);
            await audio.play().catch(err => console.log('Could not play word audio:', err));
        }
    }

    async toggleRecording() {
        const recordBtn = document.getElementById('record-btn');
        const recordingStatus = document.getElementById('recording-status');

        if (!this.mediaRecorder) {
            try {
                this.mediaRecorder = await initializeVoiceRecording();
            } catch (error) {
                recordingStatus.textContent = '❌ Kunne ikke få tilgang til mikrofon';
                return;
            }
        }

        if (this.mediaRecorder.state === 'recording') {
            // Stop recording
            this.recordedAudioBlob = await stopRecording(this.mediaRecorder, this.audioChunks);
            recordBtn.textContent = '🎤 Spill inn uttale';
            recordBtn.classList.remove('recording');
            recordingStatus.textContent = 'Spiller av opptak...';

            // Play back the recording
            try {
                await playAudioBlob(this.recordedAudioBlob);
                recordingStatus.textContent = '✅ Opptaket er ferdig!';

                // Show next button and replay recording button
                document.getElementById('next-letter-btn').classList.remove('hidden');
                document.getElementById('replay-recording-btn').classList.remove('hidden');
            } catch (error) {
                recordingStatus.textContent = '❌ Kunne ikke spille av opptak';
            }
        } else {
            // Start recording
            recordingStatus.textContent = '🔴 Spiller inn...';
            recordBtn.textContent = '⏹️ Stopp opptak';
            recordBtn.classList.add('recording');
            await startRecording(this.mediaRecorder, this.audioChunks);
        }
    }

    async replayRecording() {
        if (!this.recordedAudioBlob) {
            return;
        }

        const recordingStatus = document.getElementById('recording-status');
        recordingStatus.textContent = 'Spiller av opptak...';

        try {
            await playAudioBlob(this.recordedAudioBlob);
            recordingStatus.textContent = '✅ Opptaket er ferdig!';
        } catch (error) {
            recordingStatus.textContent = '❌ Kunne ikke spille av opptak';
        }
    }

    proceedToNextLetter() {
        // Hide pronunciation section
        document.getElementById('pronunciation-section').classList.add('hidden');

        // Move to next letter
        this.currentLetterIndex++;
        this.loadNextLetter();
    }

    showSetupScreen() {
        this.setupScreen.classList.remove('hidden');
        this.gameScreen.classList.add('hidden');
        this.completionScreen.classList.add('hidden');
    }

    showGameScreen() {
        this.setupScreen.classList.add('hidden');
        this.gameScreen.classList.remove('hidden');
        this.completionScreen.classList.add('hidden');
    }

    showCompletionScreen() {
        this.gameScreen.classList.add('hidden');
        this.completionScreen.classList.remove('hidden');

        // Calculate average accuracy
        const avgAccuracy = this.completedLetters.length > 0
            ? this.completedLetters.reduce((sum, l) => sum + l.accuracy, 0) / this.completedLetters.length
            : 0;

        document.getElementById('final-stats').innerHTML = `
            <h2>Bokstaver øvd: ${this.completedLetters.length}</h2>
            <p>Gjennomsnittlig nøyaktighet: ${Math.round(avgAccuracy)}%</p>
            <div style="margin-top: 1rem;">
                ${avgAccuracy >= 80 ? '⭐⭐⭐ Utmerket!' : avgAccuracy >= 60 ? '⭐⭐ Bra jobba!' : '⭐ Fortsett å øve!'}
            </div>
        `;

        triggerConfetti();
        playGameOverSound();
    }

    initializeLetterPaths() {
        // Simplified letter paths (normalized to 0-100 coordinate system)
        // Each letter is an array of strokes, each stroke is an array of points
        return {
            'A': [
                [
                    { x: 30, y: 80 },
                    { x: 50, y: 20 },
                    { x: 70, y: 80 }
                ],
                [
                    { x: 35, y: 60 },
                    { x: 65, y: 60 }
                ]
            ],
            'B': [
                [
                    { x: 25, y: 20 },
                    { x: 25, y: 80 }
                ],
                [
                    { x: 25, y: 20 },
                    { x: 60, y: 20 },
                    { x: 70, y: 30 },
                    { x: 70, y: 45 },
                    { x: 60, y: 50 },
                    { x: 25, y: 50 }
                ],
                [
                    { x: 25, y: 50 },
                    { x: 65, y: 50 },
                    { x: 75, y: 60 },
                    { x: 75, y: 75 },
                    { x: 65, y: 80 },
                    { x: 25, y: 80 }
                ]
            ],
            'C': [
                [
                    { x: 70, y: 30 },
                    { x: 60, y: 20 },
                    { x: 40, y: 20 },
                    { x: 30, y: 30 },
                    { x: 30, y: 70 },
                    { x: 40, y: 80 },
                    { x: 60, y: 80 },
                    { x: 70, y: 70 }
                ]
            ],
            'D': [
                [
                    { x: 25, y: 20 },
                    { x: 25, y: 80 }
                ],
                [
                    { x: 25, y: 20 },
                    { x: 55, y: 20 },
                    { x: 70, y: 30 },
                    { x: 70, y: 70 },
                    { x: 55, y: 80 },
                    { x: 25, y: 80 }
                ]
            ],
            'E': [
                [
                    { x: 70, y: 20 },
                    { x: 25, y: 20 },
                    { x: 25, y: 50 },
                    { x: 60, y: 50 },
                    { x: 25, y: 50 },
                    { x: 25, y: 80 },
                    { x: 70, y: 80 }
                ]
            ],
            'F': [
                [
                    { x: 70, y: 20 },
                    { x: 25, y: 20 },
                    { x: 25, y: 50 },
                    { x: 60, y: 50 },
                    { x: 25, y: 50 },
                    { x: 25, y: 80 }
                ]
            ],
            'G': [
                [
                    { x: 70, y: 30 },
                    { x: 60, y: 20 },
                    { x: 40, y: 20 },
                    { x: 30, y: 30 },
                    { x: 30, y: 70 },
                    { x: 40, y: 80 },
                    { x: 60, y: 80 },
                    { x: 70, y: 70 },
                    { x: 70, y: 50 },
                    { x: 50, y: 50 }
                ]
            ],
            'H': [
                [
                    { x: 25, y: 20 },
                    { x: 25, y: 80 }
                ],
                [
                    { x: 25, y: 50 },
                    { x: 75, y: 50 }
                ],
                [
                    { x: 75, y: 20 },
                    { x: 75, y: 80 }
                ]
            ],
            'I': [
                [
                    { x: 50, y: 20 },
                    { x: 50, y: 80 }
                ]
            ],
            'J': [
                [
                    { x: 60, y: 20 },
                    { x: 60, y: 70 },
                    { x: 50, y: 80 },
                    { x: 35, y: 80 },
                    { x: 25, y: 70 }
                ]
            ],
            'K': [
                [
                    { x: 25, y: 20 },
                    { x: 25, y: 80 }
                ],
                [
                    { x: 70, y: 20 },
                    { x: 25, y: 50 },
                    { x: 70, y: 80 }
                ]
            ],
            'L': [
                [
                    { x: 25, y: 20 },
                    { x: 25, y: 80 },
                    { x: 70, y: 80 }
                ]
            ],
            'M': [
                [
                    { x: 20, y: 80 },
                    { x: 20, y: 20 },
                    { x: 50, y: 50 },
                    { x: 80, y: 20 },
                    { x: 80, y: 80 }
                ]
            ],
            'N': [
                [
                    { x: 25, y: 80 },
                    { x: 25, y: 20 },
                    { x: 75, y: 80 },
                    { x: 75, y: 20 }
                ]
            ],
            'O': [
                [
                    { x: 50, y: 20 },
                    { x: 35, y: 25 },
                    { x: 25, y: 40 },
                    { x: 25, y: 60 },
                    { x: 35, y: 75 },
                    { x: 50, y: 80 },
                    { x: 65, y: 75 },
                    { x: 75, y: 60 },
                    { x: 75, y: 40 },
                    { x: 65, y: 25 },
                    { x: 50, y: 20 }
                ]
            ],
            'P': [
                [
                    { x: 25, y: 80 },
                    { x: 25, y: 20 },
                    { x: 60, y: 20 },
                    { x: 70, y: 30 },
                    { x: 70, y: 45 },
                    { x: 60, y: 50 },
                    { x: 25, y: 50 }
                ]
            ],
            'Q': [
                [
                    { x: 50, y: 20 },
                    { x: 35, y: 25 },
                    { x: 25, y: 40 },
                    { x: 25, y: 60 },
                    { x: 35, y: 75 },
                    { x: 50, y: 80 },
                    { x: 65, y: 75 },
                    { x: 75, y: 60 },
                    { x: 75, y: 40 },
                    { x: 65, y: 25 },
                    { x: 50, y: 20 }
                ],
                [
                    { x: 60, y: 65 },
                    { x: 80, y: 85 }
                ]
            ],
            'R': [
                [
                    { x: 25, y: 80 },
                    { x: 25, y: 20 },
                    { x: 60, y: 20 },
                    { x: 70, y: 30 },
                    { x: 70, y: 45 },
                    { x: 60, y: 50 },
                    { x: 25, y: 50 }
                ],
                [
                    { x: 50, y: 50 },
                    { x: 75, y: 80 }
                ]
            ],
            'S': [
                [
                    { x: 70, y: 30 },
                    { x: 60, y: 20 },
                    { x: 40, y: 20 },
                    { x: 30, y: 30 },
                    { x: 40, y: 40 },
                    { x: 60, y: 45 },
                    { x: 70, y: 55 },
                    { x: 70, y: 70 },
                    { x: 60, y: 80 },
                    { x: 40, y: 80 },
                    { x: 30, y: 70 }
                ]
            ],
            'T': [
                [
                    { x: 20, y: 20 },
                    { x: 80, y: 20 }
                ],
                [
                    { x: 50, y: 20 },
                    { x: 50, y: 80 }
                ]
            ],
            'U': [
                [
                    { x: 25, y: 20 },
                    { x: 25, y: 65 },
                    { x: 35, y: 80 },
                    { x: 65, y: 80 },
                    { x: 75, y: 65 },
                    { x: 75, y: 20 }
                ]
            ],
            'V': [
                [
                    { x: 25, y: 20 },
                    { x: 50, y: 80 },
                    { x: 75, y: 20 }
                ]
            ],
            'W': [
                [
                    { x: 20, y: 20 },
                    { x: 30, y: 80 },
                    { x: 50, y: 50 },
                    { x: 70, y: 80 },
                    { x: 80, y: 20 }
                ]
            ],
            'X': [
                [
                    { x: 25, y: 20 },
                    { x: 75, y: 80 }
                ],
                [
                    { x: 75, y: 20 },
                    { x: 25, y: 80 }
                ]
            ],
            'Y': [
                [
                    { x: 25, y: 20 },
                    { x: 50, y: 50 }
                ],
                [
                    { x: 75, y: 20 },
                    { x: 50, y: 50 },
                    { x: 50, y: 80 }
                ]
            ],
            'Z': [
                [
                    { x: 25, y: 20 },
                    { x: 75, y: 20 },
                    { x: 25, y: 80 },
                    { x: 75, y: 80 }
                ]
            ],
            'Æ': [
                [
                    // Left leg of A going up
                    { x: 20, y: 80 },
                    { x: 50, y: 20 }
                ],
                [
                    // Shared vertical stroke (right leg of A / left of E)
                    { x: 50, y: 20 },
                    { x: 50, y: 80 }
                ],
                [
                    // Crossbar of A
                    { x: 30, y: 55 },
                    { x: 50, y: 55 }
                ],
                [
                    // Top bar of E
                    { x: 50, y: 20 },
                    { x: 80, y: 20 }
                ],
                [
                    // Middle bar of E
                    { x: 50, y: 50 },
                    { x: 75, y: 50 }
                ],
                [
                    // Bottom bar of E
                    { x: 50, y: 80 },
                    { x: 80, y: 80 }
                ]
            ],
            'Ø': [
                [
                    { x: 50, y: 20 },
                    { x: 35, y: 25 },
                    { x: 25, y: 40 },
                    { x: 25, y: 60 },
                    { x: 35, y: 75 },
                    { x: 50, y: 80 },
                    { x: 65, y: 75 },
                    { x: 75, y: 60 },
                    { x: 75, y: 40 },
                    { x: 65, y: 25 },
                    { x: 50, y: 20 }
                ],
                [
                    { x: 25, y: 85 },
                    { x: 75, y: 15 }
                ]
            ],
            'Å': [
                [
                    { x: 30, y: 80 },
                    { x: 50, y: 30 },
                    { x: 70, y: 80 }
                ],
                [
                    { x: 35, y: 60 },
                    { x: 65, y: 60 }
                ],
                [
                    { x: 50, y: 10 },
                    { x: 45, y: 15 },
                    { x: 45, y: 20 },
                    { x: 50, y: 23 },
                    { x: 55, y: 20 },
                    { x: 55, y: 15 },
                    { x: 50, y: 10 }
                ]
            ]
        };
    }
}

// Initialize the game when the page loads
let game;
window.addEventListener('DOMContentLoaded', () => {
    game = new LetterTraceGame();
});
