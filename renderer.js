'use strict';

const PHONE_UA =
  'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) ' +
  'Chrome/124.0.0.0 Mobile Safari/537.36';
const TABLET_UA =
  'Mozilla/5.0 (Linux; Android 14; SM-X710) AppleWebKit/537.36 (KHTML, like Gecko) ' +
  'Chrome/124.0.0.0 Safari/537.36';

// h = 0 : yükseklik panele göre otomatik dolsun
const PANES = [
  {
    id: 'desktop', label: 'Masaüstü', dpr: 1, ua: '', mobile: false, def: 2,
    presets: [
      { n: 'Küçük laptop 1280', w: 1280, h: 0 },
      { n: 'Laptop 1366', w: 1366, h: 0 },
      { n: 'Laptop 1440', w: 1440, h: 0 },
      { n: 'Geniş 1536', w: 1536, h: 0 },
      { n: 'Full HD 1920', w: 1920, h: 0 },
      { n: '2K 2560', w: 2560, h: 0 }
    ]
  },
  {
    id: 'phone', label: 'Telefon', dpr: 3, ua: PHONE_UA, mobile: true, def: 1,
    presets: [
      { n: 'Küçük 360 × 640', w: 360, h: 640 },
      { n: 'iPhone 14 · 390 × 844', w: 390, h: 844 },
      { n: 'Pixel 8 · 412 × 915', w: 412, h: 915 },
      { n: 'iPhone Pro Max · 430 × 932', w: 430, h: 932 },
      { n: 'Katlanır 280 × 653', w: 280, h: 653 }
    ]
  },
  {
    id: 'tablet', label: 'Tablet', dpr: 2, ua: TABLET_UA, mobile: true, def: 1,
    presets: [
      { n: 'iPad mini · 768 × 1024', w: 768, h: 1024 },
      { n: 'iPad · 820 × 1180', w: 820, h: 1180 },
      { n: 'iPad Pro 11 · 834 × 1194', w: 834, h: 1194 },
      { n: 'iPad Pro 12.9 · 1024 × 1366', w: 1024, h: 1366 },
      { n: 'Android tablet · 800 × 1280', w: 800, h: 1280 }
    ]
  }
];

const CUSTOM = 'custom';
const STORE_KEY = 'yanekran-boyutlar';

const state = { landscape: false, sync: true, master: null };

const panesEl = document.getElementById('panes');
const urlInput = document.getElementById('url');
const statusEl = document.getElementById('status');

const panes = [];

function setStatus(text, isError) {
  statusEl.textContent = text || '';
  statusEl.className = isError ? 'error' : '';
}

function readStore() {
  try {
    return JSON.parse(localStorage.getItem(STORE_KEY)) || {};
  } catch (e) {
    return {};
  }
}

function writeStore() {
  try {
    const out = {};
    panes.forEach((p) => {
      out[p.cfg.id] = { sel: p.sel, w: p.size.w, h: p.size.h };
    });
    localStorage.setItem(STORE_KEY, JSON.stringify(out));
  } catch (e) {
    /* kaydedilemezse sorun değil */
  }
}

