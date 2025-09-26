import test, { expect, Page } from "@playwright/test";

async function acceptCookies(page: Page) {
  const acceptCookiesButton = page.getByRole("button", { name: "Consent" });
  if (await acceptCookiesButton.isVisible()) {
    await acceptCookiesButton.click();
  }
}

test.describe("Ecommerce's product page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("https://automationexercise.com/");
    await acceptCookies(page);
  });

  test("should go to product page", async ({ page }) => {
    await page.getByRole("link", { name: " Products" }).click();
    await expect(page).toHaveURL("https://automationexercise.com/products");
    expect(await page.title()).toBe("Automation Exercise - All Products");
  });

  test("should find a t-shirt", async ({ page }) => {
    await page.getByRole("link", { name: " Products" }).click();
    await page.getByRole("textbox", { name: "Search Product" }).fill("t-shirt");
    await page.getByRole("button", { name: "" }).click();
    const products = page.locator(".features_items .product-image-wrapper");
    await expect(products).toHaveCount(3);
  });

  test("should contains product's details like title and price", async ({ page }) => {
    await page.goto("https://automationexercise.com/product_details/30");
    expect(await page.title()).toBe("Automation Exercise - Product Details");
    await expect(page.getByRole("heading", { name: "Premium Polo T-Shirts" })).toBeVisible();
    await expect(page.getByText("Rs.")).toBeVisible();
    await expect(page.getByRole("button", { name: " Add to cart" })).toBeVisible();
  });
});
