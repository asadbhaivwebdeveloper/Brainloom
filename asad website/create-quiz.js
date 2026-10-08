/* =========================================================
   BRAINLOOM QUIZ CREATOR
   Supabase + Claude AI Quiz Generator
   ========================================================= */


/* =========================================================
   SUPABASE CONFIG
   ========================================================= */

const SUPABASE_URL =
    "https://uuznigrkiwzjuwkdmakm.supabase.co";

const SUPABASE_KEY =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV1em5pZ3JraXd6anV3a2RtYWttIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA4NjkxNTcsImV4cCI6MjEwNjQ0NTE1N30.OknmwTS5Djbiee1xEr4GzRjCy2vETT-6P12QsW0iIGo";

const STORAGE_BUCKET =
    "brainloom-quizzes";

const TABLE_NAME =
    "creator_quizzes";


/* =========================================================
   CLAUDE AI CONFIG
   ========================================================= */

const CLAUDE_API_KEY =
    "sk-orca-bvmeQaBXZWXbzp5xoGy8llNWC2neJ17w5r8iCpVBc7Z";

/* OrcaRouter endpoint — sk-orca- keys yahan kaam karte hain */
const CLAUDE_API_ENDPOINT =
    "https://api.orcarouter.ai/v1/chat/completions";

const CLAUDE_MODEL =
    "anthropic/claude-sonnet-4";


/* =========================================================
   DOM
   ========================================================= */

const $ = id =>
    document.getElementById(id);


const title =
    $("quizTitle");

const creatorName =
    $("creatorName");

const email =
    $("creatorEmail");

const quizPassword =
    $("quizPassword");

const security =
    $("strictSecurity");

const container =
    $("questionsContainer");

const counter =
    $("questionCounter");

const msg =
    $("msg");


/* =========================================================
   LOCAL DRAFT
   ========================================================= */

const DRAFT_KEY =
    "brainloom_create_quiz_draft";


/* =========================================================
   AI GENERATOR STATE
   ========================================================= */

let selectedImageBase64 = null;
let selectedImageType   = null;
let selectedDifficulty  = "easy";


/* =========================================================
   ESCAPE HTML
   ========================================================= */

