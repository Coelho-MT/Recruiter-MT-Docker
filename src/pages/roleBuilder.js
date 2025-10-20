import { generateJD, generateInterviewKitWithAnswers } from '../api.js';
import { findButtonByText, toast, downloadText } from '../util/dom.js';

const STORAGE_KEY = 'roleBuilderDraft';
const HISTORY_KEY = 'roleBuilderHistory';
let currentKit = null;

// Utility function for debouncing
function debounce(fn, wait = 300) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      fn(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

export function initRoleBuilder() {
  purgeSeededExamples();

  const titleInput = document.getElementById('job-title');
  const seniority = document.getElementById('seniority');
  const team = document.getElementById('team');
  const location = document.getElementById('location');
  const remoteSelect = location ? location.parentElement.querySelector('select') : null;

  const generateBtn = findGenerateButton();
  const saveBtn = findButtonByText('Save Draft');
  const regenerateQuestionsBtn = findButtonByText('Regenerate Questions');
  const proseContainer = document.querySelector('.prose.max-w-none');

  // 1) Make JD editable + autosave while typing
  if (proseContainer) {
    proseContainer.setAttribute('contenteditable', 'true');
    proseContainer.addEventListener('input', debounce(() => persist(), 500));
  }

  // 2) Enable/disable Generate based on title
  if (titleInput && generateBtn) {
    const toggle = () => {
      const hasText = titleInput.value.trim().length > 0;
      generateBtn.disabled = !hasText;
      generateBtn.style.opacity = hasText ? '1' : '0.6';
      generateBtn.style.cursor = hasText ? 'pointer' : 'not-allowed';
    };
    titleInput.addEventListener('input', toggle);
    toggle();
  }

  // 3) Wire up all input handlers
  wireSkillAdder('Must-have Skills', 'blue');
  wireSkillAdder('Nice-to-have Skills', 'purple');
  wireChipAdder('Responsibilities');
  wireChipAdder('Requirements');
  wireChipAdder('Benefits');

  // 4) Copy & Export for both JD and Interview Kit
  if (proseContainer) {
    // Setup copy/export for Job Description
    const jdCopyBtn = proseContainer.parentElement.querySelector('button:has(i[data-feather="copy"])');
    const jdExportBtn = proseContainer.parentElement.querySelector('button:has(i[data-feather="download"])');
    
    if (jdCopyBtn) {
      jdCopyBtn.addEventListener('click', () => {
        navigator.clipboard.writeText(proseContainer.innerText);
        toast('Copied job description to clipboard.');
      });
    }
    
    if (jdExportBtn) {
      jdExportBtn.addEventListener('click', () => {
        const text = buildTxtExport(proseContainer);
        downloadText('job_description_and_interview_kit.txt', text);
        toast('Downloaded job description and interview kit.');
      });
    }

    // Setup copy/export for Interview Kit
    const interviewKitContent = document.getElementById('interview-kit-content');
    const kitCopyBtn = interviewKitContent?.parentElement.querySelector('button:has(i[data-feather="copy"])');
    const kitExportBtn = interviewKitContent?.parentElement.querySelector('button:has(i[data-feather="download"])');
    
    if (kitCopyBtn && interviewKitContent) {
      kitCopyBtn.addEventListener('click', () => {
        navigator.clipboard.writeText(interviewKitContent.innerText);
        toast('Copied interview kit to clipboard.');
      });
    }
    
    if (kitExportBtn) {
      kitExportBtn.addEventListener('click', () => {
        const text = buildTxtExport(proseContainer);
        downloadText('job_description_and_interview_kit.txt', text);
        toast('Downloaded job description and interview kit.');
      });
    }
  }

  // 5) Manual save
  if (saveBtn) {
    saveBtn.addEventListener('click', () => {
      persist(true);
      toast('Draft saved.');
    });
  }

  // Restore previous session
  restore();

  // 6) Generate flow: JD + Interview Kit with answers
  if (generateBtn) {
    generateBtn.addEventListener('click', async () => {
      try {
        generateBtn.disabled = true;
        generateBtn.style.opacity = '0.6';
        const data = collectForm();

        // Generate both JD and interview kit in parallel
        const [jdResponse, kitResponse] = await Promise.all([
          generateJD(data),
          generateInterviewKitWithAnswers({
            roleTitle: data.title,
            seniority: data.seniority,
            team: data.team
          })
        ]);

        // Process JD response
        let html = sanitizeLLMHtml(jdResponse);
        const header = `
          <h2>${esc(data.title)}</h2>
          <p><strong>Location:</strong> ${esc(data.location)} (${esc(data.remotePolicy)})</p>
          <p><strong>Team:</strong> ${esc(data.team)}</p>
        `;
        
        if (proseContainer) {
          proseContainer.innerHTML = header + html + buildMicroTechDisclaimer();
        }

        // Process interview kit response
        const kit = kitResponse;
        
        renderInterviewKit(kit);

        toast('Generated job description + interview kit.');
        persist(true);
        pushHistory({
          when: Date.now(),
          title: data.title,
          html: proseContainer?.innerHTML,
          kit
        });
      } catch (e) {
        console.error('Generation failed:', e);
        toast('Generation failed: ' + e.message);
      } finally {
        generateBtn.disabled = false;
        generateBtn.style.opacity = '1';
      }
    });
  }

  if (regenerateQuestionsBtn) {
    regenerateQuestionsBtn.addEventListener('click', async () => {
      try {
        const data = collectForm();
        const kit = await generateInterviewKitWithAnswers({
          roleTitle: data.title,
          seniority: data.seniority,
          team: data.team,
          skills: [...data.mustHaveSkills, ...data.niceToHaveSkills],
          responsibilities: data.responsibilities
        });
        renderInterviewKit(kit);
        toast('Regenerated interview questions.');
      } catch (e) {
        console.error('Failed to regenerate questions:', e);
        toast('Failed to regenerate questions: ' + e.message);
      }
    });
  }
}

// Form management
function collectForm() {
  const titleInput = document.getElementById('job-title');
  const seniority = document.getElementById('seniority');
  const team = document.getElementById('team');
  const location = document.getElementById('location');
  const remoteSelect = location?.parentElement.querySelector('select');

  const mustHaveSkills = Array.from(document.querySelectorAll('.bg-blue-100')).map(span => {
    const text = span.textContent.trim();
    return text.substring(0, text.lastIndexOf('(')).trim();
  });
  
  const niceToHaveSkills = Array.from(document.querySelectorAll('.bg-purple-100')).map(span => {
    const text = span.textContent.trim();
    return text.substring(0, text.lastIndexOf('(')).trim();
  });

  return {
    title: titleInput?.value?.trim() || '',
    seniority: seniority?.value || '',
    team: team?.value?.trim() || '',
    location: location?.value?.trim() || '',
    remotePolicy: remoteSelect?.value || 'On-site',
    mustHaveSkills,
    niceToHaveSkills,
    responsibilities: readChips('Responsibilities'),
    requirements: readChips('Requirements'),
    benefits: readChips('Benefits')
  };
}

// Skill management
function wireSkillAdder(label, color) {
  const section = Array.from(document.querySelectorAll('label'))
    .find(el => el.textContent.includes(label))?.parentElement;
  
  if (!section) return;

  const input = section.querySelector('input');
  const select = section.querySelector('select');
  const addBtn = section.querySelector('button');
  const list = section.querySelector(`#${label === 'Must-have Skills' ? 'must-have-skills' : 'nice-to-have-skills'}`);

  if (!input || !select || !addBtn || !list) return;

  const addSkill = () => {
    const skill = input.value.trim();
    const level = select.value;
    if (!skill) {
      input.focus();
      input.classList.add('ring-2', 'ring-red-500', 'border-red-300');
      setTimeout(() => {
        input.classList.remove('ring-2', 'ring-red-500', 'border-red-300');
      }, 2000);
      return;
    }

    const bgColor = color === 'blue' ? 'bg-blue-100' : 'bg-purple-100';
    const textColor = color === 'blue' ? 'text-blue-800' : 'text-purple-800';
    const borderColor = color === 'blue' ? 'border-blue-200' : 'border-purple-200';
    const hoverBg = color === 'blue' ? 'hover:bg-blue-200' : 'hover:bg-purple-200';
    const buttonColor = color === 'blue' ? 'text-blue-500 hover:text-blue-700' : 'text-purple-500 hover:text-purple-700';

    const chip = document.createElement('span');
    chip.className = `group inline-flex items-center px-3 py-2 rounded-lg text-sm font-medium ${bgColor} ${textColor} ${borderColor} border ${hoverBg} transition-all duration-150`;
    chip.innerHTML = `
      <span class="mr-1">${esc(skill)}</span>
      <span class="font-semibold">(${level} ${level === '1' ? 'year' : 'years'})</span>
      <button type="button" class="ml-2 p-1 rounded-full ${buttonColor} opacity-0 group-hover:opacity-100 transition-opacity duration-150">
        <i data-feather="x" class="w-4 h-4"></i>
      </button>
    `;
    
    // Add removal animation and handler
    const removeBtn = chip.querySelector('button');
    removeBtn.addEventListener('click', () => {
      chip.classList.add('scale-95', 'opacity-0');
      setTimeout(() => chip.remove(), 150);
      persist();
    });

    // Add entrance animation
    chip.style.opacity = '0';
    chip.style.transform = 'scale(0.95)';
    list.appendChild(chip);
    feather.replace();

    // Trigger animation
    requestAnimationFrame(() => {
      chip.style.transition = 'all 150ms ease-out';
      chip.style.opacity = '1';
      chip.style.transform = 'scale(1)';
    });

    input.value = '';
    input.focus();
    persist();
  };

  addBtn.addEventListener('click', addSkill);
  input.addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addSkill();
    }
  });
}

