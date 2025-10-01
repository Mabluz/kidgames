/**
 * Difficulty Filter Utility
 *
 * Provides helper functions to filter letter data based on difficulty level.
 * Difficulty levels: 1 = Easy, 2 = Medium, 3 = Hard
 *
 * Filtering logic:
 * - Easy (1): Only words with difficulty 1
 * - Medium (2): Words with difficulty 1 OR 2
 * - Hard (3): Words with difficulty 1, 2 OR 3 (all words)
 *
 * Usage:
 *   const difficulty = getDifficultySetting(); // Gets from localStorage
 *   const filtered = filterLetterDataByDifficulty(letterData, difficulty);
 */

/**
 * Get the current difficulty setting from localStorage
 * @returns {string} '1', '2', or '3'
 */
function getDifficultySetting() {
    return localStorage.getItem('wordDifficulty') || '1';
}

/**
 * Filter letter data based on difficulty setting
 * Returns a deep copy of letterData with only words matching the difficulty
 *
 * Logic:
 * - Easy (1): Only words with difficulty 1
 * - Medium (2): Words with difficulty 1 OR 2
 * - Hard (3): Words with difficulty 1, 2 OR 3 (all words)
 *
 * @param {Object} letterData - The original letter data object
 * @param {string} difficultySetting - '1', '2', or '3'
 * @returns {Object} Filtered letter data
 */
function filterLetterDataByDifficulty(letterData, difficultySetting = '1') {
    const maxDifficulty = parseInt(difficultySetting);
    const filteredData = {};

    // Iterate through each letter
    for (const [letter, data] of Object.entries(letterData)) {
        // Check if this letter has difficulty data
        if (!data.difficulty || !Array.isArray(data.difficulty)) {
            // If no difficulty data, include all words (backward compatibility)
            filteredData[letter] = JSON.parse(JSON.stringify(data));
            continue;
        }

        // Filter words by difficulty
        // Include words with difficulty <= maxDifficulty
        const filteredIndices = [];
        data.difficulty.forEach((diff, index) => {
            if (diff <= maxDifficulty) {
                filteredIndices.push(index);
            }
        });

        // If no words match this difficulty, skip this letter
        if (filteredIndices.length === 0) {
            continue;
        }

        // Create filtered letter data
        filteredData[letter] = {
            words: filteredIndices.map(i => data.words[i]),
            images: filteredIndices.map(i => data.images[i]),
            audio: filteredIndices.map(i => data.audio[i]),
            difficulty: filteredIndices.map(i => data.difficulty[i]),
            letterSound: data.letterSound,
            repeatable: data.repeatable
        };

        // Include optional fields if they exist
        if (data.repeatableLetterSound) {
            filteredData[letter].repeatableLetterSound = data.repeatableLetterSound;
        }
    }

    return filteredData;
}

/**
 * Apply difficulty filter to letter data using current setting from localStorage
 *
 * @param {Object} letterData - The original letter data object
 * @returns {Object} Filtered letter data
 */
function applyDifficultyFilter(letterData) {
    const difficulty = getDifficultySetting();
    return filterLetterDataByDifficulty(letterData, difficulty);
}

/**
 * Get difficulty label for display
 *
 * @param {string} difficultySetting - '1', '2', or '3'
 * @returns {string} Human-readable difficulty label
 */
function getDifficultyLabel(difficultySetting = null) {
    const difficulty = difficultySetting || getDifficultySetting();
    const labels = {
        '1': 'Enkle ord',
        '2': 'Middels ord (inkluderer enkle)',
        '3': 'Vanskelige ord (inkluderer alle)'
    };
    return labels[difficulty] || labels['1'];
}
