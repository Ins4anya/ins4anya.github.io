/**
 * ══════════════════════════════════════════════════════════════════
 * SPIKE CHUNSOFT WAIFU SORTER — script.js
 *
 * АРХИТЕКТУРА:
 *   characters.js — данные персонажей (CHARACTERS, GAMES)
 *   script.js     — логика приложения (алгоритм, UI, события)
 *
 * АЛГОРИТМ (Interactive Merge Sort):
 *   - Классический сортировкой слиянием делит массив пополам рекурсивно.
 *   - На этапе merge() два отсортированных подмассива сравниваются
 *     поэлементно. Вместо автоматического сравнения мы ПРИОСТАНАВЛИВАЕМ
 *     выполнение и задаём вопрос пользователю: "Кто лучше: A или B?"
 *   - Пользователь нажимает кнопку → алгоритм получает ответ и
 *     продолжает merge() с этим результатом.
 *   - Итого сравнений: O(n log n) — намного меньше, чем n*(n-1)/2 при
 *     наивном попарном переборе. Для 114 персонажей: ~770 vs 6441.
 *   - "Ничья" и "Пропустить" не меняют относительный порядок текущей пары.
 * ══════════════════════════════════════════════════════════════════
 */

// ══════════════════════════════════════════════════════
// 2. STATE — состояние приложения
// ══════════════════════════════════════════════════════
const state = {
  activeGames: new Set(GAMES.map(g => g.id)), // все включены по умолчанию
  mode: 'sort',   // 'sort' | 'tournament' — выбранный режим
  tournament: null, //активный объект Tournament
  characters: [],     // отфильтрованный список

  // Merge sort engine
  sortQueue: [],      // очередь пар для сравнения (от merge)
  sortCallback: null, // функция, ждущая ответа пользователя
  sorted: [],         // финальный отсортированный массив
  totalComparisons: 0,
  doneComparisons: 0,

  // Подсчёт очков (W/L по реальным поединкам)
  scores: new Map(),       // ключ персонажа -> { w, l }
  currentPair: null,       // { left, right } — пара в текущем поединке
  showBattleScore: false,  // показывать ли счёт под карточками в бою (по умолч. скрыт)
  battleLog: [],           // журнал всех поединков для отладки/просмотра

  // Результат
  result: [],
  honorableMention: null, // индекс выбранной любимки в state.result (или null)
};

/** Уникальный ключ персонажа для таблицы очков */
function charKey(char) {
  return `${char.name}|${char.game}`;
}

/** Возвращает запись очков персонажа (создаёт при отсутствии) */
function getScore(char) {
  const key = charKey(char);
  if (!state.scores.has(key)) state.scores.set(key, { w: 0, l: 0 });
  return state.scores.get(key);
}

/**
 * Сглаженный винрейт («сила») по методу Лапласа: (W + 1) / (W + L + 2).
 * При малом числе игр тянется к 50% и не раздувается от 1-2 случайных побед.
 * Возвращает целый процент 0..100.
 */
function strengthPct(char) {
  const s = getScore(char);
  const g = s.w + s.l;
  if (g === 0) return 50; // ещё не играл — нейтрально
  return Math.round(((s.w + 1) / (g + 2)) * 100);
}

/** Форматирует счёт персонажа: "3–1 · 70%" */
function formatScore(char) {
  const s = getScore(char);
  return `${s.w}–${s.l} · ${strengthPct(char)}%`;
}

/**
 * Безопасно достаёт итоговый Эло персонажа (канон + личная дельта).
 * Возвращает null, если персональный слой ещё не готов или нет id —
 * тогда вызывающий код просто не покажет Эло (без ошибок).
 */
function eloOf(char) {
  if (char && char.id && window.EloPersonal &&
      typeof EloPersonal.getElo === 'function') {
    return EloPersonal.getElo(char.id);
  }
  return null;
}
 
/**
 * Строка счёта для БОЯ: «3–1 · 70% · 1639 Эло».
 * Если Эло недоступен — показывает только «3–1 · 70%».
 */
function formatScoreWithElo(char) {
  const base = formatScore(char);
  const elo = eloOf(char);
  return elo != null ? `${base} · ${elo} Эло` : base;
}
 
/**
 * Двухуровневый HTML для РЕЗУЛЬТАТОВ: Эло крупным числом, W-L подписью.
 * Если Эло недоступен — откатывается к обычному formatScore.
 */
function formatResultScore(char) {
  const elo = eloOf(char);
  const sub = formatScore(char); // «3–1 · 70%»
  if (elo == null) {
    return `<div class="score-main">${sub}</div>`;
  }
  // Накопленная личная дельта (из персонального слоя)
  let deltaBadge = '';
  if (char.id && window.EloPersonal) {
    const d = EloPersonal.getDelta(char.id);
    if (d !== 0) {
      const sign = d > 0 ? '+' : '';
      const cls  = d > 0 ? 'delta-up' : 'delta-down';
      deltaBadge = `<span class="score-delta ${cls}">${sign}${d}</span>`;
    }
  }
  return `
    <div class="score-elo">${elo}<span class="score-elo-unit"> Эло</span>${deltaBadge}</div>
    <div class="score-sub">${sub}</div>
  `;
}

// ══════════════════════════════════════════════════════
// 3. SORT ENGINE — Interactive Merge Sort
// ══════════════════════════════════════════════════════

/**
 * Запускает сортировку.
 * Возвращает Promise, который резолвится в отсортированный массив.
 */
