// Міні-гра «Вища-нижча»: чи наступна карта вища або нижча за відкриту.
(() => {
    const RANKS = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
    const SUITS = [
        { symbol: '♠', red: false },
        { symbol: '♥', red: true },
        { symbol: '♦', red: true },
        { symbol: '♣', red: false }
    ];

    function drawCard() {
        return {
            rank: Math.floor(Math.random() * 13) + 2,
            suit: Math.floor(Math.random() * SUITS.length)
        };
    }

    function rankLabel(card) {
        return RANKS[card.rank - 2];
    }

    function suitOf(card) {
        return SUITS[card.suit];
    }

    function cardMarkup(card) {
        const suit = suitOf(card);
        const label = rankLabel(card);
        return `
            <div class="playing-card ${suit.red ? 'red' : ''}">
                <span class="card-corner top"><b>${label}</b><i>${suit.symbol}</i></span>
                <span class="card-center" aria-hidden="true">${suit.symbol}</span>
                <span class="card-corner bottom"><b>${label}</b><i>${suit.symbol}</i></span>
            </div>`;
    }

    function backMarkup() {
        return '<div class="playing-card back"><span aria-hidden="true">🎴</span></div>';
    }

    function cardName(card) {
        return `${rankLabel(card)}${suitOf(card).symbol}`;
    }

    Game.register({
        id: 'high-low',

        mount(root) {
            const betPad = new UI.BetPad({ amounts: [10, 50, 100], initial: 10 });
            const timers = [];

            let pick = 'higher';
            let firstCard = drawCard();
            let busy = false;
            let pending = null;

            const later = (fn, ms) => {
                const id = setTimeout(fn, ms);
                timers.push(id);
                return id;
            };

            root.innerHTML = `
                <div class="highlow-screen">
                    <div class="card-stage">
                        <div class="card-slot" id="card-first">${cardMarkup(firstCard)}</div>
                        <div class="card-arrow" aria-hidden="true">→</div>
                        <div class="card-slot card-hidden" id="card-second">${backMarkup()}</div>
                    </div>

                    <div class="result-banner" id="highlow-result">Обери напрямок і відкрий другу карту</div>
                    <div class="history-row" id="highlow-history"></div>

                    <div class="panel">
                        <div class="pick-grid" id="highlow-picks" role="group" aria-label="Прогноз наступної карти">
                            <button class="pick-btn selected" type="button" data-pick="higher" aria-pressed="true">
                                <span class="pick-emoji" aria-hidden="true">⬆️</span>
                                <span class="pick-label">Вища</span>
                                <span class="pick-note">наступна карта більша · x2</span>
                            </button>
                            <button class="pick-btn" type="button" data-pick="lower" aria-pressed="false">
                                <span class="pick-emoji" aria-hidden="true">⬇️</span>
                                <span class="pick-label">Нижча</span>
                                <span class="pick-note">наступна карта менша · x2</span>
                            </button>
                        </div>
                    </div>

                    ${betPad.html()}

                    <div class="roulette-actions">
                        <button class="btn btn-play" type="button" id="highlow-action">🃏 Відкрити карту</button>
                    </div>
                    <p class="hint">Однакова карта — нічия, ставка повертається. Талісман іноді перетягує невдалу карту.</p>
                </div>`;

            const firstEl = root.querySelector('#card-first');
            const secondEl = root.querySelector('#card-second');
            const picksEl = root.querySelector('#highlow-picks');
            const resultEl = root.querySelector('#highlow-result');
            const historyEl = root.querySelector('#highlow-history');
            const actionButton = root.querySelector('#highlow-action');

            betPad.mount(root);

            function renderHistory() {
                const items = Game.history('high-low').slice(0, 8);
                if (!items.length) {
                    historyEl.innerHTML = '<span class="history-label">Історія</span><span class="history-empty">поки порожньо</span>';
                    return;
                }
                historyEl.innerHTML = '<span class="history-label">Історія</span>' + items.map((item) => {
                    const tone = item.tie ? '' : item.win ? 'win' : 'lose';
                    return `<span class="history-chip plain ${tone}">${item.text}</span>`;
                }).join('');
            }

            function highlightPick() {
                picksEl.querySelectorAll('[data-pick]').forEach((button) => {
                    const active = button.dataset.pick === pick;
                    button.classList.toggle('selected', active);
                    button.setAttribute('aria-pressed', String(active));
                });
            }

            function setBusy(value, label = '🃏 Відкрити карту') {
                busy = value;
                actionButton.disabled = value;
                actionButton.textContent = label;
                betPad.setDisabled(value);
            }

            function resetPreview() {
                if (!root.isConnected) return;
                firstCard = drawCard();
                firstEl.innerHTML = cardMarkup(firstCard);
                secondEl.innerHTML = backMarkup();
                secondEl.classList.add('card-hidden');
                secondEl.classList.remove('revealed', 'flipping');
                firstEl.classList.remove('dimmed');
                setBusy(false);
                highlightPick();
                Sound.tick();
            }

            function finishRound(data) {
                pending = null;

                secondEl.innerHTML = cardMarkup(data.second);
                secondEl.classList.remove('card-hidden', 'flipping');
                secondEl.classList.add('revealed');
                firstEl.classList.add('dimmed');

                const text = `${cardName(data.first)} → ${cardName(data.second)}`;
                const pickName = data.pick === 'higher' ? 'вища' : 'нижча';

                if (data.tie) {
                    resultEl.className = 'result-banner push';
                    resultEl.textContent = `🤝 ${text} — нічия. Ставку повернуто.`;
                } else if (data.correct) {
                    resultEl.className = 'result-banner win';
                    resultEl.textContent = `🎉 ${text} — ${pickName}! Виграш ${UI.money(data.payout)}.`;
                } else {
                    resultEl.className = 'result-banner lose';
                    resultEl.textContent = `😭 ${text} — не вгадав. Ставка згоріла.`;
                }

                Game.pushHistory('high-low', {
                    text,
                    pick: data.pick,
                    win: data.correct,
                    tie: data.tie
                });
                renderHistory();

                Game.settleRound('high-low', data.bet, data.payout, {
                    allIn: data.allIn
                });

                betPad.updateBalance();
                actionButton.textContent = '🔁 Нова роздача...';
                actionButton.disabled = true;
                later(resetPreview, 1550);
            }

            function openCard() {
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

                let second = drawCard();
                let correct = pick === 'higher'
                    ? second.rank > firstCard.rank
                    : second.rank < firstCard.rank;
                let tie = second.rank === firstCard.rank;

                // Талісман іноді перетягує невдалу карту.
                if (!correct && !tie && Math.random() < Game.luck()) {
                    second = drawCard();
                    correct = pick === 'higher'
                        ? second.rank > firstCard.rank
                        : second.rank < firstCard.rank;
                    tie = second.rank === firstCard.rank;
                }

                const payout = correct ? bet * 2 : tie ? bet : 0;
                pending = {
                    bet,
                    allIn,
                    pick,
                    first: firstCard,
                    second,
                    correct,
                    tie,
                    payout
                };

                setBusy(true, '🃏 Відкриваємо...');
                secondEl.classList.add('flipping');
                resultEl.className = 'result-banner spinning';
                resultEl.textContent = 'Друга карта летить на стіл...';
                Sound.tick();

                later(() => Sound.tick(), 320);
                later(() => Sound.tick(), 640);

                later(() => {
                    if (!pending) return;
                    const data = pending;
                    secondEl.classList.remove('flipping');
                    finishRound(data);
                }, 980);
            }

            picksEl.addEventListener('click', (event) => {
                if (busy) return;
                const button = event.target.closest('[data-pick]');
                if (!button) return;

                pick = button.dataset.pick;
                Sound.click();
                highlightPick();
            });

            actionButton.addEventListener('click', openCard);
            renderHistory();

            return () => {
                timers.forEach((id) => clearTimeout(id));
                timers.length = 0;

                if (pending) {
                    const data = pending;
                    pending = null;
                    Game.pushHistory('high-low', {
                        text: `${cardName(data.first)} → ${cardName(data.second)}`,
                        pick: data.pick,
                        win: data.correct,
                        tie: data.tie
                    });
                    Game.settleRound('high-low', data.bet, data.payout, {
                        allIn: data.allIn
                    });
                }
            };
        }
    });
})();
