# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a web-based Letter Memory Game built with HTML, CSS, and vanilla JavaScript. The game includes features like custom letter selection, difficulty levels, voice pronunciation recording, and visual card flipping animations.

## Development Commands

- **Run the game**: `npm start` or `npm run serve` (starts Python HTTP server on port 8000)
- **Install dependencies**: `npm install` (no external dependencies currently)

## Architecture Overview

### Web Game Structure (`game.js`)
- **MemoryGame Class**: Main game controller with these core systems:
  - Letter management with emoji/custom image associations (A-Z, Æ, Ø, Å)
  - Card shuffling and matching logic
  - Voice recording integration using MediaRecorder API
  - Setup screen for letter selection and difficulty
  - Game state management (flipped cards, matches, attempts)

### Key Features
- **Custom Images**: JSON-configurable letter images via `letter-images.json`
- **Voice Recording**: Required pronunciation practice after each card flip
- **Responsive Design**: Adaptive grid layout for different screen sizes
- **Multiple Difficulty Levels**: Easy (4 pairs), Medium (8 pairs), Hard (12 pairs), Custom

### File Structure
- `index.html` - Game UI and layout structure
- `game.js` - Main game logic and MemoryGame class
- `styles.css` - Responsive styling with card flip animations
- `letter-images.json` - Custom image URL mappings for letters
- `package.json` - Project metadata with Python server scripts

## Important Implementation Details

- The game requires microphone access for voice recording functionality
- Cards use CSS 3D transforms for flip animations
- Game state is managed through class properties (no external state management)
- Custom images are loaded asynchronously and fall back to emoji defaults
- Voice recording workflow blocks game progression until completed

## Notes

- No testing framework or build process configured
- Uses native browser APIs (MediaRecorder, fetch) - modern browser required
- Python HTTP server used for local development (handles CORS for file loading)
- Project supports both Norwegian letters (Æ, Ø, Å) and English alphabet