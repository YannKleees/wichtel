(function (root) {
  const shuffle = (a, rnd) => {
    a = a.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(rnd() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };

  // people: [{name}] -> {giver: receiver}
  // One random gift circle: nobody draws themselves and no two people draw each other.
  function draw(people, rnd = Math.random) {
    const n = people.length;
    if (n < 3) throw new Error('Add at least three people.');
    const names = people.map(p => p.name);
    if (new Set(names).size !== n) throw new Error('Every name has to be unique.');
    const c = shuffle(names, rnd);
    return Object.fromEntries(c.map((g, i) => [g, c[(i + 1) % n]]));
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
