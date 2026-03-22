/**
 * In-memory notification store (shared by routes and event consumer)
 */

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  isRead: boolean;
}

export const notificationStore = new Map<string, Notification[]>();

export function addNotification(userId: string, notification: Omit<Notification, 'userId'>): void {
  const existing = notificationStore.get(userId) || [];
  existing.push({ ...notification, userId });
  notificationStore.set(userId, existing);
}

export function getNotifications(userId: string): Notification[] {
  return notificationStore.get(userId) || [];
}
