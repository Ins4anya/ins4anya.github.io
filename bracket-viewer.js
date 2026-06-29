/**
 * ══════════════════════════════════════════════════════════════════
 * SPIKE CHUNSOFT WAIFU SORTER — bracket-viewer.js  (ШАГ 4d)
 *
 * Интерактивный viewport для SVG-сетки турнира: зум колесиком мыши,
 * панорамирование драгом (мышь) и тачем (палец/pinch), кнопки
 * +/−/Reset. Как в Challonge.
 *
 * Чистая надстройка над bracket-svg.js — сам SVG не трогает, просто
 * оборачивает готовую строку разметки в контейнер с CSS-трансформом
 * (translate + scale) и слушает события мыши/колеса/тача.
 *
 * Зависимостей нет. Подключать ПОСЛЕ bracket-svg.js (порядок между
 * ними не важен для работы, но логически идёт следом).
 *
 * Использование (вместо прямой вставки `el.innerHTML = svg`):
 *
 *   const svg = BracketSVG.render(state.tournament, opts);
 *   BracketViewer.mount(containerEl, svg);
 *
 * `mount` сам создаёт разметку viewport+controls внутри containerEl
 * и инициализирует обработчики. Можно звать повторно на тот же
 * containerEl — старое содержимое и слушатели корректно заменяются.
 *
 * Если контейнер вставляется через innerHTML где-то выше по дереву
 * (например, внутри `<details>`, который может быть свёрнут —
 * тогда размеры 0 и центрирование съедет), используй mount ПОСЛЕ
 * того как контейнер уже в DOM и видим, либо передай opts.deferMeasure
 * чтобы пересчитать размеры при первом открытии (см. ensureMeasured).
 * ══════════════════════════════════════════════════════════════════
 */

