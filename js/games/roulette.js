// Міні-гра «Рулетка»: ставка на колір (x2) або число 0–36 (x35).
(() => {
    const WHEEL_ORDER = [
        0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30,
        8, 23, 10, 5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7,
        28, 12, 35, 3, 26
    ];
    const RED_NUMBERS = new Set([1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36]);
    const SEGMENT = 360 / 37;
    const SPIN_MS = 4050;

    function colorOf(number) {
        if (number === 0) return 'green';
        return RED_NUMBERS.has(number) ? 'red' : 'black';
    }

    function polar(cx, cy, radius, degrees) {
        const rad = (degrees * Math.PI) / 180;
        return {
            x: cx + radius * Math.cos(rad),
            y: cy + radius * Math.sin(rad)
        };
    }

    function segmentPath(startDeg, endDeg, outer, inner) {
        const a = polar(100, 100, outer, startDeg);
        const b = polar(100, 100, outer, endDeg);
        const c = polar(100, 100, inner, endDeg);
        const d = polar(100, 100, inner, startDeg);
        const large = endDeg - startDeg > 180 ? 1 : 0;
        return [
            `M ${a.x.toFixed(2)} ${a.y.toFixed(2)}`,
            `A ${outer} ${outer} 0 ${large} 1 ${b.x.toFixed(2)} ${b.y.toFixed(2)}`,
            `L ${c.x.toFixed(2)} ${c.y.toFixed(2)}`,
            `A ${inner} ${inner} 0 ${large} 0 ${d.x.toFixed(2)} ${d.y.toFixed(2)}`,
            'Z'
        ].join(' ');
    }

    function buildWheelSvg() {
        const colors = { red: '#c21f33', black: '#1c1c30', green: '#167a46' };

        const segments = WHEEL_ORDER.map((number, index) => {
            const center = -90 + index * SEGMENT;
            const start = center - SEGMENT / 2;
            const end = center + SEGMENT / 2;
            const textPoint = polar(100, 100, 70, center);
            return `
                <path d="${segmentPath(start, end, 95, 32)}"
                    fill="${colors[colorOf(number)]}" stroke="#07070f" stroke-width="0.7"></path>
                <text x="${textPoint.x.toFixed(2)}" y="${textPoint.y.toFixed(2)}"
                    fill="#ffffff" font-size="6.2" font-weight="700"
                    font-family="Segoe UI, system-ui, sans-serif"
                    text-anchor="middle" dominant-baseline="middle"
                    pointer-events="none">${number}</text>`;
        }).join('');

        return `
            <svg class="wheel-svg" viewBox="0 0 200 200" role="img"
                aria-label="Колесо європейської рулетки з числами від 0 до 36">
                <defs>
                    <linearGradient id="roulette-rim" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0" stop-color="#ffd24a"></stop>
                        <stop offset="0.5" stop-color="#ff2e97"></stop>
                        <stop offset="1" stop-color="#28f0ff"></stop>
                    </linearGradient>
                    <radialGradient id="roulette-hub" cx="35%" cy="30%" r="75%">
                        <stop offset="0" stop-color="#2d2748"></stop>
                        <stop offset="1" stop-color="#100e1c"></stop>
                    </radialGradient>
                </defs>
                <circle cx="100" cy="100" r="98" fill="#080810"
                    stroke="url(#roulette-rim)" stroke-width="4"></circle>
                <g>${segments}</g>
                <circle cx="100" cy="100" r="31.5" fill="url(#roulette-hub)"
                    stroke="#ffd24a" stroke-opacity="0.35" stroke-width="1.2"></circle>
                <circle id="roulette-ball" cx="100" cy="16" r="3.4" fill="#f5f7ff"
                    stroke="#9aa0c0" stroke-width="0.6" opacity="0"
                    style="transition:opacity .2s ease"></circle>
            </svg>`;
    }

    Game.register({
        id: 'roulette',

        mount(root) {
            const betPad = new UI.BetPad({ amounts: [10, 50, 100], initial: 10 });
            let mode = 'color';
            let selectedColor = 'red';
            let selectedNumber = null;
            let busy = false;
            let wheelRotation = 0;
            let pending = null;

            const timers = [];
            const later = (fn, ms) => {
                const id = setTimeout(fn, ms);
                timers.push(id);
                return id;
            };

            root.innerHTML = `
                <div class="roulette-screen">
                    <div class="wheel-stage">
                        <div class="wheel-pointer" aria-hidden="true">▼</div>
                        <div class="wheel-rotor" id="roulette-rotor">${buildWheelSvg()}</div>
                        <div class="wheel-hub" aria-hidden="true">🎰</div>
                    </div>

                    <div class="result-banner" id="roulette-result">Обери колір або число та крути колесо</div>
                    <div class="history-row" id="roulette-history"></div>

                    <div class="panel">
                        <div class="segmented" id="roulette-modes" role="tablist" aria-label="Тип ставки">
                            <button class="seg active" type="button" data-mode="color" role="tab">Колір · x2</button>
                            <button class="seg" type="button" data-mode="number" role="tab">Число · x35</button>
                        </div>
                        <div id="roulette-controls"></div>
                    </div>

                    ${betPad.html()}

                    <div class="roulette-actions">
                        <button class="btn btn-play" type="button" id="roulette-spin">🎡 Крутити колесо</button>
                    </div>
                    <p class="hint">Червоне або чорне — x2. Точне число — x35. Нуль зелений і платить лише за число 0.</p>
                </div>`;

            const rotor = root.querySelector('#roulette-rotor');
            const resultEl = root.querySelector('#roulette-result');
            const historyEl = root.querySelector('#roulette-history');
            const controls = root.querySelector('#roulette-controls');
            const spinButton = root.querySelector('#roulette-spin');
            const modes = root.querySelector('#roulette-modes');

            betPad.mount(root);

            function renderControls() {
                if (mode === 'color') {
                    controls.innerHTML = `
                        <div class="color-grid">
                            <button class="color-btn red ${selectedColor === 'red' ? 'selected' : ''}"
                                type="button" data-color="red" aria-pressed="${selectedColor === 'red'}">
                                <span aria-hidden="true">🔴</span>
                                ЧЕРВОНЕ
                                <b>виплата x2</b>
                            </button>
                            <button class="color-btn black ${selectedColor === 'black' ? 'selected' : ''}"
                                type="button" data-color="black" aria-pressed="${selectedColor === 'black'}">
                                <span aria-hidden="true">⚫</span>
                                ЧОРНЕ
                                <b>виплата x2</b>
                            </button>
                        </div>`;
                    return;
                }

                const numbers = [0];
                for (let i = 1; i <= 36; i += 1) numbers.push(i);

                controls.innerHTML = `<div class="number-grid">${numbers.map((number) => {
                    const color = colorOf(number);
                    const colorName = color === 'red' ? 'червоне' : color === 'black' ? 'чорне' : 'зеро';
                    return `
                        <button class="num-cell ${number === 0 ? 'zero' : color} ${selectedNumber === number ? 'selected' : ''}"
                            type="button" data-number="${number}"
                            aria-label="Число ${number}, ${colorName}"
                            aria-pressed="${selectedNumber === number}">${number}</button>`;
                }).join('')}</div>`;
            }

            function renderHistory() {
                const items = Game.history('roulette').slice(0, 8);
                if (!items.length) {
                    historyEl.innerHTML = '<span class="history-label">Історія</span><span class="history-empty">поки порожньо</span>';
                    return;
                }
                historyEl.innerHTML = '<span class="history-label">Історія</span>' + items.map((item) => (
                    `<span class="history-chip ${item.color}">${item.n}</span>`
                )).join('');
            }

            function setBusy(value) {
                busy = value;
                spinButton.disabled = value;
                spinButton.textContent = value ? '⏳ Крутиться...' : '🎡 Крутити колесо';
                betPad.setDisabled(value);
            }

            function finishSpin(data) {
                pending = null;

                const color = colorOf(data.result);
                const colorName = color === 'red' ? 'Червоне' : color === 'black' ? 'Чорне' : 'Зеро';
                const won = data.payout > 0;

                resultEl.className = `result-banner ${won ? 'win' : 'lose'}`;
                resultEl.innerHTML = `
                    <span class="result-number ${color}">${data.result}</span>
                    <span>${colorName} · ${won ? `виграш ${UI.money(data.payout)}` : 'не пощастило'}</span>`;

                Game.pushHistory('roulette', { n: data.result, color });
                renderHistory();

                Game.settleRound('roulette', data.bet, data.payout, {
                    allIn: data.allIn,
                    zero: data.result === 0
                });

                setBusy(false);
                betPad.updateBalance();
            }

            function spin() {
                if (busy) return;

                if (mode === 'number' && selectedNumber === null) {
                    betPad.flash();
                    UI.toast('Спочатку обери число від 0 до 36.', {
                        emoji: '🔢',
                        title: 'Ставка',
                        type: 'info'
                    });
                    Sound.nope();
                    return;
                }

                const check = betPad.validate();
                if (!check.ok) {
                    betPad.flash();
                    UI.toast(check.message, {
                        emoji: '💸',
                        title: 'Ставка',
                        type: 'lose'
                    });
                    Sound.nope();
                    return;
                }

                const bet = check.value;
                const allIn = bet === Game.balance();

                if (!Game.takeBet(bet)) {
                    betPad.flash();
                    return;
                }

                let result = Math.floor(Math.random() * 37);
                const isWinning = (number) => (
                    mode === 'color' ? colorOf(number) === selectedColor : number === selectedNumber
                );

                // Талісмани інколи дають другу спробу: колесо крутиться ще раз.
                if (!isWinning(result) && Math.random() < Game.luck()) {
                    result = Math.floor(Math.random() * 37);
                }

                const payout = isWinning(result)
                    ? (mode === 'color' ? bet * 2 : bet * 35)
                    : 0;

                pending = { bet, payout, result, allIn };

                const ball = root.querySelector('#roulette-ball');
                if (ball) {
                    const point = polar(100, 100, 84, -90 + result * SEGMENT);
                    ball.setAttribute('cx', point.x.toFixed(2));
                    ball.setAttribute('cy', point.y.toFixed(2));
                    ball.setAttribute('opacity', '1');
                }

                const desired = (360 - result * SEGMENT) % 360;
                const current = ((wheelRotation % 360) + 360) % 360;
                const delta = (desired - current + 360) % 360;
                const jitter = (Math.random() * 0.6 - 0.3) * SEGMENT;

                wheelRotation += 360 * 5 + delta + jitter;
                rotor.style.transition = 'transform 4s cubic-bezier(0.16, 0.84, 0.24, 1)';
                rotor.style.transform = `rotate(${wheelRotation}deg)`;

                setBusy(true);
                resultEl.className = 'result-banner spinning';
                resultEl.textContent = 'Кулька біжить...';
                Sound.spin();

                for (let i = 0; i < 12; i += 1) {
                    later(() => Sound.tick(), 250 + i * 290);
                }

                later(() => {
                    if (!pending) return;
                    finishSpin(pending);
                }, SPIN_MS);
            }

            controls.addEventListener('click', (event) => {
                if (busy) return;

                const colorButton = event.target.closest('[data-color]');
                if (colorButton && mode === 'color') {
                    selectedColor = colorButton.dataset.color;
                    Sound.click();
                    renderControls();
                    return;
                }

                const numberButton = event.target.closest('[data-number]');
                if (numberButton && mode === 'number') {
                    selectedNumber = Number(numberButton.dataset.number);
                    Sound.click();
                    renderControls();
                }
            });

            modes.addEventListener('click', (event) => {
                if (busy) return;
                const button = event.target.closest('[data-mode]');
                if (!button || button.dataset.mode === mode) return;

                mode = button.dataset.mode;
                modes.querySelectorAll('[data-mode]').forEach((tab) => {
                    tab.classList.toggle('active', tab.dataset.mode === mode);
                });
                Sound.click();
                renderControls();
            });

            spinButton.addEventListener('click', spin);

            renderControls();
            renderHistory();

            // Якщо гравець вийшов під час обертання — раунд все одно зараховується.
            return () => {
                timers.forEach((id) => clearTimeout(id));
                timers.length = 0;

                if (pending) {
                    const data = pending;
                    pending = null;
                    Game.pushHistory('roulette', { n: data.result, color: colorOf(data.result) });
                    Game.settleRound('roulette', data.bet, data.payout, {
                        allIn: data.allIn,
                        zero: data.result === 0
                    });
                }
            };
        }
    });
})();
