// Міні-гра «Колесо фортуни»: 15 секторів із множниками від x0 до x10.
(() => {
    const SEGMENTS = [
        0, 0, 0.5, 0, 1, 0, 0, 10, 0, 0.5, 0, 2, 0, 1, 0
    ].map((value, index) => ({
        value,
        label: value === 0 && index === 6 ? '🕊️' : `x${value === 0 ? '0' : value}`,
        pigeon: value === 0 && index === 6
    }));

    const SEGMENT = 360 / SEGMENTS.length;
    const SPIN_MS = 3850;

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

    function fillFor(segment, index) {
        if (segment.value === 10) return '#ffd24a';
        if (segment.value === 2) return '#c02a67';
        if (segment.value === 1) return '#1d6b78';
        if (segment.value === 0.5) return '#4b2a75';
        return index % 2 === 0 ? '#1b1b30' : '#242440';
    }

    function buildWheelSvg() {
        const segments = SEGMENTS.map((segment, index) => {
            const center = -90 + index * SEGMENT;
            const start = center - SEGMENT / 2;
            const end = center + SEGMENT / 2;
            const point = polar(100, 100, 73, center);
            const fill = fillFor(segment, index);
            const textColor = segment.value === 10 ? '#2a1a00' : '#ffffff';
            return `
                <path d="${segmentPath(start, end, 95, 34)}"
                    fill="${fill}" stroke="#07070f" stroke-width="0.8"></path>
                <text x="${point.x.toFixed(2)}" y="${point.y.toFixed(2)}"
                    fill="${textColor}" font-size="${segment.value === 10 ? 7.8 : 6.5}" font-weight="800"
                    font-family="Segoe UI, system-ui, sans-serif"
                    text-anchor="middle" dominant-baseline="middle"
                    pointer-events="none">${segment.label}</text>`;
        }).join('');

        const dots = SEGMENTS.map((segment, index) => {
            const center = -90 + index * SEGMENT;
            const point = polar(100, 100, 89, center);
            return `<circle cx="${point.x.toFixed(2)}" cy="${point.y.toFixed(2)}" r="1.4"
                fill="${segment.value === 10 ? '#ffd24a' : 'rgba(255,255,255,0.4)'}"></circle>`;
        }).join('');

        return `
            <svg class="fortune-svg" viewBox="0 0 200 200" role="img"
                aria-label="Колесо фортуни з множниками від x0 до x10">
                <defs>
                    <linearGradient id="fortune-rim" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0" stop-color="#ffd24a"></stop>
                        <stop offset="0.45" stop-color="#ff2e97"></stop>
                        <stop offset="1" stop-color="#28f0ff"></stop>
                    </linearGradient>
                    <radialGradient id="fortune-hub" cx="35%" cy="30%" r="75%">
                        <stop offset="0" stop-color="#30264b"></stop>
                        <stop offset="1" stop-color="#0f0d1a"></stop>
                    </radialGradient>
                </defs>
                <circle cx="100" cy="100" r="98" fill="#080810"
                    stroke="url(#fortune-rim)" stroke-width="4"></circle>
                <g>${segments}</g>
                <g>${dots}</g>
                <circle cx="100" cy="100" r="32" fill="url(#fortune-hub)"
                    stroke="#ffd24a" stroke-opacity="0.45" stroke-width="1.2"></circle>
            </svg>`;
    }

    function valueLabel(value) {
        if (value === 0) return 'x0';
        if (value === 0.5) return 'x0,5';
        return `x${value}`;
    }

    Game.register({
        id: 'fortune-wheel',

        mount(root) {
            const betPad = new UI.BetPad({ amounts: [10, 50, 100], initial: 10 });
            const timers = [];

            let rotation = 0;
            let busy = false;
            let pending = null;

            const later = (fn, ms) => {
                const id = setTimeout(fn, ms);
                timers.push(id);
                return id;
            };

            root.innerHTML = `
                <div class="fortune-screen">
                    <div class="fortune-stage">
                        <div class="fortune-pointer" aria-hidden="true">▼</div>
                        <div class="fortune-rotor" id="fortune-rotor">${buildWheelSvg()}</div>
                        <div class="fortune-hub" aria-hidden="true">🍀</div>
                    </div>

                    <div class="result-banner" id="fortune-result">Крути колесо та лови множник</div>
                    <div class="history-row" id="fortune-history"></div>

                    <div class="panel">
                        <div class="fortune-paytable">
                            <span class="fortune-pay win">x10</span>
                            <span class="fortune-pay win">x2</span>
                            <span class="fortune-pay">x1</span>
                            <span class="fortune-pay half">x0,5</span>
                            <span class="fortune-pay zero">x0</span>
                        </div>
                    </div>

                    ${betPad.html()}

                    <div class="roulette-actions">
                        <button class="btn btn-play" type="button" id="fortune-action">🍀 Крутити колесо</button>
                    </div>
                    <p class="hint">Виплата = ставка × множник. x0,5 повертає половину, x1 — усю ставку. На одному секторі сидить голуб.</p>
                </div>`;

            const rotor = root.querySelector('#fortune-rotor');
            const resultEl = root.querySelector('#fortune-result');
            const historyEl = root.querySelector('#fortune-history');
            const actionButton = root.querySelector('#fortune-action');

            betPad.mount(root);

            function renderHistory() {
                const items = Game.history('fortune-wheel').slice(0, 8);
                if (!items.length) {
                    historyEl.innerHTML = '<span class="history-label">Історія</span><span class="history-empty">поки порожньо</span>';
                    return;
                }
                historyEl.innerHTML = '<span class="history-label">Історія</span>' + items.map((item) => {
                    const tone = item.payout > item.bet ? 'win' : item.payout < item.bet ? 'lose' : '';
                    return `<span class="history-chip plain ${tone}">${item.label}</span>`;
                }).join('');
            }

            function setBusy(value) {
                busy = value;
                actionButton.disabled = value;
                actionButton.textContent = value ? '⏳ Колесо крутиться...' : '🍀 Крутити колесо';
                betPad.setDisabled(value);
            }

            function finishSpin(data) {
                pending = null;

                const segment = SEGMENTS[data.index];
                const payout = data.payout;
                const label = valueLabel(segment.value);

                if (payout > data.bet) {
                    resultEl.className = 'result-banner win';
                    resultEl.textContent = `🎉 ${label} — виграш ${UI.money(payout)}!`;
                } else if (payout < data.bet) {
                    resultEl.className = 'result-banner lose';
                    if (segment.pigeon) {
                        resultEl.textContent = `🕊️ Голуб поцупив ставку. Нуль.`;
                    } else if (segment.value === 0.5) {
                        resultEl.textContent = `😐 ${label} — повернули половину: ${UI.money(payout)}.`;
                    } else {
                        resultEl.textContent = `😐 ${label} — не пощастило.`;
                    }
                } else {
                    resultEl.className = 'result-banner push';
                    resultEl.textContent = `🤝 ${label} — ставка повернулася. Нічия.`;
                }

                Game.pushHistory('fortune-wheel', {
                    index: data.index,
                    label: segment.pigeon ? '🕊️' : label,
                    value: segment.value,
                    bet: data.bet,
                    payout
                });
                renderHistory();

                Game.settleRound('fortune-wheel', data.bet, payout, {
                    allIn: data.allIn
                });

                setBusy(false);
                betPad.updateBalance();
                Sound.coin();
            }

            function spin() {
                if (busy) return;

                const check = betPad.validate();
                if (!check.ok) {
                    betPad.flash();
                    Sound.nope();
                    UI.toast(check.message, {
                        emoji: '💸',
                        title: 'Ставка',
                        type: 'lose'
                    });
                    return;
                }

                const bet = check.value;
                const allIn = bet === Game.balance();

                if (!Game.takeBet(bet)) {
                    betPad.flash();
                    return;
                }

                let index = Math.floor(Math.random() * SEGMENTS.length);

                // Талісман може перекрутити невдалий сектор один раз.
                if (SEGMENTS[index].value < 1 && Math.random() < Game.luck()) {
                    index = Math.floor(Math.random() * SEGMENTS.length);
                }

                const segment = SEGMENTS[index];
                const payout = Math.floor(bet * segment.value);
                pending = { bet, allIn, index, payout };

                const desired = (360 - index * SEGMENT) % 360;
                const current = ((rotation % 360) + 360) % 360;
                const delta = (desired - current + 360) % 360;
                const jitter = (Math.random() * 0.5 - 0.25) * SEGMENT;

                rotation += 360 * 6 + delta + jitter;
                rotor.style.transition = 'transform 3.8s cubic-bezier(0.16, 0.84, 0.24, 1)';
                rotor.style.transform = `rotate(${rotation}deg)`;

                setBusy(true);
                resultEl.className = 'result-banner spinning';
                resultEl.textContent = 'Колесо набирає обертів...';
                Sound.spin();

                for (let i = 0; i < 12; i += 1) {
                    later(() => Sound.tick(), 220 + i * 280);
                }

                later(() => {
                    if (!pending) return;
                    finishSpin(pending);
                }, SPIN_MS);
            }

            actionButton.addEventListener('click', spin);
            renderHistory();

            return () => {
                timers.forEach((id) => clearTimeout(id));
                timers.length = 0;

                if (pending) {
                    const data = pending;
                    pending = null;
                    const segment = SEGMENTS[data.index];
                    Game.pushHistory('fortune-wheel', {
                        index: data.index,
                        label: segment.pigeon ? '🕊️' : valueLabel(segment.value),
                        value: segment.value,
                        bet: data.bet,
                        payout: data.payout
                    });
                    Game.settleRound('fortune-wheel', data.bet, data.payout, {
                        allIn: data.allIn
                    });
                }
            };
        }
    });
})();