// Chip management
function wireChipAdder(sectionTitle) {
  const h3 = Array.from(document.querySelectorAll('h3')).find(el => el.textContent.trim().toLowerCase() === sectionTitle.toLowerCase());
  const section = h3 ? h3.closest('.bg-white') : null;
  if (!section) return;
  const input = section.querySelector('input[type="text"]');
  const plusBtn = section.querySelector('button i[data-feather="plus"]')?.parentElement;
  const tray = ensureChipTray(sectionTitle);
  if (!input || !plusBtn || !tray) return;

  const addChip = () => {
    const v = (input.value||'').trim();
    if (!v) return;
    tray.appendChild(makeChip(v, sectionTitle==='Benefits'?'green':'gray'));
    input.value='';
    persist();
  };

  plusBtn.addEventListener('click', addChip);
  input.addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addChip();
    }
  });
}

function ensureChipTray(sectionTitle) {
  const h3 = Array.from(document.querySelectorAll('h3')).find(el => el.textContent.trim().toLowerCase() === sectionTitle.toLowerCase());
  const section = h3 ? h3.closest('.bg-white') : null;
  if (!section) return null;
  let tray = section.querySelector('.chip-tray');
  if (!tray) {
    tray = document.createElement('div');
    tray.className = 'chip-tray flex flex-wrap gap-2 mt-2';
    const ul = section.querySelector('ul');
    if (ul && ul.parentElement) ul.parentElement.appendChild(tray);
    else section.appendChild(tray);
  }
  return tray;
}

