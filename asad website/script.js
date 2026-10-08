document.addEventListener('DOMContentLoaded', () => {
    const nameInput = document.getElementById('nameInput');
    const emailCard = document.getElementById('emailCard');
    const emailInput = document.getElementById('emailInput');
    const skipBtn = document.getElementById('skipBtn');
    const countryCard = document.getElementById('countryCard');
    const countrySelect = document.getElementById('countrySelect');
    const nextCard = document.getElementById('nextCard');
    const startBtn = document.getElementById('startBtn');
    const welcomeScreen = document.getElementById('welcomeScreen');
    if (welcomeScreen) {
        document.body.classList.add('no-scroll');
        setTimeout(() => {
            welcomeScreen.classList.add('fade-out');
            setTimeout(() => {
                welcomeScreen.remove();
                document.body.classList.remove('no-scroll');
            }, 800);
        }, 3000);
    }
    nameInput?.addEventListener('input', () => {
        if (nameInput.value.trim() !== '') {
            emailCard?.classList.remove('hidden');
        } else {
            emailCard?.classList.add('hidden');
            countryCard?.classList.add('hidden');
            nextCard?.classList.add('hidden');
        }
    });

    emailInput?.addEventListener('input', () => {
        if (emailInput.value.trim() !== '') {
            countryCard?.classList.remove('hidden');
        } else {
            countryCard?.classList.add('hidden');
            nextCard?.classList.add('hidden');
        }
    });

    skipBtn?.addEventListener('click', () => {
        emailInput.value = ''; // Leave email empty
        countryCard?.classList.remove('hidden');
    });

    countrySelect?.addEventListener('change', () => {
        if (countrySelect.value !== '') {
            nextCard?.classList.remove('hidden');
        }
    });

    startBtn?.addEventListener('click', () => {
        const enteredName = nameInput.value.trim();
        const enteredEmail = emailInput.value.trim();

        if (enteredName !== '') {
            localStorage.setItem('userName', enteredName);
            localStorage.setItem('nameInput', enteredName);
        }

        localStorage.setItem('userEmail', enteredEmail);

        startBtn.disabled = true;
        startBtn.style.opacity = '0.7';
        startBtn.innerText = "Please wait...";

        setTimeout(() => {
            window.location.href = "wellcome.html";
        }, 2000);
    });
});