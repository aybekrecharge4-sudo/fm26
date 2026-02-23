/**
 * Comparison Slot Component - Tactic selector for comparison page
 */
const ComparisonSlot = (() => {

    function render(slotId, selectedTactic, onSelect) {
        if (selectedTactic) {
            return `
                <div class="compare-slot filled" id="${slotId}" data-slug="${esc(selectedTactic.slug)}">
                    <div class="compare-slot-name">${esc(selectedTactic.name)}</div>
                    <div class="compare-slot-formation">${esc(selectedTactic.formationFamily)} &middot; ${esc(selectedTactic.primaryStyle)}</div>
                    <button class="btn btn-ghost btn-sm" data-action="change">Change</button>
                </div>
            `;
        }
        return `
            <div class="compare-slot" id="${slotId}">
                <div class="compare-slot-placeholder">Click to select a tactic</div>
            </div>
        `;
    }

    function showSelector(onSelect) {
        const tactics = DataStore.getTactics();
        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay';
        overlay.innerHTML = `
            <div class="modal">
                <div class="modal-title">Select a Tactic</div>
                <input type="text" class="input" id="selectorSearch" placeholder="Search tactics..." autofocus>
                <div id="selectorResults" style="margin-top:12px;max-height:400px;overflow-y:auto"></div>
            </div>
        `;

        document.body.appendChild(overlay);

        function renderResults(query) {
            const filtered = query
                ? tactics.filter(t => {
                    const h = [t.name, t.author, t.formationFamily, t.primaryStyle].join(' ').toLowerCase();
                    return h.includes(query.toLowerCase());
                })
                : tactics;

            const results = document.getElementById('selectorResults');
            if (!results) return;

            results.innerHTML = filtered.map(t => `
                <div class="tactic-card" style="margin-bottom:8px;padding:12px" data-slug="${esc(t.slug)}">
                    <div class="tactic-card-name" style="font-size:0.95rem">${esc(t.name)}</div>
                    <div style="font-size:0.8rem;color:var(--fm26-text-muted);margin-top:2px">
                        ${esc(t.formationFamily)} &middot; ${esc(t.primaryStyle)} &middot; by ${esc(t.author)}
                    </div>
                </div>
            `).join('') || '<div class="empty-state">No tactics found.</div>';

            results.querySelectorAll('.tactic-card').forEach(card => {
                card.addEventListener('click', () => {
                    const slug = card.dataset.slug;
                    const tactic = DataStore.getTactic(slug);
                    overlay.remove();
                    if (onSelect && tactic) onSelect(tactic);
                });
            });
        }

        // Close on overlay click
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) overlay.remove();
        });

        // Search
        const searchInput = document.getElementById('selectorSearch');
        searchInput.addEventListener('input', (e) => renderResults(e.target.value));

        // Close on Escape
        document.addEventListener('keydown', function handler(e) {
            if (e.key === 'Escape') {
                overlay.remove();
                document.removeEventListener('keydown', handler);
            }
        });

        renderResults('');
    }

    function esc(str) {
        if (!str) return '';
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    return { render, showSelector };
})();
