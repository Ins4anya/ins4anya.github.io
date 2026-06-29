/**
 * ══════════════════════════════════════════════════════════════════
 * SPIKE CHUNSOFT WAIFU SORTER — tournament.js  (ШАГ 4)
 *
 * Single Elimination с битвой за 3 место. Чистая логика bracket:
 * seeding, продвижение по раундам, разведение сильных по сетке.
 * UI здесь НЕТ — только состояние и переходы. Рендер и события —
 * в script.js (следующая часть шага).
 *
 * Зависит от: window.Elo, window.EloPersonal. Подключать ПОСЛЕ них.
 *
 * Жизненный цикл:
 *   const T = Tournament.create(participants);   // собрать сетку
 *   T.currentMatch()      // → { a, b, round, matchIndex } или null
 *   T.pick('a' | 'b')     // зафиксировать победителя текущего матча
 *   T.isComplete()        // → true, когда финал и матч за 3-е сыграны
 *   T.standings()         // → [{id, place}] итоговые места
 *   T.bracket             // вся структура для отрисовки сетки
 *
 * Seeding (классический): сильнейший против слабейшего, сильные
 * разведены по противоположным половинам — встречаются поздно.
 * ══════════════════════════════════════════════════════════════════
 */

(function (global) {
  'use strict';

  // ──────────────────────────────────────────────
  // РАЗМЕР СЕТКИ
  // ──────────────────────────────────────────────

  /** Ближайшая снизу степень двойки, потолок 32. n<2 → 0 (турнир невозможен). */
  function bracketSize(n) {
    if (n < 2) return 0;
    let size = 1;
    while (size * 2 <= n && size < 32) size *= 2;
    return size;
  }

  /**
   * Классический порядок сидов для сетки размера `size`.
   * Возвращает массив позиций: seedOrder(8) = [1,8,5,4,3,6,7,2]
   * (в терминах сидов 1..size). Гарантирует, что сид 1 и сид 2
   * встретятся только в финале, 1 и 4 — не раньше полуфинала, и т.д.
   *
   * Строится рекурсивно: каждый раунд «зеркалит» предыдущий,
   * добавляя дополнения до (текущий_размер*2 + 1).
   */
  function seedOrder(size) {
    let rounds = Math.log2(size);
    let order = [1, 2];
    for (let r = 1; r < rounds; r++) {
      const next = [];
      const sum = order.length * 2 + 1;
      for (const s of order) {
        next.push(s);
        next.push(sum - s);
      }
      order = next;
    }
    return order;
  }

  // ──────────────────────────────────────────────
  // СБОРКА ТУРНИРА
  // ──────────────────────────────────────────────

  /**
   * Создаёт турнир из списка участников.
   *
   * @param {Array} participants — массив персонажей [{id, name, ...}],
   *        УЖЕ отсортированный по убыванию Эло (сид 1 = первый).
   *        Если длиннее ближайшей степени двойки — лишние (слабейшие)
   *        отсекаются квалификацией.
   * @returns {object} объект турнира с методами currentMatch/pick/...
   */
  function create(participants) {
    const size = bracketSize(participants.length);
    if (size === 0) {
      throw new Error('Tournament.create: нужно минимум 2 участника');
    }

    // Квалификация: берём топ-`size` (участники уже отсортированы по Эло)
    const qualified = participants.slice(0, size);
    const cut = participants.slice(size); // отсечённые (для показа «не прошли»)

    // Расставляем по позициям согласно классическому seeding
    const order = seedOrder(size); // массив сидов 1..size в порядке слотов
    const slots = order.map(seed => qualified[seed - 1]);

    // Строим раунды. round[0] — первый раунд (size/2 матчей).
    // Каждый матч: { a, b, winner: null, aSeed, bSeed }
    const rounds = [];
    let roundSlots = slots;
    while (roundSlots.length > 1) {
      const matches = [];
      for (let i = 0; i < roundSlots.length; i += 2) {
        matches.push({
          a: roundSlots[i],
          b: roundSlots[i + 1],
          winner: null,        // 'a' | 'b' после выбора
          aSeed: qualified.indexOf(roundSlots[i]) + 1,
          bSeed: qualified.indexOf(roundSlots[i + 1]) + 1,
        });
      }
      rounds.push(matches);
      // следующий раунд — пустые слоты (заполнятся победителями)
      roundSlots = new Array(matches.length).fill(null);
    }

    // Матч за 3 место — отдельный, разыгрывается между проигравшими
    // полуфиналов после финала. Создаём заглушку, заполним позже.
    const thirdPlace = { a: null, b: null, winner: null, aSeed: null, bSeed: null };

    const T = {
      size,
      qualified,
      cut,
      rounds,
      thirdPlace,
      // указатели текущей позиции
      _r: 0,          // индекс раунда
      _m: 0,          // индекс матча в раунде
      _phase: 'main', // 'main' → основная сетка, 'third' → за 3-е, 'done'
    };

    return makeApi(T);
  }

  // ──────────────────────────────────────────────
  // API ТУРНИРА
  // ──────────────────────────────────────────────

  function makeApi(T) {

    /** Текущий незавершённый матч или null, если турнир окончен. */
    function currentMatch() {
      if (T._phase === 'done') return null;

      if (T._phase === 'third') {
        if (T.thirdPlace.winner != null) return null;
        return {
          a: T.thirdPlace.a,
          b: T.thirdPlace.b,
          round: 'third',
          roundName: 'Битва за 3 место',
          matchIndex: 0,
        };
      }

      // основная фаза
      const match = T.rounds[T._r][T._m];
      return {
        a: match.a,
        b: match.b,
        round: T._r,
        roundName: roundName(T._r, T.rounds.length),
        matchIndex: T._m,
      };
    }

    /**
     * Фиксирует победителя текущего матча.
     * @param {'a'|'b'} side — кто победил
     * @returns {object|null} следующий матч (currentMatch) или null
     */
    function pick(side) {
      if (side !== 'a' && side !== 'b') {
        throw new Error("Tournament.pick: ожидается 'a' или 'b'");
      }

      if (T._phase === 'third') {
        T.thirdPlace.winner = side;
        T._phase = 'done';
        return null;
      }

      const round = T.rounds[T._r];
      const match = round[T._m];
      match.winner = side;
      const winner = side === 'a' ? match.a : match.b;

      // Продвигаем победителя в следующий раунд (если он есть)
      const isLastRound = T._r === T.rounds.length - 1;
      if (!isLastRound) {
        const nextRound = T.rounds[T._r + 1];
        const nextMatchIdx = Math.floor(T._m / 2);
        const slot = (T._m % 2 === 0) ? 'a' : 'b';
        nextRound[nextMatchIdx][slot] = winner;
        // обновим сид в следующем матче
        const seed = side === 'a' ? match.aSeed : match.bSeed;
        nextRound[nextMatchIdx][slot + 'Seed'] = seed;
      }

      // Если это полуфинал (предпоследний раунд) — собираем проигравших
      // в матч за 3 место.
      const isSemifinal = T._r === T.rounds.length - 2;
      if (isSemifinal) {
        const loser = side === 'a' ? match.b : match.a;
        const loserSeed = side === 'a' ? match.bSeed : match.aSeed;
        if (T.thirdPlace.a == null) {
          T.thirdPlace.a = loser;
          T.thirdPlace.aSeed = loserSeed;
        } else {
          T.thirdPlace.b = loser;
          T.thirdPlace.bSeed = loserSeed;
        }
      }

      // Двигаем указатель
      return advance();
    }

    /** Переход к следующему незавершённому матчу. Возвращает currentMatch. */
    function advance() {
      // следующий матч в текущем раунде?
      if (T._m + 1 < T.rounds[T._r].length) {
        T._m++;
        return currentMatch();
      }

      // раунд закончился — следующий раунд
      if (T._r + 1 < T.rounds.length) {
        T._r++;
        T._m = 0;
        return currentMatch();
      }

      // основная сетка завершена (финал сыгран) → матч за 3 место
      // (только если он осмыслен — т.е. был полуфинал, size >= 4)
      if (T.thirdPlace.a != null && T.thirdPlace.b != null) {
        T._phase = 'third';
        return currentMatch();
      }

      // турнир из 2 участников — нет матча за 3-е
      T._phase = 'done';
      return null;
    }

    /** Завершён ли турнир. */
    function isComplete() {
      return T._phase === 'done';
    }

    /**
     * Граница раунда: вернётся true, если ТОЛЬКО ЧТО закрылся раунд
     * (текущий матч — первый в новом раунде или фаза сменилась).
     * Используется UI, чтобы показать сетку на стыках.
     */
    function atRoundBoundary() {
      if (T._phase === 'third') return true;     // вход в матч за 3-е
      if (T._phase === 'done') return true;      // финал окончен
      return T._m === 0;                          // первый матч раунда
    }

    /**
     * Итоговые места. Доступно после isComplete().
     * @returns {Array<{id, place}>}
     */
    function standings() {
      const final = T.rounds[T.rounds.length - 1][0];
      const champSide = final.winner;
      const champion = champSide === 'a' ? final.a : final.b;
      const runnerUp = champSide === 'a' ? final.b : final.a;

      const result = [];
      if (champion) result.push({ id: champion.id, place: 1, char: champion });
      if (runnerUp) result.push({ id: runnerUp.id, place: 2, char: runnerUp });

      // 3 и 4 места из матча за 3-е (если был)
      if (T.thirdPlace.winner != null) {
        const tp = T.thirdPlace;
        const third = tp.winner === 'a' ? tp.a : tp.b;
        const fourth = tp.winner === 'a' ? tp.b : tp.a;
        if (third) result.push({ id: third.id, place: 3, char: third });
        if (fourth) result.push({ id: fourth.id, place: 4, char: fourth });
      }

      return result;
    }

    function roundName(roundIdx, totalRounds) {
      const fromEnd = totalRounds - roundIdx; // 1 = финал, 2 = полуфинал...
      if (fromEnd === 1) return 'Финал';
      if (fromEnd === 2) return 'Полуфинал';
      if (fromEnd === 3) return 'Четвертьфинал';
      const matchesInRound = Math.pow(2, fromEnd - 1);
      return `1/${matchesInRound} финала`;
    }

    return {
      // данные
      get size() { return T.size; },
      get qualified() { return T.qualified; },
      get cut() { return T.cut; },
      get rounds() { return T.rounds; },
      get thirdPlace() { return T.thirdPlace; },
      get phase() { return T._phase; },
      // методы
      currentMatch,
      pick,
      advance,
      isComplete,
      atRoundBoundary,
      standings,
    };
  }

  // ──────────────────────────────────────────────
  // ЭКСПОРТ
  // ──────────────────────────────────────────────

  global.Tournament = {
    bracketSize,
    seedOrder,
    create,
  };

})(window);