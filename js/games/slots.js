// Міні-гра «Слоти»: три барабани, таблиця виграшів і рідкісний джекпот.
(() => {
    const SYMBOLS = [
        { emoji: '🍒', weight: 30, x3: 4 },
        { emoji: '🍋', weight: 25, x3: 6 },
        { emoji: '🍇', weight: 18, x3: 8 },
        { emoji: '🔔', weight: 12, x3: 12 },
        { emoji: '💎', weight: 8, x3: 20 },
        { emoji: '7️⃣', weight: 5, x3: 40 },
        { emoji: '🎰', weight: 2, x3: 100 }
    ];

    const STRIP_LENGTH = 12;
    const JACKPOT_CHANCE = 0.001; // 0,1% — рідкісний, але реальний
    const PAIR_MULTIPLIER = 1.2;

    function totalWeight() {
        return SYMBOLS.reduce((sum, symbol) => sum + symbol.weight, 0);
    }

    function randomSymbol() {
        let roll = Math.random() * totalWeight();
        for (let i = 0; i < SYMBOLS.length; i += 1) {
            roll -= SYMBOLS[i].weight;
            if (roll <= 0) return SYMBOLS[i].emoji;
        }
        return SYMBOLS[0].emoji;
    }

    function evaluate(results) {
        const [a, b, c] = results;

        if (a === b && b === c) {
            const symbol = SYMBOLS.find((item) => item.emoji === a);
            return {
                multiplier: symbol ? symbol.x3 : 0,
                kind: 'triple',
                jackpot: a === '🎰'
            };
        }

        if (a === b || b === c || a === c) {
            return { multiplier: PAIR_MULTIPLIER, kind: 'pair', jackpot: false };
        }

        return { multiplier: 0, kind: 'none', jackpot: false };
    }

    function generateResults() {
        if (Math.random() < JACKPOT_CHANCE) {
            return ['🎰', '🎰', '🎰'];
        }

        let results = [randomSymbol(), randomSymbol(), randomSymbol()];

        // Куплені талісмани інколи дають другу спробу — барабани крутяться ще раз.
        if (evaluate(results).multiplier === 0 && Math.random() < Game.luck()) {
            results = [randomSymbol(), randomSymbol(), randomSymbol()];
        }

        return results;
    }

    function randomStrip(finalSymbol) {
        const list = [];
        for (let i = 0; i < STRIP_LENGTH - 1; i += 1) {
            list.push(randomSymbol());
        }
        list.push(finalSymbol);
        return list;
    }

    function renderPaytable() {
        const rows = SYMBOLS.map((symbol) => `
            <div class="pay-row ${symbol.emoji === '🎰' ? 'jackpot-row' : ''}">
                <span>${symbol.emoji}${symbol.emoji}${symbol.emoji}</span>
                <b>x${symbol.x3}${symbol.emoji === '🎰' ? ' · ДЖЕКПОТ' : ''}</b>
            </div>`).join('');

        return `
            <details class="paytable">
                <summary>📋 Таблиця виграшів</summary>
                <div class="paytable-body">
                    ${rows}
                    <div class="pay-row">
                        <span>Будь-які дві однакові</span>
                        <b>x${PAIR_MULTIPLIER}</b>
                    </div>
                    <p class="pay-note">
                        Виплата рахується від ставки. Комбінація 🎰🎰🎰 — рідкісний джекпот.
                        Усі гроші віртуальні.
                    </p>
                </div>
            </details>`;
    }

    Game.register({
        id: 'slots',

        mount(root) {
            const betPad = new UI.BetPad({ amounts: [10, 50, 100], initial: 10 });
            let busy = false;
            let pending = null;
            const timers = [];

            const later = (fn, ms) => {
                const id = setTimeout(fn, ms);
                timers.push(id);
                return id;
            };

            root.innerHTML = `
                <div class="slots-screen">
                    <div class="slot-machine" id="slot-machine">
                        <div class="reels" id="slot-reels">
                            <div class="reel"><div class="reel-strip"></div></div>
                            <div class="reel"><div class="reel-strip"></div></div>
                            <div class="reel"><div class="reel-strip"></div></div>
                        </div>
                    </div>

                    <div class="slot-result" id="slot-result">Тисни «Крутити» і сподівайся на краще</div>
                    <div class="slot-history" id="slot-history"></div>

                    ${renderPaytable()}
                    ${betPad.html()}

                    <div class="roulette-actions">
                        <button class="btn btn-play" type="button" id="slots-spin">🎰 Крутити барабани</button>
                    </div>
                    <p class="hint">Три однакові — великий виграш. Дві однакові — x${PAIR_MULTIPLIER}. Джекпот трапляється рідко.</p>
                </div>`;

            const machine = root.querySelector('#slot-machine');
            const reels = Array.from(root.querySelectorAll('.reel'));
            const resultEl = root.querySelector('#slot-result');
            const historyEl = root.querySelector('#slot-history');
            const spinButton = root.querySelector('#slots-spin');

            betPad.mount(root);

            function stripHeight(strip) {
                const first = strip.querySelector('.reel-symbol');
                return first ? first.offsetHeight : 100;
            }

            function setStrip(reel, finalSymbol, animate = false, delay = 0) {
                const strip = reel.querySelector('.reel-strip');
                const list = randomStrip(finalSymbol);
                strip.innerHTML = list.map((symbol) => (
                    `<span class="reel-symbol">${symbol}</span>`
                )).join('');

                const height = stripHeight(strip);
                const target = -(STRIP_LENGTH - 1) * height;

                strip.style.transition = 'none';
                strip.style.transform = 'translateY(0)';

                if (!animate) {
                    strip.style.transform = `translateY(${target}px)`;
                    return;
                }

                void strip.offsetWidth;
                strip.style.transition = `transform 1.05s cubic-bezier(0.15, 0.72, 0.18, 1) ${delay}ms`;
                strip.style.transform = `translateY(${target}px)`;
            }

            function renderHistory() {
                const items = Game.history('slots').slice(0, 6);
                if (!items.length) {
                    historyEl.innerHTML = '';
                    return;
                }
                historyEl.innerHTML = '<span class="history-label">Останні</span>' + items.map((item) => (
                    `<span class="slot-history-chip ${item.win ? 'win' : ''}">${item.r.join('')}</span>`
                )).join('');
            }

            function setBusy(value) {
                busy = value;
                spinButton.disabled = value;
                spinButton.textContent = value ? '⏳ Барабани крутяться...' : '🎰 Крутити барабани';
                betPad.setDisabled(value);
            }

            function finishSpin(data) {
                pending = null;

                machine.classList.remove('spinning');
                reels.forEach((reel) => reel.classList.remove('win'));

                const won = data.payout > 0;
                let message = 'Не пощастило. Барабани впевнені, що ти повернешся.';

                if (data.jackpot) {
                    message = `🎉 ДЖЕКПОТ! Ти зірвав ${UI.money(data.payout)}!`;
                    machine.classList.add('jackpot');
                    Sound.jackpot();
                    UI.toast('Три 🎰 поспіль! Це джекпот. Бабуся вже телефонує журналістам.', {
                        emoji: '🎰',
                        title: 'ДЖЕКПОТ',
                        type: 'achievement',
                        duration: 6000
                    });
                    later(() => machine.classList.remove('jackpot'), 3600);
                } else if (data.kind === 'triple') {
                    message = `Три ${data.results[0]} — виграш ${UI.money(data.payout)}!`;
                } else if (data.kind === 'pair') {
                    message = `Дві однакові — виграш ${UI.money(data.payout)}!`;
                }

                resultEl.className = `slot-result ${won ? 'win' : 'lose'}${data.jackpot ? ' big' : ''}`;
                resultEl.textContent = message;

                if (won) {
                    reels.forEach((reel) => reel.classList.add('win'));
                    later(() => reels.forEach((reel) => reel.classList.remove('win')), 1200);
                }

                Game.pushHistory('slots', { r: data.results, win: won });
                renderHistory();

                Game.settleRound('slots', data.bet, data.payout, {
                    allIn: data.allIn,
                    jackpot: data.jackpot
                });

                setBusy(false);
                betPad.updateBalance();
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

                const results = generateResults();
                const evaluation = evaluate(results);
                const payout = Math.floor(bet * evaluation.multiplier);

                pending = {
                    bet,
                    payout,
                    results,
                    kind: evaluation.kind,
                    jackpot: evaluation.jackpot,
                    allIn
                };

                setBusy(true);
                machine.classList.add('spinning');
                resultEl.className = 'slot-result';
                resultEl.textContent = 'Барабани крутяться...';
                Sound.spin();

                reels.forEach((reel, index) => {
                    reel.classList.remove('win');
                    setStrip(reel, results[index], true, index * 160);
                });

                later(() => Sound.tick(), 1100);
                later(() => Sound.tick(), 1280);
                later(() => {
                    if (!pending) return;
                    finishSpin(pending);
                }, 1550);
            }

            spinButton.addEventListener('click', spin);

            // Початкові символи на барабанах.
            const initial = [randomSymbol(), randomSymbol(), randomSymbol()];
            reels.forEach((reel, index) => setStrip(reel, initial[index], false));
            renderHistory();

            // Якщо гравець пішов під час обертання — результат не губиться.
            return () => {
                timers.forEach((id) => clearTimeout(id));
                timers.length = 0;

                if (pending) {
                    const data = pending;
                    pending = null;
                    Game.pushHistory('slots', { r: data.results, win: data.payout > 0 });
                    Game.settleRound('slots', data.bet, data.payout, {
                        allIn: data.allIn,
                        jackpot: data.jackpot
                    });
                }
            };
        }
    });
})();
