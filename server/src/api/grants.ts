import { Router } from "express";
import { prisma } from "../lib/database";
import { authMiddleware } from "../lib/auth";

const router = Router();

// Get all grants with filters
router.get("/", async (req, res) => {
  try {
    const {
      type,
      status,
      level,
      category,
      search,
      minAmount,
      maxAmount,
      deadlineFrom,
      deadlineTo,
      countries,
      tags,
      page = 1,
      limit = 20,
    } = req.query;

    const skip = (Number(page) - 1) * Number(limit);
    
    // Build where clause
    const where: any = {};

    if (type) {
      where.type = { in: Array.isArray(type) ? type : [type] };
    }

    if (status) {
      where.status = { in: Array.isArray(status) ? status : [status] };
    }

    if (level) {
      where.level = { in: Array.isArray(level) ? level : [level] };
    }

    if (category) {
      where.category = { in: Array.isArray(category) ? category : [category] };
    }

    if (search) {
      where.OR = [
        { title: { contains: search as string, mode: 'insensitive' } },
        { description: { contains: search as string, mode: 'insensitive' } },
        { organization: { contains: search as string, mode: 'insensitive' } },
        { tags: { hasSome: [search as string] } },
      ];
    }

    if (minAmount || maxAmount) {
      where.amount = {};
      if (minAmount) where.amount.gte = Number(minAmount);
      if (maxAmount) where.amount.lte = Number(maxAmount);
    }

    if (deadlineFrom || deadlineTo) {
      where.applicationDeadline = {};
      if (deadlineFrom) where.applicationDeadline.gte = new Date(deadlineFrom as string);
      if (deadlineTo) where.applicationDeadline.lte = new Date(deadlineTo as string);
    }

    if (countries) {
      where.eligibility = {
        path: '$.countries',
        array_contains: Array.isArray(countries) ? countries : [countries],
      };
    }

    if (tags) {
      where.tags = {
        hasSome: Array.isArray(tags) ? tags : [tags],
      };
    }

    const [grants, total] = await Promise.all([
      prisma.grant.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: [
          { isFeatured: 'desc' },
          { applicationDeadline: 'asc' },
          { createdAt: 'desc' },
        ],
      }),
      prisma.grant.count({ where }),
    ]);

    res.json({
      success: true,
      data: {
        grants,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit)),
        },
      },
    });
  } catch (error) {
    console.error("Error fetching grants:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch grants",
    });
  }
});

// Get grant by ID
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const grant = await prisma.grant.findUnique({
      where: { id },
    });

    if (!grant) {
      return res.status(404).json({
        success: false,
        error: "Grant not found",
      });
    }

    res.json({
      success: true,
      data: grant,
    });
  } catch (error) {
    console.error("Error fetching grant:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch grant",
    });
  }
});

// Get user's grant applications
router.get("/applications", authMiddleware, async (req, res) => {
  try {
    const userId = (req as any).user.userId;

    const applications = await prisma.userGrantApplication.findMany({
      where: { userId },
      include: {
        grant: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({
      success: true,
      data: applications,
    });
  } catch (error) {
    console.error("Error fetching user applications:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch applications",
    });
  }
});

// Create grant application
router.post("/:id/apply", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user.userId;
    const { documents, notes } = req.body;

    // Check if grant exists
    const grant = await prisma.grant.findUnique({
      where: { id },
    });

    if (!grant) {
      return res.status(404).json({
        success: false,
        error: "Grant not found",
      });
    }

    // Check if user already applied
    const existingApplication = await prisma.userGrantApplication.findFirst({
      where: {
        userId,
        grantId: id,
      },
    });

    if (existingApplication) {
      return res.status(400).json({
        success: false,
        error: "You have already applied for this grant",
      });
    }

    // Create application
    const application = await prisma.userGrantApplication.create({
      data: {
        userId,
        grantId: id,
        status: "DRAFT",
        documents: documents || [],
        notes: notes || "",
      },
      include: {
        grant: true,
      },
    });

    res.json({
      success: true,
      data: application,
      message: "Application created successfully",
    });
  } catch (error) {
    console.error("Error creating application:", error);
    res.status(500).json({
      success: false,
      error: "Failed to create application",
    });
  }
});

// Update grant application
router.put("/applications/:applicationId", authMiddleware, async (req, res) => {
  try {
    const { applicationId } = req.params;
    const userId = (req as any).user.userId;
    const { documents, notes, status } = req.body;

    // Check if application exists and belongs to user
    const application = await prisma.userGrantApplication.findFirst({
      where: {
        id: applicationId,
        userId,
      },
    });

    if (!application) {
      return res.status(404).json({
        success: false,
        error: "Application not found",
      });
    }

    // Update application
    const updatedApplication = await prisma.userGrantApplication.update({
      where: { id: applicationId },
      data: {
        documents: documents || application.documents,
        notes: notes || application.notes,
        status: status || application.status,
        submittedAt: status === "SUBMITTED" ? new Date() : application.submittedAt,
      },
      include: {
        grant: true,
      },
    });

    res.json({
      success: true,
      data: updatedApplication,
      message: "Application updated successfully",
    });
  } catch (error) {
    console.error("Error updating application:", error);
    res.status(500).json({
      success: false,
      error: "Failed to update application",
    });
  }
});

// Delete grant application
router.delete("/applications/:applicationId", authMiddleware, async (req, res) => {
  try {
    const { applicationId } = req.params;
    const userId = (req as any).user.userId;

    // Check if application exists and belongs to user
    const application = await prisma.userGrantApplication.findFirst({
      where: {
        id: applicationId,
        userId,
      },
    });

    if (!application) {
      return res.status(404).json({
        success: false,
        error: "Application not found",
      });
    }

    // Delete application
    await prisma.userGrantApplication.delete({
      where: { id: applicationId },
    });

    res.json({
      success: true,
      message: "Application deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting application:", error);
    res.status(500).json({
      success: false,
      error: "Failed to delete application",
    });
  }
});

// Get featured grants
router.get("/featured", async (req, res) => {
  try {
    const grants = await prisma.grant.findMany({
      where: { isFeatured: true },
      orderBy: { applicationDeadline: 'asc' },
      take: 6,
    });

    res.json({
      success: true,
      data: grants,
    });
  } catch (error) {
    console.error("Error fetching featured grants:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch featured grants",
    });
  }
});

// Get grants by type
router.get("/type/:type", async (req, res) => {
  try {
    const { type } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const skip = (Number(page) - 1) * Number(limit);

    const [grants, total] = await Promise.all([
      prisma.grant.findMany({
        where: { type: type as any },
        skip,
        take: Number(limit),
        orderBy: { applicationDeadline: 'asc' },
      }),
      prisma.grant.count({ where: { type: type as any } }),
    ]);

    res.json({
      success: true,
      data: {
        grants,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit)),
        },
      },
    });
  } catch (error) {
    console.error("Error fetching grants by type:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch grants by type",
    });
  }
});

export default router; 