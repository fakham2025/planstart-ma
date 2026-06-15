/* ================================================================
   EDITOR.JS — PlanStart.ma Inline Business Plan Editor
   Modes: Preview | Edit | Split
   ================================================================ */

const Editor = {
  mode:          'preview',   // 'preview' | 'edit' | 'split'
  hasUnsaved:    false,
  originalMd:    '',          // snapshot before any user edits
  currentMd:     '',          // live markdown
  splitResizing: false,
  livePreviewTimer: null
};

/* ── Init editor (called after plan is displayed) ──────────────── */
function initEditor(markdown) {
  Editor.originalMd = markdown;
  Editor.currentMd  = markdown;
  Editor.hasUnsaved = false;

  // Populate word count
  updateWordCount(markdown);

  // Wire mode toggle buttons
  $('btn-mode-preview').addEventListener('click', () => setEditorMode('preview'));
  $('btn-mode-edit').addEventListener('click',    () => setEditorMode('edit'));
  $('btn-mode-split').addEventListener('click',   () => setEditorMode('split'));

  // Toolbar actions
  $$('.editor-tool-btn[data-action]').forEach(btn => {
    btn.addEventListener('click', () => {
      const action = btn.dataset.action;
      if (action === 'save')  saveEdits();
      else if (action === 'reset') resetEdits();
      else applyFormat(action);
    });
  });

  // Keyboard shortcuts in editor textarea
  const editTa  = $('plan-editor-textarea');
  const splitTa = $('plan-split-textarea');

  [editTa, splitTa].forEach(ta => {
    if (!ta) return;
    ta.addEventListener('input',   onEditorInput);
    ta.addEventListener('keydown', onEditorKeydown);
  });

  // Unsaved banner buttons
  $('btn-banner-save').addEventListener('click',    saveEdits);
  $('btn-banner-discard').addEventListener('click', discardEdits);

  // Reset editor mode to preview on new plan
  setEditorMode('preview');

  // Split divider drag
  initSplitDivider();
}

/* ── Mode switching ────────────────────────────────────────────── */
function setEditorMode(mode) {
  Editor.mode = mode;

  // Toggle button active state
  $$('.edit-toggle-btn').forEach(btn => btn.classList.remove('active'));
  $(`btn-mode-${mode}`).classList.add('active');

  // Show/hide panels
  const previewPanel = $('panel-preview');
  const editorPanel  = $('panel-editor');
  const splitPanel   = $('panel-split');
  const toolbar      = $('editor-toolbar');

  previewPanel.style.display = 'none';
  editorPanel.style.display  = 'none';
  splitPanel.style.display   = 'none';
  toolbar.style.display      = 'none';

  if (mode === 'preview') {
    previewPanel.style.display = 'flex';
    previewPanel.style.flex    = '1';
  } else if (mode === 'edit') {
    editorPanel.style.display  = 'flex';
    toolbar.style.display      = 'flex';
    // Populate textarea
    const ta = $('plan-editor-textarea');
    if (ta && ta.value !== Editor.currentMd) {
      ta.value = Editor.currentMd;
    }
    updateWordCount(Editor.currentMd);
  } else if (mode === 'split') {
    splitPanel.style.display = 'flex';
    splitPanel.style.flex    = '1';
    toolbar.style.display    = 'flex';
    // Populate split textarea + preview
    const ta = $('plan-split-textarea');
    if (ta && ta.value !== Editor.currentMd) {
      ta.value = Editor.currentMd;
    }
    renderSplitPreview(Editor.currentMd);
    updateWordCount(Editor.currentMd);
  }
}

/* ── Textarea input handler ────────────────────────────────────── */
function onEditorInput(e) {
  const newMd = e.target.value;
  Editor.currentMd = newMd;

  // Sync the sibling textarea if in split mode
  if (Editor.mode === 'split') {
    // Debounced live preview
    clearTimeout(Editor.livePreviewTimer);
    Editor.livePreviewTimer = setTimeout(() => {
      renderSplitPreview(newMd);
    }, 250);
  }

  // Mark unsaved (only if changed from last saved)
  if (newMd !== Editor.originalMd && !Editor.hasUnsaved) {
    Editor.hasUnsaved = true;
    showUnsavedBanner(true);
  } else if (newMd === Editor.originalMd && Editor.hasUnsaved) {
    Editor.hasUnsaved = false;
    showUnsavedBanner(false);
  }

  updateWordCount(newMd);
}

