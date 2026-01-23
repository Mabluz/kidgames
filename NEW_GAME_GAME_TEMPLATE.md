con# Game Template Documentation

This document provides a comprehensive template for creating new educational games in the kidgames project. Follow this guide to quickly set up a new game with all the standard features.

## Quick Start

To create a new game named "my-game", tell Claude:

> "I want to make a new game like my-game following the GAME_TEMPLATE.md instructions"

## Working Example

A complete working example game is included in the `letter-guess/` directory. This game demonstrates all the features described in this template:

- Letter selection from `letter-images.json`
- Settings modal with restart functionality
- Confetti animation on game completion
- Game-over sound effect
- Proper screen transitions (setup → game → victory)

To see it in action:
1. Open `letter-guess/letter-guess.html` in a browser
2. Select letters to practice
3. Play the game and observe how all features work together

Use this as a reference when building your own games!

## Standard Game Structure

Every game should follow this directory structure:

```
my-game/
├── my-game.html     # Main HTML file
├── my-game.css      # Game-specific styles
└── my-game.js       # Game logic
```

---

## 1. HTML Structure (`my-game.html`)

### Required Sections

```html
<!DOCTYPE html>
<html lang="no">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Game Title - Description</title>

    <!-- Game-specific styles -->
    <link rel="stylesheet" href="my-game.css">

    <!-- REQUIRED: Shared CSS files -->
    <link rel="stylesheet" href="../shared/confetti.css">
    <link rel="stylesheet" href="../shared/letter-selection.css">
    <link rel="stylesheet" href="../shared/settings-modal.css">
</head>
<body>
    <!-- Setup Screen -->
    <div id="setup-screen" class="screen">
        <div class="setup-container">
            <h1>🎮 Game Title 🎮</h1>
            <p class="game-description">Game description here</p>

            <!-- Letter Selection (if using letters) -->
            <div class="setup-section">
                <h2>Velg bokstaver:</h2>
                <div id="letter-selection" class="letter-grid"></div>
                <div class="selection-buttons">
                    <button id="select-all-btn" class="btn-secondary">Velg alle</button>
                    <button id="select-none-btn" class="btn-secondary">Velg ingen</button>
                </div>
            </div>

            <!-- Game-specific settings -->
            <div class="setup-section">
                <h2>Spillinnstillinger:</h2>
                <!-- Add your custom settings here -->
            </div>

            <div class="setup-buttons">
                <button id="start-game-btn" class="btn-primary">Start Spill!</button>
                <button id="back-btn" class="btn-secondary">Tilbake</button>
            </div>
        </div>
    </div>

    <!-- Game Screen -->
    <div id="game-screen" class="screen hidden">
        <div class="game-header">
            <!-- Settings button to open modal during game -->
            <button id="settings-btn" class="settings-btn">⚙️</button>

            <!-- Game status and info -->
            <div class="game-info">
                <!-- Add your game status here -->
            </div>
        </div>

        <div class="game-area">
            <!-- Your game content here -->
        </div>
    </div>

    <!-- Victory/Game Over Screen -->
    <div id="victory-screen" class="screen hidden">
        <div class="victory-container">
            <h1>🎉 Gratulerer! 🎉</h1>
            <div id="victory-stats">
                <!-- Game results here -->
            </div>
            <div class="victory-buttons">
                <button id="play-again-btn" class="btn-primary">Spill igjen</button>
                <button id="main-menu-btn" class="btn-secondary">Hovedmeny</button>
            </div>
        </div>
    </div>

    <!-- REQUIRED: Settings Modal (shared component) -->
    <div id="settings-modal-container"></div>

    <!-- REQUIRED: JavaScript files in this order -->
    <script src="../shared/game-effects.js"></script>
    <script src="../shared/letter-selection.js"></script>
    <script src="../shared/settings-modal.js"></script>
    <script src="../difficulty-filter.js"></script>
    <script src="my-game.js"></script>
</body>
</html>
```

---

## 2. Letter Data Integration

### Using letter-images.json

