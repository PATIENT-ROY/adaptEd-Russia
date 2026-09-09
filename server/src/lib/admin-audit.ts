import { prisma } from './database';
import { Prisma } from '../../prisma/generated';

export async function recordAdminAction(input: {
  actorUserId: string;
  action: string;
  entityType: string;
  entityId: string;
  metadata?: Prisma.InputJsonValue;
}) {
  try {
    await prisma.adminAuditLog.create({
      data: {
        actorUserId: input.actorUserId,
        action: input.action,
        entityType: input.entityType,
        entityId: input.entityId,
        metadata: input.metadata,
      },
    });
  } catch (error) {
    // The primary admin action must not fail solely because audit persistence failed.
    console.error('Admin audit log error:', error);
  }
}