function makeChip(text, color='gray') {
  const span = document.createElement('span');
  const colorCls = color === 'green' ? 'bg-green-100 text-green-800'
                : color === 'blue' ? 'bg-blue-100 text-blue-800'
                : 'bg-gray-100 text-gray-800';
  span.className = `inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${colorCls}`;
  span.innerHTML = `${esc(text)}
    <button type="button" class="ml-1.5 inline-flex text-gray-500 hover:text-gray-700" aria-label="Remove">
      <i data-feather="x" class="w-3 h-3"></i>
    </button>`;
  const removeBtn = span.querySelector('button');
  removeBtn.addEventListener('click', () => {
    span.remove();
    persist();
  });
  if (window.feather) window.feather.replace();
  return span;
}

function readChips(sectionTitle) {
  const tray = ensureChipTray(sectionTitle);
  if (!tray) return [];
  return Array.from(tray.querySelectorAll('span'))
    .map(s => s.childNodes[0].textContent.trim());
}

function setChips(sectionTitle, arr) {
  const tray = ensureChipTray(sectionTitle);
  if (!tray) return;
  tray.innerHTML = '';
  (arr||[]).forEach(v => tray.appendChild(makeChip(v, sectionTitle==='Benefits'?'green':'gray')));
}

// Storage & state management
function persist(showToast=false) {
  const payload = {
    form: collectForm(),
    html: document.querySelector('.prose.max-w-none')?.innerHTML || '',
    kit: currentKit
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  if (showToast) toast('Saved.');
}

function restore() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const { form, html, kit } = JSON.parse(raw);
    if (form) {
      const titleInput = document.getElementById('job-title');
      const seniority = document.getElementById('seniority');
      const team = document.getElementById('team');
      const location = document.getElementById('location');
      const remoteSelect = location?.parentElement.querySelector('select');
      const proseContainer = document.querySelector('.prose.max-w-none');
      
      if (titleInput) titleInput.value = form.title || '';
      if (seniority) seniority.value = form.seniority || seniority.value;
      if (team) team.value = form.team || '';
      if (location) location.value = form.location || '';
      if (remoteSelect) remoteSelect.value = form.remotePolicy || remoteSelect.value;
      setChips('Responsibilities', form.responsibilities||[]);
      setChips('Requirements', form.requirements||[]);
      setChips('Benefits', form.benefits||[]);
      
      if (html && proseContainer) proseContainer.innerHTML = html;
      if (kit) { currentKit = kit; renderInterviewKit(kit); }
    }
  } catch(e) {
    console.error('Failed to restore state:', e);
  }
}

