/**
 * Pronunciation Practice Game
 * Uses Web Speech API to evaluate Norwegian word pronunciation
 */

class PronunciationGame {
    constructor() {
        // DOM elements
        this.startScreen = document.getElementById('startScreen');
        this.gameScreen = document.getElementById('gameScreen');
        this.wordImage = document.getElementById('wordImage');
        this.wordText = document.getElementById('wordText');
        this.statusMessage = document.getElementById('statusMessage');
        this.transcriptionDisplay = document.getElementById('transcriptionDisplay');
        this.attemptsCounter = document.getElementById('attemptsCounter');
        this.recordBtn = document.getElementById('recordBtn');
        this.playWordBtn = document.getElementById('playWordBtn');
        this.giveUpBtn = document.getElementById('giveUpBtn');
        this.nextBtn = document.getElementById('nextBtn');

        // Game data
        this.letterData = null;
        this.selectedLetters = new Set();
        this.letterSelection = null;
        this.availableWords = [];
        this.currentWordData = null;

        // Words to exclude from the game (problematic for speech recognition)
        this.excludedWords = [
            // Words with L-sounds (often misheard)
            'BALL',

            'FOTBALL', 'JUL', 'NULL', 'MELK', 'ØL', 'ÅL', // MIGHT BE AN ISSUE - NEED TO TEST

            // English/foreign borrowed words (speech recognition defaults to English)
            'COWBOY', 'CAFE', 'COLA', 'CAMPING',
            'PIZZA', 'JUICE',
            'WIFI', 'WEBSIDER', 'KEYBOARD', 'ROBOT',

            // Q words (all foreign origin)
            'QUIZ', 'QUESADILLA', 'QUICKSTEP', 'QATAR',

            // W words (English/tech terms)
            'WOK', 'WC',

            // X words (all English)
            'XRAY', 'XYLOFON', 'XBOX', 'XMEN',

            // Y words (all English)
            'YOGA', 'YACHT', 'YAK', 'YOGURT',

            // Z words (all English)
            'ZEBRA', 'ZOO', 'ZOMBIE', 'ZOOM',

            // Very short words (2 letters - hard to recognize)
            'UR', 'IS', 'ØY', 'ÅR'
        ];

        // Game state
        this.attempts = 0;
        this.maxAttempts = 5;
        this.isRecording = false;
        this.mediaRecorder = null;
        this.audioChunks = [];
        this.recordingTimeout = null;

        // Speech recognition
        this.recognition = null;
        this.recognitionResultReceived = false;

        this.initializeGame();
    }

    /**
     * Initialize game
     */
    async initializeGame() {
        await this.loadLetterData();
        await this.initializeVoiceRecording();
        this.initializeSpeechRecognition();
        this.initializeLetterSelection();
        this.setupEventListeners();
        this.showStartScreen();
    }

    /**
     * Load letter data from JSON
     */
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

    /**
     * Initialize voice recording
     */
    async initializeVoiceRecording() {
        try {
            this.mediaRecorder = await initializeVoiceRecording();
        } catch (error) {
            console.error('Failed to initialize microphone:', error);
            this.showStatus('Kunne ikke få tilgang til mikrofonen. Sjekk tillatelser.', 'error');
            this.recordBtn.disabled = true;
        }
    }

    /**
     * Initialize Web Speech API for Norwegian
     */
    initializeSpeechRecognition() {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

        if (!SpeechRecognition) {
            this.showStatus('Beklager, tale-gjenkjenning er ikke støttet i denne nettleseren.', 'error');
            this.recordBtn.disabled = true;
            return;
        }

        console.log('Browser language:', navigator.language);
        console.log('Browser languages:', navigator.languages);

        this.recognition = new SpeechRecognition();
        this.recognition.lang = 'nb-NO'; // Norwegian Bokmål
        this.recognition.continuous = true; // Changed to true to better capture short words
        this.recognition.interimResults = true; // Changed to true to show what's being heard
        this.recognition.maxAlternatives = 5;

        this.recognitionResultReceived = false;

        this.recognition.onstart = () => {
            this.recognitionResultReceived = false;
            // Log the language being used
            console.log('Speech recognition started with language:', this.recognition.lang);

            // Verify Norwegian is being used
            if (this.recognition.lang !== 'nb-NO') {
                console.warn('WARNING: Speech recognition is not using Norwegian! Using:', this.recognition.lang);
                this.showStatus('Advarsel: Talegjenkjenning er kanskje ikke på norsk', 'error');
            }
        };

        this.recognition.onresult = (event) => {
            // Check if we got a final result
            const lastResult = event.results[event.results.length - 1];

            if (lastResult.isFinal) {
                this.recognitionResultReceived = true;
                this.handleRecognitionResult(event);
            } else {
                // Show interim results for feedback
                const interimTranscript = lastResult[0].transcript.toUpperCase().trim();
                if (interimTranscript) {
                    this.transcriptionDisplay.textContent = `Hører: "${interimTranscript}"...`;
                }
            }
        };

        this.recognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);