async function interactiveMergeSort(arr) {
  if (arr.length <= 1) return arr;
  const mid = Math.floor(arr.length / 2);
  const left  = await interactiveMergeSort(arr.slice(0, mid));
  const right = await interactiveMergeSort(arr.slice(mid));
  return merge(left, right);
}

/**
 * Слияние двух отсортированных массивов.
 * При каждом сравнении двух элементов — вызывает askUser(),
 * который возвращает -1 (левый лучше), 1 (правый лучше) или 0 (ничья/пропуск).
 */
async function merge(left, right) {
  const result = [];
  let i = 0, j = 0;

  while (i < left.length && j < right.length) {
    const cmp = await askUser(left[i], right[j]);
    if (cmp <= 0) {
      // Левый >= правого (cmp = -1: левый лучше, cmp = 0: ничья — берём левого первым)
      result.push(left[i++]);
    } else {
      // Правый лучше
      result.push(right[j++]);
    }
  }

  // Добавляем оставшиеся (они уже отсортированы внутри своего подмассива)
  while (i < left.length) result.push(left[i++]);
  while (j < right.length) result.push(right[j++]);
  return result;
}

/**
 * Приостанавливает алгоритм и показывает пользователю пару персонажей.
 * Возвращает Promise<-1 | 0 | 1>:
 *   -1 = левый лучше (left wins)
 *    0 = ничья / пропуск
 *    1 = правый лучше (right wins)
 */
function askUser(charA, charB) {
  return new Promise((resolve) => {
    // Сохраняем callback в state, чтобы кнопки могли его вызвать
    state.sortCallback = resolve;
    state.currentPair = { left: charA, right: charB }; // для начисления очков
    state.doneComparisons++;
    updateBattleScreen(charA, charB);
    updateProgress();
  });
}

/**
 * Оценка общего числа сравнений для n элементов:
 * n * ceil(log2(n)) — верхняя граница merge sort
 */
function estimateComparisons(n) {
  if (n <= 1) return 0;
  return Math.ceil(n * Math.log2(n));
}

// ══════════════════════════════════════════════════════
// 4. UI LAYER
// ══════════════════════════════════════════════════════

// ── DOM-ссылки ──
const screens = {
  start:  document.getElementById('screen-start'),
  battle: document.getElementById('screen-battle'),
  result: document.getElementById('screen-result'),
};

/** Переключает активный экран */
function showScreen(name) {
  Object.values(screens).forEach(s => s.classList.remove('active'));
  screens[name].classList.add('active');
  window.scrollTo(0, 0);
}

// ─────────────────────────────────
// СТАРТОВЫЙ ЭКРАН
// ─────────────────────────────────

function renderStartScreen() {
  renderFilterGrid();
  renderStats();
}

/** Рендерит чекбоксы фильтров */
function renderFilterGrid() {
  const grid = document.getElementById('filter-grid');
  grid.innerHTML = GAMES.map(game => {
    const count = CHARACTERS.filter(c => c.gameId === game.id).length;
    const checked = state.activeGames.has(game.id);
    return `
      <label class="filter-item ${checked ? 'checked' : ''}" data-game-id="${game.id}">
        <input type="checkbox" ${checked ? 'checked' : ''} />
        <span class="filter-checkbox-ui"></span>
        <span class="filter-label">${game.label}</span>
        <span class="filter-count">${count}</span>
      </label>
    `;
  }).join('');

  grid.querySelectorAll('.filter-item').forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const gameId = item.dataset.gameId;
      if (state.activeGames.has(gameId)) {
        // Не даём снять последнюю игру
        if (state.activeGames.size <= 1) return;
        state.activeGames.delete(gameId);
        item.classList.remove('checked');
      } else {
        state.activeGames.add(gameId);
        item.classList.add('checked');
      }
      renderStats();
    });
  });
}

/** Статистика: сколько персонажей/сравнений */
function renderStats() {
  const count = CHARACTERS.filter(c => state.activeGames.has(c.gameId)).length;
  const cmp   = estimateComparisons(count);
  const block = document.getElementById('stat-block');
  block.innerHTML = `
    <div class="stat-item">
      <span class="stat-num">${count}</span>
      <span class="stat-label">Персонажей</span>
    </div>
    <div class="stat-item">
      <span class="stat-num">~${cmp}</span>
      <span class="stat-label">Сравнений</span>
    </div>
    <div class="stat-item">
      <span class="stat-num">${GAMES.filter(g => state.activeGames.has(g.id)).length}</span>
      <span class="stat-label">Игр</span>
    </div>
  `;
}

/** Кнопка "Снять все / Выбрать все" */
let allChecked = true;
document.getElementById('btn-toggle-all').addEventListener('click', () => {
  allChecked = !allChecked;
  GAMES.forEach(g => {
    if (allChecked) state.activeGames.add(g.id);
    else if (GAMES.length > 1 || allChecked) state.activeGames.delete(g.id);
  });
  if (!allChecked) {
    // Оставляем хотя бы одну
    state.activeGames.add(GAMES[0].id);
  }
  document.getElementById('btn-toggle-all').textContent = allChecked ? 'Снять все' : 'Выбрать все';
  renderFilterGrid();
  renderStats();
});

/** Кнопка "Сбросить личный прогресс Эло" — возврат к каноничным значениям из ratings.json */
const btnResetElo = document.getElementById('btn-reset-elo');
if (btnResetElo) {
  btnResetElo.addEventListener('click', () => {
    const ok = confirm(
      'Сбросить личный прогресс Эло?\n\n' +
      'Все рейтинги вернутся к каноничным значениям из ratings.json. ' +
      'Личная история боёв на этом устройстве будет удалена. Это необратимо.'
    );
    if (!ok) return;
    EloPersonal.reset();
    location.reload();
  });
}


