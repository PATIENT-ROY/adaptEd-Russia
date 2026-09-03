import { Router, Request, Response } from "express";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import { authMiddleware } from "../lib/auth";
import { prisma } from "../lib/database";

const router = Router();

type AuthedRequest = Request & {
  user?: { userId: string; role: string };
};

export const BUDDY_APPLICATION_TYPES = ["STUDENT", "MENTOR"] as const;
export const BUDDY_APPLICATION_STATUSES = [
  "NEW",
  "UNDER_REVIEW",
  "APPROVED",
  "MATCHED",
  "REJECTED",
  "CLOSED",
] as const;
export const BUDDY_HELP_TOPICS = [
  "CITY_ORIENTATION",
  "TRANSPORT",
  "STUDIES",
  "DAILY_LIFE",
  "RUSSIAN_PRACTICE",
  "SOCIAL_CULTURAL",
  "OTHER",
] as const;
export const BUDDY_PARTICIPANT_STATUSES = [
  "LOCAL_RESIDENT",
  "STUDENT",
  "GRADUATE",
  "OTHER",
] as const;
export const BUDDY_CONTACT_METHODS = [
  "EMAIL",
  "PHONE",
  "TELEGRAM",
  "WHATSAPP",
  "OTHER",
] as const;

const unsafeTextPattern = /[<>\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/u;

function normalizeText(value: string): string {
  return value.normalize("NFKC").trim().replace(/[ \t]+/g, " ");
}

function textField(min: number, max: number) {
  return z
    .string()
    .transform(normalizeText)
    .pipe(
      z
        .string()
        .min(min)
        .max(max)
        .refine((value) => !unsafeTextPattern.test(value), "UNSAFE_TEXT"),
    );
}

function optionalText(max: number) {
  return z
    .string()
    .transform(normalizeText)
    .pipe(
      z
        .string()
        .max(max)
        .refine((value) => !unsafeTextPattern.test(value), "UNSAFE_TEXT"),
    )
    .optional()
    .transform((value) => value || undefined);
}

const languagesSchema = z
  .array(textField(1, 40))
  .min(1)
  .max(8)
  .transform((values) => [...new Set(values)]);

const topicsSchema = z
  .array(z.enum(BUDDY_HELP_TOPICS))
  .min(1)
  .max(BUDDY_HELP_TOPICS.length)
  .transform((values) => [...new Set(values)]);

const commonApplicationFields = {
  name: textField(2, 100),
  isAdult: z.literal(true),
  city: textField(2, 100),
  affiliation: optionalText(160),
  languages: languagesSchema,
  helpTopics: topicsSchema,
  interests: optionalText(500),
  availability: textField(2, 300),
  contactMethod: z.enum(BUDDY_CONTACT_METHODS),
  contact: textField(3, 200),
  agreedToRules: z.literal(true),
  agreedToDataPolicy: z.literal(true),
};

const studentApplicationSchema = z
  .object({
    type: z.literal("STUDENT"),
    ...commonApplicationFields,
    country: textField(2, 100),
    comment: optionalText(1000),
  })
  .strict();

const mentorApplicationSchema = z
  .object({
    type: z.literal("MENTOR"),
    ...commonApplicationFields,
    participantStatus: z.enum(BUDDY_PARTICIPANT_STATUSES),
    motivation: textField(20, 1000),
  })
  .strict();

export const buddyApplicationSchema = z.discriminatedUnion("type", [
  studentApplicationSchema,
  mentorApplicationSchema,
]);

const adminUpdateSchema = z
  .object({
    status: z.enum(BUDDY_APPLICATION_STATUSES).optional(),
    internalNote: optionalText(2000).nullable().optional(),
  })
  .strict()
  .refine(
    (value) => value.status !== undefined || value.internalNote !== undefined,
    "EMPTY_UPDATE",
  );

const listQuerySchema = z.object({
  type: z.enum(BUDDY_APPLICATION_TYPES).optional(),
  status: z.enum(BUDDY_APPLICATION_STATUSES).optional(),
  city: optionalText(100),
  page: z.coerce.number().int().min(1).max(10_000).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

function validationError(res: Response, error: z.ZodError) {
  return res.status(422).json({
    success: false,
    error: "VALIDATION_ERROR",
    issues: error.issues.map((issue) => ({
      path: issue.path.join("."),
      code: issue.message === "UNSAFE_TEXT" ? "UNSAFE_TEXT" : "INVALID_VALUE",
    })),
  });
}

function requireAdmin(req: AuthedRequest, res: Response, next: () => void) {
  if (req.user?.role !== "ADMIN") {
    return res.status(403).json({ success: false, error: "FORBIDDEN" });
  }
  next();
}

const submissionLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  skip: () => process.env.RATE_LIMIT === "false",
  keyGenerator: (req) =>
    `buddy:${(req as AuthedRequest).user?.userId || "anon"}`,
  validate: false,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    res.status(429).json({ success: false, error: "BUDDY_RATE_LIMITED" });
  },
});

