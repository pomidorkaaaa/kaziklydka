// Міні-гра «Кості»: менше 7 або більше 7. Сума 7 — програш для обох.
(() => {
    const PIPS = {
        1: [4],
        2: [2, 6],
        3: [0, 4, 8],
        4: [0, 2, 6, 8],
        5: [0, 2, 4, 6, 8],
        6: [0, 2, 3, 5, 6, 8]
    };
    const ROLL_MS = 1150;

    function pipMarkup(value) {
        const visible = new Set(PIPS[value] || []);
        return Array.from({ length: 9 }, (_, index) => (
            `<span class="pip${visible.has(index) ? ' show' : ''}" aria-hidden="true"></span>`
        )).join('');
    }

    function rollDie() {
        return Math.floor(Math.random() * 6) + 1;
    }

    Game.register({
        id: 'dice',

        mount(root) {
            const betPad = new UI.BetPad({ amounts: [10, 50, 100], initial: 10 });
            const timers = [];

            let pick = 'under';
            let busy = false;
            let pending = null;

            const later = (fn, ms) => {
                const id = setTimeout(fn, ms);
                timers.push(id);
                return id;
            };

            root.innerHTML = `
                <div class="dice-screen">
                    <div class="dice-stage" id="dice-stage">
                        <div class="die" id="die-a" role="img" aria-label="Перша кістка"></div>
                        <div class="die" id="die-b" role="img" aria-label="Друга кістка"></div>
                    </div>

                    <div class="dice-total" id="dice-total">Сума: <b>—</b></div>
                    <div class="result-banner" id="dice-result">Обери «менше» чи «більше» та кидай кості</div>
                    <div class="history-row" id="dice-history"></div>

                    <div class="panel">
                        <div class="pick-grid" id="dice-picks" role="group" aria-label="Прогноз суми">
                            <button class="pick-btn selected" type="button" data-pick="under" aria-pressed="true">
                                <span class="pick-emoji" aria-hidden="true">⬇️</span>
                                <span class="pick-label">Менше 7</span>
                                <span class="pick-note">сума 2–6 · x2</span>
                            </button>
                            <button class="pick-btn" type="button" data-pick="over" aria-pressed="false">
                                <span class="pick-emoji" aria-hidden="true">⬆️</span>
                                <span class="pick-label">Більше 7</span>
                                <span class="pick-note">сума 8–12 · x2</span>
                            </button>
                        </div>
                    </div>

                    ${betPad.html()}

                    <div class="roulette-actions">
                        <button class="btn btn-play" type="button" id="dice-action">🎲 Кинути кості</button>
                    </div>
                    <p class="hint">Сума 7 — програш для обох ставок. Виплата x2. Талісмани іноді перекидають кості.</p>
                </div>`;

            const dieA = root.querySelector('#die-a');
            const dieB = root.querySelector('#die-b');
            const stage = root.querySelector('#dice-stage');
            const totalEl = root.querySelector('#dice-total');
            const picksEl = root.querySelector('#dice-picks');
            const resultEl = root.querySelector('#dice-result');
            const historyEl = root.querySelector('#dice-history');
            const actionButton = root.querySelector('#dice-action');

            betPad.mount(root);

            function renderDie(el, value) {
                el.innerHTML = pipMarkup(value);
                el.setAttribute('aria-label', `Кістка: ${value}`);
            }

            function renderDice(a, b) {
                renderDie(dieA, a);
                renderDie(dieB, b);
            }

            function setTotal(a, b) {
                totalEl.innerHTML = `Сума: <b>${a + b}</b>`;
            }

            function renderHistory() {
                const items = Game.history('dice').slice(0, 8);
                if (!items.length) {
                    historyEl.innerHTML = '<span class="history-label">Історія</span><span class="history-empty">поки порожньо</span>';
                    return;
                }
                historyEl.innerHTML = '<span class="history-label">Історія</span>' + items.map((item) => {
                    const label = item.pick === 'under' ? 'менше' : 'більше';
                    return `<span class="history-chip plain ${item.win ? 'win' : 'lose'}">${item.sum} · ${label}</span>`;
                }).join('');
            }

            function highlightPick() {
                picksEl.querySelectorAll('[data-pick]').forEach((button) => {
                    const active = button.dataset.pick === pick;
                    button.classList.toggle('selected', active);
                    button.setAttribute('aria-pressed', String(active));
                });
            }

            function setBusy(value) {
                busy = value;
                actionButton.disabled = value;
                actionButton.textContent = value ? '⏳ Кості летять...' : '🎲 Кинути кості';
                betPad.setDisabled(value);
            }

            function finishRoll(data) {
                pending = null;

                const [a, b] = data.dice;
                const sum = a + b;
                const won = data.payout > 0;

                stage.classList.remove('rolled');
                void stage.offsetWidth;
                stage.classList.add('rolled');

                renderDice(a, b);
                setTotal(a, b);

                resultEl.className = `result-banner ${won ? 'win' : 'lose'}`;
                if (sum === 7) {
                    resultEl.textContent = `🎲 Сума 7 — невдача для обох. Ставка ${UI.money(data.bet)} згоріла.`;
                } else {
                    const word = sum < 7 ? 'менше 7' : 'більше 7';
                    resultEl.textContent = won
                        ? `🎲 Сума ${sum} (${word}) — виграш ${UI.money(data.payout)}!`
                        : `🎲 Сума ${sum} (${word}) — не вгадав.`;
                }

                Game.pushHistory('dice', {
                    sum,
                    pick: data.pick,
                    win: won
                });
                renderHistory();

                Game.settleRound('dice', data.bet, data.payout, {
                    allIn: data.allIn
                });

                setBusy(false);
                betPad.updateBalance();
                Sound.coin();
            }

            function roll() {
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

                let a = rollDie();
                let b = rollDie();
                const wins = (x, y) => (pick === 'under' ? x + y < 7 : x + y > 7);

                // Талісман дає один перекид, якщо сума не влаштувала.
                if (!wins(a, b) && Math.random() < Game.luck()) {
                    a = rollDie();
                    b = rollDie();
                }

                const payout = wins(a, b) ? bet * 2 : 0;
                pending = { bet, payout, dice: [a, b], pick, allIn };

                resultEl.className = 'result-banner spinning';
                resultEl.textContent = 'Кості крутяться...';
                stage.classList.add('rolling');
                setBusy(true);
                Sound.spin();

                for (let i = 0; i < 10; i += 1) {
                    later(() => {
                        renderDice(rollDie(), rollDie());
                        Sound.tick();
                    }, 90 + i * 95);
                }

                later(() => {
                    if (!pending) return;
                    const data = pending;
                    stage.classList.remove('rolling');
                    stage.classList.remove('rolled');
                    finishRoll(data);
                }, ROLL_MS);
            }

            picksEl.addEventListener('click', (event) => {
                if (busy) return;
                const button = event.target.closest('[data-pick]');
                if (!button) return;

                pick = button.dataset.pick;
                Sound.click();
                highlightPick();
            });

            actionButton.addEventListener('click', roll);

            renderDice(3, 4);
            renderHistory();

            return () => {
                timers.forEach((id) => clearTimeout(id));
                timers.length = 0;

                // Вихід під час кидка: результат фіксується, ставка не зникає.
                if (pending) {
                    const data = pending;
                    pending = null;
                    const sum = data.dice[0] + data.dice[1];
                    Game.pushHistory('dice', {
                        sum,
                        pick: data.pick,
                        win: data.payout > 0
                    });
                    Game.settleRound('dice', data.bet, data.payout, {
                        allIn: data.allIn
                    });
                }
            };
        }
    });
})();
