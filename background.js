const allowUntil = new Map(); // tabId -> timestamp

chrome.runtime.onMessage.addListener((msg, sender) => {
  if (msg && msg.type === 'allow' && sender.tab) {
    allowUntil.set(sender.tab.id, Date.now() + 1500);
  }
});

chrome.tabs.onCreated.addListener(async (tab) => {
  if (!tab.openerTabId) return;
  try {
    const opener = await chrome.tabs.get(tab.openerTabId);
    const host = new URL(opener.url).hostname;
    const { sites = {} } = await chrome.storage.local.get('sites');
    if (!sites[host]) return;
    if ((allowUntil.get(opener.id) || 0) > Date.now()) return;
    chrome.tabs.remove(tab.id);
  } catch (e) { /* ignore */ }
});
