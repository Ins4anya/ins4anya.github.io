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
  characters: [],     // отфильтрованный список

  // Merge sort engine
  sortQueue: [],      // очередь пар для сравнения (от merge)
  sortCallback: null, // функция, ждущая ответа пользователя
  sorted: [],         // финальный отсортированный массив
  totalComparisons: 0,
  doneComparisons: 0,

  // Результат
  result: [],
};

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

/** Кнопка "Начать" */
document.getElementById('btn-start').addEventListener('click', startSorting);

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

  showScreen('battle');

  // Запускаем алгоритм — он сам будет вызывать askUser() и ждать ответов
  const sorted = await interactiveMergeSort([...state.characters]);
  state.result = sorted;

  showResultScreen();
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
    // Визуальный акцент на победителе
    if (value === -1) flashCard('left');
    if (value === 1)  flashCard('right');
    setTimeout(() => cb(value), value !== 0 ? 140 : 0);
  }
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
  renderResultsGrid();
}

/** Рендерит подиум Топ-3 */
function renderPodium() {
  const top3 = state.result.slice(0, 3);
  const medals = ['🥇', '🥈', '🥉'];
  const podium = document.getElementById('podium');

  podium.innerHTML = top3.map((char, i) => `
    <div class="podium-card">
      <div class="podium-img-wrap">
        <img class="podium-img" src="${char.img || ''}" alt="${char.name}"
             onerror="this.classList.add('error')" />
        <div class="podium-img-fallback">${initials(char.name)}</div>
      </div>
      <div class="podium-rank">${medals[i]} #${i + 1}</div>
      <div class="podium-name">${char.name}</div>
    </div>
  `).join('');
}

/** Рендерит полный список результатов */
function renderResultsGrid() {
  const grid = document.getElementById('results-grid');
  grid.innerHTML = state.result.map((char, i) => {
    const rankClass = i === 0 ? 'top1' : i === 1 ? 'top2' : i === 2 ? 'top3' : '';
    return `
      <div class="result-row">
        <div class="result-rank ${rankClass}">#${i + 1}</div>
        <div class="result-thumb">
          <img src="${char.img || ''}" alt="${char.name}" onerror="this.classList.add('error')" />
          <div class="result-thumb-fallback">${initials(char.name)}</div>
        </div>
        <div class="result-info">
          <div class="result-name">${char.name}</div>
          <div class="result-game">${char.game}</div>
        </div>
        <div class="result-score">${char.game}</div>
      </div>
    `;
  }).join('');
}

/** Инициалы персонажа для заглушки */
function initials(name) {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
}

// ── Кнопка "Скопировать результат" ──
document.getElementById('btn-copy').addEventListener('click', () => {
  const text = state.result
    .map((char, i) => `#${i + 1} ${char.name} (${char.game})`)
    .join('\n');

  const fullText = `Мой Spike Chunsoft Waifu Rating:\n\n${text}`;

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
  state.result = [];
  state.sortCallback = null;
  showScreen('start');
  renderStartScreen();
});

// ══════════════════════════════════════════════════════
// ПИКЕР АКЦЕНТНОГО ЦВЕТА
// ══════════════════════════════════════════════════════

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
