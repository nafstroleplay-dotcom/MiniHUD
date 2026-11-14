import './style.css'
import { ic } from './icons.js'

const inGame = typeof window.GetParentResourceName === 'function'
const post = (name, data = {}) =>
  inGame
    ? fetch(`https://${window.GetParentResourceName()}/${name}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }).then((r) => r.json()).catch(() => ({}))
    : Promise.resolve({})

/* ---------- pengaturan (disimpan di localStorage NUI) ---------- */
// elemen yang bisa digeser: [kunci, label]
const MOVABLE = [
  ['info', 'Server info'],
  ['location', 'Street & compass'],
  ['voice', 'Radio & mic'],
  ['status', 'Status'],
  ['speedo', 'Speedometer'],
  ['minimap', 'Minimap'],
]

const DEFAULTS = {
  accent: '#4ade80',
  layout: Object.fromEntries(MOVABLE.map(([k]) => [k, { x: 0, y: 0 }])),
  // ukuran: 'all' = pengali global, sisanya pengali per elemen (1 = 100%)
  scale: { all: 0.7, ...Object.fromEntries(MOVABLE.map(([k]) => [k, 1])) },
  alwaysMap: true,
  alwaysStatus: true,
  style: 'classic',
  status: { health: true, armor: true, hunger: true, thirst: true, stress: true, stamina: true },
  elements: { logo: true, info: true, location: true, voice: true, speedo: true },
}

function load() {
  try {
    const s = JSON.parse(localStorage.getItem('minihud') || '{}')
    return {
      ...DEFAULTS, ...s,
      status: { ...DEFAULTS.status, ...s.status },
      elements: { ...DEFAULTS.elements, ...s.elements },
      layout: { ...DEFAULTS.layout, ...s.layout },
      scale: { ...DEFAULTS.scale, ...s.scale },
    }
  } catch {
    return JSON.parse(JSON.stringify(DEFAULTS))
  }
}

let settings = load()
const getPath = (k) => k.split('.').reduce((o, p) => o[p], settings)
const setPath = (k, v) => {
  const parts = k.split('.')
  let o = settings
  while (parts.length > 1) o = o[parts.shift()]
  o[parts[0]] = v
}

/* ---------- definisi ---------- */
const STATUS = [
  { key: 'health', color: '#ef4444', icon: 'heart', bad: (v) => v <= 25 },
  { key: 'armor', color: '#22c1e6', icon: 'shield', bad: () => false },
  { key: 'hunger', color: '#f59f3a', icon: 'food', bad: (v) => v <= 20 },
  { key: 'thirst', color: '#2dd4bf', icon: 'drop', bad: (v) => v <= 20 },
  { key: 'stress', color: '#a78bfa', icon: 'brain', bad: (v) => v >= 80 },
  { key: 'stamina', color: '#3b82f6', icon: 'bolt', bad: (v, d) => !!d?.staminaLow },
]

const ELEMENTS = [
  ['logo', 'Logo'],
  ['info', 'Server info'],
  ['location', 'Street & compass'],
  ['voice', 'Radio & mic'],
  ['speedo', 'Speedometer'],
]

const STYLES = [['classic', 'Classic'], ['radial', 'Radial'], ['diamond', 'Diamond'], ['modern', 'Modern']]

const ACCENTS = ['#4ade80', '#22c55e', '#a3e635', '#2dd4bf', '#38bdf8', '#d9b565']
const hexToRgb = (h) => {
  const n = parseInt(h.replace('#', ''), 16)
  return `${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}`
}

const TICKS = 36
const SCALE_MIN = 50
const SCALE_MAX = 150
const SCALE_STEP = 5
const $ = (id) => document.getElementById(id)
const clamp = (v) => Math.min(100, Math.max(0, Number(v) || 0))
const fmt = (n) => Number(n || 0).toLocaleString('en-US')
const box = (name) => `<div class="box">${ic(name)}</div>`
const sw = (k) => `<label class="switch"><input type="checkbox" data-k="${k}"><span></span></label>`
const slider = (key, label) => `<div class="row size-row"><b>${label}</b>
  <div class="range"><input type="range" data-s="${key}" min="${SCALE_MIN}" max="${SCALE_MAX}" step="${SCALE_STEP}" value="100"><output data-sv="${key}">100%</output></div></div>`
const kv = (label, id, init = '') => `<div class="kv"><small>${label}</small><b id="${id}">${init}</b></div>`

/* ---------- markup ---------- */
$('app').innerHTML = `
<div id="hud" class="hud off">
  <div class="info" data-move="info" data-label="Server info">
    <div class="logo" id="logo" data-el="logo"></div>
    <div class="infolist" data-el="info">
    <div class="pill">${box('users')}${kv('Players', 'players', '0/48')}</div>
    <div class="pill">${box('id')}${kv('ID', 'pid', '0')}${kv('Job', 'job', '-')}</div>
    <div class="pill" id="moneyPill">${box('wallet')}${kv('Cash', 'cash', '0')}${kv('Bank', 'bank', '0')}</div>
    <div class="pill">${box('signal')}${kv('Ping', 'ping', '0ms')}</div>
    </div>
  </div>


  <div class="pill loc" data-el="location" data-move="location" data-label="Street & compass">
    ${box('nav')}<b id="street" class="street">-</b><span class="sep"></span><b id="heading" class="heading">N 0°</b>
  </div>

  <div class="voice" data-el="voice" data-move="voice" data-label="Radio & mic">
    <div class="pill gone" id="radioPill">${box('radio')}<b id="radio" class="mono">0.0 MHz</b></div>
    <div class="pill" id="micPill">${box('mic')}<span class="dots"><i></i><i></i><i></i></span></div>
  </div>

  <div class="mapbox" id="mapbox" data-move="minimap" data-label="Minimap"></div>

  <div class="status" id="status" data-style="classic" data-move="status" data-label="Status"></div>

  <div class="speedo hidden" id="speedo" data-el="speedo" data-move="speedo" data-label="Speedometer">
    <div class="speed"><b id="speed">0</b><small id="unit">KM/H</small></div>
    <div class="ticks" id="ticks"></div>
    <div class="fuelrow">
      <div class="fuelbar" id="fuelbar">${'<i></i>'.repeat(5)}</div>
      <span id="fuelPct">0%</span>${ic('fuel')}
      <span class="belt" id="belt" title="Seatbelt">${ic('belt')}</span>
      <b id="gear" class="gear">N</b>
    </div>
  </div>
</div>

<div class="editbar hidden" id="editbar">
  <span>Drag elements to move them (incl. the minimap)</span>
  <button class="btn" data-edit-reset>Reset</button>
  <button class="btn primary" data-edit-done>Done</button>
</div>

<div class="settings hidden" id="settings">
  <header><span class="hico">${ic('sliders')}</span><h2>HUD Settings</h2><button class="close" data-close>${ic('x')}</button></header>

  <section class="card">
    <h3>Display options</h3>
    <div class="row"><span><b>Always Show Map</b><small>Keep the minimap visible even on foot</small></span>${sw('alwaysMap')}</div>
    <div class="row"><span><b>Always Show Status</b><small>Keep health/armor bars visible at 100%</small></span>${sw('alwaysStatus')}</div>
  </section>

  <section class="card">
    <h3>Appearance</h3>
    <div class="row"><b>Accent color</b>
      <div class="swatches">
        ${ACCENTS.map((c) => `<button class="swatch" data-accent="${c}" style="--s:${c}"></button>`).join('')}
        <label class="swatch custom"><input type="color" id="accentPick"></label>
      </div>
    </div>
    <div class="row"><span><b>Edit HUD layout</b><small>Drag elements to reposition</small></span><button class="btn" data-edit>Edit</button></div>
  </section>

  <section class="card">
    <h3>HUD size</h3>
    ${slider('all', 'All elements')}
    <div class="sizes">${MOVABLE.map(([k, n]) => slider(k, n)).join('')}</div>
    <div class="row"><span><b>Reset size</b><small>Back to 100%</small></span><button class="btn" data-size-reset>Reset</button></div>
  </section>

  <section class="card">
    <h3>HUD status style</h3>
    <div class="styles">${STYLES.map(([v, n]) => `<button class="style" data-v="${v}"><i></i>${n}</button>`).join('')}</div>
  </section>

  <section class="card">
    <h3>Status visibility</h3>
    <div class="vis">${STATUS.map((s) => `<label class="vcell">${ic(s.icon)}${sw('status.' + s.key)}</label>`).join('')}</div>
  </section>

  <section class="card">
    <h3>HUD elements</h3>
    ${ELEMENTS.map(([k, n]) => `<div class="row"><b>${n}</b>${sw('elements.' + k)}</div>`).join('')}
  </section>
</div>`

const statusEl = $('status')
const tiles = {}
for (const s of STATUS) {
  const t = document.createElement('div')
  t.className = 'tile'
  t.style.setProperty('--c', s.color)
  t.innerHTML = `<div class="shape"><div class="fill"></div>${ic(s.icon)}</div><span class="pct">0%</span>`
  statusEl.appendChild(t)
  tiles[s.key] = t
}

const ticksEl = $('ticks')
for (let i = 0; i < TICKS; i++) {
  const el = document.createElement('i')
  if (i >= TICKS * 0.85) el.className = 'red'
  ticksEl.appendChild(el)
}
const tickEls = [...ticksEl.children]
const fuelSegs = [...$('fuelbar').children]
const dotEls = [...document.querySelectorAll('.dots i')]

/* ---------- render ---------- */
let last = null

function renderStatus() {
  if (!last) return
  for (const s of STATUS) {
    const t = tiles[s.key]
    const raw = last[s.key]
    const v = Math.round(clamp(raw))
    let show = settings.status[s.key] && raw != null
    if (!settings.alwaysStatus && (s.key === 'health' || s.key === 'armor') &&
        (v >= 100 || (s.key === 'armor' && v <= 0))) show = false
    t.classList.toggle('gone', !show)
    if (!show) continue
    t.style.setProperty('--v', v)
    t.querySelector('.pct').textContent = `${v}%`
    t.classList.toggle('warn', s.bad(v, last))
  }
}

function renderVehicle(v) {
  $('speedo').classList.toggle('hidden', !v)
  if (!v) return
  $('speed').textContent = v.speed
  $('unit').textContent = v.unit
  $('gear').textContent = v.gear
  $('belt').classList.toggle('on', !!v.belt)
  const on = Math.round(Math.min(1, Math.max(0, v.rpm)) * TICKS)
  tickEls.forEach((el, i) => el.classList.toggle('on', i < on))
  const f = clamp(v.fuel)
  const segs = Math.ceil(f / 20)
  fuelSegs.forEach((el, i) => el.classList.toggle('on', i < segs))
  $('fuelbar').classList.toggle('low', f <= 15)
  $('fuelPct').textContent = `${f}%`
}

function update(d) {
  last = d
  renderStatus()

  if (d.server) {
    $('players').textContent = `${d.server.count}/${d.server.max}`
    $('ping').textContent = `${d.server.ping}ms`
  }
  if (d.info) {
    $('pid').textContent = d.info.id
    $('job').parentElement.classList.toggle('gone', !d.info.job)
    $('job').textContent = d.info.job || ''
    $('moneyPill').classList.toggle('gone', d.info.cash == null)
    $('cash').textContent = fmt(d.info.cash)
    $('bank').textContent = fmt(d.info.bank)
  }

  $('street').textContent = d.street || '-'
  $('heading').textContent = `${d.dir} ${d.deg}°`

  const radio = Number(d.radio) || 0
  $('radioPill').classList.toggle('gone', radio <= 0)
  $('radio').textContent = `${radio.toFixed(1)} MHz`
  dotEls.forEach((el, i) => el.classList.toggle('on', i < (d.proximity || 2)))
  $('micPill').classList.toggle('talk', !!d.talking)

  renderVehicle(d.vehicle)
}

/* ---------- logo ---------- */
let logoCfg = { enabled: true, url: '', text: 'MINIHUD', height: 40 }
const SAFE_URL = /^(https?:\/\/|nui:\/\/|\.\/)[^\s"'<>]+$|^[\w\-.]+\.(png|jpe?g|webp|gif|svg)$/i

function renderLogo() {
  const el = $('logo')
  el.style.setProperty('--logo-h', `${Number(logoCfg.height) || 40}px`)
  const url = (logoCfg.url || '').trim()
  const showText = () => {
    el.innerHTML = ''
    const t = document.createElement('b')
    t.className = 'logotext'
    t.textContent = logoCfg.text || 'HUD'
    el.appendChild(t)
  }
  if (url && SAFE_URL.test(url)) {
    const img = document.createElement('img')
    img.alt = 'logo'
    img.draggable = false
    img.onerror = showText
    img.src = url
    el.innerHTML = ''
    el.appendChild(img)
  } else {
    showText()
  }
  el.classList.toggle('cfg-off', logoCfg.enabled === false)
}

/* ---------- pengaturan: terapkan & sinkron ---------- */
const settingsEl = $('settings')

function syncUI() {
  settingsEl.querySelectorAll('input[data-k]').forEach((i) => (i.checked = !!getPath(i.dataset.k)))
  settingsEl.querySelectorAll('.style').forEach((b) => b.classList.toggle('active', b.dataset.v === settings.style))
  settingsEl.querySelectorAll('.swatch[data-accent]').forEach((b) =>
    b.classList.toggle('active', b.dataset.accent.toLowerCase() === settings.accent.toLowerCase()))
  $('accentPick').value = settings.accent
  settingsEl.querySelectorAll('input[data-s]').forEach((i) => {
    const pct = Math.round((settings.scale[i.dataset.s] ?? 1) * 100)
    i.value = pct
    settingsEl.querySelector(`output[data-sv="${i.dataset.s}"]`).textContent = `${pct}%`
  })
}

function applyLayout() {
  for (const [k] of MOVABLE) {
    const el = document.querySelector(`[data-move="${k}"]`)
    const p = settings.layout[k] || { x: 0, y: 0 }
    el.style.setProperty('--dx', `${p.x}vw`)
    el.style.setProperty('--dy', `${p.y}vh`)
    const base = k === 'minimap' ? mapSize : 1
    el.style.setProperty('--s', ((settings.scale.all ?? 1) * (settings.scale[k] ?? 1) * base).toFixed(3))
  }
}

/* ---------- minimap (kotak penanda saat mode edit; minimap aslinya digambar oleh game) ---------- */
let mapSize = 1 // pengali dasar dari Config.Minimap.size
const mapboxEl = $('mapbox')

function renderMapRect(map) {
  if (!map) { mapboxEl.classList.add('gone'); return }
  mapSize = Number(map.size) || 1
  const mg = Number(map.margin) || 0
  mapboxEl.classList.remove('gone')
  mapboxEl.style.left = `${((map.x + mg) * 100).toFixed(3)}vw`
  mapboxEl.style.bottom = `${((-map.y + mg) * 100).toFixed(3)}vh`
  mapboxEl.style.width = `${(map.w * 100).toFixed(3)}vw`
  mapboxEl.style.height = `${(map.h * 100).toFixed(3)}vh`
  apply()
}

const mapPayload = () => ({
  alwaysMap: settings.alwaysMap,
  mapScale: (settings.scale.all ?? 1) * (settings.scale.minimap ?? 1),
  mapX: (settings.layout.minimap?.x || 0) / 100, // vw -> pecahan lebar layar
  mapY: (settings.layout.minimap?.y || 0) / 100, // vh -> pecahan tinggi layar
})

function applyMapScale() {
  const m = (settings.scale.all ?? 1) * (settings.scale.minimap ?? 1) * mapSize
  const root = document.documentElement.style
  // pill radio/mic dan street ikut bergeser mengikuti ukuran minimap
  root.setProperty('--map-right', `${(18.5 * m).toFixed(2)}vw`)
  root.setProperty('--map-top', `${(25 * m).toFixed(2)}vh`)
}

function apply() {
  document.documentElement.style.setProperty('--accent-rgb', hexToRgb(settings.accent))
  applyLayout()
  applyMapScale()
  statusEl.dataset.style = settings.style
  for (const [k, on] of Object.entries(settings.elements)) {
    document.querySelector(`[data-el="${k}"]`)?.classList.toggle('gone', !on)
  }
  renderStatus()
  syncUI()
}

function persist() {
  try { localStorage.setItem('minihud', JSON.stringify(settings)) } catch {}
  apply()
  post('settings', mapPayload())
}

function openSettings(open) {
  settingsEl.classList.toggle('hidden', !open)
  if (!open) post('close')
}

settingsEl.addEventListener('change', (e) => {
  const k = e.target.dataset.k
  if (!k) return
  setPath(k, e.target.checked)
  persist()
})

settingsEl.addEventListener('click', (e) => {
  const st = e.target.closest('.style')
  if (st) { settings.style = st.dataset.v; persist() }
  const ac = e.target.closest('.swatch[data-accent]')
  if (ac) { settings.accent = ac.dataset.accent; persist() }
  if (e.target.closest('[data-edit]')) setEditing(true)
  if (e.target.closest('[data-size-reset]')) {
    settings.scale = { ...DEFAULTS.scale }
    persist()
  }
  if (e.target.closest('[data-close]')) openSettings(false)
})

settingsEl.addEventListener('input', (e) => {
  if (e.target.id === 'accentPick') { settings.accent = e.target.value; persist() }
  const sk = e.target.dataset.s
  if (sk) {
    const pct = Math.min(SCALE_MAX, Math.max(SCALE_MIN, Number(e.target.value) || 100))
    settings.scale[sk] = pct / 100
    persist()
  }
})

window.addEventListener('keydown', (e) => {
  if (e.key !== 'Escape') return
  if (editing) setEditing(false)
  else if (!settingsEl.classList.contains('hidden')) openSettings(false)
})

/* ---------- mode edit posisi (drag & drop) ---------- */
const editbar = $('editbar')
let editing = false
let drag = null

function setEditing(on) {
  editing = on
  document.body.classList.toggle('editing', on)
  editbar.classList.toggle('hidden', !on)
  settingsEl.classList.toggle('hidden', on)
}

function keepOnScreen(el, key) {
  const r = el.getBoundingClientRect()
  const W = window.innerWidth
  const H = window.innerHeight
  let dx = 0
  let dy = 0
  if (r.left < 0) dx = -r.left
  else if (r.right > W) dx = W - r.right
  if (r.top < 0) dy = -r.top
  else if (r.bottom > H) dy = H - r.bottom
  if (dx || dy) {
    settings.layout[key].x += (dx / W) * 100
    settings.layout[key].y += (dy / H) * 100
    applyLayout()
  }
}

window.addEventListener('pointerdown', (e) => {
  if (!editing) return
  const el = e.target.closest('[data-move]')
  if (!el) return
  const key = el.dataset.move
  const cur = settings.layout[key]
  drag = { el, key, sx: e.clientX, sy: e.clientY, ox: cur.x, oy: cur.y }
  el.classList.add('dragging')
  e.preventDefault()
})

window.addEventListener('pointermove', (e) => {
  if (!drag) return
  settings.layout[drag.key] = {
    x: drag.ox + ((e.clientX - drag.sx) / window.innerWidth) * 100,
    y: drag.oy + ((e.clientY - drag.sy) / window.innerHeight) * 100,
  }
  applyLayout()
  keepOnScreen(drag.el, drag.key)
})

window.addEventListener('pointerup', () => {
  if (!drag) return
  drag.el.classList.remove('dragging')
  drag = null
  for (const [k] of MOVABLE) {
    settings.layout[k].x = Math.round(settings.layout[k].x * 100) / 100
    settings.layout[k].y = Math.round(settings.layout[k].y * 100) / 100
  }
  persist()
})

editbar.addEventListener('click', (e) => {
  if (e.target.closest('[data-edit-done]')) setEditing(false)
  if (e.target.closest('[data-edit-reset]')) {
    for (const [k] of MOVABLE) settings.layout[k] = { x: 0, y: 0 }
    persist()
  }
})

window.addEventListener('message', ({ data }) => {
  switch (data.action) {
    case 'visible': $('hud').classList.toggle('off', !data.value); break
    case 'update': update(data.data); break
    case 'settings': settingsEl.classList.toggle('hidden', !data.value); break
    case 'config':
      if (data.logo) { logoCfg = { ...logoCfg, ...data.logo }; renderLogo() }
      if ('map' in data) renderMapRect(data.map || null)
      break
  }
})

/* ---------- mulai ---------- */
apply()
renderLogo()
post('ready', mapPayload())

/* ---------- pratinjau di browser (npm run dev), mati di FiveM ---------- */
if (!inGame) {
  document.body.classList.add('dev')
  const demo = {
    health: 72, armor: 75, hunger: 87, thirst: 18, stress: 0, stamina: 40, staminaLow: false,
    street: 'Sandcastle Way', dir: 'NE', deg: 41,
    talking: true, proximity: 2, radio: 123,
    info: { id: 1, job: 'Civilian - Freelancer', cash: 10001, bank: 17331 },
    server: { count: 1, max: 48, ping: 28 },
    vehicle: { speed: 86, unit: 'KM/H', gear: '4', rpm: 0.55, fuel: 62, belt: true },
  }
  const send = (action, extra) => window.postMessage({ action, ...extra }, '*')
  send('visible', { value: true })
  send('update', { data: demo })
  setInterval(() => {
    demo.vehicle.speed = 80 + Math.round(Math.random() * 20)
    demo.vehicle.rpm = 0.4 + Math.random() * 0.4
    demo.talking = !demo.talking
    send('update', { data: demo })
  }, 700)
  window.addEventListener('keydown', (e) => {
    if (e.key.toLowerCase() === 's' && e.target.tagName !== 'INPUT') settingsEl.classList.toggle('hidden')
  })
}