(function (global) {
  'use strict';

  const CFG = {
    minScale: 0.25,
    maxScale: 4,
    zoomStep: 1.18,       // множитель на «клик» колеса (нормализованный)
    wheelSensitivity: 0.0016, // множитель на deltaY для плавного зума трекпадом
    doubleTapZoom: 1.6,   // во сколько раз увеличиваем по даблтапу/дабл-клику
    initialPad: 0.92,     // доля viewport, которую сетка занимает при initial fit (запас по краям)
  };

  // ──────────────────────────────────────────────
  // ВСПОМОГАТЕЛЬНОЕ
  // ──────────────────────────────────────────────

  function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

  function dist(t1, t2) {
    const dx = t1.clientX - t2.clientX;
    const dy = t1.clientY - t2.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }

  function midpoint(t1, t2) {
    return { x: (t1.clientX + t2.clientX) / 2, y: (t1.clientY + t2.clientY) / 2 };
  }

  // ──────────────────────────────────────────────
  // РАЗМЕТКА VIEWPORT
  // ──────────────────────────────────────────────

  const ICON_PLUS = '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 2v12M2 8h12" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>';
  const ICON_MINUS = '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M2 8h12" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>';
  const ICON_RESET = '<svg width="15" height="15" viewBox="0 0 16 16" fill="none"><path d="M13.5 8a5.5 5.5 0 1 1-1.6-3.89M13.5 2v3.2h-3.2" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';

  function buildShell() {
    const root = document.createElement('div');
    root.className = 'bracket-viewer';
    root.innerHTML = `
      <div class="bv-viewport" tabindex="0" aria-label="Турнирная сетка. Колесо мыши — зум, перетаскивание — панорама.">
        <div class="bv-stage"></div>
      </div>
      <div class="bv-controls">
        <button type="button" class="bv-btn" data-act="zoom-out" title="Уменьшить" aria-label="Уменьшить">${ICON_MINUS}</button>
        <button type="button" class="bv-btn" data-act="zoom-reset" title="Сбросить вид" aria-label="Сбросить вид">${ICON_RESET}</button>
        <button type="button" class="bv-btn" data-act="zoom-in" title="Увеличить" aria-label="Увеличить">${ICON_PLUS}</button>
      </div>
      <div class="bv-hint">скролл — зум · перетаскивание — пан</div>
    `;
    return root;
  }

  // ──────────────────────────────────────────────
  // ОСНОВНОЙ КЛАСС VIEWER'А (на один контейнер)
  // ──────────────────────────────────────────────

  function createViewer(root) {
    const viewport = root.querySelector('.bv-viewport');
    const stage = root.querySelector('.bv-stage');

    let scale = 1;
    let tx = 0, ty = 0;
    let fitScale = 1; // масштаб, при котором сетка целиком влезает в viewport (для reset)
    let fitTx = 0, fitTy = 0;

    let dragging = false;
    let dragStartX = 0, dragStartY = 0;
    let dragStartTx = 0, dragStartTy = 0;
    let moved = false; // отличаем drag от клика

    // pinch-to-zoom состояние
    let pinchStartDist = 0;
    let pinchStartScale = 1;
    let pinchStartMid = null;
    let pinchStartTx = 0, pinchStartTy = 0;

    function apply() {
      stage.style.transform = `translate(${tx}px, ${ty}px) scale(${scale})`;
    }

    /** Считает масштаб/смещение, при котором SVG целиком виден и отцентрован. */
    function computeFit() {
      const svg = stage.querySelector('svg');
      const vpRect = viewport.getBoundingClientRect();
      if (!svg || !vpRect.width || !vpRect.height) return;

      // натуральные размеры SVG берём из атрибутов width/height (заданы в bracket-svg.js)
      const svgW = parseFloat(svg.getAttribute('width')) || svg.getBoundingClientRect().width || 1;
      const svgH = parseFloat(svg.getAttribute('height')) || svg.getBoundingClientRect().height || 1;

      const scaleX = (vpRect.width * CFG.initialPad) / svgW;
      const scaleY = (vpRect.height * CFG.initialPad) / svgH;
      // Для широких сеток (много раундов) показываем по высоте, не сжимая лишний раз —
      // берём минимум, чтобы сетка целиком влезала в обе стороны.
      fitScale = clamp(Math.min(scaleX, scaleY), CFG.minScale, CFG.maxScale);

      fitTx = (vpRect.width - svgW * fitScale) / 2;
      fitTy = (vpRect.height - svgH * fitScale) / 2;
    }

    function resetView(animated) {
      computeFit();
      scale = fitScale;
      tx = fitTx;
      ty = fitTy;
      if (animated) {
        stage.classList.add('bv-animate');
        apply();
        setTimeout(() => stage.classList.remove('bv-animate'), 220);
      } else {
        apply();
      }
    }

    /** Зум вокруг точки (px,py) в координатах viewport (не stage). */
    function zoomAt(px, py, factor) {
      const newScale = clamp(scale * factor, CFG.minScale, CFG.maxScale);
      const ratio = newScale / scale;
      // держим точку (px,py) визуально неподвижной: пересчитываем смещение
      tx = px - (px - tx) * ratio;
      ty = py - (py - ty) * ratio;
      scale = newScale;
      apply();
    }

    function setSVG(svgString) {
      stage.innerHTML = svgString;
      // Размеры контейнера могут быть нулевыми, если он сейчас скрыт
      // (например внутри свёрнутого <details>) — measureWhenVisible
      // подождёт и пересчитает fit, когда появятся реальные размеры.
      measureWhenVisible();
    }

    /** Дожидается, пока viewport получит ненулевые размеры, и делает initial fit. */
    function measureWhenVisible(attemptsLeft) {
      attemptsLeft = attemptsLeft == null ? 30 : attemptsLeft;
      const rect = viewport.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        resetView(false);
        return;
      }
      if (attemptsLeft <= 0) return;
      requestAnimationFrame(() => measureWhenVisible(attemptsLeft - 1));
    }

    // ── Колесо мыши: зум ──
    viewport.addEventListener('wheel', (e) => {
      e.preventDefault();
      const rect = viewport.getBoundingClientRect();
      const px = e.clientX - rect.left;
      const py = e.clientY - rect.top;

      // Большинство мышей шлют дискретные deltaY ~100 — даём фиксированный шаг.
      // Трекпады/плавный скролл — пропорционально величине.
      let factor;
      if (Math.abs(e.deltaY) >= 40) {
        factor = e.deltaY < 0 ? CFG.zoomStep : 1 / CFG.zoomStep;
      } else {
        factor = Math.exp(-e.deltaY * CFG.wheelSensitivity);
      }
      zoomAt(px, py, factor);
    }, { passive: false });

    // ── Драг мышью: пан ──
    viewport.addEventListener('mousedown', (e) => {
      if (e.button !== 0) return;
      dragging = true;
      moved = false;
      dragStartX = e.clientX;
      dragStartY = e.clientY;
      dragStartTx = tx;
      dragStartTy = ty;
      viewport.classList.add('bv-grabbing');
    });

    window.addEventListener('mousemove', (e) => {
      if (!dragging) return;
      const dx = e.clientX - dragStartX;
      const dy = e.clientY - dragStartY;
      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) moved = true;
      tx = dragStartTx + dx;
      ty = dragStartTy + dy;
      apply();
    });

    window.addEventListener('mouseup', () => {
      if (dragging) {
        dragging = false;
        viewport.classList.remove('bv-grabbing');
      }
    });

    // ── Двойной клик: зум-ин под курсором ──
    viewport.addEventListener('dblclick', (e) => {
      const rect = viewport.getBoundingClientRect();
      zoomAt(e.clientX - rect.left, e.clientY - rect.top, CFG.doubleTapZoom);
    });

    // ── Тач: пан одним пальцем, pinch-zoom двумя ──
    viewport.addEventListener('touchstart', (e) => {
      if (e.touches.length === 1) {
        dragging = true;
        moved = false;
        dragStartX = e.touches[0].clientX;
        dragStartY = e.touches[0].clientY;
        dragStartTx = tx;
        dragStartTy = ty;
      } else if (e.touches.length === 2) {
        dragging = false;
        pinchStartDist = dist(e.touches[0], e.touches[1]);
        pinchStartScale = scale;
        pinchStartMid = midpoint(e.touches[0], e.touches[1]);
        pinchStartTx = tx;
        pinchStartTy = ty;
      }
    }, { passive: true });

    viewport.addEventListener('touchmove', (e) => {
      if (e.touches.length === 1 && dragging) {
        e.preventDefault();
        const dx = e.touches[0].clientX - dragStartX;
        const dy = e.touches[0].clientY - dragStartY;
        if (Math.abs(dx) > 3 || Math.abs(dy) > 3) moved = true;
        tx = dragStartTx + dx;
        ty = dragStartTy + dy;
        apply();
      } else if (e.touches.length === 2 && pinchStartMid) {
        e.preventDefault();
        const newDist = dist(e.touches[0], e.touches[1]);
        const factor = newDist / (pinchStartDist || 1);
        const newScale = clamp(pinchStartScale * factor, CFG.minScale, CFG.maxScale);
        const ratio = newScale / pinchStartScale;
        const rect = viewport.getBoundingClientRect();
        const px = pinchStartMid.x - rect.left;
        const py = pinchStartMid.y - rect.top;
        tx = px - (px - pinchStartTx) * ratio;
        ty = py - (py - pinchStartTy) * ratio;
        scale = newScale;
        apply();
      }
    }, { passive: false });

    viewport.addEventListener('touchend', (e) => {
      if (e.touches.length === 0) {
        dragging = false;
        pinchStartMid = null;
      }
    });

    // ── Клавиатура (доступность): +/-/0, стрелки ──
    viewport.addEventListener('keydown', (e) => {
      const rect = viewport.getBoundingClientRect();
      const cx = rect.width / 2, cy = rect.height / 2;
      if (e.key === '+' || e.key === '=') { e.preventDefault(); zoomAt(cx, cy, CFG.zoomStep); }
      else if (e.key === '-' || e.key === '_') { e.preventDefault(); zoomAt(cx, cy, 1 / CFG.zoomStep); }
      else if (e.key === '0') { e.preventDefault(); resetView(true); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); tx += 40; apply(); }
      else if (e.key === 'ArrowRight') { e.preventDefault(); tx -= 40; apply(); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); ty += 40; apply(); }
      else if (e.key === 'ArrowDown') { e.preventDefault(); ty -= 40; apply(); }
    });

    // ── Кнопки контролов ──
    root.querySelectorAll('.bv-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const rect = viewport.getBoundingClientRect();
        const cx = rect.width / 2, cy = rect.height / 2;
        const act = btn.getAttribute('data-act');
        if (act === 'zoom-in') zoomAt(cx, cy, CFG.zoomStep);
        else if (act === 'zoom-out') zoomAt(cx, cy, 1 / CFG.zoomStep);
        else if (act === 'zoom-reset') resetView(true);
      });
    });

    // Пересчёт fit при ресайзе окна (например, поворот телефона)
    let resizeRAF = null;
    window.addEventListener('resize', () => {
      if (resizeRAF) return;
      resizeRAF = requestAnimationFrame(() => {
        resizeRAF = null;
        // не дёргаем вид, если юзер уже сам что-то приближал —
        // только пересчитываем fit-базу на случай будущего reset()
        computeFit();
      });
    });

    return { setSVG, resetView, measureWhenVisible };
  }

  // ──────────────────────────────────────────────
  // ПУБЛИЧНОЕ API
  // ──────────────────────────────────────────────

  /**
   * Монтирует интерактивный viewport с сеткой внутрь containerEl.
   * Полностью заменяет содержимое containerEl.
   *
   * @param {HTMLElement} containerEl — куда монтировать
   * @param {string} svgString — готовая SVG-разметка (из BracketSVG.render)
   * @returns {{ refresh: function, resetView: function }} хэндл для повторного использования
   */
  function mount(containerEl, svgString) {
    if (!containerEl) return null;
    containerEl.innerHTML = '';
    const shell = buildShell();
    containerEl.appendChild(shell);
    const viewer = createViewer(shell);
    viewer.setSVG(svgString || '');

    // Если контейнер сейчас невидим (например, свёрнутый <details>),
    // пересчитаем вид при появлении в видимой области.
    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver((entries) => {
        entries.forEach(en => {
          if (en.isIntersecting) viewer.measureWhenVisible();
        });
      }, { threshold: 0.01 });
      io.observe(shell);
    }

    return {
      refresh: (newSvgString) => viewer.setSVG(newSvgString),
      resetView: () => viewer.resetView(true),
    };
  }

  global.BracketViewer = { mount, CFG };

})(window);
