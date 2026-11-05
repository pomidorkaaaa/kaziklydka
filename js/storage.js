// Збереження прогресу в localStorage.
// Окремий namespace, щоб не конфліктувати з вбудованим window.Storage.
const CasinoStorage = (() => {
    const KEY = 'kaziklydka_casino_v1';

    const DEFAULTS = {
        version: 1,
        balance: 1000,
        maxBalance: 1000,
        grandmaLast: 0,
        achievements: [],
        inventory: {},       // куплені предмети: { id: true }
        history: {},         // історія останніх раундів по грі
        settings: {
            sound: true,
            jokes: true
        },
        stats: {
            played: 0,
            wins: 0,
            losses: 0,
            wagered: 0,
            won: 0,
            lost: 0,
            biggestWin: 0,
            streak: 0,
            bestStreak: 0,
            grandmaAsks: 0,
            purchases: 0,
            byGame: {}
        },
        flags: {
            hitBottom: false,
            comeback: false,
            allInWin: false,
            slotsJackpot: false,
            rouletteZero: false,
            scratchTriple: false
        },
        lastJoke: -1,
        createdAt: 0
    };

    const clone = (value) => JSON.parse(JSON.stringify(value));
    const isObject = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);

    // Глибоке злиття збережених даних зі схемою за замовчуванням.
    // Так старі збереження не ламаються після додавання нових полів.
    function merge(defaults, saved) {
        if (!isObject(saved)) return defaults;
        const result = defaults;
        Object.keys(saved).forEach((key) => {
            if (isObject(result[key]) && isObject(saved[key])) {
                result[key] = merge(result[key], saved[key]);
            } else if (saved[key] !== undefined) {
                result[key] = saved[key];
            }
        });
        return result;
    }

    function load() {
        try {
            const raw = localStorage.getItem(KEY);
            if (!raw) {
                const fresh = clone(DEFAULTS);
                fresh.createdAt = Date.now();
                return fresh;
            }
            const parsed = JSON.parse(raw);
            const state = merge(clone(DEFAULTS), parsed);
            if (!Array.isArray(state.achievements)) state.achievements = [];
            if (!state.createdAt) state.createdAt = Date.now();
            if (typeof state.balance !== 'number' || !Number.isFinite(state.balance)) {
                state.balance = 1000;
            }
            state.balance = Math.max(0, Math.round(state.balance));
            state.maxBalance = Math.max(state.maxBalance || 0, state.balance);
            return state;
        } catch (error) {
            console.warn('Не вдалося прочитати прогрес:', error);
            const fresh = clone(DEFAULTS);
            fresh.createdAt = Date.now();
            return fresh;
        }
    }

    function save(state) {
        try {
            localStorage.setItem(KEY, JSON.stringify(state));
            return true;
        } catch (error) {
            console.warn('Не вдалося зберегти прогрес:', error);
            return false;
        }
    }

    function reset() {
        try {
            localStorage.removeItem(KEY);
        } catch (error) {
            console.warn('Не вдалося скинути прогрес:', error);
        }
    }

    return {
        KEY,
        load,
        save,
        reset,
        defaults: () => clone(DEFAULTS)
    };
})();
