/**
 * SVG Football Pitch Visualizer
 * Renders formations with player dots, roles, and duty colors
 */
const PitchVisualizer = (() => {
    const NS = 'http://www.w3.org/2000/svg';

    // Pitch dimensions
    const PITCH_W = 680;
    const PITCH_H = 1050;
    const MARGIN = 40;
    const FIELD_W = PITCH_W - MARGIN * 2;   // 600
    const FIELD_H = PITCH_H - MARGIN * 2;   // 970

    function createPitchSVG(containerId, positions, options = {}) {
        const container = document.getElementById(containerId);
        if (!container) return null;

        const {
            showRoles = true,
            showDuties = true,
            phase = 'inPossession',
            interactive = false,
            compact = false
        } = options;

        const dutyColors = {
            Attack: DataStore.getDutyColor('Attack') || '#ef4444',
            Support: DataStore.getDutyColor('Support') || '#eab308',
            Defend: DataStore.getDutyColor('Defend') || '#3b82f6'
        };

        const svg = document.createElementNS(NS, 'svg');
        svg.setAttribute('viewBox', `0 0 ${PITCH_W} ${PITCH_H}`);
        svg.setAttribute('class', 'pitch-svg');

        // Pitch background
        svg.appendChild(makeRect(0, 0, PITCH_W, PITCH_H, '#1a472a', null, 12));

        // Grass stripes
        const stripeH = FIELD_H / 10;
        for (let i = 0; i < 10; i++) {
            svg.appendChild(makeRect(
                MARGIN, MARGIN + i * stripeH, FIELD_W, stripeH,
                i % 2 === 0 ? '#1e5631' : '#1a472a'
            ));
        }

        const lineColor = 'rgba(255,255,255,0.45)';
        const lineW = 2;

        // Pitch outline
        svg.appendChild(makeRect(MARGIN, MARGIN, FIELD_W, FIELD_H, null, lineColor, 0, lineW));

        // Centre line
        const midY = MARGIN + FIELD_H / 2;
        svg.appendChild(makeLine(MARGIN, midY, MARGIN + FIELD_W, midY, lineColor, lineW));

        // Centre circle
        svg.appendChild(makeCircle(PITCH_W / 2, midY, 91.5, null, lineColor, lineW));
        svg.appendChild(makeCircle(PITCH_W / 2, midY, 3, lineColor));

        // --- Top (attacking) end ---
        svg.appendChild(makeRect(178, MARGIN, 324, 165, null, lineColor, 0, lineW));
        svg.appendChild(makeRect(250, MARGIN, 180, 55, null, lineColor, 0, lineW));
        svg.appendChild(makeCircle(PITCH_W / 2, MARGIN + 120, 3, lineColor));
        svg.appendChild(makeArc(PITCH_W / 2, MARGIN + 165, 91.5, 0.65, 2.49, lineColor, lineW));

        // --- Bottom (GK) end ---
        svg.appendChild(makeRect(178, MARGIN + FIELD_H - 165, 324, 165, null, lineColor, 0, lineW));
        svg.appendChild(makeRect(250, MARGIN + FIELD_H - 55, 180, 55, null, lineColor, 0, lineW));
        svg.appendChild(makeCircle(PITCH_W / 2, MARGIN + FIELD_H - 120, 3, lineColor));
        svg.appendChild(makeArc(PITCH_W / 2, MARGIN + FIELD_H - 165, 91.5, 3.79, 5.63, lineColor, lineW));

        // Corner arcs
        const cR = 12;
        svg.appendChild(makeArc(MARGIN, MARGIN, cR, 0, Math.PI / 2, lineColor, lineW));
        svg.appendChild(makeArc(MARGIN + FIELD_W, MARGIN, cR, Math.PI / 2, Math.PI, lineColor, lineW));
        svg.appendChild(makeArc(MARGIN, MARGIN + FIELD_H, cR, -Math.PI / 2, 0, lineColor, lineW));
        svg.appendChild(makeArc(MARGIN + FIELD_W, MARGIN + FIELD_H, cR, Math.PI, 3 * Math.PI / 2, lineColor, lineW));

        // Player positions
        if (positions && positions.length > 0) {
            const dotR = compact ? 20 : 24;
            const labelSize = compact ? 12 : 14;
            const roleSize = compact ? 11 : 13;
            const dutySize = compact ? 10 : 11;

            positions.forEach(pos => {
                const px = MARGIN + (pos.x / 100) * FIELD_W;
                const py = MARGIN + (pos.y / 100) * FIELD_H;
                const color = dutyColors[pos.duty] || '#ffffff';

                const g = document.createElementNS(NS, 'g');
                g.setAttribute('class', 'player-dot');
                if (interactive) {
                    g.style.cursor = 'pointer';
                    g.dataset.slot = pos.slotId;
                }

                // Outer glow
                const glow = makeCircle(px, py, dotR + 6, null, color, 2.5);
                glow.setAttribute('opacity', '0.35');
                g.appendChild(glow);

                // Main dot with solid fill
                g.appendChild(makeCircle(px, py, dotR, color, 'rgba(0,0,0,0.4)', 2));

                // Position label (e.g. "GK", "DC", "MC") — white, bold, inside dot
                const posLabel = makeText(px, py + (labelSize * 0.35), pos.label || '', '#fff', labelSize, '800');
                posLabel.setAttribute('stroke', 'rgba(0,0,0,0.5)');
                posLabel.setAttribute('stroke-width', '0.5');
                g.appendChild(posLabel);

                // Role label below dot — on a dark pill background for readability
                if (showRoles && pos.role && !compact) {
                    const roleStr = truncRole(pos.role);
                    const roleBgW = Math.max(roleStr.length * 8.5, 50);
                    const roleBgH = 22;
                    const roleY = py + dotR + 14;

                    // Dark background pill
                    const bg = makeRect(px - roleBgW / 2, roleY - roleBgH / 2 - 2, roleBgW, roleBgH, 'rgba(0,0,0,0.7)', null, 6);
                    g.appendChild(bg);

                    // Role text
                    const roleText = makeText(px, roleY + 4, roleStr, '#ffffff', roleSize, '600');
                    g.appendChild(roleText);
                }

                // Duty letter below role
                if (showDuties && pos.duty && !compact) {
                    const yOff = showRoles && pos.role ? (dotR + 36) : (dotR + 14);
                    const dutyChar = pos.duty[0]; // A, S, or D
                    const dutyText = makeText(px, py + yOff, `(${dutyChar})`, color, dutySize, '700');
                    dutyText.setAttribute('stroke', 'rgba(0,0,0,0.4)');
                    dutyText.setAttribute('stroke-width', '0.3');
                    g.appendChild(dutyText);
                }

                svg.appendChild(g);
            });
        }

        // Phase label banner at top
        const phaseLabel = phase === 'inPossession' ? 'IN POSSESSION' : 'OUT OF POSSESSION';
        const phaseBgW = 240;
        svg.appendChild(makeRect((PITCH_W - phaseBgW) / 2, 4, phaseBgW, 30, 'rgba(0,0,0,0.7)', null, 8));
        svg.appendChild(makeText(PITCH_W / 2, 25, phaseLabel, '#ffffff', 13, '700'));

        container.innerHTML = '';
        container.appendChild(svg);
        return svg;
    }

    // Convert formation data + template to renderable positions
    function formationToPositions(formationData, metaFormations) {
        if (!formationData || !formationData.positions) return [];
        const template = metaFormations?.[formationData.shape];
        if (!template) return [];

        return formationData.positions.map(pos => {
            const slot = template.positionSlots.find(s => s.id === pos.slotId);
            return {
                slotId: pos.slotId,
                label: slot?.label || pos.slotId,
                x: slot?.x ?? 50,
                y: slot?.y ?? 50,
                role: pos.role,
                duty: pos.duty
            };
        });
    }

    // Render dual formation (IP + OOP) — desktop only
    function renderDualFormation(containerId, version, meta) {
        const container = document.getElementById(containerId);
        if (!container || !version) return;

        const formations = meta?.formations || {};
        const ipPositions = formationToPositions(version.formation?.inPossession, formations);
        const oopPositions = formationToPositions(version.formation?.outOfPossession, formations);

        const ipShape = version.formation?.inPossession?.shape || 'N/A';
        const oopShape = version.formation?.outOfPossession?.shape || 'N/A';

        container.innerHTML = `
            <div class="dual-formation">
                <div class="pitch-container">
                    <span class="pitch-label">In Possession (${ipShape})</span>
                    <div id="${containerId}-ip"></div>
                </div>
                <div class="pitch-container">
                    <span class="pitch-label">Out of Possession (${oopShape})</span>
                    <div id="${containerId}-oop"></div>
                </div>
            </div>
            <div class="mobile-formation">
                <div class="pitch-container">
                    <div class="phase-toggle" id="${containerId}-mob-toggle">
                        <button class="phase-toggle-btn active" data-phase="inPossession">In Possession</button>
                        <button class="phase-toggle-btn" data-phase="outOfPossession">Out of Possession</button>
                    </div>
                    <span class="pitch-label" id="${containerId}-mob-label">${ipShape}</span>
                    <div id="${containerId}-mob-pitch"></div>
                </div>
            </div>
        `;

        // Desktop: render both
        createPitchSVG(`${containerId}-ip`, ipPositions, { phase: 'inPossession' });
        createPitchSVG(`${containerId}-oop`, oopPositions, { phase: 'outOfPossession' });

        // Mobile: render toggle version
        createPitchSVG(`${containerId}-mob-pitch`, ipPositions, { phase: 'inPossession' });

        // Bind mobile toggle
        const toggle = document.getElementById(`${containerId}-mob-toggle`);
        if (toggle) {
            toggle.querySelectorAll('.phase-toggle-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    toggle.querySelectorAll('.phase-toggle-btn').forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    const phase = btn.dataset.phase;
                    const data = phase === 'inPossession' ? version.formation?.inPossession : version.formation?.outOfPossession;
                    const pos = formationToPositions(data, formations);
                    createPitchSVG(`${containerId}-mob-pitch`, pos, { phase });
                    const label = document.getElementById(`${containerId}-mob-label`);
                    if (label) label.textContent = data?.shape || 'N/A';
                });
            });
        }
    }

    // Render single formation with phase toggle (standalone use)
    function renderToggleFormation(containerId, version, meta) {
        const container = document.getElementById(containerId);
        if (!container || !version) return;

        const formations = meta?.formations || {};
        let currentPhase = 'inPossession';

        function renderPhase(phase) {
            const formData = phase === 'inPossession'
                ? version.formation?.inPossession
                : version.formation?.outOfPossession;
            const positions = formationToPositions(formData, formations);
            const shape = formData?.shape || 'N/A';

            const pitchDiv = document.getElementById(`${containerId}-pitch`);
            const label = document.getElementById(`${containerId}-label`);
            if (pitchDiv) createPitchSVG(`${containerId}-pitch`, positions, { phase });
            if (label) label.textContent = shape;
        }

        container.innerHTML = `
            <div class="pitch-container">
                <div class="phase-toggle">
                    <button class="phase-toggle-btn active" data-phase="inPossession">In Possession</button>
                    <button class="phase-toggle-btn" data-phase="outOfPossession">Out of Possession</button>
                </div>
                <span class="pitch-label" id="${containerId}-label"></span>
                <div id="${containerId}-pitch"></div>
            </div>
        `;

        container.querySelectorAll('.phase-toggle-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                currentPhase = btn.dataset.phase;
                container.querySelectorAll('.phase-toggle-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                renderPhase(currentPhase);
            });
        });

        renderPhase(currentPhase);
    }

    // Truncate long role names
    function truncRole(role) {
        const abbr = {
            'Ball-Playing Defender': 'BPD',
            'Central Defender': 'CD',
            'Ball-Winning Midfielder': 'BWM',
            'Deep-Lying Playmaker': 'DLP',
            'Box-to-Box Midfielder': 'BBM',
            'Advanced Playmaker': 'AP',
            'Inside Forward': 'IF',
            'Inverted Winger': 'IW',
            'Pressing Forward': 'PF',
            'Advanced Forward': 'AF',
            'Complete Forward': 'CF',
            'Deep-Lying Forward': 'DLF',
            'Shadow Striker': 'SS',
            'Wide Midfielder': 'WM',
            'Defensive Forward': 'DF',
            'Target Man': 'TM',
            'Inverted Wing-Back': 'IWB',
            'Central Midfielder': 'CM',
            'Wing-Back': 'WB',
            'Full-Back': 'FB',
            'Anchor Man': 'ANC',
            'Mezzala': 'MEZ',
            'Trequartista': 'TRQ',
            'Regista': 'REG',
            'Segundo Volante': 'VOL',
            'Roaming Playmaker': 'RPM',
            'Defensive Midfielder': 'DM',
            'Libero': 'LIB',
            'No-Nonsense CB': 'NNCB',
            'Wide Centre-Back': 'WCB',
            'Complete Wing-Back': 'CWB'
        };
        if (abbr[role]) return abbr[role];
        if (role.length <= 12) return role;
        return role.substring(0, 10) + '..';
    }

    // --- SVG Helpers ---
    function makeRect(x, y, w, h, fill, stroke, rx, strokeW) {
        const r = document.createElementNS(NS, 'rect');
        r.setAttribute('x', x);
        r.setAttribute('y', y);
        r.setAttribute('width', w);
        r.setAttribute('height', h);
        r.setAttribute('fill', fill || 'none');
        if (stroke) {
            r.setAttribute('stroke', stroke);
            r.setAttribute('stroke-width', strokeW || 1);
        }
        if (rx) r.setAttribute('rx', rx);
        return r;
    }

    function makeLine(x1, y1, x2, y2, stroke, w) {
        const l = document.createElementNS(NS, 'line');
        l.setAttribute('x1', x1); l.setAttribute('y1', y1);
        l.setAttribute('x2', x2); l.setAttribute('y2', y2);
        l.setAttribute('stroke', stroke);
        l.setAttribute('stroke-width', w);
        return l;
    }

    function makeCircle(cx, cy, r, fill, stroke, strokeW) {
        const c = document.createElementNS(NS, 'circle');
        c.setAttribute('cx', cx); c.setAttribute('cy', cy); c.setAttribute('r', r);
        c.setAttribute('fill', fill || 'none');
        if (stroke) {
            c.setAttribute('stroke', stroke);
            c.setAttribute('stroke-width', strokeW || 1);
        }
        return c;
    }

    function makeArc(cx, cy, r, start, end, stroke, strokeW) {
        const x1 = cx + r * Math.cos(start);
        const y1 = cy + r * Math.sin(start);
        const x2 = cx + r * Math.cos(end);
        const y2 = cy + r * Math.sin(end);
        const large = (end - start) > Math.PI ? 1 : 0;
        const p = document.createElementNS(NS, 'path');
        p.setAttribute('d', `M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2}`);
        p.setAttribute('fill', 'none');
        p.setAttribute('stroke', stroke);
        p.setAttribute('stroke-width', strokeW);
        return p;
    }

    function makeText(x, y, content, fill, size, weight) {
        const t = document.createElementNS(NS, 'text');
        t.setAttribute('x', x); t.setAttribute('y', y);
        t.setAttribute('fill', fill);
        t.setAttribute('font-size', size);
        t.setAttribute('font-weight', weight || 'normal');
        t.setAttribute('text-anchor', 'middle');
        t.setAttribute('font-family', "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif");
        t.textContent = content;
        return t;
    }

    return {
        createPitchSVG, formationToPositions,
        renderDualFormation, renderToggleFormation
    };
})();
