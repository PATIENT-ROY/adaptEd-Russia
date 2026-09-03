import { expect, test, type APIRequestContext, type BrowserContext } from "@playwright/test";
import { PrismaClient } from "../../server/prisma/generated";

const API_BASE_URL = process.env.E2E_API_BASE_URL || "http://localhost:3013/api";
const prisma = new PrismaClient();

type AuthPayload = {
  token: string;
  user: { id: string; name: string; email: string; role: string; language: string; plan: string; country?: string };
};

async function register(request: APIRequestContext, prefix: string): Promise<AuthPayload> {
  const email = `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}@e2e.local`;
  const response = await request.post(`${API_BASE_URL}/auth/register`, {
    data: { email, password: "TestPass123", name: prefix, language: "RU", country: "Кения" },
  });
  expect(response.status()).toBe(201);
  return (await response.json()).data as AuthPayload;
}

async function login(request: APIRequestContext, email: string): Promise<AuthPayload> {
  const response = await request.post(`${API_BASE_URL}/auth/login`, {
    data: { email, password: "TestPass123" },
  });
  expect(response.ok()).toBeTruthy();
  return (await response.json()).data as AuthPayload;
}

async function seedAuth(context: BrowserContext, auth: AuthPayload, language = "RU") {
  await context.addInitScript(({ token, user, language }) => {
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(user));
    localStorage.setItem("language", language);
  }, { token: auth.token, user: auth.user, language });
}

const studentPayload = {
  type: "STUDENT",
  name: "Amina Test",
  isAdult: true,
  country: "Кения",
  city: "Казань",
  affiliation: "КФУ",
  languages: ["русский", "English"],
  helpTopics: ["TRANSPORT", "STUDIES"],
  interests: "Музыка",
  availability: "По выходным после 14:00",
  contactMethod: "EMAIL",
  contact: "amina@example.test",
  comment: "Буду рада знакомству",
  agreedToRules: true,
  agreedToDataPolicy: true,
};

const mentorPayload = {
  type: "MENTOR",
  name: "Иван Тест",
  isAdult: true,
  city: "Казань",
  participantStatus: "GRADUATE",
  affiliation: "КФУ",
  languages: ["русский", "English"],
  helpTopics: ["CITY_ORIENTATION", "RUSSIAN_PRACTICE"],
  availability: "Суббота и воскресенье",
  contactMethod: "TELEGRAM",
  contact: "@ivan_test",
  motivation: "Хочу помочь студентам спокойно освоиться в новом городе.",
  agreedToRules: true,
  agreedToDataPolicy: true,
};

test.afterAll(async () => {
  await prisma.$disconnect();
});

