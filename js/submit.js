/* ============================================
   Student Submission Logic
   Handles public uploads and AI analysis
   ============================================ */

document.addEventListener('DOMContentLoaded', async () => {
  const params = new URLSearchParams(window.location.search);
  const taskId = params.get('task');

  if (!taskId) {
    document.body.innerHTML = '<div style="display: flex; height: 100vh; align-items: center; justify-content: center; font-family: sans-serif; flex-direction: column;"><h1>Invalid Link</h1><p>This submission link is missing a task ID.</p></div>';
    return;
  }

  // --- DOM Elements ---
  const taskTitleEl = document.getElementById('task-title');
  const taskDescEl = document.getElementById('task-desc');
  const studentNameInput = document.getElementById('student-name');
  const studentIdInput = document.getElementById('student-id');
  const dropZone = document.getElementById('drop-zone');
  const fileInput = document.getElementById('file-input');
  const fileInfo = document.getElementById('file-info');
  const fileNameEl = document.getElementById('file-name');
  const fileSizeEl = document.getElementById('file-size');
  const fileRemoveBtn = document.getElementById('file-remove');
  const submitBtn = document.getElementById('submit-btn');
  const loader = document.getElementById('loader-overlay');
  const messageEl = document.getElementById('submit-message');
  const submissionContent = document.getElementById('submission-content');
  const successContent = document.getElementById('success-content');

  let selectedFile = null;
  let taskData = null;

  // --- 1. Load Task Details ---
  async function loadTaskInfo() {
    const { data: task, error } = await sb
      .from('assignment_tasks')
      .select('*, sections(name)')
      .eq('id', taskId)
      .single();

    if (error || !task) {
      document.body.innerHTML = '<div style="display: flex; height: 100vh; align-items: center; justify-content: center; font-family: sans-serif; flex-direction: column;"><h1>Assignment Not Found</h1><p>This link may be expired or incorrect.</p></div>';
      return;
    }

    taskData = task;
    taskTitleEl.textContent = task.title;
    taskDescEl.textContent = task.description || `Submit your assignment for ${task.sections.name}`;
    document.title = `${task.title} — AnalytixAI`;

    // Update success message too
    const successTitle = document.querySelector('#success-content h2');
    if (successTitle) successTitle.textContent = `Submission Received for ${task.title}!`;
  }

  await loadTaskInfo();

  // --- 2. File Handling ---
  dropZone.addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', (e) => { if (e.target.files.length) handleFile(e.target.files[0]); });

  dropZone.addEventListener('dragover', (e) => { e.preventDefault(); dropZone.classList.add('drag-over'); });
  dropZone.addEventListener('dragleave', () => dropZone.classList.remove('drag-over'));
  dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('drag-over');
    if (e.dataTransfer.files.length) handleFile(e.dataTransfer.files[0]);
  });

  function handleFile(file) {
    const validTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!validTypes.includes(file.type) && !file.name.match(/\.(pdf|docx)$/i)) {
      alert('Please upload a PDF or DOCX file.');
      return;
    }
    selectedFile = file;
    fileNameEl.textContent = file.name;
    fileSizeEl.textContent = (file.size / 1024).toFixed(1) + ' KB';
    fileInfo.style.display = 'flex';
    dropZone.style.display = 'none';
    updateSubmitBtn();
  }

  fileRemoveBtn.addEventListener('click', () => {
    selectedFile = null;
    fileInput.value = '';
    fileInfo.style.display = 'none';
    dropZone.style.display = '';
    updateSubmitBtn();
  });

  function updateSubmitBtn() {
    submitBtn.disabled = !(selectedFile && studentNameInput.value.trim());
  }

  studentNameInput.addEventListener('input', updateSubmitBtn);

  // --- 3. Submission ---
  submitBtn.addEventListener('click', async () => {
    if (!selectedFile || !studentNameInput.value.trim() || !taskData) return;

    loader.classList.add('active');
    submitBtn.disabled = true;

    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('section_id', taskData.section_id);
    formData.append('teacher_id', taskData.teacher_id);
    formData.append('student_name', studentNameInput.value.trim());
    formData.append('student_id', studentIdInput.value.trim());
    
    // Pass reference materials and rubric if available
    if (taskData.reference_text) formData.append('reference_text', taskData.reference_text);
    if (taskData.rubric_weights) formData.append('rubric_weights', JSON.stringify(taskData.rubric_weights));

    try {
      // Analyze via backend
      const res = await fetch(`${API_BASE}/api/analyze`, {
        method: 'POST',
        body: formData
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Analysis failed');

      // Save to Supabase (RLS allows public insert)
      const insertPayload = {
        section_id: taskData.section_id,
        teacher_id: taskData.teacher_id,
        task_id: taskData.id,
        assignment_title: taskData.title,
        student_name: studentNameInput.value.trim(),
        student_id: studentIdInput.value.trim() || data.id || '',
        file_name: data.fileName,
        relevance: data.relevance,
        understanding: data.understanding,
        logic: data.logic,
        structure: data.structure,
        clarity: data.clarity,
        overall_score: data.overallScore,
        questions_solved: data.questionsSolved,
        per_question_feedback: data.perQuestionFeedback || [],
        feedback: data.feedback || ''
      };

      const { error: saveError } = await sb
        .from('assignments')
        .insert(insertPayload);

      if (saveError) throw new Error('Failed to save submission: ' + saveError.message);

      loader.classList.remove('active');
      submissionContent.style.display = 'none';
      successContent.style.display = 'block';

    } catch (err) {
      console.error('Submission error:', err);
      loader.classList.remove('active');
      alert(err.message || 'Something went wrong during analysis.');
      submitBtn.disabled = false;
    }
  });

});
