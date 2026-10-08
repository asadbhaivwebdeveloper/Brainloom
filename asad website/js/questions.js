(function () {

    "use strict";

    /* =====================================================
       GLOBAL BANK
       ===================================================== */

    window.BRAINLOOM_BANK =
        window.BRAINLOOM_BANK || {};

    const BANK =
        window.BRAINLOOM_BANK;

    /* =====================================================
       LEVELS
       ===================================================== */

    const LEVELS = [
        "easy",
        "normal",
        "hard"
    ];

    /* =====================================================
       CREATE QUESTION
       ===================================================== */

    function makeQuestion(row) {

        if (!Array.isArray(row)) {
            return null;
        }

        if (row.length < 4) {
            console.warn("Brainloom: Question needs at least 1 correct + 2 wrong answers:", row);
            return null;
        }

        const question = String(row[0] ?? "").trim();
        const correct = String(row[1] ?? "").trim();
        const wrongAnswers = row.slice(2).map(a => String(a ?? "").trim()).filter(Boolean);

        if (!question) {
            console.warn("Brainloom: Empty question skipped.");
            return null;
        }

        if (!correct) {
            console.warn("Brainloom: Empty correct answer skipped:", question);
            return null;
        }

        const uniqueAnswers = [correct, ...wrongAnswers].filter(
            (a, i, arr) => arr.indexOf(a) === i
        );

        if (uniqueAnswers.length < 3) {
            console.warn("Brainloom: Question needs at least 3 unique options:", question);
            return null;
        }

        for (let i = uniqueAnswers.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [uniqueAnswers[i], uniqueAnswers[j]] = [uniqueAnswers[j], uniqueAnswers[i]];
        }

        return {
            question,
            options: uniqueAnswers,
            answer: uniqueAnswers.indexOf(correct)
        };
    }

    /* =====================================================
       ADD QUESTIONS
       ===================================================== */

    function addQuestions(category, level, rows) {

        if (typeof category !== "string" || !category.trim()) {
            console.error("Brainloom: Invalid category:", category);
            return;
        }

        if (!LEVELS.includes(level)) {
            console.error("Brainloom: Invalid difficulty:", level, "Allowed:", LEVELS);
            return;
        }

        if (!Array.isArray(rows)) {
            console.error(`Brainloom: ${category}/${level} questions must be an array.`);
            return;
        }

        if (!BANK[category]) {
            BANK[category] = {
                easy: [],
                normal: [],
                hard: []
            };
        }

        const existing = BANK[category][level] || [];

        const existingQuestions = new Set(
            existing.map(item => item.question)
        );

        const newQuestions = [];

        rows.forEach(row => {

            const question = makeQuestion(row);

            if (!question) return;

            if (existingQuestions.has(question.question)) {
                console.warn("Brainloom: Duplicate question skipped:", question.question);
                return;
            }

            existingQuestions.add(question.question);
            newQuestions.push(question);
        });

        BANK[category][level] = existing.concat(newQuestions);

        console.log(`Brainloom: ${category} / ${level} → ${BANK[category][level].length} questions loaded.`);
    }

    /* =====================================================
       PUBLIC API
       ===================================================== */

    window.Brainloom = {

        add: addQuestions,

        getBank: function () {
            return BANK;
        },

        getCategories: function () {
            return Object.keys(BANK);
        },

        getQuestions: function (category, level) {
            if (!BANK[category] || !BANK[category][level]) {
                return [];
            }
            return BANK[category][level];
        },

        levels: LEVELS.slice()
    };

    /* =====================================================
       CATEGORY FILES
       ===================================================== */

    const CATEGORY_FILES = [
        "q-math.js",
        "q-english.js",
        "q-ganeral knowladge.js",
        "q-sport.js",
        "q-sceince.js",
        "q-history.js",
        "q-code.js",
        "q-computer & IT.js",
        "q-entertainment.js",
        "q-logic & reasoning.js",
        "q-biology.js",
        "q-gaming.js",
    ];

    /* =====================================================
       FIND THIS FILE'S FOLDER
       ===================================================== */

    function getQuestionsFileFolder() {

        const currentScript = document.currentScript;

        if (currentScript && currentScript.src) {
            return new URL("./", currentScript.src).href;
        }

        const scripts = document.getElementsByTagName("script");

        for (let i = scripts.length - 1; i >= 0; i--) {
            const src = scripts[i].src || "";
            if (src.endsWith("/questions.js") || src.includes("/questions.js?")) {
                return new URL("./", src).href;
            }
        }

        return "./";
    }

    /* =====================================================
       LOAD ONE FILE
       ===================================================== */

    function loadCategoryFile(folder, file) {

        return new Promise(resolve => {

            const script = document.createElement("script");
            script.src = new URL(file, folder).href;
            script.async = false;

            script.onload = function () {
                console.log("✓ Brainloom loaded:", file);
                resolve(true);
            };

            script.onerror = function () {
                console.warn("⚠ Brainloom: File not found:", file);
                resolve(false);
            };

            document.head.appendChild(script);
        });
    }

    /* =====================================================
       LOAD ALL FILES
       ===================================================== */

    async function loadAllCategories() {

        const folder = getQuestionsFileFolder();

        console.log("Brainloom question folder:", folder);

        for (const file of CATEGORY_FILES) {
            await loadCategoryFile(folder, file);
        }

        console.log("✓ Brainloom question bank ready.");
        console.log("Loaded categories:", Object.keys(BANK));

        window.dispatchEvent(
            new CustomEvent("brainloomBankReady", { detail: BANK })
        );
    }

    /* =====================================================
       START
       ===================================================== */

    loadAllCategories();

})();