test.describe("AdaptEd Buddy", () => {
  test("public page opens, home cards target the forms, and RU/EN copy renders", async ({ page }) => {
    await page.goto("/buddy");
    await expect(page.getByRole("heading", { name: "Осваиваться в России легче вместе" })).toBeVisible();
    await expect(page.getByText("Участие бесплатное")).toBeVisible();
    await expect(page.locator("#application")).toContainText("Войдите, чтобы отправить анкету");

    await page.goto("/");
    const studentLink = page.locator('#home-buddy a[href="/buddy?form=student#application"]');
    const mentorLink = page.locator('#home-buddy a[href="/buddy?form=mentor#application"]');
    await expect(studentLink).toBeVisible();
    await expect(mentorLink).toBeVisible();
    await expect(page.locator("#home-buddy")).not.toContainText("Скоро");
    await studentLink.click();
    await expect(page).toHaveURL(/\/buddy\?form=student#application$/);
    await expect(page.getByTestId("buddy-open-student")).toBeVisible();

    await page.evaluate(() => localStorage.setItem("language", "EN"));
    await page.reload();
    await expect(page.getByRole("heading", { name: "Settling into Russia is easier together" })).toBeVisible();
    await expect(page.getByText("Participation is free")).toBeVisible();
  });

  test("student and mentor submissions validate ownership and admin workflow", async ({ request }) => {
    const student = await register(request, "buddy-student");
    const other = await register(request, "buddy-other");
    const adminBase = await register(request, "buddy-admin");
    await prisma.user.update({ where: { id: adminBase.user.id }, data: { role: "ADMIN" } });
    const admin = await login(request, adminBase.user.email);

    const studentCreate = await request.post(`${API_BASE_URL}/buddy/applications`, {
      headers: { Authorization: `Bearer ${student.token}` },
      data: studentPayload,
    });
    expect(studentCreate.status()).toBe(201);
    const studentApplication = (await studentCreate.json()).data;
    expect(studentApplication.type).toBe("STUDENT");
    expect(studentApplication.status).toBe("NEW");
    expect(studentApplication.contact).toBeUndefined();
    expect(studentApplication.internalNote).toBeUndefined();

    const mentorCreate = await request.post(`${API_BASE_URL}/buddy/applications`, {
      headers: { Authorization: `Bearer ${other.token}` },
      data: mentorPayload,
    });
    expect(mentorCreate.status()).toBe(201);
    expect((await mentorCreate.json()).data.type).toBe("MENTOR");

    const tooLong = await request.post(`${API_BASE_URL}/buddy/applications`, {
      headers: { Authorization: `Bearer ${student.token}` },
      data: { ...studentPayload, name: "x".repeat(101) },
    });
    expect(tooLong.status()).toBe(422);
    expect((await tooLong.json()).error).toBe("VALIDATION_ERROR");

    const unsafe = await request.post(`${API_BASE_URL}/buddy/applications`, {
      headers: { Authorization: `Bearer ${student.token}` },
      data: { ...studentPayload, name: "<script>alert(1)</script>" },
    });
    expect(unsafe.status()).toBe(422);

    const foreign = await request.get(`${API_BASE_URL}/buddy/applications/${studentApplication.id}`, {
      headers: { Authorization: `Bearer ${other.token}` },
    });
    expect(foreign.status()).toBe(404);

    const own = await request.get(`${API_BASE_URL}/buddy/applications/${studentApplication.id}`, {
      headers: { Authorization: `Bearer ${student.token}` },
    });
    expect(own.ok()).toBeTruthy();
    const ownBody = await own.json();
    expect(ownBody.data.id).toBe(studentApplication.id);
    expect(ownBody.data.contact).toBeUndefined();
    expect(ownBody.data.internalNote).toBeUndefined();

    const forbiddenList = await request.get(`${API_BASE_URL}/buddy/admin/applications`, {
      headers: { Authorization: `Bearer ${student.token}` },
    });
    expect(forbiddenList.status()).toBe(403);
    const forbiddenUpdate = await request.patch(`${API_BASE_URL}/buddy/admin/applications/${studentApplication.id}`, {
      headers: { Authorization: `Bearer ${student.token}` },
      data: { status: "APPROVED" },
    });
    expect(forbiddenUpdate.status()).toBe(403);

    const adminList = await request.get(`${API_BASE_URL}/buddy/admin/applications?type=STUDENT&status=NEW&city=Казань`, {
      headers: { Authorization: `Bearer ${admin.token}` },
    });
    expect(adminList.ok()).toBeTruthy();
    const listBody = await adminList.json();
    expect(listBody.data.some((item: { id: string }) => item.id === studentApplication.id)).toBeTruthy();
    expect(listBody.meta.newCount).toBeGreaterThan(0);

    const detail = await request.get(`${API_BASE_URL}/buddy/admin/applications/${studentApplication.id}`, {
      headers: { Authorization: `Bearer ${admin.token}` },
    });
    expect(detail.ok()).toBeTruthy();
    expect((await detail.json()).data.contact).toBe(studentPayload.contact);

    const update = await request.patch(`${API_BASE_URL}/buddy/admin/applications/${studentApplication.id}`, {
      headers: { Authorization: `Bearer ${admin.token}` },
      data: { status: "UNDER_REVIEW", internalNote: "Проверить доступность по выходным" },
    });
    expect(update.ok()).toBeTruthy();
    const updated = (await update.json()).data;
    expect(updated.status).toBe("UNDER_REVIEW");
    expect(updated.internalNote).toBe("Проверить доступность по выходным");
  });

  test("signed-in student submits from the UI without duplicate clicks", async ({ browser, request }) => {
    const auth = await register(request, "buddy-ui");
    const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
    await seedAuth(context, auth);
    const page = await context.newPage();
    await page.goto("/buddy?form=student#application");
    await expect(page.getByTestId("buddy-student-form")).toBeVisible();
    await page.getByTestId("buddy-name").fill("Amina UI");
    await page.getByTestId("buddy-country").fill("Кения");
    await page.getByTestId("buddy-city").fill("Екатеринбург");
    await page.getByTestId("buddy-languages").fill("русский, English");
    await page.getByTestId("buddy-topic-CITY_ORIENTATION").check();
    await page.getByTestId("buddy-availability").fill("По субботам");
    await page.getByTestId("buddy-contact").fill("amina-ui@example.test");
    await page.getByTestId("buddy-adult").check();
    await page.getByTestId("buddy-rules").check();
    await page.getByTestId("buddy-data-policy").check();
    const submit = page.getByTestId("buddy-submit");
    await submit.focus();
    await page.keyboard.press("Enter");
    await expect(page.getByTestId("buddy-success")).toBeVisible();
    await expect(submit).toHaveCount(0);
    await context.close();
  });
});
