/* ================================================================
   APP.JS — PlanStart.ma Main Application Controller
   ================================================================ */

/* ── STATE ───────────────────────────────────────────────────────── */
const App = {
  currentStep:    1,
  totalSteps:     5,
  currentLang:    'fr',
  currentDetail:  'complet',
  orchestrator:   null,
  generatedPlan:  null,
  generatedMeta:  null,
  agentProgress:  {},   // { agentId: 'pending'|'running'|'done' }

  // Form data — entrepreneur + project
  formData: {
    // Étape 1 – Fiche entrepreneur
    entrepreneurTitle:    '',
    entrepreneurName:     '',
    entrepreneurActivity: '',
    experience:           '',
    legalForm:            '',
    addressStreet:        '',
    addressQuartier:      '',
    addressCP:            '',
    addressCity:          '',
    email:                '',
    phone:                '',
    // Étape 2 – Projet
    projectName:  '', sector: '', sectorLabel: '', sectorCategory: '',
    description:  '',
    // Étape 3 – Positionnement
    problem: '', uniqueValue: '', targetClients: '',
    // Étape 4 – Contexte Maroc
    city: '', addressZone: '', capital: '', teamSize: '', openingDate: '',
    // Étape 5 – Options
    language: 'fr', detailLevel: 'complet'
  }
};

/* ── DOM REFS ────────────────────────────────────────────────────── */
const $ = id => document.getElementById(id);
const $$ = sel => document.querySelectorAll(sel);

/* ── INIT ────────────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  initUI();
  loadSavedSettings();
  populateSelects();
  bindEvents();
  setView('empty');
});

/* ── UI INITIALIZATION ───────────────────────────────────────────── */
function initUI() {
  // Init agent progress
  CONFIG.AGENTS.forEach(a => { App.agentProgress[a.id] = 'pending'; });

  // Render agent status cards
  renderAgentStatusCards();

  // Set step pills
  renderStepPills();
}

function loadSavedSettings() {
  // Plus besoin de charger la clé API (intégrée dans config.js)
  const savedLang = localStorage.getItem(CONFIG.STORAGE_KEYS.LANG);
  if (savedLang) setLanguage(savedLang);
}

function populateSelects() {
  // ── Sector select — optgroups by category ──────────────────────
  const sectorSel = $('sector-select');
  CONFIG.SECTORS.forEach(cat => {
    const grp = document.createElement('optgroup');
    grp.label = `${cat.icon}  ${cat.category}`;
    cat.activities.forEach(act => {
      const opt = document.createElement('option');
      opt.value            = act.value;
      opt.dataset.category = cat.category;
      opt.dataset.icon     = cat.icon;
      opt.textContent      = act.label;
      grp.appendChild(opt);
    });
    sectorSel.appendChild(grp);
  });

  // Show badge when sector selected
  sectorSel.addEventListener('change', () => {
    const sel    = sectorSel.options[sectorSel.selectedIndex];
    const badge  = $('sector-badge');
    if (badge && sectorSel.value) {
      badge.style.display = 'block';
      badge.innerHTML = `<span class="sector-selected-badge">${sel.dataset.icon || ''} ${sel.dataset.category || ''} › ${sel.textContent}</span>`;
    } else if (badge) {
      badge.style.display = 'none';
    }
  });

  // ── Entrepreneur title ─────────────────────────────────────────
  const titleSel = $('entrepreneur-title');
  if (titleSel) {
    CONFIG.TITLES.forEach(t => {
      const opt = document.createElement('option');
      opt.value = t.value; opt.textContent = t.label;
      titleSel.appendChild(opt);
    });
  }

  // ── Experience ────────────────────────────────────────────────
  const expSel = $('experience-select');
  if (expSel) {
    CONFIG.EXPERIENCE_YEARS.forEach(e => {
      const opt = document.createElement('option');
      opt.value = e.value; opt.textContent = e.label;
      expSel.appendChild(opt);
    });
  }

  // ── Legal form ─────────────────────────────────────────────────
  const legalSel = $('legal-form-select');
  if (legalSel) {
    CONFIG.LEGAL_FORMS.forEach(l => {
      const opt = document.createElement('option');
      opt.value = l.value; opt.textContent = l.label;
      legalSel.appendChild(opt);
    });
  }

  // ── Cities ────────────────────────────────────────────────────
  const citySel = $('city-select');
  CONFIG.CITIES.forEach(c => {
    const opt = document.createElement('option');
    opt.value = c; opt.textContent = c;
    citySel.appendChild(opt);
  });

  // ── Team sizes ─────────────────────────────────────────────────
  const teamSel = $('team-select');
  CONFIG.TEAM_SIZES.forEach(t => {
    const opt = document.createElement('option');
    opt.value = t.value; opt.textContent = t.label;
    teamSel.appendChild(opt);
  });
}

