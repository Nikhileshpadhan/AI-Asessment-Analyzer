/* ============================================
   Assignments & Tasks Management
   Handles creating assignment tasks and viewing submissions
   ============================================ */

document.addEventListener('DOMContentLoaded', async () => {
  const user = await requireAuth();
  if (!user) return;

  const params = new URLSearchParams(window.location.search);
  const sectionId = params.get('section_id');

  if (!sectionId) {
    window.location.href = 'sections';
    return;
  }

  // --- DOM Elements ---
  const grid = document.getElementById('assignments-grid');
  const emptyState = document.getElementById('assignments-empty');
  const sectionHeader = document.getElementById('section-name-header');
  const sectionDesc = document.getElementById('section-desc-header');
  const startBtnLink = document.getElementById('start-btn-link');

  // Modal Elements
  const taskModal = document.getElementById('task-modal');
  const createTaskBtn = document.getElementById('create-task-btn');
  const cancelTaskBtn = document.getElementById('cancel-task-modal');
  const saveTaskBtn = document.getElementById('save-task-btn');
  const taskTitleInput = document.getElementById('task-title');
  const taskDescInput = document.getElementById('task-desc');

  // Rubric Elements
  const rubricToggle = document.getElementById('rubric-toggle');
  const rubricContentArea = document.getElementById('rubric-content-area');
  const rubricTotalBadge = document.getElementById('rubric-total-badge');
  const rubricTotalSpan = document.getElementById('rubric-total');
  const weightInputs = document.querySelectorAll('.weight-input');

  // Reference Elements
  const refToggle = document.getElementById('ref-toggle');
  const refContentArea = document.getElementById('ref-content-area');
  const refModeToggle = document.getElementById('ref-mode-toggle');
  const refTextContainer = document.getElementById('ref-text-container');
  const refFileContainer = document.getElementById('ref-file-container');
  const refTextInput = document.getElementById('ref-text-input');
  const refDropZone = document.getElementById('ref-drop-zone');
  const refFileInput = document.getElementById('ref-file-input');
  const refFileNameEl = document.getElementById('ref-file-name');
  const refFileInfo = document.getElementById('ref-file-info');
  const refFileRemove = document.getElementById('ref-file-remove');

  let selectedRefFile = null;
  let refMode = 'text';
  let rubricTotal = 100;

  const shareModal = document.getElementById('share-modal');
  const shareLinkInput = document.getElementById('share-link-input');
  const copyLinkBtn = document.getElementById('copy-link-btn');

  if (startBtnLink) startBtnLink.href = `start?section=${sectionId}${params.get('task_id') ? `&task=${params.get('task_id')}` : ''}`;

  // --- Load Section Details ---
  async function loadSectionInfo() {
    const { data: section } = await sb
      .from('sections')
      .select('*')
      .eq('id', sectionId)
      .single();

    if (section) {
      sectionHeader.textContent = section.name;
      sectionDesc.textContent = section.description || 'Manage assignments for this section';
    }
  }

  // --- Load Tasks & Submissions ---
  async function loadTasks() {
    // 1. Fetch all tasks for this section
    const { data: tasks, error: taskError } = await sb
      .from('assignment_tasks')
      .select('*')
      .eq('section_id', sectionId)
      .order('created_at', { ascending: false });

    // 2. Fetch submission counts per task
    const { data: counts, error: countError } = await sb
      .from('assignments')
      .select('task_id')
      .eq('section_id', sectionId);

    if (taskError) {
      console.error('Error loading tasks:', taskError);
      return;
    }

    if (!tasks || tasks.length === 0) {
      grid.innerHTML = '';
      emptyState.style.display = 'block';
      return;
    }

    emptyState.style.display = 'none';

    // Map counts
    const taskCounts = {};
    if (counts) {
      counts.forEach(c => {
        if (c.task_id) taskCounts[c.task_id] = (taskCounts[c.task_id] || 0) + 1;
      });
    }

    grid.innerHTML = tasks.map((task, index) => {
      const count = taskCounts[task.id] || 0;
      const delayClass = `reveal-delay-${Math.min(index + 1, 10)}`;

      return `
        <div class="glass-card section-card reveal-up ${delayClass}" data-id="${task.id}" data-title="${escapeHTML(task.title)}">
          <div class="section-name">${escapeHTML(task.title)}</div>
          <div class="section-desc">${escapeHTML(task.description || 'No description provided.')}</div>
          <div class="section-stats">
            <div class="stat-item">
              <span class="stat-value">${count}</span>
              <span class="stat-label">Submissions</span>
            </div>
            <div class="stat-item" style="cursor: pointer;" onclick="event.stopPropagation(); window.shareTask('${task.id}', '${escapeHTML(task.title).replace(/'/g, "\\'")}')">
              <span class="stat-value" style="color: var(--color-primary);">🔗</span>
              <span class="stat-label">Share Link</span>
            </div>
            <div class="stat-item" style="cursor: pointer;" onclick="event.stopPropagation(); window.location.href='start?section=${sectionId}&task=${task.id}'">
              <span class="stat-value" style="color: #10b981;">📤</span>
              <span class="stat-label">Manual Add</span>
            </div>
          </div>
          <div class="section-top-student" style="margin-top: 16px; display: flex; justify-content: space-between; align-items: center;">
             <span>View Student Results</span>
             <span style="font-size: 1.2rem;">→</span>
          </div>
        </div>
      `;
    }).join('');

    // Trigger animations
    window.dispatchEvent(new Event('contentUpdated'));

    // Click handlers for cards
    grid.querySelectorAll('.section-card').forEach(card => {
      card.addEventListener('click', () => {
        const taskId = card.dataset.id;
        const taskTitle = card.dataset.title;
        window.location.href = `section-dashboard?id=${sectionId}&task_id=${taskId}&assign=${encodeURIComponent(taskTitle)}`;
      });
    });
  }

  // --- Rubric Logic ---
  if (rubricToggle) {
    rubricToggle.addEventListener('change', () => {
      rubricContentArea.style.display = rubricToggle.checked ? 'block' : 'none';
      rubricTotalBadge.style.display = rubricToggle.checked ? 'block' : 'none';
    });
  }

  function calculateRubricTotal() {
    let total = 0;
    weightInputs.forEach(input => {
      total += parseInt(input.value) || 0;
    });
    rubricTotal = total;
    rubricTotalSpan.textContent = total;
    rubricTotalBadge.style.color = total === 100 ? '#059669' : '#dc2626';
    rubricTotalBadge.style.borderColor = total === 100 ? '#10b981' : '#ef4444';
  }

  weightInputs.forEach(input => input.addEventListener('input', calculateRubricTotal));

  // --- Reference Logic ---
  if (refToggle) {
    refToggle.addEventListener('change', () => {
      refContentArea.style.display = refToggle.checked ? 'block' : 'none';
      refModeToggle.style.display = refToggle.checked ? 'flex' : 'none';
    });
  }

  document.querySelectorAll('.btn-ref-mode').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.btn-ref-mode').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      refMode = btn.dataset.mode;
      refTextContainer.style.display = refMode === 'text' ? 'block' : 'none';
      refFileContainer.style.display = refMode === 'file' ? 'block' : 'none';
    });
  });

  if (refDropZone) {
    refDropZone.addEventListener('click', () => refFileInput.click());
    refFileInput.addEventListener('change', (e) => {
      if (e.target.files.length) {
        selectedRefFile = e.target.files[0];
        refFileNameEl.textContent = selectedRefFile.name;
        refFileInfo.style.display = 'flex';
        refDropZone.style.display = 'none';
      }
    });
  }

  if (refFileRemove) {
    refFileRemove.addEventListener('click', () => {
      selectedRefFile = null;
      refFileInput.value = '';
      refFileInfo.style.display = 'none';
      refDropZone.style.display = 'block';
    });
  }

  // --- Task Creation ---
  if (createTaskBtn) {
    createTaskBtn.addEventListener('click', () => taskModal.classList.add('active'));
  }

  if (cancelTaskBtn) {
    cancelTaskBtn.addEventListener('click', () => taskModal.classList.remove('active'));
  }

  if (saveTaskBtn) {
    saveTaskBtn.addEventListener('click', async () => {
      const title = taskTitleInput.value.trim();
      const desc = taskDescInput.value.trim();

      if (!title) {
        alert('Please enter an assignment title.');
        return;
      }

      if (rubricToggle.checked && rubricTotal !== 100) {
        alert('Rubric weights must sum to exactly 100%');
        return;
      }

      saveTaskBtn.disabled = true;
      saveTaskBtn.textContent = 'Saving...';

      let referenceText = '';
      if (refToggle.checked) {
        if (refMode === 'text') {
          referenceText = refTextInput.value.trim();
        } else if (selectedRefFile) {
          // Extract text from file
          saveTaskBtn.textContent = 'Extracting text...';
          const formData = new FormData();
          formData.append('file', selectedRefFile);
          try {
            const res = await fetch(`${API_BASE}/api/extract-text`, {
              method: 'POST',
              body: formData
            });
            const data = await res.json();
            if (res.ok) {
              referenceText = data.text;
            } else {
              alert('Text extraction failed: ' + data.error);
              saveTaskBtn.disabled = false;
              saveTaskBtn.textContent = 'Create Task';
              return;
            }
          } catch (e) {
            alert('Error extracting text: ' + e.message);
            saveTaskBtn.disabled = false;
            saveTaskBtn.textContent = 'Create Task';
            return;
          }
        }
      }

      const weights = rubricToggle.checked ? {
        relevance: parseInt(document.getElementById('weight-relevance').value),
        understanding: parseInt(document.getElementById('weight-understanding').value),
        logic: parseInt(document.getElementById('weight-logic').value),
        structure: parseInt(document.getElementById('weight-structure').value),
        clarity: parseInt(document.getElementById('weight-clarity').value),
      } : null;

      const { data, error } = await sb
        .from('assignment_tasks')
        .insert({
          section_id: sectionId,
          teacher_id: user.id,
          title: title,
          description: desc,
          reference_text: referenceText,
          rubric_weights: weights
        })
        .select()
        .single();

      if (error) {
        alert('Error creating task: ' + error.message);
        saveTaskBtn.disabled = false;
        saveTaskBtn.textContent = 'Create Task';
        return;
      }

      taskModal.classList.remove('active');
      // Reset form
      taskTitleInput.value = '';
      taskDescInput.value = '';
      rubricToggle.checked = false;
      rubricContentArea.style.display = 'none';
      refToggle.checked = false;
      refContentArea.style.display = 'none';
      refTextInput.value = '';
      selectedRefFile = null;
      refFileInfo.style.display = 'none';
      refDropZone.style.display = 'block';

      saveTaskBtn.disabled = false;
      saveTaskBtn.textContent = 'Create Task';
      
      loadTasks();
    });
  }

  // --- Link Sharing ---
  window.shareTask = (taskId, title) => {
    const baseUrl = window.location.origin + window.location.pathname.replace('assignments', 'submit');
    const fullLink = `${baseUrl}?task=${taskId}`;
    
    // Update modal title to be specific
    const modalTitle = shareModal.querySelector('h2');
    if (modalTitle) modalTitle.textContent = `Share link for "${title}"`;
    
    shareLinkInput.value = fullLink;
    shareModal.classList.add('active');
  };

  if (copyLinkBtn) {
    copyLinkBtn.addEventListener('click', () => {
      shareLinkInput.select();
      document.execCommand('copy');
      const originalText = copyLinkBtn.textContent;
      copyLinkBtn.textContent = 'Copied!';
      copyLinkBtn.style.background = '#059669';
      setTimeout(() => {
        copyLinkBtn.textContent = originalText;
        copyLinkBtn.style.background = '';
      }, 2000);
    });
  }

  // --- Helpers ---
  function escapeHTML(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  // Init
  loadSectionInfo();
  loadTasks();
});
