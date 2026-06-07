(function () {
  const params = new URLSearchParams(window.location.search);
  const token = params.get('token');
  const messageEl = document.getElementById('message');
  const form = document.getElementById('resetForm');
  const submitBtn = document.getElementById('submitBtn');

  function showMessage(text, type) {
    messageEl.textContent = text;
    messageEl.className = 'message ' + type;
  }

  if (!token) {
    showMessage(
      'Invalid reset link. Token is missing. Request a new reset email.',
      'error'
    );
    submitBtn.disabled = true;
    return;
  }

  form.addEventListener('submit', async function (e) {
    e.preventDefault();

    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    if (password !== confirmPassword) {
      showMessage('Passwords do not match.', 'error');
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = 'Resetting...';

    try {
      const res = await fetch('/api/v1/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + token,
        },
        body: JSON.stringify({ password: password }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        showMessage(
          'Password reset successfully! You can now log in with your new password.',
          'success'
        );
        form.reset();
      } else {
        showMessage(data.message || 'Failed to reset password.', 'error');
      }
    } catch (err) {
      showMessage('Network error. Please try again.', 'error');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Reset Password';
    }
  });
})();