// ── Переключатель режимов (Сортировка / Турнир) ──
(function initModeSwitch() {
  const sw = document.getElementById('mode-switch');
  if (!sw) return;
 
  // восстановить сохранённый режим
  try {
    const saved = localStorage.getItem('sc-mode');
    if (saved === 'sort' || saved === 'tournament') state.mode = saved;
  } catch (e) {}
 
  function render() {
    sw.querySelectorAll('.mode-option').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.mode === state.mode);
    });
    // подпись кнопки старта подстраивается под режим
    const startBtn = document.getElementById('btn-start');
    if (startBtn) {
      const label = startBtn.querySelector('span');
      if (label) {
        label.textContent = state.mode === 'tournament'
          ? 'Начать турнир' : 'Начать сортировку';
      }
    }
  }
 
  sw.querySelectorAll('.mode-option').forEach(btn => {
    btn.addEventListener('click', () => {
      state.mode = btn.dataset.mode;
      try { localStorage.setItem('sc-mode', state.mode); } catch (e) {}
      render();
    });
  });
 
  render();
})();

/** Кнопка "Начать" */
      document.getElementById('btn-start').addEventListener('click', () => {
        if (state.mode === 'tournament') {
          startTournament();   // ← появится в шаге 4b
        } else {
          startSorting();
        }
      });

async function startSorting() {
  // Собираем отфильтрованный список и перемешиваем (Fisher-Yates)
  state.characters = CHARACTERS.filter(c => state.activeGames.has(c.gameId));
  shuffleArray(state.characters);

  if (state.characters.length < 2) {
    alert('Выберите хотя бы 2 персонажа (минимум одну игру с несколькими персонажами).');
    return;
  }

  state.totalComparisons = estimateComparisons(state.characters.length);
  state.doneComparisons  = 0;
  state.scores = new Map();   // обнуляем счёт перед новым прогоном
  state.battleLog = [];       // обнуляем журнал поединков
  state.honorableMention = null; // сбрасываем выбор любимки
  state.lastBracketSVG = null;

  // Запускаем переход «смыкание лент»: в момент смыкания показываем арену
  await runTapeTransition(() => {
    showScreen('battle');
    const arena = document.getElementById('battle-arena');
    arena.classList.add('intro'); // зум-появление арены и карточек
    // Снимаем intro после проигрывания анимации появления
    setTimeout(() => arena.classList.remove('intro'), 600);
  });

  // Запускаем алгоритм — он сам будет вызывать askUser() и ждать ответов
  const sorted = await interactiveMergeSort([...state.characters]);
  state.result = sorted;

  // Когда все выборы сделаны — переход со шторками перед показом результатов
  await runTapeTransition(() => {
    showResultScreen();
  });
}

/**
 * Проигрывает переход со шторками: ленты смыкаются к центру, и в момент,
 * когда экран полностью перекрыт, вызывается onClosed() — там и происходит
 * смена экрана (под прикрытием шторок). Затем шторки расходятся.
 *
 * @param {() => void} onClosed — что сделать в момент смыкания (сменить экран и т.п.)
 * @returns {Promise<void>} резолвится в момент смыкания (после onClosed)
 */
function runTapeTransition(onClosed) {
  return new Promise((resolve) => {
    const overlay = document.getElementById('tape-transition');

    const DURATION  = 900; // должно совпадать с CSS-анимацией shutter-*
    const CLOSED_AT = 0.45 * DURATION; // момент полного смыкания

    // Перезапускаем анимацию шторок
    overlay.classList.remove('run');
    void overlay.offsetWidth; // форсируем reflow для рестарта анимации
    overlay.classList.add('run');

    // Когда шторки сомкнулись — выполняем смену экрана под их прикрытием
    setTimeout(() => {
      if (typeof onClosed === 'function') onClosed();
      resolve();
    }, CLOSED_AT);

    // Когда переход полностью завершился — убираем оверлей
    setTimeout(() => {
      overlay.classList.remove('run');
    }, DURATION);
  });
}

