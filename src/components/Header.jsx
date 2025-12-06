// src/components/Header.jsx
import React, { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
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
  const navigate = useNavigate()

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
  const audioPlaying = useRef(false)
  const prevUnreadCount = useRef(0)
  const popupRef = useRef(null)
  const alertBellRef = useRef(null)

  /* LOAD USER */
  useEffect(() => {
    const interval = setInterval(() => {
      const storedUser = JSON.parse(localStorage.getItem('user_profile')) || { name: 'Amarire', avatar: null }
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

  /* TASK WATCHER: generate activeAlert */
  useEffect(() => {
    const interval = setInterval(() => {
      const tasks = load('tf_tasks', [])
      const now = new Date()
      let updatedTasks = [...tasks]
      const newNotifications = []

      updatedTasks = updatedTasks.map(task => {
        if (task.alarmEnabled && !task.done && !task.alarmPlayedAt && task.due && new Date(task.due) <= now) {
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

          if (navigator.vibrate) navigator.vibrate([300, 200, 300])
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
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  /* PLAY SOUND ONLY FOR ACTIVE ALERT */
  useEffect(() => {
    const audio = audioRef.current

    if (activeAlert && !audioPlaying.current) {
      const settings = load('tf_settings_v7', null)
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
        if (alertBellRef.current) alertBellRef.current.classList.add('animate-ring-continuous')
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

    if (!activeAlert) {
      audio.pause()
      audio.currentTime = 0
      audioPlaying.current = false
      if (alertBellRef.current) alertBellRef.current.classList.remove('animate-ring-continuous')
    }
  }, [activeAlert, customSounds])

  /* MARK AS READ */
  const markAsRead = id => {
    setNotifications(prev => {
      const updated = prev.map(n => (n.id === id ? { ...n, read: true } : n))
      save(NOTIFICATIONS_KEY, updated)
      setUnreadCount(updated.filter(n => !n.read).length)
      return updated
    })
  }

  const stopAlert = () => {
    audioRef.current.pause()
    audioRef.current.currentTime = 0
    setActiveAlert(null)
    audioPlaying.current = false
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
        className={`fixed top-0 left-0 w-full bg-white/70 backdrop-blur-md shadow-md z-[9999] transition-transform duration-300 ${
          showHeader ? 'translate-y-0' : '-translate-y-full'
        }`}
      >
        <div className="w-full flex items-center justify-between px-4 md:px-6 py-1.5">
          {/* Logo */}
          <img
            src={logoImg}
            alt="Logo"
            className="h-12 md:h-14 w-auto cursor-pointer"
            onClick={() => navigate('/')}
          />

          <div className="flex items-center gap-3 md:gap-5">
            {/* Notification Icon */}
            <button
              onClick={() => setShowPopup(prev => !prev)}
              className="relative text-indigo-600 text-2xl md:text-3xl p-2 rounded-full hover:bg-indigo-100 transition shadow-md"
            >
              <FiBell ref={alertBellRef} />
              {unreadCount > 0 && (
                <span className="absolute top-0 right-0 w-4 h-4 bg-purple-600 text-white rounded-full text-xs flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* User Info */}
            <div className="hidden md:flex flex-col text-right">
              <span className="text-gray-800 font-semibold text-lg">{user.name}</span>
            </div>

            {user.avatar ? (
              <div
                className="w-12 md:w-14 h-12 md:h-14 rounded-2xl overflow-hidden border-2 border-gray-200 cursor-pointer"
                onClick={() => navigate('/profile')}
              >
                <img src={user.avatar} className="w-full h-full object-cover" />
              </div>
            ) : (
              <FiUser
                className="text-gray-500 w-12 md:w-14 h-12 md:h-14 bg-gray-100 p-2 rounded-2xl cursor-pointer"
                onClick={() => navigate('/profile')}
              />
            )}
          </div>
        </div>
      </header>

      <div className="h-[60px] md:h-[70px]"></div>

      {/* Notification Popup */}
      {showPopup && (
        <div
          ref={popupRef}
          className="fixed top-16 right-4 md:right-5 w-72 md:w-80 max-h-[400px] bg-white/70 backdrop-blur-md border border-purple-300 shadow-xl rounded-2xl p-4 z-[9999] overflow-y-auto transition-transform duration-300 animate-popup-in"
        >
          <h3 className="font-bold mb-3 text-purple-700 text-lg">Notifications</h3>
          {notifications.filter(n => !n.read).length === 0 ? (
            <p className="text-gray-600">No new notifications</p>
          ) : (
            notifications.filter(n => !n.read).map(n => (
              <div key={n.id} className="border-b border-purple-200 pb-2 mb-2 flex justify-between items-center">
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
      )}

      {/* Big Alert */}
      {activeAlert && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[10000]">
          <div className="bg-white/90 backdrop-blur-md p-6 rounded-xl shadow-xl text-center w-[90%] max-w-md">
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
        .animate-ring-continuous {
          animation: ring 1s infinite;
        }
        @keyframes ring {
          0% { transform: rotate(0deg); }
          25% { transform: rotate(15deg); }
          50% { transform: rotate(-15deg); }
          75% { transform: rotate(15deg); }
          100% { transform: rotate(0deg); }
        }
      `}</style>
    </>
  )
}
