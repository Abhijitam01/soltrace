// Service worker — handles API calls to SolTrace
export {};

const SOLTRACE_API = 'https://soltrace.vercel.app/api/decode';

interface DecodeMessage {
  action: 'decode';
  rawBase64: string;
}

chrome.runtime.onMessage.addListener(
  (msg: DecodeMessage, _sender, sendResponse: (data: unknown) => void) => {
    if (msg.action !== 'decode') return false;

    fetch(SOLTRACE_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rawBase64: msg.rawBase64 }),
    })
      .then((r) => (r.ok ? r.json() : r.json().then((e: unknown) => ({ error: (e as { error?: string }).error ?? 'Decode failed' }))))
      .then(sendResponse)
      .catch(() => sendResponse({ error: 'Network error' }));

    return true; // keep channel open for async sendResponse
  }
);
