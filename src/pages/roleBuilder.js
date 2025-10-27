import { generateJD, generateInterviewKitWithAnswers } from '../api.js';
import { findButtonByText, toast, downloadText } from '../util/dom.js';
import { sanitizeAIHtml, escapeHtml, sanitizeFormInput } from '../util/sanitizer.js';
import { ErrorHandler } from '../util/errorHandler.js';

let currentKit = null;

export function initRoleBuilder() {
  const titleInput = document.getElementById('job-title');
  const seniority = document.getElementById('seniority');
  const team = document.getElementById('team');
  const location = document.getElementById('location');
  const remoteSelect = location ? location.parentElement.querySelector('select') : null;

  const generateBtn = findGenerateButton();
  const regenerateQuestionsBtn = findButtonByText('Regenerate Questions');
  const proseContainer = document.getElementById('jd-content');

  // Make job description read-only (no editing allowed)
  if (proseContainer) {
    proseContainer.setAttribute('contenteditable', 'false');
  }

  // Enable/disable Generate button based on title input
  if (titleInput && generateBtn) {
    const toggle = () => {
      const hasText = titleInput.value.trim().length > 0;
      generateBtn.disabled = !hasText;
      generateBtn.style.opacity = hasText ? '1' : '0.6';
      generateBtn.style.cursor = hasText ? 'pointer' : 'not-allowed';
    };
    titleInput.addEventListener('input', toggle);
    toggle(); // Set initial state
  }

  // Wire up chip adders
  wireSkillAdder('Must-have Skills', 'blue');
  wireSkillAdder('Nice-to-have Skills', 'purple');
  wireChipAdder('Responsibilities');
  wireChipAdder('Requirements');
  wireChipAdder('Benefits');

  // Setup copy and export functionality using IDs
  const jdCopyBtn = document.getElementById('jd-copy-btn');
  const jdExportBtn = document.getElementById('jd-export-btn');
  const jdContent = document.getElementById('jd-content');
  
  if (jdCopyBtn && jdContent) {
    jdCopyBtn.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(jdContent.innerText);
        toast('Copied job description to clipboard.');
      } catch (err) {
        toast('Failed to copy to clipboard.');
      }
    });
  }
  
  if (jdExportBtn && jdContent) {
    jdExportBtn.addEventListener('click', () => {
      const text = jdContent.innerText || 'No job description generated yet.';
      downloadText('job_description.txt', text);
      toast('Downloaded job description.');
    });
  }

  const kitCopyBtn = document.getElementById('kit-copy-btn');
  const kitExportBtn = document.getElementById('kit-export-btn');
  const kitContent = document.getElementById('interview-kit-content');
  
  if (kitCopyBtn && kitContent) {
    kitCopyBtn.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(kitContent.innerText);
        toast('Copied interview kit to clipboard.');
      } catch (err) {
        toast('Failed to copy to clipboard.');
      }
    });
  }
  
  if (kitExportBtn && kitContent) {
    kitExportBtn.addEventListener('click', () => {
      const text = kitContent.innerText || 'No interview kit generated yet.';
      downloadText('interview_kit.txt', text);
      toast('Downloaded interview kit.');
    });
  }

  // Generate button handler
  if (generateBtn) {
    generateBtn.addEventListener('click', async () => {
      try {
        generateBtn.disabled = true;
        generateBtn.style.opacity = '0.6';
        const data = collectForm();

        // Show loading state
        if (proseContainer) {
          proseContainer.innerHTML = '<p class="text-gray-500">Generating job description...</p>';
        }

        // Generate both JD and interview kit in parallel
        const [jdResponse, kitResponse] = await Promise.all([
          generateJD(data),
          generateInterviewKitWithAnswers({
            roleTitle: data.title,
            seniority: data.seniority,
            team: data.team
          })
        ]);

        // Process JD response with XSS protection
        let html = sanitizeAIHtml(jdResponse);
        console.log('Job description HTML:', html);
        const header = `
          <h2>${escapeHtml(data.title)}</h2>
          <p><strong>Location:</strong> ${escapeHtml(data.location)} (${escapeHtml(data.remotePolicy)})</p>
          <p><strong>Team:</strong> ${escapeHtml(data.team)}</p>
        `;
        
        if (proseContainer) {
          proseContainer.innerHTML = header + html + buildMicroTechDisclaimer();
          console.log('Updated prose container with job description');
        }

        // Process interview kit response
        const kit = kitResponse;
        console.log('Received kit response:', kit);
        renderInterviewKit(kit);

        toast('Generated job description + interview kit.');
      } catch (e) {
        console.error('Generation failed:', e);
        ErrorHandler.showError(e, 'job description generation');
        
        // Restore previous state if available
        if (proseContainer && !proseContainer.innerHTML.includes('Generating')) {
          proseContainer.innerHTML = '<p class="text-gray-500">Generation failed. Please try again.</p>';
        }
      } finally {
        generateBtn.disabled = false;
        generateBtn.style.opacity = '1';
      }
    });
  }

  // Regenerate questions button handler
  if (regenerateQuestionsBtn) {
    regenerateQuestionsBtn.addEventListener('click', async () => {
      try {
        regenerateQuestionsBtn.disabled = true;
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
        ErrorHandler.showError(e, 'interview kit regeneration');
      } finally {
        regenerateQuestionsBtn.disabled = false;
      }
    });
  }
}