/* ── Keyboard shortcuts ─────────────────────────────────────────── */
function onEditorKeydown(e) {
  const isMac  = navigator.platform.indexOf('Mac') >= 0;
  const ctrl   = isMac ? e.metaKey : e.ctrlKey;

  if (ctrl && e.key === 'b') { e.preventDefault(); applyFormat('bold'); }
  if (ctrl && e.key === 'i') { e.preventDefault(); applyFormat('italic'); }
  if (ctrl && e.key === 's') { e.preventDefault(); saveEdits(); }
  if (ctrl && e.key === 'z' && e.shiftKey) { e.preventDefault(); resetEdits(); }

  // Tab → insert 2 spaces (nice for Markdown tables)
  if (e.key === 'Tab') {
    e.preventDefault();
    const ta    = e.target;
    const start = ta.selectionStart;
    const end   = ta.selectionEnd;
    ta.value    = ta.value.substring(0, start) + '  ' + ta.value.substring(end);
    ta.selectionStart = ta.selectionEnd = start + 2;
    ta.dispatchEvent(new Event('input'));
  }
}

/* ── Format action: wraps selected text ─────────────────────────── */
function applyFormat(action) {
  // Get active textarea
  const ta = Editor.mode === 'split'
    ? $('plan-split-textarea')
    : $('plan-editor-textarea');
  if (!ta) return;
  ta.focus();

  const start = ta.selectionStart;
  const end   = ta.selectionEnd;
  const sel   = ta.value.substring(start, end);
  const before = ta.value.substring(0, start);
  const after  = ta.value.substring(end);

  let insert  = '';
  let cursorOffset = 0;

  switch(action) {
    case 'bold':
      insert = `**${sel || 'texte en gras'}**`;
      cursorOffset = sel ? insert.length : 2;
      break;
    case 'italic':
      insert = `*${sel || 'texte en italique'}*`;
      cursorOffset = sel ? insert.length : 1;
      break;
    case 'strike':
      insert = `~~${sel || 'texte barré'}~~`;
      cursorOffset = sel ? insert.length : 2;
      break;
    case 'h1':
      insert = `\n# ${sel || 'Titre principal'}\n`;
      cursorOffset = insert.length;
      break;
    case 'h2':
      insert = `\n## ${sel || 'Section'}\n`;
      cursorOffset = insert.length;
      break;
    case 'h3':
      insert = `\n### ${sel || 'Sous-section'}\n`;
      cursorOffset = insert.length;
      break;
    case 'ul':
      insert = sel
        ? sel.split('\n').map(l => `- ${l}`).join('\n')
        : `\n- Élément 1\n- Élément 2\n- Élément 3\n`;
      cursorOffset = insert.length;
      break;
    case 'ol':
      insert = sel
        ? sel.split('\n').map((l, i) => `${i+1}. ${l}`).join('\n')
        : `\n1. Premier point\n2. Deuxième point\n3. Troisième point\n`;
      cursorOffset = insert.length;
      break;
    case 'table':
      insert = `\n| Colonne 1 | Colonne 2 | Colonne 3 |\n|-----------|-----------|----------|\n| Valeur A  | Valeur B  | Valeur C  |\n| Valeur D  | Valeur E  | Valeur F  |\n`;
      cursorOffset = insert.length;
      break;
    case 'hr':
      insert = `\n---\n`;
      cursorOffset = insert.length;
      break;
    default:
      return;
  }

  ta.value = before + insert + after;
  ta.selectionStart = start + cursorOffset;
  ta.selectionEnd   = start + cursorOffset;
  ta.dispatchEvent(new Event('input'));
}

