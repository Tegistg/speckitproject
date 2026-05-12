import { User } from '@prisma/client';
import { prisma } from '../lib/prisma';

export async function getProfile(userId: string): Promise<User | null> {
  return prisma.user.findUnique({ where: { id: userId } });
}

export async function updateProfile(
  userId: string,
  data: { name?: string; expoPushToken?: string },
): Promise<User> {
  return prisma.user.update({ where: { id: userId }, data });
}

export async function getPublicProfile(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, avatarUrl: true, avgRating: true, completedTransactionCount: true },
  });
}
