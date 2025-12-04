// src/utils/notifications.js
import { load, save } from './storage'

// Key in localStorage
const NOTIF_KEY = 'taskNotifications'

// Load notifications
export const loadNotifications = () => load(NOTIF_KEY, [])

// Save notifications
export const saveNotifications = (notifications) => save(NOTIF_KEY, notifications)

// Add a new notification
export const addNotification = (task) => {
  const notifications = loadNotifications()
  const newNotif = {
    id: task.id + '_' + Date.now(),
    taskId: task.id,
    title: task.title,
    due: task.due,
    createdAt: new Date().toISOString(),
    read: false
  }
  notifications.push(newNotif)
  saveNotifications(notifications)
  return newNotif
}

// Mark as read
export const markNotificationRead = (id) => {
  const notifications = loadNotifications()
  const updated = notifications.map(n => n.id === id ? { ...n, read: true } : n)
  saveNotifications(updated)
  return updated
}

// Count unread
export const countUnread = () => loadNotifications().filter(n => !n.read).length
