# Snake and Ladder Game - Implementation Plan

## Overview
A digital board game combining traditional Snakes and Ladders mechanics with educational letter/word learning features. Players roll dice, move around a randomly generated board, and interact with words based on selected letters.

## Game Concept
- **Board Size**: 30 squares (5x6 grid or similar layout)
- **Random Board**: Snakes and ladders are randomly placed at each new game
- **Educational Element**: Each square displays a word (with image) from the selected letters
- **Multiplayer**: Support 1-4 players with turn-based gameplay
- **Audio Feedback**: Letter sounds and word pronunciation using existing audio system

## Pre-Game Setup Screen

### Letter Selection
- Use existing letter selection system from memory game
- Display clickable letter grid (A-Z, Æ, Ø, Å)
- Allow players to select multiple letters (minimum 10 letters recommended for variety)
- Use `shared/game-effects.js` for letter sound playback
- Filter words by difficulty level (using `difficulty-filter.js`)

### Player Selection
- Dropdown/buttons to select 1-4 players
- Each player gets:
  - Unique color (Red, Blue, Green, Yellow)
  - Name (Player 1, Player 2, etc.)
  - Position tracker (starts at square 0)

### Configuration
- Number of snakes (default: 4-6, randomized)
- Number of ladders (default: 4-6, randomized)
- "Start Game" button to begin

## Board Generation

### Square Population
1. Generate 30 words from selected letters
   - Pull from `letter-images.json` based on selected letters
   - Ensure variety: mix letters if possible
   - Each square shows:
     - Word text
     - Associated image/emoji
     - Square number

2. Random Snake Placement
   - Place 4-6 snakes on the board
   - Snake head: higher square number
   - Snake tail: lower square number
   - No snakes on first/last 3 squares
   - No overlapping snakes/ladders

3. Random Ladder Placement
   - Place 4-6 ladders on the board
   - Ladder top: higher square number
   - Ladder bottom: lower square number
   - No ladders on first/last 3 squares
   - No overlapping snakes/ladders

### Visual Layout
- 5x6 or 6x5 grid layout (serpentine pattern)
  - Row 1: 1→6 (left to right)
  - Row 2: 12→7 (right to left)
  - Row 3: 13→18 (left to right)
  - Row 4: 24→19 (right to left)
  - Row 5: 25→30 (left to right)
- CSS Grid for responsive layout
- Visual indicators for snakes (🐍) and ladders (🪜)

## Game Mechanics

### Turn Flow
1. Display current player's turn
2. Player clicks "Roll Dice" button
3. Animate dice roll (1-6)
4. Move player token with animation
5. If player lands on:
   - **Snake head**: Slide down to tail with animation
   - **Ladder bottom**: Climb up to top with animation
   - **Regular square**: Stay there
6. **Interactive Word Learning Sequence:**
   - Show word/image for destination square
   - Play word audio pronunciation automatically
   - Show voice recording controls
   - Player clicks "🎤 Record" button
   - Player says the word (recording for 2-3 seconds)
   - Recording stops automatically or manually
   - Playback recorded audio to user
   - Player clicks "✓ Continue" to proceed
7. Check win condition (reached square 30)
8. Next player's turn

### Dice Roll
- Animated 3D dice or simple number animation
- Random number 1-6
- Visual feedback with sound effect

### Player Movement
- Smooth CSS animation from current to destination square
- Player token (colored circle or icon) moves across board
- Handle snake/ladder animations with special effects
  - Snake: Red sliding animation downward
  - Ladder: Green climbing animation upward

### Audio Integration
- Play word audio when landing on square (from `letter-images.json`)
- **Voice Recording System** (reuse from memory game):
  - Request microphone permission on game start
  - Show recording UI after word is played
  - Record player saying the word (2-3 seconds)
  - Play back recording to player for confirmation
  - Block game progression until recording is complete
  - Player must click "Continue" to proceed to next turn
- Optional: play letter sound for the starting letter
- Use `shared/game-effects.js` for audio playback
- Dice roll sound effect

### Voice Recording Workflow (Detailed)

When a player lands on any square, the following sequence occurs:

1. **Initial Playback**
   - Square is highlighted with pulse animation
   - Word and image are displayed prominently (modal or overlay)
   - Word audio plays automatically from `letter-images.json`
   - Voice controls panel appears

2. **Recording Controls State**
   - **"🔊 Hør ordet"** button: Visible, allows replaying word audio
   - **"🎤 Ta opp"** button: Visible, prompts recording
   - **"▶️ Spill av igjen"** button: Hidden initially
   - **"✓ Fortsett"** button: Hidden initially
   - Status text: "Klikk ta opp og si '{word}'"

3. **Recording Phase**
   - Player clicks "🎤 Ta opp"
   - Button changes to "⏹️ Stopp" with red background
   - Recording starts via MediaRecorder API
   - Status text: "Spiller inn... Si '{word}'"
   - Auto-stop after 3 seconds OR manual stop by clicking button

