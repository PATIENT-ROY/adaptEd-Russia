import { Router, Request } from "express";
import { z } from "zod";
import { authMiddleware, JWTPayload, verifyToken } from "../lib/auth";
import { prisma } from "../lib/database";

// Extend Express Request to include user property
interface AuthenticatedRequest extends Request {
  user?: JWTPayload;
}


const router = Router();

// Схема валидации для формы обратной связи
const supportFormSchema = z.object({
  name: z.string().min(2, "Имя должно содержать минимум 2 символа"),
  email: z.string().email("Некорректный email"),
  category: z.enum(["GENERAL", "CONTENT_ERROR"]).default("GENERAL"),
  subject: z.string().min(5, "Тема должна содержать минимум 5 символов"),
  message: z.string().min(10, "Сообщение должно содержать минимум 10 символов"),
});

// POST /api/support/contact - Отправка формы обратной связи
router.post("/contact", async (req: AuthenticatedRequest, res) => {
  try {
    // Проверяем токен если есть (опциональная авторизация)
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.split(" ")[1];
      try {
        const decoded = verifyToken(token);
        if (decoded) {
          const user = await prisma.user.findUnique({
            where: { id: decoded.userId },
            select: { tokenVersion: true },
          });
          if (user?.tokenVersion === decoded.tokenVersion) req.user = decoded;
        }
      } catch {
        // Токен невалидный - продолжаем без авторизации
      }
    }

    // Валидация данных
    const validatedData = supportFormSchema.parse(req.body);
    
    // Сохраняем обращение в базу данных
    const ticket = await prisma.supportTicket.create({
      data: {
        name: validatedData.name,
        email: validatedData.email,
        subject: validatedData.subject,
        message: validatedData.message,
        userId: req.user?.userId, // Если пользователь авторизован
        status: "OPEN",
        priority: "MEDIUM",
        category: validatedData.category,
      },
    });
    
    res.status(200).json({
      success: true,
      message: "Сообщение успешно отправлено. Мы ответим вам в ближайшее время.",
      ticketId: ticket.id,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: "Ошибка валидации данных",
        errors: error.errors,
      });
    }
    
    console.error("Ошибка при обработке обращения в поддержку:", error);
    res.status(500).json({
      success: false,
      message: "Внутренняя ошибка сервера",
    });
  }
});

// GET /api/support/faq - Получение FAQ
router.get("/faq", async (req, res) => {
  try {
    // Здесь можно загружать FAQ из базы данных
    const faq = [
      {
        id: 1,
        question: "Как войти в систему?",
        answer: "Нажмите кнопку «Войти» в правом верхнем углу, укажите email, затем пароль. Регистрация — отдельная ссылка на странице входа.",
        category: "registration"
      },
      {
        id: 2,
        question: "Как изменить язык интерфейса?",
        answer: "На компьютере — переключатель языка в шапке. На телефоне откройте меню и выберите язык внутри него.",
        category: "interface"
      },
      {
        id: 3,
        question: "Как создать напоминание?",
        answer: "Войдите в аккаунт, откройте «Напоминания», нажмите «Добавить» и заполните поля.",
        category: "reminders"
      },
      {
        id: 4,
        question: "Как работает AI-помощник?",
        answer: "AdaptEd AI доступен после входа: задайте вопрос своими словами или выберите готовый инструмент для текстов, презентаций и учёбы.",
        category: "ai"
      },
      {
        id: 5,
        question: "Нужен ли аккаунт, чтобы читать гайды?",
        answer: "Нет. Гайды по учёбе и быту открыты без регистрации. Аккаунт нужен для AI, напоминаний, DocScan и сообщества.",
        category: "guides"
      },
      {
        id: 6,
        question: "Что делать, если забыл пароль?",
        answer: "На странице входа нажмите 'Забыли пароль?' и следуйте инструкциям для восстановления.",
        category: "auth"
      }
    ];
    
    res.status(200).json({
      success: true,
      data: faq,
    });
  } catch (error) {
    console.error("Ошибка при получении FAQ:", error);
    res.status(500).json({
      success: false,
      message: "Внутренняя ошибка сервера",
    });
  }
});