/** Fisher-Yates shuffle */
function shuffleArray(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

// ─────────────────────────────────
// ЭКРАН БИТВЫ
// ─────────────────────────────────

/** Обновляет карточки на экране битвы */
function updateBattleScreen(charA, charB) {
  // Левая карточка
  setCard('left',  charA);
  setCard('right', charB);
  refreshBattleScores(); // обновляем строку счёта под карточками
}

/**
 * Обновляет текст счёта под обеими карточками и его видимость.
 * Показ зависит от state.showBattleScore (тумблер / кнопка-глаз).
 */
function refreshBattleScores() {
  const pair = state.currentPair;
  ['left', 'right'].forEach((side) => {
    const el = document.getElementById(`score-${side}`);
    if (!el) return;
    const char = pair ? pair[side] : null;
    el.textContent = char ? formatScoreWithElo(char) : '';
    el.style.display = state.showBattleScore ? '' : 'none';
  });
}

function setCard(side, char) {
  document.getElementById(`name-${side}`).textContent     = char.name;
  document.getElementById(`game-${side}`).textContent     = char.game;
  document.getElementById(`fallback-${side}`).textContent = char.name.split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase();

  const img = document.getElementById(`img-${side}`);
  img.onload  = null;
  img.onerror = null;          // сначала снимаем старые обработчики
  img.classList.remove('error');
  img.alt = char.name;

  const newSrc = char.img || '';
  if (img.src !== newSrc && img.src !== window.location.origin + '/' + newSrc) {
    img.src = newSrc;          // меняем src только если он реально изменился
  } else {
    img.src = newSrc;          // принудительно перезагружаем если тот же путь
  }

  img.onerror = () => img.classList.add('error');
}

/** Обновляет прогресс-бар */
function updateProgress() {
  const pct = Math.min(99, Math.round((state.doneComparisons / state.totalComparisons) * 100));
  document.getElementById('progress-bar').style.width  = pct + '%';
  document.getElementById('progress-text').textContent = pct + '%';
}

// Обработчики кнопок битвы

/** Клик по карточке (мобиле-дружественный) */
document.getElementById('card-left').addEventListener('click',  () => answer(-1));
document.getElementById('card-right').addEventListener('click', () => answer(1));
/** Кнопки "Выбрать" */
document.getElementById('btn-left').addEventListener('click',   (e) => { e.stopPropagation(); answer(-1); });
document.getElementById('btn-right').addEventListener('click',  (e) => { e.stopPropagation(); answer(1); });
/** Ничья */
document.getElementById('btn-tie').addEventListener('click',    () => answer(0));
/** Пропустить */
document.getElementById('btn-skip').addEventListener('click',   () => answer(0));

/** Передаёт ответ в алгоритм */
function answer(value) {
  if (typeof state.sortCallback === 'function') {
    const cb = state.sortCallback;
    state.sortCallback = null;

    const pair = state.currentPair;

    // Визуальный акцент на победителе + всплывающие очки + начисление W/L
    if (value === -1) {
      flashCard('left');
      showScorePopup('left',  true);   // +1 победителю
      showScorePopup('right', false);  // -1 проигравшему
      if (pair) { getScore(pair.left).w++; getScore(pair.right).l++; }
    }
    if (value === 1) {
      flashCard('right');
      showScorePopup('right', true);   // +1 победителю
      showScorePopup('left',  false);  // -1 проигравшему
      if (pair) { getScore(pair.right).w++; getScore(pair.left).l++; }
    }
    // При ничьей (value === 0) очки не начисляем

    // Запись в журнал поединков (для просмотра «под капотом»)
    if (pair) {
      let outcome;
      if (value === -1) outcome = 'left';
      else if (value === 1) outcome = 'right';
      else outcome = 'tie';
      state.battleLog.push({
        n: state.battleLog.length + 1,
        leftId:  pair.left.id,
        rightId: pair.right.id, 
        left: pair.left.name,
        right: pair.right.name,
        outcome, // 'left' | 'right' | 'tie'
        winner: outcome === 'tie' ? null : pair[outcome].name,
        loser:  outcome === 'tie' ? null : pair[outcome === 'left' ? 'right' : 'left'].name,
        leftScore:  { ...getScore(pair.left)  },  // снимок счёта после поединка
        rightScore: { ...getScore(pair.right) },
      });
    }

    // Обновляем строку счёта под карточками (если показ включён)
    refreshBattleScores();

    setTimeout(() => cb(value), value !== 0 ? 140 : 0);
  }
}

/**
 * Показывает всплывающую цифру очков над карточкой.
 * @param {'left'|'right'} side — над какой карточкой
 * @param {boolean} isWin — true: зелёная +1, false: красная -1
 */
function showScorePopup(side, isWin) {
  const arena = document.getElementById('battle-arena');
  const card  = document.getElementById(`card-${side}`);
  if (!arena || !card) return;

  const arenaRect = arena.getBoundingClientRect();
  const cardRect  = card.getBoundingClientRect();

  // Координаты: по центру карточки по горизонтали, у верхнего края по вертикали
  const x = cardRect.left - arenaRect.left + cardRect.width / 2;
  const y = cardRect.top  - arenaRect.top;

  const popup = document.createElement('div');
  popup.className = `score-popup ${isWin ? 'win' : 'lose'}`;
  popup.textContent = isWin ? '+1' : '−1'; // минус — типографский (U+2212)
  popup.style.left = x + 'px';
  popup.style.top  = y + 'px';

  arena.appendChild(popup);

  // Убираем элемент после завершения анимации
  popup.addEventListener('animationend', () => popup.remove());
}

/** Подсвечивает победившую карточку */
function flashCard(side) {
  const card = document.getElementById(`card-${side}`);
  card.style.borderColor = 'var(--pink)';
  card.style.boxShadow   = '0 0 40px rgba(255,45,120,0.3)';
  setTimeout(() => {
    card.style.borderColor = '';
    card.style.boxShadow   = '';
  }, 300);
}

// ─────────────────────────────────
// ЭКРАН РЕЗУЛЬТАТОВ
// ─────────────────────────────────

function showResultScreen() {
  showScreen('result');
  renderPodium();
  renderHonorableMention();
  renderResultsGrid();
  renderBattleLog();
}

/** Рендерит подиум Топ-3 */
function renderPodium() {
  const top3 = state.result.slice(0, 3);
  const medals = ['🥇', '🥈', '🥉'];
  const podium = document.getElementById('podium');

  podium.innerHTML = top3.map((char, i) => `
    <div class="podium-card">
      <div class="podium-img-wrap">
        <img class="podium-img" src="${char.img || ''}" alt="${esc(char.name)}"
             onerror="this.classList.add('error')" />
        <div class="podium-img-fallback">${initials(char.name)}</div>
      </div>
      <div class="podium-rank">${medals[i]} #${i + 1}</div>
      <div class="podium-name">${esc(char.name)}</div>
    </div>
  `).join('');
}

/**
 * Рендерит «4-й пьедестал» — Honorable Mention.
 * Если ничего не выбрано — показывает приглашение выбрать из таблицы.
 */
function renderHonorableMention() {
  const wrap = document.getElementById('hm-wrap');
  if (!wrap) return;

  const idx = state.honorableMention;
  const hasPick = idx !== null && state.result[idx];

  if (!hasPick) {
    wrap.innerHTML = `
      <div class="hm-empty">
        <span class="hm-empty-icon">★</span>
        <div class="hm-empty-text">
          <strong>Honorable Mention</strong>
          <span>Выбери любимку из списка ниже (вне Топ-3), кликнув по строке — она встанет сюда</span>
        </div>
      </div>`;
    return;
  }

  const char = state.result[idx];
  wrap.innerHTML = `
    <div class="hm-card">
      <span class="hm-title">★ Honorable Mention</span>
      <div class="hm-body">
        <div class="hm-img-wrap">
          <img class="hm-img" src="${char.img || ''}" alt="${esc(char.name)}"
               onerror="this.classList.add('error')" />
          <div class="hm-img-fallback">${initials(char.name)}</div>
        </div>
        <div class="hm-info">
          <div class="hm-name">${esc(char.name)}</div>
          <div class="hm-meta">#${idx + 1} в общем рейтинге · ${esc(char.game)} · ${formatScoreWithElo(char)}</div>
          <div class="hm-note">Не попала на подиум, но это мой личный выбор</div>
        </div>
        <button class="hm-clear" id="hm-clear" title="Убрать выбор">✕</button>
      </div>
    </div>`;

  const clr = document.getElementById('hm-clear');
  if (clr) clr.addEventListener('click', () => toggleHonorableMention(idx));
}

/** Рендерит полный список результатов */
function renderResultsGrid() {
  const grid = document.getElementById('results-grid');
  grid.innerHTML = state.result.map((char, i) => {
    const rankClass = i === 0 ? 'top1' : i === 1 ? 'top2' : i === 2 ? 'top3' : '';
    const selectable = i >= 3; // Топ-3 нельзя выбрать как Honorable Mention
    const isHM = state.honorableMention === i;
    const cls = [
      'result-row',
      selectable ? 'selectable' : '',
      isHM ? 'is-hm' : '',
    ].filter(Boolean).join(' ');
    return `
      <div class="${cls}" ${selectable ? `data-index="${i}"` : ''}>
        <div class="result-rank ${rankClass}">#${i + 1}</div>
        <div class="result-thumb">
          <img src="${char.img || ''}" alt="${esc(char.name)}" onerror="this.classList.add('error')" />
          <div class="result-thumb-fallback">${initials(char.name)}</div>
        </div>
        <div class="result-info">
          <div class="result-name">${esc(char.name)}</div>
          <div class="result-game">${esc(char.game)}</div>
        </div>
        ${isHM ? '<span class="hm-badge">★ Любимка</span>' : ''}
        <div class="result-score" title="Эло · Победы–Поражения · Сила">${formatResultScore(char)}</div>
      </div>
    `;
  }).join('');

  // Клик по строке #4+ выбирает/снимает Honorable Mention
  grid.querySelectorAll('.result-row.selectable').forEach(row => {
    row.addEventListener('click', () => {
      const idx = Number(row.dataset.index);
      toggleHonorableMention(idx);
    });
  });
}

/** Выбирает/снимает любимку по индексу в state.result */
function toggleHonorableMention(idx) {
  state.honorableMention = (state.honorableMention === idx) ? null : idx;
  renderResultsGrid(); // обновить подсветку/бейдж
  renderHonorableMention(); // обновить «4-й пьедестал»
}

/** Инициалы персонажа для заглушки */
function initials(name) {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
}

/** Экранирование для безопасной вставки имён в HTML */
function esc(s) {
  return String(s).replace(/[&<>"']/g, m => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]
  ));
}

/**
 * Рендерит журнал поединков на экране результатов.
 * Хронологический список: кто против кого, кого выбрали, и счёт после.
 */
function renderBattleLog() {
  const wrap = document.getElementById('battle-log');
  if (!wrap) return;

    // Если только что был турнир — показываем сетку перед журналом
  let bracketBlock = '';
  if (state.lastBracketSVG) {
    bracketBlock = `
      <div class="result-bracket">
        <h3 class="result-bracket-title">Турнирная сетка</h3>
        <div class="result-bracket-scroll" id="result-bracket-mount"></div>
      </div>`;
  }

  const log = state.battleLog;
  const total = log.length;
  const ties  = log.filter(e => e.outcome === 'tie').length;
  const decisive = total - ties;

  const rows = log.map(e => {
    if (e.outcome === 'tie') {
      return `
        <div class="log-row tie">
          <span class="log-n">${e.n}</span>
          <span class="log-pair">
            <span class="log-name">${esc(e.left)}</span>
            <span class="log-vs">≈</span>
            <span class="log-name">${esc(e.right)}</span>
          </span>
          <span class="log-result tie-tag">ничья</span>
        </div>`;
    }
    const leftWon = e.outcome === 'left';
    // Бейдж дельты Эло (только если запись её содержит — т.е. турнир)
    let eloBadge = '';
    if (e.eloWinDelta != null) {
      const w = e.eloWinDelta;
      const l = e.eloLoseDelta;
      const fmt = (v) => (v > 0 ? '+' : '') + v;
      eloBadge = `
        <span class="log-elo">
          <span class="elo-up">${fmt(w)}</span>
          <span class="elo-down">${fmt(l)}</span>
        </span>`;
    }
    const roundTag = e.round ? `<span class="log-round">${esc(e.round)}</span>` : '';
    return `
      <div class="log-row">
        <span class="log-n">${e.n}</span>
        <span class="log-pair">
          <span class="log-name ${leftWon ? 'won' : 'lost'}">${esc(e.left)}</span>
          <span class="log-vs">vs</span>
          <span class="log-name ${leftWon ? 'lost' : 'won'}">${esc(e.right)}</span>
        </span>
        ${roundTag}
        <span class="log-result"><span class="log-arrow">▸</span> ${esc(e.winner)}</span>
        ${eloBadge}
      </div>`;
  }).join('');

  wrap.innerHTML = bracketBlock + `
    <details class="log-details">
      <summary class="log-summary">
        <span>📜 Журнал поединков</span>
        <span class="log-stat">${total} сравнений · ${decisive} с выбором · ${ties} ничьих</span>
      </summary>
      <div class="log-body">
        <div class="log-toolbar">
          <button class="btn-ghost small" id="btn-download-log">↓ Скачать .txt</button>
        </div>
        <div class="log-list">${rows || '<div class="log-empty">Поединков не было</div>'}</div>
      </div>
    </details>
  `;

  const dl = document.getElementById('btn-download-log');
  if (dl) dl.addEventListener('click', downloadBattleLog);

  // Сетку монтируем отдельно — нужны реальные размеры контейнера в DOM
  const bracketMount = document.getElementById('result-bracket-mount');
  if (bracketMount && state.lastBracketSVG && window.BracketViewer) {
    BracketViewer.mount(bracketMount, state.lastBracketSVG);
  }
}

/** Скачивает журнал поединков как текстовый файл */
function downloadBattleLog() {
  const lines = ['# Журнал поединков — Waifu Battle', ''];
  state.battleLog.forEach(e => {
    if (e.outcome === 'tie') {
      lines.push(`${e.n}. ${e.left} ≈ ${e.right} — ничья`);
    } else {
      lines.push(`${e.n}. ${e.left} vs ${e.right} → ${e.winner}`);
    }
  });
  lines.push('', '# Итоговый рейтинг');
  state.result.forEach((c, i) => {
    lines.push(`#${i + 1} ${c.name} — ${formatScore(c)}`);
  });

  const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'waifu-battle-log.txt';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ── Кнопка "Скопировать результат" ──
document.getElementById('btn-copy').addEventListener('click', () => {
  const text = state.result
    .map((char, i) => `#${i + 1} ${char.name} (${char.game})`)
    .join('\n');

  let fullText = `Мой Spike Chunsoft Waifu Rating:\n\n${text}`;

  // Добавляем Honorable Mention, если выбрана
  const idx = state.honorableMention;
  if (idx !== null && state.result[idx]) {
    const hm = state.result[idx];
    fullText += `\n\n★ Honorable Mention: ${hm.name} (${hm.game}) — #${idx + 1}`;
  }

  if (navigator.clipboard?.writeText) {
    navigator.clipboard.writeText(fullText).then(showCopyToast);
  } else {
    // Fallback для старых браузеров
    const ta = document.createElement('textarea');
    ta.value = fullText;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
    showCopyToast();
  }
});

function showCopyToast() {
  const toast = document.getElementById('copy-toast');
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2500);
}

// ── Кнопка "Пройти заново" ──
document.getElementById('btn-restart').addEventListener('click', () => {
  // Переход со шторками: в момент смыкания возвращаемся на стартовый экран
  runTapeTransition(() => {
    state.result = [];
    state.sortCallback = null;
    state.honorableMention = null;
    showScreen('start');
    renderStartScreen();
  });
});

// ══════════════════════════════════════════════════════
// ПОКАЗ СЧЁТА В БОЮ (тумблер на старте + кнопка-глаз в битве)
// ══════════════════════════════════════════════════════

/**
 * Устанавливает режим показа счёта под карточками и синхронизирует
 * оба контрола (тумблер на старте и кнопку-глаз на экране битвы).
 */
function setShowBattleScore(on) {
  state.showBattleScore = !!on;

  // Синхронизируем тумблер на стартовом экране
  const toggle = document.getElementById('toggle-battle-score');
  if (toggle) toggle.checked = state.showBattleScore;

  // Синхронизируем кнопку-глаз на экране битвы
  const eye = document.getElementById('btn-toggle-score');
  if (eye) {
    eye.classList.toggle('active', state.showBattleScore);
    eye.setAttribute('aria-pressed', String(state.showBattleScore));
    eye.title = state.showBattleScore ? 'Скрыть счёт' : 'Показать счёт';
  }

  // Перерисовываем строку счёта под карточками
  refreshBattleScores();

  // Запоминаем выбор
  try { localStorage.setItem('sc-show-score', state.showBattleScore ? '1' : '0'); } catch (e) {}
}

// Восстанавливаем сохранённый выбор
try {
  state.showBattleScore = localStorage.getItem('sc-show-score') === '1';
} catch (e) {}

// Тумблер на стартовом экране
const scoreToggle = document.getElementById('toggle-battle-score');
if (scoreToggle) {
  scoreToggle.checked = state.showBattleScore;
  scoreToggle.addEventListener('change', () => setShowBattleScore(scoreToggle.checked));
}

// Кнопка-глаз на экране битвы
const scoreEye = document.getElementById('btn-toggle-score');
if (scoreEye) {
  scoreEye.addEventListener('click', () => setShowBattleScore(!state.showBattleScore));
}



/**
 * Применяет акцентный цвет — пишет его в CSS-переменную --accent на :root.
 * Все места в стилях используют var(--accent), поэтому меняется всё сразу.
 */
function applyAccentColor(hex) {
  document.documentElement.style.setProperty('--accent', hex);

  // Обновляем активный свотч
  document.querySelectorAll('.color-swatch').forEach(s => {
    s.classList.toggle('active', s.dataset.color === hex);
  });

  // Сохраняем в localStorage чтобы не сбрасывалось при перезагрузке
  try { localStorage.setItem('sc-accent', hex); } catch(e) {}
}

// Вешаем обработчики на пресеты
document.querySelectorAll('.color-swatch[data-color]').forEach(btn => {
  btn.addEventListener('click', () => applyAccentColor(btn.dataset.color));
});

// Произвольный цвет через color input
const colorCustom = document.getElementById('color-custom');
colorCustom.addEventListener('input', () => {
  // Снимаем active со всех пресетов — теперь активен custom
  document.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('active'));
  document.querySelector('.custom-swatch').classList.add('active');
  applyAccentColor(colorCustom.value);
});

