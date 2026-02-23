/**
 * Tactic Detail Page - Full tactic breakdown
 */
const DetailPage = (() => {

    function render(params, container) {
        const slug = params.slug;
        const tactic = DataStore.getTactic(slug);

        if (!tactic) {
            container.innerHTML = `
                <div class="error-state">
                    <h2>Tactic Not Found</h2>
                    <p style="margin-top:8px;color:var(--fm26-text-secondary)">The tactic "${esc(slug)}" doesn't exist.</p>
                    <a href="#library" class="btn btn-primary" style="margin-top:16px">Back to Library</a>
                </div>
            `;
            return;
        }

        const currentPatch = DataStore.getCurrentPatch();
        const version = DataStore.getTacticCurrentVersion(tactic);
        const evidence = DataStore.getBestEvidence(version);
        const meta = DataStore.getMeta();

        const patchStatus = version?.patchStatus || 'untested';
        const patchBannerClass = `patch-banner-${patchStatus}`;
        const patchIcon = patchStatus === 'verified' ? '&#10003;' : patchStatus === 'outdated' ? '&#9888;' : '&#63;';
        const patchMsg = patchStatus === 'verified'
            ? `Verified on patch ${version?.patchVersion || currentPatch}`
            : patchStatus === 'outdated'
            ? `Tested on ${version?.patchVersion || '?'} - may need re-testing on ${currentPatch}`
            : `Not yet tested on current patch (${currentPatch})`;

        const ipShape = version?.formation?.inPossession?.shape || 'N/A';
        const oopShape = version?.formation?.outOfPossession?.shape || 'N/A';

        container.innerHTML = `
            <a href="#library" class="detail-back">&larr; Back to Library</a>

            <div class="detail-layout">
                <!-- Header -->
                <div>
                    <div class="detail-title-row">
                        <h1 class="detail-title">${esc(tactic.name)}</h1>
                        <span class="badge badge-formation" style="font-size:0.9rem;padding:4px 14px">${esc(tactic.formationFamily)}</span>
                    </div>
                    <div class="detail-author">
                        by ${tactic.authorUrl ? `<a href="${esc(tactic.authorUrl)}" target="_blank" rel="noopener">${esc(tactic.author)}</a>` : esc(tactic.author)}
                        &middot; Updated ${esc(tactic.updatedDate)}
                    </div>
                    <div class="detail-tags">
                        <span class="badge badge-style">${esc(tactic.primaryStyle)}</span>
                        ${(tactic.styleTags || []).filter(t => t !== tactic.primaryStyle).map(t =>
                            `<span class="badge badge-style">${esc(t)}</span>`
                        ).join('')}
                        ${tactic.intensity ? `<span class="badge badge-intensity">${esc(tactic.intensity)}</span>` : ''}
                        ${tactic.mentality ? `<span class="badge badge-patch">${esc(tactic.mentality)}</span>` : ''}
                    </div>
                </div>

                <!-- Patch Banner -->
                <div class="patch-banner ${patchBannerClass}">
                    <span>${patchIcon}</span>
                    <span>${patchMsg}</span>
                </div>

                <!-- Description -->
                <div class="detail-description">${esc(tactic.description)}</div>

                <!-- Formation Visualizer -->
                <div class="section">
                    <h2 class="section-title">Formation</h2>
                    <div id="detailFormation"></div>
                </div>

                <!-- Team Instructions -->
                <div class="section">
                    <h2 class="section-title">Team Instructions</h2>
                    <div class="instructions-panel">
                        <div class="instructions-grid">
                            <div>
                                <div class="instructions-column-title">In Possession</div>
                                <div class="instructions-list">
                                    ${(version?.teamInstructions?.inPossession || []).map(i =>
                                        `<span class="instruction-chip">${esc(i)}</span>`
                                    ).join('')}
                                    ${!(version?.teamInstructions?.inPossession?.length) ? '<span class="text-muted" style="font-size:0.85rem">None specified</span>' : ''}
                                </div>
                            </div>
                            <div>
                                <div class="instructions-column-title">Out of Possession</div>
                                <div class="instructions-list">
                                    ${(version?.teamInstructions?.outOfPossession || []).map(i =>
                                        `<span class="instruction-chip">${esc(i)}</span>`
                                    ).join('')}
                                    ${!(version?.teamInstructions?.outOfPossession?.length) ? '<span class="text-muted" style="font-size:0.85rem">None specified</span>' : ''}
                                </div>
                            </div>
                            <div>
                                <div class="instructions-column-title">Transition</div>
                                <div class="instructions-list">
                                    ${(version?.teamInstructions?.transition || []).map(i =>
                                        `<span class="instruction-chip">${esc(i)}</span>`
                                    ).join('')}
                                    ${!(version?.teamInstructions?.transition?.length) ? '<span class="text-muted" style="font-size:0.85rem">None specified</span>' : ''}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Evidence / Stats -->
                <div class="section">
                    <h2 class="section-title">Performance Evidence</h2>
                    <div class="evidence-panel" id="evidencePanel"></div>
                </div>

                <!-- Squad Requirements -->
                ${(tactic.squadRequirements && tactic.squadRequirements.length > 0) ? `
                <div class="section">
                    <h2 class="section-title">Squad Requirements</h2>
                    <div class="requirements-list">
                        ${tactic.squadRequirements.map(r =>
                            `<div class="requirement-item">${esc(r)}</div>`
                        ).join('')}
                    </div>
                </div>` : ''}

                <!-- Known Counters & Best Against -->
                ${(tactic.knownCounters?.length || tactic.bestAgainst?.length) ? `
                <div class="section" style="display:grid;grid-template-columns:1fr 1fr;gap:24px">
                    ${tactic.bestAgainst?.length ? `
                    <div>
                        <h3 class="section-title" style="color:var(--fm26-accent-primary)">Strong Against</h3>
                        <div class="tag-list">
                            ${tactic.bestAgainst.map(t => `<span class="tag">${esc(t)}</span>`).join('')}
                        </div>
                    </div>` : '<div></div>'}
                    ${tactic.knownCounters?.length ? `
                    <div>
                        <h3 class="section-title" style="color:var(--fm26-accent-danger)">Vulnerable To</h3>
                        <div class="tag-list">
                            ${tactic.knownCounters.map(t => `<span class="tag">${esc(t)}</span>`).join('')}
                        </div>
                    </div>` : '<div></div>'}
                </div>` : ''}

                <!-- Glossary Terms -->
                ${(tactic.glossaryTerms && tactic.glossaryTerms.length > 0) ? `
                <div class="section">
                    <h2 class="section-title">Related Concepts</h2>
                    <div class="tag-list">
                        ${tactic.glossaryTerms.map(slug => {
                            const term = DataStore.getGlossaryTerm(slug);
                            const label = term ? term.term : slug;
                            return `<a href="#glossary?term=${slug}" class="tag tag-clickable">${esc(label)}</a>`;
                        }).join('')}
                    </div>
                </div>` : ''}

                <!-- Related Tactics -->
                ${(tactic.relatedTactics && tactic.relatedTactics.length > 0) ? `
                <div class="section">
                    <h2 class="section-title">Related Tactics</h2>
                    <div class="tactic-grid">
                        ${tactic.relatedTactics.map(slug => {
                            const related = DataStore.getTactic(slug);
                            return related ? TacticCard.render(related) : '';
                        }).join('')}
                    </div>
                </div>` : ''}
            </div>
        `;

        // Render formation visualizer
        if (version) {
            // Check screen width for dual vs toggle
            if (window.innerWidth > 768) {
                PitchVisualizer.renderDualFormation('detailFormation', version, meta);
            } else {
                PitchVisualizer.renderToggleFormation('detailFormation', version, meta);
            }
        }

        // Render evidence stats
        StatsTable.renderStatBars(evidence, 'evidencePanel');

        Router.postHeightToParent();
    }

    function esc(str) {
        if (!str) return '';
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    return { render };
})();
