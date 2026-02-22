/* ============================================
   Section Dashboard — Averaged Metrics + AI Insights
   ============================================ */

document.addEventListener('DOMContentLoaded', async () => {
  const user = await requireAuth();
  if (!user) return;

  const params = new URLSearchParams(window.location.search);
  const sectionId = params.get('id');
  const assignmentTitle = params.get('assign');
  const taskId = params.get('task_id');

  if (!sectionId) {
    window.location.href = 'sections';
    return;
  }

  // Fetch section info
  const { data: section } = await sb
    .from('sections')
    .select('*')
    .eq('id', sectionId)
    .single();

  if (!section) {
    window.location.href = 'sections';
    return;
  }

  document.getElementById('section-title').textContent = section.name;
  document.getElementById('section-subtitle').textContent =
    assignmentTitle ? `Assignment: ${assignmentTitle}` : (section.description || 'Performance overview');

  // Fetch assignments
  let query = sb
    .from('assignments')
    .select('*')
    .eq('section_id', sectionId);

  if (taskId) {
    query = query.eq('task_id', taskId);
  } else if (assignmentTitle) {
    query = query.eq('assignment_title', assignmentTitle);
  }

  const { data: assignments } = await query.order('analyzed_at', { ascending: false });

  if (!assignments || assignments.length === 0) {
    document.getElementById('no-data').style.display = 'block';
    document.getElementById('dashboard-content').style.display = 'none';
    return;
  }

  document.getElementById('no-data').style.display = 'none';
  document.getElementById('dashboard-content').style.display = 'block';

  // --- Calculate averages ---
  const count = assignments.length;
  const avg = (field) => Math.round(assignments.reduce((s, a) => s + (a[field] || 0), 0) / count);

  const avgRelevance = avg('relevance');
  const avgUnderstanding = avg('understanding');
  const avgLogic = avg('logic');
  const avgStructure = avg('structure');
  const avgClarity = avg('clarity');
  const avgOverall = avg('overall_score');

  document.getElementById('avg-relevance').textContent = avgRelevance + '%';
  document.getElementById('avg-understanding').textContent = avgUnderstanding + '%';
  document.getElementById('avg-overall').textContent = avgOverall + '%';
  document.getElementById('total-assignments').textContent = count;

  // --- Radar Chart ---
  const radarCtx = document.getElementById('radar-chart');
  if (radarCtx) {
    new Chart(radarCtx, {
      type: 'radar',
      data: {
        labels: ['Relevance', 'Understanding', 'Logic', 'Structure', 'Clarity'],
        datasets: [{
          label: 'Section Average',
          data: [avgRelevance, avgUnderstanding, avgLogic, avgStructure, avgClarity],
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

  // --- Bar Chart (score distribution) ---
  const barCtx = document.getElementById('bar-chart');
  if (barCtx) {
    // Group scores into ranges
    const ranges = { '0-20': 0, '21-40': 0, '41-60': 0, '61-80': 0, '81-100': 0 };
    assignments.forEach(a => {
      const s = a.overall_score || 0;
      if (s <= 20) ranges['0-20']++;
      else if (s <= 40) ranges['21-40']++;
      else if (s <= 60) ranges['41-60']++;
      else if (s <= 80) ranges['61-80']++;
      else ranges['81-100']++;
    });

    new Chart(barCtx, {
      type: 'bar',
      data: {
        labels: Object.keys(ranges),
        datasets: [{
          label: 'Students',
          data: Object.values(ranges),
          backgroundColor: ['#ef4444', '#f59e0b', '#eab308', '#10b981', '#6366f1'],
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

  // --- Assignments Table ---
  const tbody = document.getElementById('assignments-tbody');
  tbody.innerHTML = assignments.map(a => `
    <tr>
      <td><strong>${escapeHTML(a.student_name || 'Unknown')}</strong><br>
        <span style="font-size:0.78rem; color:var(--color-gray-400);">${escapeHTML(a.student_id || '')}</span></td>
      <td>${escapeHTML(a.file_name)}</td>
      <td>${new Date(a.analyzed_at).toLocaleDateString()}</td>
      <td><span class="badge ${a.overall_score >= 70 ? 'badge-good' : a.overall_score >= 40 ? 'badge-warn' : 'badge-bad'}">${a.overall_score}%</span></td>
      <td>
        <a href="dashboard?id=${a.id}" class="btn btn-ghost btn-sm" style="padding:4px 10px; font-size:0.78rem;">View</a>
        <button class="btn-delete-sm" data-id="${a.id}" title="Delete">🗑️</button>
      </td>
    </tr>
  `).join('');

  // Delete handlers
  tbody.querySelectorAll('.btn-delete-sm').forEach(btn => {
    btn.addEventListener('click', async () => {
      if (!(await customConfirm('Delete this assignment? This cannot be undone.'))) return;
      const { error } = await sb.from('assignments').delete().eq('id', btn.dataset.id);
      if (error) { alert('Error: ' + error.message); return; }
      window.location.reload();
    });
  });

  // --- AI Section Feedback ---
  const feedbackCard = document.getElementById('section-feedback-card');
  feedbackCard.style.display = 'block';

  document.getElementById('generate-feedback-btn').addEventListener('click', async () => {
    const btn = document.getElementById('generate-feedback-btn');
    btn.disabled = true;
    btn.textContent = 'Generating...';

    try {
      const res = await fetch(`${API_BASE}/api/sections/${sectionId}/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teacher_id: user.id,
          section_name: section.name,
          assignments: assignments.map(a => ({
            student_name: a.student_name,
            overall_score: a.overall_score,
            relevance: a.relevance,
            understanding: a.understanding,
            logic: a.logic,
            structure: a.structure,
            clarity: a.clarity,
            feedback: a.feedback
          }))
        })
      });

      const data = await res.json();
      if (data.error) throw new Error(data.error);

      document.getElementById('section-feedback').textContent = data.feedback;
      btn.textContent = '✓ Generated';
    } catch (err) {
      document.getElementById('section-feedback').textContent = 'Failed to generate insights: ' + err.message;
      btn.disabled = false;
      btn.textContent = 'Retry';
    }
  });

  function escapeHTML(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }
});
