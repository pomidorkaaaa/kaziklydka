// Міні-гра «Рулетка з ботом»: водяний пістолет, один заряд із шести.
// Хто обіллється — той програє раунд. Без жорстокості, тільки вода.
(() => {
    const CHAMBERS = 6;

    const REPLIES = {
        idle: [
            'Один заряд на шість. Як у житті.',
            'Я не боюся води. Я боюся іржі.',
            'Тисни вже. У мене таймер на прання.',
            'Я проаналізував шість сценаріїв. Мені не сподобався жоден.',
            'Якщо що, я зроблений з водовідштовхувального пластику. Мабуть.',
            'Мої розробники казали: «Бот не намокне». Вони помилялися.'
        ],
        playerSafe: [
            'Клац! Це був не той заряд.',
            'Ти сухий. Поки що.',
            'Мої датчики вологості напружені.',
            'Гарний хід. Але статистика проти тебе.',
            'Я вже бачу краплі... у своїй уяві.',
            'Не хвилюйся, у мене є рушник. Один. Для себе.'
        ],
        botSafe: [
            'Клац! Мій корпус у безпеці.',
            'Я сухий, як інструкція до прання.',
            'Вода — не мій стиль. Я обираю іржу.',
            'Твоя черга, людиноподібний.',
            'Я викликав дощ? Ні, це просто напруга.',
            'Ще один клац — і я почну пишатися собою.'
        ],
        playerSoaked: [
            'Буль-буль! Ти офіційно мокрий.',
            'Освіжаючий душ за твій рахунок.',
            'Ти схожий на кота після ванни. Милий.',
            'Не хвилюйся, вода безкоштовна. Ставка — ні.',
            'Мої схеми кажуть: ти щойно попався.',
            'Рушник? Ні, це не входить у ставку.'
        ],
        botSoaked: [
            'Ой. Мої схеми намокли.',
            'Коротке замикання. Але я все ще харизматичний.',
            'Ти виграв. Я піду сушитися.',
            'Буль-буль... запам\'ятаю це.',
            'Мій пластик! Він же не водостійкий!',
            'Гаразд, ти сьогодні кращий. Але я ще повернуся.'
        ]
    };

    let lastReply = '';

    function pickReply(list) {
        let options = list;
        if (list.length > 1 && lastReply) options = list.filter((text) => text !== lastReply);
        const text = options[Math.floor(Math.random() * options.length)];
        lastReply = text;
        return text;
    }

    Game.register({
        id: 'bot-roulette',

        mount(root) {
            const betPad = new UI.BetPad({ amounts: [10, 50, 100], initial: 10 });
            const timers = [];
            let busy = false;
            let roundActive = false;
            let settled = true;
            let chamber = 0;
            let shot = 0;
            let turn = 'player';
            let pendingBet = 0;
            let pendingAllIn = false;

            const later = (fn, ms) => {
                const id = setTimeout(fn, ms);
                timers.push(id);
                return id;
            };

            root.innerHTML = `
                <div class="bot-screen">
                    <div class="duel-stage">
                        <div class="duelist" id="player-card">
                            <div class="duelist-emoji" aria-hidden="true">🧑</div>
                            <div class="duelist-name">Ти</div>
                            <div class="duelist-status" id="player-status">готовий</div>
                        </div>
                        <div class="duel-center">
                            <div class="splash" id="duel-splash" aria-hidden="true">💦</div>
                            <div class="water-pistol" id="water-pistol" aria-hidden="true">🔫<span>💦</span></div>
                            <div class="duel-vs">VS</div>
                        </div>
                        <div class="duelist bot" id="bot-card">
                            <div class="duelist-emoji" aria-hidden="true">🤖</div>
                            <div class="duelist-name">Бот-Рофлер</div>
                            <div class="duelist-status" id="bot-status">чекає</div>
                        </div>
                    </div>

                    <div class="bot-bubble" id="bot-bubble">«Я не боюся води. Я боюся іржі.»</div>

                    <div class="chamber-panel">
                        <div class="chamber-head">
                            <span>Барабан пістолета</span>
                            <b id="chance">1 заряд із 6</b>
                        </div>
                        <div class="chambers" id="chambers" aria-label="Шість слотів барабана"></div>
                    </div>

                    <div class="result-banner" id="bot-result">Обери ставку і тисни на курок</div>

                    ${betPad.html()}

                    <div class="roulette-actions">
                        <button class="btn btn-play" type="button" id="bot-action">💦 Тиснути</button>
                    </div>
                    <p class="hint">Один заряд води з шести. Хто обіллється — той платить ставку. Бот стріляє у відповідь автоматично.</p>
                </div>`;

            const playerCard = root.querySelector('#player-card');
            const botCard = root.querySelector('#bot-card');
            const playerStatus = root.querySelector('#player-status');
            const botStatus = root.querySelector('#bot-status');
            const bubble = root.querySelector('#bot-bubble');
            const chambersEl = root.querySelector('#chambers');
            const chanceEl = root.querySelector('#chance');
            const resultEl = root.querySelector('#bot-result');
            const actionButton = root.querySelector('#bot-action');
            const pistol = root.querySelector('#water-pistol');
            const splash = root.querySelector('#duel-splash');

            betPad.mount(root);

            function say(list) {
                bubble.textContent = `«${pickReply(list)}»`;
                bubble.classList.remove('pop');
                void bubble.offsetWidth;
                bubble.classList.add('pop');
            }

            function renderChambers() {
                const revealed = !roundActive && chamber > 0;
                chambersEl.innerHTML = Array.from({ length: CHAMBERS }, (_, index) => {
                    let className = 'chamber-dot';
                    let content = '•';

                    if (revealed && index === chamber - 1) {
                        className += ' loaded';
                        content = '💧';
                    } else if (index < shot) {
                        className += ' spent';
                        content = '·';
                    }

                    return `<span class="${className}" aria-hidden="true">${content}</span>`;
                }).join('');

                if (roundActive) {
                    const remaining = CHAMBERS - shot;
                    const percent = Math.round(100 / remaining);
                    chanceEl.textContent = `1 з ${remaining} · ${percent}%`;
                } else if (revealed) {
                    chanceEl.textContent = 'заряд спрацював';
                } else {
                    chanceEl.textContent = '1 заряд із 6';
                }
            }

            function updateTurn() {
                if (!roundActive) return;

                playerCard.classList.toggle('active', turn === 'player');
                botCard.classList.toggle('active', turn === 'bot');

                if (turn === 'player') {
                    playerStatus.textContent = 'твій хід';
                    botStatus.textContent = 'чекає';
                    actionButton.textContent = '💦 Тиснути';
                } else {
                    playerStatus.textContent = 'чекає';
                    botStatus.textContent = 'цілиться...';
                    actionButton.textContent = '🤖 Бот цілиться...';
                }

                actionButton.disabled = busy || turn !== 'player';
            }

            function splashAnimation() {
                splash.classList.remove('show');
                void splash.offsetWidth;
                splash.classList.add('show');
                pistol.classList.remove('shoot');
                void pistol.offsetWidth;
                pistol.classList.add('shoot');
                Sound.splash();
            }

            function finishRound(loser) {
                roundActive = false;
                busy = false;

                const playerLost = loser === 'player';
                const payout = playerLost ? 0 : pendingBet * 2;

                splashAnimation();
                renderChambers();

                if (playerLost) {
                    playerCard.classList.add('wet');
                    botCard.classList.remove('wet');
                    playerStatus.textContent = 'мокрий 💦';
                    botStatus.textContent = 'сухий 😎';
                    say(REPLIES.playerSoaked);
                    resultEl.className = 'result-banner lose';
                    resultEl.textContent = `💦 Тебе облило! Ставка ${UI.money(pendingBet)} згоріла.`;
                } else {
                    botCard.classList.add('wet');
                    playerCard.classList.remove('wet');
                    botStatus.textContent = 'мокрий 💦';
                    playerStatus.textContent = 'сухий 😎';
                    say(REPLIES.botSoaked);
                    resultEl.className = 'result-banner win';
                    resultEl.textContent = `🎉 Бот мокрий! Ти виграв ${UI.money(payout)}.`;
                }

                Game.settleRound('bot-roulette', pendingBet, payout, {
                    allIn: pendingAllIn
                });
                settled = true;

                actionButton.textContent = '🔁 Ще раунд';
                actionButton.disabled = false;
                betPad.setDisabled(false);
                betPad.updateBalance();
                playerCard.classList.remove('active');
                botCard.classList.remove('active');
                chanceEl.textContent = playerLost ? 'ти був мокрим' : 'бот був мокрим';
            }

            function resolveShot(who) {
                shot += 1;
                pistol.classList.remove('shoot');

                if (shot === chamber) {
                    finishRound(who);
                    return;
                }

                renderChambers();

                if (who === 'player') {
                    playerStatus.textContent = 'сухий 😎';
                    say(REPLIES.playerSafe);
                    turn = 'bot';
                    busy = true;
                    updateTurn();
                    later(botPull, 1050);
                } else {
                    botStatus.textContent = 'сухий 🤖';
                    say(REPLIES.botSafe);
                    turn = 'player';
                    busy = false;
                    updateTurn();
                }
            }

            function pull(who) {
                busy = true;
                updateTurn();

                if (who === 'player') {
                    playerStatus.textContent = 'тисне...';
                    actionButton.textContent = '⏳ Тиснеш...';
                } else {
                    botStatus.textContent = 'тисне...';
                }

                pistol.classList.remove('shoot');
                void pistol.offsetWidth;
                pistol.classList.add('shoot');
                Sound.tick();

                later(() => resolveShot(who), 520);
            }

            function botPull() {
                if (!roundActive) return;
                turn = 'bot';
                pull('bot');
            }

            function startRound() {
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

                pendingBet = bet;
                pendingAllIn = allIn;
                settled = false;
                roundActive = true;
                chamber = Math.floor(Math.random() * CHAMBERS) + 1;
                shot = 0;
                turn = 'player';
                busy = false;

                playerCard.classList.remove('wet', 'active');
                botCard.classList.remove('wet', 'active');
                splash.classList.remove('show');
                resultEl.className = 'result-banner spinning';
                resultEl.textContent = 'Раунд почався. Твій хід!';
                playerStatus.textContent = 'твій хід';
                botStatus.textContent = 'чекає';
                actionButton.textContent = '💦 Тиснути';

                say(REPLIES.idle);
                renderChambers();
                betPad.setDisabled(true);
                betPad.updateBalance();

                pull('player');
            }

            actionButton.addEventListener('click', () => {
                if (busy) return;

                if (!roundActive) {
                    startRound();
                } else if (turn === 'player') {
                    pull('player');
                }
            });

            renderChambers();

            return () => {
                timers.forEach((id) => clearTimeout(id));
                timers.length = 0;

                // Незавершений раунд не карає гравця: ставка повертається.
                if (roundActive && !settled) {
                    Game.addMoney(pendingBet);
                    settled = true;
                }
            };
        }
    });
})();
