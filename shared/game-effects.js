/**
 * Shared game effects and animations
 * Used across multiple games in the memory project
 */

/**
 * Triggers a confetti animation on the screen
 * Creates 50 confetti pieces with random properties and animations
 */
function triggerConfetti() {
    const confettiContainer = document.createElement('div');
    confettiContainer.className = 'confetti';
    document.body.appendChild(confettiContainer);

    // Create 50 confetti pieces
    for (let i = 0; i < 50; i++) {
        const confettiPiece = document.createElement('div');
        confettiPiece.className = 'confetti-piece';

        // Random horizontal position
        confettiPiece.style.left = Math.random() * 100 + '%';

        // Random size variation
        const size = Math.random() * 8 + 4;
        confettiPiece.style.width = size + 'px';
        confettiPiece.style.height = size + 'px';

        // Random animation duration
        confettiPiece.style.animationDuration = (Math.random() * 2 + 2) + 's';

        confettiContainer.appendChild(confettiPiece);
    }

    // Remove confetti after animation
    setTimeout(() => {
        if (document.body.contains(confettiContainer)) {
            document.body.removeChild(confettiContainer);
        }
    }, 4000);
}

/**
 * Plays a game over sound effect
 * Handles the case where the audio file might not exist
 */
function playGameOverSound() {
    const audio = new Audio('../game-over.wav');
    audio.play().catch(error => {
        console.log('Could not play game-over sound:', error);
        // Silently fail if audio file doesn't exist or can't be played
    });
}

/**
 * Plays a single letter sound
 * @param {string} letter - The letter to play the sound for
 */
async function playLetterSound(letter) {
    console.log('Playing sound for letter:', letter);
    try {
        const audio = new Audio(`../sounds/Letter_${letter}.wav`);
        await audio.play();
    } catch (error) {
        console.log('Could not play letter sound:', error);
    }
}

/**
 * Plays all letters in a given array with delays between them
 * @param {string[]} letters - Array of letters to play sounds for
 * @param {number} delay - Delay between letters in milliseconds (default: 800)
 */
async function playLetterSequence(letters, delay = 800) {
    console.log('Playing letter sequence:', letters);

    for (let i = 0; i < letters.length; i++) {
        try {
            const audio = new Audio(`../sounds/Letter_${letters[i]}.wav`);
            await audio.play();

            // Wait a bit between letters (except for the last one)
            if (i < letters.length - 1) {
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        } catch (error) {
            console.log('Could not play letter sound:', error);
        }
    }
}

/**
 * Plays all letters in a word with delays between them
 * @param {string} word - The word to read letter by letter
 * @param {number} delay - Delay between letters in milliseconds (default: 800)
 */
async function playWordLetters(word, delay = 800) {
    const letters = [];

    // Collect all non-space letters from the word
    for (let letter of word.toUpperCase()) {
        if (letter !== ' ') {
            letters.push(letter);
        }
    }

    await playLetterSequence(letters, delay);
}

/**
 * Plays found/guessed letters from a word
 * @param {string} word - The complete word
 * @param {string[]} guessedLetters - Array of letters that have been guessed
 * @param {number} delay - Delay between letters in milliseconds (default: 800)
 */
async function playFoundLetters(word, guessedLetters, delay = 800) {
    const foundLetters = [];

    // Go through each letter in the word and collect the ones that have been guessed
    for (let letter of word) {
        if (letter !== ' ' && guessedLetters.includes(letter)) {
            foundLetters.push(letter);
        }
    }

    await playLetterSequence(foundLetters, delay);
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { triggerConfetti, playGameOverSound, playLetterSound, playLetterSequence, playWordLetters, playFoundLetters };
}