router.post(
  "/applications",
  authMiddleware,
  submissionLimiter,
  async (req: AuthedRequest, res) => {
    const parsed = buddyApplicationSchema.safeParse(req.body);
    if (!parsed.success) return validationError(res, parsed.error);

    const data = parsed.data;
    try {
      const application = await prisma.buddyApplication.create({
        data: {
          ...data,
          userId: req.user!.userId,
          country: data.type === "STUDENT" ? data.country : null,
          participantStatus:
            data.type === "MENTOR" ? data.participantStatus : null,
          motivation: data.type === "MENTOR" ? data.motivation : null,
          comment: data.type === "STUDENT" ? data.comment : null,
        },
        select: {
          id: true,
          type: true,
          status: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      return res.status(201).json({ success: true, data: application });
    } catch {
      // Never log request bodies or Prisma errors here: they may contain PII.
      console.error("Buddy application creation failed");
      return res.status(500).json({ success: false, error: "SERVER_ERROR" });
    }
  },
);

router.get("/applications/mine", authMiddleware, async (req: AuthedRequest, res) => {
  try {
    const applications = await prisma.buddyApplication.findMany({
      where: { userId: req.user!.userId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        type: true,
        status: true,
        city: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    return res.json({ success: true, data: applications });
  } catch {
    console.error("Buddy application list failed");
    return res.status(500).json({ success: false, error: "SERVER_ERROR" });
  }
});

router.get("/applications/:id", authMiddleware, async (req: AuthedRequest, res) => {
  try {
    const application = await prisma.buddyApplication.findFirst({
      where: { id: String(req.params.id), userId: req.user!.userId },
      select: {
        id: true,
        type: true,
        status: true,
        city: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    if (!application) {
      return res.status(404).json({ success: false, error: "NOT_FOUND" });
    }
    return res.json({ success: true, data: application });
  } catch {
    console.error("Buddy application lookup failed");
    return res.status(500).json({ success: false, error: "SERVER_ERROR" });
  }
});

router.get(
  "/admin/applications",
  authMiddleware,
  requireAdmin,
  async (req: AuthedRequest, res) => {
    const parsed = listQuerySchema.safeParse(req.query);
    if (!parsed.success) return validationError(res, parsed.error);
    const { type, status, city, page, limit } = parsed.data;
    const where = {
      ...(type ? { type } : {}),
      ...(status ? { status } : {}),
      ...(city ? { city: { contains: city, mode: "insensitive" as const } } : {}),
    };

    try {
      const [applications, total, newCount] = await Promise.all([
        prisma.buddyApplication.findMany({
          where,
          orderBy: { createdAt: "desc" },
          skip: (page - 1) * limit,
          take: limit,
          select: {
            id: true,
            type: true,
            status: true,
            city: true,
            languages: true,
            createdAt: true,
            updatedAt: true,
          },
        }),
        prisma.buddyApplication.count({ where }),
        prisma.buddyApplication.count({ where: { status: "NEW" } }),
      ]);

      return res.json({
        success: true,
        data: applications,
        meta: { total, page, limit, newCount },
      });
    } catch {
      console.error("Buddy admin list failed");
      return res.status(500).json({ success: false, error: "SERVER_ERROR" });
    }
  },
);

router.get(
  "/admin/applications/:id",
  authMiddleware,
  requireAdmin,
  async (req: AuthedRequest, res) => {
    try {
      const application = await prisma.buddyApplication.findUnique({
        where: { id: String(req.params.id) },
        include: { user: { select: { id: true, email: true } } },
      });
      if (!application) {
        return res.status(404).json({ success: false, error: "NOT_FOUND" });
      }
      return res.json({ success: true, data: application });
    } catch {
      console.error("Buddy admin detail failed");
      return res.status(500).json({ success: false, error: "SERVER_ERROR" });
    }
  },
);

router.patch(
  "/admin/applications/:id",
  authMiddleware,
  requireAdmin,
  async (req: AuthedRequest, res) => {
    const parsed = adminUpdateSchema.safeParse(req.body);
    if (!parsed.success) return validationError(res, parsed.error);

    try {
      const application = await prisma.buddyApplication.update({
        where: { id: String(req.params.id) },
        data: parsed.data,
        include: { user: { select: { id: true, email: true } } },
      });
      return res.json({ success: true, data: application });
    } catch (error: unknown) {
      const code =
        typeof error === "object" && error !== null && "code" in error
          ? String((error as { code?: unknown }).code)
          : "";
      if (code === "P2025") {
        return res.status(404).json({ success: false, error: "NOT_FOUND" });
      }
      console.error("Buddy admin update failed");
      return res.status(500).json({ success: false, error: "SERVER_ERROR" });
    }
  },
);

export default router;
