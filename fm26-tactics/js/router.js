/**
 * Hash-based SPA Router
 * Supports parameterized routes like 'tactic/:slug'
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
        window.location.hash = hash;
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

        window.scrollTo(0, 0);
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

    function getCurrentRoute() { return currentRoute; }
    function getCurrentParams() { return currentParams; }

    window.addEventListener('hashchange', handleRoute);

    return { register, navigate, handleRoute, getCurrentRoute, getCurrentParams, postHeightToParent };
})();
