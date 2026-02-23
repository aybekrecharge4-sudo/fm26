/**
 * Tactic Library Page - Search, filter, and browse tactics
 */
const LibraryPage = (() => {
    let currentFilters = {};
    let currentSort = 'newest';

    function render(params, container) {
        const currentPatch = DataStore.getCurrentPatch();
        currentFilters = { patchVersion: currentPatch };
        currentSort = 'newest';

        const formations = DataStore.getAllFormations();
        const styleTags = DataStore.getAllStyleTags();
        const intensities = DataStore.getAllIntensityLevels();
        const patchVersions = DataStore.getAllPatchVersions();

        container.innerHTML = `
            <div class="page-header">
                <h1 class="page-title">Tactic Library</h1>
                <p class="page-subtitle">Browse and filter FM26 tactics &middot; Patch ${esc(currentPatch)}</p>
            </div>

            <div class="library-layout">
                <aside class="filter-sidebar" id="filterSidebar">
                    <div class="filter-section">
                        <label class="filter-label">Search</label>
                        <input type="text" id="searchInput" class="input" placeholder="Search tactics, authors...">
                    </div>

                    <div class="filter-section">
                        <label class="filter-label">Patch</label>
                        <select id="filterPatch" class="select">
                            ${patchVersions.map(p =>
                                `<option value="${esc(p)}" ${p === currentPatch ? 'selected' : ''}>${esc(p)}${p === currentPatch ? ' (current)' : ''}</option>`
                            ).join('')}
                            <option value="">All Patches</option>
                        </select>
                    </div>

                    <div class="filter-section">
                        <label class="filter-label">Formation</label>
                        <div class="filter-chips" id="formationChips">
                            ${formations.map(f =>
                                `<button class="chip" data-filter="formation" data-value="${esc(f)}">${esc(f)}</button>`
                            ).join('')}
                        </div>
                    </div>

                    <div class="filter-section">
                        <label class="filter-label">Style</label>
                        <div class="filter-chips" id="styleChips">
                            ${styleTags.map(s =>
                                `<button class="chip" data-filter="style" data-value="${esc(s)}">${esc(s)}</button>`
                            ).join('')}
                        </div>
                    </div>

                    <div class="filter-section">
                        <label class="filter-label">Intensity</label>
                        <select id="filterIntensity" class="select">
                            <option value="">Any</option>
                            ${intensities.map(i =>
                                `<option value="${esc(i)}">${esc(i)}</option>`
                            ).join('')}
                        </select>
                    </div>

                    <div class="filter-section">
                        <label class="filter-label">Sort By</label>
                        <select id="sortSelect" class="select">
                            <option value="newest">Newest Updated</option>
                            <option value="ppg">Highest PPG</option>
                            <option value="win-rate">Highest Win Rate</option>
                            <option value="name-asc">Name A-Z</option>
                            <option value="name-desc">Name Z-A</option>
                        </select>
                    </div>

                    <button class="btn-clear-filters" id="clearFilters">Clear All Filters</button>
                </aside>

                <main class="tactic-grid-container">
                    <div class="results-bar">
                        <span id="resultCount">0 tactics</span>
                        <button class="btn-mobile-filter" id="mobileFilterToggle">Filters</button>
                    </div>
                    <div class="tactic-grid" id="tacticGrid"></div>
                </main>
            </div>
        `;

        bindEvents();
        applyFilters();
    }

    function applyFilters() {
        const allTactics = DataStore.getTactics();
        let filtered = SearchEngine.filterTactics(allTactics, currentFilters);
        filtered = SearchEngine.sortTactics(filtered, currentSort, DataStore.getCurrentPatch());

        const countEl = document.getElementById('resultCount');
        if (countEl) countEl.textContent = `${filtered.length} tactic${filtered.length !== 1 ? 's' : ''}`;

        const grid = document.getElementById('tacticGrid');
        if (!grid) return;

        if (filtered.length === 0) {
            grid.innerHTML = `
                <div class="empty-state" style="grid-column:1/-1">
                    <div class="empty-state-icon">&#128270;</div>
                    <p>No tactics match your filters.</p>
                    <p style="margin-top:8px;font-size:0.85rem">Try broadening your search or clearing filters.</p>
                </div>
            `;
            return;
        }

        grid.innerHTML = filtered.map(t => TacticCard.render(t)).join('');
        Router.postHeightToParent();
    }

    function bindEvents() {
        // Search input (debounced)
        let searchTimeout;
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                clearTimeout(searchTimeout);
                searchTimeout = setTimeout(() => {
                    currentFilters.query = e.target.value.trim() || undefined;
                    applyFilters();
                }, 200);
            });
        }

        // Patch select
        const patchSelect = document.getElementById('filterPatch');
        if (patchSelect) {
            patchSelect.addEventListener('change', (e) => {
                currentFilters.patchVersion = e.target.value || undefined;
                applyFilters();
            });
        }

        // Formation chips (single select)
        document.querySelectorAll('[data-filter="formation"]').forEach(chip => {
            chip.addEventListener('click', () => {
                const wasActive = chip.classList.contains('active');
                document.querySelectorAll('[data-filter="formation"]').forEach(c => c.classList.remove('active'));
                if (!wasActive) {
                    chip.classList.add('active');
                    currentFilters.formation = chip.dataset.value;
                } else {
                    currentFilters.formation = undefined;
                }
                applyFilters();
            });
        });

        // Style chips (multi select)
        document.querySelectorAll('[data-filter="style"]').forEach(chip => {
            chip.addEventListener('click', () => {
                chip.classList.toggle('active');
                const activeTags = [...document.querySelectorAll('[data-filter="style"].active')].map(c => c.dataset.value);
                currentFilters.styleTags = activeTags.length > 0 ? activeTags : undefined;
                applyFilters();
            });
        });

        // Intensity select
        const intensitySelect = document.getElementById('filterIntensity');
        if (intensitySelect) {
            intensitySelect.addEventListener('change', (e) => {
                currentFilters.intensity = e.target.value || undefined;
                applyFilters();
            });
        }

        // Sort select
        const sortSelect = document.getElementById('sortSelect');
        if (sortSelect) {
            sortSelect.addEventListener('change', (e) => {
                currentSort = e.target.value;
                applyFilters();
            });
        }

        // Clear filters
        const clearBtn = document.getElementById('clearFilters');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                currentFilters = {};
                currentSort = 'newest';
                document.querySelectorAll('.chip.active').forEach(c => c.classList.remove('active'));
                const si = document.getElementById('searchInput');
                if (si) si.value = '';
                const ps = document.getElementById('filterPatch');
                if (ps) ps.value = '';
                const is2 = document.getElementById('filterIntensity');
                if (is2) is2.value = '';
                const ss = document.getElementById('sortSelect');
                if (ss) ss.value = 'newest';
                applyFilters();
            });
        }

        // Mobile filter toggle
        const mobileToggle = document.getElementById('mobileFilterToggle');
        if (mobileToggle) {
            mobileToggle.addEventListener('click', () => {
                const sidebar = document.getElementById('filterSidebar');
                if (sidebar) sidebar.classList.toggle('mobile-open');
            });
        }
    }

    function esc(str) {
        if (!str) return '';
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    return { render };
})();
