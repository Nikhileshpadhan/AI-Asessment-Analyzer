/* ============================================
   Upload & Analyze — Supabase-Aware
   Handles file upload, section selection,
   AI analysis, and saving to Supabase
   ============================================ */

document.addEventListener('DOMContentLoaded', async () => {
  const user = await requireAuth();
  if (!user) return;

  // --- DOM Elements ---
  const dropZone = document.getElementById('drop-zone');
  const fileInput = document.getElementById('file-input');
  const fileInfo = document.getElementById('file-info');
  const fileName = document.getElementById('file-name');
  const fileSize = document.getElementById('file-size');
  const fileRemove = document.getElementById('file-remove');
  const analyzeBtn = document.getElementById('analyze-btn');
  const loader = document.getElementById('loader-overlay');
  const message = document.getElementById('upload-message');
  const sectionSelect = document.getElementById('section-select');

  // Reference answer elements
  const refToggle = document.getElementById('ref-toggle');
  const refModeToggle = document.getElementById('ref-mode-toggle');
  const refContentArea = document.getElementById('ref-content-area');
  const refFileContainer = document.getElementById('ref-file-container');
  const refTextContainer = document.getElementById('ref-text-container');
  const refDropZone = document.getElementById('ref-drop-zone');
  const refFileInput = document.getElementById('ref-file-input');
  const refFileInfo = document.getElementById('ref-file-info');
  const refFileName = document.getElementById('ref-file-name');
  const refFileRemove = document.getElementById('ref-file-remove');
  const refTextInput = document.getElementById('ref-text-input');

  // Rubric weightage elements
  const rubricToggle = document.getElementById('rubric-toggle');
  const rubricContentArea = document.getElementById('rubric-content-area');
  const rubricTotalBadge = document.getElementById('rubric-total-badge');
  const rubricTotalSpan = document.getElementById('rubric-total');
  const weightInputs = document.querySelectorAll('.weight-input');

  let selectedFile = null;
  let selectedRefFile = null;
  let refMode = 'file';
  let rubricTotal = 100;

  // --- Load Sections into dropdown ---
  async function loadSections() {
    const { data: sections, error } = await sb
      .from('sections')
      .select('id, name')
      .eq('teacher_id', user.id)
      .order('created_at', { ascending: false });

    if (error || !sections || sections.length === 0) {
      sectionSelect.innerHTML = '<option value="">No sections — create one first</option>';
      return;
    }

    sectionSelect.innerHTML = '<option value="">Select a section...</option>' +
      sections.map(s => `<option value="${s.id}">${escapeHTML(s.name)}</option>`).join('');

    // Pre-select from URL param
    const params = new URLSearchParams(window.location.search);
    const preselect = params.get('section');
    if (preselect) sectionSelect.value = preselect;
  }

  await loadSections();

  // --- File Drop Zone ---
  dropZone.addEventListener('click', () => fileInput.click());
  dropZone.addEventListener('dragover', (e) => { e.preventDefault(); dropZone.classList.add('drag-over'); });
  dropZone.addEventListener('dragleave', () => dropZone.classList.remove('drag-over'));
  dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('drag-over');
    if (e.dataTransfer.files.length) handleFile(e.dataTransfer.files[0]);
  });
  fileInput.addEventListener('change', () => { if (fileInput.files.length) handleFile(fileInput.files[0]); });

  function handleFile(file) {
    const validTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!validTypes.includes(file.type) && !file.name.match(/\.(pdf|docx)$/i)) {
      showError('Please upload a PDF or DOCX file.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      showError('File too large. Max size is 5MB.');
      return;
    }
    selectedFile = file;
    fileName.textContent = file.name;
    fileSize.textContent = (file.size / 1024).toFixed(1) + ' KB';
    fileInfo.style.display = 'flex';
    dropZone.style.display = 'none';
    updateAnalyzeBtn();
  }

  fileRemove.addEventListener('click', () => {
    selectedFile = null;
    fileInput.value = '';
    fileInfo.style.display = 'none';
    dropZone.style.display = '';
    updateAnalyzeBtn();
  });

  function updateAnalyzeBtn() {
    const isRubricValid = !rubricToggle.checked || rubricTotal === 100;
    analyzeBtn.disabled = !(selectedFile && sectionSelect.value && isRubricValid);
  }

  sectionSelect.addEventListener('change', updateAnalyzeBtn);

  // --- Rubric Weightage ---
  if (rubricToggle) {
    rubricToggle.addEventListener('change', () => {
      const checked = rubricToggle.checked;
      rubricContentArea.style.display = checked ? 'block' : 'none';
      rubricTotalBadge.style.display = checked ? 'block' : 'none';
      updateAnalyzeBtn();
    });
  }

  function calculateRubricTotal() {
    let total = 0;
    weightInputs.forEach(input => {
      total += parseInt(input.value) || 0;
    });
    rubricTotal = total;
    rubricTotalSpan.textContent = total;

    if (total === 100) {
      rubricTotalBadge.style.background = 'rgba(16, 185, 129, 0.1)';
      rubricTotalBadge.style.color = '#059669';
      rubricTotalBadge.style.borderColor = 'rgba(16, 185, 129, 0.2)';
    } else {
      rubricTotalBadge.style.background = 'rgba(239, 68, 68, 0.1)';
      rubricTotalBadge.style.color = '#dc2626';
      rubricTotalBadge.style.borderColor = 'rgba(239, 68, 68, 0.2)';
    }
    updateAnalyzeBtn();
  }

  weightInputs.forEach(input => {
    input.addEventListener('input', calculateRubricTotal);
  });

  // --- Reference Answer ---
  if (refToggle) {
    refToggle.addEventListener('change', () => {
      const checked = refToggle.checked;
      refModeToggle.style.display = checked ? 'flex' : 'none';
      refContentArea.style.display = checked ? 'block' : 'none';
    });
  }

  document.querySelectorAll('.btn-ref-mode').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.btn-ref-mode').forEach(b => {
        b.classList.remove('active');
        b.style.background = 'transparent';
        b.style.color = 'var(--color-gray-600)';
      });
      btn.classList.add('active');
      btn.style.background = 'var(--color-primary)';
      btn.style.color = 'white';
      refMode = btn.dataset.mode;
      refFileContainer.style.display = refMode === 'file' ? 'block' : 'none';
      refTextContainer.style.display = refMode === 'text' ? 'block' : 'none';
    });
  });

  if (refDropZone) {
    refDropZone.addEventListener('click', () => refFileInput.click());
    refDropZone.addEventListener('dragover', (e) => { e.preventDefault(); refDropZone.classList.add('drag-over'); });
    refDropZone.addEventListener('dragleave', () => refDropZone.classList.remove('drag-over'));
    refDropZone.addEventListener('drop', (e) => {
      e.preventDefault();
      refDropZone.classList.remove('drag-over');
      if (e.dataTransfer.files.length) handleRefFile(e.dataTransfer.files[0]);
    });
    refFileInput.addEventListener('change', () => { if (refFileInput.files.length) handleRefFile(refFileInput.files[0]); });
  }

  function handleRefFile(file) {
    selectedRefFile = file;
    refFileName.textContent = file.name;
    refFileInfo.style.display = 'flex';
    refDropZone.style.display = 'none';
  }

  if (refFileRemove) {
    refFileRemove.addEventListener('click', () => {
      selectedRefFile = null;
      refFileInput.value = '';
      refFileInfo.style.display = 'none';
      refDropZone.style.display = '';
    });
  }

  // --- Analyze ---
  analyzeBtn.addEventListener('click', async () => {
    if (!selectedFile || !sectionSelect.value) return;

    const sectionId = sectionSelect.value;

    loader.classList.add('active');
    analyzeBtn.disabled = true;
    message.className = 'message';
    message.textContent = '';

    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('section_id', sectionId);
    formData.append('teacher_id', user.id);

    if (refToggle && refToggle.checked) {
      if (refMode === 'file' && selectedRefFile) {
        formData.append('reference_file', selectedRefFile);
      } else if (refMode === 'text' && refTextInput && refTextInput.value.trim()) {
        formData.append('reference_text', refTextInput.value.trim());
      }
    }

    if (rubricToggle && rubricToggle.checked) {
      const weights = {
        relevance: document.getElementById('weight-relevance').value,
        understanding: document.getElementById('weight-understanding').value,
        logic: document.getElementById('weight-logic').value,
        structure: document.getElementById('weight-structure').value,
        clarity: document.getElementById('weight-clarity').value
      };
      formData.append('rubric_weights', JSON.stringify(weights));
    }

    try {
      const res = await fetch(`${API_BASE}/api/analyze`, {
        method: 'POST',
        body: formData
      });

      const data = await res.json();
      console.log('✅ AI Analysis response:', data);
      if (!res.ok) throw new Error(data.error || 'Analysis failed');

      // Save to Supabase
      console.log('⏳ Saving to Supabase...');
      const insertPayload = {
        section_id: sectionId,
        teacher_id: user.id,
        student_name: data.name || 'Unknown Student',
        student_id: data.id || '',
        file_name: data.fileName,
        relevance: Math.round(data.relevance || 0),
        understanding: Math.round(data.understanding || 0),
        logic: Math.round(data.logic || 0),
        structure: Math.round(data.structure || 0),
        clarity: Math.round(data.clarity || 0),
        overall_score: Math.round(data.overallScore || 0),
        questions_solved: Math.round(data.questionsSolved || 0),
        per_question_feedback: data.perQuestionFeedback || [],
        feedback: data.feedback || ''
      };
      console.log('📦 Insert payload:', insertPayload);

      const { data: savedAssignment, error: saveError } = await sb
        .from('assignments')
        .insert(insertPayload)
        .select()
        .single();

      console.log('💾 Supabase save result:', { savedAssignment, saveError });

      loader.classList.remove('active');

      if (saveError) {
        console.error('❌ Supabase save error:', saveError);
        showError('Analysis succeeded but failed to save: ' + saveError.message);
        return;
      }

      // Redirect to assignment dashboard
      console.log('🔄 Redirecting to dashboard?id=' + savedAssignment.id);
      window.location.href = `dashboard?id=${savedAssignment.id}`;

    } catch (err) {
      console.error('❌ Upload error:', err);
      loader.classList.remove('active');
      showError(err.message || 'Something went wrong.');
      analyzeBtn.disabled = false;
    }
  });

  // --- Helpers ---
  function showError(msg) {
    message.className = 'message error';
    message.textContent = msg;
  }

  function escapeHTML(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }
});
