/**
 * Data Layer - Fetch, cache, and index tactic data from GitHub
 */
const DataStore = (() => {
    let tactics = [];
    let glossary = [];
    let patches = [];
    let meta = {};
    let loaded = false;

    // Indices built after load
    let tacticIndex = {};
    let tagIndex = {};
    let formationIndex = {};
    let patchIndex = {};
    let glossaryIndex = {};
    let glossaryCategoryIndex = {};

    const CACHE_KEY = 'fm26_tactics_cache';
    const CACHE_TTL = 3600000; // 1 hour

    // GitHub repo coordinates — change these if you fork the repo
    const GITHUB_USER = 'aybekrecharge4-sudo';
    const GITHUB_REPO = 'fm26';
    const GITHUB_BRANCH = 'main';
    const DATA_PATH = 'fm26-tactics/data';

    function getBaseUrl() {
        // Local dev: relative paths
        if (location.hostname === 'localhost' || location.hostname === '127.0.0.1' || location.protocol === 'file:') {
            return './data';
        }
        // Production: jsdelivr CDN (fast, cached globally)
        return `https://cdn.jsdelivr.net/gh/${GITHUB_USER}/${GITHUB_REPO}@${GITHUB_BRANCH}/${DATA_PATH}`;
    }

    function getFallbackUrl() {
        // Raw GitHub as fallback
        return `https://raw.githubusercontent.com/${GITHUB_USER}/${GITHUB_REPO}/${GITHUB_BRANCH}/${DATA_PATH}`;
    }

    async function fetchJson(filename) {
        const primary = `${getBaseUrl()}/${filename}`;
        try {
            const res = await fetch(primary);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            return await res.json();
        } catch (e) {
            console.warn(`Primary fetch failed for ${filename}:`, e.message);
            const fallback = `${getFallbackUrl()}/${filename}`;
            if (fallback !== primary) {
                const res = await fetch(fallback);
                if (!res.ok) throw new Error(`Fallback also failed: HTTP ${res.status}`);
                return await res.json();
            }
            throw e;
        }
    }

    async function loadAll() {
        // Try cache first
        try {
            const cached = localStorage.getItem(CACHE_KEY);
            if (cached) {
                const data = JSON.parse(cached);
                if (data.dataVersion && Date.now() - data.timestamp < CACHE_TTL) {
                    // Quick check if data version changed
                    try {
                        const metaFresh = await fetchJson('meta.json');
                        if (data.dataVersion === metaFresh.siteConfig?.dataVersion) {
                            meta = data.meta;
                            tactics = data.tactics;
                            glossary = data.glossary;
                            patches = data.patches;
                            buildIndices();
                            loaded = true;
                            return;
                        }
                        meta = metaFresh;
                    } catch (e) {
                        // If meta check fails, use cache anyway
                        meta = data.meta;
                        tactics = data.tactics;
                        glossary = data.glossary;
                        patches = data.patches;
                        buildIndices();
                        loaded = true;
                        return;
                    }
                }
            }
        } catch (e) {
            // Cache miss or corrupt, continue to fetch
        }

        // Fetch all in parallel
        const [metaData, tacticsData, glossaryData, patchesData] = await Promise.all([
            meta.siteConfig ? Promise.resolve(meta) : fetchJson('meta.json'),
            fetchJson('tactics.json'),
            fetchJson('glossary.json'),
            fetchJson('patches.json')
        ]);

        meta = metaData;
        tactics = tacticsData.tactics || [];
        glossary = glossaryData.terms || [];
        patches = patchesData.patches || [];

        // Save to cache
        try {
            localStorage.setItem(CACHE_KEY, JSON.stringify({
                meta, tactics, glossary, patches,
                dataVersion: meta.siteConfig?.dataVersion || 1,
                timestamp: Date.now()
            }));
        } catch (e) {
            // Storage full, ignore
        }

        buildIndices();
        loaded = true;
    }

    function buildIndices() {
        tacticIndex = {};
        tagIndex = {};
        formationIndex = {};
        patchIndex = {};
        glossaryIndex = {};
        glossaryCategoryIndex = {};

        tactics.forEach(t => {
            tacticIndex[t.slug] = t;

            (t.styleTags || []).forEach(tag => {
                if (!tagIndex[tag]) tagIndex[tag] = [];
                tagIndex[tag].push(t.slug);
            });

            if (t.formationFamily) {
                if (!formationIndex[t.formationFamily]) formationIndex[t.formationFamily] = [];
                formationIndex[t.formationFamily].push(t.slug);
            }

            (t.versions || []).forEach(v => {
                if (!patchIndex[v.patchVersion]) patchIndex[v.patchVersion] = [];
                patchIndex[v.patchVersion].push(t.slug);
            });
        });

        glossary.forEach(g => {
            glossaryIndex[g.slug] = g;
            const cat = g.category;
            if (!glossaryCategoryIndex[cat]) glossaryCategoryIndex[cat] = [];
            glossaryCategoryIndex[cat].push(g.slug);
        });
    }

    // Public API
    function getTactics() { return tactics; }
    function getTactic(slug) { return tacticIndex[slug] || null; }
    function getGlossary() { return glossary; }
    function getGlossaryTerm(slug) { return glossaryIndex[slug] || null; }
    function getPatches() { return patches; }
    function getMeta() { return meta; }
    function getCurrentPatch() { return meta?.siteConfig?.currentPatch || ''; }

    function getTacticCurrentVersion(tactic) {
        const cp = getCurrentPatch();
        return (tactic.versions || []).find(v => v.patchVersion === cp)
            || (tactic.versions || [])[0]
            || null;
    }

    function getTacticVersion(tactic, patchVersion) {
        return (tactic.versions || []).find(v => v.patchVersion === patchVersion)
            || null;
    }

    function getBestEvidence(version) {
        if (!version || !version.evidence || version.evidence.length === 0) return null;
        // Prefer standardized-test > community-save > creator-claim > curated-review
        const priority = ['standardized-test', 'community-save', 'curated-review', 'creator-claim'];
        for (const type of priority) {
            const ev = version.evidence.find(e => e.type === type);
            if (ev) return ev;
        }
        return version.evidence[0];
    }

    function getFormationTemplate(shapeName) {
        return meta?.formations?.[shapeName] || null;
    }

    function getTacticsAffectedByPatch(patchVersion) {
        return (patchIndex[patchVersion] || []).map(s => tacticIndex[s]).filter(Boolean);
    }

    function getAllFormations() {
        return Object.keys(meta?.formations || {});
    }

    function getAllStyleTags() {
        return meta?.enums?.styleTags || [];
    }

    function getAllIntensityLevels() {
        return meta?.enums?.intensityLevels || [];
    }

    function getAllPatchVersions() {
        return meta?.enums?.patchVersions || [];
    }

    function getAllMentalities() {
        return meta?.enums?.mentalities || [];
    }

    function getAllBudgetTiers() {
        return meta?.enums?.budgetTiers || [];
    }

    function getDutyColor(duty) {
        return meta?.dutyColors?.[duty] || '#ffffff';
    }

    return {
        loadAll, getTactics, getTactic, getGlossary, getGlossaryTerm,
        getPatches, getMeta, getCurrentPatch, getTacticCurrentVersion,
        getTacticVersion, getBestEvidence, getFormationTemplate,
        getTacticsAffectedByPatch, getAllFormations, getAllStyleTags,
        getAllIntensityLevels, getAllPatchVersions, getAllMentalities,
        getAllBudgetTiers, getDutyColor, isLoaded: () => loaded
    };
})();