4. **Playback Phase**
   - Recording stops automatically
   - Recorded audio plays back immediately
   - **"▶️ Spill av igjen"** button: Now visible
   - **"✓ Fortsett"** button: Now visible
   - **"🎤 Ta opp"** button: Changes back to "🎤 Ta opp på nytt" (re-record option)
   - Status text: "Hør opptaket ditt! Klikk fortsett når du er klar"

5. **Continue to Next Turn**
   - Player clicks "✓ Fortsett"
   - Voice controls hide
   - Game unblocks
   - Next player's turn begins (or same player if single-player)

**Blocking Behavior:**
- Dice roll button is disabled during recording phase
- Game board interactions are blocked
- Player MUST complete recording workflow before proceeding
- This ensures educational engagement with each word

### Win Condition
- First player to reach exactly square 30 wins
- If roll goes beyond 30, player doesn't move (or bounces back)
- Victory screen with:
  - Confetti animation (`triggerConfetti()`)
  - Winner announcement
  - Game over sound (`playGameOverSound()`)
  - "New Game" button

## File Structure

```
snake-ladder/
├── snake-ladder.html       # Main game HTML
├── snake-ladder.js         # Game logic class
├── snake-ladder.css        # Game styling
└── assets/
    └── dice-roll.wav       # Dice sound effect (optional)
```

## Technical Implementation Details

### HTML Structure
```html
- Setup screen (letter selection, player selection)
- Game board container
  - Board grid (30 squares)
  - Player tokens overlay
  - Snakes/ladders visual layer
- Control panel
  - Current player indicator
  - Dice roll button
  - Dice display
- Voice recording controls (shown after landing on square)
  - Recording status text
  - "🔊 Hør ordet" button (listen to word)
  - "🎤 Ta opp" button (start/stop recording)
  - "▶️ Spill av igjen" button (play recording back)
  - "✓ Fortsett" button (continue to next turn)
- Win screen (hidden initially)
```

### JavaScript Class: SnakeLadderGame

#### Properties
- `letters[]` - Available letters from letter-images.json
- `selectedLetters[]` - Letters chosen by user
- `playerCount` - Number of players (1-4)
- `players[]` - Array of player objects
  - `{ name, color, position, token }`
- `currentPlayerIndex` - Whose turn it is
- `boardSquares[]` - 30 squares with word/image data
- `snakes[]` - Array of `{head: x, tail: y}` objects
- `ladders[]` - Array of `{bottom: x, top: y}` objects
- `gameActive` - Boolean for game state
- `mediaRecorder` - MediaRecorder instance for voice recording
- `audioChunks[]` - Array to store recorded audio data
- `recordedAudio` - Blob of recorded audio
- `currentSquare` - Current square the player landed on
- `gameBlocked` - Boolean to block actions during recording

#### Methods
- `initializeApp()` - Load letter data
- `initializeSetupScreen()` - Render letter selection UI
- `startGame()` - Generate board, start gameplay
- `generateBoard()` - Create 30 squares with words
- `placeSnakes()` - Randomly place snakes
- `placeLadders()` - Randomly place ladders
- `renderBoard()` - Draw board to DOM
- `rollDice()` - Generate random 1-6, animate
- `movePlayer(steps)` - Move current player
- `checkSquare(position)` - Check for snake/ladder
- `playSquareAudio(square)` - Play word pronunciation
- **Voice Recording Methods:**
  - `initializeVoiceRecording()` - Request mic access, setup MediaRecorder
  - `showVoiceControls()` - Display recording UI with word info
  - `hideVoiceControls()` - Hide recording UI
  - `toggleRecording()` - Start/stop voice recording
  - `playRecording()` - Play back recorded audio
  - `playPreRecordedAudio()` - Play word audio again
  - `continueAfterRecording()` - Proceed to next player's turn
- `checkWin()` - Check if player reached square 30
- `nextPlayer()` - Switch to next player
- `showWinScreen()` - Display winner
- `resetGame()` - Return to setup screen

### CSS Features
- Responsive grid layout (mobile-friendly)
- Player token colors and animations
- Snake graphics (red, curved lines or emoji)
- Ladder graphics (green, vertical lines or emoji)
- Dice animation
- Hover effects for squares
- Card-flip or pulse animation for current square

### Shared Components
- Use `shared/game-effects.js` for:
  - `playLetterSound(letter)`
  - `triggerConfetti()`
  - `playGameOverSound()`
  - **Voice Recording Functions:**
    - `initializeVoiceRecording()` - Setup MediaRecorder
    - `startRecording(mediaRecorder, audioChunks)` - Begin recording
    - `stopRecording(mediaRecorder, audioChunks)` - End recording, return Blob
    - `playAudioBlob(audioBlob)` - Play recorded audio
- Use `shared/settings-modal.js` for settings (if needed)
- Use `difficulty-filter.js` for word filtering

## Game Flow Summary

1. **Setup Phase**
   - Select letters (minimum 10)
   - Select number of players (1-4)
   - Click "Start Game"

