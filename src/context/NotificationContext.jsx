// src/context/NotificationContext.jsx
import React, { createContext, useContext, useState, useEffect, useRef } from 'react'
import { load } from '../utils/storage'

const NotificationContext = createContext()

export const useNotifications = () => useContext(NotificationContext)

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const prevCount = useRef(0)
  const audioRef = useRef(new Audio())

  // Add a new notification
  const addNotification = notification => {
    setNotifications(prev => [...prev, notification])
    setUnreadCount(prev => prev + 1)
  }

  // Play sound when a new notification arrives
  useEffect(() => {
    if (unreadCount > prevCount.current) {
      const settings = load('tf_settings_v7', null)
      if (!settings || !settings.enabled) return

      audioRef.current.pause()
      if (settings.selectedTone.startsWith('custom:')) {
        const id = settings.selectedTone.split(':')[1]
        const custom = settings.customSounds?.find(c => c.id === id)
        if (custom) audioRef.current.src = custom.data
      } else {
        audioRef.current.src = `/tones/${settings.selectedTone.replace('preset:', '')}.mp3`
      }

      audioRef.current.volume = settings.volume / 100
      audioRef.current.play().catch(() => {})
    }
    prevCount.current = unreadCount
  }, [unreadCount])

  const markAllAsRead = () => setUnreadCount(0)

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        addNotification,
        markAllAsRead
      }}
    >
      {children}
    </NotificationContext.Provider>
  )
}
