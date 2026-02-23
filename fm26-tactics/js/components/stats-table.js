/**
 * Stats Table / Bar Component
 */
const StatsTable = (() => {

    const STAT_CONFIG = [
        { key: 'ppg', label: 'Points Per Game', max: 3, decimals: 2, suffix: '' },
        { key: 'winRate', label: 'Win Rate', max: 100, decimals: 0, suffix: '%' },
        { key: 'goalsFor', label: 'Goals For', max: 120, decimals: 0, suffix: '' },
        { key: 'goalsAgainst', label: 'Goals Against', max: 120, decimals: 0, suffix: '', inverted: true },
        { key: 'goalDifference', label: 'Goal Difference', max: 80, decimals: 0, suffix: '', signed: true },
        { key: 'xGFor', label: 'xG For', max: 120, decimals: 1, suffix: '' },
        { key: 'xGAgainst', label: 'xG Against', max: 120, decimals: 1, suffix: '', inverted: true },
        { key: 'possession', label: 'Possession', max: 100, decimals: 0, suffix: '%' },
        { key: 'passCompletion', label: 'Pass Completion', max: 100, decimals: 0, suffix: '%' },
        { key: 'shotsFor', label: 'Shots For', max: 800, decimals: 0, suffix: '' },
        { key: 'shotsAgainst', label: 'Shots Against', max: 800, decimals: 0, suffix: '', inverted: true },
    ];

    function renderStatBars(evidence, containerId) {
        const container = document.getElementById(containerId);
        if (!container || !evidence) {
            if (container) container.innerHTML = '<div class="empty-state">No evidence data available.</div>';
            return;
        }

        const stats = evidence.stats || {};
        let html = '';

        // Context bar
        if (evidence.context) {
            html += `<div class="evidence-context">${esc(evidence.context)}</div>`;
        }

        // Source info
        html += `<div class="evidence-source">
            ${esc(evidence.type.replace(/-/g, ' '))}
            ${evidence.matchCount ? `&middot; ${evidence.matchCount} matches` : ''}
            ${evidence.source ? `&middot; ${esc(evidence.source)}` : ''}
        </div>`;

        html += '<div class="stats-grid" style="margin-top:16px">';

        STAT_CONFIG.forEach(cfg => {
            const val = stats[cfg.key];
            if (val == null) return;

            const displayVal = cfg.signed && val > 0 ? `+${val}` : val;
            const barVal = cfg.signed ? Math.abs(val) : val;
            const pct = Math.min((barVal / cfg.max) * 100, 100);
            const barColor = cfg.inverted
                ? (val > cfg.max * 0.5 ? 'var(--fm26-accent-danger)' : 'var(--fm26-accent-primary)')
                : 'var(--fm26-accent-primary)';

            html += `
                <div class="stat-bar-container">
                    <div class="stat-bar-header">
                        <span class="stat-bar-label">${cfg.label}</span>
                        <span class="stat-bar-value">${typeof val === 'number' ? Number(val).toFixed(cfg.decimals) : val}${cfg.suffix}</span>
                    </div>
                    <div class="stat-bar">
                        <div class="stat-bar-fill" style="width:${pct}%;background:${barColor}"></div>
                    </div>
                </div>
            `;
        });

        html += '</div>';

        // Notes
        if (evidence.notes) {
            html += `<p style="margin-top:16px;font-size:0.85rem;color:var(--fm26-text-muted);font-style:italic">${esc(evidence.notes)}</p>`;
        }

        container.innerHTML = html;
    }

    // Comparison table between two stat sets
    function renderComparison(statsA, statsB, containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        let html = '';

        STAT_CONFIG.forEach(cfg => {
            const a = statsA?.[cfg.key];
            const b = statsB?.[cfg.key];
            if (a == null && b == null) return;

            const aVal = a != null ? Number(a).toFixed(cfg.decimals) + cfg.suffix : '--';
            const bVal = b != null ? Number(b).toFixed(cfg.decimals) + cfg.suffix : '--';

            let deltaClass = 'compare-delta-neutral';
            let deltaText = '--';
            if (a != null && b != null) {
                const diff = a - b;
                if (cfg.inverted) {
                    deltaClass = diff < 0 ? 'compare-delta-positive' : diff > 0 ? 'compare-delta-negative' : 'compare-delta-neutral';
                } else {
                    deltaClass = diff > 0 ? 'compare-delta-positive' : diff < 0 ? 'compare-delta-negative' : 'compare-delta-neutral';
                }
                const absDiff = Math.abs(diff).toFixed(cfg.decimals);
                deltaText = diff > 0 ? `+${absDiff}` : diff < 0 ? `-${absDiff}` : '0';
            }

            html += `
                <div class="compare-stat-row">
                    <span class="compare-stat-value compare-stat-value-left">${aVal}</span>
                    <span></span>
                    <span class="compare-stat-label">${cfg.label}</span>
                    <span class="compare-delta ${deltaClass}">${deltaText}</span>
                    <span class="compare-stat-value compare-stat-value-right">${bVal}</span>
                </div>
            `;
        });

        container.innerHTML = html || '<div class="empty-state">No stats to compare.</div>';
    }

    function esc(str) {
        if (!str) return '';
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    return { renderStatBars, renderComparison, STAT_CONFIG };
})();
