document.addEventListener("DOMContentLoaded", () => {

    "use strict";

    const QUESTION_TIME    = 15;
    const SEARCH_DELAY     = 1100;
    const MAX_TAB_SWITCHES = 2;

    const questionBank = window.BRAINLOOM_BANK;

    let selectedMode      = null;
    let selectedCategory  = null;
    let questions         = [];
    let currentIndex      = 0;
    let correctCount      = 0;
    let wrongCount        = 0;
    let timeoutCount      = 0;
    let answeredCount     = 0;
    let timeLeft          = QUESTION_TIME;
    let timerInterval     = null;
    let isAnswered        = false;
    let quizStarted       = false;
    let quizFinished      = false;
    let tabSwitchCount    = 0;
    let securityActivated = false;

    const $ = id => document.getElementById(id);

    const selectionScreen  = $("quizSelectionScreen");
    const searchingScreen  = $("searchingScreen");
    const availableScreen  = $("availableQuizScreen");
    const quizInterface    = $("quizInterface");
    const questionText     = $("questionText");
    const optionsContainer = $("optionsContainer");
    const currentQ         = $("currentQ");
    const totalQ           = $("totalQ");
    const nextBtn          = $("nextBtn");
    const skipBtn          = $("skipBtn");
    const timerDisplay     = $("timer");
    const correctElem      = $("correctCount");
    const wrongElem        = $("wrongCount");
    const timeoutElem      = $("timeoutCount");
    const answeredElem     = $("answeredCount");
    const progressPercent  = $("progressPercent");
    const progressBar      = $("progressBar");


    /* =====================================================
       HELPERS
       ===================================================== */

    function escapeHTML(value) {
        return String(value ?? "")
            .replace(/&/g,  "&amp;")
            .replace(/</g,  "&lt;")
            .replace(/>/g,  "&gt;")
            .replace(/"/g,  "&quot;")
            .replace(/'/g,  "&#039;");
    }

    function shuffle(array) {
        const copy = [...array];
        for (let i = copy.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [copy[i], copy[j]] = [copy[j], copy[i]];
        }
        return copy;
    }

    function capitalize(text) {
        return text.charAt(0).toUpperCase() + text.slice(1);
    }

    function getCategoryIcon(category) {
        return {
            "English":           "✎",
            "Math":              "∑",
            "Science":           "⚗",
            "General Knowledge": "◎",
            "Sports":            "⚽",
            "History":           "🏛️",
            "Computer & IT":     "💻",
            "Animals":           "🐾",
            "Art":               "🎨"
        }[category] || "✦";
    }

    function getQuestionCount(category, mode) {
        return questionBank[category]?.[mode]?.length || 0;
    }


    /* =====================================================
       SCREEN MANAGEMENT
       ===================================================== */

    function showScreen(screen) {
        [selectionScreen, searchingScreen, availableScreen, quizInterface]
            .forEach(el => { if (el) el.classList.add("hidden"); });
        if (screen) screen.classList.remove("hidden");
    }


    /* =====================================================
       DIFFICULTY SELECTION
       ===================================================== */

    function updateDifficultySelection() {
        document.querySelectorAll(".mode-card").forEach(btn => {
            btn.classList.toggle("selected", btn.dataset.mode === selectedMode);
        });
        $("difficultyContinue").disabled = !selectedMode;
    }

    document.querySelectorAll(".mode-card").forEach(button => {
        button.addEventListener("click", () => {
            selectedMode = button.dataset.mode;
            updateDifficultySelection();
        });
    });

    $("difficultyContinue").addEventListener("click", () => {
        if (!selectedMode) return;
        $("searchModeText").textContent = capitalize(selectedMode);
        showScreen(searchingScreen);
        setTimeout(showCategoryScreen, SEARCH_DELAY);
    });


    /* =====================================================
       CATEGORY SCREEN
       ===================================================== */

    function showCategoryScreen() {
        $("selectedModeDisplay").textContent = capitalize(selectedMode);

        const grid = $("quizCategoryGrid");

        grid.innerHTML = Object.keys(questionBank).map(category => {
            const count = getQuestionCount(category, selectedMode);
            return `
                <button class="quiz-category-card" type="button"
                    data-category="${escapeHTML(category)}">
                    <span class="category-tag">${count} Q</span>
                    <div class="category-icon">${getCategoryIcon(category)}</div>
                    <span class="category-title">${escapeHTML(category)}</span>
                    <span class="category-info">
                        ${count} questions • ${capitalize(selectedMode)} level
                    </span>
                    <span class="category-arrow">→</span>
                </button>
            `;
        }).join("");

        grid.querySelectorAll(".quiz-category-card").forEach(card => {
            card.addEventListener("click", () => {
                selectedCategory = card.dataset.category;
                startStandardQuiz();
            });
        });

        showScreen(availableScreen);
    }


    /* =====================================================
       NORMALIZE QUESTION
       ===================================================== */

    function normalizeQuestion(item, category, difficulty) {
        return {
            question:  String(item.question || "").trim(),
            options:   Array.isArray(item.options)
                           ? item.options.map(v => String(v))
                           : [],
            answer:    Number(item.answer),
            category,
            difficulty
        };
    }


    /* =====================================================
       START STANDARD QUIZ
       ===================================================== */

    function startStandardQuiz() {
        const source = questionBank[selectedCategory]?.[selectedMode];

        if (!Array.isArray(source) || source.length < 1) {
            alert("This quiz category has no questions yet.");
            return;
        }

        const takeCount = Math.min(100, source.length);

        questions = shuffle(
            source.map(item =>
                normalizeQuestion(item, selectedCategory, selectedMode)
            )
        ).slice(0, takeCount);

        selectedMode  = selectedMode || "normal";
        currentIndex  = 0;
        correctCount  = 0;
        wrongCount    = 0;
        timeoutCount  = 0;
        answeredCount = 0;
        tabSwitchCount = 0;
        quizStarted   = true;
        quizFinished  = false;

        $("quizCategoryLabel").textContent = selectedCategory.toUpperCase();
        $("quizTitle").textContent         = selectedCategory + " Quiz";
        $("quizModeLabel").textContent     = selectedMode.toUpperCase();

        updateStats();
        totalQ.textContent = questions.length;
        showScreen(quizInterface);
        loadQuestion();
        activateQuizSecurity();
    }


    /* =====================================================
       START CUSTOM QUIZ
       ===================================================== */

    function startCustomQuiz(data) {
        questions = data.questions
            .map(item =>
                normalizeQuestion(
                    item,
                    data.title || "Custom Quiz",
                    "custom"
                )
            )
            .filter(item =>
                item.question &&
                item.options.length >= 2 &&
                Number.isInteger(item.answer) &&
                item.answer >= 0 &&
                item.answer < item.options.length
            );

        if (!questions.length) {
            alert("This custom quiz has no valid questions.");
            return;
        }

        selectedMode     = "custom";
        selectedCategory = data.title || "Custom Quiz";
        currentIndex     = 0;
        correctCount     = 0;
        wrongCount       = 0;
        timeoutCount     = 0;
        answeredCount    = 0;
        tabSwitchCount   = 0;
        quizStarted      = true;
        quizFinished     = false;

        document.title                     = (data.title || "Custom Quiz") + " | Brainloom Quiz";
        $("quizCategoryLabel").textContent = "CUSTOM QUIZ";
        $("quizTitle").textContent         = data.title || "Custom Quiz";
        $("quizModeLabel").textContent     = "CUSTOM";
        totalQ.textContent                 = questions.length;

        updateStats();
        showScreen(quizInterface);
        loadQuestion();

        if (data.strictSecurity) activateQuizSecurity();
    }


    /* =====================================================
       PARTICIPANT NAME SCREEN (old ?quizId= flow)
       ===================================================== */

    function showParticipantNameScreen(customQuizData) {
        const old = $("customNameOverlay");
        if (old) old.remove();

        const overlay = document.createElement("div");
        overlay.id    = "customNameOverlay";
        overlay.style.cssText = `
            position:fixed;inset:0;z-index:99999;
            display:flex;align-items:center;justify-content:center;
            padding:20px;background:rgba(3,7,18,.92);backdrop-filter:blur(20px);
        `;

        overlay.innerHTML = `
            <div style="
                width:min(520px,100%);padding:36px;
                border:1px solid rgba(139,92,246,.32);border-radius:28px;
                background:linear-gradient(145deg,#151c31,#090f1e);
                box-shadow:0 30px 90px rgba(0,0,0,.55);
                text-align:center;color:#fff;
            ">
                <div style="
                    display:inline-flex;padding:8px 13px;border-radius:999px;
                    background:rgba(139,92,246,.10);border:1px solid rgba(139,92,246,.25);
                    font-size:10px;font-weight:800;letter-spacing:.13em;color:#ddd6fe;
                ">CUSTOM QUIZ</div>

                <h1 style="margin:20px 0 8px;font:700 31px 'Space Grotesk',sans-serif;">
                    ${escapeHTML(customQuizData.title || "Custom Quiz")}
                </h1>

                <p style="margin:0 0 24px;color:#94a3b8;">
                    Enter your name to begin.
                </p>

                <input id="customParticipantName" type="text" maxlength="50"
                    autocomplete="name" placeholder="Enter your name"
                    style="
                        width:100%;padding:16px 17px;border-radius:15px;
                        border:1px solid rgba(255,255,255,.10);
                        background:#080e1c;color:#fff;outline:none;font-size:16px;
                    ">
                <p id="customNameError"
                    style="min-height:19px;margin:9px 0;color:#fb7185;font-size:12px;">
                </p>

                <button id="customStartBtn" type="button" style="
                    width:100%;padding:15px;border:0;border-radius:15px;
                    background:linear-gradient(135deg,#8b5cf6,#22d3ee);
                    color:#fff;font-weight:800;cursor:pointer;
                ">Start Quiz →</button>
            </div>
        `;

        document.body.appendChild(overlay);

        const input = $("customParticipantName");
        const error = $("customNameError");

        function startFromName() {
            const name = input.value.trim();
            if (name.length < 2) {
                error.textContent = "Please enter your name.";
                input.focus();
                return;
            }
            localStorage.setItem("userName",            name);
            localStorage.setItem("nameInput",           name);
            localStorage.setItem("quizParticipantName", name);
            overlay.remove();
            startCustomQuiz(customQuizData);
        }

        $("customStartBtn").addEventListener("click", startFromName);
        input.addEventListener("keydown", e => { if (e.key === "Enter") startFromName(); });
        setTimeout(() => input.focus(), 60);
    }


    /* =====================================================
       STATS
       ===================================================== */

    function updateStats() {
        correctElem.textContent  = correctCount;
        wrongElem.textContent    = wrongCount;
        timeoutElem.textContent  = timeoutCount;
        answeredElem.textContent = answeredCount;
    }


    /* =====================================================
       PROGRESS
       ===================================================== */

    function updateProgress() {
        const percent = Math.round(((currentIndex + 1) / questions.length) * 100);
        currentQ.textContent            = currentIndex + 1;
        progressPercent.textContent     = percent + "%";
        progressBar.style.width         = percent + "%";
        $("questionNumber").textContent =
            "QUESTION " + String(currentIndex + 1).padStart(2, "0");
    }


    /* =====================================================
       LOAD QUESTION
       ===================================================== */

    function loadQuestion() {
        if (!questions.length) return;
        clearInterval(timerInterval);
        isAnswered = false;

        const data = questions[currentIndex];
        questionText.textContent = data.question;
        updateProgress();
        optionsContainer.innerHTML = "";

        data.options.forEach((option, index) => {
            const button     = document.createElement("button");
            button.type      = "button";
            button.className = "option-btn";
            button.textContent = option;
            button.addEventListener("click", () => selectAnswer(button, index));
            optionsContainer.appendChild(button);
        });

        nextBtn.disabled  = true;
        nextBtn.innerHTML = currentIndex === questions.length - 1
            ? "See Result 🏆"
            : "Next Question <span>→</span>";

        startTimer();
    }


    /* =====================================================
       TIMER
       ===================================================== */

    function startTimer() {
        timeLeft = QUESTION_TIME;
        timerDisplay.textContent = timeLeft;
        timerDisplay.parentElement.classList.remove("timer-danger");

        timerInterval = setInterval(() => {
            timeLeft--;
            timerDisplay.textContent = timeLeft;
            if (timeLeft <= 5) timerDisplay.parentElement.classList.add("timer-danger");
            if (timeLeft <= 0) { clearInterval(timerInterval); handleTimeout(); }
        }, 1000);
    }


    /* =====================================================
       TIMEOUT
       ===================================================== */

    function handleTimeout() {
        if (isAnswered || quizFinished) return;
        isAnswered = true;
        timeoutCount++;
        answeredCount++;

        const data = questions[currentIndex];
        optionsContainer.querySelectorAll(".option-btn").forEach((btn, index) => {
            btn.disabled = true;
            if (index === data.answer) btn.classList.add("correct");
        });

        updateStats();
        nextBtn.disabled = false;
    }


    /* =====================================================
       SELECT ANSWER
       ===================================================== */

    function selectAnswer(button, index) {
        if (isAnswered || quizFinished) return;
        isAnswered = true;
        clearInterval(timerInterval);
        answeredCount++;

        const data    = questions[currentIndex];
        const buttons = optionsContainer.querySelectorAll(".option-btn");
        buttons.forEach(btn => btn.disabled = true);

        if (index === data.answer) {
            button.classList.add("correct");
            correctCount++;
        } else {
            button.classList.add("wrong");
            wrongCount++;
            if (buttons[data.answer]) buttons[data.answer].classList.add("correct");
        }

        updateStats();
        nextBtn.disabled = false;
    }


    /* =====================================================
       NEXT BUTTON
       ===================================================== */

    nextBtn.addEventListener("click", () => {
        if (!isAnswered || quizFinished) return;
        if (currentIndex < questions.length - 1) {
            currentIndex++;
            loadQuestion();
        } else {
            submitQuiz("Completed Successfully");
        }
    });


    /* =====================================================
       SKIP
       ===================================================== */

    skipBtn.addEventListener("click", () => {
        if (!quizStarted || quizFinished) return;
        if (confirm("Are you sure you want to end the quiz and see your result?")) {
            submitQuiz("User Selected Go to Result");
        }
    });


    /* =====================================================
       SUBMIT QUIZ
       ===================================================== */

    function submitQuiz(reason) {
        if (quizFinished) return;
        quizFinished = true;
        clearInterval(timerInterval);

        const studentName =
            localStorage.getItem("quizParticipantName") ||
            localStorage.getItem("userName")            ||
            localStorage.getItem("nameInput")           ||
            "Anonymous";

        localStorage.setItem("quizParticipantName", studentName);
        localStorage.setItem("userScore",           correctCount);
        localStorage.setItem("totalQuestions",      questions.length);
        localStorage.setItem("quizWrong",           wrongCount);
        localStorage.setItem("quizTimeouts",        timeoutCount);
        localStorage.setItem("quizAnswered",        answeredCount);
        localStorage.setItem("quizMode",            selectedMode);
        localStorage.setItem("quizCategory",        selectedCategory);
        localStorage.setItem("quizTabSwitches",     tabSwitchCount);
        localStorage.setItem("quizCompleted",       "true");
        localStorage.setItem("quizSubmitReason",    reason);

        window.location.replace("result.html");
    }


    /* =====================================================
       SECURITY
       ===================================================== */

    function activateQuizSecurity() {
        if (securityActivated) return;
        securityActivated = true;

        history.pushState(null, "", window.location.href);

        window.addEventListener("popstate", () => {
            if (quizStarted && !quizFinished) {
                history.pushState(null, "", window.location.href);
                showSecurityWarning("⚠️ Please use Go to Result to end the quiz.");
            }
        });

        document.addEventListener("visibilitychange", handleVisibilityChange);
        window.addEventListener("beforeunload", handleBeforeUnload);
    }

    function handleVisibilityChange() {
        if (document.hidden && quizStarted && !quizFinished) {
            tabSwitchCount++;
            if (tabSwitchCount === 1) {
                showSecurityWarning("⚠️ WARNING 1/2: Tab switch detected.");
            } else if (tabSwitchCount === 2) {
                showSecurityWarning("⚠️ WARNING 2/2: One more tab switch will automatically submit the quiz.");
            } else if (tabSwitchCount > MAX_TAB_SWITCHES) {
                showSecurityWarning("❌ Quiz automatically submitted because of repeated tab switching.");
                setTimeout(() => submitQuiz("Automatically Submitted - Too Many Tab Switches"), 700);
            }
        }
    }

    function handleBeforeUnload(event) {
        if (quizStarted && !quizFinished) {
            event.preventDefault();
            event.returnValue = "Your quiz is still active. Use Go to Result to finish the quiz.";
            return event.returnValue;
        }
    }

    function showSecurityWarning(message) {
        const warning = $("quizSecurityWarning");
        warning.textContent = message;
        warning.classList.remove("hidden");
        clearTimeout(warning._hideTimer);
        warning._hideTimer = setTimeout(() => warning.classList.add("hidden"), 3800);
    }


    /* =====================================================
       OLD CUSTOM QUIZ (?quizId= localStorage)
       ===================================================== */

    function getCustomQuizSource() {
        try {
            const params = new URLSearchParams(window.location.search);
            const quizId = params.get("quizId");
            if (!quizId) return null;
            const raw = localStorage.getItem("brainloom_quiz_" + quizId)
                     || localStorage.getItem(quizId);
            return raw ? JSON.parse(raw) : null;
        } catch (error) {
            console.error("Custom quiz read error:", error);
            return null;
        }
    }


    /* =====================================================
       CREATOR QUIZ EVENT LISTENER
       ===================================================== */

    window.addEventListener("brainloomCreatorQuizReady", function (e) {
        startCustomQuiz(e.detail);
    });


    /* =====================================================
       INIT
       ===================================================== */

    const customQuizData = getCustomQuizSource();

    if (
        customQuizData &&
        Array.isArray(customQuizData.questions) &&
        customQuizData.questions.length
    ) {
        showParticipantNameScreen(customQuizData);

    } else if (
        !new URLSearchParams(window.location.search).get("creatorQuiz")
    ) {
        showScreen(selectionScreen);
    }

});