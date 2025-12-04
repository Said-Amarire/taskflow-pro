// src/components/Header.jsx
import React, { useEffect, useState, useRef } from 'react'
import logoImg from '../assets/logo.webp'
import { FiUser, FiBell, FiCheck, FiClock, FiPlus, FiMinus } from 'react-icons/fi'
import { load, save } from '../utils/storage'

const NOTIFICATIONS_KEY = 'tf_notifications'
const DB_NAME = 'TaskFlowDB'
const STORE_NAME = 'custom_sounds'

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1)
    request.onupgradeneeded = e => {
      const db = e.target.result
      if (!db.objectStoreNames.contains(STORE_NAME)) db.createObjectStore(STORE_NAME, { keyPath: 'id' })
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

function getAllSoundsFromDB() {
  return openDB().then(db => {
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly')
      const store = tx.objectStore(STORE_NAME)
      const req = store.getAll()
      req.onsuccess = () => resolve(req.result)
      req.onerror = () => reject(req.error)
    })
  })
}

export default function Header() {
  const [user, setUser] = useState({ name: 'Said Amarire', avatar: null })
  const [showHeader, setShowHeader] = useState(true)
  const lastScrollY = useRef(0)

  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [showPopup, setShowPopup] = useState(false)
  const [activeAlert, setActiveAlert] = useState(null)
  const [snoozeMinutes, setSnoozeMinutes] = useState(5)
  const [customSounds, setCustomSounds] = useState([])

  const audioRef = useRef(new Audio())
  const prevUnreadCount = useRef(0)
  const audioStopped = useRef(false)
  const popupRef = useRef(null)

  /* LOAD USER */
  useEffect(() => {
    const interval = setInterval(() => {
      const storedUser = JSON.parse(localStorage.getItem('user_profile')) || { name: 'Said Amarire', avatar: null }
      setUser(storedUser)
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  /* LOAD NOTIFICATIONS */
  useEffect(() => {
    const saved = load(NOTIFICATIONS_KEY, [])
    setNotifications(saved)
    setUnreadCount(saved.filter(n => !n.read).length)
    prevUnreadCount.current = saved.filter(n => !n.read).length
  }, [])

  /* LOAD CUSTOM SOUNDS */
  useEffect(() => {
    getAllSoundsFromDB().then(sounds => setCustomSounds(sounds))
  }, [])

  /* HEADER HIDE ON SCROLL */
  useEffect(() => {
    const handleScroll = () => {
      const current = window.scrollY
      setShowHeader(current < lastScrollY.current || current <= 20)
      lastScrollY.current = current
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  /* TASK WATCHER */
  useEffect(() => {
    const interval = setInterval(() => {
      const tasks = load('tf_tasks', [])
      const now = new Date()
      const newNotifications = []
      let updatedTasks = [...tasks]

      updatedTasks = updatedTasks.map(task => {
        if (
          task.alarmEnabled &&
          !task.done &&
          !task.alarmPlayedAt &&
          task.due &&
          new Date(task.due) <= now
        ) {
          task.alarmPlayedAt = new Date().toISOString()

          newNotifications.push({
            id: task.id,
            title: task.title,
            due: task.due,
            read: false
          })

          setActiveAlert({
            id: task.id,
            title: task.title,
            due: task.due
          })

          if (navigator.vibrate) navigator.vibrate([300, 200, 300, 200, 300])
        }
        return task
      })

      if (newNotifications.length > 0) {
        save('tf_tasks', updatedTasks)
        setNotifications(prev => {
          const merged = [...newNotifications, ...prev]
          save(NOTIFICATIONS_KEY, merged)
          setUnreadCount(merged.filter(n => !n.read).length)
          return merged
        })
        audioStopped.current = false
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  /* PLAY SOUND ONLY ON NEW NOTIFICATION */
  useEffect(() => {
    if (unreadCount > prevUnreadCount.current && !audioStopped.current) {
      const settings = load('tf_settings_v7', null)
      if (!settings || !settings.enabled) return

      const audio = audioRef.current
      audio.pause()

      let finalSrc = null

      if (settings.selectedTone.startsWith("custom:")) {
        const id = settings.selectedTone.replace("custom:", "")
        const custom = customSounds.find(s => s.id === id)
        if (custom && custom.data) finalSrc = custom.data
      }

      if (!finalSrc) finalSrc = `/tones/${settings.selectedTone.replace('preset:', '')}.mp3`

      audio.src = finalSrc
      audio.volume = settings.volume / 100
      audio.loop = true
      audio.play().catch(() => {})
    }

    prevUnreadCount.current = unreadCount
  }, [unreadCount, customSounds])

  /* MARK READ */
  const markAsRead = id => {
    setNotifications(prev => {
      const updated = prev.map(n => n.id === id ? { ...n, read: true } : n)
      save(NOTIFICATIONS_KEY, updated)
      setUnreadCount(updated.filter(n => !n.read).length)
      return updated
    })
  }

  const stopAlert = () => {
    audioRef.current.pause()
    audioRef.current.currentTime = 0
    setActiveAlert(null)
    audioStopped.current = true
  }

  const snoozeAlert = () => {
    if (activeAlert) {
      const tasks = load('tf_tasks', [])
      const updated = tasks.map(t => {
        if (t.id === activeAlert.id) {
          const newDue = new Date(Date.now() + snoozeMinutes * 60 * 1000)
          t.due = newDue.toISOString()
          t.alarmPlayedAt = null
        }
        return t
      })
      save('tf_tasks', updated)
    }
    stopAlert()
    audioStopped.current = false
  }

  /* Close popup when clicking outside */
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (popupRef.current && !popupRef.current.contains(event.target)) {
        setShowPopup(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <>
      {/* HEADER */}
      <header
        className={`fixed top-0 left-0 w-full bg-white shadow-md z-[9999] transition-transform duration-300 ${
          showHeader ? 'translate-y-0' : '-translate-y-full'
        }`}
      >
        <div className="w-full flex items-center justify-between px-6 py-1.5">
          <img src={logoImg} alt="Logo" className="h-14 w-auto" />

          <div className="flex items-center gap-5">
            <button
              onClick={() => setShowPopup(!showPopup)}
              className="relative text-indigo-600 text-3xl p-2 rounded-full hover:bg-indigo-100 transition shadow-md"
            >
              <FiBell />
              {unreadCount > 0 && (
                <span className="absolute bottom-0 right-0 w-4 h-1 bg-white rounded-full shadow-sm"></span>
              )}
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white rounded-full text-xs flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </button>

            <div className="hidden md:flex flex-col text-right">
              <span className="text-gray-800 font-semibold text-lg">{user.name}</span>
            </div>

            {user.avatar ? (
              <div className="w-14 h-14 rounded-2xl overflow-hidden border-2 border-gray-200">
                <img src={user.avatar} className="w-full h-full object-cover" />
              </div>
            ) : (
              <FiUser className="text-gray-500 w-14 h-14 bg-gray-100 p-2 rounded-2xl" />
            )}
          </div>
        </div>
      </header>

      <div className="h-[62px] md:h-[70px]"></div>

      {/* POPUP */}
      {showPopup && (
        <div
          ref={popupRef}
          className="fixed top-16 right-5 w-80 max-h-[400px] bg-gradient-to-b from-purple-700 via-black to-white border shadow-xl rounded-2xl p-4 z-[9999] overflow-y-auto animate-popup-in"
        >
          <h3 className="font-bold mb-3 text-white text-lg">Notifications</h3>
          {notifications.filter(n => !n.read).length === 0 ? (
            <p className="text-gray-200">No new notifications</p>
          ) : (
            notifications.filter(n => !n.read).map(n => (
              <div key={n.id} className="border-b border-purple-400 pb-2 mb-2 flex justify-between items-center">
                <div>
                  <strong className="text-white">{n.title}</strong>
                  <div className="text-xs text-gray-200">{new Date(n.due).toLocaleString()}</div>
                </div>
                <button
                  onClick={() => markAsRead(n.id)}
                  className="text-green-400 p-1 hover:bg-green-600 hover:text-white rounded transition"
                >
                  <FiCheck />
                </button>
              </div>
            ))
          )}
        </div>
      )}

      {/* BIG ALERT */}
      {activeAlert && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[10000]">
          <div className="bg-white p-6 rounded-xl shadow-xl text-center w-[90%] max-w-md">
            <FiBell className="text-indigo-600 text-6xl mb-3 shake-strong" />
            <h2 className="text-2xl font-bold mb-2">{activeAlert.title}</h2>
            <p className="text-gray-600 mb-4 flex items-center justify-center gap-2">
              <FiClock /> {new Date(activeAlert.due).toLocaleString()}
            </p>
            <div className="flex items-center justify-center gap-3 mb-4">
              <button onClick={() => setSnoozeMinutes(prev => Math.max(1, prev - 1))} className="bg-gray-200 px-3 py-1 rounded-lg hover:bg-gray-300">
                <FiMinus />
              </button>
              <span className="text-xl font-bold w-10 text-center">{snoozeMinutes}</span>
              <button onClick={() => setSnoozeMinutes(prev => prev + 1)} className="bg-gray-200 px-3 py-1 rounded-lg hover:bg-gray-300">
                <FiPlus />
              </button>
            </div>
            <div className="flex gap-3 justify-center mt-4">
              <button onClick={stopAlert} className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600">Stop</button>
              <button onClick={snoozeAlert} className="bg-yellow-400 text-black px-4 py-2 rounded-lg hover:bg-yellow-500">
                Snooze ({snoozeMinutes} min)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Animations */}
      <style jsx>{`
        .animate-popup-in {
          animation: popupIn 0.4s ease forwards;
        }
        .animate-popup-out {
          animation: popupOut 0.3s ease forwards;
        }
        @keyframes popupIn {
          0% { opacity: 0; transform: translateY(-10px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes popupOut {
          0% { opacity: 1; transform: translateY(0); }
          100% { opacity: 0; transform: translateY(-10px); }
        }
      `}</style>
    </>
  )
}