// Collects all form data
function collectForm() {
  const titleInput = document.getElementById('job-title');
  const seniority = document.getElementById('seniority');
  const team = document.getElementById('team');
  const location = document.getElementById('location');
  const remoteSelect = location ? location.parentElement.querySelector('select') : null;

  return {
    title: sanitizeFormInput(titleInput?.value || ''),
    seniority: sanitizeFormInput(seniority?.value || ''),
    team: sanitizeFormInput(team?.value || ''),
    location: sanitizeFormInput(location?.value || ''),
    remotePolicy: sanitizeFormInput(remoteSelect?.value || ''),
    mustHaveSkills: readChips('Must-have Skills'),
    niceToHaveSkills: readChips('Nice-to-have Skills'),
    responsibilities: readChips('Responsibilities'),
    requirements: readChips('Requirements'),
    benefits: readChips('Benefits')
  };
}

// Wires up the add/remove functionality for skill chips
function wireSkillAdder(sectionTitle, color) {
  const input = document.getElementById(`${sectionTitle.toLowerCase().replace(/\s/g, '-')}-input`);
  const addBtn = document.getElementById(`${sectionTitle.toLowerCase().replace(/\s/g, '-')}-add-btn`);
  const list = document.getElementById(`${sectionTitle.toLowerCase().replace(/\s/g, '-')}-list`);

  if (!input || !addBtn || !list) return;

  const addSkill = () => {
    const skill = (input.value || '').trim();
    if (!skill) return;

    const validation = { isValid: true, errors: [] };

    if (!validation.isValid) {
      toast(validation.errors.join(', '));
      return;
    }

    const chip = makeChip(skill, color);
    list.appendChild(chip);
    input.value = '';
    input.focus();
  };

  addBtn.addEventListener('click', addSkill);
  input.addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addSkill();
    }
  });
}

// Wires up the add/remove functionality for general chips (responsibilities, requirements, benefits)
function wireChipAdder(sectionTitle) {
  const input = document.getElementById(`${sectionTitle.toLowerCase().replace(/\s/g, '-')}-input`);
  const plusBtn = document.getElementById(`${sectionTitle.toLowerCase().replace(/\s/g, '-')}-add-btn`);
  const tray = document.getElementById(`${sectionTitle.toLowerCase().replace(/\s/g, '-')}-tray`);

  if (!input || !plusBtn || !tray) return;

  const addChip = () => {
    const v = (input.value||'').trim();
    if (!v) return;
    tray.appendChild(makeChip(v, sectionTitle==='Benefits'?'green':'gray'));
    input.value='';
  };

  plusBtn.addEventListener('click', addChip);
  input.addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addChip();
    }
  });
}

