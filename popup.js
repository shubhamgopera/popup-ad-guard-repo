(async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  let host = '';
  try { host = new URL(tab.url).hostname; } catch {}
  document.getElementById('host').textContent = host || 'Not available on this page';
  const box = document.getElementById('toggle');
  if (!host) { box.disabled = true; return; }
  const { sites = {} } = await chrome.storage.local.get('sites');
  box.checked = !!sites[host];
  box.addEventListener('change', async () => {
    const { sites = {} } = await chrome.storage.local.get('sites');
    if (box.checked) sites[host] = true; else delete sites[host];
    await chrome.storage.local.set({ sites });
  });
})();
