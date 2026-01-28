import { Router, Request } from "express";
import { z } from "zod";
import { authMiddleware, JWTPayload } from "../lib/auth.js";
import { prisma } from "../lib/database.js";

interface AuthenticatedRequest extends Request {
  user?: JWTPayload;
}

const router = Router();

// Схемы валидации
const createQuestionSchema = z.object({
  title: z.string().min(5, "Заголовок должен содержать минимум 5 символов"),
  description: z.string().optional(),
});

const createAnswerSchema = z.object({
  content: z.string().min(2, "Ответ должен содержать минимум 2 символа"),
});

// GET /api/questions - Получение списка вопросов
router.get("/", async (req, res) => {
  try {
    const { sort = "popular" } = req.query;

    const questions = await prisma.question.findMany({
      include: {
        author: {
          select: {
            id: true,
            name: true,
          },
        },
        answers: {
          select: {
            id: true,
          },
        },
        likes: {
          select: {
            id: true,
          },
        },
      },
      orderBy:
        sort === "new"
          ? { createdAt: "desc" }
          : { likes: { _count: "desc" } },
    });

    // Форматируем ответ
    const formattedQuestions = questions.map((q) => ({
      id: q.id,
      title: q.title,
      description: q.description,
      answersCount: q.answers.length,
      likesCount: q.likes.length,
      author: q.author.name,
      authorId: q.author.id,
      isAnswered: q.isAnswered,
      createdAt: q.createdAt.getTime(),
      timeLabel: getTimeLabel(q.createdAt),
    }));

    res.json({
      success: true,
      data: formattedQuestions,
    });
  } catch (error) {
    console.error("Ошибка при получении вопросов:", error);
    res.status(500).json({
      success: false,
      message: "Внутренняя ошибка сервера",
    });
  }
});

// GET /api/questions/:id - Получение вопроса с ответами
router.get("/:id", async (req, res) => {
  try {
    const question = await prisma.question.findUnique({
      where: { id: req.params.id },
      include: {
        author: {
          select: {
            id: true,
            name: true,
          },
        },
        answers: {
          include: {
            author: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          orderBy: { createdAt: "asc" },
        },
        likes: {
          select: {
            userId: true,
          },
        },
      },
    });

    if (!question) {
      return res.status(404).json({
        success: false,
        message: "Вопрос не найден",
      });
    }

    res.json({
      success: true,
      data: {
        id: question.id,
        title: question.title,
        description: question.description,
        author: question.author.name,
        authorId: question.author.id,
        isAnswered: question.isAnswered,
        createdAt: question.createdAt.getTime(),
        timeLabel: getTimeLabel(question.createdAt),
        likesCount: question.likes.length,
        likedByUserIds: question.likes.map((l) => l.userId),
        answers: question.answers.map((a) => ({
          id: a.id,
          content: a.content,
          author: a.author.name,
          authorId: a.author.id,
          createdAt: a.createdAt.getTime(),
          timeLabel: getTimeLabel(a.createdAt),
        })),
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

// POST /api/questions - Создание вопроса
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
        author: {
          select: {
            id: true,
            name: true,
          },
        },
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

// POST /api/questions/:id/answers - Добавление ответа
router.post("/:id/answers", authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const validatedData = createAnswerSchema.parse(req.body);

    // Проверяем существование вопроса
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
        author: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Обновляем статус вопроса на "отвечен"
    await prisma.question.update({
      where: { id: req.params.id },
      data: { isAnswered: true },
    });

    res.status(201).json({
      success: true,
      data: {
        id: answer.id,
        content: answer.content,
        author: answer.author.name,
        authorId: answer.author.id,
        createdAt: answer.createdAt.getTime(),
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
    console.error("Ошибка при создании ответа:", error);
    res.status(500).json({
      success: false,
      message: "Внутренняя ошибка сервера",
    });
  }
});

// POST /api/questions/:id/like - Лайк вопроса
router.post("/:id/like", authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const questionId = req.params.id;
    const userId = req.user!.userId;

    // Проверяем существование вопроса
    const question = await prisma.question.findUnique({
      where: { id: questionId },
    });

    if (!question) {
      return res.status(404).json({
        success: false,
        message: "Вопрос не найден",
      });
    }

    // Проверяем, есть ли уже лайк
    const existingLike = await prisma.questionLike.findUnique({
      where: {
        questionId_userId: {
          questionId,
          userId,
        },
      },
    });

    if (existingLike) {
      return res.status(400).json({
        success: false,
        message: "Вы уже лайкнули этот вопрос",
      });
    }

    await prisma.questionLike.create({
      data: {
        questionId,
        userId,
      },
    });

    // Получаем обновлённое количество лайков
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
});

// DELETE /api/questions/:id/like - Удаление лайка
router.delete("/:id/like", authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const questionId = req.params.id;
    const userId = req.user!.userId;

    // Проверяем существование лайка
    const existingLike = await prisma.questionLike.findUnique({
      where: {
        questionId_userId: {
          questionId,
          userId,
        },
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
        questionId_userId: {
          questionId,
          userId,
        },
      },
    });

    // Получаем обновлённое количество лайков
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
});

// DELETE /api/questions/:id - Удаление вопроса (только автор)
router.delete("/:id", authMiddleware, async (req: AuthenticatedRequest, res) => {
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

    // Проверяем, что пользователь - автор или админ
    if (question.authorId !== req.user!.userId && req.user!.role !== "ADMIN") {
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
});

// Хелпер для форматирования времени
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

