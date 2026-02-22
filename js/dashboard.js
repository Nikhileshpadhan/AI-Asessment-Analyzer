/* ============================================
   Dashboard — Load Individual Assignment from Supabase
   ============================================ */

document.addEventListener('DOMContentLoaded', async () => {
  const user = await requireAuth();
  if (!user) return;

  const params = new URLSearchParams(window.location.search);
  const assignmentId = params.get('id');

  const noData = document.getElementById('no-data');
  const content = document.getElementById('dashboard-content');

  if (!assignmentId) {
    console.warn('No assignment ID in URL');
    noData.style.display = 'block';
    content.style.display = 'none';
    return;
  }

  // Fetch assignment from Supabase
  const { data, error } = await sb
    .from('assignments')
    .select('*, sections(name)')
    .eq('id', assignmentId)
    .single();

  console.log('Dashboard fetch:', { data, error });

  if (error || !data) {
    console.error('Dashboard fetch failed:', error);
    noData.style.display = 'block';
    content.style.display = 'none';
    return;
  }

  noData.style.display = 'none';
  content.style.display = 'block';

  // Populate header
  document.getElementById('dash-student').textContent = data.student_name || 'Unknown Student';
  document.getElementById('dash-file').textContent = data.file_name;
  document.getElementById('dash-date').textContent = new Date(data.analyzed_at).toLocaleDateString();

  // Populate summary cards by ID (not index)
  document.getElementById('card-relevance').textContent = data.relevance + '%';
  document.getElementById('card-understanding').textContent = data.understanding + '%';
  document.getElementById('card-overall').textContent = data.overall_score + '%';
  document.getElementById('card-clarity').textContent = data.clarity + '%';

  const questionsEl = document.getElementById('card-questions');
  if (questionsEl) questionsEl.textContent = data.questions_solved || '0';

  // Radar Chart
  const radarCtx = document.getElementById('radar-chart');
  if (radarCtx) {
    new Chart(radarCtx, {
      type: 'radar',
      data: {
        labels: ['Relevance', 'Understanding', 'Logic', 'Structure', 'Clarity'],
        datasets: [{
          label: 'Student',
          data: [data.relevance, data.understanding, data.logic, data.structure, data.clarity],
          backgroundColor: 'rgba(99, 102, 241, 0.15)',
          borderColor: '#6366f1',
          borderWidth: 3.5,
          pointBackgroundColor: '#6366f1',
          pointRadius: 4
        }]
      },
      options: {
        scales: { 
          r: { 
            min: 0, 
            max: 100, 
            ticks: { stepSize: 20, display: false },
            grid: { color: 'rgba(0, 0, 0, 0.15)', lineWidth: 1.5 },
            angleLines: { color: 'rgba(0, 0, 0, 0.15)', lineWidth: 1.5 },
            pointLabels: { font: { weight: '600', size: 11 } }
          } 
        },
        plugins: { legend: { display: false } }
      }
    });
  }

  // Bar Chart
  const barCtx = document.getElementById('bar-chart');
  if (barCtx) {
    new Chart(barCtx, {
      type: 'bar',
      data: {
        labels: ['Relevance', 'Understanding', 'Logic', 'Structure', 'Clarity'],
        datasets: [{
          data: [data.relevance, data.understanding, data.logic, data.structure, data.clarity],
          backgroundColor: ['#6366f1', '#0ea5e9', '#10b981', '#f59e0b', '#8b5cf6'],
          borderRadius: 8
        }]
      },
      options: {
        scales: { 
          y: { 
            beginAtZero: true, 
            ticks: { stepSize: 1 },
            grid: { color: 'rgba(0, 0, 0, 0.1)', lineWidth: 1.2 }
          },
          x: {
            grid: { display: false }
          }
        },
        plugins: { legend: { display: false } }
      }
    });
  }

  // Per-Question Feedback
  const perQuestionContainer = document.getElementById('per-question-container');
  const perQuestionList = document.getElementById('per-question-list');
  const pqFeedback = data.per_question_feedback;

  if (perQuestionContainer && perQuestionList && pqFeedback && pqFeedback.length > 0) {
    perQuestionContainer.style.display = 'block';
    perQuestionList.innerHTML = '';
    pqFeedback.forEach((feedback, idx) => {
      const item = document.createElement('div');
      item.style.cssText = 'background:var(--color-gray-50); padding:12px 16px; border-radius:var(--radius-sm); border-left:4px solid var(--dashboard-1); font-size:0.88rem; color:var(--color-gray-700);';
      // Handle both string and object feedback
      item.textContent = typeof feedback === 'string' ? feedback : (feedback.feedback || feedback.comment || JSON.stringify(feedback));
      perQuestionList.appendChild(item);
    });
  }

  // Overall Feedback
  const feedbackEl = document.getElementById('dash-feedback');
  if (feedbackEl && data.feedback) feedbackEl.textContent = data.feedback;

  // Update action links to go back to section
  if (data.section_id) {
    const actionsDiv = document.querySelector('#dashboard-content .reveal:last-child');
    if (actionsDiv) {
      actionsDiv.innerHTML = `
        <a href="section-dashboard?id=${data.section_id}" class="btn btn-secondary">← Back to Section</a>
        <a href="start?section=${data.section_id}" class="btn btn-primary">New Analysis</a>
      `;
    }
  }
});
