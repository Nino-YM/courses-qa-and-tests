import { test, expect } from "@playwright/test";

test.describe("Signup flow", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("should sign up successfully with valid data", async ({ page }) => {
    await page.getByLabel("Nom d'utilisateur").fill("yanis");
    await page.getByLabel("E-mail").fill("yanis@example.com");
    await page.getByLabel("Mot de passe").fill("secret123");

    await page.getByRole("button", { name: "Créer mon compte" }).click();

    await expect(page.getByText("Votre compte a été créé avec succès")).toBeVisible();
  });

  test("should show validation errors with invalid data", async ({ page }) => {
    await page.getByRole("button", { name: "Créer mon compte" }).click();

    await expect(page.getByText("Le nom d'utilisateur doit comporter au moins 2 caractères.")).toBeVisible();
    await expect(page.getByText("Veuillez saisir un e-mail valide.")).toBeVisible();
    await expect(page.getByText("Le mot de passe doit comporter au moins 6 caractères.")).toBeVisible();

    await page.getByLabel("Nom d'utilisateur").fill("y");
    await page.getByLabel("E-mail").fill("bad");
    await page.getByLabel("Mot de passe").fill("123");

    await page.getByRole("button", { name: "Créer mon compte" }).click();

    await expect(page.getByText("Le nom d'utilisateur doit comporter au moins 2 caractères.")).toBeVisible();
    await expect(page.getByText("Veuillez saisir un e-mail valide.")).toBeVisible();
    await expect(page.getByText("Le mot de passe doit comporter au moins 6 caractères.")).toBeVisible();
  });

  test("should reset form after success", async ({ page }) => {
    await page.getByLabel("Nom d'utilisateur").fill("alice");
    await page.getByLabel("E-mail").fill("alice@example.com");
    await page.getByLabel("Mot de passe").fill("longpass");

    await page.getByRole("button", { name: "Créer mon compte" }).click();

    await expect(page.getByText("Votre compte a été créé avec succès")).toBeVisible();

    await expect(page.getByLabel("Nom d'utilisateur")).toHaveValue("");
    await expect(page.getByLabel("E-mail")).toHaveValue("");
    await expect(page.getByLabel("Mot de passe")).toHaveValue("");
  });
});
