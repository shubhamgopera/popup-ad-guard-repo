// Isolated world: reads the setting and tells the page script + background.
const topHost = (() => {
  try {
    if (window === top) return location.hostname;
    const ao = location.ancestorOrigins;
    return ao && ao.length ? new URL(ao[ao.length - 1]).hostname : location.hostname;
  } catch { return location.hostname; }
})();

const push = (on) => document.dispatchEvent(new CustomEvent('__pag_state', { detail: !!on }));
const load = () => chrome.storage.local.get('sites', ({ sites = {} }) => push(sites[topHost]));
load();
chrome.storage.onChanged.addListener(load);

// If the user really clicks a normal visible link (or ctrl/middle-clicks one),
// tell the background to let the resulting new tab through.
const allow = (e) => {
  if (!e.isTrusted) return;
  const a = e.target && e.target.closest && e.target.closest('a[href]');
  if (!a) return;
  const r = a.getBoundingClientRect();
  const huge = r.width > innerWidth * 0.6 && r.height > innerHeight * 0.6;
  const cs = getComputedStyle(a);
  if (!huge && parseFloat(cs.opacity) > 0.1 && cs.visibility !== 'hidden') {
    chrome.runtime.sendMessage({ type: 'allow' }).catch(() => {});
  }
};
window.addEventListener('click', allow, true);
window.addEventListener('auxclick', allow, true);
