import { expect, test } from "@playwright/test";

test("el acceso es comprensible y permite llegar al registro", async ({ page }) => {
  await page.goto("/auth/login");
  await expect(page.getByRole("heading", { name: "Qué gusto verte de nuevo." })).toBeVisible();
  await expect(page.getByLabel("Correo")).toHaveAttribute("autocomplete", "email");
  await expect(page.getByLabel("Contraseña")).toHaveAttribute("autocomplete", "current-password");
  await page.getByRole("link", { name: "Crear una cuenta" }).click();
  await expect(page).toHaveURL(/\/auth\/sign-up$/);
  await expect(page.getByRole("button", { name: "Crear mi diario" })).toBeVisible();
});

test("las páginas y APIs privadas rechazan una sesión anónima", async ({ page, request }) => {
  await page.goto("/journal/today");
  await expect(page).toHaveURL(/\/auth\/login$/);

  const response = await request.get("/api/journal/2026-08-31");
  expect(response.status()).toBe(401);
  expect(response.headers()["cache-control"]).toContain("no-store");
});

test("la pantalla de acceso cabe en el ancho disponible y conserva el salto de teclado", async ({ page }) => {
  await page.goto("/auth/login");
  const sizes = await page.locator("html").evaluate((element) => ({
    viewport: element.clientWidth,
    content: element.scrollWidth,
  }));
  expect(sizes.content).toBeLessThanOrEqual(sizes.viewport + 1);

  await page.keyboard.press("Tab");
  await expect(page.getByRole("link", { name: "Saltar al contenido" })).toBeFocused();
});