The `letter-images.json` file (located in the project root) contains:
- **words**: Array of Norwegian words starting with each letter
- **images**: Array of emoji or image paths (e.g., "images/A_AKEBRETT.jpg")
- **audio**: Array of audio file paths (e.g., "sounds/A_Ape.wav")
- **difficulty**: Array of difficulty levels (1=easy, 2=medium, 3=hard)
- **letterSound**: Path to letter pronunciation sound
- **repeatable**: Boolean indicating if letter can be repeated (vowels)
- **repeatableLetterSound**: Path to repeatable letter sound (optional)

### Loading Letter Data in JavaScript

```javascript
// Load letter data
async function loadLetterData() {
    try {
        const response = await fetch('../letter-images.json');
        const letterData = await response.json();
        return letterData;
    } catch (error) {
        console.error('Error loading letter data:', error);
        return null;
    }
}

// Example: Get a random word and image for letter 'A'
async function getLetterContent(letter) {
    const letterData = await loadLetterData();
    if (!letterData || !letterData[letter]) {
        console.error('Letter not found:', letter);
        return null;
    }

    const data = letterData[letter];
    const randomIndex = Math.floor(Math.random() * data.words.length);

    return {
        word: data.words[randomIndex],
        image: data.images[randomIndex],
        audio: data.audio[randomIndex],
        difficulty: data.difficulty[randomIndex],
        letterSound: data.letterSound
    };
}
```

---

## 3. Settings Modal Integration

### In HTML

```html
<!-- Add this container where modal should be loaded -->
<div id="settings-modal-container"></div>

<!-- Include the settings modal script -->
<script src="../shared/settings-modal.js"></script>
```

### In JavaScript

```javascript
class MyGame {
    constructor() {
        this.setupEventListeners();
        this.loadSettingsModal();
    }

    // Load the settings modal
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

    // Setup settings modal functionality
    setupSettingsModal() {
        const settingsBtn = document.getElementById('settings-btn');
        const closeBtn = document.getElementById('close-settings-btn');
        const restartBtn = document.getElementById('restart-btn');
        const overlay = document.getElementById('settings-overlay');
        const modal = document.getElementById('settings-modal');

        // Open modal
        if (settingsBtn) {
            settingsBtn.addEventListener('click', () => {
                modal.classList.remove('hidden');
                overlay.classList.remove('hidden');
            });
        }

        // Close modal
        const closeModal = () => {
            modal.classList.add('hidden');
            overlay.classList.add('hidden');
        };

        if (closeBtn) closeBtn.addEventListener('click', closeModal);
        if (overlay) overlay.addEventListener('click', closeModal);

        // Restart game
        if (restartBtn) {
            restartBtn.addEventListener('click', () => {
                closeModal();
                this.restartGame();
            });
        }
    }

    // Handle game restart
    restartGame() {
        // Reset game state
        // Hide game screen, show setup screen
        document.getElementById('game-screen').classList.add('hidden');
        document.getElementById('setup-screen').classList.remove('hidden');
    }
}
```

---

## 4. Game Effects (Confetti & Sounds)

### Available Functions from `game-effects.js`

All these functions are automatically available when you include the script:

```javascript
// 1. Trigger confetti animation
triggerConfetti();

// 2. Play game over sound (game-over.wav)
playGameOverSound();

// 3. Play a single letter sound
await playLetterSound('A');

// 4. Play multiple letters with crossfading
await playLetterSequence(['A', 'B', 'C'], 1000); // 1000ms per letter

// 5. Play all letters in a word
await playWordLetters('APPLE', 1000);

// 6. Play found letters from a word
await playFoundLetters('APPLE', ['A', 'P'], 1000);

// 7. Initialize voice recording with callbacks
const mediaRecorder = await initializeVoiceRecording({
    ondataavailable: (event) => { /* handle data */ },
    onstop: () => { /* handle stop */ }
});

// 8. Start recording (using shared utility)
await startRecording(mediaRecorder, audioChunks);

// 9. Stop recording and get audio blob (using shared utility)
const audioBlob = await stopRecording(mediaRecorder, audioChunks);
```

### Using Confetti & Game Over Sound

