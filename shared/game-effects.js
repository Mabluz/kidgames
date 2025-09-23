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
 * Plays all letters in a given array with repetition based on letter type
 * @param {string[]} letters - Array of letters to play sounds for
 * @param {number} duration - Duration to repeat each letter in milliseconds (default: 1000)
 */
async function playLetterSequence(letters, duration = 1000) {
    console.log('Playing letter sequence:', letters);

    duration = 3000;
    // Load letter data to check repeatability
    let letterData = null;
    try {
        const response = await fetch('../letter-images.json');
        letterData = await response.json();
    } catch (error) {
        console.log('Could not load letter data:', error);
    }

    for (let i = 0; i < letters.length; i++) {
        const letter = letters[i];
        const isRepeatable = letterData && letterData[letter] && letterData[letter].repeatable;

        try {
            if (isRepeatable) {
                // For repeatable letters (vowels and continuants), repeat for full duration
                const startTime = Date.now();
                let currentAudio = new Audio(`../sounds/Letter_${letter}.wav`);

                // Play the first instance
                await currentAudio.play();

                // Keep playing the letter sound continuously for the specified duration
                while (Date.now() - startTime < duration) {
                    // Wait for current audio to finish or get close to finishing
                    await new Promise(resolve => {
                        const checkAudio = () => {
                            if (currentAudio.ended || currentAudio.currentTime >= currentAudio.duration - 0.1) {
                                resolve();
                            } else {
                                setTimeout(checkAudio, 50);
                            }
                        };
                        checkAudio();
                    });

                    // If we still have time left, start playing again
                    if (Date.now() - startTime < duration) {
                        currentAudio = new Audio(`../sounds/Letter_${letter}.wav`);
                        await currentAudio.play();
                    }
                }

                // Stop current audio if it's still playing
                if (!currentAudio.ended) {
                    currentAudio.pause();
                    currentAudio.currentTime = 0;
                }
            } else {
                // For non-repeatable letters (stops/consonants), play once and move on
                const audio = new Audio(`../sounds/Letter_${letter}.wav`);
                await audio.play();

                // Wait for the audio to finish naturally, then move to next letter
                await new Promise(resolve => {
                    const checkAudio = () => {
                        if (audio.ended) {
                            resolve();
                        } else {
                            setTimeout(checkAudio, 50);
                        }
                    };
                    checkAudio();
                });
            }

        } catch (error) {
            console.log('Could not play letter sound:', error);
            // If audio fails, wait based on letter type
            const isRepeatable = letterData && letterData[letter] && letterData[letter].repeatable;
            if (isRepeatable) {
                // For repeatable letters, wait the full duration
                await new Promise(resolve => setTimeout(resolve, duration));
            } else {
                // For non-repeatable letters, just wait a short time and move on
                await new Promise(resolve => setTimeout(resolve, 500));
            }
        }
    }
}

/**
 * Plays all letters in a word with continuous repetition for each letter
 * @param {string} word - The word to read letter by letter
 * @param {number} duration - Duration to repeat each letter in milliseconds (default: 1000)
 */
async function playWordLetters(word, duration = 1000) {
    const letters = [];

    // Collect all non-space letters from the word
    for (let letter of word.toUpperCase()) {
        if (letter !== ' ') {
            letters.push(letter);
        }
    }

    await playLetterSequence(letters, duration);
}

/**
 * Plays found/guessed letters from a word
 * @param {string} word - The complete word
 * @param {string[]} guessedLetters - Array of letters that have been guessed
 * @param {number} duration - Duration to repeat each letter in milliseconds (default: 1000)
 */
async function playFoundLetters(word, guessedLetters, duration = 1000) {
    const foundLetters = [];

    // Go through each letter in the word and collect the ones that have been guessed
    for (let letter of word) {
        if (letter !== ' ' && guessedLetters.includes(letter)) {
            foundLetters.push(letter);
        }
    }

    await playLetterSequence(foundLetters, duration);
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { triggerConfetti, playGameOverSound, playLetterSound, playLetterSequence, playWordLetters, playFoundLetters };
}