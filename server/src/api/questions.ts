import { Router, Request } from "express";
import { z } from "zod";
import { authMiddleware, verifyToken, JWTPayload } from "../lib/auth.js";
import { prisma } from "../lib/database.js";

interface AuthenticatedRequest extends Request {
  user?: JWTPayload;
}

const router = Router();

const createQuestionSchema = z.object({
  title: z.string().min(5, "Заголовок должен содержать минимум 5 символов"),
  description: z.string().optional(),
});

const createAnswerSchema = z.object({
  content: z.string().min(2, "Ответ должен содержать минимум 2 символа"),
});

const updateAnswerSchema = z.object({
  content: z.string().min(2, "Ответ должен содержать минимум 2 символа"),
});

const querySchema = z.object({
  sort: z.enum(["popular", "new"]).default("new"),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
  status: z.enum(["all", "answered", "unanswered"]).default("all"),
  mine: z
    .union([z.boolean(), z.enum(["true", "false", "1", "0"])])
    .optional()
    .transform((v) => v === true || v === "true" || v === "1"),
});

function resolveUserId(req: Request): string | null {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) return null;
  const payload = verifyToken(authHeader.substring(7));
  return payload?.userId ?? null;
}

function searchWhere(search?: string) {
  if (!search?.trim()) return {};
  const q = search.trim();
  return {
    OR: [
      { title: { contains: q } },
      { description: { contains: q } },
      { author: { name: { contains: q } } },
    ],
  };
}

function formatAnswer(a: {
  id: string;
  content: string;
  author: { id: string; name: string };
  createdAt: Date;
  updatedAt?: Date;
}) {
  return {
    id: a.id,
    content: a.content,
    author: a.author.name,
    authorId: a.author.id,
    createdAt: a.createdAt.getTime(),
    updatedAt: a.updatedAt?.getTime(),
    timeLabel: getTimeLabel(a.createdAt),
  };
}

// GET /api/questions
router.get("/", async (req: AuthenticatedRequest, res) => {
  try {
    const { sort, page, limit, search, status, mine } = querySchema.parse(
      req.query,
    );
    const currentUserId = resolveUserId(req);

    if (mine && !currentUserId) {
      return res.status(401).json({
        success: false,
        message: "Войдите, чтобы видеть свои вопросы",
      });
    }

    const baseWhere = searchWhere(search);
    const listWhere: Record<string, unknown> = { ...baseWhere };
    if (status === "answered") listWhere.isAnswered = true;
    if (status === "unanswered") listWhere.isAnswered = false;
    if (mine && currentUserId) listWhere.authorId = currentUserId;

    const [questions, filteredTotal, allTotal, answered, unanswered] =
      await Promise.all([
        prisma.question.findMany({
          where: listWhere,
          include: {
            author: { select: { id: true, name: true } },
            answers: { select: { id: true } },
            likes: { select: { userId: true } },
          },
          orderBy:
            sort === "new"
              ? [{ createdAt: "desc" }]
              : [{ likes: { _count: "desc" } }, { createdAt: "desc" }],
          skip: (page - 1) * limit,
          take: limit,
        }),
        prisma.question.count({ where: listWhere }),
        prisma.question.count({ where: baseWhere }),
        prisma.question.count({ where: { ...baseWhere, isAnswered: true } }),
        prisma.question.count({ where: { ...baseWhere, isAnswered: false } }),
      ]);

    const formattedQuestions = questions.map((q) => ({
      id: q.id,
      title: q.title,
      description: q.description,
      answersCount: q.answers.length,
      likesCount: q.likes.length,
      author: q.author.name,
      authorId: q.author.id,
      isAnswered: q.isAnswered,
      acceptedAnswerId: q.acceptedAnswerId,
      isLikedByCurrentUser: currentUserId
        ? q.likes.some((l) => l.userId === currentUserId)
        : false,
      createdAt: q.createdAt.getTime(),
      timeLabel: getTimeLabel(q.createdAt),
    }));

    res.json({
      success: true,
      data: formattedQuestions,
      meta: {
        total: filteredTotal,
        all: allTotal,
        page,
        limit,
        hasMore: page * limit < filteredTotal,
        answered,
        unanswered,
      },
    });
  } catch (error) {
    console.error("Ошибка при получении вопросов:", error);
    res.status(500).json({
      success: false,
      message: "Внутренняя ошибка сервера",
    });
  }
});