/* ── EVENT BINDING ───────────────────────────────────────────────── */
function bindEvents() {

  // Language toggle
  $$('.lang-opt').forEach(btn => {
    btn.addEventListener('click', () => {
      setLanguage(btn.dataset.lang);
    });
  });

  // Detail level
  $$('.detail-opt').forEach(btn => {
    btn.addEventListener('click', () => {
      $$('.detail-opt').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      App.currentDetail = btn.dataset.level;
      App.formData.detailLevel = App.currentDetail;
    });
  });

  // Step navigation
  $('btn-next').addEventListener('click', nextStep);
  $('btn-prev').addEventListener('click', prevStep);

  // Generate buttons (un dans le footer, un dans l'étape 4)
  $('btn-generate').addEventListener('click', startGeneration);
  const mainBtn = $('btn-generate-main');
  if (mainBtn) mainBtn.addEventListener('click', startGeneration);

  // New plan button
  $('btn-new-plan').addEventListener('click', resetToForm);

  // Copy plan
  $('btn-copy').addEventListener('click', copyPlan);

  // Export
  $('btn-export-pdf').addEventListener('click', exportPDF);
  if ($('btn-export-html')) $('btn-export-html').addEventListener('click', exportHTML);
  if ($('btn-export-word')) $('btn-export-word').addEventListener('click', exportWord);

  // Abort
  $('btn-abort').addEventListener('click', abortGeneration);
}

/* ── LANGUAGE ────────────────────────────────────────────────────── */
function setLanguage(lang) {
  App.currentLang = lang;
  App.formData.language = lang;
  localStorage.setItem(CONFIG.STORAGE_KEYS.LANG, lang);

  $$('.lang-opt').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.lang === lang);
  });

  if (lang === 'ar') {
    document.body.classList.add('lang-ar');
  } else {
    document.body.classList.remove('lang-ar');
  }
}

/* ── STEP MANAGEMENT ─────────────────────────────────────────────── */
function renderStepPills() {
  const container = $('step-pills');
  if (!container) return;
  container.innerHTML = '';

  for (let i = 1; i <= App.totalSteps; i++) {
    const pill = document.createElement('div');
    pill.className = 'step-pill';
    pill.style.flex = '1';
    if (i === App.currentStep) pill.classList.add('active');
    else if (i < App.currentStep)  pill.classList.add('done');
    else pill.classList.add('pending');
    container.appendChild(pill);
  }

  const label = $('step-label');
  if (label) label.textContent = `Étape ${App.currentStep}/${App.totalSteps}`;
}

function nextStep() {
  if (!validateCurrentStep()) return;
  if (App.currentStep < App.totalSteps) {
    App.currentStep++;
    updateStep();
  }
}

function prevStep() {
  if (App.currentStep > 1) {
    App.currentStep--;
    updateStep();
  }
}

function updateStep() {
  $$('.form-step').forEach(s => s.classList.remove('active'));
  const activeStep = $(`step-${App.currentStep}`);
  if (activeStep) activeStep.classList.add('active');

  renderStepPills();

  // Show/hide prev button
  $('btn-prev').style.visibility = App.currentStep > 1 ? 'visible' : 'hidden';

  // Show generate button in footer on last step, hide Next
  const isLast = App.currentStep === App.totalSteps;
  $('btn-next').style.display     = isLast ? 'none' : 'inline-flex';
  $('btn-generate').style.display = isLast ? 'inline-flex' : 'none';
}

