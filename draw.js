(function (root) {
  const shuffle = (a, rnd) => {
    a = a.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(rnd() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };

  // people: [{name, partner}] -> {giver: receiver}
  // Tries a single gift circle first (no two people draw each other), then any valid derangement.
  function draw(people, rnd = Math.random) {
    const n = people.length;
    if (n < 3) throw new Error('Add at least three people.');
    const names = people.map(p => p.name);
    if (new Set(names).size !== n) throw new Error('Every name has to be unique.');
    const partner = Object.fromEntries(people.map(p => [p.name, p.partner || null]));
    const ok = (g, r) => g !== r && partner[g] !== r && partner[r] !== g;

    for (let t = 0; t < 5000; t++) {
      const c = shuffle(names, rnd);
      if (c.every((g, i) => ok(g, c[(i + 1) % n])))
        return Object.fromEntries(c.map((g, i) => [g, c[(i + 1) % n]]));
    }
    for (let t = 0; t < 20000; t++) {
      const r = shuffle(names, rnd);
      if (names.every((g, i) => ok(g, r[i])))
        return Object.fromEntries(names.map((g, i) => [g, r[i]]));
    }
    throw new Error('No valid draw with these couples. Remove a partner link and try again.');
  }

  // Link payload. Base64url so the match is not readable in a chat preview. Not encryption.
  const encode = obj => {
    const bytes = new TextEncoder().encode(JSON.stringify(obj));
    let s = '';
    bytes.forEach(b => (s += String.fromCharCode(b)));
    return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  };
  const decode = str => {
    const s = atob(str.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(new TextDecoder().decode(Uint8Array.from(s, ch => ch.charCodeAt(0))));
  };

  const api = { draw, encode, decode };
  if (typeof module !== 'undefined') module.exports = api;
  else root.Wichtel = api;
})(this);
