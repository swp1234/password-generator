class PasswordGenerator {
    constructor() {
        this.currentPassword = '';
        this.history = this.loadHistory();
        this.init();
    }

    async init() {
        // Initialize i18n
        await i18n.loadTranslations(i18n.currentLang);

        // Setup UI
        this.setupEventListeners();
        this.generateNewPassword();
        this.updateHistoryUI();
        this.setupLanguageSelector();

        // Hide loader
        setTimeout(() => {
            const loader = document.getElementById('app-loader');
            if (loader) loader.classList.add('hidden');
        }, 300);
    }

    setupEventListeners() {
        // Generate button
        const generateBtn = document.getElementById('generate-btn');
        if (generateBtn) generateBtn.addEventListener('click', () => this.generateNewPassword());

        // Copy button
        const copyBtn = document.getElementById('copy-btn');
        if (copyBtn) copyBtn.addEventListener('click', () => this.copyToClipboard());

        // Password toggle
        const toggleBtn = document.getElementById('password-toggle-btn');
        if (toggleBtn) toggleBtn.addEventListener('click', () => this.togglePasswordVisibility());

        // Length slider
        const lengthSlider = document.getElementById('length-slider');
        if (lengthSlider) {
            lengthSlider.addEventListener('input', (e) => {
                const value = e.target.value;
                document.getElementById('length-value').textContent = value;
                this.generateNewPassword();
            });
        }

        // Checkboxes
        const checkboxes = document.querySelectorAll('.option-checkbox input[type="checkbox"]');
        checkboxes.forEach(checkbox => {
            checkbox.addEventListener('change', () => this.generateNewPassword());
        });

        // Clear history button
        const clearHistoryBtn = document.getElementById('clear-history-btn');
        if (clearHistoryBtn) {
            clearHistoryBtn.addEventListener('click', () => this.clearHistory());
        }

        // Ensure at least one character type is selected
        checkboxes.forEach(checkbox => {
            checkbox.addEventListener('change', () => {
                const checkedCount = Array.from(checkboxes).filter(cb => cb.checked).length;
                if (checkedCount === 0) {
                    checkbox.checked = true;
                    this.generateNewPassword();
                }
            });
        });
    }

    setupLanguageSelector() {
        const langToggle = document.getElementById('lang-toggle');
        const langMenu = document.getElementById('lang-menu');
        const langOptions = document.querySelectorAll('.lang-option');

        if (langToggle) {
            langToggle.addEventListener('click', () => {
                langMenu.classList.toggle('hidden');
            });
        }

        langOptions.forEach(option => {
            option.addEventListener('click', async (e) => {
                const lang = e.target.getAttribute('data-lang');
                await i18n.setLanguage(lang);
                i18n.updateUI();

                // Update active state
                langOptions.forEach(opt => opt.classList.remove('active'));
                e.target.classList.add('active');

                // Close menu
                langMenu.classList.add('hidden');

                // Regenerate password
                this.generateNewPassword();
            });
        });

        // Set active language on init
        const currentLang = i18n.getCurrentLanguage();
        const activeLangOption = Array.from(langOptions).find(opt => opt.getAttribute('data-lang') === currentLang);
        if (activeLangOption) activeLangOption.classList.add('active');
    }

    getCharacterSets() {
        const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        const lowercase = 'abcdefghijklmnopqrstuvwxyz';
        const numbers = '0123456789';
        const special = '!@#$%^&*()_+-=[]{}|;:,.<>?';

        let selected = '';
        const uppercaseCheck = document.getElementById('uppercase-check');
        const lowercaseCheck = document.getElementById('lowercase-check');
        const numbersCheck = document.getElementById('numbers-check');
        const specialCheck = document.getElementById('special-check');

        if (uppercaseCheck && uppercaseCheck.checked) selected += uppercase;
        if (lowercaseCheck && lowercaseCheck.checked) selected += lowercase;
        if (numbersCheck && numbersCheck.checked) selected += numbers;
        if (specialCheck && specialCheck.checked) selected += special;

        return selected || uppercase;
    }

    generateNewPassword() {
        const length = parseInt(document.getElementById('length-slider').value);
        const characters = this.getCharacterSets();

        let password = '';
        const array = new Uint32Array(length);
        crypto.getRandomValues(array);

        for (let i = 0; i < length; i++) {
            password += characters[array[i] % characters.length];
        }

        this.currentPassword = password;
        this.displayPassword(password);
        this.updateStrengthIndicator(password);
        this.addToHistory(password);
    }

    displayPassword(password) {
        const output = document.getElementById('password-output');
        const isHidden = output.textContent.includes('●');

        if (output) {
            if (isHidden) {
                output.textContent = '●'.repeat(password.length);
            } else {
                output.textContent = password;
            }
        }
    }

    togglePasswordVisibility() {
        const output = document.getElementById('password-output');
        const toggleIcon = document.getElementById('toggle-icon');

        if (!output || !toggleIcon) return;

        const isHidden = output.textContent.includes('●');

        if (isHidden) {
            output.textContent = this.currentPassword;
            toggleIcon.textContent = '🙈';
        } else {
            output.textContent = '●'.repeat(this.currentPassword.length);
            toggleIcon.textContent = '👁️';
        }
    }

    updateStrengthIndicator(password) {
        const fill = document.getElementById('strength-fill');
        const text = document.getElementById('strength-text');

        if (!fill || !text) return;

        const strength = this.calculateStrength(password);

        // Update fill width and color
        fill.style.width = `${strength.percentage}%`;

        // Remove all strength classes
        text.classList.remove('weak', 'fair', 'good', 'strong');

        // Add appropriate class
        text.classList.add(strength.level);
        text.textContent = strength.label;
    }

    calculateStrength(password) {
        let score = 0;
        const length = password.length;

        // Length scoring
        if (length >= 8) score += 20;
        if (length >= 12) score += 20;
        if (length >= 16) score += 20;
        if (length >= 24) score += 10;

        // Character variety
        if (/[a-z]/.test(password)) score += 10;
        if (/[A-Z]/.test(password)) score += 10;
        if (/[0-9]/.test(password)) score += 10;
        if (/[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(password)) score += 10;

        // Determine strength level
        let level, label;
        if (score < 25) {
            level = 'weak';
            label = i18n.t('strength.weak');
        } else if (score < 50) {
            level = 'fair';
            label = i18n.t('strength.fair');
        } else if (score < 75) {
            level = 'good';
            label = i18n.t('strength.good');
        } else {
            level = 'strong';
            label = i18n.t('strength.strong');
        }

        return {
            score: Math.min(score, 100),
            percentage: Math.min(score, 100),
            level: level,
            label: label
        };
    }

    async copyToClipboard() {
        try {
            await navigator.clipboard.writeText(this.currentPassword);

            // Show feedback
            const feedback = document.getElementById('copy-feedback');
            if (feedback) {
                feedback.classList.add('show');
                setTimeout(() => feedback.classList.remove('show'), 2000);
            }

            // Haptic feedback if available
            if (navigator.vibrate) {
                navigator.vibrate([100, 50, 100]);
            }
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    }

    addToHistory(password) {
        // Don't add duplicate
        if (this.history.length > 0 && this.history[0] === password) {
            return;
        }

        this.history.unshift(password);

        // Keep only last 5
        if (this.history.length > 5) {
            this.history = this.history.slice(0, 5);
        }

        this.saveHistory();
        this.updateHistoryUI();
    }

    saveHistory() {
        localStorage.setItem('password_history', JSON.stringify(this.history));
    }

    loadHistory() {
        const saved = localStorage.getItem('password_history');
        return saved ? JSON.parse(saved) : [];
    }

    updateHistoryUI() {
        const historyList = document.getElementById('history-list');
        const clearBtn = document.getElementById('clear-history-btn');

        if (!historyList) return;

        historyList.innerHTML = '';

        if (this.history.length === 0) {
            const empty = document.createElement('div');
            empty.className = 'history-empty';
            empty.setAttribute('data-i18n', 'messages.historyEmpty');
            empty.textContent = i18n.t('messages.historyEmpty');
            historyList.appendChild(empty);

            if (clearBtn) {
                clearBtn.disabled = true;
                clearBtn.style.opacity = '0.5';
                clearBtn.style.cursor = 'not-allowed';
            }
        } else {
            this.history.forEach((password, index) => {
                const item = this.createHistoryItem(password, index);
                historyList.appendChild(item);
            });

            if (clearBtn) {
                clearBtn.disabled = false;
                clearBtn.style.opacity = '1';
                clearBtn.style.cursor = 'pointer';
            }
        }
    }

    createHistoryItem(password, index) {
        const item = document.createElement('div');
        item.className = 'history-item';

        const passwordSpan = document.createElement('code');
        passwordSpan.className = 'history-password';
        passwordSpan.textContent = password;

        const copyBtn = document.createElement('button');
        copyBtn.className = 'history-copy-btn';
        copyBtn.textContent = '📋';
        copyBtn.title = i18n.t('buttons.copy');
        copyBtn.addEventListener('click', async () => {
            await navigator.clipboard.writeText(password);

            const feedback = document.getElementById('copy-feedback');
            if (feedback) {
                feedback.classList.add('show');
                setTimeout(() => feedback.classList.remove('show'), 2000);
            }
        });

        item.appendChild(passwordSpan);
        item.appendChild(copyBtn);

        return item;
    }

    clearHistory() {
        if (confirm(i18n.t('messages.confirmClear'))) {
            this.history = [];
            this.saveHistory();
            this.updateHistoryUI();
        }
    }
}

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        new PasswordGenerator();
    });
} else {
    new PasswordGenerator();
}