/* ── FORM VALIDATION — 5 étapes ─────────────────────────────────── */
function validateCurrentStep() {
  const step = App.currentStep;

  // ── Étape 1 : Fiche Entrepreneur ─────────────────────────────
  if (step === 1) {
    const titleVal  = $('entrepreneur-title')  ? $('entrepreneur-title').value  : '';
    const nameVal   = $('entrepreneur-name')   ? $('entrepreneur-name').value.trim()  : '';
    const actVal    = $('entrepreneur-activity') ? $('entrepreneur-activity').value.trim() : '';
    const streetVal = $('address-street')      ? $('address-street').value.trim() : '';
    if (!titleVal) {
      showToast('⚠️ Sélectionnez votre titre professionnel', 'error');
      return false;
    }
    if (!nameVal) {
      showToast('⚠️ Entrez votre nom complet', 'error');
      $('entrepreneur-name').focus();
      return false;
    }
    if (!actVal) {
      showToast('⚠️ Précisez votre activité / spécialité', 'error');
      $('entrepreneur-activity').focus();
      return false;
    }
    if (!streetVal) {
      showToast('⚠️ Entrez l\'adresse professionnelle (rue)', 'error');
      $('address-street').focus();
      return false;
    }
    App.formData.entrepreneurTitle    = titleVal;
    App.formData.entrepreneurName     = nameVal;
    App.formData.entrepreneurActivity = actVal;
    App.formData.experience           = $('experience-select')  ? $('experience-select').value  : '';
    App.formData.legalForm            = $('legal-form-select')  ? $('legal-form-select').value  : '';
    App.formData.addressStreet        = streetVal;
    App.formData.addressQuartier      = $('address-quartier')   ? $('address-quartier').value.trim() : '';
    App.formData.addressCP            = $('address-cp')         ? $('address-cp').value.trim()        : '';
    App.formData.email                = $('entrepreneur-email') ? $('entrepreneur-email').value.trim() : '';
    App.formData.phone                = $('entrepreneur-phone') ? $('entrepreneur-phone').value.trim() : '';
  }

  // ── Étape 2 : Le Projet ────────────────────────────────────────
  if (step === 2) {
    const name   = $('project-name').value.trim();
    const sector = $('sector-select').value;
    const desc   = $('description').value.trim();
    if (!name) {
      showToast('⚠️ Entrez le nom de votre cabinet / structure', 'error');
      $('project-name').focus();
      return false;
    }
    if (!sector) {
      showToast('⚠️ Sélectionnez votre secteur d\'activité précis', 'error');
      return false;
    }
    if (!desc) {
      showToast('⚠️ Décrivez votre projet', 'error');
      $('description').focus();
      return false;
    }
    App.formData.projectName = name;
    App.formData.sector      = sector;
    const selOpt = $('sector-select').options[$('sector-select').selectedIndex];
    App.formData.sectorLabel    = selOpt.textContent;
    App.formData.sectorCategory = selOpt.dataset ? selOpt.dataset.category || '' : '';
    App.formData.description    = desc;
  }

  // ── Étape 3 : Vision & Positionnement ─────────────────────────
  if (step === 3) {
    const prob  = $('problem').value.trim();
    const uval  = $('unique-value').value.trim();
    if (!prob) {
      showToast('⚠️ Décrivez le problème / besoin identifié', 'error');
      $('problem').focus();
      return false;
    }
    if (!uval) {
      showToast('⚠️ Décrivez votre proposition de valeur unique', 'error');
      $('unique-value').focus();
      return false;
    }
    App.formData.problem       = prob;
    App.formData.uniqueValue   = uval;
    App.formData.targetClients = $('target-clients') ? $('target-clients').value.trim() : '';
  }

  // ── Étape 4 : Contexte Maroc ───────────────────────────────────
  if (step === 4) {
    const city    = $('city-select').value;
    const capital = $('capital').value.trim();
    const team    = $('team-select').value;
    if (!city) {
      showToast('⚠️ Sélectionnez la ville d\'implantation', 'error');
      return false;
    }
    if (!capital) {
      showToast('⚠️ Entrez le budget d\'investissement', 'error');
      $('capital').focus();
      return false;
    }
    if (!team) {
      showToast('⚠️ Sélectionnez la taille de l\'équipe', 'error');
      return false;
    }
    App.formData.city        = city;
    App.formData.addressZone = $('address-zone')  ? $('address-zone').value.trim()  : '';
    App.formData.capital     = capital;
    App.formData.teamSize    = team;
    App.formData.openingDate = $('opening-date')  ? $('opening-date').value.trim()  : '';
  }

  // ── Étape 5 : Options ─────────────────────────────────────────
  if (step === 5) {
    App.formData.language    = App.currentLang;
    App.formData.detailLevel = App.currentDetail;
  }

  return true;
}

