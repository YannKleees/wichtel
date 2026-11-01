const KEY = 'wichtel-draft';
const app = document.getElementById('app');
const $ = id => document.getElementById(id);

const load = () => {
  try { return JSON.parse(localStorage.getItem(KEY)) || null; } catch { return null; }
};
const save = s => { try { localStorage.setItem(KEY, JSON.stringify(s)); } catch {} };

const SEED = [
  ['Célina', 'CreativeCelina'], ['Gaby', 'Gabsert'], ['jamin', 'jasminereis'],
  ['Julie G', 'GreJu250'], ['Juls', 'Qz7PabLEw'], ['Kenzo Antonio', 'DenItaliener'],
  ['Lara', 't3elR0ulara'], ['Leo', 'dl3W0i5BrSAuMuG'], ['leylaa', 'N2wcZ1tqFL'],
  ['Mia', ''], ['Sophie', 'casso543'], ['Whitney', 'Whitneyribeiro'], ['Yann', 'CreativeYann'],
].map(([name, user]) => ({ name, user, wish: '', partner: '' }));

let state = load() || { group: 'GSO Premium Ultra', date: '', budget: '', people: SEED };

const mount = id => {
  app.replaceChildren(document.getElementById(id).content.cloneNode(true));
  app.classList.remove('enter');
  void app.offsetWidth;
  app.classList.add('enter');
};

const fmtToday = () =>
  new Date().toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });

const parseDate = d => (d ? new Date(d + 'T12:00:00') : null);
const daysLeft = d => Math.ceil((parseDate(d) - new Date()) / 864e5);

function renderDate(d) {
  const dt = parseDate(d);
  $('date-wd').textContent = dt ? dt.toLocaleDateString('en-GB', { weekday: 'short', month: 'short' }) : 'Pick a date';
  $('date-num').textContent = dt ? dt.getDate() : '--';
}

function renderDots(el, filled, total) {
  el.replaceChildren(...Array.from({ length: total }, (_, i) => {
    const s = document.createElement('span');
    if (i < filled) s.className = 'on';
    return s;
  }));
}

/* Setup */

function setup() {
  mount('tpl-setup');
  $('today').textContent = fmtToday();
  $('group').textContent = state.group;
  $('date').value = state.date;
  $('budget').value = state.budget;
  renderDate(state.date);
  renderPeople();

  $('group').addEventListener('input', e => { state.group = e.target.textContent.trim(); save(state); });
  $('group').addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); e.target.blur(); } });
  $('date').addEventListener('change', e => { state.date = e.target.value; save(state); renderDate(state.date); });
  $('budget').addEventListener('input', e => { state.budget = e.target.value.trim(); save(state); });

  $('add-form').addEventListener('submit', e => {
    e.preventDefault();
    const name = $('add-name').value.trim();
    if (!name) return;
    if (state.people.some(p => p.name.toLowerCase() === name.toLowerCase()))
      return showError(`${name} is already on the list.`);
    state.people.push({ name, user: '', wish: '', partner: '' });
    $('add-name').value = '';
    save(state);
    renderPeople();
    showError('');
  });

  $('draw').addEventListener('click', () => {
    try {
      showLinks(Wichtel.draw(state.people), newId());
    } catch (err) {
      showError(err.message);
    }
  });
}

function showError(msg) {
  $('error').textContent = msg;
  $('error').hidden = !msg;
}

function renderPeople() {
  const list = $('people');
  const n = state.people.length;
  $('count').textContent = n;
  renderDots($('dots'), n, Math.max(24, Math.ceil(n / 8) * 8));

  if (!n) {
    const li = document.createElement('li');
    li.className = 'empty muted';
    li.textContent = 'Add at least three people to draw.';
    return list.replaceChildren(li);
  }

  list.replaceChildren(...state.people.map((p, i) => {
    const li = document.createElement('li');
    li.className = 'person';
    li.innerHTML = `
      <div class="person-main">
        <span class="avatar mono"></span>
        <span class="person-text"><span class="person-name"></span><span class="person-user mono"></span></span>
        <button class="icon-btn" aria-label="Remove">
          <svg viewBox="0 0 24 24"><path d="M7 7l10 10M17 7L7 17"/></svg>
        </button>
      </div>
      <div class="person-extra">
        <input class="wish" placeholder="Wishes (optional)" aria-label="Wishes">
        <select class="partner" aria-label="Partner"><option value="">No partner</option></select>
      </div>`;
    li.querySelector('.avatar').textContent = p.name.slice(0, 1).toUpperCase();
    li.querySelector('.person-name').textContent = p.name;
    li.querySelector('.person-user').textContent = p.user ? `@${p.user}` : '';

    const wish = li.querySelector('.wish');
    wish.id = `wish-${i}`;
    wish.value = p.wish;
    wish.addEventListener('input', () => { p.wish = wish.value; save(state); });

    const sel = li.querySelector('.partner');
    sel.id = `partner-${i}`;
    state.people.filter(o => o !== p).forEach(o => sel.add(new Option(`Partner: ${o.name}`, o.name)));
    sel.value = p.partner;
    sel.addEventListener('change', () => {
      const old = state.people.find(o => o.name === p.partner);
      if (old) old.partner = '';
      p.partner = sel.value;
      const other = state.people.find(o => o.name === p.partner);
      if (other) {
        const prev = state.people.find(o => o.name === other.partner);
        if (prev && prev !== p) prev.partner = '';
        other.partner = p.name;
      }
      save(state);
      renderPeople();
    });

    li.querySelector('.icon-btn').addEventListener('click', () => {
      state.people.forEach(o => { if (o.partner === p.name) o.partner = ''; });
      state.people.splice(i, 1);
      save(state);
      renderPeople();
    });
    return li;
  }));
}

