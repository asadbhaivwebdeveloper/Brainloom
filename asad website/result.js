document.addEventListener('DOMContentLoaded', () => {
    // LocalStorage se data fetch karna
    const savedName = localStorage.getItem('userName') || localStorage.getItem('nameInput') || 'Student';
    const score = parseInt(localStorage.getItem('userScore')) || 0;
    const total = parseInt(localStorage.getItem('totalQuestions')) || 0;

    const userNameElem = document.getElementById('userName');
    const userScoreElem = document.getElementById('userScore');
    const totalQuestionsElem = document.getElementById('totalQuestions');
    const percentageBadge = document.getElementById('percentageBadge');
    const performanceMsg = document.getElementById('performanceMsg');
    const resultTitle = document.getElementById('resultTitle');
    const resultIcon = document.getElementById('resultIcon');

    // Basic UI Setup
    if (userNameElem) userNameElem.textContent = savedName;
    if (userScoreElem) userScoreElem.textContent = score;
    if (totalQuestionsElem) totalQuestionsElem.textContent = total;

    // Percentage calculation
    const percentage = total > 0 ? Math.round((score / total) * 100) : 0;
    if (percentageBadge) percentageBadge.textContent = `${percentage}%`;

    // Dynamic Feedback based on Percentage
    if (percentage >= 80) {
        if (resultIcon) resultIcon.textContent = "🏆";
        if (resultTitle) resultTitle.textContent = "Outstanding Achievement!";
        if (performanceMsg) performanceMsg.textContent = "You've mastered this quiz with flying colors!";
        if (percentageBadge) percentageBadge.style.background = "#059669"; // Green
    } else if (percentage >= 50) {
        if (resultIcon) resultIcon.textContent = "🎯";
        if (resultTitle) resultTitle.textContent = "Good Job!";
        if (performanceMsg) performanceMsg.textContent = "Solid effort! A little more review and you'll reach perfection.";
        if (percentageBadge) percentageBadge.style.background = "#d97706"; // Orange
    } else {
        if (resultIcon) resultIcon.textContent = "📘";
        if (resultTitle) resultTitle.textContent = "Keep Practicing!";
        if (performanceMsg) performanceMsg.textContent = "Don't give up! Review the concepts and try again.";
        if (percentageBadge) percentageBadge.style.background = "#dc2626"; // Red
    }

    // Button Redirections
    document.getElementById('retryBtn')?.addEventListener('click', () => {
        window.location.href = "quizzstart.html";
    });

    document.getElementById('homeBtn')?.addEventListener('click', () => {
        window.location.href = "wellcome.html";
    });
});