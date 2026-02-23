/**
 * Search & Filter Engine - In-memory faceted search for tactics
 */
const SearchEngine = (() => {

    function filterTactics(tactics, filters) {
        return tactics.filter(t => {
            // Text search
            if (filters.query) {
                const q = filters.query.toLowerCase();
                const haystack = [
                    t.name, t.author, t.description, t.shortDescription,
                    t.formationFamily, t.primaryStyle, ...(t.styleTags || [])
                ].filter(Boolean).join(' ').toLowerCase();
                if (!haystack.includes(q)) return false;
            }

            // Formation family
            if (filters.formation && t.formationFamily !== filters.formation) return false;

            // Style tags (match any selected)
            if (filters.styleTags && filters.styleTags.length > 0) {
                if (!filters.styleTags.some(tag => (t.styleTags || []).includes(tag))) return false;
            }

            // Intensity
            if (filters.intensity && t.intensity !== filters.intensity) return false;

            // Mentality
            if (filters.mentality && t.mentality !== filters.mentality) return false;

            // Patch version
            if (filters.patchVersion) {
                if (!(t.versions || []).some(v => v.patchVersion === filters.patchVersion)) return false;
            }

            // Budget tier
            if (filters.budgetTier && t.budgetTier !== filters.budgetTier) return false;

            // Status
            if (filters.status && t.status !== filters.status) return false;

            // Patch status (verified/outdated/untested on a given patch)
            if (filters.patchStatus && filters.patchVersion) {
                const ver = (t.versions || []).find(v => v.patchVersion === filters.patchVersion);
                if (!ver || ver.patchStatus !== filters.patchStatus) return false;
            }

            return true;
        });
    }

    function sortTactics(tactics, sortBy, currentPatch) {
        const copy = [...tactics];
        switch (sortBy) {
            case 'name-asc':
                return copy.sort((a, b) => a.name.localeCompare(b.name));
            case 'name-desc':
                return copy.sort((a, b) => b.name.localeCompare(a.name));
            case 'newest':
                return copy.sort((a, b) => new Date(b.updatedDate) - new Date(a.updatedDate));
            case 'oldest':
                return copy.sort((a, b) => new Date(a.updatedDate) - new Date(b.updatedDate));
            case 'ppg':
                return copy.sort((a, b) => getTopPPG(b, currentPatch) - getTopPPG(a, currentPatch));
            case 'win-rate':
                return copy.sort((a, b) => getTopStat(b, currentPatch, 'winRate') - getTopStat(a, currentPatch, 'winRate'));
            default:
                return copy;
        }
    }

    function getTopPPG(tactic, currentPatch) {
        const ver = (tactic.versions || []).find(v => v.patchVersion === currentPatch)
            || (tactic.versions || [])[0];
        const ev = (ver?.evidence || [])[0];
        return ev?.stats?.ppg || 0;
    }

    function getTopStat(tactic, currentPatch, stat) {
        const ver = (tactic.versions || []).find(v => v.patchVersion === currentPatch)
            || (tactic.versions || [])[0];
        const ev = (ver?.evidence || [])[0];
        return ev?.stats?.[stat] || 0;
    }

    function getFilterCounts(tactics) {
        const counts = {
            formations: {},
            styleTags: {},
            intensities: {},
            patches: {},
            budgetTiers: {},
            mentalities: {}
        };

        tactics.forEach(t => {
            if (t.formationFamily) {
                counts.formations[t.formationFamily] = (counts.formations[t.formationFamily] || 0) + 1;
            }
            (t.styleTags || []).forEach(tag => {
                counts.styleTags[tag] = (counts.styleTags[tag] || 0) + 1;
            });
            if (t.intensity) {
                counts.intensities[t.intensity] = (counts.intensities[t.intensity] || 0) + 1;
            }
            (t.versions || []).forEach(v => {
                counts.patches[v.patchVersion] = (counts.patches[v.patchVersion] || 0) + 1;
            });
            if (t.budgetTier) {
                counts.budgetTiers[t.budgetTier] = (counts.budgetTiers[t.budgetTier] || 0) + 1;
            }
            if (t.mentality) {
                counts.mentalities[t.mentality] = (counts.mentalities[t.mentality] || 0) + 1;
            }
        });

        return counts;
    }

    function filterGlossary(terms, query, category) {
        return terms.filter(t => {
            if (category && category !== 'All' && t.category !== category) return false;
            if (query) {
                const q = query.toLowerCase();
                const haystack = [t.term, ...(t.aliases || []), t.definition, t.fmContext]
                    .filter(Boolean).join(' ').toLowerCase();
                if (!haystack.includes(q)) return false;
            }
            return true;
        });
    }

    return { filterTactics, sortTactics, getFilterCounts, filterGlossary };
})();