            // Clear timeout
            if (this.recordingTimeout) {
                clearTimeout(this.recordingTimeout);
                this.recordingTimeout = null;
            }

            if (event.error === 'no-speech') {
                this.showStatus('Ingen tale oppdaget. Prøv igjen!', 'error');
            } else if (event.error === 'aborted') {
                // User stopped recording manually, this is ok
                if (!this.recognitionResultReceived) {
                    this.showStatus('Opptak stoppet. Ingen tale oppdaget.', 'info');
                }
            } else {
                this.showStatus('Kunne ikke gjenkjenne tale. Prøv igjen!', 'error');
            }

            this.isRecording = false;
            this.recordBtn.disabled = false;

            // Make sure media recorder is stopped
            try {
                if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
                    this.mediaRecorder.stop();
                }
            } catch (e) {
                console.log('MediaRecorder already stopped:', e);
            }
        };

        this.recognition.onend = () => {
            // Clear timeout
            if (this.recordingTimeout) {
                clearTimeout(this.recordingTimeout);
                this.recordingTimeout = null;
            }

            // If we ended without getting a result and no error was reported
            if (!this.recognitionResultReceived && this.isRecording) {
                this.showStatus('Ingen tale oppdaget. Prøv igjen!', 'info');
                this.transcriptionDisplay.textContent = 'Ingen tale gjenkjent';
            }

            this.isRecording = false;
            this.recordBtn.disabled = false;

            // Make sure media recorder is stopped
            try {
                if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
                    this.mediaRecorder.stop();
                }
            } catch (e) {
                console.log('MediaRecorder already stopped:', e);
            }
        };
    }

    /**
     * Initialize letter selection
     */
    initializeLetterSelection() {
        this.letterSelection = new LetterSelection(
            'letter-selection',
            Object.keys(this.letterData)
        );
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        document.getElementById('start-game-btn').addEventListener('click', () => {
            if (!this.letterSelection.isValidSelection()) {
                alert(this.letterSelection.getValidationMessage());
                return;
            }
            this.selectedLetters = new Set(this.letterSelection.getSelectedLetters());
            this.startGame();
        });

        this.recordBtn.addEventListener('click', () => this.toggleRecording());
        this.playWordBtn.addEventListener('click', () => this.playWordAudio());
        this.giveUpBtn.addEventListener('click', () => this.giveUp());
        this.nextBtn.addEventListener('click', () => this.nextWord());
    }

    /**
     * Show start screen
     */
    showStartScreen() {
        this.startScreen.style.display = 'block';
        this.gameScreen.style.display = 'none';
    }

    /**
     * Show game screen
     */
    showGameScreen() {
        this.startScreen.style.display = 'none';
        this.gameScreen.style.display = 'block';
    }

    /**
     * Start game
     */
    startGame() {
        this.showGameScreen();
        this.buildAvailableWords();
        this.nextWord();
    }

    /**
     * Build list of available words from selected letters
     */
    buildAvailableWords() {
        this.availableWords = [];

        for (const letter of this.selectedLetters) {
            const letterInfo = this.letterData[letter];
            if (letterInfo && letterInfo.words) {
                for (let i = 0; i < letterInfo.words.length; i++) {
                    const word = letterInfo.words[i].toUpperCase();

                    // Skip excluded words
                    if (this.excludedWords.includes(word)) {
                        console.log(`Skipping excluded word: ${word}`);
                        continue;
                    }

                    this.availableWords.push({
                        letter: letter,
                        word: letterInfo.words[i],
                        image: letterInfo.images[i],
                        audio: letterInfo.audio[i]
                    });
                }
            }
        }

        console.log(`Built word list with ${this.availableWords.length} words (excluded: ${this.excludedWords.join(', ')})`);

        // Shuffle the words
        this.shuffleArray(this.availableWords);
    }

    /**
     * Shuffle array in place
     */
    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }

    /**
     * Load next word
     */
    async nextWord() {
        if (this.availableWords.length === 0) {
            this.showStatus('Gratulerer! Du har øvd på alle ordene!', 'success');
            triggerConfetti();
            this.recordBtn.disabled = true;
            this.playWordBtn.disabled = true;
            this.nextBtn.style.display = 'none';
            return;
        }

        // Pick a random word
        const randomIndex = Math.floor(Math.random() * this.availableWords.length);
        this.currentWordData = this.availableWords[randomIndex];

        // Remove this word from the list
        this.availableWords.splice(randomIndex, 1);

        this.attempts = 0;

        // Display word and image
        this.wordText.textContent = this.currentWordData.word.toUpperCase();
        this.displayImage(this.currentWordData.image);

        this.transcriptionDisplay.textContent = '';

        // Provide helpful tip for very short words
        const isShortWord = this.currentWordData.word.length <= 2;
        if (isShortWord) {
            this.showStatus('Lytter til ordet... Tips: Dra ut ordet litt når du sier det', 'info');
        } else {
            this.showStatus('Lytter til ordet...', 'info');
        }

        this.updateAttemptsCounter();
        this.nextBtn.style.display = 'none';
        this.giveUpBtn.style.display = 'none';
        this.recordBtn.disabled = true;
        this.playWordBtn.disabled = true;

        // Play word audio before allowing recording
        await this.playWordAudio();

        this.recordBtn.disabled = false;
        this.playWordBtn.disabled = false;

        // Update status based on word length
        if (isShortWord) {
            this.showStatus('Trykk på opptaksknappen og si ordet. Tips: Dra ut ordet litt', 'info');
        } else {
            this.showStatus('Trykk på opptaksknappen og si ordet', 'info');
        }
    }

    /**
     * Display word image
     */
    displayImage(imageSource) {
        this.wordImage.innerHTML = '';

        // Check if it's an emoji or image path
        if (imageSource.startsWith('images/') || imageSource.endsWith('.jpg') || imageSource.endsWith('.png')) {
            // It's an image file
            const img = document.createElement('img');
            img.src = `../${imageSource}`;
            img.alt = this.currentWordData.word;
            img.className = 'word-image';
            this.wordImage.appendChild(img);
        } else {
            // It's an emoji
            this.wordImage.textContent = imageSource;
        }
    }

    /**
     * Play word audio
     */
    async playWordAudio() {
        try {
            const audio = new Audio(`../${this.currentWordData.audio}`);
            await audio.play();

            // Wait for audio to finish
            await new Promise(resolve => {
                audio.onended = resolve;
            });
        } catch (error) {
            console.error('Could not play word audio:', error);
        }
    }

    /**
     * Start recording (button handler)
     */
    async toggleRecording() {
        // Prevent double-clicks or starting while already recording
        if (this.recordBtn.disabled || this.isRecording) {
            return;
        }

        await this.startRecording();
    }

    /**
     * Start recording audio and speech recognition
     */
    async startRecording() {
        try {
            this.isRecording = true;
            this.recordBtn.disabled = true;
            this.showStatus('🎤 Lytter... Si ordet nå!', 'info');
            this.transcriptionDisplay.textContent = '';

            // Start audio recording (don't await - just start it)
            this.audioChunks = [];
            this.mediaRecorder.ondataavailable = (event) => {
                this.audioChunks.push(event.data);
            };
            this.mediaRecorder.start();

            // Set timeout to auto-stop after 10 seconds
            this.recordingTimeout = setTimeout(() => {
                if (this.isRecording) {
                    console.log('Recording timeout - auto stopping');
                    this.stopRecording();
                }
            }, 10000);

            // Start speech recognition
            this.recognition.start();

        } catch (error) {
            console.error('Failed to start recording:', error);
            this.showStatus('Kunne ikke starte opptak. Prøv igjen!', 'error');
            this.isRecording = false;
            this.recordBtn.disabled = false;
            if (this.recordingTimeout) {
                clearTimeout(this.recordingTimeout);
                this.recordingTimeout = null;
            }
        }
    }

    /**
     * Stop recording
     */
    async stopRecording() {
        try {
            // Clear timeout
            if (this.recordingTimeout) {
                clearTimeout(this.recordingTimeout);
                this.recordingTimeout = null;
            }

            // Force update UI immediately
            this.isRecording = false;
            this.recordBtn.disabled = false;

            // Stop speech recognition
            try {
                if (this.recognition) {
                    this.recognition.stop();
                }
            } catch (e) {
                console.log('Recognition already stopped:', e);
            }

            // Stop media recorder
            try {
                if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
                    this.mediaRecorder.stop();
                }
            } catch (e) {
                console.log('MediaRecorder already stopped:', e);
            }

        } catch (error) {
            console.error('Failed to stop recording:', error);
            this.isRecording = false;
            this.recordBtn.disabled = false;
        }
    }

    /**
     * Handle speech recognition result
     */
    handleRecognitionResult(event) {
        // Get the last final result
        let finalResult = null;
        for (let i = event.results.length - 1; i >= 0; i--) {
            if (event.results[i].isFinal) {
                finalResult = event.results[i];
                break;
            }
        }

        if (!finalResult) {
            return; // No final result yet
        }

        let transcriptions = [];

        // Collect all alternatives with their confidence scores
        for (let i = 0; i < finalResult.length; i++) {
            transcriptions.push({
                text: finalResult[i].transcript.toUpperCase().trim(),
                confidence: finalResult[i].confidence
            });
        }

        console.log('Recognized alternatives:', transcriptions);

        // Display first transcription with all alternatives
        if (transcriptions.length > 0) {
            const allAlternatives = transcriptions.map(t => t.text).join(', ');
            this.transcriptionDisplay.textContent = `Du sa: "${transcriptions[0].text}"${transcriptions.length > 1 ? ` (alternativer: ${allAlternatives})` : ''}`;
        }

        // Only check the FIRST (most confident) transcription
        const spokenWord = transcriptions[0].text;
        const isCorrect = this.compareWords(spokenWord, this.currentWordData.word.toUpperCase());

        this.attempts++;
        this.updateAttemptsCounter();

        // Stop recording after we got a result
        this.stopRecording();

        if (isCorrect) {
            this.handleCorrectPronunciation();
        } else {
            this.handleIncorrectPronunciation();
        }
    }

    /**
     * Compare words for exact match (strict pronunciation checking)
     */
    compareWords(spoken, target) {
        // Normalize numbers - convert digits to Norwegian words
        const numberMap = {
            '0': 'NULL',
            '1': 'EN',
            '2': 'TO',
            '3': 'TRE',
            '4': 'FIRE',
            '5': 'FEM',
            '6': 'SEKS',
            '7': 'SJU',
            '8': 'ÅTTE',
            '9': 'NI',
            '10': 'TI'
        };

        let normalizedSpoken = spoken;
        // Replace any digit with its Norwegian word equivalent
        for (const [digit, word] of Object.entries(numberMap)) {
            normalizedSpoken = normalizedSpoken.replace(new RegExp('\\b' + digit + '\\b', 'g'), word);
        }

        console.log(`Comparing spoken "${normalizedSpoken}" to target "${target}"`);

        // Exact match
        if (normalizedSpoken === target || spoken === target) {
            console.log('✓ Exact match!');
            return true;
        }

        // Remove common filler words and check again
        const cleaned = normalizedSpoken.replace(/^(OG|ET|EN|EI|DET|DEN)\s+/i, '').trim();
        if (cleaned === target) {
            console.log('✓ Match after removing filler words!');
            return true;
        }

        // Check if spoken contains target as a word
        const words = normalizedSpoken.split(/\s+/);
        if (words.includes(target)) {
            console.log('✓ Found target word in phrase!');
            return true;
        }

        console.log('✗ No match');
        return false;
    }

    /**
     * Handle correct pronunciation
     */
    handleCorrectPronunciation() {
        this.showStatus('🎉 Riktig! Bra jobbet!', 'success');
        triggerConfetti();
        this.recordBtn.disabled = true;
        this.playWordBtn.disabled = true;
        this.giveUpBtn.style.display = 'none';
        this.nextBtn.style.display = 'inline-block';
    }

    /**
     * Handle incorrect pronunciation
     */
    handleIncorrectPronunciation() {
        if (this.attempts >= this.maxAttempts) {
            this.showStatus(`Du har brukt alle ${this.maxAttempts} forsøkene. Prøv igjen eller gi opp.`, 'error');
            this.recordBtn.disabled = true;
            this.giveUpBtn.style.display = 'inline-block';
        } else {
            const remaining = this.maxAttempts - this.attempts;
            this.showStatus(`Feil. Prøv igjen! (${remaining} forsøk igjen)`, 'error');
            this.giveUpBtn.style.display = this.attempts >= 3 ? 'inline-block' : 'none';
        }
    }

    /**
     * Give up on current word
     */
    giveUp() {
        this.showStatus('Ikke gi opp! Her er neste ord.', 'info');
        this.nextWord();
    }

    /**
     * Update attempts counter display
     */
    updateAttemptsCounter() {
        if (this.attempts === 0) {
            this.attemptsCounter.textContent = '';
        } else {
            this.attemptsCounter.textContent = `Forsøk: ${this.attempts}/${this.maxAttempts}`;
        }
    }

    /**
     * Show status message with styling
     */
    showStatus(message, type = 'info') {
        this.statusMessage.textContent = message;
        this.statusMessage.className = `status-message ${type}`;
    }
}

// Initialize game when page loads
document.addEventListener('DOMContentLoaded', () => {
    new PronunciationGame();
});