```javascript
// When game is completed successfully
gameComplete() {
    // Show victory screen
    document.getElementById('victory-screen').classList.remove('hidden');

    // Trigger confetti animation
    if (typeof triggerConfetti === 'function') {
        triggerConfetti();
    }

    // Play game over sound (game-over.wav in root directory)
    if (typeof playGameOverSound === 'function') {
        playGameOverSound();
    }
}
```

### Game Over Sound Location

The `game-over.wav` file is located in the **project root directory**:
```
kidgames/
├── game-over.wav           # Victory/completion sound
├── letter-images.json      # Letter data
└── my-game/
    └── my-game.html
```

The `playGameOverSound()` function in `shared/game-effects.js` automatically loads it from `../game-over.wav`.

### Voice Recording Integration

**IMPORTANT:** Always use the shared `game-effects.js` functions for voice recording to ensure Safari compatibility and avoid code duplication.

#### Basic Voice Recording Setup

```javascript
class MyGame {
    constructor() {
        this.mediaRecorder = null;
        this.audioChunks = [];
        this.recordedAudio = null;
    }

    // Initialize recording with custom callbacks
    async initializeRecording() {
        try {
            this.mediaRecorder = await initializeVoiceRecording({
                ondataavailable: (event) => {
                    this.audioChunks.push(event.data);
                },
                onstop: () => {
                    const audioBlob = new Blob(this.audioChunks, { type: 'audio/wav' });
                    this.recordedAudio = new Audio(URL.createObjectURL(audioBlob));
                    this.audioChunks = [];
                    
                    // Your custom logic after recording stops
                    this.onRecordingComplete();
                }
            });
        } catch (error) {
            console.error('Error initializing recording:', error);
            alert('Kunne ikke få tilgang til mikrofonen.');
        }
    }

    // Start recording
    startRecording() {
        if (!this.mediaRecorder) {
            console.error('MediaRecorder not initialized');
            return;
        }
        
        this.audioChunks = [];
        this.mediaRecorder.start();
        
        // Update UI
        document.getElementById('record-btn').classList.add('hidden');
        document.getElementById('stop-btn').classList.remove('hidden');
    }

    // Stop recording
    stopRecording() {
        if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
            this.mediaRecorder.stop();
            this.mediaRecorder.stream.getTracks().forEach(track => track.stop());
            
            // Update UI
            document.getElementById('stop-btn').classList.add('hidden');
            document.getElementById('record-btn').classList.remove('hidden');
        }
    }

    // Handle completed recording
    onRecordingComplete() {
        // Play the recording, compare with original, etc.
        this.recordedAudio.play();
    }
}
```

#### Using Shared Recording Utilities

For simpler implementations, use the shared `startRecording` and `stopRecording` utilities:

```javascript
class MyGame {
    constructor() {
        this.mediaRecorder = null;
        this.audioChunks = [];
    }

    async initializeRecording() {
        try {
            this.mediaRecorder = await initializeVoiceRecording();
        } catch (error) {
            console.error('Error initializing recording:', error);
        }
    }

    async record() {
        // Start recording
        await startRecording(this.mediaRecorder, this.audioChunks);
        
        // Wait for user to stop (you handle the UI/timing)
        // ...
        
        // Stop and get the audio blob
        const audioBlob = await stopRecording(this.mediaRecorder, this.audioChunks);
        
        // Use the blob
        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);
        await audio.play();
    }
}
```

#### Recording UI Example

```html
<!-- In your game screen -->
<div class="recording-controls">
    <button id="record-btn" class="btn-primary">🎤 Start opptak</button>
    <button id="stop-btn" class="btn-danger hidden">⏹️ Stopp opptak</button>
    <button id="play-btn" class="btn-secondary hidden">▶️ Spill av</button>
    <span id="recording-status"></span>
</div>
```

#### Why Use game-effects.js for Recording?

1. **Safari Compatibility**: Automatically detects and uses supported audio MIME types
2. **Cross-Browser Support**: Works on Chrome, Safari, Firefox, and Edge
3. **Centralized Updates**: Bug fixes apply to all games
4. **Less Code**: Reduces duplication across games
5. **Tested**: Already used in 6 games (memory-game, cup-shuffle, snake-ladder, letter-trace, find-sounds, pronunciation-practice)

