/**
 * Tactic Card Component - Grid card for the library
 */
const TacticCard = (() => {

    function render(tactic) {
        const currentPatch = DataStore.getCurrentPatch();
        const version = DataStore.getTacticCurrentVersion(tactic);
        const evidence = DataStore.getBestEvidence(version);
        const stats = evidence?.stats || {};

        const patchStatus = version?.patchStatus || 'untested';
        const patchBadgeClass = `badge-${patchStatus}`;
        const patchLabel = patchStatus === 'verified' ? 'Verified'
            : patchStatus === 'outdated' ? 'Outdated' : 'Untested';

        const ppg = stats.ppg ? stats.ppg.toFixed(2) : '--';
        const winRate = stats.winRate != null ? stats.winRate + '%' : '--';
        const gd = stats.goalDifference != null ? (stats.goalDifference > 0 ? '+' : '') + stats.goalDifference : '--';

        return `
            <div class="tactic-card" onclick="Router.navigate('tactic/${tactic.slug}')">
                <div class="tactic-card-header">
                    <div>
                        <div class="tactic-card-name">${esc(tactic.name)}</div>
                        <div class="tactic-card-author">by ${esc(tactic.author)}</div>
                    </div>
                    <span class="badge ${patchBadgeClass}">${patchLabel}</span>
                </div>
                <div class="tactic-card-desc">${esc(tactic.shortDescription || tactic.description)}</div>
                <div class="tactic-card-meta">
                    <span class="badge badge-formation">${esc(tactic.formationFamily)}</span>
                    <span class="badge badge-style">${esc(tactic.primaryStyle)}</span>
                    ${tactic.intensity ? `<span class="badge badge-intensity">${esc(tactic.intensity)}</span>` : ''}
                </div>
                <div class="tactic-card-stats">
                    <div class="tactic-card-stat">
                        <div class="tactic-card-stat-value">${ppg}</div>
                        <div class="tactic-card-stat-label">PPG</div>
                    </div>
                    <div class="tactic-card-stat">
                        <div class="tactic-card-stat-value">${winRate}</div>
                        <div class="tactic-card-stat-label">Win Rate</div>
                    </div>
                    <div class="tactic-card-stat">
                        <div class="tactic-card-stat-value">${gd}</div>
                        <div class="tactic-card-stat-label">GD</div>
                    </div>
                    ${stats.possession != null ? `
                    <div class="tactic-card-stat">
                        <div class="tactic-card-stat-value">${stats.possession}%</div>
                        <div class="tactic-card-stat-label">Poss</div>
                    </div>` : ''}
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
