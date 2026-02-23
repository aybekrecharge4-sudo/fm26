/**
 * Comparison Tool Page - Side-by-side tactic comparison
 */
const ComparePage = (() => {
    let tacticA = null;
    let tacticB = null;

    function render(params, container) {
        tacticA = null;
        tacticB = null;

        container.innerHTML = `
            <div class="page-header" style="text-align:center">
                <h1 class="page-title">Compare Tactics</h1>
                <p class="page-subtitle">Select two tactics to compare formations, stats, and instructions side by side</p>
            </div>

            <div class="compare-selectors" id="compareSelectors">
                <div id="slotA"></div>
                <div class="compare-vs">VS</div>
                <div id="slotB"></div>
            </div>

            <div id="compareContent"></div>
        `;

        renderSlots();
    }

    function renderSlots() {
        const slotAEl = document.getElementById('slotA');
        const slotBEl = document.getElementById('slotB');
        if (!slotAEl || !slotBEl) return;

        slotAEl.innerHTML = ComparisonSlot.render('slotA-inner', tacticA);
        slotBEl.innerHTML = ComparisonSlot.render('slotB-inner', tacticB);

        // Bind click handlers — use closest() so clicks on child elements work
        const slotAInner = document.getElementById('slotA-inner');
        const slotBInner = document.getElementById('slotB-inner');

        if (slotAInner) {
            slotAInner.addEventListener('click', (e) => {
                const isChangeBtn = e.target.closest('[data-action="change"]');
                if (isChangeBtn || !tacticA) {
                    e.preventDefault();
                    e.stopPropagation();
                    ComparisonSlot.showSelector((t) => {
                        tacticA = t;
                        renderSlots();
                        renderComparison();
                    });
                }
            });
        }

        if (slotBInner) {
            slotBInner.addEventListener('click', (e) => {
                const isChangeBtn = e.target.closest('[data-action="change"]');
                if (isChangeBtn || !tacticB) {
                    e.preventDefault();
                    e.stopPropagation();
                    ComparisonSlot.showSelector((t) => {
                        tacticB = t;
                        renderSlots();
                        renderComparison();
                    });
                }
            });
        }
    }

    function renderComparison() {
        const content = document.getElementById('compareContent');
        if (!content) return;

        if (!tacticA || !tacticB) {
            content.innerHTML = `
                <div class="empty-state" style="margin-top:48px">
                    <div class="empty-state-icon">&#8644;</div>
                    <p>Select two tactics above to compare them.</p>
                </div>
            `;
            return;
        }

        const meta = DataStore.getMeta();
        const versionA = DataStore.getTacticCurrentVersion(tacticA);
        const versionB = DataStore.getTacticCurrentVersion(tacticB);
        const evidenceA = DataStore.getBestEvidence(versionA);
        const evidenceB = DataStore.getBestEvidence(versionB);

        content.innerHTML = `
            <!-- Formation Comparison -->
            <div class="section">
                <h2 class="section-title">Formation Comparison</h2>
                <div class="compare-layout">
                    <div class="pitch-container">
                        <span class="pitch-label">${esc(tacticA.name)} - IP (${esc(versionA?.formation?.inPossession?.shape || 'N/A')})</span>
                        <div id="compareFormA-ip"></div>
                    </div>
                    <div class="pitch-container">
                        <span class="pitch-label">${esc(tacticB.name)} - IP (${esc(versionB?.formation?.inPossession?.shape || 'N/A')})</span>
                        <div id="compareFormB-ip"></div>
                    </div>
                    <div class="pitch-container">
                        <span class="pitch-label">${esc(tacticA.name)} - OOP (${esc(versionA?.formation?.outOfPossession?.shape || 'N/A')})</span>
                        <div id="compareFormA-oop"></div>
                    </div>
                    <div class="pitch-container">
                        <span class="pitch-label">${esc(tacticB.name)} - OOP (${esc(versionB?.formation?.outOfPossession?.shape || 'N/A')})</span>
                        <div id="compareFormB-oop"></div>
                    </div>
                </div>
            </div>

            <!-- Stats Comparison -->
            <div class="section">
                <h2 class="section-title">Performance Comparison</h2>
                <div style="display:grid;grid-template-columns:1fr auto 120px auto 1fr;gap:4px;margin-bottom:8px;font-size:0.8rem;font-weight:600;color:var(--fm26-text-muted);text-transform:uppercase">
                    <span style="text-align:right">${esc(tacticA.name)}</span>
                    <span></span>
                    <span style="text-align:center">Metric</span>
                    <span></span>
                    <span>${esc(tacticB.name)}</span>
                </div>
                <div id="compareStats"></div>
            </div>

            <!-- Instructions Comparison -->
            <div class="section">
                <h2 class="section-title">Instruction Differences</h2>
                ${renderInstructionDiff(versionA, versionB)}
            </div>

            <!-- Meta Comparison -->
            <div class="section">
                <h2 class="section-title">Overview</h2>
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px">
                    ${renderMetaColumn(tacticA)}
                    ${renderMetaColumn(tacticB)}
                </div>
            </div>
        `;

        // Render formation pitches
        const formations = meta?.formations || {};
        if (versionA?.formation?.inPossession) {
            const pos = PitchVisualizer.formationToPositions(versionA.formation.inPossession, formations);
            PitchVisualizer.createPitchSVG('compareFormA-ip', pos, { phase: 'inPossession', compact: true });
        }
        if (versionB?.formation?.inPossession) {
            const pos = PitchVisualizer.formationToPositions(versionB.formation.inPossession, formations);
            PitchVisualizer.createPitchSVG('compareFormB-ip', pos, { phase: 'inPossession', compact: true });
        }
        if (versionA?.formation?.outOfPossession) {
            const pos = PitchVisualizer.formationToPositions(versionA.formation.outOfPossession, formations);
            PitchVisualizer.createPitchSVG('compareFormA-oop', pos, { phase: 'outOfPossession', compact: true });
        }
        if (versionB?.formation?.outOfPossession) {
            const pos = PitchVisualizer.formationToPositions(versionB.formation.outOfPossession, formations);
            PitchVisualizer.createPitchSVG('compareFormB-oop', pos, { phase: 'outOfPossession', compact: true });
        }

        // Render stats comparison
        StatsTable.renderComparison(evidenceA?.stats, evidenceB?.stats, 'compareStats');

        Router.postHeightToParent();
    }

    function renderInstructionDiff(vA, vB) {
        const phases = [
            { key: 'inPossession', label: 'In Possession' },
            { key: 'outOfPossession', label: 'Out of Possession' },
            { key: 'transition', label: 'Transition' }
        ];

        let html = '<div class="instructions-panel"><div class="instructions-grid">';

        phases.forEach(phase => {
            const insA = new Set(vA?.teamInstructions?.[phase.key] || []);
            const insB = new Set(vB?.teamInstructions?.[phase.key] || []);
            const all = new Set([...insA, ...insB]);

            html += `<div>
                <div class="instructions-column-title">${phase.label}</div>
                <div class="instructions-list">`;

            all.forEach(ins => {
                const inA = insA.has(ins);
                const inB = insB.has(ins);
                let style = '';
                let prefix = '';
                if (inA && inB) {
                    style = 'border-color:var(--fm26-accent-primary);color:var(--fm26-text-primary)';
                    prefix = '';
                } else if (inA) {
                    style = 'border-color:var(--fm26-duty-attack);color:var(--fm26-duty-attack);border-style:dashed';
                    prefix = 'A: ';
                } else {
                    style = 'border-color:var(--fm26-accent-secondary);color:var(--fm26-accent-secondary);border-style:dashed';
                    prefix = 'B: ';
                }
                html += `<span class="instruction-chip" style="${style}">${prefix}${esc(ins)}</span>`;
            });

            if (all.size === 0) {
                html += '<span class="text-muted" style="font-size:0.85rem">None</span>';
            }

            html += '</div></div>';
        });

        html += '</div></div>';
        html += '<div style="margin-top:8px;font-size:0.8rem;color:var(--fm26-text-muted)">Solid green = shared &middot; Dashed red = only Tactic A &middot; Dashed blue = only Tactic B</div>';
        return html;
    }

    function renderMetaColumn(tactic) {
        return `
            <div class="card" style="padding:16px">
                <div style="font-weight:700;margin-bottom:8px">${esc(tactic.name)}</div>
                <div style="font-size:0.85rem;color:var(--fm26-text-secondary)">
                    <div>Formation: <strong>${esc(tactic.formationFamily)}</strong></div>
                    <div>Style: <strong>${esc(tactic.primaryStyle)}</strong></div>
                    <div>Intensity: <strong>${esc(tactic.intensity || 'N/A')}</strong></div>
                    <div>Mentality: <strong>${esc(tactic.mentality || 'N/A')}</strong></div>
                    <div>Budget Tier: <strong>${esc(tactic.budgetTier || 'N/A')}</strong></div>
                </div>
            </div>
        `;
    }

    function esc(str) {
        if (!str) return '';
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    return { render };
})();