/* ── GENERATION ──────────────────────────────────────────────────── */
async function startGeneration() {
  // Collecter toutes les données du formulaire
  const fd = App.formData;

  // Étape 1 – Entrepreneur
  fd.entrepreneurTitle    = $('entrepreneur-title')   ? $('entrepreneur-title').value    : '';
  fd.entrepreneurName     = $('entrepreneur-name')    ? $('entrepreneur-name').value.trim()    : '';
  fd.entrepreneurActivity = $('entrepreneur-activity')? $('entrepreneur-activity').value.trim() : '';
  fd.experience           = $('experience-select')    ? $('experience-select').value    : '';
  fd.legalForm            = $('legal-form-select')    ? $('legal-form-select').value    : '';
  fd.addressStreet        = $('address-street')       ? $('address-street').value.trim()       : '';
  fd.addressQuartier      = $('address-quartier')     ? $('address-quartier').value.trim()     : '';
  fd.addressCP            = $('address-cp')           ? $('address-cp').value.trim()           : '';
  fd.email                = $('entrepreneur-email')   ? $('entrepreneur-email').value.trim()   : '';
  fd.phone                = $('entrepreneur-phone')   ? $('entrepreneur-phone').value.trim()   : '';
  // Étape 2 – Projet
  fd.projectName  = $('project-name').value.trim();
  fd.sector       = $('sector-select').value;
  const selIdx    = $('sector-select').selectedIndex;
  const selOpt    = selIdx > 0 ? $('sector-select').options[selIdx] : null;
  fd.sectorLabel    = selOpt ? selOpt.textContent : '';
  fd.sectorCategory = selOpt && selOpt.dataset ? selOpt.dataset.category || '' : '';
  fd.description  = $('description').value.trim();
  // Étape 3 – Positionnement
  fd.problem        = $('problem').value.trim();
  fd.uniqueValue    = $('unique-value').value.trim();
  fd.targetClients  = $('target-clients') ? $('target-clients').value.trim() : '';
  // Étape 4 – Contexte
  fd.city        = $('city-select').value;
  fd.addressZone = $('address-zone')  ? $('address-zone').value.trim()  : '';
  fd.capital     = $('capital').value.trim();
  fd.teamSize    = $('team-select').value;
  fd.openingDate = $('opening-date')  ? $('opening-date').value.trim()  : '';
  // Étape 5 – Options
  fd.language    = App.currentLang;
  fd.detailLevel = App.currentDetail;

  // Validation minimale avant envoi
  if (!fd.entrepreneurName) {
    showToast('⚠️ Renseignez votre nom (Étape 1)', 'error'); return;
  }
  if (!fd.entrepreneurActivity) {
    showToast('⚠️ Précisez votre activité / spécialité (Étape 1)', 'error'); return;
  }
  if (!fd.projectName) {
    showToast('⚠️ Entrez le nom de votre structure (Étape 2)', 'error'); return;
  }
  if (!fd.sector) {
    showToast('⚠️ Sélectionnez un secteur d\'activité (Étape 2)', 'error'); return;
  }
  if (!fd.description) {
    showToast('⚠️ Décrivez votre projet (Étape 2)', 'error'); return;
  }
  if (!fd.problem) {
    showToast('⚠️ Décrivez le besoin identifié (Étape 3)', 'error'); return;
  }
  if (!fd.uniqueValue) {
    showToast('⚠️ Entrez votre proposition de valeur (Étape 3)', 'error'); return;
  }
  if (!fd.city) {
    showToast('⚠️ Sélectionnez une ville (Étape 4)', 'error'); return;
  }
  if (!fd.capital) {
    showToast('⚠️ Entrez le budget d\'investissement (Étape 4)', 'error'); return;
  }
  if (!fd.teamSize) {
    showToast('⚠️ Sélectionnez la taille de l\'équipe (Étape 4)', 'error'); return;
  }

  console.log('🚀 Starting generation with:', {
    entrepreneur: fd.entrepreneurName,
    activity:     fd.entrepreneurActivity,
    project:      fd.projectName,
    sector:       fd.sectorLabel,
    city:         fd.city,
    model:        CONFIG.DEFAULT_MODEL,
    lang:         fd.language
  });

  // Reset agent states
  CONFIG.AGENTS.forEach(a => { App.agentProgress[a.id] = 'pending'; });
  renderAgentStatusCards();

  // Switch view
  setView('generating');
  updateProgressBar(0);
  $('stream-text').textContent = '';

  const titleEl = $('streaming-agent-name');
  if (titleEl) titleEl.textContent = '⏳ Initialisation des agents...';

  // Créer l'orchestrateur
  App.orchestrator = new AgentOrchestrator({
    onProgress:  handleAgentProgress,
    onStream:    handleStream,
    onError:     handleError,
    onComplete:  handleComplete
  });

  try {
    await App.orchestrator.run(App.formData, App.currentLang);
  } catch (err) {
    const msg = err && err.message ? err.message : String(err);
    if (msg !== 'ABORTED') {
      handleError(err);
    }
  }
}

