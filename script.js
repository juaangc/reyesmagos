(() => {
  'use strict';

  const STORAGE_KEY = 'carta-reyes-magos-2027';
  const $ = (selector, root = document) => root.querySelector(selector);
  const giftGrid = $('#giftGrid');
  const emptyState = $('#emptyState');
  const giftCount = $('#giftCount');
  const editorDialog = $('#editorDialog');
  const giftForm = $('#giftForm');
  const editorGiftList = $('#editorGiftList');
  const linkRows = $('#linkRows');
  const formStatus = $('#formStatus');
  let gifts = loadGifts();
  let editingId = null;

  function makeId() {
    return window.crypto && typeof window.crypto.randomUUID === 'function'
      ? window.crypto.randomUUID()
      : `gift-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }

  function safeUrl(value) {
    const raw = String(value || '').trim();
    if (!raw) return '';
    try {
      const parsed = new URL(raw);
      return ['http:', 'https:'].includes(parsed.protocol) ? parsed.href : '';
    } catch {
      return '';
    }
  }

  function normalizeGift(item) {
    if (!item || typeof item !== 'object') return null;
    const name = String(item.name || '').trim().slice(0, 90);
    if (!name) return null;
    const brands = Array.isArray(item.brands)
      ? item.brands.map(value => String(value).trim()).filter(Boolean).slice(0, 12)
      : String(item.brands || '').split(/[,;]+/).map(value => value.trim()).filter(Boolean).slice(0, 12);
    const links = Array.isArray(item.links)
      ? item.links.map(link => ({
          label: String(link?.label || '').trim().slice(0, 60),
          url: safeUrl(link?.url)
        })).filter(link => link.url).slice(0, 20)
      : [];
    return {
      id: String(item.id || makeId()),
      name,
      emoji: String(item.emoji || '🎁').trim().slice(0, 8) || '🎁',
      brands,
      notes: String(item.notes || '').trim().slice(0, 700),
      links
    };
  }

  function loadGifts() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return [];
      const parsed = JSON.parse(stored);
      const items = Array.isArray(parsed) ? parsed : parsed.gifts;
      return Array.isArray(items) ? items.map(normalizeGift).filter(Boolean) : [];
    } catch (error) {
      console.warn('No se pudieron leer los datos guardados de la carta.', error);
      return [];
    }
  }

  function persistGifts() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 1, gifts }));
      return true;
    } catch (error) {
      console.error('No se pudieron guardar los cambios.', error);
      setStatus('No se ha podido guardar. Descarga una copia o libera espacio.', true);
      return false;
    }
  }

  function makeElement(tag, className, text) {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (text !== undefined) element.textContent = text;
    return element;
  }

  function renderGiftCards() {
    giftGrid.replaceChildren();
    giftCount.textContent = String(gifts.length).padStart(2, '0');
    emptyState.hidden = gifts.length > 0;

    gifts.forEach((gift, index) => {
      const card = makeElement('article', 'gift-card reveal');
      const top = makeElement('div', 'card-top');
      top.append(
        makeElement('span', 'gift-icon', gift.emoji || '🎁'),
        makeElement('span', 'card-number', String(index + 1).padStart(2, '0'))
      );
      card.append(top, makeElement('h3', '', gift.name));

      if (gift.brands.length) {
        const brandList = makeElement('div', 'brand-list');
        gift.brands.forEach(brand => brandList.append(makeElement('span', 'brand-chip', brand)));
        card.append(brandList);
      }
      if (gift.notes) card.append(makeElement('p', 'gift-notes', gift.notes));

      if (gift.links.length) {
        const links = makeElement('div', 'gift-links');
        gift.links.forEach((link, linkIndex) => {
          const anchor = makeElement('a', 'gift-link');
          anchor.href = link.url;
          anchor.target = '_blank';
          anchor.rel = 'noopener noreferrer';
          anchor.append(makeElement('span', '', '↗'), document.createTextNode(link.label || `Ver enlace ${linkIndex + 1}`));
          links.append(anchor);
        });
        card.append(links);
      }
      giftGrid.append(card);
      observeReveal(card);
    });
  }

  function renderEditorList() {
    editorGiftList.replaceChildren();
    $('#editorGiftCount').textContent = String(gifts.length);
    if (!gifts.length) {
      editorGiftList.append(makeElement('p', 'editor-empty', 'Todavía no has añadido ninguna petición.'));
      return;
    }
    gifts.forEach(gift => {
      const row = makeElement('div', `editor-list-item${editingId === gift.id ? ' active' : ''}`);
      const edit = makeElement('button', 'editor-item-edit');
      edit.type = 'button';
      edit.append(makeElement('span', '', gift.emoji), document.createTextNode(gift.name));
      edit.addEventListener('click', () => editGift(gift.id));
      const remove = makeElement('button', 'editor-item-delete', '×');
      remove.type = 'button';
      remove.setAttribute('aria-label', `Eliminar ${gift.name}`);
      remove.title = 'Eliminar petición';
      remove.addEventListener('click', () => deleteGift(gift.id));
      row.append(edit, remove);
      editorGiftList.append(row);
    });
  }

  function renderAll() {
    renderGiftCards();
    renderEditorList();
  }

  function addLinkRow(label = '', url = '') {
    const row = makeElement('div', 'link-row');
    const labelInput = document.createElement('input');
    labelInput.type = 'text';
    labelInput.maxLength = 60;
    labelInput.placeholder = 'Nombre (opcional)';
    labelInput.setAttribute('aria-label', 'Nombre del enlace');
    labelInput.value = label;
    const urlInput = document.createElement('input');
    urlInput.type = 'url';
    urlInput.placeholder = 'https://...';
    urlInput.setAttribute('aria-label', 'Dirección del enlace');
    urlInput.value = url;
    const removeButton = makeElement('button', 'remove-link', '×');
    removeButton.type = 'button';
    removeButton.setAttribute('aria-label', 'Eliminar enlace');
    removeButton.addEventListener('click', () => {
      row.remove();
      if (!linkRows.children.length) addLinkRow();
    });
    row.append(labelInput, urlInput, removeButton);
    linkRows.append(row);
  }

  function setStatus(message, isError = false) {
    formStatus.textContent = message;
    formStatus.style.color = isError ? '#a55750' : '#7e8b70';
  }

  function resetForm() {
    giftForm.reset();
    $('#giftEmoji').value = '🎁';
    linkRows.replaceChildren();
    addLinkRow();
    editingId = null;
    $('#formTitle').textContent = 'Nueva petición';
    $('#giftName').focus({ preventScroll: true });
    setStatus('');
    renderEditorList();
  }

  function editGift(id) {
    const gift = gifts.find(item => item.id === id);
    if (!gift) return;
    editingId = id;
    $('#giftName').value = gift.name;
    $('#giftEmoji').value = gift.emoji;
    $('#giftBrands').value = gift.brands.join(', ');
    $('#giftNotes').value = gift.notes;
    $('#formTitle').textContent = 'Editar petición';
    linkRows.replaceChildren();
    if (gift.links.length) gift.links.forEach(link => addLinkRow(link.label, link.url));
    else addLinkRow();
    setStatus('');
    renderEditorList();
    $('#giftName').focus({ preventScroll: true });
  }

  function deleteGift(id) {
    const gift = gifts.find(item => item.id === id);
    if (!gift || !window.confirm(`¿Eliminar «${gift.name}» de la carta?`)) return;
    gifts = gifts.filter(item => item.id !== id);
    persistGifts();
    if (editingId === id) resetForm();
    renderAll();
    setStatus('Petición eliminada.');
  }

  function collectLinks() {
    const collected = [];
    for (const row of linkRows.querySelectorAll('.link-row')) {
      const [labelInput, urlInput] = row.querySelectorAll('input');
      const rawUrl = urlInput.value.trim();
      if (!rawUrl) continue;
      const url = safeUrl(rawUrl);
      if (!url) throw new Error('Uno de los enlaces no parece una dirección válida. Usa http:// o https://.');
      let label = labelInput.value.trim();
      if (!label) {
        try { label = new URL(url).hostname.replace(/^www\./, ''); }
        catch { label = 'Ver enlace'; }
      }
      collected.push({ label, url });
    }
    return collected;
  }

  giftForm.addEventListener('submit', event => {
    event.preventDefault();
    const name = $('#giftName').value.trim();
    if (!name) {
      setStatus('Escribe un nombre para el regalo.', true);
      $('#giftName').focus();
      return;
    }
    let links;
    try {
      links = collectLinks();
    } catch (error) {
      setStatus(error.message, true);
      return;
    }
    const gift = normalizeGift({
      id: editingId || makeId(),
      name,
      emoji: $('#giftEmoji').value.trim() || '🎁',
      brands: $('#giftBrands').value.split(/[,;]+/).map(value => value.trim()).filter(Boolean),
      notes: $('#giftNotes').value,
      links
    });
    if (!gift) {
      setStatus('No se ha podido preparar esta petición.', true);
      return;
    }
    if (editingId) gifts = gifts.map(item => item.id === editingId ? gift : item);
    else gifts.push(gift);
    if (!persistGifts()) return;
    renderAll();
    resetForm();
    setStatus('Guardado. La carta ya está actualizada.');
  });

  $('#newGiftButton').addEventListener('click', resetForm);
  $('#cancelEdit').addEventListener('click', resetForm);
  $('#addLinkButton').addEventListener('click', () => addLinkRow());
  $('#editorAccess').addEventListener('click', () => {
    if (typeof editorDialog.showModal === 'function') editorDialog.showModal();
    else editorDialog.setAttribute('open', '');
    renderEditorList();
    if (!editingId) resetForm();
  });
  $('#closeEditor').addEventListener('click', () => editorDialog.close());
  editorDialog.addEventListener('click', event => {
    if (event.target === editorDialog) editorDialog.close();
  });
  document.addEventListener('keydown', event => {
    if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key.toLowerCase() === 'e') {
      event.preventDefault();
      if (!editorDialog.open) $('#editorAccess').click();
    }
  });

  $('#exportButton').addEventListener('click', () => {
    const backup = { format: 'carta-reyes-magos', version: 1, exportedAt: new Date().toISOString(), gifts };
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'mi-carta-reyes-2027.json';
    document.body.append(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    setStatus('Copia descargada. Guárdala en un lugar seguro.');
  });

  $('#importButton').addEventListener('click', () => $('#importInput').click());
  $('#importInput').addEventListener('change', async event => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const parsed = JSON.parse(await file.text());
      const items = Array.isArray(parsed) ? parsed : parsed.gifts;
      if (!Array.isArray(items)) throw new Error('El archivo no contiene una lista de regalos reconocible.');
      const imported = items.map(normalizeGift).filter(Boolean);
      if (!window.confirm(`Se van a importar ${imported.length} peticiones. Esto sustituirá la lista actual. ¿Continuar?`)) return;
      gifts = imported;
      if (!persistGifts()) return;
      resetForm();
      renderAll();
      setStatus('Copia importada correctamente.');
    } catch (error) {
      setStatus(error.message || 'No se ha podido leer ese archivo.', true);
    } finally {
      event.target.value = '';
    }
  });

  // Aparición progresiva de bloques al entrar en pantalla.
  let revealObserver;
  function observeReveal(element) {
    if (revealObserver) revealObserver.observe(element);
    else element.classList.add('is-visible');
  }
  if ('IntersectionObserver' in window) {
    revealObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -30px 0px' });
    document.querySelectorAll('.reveal').forEach(observeReveal);
  } else {
    document.querySelectorAll('.reveal').forEach(element => element.classList.add('is-visible'));
  }

  // Barra de progreso y un desplazamiento sutil de la ilustración del hero.
  const progress = $('#scrollProgress');
  let scrollQueued = false;
  function updateScroll() {
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    const percent = maxScroll > 0 ? (window.scrollY / maxScroll) * 100 : 0;
    progress.style.width = `${Math.min(100, Math.max(0, percent))}%`;
    const art = $('.hero-art');
    if (art && window.innerWidth > 760) art.style.setProperty('--scroll-shift', `${Math.min(35, window.scrollY * .035)}px`);
    scrollQueued = false;
  }
  window.addEventListener('scroll', () => {
    if (!scrollQueued) {
      scrollQueued = true;
      window.requestAnimationFrame(updateScroll);
    }
  }, { passive: true });
  updateScroll();

  const hero = $('.hero');
  const heroArt = $('.hero-art');
  if (hero && heroArt && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    hero.addEventListener('pointermove', event => {
      const bounds = hero.getBoundingClientRect();
      const x = (event.clientX - bounds.left) / bounds.width - .5;
      const y = (event.clientY - bounds.top) / bounds.height - .5;
      heroArt.style.setProperty('--pointer-x', `${x * 9}px`);
      heroArt.style.setProperty('--pointer-y', `${y * 8}px`);
    });
    hero.addEventListener('pointerleave', () => {
      heroArt.style.setProperty('--pointer-x', '0px');
      heroArt.style.setProperty('--pointer-y', '0px');
    });
  }

  // Cuenta atrás sencilla hasta el próximo 6 de enero.
  function updateReyesCountdown() {
    const now = new Date();
    let target = new Date(now.getFullYear(), 0, 6, 0, 0, 0);
    if (now >= target) target = new Date(now.getFullYear() + 1, 0, 6, 0, 0, 0);
    const days = Math.ceil((target - now) / 86400000);
    const counter = $('#daysUntilReyes');
    if (counter) counter.textContent = days === 1 ? '1 día' : `${days} días`;
  }
  updateReyesCountdown();

  // Nieve en canvas: muy ligera y desactivada con la preferencia de movimiento reducido.
  const canvas = $('#snowfall');
  const context = canvas?.getContext('2d');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (canvas && context && !reducedMotion) {
    let width = 0;
    let height = 0;
    let flakes = [];
    let animationFrame = 0;
    let lastTime = 0;
    const random = (min, max) => min + Math.random() * (max - min);

    function resizeSnow() {
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.floor(width * ratio);
      canvas.height = Math.floor(height * ratio);
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      const count = Math.min(76, Math.max(25, Math.floor(width / 17)));
      flakes = Array.from({ length: count }, () => ({
        x: random(0, width), y: random(0, height), r: random(.65, 2.1),
        speed: random(.22, .72), drift: random(-.18, .18), phase: random(0, Math.PI * 2), alpha: random(.22, .7)
      }));
    }

    function drawSnow(time = 0) {
      const delta = Math.min(2, (time - (lastTime || time)) / 16.67 || 1);
      lastTime = time;
      context.clearRect(0, 0, width, height);
      flakes.forEach(flake => {
        flake.y += flake.speed * delta;
        flake.x += (flake.drift + Math.sin(time * .00045 + flake.phase) * .18) * delta;
        if (flake.y > height + 6) { flake.y = -6; flake.x = random(0, width); }
        if (flake.x < -6) flake.x = width + 6;
        if (flake.x > width + 6) flake.x = -6;
        context.beginPath();
        context.arc(flake.x, flake.y, flake.r, 0, Math.PI * 2);
        context.fillStyle = `rgba(246, 241, 232, ${flake.alpha})`;
        context.fill();
      });
      animationFrame = window.requestAnimationFrame(drawSnow);
    }

    resizeSnow();
    drawSnow();
    window.addEventListener('resize', resizeSnow, { passive: true });
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        window.cancelAnimationFrame(animationFrame);
      } else {
        lastTime = 0;
        animationFrame = window.requestAnimationFrame(drawSnow);
      }
    });
  }

  renderAll();
})();
