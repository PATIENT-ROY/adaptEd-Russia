import { expect, test, type APIRequestContext } from "@playwright/test";

const API_BASE_URL = process.env.E2E_API_BASE_URL || "http://localhost:3013/api";

type AuthPayload = {
  token: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    language: string;
    plan: string;
    country?: string;
  };
};

async function registerUser(
  request: APIRequestContext,
  seed: string,
  name: string,
): Promise<AuthPayload> {
  const email = `${name.toLowerCase()}-${seed}@e2e.local`;
  const response = await request.post(`${API_BASE_URL}/auth/register`, {
    data: {
      email,
      password: "TestPass123",
      name,
      language: "RU",
      country: "RU",
    },
  });

  if (!response.ok()) {
    const errorBody = await response.text();
    throw new Error(
      `register failed: status=${response.status()} body=${errorBody}`,
    );
  }
  const body = await response.json();
  expect(body.success).toBeTruthy();
  return body.data as AuthPayload;
}

async function createQuestion(
  request: APIRequestContext,
  token: string,
  title: string,
  description: string,
) {
  const response = await request.post(`${API_BASE_URL}/questions`, {
    data: { title, description },
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  expect(response.ok()).toBeTruthy();
  const body = await response.json();
  expect(body.success).toBeTruthy();
}

test.describe("community/questions", () => {
  test("like/unlike, search and pagination should work end-to-end", async ({
    page,
    request,
  }) => {
    const seed = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const prefix = `E2E-Q-${seed}`;
    const needle = `${prefix}-needle`;

    const author = await registerUser(request, seed, "author");
    const reader = await registerUser(request, seed, "reader");

    for (let i = 0; i < 25; i += 1) {
      const title = i === 0 ? `${needle} title` : `${prefix} title ${i}`;
      await createQuestion(request, author.token, title, `desc ${i}`);
    }

    await page.addInitScript(
      ({ token, user }) => {
        localStorage.setItem("token", token);
        localStorage.setItem("user", JSON.stringify(user));
      },
      { token: reader.token, user: reader.user },
    );

    await page.goto("/community/questions");
    await expect(page.getByRole("heading", { name: "Сообщество" })).toBeVisible();

    const searchInput = page.getByTestId("questions-search");
    const cards = page.locator('[data-testid^="question-card-"]');
    await expect(cards.first()).toBeVisible();

    const initialCount = await cards.count();
    expect(initialCount).toBeGreaterThanOrEqual(20);

    const firstCard = cards.first();
    const likeButton = firstCard.locator('[data-testid^="question-like-"]');
    const likeBefore = parseInt((await likeButton.innerText()).trim(), 10);

    await likeButton.click();
    await expect.poll(async () => {
      const value = parseInt((await likeButton.innerText()).trim(), 10);
      return value;
    }).toBe(likeBefore + 1);

    await likeButton.click();
    await expect.poll(async () => {
      const value = parseInt((await likeButton.innerText()).trim(), 10);
      return value;
    }).toBe(likeBefore);

    const loadMoreButton = page.getByTestId("questions-load-more");
    await expect(loadMoreButton).toBeVisible();
    await loadMoreButton.click();
    await expect.poll(async () => cards.count()).toBeGreaterThan(initialCount);

    await searchInput.fill(prefix);
    const prefixResponse = await page.waitForResponse((response) => {
      const url = response.url();
      return (
        url.includes("/api/questions?") &&
        url.includes(`search=${encodeURIComponent(prefix)}`) &&
        response.request().method() === "GET"
      );
    });
    const prefixBody = await prefixResponse.json();
    expect(prefixBody.success).toBeTruthy();
    expect((prefixBody.data ?? []).length).toBeGreaterThanOrEqual(1);

    await searchInput.fill(needle);
    const needleResponse = await page.waitForResponse((response) => {
      const url = response.url();
      return (
        url.includes("/api/questions?") &&
        url.includes(`search=${encodeURIComponent(needle)}`) &&
        response.request().method() === "GET"
      );
    });
    const needleBody = await needleResponse.json();
    expect(needleBody.success).toBeTruthy();
    expect((needleBody.meta?.total ?? 0)).toBe(1);
    expect((needleBody.data ?? []).length).toBe(1);
    await expect(page.getByText(`${needle} title`)).toBeVisible();
  });
});
