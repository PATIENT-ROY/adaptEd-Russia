import { expect, test, type APIRequestContext, type BrowserContext } from "@playwright/test";

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

async function seedAuth(context: BrowserContext, auth: AuthPayload) {
  await context.addInitScript(
    ({ token, user }) => {
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));
    },
    { token: auth.token, user: auth.user },
  );
}

async function waitQuestionsSearchResponse(page: any, term: string) {
  return page.waitForResponse((response: any) => {
    if (response.request().method() !== "GET") return false;
    let parsed: URL;
    try {
      parsed = new URL(response.url());
    } catch {
      return false;
    }
    if (!parsed.pathname.endsWith("/api/questions")) return false;
    return parsed.searchParams.get("search") === term;
  });
}

test.describe("community/questions CRUD", () => {
  test("author can create and delete question, another user can answer", async ({
    browser,
    request,
  }) => {
    test.setTimeout(90_000);

    const seed = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const title = `E2E-CRUD-${seed} title`;
    const description = `E2E-CRUD-${seed} description`;
    const answer = `E2E-CRUD-${seed} answer`;

    const author = await registerUser(request, seed, "authorcrud");
    const helper = await registerUser(request, seed, "helpercrud");

    const authorContext = await browser.newContext();
    await seedAuth(authorContext, author);
    const authorPage = await authorContext.newPage();

    await authorPage.goto("/community/questions");
    await expect(authorPage.getByRole("heading", { name: "Сообщество" })).toBeVisible();

    await authorPage.getByTestId("open-question-form").click();
    await authorPage.getByTestId("question-form-title").fill(title);
    await authorPage.getByTestId("question-form-description").fill(description);
    await authorPage.getByTestId("question-form-submit").click();

    await expect(authorPage.getByText(title)).toBeVisible();

    const authorSearchResponsePromise = waitQuestionsSearchResponse(authorPage, title);
    await authorPage.getByTestId("questions-search").fill(title);
    const authorSearchResponse = await authorSearchResponsePromise;
    const authorSearchBody = await authorSearchResponse.json();
    expect(authorSearchBody.success).toBeTruthy();
    expect((authorSearchBody.meta?.total ?? 0)).toBe(1);

    const questionId = (authorSearchBody.data?.[0]?.id as string) || "";
    expect(questionId.length).toBeGreaterThan(0);

    await authorPage.getByTestId(`question-toggle-${questionId}`).click();
    await expect(authorPage.getByTestId(`question-delete-${questionId}`)).toBeVisible();

    const helperContext = await browser.newContext();
    await seedAuth(helperContext, helper);
    const helperPage = await helperContext.newPage();
    await helperPage.goto("/community/questions");
    await expect(helperPage.getByRole("heading", { name: "Сообщество" })).toBeVisible();

    const helperSearchResponsePromise = waitQuestionsSearchResponse(helperPage, title);
    await helperPage.getByTestId("questions-search").fill(title);
    const helperSearchResponse = await helperSearchResponsePromise;
    const helperSearchBody = await helperSearchResponse.json();
    expect(helperSearchBody.success).toBeTruthy();
    expect((helperSearchBody.meta?.total ?? 0)).toBe(1);

    await helperPage.getByTestId(`question-toggle-${questionId}`).click();
    await helperPage.getByTestId(`question-answer-input-${questionId}`).fill(answer);
    await helperPage.getByTestId(`question-answer-submit-${questionId}`).click();
    await expect(helperPage.getByText(answer)).toBeVisible();

    await authorPage.reload();
    const authorReloadSearchPromise = waitQuestionsSearchResponse(authorPage, title);
    await authorPage.getByTestId("questions-search").fill(title);
    await authorReloadSearchPromise;
    await authorPage.getByTestId(`question-toggle-${questionId}`).click();
    await expect(authorPage.getByText(answer)).toBeVisible();

    await authorPage.getByTestId(`question-delete-${questionId}`).click();
    await authorPage.getByTestId(`question-delete-${questionId}`).click();
    await expect(authorPage.getByTestId(`question-card-${questionId}`)).toHaveCount(0);

    await helperPage.reload();
    const afterDeletePromise = waitQuestionsSearchResponse(helperPage, title);
    await helperPage.getByTestId("questions-search").fill(title);
    const afterDeleteResponse = await afterDeletePromise;
    const afterDeleteBody = await afterDeleteResponse.json();
    expect(afterDeleteBody.success).toBeTruthy();
    expect((afterDeleteBody.meta?.total ?? 0)).toBe(0);

    await authorContext.close();
    await helperContext.close();
  });
});
