import { expect, test } from "@playwright/test";

test("renders the deterministic trace produced by the mocked TanStack AI route", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByTestId("playground")).toHaveAttribute("data-hydrated", "true");
  await expect(page.getByTestId("schema-valid")).toContainText("Valid");
  await expect(page.getByTestId("normalized-panel")).toContainText('"isDouble": true');
  await expect(page.getByTestId("result-panel")).toContainText('"rolls"');

  await page.getByTestId("run-mock-ai").click();

  const trace = page.getByTestId("tool-trace");
  await expect(trace).toContainText("CI-safe TanStack mock");
  await expect(trace).toContainText("calculateAiDamage");
  await expect(trace).toContainText("awaiting-input");
  await expect(trace).toContainText("input-streaming");
  await expect(trace).toContainText("executing");
  await expect(trace).toContainText("complete");
  await expect(page.getByTestId("trace-normalized")).toContainText('"isDouble": true');
  await expect(page.getByTestId("trace-result")).toContainText('"rolls"');
  await expect(page.getByTestId("ai-explanation")).toContainText(
    "deterministic calculateAiDamage tool returned",
  );
  await expect(page.getByTestId("grounding-clear")).toContainText(
    "No grounding mismatch detected.",
  );
});