function pushHistory(entry) {
  try {
    const history = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
    history.unshift(entry);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(0, 10)));
  } catch (e) {
    console.error('Failed to update history:', e);
  }
}

// Interview kit management
function renderInterviewKit(kit) {
  currentKit = kit;
  const mount = document.getElementById('interview-kit-content');
  if (!mount) return;
  
  mount.innerHTML = `
    ${renderQAList('Technical Questions', kit.technical||[])}
    ${renderQAList('Behavioral Questions', kit.behavioral||[])}
    ${renderQAList('Scenario-based Questions', kit.scenario||[])}
  `;
}

function ensureInterviewMount() {
  let el = document.getElementById('interview-kit-inline');
  if (!el) {
    el = document.createElement('div');
    el.id = 'interview-kit-inline';
    el.className = 'mt-6';
    const target = document.querySelector('.prose.max-w-none')?.parentElement;
    if (!target) return null;
    target.appendChild(el);
  }
  return el;
}

function renderQAList(title, arr) {
  if (!arr || arr.length === 0) return '';
  
  const items = arr.map((qa, index) => 
    `<li class="mb-4">
      <p class="mb-2"><strong>${index + 1}. ${esc(qa.q)}</strong></p>
      <p class="text-gray-600 pl-4">Sample Answer: ${esc(qa.a)}</p>
    </li>`
  ).join('');
  
  return `
    <div class="mb-6">
      <h4 class="font-medium text-gray-900 mb-3 text-lg">${title}</h4>
      <ul class="list-none space-y-4">${items}</ul>
    </div>
  `;
}

// Utility functions
function findGenerateButton() {
  return findButtonByText('Generate');
}

function wireCopy(proseContainer) {
  const copyBtn = findButtonByText('Copy');
  if (!copyBtn || !proseContainer) return;
  copyBtn.addEventListener('click', async () => {
    await navigator.clipboard.writeText(proseContainer.innerText);
    toast('Copied to clipboard.');
  });
}

function wireExportTxt(build) {
  const exportBtn = findButtonByText('Export');
  if (!exportBtn) return;
  exportBtn.addEventListener('click', () => {
    const txt = build();
    downloadText('job-description.txt', txt);
    toast('Exported job-description.txt');
  });
}

function purgeSeededExamples() {
  document.querySelectorAll('.flex.flex-wrap.gap-2, .flex.flex-wrap.gap-1').forEach(c => c.innerHTML = '');
  ['Responsibilities','Requirements','Benefits'].forEach(title => {
    const h3 = Array.from(document.querySelectorAll('h3')).find(el => el.textContent.trim().toLowerCase() === title.toLowerCase());
    const section = h3 ? h3.closest('.bg-white') : null;
    const ul = section ? section.querySelector('ul') : null;
    if (ul) ul.innerHTML = '';
  });
  const proseContainer = document.querySelector('.prose.max-w-none');
  if (proseContainer) proseContainer.innerHTML = '<p class="text-gray-500">No description yet. Enter a title and click Generate.</p>';
}

function sanitizeLLMHtml(s='') {
  s = s.replace(/```[a-z]*\n/gi, '').replace(/```/g, '');
  s = s.replace(/^html\s*/i, '');
  return s;
}

function buildTxtExport(proseContainer) {
  let out = '';

  // Job Description
  if (proseContainer) {
    out += 'JOB DESCRIPTION\n';
    out += '---------------\n\n';
    out += proseContainer.innerText.trim() + '\n\n';
  }

  // Interview Kit
  if (currentKit) {
    out += 'INTERVIEW KIT\n';
    out += '-------------\n\n';
    [
      ['technical', 'Technical Questions'],
      ['behavioral', 'Behavioral Questions'],
      ['scenario', 'Scenario-based Questions']
    ].forEach(([key, label]) => {
      const questions = currentKit[key] || [];
      if (questions.length) {
        out += `${label}:\n\n`;
        questions.forEach((qa, i) => {
          out += `${i + 1}. Q: ${qa.q}\n   A: ${qa.a}\n\n`;
        });
      }
    });
  }

  return out;
}

function buildMicroTechDisclaimer() {
  return `
    <div class="text-gray-500 text-sm mt-4">
      <p>MicroTech is proud to be an equal opportunity workplace and is an affirmative action employer. We are committed to equal employment opportunity regardless of race, color, ancestry, religion, sex, national origin, sexual orientation, age, citizenship, marital status, disability, gender identity or Veteran status. We also consider qualified applicants regardless of criminal histories, consistent with legal requirements.</p>
    </div>
  `;
}

function esc(str) {
  return ('' + str).replace(/[&<>"']/g, m => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  })[m]);
}