import { expect, test } from "@playwright/test";

const email = process.env.E2E_USER_EMAIL;
const password = process.env.E2E_USER_PASSWORD;

test.describe("editor con una cuenta exclusiva de pruebas", () => {
  test.beforeEach(async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "desktop", "El flujo con escritura se ejecuta una sola vez.");
    test.skip(!email || !password, "Configura E2E_USER_EMAIL y E2E_USER_PASSWORD para habilitarlo.");
    await page.goto("/auth/login");
    await page.getByLabel("Correo").fill(email!);
    await page.getByLabel("Contraseña").fill(password!);
    await page.getByRole("button", { name: "Entrar a mi diario" }).click();
    await expect(page).toHaveURL(/\/$/);
  });

  test("abre el libro y comprueba edición, historial local y zoom", async ({ page }) => {
    await page.goto("/journal/today");
    await page.getByRole("button", { name: "Abrir el libro de hoy" }).click();
    await page.getByTitle("Añadir estrella").click();
    await expect(page.getByRole("button", { name: "Deshacer último cambio" })).toBeEnabled();
    await page.getByRole("button", { name: "Deshacer último cambio" }).click();
    await expect(page.getByRole("button", { name: "Rehacer último cambio" })).toBeEnabled();
    await page.getByRole("button", { name: "Acercar el libro" }).click();
    await expect(page.getByRole("button", { name: "Restablecer zoom al cien por ciento" })).toHaveText("125%");
  });
});
