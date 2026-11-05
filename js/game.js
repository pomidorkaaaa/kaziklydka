// ============================================================
// ЯДРО ГРИ: баланс, ставки, статистика, досягнення, рофл-події.
// Міні-ігри реєструються через Game.register() у js/games/*.js
// ============================================================

// Рофл-події — окремий масив (50 жартів).
const ROFL_JOKES = [
    "Голуб сів на колесо рулетки й виграв. Тепер він твій фінансовий радник.",
    "Бабуся сказала: «Гроші — не головне». Ти перевірив. Вона мала рацію.",
    "Твій гаманець видав звук, схожий на скрип дверей у гуртожитку.",
    "Бабусін борщ сьогодні смачніший за твої ставки. Це не комплімент борщу.",
    "Ти не програв. Ти просто зробив благодійний внесок у кишенькове казино.",
    "Казино надіслало листівку: «Дякуємо за участь. Не дзвоніть нам».",
    "Голуб забрав твою монетку. Каже, що це був кредит.",
    "Твоя інтуїція пішла на перерву. Обіцяла повернутися з печивом.",
    "Бабуся запитала, чи ти вже купив їй дачу. Ти сказав: «Наступного разу».",
    "Твій талісман удачі виявився звичайним камінцем. Гарним, але камінцем.",
    "У цьому казино немає годинника. Тільки відчуття, що ти тут занадто довго.",
    "Ставка була геніальною. Просто колесо не читало твоїх думок.",
    "Ти виграв би більше, якби поставив на голуба. Але хто ж знав.",
    "Голуб сказав «курли», що мовою казино означає «ти мій клієнт».",
    "Твої гроші пішли у відпустку. Без тебе. Надовго.",
    "Бабуся молилася за твій баланс. Навіть вона не всесильна.",
    "Ти не бомж. Ти бомж з досвідом. Це вже щось.",
    "Колесо крутилося так довго, що встигло подорослішати.",
    "Барабани сказали «дзинь». Твій гаманець сказав «ой».",
    "У бабусі є план: ти заробляєш, вона витрачає. План виконується.",
    "Твій фінансовий план сьогодні — доїсти суп і лягти спати.",
    "Голуби вже впізнають тебе на вулиці. Вони радіють.",
    "Ти поставив на червоне. Всесвіт обрав чорне. Всесвіт токсичний.",
    "Статистика каже, що тобі щастить. Статистика часто жартує.",
    "Бабуся дала б тобі більше, але в неї теж є мінімальна ставка.",
    "Твій хом'як дивився на баланс і мовчки пішов у колесо.",
    "Казино-рофл: тут програють навіть ті, хто просто зайшов подивитися.",
    "Ти наблизився до мільйона. Залишилося ще трохи й один бабусин спадок.",
    "Голуб украв твою удачу. Пропонує викупити за $100.",
    "Твоя ставка була як борщ без сметани — майже, але не те.",
    "Бабуся сказала «не грай». Ти не послухав. Вона вже готує лекцію.",
    "Ти вгадав колір! Але не той, на який ставив.",
    "У світі казино-рофл ти легенда. Місцева. Дуже місцева.",
    "Твій баланс схожий на погоду в листопаді: мінливий і холодний.",
    "Не хвилюйся, гроші — це лише папірці. Віртуальні папірці. Але все ж.",
    "Колесо фортуни сьогодні оберталося навколо тебе. На жаль, не в твій бік.",
    "Ти пообіцяв бабусі не грати. Вона пообіцяла не пригощати борщем. Нічия.",
    "Голуб виграв джекпот і полетів у Монако. Без тебе.",
    "Твоя стратегія «поставити все» спрацювала двічі. З мінусів — один, але великий.",
    "Ти не програєш, якщо не зупинятимешся. Правда, і не виграєш.",
    "Хтось виграв на цьому автоматі. Але це був не ти. І не вчора.",
    "Бабуся хоче, щоб ти знайшов роботу. Казино-рофл — теж робота, але без зарплати.",
    "Твій гаманець відкрив благодійний фонд допомоги власникам казино.",
    "Голуб спитав, чи ти вже на мільйоні. Ти відповів: «Майже». Він засміявся.",
    "Твої гроші не зникли. Вони просто перейшли в іншу сюжетну лінію.",
    "Сьогодні не твій день. Зате в бабусі день вдався — вона дочекалася онука.",
    "Ставка пройшла повз. Але ти молодець, що взагалі натиснув.",
    "Не сумуй. У наступному раунді тобі обов'язково пощастить. Мабуть. Колись.",
    "Казино-рофл залишає тобі тільки спогади. І ще трохи мінусів.",
    "Голуб сказав, що інвестує в тебе. Голуб бреше."
];

