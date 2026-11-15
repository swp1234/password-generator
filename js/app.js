class PasswordGenerator {
    constructor() {
        this.currentPassword = '';
        this.history = this.loadHistory();
        this.init();
    }

    async init() {
        try {
            await i18n.setLanguage(i18n.currentLang);
        } catch (e) {
            console.warn('i18n init failed:', e);
        }

        this.setupEventListeners();
        this.generateNewPassword(false);
        this.updateHistoryUI();
        this.setupLanguageSelector();
        this.renderCuratedResources();
        initRelatedFunnels();

        const loader = document.getElementById('app-loader');
        if (loader) {
            loader.classList.add('hidden');
            setTimeout(() => loader.remove(), 300);
        }
    }

    setupEventListeners() {
        // Generate button
        const generateBtn = document.getElementById('generate-btn');
        if (generateBtn) generateBtn.addEventListener('click', () => this.generateNewPassword(true));

        // Share & Story card buttons
        document.getElementById('saveCardBtn')?.addEventListener('click', () => this.generateStoryCard());
        document.getElementById('shareTwitterBtn')?.addEventListener('click', () => this.shareOnX());
        document.getElementById('shareUrlBtn')?.addEventListener('click', () => this.copyShareUrl('button'));
        document.getElementById('share-float-btn')?.addEventListener('click', () => this.shareNativeOrCopy());

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
                this.generateNewPassword(true);
            });
        }

        // Checkboxes
        const checkboxes = document.querySelectorAll('.option-checkbox input[type="checkbox"]');
        checkboxes.forEach(checkbox => {
            checkbox.addEventListener('change', () => {
                const checkedCount = Array.from(checkboxes).filter(cb => cb.checked).length;
                if (checkedCount === 0) {
                    checkbox.checked = true;
                }
                this.generateNewPassword(true);
            });
        });

        // Clear history button
        const clearHistoryBtn = document.getElementById('clear-history-btn');
        if (clearHistoryBtn) {
            clearHistoryBtn.addEventListener('click', () => this.clearHistory());
        }
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

                // Refresh UI, curated books & related links without synthetic tracking
                this.generateNewPassword(false);
                this.renderCuratedResources();
                initRelatedFunnels();
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

    generateNewPassword(isUserAction = true) {
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

        if (isUserAction && typeof gtag === 'function') {
            const strength = this.calculateStrength(password);
            const lang = i18n.getCurrentLanguage();
            gtag('event', 'test_start', {
                app_name: 'password-generator',
                lang
            });
            gtag('event', 'test_complete', {
                app_name: 'password-generator',
                result_type: `strength_${strength.level}`,
                lang
            });
        }
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

            // Vibrate feedback if available
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
        const btn = document.getElementById('clear-history-btn');
        if (!this.clearConfirmPending) {
            this.clearConfirmPending = true;
            this.showToast(this.tr('messages.confirmClear', 'Tap again to clear history'));
            if (btn) btn.dataset.confirm = 'pending';
            clearTimeout(this.clearConfirmTimer);
            this.clearConfirmTimer = setTimeout(() => {
                this.clearConfirmPending = false;
                if (btn) delete btn.dataset.confirm;
            }, 3500);
            return;
        }
        clearTimeout(this.clearConfirmTimer);
        this.clearConfirmPending = false;
        if (btn) delete btn.dataset.confirm;
        this.history = [];
        this.saveHistory();
        this.updateHistoryUI();
    }

    tr(key, fallback) {
        const val = i18n.t(key);
        return val && val !== key ? val : fallback;
    }

    getShareUrl() {
        const lang = i18n.getCurrentLanguage() || 'en';
        return `${window.location.origin}/password-generator/?lang=${encodeURIComponent(lang)}&utm_source=share`;
    }

    showToast(message) {
        let toast = document.getElementById('pwd-toast');
        if (!toast) {
            toast = document.createElement('div');
            toast.id = 'pwd-toast';
            toast.className = 'pwd-toast';
            toast.setAttribute('role', 'status');
            toast.setAttribute('aria-live', 'polite');
            document.body.appendChild(toast);
        }
        toast.textContent = message;
        toast.classList.add('visible');
        clearTimeout(this.toastTimer);
        this.toastTimer = setTimeout(() => toast.classList.remove('visible'), 2200);
    }

    async copyShareUrl(methodLabel = 'clipboard') {
        const shareUrl = this.getShareUrl();
        const copied = this.tr('share.copiedUrl', 'Tool link copied!');
        if (navigator.clipboard && navigator.clipboard.writeText) {
            try { await navigator.clipboard.writeText(shareUrl); } catch (e) {}
        } else {
            const ta = document.createElement('textarea');
            ta.value = shareUrl;
            ta.style.position = 'fixed';
            ta.style.opacity = '0';
            document.body.appendChild(ta);
            ta.select();
            try { document.execCommand('copy'); } catch (e) {}
            ta.remove();
        }
        this.showToast(copied);
        if (typeof gtag === 'function') {
            gtag('event', 'share', {
                method: methodLabel,
                app_name: 'password-generator',
                lang: i18n.getCurrentLanguage()
            });
        }
    }

    async shareNativeOrCopy() {
        const shareUrl = this.getShareUrl();
        const title = this.tr('header.title', document.title);
        if (navigator.share) {
            try {
                await navigator.share({ title, url: shareUrl });
                if (typeof gtag === 'function') {
                    gtag('event', 'share', {
                        method: 'native',
                        app_name: 'password-generator',
                        lang: i18n.getCurrentLanguage()
                    });
                }
                return;
            } catch (e) {
                if (e && e.name === 'AbortError') return;
            }
        }
        await this.copyShareUrl('clipboard');
    }

    shareOnX() {
        const shareUrl = this.getShareUrl();
        const text = this.tr('share.tweetText', 'Check your password hygiene locally with DopaBrain Password Generator.');
        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareUrl)}`, '_blank', 'noopener,noreferrer');
        if (typeof gtag === 'function') {
            gtag('event', 'share', {
                method: 'twitter',
                app_name: 'password-generator',
                lang: i18n.getCurrentLanguage()
            });
        }
    }

    generateStoryCard() {
        const canvas = document.getElementById('shareCanvas');
        const saveBtn = document.getElementById('saveCardBtn');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const lang = i18n.getCurrentLanguage() || 'en';
        const strength = this.calculateStrength(this.currentPassword || '');
        if (saveBtn) {
            saveBtn.disabled = true;
            saveBtn.textContent = this.tr('share.savingCard', 'Creating card...');
        }

        const w = 1080;
        const h = 1920;
        canvas.width = w;
        canvas.height = h;

        const grad = ctx.createLinearGradient(0, 0, w, h);
        grad.addColorStop(0, '#09111f');
        grad.addColorStop(0.5, '#0f2942');
        grad.addColorStop(1, '#102a43');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, w, h);

        ctx.fillStyle = 'rgba(56, 189, 248, 0.14)';
        ctx.beginPath();
        ctx.arc(540, 620, 310, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = 'rgba(56, 189, 248, 0.72)';
        ctx.lineWidth = 10;
        ctx.beginPath();
        ctx.arc(540, 620, 240, 0, Math.PI * 2);
        ctx.stroke();

        ctx.textAlign = 'center';
        ctx.fillStyle = '#7dd3fc';
        ctx.font = 'bold 34px system-ui, -apple-system, sans-serif';
        ctx.fillText(this.tr('share.cardBadge', 'DOPABRAIN SECURITY TOOL'), 540, 170);

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 64px system-ui, -apple-system, sans-serif';
        ctx.fillText(this.tr('share.cardTitle', 'Password Security Profile'), 540, 270);

        ctx.fillStyle = '#bae6fd';
        ctx.font = '34px system-ui, -apple-system, sans-serif';
        ctx.fillText(this.tr('share.cardSubtitle', 'Local Web Crypto entropy & hygiene check'), 540, 330);

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 74px system-ui, -apple-system, sans-serif';
        ctx.fillText(strength.label || 'Strong', 540, 645);

        ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.18)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(110, 1020, 860, 420, 32);
        ctx.fill();
        ctx.stroke();

        ctx.textAlign = 'left';
        ctx.fillStyle = '#7dd3fc';
        ctx.font = 'bold 28px system-ui, -apple-system, sans-serif';
        ctx.fillText(this.tr('share.cardStrengthLabel', 'STRENGTH RATING'), 175, 1110);

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 46px system-ui, -apple-system, sans-serif';
        ctx.fillText(strength.label || 'Very Strong', 175, 1175);

        ctx.fillStyle = '#7dd3fc';
        ctx.font = 'bold 28px system-ui, -apple-system, sans-serif';
        ctx.fillText(this.tr('share.cardPrivacyLabel', 'PRIVACY GUARANTEE'), 175, 1295);

        ctx.fillStyle = '#e0f2fe';
        ctx.font = 'bold 42px system-ui, -apple-system, sans-serif';
        ctx.fillText(this.tr('share.cardPrivacyValue', '100% Local Web Crypto API'), 175, 1360);

        ctx.textAlign = 'center';
        ctx.fillStyle = '#e2e8f0';
        ctx.font = 'bold 34px system-ui, -apple-system, sans-serif';
        ctx.fillText(this.tr('share.cardCta', 'Generate free at dopabrain.com/password-generator'), 540, 1730);

        ctx.fillStyle = '#94a3b8';
        ctx.font = '26px system-ui, -apple-system, sans-serif';
        ctx.fillText(`dopabrain.com/password-generator/?lang=${lang}`, 540, 1795);

        try {
            const dataUrl = canvas.toDataURL('image/png');
            const link = document.createElement('a');
            link.download = 'dopabrain-password-security.png';
            link.href = dataUrl;
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (e) {}

        this.showToast(this.tr('share.savedCard', 'Security check card saved!'));
        if (typeof gtag === 'function') {
            gtag('event', 'save_image', {
                app_name: 'password-generator',
                result_type: `strength_${strength.level}`,
                lang
            });
        }

        if (saveBtn) {
            setTimeout(() => {
                saveBtn.disabled = false;
                saveBtn.textContent = this.tr('share.saveCard', 'Save Security Card');
            }, 600);
        }
    }

    renderCuratedResources() {
        const container = document.getElementById('curated-resources-card');
        if (!container) return;
        const curated = i18n.t('curated');
        if (!curated || typeof curated !== 'object' || !Array.isArray(curated.books)) return;

        const lang = i18n.getCurrentLanguage() || 'en';
        container.textContent = '';

        const header = document.createElement('div');
        header.className = 'curated-resources-header';
        const titleEl = document.createElement('h3');
        titleEl.className = 'curated-resources-title';
        titleEl.textContent = curated.title || '';
        const subEl = document.createElement('p');
        subEl.className = 'curated-resources-subtitle';
        subEl.textContent = curated.subtitle || '';
        header.appendChild(titleEl);
        header.appendChild(subEl);

        const list = document.createElement('div');
        list.className = 'curated-resources-list';

        curated.books.forEach((book) => {
            const link = document.createElement('a');
            link.className = 'curated-book-link';
            link.href = book.url;
            link.target = '_blank';
            link.rel = 'sponsored noopener noreferrer';

            const meta = document.createElement('div');
            meta.className = 'curated-book-meta';

            const bTitle = document.createElement('span');
            bTitle.className = 'curated-book-title';
            bTitle.textContent = book.title || '';

            const bAuthor = document.createElement('span');
            bAuthor.className = 'curated-book-author';
            bAuthor.textContent = book.author || '';

            const bNote = document.createElement('span');
            bNote.className = 'curated-book-note';
            bNote.textContent = book.note || '';

            meta.appendChild(bTitle);
            meta.appendChild(bAuthor);
            meta.appendChild(bNote);

            const badge = document.createElement('span');
            badge.className = 'curated-book-badge';
            badge.textContent = curated.badge || 'Book';

            link.appendChild(meta);
            link.appendChild(badge);

            link.addEventListener('click', () => {
                if (typeof gtag === 'function') {
                    gtag('event', 'curated_resource_click', {
                        app_name: 'password-generator',
                        resource_type: 'book',
                        item_id: book.id || 'book',
                        lang
                    });
                }
            });

            list.appendChild(link);
        });

        const noteEl = document.createElement('p');
        noteEl.className = 'curated-affiliate-note';
        noteEl.textContent = curated.affiliateNote || '';

        container.appendChild(header);
        container.appendChild(list);
        container.appendChild(noteEl);
    }
}

// Theme Toggle
const themeToggle = document.getElementById('theme-toggle');
if (themeToggle) {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
    themeToggle.textContent = savedTheme === 'light' ? '🌙' : '☀️';
    themeToggle.addEventListener('click', () => {
        const current = document.documentElement.getAttribute('data-theme');
        const next = current === 'light' ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', next);
        localStorage.setItem('theme', next);
        themeToggle.textContent = next === 'light' ? '🌙' : '☀️';
    });
}

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        new PasswordGenerator();
    });
} else {
    new PasswordGenerator();
}


// Funnel bridge & language preservation
function initRelatedFunnels() {
    const urlParams = new URLSearchParams(window.location.search);
    const lang = (window.i18n && typeof window.i18n.getCurrentLanguage === 'function' ? window.i18n.getCurrentLanguage() : null) || urlParams.get('lang') || 'ko';
    const base = (window.location.origin && window.location.origin !== 'null') ? window.location.origin : 'https://dopabrain.com';
    document.querySelectorAll('.related-grid a').forEach(link => {
        const baseHref = link.getAttribute('data-base-href') || link.getAttribute('href');
        if (!baseHref || baseHref.startsWith('http') || baseHref.startsWith('#')) return;
        try {
            const url = new URL(baseHref, base);
            url.searchParams.set('lang', lang);
            if (!url.searchParams.has('source')) url.searchParams.set('source', 'password_generator_result');
            link.setAttribute('href', url.pathname + url.search);
        } catch(e) {}
        if (!link.dataset.trackedCta) {
            link.dataset.trackedCta = 'true';
            link.addEventListener('click', () => {
                const liveLang = (window.i18n && typeof window.i18n.getCurrentLanguage === 'function' ? window.i18n.getCurrentLanguage() : null) || new URLSearchParams(window.location.search).get('lang') || 'ko';
                if (typeof gtag === 'function') {
                    gtag('event', 'content_cta_click', {
                        cta_surface: 'password_generator_related',
                        destination: link.getAttribute('href'),
                        source: 'password_generator',
                        lang: liveLang
                    });
                }
            });
        }
    });
}