---

## 5. Letter Selection Component

### ⚠️ IMPORTANT: Use the Shared Component

**DO NOT create your own letter selection UI or logic.** Always use the shared `LetterSelection` component from `shared/letter-selection.js`. This ensures:

1. **Consistency** across all games
2. **Automatic persistence** of user selections
3. **Bug fixes** apply to all games
4. **Less code** to maintain

### Automatic Memory Feature

**By default, the `LetterSelection` component automatically remembers** the user's letter selections using localStorage. When a user selects letters in one game and then opens another game, their previous selection will be automatically restored.

### How It Works

1. **User selects letters** in any game
2. **Selection is saved** to localStorage automatically
3. **Next time any game loads**, the saved selection is restored
4. **Works across all games** that use the shared LetterSelection component

### Benefits

- **User convenience**: No need to select the same letters every time
- **Seamless experience**: Works across all games automatically
- **Smart fallback**: If no saved selection exists, defaults to random letters
- **Validation**: Only restores letters that are valid for the current game

### Configuration Options

```javascript
// Default behavior (persistence enabled)
this.letterSelection = new LetterSelection({
    containerSelector: '#letter-selection',
    minSelections: 1,
    defaultSelections: 3
    // persistSelection: true (default)
});

// Disable persistence for a specific game
this.letterSelection = new LetterSelection({
    containerSelector: '#letter-selection',
    minSelections: 1,
    defaultSelections: 3,
    persistSelection: false  // Selection won't be saved/loaded
});

// Use a custom localStorage key (for game-specific selections)
this.letterSelection = new LetterSelection({
    containerSelector: '#letter-selection',
    minSelections: 1,
    defaultSelections: 3,
    persistSelection: true,
    localStorageKey: 'my-game-letters'  // Default: 'kidgames-selected-letters'
});
```

### Advanced: Manual Control

```javascript
// Load saved selection manually
const savedLetters = this.letterSelection.loadFromLocalStorage();
console.log('Saved letters:', savedLetters);

// Save current selection manually
this.letterSelection.saveToLocalStorage();

// Clear saved selection (for testing or reset)
this.letterSelection.clearLocalStorage();

// Programmatically set letters (also saves to localStorage)
this.letterSelection.setSelectedLetters(['A', 'B', 'C']);
```

### Technical Details

- **Storage Key**: Default is `'kidgames-selected-letters'`
- **Format**: JSON array of letter strings, e.g., `["A", "B", "C"]`
- **Validation**: Automatically validates that saved letters exist in available letters
- **Minimum Check**: Falls back to random selection if saved selection is too small
- **Error Handling**: Gracefully handles localStorage errors (e.g., private browsing)

---

## 6. Required CSS Files

### Confetti CSS (`shared/confetti.css`)

Automatically included when you link the file. The `triggerConfetti()` function creates the animation.

```html
<link rel="stylesheet" href="../shared/confetti.css">
```

### Settings Modal CSS (`shared/settings-modal.css`)

Required for the settings modal to display correctly:

```html
<link rel="stylesheet" href="../shared/settings-modal.css">
```

---

## 6. Complete JavaScript Template

