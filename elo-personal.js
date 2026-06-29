/**
 * ══════════════════════════════════════════════════════════════════
 * SPIKE CHUNSOFT WAIFU SORTER — elo-personal.js  (ШАГ 3)
 *
 * Персональный слой Эло поверх авторского канона.
 *
 *   baseElo (канон, ratings.json)  — read-only, общий для всех
 *   delta   (это файл, localStorage) — личное смещение юзера
 *   итог = base + delta             — то, что видит конкретный юзер
 *
 * Когда юзер играет поединок, мы считаем Эло-апдейт от ПОЛНОГО
 * рейтинга обоих (base+delta), но записываем обратно только дельту.
 * Канон при этом не меняется — у каждого свой слой поверх общего.
 *
 * Зависит от: window.Elo (elo.js). Подключать ПОСЛЕ него.
 * Подключение:
 *   <script src="elo.js"></script>
 *   <script src="elo-personal.js"></script>
 *   <script src="script.js"></script>
 *
 * Быстрый тест в консоли:
 *   EloPersonal.init({ "kyoko-kirigiri": 1620, "makoto-naegi": 1528 });
 *   EloPersonal.getElo("kyoko-kirigiri")        // 1620 (дельта 0)
 *   EloPersonal.recordMatch("makoto-naegi","kyoko-kirigiri","a"); // апсет!
 *   EloPersonal.getElo("makoto-naegi")          // вырос
 *   EloPersonal.getDelta("makoto-naegi")        // > 0
 *   EloPersonal.reset()                         // стереть личный прогресс
 * ══════════════════════════════════════════════════════════════════
 */

