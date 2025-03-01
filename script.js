document.addEventListener("DOMContentLoaded", () => {
    const tabButtons = document.querySelectorAll('.tab-btn');
    const signupForm = document.getElementById('signup-form');
    const loginForm = document.getElementById('login-form');

    tabButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            if (btn.dataset.tab === 'signup') {
                signupForm.classList.add('active');
                loginForm.classList.remove('active');
            } else if (btn.dataset.tab === 'login') {
                loginForm.classList.add('active');
                signupForm.classList.remove('active');
            }
        });
    });
});
