document.addEventListener("DOMContentLoaded", () => {

    const savedName =
        localStorage.getItem("userName") ||
        localStorage.getItem("nameInput");

    const userNameDisplay =
        document.getElementById("userNameDisplay");

    if (savedName && userNameDisplay) {
        userNameDisplay.innerText = savedName;
    }


    const createQuizBtn =
        document.getElementById("createQuizBtn");

    const startQuizBtn =
        document.getElementById("startQuizBtn");

    const createQuizText =
        document.getElementById("createQuizText");

    const startQuizText =
        document.getElementById("startQuizText");


    function navigateWithDelay(
        button,
        textElement,
        loadingText,
        destination
    ) {

        if (button.disabled) {
            return;
        }

        button.disabled = true;

        button.classList.add("loading");

        textElement.textContent =
            loadingText;

        setTimeout(() => {

            window.location.href =
                destination;

        }, 1500);
    }


    createQuizBtn?.addEventListener(
        "click",
        () => {

            navigateWithDelay(
                createQuizBtn,
                createQuizText,
                "Loading...",
                "create.html"
            );

        }
    );


    startQuizBtn?.addEventListener(
        "click",
        () => {

            navigateWithDelay(
                startQuizBtn,
                startQuizText,
                "Loading...",
                "quizzstart.html"
            );

        }
    );

});