// Рівні статусу залежать від максимального балансу.
const STATUS_LEVELS = [
    { name: 'Бомж', icon: '🥺', min: 0 },
    { name: 'Бомж-стажер', icon: '🧢', min: 1500 },
    { name: 'Бомж з амбіціями', icon: '💼', min: 3000 },
    { name: 'Пенсіонер-екстремал', icon: '🦽', min: 6000 },
    { name: 'Бізнес-бомж', icon: '🤵', min: 12000 },
    { name: 'Бомж-інвестор', icon: '📈', min: 25000 },
    { name: 'Бомж-олігарх', icon: '🛥️', min: 60000 },
    { name: 'Мільярдер-бомж', icon: '👑', min: 1000000 }
];

// Досягнення. check отримує стан гри.
const ACHIEVEMENTS = [
    { id: 'first_game', icon: '🎲', title: 'Перший раз', desc: 'Зіграти першу гру', check: (s) => s.stats.played >= 1 },
    { id: 'first_win', icon: '🤑', title: 'Перша перемога', desc: 'Виграти раунд', check: (s) => s.stats.wins >= 1 },
    { id: 'first_loss', icon: '😭', title: 'Перший програш', desc: 'Програти раунд', check: (s) => s.stats.losses >= 1 },
    { id: 'play_10', icon: '🎯', title: 'Розігрів', desc: 'Зіграти 10 раундів', check: (s) => s.stats.played >= 10 },
    { id: 'play_50', icon: '🔥', title: 'Азартний', desc: 'Зіграти 50 раундів', check: (s) => s.stats.played >= 50 },
    { id: 'play_100', icon: '💯', title: 'Сотка', desc: 'Зіграти 100 раундів', check: (s) => s.stats.played >= 100 },
    { id: 'wins_10', icon: '🏅', title: 'Десяточка', desc: 'Виграти 10 раундів', check: (s) => s.stats.wins >= 10 },
    { id: 'wins_50', icon: '🏆', title: 'Переможець', desc: 'Виграти 50 раундів', check: (s) => s.stats.wins >= 50 },
    { id: 'big_win_100', icon: '💰', title: 'Солідна каша', desc: 'Виграти $100+ за раунд', check: (s) => s.stats.biggestWin >= 100 },
    { id: 'big_win_1000', icon: '💎', title: 'Куш', desc: 'Виграти $1000+ за раунд', check: (s) => s.stats.biggestWin >= 1000 },
    { id: 'jackpot', icon: '🎰', title: 'Джекпот-бомж', desc: 'Зірвати джекпот у слотах', check: (s) => s.flags.slotsJackpot },
    { id: 'zero', icon: '🟢', title: 'Нульове везіння', desc: 'Попасти на 0 у рулетці', check: (s) => s.flags.rouletteZero },
    { id: 'balance_2k', icon: '🪙', title: 'Вже не бомж', desc: 'Мати $2 000 на балансі', check: (s) => s.maxBalance >= 2000 },
    { id: 'balance_10k', icon: '💵', title: 'Бізнес-бомж', desc: 'Мати $10 000 на балансі', check: (s) => s.maxBalance >= 10000 },
    { id: 'balance_100k', icon: '🏦', title: 'Бомж-олігарх', desc: 'Мати $100 000 на балансі', check: (s) => s.maxBalance >= 100000 },
    { id: 'million', icon: '👑', title: 'Мільярдер-бомж', desc: 'Мати $1 000 000 на балансі', check: (s) => s.maxBalance >= 1000000 },
    { id: 'all_in', icon: '🚀', title: 'ALL IN!', desc: 'Виграти раунд зі ставкою ALL IN', check: (s) => s.flags.allInWin },
    { id: 'grandma_3', icon: '👵', title: 'Бабусін улюбленець', desc: 'Попросити гроші 3 рази', check: (s) => s.stats.grandmaAsks >= 3 },
    { id: 'shopper', icon: '🛍️', title: 'Шопоголік', desc: 'Купити перший предмет', check: (s) => s.stats.purchases >= 1 },
    { id: 'collector', icon: '🧿', title: 'Колекціонер', desc: 'Купити 3 предмети', check: (s) => s.stats.purchases >= 3 },
    { id: 'comeback', icon: '🔄', title: 'Повернення бомжа', desc: 'Піднятися з $50 до $500', check: (s) => s.flags.comeback },
    { id: 'streak_5', icon: '⚡', title: 'Серія', desc: 'Виграти 5 раундів поспіль', check: (s) => s.stats.bestStreak >= 5 },
    { id: 'slots_10', icon: '🎰', title: 'Барабанщик', desc: 'Зіграти 10 разів у слотах', check: (s) => (s.stats.byGame.slots && s.stats.byGame.slots.played || 0) >= 10 },
    { id: 'roulette_13', icon: '🎡', title: 'Колесо фортуни', desc: 'Зіграти 13 разів у рулетці', check: (s) => (s.stats.byGame.roulette && s.stats.byGame.roulette.played || 0) >= 13 },
    { id: 'bot_win', icon: '🔫', title: 'Сухий і небезпечний', desc: 'Перемогти бота у водяній рулетці', check: (s) => (s.stats.byGame['bot-roulette'] && s.stats.byGame['bot-roulette'].wins || 0) >= 1 },
    { id: 'bot_win_5', icon: '🤖', title: 'Побутова техніка', desc: 'Перемогти бота 5 разів', check: (s) => (s.stats.byGame['bot-roulette'] && s.stats.byGame['bot-roulette'].wins || 0) >= 5 },
    { id: 'coin_10', icon: '🪙', title: 'Монетний двір', desc: 'Підкинути монетку 10 разів', check: (s) => (s.stats.byGame['coin-flip'] && s.stats.byGame['coin-flip'].played || 0) >= 10 },
    { id: 'dice_10', icon: '🎲', title: 'Костоправ', desc: 'Кинути кості 10 разів', check: (s) => (s.stats.byGame.dice && s.stats.byGame.dice.played || 0) >= 10 },
    { id: 'scratch_10', icon: '🎟️', title: 'Скретч-маніяк', desc: 'Купити 10 скретч-карток', check: (s) => (s.stats.byGame['scratch-card'] && s.stats.byGame['scratch-card'].played || 0) >= 10 },
    { id: 'scratch_triple', icon: '💎', title: 'Три в ряд', desc: 'Зібрати три однакові символи', check: (s) => s.flags.scratchTriple },
    { id: 'fortune_10', icon: '🍀', title: 'Колесовий', desc: 'Крутнути колесо фортуни 10 разів', check: (s) => (s.stats.byGame['fortune-wheel'] && s.stats.byGame['fortune-wheel'].played || 0) >= 10 },
    { id: 'highlow_10', icon: '🃏', title: 'Картковий барон', desc: 'Зіграти 10 роздач у «Вища-нижча»', check: (s) => (s.stats.byGame['high-low'] && s.stats.byGame['high-low'].played || 0) >= 10 }
];