// Yazılan metni adrese çevirir: adres ise https ekler, değilse Google araması yapar
function normalize(input) {
  const t = input.trim();
  if (!t) return null;
  if (/^https?:\/\//i.test(t)) return t;
  if (/^[a-z][a-z0-9+.-]*:\/\//i.test(t)) return null;
  if (/^(localhost|\d{1,3}(\.\d{1,3}){3})(:\d+)?([/?#]|$)/i.test(t)) return 'http://' + t;
  if (!/\s/.test(t) && /\.[a-z]{2,}(:\d+)?([/?#]|$)/i.test(t)) return 'https://' + t;
  return 'https://www.google.com/search?q=' + encodeURIComponent(t);
}

// Panelin şu an kullandığı sanal ekran boyutu (telefon/tablette yatay-dikey uygulanır)
function dims(pane) {
  const { w, h } = pane.size;
  if (pane.cfg.mobile && state.landscape) return { w: h, h: w };
  return { w, h };
}

function layout(pane) {
  const d = dims(pane);
  const rect = pane.stage.getBoundingClientRect();
  if (rect.width < 10 || rect.height < 10) return;

  let w = d.w;
  let h = d.h;
  let scale;

  if (!pane.cfg.mobile) {
    // Masaüstü: gerçek masaüstü genişliğinde çizilir, panele sığacak kadar küçültülür
    w = Math.max(d.w, rect.width);
    scale = rect.width / w;
    if (d.h > 0) {
      scale = Math.min(scale, rect.height / d.h);
      h = d.h;
    } else {
      h = rect.height / scale;
    }
  } else {
    scale = Math.min((rect.width - 44) / w, (rect.height - 44) / h, 1);
  }
  scale = Math.max(scale, 0.05);

  pane.device.style.width = w + 'px';
  pane.device.style.height = h + 'px';
  pane.device.style.transform = 'translate(-50%, -50%) scale(' + scale + ')';
  pane.info.textContent = Math.round(w) + ' × ' + Math.round(h) + ' · %' + Math.round(scale * 100);
}

function layoutAll() {
  panes.forEach(layout);
}

async function applyEmulation(pane) {
  if (!pane.cfg.mobile || !pane.ready) return;
  const d = dims(pane);
  try {
    await window.api.emulate(pane.view.getWebContentsId(), { w: d.w, h: d.h, dpr: pane.cfg.dpr });
  } catch (e) {
    /* emülasyon uygulanamadıysa sayfa yine de doğru genişlikte açılır */
  }
}

function load(pane, url) {
  pane.target = url;
  if (pane.ready) {
    try {
      const p = pane.view.loadURL(url);
      if (p && p.catch) p.catch(() => {});
    } catch (e) {
      pane.view.src = url;
    }
  } else {
    pane.view.src = url;
  }
}

function visiblePanes() {
  return panes.filter((p) => p.visible);
}

function setMaster(pane) {
  state.master = pane;
  panes.forEach((p) => p.el.classList.toggle('master', p === pane));
  if (pane && pane.url) urlInput.value = pane.url;
}

function onNavigate(pane, url) {
  pane.url = url;
  if (pane !== state.master) return;
  urlInput.value = url;
  if (!state.sync) return;
  visiblePanes().forEach((other) => {
    if (other === pane) return;
    if (other.url === url || other.target === url) return;
    load(other, url);
  });
}

function clampNumber(value, min, max) {
  const n = parseInt(value, 10);
  if (!Number.isFinite(n)) return null;
  return Math.max(min, Math.min(max, n));
}

// Hazır boyut listesi + "Özel" seçeneği ve özel genişlik/yükseklik kutuları
function buildSizePicker(pane, saved) {
  const cfg = pane.cfg;
  const wrap = document.createElement('span');
  wrap.className = 'picker';

  const select = document.createElement('select');
  cfg.presets.forEach((p, i) => {
    const o = document.createElement('option');
    o.value = String(i);
    o.textContent = p.n;
    select.appendChild(o);
  });
  const custom = document.createElement('option');
  custom.value = CUSTOM;
  custom.textContent = 'Özel boyut…';
  select.appendChild(custom);

  const wInput = document.createElement('input');
  wInput.type = 'number';
  wInput.min = '200';
  wInput.max = '7680';
  wInput.title = 'Genişlik (piksel)';
  wInput.placeholder = 'En';

  const x = document.createElement('span');
  x.textContent = '×';

  const hInput = document.createElement('input');
  hInput.type = 'number';
  hInput.min = cfg.mobile ? '200' : '0';
  hInput.max = '7680';
  hInput.title = cfg.mobile ? 'Yükseklik (piksel)' : 'Yükseklik (boş = panele göre otomatik)';
  hInput.placeholder = cfg.mobile ? 'Boy' : 'Oto';

  const box = document.createElement('span');
  box.className = 'custom-box';
  box.append(wInput, x, hInput);

  function showCustom(on) {
    box.style.display = on ? 'inline-flex' : 'none';
  }

  function applySelection() {
    if (pane.sel === CUSTOM) {
      select.value = CUSTOM;
      wInput.value = String(pane.size.w);
      hInput.value = pane.size.h ? String(pane.size.h) : '';
      showCustom(true);
    } else {
      const p = cfg.presets[Number(pane.sel)];
      pane.size = { w: p.w, h: p.h };
      select.value = String(pane.sel);
      showCustom(false);
    }
  }

  function changed() {
    layout(pane);
    applyEmulation(pane);
    writeStore();
  }

  select.addEventListener('change', () => {
    pane.sel = select.value === CUSTOM ? CUSTOM : Number(select.value);
    applySelection();
    changed();
  });

  function onCustomInput() {
    const w = clampNumber(wInput.value, 200, 7680);
    if (w === null) return;
    let h;
    if (cfg.mobile) {
      h = clampNumber(hInput.value, 200, 7680);
      if (h === null) return;
    } else {
      h = hInput.value.trim() === '' ? 0 : clampNumber(hInput.value, 200, 7680);
      if (h === null) return;
    }
    pane.size = { w, h };
    changed();
  }
  wInput.addEventListener('input', onCustomInput);
  hInput.addEventListener('input', onCustomInput);

  // Kayıtlı seçimi geri yükle
  if (saved && saved.sel === CUSTOM && saved.w) {
    pane.sel = CUSTOM;
    pane.size = { w: saved.w, h: saved.h || 0 };
  } else if (saved && cfg.presets[Number(saved.sel)]) {
    pane.sel = Number(saved.sel);
  } else {
    pane.sel = cfg.def;
  }
  applySelection();

  wrap.append(select, box);
  return wrap;
}

function createPane(cfg, savedAll) {
  const el = document.createElement('section');
  el.className = 'pane ' + cfg.id;

  const head = document.createElement('header');
  head.className = 'pane-head';
  const title = document.createElement('span');
  title.className = 'title';
  title.textContent = cfg.label;
  const info = document.createElement('span');
  info.className = 'size';

  const stage = document.createElement('div');
  stage.className = 'stage';
  const device = document.createElement('div');
  device.className = 'device';

  const view = document.createElement('webview');
  view.setAttribute('partition', 'persist:site');
  view.setAttribute('allowpopups', '');
  if (cfg.ua) view.setAttribute('useragent', cfg.ua);

  const pane = {
    cfg, el, stage, device, view, info,
    size: { w: 0, h: 0 }, sel: cfg.def,
    ready: false, visible: true, url: '', target: ''
  };

  head.append(title, buildSizePicker(pane, savedAll[cfg.id]), info);

  device.appendChild(view);
  stage.appendChild(device);
  el.append(head, stage);
  panesEl.appendChild(el);
  panes.push(pane);

  view.addEventListener('dom-ready', () => {
    pane.ready = true;
    applyEmulation(pane);
  });
  view.addEventListener('focus', () => setMaster(pane));
  view.addEventListener('did-navigate', (e) => onNavigate(pane, e.url));
  view.addEventListener('did-navigate-in-page', (e) => {
    if (e.isMainFrame) onNavigate(pane, e.url);
  });
  view.addEventListener('did-start-loading', () => {
    if (pane === state.master) setStatus('Yükleniyor…');
  });
  view.addEventListener('did-stop-loading', () => {
    if (pane === state.master) setStatus('');
  });
  view.addEventListener('did-fail-load', (e) => {
    if (e.isMainFrame && e.errorCode !== -3) {
      setStatus(cfg.label + ': sayfa yüklenemedi (' + e.errorDescription + ')', true);
    }
  });

  new ResizeObserver(() => layout(pane)).observe(stage);
  return pane;
}

const savedSizes = readStore();
PANES.forEach((cfg) => createPane(cfg, savedSizes));
setMaster(panes[0]);
layoutAll();

// Adres çubuğu
document.getElementById('form').addEventListener('submit', (e) => {
  e.preventDefault();
  const url = normalize(urlInput.value);
  if (!url) {
    setStatus('Geçersiz adres: yalnızca http ve https desteklenir.', true);
    return;
  }
  setStatus('');
  urlInput.value = url;
  visiblePanes().forEach((p) => load(p, url));
});

// Geri / ileri / yenile ana (mavi çerçeveli) panele göre çalışır
document.getElementById('back').addEventListener('click', () => {
  const m = state.master;
  if (m && m.ready && m.view.canGoBack()) m.view.goBack();
});
document.getElementById('forward').addEventListener('click', () => {
  const m = state.master;
  if (m && m.ready && m.view.canGoForward()) m.view.goForward();
});
document.getElementById('reload').addEventListener('click', () => {
  visiblePanes().forEach((p) => {
    if (p.ready) p.view.reload();
  });
});

// Panel aç / kapat
PANES.forEach((cfg) => {
  const box = document.getElementById('chk-' + cfg.id);
  box.addEventListener('change', () => {
    const pane = panes.find((p) => p.cfg.id === cfg.id);
    pane.visible = box.checked;
    pane.el.style.display = box.checked ? '' : 'none';

    if (!pane.visible && state.master === pane) {
      const first = visiblePanes()[0];
      if (first) setMaster(first);
    }
    if (pane.visible && state.master && state.master.url && pane.url !== state.master.url) {
      load(pane, state.master.url);
    }
    if (!state.master || !state.master.visible) {
      const first = visiblePanes()[0];
      if (first) setMaster(first);
    }
    requestAnimationFrame(layoutAll);
  });
});

document.getElementById('chk-sync').addEventListener('change', (e) => {
  state.sync = e.target.checked;
});

document.getElementById('rotate').addEventListener('click', () => {
  state.landscape = !state.landscape;
  layoutAll();
  panes.forEach(applyEmulation);
});

window.addEventListener('resize', layoutAll);

urlInput.focus();
