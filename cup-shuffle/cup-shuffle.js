class CupShuffleGame {
    constructor() {
        // Game state
        this.isPlaying = false;
        this.selectedLetters = [];
        this.letterData = null;
        this.totalRounds = 5;
        this.currentRound = 0;
        this.score = 0;

        // Current round data
        this.currentWord = null;
        this.currentWordData = null;
        this.cupData = [{}, {}, {}]; // Store data for each cup position
        this.wrongCups = [];
        this.usedWords = new Set(); // Track used words to avoid repetition
        this.lastTargetWord = null; // Track the previous round's word

        // Recording
        this.mediaRecorder = null;
        this.audioChunks = [];
        this.recordedAudio = null;
        this.currentRecordingAudio = null; // Store the original word audio for playback

        // Initialize
        this.init();
    }

    async init() {
        await this.loadLetterData();
        await this.loadSettingsModal();
        this.setupEventListeners();
        this.initializeLetterSelection();
    }

    async loadLetterData() {
        try {
            const response = await fetch('../letter-images.json');
            this.letterData = await response.json();
            console.log('Letter data loaded successfully');
        } catch (error) {
            console.error('Error loading letter data:', error);
            alert('Kunne ikke laste bokstavdata. Vennligst last inn siden på nytt.');
        }
    }

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

    setupEventListeners() {
        // Setup screen
        document.getElementById('start-game-btn')?.addEventListener('click', () => this.startGame());
        document.getElementById('back-btn')?.addEventListener('click', () => this.goBack());

        // Game screen - cups
        const cupWrappers = document.querySelectorAll('.cup-wrapper');
        cupWrappers.forEach((wrapper, index) => {
            wrapper.addEventListener('click', () => this.handleCupClick(index));
        });

        // Recording controls
        document.getElementById('record-btn')?.addEventListener('click', () => this.startRecording());
        document.getElementById('stop-record-btn')?.addEventListener('click', () => this.stopRecording());
        document.getElementById('play-recording-btn')?.addEventListener('click', () => this.playRecording());
        document.getElementById('next-round-btn')?.addEventListener('click', () => this.nextRound());

        // Victory screen
        document.getElementById('play-again-btn')?.addEventListener('click', () => this.playAgain());
        document.getElementById('main-menu-btn')?.addEventListener('click', () => this.goToMainMenu());
    }

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

        settingsBtn?.addEventListener('click', () => {
            modal?.classList.remove('hidden');
            overlay?.classList.remove('hidden');
        });

        closeBtn?.addEventListener('click', closeModal);
        overlay?.addEventListener('click', closeModal);
        restartBtn?.addEventListener('click', () => {
            closeModal();
            this.restartGame();
        });
    }

    initializeLetterSelection() {
        this.letterSelection = new LetterSelection({
            containerSelector: '#letter-selection',
            selectAllBtnSelector: '#select-all-btn',
            selectNoneBtnSelector: '#select-none-btn',
            minSelections: 1,
            defaultSelections: 5,
            onSelectionChange: (selectedLetters) => {
                this.selectedLetters = selectedLetters;
            }
        });

        this.selectedLetters = this.letterSelection.getSelectedLetters();
    }

    startGame() {
        if (this.selectedLetters.length < 1) {
            alert('Velg minst én bokstav!');
            return;
        }

        // Get selected rounds
        const roundsSelect = document.getElementById('rounds-select');
        this.totalRounds = parseInt(roundsSelect.value);

        // Reset game state
        this.currentRound = 0;
        this.score = 0;
        this.isPlaying = true;
        this.usedWords = new Set();
        this.lastTargetWord = null;

        // Switch screens
        document.getElementById('setup-screen').classList.add('hidden');
        document.getElementById('game-screen').classList.remove('hidden');

        // Start first round
        this.startNewRound();
    }

    async startNewRound() {
        this.currentRound++;
        this.wrongCups = [];

        // Update UI
        document.getElementById('round-counter').textContent = `Runde: ${this.currentRound}/${this.totalRounds}`;
        document.getElementById('score-counter').textContent = `Poeng: ${this.score}`;

        // Reset cup data
        this.cupData = [{}, {}, {}];
        this.wrongCups = [];

        const cupWrappers = document.querySelectorAll('.cup-wrapper');
        cupWrappers.forEach((wrapper, index) => {
            wrapper.classList.remove('lifted', 'correct', 'wrong', 'showing-word', 'target-cup');
            wrapper.style.animation = 'none';
            wrapper.style.transform = 'translateX(0)';
            wrapper.style.pointerEvents = 'none';

            // Reset floating images
            const floatingImage = document.getElementById(`floating-image-${index}`);
            floatingImage.className = 'floating-image';
            floatingImage.innerHTML = '';
            floatingImage.style.filter = '';
            floatingImage.style.transform = '';

            // Reset revealed images
            const revealedImage = document.getElementById(`revealed-image-${index}`);
            revealedImage.innerHTML = '';
        });

        // Show word presentation
        document.getElementById('word-presentation').classList.remove('hidden');
        document.getElementById('cups-area').classList.add('hidden');
        document.getElementById('recording-area').classList.add('hidden');

        // Pick random words
        const wordSelection = await this.pickRandomWords();
        if (!wordSelection) {
            console.error('Failed to pick random words');
            alert('Kunne ikke velge ord. Vennligst start spillet på nytt.');
            this.restartGame();
            return;
        }

        const { targetWord, decoyWords } = wordSelection;
        this.currentWord = targetWord.word;
        this.currentWordData = targetWord;

        // Show word and image
        const wordImageContainer = document.querySelector('.word-image-container');
        const wordImage = document.getElementById('word-image');
        const wordText = document.getElementById('word-text');

        if (targetWord.image.startsWith('images/')) {
            // Real image - show img element
            wordImage.src = `../${targetWord.image}`;
            wordImage.style.display = 'block';
            wordImage.alt = targetWord.word;
            // Clear any emoji div
            const emojiDiv = wordImageContainer.querySelector('.emoji-display');
            if (emojiDiv) emojiDiv.remove();
        } else {
            // Emoji - hide img and show emoji div
            wordImage.style.display = 'none';
            // Remove old emoji div if exists
            let emojiDiv = wordImageContainer.querySelector('.emoji-display');
            if (!emojiDiv) {
                emojiDiv = document.createElement('div');
                emojiDiv.className = 'emoji-display';
                emojiDiv.style.fontSize = '200px';
                emojiDiv.style.lineHeight = '250px';
                wordImageContainer.appendChild(emojiDiv);
            }
            emojiDiv.textContent = targetWord.image;
        }

        wordText.textContent = targetWord.word;

        // Play word audio
        await this.playAudio(targetWord.audio);

        // Wait a moment, then hide cups under and shuffle
        await this.sleep(2000);
        await this.prepareCupsAndShuffle(targetWord, decoyWords);
    }

    async pickRandomWords() {
        // Collect all available words from all selected letters
        const allAvailableWords = [];
        const difficulty = parseInt(localStorage.getItem('wordDifficulty') || '1');

        for (const letter of this.selectedLetters) {
            const letterInfo = this.letterData[letter];
            if (!letterInfo) continue;

            for (let i = 0; i < letterInfo.words.length; i++) {
                if (letterInfo.difficulty[i] <= difficulty) {
                    const word = letterInfo.words[i];
                    // Skip already used words AND the last target word
                    if (!this.usedWords.has(word) && word !== this.lastTargetWord) {
                        allAvailableWords.push({
                            letter: letter,
                            word: word,
                            image: letterInfo.images[i],
                            audio: letterInfo.audio[i]
                        });
                    }
                }
            }
        }

        console.log(`Available words: ${allAvailableWords.length}, Used: ${this.usedWords.size}, Last: ${this.lastTargetWord}`);

        // If we've used all words, reset the used words set
        if (allAvailableWords.length < 3) {
            console.log('Resetting used words - cycling through words again');
            this.usedWords.clear();

            // Rebuild available words, but still exclude the last target word
            for (const letter of this.selectedLetters) {
                const letterInfo = this.letterData[letter];
                if (!letterInfo) continue;

                for (let i = 0; i < letterInfo.words.length; i++) {
                    if (letterInfo.difficulty[i] <= difficulty) {
                        const word = letterInfo.words[i];
                        if (word !== this.lastTargetWord) {
                            allAvailableWords.push({
                                letter: letter,
                                word: word,
                                image: letterInfo.images[i],
                                audio: letterInfo.audio[i]
                            });
                        }
                    }
                }
            }
        }

        if (allAvailableWords.length < 3) {
            console.error('Not enough words available even after reset');
            alert('Ikke nok ord tilgjengelig for valgte bokstaver og vanskelighetsgrad. Prøv å velge flere bokstaver eller endre vanskelighetsgrad.');
            return null;
        }

        // Shuffle and pick 3 unique words
        const shuffled = allAvailableWords.sort(() => Math.random() - 0.5);
        const selectedWords = shuffled.slice(0, 3);

        // Mark the target word as used and remember it
        this.usedWords.add(selectedWords[0].word);
        this.lastTargetWord = selectedWords[0].word;

        console.log(`Selected target: ${selectedWords[0].word}, decoys: ${selectedWords[1].word}, ${selectedWords[2].word}`);

        return {
            targetWord: selectedWords[0],
            decoyWords: [selectedWords[1], selectedWords[2]]
        };
    }

    async prepareCupsAndShuffle(targetWord, decoyWords) {
        // Hide word presentation
        document.getElementById('word-presentation').classList.add('hidden');
        document.getElementById('cups-area').classList.remove('hidden');

        // Randomly assign words to cups
        const allWords = [targetWord, ...decoyWords];
        const shuffledWords = allWords.sort(() => Math.random() - 0.5);

        // Store data in cupData array (this will track the actual position after shuffling)
        shuffledWords.forEach((wordData, index) => {
            this.cupData[index] = {
                word: wordData.word,
                audio: wordData.audio,
                image: wordData.image,
                isCorrect: wordData.word === targetWord.word
            };
        });

        // Find which cup has the target word
        const correctCupIndex = this.cupData.findIndex(d => d.isCorrect);

        // Set words and images in DOM (for visual display when revealed)
        const cupWrappers = document.querySelectorAll('.cup-wrapper');
        shuffledWords.forEach((wordData, index) => {
            const cupWord = document.getElementById(`cup-word-${index}`);
            cupWord.textContent = wordData.word;

            // Set the revealed image
            const revealedImage = document.getElementById(`revealed-image-${index}`);
            if (wordData.image.startsWith('images/')) {
                revealedImage.innerHTML = `<img src="../${wordData.image}" alt="${wordData.word}">`;
            } else {
                revealedImage.innerHTML = wordData.image;
            }
        });

        // Update instruction
        const instruction = document.querySelector('#cups-area .instruction-text');
        instruction.textContent = `Se hvor "${targetWord.word}" plasseres!`;

        // Only show the TARGET image floating above its cup
        await this.sleep(500);
        const targetFloatingImage = document.getElementById(`floating-image-${correctCupIndex}`);

        if (targetWord.image.startsWith('images/')) {
            targetFloatingImage.innerHTML = `<img src="../${targetWord.image}" alt="${targetWord.word}">`;
        } else {
            targetFloatingImage.innerHTML = targetWord.image;
        }

        targetFloatingImage.classList.add('show');
        targetFloatingImage.style.filter = 'drop-shadow(0 0 20px #667eea)';

        // Wait for image to appear
        await this.sleep(2000);

        // Update instruction
        instruction.textContent = `Husk å følge med på: ${targetWord.word}!`;

        // Drop target image into cup
        await this.sleep(1000);
        targetFloatingImage.classList.remove('show');
        targetFloatingImage.classList.add('drop-in');

        // Make cup react to receiving the image
        const targetWrapper = cupWrappers[correctCupIndex];
        targetWrapper.classList.add('receiving');

        // Wait for drop animation
        await this.sleep(1200);

        // Hide image inside cup and remove receiving animation
        targetFloatingImage.classList.remove('drop-in');
        targetFloatingImage.classList.add('hidden-in-cup');
        targetWrapper.classList.remove('receiving');

        // Update instruction
        instruction.textContent = 'Følg med mens koppene stokkes!';

        await this.sleep(800);

        // Start shuffling
        instruction.textContent = 'Finn riktig kopp!';
        this.shuffleCups();
    }

    async shuffleCups() {
        const cupWrappers = document.querySelectorAll('.cup-wrapper');
        const numShuffles = 3 + Math.floor(Math.random() * 3); // 3-5 shuffles

        for (let i = 0; i < numShuffles; i++) {
            await this.performShuffle();
            await this.sleep(800);
        }

        // Enable cup clicking
        cupWrappers.forEach(wrapper => {
            wrapper.style.pointerEvents = 'auto';
        });
    }

    async performShuffle() {
        // Pick two random cups to swap
        const cup1 = Math.floor(Math.random() * 3);
        let cup2 = Math.floor(Math.random() * 3);
        while (cup2 === cup1) {
            cup2 = Math.floor(Math.random() * 3);
        }

        const cupWrappers = document.querySelectorAll('.cup-wrapper');

        // Apply animations based on positions
        const diff = Math.abs(cup1 - cup2);

        if (diff === 1) {
            // Adjacent swap
            if (cup1 < cup2) {
                cupWrappers[cup1].style.animation = 'shuffle-0-to-1 0.8s ease';
                cupWrappers[cup2].style.animation = 'shuffle-1-to-0 0.8s ease';
            } else {
                cupWrappers[cup1].style.animation = 'shuffle-1-to-0 0.8s ease';
                cupWrappers[cup2].style.animation = 'shuffle-0-to-1 0.8s ease';
            }
        } else {
            // End to end swap
            if (cup1 < cup2) {
                // cup1 is on the left (0), cup2 is on the right (2)
                cupWrappers[cup1].style.animation = 'shuffle-0-to-2 0.8s ease';
                cupWrappers[cup2].style.animation = 'shuffle-2-to-0 0.8s ease';
            } else {
                // cup1 is on the right (2), cup2 is on the left (0)
                cupWrappers[cup1].style.animation = 'shuffle-2-to-0 0.8s ease';
                cupWrappers[cup2].style.animation = 'shuffle-0-to-2 0.8s ease';
            }
        }

        await this.sleep(800);

        // SWAP THE DATA in cupData array to match the visual swap
        [this.cupData[cup1], this.cupData[cup2]] = [this.cupData[cup2], this.cupData[cup1]];

        // Update DOM to reflect new data positions
        this.updateCupDOM(cup1);
        this.updateCupDOM(cup2);

        // Reset animations
        cupWrappers.forEach(wrapper => {
            wrapper.style.animation = 'none';
        });
    }

    updateCupDOM(cupIndex) {
        const data = this.cupData[cupIndex];
        if (!data || !data.word) return;

        // Update word text
        const cupWord = document.getElementById(`cup-word-${cupIndex}`);
        cupWord.textContent = data.word;

        // Update revealed image
        const revealedImage = document.getElementById(`revealed-image-${cupIndex}`);
        if (data.image.startsWith('images/')) {
            revealedImage.innerHTML = `<img src="../${data.image}" alt="${data.word}">`;
        } else {
            revealedImage.innerHTML = data.image;
        }
    }

    async handleCupClick(cupIndex) {
        const cupWrapper = document.querySelectorAll('.cup-wrapper')[cupIndex];

        // Check if already clicked
        if (cupWrapper.classList.contains('lifted')) {
            return;
        }

        // Disable clicking while processing
        document.querySelectorAll('.cup-wrapper').forEach(w => {
            w.style.pointerEvents = 'none';
        });

        // Lift cup
        cupWrapper.classList.add('lifted');

        // Get word data from cupData array (the source of truth)
        const data = this.cupData[cupIndex];
        const word = data.word;
        const audio = data.audio;
        const image = data.image;
        const isCorrect = data.isCorrect;

        // Play word audio
        await this.sleep(600);
        await this.playAudio(audio);

        // Check if correct using the data's isCorrect flag
        if (isCorrect) {
            // Correct!
            cupWrapper.classList.add('correct');
            this.score++;
            await this.sleep(1000);

            // Show recording area
            this.showRecordingArea(word, audio, image);
        } else {
            // Wrong
            cupWrapper.classList.add('wrong');
            this.wrongCups.push(cupIndex);

            await this.sleep(1000);

            // Check if all wrong cups have been tried
            if (this.wrongCups.length >= 2) {
                // Auto-reveal correct cup
                const correctCupIndex = this.cupData.findIndex(d => d.isCorrect);
                const correctWrapper = document.querySelectorAll('.cup-wrapper')[correctCupIndex];
                correctWrapper.classList.add('lifted', 'correct');

                const correctData = this.cupData[correctCupIndex];

                await this.sleep(600);
                await this.playAudio(correctData.audio);
                await this.sleep(1000);

                this.showRecordingArea(correctData.word, correctData.audio, correctData.image);
            } else {
                // Let them try again
                document.querySelectorAll('.cup-wrapper').forEach(w => {
                    if (!w.classList.contains('lifted')) {
                        w.style.pointerEvents = 'auto';
                    }
                });
            }
        }
    }

    showRecordingArea(word, audio, image) {
        // Hide cups
        document.getElementById('cups-area').classList.add('hidden');
        document.getElementById('recording-area').classList.remove('hidden');

        // Set word data
        const revealedImageContainer = document.querySelector('.revealed-word-image-container');
        const revealedImage = document.getElementById('revealed-word-image');
        const revealedText = document.getElementById('revealed-word-text');

        if (image.startsWith('images/')) {
            // Real image - show img element
            revealedImage.src = `../${image}`;
            revealedImage.style.display = 'block';
            revealedImage.alt = word;
            // Clear any emoji div
            const emojiDiv = revealedImageContainer.querySelector('.emoji-display');
            if (emojiDiv) emojiDiv.remove();
        } else {
            // Emoji - hide img and show emoji div
            revealedImage.style.display = 'none';
            // Remove old emoji div if exists
            let emojiDiv = revealedImageContainer.querySelector('.emoji-display');
            if (!emojiDiv) {
                emojiDiv = document.createElement('div');
                emojiDiv.className = 'emoji-display';
                emojiDiv.style.fontSize = '180px';
                emojiDiv.style.lineHeight = '200px';
                revealedImageContainer.appendChild(emojiDiv);
            }
            emojiDiv.textContent = image;
        }

        revealedText.textContent = word;

        // Store the word audio for playback after recording
        this.currentRecordingAudio = audio;

        // Reset recording buttons
        document.getElementById('record-btn').classList.remove('hidden');
        document.getElementById('stop-record-btn').classList.add('hidden');
        document.getElementById('play-recording-btn').classList.add('hidden');
        document.getElementById('next-round-btn').classList.add('hidden');
        document.getElementById('recording-status').textContent = '';

        this.recordedAudio = null;
    }

    async startRecording() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            this.mediaRecorder = new MediaRecorder(stream);
            this.audioChunks = [];

            this.mediaRecorder.addEventListener('dataavailable', event => {
                this.audioChunks.push(event.data);
            });

            this.mediaRecorder.addEventListener('stop', async () => {
                const audioBlob = new Blob(this.audioChunks, { type: 'audio/wav' });
                this.recordedAudio = URL.createObjectURL(audioBlob);

                document.getElementById('recording-status').textContent = 'Opptak fullført!';
                document.getElementById('play-recording-btn').classList.remove('hidden');

                // Automatically play comparison: original word first, then user's recording
                await this.playComparisonAudio();
            });

            this.mediaRecorder.start();

            document.getElementById('record-btn').classList.add('hidden');
            document.getElementById('stop-record-btn').classList.remove('hidden');
            document.getElementById('recording-status').textContent = 'Tar opp... 🎤';
        } catch (error) {
            console.error('Error starting recording:', error);
            alert('Kunne ikke starte opptak. Sørg for at mikrofonen er tilgjengelig.');
        }
    }

    stopRecording() {
        if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
            this.mediaRecorder.stop();
            this.mediaRecorder.stream.getTracks().forEach(track => track.stop());

            document.getElementById('stop-record-btn').classList.add('hidden');
            document.getElementById('record-btn').classList.remove('hidden');
        }
    }

    playRecording() {
        if (this.recordedAudio) {
            const audio = new Audio(this.recordedAudio);
            audio.play();
        }
    }

    async playComparisonAudio() {
        // Update status to show we're playing the original
        document.getElementById('recording-status').textContent = 'Spiller av originalen...';

        // Play the original word audio first
        await this.playAudio(this.currentRecordingAudio);

        // Small pause between audios
        await this.sleep(500);

        // Update status to show we're playing the user's recording
        document.getElementById('recording-status').textContent = 'Spiller av opptaket ditt...';

        // Play the user's recording
        if (this.recordedAudio) {
            await new Promise((resolve) => {
                const audio = new Audio(this.recordedAudio);
                audio.addEventListener('ended', resolve);
                audio.addEventListener('error', () => {
                    console.error('Error playing recorded audio');
                    resolve();
                });
                audio.play();
            });
        }

        // Update status and show next button
        await this.sleep(500);
        document.getElementById('recording-status').textContent = 'Flott jobbet!';
        document.getElementById('next-round-btn').classList.remove('hidden');
    }

    async nextRound() {
        if (this.currentRound >= this.totalRounds) {
            this.gameComplete();
        } else {
            this.startNewRound();
        }
    }

    async gameComplete() {
        this.isPlaying = false;

        // Show victory screen
        document.getElementById('game-screen').classList.add('hidden');
        document.getElementById('victory-screen').classList.remove('hidden');

        // Show stats
        const percentage = Math.round((this.score / this.totalRounds) * 100);
        document.getElementById('victory-stats').innerHTML = `
            <p><strong>Du fullførte ${this.totalRounds} runder!</strong></p>
            <p>Poeng: ${this.score} / ${this.totalRounds}</p>
            <p>Suksessrate: ${percentage}%</p>
        `;

        // Trigger effects
        if (typeof triggerConfetti === 'function') {
            triggerConfetti();
        }

        if (typeof playGameOverSound === 'function') {
            playGameOverSound();
        }
    }

    restartGame() {
        this.isPlaying = false;
        document.getElementById('game-screen').classList.add('hidden');
        document.getElementById('victory-screen').classList.add('hidden');
        document.getElementById('setup-screen').classList.remove('hidden');
    }

    playAgain() {
        this.restartGame();
    }

    goToMainMenu() {
        window.location.href = '../index.html';
    }

    goBack() {
        window.location.href = '../index.html';
    }

    async playAudio(audioPath) {
        return new Promise((resolve) => {
            const audio = new Audio(`../${audioPath}`);
            audio.addEventListener('ended', resolve);
            audio.addEventListener('error', () => {
                console.error('Error playing audio:', audioPath);
                resolve();
            });
            audio.play();
        });
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Initialize game when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new CupShuffleGame();
});