// Восстанавливаем сохранённый цвет при загрузке
(function restoreAccent() {
  try {
    const saved = localStorage.getItem('sc-accent');
    if (saved) {
      colorCustom.value = saved;
      applyAccentColor(saved);
    }
  } catch(e) {}
})();

// ══════════════════════════════════════════════════════
// ИНИЦИАЛИЗАЦИЯ
// ══════════════════════════════════════════════════════
renderStartScreen();

// Загрузка канона Эло и подъём персонального слоя
fetch('ratings.json')
  .then(r => r.json())
  .then(data => EloPersonal.init(data.baseElo))
  .catch(e => {
    console.warn('Канон не загрузился, работаю на дефолтных 1500:', e);
    EloPersonal.init({});
  });

// ══════════════════════════════════════════════════════
//  ТУРНИР (Single Elimination)
// ══════════════════════════════════════════════════════
 
async function startTournament() {
  // Список участников из выбранных игр, отсортированный по Эло (сид 1 = топ)
  const pool = CHARACTERS
    .filter(c => state.activeGames.has(c.gameId))
    .slice();
 
  if (pool.length < 2) {
    alert('Выберите хотя бы 2 персонажа (минимум одну игру с несколькими персонажами).');
    return;
  }
 
  // Сортировка по итоговому Эло (канон + личная дельта)
  pool.sort((a, b) => eloOf(b) - eloOf(a));
 
  // Создаём турнир
  let T;
  try {
    T = Tournament.create(pool);
  } catch (e) {
    alert('Не удалось создать турнир: ' + e.message);
    return;
  }
  state.tournament = T;
  state.honorableMention = null;
  state.battleLog = [];   // ← обнуляем журнал перед новым турниром
 
  // Прячем кнопки ничьи/пропуска — в турнире их нет
  setTournamentButtons(true);
 
  // Переход на боевой экран (та же анимация лент, что у сортировки)
  await runTapeTransition(() => {
    showScreen('battle');
    const arena = document.getElementById('battle-arena');
    arena.classList.add('intro');
    setTimeout(() => arena.classList.remove('intro'), 600);
  });
 
  // Показываем первый матч
  tournamentShowMatch();
}
 