/* Links */

const newId = () => Math.random().toString(36).slice(2, 6).toUpperCase();
const same = (a, b) => b && Object.keys(a).every(k => a[k] === b[k]);

let drawId = '';

function linkFor(giver, receiver) {
  const p = state.people.find(o => o.name === receiver);
  const t = Wichtel.encode({ i: drawId, g: state.group, n: giver, r: receiver, u: p.user || '', w: p.wish || '', b: state.budget, d: state.date });
  return `${location.origin}${location.pathname}#p=${t}`;
}

async function copy(text, btn, done = 'Copied') {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const ta = Object.assign(document.createElement('textarea'), { value: text });
    document.body.append(ta);
    ta.select();
    document.execCommand('copy');
    ta.remove();
  }
  if (btn) {
    const old = btn.textContent;
    btn.textContent = done;
    setTimeout(() => (btn.textContent = old), 1400);
  }
}

function showLinks(pairs, id) {
  drawId = id;
  mount('tpl-links');
  $('group').textContent = state.group;
  $('draw-id').textContent = `Draw ${id}`;
  const sent = new Set();
  const updateSent = () => ($('sent').textContent = `${sent.size}/${state.people.length} copied`);
  updateSent();

  const rows = Object.keys(pairs).map(giver => ({ giver, url: linkFor(giver, pairs[giver]) }));

  $('links').replaceChildren(...rows.map(({ giver, url }) => {
    const li = document.createElement('li');
    li.className = 'link-row';
    li.innerHTML = `
      <span class="avatar mono"></span>
      <span class="person-name"></span>
      <button class="chip">Copy link</button>`;
    li.querySelector('.avatar').textContent = giver.slice(0, 1).toUpperCase();
    li.querySelector('.person-name').textContent = giver;
    li.querySelector('.chip').addEventListener('click', e => {
      copy(url, e.currentTarget);
      sent.add(giver);
      li.classList.add('done');
      updateSent();
    });
    return li;
  }));

  let armed = null;
  $('reroll').addEventListener('click', e => {
    if (sent.size && !armed) {
      e.currentTarget.textContent = 'Tap again. Already sent links become outdated';
      armed = setTimeout(() => { armed = null; $('reroll').textContent = 'Reroll'; }, 4000);
      return;
    }
    clearTimeout(armed);
    let next;
    for (let t = 0; t < 20 && (!next || same(next, pairs)); t++) next = Wichtel.draw(state.people);
    showLinks(next, newId());
  });
  $('back').addEventListener('click', setup);
}

/* Reveal */

function reveal(data) {
  mount('tpl-reveal');
  document.title = `${data.g} Wichtel`;
  $('today').textContent = fmtToday();
  $('group').textContent = data.g;
  renderDate(data.d);

  if (data.d) {
    const left = Math.max(0, daysLeft(data.d));
    $('left').textContent = left;
    renderDots($('dots'), Math.min(left, 48), Math.max(24, Math.ceil(Math.min(left, 48) / 8) * 8));
  } else {
    $('left').textContent = 'No date';
    renderDots($('dots'), 0, 24);
  }

  $('hi').textContent = `Hi ${data.n}`;
  $('draw-id').textContent = data.i ? `Draw ${data.i}` : '';
  $('budget').textContent = data.b ? `${data.b} EUR` : 'Not set';
  $('wish').textContent = 'Hidden until you reveal';

  const btn = $('reveal');
  btn.addEventListener('click', () => {
    const open = btn.classList.toggle('open');
    $('match').textContent = open ? data.r : 'Tap to see who you draw';
    $('reveal-hint').textContent = open ? 'Tap again to hide.' : 'Make sure nobody is looking at your screen.';
    $('wish').textContent = open ? data.w || 'No wishes listed' : 'Hidden until you reveal';
    $('match-user').textContent = data.u ? `@${data.u}` : '';
    $('match-user').hidden = !open || !data.u;
  });
}

function route() {
  const m = location.hash.match(/^#p=(.+)$/);
  if (m) {
    try { return reveal(Wichtel.decode(m[1])); } catch { /* broken link falls through to setup */ }
  }
  setup();
}

window.addEventListener('hashchange', route);
route();
