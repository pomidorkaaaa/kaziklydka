// Міні-гра «Скретч-картка»: три приховані символи, які треба стерти.
(() => {
    const SYMBOLS = ['💎', '🍀', '⭐', '🍒', '🔔', '🪙'];
    const SCRATCH_RADIUS = 26;

    function drawSymbols() {
        return Array.from({ length: 3 }, () => SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)]);
    }

    function evaluate(symbols) {
        const counts = {};
        symbols.forEach((symbol) => {
            counts[symbol] = (counts[symbol] || 0) + 1;
        });
        const max = Math.max(...Object.values(counts));
        if (max >= 3) return { mult: 5, kind: 'triple' };
        if (max === 2) return { mult: 2, kind: 'pair' };
        return { mult: 0, kind: 'none' };
    }

    Game.register({
        id: 'scratch-card',

        mount(root) {
            const betPad = new UI.BetPad({ amounts: [10, 50, 100], initial: 10 });
            const timers = [];

            let pending = null;
            let busy = false;
            let drawing = false;
            let lastPoint = null;
            let lastCheck = 0;
            let dpr = 1;

            const later = (fn, ms) => {
                const id = setTimeout(fn, ms);
                timers.push(id);
                return id;
            };

            root.innerHTML = `
                <div class="scratch-screen">
                    <div class="scratch-card">
                        <div class="scratch-head">
                            <span>🎟️ Скретч-картка</span>
                            <b>3 символи</b>
                        </div>
                        <div class="scratch-board" id="scratch-board">
                            <div class="scratch-slots" id="scratch-slots">
                                ${[0, 1, 2].map((index) => `
                                    <div class="scratch-slot" data-slot="${index}">
                                        <span class="scratch-symbol" aria-hidden="true">❔</span>
                                    </div>`).join('')}
                            </div>
                            <canvas class="scratch-canvas" id="scratch-canvas"
                                aria-label="Захисний шар картки. Затисни і водь пальцем, щоб стерти."></canvas>
                        </div>
                    </div>

                    <div class="scratch-hint" id="scratch-hint">
                        Затисни і водь пальцем по картці
                        <button class="scratch-reveal" type="button" id="scratch-reveal">Показати все</button>
                    </div>

                    <div class="result-banner" id="scratch-result">Купи картку і зітри захисний шар</div>
                    <div class="history-row" id="scratch-history"></div>

                    <div class="panel">
                        <div class="scratch-paytable">
                            <div class="scratch-payline"><span>💎💎💎 Три однакові</span><b>x5</b></div>
                            <div class="scratch-payline"><span>💎💎🍀 Два однакові</span><b>x2</b></div>
                            <div class="scratch-payline"><span>💎🍀⭐ Усі різні</span><b>x0</b></div>
                        </div>
                    </div>

                    ${betPad.html()}

                    <div class="roulette-actions">
                        <button class="btn btn-play" type="button" id="scratch-action">🎟️ Купити картку</button>
                    </div>
                    <p class="hint">Кожна картка має три випадкові символи. Три однакові — x5, два однакові — x2. Талісмани іноді перемальовують невдалу картку.</p>
                </div>`;

            const board = root.querySelector('#scratch-board');
            const canvas = root.querySelector('#scratch-canvas');
            const ctx = canvas.getContext('2d');
            const slots = [...root.querySelectorAll('.scratch-slot')];
            const resultEl = root.querySelector('#scratch-result');
            const historyEl = root.querySelector('#scratch-history');
            const actionButton = root.querySelector('#scratch-action');
            const revealButton = root.querySelector('#scratch-reveal');
            const hintEl = root.querySelector('#scratch-hint');

            betPad.mount(root);
            revealButton.hidden = true;

            function renderHistory() {
                const items = Game.history('scratch-card').slice(0, 8);
                if (!items.length) {
                    historyEl.innerHTML = '<span class="history-label">Історія</span><span class="history-empty">поки порожньо</span>';
                    return;
                }
                historyEl.innerHTML = '<span class="history-label">Історія</span>' + items.map((item) => (
                    `<span class="history-chip plain ${item.win ? 'win' : 'lose'}">${item.symbols.join('')}</span>`
                )).join('');
            }

            function renderSlots(symbols) {
                slots.forEach((slot, index) => {
                    slot.classList.remove('win');
                    slot.querySelector('.scratch-symbol').textContent = symbols[index];
                });
            }

            function highlightWinners(symbols) {
                const counts = {};
                symbols.forEach((symbol) => {
                    counts[symbol] = (counts[symbol] || 0) + 1;
                });
                slots.forEach((slot, index) => {
                    slot.classList.toggle('win', counts[symbols[index]] >= 2);
                });
            }

            function drawFoil() {
                const width = board.clientWidth;
                const height = board.clientHeight;
                if (!width || !height) return;

                dpr = Math.min(window.devicePixelRatio || 1, 2);
                canvas.width = Math.floor(width * dpr);
                canvas.height = Math.floor(height * dpr);
                canvas.style.width = `${width}px`;
                canvas.style.height = `${height}px`;

                ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
                ctx.globalCompositeOperation = 'source-over';
                ctx.clearRect(0, 0, width, height);

                const gradient = ctx.createLinearGradient(0, 0, width, height);
                gradient.addColorStop(0, '#8e94ad');
                gradient.addColorStop(0.28, '#e7eaf6');
                gradient.addColorStop(0.52, '#a9afc8');
                gradient.addColorStop(0.74, '#f1f3fb');
                gradient.addColorStop(1, '#858ba4');
                ctx.fillStyle = gradient;
                ctx.fillRect(0, 0, width, height);

                ctx.save();
                ctx.globalAlpha = 0.16;
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 6;
                for (let x = -height; x < width + height; x += 22) {
                    ctx.beginPath();
                    ctx.moveTo(x, 0);
                    ctx.lineTo(x + height, height);
                    ctx.stroke();
                }
                ctx.restore();

                ctx.save();
                ctx.translate(width / 2, height / 2);
                ctx.rotate(-0.1);
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillStyle = 'rgba(28, 28, 48, 0.72)';
                ctx.font = `900 ${Math.max(16, Math.min(25, width / 10))}px "Segoe UI", system-ui, sans-serif`;
                ctx.fillText('СОТРИ', 0, 0);
                ctx.font = '700 8px "Segoe UI", system-ui, sans-serif';
                ctx.fillStyle = 'rgba(28, 28, 48, 0.45)';
                ctx.fillText('КАЗИНО-РОФЛ', 0, 20);
                ctx.restore();

                const sparkles = [[0.13, 0.2], [0.82, 0.14], [0.68, 0.8], [0.24, 0.82]];
                ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
                sparkles.forEach(([sx, sy]) => {
                    ctx.beginPath();
                    ctx.arc(sx * width, sy * height, 2.2, 0, Math.PI * 2);
                    ctx.fill();
                });
            }

            function resetCanvas() {
                canvas.classList.remove('done');
                lastPoint = null;
                drawing = false;
                drawFoil();
            }

            function scratchAt(clientX, clientY) {
                if (!pending || busy) return;

                const rect = canvas.getBoundingClientRect();
                const x = clientX - rect.left;
                const y = clientY - rect.top;

                ctx.globalCompositeOperation = 'destination-out';
                ctx.lineWidth = SCRATCH_RADIUS * 2;
                ctx.lineCap = 'round';
                ctx.lineJoin = 'round';

                if (lastPoint) {
                    ctx.beginPath();
                    ctx.moveTo(lastPoint.x, lastPoint.y);
                    ctx.lineTo(x, y);
                    ctx.stroke();
                }

                ctx.beginPath();
                ctx.arc(x, y, SCRATCH_RADIUS, 0, Math.PI * 2);
                ctx.fill();
                lastPoint = { x, y };
            }

            function checkScratch(force = false) {
                if (!pending || busy) return;
                const now = Date.now();
                if (!force && now - lastCheck < 120) return;
                lastCheck = now;

                const width = canvas.width;
                const height = canvas.height;
                if (!width || !height) return;

                let image;
                try {
                    image = ctx.getImageData(0, 0, width, height).data;
                } catch (error) {
                    return;
                }

                const cleared = [0, 0, 0];
                const total = [0, 0, 0];
                const step = 6;

                for (let y = 0; y < height; y += step) {
                    for (let x = 0; x < width; x += step) {
                        const region = Math.min(2, Math.floor((x * 3) / width));
                        total[region] += 1;
                        const alpha = image[(y * width + x) * 4 + 3];
                        if (alpha < 40) cleared[region] += 1;
                    }
                }

                const ratios = cleared.map((value, index) => (
                    total[index] ? value / total[index] : 0
                ));

                if (ratios.every((ratio) => ratio >= 0.24)) {
                    revealAll();
                }
            }

            function completeScratch(data) {
                if (!data) return;
                pending = null;
                busy = false;

                const won = data.payout > 0;
                const symbols = data.symbols.join('');

                highlightWinners(data.symbols);

                if (data.mult === 5) {
                    resultEl.className = 'result-banner win';
                    resultEl.textContent = `🎉 ${symbols} — три однакові! Виграш ${UI.money(data.payout)}.`;
                } else if (data.mult === 2) {
                    resultEl.className = 'result-banner win';
                    resultEl.textContent = `😃 ${symbols} — пара! Виграш ${UI.money(data.payout)}.`;
                } else {
                    resultEl.className = 'result-banner lose';
                    resultEl.textContent = `😐 ${symbols} — усі різні. Картка нещаслива.`;
                }

                Game.pushHistory('scratch-card', {
                    symbols: data.symbols,
                    win: won
                });
                renderHistory();

                Game.settleRound('scratch-card', data.bet, data.payout, {
                    allIn: data.allIn,
                    triple: data.mult === 5
                });

                actionButton.disabled = false;
                actionButton.textContent = '🔁 Ще картка';
                betPad.setDisabled(false);
                betPad.updateBalance();
                hintEl.firstChild.textContent = 'Затисни і водь пальцем по картці ';
                revealButton.hidden = true;
                Sound.coin();
            }

            function revealAll() {
                if (!pending || busy) return;
                busy = true;
                drawing = false;
                lastPoint = null;
                canvas.classList.add('done');
                actionButton.disabled = true;

                const data = pending;
                later(() => completeScratch(data), 260);
            }

            function startRound() {
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

                let symbols = drawSymbols();
                let outcome = evaluate(symbols);

                // Талісмани іноді перемальовують картку, якщо випали різні символи.
                if (outcome.mult === 0 && Math.random() < Game.luck()) {
                    symbols = drawSymbols();
                    outcome = evaluate(symbols);
                }

                pending = {
                    bet,
                    allIn,
                    symbols,
                    mult: outcome.mult,
                    payout: outcome.mult ? bet * outcome.mult : 0
                };

                busy = false;
                renderSlots(symbols);
                resultEl.className = 'result-banner spinning';
                resultEl.textContent = 'Стирай захисний шар...';
                actionButton.disabled = true;
                actionButton.textContent = '👆 Стирай картку';
                betPad.setDisabled(true);
                betPad.updateBalance();
                hintEl.firstChild.textContent = 'Водь пальцем, поки не відкриєш усі три символи ';
                revealButton.hidden = false;

                resetCanvas();
                Sound.tick();
            }

            canvas.addEventListener('pointerdown', (event) => {
                if (!pending || busy) return;
                drawing = true;
                lastPoint = null;
                try {
                    canvas.setPointerCapture(event.pointerId);
                } catch (error) {
                    // Safari може не підтримувати захоплення — не критично.
                }
                scratchAt(event.clientX, event.clientY);
                event.preventDefault();
            });

            canvas.addEventListener('pointermove', (event) => {
                if (!drawing || !pending || busy) return;
                scratchAt(event.clientX, event.clientY);
                checkScratch();
                event.preventDefault();
            });

            const stopDrawing = () => {
                if (!drawing) return;
                drawing = false;
                lastPoint = null;
                checkScratch(true);
            };

            canvas.addEventListener('pointerup', stopDrawing);
            canvas.addEventListener('pointercancel', stopDrawing);
            canvas.addEventListener('pointerleave', () => {
                lastPoint = null;
            });

            revealButton.addEventListener('click', revealAll);
            actionButton.addEventListener('click', startRound);

            renderHistory();

            // Малюємо фольгу після того, як браузер застосував розміри екрана.
            requestAnimationFrame(() => {
                if (root.isConnected) drawFoil();
            });

            return () => {
                timers.forEach((id) => clearTimeout(id));
                timers.length = 0;

                if (pending) {
                    const data = pending;
                    pending = null;
                    Game.pushHistory('scratch-card', {
                        symbols: data.symbols,
                        win: data.payout > 0
                    });
                    Game.settleRound('scratch-card', data.bet, data.payout, {
                        allIn: data.allIn,
                        triple: data.mult === 5
                    });
                }
            };
        }
    });
})();
