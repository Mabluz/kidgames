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

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { triggerConfetti, playGameOverSound };
}