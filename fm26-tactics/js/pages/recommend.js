/**
 * Recommendation Flow Page - "Find Your Tactic" wizard
 */
const RecommendPage = (() => {
    const steps = [
        { key: 'formation', title: 'Formation Preference', subtitle: 'What formation family do you prefer?' },
        { key: 'style', title: 'Playing Style', subtitle: 'How do you want your team to play?' },
        { key: 'intensity', title: 'Pressing Intensity', subtitle: 'How aggressively should your team press?' },
        { key: 'budget', title: 'Team Level', subtitle: 'What level is your team?' },
    ];

    let currentStep = 0;
    let selections = {};

    function render(params, container) {
        currentStep = 0;
        selections = {};

        container.innerHTML = `
            <div class="page-header" style="text-align:center">
                <h1 class="page-title">Find Your Tactic</h1>
                <p class="page-subtitle">Answer a few questions and we'll recommend the best tactics for you</p>
            </div>
            <div class="wizard" id="wizardContainer"></div>
        `;

        renderStep();
    }

    function renderStep() {
        const wizardEl = document.getElementById('wizardContainer');
        if (!wizardEl) return;

        if (currentStep >= steps.length) {
            renderResults(wizardEl);
            return;
        }

        const step = steps[currentStep];
        const options = getOptionsForStep(step.key);
        const matchCount = countMatches();

        wizardEl.innerHTML = `
            <div class="wizard-progress">
                ${steps.map((s, i) => `
                    <div class="wizard-progress-step ${i < currentStep ? 'completed' : i === currentStep ? 'current' : ''}"></div>
                `).join('')}
            </div>

            <div class="wizard-step-title">${step.title}</div>
            <div class="wizard-step-subtitle">${step.subtitle}</div>

            <div class="wizard-options">
                <button class="wizard-option ${!selections[step.key] ? 'selected' : ''}" data-value="">No Preference</button>
                ${options.map(opt =>
                    `<button class="wizard-option ${selections[step.key] === opt ? 'selected' : ''}" data-value="${esc(opt)}">${esc(opt)}</button>`
                ).join('')}
            </div>

            <div class="wizard-match-count">
                <strong>${matchCount}</strong> tactics match your criteria
            </div>

            <div class="wizard-nav">
                ${currentStep > 0
                    ? '<button class="btn btn-secondary" id="wizardBack">Back</button>'
                    : '<div></div>'}
                <button class="btn btn-primary" id="wizardNext">${currentStep === steps.length - 1 ? 'Show Results' : 'Next'}</button>
            </div>
        `;

        // Bind option clicks
        wizardEl.querySelectorAll('.wizard-option').forEach(opt => {
            opt.addEventListener('click', () => {
                wizardEl.querySelectorAll('.wizard-option').forEach(o => o.classList.remove('selected'));
                opt.classList.add('selected');
                selections[step.key] = opt.dataset.value || undefined;
                // Update match count
                const countEl = wizardEl.querySelector('.wizard-match-count strong');
                if (countEl) countEl.textContent = countMatches();
            });
        });

        // Nav buttons
        const backBtn = document.getElementById('wizardBack');
        if (backBtn) {
            backBtn.addEventListener('click', () => {
                currentStep--;
                renderStep();
            });
        }

        const nextBtn = document.getElementById('wizardNext');
        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                currentStep++;
                renderStep();
            });
        }

        Router.postHeightToParent();
    }

    function renderResults(wizardEl) {
        const currentPatch = DataStore.getCurrentPatch();
        const filters = {};
        if (selections.formation) filters.formation = selections.formation;
        if (selections.style) filters.styleTags = [selections.style];
        if (selections.intensity) filters.intensity = selections.intensity;
        if (selections.budget) filters.budgetTier = selections.budget;

        let results = SearchEngine.filterTactics(DataStore.getTactics(), filters);
        results = SearchEngine.sortTactics(results, 'ppg', currentPatch);

        wizardEl.innerHTML = `
            <div class="wizard-progress">
                ${steps.map(() => '<div class="wizard-progress-step completed"></div>').join('')}
            </div>

            <div class="wizard-step-title">Your Recommended Tactics</div>
            <div class="wizard-step-subtitle">
                ${results.length} tactic${results.length !== 1 ? 's' : ''} match your preferences
                ${buildFilterSummary()}
            </div>

            ${results.length > 0 ? `
            <div class="recommend-results">
                ${results.map((t, i) => {
                    const version = DataStore.getTacticCurrentVersion(t);
                    const evidence = DataStore.getBestEvidence(version);
                    const ppg = evidence?.stats?.ppg;

                    return `
                        <div class="recommend-result-card" onclick="Router.navigate('tactic/${t.slug}')">
                            <div class="recommend-rank">#${i + 1}</div>
                            <div class="recommend-result-info">
                                <div class="recommend-result-name">${esc(t.name)}</div>
                                <div class="recommend-result-desc">
                                    ${esc(t.formationFamily)} &middot; ${esc(t.primaryStyle)}
                                    ${t.intensity ? ` &middot; ${esc(t.intensity)}` : ''}
                                </div>
                            </div>
                            <div class="recommend-result-ppg">
                                <div class="recommend-result-ppg-value">${ppg ? ppg.toFixed(2) : '--'}</div>
                                <div class="recommend-result-ppg-label">PPG</div>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>` : `
            <div class="empty-state" style="margin-top:32px">
                <div class="empty-state-icon">&#128533;</div>
                <p>No tactics match all your criteria.</p>
                <p style="margin-top:8px;font-size:0.85rem">Try removing some filters or go back.</p>
            </div>`}

            <div class="wizard-nav" style="margin-top:32px">
                <button class="btn btn-secondary" id="wizardRestart">Start Over</button>
                <a href="#library" class="btn btn-primary">Browse All Tactics</a>
            </div>
        `;

        const restartBtn = document.getElementById('wizardRestart');
        if (restartBtn) {
            restartBtn.addEventListener('click', () => {
                currentStep = 0;
                selections = {};
                renderStep();
            });
        }

        Router.postHeightToParent();
    }

    function getOptionsForStep(key) {
        switch (key) {
            case 'formation': return DataStore.getAllFormations();
            case 'style': return DataStore.getAllStyleTags();
            case 'intensity': return DataStore.getAllIntensityLevels();
            case 'budget': return DataStore.getAllBudgetTiers();
            default: return [];
        }
    }

    function countMatches() {
        const filters = {};
        if (selections.formation) filters.formation = selections.formation;
        if (selections.style) filters.styleTags = [selections.style];
        if (selections.intensity) filters.intensity = selections.intensity;
        if (selections.budget) filters.budgetTier = selections.budget;
        return SearchEngine.filterTactics(DataStore.getTactics(), filters).length;
    }

    function buildFilterSummary() {
        const parts = [];
        if (selections.formation) parts.push(selections.formation);
        if (selections.style) parts.push(selections.style);
        if (selections.intensity) parts.push(selections.intensity);
        if (selections.budget) parts.push(selections.budget);
        return parts.length > 0 ? `(${parts.join(' / ')})` : '';
    }

    function esc(str) {
        if (!str) return '';
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    return { render };
})();
