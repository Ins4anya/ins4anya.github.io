/**
 * ══════════════════════════════════════════════════════════════════
 * SPIKE CHUNSOFT WAIFU SORTER — bracket-svg.js  (ШАГ 4c)
 *
 * Рисует турнирную сетку как SVG. Чистая функция: принимает объект
 * турнира (Tournament), возвращает строку SVG. Без зависимостей от DOM.
 *
 * Зависит от: window.EloPersonal (для подписи Эло; опционально).
 * Подключать ПОСЛЕ tournament.js.
 *
 * Использование:
 *   const svg = BracketSVG.render(state.tournament, { highlightCurrent: true });
 *   someDiv.innerHTML = svg;
 *
 * Структура турнира (из tournament.js):
 *   T.rounds      — массив раундов; round[i] = массив матчей
 *                   матч = { a, b, winner:'a'|'b'|null, aSeed, bSeed }
 *   T.thirdPlace  — { a, b, winner, aSeed, bSeed }
 *   T.size        — размер сетки
 * ══════════════════════════════════════════════════════════════════
 */

(function (global) {
  'use strict';

  // ──────────────────────────────────────────────
  // ГЕОМЕТРИЯ (можно крутить под вкус)
  // ──────────────────────────────────────────────

  const CFG = {
    boxW: 300,        // ширина карточки матча (слота)
    boxH: 60,         // высота одного слота (бойца)
    matchGap: 32,     // вертикальный зазор между матчами в первом раунде
    roundGap: 96,     // горизонтальный зазор между раундами
    padX: 32,         // поля слева/справа
    padY: 48,         // поля сверху/снизу
    connector: 28,    // длина «локтя» соединительной линии
  };

  // ──────────────────────────────────────────────
  // ВСПОМОГАТЕЛЬНОЕ
  // ──────────────────────────────────────────────

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function eloOf(char) {
    if (char && char.id && global.EloPersonal &&
        typeof EloPersonal.getElo === 'function') {
      return EloPersonal.getElo(char.id);
    }
    return null;
  }

  /** Короткое имя для тесной карточки: «Kyoko Kirigiri» → «Kyoko K.» */
  function shortName(name) {
    if (!name) return '';
    const parts = String(name).split(' ');
    if (parts.length === 1) return parts[0];
    return parts[0] + ' ' + parts[1][0] + '.';
  }

  // ──────────────────────────────────────────────
  // РАСЧЁТ ПОЗИЦИЙ
  // ──────────────────────────────────────────────

  /**
   * Вертикальный центр матча `m` в раунде `r`.
   * Первый раунд — равномерно. Дальше — среднее между двумя матчами-
   * источниками предыдущего раунда (классическое «дерево» сетки).
   */
  function matchCenterY(r, m, firstRoundCount) {
    const slotPair = CFG.boxH * 2;           // высота матча (два слота)
    const unit = slotPair + CFG.matchGap;    // шаг между матчами 1-го раунда
    if (r === 0) {
      return CFG.padY + m * unit + slotPair / 2;
    }
    // центр = среднее между двумя детьми (2m и 2m+1) предыдущего раунда
    const childA = matchCenterY(r - 1, m * 2, firstRoundCount);
    const childB = matchCenterY(r - 1, m * 2 + 1, firstRoundCount);
    return (childA + childB) / 2;
  }

  function roundX(r) {
    return CFG.padX + r * (CFG.boxW + CFG.roundGap);
  }

  // ──────────────────────────────────────────────
  // ОТРИСОВКА ЭЛЕМЕНТОВ
  // ──────────────────────────────────────────────

  /** Один слот бойца (имя + сид + опц. Эло). */
function slotSVG(x, y, char, seed, state) {
  const cls = 'br-slot br-' + state;
  const name = char ? shortName(char.name) : '—';
  const elo = char ? eloOf(char) : null;
  const seedTxt = seed != null ? '#' + seed : '';

  let inner =
    `<rect class="br-box" x="${x}" y="${y}" width="${CFG.boxW}" height="${CFG.boxH}" rx="8"/>`;
  inner +=
    `<text class="br-seed" x="${x + 12}" y="${y + CFG.boxH / 2}" font-size="20" dominant-baseline="central">${seedTxt}</text>`;
  inner +=
    `<text class="br-name" x="${x + 52}" y="${y + CFG.boxH / 2}" font-size="24" dominant-baseline="central">${esc(name)}</text>`;
  if (elo != null) {
    inner +=
      `<text class="br-elo" x="${x + CFG.boxW - 12}" y="${y + CFG.boxH / 2}" font-size="20" text-anchor="end" dominant-baseline="central">${elo}</text>`;
  }
  return `<g class="${cls}">${inner}</g>`;
}

  /** Соединительная линия от матча к следующему раунду (локоть). */
  function connectorSVG(x1, y1, x2, y2) {
    const midX = x1 + CFG.connector;
    return `<path class="br-line" d="M ${x1} ${y1} H ${midX} V ${y2} H ${x2}" fill="none"/>`;
  }

  // ──────────────────────────────────────────────
  // ГЛАВНАЯ ФУНКЦИЯ
  // ──────────────────────────────────────────────

  /**
   * Рендерит сетку турнира в SVG-строку.
   * @param {object} T — объект Tournament (с геттерами rounds/thirdPlace/size)
   * @param {object} [opts]
   * @param {boolean} [opts.showThird=true] — рисовать матч за 3-е место
   * @returns {string} SVG-разметка
   */
  function render(T, opts) {
    opts = opts || {};
    const showThird = opts.showThird !== false;
    const rounds = T.rounds;
    if (!rounds || !rounds.length) return '<svg></svg>';

    const firstRoundCount = rounds[0].length;
    const totalRounds = rounds.length;

    // размеры холста
    const width = CFG.padX * 2 + totalRounds * CFG.boxW + (totalRounds - 1) * CFG.roundGap;
    const lastMatchY = matchCenterY(0, firstRoundCount - 1, firstRoundCount);
    let height = CFG.padY * 2 + lastMatchY + CFG.boxH;

    // место под матч за 3-е (снизу)
    const hasThird = showThird && T.thirdPlace && T.thirdPlace.a != null;
    const thirdY = height; // позиция блока за 3-е
    if (hasThird) height += CFG.boxH * 2 + CFG.matchGap + 30;

    let body = '';

    // ── матчи и соединители ──
    rounds.forEach((round, r) => {
      const x = roundX(r);
      round.forEach((mt, m) => {
        const cy = matchCenterY(r, m, firstRoundCount);
        const yA = cy - CFG.boxH;     // верхний слот
        const yB = cy;                // нижний слот

        const aState = mt.winner === 'a' ? 'win' : (mt.winner === 'b' ? 'lose' : (mt.a ? 'wait' : 'empty'));
        const bState = mt.winner === 'b' ? 'win' : (mt.winner === 'a' ? 'lose' : (mt.b ? 'wait' : 'empty'));

        body += slotSVG(x, yA, mt.a, mt.aSeed, aState);
        body += slotSVG(x, yB, mt.b, mt.bSeed, bState);

        // соединитель к следующему раунду
        if (r < totalRounds - 1) {
          const nextX = roundX(r + 1);
          const nextCy = matchCenterY(r + 1, Math.floor(m / 2), firstRoundCount);
          const fromX = x + CFG.boxW;
          body += connectorSVG(fromX, cy, nextX, nextCy);
        }
      });
    });

    // ── матч за 3 место ──
    if (hasThird) {
      const tp = T.thirdPlace;
      const x = roundX(totalRounds - 2); // под полуфиналом примерно
      const yA = thirdY;
      const yB = thirdY + CFG.boxH;
      const aState = tp.winner === 'a' ? 'win' : (tp.winner === 'b' ? 'lose' : 'wait');
      const bState = tp.winner === 'b' ? 'win' : (tp.winner === 'a' ? 'lose' : 'wait');
      body += `<text class="br-label" font-size="16" x="${x}" y="${thirdY - 14}">Битва за 3 место</text>`;
      body += slotSVG(x, yA, tp.a, tp.aSeed, aState);
      body += slotSVG(x, yB, tp.b, tp.bSeed, bState);
    }

    // ── заголовки раундов ──
    let headers = '';
    rounds.forEach((round, r) => {
      const x = roundX(r);
      const label = roundLabel(r, totalRounds);
      headers += `<text class="br-header" font-size="18" x="${x}" y="24">${esc(label)}</text>`;
    });

    return `<svg class="bracket-svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">${headers}${body}</svg>`;
  }

  function roundLabel(r, total) {
    const fromEnd = total - r;
    if (fromEnd === 1) return 'Финал';
    if (fromEnd === 2) return 'Полуфинал';
    if (fromEnd === 3) return '1/4';
    return '1/' + Math.pow(2, fromEnd - 1);
  }

  // ──────────────────────────────────────────────
  // ЭКСПОРТ
  // ──────────────────────────────────────────────

  global.BracketSVG = { render, CFG };

})(window);