/**
 * Показывает текущий матч турнира на боевых карточках.
 * Ставит state.sortCallback, чтобы answer() мог принять выбор —
 * тот же механизм, что у сортировки.
 */
function tournamentShowMatch() {
  const T = state.tournament;
  if (!T) return;
 
  const m = T.currentMatch();
  if (m == null) {
    // турнир окончен
    finishTournament();
    return;
  }
 
  // charA = m.a (левая карточка), charB = m.b (правая)
  state.currentPair = { left: m.a, right: m.b };
 
  // Заголовок боя показывает раунд: «ПОЛУФИНАЛ», «ФИНАЛ» и т.д.
  const label = document.querySelector('.battle-label');
  if (label) label.textContent = m.roundName.toUpperCase();
 
  updateBattleScreen(m.a, m.b);
  updateTournamentProgress();
 
  // Callback: когда answer() вызовется, обрабатываем выбор турнира
  state.sortCallback = (value) => {
    // value: -1 = левый (a), 1 = правый (b). Ничья (0) в турнире невозможна.
    if (value === 0) {
      // на всякий случай: если ничья прилетела — игнорируем, ждём заново
      tournamentShowMatch();
      return;
    }
    const side = value === -1 ? 'a' : 'b';
 
    // Двигаем персональную дельту (Эло оживает здесь!) + пишем в журнал
    const winner = side === 'a' ? m.a : m.b;
    const loser  = side === 'a' ? m.b : m.a;
    let eloRes = null;
    if (window.EloPersonal && winner.id && loser.id) {
      // recordMatch(победитель, проигравший, 'a') → 'a' = первый победил
      // Возвращает { a, b, deltaA, deltaB }:
      //   a/deltaA относятся к winner, b/deltaB — к loser
      eloRes = EloPersonal.recordMatch(winner.id, loser.id, 'a');
    }
 
    // Запись в журнал поединков — тот же формат, что у сортировки,
    // плюс поля с дельтами Эло.
    state.battleLog.push({
      n: state.battleLog.length + 1,
      leftId:  m.a.id,
      rightId: m.b.id,
      left:  m.a.name,
      right: m.b.name,
      outcome: side === 'a' ? 'left' : 'right',  // победила левая (a) или правая (b)
      winner: winner.name,
      loser:  loser.name,
      round:  m.roundName,                        // «Полуфинал» и т.д.
      // дельты Эло: сколько получил победитель и потерял проигравший
      eloWinDelta:  eloRes ? eloRes.deltaA : null, // обычно +N
      eloLoseDelta: eloRes ? eloRes.deltaB : null, // обычно -N
      winnerId: winner.id,
      loserId:  loser.id,
    });
 
    // Запоминаем, была ли это граница раунда ДО pick
    const wasBoundaryComing = isLastMatchOfRound(T);
 
    // Фиксируем результат в сетке
    T.pick(side);
 
    // Если раунд только что закрылся и турнир не окончен — пауза-уведомление
    if (wasBoundaryComing && !T.isComplete() && T.currentMatch()) {
      announceRoundBoundary(T, () => tournamentShowMatch());
    } else {
      tournamentShowMatch();
    }
  };
}
 
