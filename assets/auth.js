// Prototype-only behavior for the Login / Sign Up screens.
// There is no backend in this bundle, so submit just simulates the
// button's real "Processing…" state and then explains itself, rather
// than silently doing nothing (which would look broken).

function setupPasswordToggle(buttonId, inputId) {
  const button = document.getElementById(buttonId);
  const input = document.getElementById(inputId);
  if (!button || !input) return;

  const eyeIcon = button.querySelector(".icon-eye");
  const eyeOffIcon = button.querySelector(".icon-eye-off");

  button.addEventListener("click", () => {
    const showing = input.type === "text";
    input.type = showing ? "password" : "text";
    eyeIcon.classList.toggle("hidden", !showing);
    eyeOffIcon.classList.toggle("hidden", showing);
    button.setAttribute("aria-label", showing ? "Show password" : "Hide password");
  });
}

function setupDemoSubmit(formId, buttonId, processingLabel, noteId) {
  const form = document.getElementById(formId);
  const button = document.getElementById(buttonId);
  const note = document.getElementById(noteId);
  if (!form || !button) return;

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }
    const originalLabel = button.textContent;
    button.disabled = true;
    button.textContent = processingLabel;
    window.setTimeout(() => {
      button.disabled = false;
      button.textContent = originalLabel;
      if (note) note.classList.remove("hidden");
    }, 900);
  });
}
