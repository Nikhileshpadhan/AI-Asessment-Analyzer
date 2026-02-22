/* ============================================
   Records — Supabase-backed Assignment History
   ============================================ */

document.addEventListener('DOMContentLoaded', async () => {
  const user = await requireAuth();
  if (!user) return;

  const tbody = document.getElementById('records-tbody');
  const emptyState = document.getElementById('records-empty');
  const clearBtn = document.getElementById('clear-records');
  const tableWrapper = document.querySelector('.records-table-wrapper');

  // Fetch all assignments for this teacher
  const { data: assignments, error } = await sb
    .from('assignments')
    .select('*, sections(name)')
    .eq('teacher_id', user.id)
    .order('analyzed_at', { ascending: false });

  if (error || !assignments || assignments.length === 0) {
    emptyState.style.display = 'block';
    tableWrapper.style.display = 'none';
    return;
  }

  emptyState.style.display = 'none';
  tableWrapper.style.display = 'block';
  clearBtn.style.display = 'inline-block';

  tbody.innerHTML = assignments.map(a => `
    <tr>
      <td>${escapeHTML(a.student_id || '—')}</td>
      <td>${escapeHTML(a.student_name || 'Unknown')}</td>
      <td>${new Date(a.analyzed_at).toLocaleDateString()}</td>
      <td>${a.understanding}%</td>
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
      if (!(await customConfirm('Delete this assignment record?'))) return;
      const { error } = await sb.from('assignments').delete().eq('id', btn.dataset.id);
      if (error) { alert('Error: ' + error.message); return; }
      btn.closest('tr').remove();
      if (tbody.children.length === 0) {
        emptyState.style.display = 'block';
        tableWrapper.style.display = 'none';
      }
    });
  });

  // Clear all
  clearBtn.addEventListener('click', async () => {
    if (!(await customConfirm('Delete ALL your assignment records? This cannot be undone.'))) return;
    const { error } = await sb.from('assignments').delete().eq('teacher_id', user.id);
    if (error) { alert('Error: ' + error.message); return; }
    tbody.innerHTML = '';
    emptyState.style.display = 'block';
    tableWrapper.style.display = 'none';
    clearBtn.style.display = 'none';
  });

  function escapeHTML(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }
});