// Creates a chip element
function makeChip(text, color = 'gray') {
  const chip = document.createElement('span');
  chip.className = `inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-${color}-100 text-${color}-800 mr-2 mb-2 transition-all duration-150 ease-out`;
  chip.innerHTML = `${escapeHtml(sanitizeFormInput(text))}
    <button type="button" class="ml-1.5 inline-flex text-${color}-500 hover:text-${color}-700" aria-label="Remove">
      <i data-feather="x" class="w-3 h-3"></i>
    </button>`;
  
  // Add removal animation and handler
  const removeBtn = chip.querySelector('button');
  removeBtn.addEventListener('click', () => {
    chip.classList.add('scale-95', 'opacity-0');
    setTimeout(() => chip.remove(), 150);
  });

  // Add entrance animation
  chip.style.opacity = '0';
  chip.style.transform = 'scale(0.95)';
  setTimeout(() => {
    chip.style.transition = 'all 150ms ease-out';
    chip.style.opacity = '1';
    chip.style.transform = 'scale(1)';
  }, 10);

  if (window.feather) window.feather.replace();
  return chip;
}

// Reads chips from a section
function readChips(sectionTitle) {
  const tray = document.getElementById(`${sectionTitle.toLowerCase().replace(/\s/g, '-')}-tray`);
  const list = document.getElementById(`${sectionTitle.toLowerCase().replace(/\s/g, '-')}-list`);
  const elements = tray ? Array.from(tray.querySelectorAll('span')) : (list ? Array.from(list.querySelectorAll('span')) : []);
  return elements.map(el => el.textContent.trim().replace(/\s*x$/, ''));
}

// Builds the MicroTech disclaimer HTML
function buildMicroTechDisclaimer() {
  return `
    <div class="mt-10 pt-6 border-t border-gray-200 text-sm text-gray-500">
      <h3 class="text-lg font-medium text-gray-900 mb-2">MicroTech Equal Opportunity Statement</h3>
      <p class="mb-4">MicroTech is an equal opportunity employer. We celebrate diversity and are committed to creating an inclusive environment for all employees. All employment decisions are based on qualifications, merit, and business need. We do not discriminate on the basis of race, color, religion, marital status, age, national origin, ancestry, physical or mental disability, medical condition, pregnancy, genetic information, gender, sexual orientation, gender identity or expression, veteran status, or any other status protected under federal, state, or local law.</p>
      <h3 class="text-lg font-medium text-gray-900 mb-2">Privacy Notice</h3>
      <p>By using this service, you agree to MicroTech's Privacy Policy. Information submitted may be processed by AI services to generate job descriptions and interview kits. Please do not submit sensitive personal information.</p>
    </div>
  `;
}

// Finds the generate button
function findGenerateButton() {
  return findButtonByText('Generate');
}

// Interview kit management
function renderInterviewKit(kit) {
  console.log('Rendering interview kit:', kit);
  currentKit = kit;
  const mount = document.getElementById('interview-kit-content');
  console.log('Mount element:', mount);
  if (!mount) return;
  
  mount.innerHTML = `
    ${renderQAList('Technical Questions', kit.technical||[])}
    ${renderQAList('Behavioral Questions', kit.behavioral||[])}
    ${renderQAList('Scenario-based Questions', kit.scenario||[])}
  `;
}

// Renders a list of questions and answers
function renderQAList(title, items) {
  if (!items || items.length === 0) return '';
  return `
    <h3 class="text-xl font-bold text-gray-900 mt-8 mb-4">${escapeHtml(title)}</h3>
    <div class="space-y-6 mb-6">
      ${items.map(item => `
        <div class="bg-gray-50 p-4 rounded-lg shadow-sm">
          <p class="font-semibold text-gray-800 mb-2">${escapeHtml(item.q)}</p>
          <p class="text-gray-700 whitespace-pre-wrap">${escapeHtml(item.a)}</p>
        </div>
      `).join('')}
    </div>
  `;
}