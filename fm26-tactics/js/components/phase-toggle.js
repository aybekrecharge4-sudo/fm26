/**
 * Phase Toggle Component - IP/OOP tab switcher
 */
const PhaseToggle = (() => {

    function render(containerId, onChange) {
        const container = document.getElementById(containerId);
        if (!container) return;

        container.innerHTML = `
            <div class="phase-toggle">
                <button class="phase-toggle-btn active" data-phase="inPossession">In Possession</button>
                <button class="phase-toggle-btn" data-phase="outOfPossession">Out of Possession</button>
            </div>
        `;

        container.querySelectorAll('.phase-toggle-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                container.querySelectorAll('.phase-toggle-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                if (onChange) onChange(btn.dataset.phase);
            });
        });
    }

    return { render };
})();