function handleAgentProgress(agentId, status, percent) {
  App.agentProgress[agentId] = status;
  updateProgressBar(percent);
  renderAgentStatusCards();
}

function handleStream(agentId, chunk, fullContent) {
  // Show the last ~600 chars of streaming content
  const preview = fullContent.slice(-600);
  $('stream-text').textContent = preview;

  // Auto-scroll streaming window
  const body = $('streaming-body');
  if (body) body.scrollTop = body.scrollHeight;

  // Update window title to show active agent
  const agent = CONFIG.AGENTS.find(a => a.id === agentId);
  if (agent) {
    const titleEl = $('streaming-agent-name');
    if (titleEl) titleEl.textContent = `${agent.icon} ${agent.name} — en cours...`;
  }
}

function handleError(err) {
  console.error('❌ Generation error:', err);
  setView('empty');

  const errMsg = err && err.message ? err.message : String(err || 'Erreur inconnue');
  console.error('Error message:', errMsg);

  let msg = '❌ Une erreur est survenue';

  if (errMsg.includes('Failed to fetch') || errMsg.includes('NetworkError') || errMsg.includes('network')) {
    msg = '❌ Erreur réseau. Vérifiez votre connexion internet.';
  } else if (errMsg.includes('401')) {
    msg = '❌ Clé API invalide (401). Vérifiez votre clé OpenRouter.';
  } else if (errMsg.includes('403')) {
    msg = '❌ Accès refusé (403). Vérifiez les permissions de votre clé.';
  } else if (errMsg.includes('402')) {
    msg = '❌ Crédit insuffisant (402). Rechargez votre compte OpenRouter.';
  } else if (errMsg.includes('429')) {
    msg = '❌ Limite de requêtes (429). Attendez quelques secondes et réessayez.';
  } else if (errMsg.includes('500') || errMsg.includes('502') || errMsg.includes('503')) {
    msg = '❌ Erreur serveur OpenRouter. Réessayez dans quelques instants.';
  } else if (errMsg.includes('CORS') || errMsg.includes('cors')) {
    msg = '❌ Erreur CORS. Ouvrez le fichier via un serveur local (voir instructions).';
  } else if (errMsg) {
    msg = `❌ Erreur: ${errMsg.substring(0, 120)}`;
  }

  showToast(msg, 'error');
  // Also show in console for debugging
  console.error('User-facing error:', msg);
}

function handleComplete({ finalPlan, metadata }) {
  App.generatedPlan = finalPlan;
  App.generatedMeta = metadata;

  displayBusinessPlan(finalPlan, metadata);
  setView('result');

  // Init the inline editor with the generated markdown
  if (typeof initEditor === 'function') {
    initEditor(finalPlan);
  }

  showToast('✅ Business plan généré ! Vous pouvez l\'éditer avant export.', 'success');
}

function abortGeneration() {
  if (App.orchestrator) {
    App.orchestrator.abort();
    App.orchestrator = null;
  }
  setView('empty');
  showToast('⚠️ Génération annulée', 'info');
}

/* ── VIEW MANAGEMENT ─────────────────────────────────────────────── */
function setView(view) {
  // Hide all views
  ['view-empty', 'view-generating', 'view-result'].forEach(id => {
    const el = $(id);
    if (el) el.style.display = 'none';
  });

  // Show requested view
  const target = $(`view-${view}`);
  if (target) {
    // Use flex for generating and result (they need column layout)
    target.style.display = (view === 'empty') ? 'flex' : 'flex';
    target.style.flexDirection = 'column';
  }
}

