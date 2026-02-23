/**
 * Hash-based SPA Router
 * Supports parameterized routes like 'tactic/:slug'
 * Intercepts all hash-link clicks to prevent WordPress page reloads
 */
const Router = (() => {
    const routes = {};
    let currentRoute = null;
    let currentParams = {};

    function container() {
        return document.getElementById('fm26-content');
    }

    function register(pattern, handler) {
        routes[pattern] = handler;
    }

    function parseHash(hash) {
        const clean = hash.replace(/^#\/?/, '') || 'library';

        for (const pattern of Object.keys(routes)) {
            const paramNames = [];
            const regexStr = pattern.replace(/:([^/]+)/g, (_, name) => {
                paramNames.push(name);
                return '([^/]+)';
            });
            const match = clean.match(new RegExp(`^${regexStr}$`));
            if (match) {
                const params = {};
                paramNames.forEach((name, i) => {
                    params[name] = decodeURIComponent(match[i + 1]);
                });
                return { pattern, params };
            }
        }
        return { pattern: 'library', params: {} };
    }

    function navigate(hash) {
        const cleanHash = hash.startsWith('#') ? hash : '#' + hash;
        // If same hash, force re-render
        if (window.location.hash === cleanHash) {
            handleRoute();
        } else {
            window.location.hash = cleanHash;
        }
    }

    function handleRoute() {
        const { pattern, params } = parseHash(window.location.hash);
        currentRoute = pattern;
        currentParams = params;

        const handler = routes[pattern];
        const el = container();

        if (handler && el) {
            el.innerHTML = `
                <div class="loading-container">
                    <div class="spinner"></div>
                    <p class="loading-text">Loading...</p>
                </div>
            `;
            try {
                handler(params, el);
            } catch (err) {
                console.error('Route error:', err);
                el.innerHTML = `
                    <div class="error-state">
                        <p>Something went wrong loading this page.</p>
                        <a href="#library" class="btn btn-primary" style="margin-top:16px">Back to Library</a>
                    </div>
                `;
            }
        }

        // Scroll the fm26-app container into view instead of window top
        const app = document.getElementById('fm26-app');
        if (app) {
            app.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }

        updateNav(pattern);
        postHeightToParent();
    }

    function updateNav(pattern) {
        const base = pattern.split('/')[0];
        document.querySelectorAll('.fm26-app .nav-link').forEach(link => {
            const href = link.getAttribute('href').replace('#', '');
            link.classList.toggle('active', href === base);
        });
    }

    function postHeightToParent() {
        if (window.parent !== window) {
            setTimeout(() => {
                window.parent.postMessage({
                    type: 'fm26-resize',
                    height: document.body.scrollHeight
                }, '*');
            }, 100);
        }
    }

    // Intercept ALL hash-link clicks inside .fm26-app to prevent WordPress page reloads
    function interceptLinks() {
        const app = document.getElementById('fm26-app');
        if (!app) return;

        app.addEventListener('click', (e) => {
            // Find the closest <a> tag
            const link = e.target.closest('a[href^="#"]');
            if (link) {
                e.preventDefault();
                e.stopPropagation();
                const hash = link.getAttribute('href');
                navigate(hash.replace('#', ''));
            }
        });
    }

    function getCurrentRoute() { return currentRoute; }
    function getCurrentParams() { return currentParams; }

    window.addEventListener('hashchange', handleRoute);

    return { register, navigate, handleRoute, getCurrentRoute, getCurrentParams, postHeightToParent, interceptLinks };
})();
