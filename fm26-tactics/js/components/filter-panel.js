/**
 * Filter Panel Component - Reusable filter sidebar builder
 */
const FilterPanel = (() => {

    function renderChips(items, filterKey, activeValues) {
        const active = Array.isArray(activeValues) ? activeValues : (activeValues ? [activeValues] : []);
        return items.map(item => {
            const isActive = active.includes(item);
            return `<button class="chip ${isActive ? 'active' : ''}" data-filter="${filterKey}" data-value="${esc(item)}">${esc(item)}</button>`;
        }).join('');
    }

    function renderSelect(options, id, currentValue, placeholder) {
        return `
            <select id="${id}" class="select">
                <option value="">${placeholder || 'Any'}</option>
                ${options.map(opt =>
                    `<option value="${esc(opt)}" ${opt === currentValue ? 'selected' : ''}>${esc(opt)}</option>`
                ).join('')}
            </select>
        `;
    }

    function esc(str) {
        if (!str) return '';
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    return { renderChips, renderSelect };
})();
