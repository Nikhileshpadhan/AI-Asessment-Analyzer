/* ============================================
   Shared Components — Navbar & Footer
   Auth-aware navigation with theme toggle
   ============================================ */

function getActivePage() {
  const path = window.location.pathname;
  if (path.includes('login')) return 'login';
  if (path.includes('signup')) return 'signup';
  if (path.includes('section-dashboard')) return 'section-dashboard';
  if (path.includes('sections')) return 'sections';
  if (path.includes('start')) return 'start';
  if (path.includes('dashboard')) return 'dashboard';
  if (path.includes('records')) return 'records';
  if (path.includes('about')) return 'about';
  return 'home';
}

function getThemeIcon(theme) {
  return theme === 'dark' ? '☀️' : '🌙';
}

function initTheme() {
  const saved = localStorage.getItem('analytix_theme');
  if (saved) {
    document.documentElement.setAttribute('data-theme', saved);
    return saved;
  }
  if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    document.documentElement.setAttribute('data-theme', 'dark');
    return 'dark';
  }
  return 'light';
}

function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme') || 'light';
  const next = current === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('analytix_theme', next);
  const btn = document.getElementById('theme-toggle-btn');
  if (btn) btn.textContent = getThemeIcon(next);
  window.dispatchEvent(new CustomEvent('themechange', { detail: { theme: next } }));
}

async function renderNavbar() {
  const root = document.getElementById('navbar-root');
  if (!root) return;

  const active = getActivePage();
  const currentTheme = initTheme();

  // Check auth state
  let user = null;
  try {
    user = await getUser();
  } catch (e) { /* not logged in */ }

  const authLinks = user
    ? `<a href="index" class="${active === 'home' ? 'active' : ''}">Home</a>
       <a href="sections" class="${active === 'sections' ? 'active' : ''}">My Sections</a>
       <a href="start" class="${active === 'start' ? 'active' : ''}">Analyze</a>
       <a href="about" class="${active === 'about' ? 'active' : ''}">About</a>`
    : `<a href="index" class="${active === 'home' ? 'active' : ''}">Home</a>
       <a href="about" class="${active === 'about' ? 'active' : ''}">About</a>`;

  const displayName = user?.user_metadata?.display_name || user?.email || '';

  const authAction = user
    ? `<span style="font-size:0.78rem; color:var(--color-gray-500); max-width:140px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;" title="${user.email}">👋 ${displayName}</span>
       <button class="btn btn-ghost btn-sm" id="logout-btn" style="font-size:0.78rem; padding:6px 14px;">Logout</button>`
    : `<a href="login" class="btn btn-primary btn-sm" style="font-size:0.78rem; padding:8px 20px;">Login</a>`;

  root.innerHTML = `
    <nav class="navbar" id="main-navbar">
      <a href="${user ? 'sections' : 'index'}" class="navbar-logo">Analytix<span>AI</span></a>
      <div class="navbar-links" id="navbar-links">
        ${authLinks}
      </div>
      <div style="display:flex; align-items:center; gap:8px;">
        ${authAction}
        <button class="theme-toggle" id="theme-toggle-btn" aria-label="Toggle dark mode">${getThemeIcon(currentTheme)}</button>
        <button class="navbar-toggle" id="navbar-toggle" aria-label="Toggle menu">
          <span></span><span></span><span></span>
        </button>
      </div>
    </nav>
  `;

  // Scroll effect
  const navbar = document.getElementById('main-navbar');
  window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 20);
  });

  // Mobile toggle
  const toggle = document.getElementById('navbar-toggle');
  const links = document.getElementById('navbar-links');
  toggle.addEventListener('click', () => {
    links.classList.toggle('open');
    toggle.classList.toggle('active');
  });

  // Theme toggle
  document.getElementById('theme-toggle-btn').addEventListener('click', toggleTheme);

  // Logout
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
      await authSignOut();
    });
  }
}

function renderFooter() {
  const root = document.getElementById('footer-root');
  if (!root) return;
  root.innerHTML = `
    <footer class="footer">
      <div class="container">
        <p>&copy; ${new Date().getFullYear()} AnalytixAI — Intelligent Assignment Analytics for Educators</p>
      </div>
    </footer>
  `;
}

/**
 * Custom centered confirm dialog — replaces browser confirm()
 * Returns a Promise<boolean>
 */
function customConfirm(message, { confirmText = 'Delete', cancelText = 'Cancel' } = {}) {
  return new Promise((resolve) => {
    // Remove any existing modal
    const existing = document.getElementById('custom-confirm-overlay');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.id = 'custom-confirm-overlay';
    overlay.className = 'confirm-overlay';
    overlay.innerHTML = `
      <div class="confirm-modal">
        <div class="confirm-icon">⚠️</div>
        <p class="confirm-message">${message}</p>
        <div class="confirm-actions">
          <button class="btn btn-secondary confirm-cancel">${cancelText}</button>
          <button class="btn btn-danger confirm-ok">${confirmText}</button>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    // Animate in
    requestAnimationFrame(() => overlay.classList.add('active'));

    const close = (result) => {
      overlay.classList.remove('active');
      setTimeout(() => overlay.remove(), 200);
      resolve(result);
    };

    overlay.querySelector('.confirm-cancel').addEventListener('click', () => close(false));
    overlay.querySelector('.confirm-ok').addEventListener('click', () => close(true));
    overlay.addEventListener('click', (e) => { if (e.target === overlay) close(false); });
  });
}

document.addEventListener('DOMContentLoaded', () => {
  renderNavbar();
  renderFooter();
});