/* ── PROGRESS BAR ────────────────────────────────────────────────── */
function updateProgressBar(percent) {
  const fill = $('progress-fill');
  const pct  = $('progress-pct');
  if (fill) fill.style.width = `${percent}%`;
  if (pct)  pct.textContent  = `${Math.round(percent)}%`;
}

/* ── AGENT STATUS CARDS ──────────────────────────────────────────── */
function renderAgentStatusCards() {
  const container = $('agents-status-grid');
  if (!container) return;

  container.innerHTML = '';
  CONFIG.AGENTS.forEach(agent => {
    const status = App.agentProgress[agent.id] || 'pending';
    const card   = createAgentStatusCard(agent, status);
    container.appendChild(card);
  });
}

const AGENT_PHOTOS = {
  market:    'img/agent_market.png',
  business:  'img/agent_business.png',
  financial: 'img/agent_financial.png',
  writer:    'img/agent_writer.png',
  audit:     'img/agent_auditor.png',
  validator: 'img/agent_validator.png'
};

function createAgentStatusCard(agent, status) {
  const div = document.createElement('div');
  div.className = `agent-status-item is-${status}`;
  div.id = `agent-card-${agent.id}`;

  const statusText = {
    pending: App.currentLang === 'ar' ? 'في الانتظار' : 'En attente',
    running: App.currentLang === 'ar' ? 'يعمل الآن...' : 'En cours...',
    done:    App.currentLang === 'ar' ? 'مكتمل' : 'Terminé'
  }[status];

  const photoSrc = AGENT_PHOTOS[agent.id] || '';

  div.innerHTML = `
    <div class="agent-avatar-wrap">
      <img class="agent-avatar"
           src="${photoSrc}"
           alt="${agent.name}"
           onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
      <div class="agent-avatar-fallback" style="display:none;width:56px;height:56px;border-radius:50%;background:rgba(201,168,76,0.1);align-items:center;justify-content:center;font-size:24px;border:2px solid rgba(255,255,255,0.1);">${agent.icon}</div>
      <div class="agent-avatar-ring"></div>
      <div class="agent-done-check">✓</div>
    </div>
    <div class="agent-status-body">
      <div class="agent-status-name">${App.currentLang === 'ar' ? agent.nameAr : agent.name}</div>
      <div class="agent-status-role">${agent.role}</div>
      <div class="agent-status-badge ${status}">
        <div class="status-indicator ${status}"></div>
        ${statusText}
      </div>
    </div>
  `;
  return div;
}

/* ── BUSINESS PLAN DISPLAY ───────────────────────────────────────── */
function renderMarkdown(markdown, container) {
  try {
    if (typeof marked !== 'undefined') {
      if (marked.use) marked.use({ breaks: true, gfm: true });
      else marked.setOptions({ breaks: true, gfm: true });
      container.innerHTML = marked.parse(markdown);
    } else {
      container.innerHTML = basicMarkdown(markdown);
    }
  } catch (e) {
    console.warn('Marked.js error, fallback used:', e);
    container.innerHTML = basicMarkdown(markdown);
  }
}

function displayBusinessPlan(markdown, metadata) {
  const container = $('plan-output');
  if (!container) return;

  renderMarkdown(markdown, container);

  // Update header — show entrepreneur name if available
  const titleEl = $('result-plan-name');
  const metaEl  = $('result-plan-meta');
  const fd      = App.formData;
  const name    = metadata.projectName || 'Business Plan';
  const person  = fd.entrepreneurName ? ` — ${fd.entrepreneurName}` : '';
  if (titleEl) titleEl.textContent = `${name}${person}`;

  const city      = fd.city || '';
  const sectorLbl = metadata.sector || fd.sectorLabel || '';
  const lang      = metadata.language === 'ar' ? 'العربية' : 'Français';
  const model     = metadata.model ? metadata.model.split('/').pop() : '';
  if (metaEl) metaEl.textContent = [sectorLbl, city, lang, model].filter(Boolean).join(' • ');

  // RTL for Arabic
  if (metadata.language === 'ar') {
    const doc = container.closest('.business-plan-doc');
    if (doc) doc.style.direction = 'rtl';
  }
}

