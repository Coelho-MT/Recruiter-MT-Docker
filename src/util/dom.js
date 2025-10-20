export function findButtonByText(text) {
  const buttons = Array.from(document.querySelectorAll('button'));
  return buttons.find(b => b.textContent.trim().toLowerCase() === text.toLowerCase()) || null;
}
export function toast(msg) {
  const t = document.createElement('div');
  t.textContent = msg;
  Object.assign(t.style, {position:'fixed',bottom:'16px',right:'16px',padding:'10px 12px',borderRadius:'8px',background:'#111827',color:'#fff',fontSize:'12px',zIndex:9999});
  document.body.appendChild(t);
  setTimeout(()=>t.remove(),1800);
}
export function downloadText(filename, text) {
  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = filename; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
}
