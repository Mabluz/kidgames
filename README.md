# Letter Memory Game

A web-based memory game that helps children learn letters through matching pairs while practicing pronunciation with voice recording.

## Features

- **Letter Matching**: Match pairs of letters (A-Z plus Norwegian letters Æ, Ø, Å)
- **Voice Recording**: Required pronunciation practice after each card flip
- **Custom Images**: Configurable letter images via JSON file
- **Multiple Difficulty Levels**: Easy (4 pairs), Medium (8 pairs), Hard (12 pairs), or Custom
- **Responsive Design**: Adaptive grid layout for different screen sizes
- **Animated Cards**: Smooth 3D flip animations

## Getting Started

### Prerequisites

- Modern web browser with microphone access
- Python 3.x (for local development server)
- Node.js and npm (optional, for package management)

### Installation

1. Clone the repository
2. Navigate to the project directory
3. Install dependencies (optional):
   ```bash
   npm install
   ```

### Running the Game

Start the development server:

```bash
npm start
```

Or alternatively:

```bash
npm run serve
```

This will start a Python HTTP server on port 8000. Open your browser and navigate to `http://localhost:8000`.

## How to Play

1. **Setup**: Choose your difficulty level and select which letters to include
2. **Game**: Click cards to flip them and find matching pairs
3. **Voice Recording**: After each card flip, record yourself pronouncing the letter
4. **Win**: Match all pairs to complete the game

## Project Structure

```
├── index.html           # Main HTML file with game UI
├── game.js             # Core game logic and MemoryGame class
├── styles.css          # Responsive styling and animations
├── letter-images.json  # Custom image URL mappings
├── package.json        # Project metadata and scripts
└── README.md          # This file
```

## Configuration

### Custom Letter Images

Edit `letter-images.json` to customize images for specific letters:

```json
{
  "A": "path/to/apple.png",
  "B": "path/to/ball.png"
}
```

Images that aren't configured will fall back to emoji representations.

## Technical Details

- **Framework**: Vanilla JavaScript (no external dependencies)
- **APIs Used**: MediaRecorder API for voice recording, Fetch API for loading images
- **Browser Support**: Modern browsers with MediaRecorder support required
- **Development Server**: Python HTTP server for CORS handling

## License

This project is for educational purposes.