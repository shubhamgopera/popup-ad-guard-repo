// Runs inside the page itself (MAIN world) so it can neutralise popup tricks.
(() => {
  let enabled = false;
  document.addEventListener('__pag_state', (e) => { enabled = !!e.detail; });

  const nativeStr = (name) => () => `function ${name}() { [native code] }`;

  // 1) window.open -> return a harmless fake window (so scripts that check
  //    "did the popup open?" don't show an anti-adblock message)
  const origOpen = window.open;
  const fakeWin = () => ({
    closed: false, focus() {}, blur() {}, close() {}, postMessage() {},
    document: { write() {}, writeln() {}, close() {}, open() {} },
    location: { href: '', assign() {}, replace() {} }
  });
  window.open = function () {
    return enabled ? fakeWin() : origOpen.apply(this, arguments);
  };
  window.open.toString = nativeStr('open');

  // 2) Script-generated <a target=_blank>.click()
  const origClick = HTMLAnchorElement.prototype.click;
  HTMLAnchorElement.prototype.click = function () {
    if (enabled && (this.target === '_blank' || !this.isConnected)) return;
    return origClick.apply(this, arguments);
  };
  HTMLAnchorElement.prototype.click.toString = nativeStr('click');

  // 3) Forms submitted to a new tab by script
  const origSubmit = HTMLFormElement.prototype.submit;
  HTMLFormElement.prototype.submit = function () {
    if (enabled && this.target === '_blank') return;
    return origSubmit.apply(this, arguments);
  };

  // 4) Fake (untrusted) click events aimed at links
  window.addEventListener('click', (e) => {
    if (!enabled || e.isTrusted) return;
    const a = e.target && e.target.closest && e.target.closest('a');
    if (a && a.target && a.target !== '_self') {
      e.preventDefault();
      e.stopImmediatePropagation();
    }
  }, true);

  // 5) Invisible full-page click-catcher overlays: remove on first press
  const isOverlay = (el) => {
    if (!el || el === document.body || el === document.documentElement) return false;
    const cs = getComputedStyle(el);
    if (cs.position !== 'fixed' && cs.position !== 'absolute') return false;
    const r = el.getBoundingClientRect();
    const big = r.width > innerWidth * 0.6 && r.height > innerHeight * 0.6;
    const invisible = parseFloat(cs.opacity) < 0.05 ||
      /rgba\(0, 0, 0, 0\)|transparent/.test(cs.backgroundColor) && !el.textContent.trim() && !el.querySelector('img,video,canvas');
    return big && invisible;
  };
  window.addEventListener('pointerdown', (e) => {
    if (!enabled || !e.isTrusted) return;
    if (isOverlay(e.target)) {
      e.target.remove();
      e.preventDefault();
      e.stopImmediatePropagation();
    }
  }, true);
})();