function esc(value){

    return String(value ?? "")
        .replace(
            /[&<>"']/g,
            char => ({
                "&":"&amp;",
                "<":"&lt;",
                ">":"&gt;",
                '"':"&quot;",
                "'":"&#039;"
            }[char])
        );

}


/* =========================================================
   SHOW MESSAGE
   ========================================================= */

function showMessage(text, type = "success"){

    msg.textContent  = text;
    msg.style.color  =
        type === "error"
            ? "#fb7185"
            : "#6ee7b7";

}


/* =========================================================
   AI STATUS
   ========================================================= */

function setAiStatus(text, type = "loading"){

    const el = $("aiStatus");
    const sp = $("aiSpinner");

    el.className =
        "ai-status show" +
        (type === "error"   ? " error"   : "") +
        (type === "success" ? " success" : "");

    $("aiStatusText").textContent = text;

    sp.style.display =
        type === "loading" ? "block" : "none";

}

function hideAiStatus(){
    $("aiStatus").className = "ai-status";
}


/* =========================================================
   AI PROGRESS BAR
   ========================================================= */

let progressInterval = null;

function startProgress(){

    const bar = $("aiProgressBar");
    const wrap = $("aiProgress");

    wrap.classList.add("show");
    bar.style.width = "0%";

    let pct = 0;

    progressInterval = setInterval(() => {

        pct += Math.random() * 8;

        if(pct > 85) pct = 85;

        bar.style.width = pct + "%";

    }, 400);

}

function finishProgress(){

    clearInterval(progressInterval);

    const bar  = $("aiProgressBar");
    const wrap = $("aiProgress");

    bar.style.width = "100%";

    setTimeout(() => {
        wrap.classList.remove("show");
        bar.style.width = "0%";
    }, 600);

}


/* =========================================================
   DIFFICULTY PILLS
   ========================================================= */

document.querySelectorAll(".pill").forEach(btn => {

    btn.addEventListener("click", () => {

        document.querySelectorAll(".pill").forEach(p => {
            p.className = "pill";
        });

        selectedDifficulty = btn.dataset.diff;

        btn.classList.add(
            selectedDifficulty === "easy"   ? "active-easy"   :
            selectedDifficulty === "medium" ? "active-medium" :
                                              "active-hard"
        );

    });

});


/* =========================================================
   DROP ZONE
   ========================================================= */

const dropZone       = $("dropZone");
const fileInput      = $("imageFileInput");
const previewWrap    = $("imgPreviewWrap");
const previewImg     = $("imgPreview");
const imgRemoveBtn   = $("imgRemoveBtn");


function handleImageFile(file){

    if(!file) return;

    const allowed = ["image/jpeg","image/jpg","image/png","application/pdf"];

    if(!allowed.includes(file.type)){
        setAiStatus("Sirf JPEG, PNG ya PDF files allowed hain.", "error");
        return;
    }

    if(file.size > 10 * 1024 * 1024){
        setAiStatus("File size 10MB se zyada hai.", "error");
        return;
    }

    const reader = new FileReader();

    reader.onload = e => {

        const dataUrl = e.target.result;

        // Extract base64 part
        selectedImageBase64 = dataUrl.split(",")[1];
        selectedImageType   = file.type;

        // Show preview
        if(file.type === "application/pdf"){
            // PDF: show a styled placeholder instead of <img>
            previewImg.style.display = "none";
            let pdfPlaceholder = document.getElementById("pdfPlaceholder");
            if(!pdfPlaceholder){
                pdfPlaceholder = document.createElement("div");
                pdfPlaceholder.id = "pdfPlaceholder";
                pdfPlaceholder.style.cssText =
                    "display:flex;align-items:center;gap:14px;" +
                    "padding:20px;background:#6366f10d;" +
                    "border-radius:12px;";
                pdfPlaceholder.innerHTML =
                    '<div style="font-size:32px;flex-shrink:0">📄</div>' +
                    '<div>' +
                      '<div style="font-size:12px;font-weight:700;color:#e2e8f0;margin-bottom:4px">' +
                        esc(file.name) +
                      '</div>' +
                      '<div style="font-size:10px;color:#64748b">PDF • ' +
                        (file.size > 1024*1024
                            ? (file.size/(1024*1024)).toFixed(1)+"MB"
                            : Math.round(file.size/1024)+"KB") +
                      '</div>' +
                    '</div>';
                previewWrap.insertBefore(
                    pdfPlaceholder,
                    previewWrap.querySelector(".img-remove")
                );
            }
        }
        else{
            // Image: show normally
            const pdfPh = document.getElementById("pdfPlaceholder");
            if(pdfPh) pdfPh.remove();
            previewImg.style.display = "";
            previewImg.src = dataUrl;
        }

        previewWrap.classList.add("show");
        dropZone.style.display = "none";

        hideAiStatus();

    };

    reader.readAsDataURL(file);

}


// Click to select
fileInput.addEventListener("change", () => {
    handleImageFile(fileInput.files[0]);
});


// Drag & drop
dropZone.addEventListener("dragover", e => {
    e.preventDefault();
    dropZone.classList.add("drag-over");
});

dropZone.addEventListener("dragleave", () => {
    dropZone.classList.remove("drag-over");
});

dropZone.addEventListener("drop", e => {
    e.preventDefault();
    dropZone.classList.remove("drag-over");
    handleImageFile(e.dataTransfer.files[0]);
});


// Remove image
imgRemoveBtn.addEventListener("click", () => {
    selectedImageBase64 = null;
    selectedImageType   = null;
    previewImg.src      = "";
    previewImg.style.display = "";
    const pdfPh = document.getElementById("pdfPlaceholder");
    if(pdfPh) pdfPh.remove();
    previewWrap.classList.remove("show");
    dropZone.style.display = "";
    fileInput.value     = "";
    hideAiStatus();
});


/* =========================================================
   GENERATE QUIZ WITH AI
   ========================================================= */

async function generateQuizWithAI(){

    if(!selectedImageBase64){
        setAiStatus(
            "Pehle koi file upload karo (JPEG, PNG ya PDF).",
            "error"
        );
        return;
    }

    const questionCount =
        parseInt($("aiQuestionCount").value, 10);

    const difficultyLabel =
        selectedDifficulty === "easy"   ? "asaan (Easy)"   :
        selectedDifficulty === "medium" ? "darmiyani (Medium)" :
                                          "mushkil (Hard)";

    const fileLabel = selectedImageType === "application/pdf" ? "PDF document" : "image";

    const difficultyGuide =
        selectedDifficulty === "easy"
            ? "Easy: Simple, straightforward questions. Basic facts directly visible/stated in the content. Anyone who glanced at it should answer correctly."
            : selectedDifficulty === "medium"
            ? "Medium: Moderate questions requiring understanding of the content. Mix of direct facts and some inference needed."
            : "Hard: Challenging questions requiring deep understanding, analysis, and critical thinking about the content. Not immediately obvious answers.";

    const prompt = `You are an expert quiz creator. Your job is to analyze the provided ${fileLabel} and generate a high-quality multiple-choice quiz from it.

TASK:
- Carefully read/examine every part of the ${fileLabel}
- Create EXACTLY ${questionCount} multiple-choice questions based on the actual content
- Each question must have EXACTLY 4 answer options (A, B, C, D)
- Only ONE option is correct per question

DIFFICULTY LEVEL: ${selectedDifficulty.toUpperCase()}
${difficultyGuide}

OUTPUT FORMAT:
You MUST respond with ONLY a raw JSON object. No explanation, no markdown, no code fences, no extra text before or after. Just the JSON.

Required JSON structure:
{
  "quizTitle": "Short descriptive title based on the content (max 60 characters)",
  "questions": [
    {
      "question": "Clear, specific question based on the content?",
      "options": ["First option", "Second option", "Third option", "Fourth option"],
      "answer": 0
    }
  ]
}

RULES:
1. "answer" field = zero-based index of the CORRECT option (0 = first, 1 = second, 2 = third, 3 = fourth)
2. Generate EXACTLY ${questionCount} question objects inside the "questions" array
3. All questions must come from the actual content of the ${fileLabel} — do NOT make up unrelated questions
4. Wrong options (distractors) should be plausible but clearly incorrect
5. Questions should not repeat or overlap
6. quizTitle must reflect the actual subject matter of the ${fileLabel}
7. Do NOT include any text outside the JSON object

BEGIN JSON OUTPUT NOW:`;

    // UI: loading state
    const genBtn  = $("generateBtn");
    const genIcon = $("generateBtnIcon");
    const genText = $("generateBtnText");

    genBtn.disabled  = true;
    genIcon.textContent = "⟳";
    genText.textContent = "AI generate kar raha hai...";

    startProgress();
    setAiStatus("Image analyze ho rahi hai...", "loading");

    try{

        // Step 1 status
        setTimeout(() => {
            setAiStatus(
                `${questionCount} questions ban rahe hain (${difficultyLabel})...`,
                "loading"
            );
        }, 1500);

        // Build content array — OpenRouter/OpenAI format
        const userContent = [];

        if(selectedImageType === "application/pdf"){
            // PDF: send as base64 data URL inside text message
            // OpenRouter Claude supports PDF via image_url with data URI
            userContent.push({
                type:      "image_url",
                image_url: {
                    url: `data:application/pdf;base64,${selectedImageBase64}`
                }
            });
        }
        else{
            // Image: standard image_url block
            userContent.push({
                type:      "image_url",
                image_url: {
                    url: `data:${selectedImageType};base64,${selectedImageBase64}`
                }
            });
        }

        userContent.push({
            type: "text",
            text: prompt
        });

        const response = await fetch(
            CLAUDE_API_ENDPOINT,
            {
                method: "POST",
                headers: {
                    "Content-Type":  "application/json",
                    "Authorization": `Bearer ${CLAUDE_API_KEY}`
                },
                body: JSON.stringify({
                    model:      CLAUDE_MODEL,
                    max_tokens: 4096,
                    messages: [
                        {
                            role:    "system",
                            content: "You are an expert quiz creator for Brainloom Quiz App. Your ONLY job is to analyze the provided image or PDF and return a valid JSON quiz. You must NEVER return anything other than raw JSON — no explanations, no markdown, no code fences. Just a pure JSON object starting with { and ending with }."
                        },
                        {
                            role:    "user",
                            content: userContent
                        }
                    ]
                })
            }
        );


        if(!response.ok){

            const errData = await response.json().catch(() => ({}));

            throw new Error(
                errData.error?.message ||
                `API error ${response.status}`
            );

        }


        const data = await response.json();

        // OpenRouter returns OpenAI-style: choices[0].message.content
        const rawText =
            data.choices?.[0]?.message?.content ||
            // fallback: Anthropic-style if ever used directly
            (Array.isArray(data.content)
                ? data.content.filter(b => b.type === "text").map(b => b.text).join("")
                : ""
            );


        if(!rawText){
            console.error("Full API response:", JSON.stringify(data));
            throw new Error(
                "AI se koi jawab nahi aaya. API key ya model check karo."
            );
        }

        // Parse JSON — strip any accidental markdown fences
        let parsed;

        try{

            const cleaned =
                rawText
                    .replace(/```json\s*/gi,"")
                    .replace(/```\s*/gi,"")
                    .trim();

            parsed = JSON.parse(cleaned);

        }
        catch(parseErr){

            throw new Error(
                "AI ne galat format mein jawab diya. Dobara try karo."
            );

        }


        // Validate structure
        if(
            !parsed.questions ||
            !Array.isArray(parsed.questions) ||
            parsed.questions.length === 0
        ){
            throw new Error(
                "AI se questions nahi mile. Image clear karke dobara try karo."
            );
        }


        // Fill quiz title if empty
        if(
            parsed.quizTitle &&
            !title.value.trim()
        ){
            title.value = parsed.quizTitle;
        }


        // Clear existing questions
        container.innerHTML = "";


        // Add generated questions
        parsed.questions.forEach(q => {

            addQuestion({
                question: q.question  || "",
                options:  q.options   || ["","","",""],
                answer:   typeof q.answer === "number"
                            ? q.answer
                            : null
            }, true);

        });


        renumberQuestions();
        saveDraft();


        finishProgress();

        setAiStatus(
            `✓ ${parsed.questions.length} questions successfully generate ho gaye!`,
            "success"
        );


        // Scroll to questions
        setTimeout(() => {
            container.scrollIntoView({
                behavior: "smooth",
                block:    "start"
            });
        }, 300);


    }
    catch(error){

        console.error("AI generation error:", error);

        finishProgress();

        setAiStatus(
            "Error: " + (error.message || "Kuch gadbad ho gayi."),
            "error"
        );

    }
    finally{

        genBtn.disabled     = false;
        genIcon.textContent = "✦";
        genText.textContent = "AI se Quiz Generate Karo";

    }

}


$("generateBtn").addEventListener("click", generateQuizWithAI);


/* =========================================================
   GET QUESTIONS
   ========================================================= */

function getQuestions(){

    return [
        ...container.querySelectorAll(".question")
    ].map(block => {

        const selected =
            block.querySelector('input[type="radio"]:checked');

        return {

            question:
                block
                    .querySelector(".question-text")
                    .value
                    .trim(),

            options:
                [...block.querySelectorAll(".option-input")]
                    .map(input => input.value.trim()),

            answer:
                selected
                    ? Number(selected.value)
                    : null

        };

    });

}


/* =========================================================
   UPDATE PREVIEW
   ========================================================= */

function updatePreview(){

    const count = container.children.length;

    counter.textContent =
        `${count} Question${count === 1 ? "" : "s"}`;

    $("previewQuestionCount").textContent = count;

    $("previewTitle").textContent =
        title.value.trim() || "Your Quiz";

    $("previewCreator").textContent =
        creatorName.value.trim() || "Creator";

    $("previewSecurity").textContent =
        security.checked ? "On" : "Off";

}


/* =========================================================
   SAVE LOCAL DRAFT
   ========================================================= */

function saveDraft(){

    localStorage.setItem(
        DRAFT_KEY,
        JSON.stringify({
            title:       title.value,
            creatorName: creatorName.value,
            email:       email.value,
            security:    security.checked,
            questions:   getQuestions()
        })
    );

    updatePreview();

}


/* =========================================================
   ADD QUESTION
   ========================================================= */

function addQuestion(data = {}, aiFilled = false){

    const number = container.children.length + 1;

    let options =
        Array.isArray(data.options)
            ? data.options.slice(0,4)
            : [];

    while(options.length < 4){
        options.push("");
    }

    const correctAnswer =
        Number.isInteger(data.answer)
            ? data.answer
            : null;

    const block = document.createElement("div");

    block.className =
        "question" + (aiFilled ? " ai-filled" : "");

    block.innerHTML = `

        <div class="qtop">

            <span class="qnum">QUESTION ${number}</span>

            <button
                class="remove"
                type="button"
                title="Remove question"
            >×</button>

        </div>


        <textarea
            class="question-text"
            maxlength="500"
            placeholder="Write your question here..."
        >${esc(data.question || "")}</textarea>


        <div class="options">

            ${options.map((value, index) => `

                <div class="option">

                    <label>

                        <input
                            type="radio"
                            name="answer_${number}"
                            value="${index}"
                            ${correctAnswer === index ? "checked" : ""}
                        >

                        OPTION ${String.fromCharCode(65 + index)}

                    </label>

                    <input
                        class="option-input"
                        maxlength="250"
                        placeholder="Enter option ${String.fromCharCode(65 + index)}"
                        value="${esc(value)}"
                    >

                </div>

            `).join("")}

        </div>
    `;

    container.appendChild(block);

    block.querySelector(".remove").onclick = () => {

        if(container.children.length === 1){
            showMessage(
                "At least one question is required.",
                "error"
            );
            return;
        }

        block.remove();
        renumberQuestions();
        saveDraft();

    };

    block.oninput  = saveDraft;
    block.onchange = saveDraft;

    updatePreview();

}


/* =========================================================
   RENUMBER QUESTIONS
   ========================================================= */

function renumberQuestions(){

    [...container.children].forEach((block, index) => {

        const number = index + 1;

        block
            .querySelector(".qnum")
            .textContent = `QUESTION ${number}`;

        block
            .querySelectorAll('input[type="radio"]')
            .forEach(radio => {
                radio.name = `answer_${number}`;
            });

    });

    updatePreview();

}


/* =========================================================
   VALIDATE
   ========================================================= */

function validateQuiz(){

    if(title.value.trim().length < 3){
        showMessage("Please enter a quiz title.", "error");
        title.focus();
        return false;
    }

    if(creatorName.value.trim().length < 2){
        showMessage("Please enter the creator name.", "error");
        creatorName.focus();
        return false;
    }

    if(quizPassword.value.length < 4){
        showMessage(
            "Quiz password must contain at least 4 characters.",
            "error"
        );
        quizPassword.focus();
        return false;
    }

    const quizQuestions = getQuestions();

    if(quizQuestions.length === 0){
        showMessage("Please add at least one question.", "error");
        return false;
    }

    for(let i = 0; i < quizQuestions.length; i++){

        const q = quizQuestions[i];
        const n = i + 1;

        if(q.question.length < 3){
            showMessage(`Question ${n} is too short.`, "error");
            return false;
        }

        if(q.options.some(opt => !opt)){
            showMessage(
                `Question ${n} needs all 4 options.`,
                "error"
            );
            return false;
        }

        if(q.answer === null){
            showMessage(
                `Select the correct answer for Question ${n}.`,
                "error"
            );
            return false;
        }

    }

    return true;

}


/* =========================================================
   SHA-256
   ========================================================= */

async function hashPassword(password){

    const encoded =
        new TextEncoder().encode(password);

    const hash =
        await crypto.subtle.digest("SHA-256", encoded);

    return [...new Uint8Array(hash)]
        .map(b => b.toString(16).padStart(2,"0"))
        .join("");

}


/* =========================================================
   SAFE FILE NAME
   ========================================================= */

function makeFileName(title){

    let name =
        title
            .replace(/[^a-z0-9]+/gi,"_")
            .replace(/^_+|_+$/g,"")
            .slice(0,80);

    if(!name) name = "brainloom_quiz";

    return `${name}.js`;

}


/* =========================================================
   CREATE QUIZ FILE
   ========================================================= */

function createQuizFile(quiz){

    const fileName = makeFileName(quiz.title);

    const fileContent =
`/*
=========================================================
 BRAINLOOM CREATOR QUIZ
=========================================================

 Quiz:
 ${quiz.title}

 Creator:
 ${quiz.creatorName}

 Created:
 ${quiz.createdAt}

 Expires:
 ${quiz.expiresAt}

=========================================================
*/

window.BRAINLOOM_CREATOR_QUIZ = ${JSON.stringify(quiz, null, 2)};
`;

    return { fileName, fileContent };

}


/* =========================================================
   DOWNLOAD FILE
   ========================================================= */

function downloadJSFile(fileName, content){

    const blob =
        new Blob([content], { type:"application/javascript" });

    const url  = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href     = url;
    link.download = fileName;

    document.body.appendChild(link);

    link.click();
    link.remove();

    setTimeout(() => URL.revokeObjectURL(url), 1000);

}


/* =========================================================
   UPLOAD TO SUPABASE STORAGE
   ========================================================= */

async function uploadQuizFile(quizId, fileName, fileContent){

    const storagePath  = `${quizId}/${fileName}`;
    const encodedPath  =
        storagePath
            .split("/")
            .map(part => encodeURIComponent(part))
            .join("/");

    const response = await fetch(
        `${SUPABASE_URL}/storage/v1/object/${STORAGE_BUCKET}/${encodedPath}`,
        {
            method: "POST",
            headers: {
                "apikey":       SUPABASE_KEY,
                "Authorization":`Bearer ${SUPABASE_KEY}`,
                "Content-Type": "application/javascript",
                "x-upsert":     "true"
            },
            body: fileContent
        }
    );

    if(!response.ok){

        let errorMessage = "Unknown error";

        try{
            const errorData    = await response.json();
            errorMessage =
                errorData.message ||
                errorData.error ||
                JSON.stringify(errorData);
        }
        catch{
            errorMessage = await response.text();
        }

        throw new Error(
            `Storage upload failed (${response.status}): ${errorMessage}`
        );

    }

    return storagePath;

}


/* =========================================================
   SAVE DATABASE RECORD
   ========================================================= */

async function saveQuizRecord(record){

    const response = await fetch(
        `${SUPABASE_URL}/rest/v1/${TABLE_NAME}`,
        {
            method: "POST",
            headers: {
                "apikey":        SUPABASE_KEY,
                "Authorization": `Bearer ${SUPABASE_KEY}`,
                "Content-Type":  "application/json",
                "Prefer":        "return=representation"
            },
            body: JSON.stringify(record)
        }
    );

    if(!response.ok){

        let errorMessage = "Unknown error";

        try{
            const errorData = await response.json();
            errorMessage =
                errorData.message ||
                errorData.hint ||
                errorData.details ||
                JSON.stringify(errorData);
        }
        catch{
            errorMessage = await response.text();
        }

        throw new Error(
            `Database error (${response.status}): ${errorMessage}`
        );

    }

    return response.json();

}


/* =========================================================
   PUBLISH QUIZ
   ========================================================= */

async function publishQuiz(){

    if(!validateQuiz()) return;

    const button = $("saveQuizBtn");

    button.disabled    = true;
    button.textContent = "Publishing...";

    try{

        const createdAt = new Date();

        const expiresAt =
            new Date(createdAt.getTime() + 60 * 60 * 1000);

        const quizId =
            "creator_" +
            Date.now() +
            "_" +
            Math.random().toString(36).slice(2,9);

        const passwordHash =
            await hashPassword(quizPassword.value);

        const quiz = {
            quizId:         quizId,
            title:          title.value.trim(),
            creatorName:    creatorName.value.trim(),
            creatorEmail:   email.value.trim(),
            passwordHash:   passwordHash,
            strictSecurity: security.checked,
            questions:      getQuestions(),
            createdAt:      createdAt.toISOString(),
            expiresAt:      expiresAt.toISOString(),
            version:        "brainloom-creator-1"
        };

        const file = createQuizFile(quiz);

        const storagePath =
            await uploadQuizFile(quizId, file.fileName, file.fileContent);

        await saveQuizRecord({
            quiz_id:         quizId,
            title:           quiz.title,
            creator_name:    quiz.creatorName,
            creator_email:   quiz.creatorEmail || null,
            file_name:       file.fileName,
            storage_path:    storagePath,
            password_hash:   passwordHash,
            strict_security: quiz.strictSecurity,
            created_at:      quiz.createdAt,
            expires_at:      quiz.expiresAt,
            version:         quiz.version
        });

        const quizURL = new URL("quizzstart.html", location.href);
        quizURL.searchParams.set("creatorQuiz", quizId);

        $("shareLinkInput").value     = quizURL.href;
        $("openQuizBtn").href         = quizURL.href;
        $("publishedFileName").textContent = file.fileName;

        $("shareBox").classList.remove("hidden");

        localStorage.removeItem(DRAFT_KEY);

        quizPassword.value = "";

        showMessage(
            "Quiz published successfully. Your quiz is live for 1 hour.",
            "success"
        );

        setTimeout(() => {
            $("shareBox").scrollIntoView({
                behavior: "smooth",
                block:    "center"
            });
        }, 100);

    }
    catch(error){

        console.error("Brainloom publish error:", error);

        showMessage(
            error.message || "Could not publish the quiz.",
            "error"
        );

    }
    finally{

        button.disabled    = false;
        button.textContent = "Publish quiz →";

    }

}


/* =========================================================
   COPY LINK
   ========================================================= */

async function copyQuizLink(){

    const value = $("shareLinkInput").value;

    if(!value) return;

    try{

        await navigator.clipboard.writeText(value);
        showMessage("Quiz link copied.", "success");

    }
    catch{

        const input = $("shareLinkInput");
        input.focus();
        input.select();
        document.execCommand("copy");
        showMessage("Quiz link copied.", "success");

    }

}


/* =========================================================
   DOWNLOAD (MANUAL — BUTTON ONLY)
   ========================================================= */

function downloadPublishedAgain(){

    const fileName = $("publishedFileName").textContent;

    if(!fileName || fileName === "quiz.js"){
        showMessage(
            "No published quiz file is available.",
            "error"
        );
        return;
    }

    if(!title.value.trim()){
        showMessage(
            "The original quiz data is no longer available on this page. Publish again if you need a new copy.",
            "error"
        );
        return;
    }

    showMessage(
        "Your original JS file was already downloaded when the quiz was published.",
        "success"
    );

}


/* =========================================================
   LOAD LOCAL DRAFT
   ========================================================= */

function loadDraft(){

    try{

        const saved =
            JSON.parse(
                localStorage.getItem(DRAFT_KEY) || "null"
            );

        if(saved){

            title.value       = saved.title       || "";
            creatorName.value = saved.creatorName || "";
            email.value       = saved.email       || "";
            security.checked  = !!saved.security;

            const savedQuestions =
                Array.isArray(saved.questions)
                    ? saved.questions
                    : [];

            savedQuestions.forEach(q => addQuestion(q));

        }

    }
    catch(error){
        console.error("Draft loading error:", error);
    }

    if(!container.children.length){
        addQuestion();
    }

    updatePreview();

}


/* =========================================================
   INPUT EVENTS
   ========================================================= */

title.addEventListener("input", saveDraft);
creatorName.addEventListener("input", saveDraft);
email.addEventListener("input", saveDraft);
security.addEventListener("change", saveDraft);

$("addQuestionBtn").addEventListener("click", () => {
    addQuestion();
    saveDraft();
});

$("saveQuizBtn").addEventListener("click", publishQuiz);
$("copyBtn").addEventListener("click", copyQuizLink);
$("downloadBtn").addEventListener("click", downloadPublishedAgain);


/* =========================================================
   START
   ========================================================= */

loadDraft();