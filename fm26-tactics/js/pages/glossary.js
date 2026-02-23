/**
 * Glossary Page - FM terminology dictionary
 */
const GlossaryPage = (() => {
    let currentQuery = '';
    let currentCategory = 'All';

    function render(params, container) {
        currentQuery = '';
        currentCategory = 'All';

        const categories = ['All', ...(DataStore.getMeta()?.enums?.glossaryCategories || [])];

        container.innerHTML = `
            <div class="page-header">
                <h1 class="page-title">FM26 Glossary</h1>
                <p class="page-subtitle">Roles, duties, instructions, and analytics terms explained</p>
            </div>

            <div class="glossary-search">
                <input type="text" id="glossarySearch" class="input" placeholder="Search terms...">
            </div>

            <div class="glossary-categories">
                <div class="tabs" id="glossaryTabs">
                    ${categories.map(cat =>
                        `<button class="tab ${cat === 'All' ? 'active' : ''}" data-category="${esc(cat)}">${esc(cat)}</button>`
                    ).join('')}
                </div>
            </div>

            <div class="glossary-grid" id="glossaryGrid"></div>
        `;

        bindEvents();
        renderTerms();
    }

    function renderTerms() {
        const allTerms = DataStore.getGlossary();
        const filtered = SearchEngine.filterGlossary(allTerms, currentQuery, currentCategory);
        const grid = document.getElementById('glossaryGrid');
        if (!grid) return;

        if (filtered.length === 0) {
            grid.innerHTML = `
                <div class="empty-state">
                    <p>No glossary terms match your search.</p>
                </div>
            `;
            return;
        }

        grid.innerHTML = filtered.map(term => `
            <div class="glossary-card" id="term-${esc(term.slug)}">
                <div class="glossary-term">${esc(term.term)}</div>
                ${term.aliases?.length ? `<div class="glossary-aliases">Also: ${term.aliases.map(a => esc(a)).join(', ')}</div>` : ''}
                <span class="badge badge-patch" style="margin-bottom:8px">${esc(term.category)}</span>
                <div class="glossary-definition">${esc(term.definition)}</div>
                ${term.fmContext ? `<div class="glossary-fm-context">${esc(term.fmContext)}</div>` : ''}
                ${term.relatedTerms?.length ? `
                <div style="margin-top:12px">
                    <span style="font-size:0.8rem;color:var(--fm26-text-muted)">Related: </span>
                    ${term.relatedTerms.map(slug => {
                        const related = DataStore.getGlossaryTerm(slug);
                        const label = related ? related.term : slug;
                        return `<a href="#glossary" class="tag tag-clickable" onclick="event.preventDefault();document.getElementById('term-${slug}')?.scrollIntoView({behavior:'smooth'})">${esc(label)}</a>`;
                    }).join(' ')}
                </div>` : ''}
                ${term.usedInTactics?.length ? `
                <div style="margin-top:8px">
                    <span style="font-size:0.8rem;color:var(--fm26-text-muted)">Used in: </span>
                    ${term.usedInTactics.map(slug => {
                        const t = DataStore.getTactic(slug);
                        const label = t ? t.name : slug;
                        return `<a href="#tactic/${slug}" class="tag tag-clickable">${esc(label)}</a>`;
                    }).join(' ')}
                </div>` : ''}
            </div>
        `).join('');

        Router.postHeightToParent();
    }

    function bindEvents() {
        // Search
        let searchTimeout;
        const searchInput = document.getElementById('glossarySearch');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                clearTimeout(searchTimeout);
                searchTimeout = setTimeout(() => {
                    currentQuery = e.target.value.trim();
                    renderTerms();
                }, 200);
            });
        }

        // Category tabs
        document.querySelectorAll('#glossaryTabs .tab').forEach(tab => {
            tab.addEventListener('click', () => {
                document.querySelectorAll('#glossaryTabs .tab').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                currentCategory = tab.dataset.category;
                renderTerms();
            });
        });
    }

    function esc(str) {
        if (!str) return '';
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    return { render };
})();