/* ── Save edits → update the rendered plan ─────────────────────── */
function saveEdits() {
  const ta = Editor.mode === 'split'
    ? $('plan-split-textarea')
    : $('plan-editor-textarea');

  const newMd = ta ? ta.value : Editor.currentMd;
  Editor.currentMd = newMd;
  App.generatedPlan = newMd;   // update source of truth for PDF export

  // Re-render the preview panel
  renderMarkdownToPreview(newMd);

  // Sync both textareas
  const editTa  = $('plan-editor-textarea');
  const splitTa = $('plan-split-textarea');
  if (editTa)  editTa.value  = newMd;
  if (splitTa) splitTa.value = newMd;

  Editor.hasUnsaved = false;
  showUnsavedBanner(false);

  showToast('✓ Modifications sauvegardées', 'success');
}

/* ── Discard edits ──────────────────────────────────────────────── */
function discardEdits() {
  if (!confirm('Ignorer toutes vos modifications ?')) return;
  resetEdits();
}

function resetEdits() {
  Editor.currentMd  = Editor.originalMd;
  App.generatedPlan = Editor.originalMd;

  const editTa  = $('plan-editor-textarea');
  const splitTa = $('plan-split-textarea');
  if (editTa)  editTa.value  = Editor.originalMd;
  if (splitTa) splitTa.value = Editor.originalMd;

  renderMarkdownToPreview(Editor.originalMd);
  renderSplitPreview(Editor.originalMd);

  Editor.hasUnsaved = false;
  showUnsavedBanner(false);
  updateWordCount(Editor.originalMd);

  showToast('↺ Version originale restaurée', 'info');
}

/* ── Render helpers ─────────────────────────────────────────────── */
function renderMarkdownToPreview(md) {
  const container = $('plan-output');
  if (!container) return;
  try {
    if (typeof marked !== 'undefined') {
      if (marked.use) marked.use({ breaks: true, gfm: true });
      container.innerHTML = marked.parse(md);
    } else {
      container.innerHTML = basicMarkdown(md);
    }
  } catch(e) {
    container.innerHTML = basicMarkdown(md);
  }
}

function renderSplitPreview(md) {
  const container = $('split-preview-output');
  if (!container) return;
  try {
    if (typeof marked !== 'undefined') {
      if (marked.use) marked.use({ breaks: true, gfm: true });
      container.innerHTML = marked.parse(md);
    } else {
      container.innerHTML = basicMarkdown(md);
    }
  } catch(e) {
    container.innerHTML = basicMarkdown(md);
  }
}

/* ── Word count ─────────────────────────────────────────────────── */
function updateWordCount(md) {
  const el = $('editor-wordcount');
  if (!el) return;
  const words = md.trim().split(/\s+/).filter(Boolean).length;
  el.textContent = `${words.toLocaleString('fr-FR')} mots`;
}

/* ── Unsaved banner ─────────────────────────────────────────────── */
function showUnsavedBanner(show) {
  const banner = $('unsaved-banner');
  if (!banner) return;
  if (show) {
    banner.style.display = 'flex';
  } else {
    banner.style.display = 'none';
  }
}

/* ── Split pane drag-to-resize ──────────────────────────────────── */
function initSplitDivider() {
  const divider     = $('split-divider');
  const splitWrapper = $('panel-split');
  if (!divider || !splitWrapper) return;

  let startX, startLeftWidth;

  divider.addEventListener('mousedown', e => {
    e.preventDefault();
    Editor.splitResizing = true;
    divider.classList.add('dragging');
    startX         = e.clientX;
    const editorPane = splitWrapper.querySelector('.split-editor-pane');
    startLeftWidth = editorPane.getBoundingClientRect().width;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  });

  document.addEventListener('mousemove', e => {
    if (!Editor.splitResizing) return;
    const dx        = e.clientX - startX;
    const newWidth  = Math.max(200, Math.min(startLeftWidth + dx, splitWrapper.clientWidth - 200));
    const pct       = (newWidth / splitWrapper.clientWidth) * 100;
    const editorPane  = splitWrapper.querySelector('.split-editor-pane');
    const previewPane = splitWrapper.querySelector('.split-preview-pane');
    editorPane.style.flex  = `0 0 ${pct}%`;
    previewPane.style.flex = `0 0 ${100 - pct}%`;
  });

  document.addEventListener('mouseup', () => {
    if (!Editor.splitResizing) return;
    Editor.splitResizing = false;
    divider.classList.remove('dragging');
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
  });
}
