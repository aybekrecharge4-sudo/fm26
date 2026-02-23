/**
 * FM26 Tactics Resource Center - Main App
 */
const App = (() => {
    let initialized = false;

    async function init() {
        if (initialized) return;

        // Show loading
        const content = document.getElementById('fm26-content');
        content.innerHTML = `
            <div class="loading-container">
                <div class="spinner"></div>
                <p class="loading-text">Loading FM26 Tactics Center...</p>
            </div>
        `;

        try {
            // Load all data
            await DataStore.loadAll();

            // Update footer
            const meta = DataStore.getMeta();
            const lastUpdated = document.getElementById('fm26-last-updated');
            if (lastUpdated && meta.siteConfig) {
                lastUpdated.textContent = meta.siteConfig.lastUpdated || 'Unknown';
            }

            // Register routes
            Router.register('library', LibraryPage.render);
            Router.register('tactic/:slug', DetailPage.render);
            Router.register('compare', ComparePage.render);
            Router.register('glossary', GlossaryPage.render);
            Router.register('patches', PatchesPage.render);
            Router.register('recommend', RecommendPage.render);

            // Handle initial route
            Router.handleRoute();

            initialized = true;
        } catch (err) {
            console.error('Failed to initialize app:', err);
            content.innerHTML = `
                <div class="error-state">
                    <div class="empty-state-icon">&#9888;</div>
                    <h2>Failed to Load</h2>
                    <p style="margin-top:8px;color:var(--fm26-text-secondary)">
                        Could not load tactic data. Please check your connection and try again.
                    </p>
                    <button class="btn btn-primary" style="margin-top:16px" onclick="location.reload()">
                        Retry
                    </button>
                </div>
            `;
        }
    }

    // Mobile nav toggle
    function setupMobileNav() {
        const toggle = document.getElementById('fm26-mobile-toggle');
        const nav = document.getElementById('fm26-nav');
        if (toggle && nav) {
            toggle.addEventListener('click', () => {
                toggle.classList.toggle('open');
                nav.classList.toggle('open');
            });
            // Close nav on link click
            nav.querySelectorAll('.fm26-app .nav-link').forEach(link => {
                link.addEventListener('click', () => {
                    toggle.classList.remove('open');
                    nav.classList.remove('open');
                });
            });
        }
    }

    // Boot
    document.addEventListener('DOMContentLoaded', () => {
        Router.interceptLinks();
        setupMobileNav();
        init();
    });

    return { init };
})();
