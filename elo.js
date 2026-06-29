/**
 * ══════════════════════════════════════════════════════════════════
 * SPIKE CHUNSOFT WAIFU SORTER — elo.js  (ШАГ 1: ядро рейтинга)
 *
 * Чистая математика Эло. Никакого DOM, никаких localStorage —
 * только функции, которые принимают числа и возвращают числа.
 * Это фундамент: на нём будут стоять канон (Шаг 2), персональная
 * дельта (Шаг 3) и турнирные режимы (Шаг 4+).
 *
 * Подключение: <script src="elo.js"></script> ПЕРЕД script.js.
 * Всё живёт под глобальным объектом window.Elo, чтобы не плодить
 * глобальные функции.
 *
 * Быстрый тест в консоли браузера:
 *   Elo.expected(1500, 1500)        // 0.5  — равные шансы
 *   Elo.expected(1700, 1500)        // ~0.76 — фаворит
 *   Elo.kFactor(5)                  // 40   — новичок, большой шаг
 *   Elo.match(1500, 1500, 'a')      // { a: 1520, b: 1480, ... }
 *   Elo.match(1500, 1500, 'tie')    // { a: 1500, b: 1500, ... }
 * ══════════════════════════════════════════════════════════════════
 */

(function (global) {
  'use strict';

  // ──────────────────────────────────────────────
  // КОНСТАНТЫ
  // ──────────────────────────────────────────────

  /** Стартовый рейтинг любого персонажа «с нуля» */
  const DEFAULT_RATING = 1500;

  /**
   * Динамический K-фактор: насколько сильно один матч двигает рейтинг.
   * Много игр сыграно → рейтинг устоялся → маленький шаг (стабильность).
   * Мало игр → рейтинг ещё ищет своё место → большой шаг (быстрая сходимость).
   *
   * Пороги можно крутить — это главная «ручка чувствительности» проекта.
   */
  const K_SCHEDULE = [
    { maxGames: 30,       k: 40 }, // первые 30 игр — ищем место агрессивно
    { maxGames: 100,      k: 20 }, // дальше — спокойнее
    { maxGames: Infinity, k: 10 }, // ветераны — почти зацементированы
  ];

  // ──────────────────────────────────────────────
  // ЯДРО
  // ──────────────────────────────────────────────

  /**
   * Ожидаемый счёт игрока A против игрока B (вероятность победы A), 0..1.
   * Классическая логистическая кривая Эло с шагом 400 очков = ×10 шансов.
   *
   * @param {number} ratingA — рейтинг A
   * @param {number} ratingB — рейтинг B
   * @returns {number} вероятность победы A в диапазоне (0, 1)
   */
  function expected(ratingA, ratingB) {
    return 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400));
  }

  /**
   * Возвращает K-фактор по числу сыгранных персонажем игр.
   * @param {number} gamesPlayed — сколько матчей сыграл персонаж
   * @returns {number} K
   */
  function kFactor(gamesPlayed) {
    const g = Math.max(0, gamesPlayed | 0);
    for (const tier of K_SCHEDULE) {
      if (g < tier.maxGames) return tier.k;
    }
    return K_SCHEDULE[K_SCHEDULE.length - 1].k;
  }

  /**
   * Нормализует исход матча в числовой счёт игрока A.
   *   'a'   → 1   (A победил)
   *   'b'   → 0   (B победил)
   *   'tie' → 0.5 (ничья)
   * Также принимает уже готовое число 0..1 (тогда возвращает его как есть).
   *
   * @param {('a'|'b'|'tie'|number)} outcome
   * @returns {number} счёт A в диапазоне [0, 1]
   */
  function outcomeToScore(outcome) {
    if (outcome === 'a')   return 1;
    if (outcome === 'b')   return 0;
    if (outcome === 'tie') return 0.5;
    if (typeof outcome === 'number') {
      // на всякий случай зажимаем в [0,1]
      return Math.min(1, Math.max(0, outcome));
    }
    throw new Error('Elo.outcomeToScore: неизвестный исход "' + outcome + '"');
  }

  /**
   * Рассчитывает новые рейтинги пары после одного матча.
   *
   * K-фактор берётся индивидуально для каждого бойца по числу его игр —
   * поэтому новичок против ветерана: новичок прыгает сильно, ветеран чуть.
   *
   * @param {number} ratingA — текущий рейтинг A
   * @param {number} ratingB — текущий рейтинг B
   * @param {('a'|'b'|'tie'|number)} outcome — исход с точки зрения A
   * @param {object} [opts]
   * @param {number} [opts.gamesA=0] — сколько игр сыграл A (для K)
   * @param {number} [opts.gamesB=0] — сколько игр сыграл B (для K)
   * @param {number} [opts.k]        — принудительный общий K (переопределяет динамический)
   * @returns {{a:number, b:number, deltaA:number, deltaB:number, expectedA:number}}
   */
  function match(ratingA, ratingB, outcome, opts) {
    opts = opts || {};
    const scoreA = outcomeToScore(outcome);
    const scoreB = 1 - scoreA;

    const expA = expected(ratingA, ratingB);
    const expB = 1 - expA;

    const kA = (opts.k != null) ? opts.k : kFactor(opts.gamesA || 0);
    const kB = (opts.k != null) ? opts.k : kFactor(opts.gamesB || 0);

    const deltaA = kA * (scoreA - expA);
    const deltaB = kB * (scoreB - expB);

    const newA = Math.round(ratingA + deltaA);
    const newB = Math.round(ratingB + deltaB);

    return {
      a: newA,
      b: newB,
      deltaA: newA - ratingA, // округлённая фактическая дельта
      deltaB: newB - ratingB,
      expectedA: expA,        // полезно для отладки/режима «вероятность»
    };
  }

  // ──────────────────────────────────────────────
  // КОНВЕРТЕР: журнал поединков → стартовый канон (ШАГ 2)
  // ──────────────────────────────────────────────

  /**
   * Строит стартовый Эло-канон, прогоняя журнал поединков (battleLog)
   * через формулу Эло. Все стартуют с DEFAULT_RATING (1500), затем
   * каждый поединок последовательно двигает рейтинги.
   *
   * Почему так, а не «места 1..44 → линейная шкала»: реальные поединки
   * дают естественные разрывы. Близкие по силе персонажи окажутся в
   * пределах десятков очков, явные фавориты — оторвутся на сотни.
   * Это честнее равных ступенек.
   *
   * Привязка по `id` (через leftId/rightId в журнале). Если в журнале
   * только имена (старый формат) — пытаемся сопоставить по name через
   * переданный список characters, но это запасной путь.
   *
   * @param {Array} battleLog — массив записей вида
   *        { leftId, rightId, outcome:'left'|'right'|'tie', left, right, ... }
   * @param {Array} characters — массив персонажей [{id, name, ...}]
   *        нужен, чтобы (а) включить в канон тех, кто не дрался,
   *        (б) подстраховать сопоставление по имени.
   * @param {object} [opts]
   * @param {number} [opts.startRating=1500] — стартовый рейтинг всех
   * @param {boolean} [opts.dynamicK=true]   — динамический K по числу игр
   * @param {number} [opts.fixedK=32]        — K, если dynamicK=false
   * @returns {{ ratings: Object, order: Array, unmatched: number }}
   *          ratings: { [id]: { rating, games, w, l, t } }
   *          order:   массив id, отсортированный по убыванию рейтинга
   *          unmatched: сколько записей журнала не удалось сопоставить
   */
  function buildCanon(battleLog, characters, opts) {
    opts = opts || {};
    const startRating = opts.startRating != null ? opts.startRating : DEFAULT_RATING;
    const dynamicK = opts.dynamicK !== false;
    const fixedK = opts.fixedK != null ? opts.fixedK : 32;

    // Карта имя → id для запасного сопоставления старого формата журнала
    const nameToId = {};
    (characters || []).forEach(c => {
      if (c && c.name != null) nameToId[c.name] = c.id;
    });

    // Инициализируем всех персонажей стартовым рейтингом —
    // даже тех, кто не участвовал ни в одном поединке.
    const ratings = {};
    (characters || []).forEach(c => {
      if (c && c.id != null) {
        ratings[c.id] = { rating: startRating, games: 0, w: 0, l: 0, t: 0 };
      }
    });

    // Достаёт id из записи журнала: сначала leftId/rightId, иначе по имени.
    function resolveId(entry, side) {
      const idField = side === 'left' ? entry.leftId : entry.rightId;
      if (idField != null) return idField;
      const nameField = side === 'left' ? entry.left : entry.right;
      return nameToId[nameField]; // может быть undefined
    }

    // Гарантирует наличие записи рейтинга (на случай id из журнала,
    // которого нет в characters — например удалённый персонаж).
    function ensure(id) {
      if (!ratings[id]) {
        ratings[id] = { rating: startRating, games: 0, w: 0, l: 0, t: 0 };
      }
      return ratings[id];
    }

    let unmatched = 0;

    (battleLog || []).forEach(entry => {
      const idA = resolveId(entry, 'left');
      const idB = resolveId(entry, 'right');

      if (idA == null || idB == null || idA === idB) {
        unmatched++;
        return; // пропускаем нераспознанную/самосопоставленную запись
      }

      const A = ensure(idA);
      const B = ensure(idB);

      // outcome журнала ('left'|'right'|'tie') → исход с точки зрения A
      let outcome;
      if (entry.outcome === 'left')  outcome = 'a';
      else if (entry.outcome === 'right') outcome = 'b';
      else outcome = 'tie';

      const res = match(A.rating, B.rating, outcome, {
        gamesA: A.games,
        gamesB: B.games,
        k: dynamicK ? undefined : fixedK,
      });

      A.rating = res.a;
      B.rating = res.b;
      A.games++; B.games++;

      if (outcome === 'a') { A.w++; B.l++; }
      else if (outcome === 'b') { B.w++; A.l++; }
      else { A.t++; B.t++; }
    });

    // Итоговый порядок по убыванию рейтинга
    const order = Object.keys(ratings).sort(
      (x, y) => ratings[y].rating - ratings[x].rating
    );

    return { ratings, order, unmatched };
  }

  /**
   * Формирует ГОТОВЫЙ текст ratings.json из результата buildCanon.
   * Запусти в консоли после прогона, скопируй вывод в файл ratings.json
   * и закоммить. Это твой авторский канон.
   *
   * Формат файла:
   * {
   *   "version": 1,
   *   "generated": "2026-06-28",
   *   "baseElo": { "<id>": <число>, ... }
   * }
   *
   * @param {object} canon — результат buildCanon ({ ratings, order })
   * @returns {string} pretty-printed JSON
   */
  function exportCanonJSON(canon) {
    const baseElo = {};
    // Пишем в порядке убывания рейтинга — файл читается как рейтинг-таблица
    canon.order.forEach(id => {
      baseElo[id] = canon.ratings[id].rating;
    });
    const payload = {
      version: 1,
      generated: new Date().toISOString().slice(0, 10),
      baseElo,
    };
    return JSON.stringify(payload, null, 2);
  }

  // ──────────────────────────────────────────────
  // ЭКСПОРТ
  // ──────────────────────────────────────────────

  global.Elo = {
    DEFAULT_RATING,
    K_SCHEDULE,
    expected,
    kFactor,
    outcomeToScore,
    match,
    buildCanon,
    exportCanonJSON,
  };

})(window);
