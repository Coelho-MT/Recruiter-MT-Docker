import { generateInterviewKit } from '../api.js';
import { findButtonByText, toast, downloadText } from '../util/dom.js';

export function initInterviewKit() {
  const newKitBtn = findButtonByText('New Kit');
  const refreshBtn = findButtonByText('Refresh');
  const downloadBtn = findButtonByText('Download Kit');
  const roleSelect = document.querySelector('select');

  async function generate(roleTitle) {
    const kit = await generateInterviewKit({ roleTitle });
    renderKit(kit);
    toast('Interview kit generated.');
  }

  if (newKitBtn) newKitBtn.addEventListener('click', () => generate(roleSelect?.value || ''));
  if (refreshBtn) refreshBtn.addEventListener('click', () => generate(roleSelect?.value || ''));
  if (downloadBtn) downloadBtn.addEventListener('click', () => {
    const md = collectMarkdown();
    downloadText('interview-kit.md', md);
    toast('Downloaded interview-kit.md');
  });
}

function renderKit(kit) {
  const containers = Array.from(document.querySelectorAll('.border.border-gray-200.rounded-lg.p-4'));
  const [techBox, behavBox, scenBox] = containers;
  if (techBox && kit.technical) {
    const ul = techBox.querySelector('ul'); ul.innerHTML='';
    kit.technical.forEach(q => { const li = document.createElement('li'); li.textContent = q; ul.appendChild(li); });
  }
  if (behavBox && kit.behavioral) {
    const ul = behavBox.querySelector('ul'); ul.innerHTML='';
    kit.behavioral.forEach(q => { const li = document.createElement('li'); li.textContent = q; ul.appendChild(li); });
  }
  if (scenBox && kit.scenario) {
    const ul = scenBox.querySelector('ul'); ul.innerHTML='';
    kit.scenario.forEach(q => { const li = document.createElement('li'); li.textContent = q; ul.appendChild(li); });
  }

  const table = document.querySelector('table');
  if (table && kit.rubric) {
    const tbody = table.querySelector('tbody'); tbody.innerHTML='';
    kit.rubric.forEach(r => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td class="px-4 py-2 text-sm text-gray-500">${esc(r.criteria)}</td>
        <td class="px-4 py-2 text-sm text-gray-500">${esc(r.excellent)}</td>
        <td class="px-4 py-2 text-sm text-gray-500">${esc(r.good)}</td>
        <td class="px-4 py-2 text-sm text-gray-500">${esc(r.needs_work)}</td>
      `;
      tbody.appendChild(tr);
    });
  }
}

function collectMarkdown() {
  const sections = Array.from(document.querySelectorAll('.border.border-gray-200.rounded-lg.p-4'));
  const titles = ['Technical Questions','Behavioral Questions','Scenario Questions'];
  let out = `# Interview Kit\n\n`;
  sections.forEach((box, i) => {
    const lis = Array.from(box.querySelectorAll('li')).map(li => `- ${li.textContent.trim()}`);
    out += `## ${titles[i]}\n` + lis.join('\n') + '\n\n';
  });
  const table = document.querySelector('table');
  if (table) {
    out += `## Scoring Rubric\n| Criteria | Excellent | Good | Needs Work |\n|---|---|---|---|\n`;
    const rows = Array.from(table.querySelectorAll('tbody tr'));
    rows.forEach(tr => {
      const tds = Array.from(tr.querySelectorAll('td')).map(td => td.textContent.replace(/\|/g,'/'));
      out += `| ${tds.join(' | ')} |\n`;
    });
  }
  return out;
}

function esc(s){return (s||'').replace(/[|]/g,'/');}