```javascript
class MyGame {
    constructor() {
        // Game state
        this.isPlaying = false;
        this.selectedLetters = [];

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
        } catch (error) {
            console.error('Error loading letter data:', error);
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
        // Initialize the letter selection component
        this.letterSelection = new LetterSelection({
            containerSelector: '#letter-selection',
            selectAllBtnSelector: '#select-all-btn',
            selectNoneBtnSelector: '#select-none-btn',
            minSelections: 1,
            defaultSelections: 3,
            onSelectionChange: (selectedLetters) => {
                this.selectedLetters = selectedLetters;
            },
            // Optional: Enable/disable persistence (default: true)
            persistSelection: true,  // Remembers selection across games
            // Optional: Custom localStorage key (default: 'kidgames-selected-letters')
            localStorageKey: 'kidgames-selected-letters'
        });

        // Set initial selected letters
        this.selectedLetters = this.letterSelection.getSelectedLetters();
    }

    startGame() {
        if (this.selectedLetters.length === 0) {
            alert('Velg minst én bokstav!');
            return;
        }

        this.isPlaying = true;
        document.getElementById('setup-screen').classList.add('hidden');
        document.getElementById('game-screen').classList.remove('hidden');

        // Start your game logic here
        this.initializeGameContent();
    }

    initializeGameContent() {
        // Your game-specific initialization
    }

    async gameComplete() {
        this.isPlaying = false;

        // Show victory screen
        document.getElementById('game-screen').classList.add('hidden');
        document.getElementById('victory-screen').classList.remove('hidden');

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
}

// Initialize game when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new MyGame();
});
```

---

## 7. Example: Creating a Simple Letter Matching Game

### Concept
Player needs to match a displayed image/word with the correct letter from letter-images.json.

### Quick Implementation Steps

1. **Create directory**: `letter-match/`
2. **Create HTML**: Copy template above, customize title and descriptions
3. **Create CSS**: Add game-specific styles
4. **Create JS**: Use the complete template above
5. **Add game logic**:
   - Pick random letter from selected letters
   - Display image from letter-images.json
   - Show letter buttons for player to choose
   - Check if correct letter is selected
   - Trigger confetti and game-over sound on completion

### Key Code Snippets

```javascript
// Pick a random letter and display its content
async pickRandomLetter() {
    const letter = this.selectedLetters[Math.floor(Math.random() * this.selectedLetters.length)];
    const content = await this.getLetterContent(letter);

    // Display image
    const imgElement = document.getElementById('letter-image');
    imgElement.src = content.image.startsWith('images/') ? `../${content.image}` : content.image;

    // Play letter sound
    await playLetterSound(letter);

    return letter;
}

// Check player's answer
checkAnswer(selectedLetter) {
    if (selectedLetter === this.currentLetter) {
        this.score++;
        if (this.score >= this.targetScore) {
            this.gameComplete();
        } else {
            this.pickRandomLetter();
        }
    } else {
        // Wrong answer feedback
    }
}
```

---

## 8. Common Patterns

### Pattern 1: Sequential Letter Learning
Load letters one by one with audio and images for letter recognition practice.

### Pattern 2: Word Building
Use multiple letters from letter-images.json to build words.

### Pattern 3: Sound Matching
Play audio from letter-images.json and have player match it to correct letter/image.

### Pattern 4: Memory/Matching
Use images from letter-images.json in card matching games.

---

## 9. Checklist for New Games

- [ ] Create game directory: `my-game/`
- [ ] Create HTML file with all required sections
- [ ] Link shared CSS: confetti.css, letter-selection.css, settings-modal.css
- [ ] Link shared JS: game-effects.js, letter-selection.js, settings-modal.js
- [ ] **USE shared LetterSelection component (DO NOT create custom letter selection)**
- [ ] Implement letter-images.json data loading
- [ ] Setup settings modal with restart functionality
- [ ] Add confetti trigger on game completion
- [ ] Add playGameOverSound() on game completion
- [ ] Test letter selection functionality
- [ ] Test settings modal (open, close, restart)
- [ ] Test game completion (confetti + sound)
- [ ] Add navigation back to main menu
- [ ] **Add game entrance to root index.html** (see section 10)

---

## 10. Adding Your Game to the Main Menu

**IMPORTANT:** After creating your game, you must add it to the main menu (`index.html` in the project root) so users can find and play it.

### Steps to Add Your Game

#### 1. Add a Game Card to the HTML

Open `index.html` and add a new game card inside the `<div class="games-grid">` section:

```html
<a href="my-game/my-game.html" class="game-card">
    <div class="game-icon">🎮</div>
    <div class="game-title">My Game Title</div>
    <div class="game-description">
        Brief description of what your game does and how it helps learn.
        Keep it concise and engaging!
    </div>
    <div class="game-features">
        <span class="feature-badge">Feature 1</span>
        <span class="feature-badge">Feature 2</span>
        <span class="feature-badge">Feature 3</span>
    </div>
</a>
```

