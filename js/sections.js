/* ============================================
   Sections Management — CRUD + Stats
   ============================================ */

document.addEventListener('DOMContentLoaded', async () => {
  const user = await requireAuth();
  if (!user) return;

  const grid = document.getElementById('sections-grid');
  const emptyState = document.getElementById('sections-empty');
  const modal = document.getElementById('create-modal');

  // --- Load Sections ---
  async function loadSections() {
    // Fetch sections
    const { data: sections, error } = await sb
      .from('sections')
      .select('*')
      .eq('teacher_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading sections:', error);
      return;
    }

    if (!sections || sections.length === 0) {
      grid.innerHTML = '';
      emptyState.style.display = 'block';
      return;
    }

    emptyState.style.display = 'none';

    // Fetch assignment stats for each section
    const sectionIds = sections.map(s => s.id);
    const { data: assignments } = await sb
      .from('assignments')
      .select('section_id, student_name, overall_score')
      .in('section_id', sectionIds);

    // Group stats by section
    const statsMap = {};
    sectionIds.forEach(id => { statsMap[id] = { count: 0, topScore: 0, topStudent: '' }; });

    if (assignments) {
      assignments.forEach(a => {
        const s = statsMap[a.section_id];
        if (s) {
          s.count++;
          if (a.overall_score > s.topScore) {
            s.topScore = a.overall_score;
            s.topStudent = a.student_name || 'Unknown';
          }
        }
      });
    }

    grid.innerHTML = sections.map((section, index) => {
      const stats = statsMap[section.id] || { count: 0, topScore: 0, topStudent: '' };
      const topStudentHTML = stats.count > 0
        ? `<div class="section-top-student">🏆 Top: <strong>${stats.topStudent}</strong> (${stats.topScore}%)</div>`
        : '';

      // Add dynamic reveal delay (max 10)
      const delayClass = `reveal-delay-${Math.min(index + 1, 10)}`;

      return `
        <div class="glass-card section-card reveal-up ${delayClass}" data-id="${section.id}">
          <button class="section-delete" data-id="${section.id}" title="Delete section">🗑️</button>
          <div class="section-name">${escapeHTML(section.name)}</div>
          <div class="section-desc">${escapeHTML(section.description || '')}</div>
          <div class="section-stats">
            <div class="stat-item">
              <span class="stat-value">${stats.count}</span>
              <span class="stat-label">Assignments</span>
            </div>
            <div class="stat-item">
              <span class="stat-value">${stats.topScore}%</span>
              <span class="stat-label">Highest Score</span>
            </div>
          </div>
          ${topStudentHTML}
        </div>
      `;
    }).join('');

    // Trigger animations for new content
    window.dispatchEvent(new Event('contentUpdated'));

    // Click handlers — navigate to section dashboard
    grid.querySelectorAll('.section-card').forEach(card => {
      card.addEventListener('click', (e) => {
        if (e.target.classList.contains('section-delete')) return;
        const id = card.dataset.id;
        window.location.href = `section-dashboard?id=${id}`;
      });
    });

    // Delete handlers
    grid.querySelectorAll('.section-delete').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const id = btn.dataset.id;
        if (!(await customConfirm('Delete this section and all its assignments? This cannot be undone.'))) return;

        const { error } = await sb.from('sections').delete().eq('id', id);
        if (error) {
          alert('Failed to delete section: ' + error.message);
          return;
        }
        loadSections();
      });
    });
  }

  // --- Create Section ---
  function openModal() {
    modal.classList.add('active');
    document.getElementById('section-name').focus();
  }

  function closeModal() {
    modal.classList.remove('active');
    document.getElementById('section-name').value = '';
    document.getElementById('section-desc').value = '';
  }

  document.getElementById('create-section-btn').addEventListener('click', openModal);
  document.getElementById('create-section-btn-2')?.addEventListener('click', openModal);
  document.getElementById('cancel-modal').addEventListener('click', closeModal);

  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });

  document.getElementById('save-section').addEventListener('click', async () => {
    const name = document.getElementById('section-name').value.trim();
    const description = document.getElementById('section-desc').value.trim();

    if (!name) {
      alert('Section name is required.');
      return;
    }

    const { error } = await sb.from('sections').insert({
      teacher_id: user.id,
      name,
      description
    });

    if (error) {
      alert('Failed to create section: ' + error.message);
      return;
    }

    closeModal();
    loadSections();
  });

  // --- Helpers ---
  function escapeHTML(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  // Init
  loadSections();
});
