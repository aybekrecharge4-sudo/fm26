/**
 * Patch Tracker Page - FM26 update timeline
 */
const PatchesPage = (() => {

    function render(params, container) {
        const patches = DataStore.getPatches();
        const currentPatch = DataStore.getCurrentPatch();

        container.innerHTML = `
            <div class="page-header">
                <h1 class="page-title">Patch Tracker</h1>
                <p class="page-subtitle">FM26 updates and their impact on tactics</p>
            </div>

            <div class="timeline">
                ${patches.map(patch => renderPatchItem(patch, currentPatch)).join('')}
            </div>
        `;

        // Bind expand toggles
        document.querySelectorAll('[data-action="toggle-affected"]').forEach(btn => {
            btn.addEventListener('click', () => {
                const target = document.getElementById(btn.dataset.target);
                if (target) {
                    const isOpen = target.style.display !== 'none';
                    target.style.display = isOpen ? 'none' : 'block';
                    btn.textContent = isOpen ? 'Show affected tactics' : 'Hide affected tactics';
                }
            });
        });

        Router.postHeightToParent();
    }

    function renderPatchItem(patch, currentPatch) {
        const isCurrent = patch.version === currentPatch || patch.isCurrent;
        const affectedTactics = findAffectedTactics(patch);

        return `
            <div class="timeline-item">
                <div class="timeline-dot ${isCurrent ? 'timeline-dot-current' : ''}"></div>
                <div class="timeline-content">
                    <div class="timeline-header">
                        <span class="timeline-version">${esc(patch.version)}</span>
                        ${isCurrent ? '<span class="badge badge-verified">Current</span>' : ''}
                        <span class="timeline-date">${esc(patch.releaseDate)}</span>
                    </div>

                    ${patch.title ? `<h3 style="font-size:1rem;margin-bottom:8px">${esc(patch.title)}</h3>` : ''}

                    <p style="color:var(--fm26-text-secondary);font-size:0.9rem;line-height:1.6;margin-bottom:12px">
                        ${esc(patch.summary)}
                    </p>

                    ${patch.changeTags?.length ? `
                    <div class="tag-list" style="margin-bottom:12px">
                        ${patch.changeTags.map(tag =>
                            `<span class="tag">${esc(tag)}</span>`
                        ).join('')}
                    </div>` : ''}

                    ${patch.tacticalChanges?.length ? `
                    <div style="margin-bottom:12px">
                        <h4 style="font-size:0.85rem;color:var(--fm26-text-secondary);margin-bottom:8px">Tactical Changes:</h4>
                        ${patch.tacticalChanges.map(change => `
                            <div style="padding:8px 12px;background:var(--fm26-bg-input);border-radius:8px;margin-bottom:6px;border-left:3px solid ${
                                change.impact === 'high' ? 'var(--fm26-accent-danger)' :
                                change.impact === 'medium' ? 'var(--fm26-accent-warning)' : 'var(--fm26-accent-primary)'
                            }">
                                <div style="font-size:0.85rem;font-weight:600;color:var(--fm26-text-primary)">${esc(change.area)}</div>
                                <div style="font-size:0.8rem;color:var(--fm26-text-secondary);margin-top:2px">${esc(change.description)}</div>
                                ${change.affectsStyles?.length ? `
                                <div style="margin-top:4px;display:flex;gap:4px;flex-wrap:wrap">
                                    ${change.affectsStyles.map(s =>
                                        `<span class="badge badge-style" style="font-size:0.7rem">${esc(s)}</span>`
                                    ).join('')}
                                </div>` : ''}
                            </div>
                        `).join('')}
                    </div>` : ''}

                    ${patch.knownIssues?.length ? `
                    <div style="margin-bottom:12px">
                        <h4 style="font-size:0.85rem;color:var(--fm26-accent-warning);margin-bottom:4px">Known Issues:</h4>
                        ${patch.knownIssues.map(issue =>
                            `<div style="font-size:0.8rem;color:var(--fm26-text-muted);padding-left:12px">&bull; ${esc(issue)}</div>`
                        ).join('')}
                    </div>` : ''}

                    ${affectedTactics.length > 0 ? `
                    <div>
                        <button class="btn btn-ghost btn-sm" data-action="toggle-affected" data-target="affected-${esc(patch.version)}">
                            Show affected tactics (${affectedTactics.length})
                        </button>
                        <div id="affected-${esc(patch.version)}" style="display:none;margin-top:8px">
                            ${affectedTactics.map(t => {
                                const ver = DataStore.getTacticVersion(t, patch.version);
                                const status = ver?.patchStatus || 'untested';
                                return `
                                    <a href="#tactic/${t.slug}" style="display:flex;align-items:center;gap:8px;padding:6px 0;font-size:0.85rem;color:var(--fm26-text-primary)">
                                        <span class="badge badge-${status}" style="font-size:0.7rem">${status}</span>
                                        ${esc(t.name)}
                                    </a>
                                `;
                            }).join('')}
                        </div>
                    </div>` : ''}
                </div>
            </div>
        `;
    }

    function findAffectedTactics(patch) {
        // Find tactics that have a version for this patch, or are tagged as affected
        const fromIndex = DataStore.getTacticsAffectedByPatch(patch.version);

        // Also find tactics mentioned in tacticalChanges
        const affectedSlugs = new Set(fromIndex.map(t => t.slug));
        (patch.tacticalChanges || []).forEach(change => {
            (change.affectedTactics || []).forEach(slug => affectedSlugs.add(slug));
        });

        return [...affectedSlugs].map(slug => DataStore.getTactic(slug)).filter(Boolean);
    }

    function esc(str) {
        if (!str) return '';
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    return { render };
})();