/** true, если текущий матч — последний в своём раунде (дальше граница). */
function isLastMatchOfRound(T) {
  if (T.phase === 'third') return true;
  const rounds = T.rounds;
  // найдём текущую позицию через currentMatch
  const m = T.currentMatch();
  if (!m || typeof m.round !== 'number') return false;
  const round = rounds[m.round];
  return m.matchIndex === round.length - 1;
}
 
/**
 * Уведомление на границе раунда. Пока ПРОСТОЕ (текст + продолжение).
 * В 4c здесь будет показ SVG-сетки.
 */
function announceRoundBoundary(T, next) {
  const m = T.currentMatch();
  const nextRoundName = m ? m.roundName : '';
 
  const note = document.createElement('div');
  note.className = 'round-boundary-note';
  note.innerHTML = `
    <div class="rbn-inner">
      <div class="rbn-title">Сетка обновлена</div>
      <div class="rbn-next">Дальше: ${esc(nextRoundName)}</div>
      <div class="rbn-bracket" id="rbn-bracket-mount"></div>
      <button class="btn-primary rbn-btn">Продолжить →</button>
    </div>`;
  document.body.appendChild(note);

  // Сетку монтируем ОТДЕЛЬНО, уже когда контейнер в DOM и виден —
  // иначе BracketViewer не сможет измерить размеры viewport под fit.
  const mountEl = note.querySelector('#rbn-bracket-mount');
  if (window.BracketSVG && window.BracketViewer && mountEl) {
    const svg = BracketSVG.render(T, { showThird: false });
    BracketViewer.mount(mountEl, svg);
  }

  requestAnimationFrame(() => note.classList.add('show'));
 
  const cont = () => {
    note.classList.remove('show');
    setTimeout(() => note.remove(), 200);
    next();
  };
  note.querySelector('.rbn-btn').addEventListener('click', cont);
}
 