// GET /api/questions/:id
router.get("/:id", async (req, res) => {
  try {
    const currentUserId = resolveUserId(req);

    const question = await prisma.question.findUnique({
      where: { id: req.params.id },
      include: {
        author: { select: { id: true, name: true } },
        answers: {
          include: {
            author: { select: { id: true, name: true } },
          },
          orderBy: { createdAt: "asc" },
        },
        likes: { select: { userId: true } },
      },
    });

    if (!question) {
      return res.status(404).json({
        success: false,
        message: "Вопрос не найден",
      });
    }

    const answers = question.answers.map((a) => ({
      ...formatAnswer(a),
      isAccepted: question.acceptedAnswerId === a.id,
    }));

    // Best answer first
    answers.sort((a, b) => Number(b.isAccepted) - Number(a.isAccepted));

    res.json({
      success: true,
      data: {
        id: question.id,
        title: question.title,
        description: question.description,
        author: question.author.name,
        authorId: question.author.id,
        isAnswered: question.isAnswered,
        acceptedAnswerId: question.acceptedAnswerId,
        answersCount: question.answers.length,
        createdAt: question.createdAt.getTime(),
        timeLabel: getTimeLabel(question.createdAt),
        likesCount: question.likes.length,
        isLikedByCurrentUser: currentUserId
          ? question.likes.some((l) => l.userId === currentUserId)
          : false,
        likedByUserIds: question.likes.map((l) => l.userId),
        answers,
      },
    });
  } catch (error) {
    console.error("Ошибка при получении вопроса:", error);
    res.status(500).json({
      success: false,
      message: "Внутренняя ошибка сервера",
    });
  }
});

// POST /api/questions
router.post("/", authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const validatedData = createQuestionSchema.parse(req.body);

    const question = await prisma.question.create({
      data: {
        title: validatedData.title,
        description: validatedData.description,
        authorId: req.user!.userId,
      },
      include: {
        author: { select: { id: true, name: true } },
      },
    });

    res.status(201).json({
      success: true,
      data: {
        id: question.id,
        title: question.title,
        description: question.description,
        author: question.author.name,
        authorId: question.author.id,
        answersCount: 0,
        likesCount: 0,
        isAnswered: false,
        acceptedAnswerId: null,
        isLikedByCurrentUser: false,
        createdAt: question.createdAt.getTime(),
        timeLabel: "только что",
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: "Ошибка валидации",
        errors: error.errors,
      });
    }
    console.error("Ошибка при создании вопроса:", error);
    res.status(500).json({
      success: false,
      message: "Внутренняя ошибка сервера",
    });
  }
});

// POST /api/questions/:id/answers
router.post(
  "/:id/answers",
  authMiddleware,
  async (req: AuthenticatedRequest, res) => {
    try {
      const validatedData = createAnswerSchema.parse(req.body);

      const question = await prisma.question.findUnique({
        where: { id: req.params.id },
      });

      if (!question) {
        return res.status(404).json({
          success: false,
          message: "Вопрос не найден",
        });
      }

      const answer = await prisma.answer.create({
        data: {
          content: validatedData.content,
          questionId: req.params.id,
          authorId: req.user!.userId,
        },
        include: {
          author: { select: { id: true, name: true } },
        },
      });

      await prisma.question.update({
        where: { id: req.params.id },
        data: { isAnswered: true },
      });

      res.status(201).json({
        success: true,
        data: {
          ...formatAnswer(answer),
          isAccepted: false,
        },
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          message: "Ошибка валидации",
          errors: error.errors,
        });
      }
      console.error("Ошибка при создании ответа:", error);
      res.status(500).json({
        success: false,
        message: "Внутренняя ошибка сервера",
      });
    }
  },
);