function basicMarkdown(text) {
  return text
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^#### (.+)$/gm, '<h4>$1</h4>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    .replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>')
    .replace(/^\|(.+)\|$/gm, '<tr><td>' + '$1'.replace(/\|/g, '</td><td>') + '</td></tr>')
    .replace(/^---+$/gm, '<hr>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/^(?!<[h|u|l|t|h|p|b])/gm, '<p>')
    .replace(/(<p>[^<]+)$/gm, '$1</p>');
}

/* ── PDF EXPORT ──────────────────────────────────────────────────── */
async function exportPDF() {
  if (!App.generatedPlan || !App.generatedMeta) {
    showToast('⚠️ Aucun plan à exporter', 'error');
    return;
  }

  const btn = $('btn-export-pdf');
  const originalText = btn.innerHTML;
  btn.innerHTML = '⏳ Export en cours...';
  btn.disabled = true;

  try {
    // Create a clean white version for PDF
    const pdfContent = createPDFContent(App.generatedPlan, App.generatedMeta);

    // Use html2pdf.js
    if (typeof html2pdf !== 'undefined') {
      const opt = {
        margin:       [15, 15, 15, 15],
        filename:     `BusinessPlan_${App.generatedMeta.projectName.replace(/\s+/g, '_')}.pdf`,
        image:        { type: 'jpeg', quality: 0.95 },
        html2canvas:  { scale: 2, useCORS: true, logging: false },
        jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };
      await html2pdf().set(opt).from(pdfContent).save();
      document.body.removeChild(pdfContent);
      showToast('✅ PDF exporté avec succès !', 'success');
    } else {
      // Fallback: print
      window.print();
      showToast('💡 Utilisez Ctrl+P pour imprimer en PDF', 'info');
    }
  } catch (err) {
    console.error('PDF export error:', err);
    showToast('❌ Erreur lors de l\'export PDF', 'error');
  } finally {
    btn.innerHTML = originalText;
    btn.disabled  = false;
  }
}

function createPDFContent(markdown, metadata) {
  const div = document.createElement('div');
  div.style.cssText = `
    position: fixed;
    left: -9999px;
    top: 0;
    width: 210mm;
    background: white;
    color: #1a1a1a;
    font-family: 'Georgia', serif;
    font-size: 12px;
    line-height: 1.6;
    padding: 20mm;
  `;

  // Render markdown
  let html = '';
  if (typeof marked !== 'undefined') {
    html = marked.parse(markdown);
  } else {
    html = basicMarkdown(markdown);
  }

  // Add PDF styles
  div.innerHTML = `
    <style>
      h1 { font-size: 24px; color: #8B6914; margin-bottom: 4px; }
      h2 { font-size: 16px; color: #8B6914; border-bottom: 1px solid #ddd; padding-bottom: 6px; margin-top: 24px; }
      h3 { font-size: 14px; font-weight: bold; margin-top: 16px; }
      h4 { font-size: 12px; font-weight: bold; color: #555; text-transform: uppercase; letter-spacing: 0.05em; }
      p  { color: #333; margin-bottom: 8px; }
      li { color: #333; margin-bottom: 4px; }
      table { width: 100%; border-collapse: collapse; margin: 12px 0; font-size: 11px; }
      th { background: #FFF8E8; color: #8B6914; padding: 8px; text-align: left; border-bottom: 1px solid #ddd; font-weight: bold; }
      td { padding: 7px 8px; border-bottom: 1px solid #eee; }
      strong { color: #111; }
      blockquote { border-left: 3px solid #C9A84C; padding: 8px 12px; background: #FFFBF0; margin: 8px 0; }
      hr { border: none; border-top: 1px solid #ddd; margin: 20px 0; }
      .pdf-header { margin-bottom: 24px; padding-bottom: 16px; border-bottom: 2px solid #C9A84C; }
      .pdf-header .company { font-size: 10px; color: #888; text-transform: uppercase; letter-spacing: 0.1em; }
      .pdf-meta { font-size: 10px; color: #888; margin-top: 4px; }
    </style>
    <div class="pdf-header">
      <div class="company">🇲🇦 PlanStart.ma</div>
      <div class="pdf-meta">Généré le ${new Date().toLocaleDateString('fr-MA')} • ${metadata.sector} • Confidentiel</div>
    </div>
    ${html}
    <div style="margin-top: 40px; padding-top: 16px; border-top: 1px solid #ddd; font-size: 10px; color: #888; text-align: center;">
      Document généré par PlanStart.ma — Générateur de Business Plans pour Startups Marocaines
    </div>
  `;

  document.body.appendChild(div);
  return div;
}

/* ── HTML EXPORT ─────────────────────────────────────────────────── */
function exportHTML() {
  if (!App.generatedPlan || !App.generatedMeta) {
    showToast('⚠️ Aucun plan à exporter', 'error');
    return;
  }

  let htmlContent = '';
  if (typeof marked !== 'undefined') {
    htmlContent = marked.parse(App.generatedPlan);
  } else {
    htmlContent = basicMarkdown(App.generatedPlan);
  }

  const fullHtml = `<!DOCTYPE html>
<html lang="${App.generatedMeta.language === 'ar' ? 'ar' : 'fr'}" dir="${App.generatedMeta.language === 'ar' ? 'rtl' : 'ltr'}">
<head>
  <meta charset="UTF-8">
  <title>Business Plan - ${App.generatedMeta.projectName}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; max-width: 800px; margin: 40px auto; padding: 0 20px; }
    h1, h2, h3 { color: #8B6914; }
    h1 { border-bottom: 2px solid #8B6914; padding-bottom: 10px; }
    h2 { border-bottom: 1px solid #eee; padding-bottom: 5px; margin-top: 30px; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    th, td { padding: 10px; border: 1px solid #ddd; text-align: left; }
    th { background: #FFF8E8; }
    .footer { margin-top: 50px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #777; text-align: center; }
  </style>
</head>
<body>
  ${htmlContent}
  <div class="footer">
    Document généré le ${new Date().toLocaleDateString('fr-MA')} par PlanStart.ma
  </div>
</body>
</html>`;

  const blob = new Blob([fullHtml], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `BusinessPlan_${App.generatedMeta.projectName.replace(/\s+/g, '_')}.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  showToast('✅ HTML exporté !', 'success');
}

/* ── WORD EXPORT (Simulé avec du HTML renommé en .doc) ───────────── */
function exportWord() {
  if (!App.generatedPlan || !App.generatedMeta) {
    showToast('⚠️ Aucun plan à exporter', 'error');
    return;
  }

  let htmlContent = '';
  if (typeof marked !== 'undefined') {
    htmlContent = marked.parse(App.generatedPlan);
  } else {
    htmlContent = basicMarkdown(App.generatedPlan);
  }

  // Microsoft Word can open HTML files formatted a certain way if saved with .doc extension
  const wordHtml = `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
<head><meta charset='utf-8'><title>Business Plan</title>
<style>
  body { font-family: Calibri, sans-serif; }
  h1 { color: #8B6914; font-size: 24pt; }
  h2 { color: #8B6914; font-size: 16pt; border-bottom: 1px solid #ddd; }
  h3 { color: #333; font-size: 13pt; }
  table { border-collapse: collapse; width: 100%; }
  th, td { border: 1px solid #000; padding: 5px; }
  th { background-color: #f0f0f0; }
</style>
</head><body>
${htmlContent}
</body></html>`;

  const blob = new Blob(['\ufeff', wordHtml], { type: 'application/msword;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `BusinessPlan_${App.generatedMeta.projectName.replace(/\s+/g, '_')}.doc`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  showToast('✅ Word exporté !', 'success');
}

/* ── COPY PLAN ───────────────────────────────────────────────────── */
function copyPlan() {
  if (!App.generatedPlan) return;
  navigator.clipboard.writeText(App.generatedPlan).then(() => {
    showToast('📋 Business plan copié dans le presse-papiers !', 'success');
  }).catch(() => {
    showToast('❌ Impossible de copier', 'error');
  });
}

/* ── RESET ───────────────────────────────────────────────────────── */
function resetToForm() {
  // Reset agent states
  CONFIG.AGENTS.forEach(a => { App.agentProgress[a.id] = 'pending'; });

  // Reset to step 1
  App.currentStep = 1;
  updateStep();
  $$('.form-step').forEach(s => s.classList.remove('active'));
  const step1 = $('step-1');
  if (step1) step1.classList.add('active');
  renderStepPills();

  // Back to form view
  setView('empty');
}



/* ── TOAST NOTIFICATION ──────────────────────────────────────────── */
function showToast(message, type = 'info') {
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<span>${message}</span>`;
  document.body.appendChild(toast);

  setTimeout(() => toast.classList.add('show'), 10);
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 400);
  }, 3500);
}

/* ── SCROLL REVEAL ───────────────────────────────────────────────── */
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.classList.add('visible');
      revealObserver.unobserve(e.target);
    }
  });
}, { threshold: 0.1 });

document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));
