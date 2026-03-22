/**
 * Notification routes
 * GET / (list), POST / (send), PATCH /:id/read
 */

import { Router } from 'express';
import { addNotification, getNotifications } from '../notification-store.js';

export const notificationRoutes = Router();

notificationRoutes.get('/', (req, res) => {
  const userId = (req as { user?: { userId?: string } }).user?.userId || req.headers['x-user-id'];
  if (!userId) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  const list = getNotifications(userId);
  res.json(list);
});

notificationRoutes.post('/', (req, res) => {
  const { userId, title, message } = req.body;
  if (!userId || !title || !message) {
    res.status(400).json({ error: 'userId, title, message required' });
    return;
  }
  const id = `notif-${Date.now()}`;
  addNotification(userId, { id, title, message, isRead: false });
  res.status(201).json({ id, userId, title, message });
});