// PATCH /api/questions/:id/answers/:answerId — edit own answer
router.patch(
  "/:id/answers/:answerId",
  authMiddleware,
  async (req: AuthenticatedRequest, res) => {
    try {
      const validatedData = updateAnswerSchema.parse(req.body);
      const { id: questionId, answerId } = req.params;

      const answer = await prisma.answer.findUnique({
        where: { id: answerId },
        include: { author: { select: { id: true, name: true } } },
      });

      if (!answer || answer.questionId !== questionId) {
        return res.status(404).json({
          success: false,
          message: "Ответ не найден",
        });
      }

      if (
        answer.authorId !== req.user!.userId &&
        req.user!.role !== "ADMIN"
      ) {
        return res.status(403).json({
          success: false,
          message: "Нет прав на редактирование этого ответа",
        });
      }

      const updated = await prisma.answer.update({
        where: { id: answerId },
        data: { content: validatedData.content },
        include: { author: { select: { id: true, name: true } } },
      });

      const question = await prisma.question.findUnique({
        where: { id: questionId },
        select: { acceptedAnswerId: true },
      });

      res.json({
        success: true,
        data: {
          ...formatAnswer(updated),
          isAccepted: question?.acceptedAnswerId === updated.id,
        },
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          message: "Ошибка валидации",
          errors: error.errors,
        });
      }
      console.error("Ошибка при редактировании ответа:", error);
      res.status(500).json({
        success: false,
        message: "Внутренняя ошибка сервера",
      });
    }
  },
);

// DELETE /api/questions/:id/answers/:answerId
router.delete(
  "/:id/answers/:answerId",
  authMiddleware,
  async (req: AuthenticatedRequest, res) => {
    try {
      const { id: questionId, answerId } = req.params;

      const answer = await prisma.answer.findUnique({
        where: { id: answerId },
      });

      if (!answer || answer.questionId !== questionId) {
        return res.status(404).json({
          success: false,
          message: "Ответ не найден",
        });
      }

      const question = await prisma.question.findUnique({
        where: { id: questionId },
      });

      if (!question) {
        return res.status(404).json({
          success: false,
          message: "Вопрос не найден",
        });
      }

      const canDelete =
        answer.authorId === req.user!.userId ||
        question.authorId === req.user!.userId ||
        req.user!.role === "ADMIN";

      if (!canDelete) {
        return res.status(403).json({
          success: false,
          message: "Нет прав на удаление этого ответа",
        });
      }

      await prisma.answer.delete({ where: { id: answerId } });

      const remaining = await prisma.answer.count({
        where: { questionId },
      });

      await prisma.question.update({
        where: { id: questionId },
        data: {
          isAnswered: remaining > 0,
          acceptedAnswerId:
            question.acceptedAnswerId === answerId
              ? null
              : question.acceptedAnswerId,
        },
      });

      res.json({
        success: true,
        message: "Ответ удалён",
        data: { answersCount: remaining, isAnswered: remaining > 0 },
      });
    } catch (error) {
      console.error("Ошибка при удалении ответа:", error);
      res.status(500).json({
        success: false,
        message: "Внутренняя ошибка сервера",
      });
    }
  },
);

// POST /api/questions/:id/answers/:answerId/accept — mark best answer
router.post(
  "/:id/answers/:answerId/accept",
  authMiddleware,
  async (req: AuthenticatedRequest, res) => {
    try {
      const { id: questionId, answerId } = req.params;

      const question = await prisma.question.findUnique({
        where: { id: questionId },
      });

      if (!question) {
        return res.status(404).json({
          success: false,
          message: "Вопрос не найден",
        });
      }

      if (
        question.authorId !== req.user!.userId &&
        req.user!.role !== "ADMIN"
      ) {
        return res.status(403).json({
          success: false,
          message: "Только автор вопроса может выбрать лучший ответ",
        });
      }

      const answer = await prisma.answer.findUnique({
        where: { id: answerId },
      });

      if (!answer || answer.questionId !== questionId) {
        return res.status(404).json({
          success: false,
          message: "Ответ не найден",
        });
      }

      // Toggle: same answer again → unaccept
      const nextAccepted =
        question.acceptedAnswerId === answerId ? null : answerId;

      const updated = await prisma.question.update({
        where: { id: questionId },
        data: {
          acceptedAnswerId: nextAccepted,
          isAnswered: true,
        },
      });

      res.json({
        success: true,
        data: {
          acceptedAnswerId: updated.acceptedAnswerId,
          isAnswered: updated.isAnswered,
        },
      });
    } catch (error) {
      console.error("Ошибка при выборе лучшего ответа:", error);
      res.status(500).json({
        success: false,
        message: "Внутренняя ошибка сервера",
      });
    }
  },
);

