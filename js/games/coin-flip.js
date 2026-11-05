// Міні-гра «Монетка»: орел або решка, виплата x2.
(() => {
    const SIDES = {
        heads: { label: 'Орел', emoji: '🦅' },
        tails: { label: 'Решка', emoji: '🔱' }
    };
    const FLIP_MS = 1650;

    Game.register({
        id: 'coin-flip',

        mount(root) {
            const betPad = new UI.BetPad({ amounts: [10, 50, 100], initial: 10 });
            const timers = [];

            let pick = 'heads';
            let busy = false;
            let rotation = 0;
            let pending = null;

            const later = (fn, ms) => {
                const id = setTimeout(fn, ms);
                timers.push(id);
                return id;
            };

            root.innerHTML = `
                <div class="coin-screen">
                    <div class="coin-stage">
                        <div class="coin-float" id="coin-float">
                            <div class="coin" id="coin" role="img" aria-label="Монетка">
                                <div class="coin-face coin-front" aria-hidden="true">🦅</div>
                                <div class="coin-face coin-back" aria-hidden="true">🔱</div>
                            </div>
                        </div>
                        <div class="coin-shadow" aria-hidden="true"></div>
                    </div>

                    <div class="result-banner" id="coin-result">Обери бік і підкинь монетку</div>
                    <div class="history-row" id="coin-history"></div>

                    <div class="panel">
                        <div class="pick-grid" id="coin-picks" role="group" aria-label="Бік монетки">
                            <button class="pick-btn selected" type="button" data-side="heads" aria-pressed="true">
                                <span class="pick-emoji" aria-hidden="true">🦅</span>
                                <span class="pick-label">Орел</span>
                                <span class="pick-note">виплата x2</span>
                            </button>
                            <button class="pick-btn" type="button" data-side="tails" aria-pressed="false">
                                <span class="pick-emoji" aria-hidden="true">🔱</span>
                                <span class="pick-label">Решка</span>
                                <span class="pick-note">виплата x2</span>
                            </button>
                        </div>
                    </div>

                    ${betPad.html()}

                    <div class="roulette-actions">
                        <button class="btn btn-play" type="button" id="coin-action">🪙 Підкинути монетку</button>
                    </div>
                    <p class="hint">50/50 і виплата x2. Талісмани іноді перекидають монетку, якщо вона впала не тим боком.</p>
                </div>`;

            const coin = root.querySelector('#coin');
            const coinFloat = root.querySelector('#coin-float');
            const picksEl = root.querySelector('#coin-picks');
            const resultEl = root.querySelector('#coin-result');
            const historyEl = root.querySelector('#coin-history');
            const actionButton = root.querySelector('#coin-action');

            betPad.mount(root);

            function renderHistory() {
                const items = Game.history('coin-flip').slice(0, 8);
                if (!items.length) {
                    historyEl.innerHTML = '<span class="history-label">Історія</span><span class="history-empty">поки порожньо</span>';
                    return;
                }
                historyEl.innerHTML = '<span class="history-label">Історія</span>' + items.map((item) => {
                    const side = SIDES[item.side] || SIDES.heads;
                    return `<span class="history-chip plain ${item.win ? 'win' : 'lose'}">${side.emoji} ${side.label}</span>`;
                }).join('');
            }

            function highlightPick() {
                picksEl.querySelectorAll('[data-side]').forEach((button) => {
                    const active = button.dataset.side === pick;
                    button.classList.toggle('selected', active);
                    button.setAttribute('aria-pressed', String(active));
                });
            }

            function setBusy(value) {
                busy = value;
                actionButton.disabled = value;
                actionButton.textContent = value ? '⏳ Монетка в повітрі...' : '🪙 Підкинути монетку';
                betPad.setDisabled(value);
            }

            function finishFlip(data) {
                pending = null;

                const side = SIDES[data.result];
                const won = data.payout > 0;

                coin.classList.remove('landed');
                void coin.offsetWidth;
                coin.classList.add('landed');

                resultEl.className = `result-banner ${won ? 'win' : 'lose'}`;
                resultEl.innerHTML = `🪙 Випав <b>${side.label}</b> · ${won ? `виграш ${UI.money(data.payout)}` : 'не пощастило'}`;

                Game.pushHistory('coin-flip', {
                    side: data.result,
                    win: won
                });
                renderHistory();

                Game.settleRound('coin-flip', data.bet, data.payout, {
                    allIn: data.allIn
                });

                setBusy(false);
                betPad.updateBalance();
                Sound.coin();
            }

            function flip() {
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

                let result = Math.random() < 0.5 ? 'heads' : 'tails';

                // Талісман дає один шанс перекинути невдалу монетку.
                if (result !== pick && Math.random() < Game.luck()) {
                    result = Math.random() < 0.5 ? 'heads' : 'tails';
                }

                const payout = result === pick ? bet * 2 : 0;
                pending = { bet, payout, result, allIn };

                const target = result === 'tails' ? 180 : 0;
                const current = ((rotation % 360) + 360) % 360;
                const delta = (target - current + 360) % 360;
                rotation += 360 * 5 + delta;

                coin.style.transition = `transform ${FLIP_MS}ms cubic-bezier(0.2, 0.9, 0.22, 1)`;
                coin.style.transform = `rotateY(${rotation}deg)`;

                coinFloat.classList.remove('flipping');
                void coinFloat.offsetWidth;
                coinFloat.classList.add('flipping');

                resultEl.className = 'result-banner spinning';
                resultEl.textContent = 'Монетка крутиться...';
                setBusy(true);
                Sound.spin();

                for (let i = 0; i < 9; i += 1) {
                    later(() => Sound.tick(), 120 + i * 165);
                }

                later(() => {
                    if (!pending) return;
                    finishFlip(pending);
                }, FLIP_MS);
            }

            picksEl.addEventListener('click', (event) => {
                if (busy) return;
                const button = event.target.closest('[data-side]');
                if (!button) return;

                pick = button.dataset.side;
                Sound.click();
                highlightPick();
            });

            actionButton.addEventListener('click', flip);

            renderHistory();

            return () => {
                timers.forEach((id) => clearTimeout(id));
                timers.length = 0;

                // Вихід під час польоту: раунд не зникає, ставка не губиться.
                if (pending) {
                    const data = pending;
                    pending = null;
                    Game.pushHistory('coin-flip', {
                        side: data.result,
                        win: data.payout > 0
                    });
                    Game.settleRound('coin-flip', data.bet, data.payout, {
                        allIn: data.allIn
                    });
                }
            };
        }
    });
})();