// Магазин жартівливих предметів. luck — бонус до шансів у відсотках (0.02 = +2%).
const SHOP_ITEMS = [
    { id: 'clover', icon: '🍀', name: 'Чотирилиста конюшина', desc: '+1% до шансів', price: 250, luck: 0.01 },
    { id: 'talisman', icon: '🧿', name: 'Талісман вдачі', desc: '+2% до шансів', price: 500, luck: 0.02 },
    { id: 'coin', icon: '🪙', name: 'Монетка на удачу', desc: '+1,5% до шансів', price: 700, luck: 0.015 },
    { id: 'tophat', icon: '🎩', name: 'Щасливий циліндр', desc: '+2,5% до шансів', price: 900, luck: 0.025 },
    { id: 'tooth', icon: '🦷', name: 'Золотий зуб', desc: '+3% до шансів', price: 1500, luck: 0.03 },
    { id: 'dove', icon: '🕊️', name: 'Оберіг від голубів', desc: '+2% до шансів', price: 2000, luck: 0.02 }
];

// Меню всіх десяти ігор. Доступність визначається наявністю зареєстрованої гри.
const MENU_GAMES = [
    { id: 'roulette', name: 'Рулетка', icon: '🎡', desc: 'Колір або число. x2 / x35', color: '#ff4d5e' },
    { id: 'slots', name: 'Слоти', icon: '🎰', desc: 'Три барабани та джекпот', color: '#ffd24a' },
    { id: 'bot-roulette', name: 'Рулетка з ботом', icon: '🔫', desc: 'Водяний пістолет. Хтось мокрий', color: '#28f0ff' },
    { id: 'coin-flip', name: 'Монетка', icon: '🪙', desc: 'Орел чи решка?', color: '#ffd24a' },
    { id: 'dice', name: 'Кості', icon: '🎲', desc: 'Більше або менше 7', color: '#b6ff3c' },
    { id: 'scratch-card', name: 'Скретч-картка', icon: '🎟️', desc: 'Сотри й дізнайся', color: '#a855f7' },
    { id: 'fortune-wheel', name: 'Колесо фортуни', icon: '🍀', desc: 'x0, x2, x5, x10... або голуб', color: '#ff2e97' },
    { id: 'high-low', name: 'Вища-нижча', icon: '🃏', desc: 'Вгадай карту', color: '#28f0ff' },
    { id: 'cup-game', name: 'Наперстки', icon: '🥃', desc: 'Де кулька? Вгадай', color: '#b6ff3c' },
    { id: 'clicker', name: 'Шабашка', icon: '🛠️', desc: 'Тисни й заробляй копійки', color: '#ff9d2e' }
];

