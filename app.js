const KEY = 'wichtel-people';
const GROUP = 'GSO Premium Ultra';
const app = document.getElementById('app');
const $ = id => document.getElementById(id);

const SEED = [
  'Célina', 'Gaby', 'jamin', 'Julie G', 'Juls', 'Kenzo Antonio', 'Lara',
  'Leo', 'leylaa', 'Mia', 'Sophie', 'Whitney', 'Yann',
].map(name => ({ name }));

let people;
try { people = JSON.parse(localStorage.getItem(KEY)) || SEED; } catch { people = SEED; }
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(people)); } catch {} };

const mount = id => {
  app.replaceChildren(document.getElementById(id).content.cloneNode(true));
  app.classList.remove('enter');
  void app.offsetWidth;
  app.classList.add('enter');
};

const row = (cls, name) => {
  const li = document.createElement('li');
  li.className = cls;
  li.innerHTML = `
    <span class="avatar mono"></span>
    <span class="person-text"><span class="person-name"></span></span>`;
  li.querySelector('.avatar').textContent = name.slice(0, 1).toUpperCase();
  li.querySelector('.person-name').textContent = name;
  return li;
};

/* Setup */

function setup() {
  mount('tpl-setup');
  $('group').textContent = GROUP;
  renderPeople();

  $('add-form').addEventListener('submit', e => {
    e.preventDefault();
    const name = $('add-name').value.trim();
    if (!name) return;
    if (people.some(p => p.name.toLowerCase() === name.toLowerCase()))
      return showError(`${name} is already on the list.`);
    people.push({ name });
    $('add-name').value = '';
    save();
    renderPeople();
    showError('');
  });

  $('draw').addEventListener('click', () => {
    try { showLinks(Wichtel.draw(people), newId()); }
    catch (err) { showError(err.message); }
  });
}

function showError(msg) {
  $('error').textContent = msg;
  $('error').hidden = !msg;
}

function renderPeople() {
  $('count').textContent = people.length;
  $('people').replaceChildren(...people.map((p, i) => {
    const li = row('person', p.name);
    const btn = document.createElement('button');
    btn.className = 'icon-btn';
    btn.setAttribute('aria-label', `Remove ${p.name}`);
    btn.innerHTML = '<svg viewBox="0 0 24 24"><path d="M7 7l10 10M17 7L7 17"/></svg>';
    btn.addEventListener('click', () => { people.splice(i, 1); save(); renderPeople(); });
    li.append(btn);
    return li;
  }));
}

/* Links */

const newId = () => Math.random().toString(36).slice(2, 6).toUpperCase();
const same = (a, b) => Object.keys(a).every(k => a[k] === b[k]);

async function copy(text, btn) {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const ta = Object.assign(document.createElement('textarea'), { value: text });
    document.body.append(ta);
    ta.select();
    document.execCommand('copy');
    ta.remove();
  }
  btn.textContent = 'Copied';
  setTimeout(() => (btn.textContent = 'Copy link'), 1400);
}

function showLinks(pairs, id) {
  mount('tpl-links');
  $('group').textContent = GROUP;
  $('draw-id').textContent = `Draw ${id}`;
  const sent = new Set();
  const updateSent = () => ($('sent').textContent = `${sent.size}/${people.length}`);
  updateSent();

  $('links').replaceChildren(...people.map(p => {
    const r = people.find(o => o.name === pairs[p.name]);
    const url = `${location.origin}${location.pathname}#p=${Wichtel.encode({ i: id, n: p.name, r: r.name })}`;
    const li = row('link-row', p.name);
    const btn = document.createElement('button');
    btn.className = 'chip';
    btn.textContent = 'Copy link';
    btn.addEventListener('click', () => {
      copy(url, btn);
      sent.add(p.name);
      li.classList.add('done');
      updateSent();
    });
    li.append(btn);
    return li;
  }));

  let armed = null;
  $('reroll').addEventListener('click', e => {
    if (sent.size && !armed) {
      e.currentTarget.textContent = 'Tap again. Links you already sent stop being valid';
      armed = setTimeout(() => { armed = null; $('reroll').textContent = 'Reroll'; }, 4000);
      return;
    }
    clearTimeout(armed);
    let next = Wichtel.draw(people);
    for (let t = 0; t < 20 && same(next, pairs); t++) next = Wichtel.draw(people);
    showLinks(next, newId());
  });
  $('back').addEventListener('click', setup);
}

/* Reveal */

function reveal(data) {
  mount('tpl-reveal');
  $('group').textContent = GROUP;
  $('draw-id').textContent = data.i ? `Draw ${data.i}` : '';
  $('hi').textContent = `Hi ${data.n}`;

  const btn = $('reveal');
  btn.addEventListener('click', () => {
    const open = btn.classList.toggle('open');
    $('match').textContent = open ? data.r : 'Tap to see who you draw';
    $('reveal-hint').textContent = open ? 'Tap again to hide.' : 'Make sure nobody is looking at your screen.';
  });
}

function route() {
  const m = location.hash.match(/^#p=(.+)$/);
  if (m) {
    try { return reveal(Wichtel.decode(m[1])); } catch {}
  }
  setup();
}

window.addEventListener('hashchange', route);
route();