// GET /api/support/contact-info - Получение контактной информации
router.get("/contact-info", async (req, res) => {
  try {
    const contactInfo = {
      email: "support@adapted-russia.ru",
      phone: "+7 (800) 555-0123",
      workingHours: {
        weekdays: "9:00 - 18:00",
        saturday: "10:00 - 16:00",
        sunday: "Выходной"
      },
      emergencySupport: "24/7"
    };
    
    res.status(200).json({
      success: true,
      data: contactInfo,
    });
  } catch (error) {
    console.error("Ошибка при получении контактной информации:", error);
    res.status(500).json({
      success: false,
      message: "Внутренняя ошибка сервера",
    });
  }
});

// ===== USER ENDPOINTS =====

// GET /api/support/my-tickets - Получение своих обращений (для авторизованных)
router.get("/my-tickets", authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const tickets = await prisma.supportTicket.findMany({
      where: {
        userId: req.user!.userId,
      },
      include: {
        responses: {
          orderBy: {
            createdAt: "asc",
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    res.status(200).json({
      success: true,
      data: tickets,
    });
  } catch (error) {
    console.error("Ошибка при получении обращений:", error);
    res.status(500).json({
      success: false,
      message: "Внутренняя ошибка сервера",
    });
  }
});

// ===== АДМИН ENDPOINTS =====

// GET /api/support/admin/tickets - Получение всех обращений (для админов)
router.get("/admin/tickets", authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    // Проверяем, что пользователь является админом
    if (req.user?.role !== "ADMIN") {
      return res.status(403).json({
        success: false,
        message: "Доступ запрещен",
      });
    }

    const tickets = await prisma.supportTicket.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        responses: {
          include: {
            admin: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          orderBy: {
            createdAt: "asc",
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    res.status(200).json({
      success: true,
      data: tickets,
    });
  } catch (error) {
    console.error("Ошибка при получении обращений:", error);
    res.status(500).json({
      success: false,
      message: "Внутренняя ошибка сервера",
    });
  }
});

// GET /api/support/admin/tickets/:id - Получение конкретного обращения
router.get("/admin/tickets/:id", authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    if (req.user?.role !== "ADMIN") {
      return res.status(403).json({
        success: false,
        message: "Доступ запрещен",
      });
    }

    const ticket = await prisma.supportTicket.findUnique({
      where: {
        id: req.params.id,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        responses: {
          include: {
            admin: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          orderBy: {
            createdAt: "asc",
          },
        },
      },
    });

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Обращение не найдено",
      });
    }

    res.status(200).json({
      success: true,
      data: ticket,
    });
  } catch (error) {
    console.error("Ошибка при получении обращения:", error);
    res.status(500).json({
      success: false,
      message: "Внутренняя ошибка сервера",
    });
  }
});

// PUT /api/support/admin/tickets/:id/status - Обновление статуса обращения
router.put("/admin/tickets/:id/status", authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    if (req.user?.role !== "ADMIN") {
      return res.status(403).json({
        success: false,
        message: "Доступ запрещен",
      });
    }

    const { status } = req.body;

    const ticket = await prisma.supportTicket.update({
      where: {
        id: req.params.id,
      },
      data: {
        status,
      },
    });

    res.status(200).json({
      success: true,
      data: ticket,
    });
  } catch (error) {
    console.error("Ошибка при обновлении статуса:", error);
    res.status(500).json({
      success: false,
      message: "Внутренняя ошибка сервера",
    });
  }
});

// POST /api/support/admin/tickets/:id/respond - Ответ на обращение
router.post("/admin/tickets/:id/respond", authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    if (req.user?.role !== "ADMIN") {
      return res.status(403).json({
        success: false,
        message: "Доступ запрещен",
      });
    }

    const { content } = req.body;

    const response = await prisma.supportResponse.create({
      data: {
        ticketId: req.params.id,
        // adminId не указываем - пользователь из таблицы User, а не Admin
        content,
        isAdmin: true,
      },
    });

    // Обновляем статус обращения на "IN_PROGRESS"
    await prisma.supportTicket.update({
      where: {
        id: req.params.id,
      },
      data: {
        status: "IN_PROGRESS",
      },
    });

    res.status(200).json({
      success: true,
      data: response,
    });
  } catch (error) {
    console.error("Ошибка при создании ответа:", error);
    res.status(500).json({
      success: false,
      message: "Внутренняя ошибка сервера",
    });
  }
});

export default router; 