// Прості звуки через Web Audio API.
const Sound = (() => {
    let ctx = null;
    let enabled = true;

    function ensure() {
        if (!enabled) return null;
        try {
            if (!ctx) {
                const AudioCtor = window.AudioContext || window.webkitAudioContext;
                if (!AudioCtor) return null;
                ctx = new AudioCtor();
            }
            if (ctx.state === 'suspended') ctx.resume();
            return ctx;
        } catch (error) {
            return null;
        }
    }

    function tone(freq, duration, type = 'sine', volume = 0.06, delay = 0, endFreq = null) {
        const audio = ensure();
        if (!audio) return;
        try {
            const start = audio.currentTime + delay;
            const osc = audio.createOscillator();
            const gain = audio.createGain();
            osc.type = type;
            osc.frequency.setValueAtTime(freq, start);
            if (endFreq) {
                osc.frequency.exponentialRampToValueAtTime(Math.max(30, endFreq), start + duration);
            }
            gain.gain.setValueAtTime(0.0001, start);
            gain.gain.exponentialRampToValueAtTime(Math.max(0.0002, volume), start + 0.015);
            gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
            osc.connect(gain);
            gain.connect(audio.destination);
            osc.start(start);
            osc.stop(start + duration + 0.03);
        } catch (error) {
            // Звук не критичний для гри.
        }
    }

    function melody(notes, type = 'triangle', volume = 0.055) {
        notes.forEach(([freq, delay, duration]) => tone(freq, duration, type, volume, delay));
    }

    return {
        setEnabled(value) {
            enabled = Boolean(value);
            if (enabled) ensure();
        },
        get enabled() {
            return enabled;
        },
        unlock() {
            ensure();
        },
        click() {
            tone(520, 0.045, 'square', 0.022);
        },
        tick() {
            tone(980, 0.035, 'square', 0.02);
        },
        bet() {
            tone(330, 0.07, 'sine', 0.05);
            tone(520, 0.07, 'sine', 0.04, 0.06);
        },
        win() {
            melody([[523, 0, 0.12], [659, 0.09, 0.12], [784, 0.18, 0.2]]);
        },
        bigWin() {
            melody([[523, 0, 0.12], [659, 0.08, 0.12], [784, 0.16, 0.12], [1047, 0.24, 0.3]], 'triangle', 0.07);
        },
        lose() {
            tone(220, 0.17, 'sawtooth', 0.04);
            tone(150, 0.26, 'sawtooth', 0.035, 0.12);
        },
        spin() {
            for (let i = 0; i < 10; i += 1) {
                tone(700 + i * 35, 0.03, 'square', 0.014, i * 0.09);
            }
        },
        jackpot() {
            melody([
                [523, 0, 0.1], [659, 0.09, 0.1], [784, 0.18, 0.1], [1047, 0.27, 0.12],
                [1319, 0.39, 0.12], [1568, 0.51, 0.3]
            ], 'square', 0.05);
        },
        achievement() {
            melody([[784, 0, 0.12], [1047, 0.1, 0.2]], 'sine', 0.055);
        },
        coin() {
            tone(1200, 0.06, 'triangle', 0.04);
            tone(1600, 0.08, 'triangle', 0.035, 0.06);
        },
        nope() {
            tone(180, 0.12, 'square', 0.03);
        },
        rofl() {
            tone(560, 0.08, 'sine', 0.035);
            tone(720, 0.12, 'sine', 0.03, 0.09);
        },
        splash() {
            tone(620, 0.08, 'sine', 0.045, 0, 340);
            tone(380, 0.12, 'sine', 0.035, 0.05, 180);
            tone(240, 0.18, 'triangle', 0.025, 0.12, 120);
        }
    };
})();

