import { expect, test } from "@playwright/test";

test("renders the deterministic trace produced by the mocked TanStack AI route", async ({ page }) => {
  await page.goto("/");

  await expect(page.locator("main")).toHaveAttribute("data-hydrated", "true");
  await expect(page.getByRole("status")).toHaveText("Valid");
  await expect(page.getByRole("region", { name: "Normalized / Defaulted Input" })).toContainText('"isDouble": true');
  await expect(page.getByRole("region", { name: "Raw DamageResult" })).toContainText('"rolls"');

  await page.getByRole("button", { name: "Run CI-safe TanStack mock" }).click();

  const trace = page.getByRole("region", { name: "AI ↔ deterministic contract" });
  await expect(trace).toContainText("CI-safe TanStack mock");
  await expect(trace).toContainText("calculateAiDamage");
  await expect(trace).toContainText("awaiting-input");
  await expect(trace).toContainText("input-streaming");
  await expect(trace).toContainText("executing");
  await expect(trace).toContainText("complete");
  await expect(page.getByRole("region", { name: "Normalized / Defaulted Arguments" })).toContainText('"isDouble": true');
  await expect(page.getByRole("region", { name: "Raw Deterministic Result Returned to Model" })).toContainText('"rolls"');
  await expect(trace).toContainText(
    "deterministic calculateAiDamage tool returned",
  );
  await expect(trace).toContainText(
    "No grounding mismatch detected.",
  );
});

test("surfaces optional OpenAI endpoint failures", async ({ page }) => {
  await page.route("**/api/chat", async (route) => {
    await route.fulfill({
      status: 503,
      contentType: "application/json",
      body: JSON.stringify({ error: "Optional OpenAI turn unavailable" }),
    });
  });
  await page.goto("/");

  await expect(page.locator("main")).toHaveAttribute("data-hydrated", "true");
  await page.getByRole("button", { name: "Run optional OpenAI turn" }).click();

  await expect(page.getByRole("alert")).toContainText(
    "HTTP error! status: 503 Service Unavailable",
  );
});
