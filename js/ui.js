// Спільні UI-хелпери: формат грошей, тости, модальні панелі, ставка.
const UI = (() => {
    let activeSheet = null;

    function escapeHtml(value) {
        return String(value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    // Групування тисяч без залежності від локалі браузера.
    function money(amount) {
        const number = Math.round(Number(amount) || 0);
        const grouped = String(Math.abs(number)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
        return `${number < 0 ? '-' : ''}$${grouped}`;
    }

    function plural(count, forms) {
        const n = Math.abs(Math.round(Number(count) || 0));
        const mod10 = n % 10;
        const mod100 = n % 100;
        if (mod10 === 1 && mod100 !== 11) return forms[0];
        if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return forms[1];
        return forms[2];
    }

    function formatTime(ms) {
        const total = Math.max(0, Math.ceil(ms / 1000));
        const minutes = Math.floor(total / 60);
        const seconds = total % 60;
        return `${minutes}:${String(seconds).padStart(2, '0')}`;
    }

    function toast(message, options = {}) {
        const stack = document.getElementById('toasts');
        if (!stack) return;

        const {
            emoji = '💬',
            title = '',
            type = 'info',
            duration = 3200
        } = options;

        const el = document.createElement('div');
        el.className = `toast ${type}`;
        el.innerHTML = `
            <span class="toast-emoji" aria-hidden="true">${escapeHtml(emoji)}</span>
            <div class="toast-body">
                ${title ? `<div class="toast-title">${escapeHtml(title)}</div>` : ''}
                <div class="toast-msg">${escapeHtml(message)}</div>
            </div>`;
        stack.appendChild(el);

        // Не даємо тостам займати весь екран.
        while (stack.children.length > 3) {
            stack.firstElementChild.remove();
        }

        requestAnimationFrame(() => el.classList.add('show'));

        let removed = false;
        const remove = () => {
            if (removed) return;
            removed = true;
            el.classList.remove('show');
            setTimeout(() => el.remove(), 260);
        };

        const timer = setTimeout(remove, duration);
        el.addEventListener('click', () => {
            clearTimeout(timer);
            remove();
        });

        return el;
    }

    function closeSheet() {
        if (activeSheet) activeSheet.close();
    }

    // Універсальна нижня панель (на ПК — центроване вікно).
    function openSheet(options = {}) {
        if (activeSheet) activeSheet.close(true);

        const {
            title = '',
            subtitle = '',
            html = '',
            onMount = null,
            onClose = null
        } = options;

        const backdrop = document.createElement('div');
        backdrop.className = 'sheet-backdrop';
        backdrop.innerHTML = `
            <div class="sheet" role="dialog" aria-modal="true" aria-label="${escapeHtml(title)}">
                <div class="sheet-grab" aria-hidden="true"></div>
                <div class="sheet-head">
                    <div class="sheet-heading">
                        <div class="sheet-title">${escapeHtml(title)}</div>
                        ${subtitle ? `<div class="sheet-sub">${escapeHtml(subtitle)}</div>` : ''}
                    </div>
                    <button class="sheet-close" type="button" aria-label="Закрити">✕</button>
                </div>
                <div class="sheet-body">${html}</div>
            </div>`;

        document.body.appendChild(backdrop);
        document.body.classList.add('sheet-open');

        let closed = false;
        const close = (immediate = false) => {
            if (closed) return;
            closed = true;
            if (activeSheet && activeSheet.backdrop === backdrop) activeSheet = null;
            document.removeEventListener('keydown', onKey);
            backdrop.classList.remove('open');

            const finish = () => {
                backdrop.remove();
                if (!document.querySelector('.sheet-backdrop')) {
                    document.body.classList.remove('sheet-open');
                }
                if (typeof onClose === 'function') onClose();
            };

            if (immediate) finish();
            else setTimeout(finish, 260);
        };

        const onKey = (event) => {
            if (event.key === 'Escape') close();
        };
        document.addEventListener('keydown', onKey);

        backdrop.querySelector('.sheet-close').addEventListener('click', () => close());
        backdrop.addEventListener('click', (event) => {
            if (event.target === backdrop) close();
        });

        if (typeof onMount === 'function') {
            onMount(backdrop.querySelector('.sheet'), close);
        }

        requestAnimationFrame(() => backdrop.classList.add('open'));
        activeSheet = { backdrop, close };
        return close;
    }

    function confirm(options = {}) {
        const {
            title = 'Підтвердження',
            text = '',
            confirmText = 'Так',
            cancelText = 'Скасувати',
            danger = false
        } = options;

        let settled = false;
        return new Promise((resolve) => {
            let close = null;

            const finish = (value) => {
                if (settled) return;
                settled = true;
                if (close) close();
                resolve(value);
            };

            close = openSheet({
                title,
                html: `
                    <p class="confirm-text">${escapeHtml(text)}</p>
                    <div class="modal-actions">
                        <button class="btn btn-ghost" type="button" data-cancel>${escapeHtml(cancelText)}</button>
                        <button class="btn ${danger ? 'btn-danger' : 'btn-play'}" type="button" data-confirm>${escapeHtml(confirmText)}</button>
                    </div>`,
                onMount(sheet) {
                    sheet.querySelector('[data-cancel]').addEventListener('click', () => finish(false));
                    sheet.querySelector('[data-confirm]').addEventListener('click', () => finish(true));
                },
                onClose() {
                    if (!settled) {
                        settled = true;
                        resolve(false);
                    }
                }
            });
        });
    }

    // Панель ставки. Однакова для всіх міні-ігор.
    class BetPad {
        constructor(options = {}) {
            this.amounts = options.amounts || [10, 50, 100];
            this.initial = options.initial ?? 10;
            this.onChange = options.onChange || null;
            this.uid = `betpad-${Math.random().toString(36).slice(2, 9)}`;
            this.el = null;
            this.input = null;
        }

        html() {
            const chips = this.amounts.map((amount) => (
                `<button class="bet-chip" type="button" data-amount="${amount}">${money(amount)}</button>`
            )).join('');

            return `
                <div class="bet-pad" id="${this.uid}">
                    <div class="bet-pad-head">
                        <span>Ставка</span>
                        <span>Баланс: <b data-bet-balance>${money(0)}</b></span>
                    </div>
                    <div class="bet-input-wrap">
                        <span class="currency" aria-hidden="true">$</span>
                        <input class="bet-input" type="number" inputmode="numeric" min="1" step="1"
                            value="${this.initial}" aria-label="Сума ставки">
                    </div>
                    <div class="bet-chips">
                        ${chips}
                        <button class="bet-chip allin" type="button" data-allin>ALL IN</button>
                    </div>
                </div>`;
        }

        mount(root) {
            this.el = root.querySelector(`#${this.uid}`);
            if (!this.el) return this;
            this.input = this.el.querySelector('.bet-input');

            this.el.addEventListener('click', (event) => {
                const chip = event.target.closest('.bet-chip');
                if (!chip || chip.disabled) return;

                if (chip.hasAttribute('data-allin')) {
                    this.setValue(typeof Game !== 'undefined' ? Game.balance() : 0);
                } else {
                    this.setValue(Number(chip.dataset.amount));
                }
                this.input.focus({ preventScroll: true });
            });

            this.input.addEventListener('input', () => {
                // Лишаємо тільки цифри, без провідних нулів.
                const cleaned = this.input.value.replace(/[^\d]/g, '').slice(0, 9);
                if (cleaned !== this.input.value) this.input.value = cleaned;
                this.el.querySelector('.bet-input-wrap').classList.remove('invalid');
                this.sync();
                if (this.onChange) this.onChange(this.getValue());
            });

            this.input.addEventListener('blur', () => {
                if (this.input.value === '' || Number(this.input.value) < 1) {
                    this.setValue(this.initial);
                }
            });

            this.updateBalance();
            this.sync();
            return this;
        }

        getValue() {
            if (!this.input) return 0;
            const value = Math.floor(Number(this.input.value));
            return Number.isFinite(value) && value > 0 ? value : 0;
        }

        setValue(value) {
            if (!this.input) return;
            const next = Math.max(0, Math.floor(Number(value) || 0));
            this.input.value = next > 0 ? String(next) : '';
            this.sync();
            if (this.onChange) this.onChange(this.getValue());
        }

        isAllIn() {
            const value = this.getValue();
            return value > 0 && value >= Game.balance();
        }

        validate() {
            const value = this.getValue();
            if (value < 1) {
                return { ok: false, value, message: 'Введи суму ставки більше нуля.' };
            }
            if (value > Game.balance()) {
                return { ok: false, value, message: `Замало грошей. На балансі ${money(Game.balance())}.` };
            }
            return { ok: true, value, message: '' };
        }

        updateBalance() {
            if (!this.el) return;
            const label = this.el.querySelector('[data-bet-balance]');
            if (label && typeof Game !== 'undefined') label.textContent = money(Game.balance());
            this.sync();
        }

        sync() {
            if (!this.el) return;
            const value = this.getValue();
            const balance = typeof Game !== 'undefined' ? Game.balance() : 0;

            this.el.querySelectorAll('.bet-chip').forEach((chip) => {
                if (chip.hasAttribute('data-allin')) {
                    chip.classList.toggle('active', value > 0 && value === balance);
                } else {
                    chip.classList.toggle('active', Number(chip.dataset.amount) === value);
                }
            });
        }

        setDisabled(disabled) {
            if (!this.el) return;
            this.el.querySelectorAll('button, input').forEach((control) => {
                control.disabled = Boolean(disabled);
            });
        }

        flash() {
            if (!this.el) return;
            this.el.classList.remove('shake');
            void this.el.offsetWidth;
            this.el.classList.add('shake');
            const wrap = this.el.querySelector('.bet-input-wrap');
            if (wrap) wrap.classList.add('invalid');
        }
    }

    // Летючі емодзі для великих виграшів.
    function celebrate() {
        const emojis = ['💰', '✨', '🎉', '💎', '🤑', '🪙'];
        for (let i = 0; i < 14; i += 1) {
            const el = document.createElement('span');
            el.className = 'fx-emoji';
            el.textContent = emojis[Math.floor(Math.random() * emojis.length)];
            el.style.left = `${8 + Math.random() * 84}vw`;
            el.style.top = `${48 + Math.random() * 24}vh`;
            el.style.setProperty('--dx', `${(Math.random() - 0.5) * 100}px`);
            el.style.setProperty('--rot', `${(Math.random() - 0.5) * 360}deg`);
            el.style.setProperty('--dur', `${1.1 + Math.random() * 0.8}s`);
            el.style.setProperty('--delay', `${Math.random() * 0.25}s`);
            document.body.appendChild(el);
            setTimeout(() => el.remove(), 2400);
        }
    }

    // Показує суму, що прилетіла/зникла біля балансу.
    function balanceFloat(delta) {
        if (!delta) return;
        const pill = document.getElementById('balance-pill');
        if (!pill) return;
        const rect = pill.getBoundingClientRect();
        const el = document.createElement('span');
        el.className = 'balance-float';
        el.textContent = `${delta > 0 ? '+' : '−'}${money(Math.abs(delta))}`;
        el.style.color = delta > 0 ? 'var(--lime)' : 'var(--red)';
        el.style.left = `${Math.min(window.innerWidth - 80, Math.max(8, rect.left + rect.width / 2 - 25))}px`;
        el.style.top = `${rect.bottom + 6}px`;
        document.body.appendChild(el);
        setTimeout(() => el.remove(), 1100);

        pill.classList.remove('pop');
        void pill.offsetWidth;
        pill.classList.add('pop');
    }

    return {
        escapeHtml,
        money,
        plural,
        formatTime,
        toast,
        openSheet,
        closeSheet,
        confirm,
        BetPad,
        celebrate,
        balanceFloat
    };
})();
