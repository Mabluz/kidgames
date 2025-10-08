/**
 * SettingsModal - Reusable modal component for game settings
 *
 * Usage:
 * const settingsModal = new SettingsModal({
 *     onRestart: function() { }
 * });
 */
class SettingsModal {
    constructor(options = {}) {
        this.onRestart = options.onRestart || (() => {});

        this.modal = document.getElementById('settings-modal');
        this.overlay = document.getElementById('settings-overlay');
        this.closeBtn = document.getElementById('close-settings-btn');
        this.restartBtn = document.getElementById('restart-btn');

        this.init();
    }

    init() {
        // Close modal handlers
        this.closeBtn.addEventListener('click', () => this.hide());
        this.overlay.addEventListener('click', () => this.hide());

        // Restart handler
        this.restartBtn.addEventListener('click', () => {
            this.onRestart();
            this.hide();
        });

        // Keyboard handler (ESC to close)
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && !this.modal.classList.contains('hidden')) {
                this.hide();
            }
        });
    }

    show() {
        this.modal.classList.remove('hidden');
        this.overlay.classList.remove('hidden');
    }

    hide() {
        this.modal.classList.add('hidden');
        this.overlay.classList.add('hidden');
    }

    toggle() {
        if (this.modal.classList.contains('hidden')) {
            this.show();
        } else {
            this.hide();
        }
    }
}
