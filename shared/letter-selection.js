/**
 * Shared Letter Selection Component
 * Provides reusable letter selection functionality for memory games
 */

class LetterSelection {
    constructor(options = {}) {
        this.containerSelector = options.containerSelector || '#letter-selection';
        this.selectAllBtnSelector = options.selectAllBtnSelector || '#select-all-btn';
        this.selectNoneBtnSelector = options.selectNoneBtnSelector || '#select-none-btn';
        this.letters = options.letters || this.getDefaultLetters();
        this.selectedLetters = new Set();
        this.maxSelections = options.maxSelections || null;
        this.minSelections = options.minSelections || 1;
        this.defaultSelections = options.defaultSelections || 2;
        this.onSelectionChange = options.onSelectionChange || (() => {});
        
        this.init();
    }
    
    getDefaultLetters() {
        return [
            'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M',
            'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z',
            'Æ', 'Ø', 'Å'
        ];
    }
    
    init() {
        this.createLetterGrid();
        this.setupEventListeners();
        this.selectDefaultLetters();
    }
    
    createLetterGrid() {
        const container = document.querySelector(this.containerSelector);
        if (!container) {
            console.error(`Letter selection container not found: ${this.containerSelector}`);
            return;
        }
        
        container.innerHTML = '';
        
        this.letters.forEach(letter => {
            const letterOption = document.createElement('div');
            letterOption.className = 'letter-option';
            letterOption.textContent = letter;
            letterOption.dataset.letter = letter;
            
            letterOption.addEventListener('click', () => {
                this.toggleLetter(letter);
            });
            
            container.appendChild(letterOption);
        });
    }
    
    setupEventListeners() {
        const selectAllBtn = document.querySelector(this.selectAllBtnSelector);
        const selectNoneBtn = document.querySelector(this.selectNoneBtnSelector);
        
        if (selectAllBtn) {
            selectAllBtn.addEventListener('click', () => this.selectAll());
            // Hide "Select All" button when maxSelections is 1
            if (this.maxSelections === 1) {
                selectAllBtn.style.display = 'none';
            }
        }
        
        if (selectNoneBtn) {
            selectNoneBtn.addEventListener('click', () => this.selectNone());
        }
    }
    
    selectDefaultLetters() {
        // Select random letters by default
        const shuffled = [...this.letters].sort(() => Math.random() - 0.5);
        const defaultCount = Math.min(this.defaultSelections, shuffled.length);
        
        for (let i = 0; i < defaultCount; i++) {
            this.selectedLetters.add(shuffled[i]);
        }
        
        this.updateUI();
    }
    
    toggleLetter(letter) {
        if (this.selectedLetters.has(letter)) {
            // Don't allow deselecting if at minimum
            if (this.selectedLetters.size <= this.minSelections) {
                return;
            }
            this.selectedLetters.delete(letter);
        } else {
            // If at max selections, replace the current selection(s)
            if (this.maxSelections && this.selectedLetters.size >= this.maxSelections) {
                // For maxSelections = 1, replace the current selection
                if (this.maxSelections === 1) {
                    this.selectedLetters.clear();
                    this.selectedLetters.add(letter);
                } else {
                    // For other max values, don't allow more selections
                    return;
                }
            } else {
                this.selectedLetters.add(letter);
            }
        }
        
        this.updateUI();
        this.onSelectionChange(this.getSelectedLetters());
    }
    
    selectAll() {
        this.selectedLetters.clear();
        const lettersToAdd = this.maxSelections ? 
            this.letters.slice(0, this.maxSelections) : 
            this.letters;
        
        lettersToAdd.forEach(letter => this.selectedLetters.add(letter));
        this.updateUI();
        this.onSelectionChange(this.getSelectedLetters());
    }
    
    selectNone() {
        this.selectedLetters.clear();
        this.updateUI();
        this.onSelectionChange(this.getSelectedLetters());
    }
    
    updateUI() {
        const container = document.querySelector(this.containerSelector);
        if (!container) return;

        this.letters.forEach(letter => {
            const letterOption = container.querySelector(`[data-letter="${letter}"]`);
            if (letterOption) {
                if (this.selectedLetters.has(letter)) {
                    letterOption.classList.add('selected');
                } else {
                    letterOption.classList.remove('selected');
                }
            }
        });
    }
    
    getSelectedLetters() {
        return Array.from(this.selectedLetters);
    }
    
    setSelectedLetters(letters) {
        this.selectedLetters.clear();
        letters.forEach(letter => {
            if (this.letters.includes(letter)) {
                this.selectedLetters.add(letter);
            }
        });
        this.updateUI();
        this.onSelectionChange(this.getSelectedLetters());
    }
    
    isValidSelection() {
        return this.selectedLetters.size >= this.minSelections;
    }
    
    getValidationMessage() {
        if (this.selectedLetters.size === 0) {
            return 'Vennligst velg minst en bokstav!';
        }
        if (this.selectedLetters.size < this.minSelections) {
            return `Vennligst velg minst ${this.minSelections} bokstav${this.minSelections > 1 ? 'er' : ''}!`;
        }
        return '';
    }
    
    // Utility method for games that need letter objects with additional data
    createLetterObjects(letterData) {
        return this.getSelectedLetters().map(letter => {
            const data = letterData[letter];
            return {
                letter: letter,
                ...data
            };
        });
    }
}

// Make it available globally for backwards compatibility
window.LetterSelection = LetterSelection;