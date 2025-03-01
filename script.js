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

    function togglePasswordVisibility(inputId, iconId) {
        const passwordInput = document.getElementById(inputId);
        const eyeIcon = document.getElementById(iconId);

        if (passwordInput.type === "password") {
            passwordInput.type = "text";
            eyeIcon.classList.remove("fa-eye");
            eyeIcon.classList.add("fa-eye-slash");
        } else {
            passwordInput.type = "password";
            eyeIcon.classList.remove("fa-eye-slash");
            eyeIcon.classList.add("fa-eye");
        }
    }

    // Signup password toggle
    document.querySelector("#signup-form .password-toggle").addEventListener("click", function() {
        togglePasswordVisibility("signup-password", "signup-eye");
    });

    // Login password toggle
    document.querySelector("#login-form .password-toggle").addEventListener("click", function() {
        togglePasswordVisibility("login-password", "login-eye");
    });
});
