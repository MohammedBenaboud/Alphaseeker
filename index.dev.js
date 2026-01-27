const root = document.getElementById('root');
if (!root) throw new Error('No root element');
root.innerHTML = `<div style="font-family:system-ui,Segoe UI,Roboto,Helvetica,Arial;display:flex;align-items:center;justify-content:center;height:100vh;
color:#f8fafc"><div style="text-align:center"><h1 style="margin:0 0 8px 0">AlphaSeeker — Dev Smoke Test</h1><p style="margin:0;opacity:0.8">Static fallback loaded (no TSX build).</p></div></div>`;