// POST /api/questions/:id/like
router.post(
  "/:id/like",
  authMiddleware,
  async (req: AuthenticatedRequest, res) => {
    try {
      const questionId = req.params.id;
      const userId = req.user!.userId;

      const question = await prisma.question.findUnique({
        where: { id: questionId },
      });

      if (!question) {
        return res.status(404).json({
          success: false,
          message: "Вопрос не найден",
        });
      }

      const existingLike = await prisma.questionLike.findUnique({
        where: {
          questionId_userId: { questionId, userId },
        },
      });

      if (existingLike) {
        return res.status(400).json({
          success: false,
          message: "Вы уже лайкнули этот вопрос",
        });
      }

      await prisma.questionLike.create({
        data: { questionId, userId },
      });

      const likesCount = await prisma.questionLike.count({
        where: { questionId },
      });

      res.json({
        success: true,
        data: { likesCount, isLiked: true },
      });
    } catch (error) {
      console.error("Ошибка при лайке вопроса:", error);
      res.status(500).json({
        success: false,
        message: "Внутренняя ошибка сервера",
      });
    }
  },
);

// DELETE /api/questions/:id/like
router.delete(
  "/:id/like",
  authMiddleware,
  async (req: AuthenticatedRequest, res) => {
    try {
      const questionId = req.params.id;
      const userId = req.user!.userId;

      const existingLike = await prisma.questionLike.findUnique({
        where: {
          questionId_userId: { questionId, userId },
        },
      });

      if (!existingLike) {
        return res.status(404).json({
          success: false,
          message: "Лайк не найден",
        });
      }

      await prisma.questionLike.delete({
        where: {
          questionId_userId: { questionId, userId },
        },
      });

      const likesCount = await prisma.questionLike.count({
        where: { questionId },
      });

      res.json({
        success: true,
        data: { likesCount, isLiked: false },
      });
    } catch (error) {
      console.error("Ошибка при удалении лайка:", error);
      res.status(500).json({
        success: false,
        message: "Внутренняя ошибка сервера",
      });
    }
  },
);

// DELETE /api/questions/:id
router.delete(
  "/:id",
  authMiddleware,
  async (req: AuthenticatedRequest, res) => {
    try {
      const question = await prisma.question.findUnique({
        where: { id: req.params.id },
      });

      if (!question) {
        return res.status(404).json({
          success: false,
          message: "Вопрос не найден",
        });
      }

      if (
        question.authorId !== req.user!.userId &&
        req.user!.role !== "ADMIN"
      ) {
        return res.status(403).json({
          success: false,
          message: "Нет прав на удаление этого вопроса",
        });
      }

      await prisma.question.delete({
        where: { id: req.params.id },
      });

      res.json({
        success: true,
        message: "Вопрос удалён",
      });
    } catch (error) {
      console.error("Ошибка при удалении вопроса:", error);
      res.status(500).json({
        success: false,
        message: "Внутренняя ошибка сервера",
      });
    }
  },
);

function getTimeLabel(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "только что";
  if (diffMins < 60) return `${diffMins} мин. назад`;
  if (diffHours < 24) return `${diffHours} ч. назад`;
  if (diffDays === 1) return "вчера";
  if (diffDays < 7) return `${diffDays} дн. назад`;

  return date.toLocaleDateString("ru-RU");
}

export default router;