**Customize:**
- `href`: Path to your game's HTML file
- `game-icon`: Choose an appropriate emoji
- `game-title`: Your game's display name
- `game-description`: 1-2 sentences explaining the game
- `feature-badge`: Key features (e.g., "Lytting", "Bilder", "Opptak")

#### 2. Add to Random Game Array

In the `<script>` section at the bottom of `index.html`, add your game to the `games` array:

```javascript
const games = [
    'memory-game/memory-game.html',
    'find-sounds/find-sounds.html',
    'sound-sorting/sound-sorting.html',
    'word-safari/word-safari.html',
    'letter-trace/letter-trace.html',
    'pronunciation-practice/pronunciation-practice.html',
    'snake-ladder/snake-ladder.html',
    'my-game/my-game.html'  // Add your game here
];
```

This allows your game to be selected by the "Tilfeldig Spill" (Random Game) button.

### Example: letter-guess Game

Here's how the `letter-guess` game was added to index.html:

```html
<a href="letter-guess/letter-guess.html" class="game-card">
    <div class="game-icon">🎯</div>
    <div class="game-title">Bokstavgjetting</div>
    <div class="game-description">
        Se på bildet og gjett hvilken bokstav det starter med!
        Et morsomt spill for å lære bokstaver og ord.
    </div>
    <div class="game-features">
        <span class="feature-badge">Lytting</span>
        <span class="feature-badge">Gjetting</span>
        <span class="feature-badge">Bilder</span>
    </div>
</a>
```

And in the JavaScript:
```javascript
const games = [
    // ... other games ...
    'letter-guess/letter-guess.html'
];
```

### Tips for Game Card Design

- **Icon**: Choose an emoji that represents your game's main activity
- **Title**: Keep it short and descriptive (2-3 words in Norwegian)
- **Description**: Explain the learning goal and gameplay in 1-2 sentences
- **Features**: List 2-4 key features using Norwegian terms like:
  - `Lytting` (Listening)
  - `Bilder` (Pictures)
  - `Opptak` (Recording)
  - `Lyder` (Sounds)
  - `Gjetting` (Guessing)
  - `Hukommelse` (Memory)
  - `Tegning` (Drawing)

---

## 11. File Paths Reference

```
kidgames/                           # Project root
├── game-over.wav                   # Victory sound
├── letter-images.json              # Letter data
├── difficulty-filter.js            # Difficulty filtering utility
├── sounds/                         # Letter sounds
│   ├── Letter_A.wav
│   ├── Letter_A_Repeatable.wav
│   └── ...
├── images/                         # Letter images
│   ├── A_AKEBRETT.jpg
│   └── ...
├── shared/                         # Shared components
│   ├── confetti.css
│   ├── game-effects.js
│   ├── letter-selection.css
│   ├── letter-selection.js
│   ├── settings-modal.html
│   ├── settings-modal.css
│   └── settings-modal.js
└── my-game/                        # Your game
    ├── my-game.html
    ├── my-game.css
    └── my-game.js
```

---

## Quick Command for Claude

When you want to create a new game, just say:

> "Create a new game called [GAME_NAME] following the GAME_TEMPLATE.md. The game should [DESCRIBE GAME MECHANICS]. Use letter picking from letter-images.json, include settings modal for restarting, trigger confetti + game-over.wav when the game ends, and add it to index.html."

Example:
> "Create a new game called letter-race following the GAME_TEMPLATE.md. The game should show random images from letter-images.json and the player needs to click the correct letter as fast as possible. Use letter picking from letter-images.json, include settings modal for restarting, trigger confetti + game-over.wav when the game ends, and add it to index.html."

---

## Notes

- All games use Norwegian language (lang="no")
- Emojis are commonly used in titles and buttons for visual appeal
- Games should be responsive and work on tablets
- Always check if functions exist before calling them (defensive coding)
- Use `async/await` for loading resources
- Handle errors gracefully with try/catch blocks