const Game = (() => {
    const state = CasinoStorage.load();
    const games = new Map();
    let activeCleanup = null;
    let suppressSave = false;

    function save() {
        // Під час скидання не дозволяємо pagehide зберегти старий стан назад.
        if (suppressSave) return;
        CasinoStorage.save(state);
    }

    function resetProgress() {
        suppressSave = true;
        CasinoStorage.reset();
        location.reload();
    }

    function balance() {
        return state.balance;
    }

    // Загальний бонус удачі з куплених предметів (не більше 15%).
    function luck() {
        let total = 0;
        SHOP_ITEMS.forEach((item) => {
            if (state.inventory[item.id]) total += item.luck;
        });
        return Math.min(0.15, total);
    }

    function updateHomeStats() {
        const set = (id, value) => {
            const el = document.getElementById(id);
            if (el) el.textContent = value;
        };
        set('stat-played', String(state.stats.played));
        set('stat-wins', String(state.stats.wins));
        set('stat-losses', String(state.stats.losses));
        set('stat-biggest', UI.money(state.stats.biggestWin));
    }

    function updateStatus() {
        const chip = document.getElementById('status-chip');
        const fill = document.getElementById('status-fill');
        const next = document.getElementById('status-next');
        if (!chip || !fill || !next) return;

        let index = 0;
        for (let i = 0; i < STATUS_LEVELS.length; i += 1) {
            if (state.maxBalance >= STATUS_LEVELS[i].min) index = i;
        }

        const level = STATUS_LEVELS[index];
        const following = STATUS_LEVELS[index + 1];
        chip.textContent = `${level.icon} ${level.name}`;
        chip.title = `Максимальний баланс: ${UI.money(state.maxBalance)}`;

        if (!following) {
            fill.style.width = '100%';
            next.textContent = 'Максимум!';
            return;
        }

        const span = following.min - level.min;
        const progress = Math.min(1, Math.max(0, (state.maxBalance - level.min) / span));
        fill.style.width = `${Math.round(progress * 100)}%`;
        next.textContent = `${UI.money(following.min - state.maxBalance)} до ${following.name}`;
    }

    function updateAchBadge() {
        const badge = document.getElementById('ach-badge');
        if (!badge) return;
        badge.textContent = String(state.achievements.length);
        badge.classList.toggle('visible', state.achievements.length > 0);
    }

    function updateHud() {
        const balanceEl = document.getElementById('balance-value');
        if (balanceEl) balanceEl.textContent = UI.money(state.balance);

        document.querySelectorAll('[data-bet-balance]').forEach((el) => {
            el.textContent = UI.money(state.balance);
        });

        updateStatus();
        updateHomeStats();
        updateAchBadge();
    }

    function addMoney(amount, options = {}) {
        const delta = Math.round(Number(amount) || 0);
        if (!delta) return state.balance;

        state.balance = Math.max(0, state.balance + delta);
        if (state.balance > state.maxBalance) state.maxBalance = state.balance;

        if (state.balance < 50) state.flags.hitBottom = true;
        if (state.flags.hitBottom && state.balance >= 500) state.flags.comeback = true;

        save();
        updateHud();

        if (!options.silent) UI.balanceFloat(delta);
        return state.balance;
    }

    function takeBet(amount) {
        const value = Math.floor(Number(amount));
        if (!Number.isFinite(value) || value <= 0 || value > state.balance) return false;
        addMoney(-value);
        Sound.bet();
        return true;
    }

    // Завершення раунду: нарахування виграшу та оновлення статистики.
    function settleRound(gameId, bet, payout, options = {}) {
        const safeBet = Math.max(0, Math.floor(bet || 0));
        const safePayout = Math.max(0, Math.floor(payout || 0));

        if (safePayout > 0) addMoney(safePayout);

        const net = safePayout - safeBet;
        const stats = state.stats;
        stats.played += 1;
        stats.wagered += safeBet;
        stats.won += safePayout;
        stats.lost += Math.max(0, safeBet - safePayout);

        if (!stats.byGame[gameId]) {
            stats.byGame[gameId] = { played: 0, wins: 0, biggestWin: 0 };
        }
        const gameStats = stats.byGame[gameId];
        gameStats.played += 1;

        if (net > 0) {
            stats.wins += 1;
            stats.streak += 1;
            stats.bestStreak = Math.max(stats.bestStreak, stats.streak);
            gameStats.wins += 1;
            gameStats.biggestWin = Math.max(gameStats.biggestWin, safePayout);
            stats.biggestWin = Math.max(stats.biggestWin, safePayout);
            if (options.allIn) state.flags.allInWin = true;
        } else if (net < 0) {
            stats.losses += 1;
            stats.streak = 0;
        }

        if (options.jackpot) state.flags.slotsJackpot = true;
        if (options.zero) state.flags.rouletteZero = true;
        if (options.triple) state.flags.scratchTriple = true;

        save();
        updateHud();
        checkAchievements();

        if (net > 0) {
            if (safePayout >= 500 || net >= safeBet * 5) {
                Sound.bigWin();
                UI.celebrate();
            } else {
                Sound.win();
            }
        } else if (net < 0) {
            Sound.lose();
        }

        maybeRofl();
        return net;
    }

    function maybeRofl() {
        if (!state.settings.jokes) return;
        if (Math.random() >= 0.32) return;

        let index = Math.floor(Math.random() * ROFL_JOKES.length);
        if (ROFL_JOKES.length > 1 && index === state.lastJoke) {
            index = (index + 1) % ROFL_JOKES.length;
        }
        state.lastJoke = index;
        save();

        Sound.rofl();
        UI.toast(ROFL_JOKES[index], {
            emoji: '🃏',
            title: 'Рофл-подія',
            type: 'joke',
            duration: 5200
        });
    }

    function checkAchievements(silent = false) {
        let changed = false;

        ACHIEVEMENTS.forEach((achievement) => {
            if (state.achievements.includes(achievement.id)) return;

            let unlocked = false;
            try {
                unlocked = Boolean(achievement.check(state));
            } catch (error) {
                unlocked = false;
            }

            if (!unlocked) return;

            state.achievements.push(achievement.id);
            changed = true;

            if (!silent) {
                Sound.achievement();
                UI.toast(achievement.desc, {
                    emoji: achievement.icon,
                    title: `🏆 ${achievement.title}`,
                    type: 'achievement',
                    duration: 4200
                });
            }
        });

        if (changed) {
            save();
            updateAchBadge();
        }
    }

    function history(gameId) {
        return Array.isArray(state.history[gameId]) ? state.history[gameId] : [];
    }

    function pushHistory(gameId, entry, limit = 8) {
        if (!Array.isArray(state.history[gameId])) state.history[gameId] = [];
        state.history[gameId].unshift(entry);
        if (state.history[gameId].length > limit) {
            state.history[gameId].length = limit;
        }
        save();
    }

    function register(implementation) {
        if (!implementation || !implementation.id || typeof implementation.mount !== 'function') {
            console.warn('Некоректна міні-гра:', implementation);
            return;
        }
        games.set(implementation.id, implementation);
    }

    function renderGameGrid() {
        const grid = document.getElementById('game-grid');
        if (!grid) return;

        grid.innerHTML = MENU_GAMES.map((game) => {
            const available = games.has(game.id);
            return `
                <button class="game-card${available ? '' : ' locked'}" type="button"
                    data-game="${game.id}" style="--accent:${game.color}"
                    ${available ? '' : 'aria-disabled="true"'}>
                    <span class="game-icon" aria-hidden="true">${game.icon}</span>
                    <span class="game-name">${game.name}</span>
                    <span class="game-desc">${game.desc}</span>
                    ${available
                        ? '<span class="game-play">Грати →</span>'
                        : '<span class="game-lock">🔒 скоро</span>'}
                </button>`;
        }).join('');

        const badge = document.getElementById('games-badge');
        if (badge) badge.textContent = `${games.size} з ${MENU_GAMES.length}`;
    }

    function setNavActive(name) {
        document.querySelectorAll('.nav-btn').forEach((button) => {
            button.classList.toggle('active', button.dataset.nav === name);
        });
    }

    function closeActiveGame() {
        if (activeCleanup) {
            try {
                activeCleanup();
            } catch (error) {
                console.error('Помилка закриття гри:', error);
            }
            activeCleanup = null;
        }
        const root = document.getElementById('game-root');
        if (root) root.innerHTML = '';
    }

    function open(gameId) {
        const implementation = games.get(gameId);
        const meta = MENU_GAMES.find((item) => item.id === gameId);

        if (!implementation) {
            Sound.nope();
            UI.toast(
                meta
                    ? `«${meta.name}» з'явиться на наступному етапі. Поки що доступно ${games.size} з ${MENU_GAMES.length} ігор.`
                    : 'Ця гра ще в розробці.',
                { emoji: '🚧', title: 'Скоро', type: 'info', duration: 3600 }
            );
            return;
        }

        closeActiveGame();

        const homeView = document.getElementById('view-home');
        const gameView = document.getElementById('view-game');
        if (homeView) homeView.classList.remove('active');
        if (gameView) gameView.classList.add('active');

        const title = document.getElementById('game-title');
        const icon = document.getElementById('game-icon');
        if (title) title.textContent = meta ? meta.name : 'Гра';
        if (icon) icon.textContent = meta ? meta.icon : '🎮';

        setNavActive(null);
        window.scrollTo({ top: 0, behavior: 'auto' });
        Sound.click();

        const root = document.getElementById('game-root');
        if (!root) return;

        root.innerHTML = '';
        try {
            activeCleanup = implementation.mount(root) || null;
        } catch (error) {
            console.error('Не вдалося запустити гру:', error);
            UI.toast('Гра не змогла запуститися. Спробуй оновити сторінку.', {
                emoji: '⚠️',
                title: 'Помилка',
                type: 'lose'
            });
        }
    }

    function home() {
        closeActiveGame();
        const homeView = document.getElementById('view-home');
        const gameView = document.getElementById('view-game');
        if (homeView) homeView.classList.add('active');
        if (gameView) gameView.classList.remove('active');

        setNavActive('home');
        updateHud();
        updateGrandmaUI();
        window.scrollTo({ top: 0, behavior: 'auto' });
    }

    function openAchievements() {
        const unlocked = new Set(state.achievements);
        const total = ACHIEVEMENTS.length;
        const percent = total ? Math.round((unlocked.size / total) * 100) : 0;

        const cards = ACHIEVEMENTS.map((achievement) => {
            const has = unlocked.has(achievement.id);
            return `
                <div class="ach-card ${has ? 'unlocked' : 'locked'}">
                    <span class="ach-icon" aria-hidden="true">${has ? achievement.icon : '🔒'}</span>
                    <div class="ach-text">
                        <div class="ach-title">${achievement.title}</div>
                        <div class="ach-desc">${achievement.desc}</div>
                        ${has ? '<span class="ach-status">✅ ВІДКРИТО</span>' : ''}
                    </div>
                </div>`;
        }).join('');

        UI.openSheet({
            title: '🏆 Досягнення',
            subtitle: `${unlocked.size} з ${total} — ${percent}%`,
            html: `
                <div class="sheet-progress"><div style="width:${percent}%"></div></div>
                <div class="ach-grid">${cards}</div>`
        });
    }

    function luckPercent() {
        const value = Math.round(luck() * 1000) / 10;
        return String(value).replace('.', ',');
    }

    function shopHtml() {
        const items = SHOP_ITEMS.map((item) => {
            const owned = Boolean(state.inventory[item.id]);
            return `
                <div class="shop-item ${owned ? 'owned' : ''}">
                    <span class="shop-icon" aria-hidden="true">${item.icon}</span>
                    <div class="shop-info">
                        <div class="shop-name">${item.name}</div>
                        <div class="shop-desc">${item.desc} у рулетці та слотах</div>
                    </div>
                    <button class="shop-buy ${owned ? 'owned' : ''}" type="button"
                        data-buy="${item.id}" ${owned ? 'disabled' : ''}>
                        ${owned ? '✅ Куплено' : UI.money(item.price)}
                    </button>
                </div>`;
        }).join('');

        return `
            <div class="shop-note">
                🧿 Бонуси діють у всіх іграх і додаються до шансів на виграш.
                Зараз твій бонус: <b data-luck-total>+${luckPercent()}%</b>.
            </div>
            <div class="shop-grid">${items}</div>
            <div class="shop-total">Загальний бонус удачі: <b data-luck-total>+${luckPercent()}%</b></div>`;
    }

    function buyItem(itemId, button) {
        const item = SHOP_ITEMS.find((entry) => entry.id === itemId);
        if (!item || state.inventory[item.id]) return;

        if (state.balance < item.price) {
            Sound.nope();
            UI.toast(`Не вистачає ${UI.money(item.price - state.balance)}. Бабуся вже в курсі.`, {
                emoji: '💸',
                title: 'Замало грошей',
                type: 'lose'
            });
            return;
        }

        addMoney(-item.price);
        state.inventory[item.id] = true;
        state.stats.purchases += 1;
        save();
        checkAchievements();
        Sound.coin();

        UI.toast(`Куплено: ${item.name}. ${item.desc}.`, {
            emoji: item.icon,
            title: 'Магазин',
            type: 'money'
        });

        if (button) {
            button.disabled = true;
            button.classList.add('owned');
            button.textContent = '✅ Куплено';
            const card = button.closest('.shop-item');
            if (card) card.classList.add('owned');
        }

        document.querySelectorAll('[data-luck-total]').forEach((el) => {
            el.textContent = `+${luckPercent()}%`;
        });

        updateHud();
    }

    function openShop() {
        UI.openSheet({
            title: '🛍️ Магазин жартів',
            subtitle: 'Предмети купуються назавжди',
            html: shopHtml(),
            onMount(sheet) {
                sheet.querySelectorAll('[data-buy]').forEach((button) => {
                    button.addEventListener('click', () => buyItem(button.dataset.buy, button));
                });
            }
        });
    }

    function openSettings() {
        UI.openSheet({
            title: '⚙️ Налаштування',
            subtitle: 'Прогрес зберігається лише у твоєму браузері',
            html: `
                <div class="settings-list">
                    <div class="setting-row">
                        <div class="setting-label">
                            <div class="setting-name">🔊 Звуки</div>
                            <div class="setting-desc">Дзинь, пищалки та фанфари</div>
                        </div>
                        <label class="switch">
                            <input type="checkbox" id="setting-sound" ${state.settings.sound ? 'checked' : ''}>
                            <span class="switch-track"></span>
                        </label>
                    </div>
                    <div class="setting-row">
                        <div class="setting-label">
                            <div class="setting-name">🃏 Рофл-події</div>
                            <div class="setting-desc">Випадкові жарти після раундів</div>
                        </div>
                        <label class="switch">
                            <input type="checkbox" id="setting-jokes" ${state.settings.jokes ? 'checked' : ''}>
                            <span class="switch-track"></span>
                        </label>
                    </div>
                </div>

                <div class="settings-stats">
                    <div class="settings-stat"><b>${state.stats.played}</b>усього раундів</div>
                    <div class="settings-stat"><b>${state.stats.wins}</b>перемог</div>
                    <div class="settings-stat"><b>${state.stats.losses}</b>програшів</div>
                    <div class="settings-stat"><b>${UI.money(state.stats.biggestWin)}</b>найбільший виграш</div>
                    <div class="settings-stat"><b>${UI.money(state.stats.won)}</b>усього виграно</div>
                    <div class="settings-stat"><b>${UI.money(state.stats.lost)}</b>усього програно</div>
                </div>

                <div class="danger-zone">
                    <div class="danger-title">Небезпечна зона</div>
                    <button class="btn btn-danger" type="button" id="reset-progress">🗑️ Скинути прогрес</button>
                    <p class="about-text">Баланс, статистика, досягнення, покупки — усе зникне назавжди.</p>
                </div>

                <p class="about-text">
                    Казино-Рофл · ${games.size} з ${MENU_GAMES.length} міні-ігор доступно.<br>
                    Усі гроші віртуальні. Реальні платежі відсутні.
                </p>`,
            onMount(sheet) {
                const soundInput = sheet.querySelector('#setting-sound');
                const jokesInput = sheet.querySelector('#setting-jokes');

                soundInput.addEventListener('change', () => {
                    state.settings.sound = soundInput.checked;
                    Sound.setEnabled(soundInput.checked);
                    save();
                    if (soundInput.checked) Sound.coin();
                });

                jokesInput.addEventListener('change', () => {
                    state.settings.jokes = jokesInput.checked;
                    save();
                    if (jokesInput.checked) {
                        UI.toast('Жарти повернулися. Голуб уже готує нову історію.', {
                            emoji: '🃏',
                            type: 'joke'
                        });
                    }
                });

                sheet.querySelector('#reset-progress').addEventListener('click', async () => {
                    const confirmed = await UI.confirm({
                        title: 'Скинути прогрес?',
                        text: 'Баланс, статистика, досягнення та куплені предмети зникнуть. Бабуся все бачила.',
                        confirmText: 'Так, усе скинути',
                        cancelText: 'Ой, ні',
                        danger: true
                    });

                    if (confirmed) resetProgress();
                });
            }
        });
    }

    const GRANDMA_COOLDOWN = 5 * 60 * 1000;

    function grandmaRemaining() {
        return Math.max(0, GRANDMA_COOLDOWN - (Date.now() - (state.grandmaLast || 0)));
    }

    function updateGrandmaUI() {
        const remaining = grandmaRemaining();
        const homeButton = document.getElementById('grandma-home');
        const topButton = document.getElementById('grandma-top');
        const text = document.getElementById('grandma-text');

        if (homeButton) {
            homeButton.textContent = remaining > 0
                ? `Через ${UI.formatTime(remaining)}`
                : 'Попросити $100';
            homeButton.classList.toggle('cooling', remaining > 0);
            homeButton.setAttribute('aria-disabled', remaining > 0 ? 'true' : 'false');
        }

        if (topButton) {
            topButton.classList.toggle('ready', remaining === 0);
            topButton.classList.toggle('cooling', remaining > 0);
            topButton.title = remaining > 0
                ? `Бабуся повернеться через ${UI.formatTime(remaining)}`
                : 'Попросити в бабусі $100';
        }

        if (text) {
            text.textContent = remaining > 0
                ? `Бабуся доїдає борщ. Наступні $100 через ${UI.formatTime(remaining)}.`
                : 'Бабуся дасть $100 раз на 5 хвилин.';
        }
    }

    function askGrandma() {
        const remaining = grandmaRemaining();

        if (remaining > 0) {
            Sound.nope();
            UI.toast(`Бабуся ще доїдає борщ. Наступні гроші через ${UI.formatTime(remaining)}.`, {
                emoji: '🥣',
                title: 'Бабуся',
                type: 'info'
            });
            return;
        }

        state.grandmaLast = Date.now();
        state.stats.grandmaAsks += 1;
        addMoney(100);
        save();
        checkAchievements();
        Sound.coin();
        UI.toast('Бабуся дала $100. Скажи їй дякую, вона старається.', {
            emoji: '👵',
            title: 'Бабусіна допомога',
            type: 'money'
        });
        updateGrandmaUI();
    }

    function init() {
        Sound.setEnabled(state.settings.sound);

        renderGameGrid();
        updateHud();
        updateGrandmaUI();
        checkAchievements(true);

        const brand = document.getElementById('brand-home');
        if (brand) brand.addEventListener('click', () => {
            Sound.click();
            home();
        });

        const back = document.getElementById('back-btn');
        if (back) back.addEventListener('click', () => {
            Sound.click();
            home();
        });

        const grandmaTop = document.getElementById('grandma-top');
        const grandmaHome = document.getElementById('grandma-home');
        if (grandmaTop) grandmaTop.addEventListener('click', askGrandma);
        if (grandmaHome) grandmaHome.addEventListener('click', askGrandma);

        const grid = document.getElementById('game-grid');
        if (grid) {
            grid.addEventListener('click', (event) => {
                const card = event.target.closest('[data-game]');
                if (!card) return;
                open(card.dataset.game);
            });
        }

        document.querySelectorAll('.nav-btn').forEach((button) => {
            button.addEventListener('click', () => {
                const nav = button.dataset.nav;
                if (nav === 'home') {
                    Sound.click();
                    home();
                } else if (nav === 'achievements') {
                    Sound.click();
                    openAchievements();
                } else if (nav === 'shop') {
                    Sound.click();
                    openShop();
                } else if (nav === 'settings') {
                    Sound.click();
                    openSettings();
                }
            });
        });

        setInterval(updateGrandmaUI, 1000);

        document.addEventListener('visibilitychange', () => {
            if (document.hidden) save();
        });
        window.addEventListener('pagehide', save);
        document.addEventListener('pointerdown', () => Sound.unlock(), { once: true });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    return {
        register,
        open,
        home,
        get state() { return state; },
        balance,
        save,
        luck,
        addMoney,
        takeBet,
        settleRound,
        history,
        pushHistory,
        updateHud,
        checkAchievements,
        resetProgress,
        menu: MENU_GAMES
    };
})();
