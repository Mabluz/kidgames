/**
 * Shared game effects and animations
 * Used across multiple games in the memory project
 */

// Audio crossfading utilities using Web Audio API
let audioContext = null;
const audioBufferCache = new Map();

/**
 * Initialize audio context (lazy initialization)
 */
function getAudioContext() {
    if (!audioContext) {
        try {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch (error) {
            console.log('Web Audio API not supported:', error);
            return null;
        }
    }
    return audioContext;
}

/**
 * Preload audio file into a buffer for Web Audio API
 * @param {string} url - URL of the audio file to load
 * @returns {Promise<AudioBuffer>} - Promise that resolves to the audio buffer
 */
async function preloadAudioBuffer(url) {
    if (audioBufferCache.has(url)) {
        return audioBufferCache.get(url);
    }

    const context = getAudioContext();
    if (!context) {
        throw new Error('Web Audio API not supported');
    }

    try {
        const response = await fetch(url);
        const arrayBuffer = await response.arrayBuffer();
        const audioBuffer = await context.decodeAudioData(arrayBuffer);
        audioBufferCache.set(url, audioBuffer);
        return audioBuffer;
    } catch (error) {
        console.log(`Failed to load audio buffer for ${url}:`, error);
        throw error;
    }
}

/**
 * Create a fade transition effect using gain nodes
 * @param {GainNode} gainNode - The gain node to apply the fade to
 * @param {number} fromVolume - Starting volume (0.0 to 1.0)
 * @param {number} toVolume - Ending volume (0.0 to 1.0)
 * @param {number} duration - Fade duration in seconds
 * @param {number} startTime - When to start the fade (in AudioContext time)
 */
function createFadeTransition(gainNode, fromVolume, toVolume, duration, startTime) {
    const context = getAudioContext();
    if (!context || !gainNode) return;

    gainNode.gain.setValueAtTime(fromVolume, startTime);
    // Use linear ramp for smoother crossfading, and don't go as low
    gainNode.gain.linearRampToValueAtTime(Math.max(toVolume || 0.001, 0.1), startTime + duration);
}

/**
 * Play an audio buffer with crossfading support
 * @param {AudioBuffer} buffer - The audio buffer to play
 * @param {number} startTime - When to start playing (in AudioContext time)
 * @param {number} fadeInDuration - Fade in duration in seconds
 * @param {number} fadeOutDelay - When to start fade out (relative to start)
 * @param {number} fadeOutDuration - Fade out duration in seconds
 * @returns {Object} - Object containing the source and gain nodes for control
 */
function playAudioBufferWithFade(buffer, startTime, fadeInDuration = 0.1, fadeOutDelay = null, fadeOutDuration = 0.3) {
    const context = getAudioContext();
    if (!context || !buffer) return null;

    const source = context.createBufferSource();
    const gainNode = context.createGain();

    source.buffer = buffer;
    source.connect(gainNode);
    gainNode.connect(context.destination);

    // Set initial volume and fade in more gently
    gainNode.gain.setValueAtTime(0.1, startTime);
    gainNode.gain.linearRampToValueAtTime(1.0, startTime + fadeInDuration);

    // Schedule fade out if specified - use gentler fade that doesn't go to silence
    if (fadeOutDelay !== null) {
        const fadeOutStart = startTime + fadeOutDelay;
        gainNode.gain.setValueAtTime(1.0, fadeOutStart);
        // Fade to 0.3 instead of near zero to maintain audible overlap
        gainNode.gain.linearRampToValueAtTime(0.3, fadeOutStart + fadeOutDuration);
        // Then fade to silence more quickly at the very end
        gainNode.gain.linearRampToValueAtTime(0.001, fadeOutStart + fadeOutDuration + 0.1);
    }

    source.start(startTime);

    return { source, gainNode };
}

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
 * Plays all letters in a given array with crossfading between sounds
 * @param {string[]} letters - Array of letters to play sounds for
 * @param {number} duration - Duration to repeat each letter in milliseconds (default: 1000)
 * @param {boolean} enableCrossfade - Whether to use crossfading (default: true)
 */
async function playLetterSequence(letters, duration = 1000, enableCrossfade = true) {
    console.log('Playing letter sequence:', letters);

    // Check if Web Audio API is available for crossfading
    const context = getAudioContext();
    const useCrossfade = enableCrossfade && context;

    if (!useCrossfade) {
        // Fallback to original implementation
        return playLetterSequenceFallback(letters, duration);
    }

    // Load letter data to check repeatability
    let letterData = null;
    try {
        const response = await fetch('../letter-images.json');
        letterData = await response.json();
    } catch (error) {
        console.log('Could not load letter data:', error);
    }

    // Filter out consecutive duplicate letters
    const filteredLetters = [];
    for (let i = 0; i < letters.length; i++) {
        if (i === 0 || letters[i] !== letters[i - 1]) {
            filteredLetters.push(letters[i]);
        }
    }

    const crossfadeDuration = 0.6; // 600ms crossfade for more overlap
    let currentTime = context.currentTime;
    const activeAudioSources = [];

    for (let i = 0; i < filteredLetters.length; i++) {
        const letter = filteredLetters[i];
        const isRepeatable = letterData && letterData[letter] && letterData[letter].repeatable;

        // Try to load repeatable sound, fall back to regular if not found
        let audioUrl = isRepeatable ? `../sounds/Letter_${letter}_Repeatable.wav` : `../sounds/Letter_${letter}.wav`;

        try {
            // Preload the audio buffer, with fallback for repeatable
            let buffer;
            try {
                buffer = await preloadAudioBuffer(audioUrl);
            } catch (error) {
                if (isRepeatable) {
                    console.log(`Repeatable sound not found for ${letter}, falling back to regular sound`);
                    audioUrl = `../sounds/Letter_${letter}.wav`;
                    buffer = await preloadAudioBuffer(audioUrl);
                } else {
                    throw error;
                }
            }

            if (isRepeatable) {
                // For repeatable letters, play with overlap and crossfading
                const letterDurationSeconds = duration / 1000;
                const audioLength = buffer.duration;

                let letterStartTime = currentTime;
                const letterEndTime = letterStartTime + letterDurationSeconds;

                // Calculate how many times we need to repeat this sound
                const repeatCount = Math.ceil(letterDurationSeconds / audioLength);

                for (let j = 0; j < repeatCount; j++) {
                    // For repeatable letters, overlap the repetitions to create seamless continuity
                    const soundStartTime = letterStartTime + (j * (audioLength - crossfadeDuration));
                    const isLastRepeat = j === repeatCount - 1;

                    // Calculate fade out timing
                    let fadeOutDelay = null;
                    let fadeOutDuration = crossfadeDuration;

                    if (isLastRepeat) {
                        // Last repeat: fade out before letter end or when transitioning to next letter
                        const timeUntilLetterEnd = letterEndTime - soundStartTime;
                        if (i < letters.length - 1) {
                            // Not the last letter - fade out for transition to next letter
                            fadeOutDelay = Math.max(0, timeUntilLetterEnd - crossfadeDuration);
                        } else {
                            // Last letter - let it play fully
                            fadeOutDelay = Math.max(0, audioLength - 0.1);
                            fadeOutDuration = 0.1;
                        }
                    } else {
                        // Not last repeat: fade out to blend with next repetition
                        fadeOutDelay = Math.max(0, audioLength - crossfadeDuration);
                    }

                    const audioSource = playAudioBufferWithFade(
                        buffer,
                        soundStartTime,
                        j === 0 ? 0.1 : crossfadeDuration, // Fade in duration
                        fadeOutDelay,
                        fadeOutDuration
                    );

                    if (audioSource) {
                        activeAudioSources.push(audioSource);
                    }
                }

                // For repeatable letters, if there's a next letter, start it with substantial overlap
                if (i < letters.length - 1) {
                    currentTime = letterEndTime - crossfadeDuration * 1.5; // Even more overlap for repeatable letters
                } else {
                    currentTime = letterEndTime;
                }

            } else {
                // For non-repeatable letters, play once with crossfade
                const audioLength = buffer.duration;
                let fadeOutDelay = null;
                let fadeOutDuration = crossfadeDuration;

                // If this is not the last letter, fade out during the last part of the sound
                if (i < letters.length - 1) {
                    fadeOutDelay = Math.max(0, audioLength - crossfadeDuration);
                }

                const audioSource = playAudioBufferWithFade(
                    buffer,
                    currentTime,
                    i === 0 ? 0.1 : 0.1, // Quick fade in for all letters
                    fadeOutDelay,
                    fadeOutDuration
                );

                if (audioSource) {
                    activeAudioSources.push(audioSource);
                }

                // Move to next letter with substantial overlap - start next letter well before current one ends
                if (i < letters.length - 1) {
                    // Start next letter even earlier for more overlap
                    currentTime += Math.max(audioLength - crossfadeDuration, audioLength * 0.4); // Start next letter at 40% through current
                } else {
                    currentTime += audioLength;
                }
            }

        } catch (error) {
            console.log('Could not play letter sound with crossfade:', error);
            // Skip this letter and continue
            currentTime += duration / 1000;
        }
    }

    // Wait for all audio to finish
    const totalDuration = currentTime - context.currentTime;
    await new Promise(resolve => setTimeout(resolve, totalDuration * 1000 + 500));

    // Clean up audio sources
    activeAudioSources.forEach(({ source }) => {
        try {
            source.stop();
        } catch (e) {
            // Source might already be stopped
        }
    });
}

/**
 * Fallback implementation without crossfading (original behavior)
 * @param {string[]} letters - Array of letters to play sounds for
 * @param {number} duration - Duration to repeat each letter in milliseconds
 */
async function playLetterSequenceFallback(letters, duration = 1000) {
    // Load letter data to check repeatability
    let letterData = null;
    try {
        const response = await fetch('../letter-images.json');
        letterData = await response.json();
    } catch (error) {
        console.log('Could not load letter data:', error);
    }

    // Filter out consecutive duplicate letters
    const filteredLetters = [];
    for (let i = 0; i < letters.length; i++) {
        if (i === 0 || letters[i] !== letters[i - 1]) {
            filteredLetters.push(letters[i]);
        }
    }

    for (let i = 0; i < filteredLetters.length; i++) {
        const letter = filteredLetters[i];
        const isRepeatable = letterData && letterData[letter] && letterData[letter].repeatable;

        try {
            if (isRepeatable) {
                // For repeatable letters (vowels and continuants), repeat for full duration
                const startTime = Date.now();

                // Try to load repeatable sound, fall back to regular if not found
                let audioPath = `../sounds/Letter_${letter}_Repeatable.wav`;
                let currentAudio = new Audio(audioPath);

                // Check if repeatable file exists, otherwise use regular letter sound
                await new Promise((resolve) => {
                    currentAudio.onerror = () => {
                        audioPath = `../sounds/Letter_${letter}.wav`;
                        currentAudio = new Audio(audioPath);
                        resolve();
                    };
                    currentAudio.oncanplaythrough = resolve;
                });

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
                        currentAudio = new Audio(audioPath);
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