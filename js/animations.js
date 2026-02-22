/* ============================================
   Global Animations — Intersection Observer
   Triggers "visible" class on scroll (re-triggerable)
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {
    // 1. Create Intersection Observer
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                // Element is entering the viewport
                entry.target.classList.add('visible');
            } else {
                // Element is leaving the viewport
                // We remove it so it can re-animate when scrolling back
                entry.target.classList.remove('visible');
            }
        });
    }, observerOptions);

    // 2. Start observing all reveal elements
    function initAnimations() {
        const revealElements = document.querySelectorAll('.reveal, .reveal-up, .reveal-down, .reveal-left, .reveal-right');
        revealElements.forEach(el => revealObserver.observe(el));
    }

    // Initialize
    initAnimations();

    // Re-run init when content changes (useful for dynamic lists like sections)
    window.addEventListener('contentUpdated', () => {
        initAnimations();
    });

    // 3. Smooth page transitions (for internal links)
    document.querySelectorAll('a').forEach(anchor => {
        const href = anchor.getAttribute('href');
        if (href && !href.startsWith('http') && !href.startsWith('#') && !anchor.hasAttribute('target')) {
            anchor.addEventListener('click', (e) => {
                e.preventDefault();
                document.body.classList.add('page-exit');
                setTimeout(() => {
                    window.location.href = href;
                }, 300);
            });
        }
    });

    // Handle initial fade-in
    document.body.classList.add('page-ready');
});
