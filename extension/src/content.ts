// Isolated content script — bridges inject.ts ↔ background, renders overlay
export {};

const MSG_REQUEST = 'WALLET_COPILOT_TX_REQUEST';
const MSG_RESPONSE = 'WALLET_COPILOT_TX_RESPONSE';

interface DecodedTx {
  riskScore: number;
  summary: string;
  ammType: string;
  programIds: string[];
  diffs: Array<{ owner: string; mint: string; delta: number; type: string }>;
  error?: string;
}

let overlayEl: HTMLElement | null = null;

function removeOverlay() {
  overlayEl?.remove();
  overlayEl = null;
}

function riskColor(score: number): string {
  if (score >= 50) return '#ef4444';
  if (score >= 25) return '#f97316';
  return '#22c55e';
}

function riskLabel(score: number): string {
  if (score >= 50) return 'HIGH RISK';
  if (score >= 25) return 'MEDIUM RISK';
  return 'LOW RISK';
}

function buildDiffsHTML(diffs: DecodedTx['diffs']): string {
  if (!diffs.length) return '<p style="color:#94a3b8;font-size:12px">No account changes detected</p>';
  return diffs
    .slice(0, 6)
    .map((d) => {
      const sign = d.delta > 0 ? '+' : '';
      const color = d.delta > 0 ? '#22c55e' : d.delta < 0 ? '#ef4444' : '#94a3b8';
      const mintShort = d.mint === 'SOL' ? 'SOL' : `${d.mint.slice(0, 6)}…${d.mint.slice(-4)}`;
      return `<div style="display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px solid #334155;font-size:12px">
        <span style="color:#94a3b8">${mintShort}</span>
        <span style="color:${color};font-family:monospace">${sign}${d.delta.toFixed(4)}</span>
      </div>`;
    })
    .join('');
}

function showOverlay(requestId: string, decoded: DecodedTx | null, loading: boolean) {
  removeOverlay();

  const overlay = document.createElement('div');
  overlay.id = 'wallet-copilot-overlay';
  overlay.style.cssText = [
    'position:fixed', 'top:0', 'left:0', 'right:0', 'bottom:0',
    'background:rgba(0,0,0,0.75)', 'z-index:2147483647',
    'display:flex', 'align-items:center', 'justify-content:center',
    'font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif',
  ].join(';');

  const panel = document.createElement('div');
  panel.style.cssText = [
    'background:#0f172a', 'border:1px solid #334155', 'border-radius:12px',
    'padding:20px', 'width:360px', 'max-height:80vh', 'overflow-y:auto',
    'box-shadow:0 25px 50px rgba(0,0,0,0.5)',
  ].join(';');

  if (loading || !decoded) {
    panel.innerHTML = `
      <div style="color:#9945FF;font-weight:700;font-size:14px;margin-bottom:8px">
        Wallet Copilot
      </div>
      <div style="color:#94a3b8;font-size:13px">${loading ? 'Analyzing transaction…' : 'Failed to analyze — click Proceed to continue anyway.'}</div>
      <div style="display:flex;gap:8px;margin-top:16px">
        <button id="wc-proceed" style="flex:1;padding:8px;background:#9945FF;color:#fff;border:none;border-radius:6px;cursor:pointer;font-size:13px">Proceed</button>
        <button id="wc-cancel" style="flex:1;padding:8px;background:#1e293b;color:#94a3b8;border:1px solid #334155;border-radius:6px;cursor:pointer;font-size:13px">Cancel</button>
      </div>`;
  } else {
    const score = decoded.riskScore ?? 0;
    const color = riskColor(score);
    const label = riskLabel(score);
    panel.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px">
        <span style="color:#9945FF;font-weight:700;font-size:14px">Wallet Copilot</span>
        <span style="background:${color}22;color:${color};padding:2px 8px;border-radius:999px;font-size:11px;font-weight:600">${label} (${score})</span>
      </div>
      <p style="color:#e2e8f0;font-size:13px;margin:0 0 12px">${decoded.summary ?? 'Transaction analysis'}</p>
      <div style="margin-bottom:12px">
        <div style="color:#64748b;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:6px">Account Changes</div>
        ${buildDiffsHTML(decoded.diffs ?? [])}
      </div>
      ${decoded.programIds?.length ? `
      <div style="margin-bottom:12px">
        <div style="color:#64748b;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:6px">Programs</div>
        ${decoded.programIds.slice(0, 3).map((pid) => `<div style="font-family:monospace;font-size:10px;color:#64748b;padding:2px 0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${pid}</div>`).join('')}
      </div>` : ''}
      <div style="display:flex;gap:8px;margin-top:16px">
        <button id="wc-proceed" style="flex:1;padding:8px;background:#9945FF;color:#fff;border:none;border-radius:6px;cursor:pointer;font-size:13px">Proceed</button>
        <button id="wc-cancel" style="flex:1;padding:8px;background:#1e293b;color:#94a3b8;border:1px solid #334155;border-radius:6px;cursor:pointer;font-size:13px">Cancel</button>
      </div>`;
  }

  overlay.appendChild(panel);
  document.body.appendChild(overlay);
  overlayEl = overlay;

  const proceed = panel.querySelector('#wc-proceed');
  const cancel = panel.querySelector('#wc-cancel');

  proceed?.addEventListener('click', () => {
    window.postMessage({ type: MSG_RESPONSE, requestId, proceed: true }, '*');
    removeOverlay();
  });

  cancel?.addEventListener('click', () => {
    window.postMessage({ type: MSG_RESPONSE, requestId, proceed: false }, '*');
    removeOverlay();
  });
}

window.addEventListener('message', (e: MessageEvent) => {
  if (e.source !== window || e.data?.type !== MSG_REQUEST) return;

  const { requestId, rawBase64 } = e.data as { requestId: string; rawBase64: string };

  showOverlay(requestId, null, true);

  chrome.runtime.sendMessage({ action: 'decode', rawBase64 }, (decoded: DecodedTx | null) => {
    if (chrome.runtime.lastError || !decoded || decoded.error) {
      // Don't block user on error — show error state briefly then auto-proceed
      showOverlay(requestId, null, false);
      return;
    }
    showOverlay(requestId, decoded, false);
  });
});
