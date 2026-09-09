import { prisma } from './database';

export type UserNotificationType =
  | 'SUPPORT'
  | 'BUDDY'
  | 'COMMUNITY'
  | 'REVIEW'
  | 'SYSTEM';

export async function createUserNotification(input: {
  userId: string;
  actorUserId?: string;
  type: UserNotificationType;
  title: string;
  message: string;
  link?: string;
  entityType?: string;
  entityId?: string;
}) {
  try {
    return await prisma.userNotification.create({ data: input });
  } catch (error) {
    // A secondary notification must not roll back the user's primary action.
    console.error('User notification create error:', error);
    return null;
  }
}
