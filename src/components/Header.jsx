// src/components/Header.jsx
import React, { useEffect, useState, useRef } from 'react'
import logoImg from '../assets/logo.webp'
import { FiUser, FiBell, FiCheck, FiClock, FiPlus, FiMinus } from 'react-icons/fi'
import { load, save } from '../utils/storage'

const NOTIFICATIONS_KEY = 'tf_notifications'
const DB_NAME = 'TaskFlowDB'
const STORE_NAME = 'custom_sounds'
const FALLBACK_TONE = '/tones/tone1.mp3'

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
  const audioPlaying = useRef(false)
  const popupRef = useRef(null)
  const bellRef = useRef(null)
  const alertBellRef = useRef(null)

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

  /* PLAY SOUND ON NEW NOTIFICATION */
  useEffect(() => {
    if (unreadCount > prevUnreadCount.current && !audioStopped.current && !audioPlaying.current) {
      const settings = load('tf_settings_v7', null)
      const audio = audioRef.current
      audio.pause()
      audio.loop = true

      let finalSrc = FALLBACK_TONE
      let finalVolume = 0.8

      if (settings) {
        if (!settings.enabled) return
        finalVolume = settings.volume / 100
        if (settings.selectedTone.startsWith('custom:')) {
          const id = settings.selectedTone.replace('custom:', '')
          const custom = customSounds.find(s => s.id === id)
          if (custom && custom.data) finalSrc = custom.data
        } else if (settings.selectedTone.startsWith('preset:')) {
          finalSrc = `/tones/${settings.selectedTone.replace('preset:', '')}.mp3`
        }
      }

      audio.src = finalSrc
      audio.volume = finalVolume

      audio.play().then(() => {
        audioPlaying.current = true
        if (alertBellRef.current) {
          alertBellRef.current.classList.add('animate-ring-continuous')
        }
        if (bellRef.current) {
          bellRef.current.classList.add('animate-ring')
          setTimeout(() => bellRef.current.classList.remove('animate-ring'), 1500)
        }
      }).catch(() => {
        const handleInteraction = () => {
          audio.play().catch(() => {})
          window.removeEventListener('click', handleInteraction)
          window.removeEventListener('keydown', handleInteraction)
        }
        window.addEventListener('click', handleInteraction)
        window.addEventListener('keydown', handleInteraction)
      })
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
    const audio = audioRef.current
    audio.pause()
    audio.currentTime = 0
    setActiveAlert(null)
    audioStopped.current = true
    audioPlaying.current = false
    if (alertBellRef.current) alertBellRef.current.classList.remove('animate-ring-continuous')
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
      if (popupRef.current && !popupRef.current.contains(event.target) && !bellRef.current.contains(event.target)) {
        setShowPopup(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const togglePopup = () => setShowPopup(prev => !prev)

  return (
    <>
      {/* HEADER */}
      <header
        className={`fixed top-0 left-0 w-full bg-white shadow-md z-[9999] transition-transform duration-300 ${
          showHeader ? 'translate-y-0' : '-translate-y-full'
        }`}
      >
        <div className="w-full flex items-center justify-between px-6 py-1.5">
          <img src={logoImg} alt="Logo" className="h-12 md:h-14 w-auto" />

          <div className="flex items-center gap-4 md:gap-5">
            <button
              ref={bellRef}
              onClick={togglePopup}
              className="relative text-indigo-600 text-xl md:text-2xl p-1 md:p-2 rounded-full hover:bg-indigo-100 transition shadow-md border-2 border-purple-600"
            >
              <FiBell />
              {unreadCount > 0 && (
                <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 text-white rounded-full text-xs flex items-center justify-center animate-bounce">
                  {unreadCount}
                </span>
              )}
            </button>

            <div className="hidden md:flex flex-col text-right">
              <span className="text-gray-800 font-semibold text-lg">{user.name}</span>
            </div>

            {user.avatar ? (
              <div className="w-10 md:w-12 h-10 md:h-12 rounded-2xl overflow-hidden border-2 border-gray-200">
                <img src={user.avatar} className="w-full h-full object-cover" />
              </div>
            ) : (
              <FiUser className="text-gray-500 w-10 md:w-12 h-10 md:h-12 bg-gray-100 p-2 rounded-2xl" />
            )}
          </div>
        </div>
      </header>

      <div className="h-[62px] md:h-[70px]"></div>

      {/* POPUP */}
      <div
        ref={popupRef}
        className={`fixed top-16 right-5 w-80 max-h-[400px] bg-white/20 backdrop-blur-md border border-purple-600 shadow-xl rounded-2xl p-4 z-[9999] overflow-y-auto transform transition-all duration-300 ease-in-out
          ${showPopup ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 -translate-y-4 pointer-events-none'}
        `}
      >
        <h3 className="font-bold mb-3 text-gray-800 text-lg">Notifications</h3>
        {notifications.filter(n => !n.read).length === 0 ? (
          <p className="text-gray-500">No new notifications</p>
        ) : (
          notifications.filter(n => !n.read).map(n => (
            <div key={n.id} className="border-b border-purple-300/50 pb-2 mb-2 flex justify-between items-center">
              <div>
                <strong className="text-gray-800">{n.title}</strong>
                <div className="text-xs text-gray-500">{new Date(n.due).toLocaleString()}</div>
              </div>
              <button
                onClick={() => markAsRead(n.id)}
                className="text-green-500 p-1 hover:bg-green-600 hover:text-white rounded transition"
              >
                <FiCheck />
              </button>
            </div>
          ))
        )}
      </div>

      {/* BIG ALERT */}
      {activeAlert && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[10000]">
          <div className="bg-white p-6 rounded-xl shadow-xl text-center w-[90%] max-w-md">
            <FiBell ref={alertBellRef} className="text-indigo-600 text-6xl mb-3 animate-ring-continuous" />
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
        .animate-ring {
          animation: ringBell 1.5s ease;
        }
        .animate-ring-continuous {
          animation: ringBellContinuous 0.8s infinite alternate;
        }
        @keyframes ringBell {
          0% { transform: rotate(0deg); }
          15% { transform: rotate(15deg); }
          30% { transform: rotate(-15deg); }
          45% { transform: rotate(10deg); }
          60% { transform: rotate(-10deg); }
          75% { transform: rotate(5deg); }
          100% { transform: rotate(0deg); }
        }
        @keyframes ringBellContinuous {
          0% { transform: rotate(-10deg); }
          50% { transform: rotate(10deg); }
          100% { transform: rotate(-10deg); }
        }
      `}</style>
    </>
  )
}
