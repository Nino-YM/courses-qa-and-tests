const form = document.getElementById("signup-form");
const success = document.getElementById("success");

function setError(field, message) {
  const err = document.querySelector(`[data-error-for="${field.id}"]`);
  if (err) err.textContent = message || "";
  field.setAttribute("aria-invalid", message ? "true" : "false");
}

function validate(formData) {
  const username = formData.get("username")?.trim();
  const email = formData.get("email")?.trim();
  const password = formData.get("password")?.trim();

  const errors = {};

  if (!username || username.length < 2) {
    errors.username = "Le nom d'utilisateur doit comporter au moins 2 caractères.";
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email)) {
    errors.email = "Veuillez saisir un e-mail valide.";
  }

  if (!password || password.length < 6) {
    errors.password = "Le mot de passe doit comporter au moins 6 caractères.";
  }

  return errors;
}

form?.addEventListener("submit", async (e) => {
  e.preventDefault();
  success.hidden = true;

  ["username", "email", "password"].forEach((id) => setError(document.getElementById(id), ""));

  const formData = new FormData(form);
  const errors = validate(formData);

  if (Object.keys(errors).length > 0) {
    if (errors.username) setError(document.getElementById("username"), errors.username);
    if (errors.email) setError(document.getElementById("email"), errors.email);
    if (errors.password) setError(document.getElementById("password"), errors.password);
    return;
  }

  await new Promise((r) => setTimeout(r, 200));

  form.reset();
  success.hidden = false;
});