2. **Initialization**
   - Generate 30 random words from selected letters
   - Randomly place 4-6 snakes
   - Randomly place 4-6 ladders
   - Render board
   - Initialize player positions at square 0

3. **Gameplay Loop**
   - Show current player indicator
   - Player clicks "Roll Dice"
   - Dice animates and shows result (1-6)
   - Player token moves forward
   - Check for snake/ladder on destination
   - **Word Learning Interaction:**
     - Highlight destination square
     - Display word and image clearly
     - Automatically play word audio pronunciation
     - Show voice recording controls
     - Player listens to word (can replay with "🔊 Hør ordet")
     - Player clicks "🎤 Ta opp" to record
     - Player says the word (2-3 seconds)
     - Recording automatically stops
     - Recorded audio plays back to player
     - Player clicks "✓ Fortsett" to continue
   - Check win condition
   - Next player's turn

4. **End Game**
   - First player to reach square 30 wins
   - Show confetti and win message
   - Option to play again (returns to setup)

## Additional Features (Optional Enhancements)

### Phase 1 (MVP)
- Basic board with 30 squares
- Dice rolling and player movement
- Snakes and ladders
- Word/image display
- Audio playback
- Win condition

### Phase 2 (Enhancements)
- Pronunciation challenge: player must say word before next turn
- Multiple difficulty modes (easy/medium/hard boards)
- Save/load game state
- Animated snake/ladder movements
- Customizable board size (20, 30, or 40 squares)
- Power-ups (extra turn, skip snake, etc.)

### Phase 3 (Advanced)
- Sound effects for everything (dice, movement, snake, ladder)
- Background music toggle
- Player avatars/custom names
- Game statistics (total moves, snakes hit, ladders climbed)
- Leaderboard for fastest wins
- Online multiplayer (future consideration)

## Integration with Existing Codebase

1. Add new game link to `index.html`:
```html
<a href="snake-ladder/snake-ladder.html" class="game-card">
    <div class="game-icon">🐍🪜</div>
    <div class="game-title">Slange og Stige</div>
    <div class="game-description">
        Kast terning og beveg deg rundt på brettet!
        Klatre opp stiger og gli ned slanger mens du lærer nye ord.
    </div>
    <div class="game-features">
        <span class="feature-badge">Terning</span>
        <span class="feature-badge">Flerspiller</span>
        <span class="feature-badge">Ord</span>
    </div>
</a>
```

2. Include in random game selector (index.html script):
```javascript
'snake-ladder/snake-ladder.html'
```

## Design Considerations

### User Experience
- Clear visual feedback for all actions
- Smooth animations (not too fast, not too slow)
- Large tap targets for mobile
- High contrast colors for accessibility
- Audio cues for important events

### Performance
- Preload all word images at game start
- Preload audio files for selected letters
- Use CSS transforms for animations (hardware accelerated)
- Lazy load images that aren't visible

### Mobile Responsiveness
- Board scales to screen size
- Larger buttons for mobile touch
- Vertical layout on small screens
- Dice button always visible

## Testing Checklist

- [ ] Letter selection works correctly
- [ ] Player selection (1-4) works
- [ ] Board generates 30 unique squares
- [ ] Snakes place correctly (no overlaps)
- [ ] Ladders place correctly (no overlaps)
- [ ] Dice rolls random numbers 1-6
- [ ] Player movement animation works
- [ ] Snake slide down animation works
- [ ] Ladder climb up animation works
- [ ] Audio plays for each square
- **Voice Recording Tests:**
  - [ ] Microphone permission requested on game start
  - [ ] Recording controls appear after landing on square
  - [ ] Word audio plays automatically when landing
  - [ ] "🔊 Hør ordet" replays word audio
  - [ ] "🎤 Ta opp" starts/stops recording
  - [ ] Recording duration works (2-3 seconds)
  - [ ] Recorded audio plays back correctly
  - [ ] "✓ Fortsett" button appears after recording
  - [ ] Game blocks until recording complete
  - [ ] Works for all squares/words
- [ ] Turn switching works for multiplayer
- [ ] Win condition triggers correctly
- [ ] Confetti animation plays on win
- [ ] New game resets everything
- [ ] Mobile responsive layout works
- [ ] Works with all difficulty levels

## Timeline Estimate

- **Setup & Letter Selection**: 1-2 hours
- **Board Generation Logic**: 2-3 hours
- **Board UI & Styling**: 2-3 hours
- **Dice & Movement Logic**: 2 hours
- **Snake & Ladder Logic**: 1-2 hours
- **Audio Integration**: 1 hour
- **Voice Recording System**: 2-3 hours (reuse from memory game)
- **Multiplayer Logic**: 1-2 hours
- **Win Screen & Polish**: 1 hour
- **Testing & Bug Fixes**: 2-3 hours

**Total Estimated Time**: 15-22 hours

---

## Notes
- Reuse as much code as possible from memory game (letter selection, audio playback, player management)
- Keep the game simple and fun for kids
- Focus on smooth animations and clear visual feedback
- Make sure words and images are educational and engaging