/** Прогресс турнира: доля сыгранных матчей. */
function updateTournamentProgress() {
  const T = state.tournament;
  if (!T) return;
  // всего матчей = (size - 1) основных + 1 за третье (если size>=4)
  const total = (T.size - 1) + (T.size >= 4 ? 1 : 0);
  // сыграно = total минус оставшиеся
  let played = 0;
  T.rounds.forEach(round => round.forEach(mt => { if (mt.winner != null) played++; }));
  if (T.thirdPlace.winner != null) played++;
  const pct = total > 0 ? Math.round((played / total) * 100) : 0;
 
  const bar = document.getElementById('progress-bar');
  const txt = document.getElementById('progress-text');
  if (bar) bar.style.width = pct + '%';
  if (txt) txt.textContent = pct + '%';
}
 
/** Показ/скрытие кнопок ничьи и пропуска (в турнире их нет). */
function setTournamentButtons(isTournament) {
  const tie  = document.getElementById('btn-tie');
  const skip = document.getElementById('btn-skip');
  [tie, skip].forEach(b => { if (b) b.style.display = isTournament ? 'none' : ''; });
}
 
/** Завершение турнира → экран результатов (пока простой). */
function finishTournament() {
  const T = state.tournament;
  const standings = T.standings();
 
  // Собираем state.result в том же формате, что ждёт экран результатов:
  // массив персонажей по местам. Призёры из standings, остальные —
  // по текущему Эло (квалифицированные, затем отсечённые).
  const placedIds = new Set(standings.map(s => s.id));
  const podium = standings.map(s => s.char);
 
  // Остальные квалифицированные (не призёры) — по Эло
  const rest = T.qualified
    .filter(c => !placedIds.has(c.id))
    .sort((a, b) => eloOf(b) - eloOf(a));
 
  // Отсечённые квалификацией — в самый низ
  const cut = T.cut.slice().sort((a, b) => eloOf(b) - eloOf(a));
 
  state.result = [...podium, ...rest, ...cut];
 
  // Вернём боевой заголовок и кнопки в обычное состояние
  const label = document.querySelector('.battle-label');
  if (label) label.textContent = 'КТО ЛУЧШЕ?';
  setTournamentButtons(false);
  state.tournament = null;
 
    // Сохраняем финальную сетку для показа в результатах
    state.lastBracketSVG = (window.BracketSVG)
      ? BracketSVG.render(T, { showThird: true })
      : '';
 
    showResultScreen();

}
 