(function (global) {
  'use strict';

  if (!global.Elo) {
    console.error('elo-personal.js: window.Elo не найден. Подключи elo.js ПЕРЕД этим файлом.');
  }

  // ──────────────────────────────────────────────
  // КОНСТАНТЫ
  // ──────────────────────────────────────────────

  const STORAGE_KEY = 'sc-elo-personal';
  const SCHEMA_VERSION = 1;

  // ──────────────────────────────────────────────
  // ВНУТРЕННЕЕ СОСТОЯНИЕ
  // ──────────────────────────────────────────────

  // Канон: { id: baseRating }. Заполняется через init().
  let base = {};

  // Персональный слой. perChar[id] = { delta, games, w, l, t }
  let store = {
    version: SCHEMA_VERSION,
    perChar: {},
    lastPlayed: null,
  };

  // ──────────────────────────────────────────────
  // ХРАНИЛИЩЕ (localStorage с защитой от сбоев)
  // ──────────────────────────────────────────────

  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return; // первый запуск — остаёмся с дефолтом
      const parsed = JSON.parse(raw);
      store = migrate(parsed);
    } catch (e) {
      console.warn('elo-personal: не удалось прочитать хранилище, начинаю с чистого листа.', e);
      store = { version: SCHEMA_VERSION, perChar: {}, lastPlayed: null };
    }
  }

  function save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
    } catch (e) {
      // Приватный режим / переполнение / отключённый storage — не падаем,
      // просто личный прогресс не сохранится между сессиями.
      console.warn('elo-personal: не удалось сохранить (приватный режим?).', e);
    }
  }

  /**
   * Миграция старых версий схемы. Сейчас версия одна, но задел на будущее:
   * когда поменяем формат, здесь будет апгрейд без потери данных юзеров.
   */
  function migrate(parsed) {
    if (!parsed || typeof parsed !== 'object') {
      return { version: SCHEMA_VERSION, perChar: {}, lastPlayed: null };
    }
    let v = parsed.version || 0;

    // Пример будущей миграции:
    // if (v < 2) { ...перестроить parsed.perChar...; v = 2; }

    return {
      version: SCHEMA_VERSION,
      perChar: parsed.perChar && typeof parsed.perChar === 'object' ? parsed.perChar : {},
      lastPlayed: parsed.lastPlayed || null,
    };
  }

  // ──────────────────────────────────────────────
  // ИНИЦИАЛИЗАЦИЯ
  // ──────────────────────────────────────────────

  /**
   * Загружает канон и поднимает персональный слой из localStorage.
   *
   * @param {Object} baseElo — карта { id: baseRating } из ratings.json
   *                           (передавай data.baseElo)
   */
  function init(baseElo) {
    base = baseElo || {};
    load();
    return EloPersonal; // для чейнинга
  }

  // ──────────────────────────────────────────────
  // ЧТЕНИЕ
  // ──────────────────────────────────────────────

  /** Базовый (канон) рейтинг. Если персонажа нет в каноне — DEFAULT_RATING. */
  function getBase(id) {
    return base[id] != null ? base[id] : global.Elo.DEFAULT_RATING;
  }

  /** Персональная дельта. 0, если юзер ещё не двигал этого персонажа. */
  function getDelta(id) {
    const rec = store.perChar[id];
    return rec ? rec.delta : 0;
  }

  /** Итоговый рейтинг, который видит юзер: канон + личная дельта. */
  function getElo(id) {
    return getBase(id) + getDelta(id);
  }

  /** Полная персональная запись: { delta, games, w, l, t } или нули. */
  function getRecord(id) {
    const rec = store.perChar[id];
    return rec
      ? { delta: rec.delta, games: rec.games, w: rec.w, l: rec.l, t: rec.t }
      : { delta: 0, games: 0, w: 0, l: 0, t: 0 };
  }

  /**
   * Текущий персональный рейтинг всех известных персонажей,
   * отсортированный по убыванию. Полезно для экрана результатов.
   *
   * @param {string[]} [ids] — какие id включать (по умолчанию все из канона)
   * @returns {Array<{id, base, delta, elo}>}
   */
  function ranking(ids) {
    const list = ids || Object.keys(base);
    return list
      .map(id => ({
        id,
        base: getBase(id),
        delta: getDelta(id),
        elo: getElo(id),
      }))
      .sort((a, b) => b.elo - a.elo);
  }

  // ──────────────────────────────────────────────
  // ЗАПИСЬ (игровой апдейт)
  // ──────────────────────────────────────────────

  function ensureRec(id) {
    if (!store.perChar[id]) {
      store.perChar[id] = { delta: 0, games: 0, w: 0, l: 0, t: 0 };
    }
    return store.perChar[id];
  }

  /**
   * Регистрирует один поединок и обновляет персональные дельты обоих.
   *
   * Математика: берём ПОЛНЫЙ текущий рейтинг каждого (base+delta),
   * прогоняем через Elo.match с динамическим K по числу ЛИЧНЫХ игр,
   * и сдвиг прибавляем к дельте. Канон не трогаем.
   *
   * @param {string} idA — левый/первый боец
   * @param {string} idB — правый/второй боец
   * @param {('a'|'b'|'tie')} outcome — кто победил с точки зрения A
   * @param {object} [opts] — проброс в Elo.match (например {k: 32})
   * @returns {{a:number,b:number,deltaA:number,deltaB:number}|null}
   *          новые ИТОГОВЫЕ рейтинги и фактические сдвиги; null при ошибке
   */
  function recordMatch(idA, idB, outcome, opts) {
    if (idA == null || idB == null || idA === idB) {
      console.warn('elo-personal: некорректная пара', idA, idB);
      return null;
    }

    const recA = ensureRec(idA);
    const recB = ensureRec(idB);

    const fullA = getElo(idA);
    const fullB = getElo(idB);

    const res = global.Elo.match(fullA, fullB, outcome, Object.assign({
      gamesA: recA.games,
      gamesB: recB.games,
    }, opts || {}));

    // Сдвиг применяем к ДЕЛЬТЕ (канон неизменен)
    recA.delta += res.deltaA;
    recB.delta += res.deltaB;
    recA.games++; recB.games++;

    if (outcome === 'a') { recA.w++; recB.l++; }
    else if (outcome === 'b') { recB.w++; recA.l++; }
    else { recA.t++; recB.t++; }

    store.lastPlayed = new Date().toISOString().slice(0, 10);
    save();

    return {
      a: getElo(idA),
      b: getElo(idB),
      deltaA: res.deltaA,
      deltaB: res.deltaB,
    };
  }

  // ──────────────────────────────────────────────
  // СБРОС / ЭКСПОРТ
  // ──────────────────────────────────────────────

  /** Полностью стирает персональный прогресс (канон остаётся). */
  function reset() {
    store = { version: SCHEMA_VERSION, perChar: {}, lastPlayed: null };
    try { localStorage.removeItem(STORAGE_KEY); } catch (e) {}
  }

  /** Сырой персональный слой (для отладки/бэкапа). */
  function dump() {
    return JSON.parse(JSON.stringify(store));
  }

  // ──────────────────────────────────────────────
  // ЭКСПОРТ
  // ──────────────────────────────────────────────

  const EloPersonal = {
    STORAGE_KEY,
    SCHEMA_VERSION,
    init,
    getBase,
    getDelta,
    getElo,
    getRecord,
    ranking,
    recordMatch,
    reset,
    dump,
  };

  global.EloPersonal = EloPersonal;

})(window);
