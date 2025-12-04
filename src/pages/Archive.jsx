// src/pages/Archive.jsx
import React, { useEffect, useState } from 'react'
import { load, save, incrementPermanentDeleted } from '../utils/storage'
import { FaTrashAlt, FaUndo } from 'react-icons/fa'

function getTimeRemaining(deletedAt, daysLimit = 30) {
  const now = new Date()
  const deleteDate = new Date(deletedAt)
  const expiryDate = new Date(deleteDate.getTime() + daysLimit * 24 * 60 * 60 * 1000)
  const diff = expiryDate - now
  if (diff <= 0) return null

  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24)
  const minutes = Math.floor((diff / (1000 * 60)) % 60)
  const seconds = Math.floor((diff / 1000) % 60)

  return { days, hours, minutes, seconds, diff }
}

export default function Archive() {
  const [archive, setArchive] = useState(() => load('tf_archive', []))
  const [timer, setTimer] = useState(0)

  const [popup, setPopup] = useState({
    show: false,
    type: '', // 'restore' or 'delete'
    taskId: null
  })

  // Update countdown every second
  useEffect(() => {
    const interval = setInterval(() => setTimer(prev => prev + 1), 1000)
    return () => clearInterval(interval)
  }, [])

  // Auto-delete expired tasks
  useEffect(() => {
    const cleanedArchive = archive.filter(t => getTimeRemaining(t.deletedAt) !== null)
    if (cleanedArchive.length !== archive.length) {
      setArchive(cleanedArchive)
      save('tf_archive', cleanedArchive)
    }
  }, [timer])

  const confirmAction = () => {
    if (!popup.taskId) return
    if (popup.type === 'restore') {
      const task = archive.find(t => t.id === popup.taskId)
      if (!task) return
      const newArchive = archive.filter(t => t.id !== popup.taskId)
      setArchive(newArchive)
      save('tf_archive', newArchive)

      const tasks = load('tf_tasks', [])
      save('tf_tasks', [task, ...tasks])
    } else if (popup.type === 'delete') {
      const newArchive = archive.filter(t => t.id !== popup.taskId)
      setArchive(newArchive)
      save('tf_archive', newArchive)

      // ✅ Increment permanent deleted tasks counter
      incrementPermanentDeleted()
    }
    setPopup({ show: false, type: '', taskId: null })
  }

  const cancelAction = () => {
    setPopup({ show: false, type: '', taskId: null })
  }

  return (
    <div className="w-full min-h-screen bg-gray-50 p-4">

      <h1 className="text-3xl font-bold mb-6 text-indigo-700">Archived Tasks</h1>

      {archive.length === 0 && (
        <p className="text-gray-500 text-lg">No archived tasks yet.</p>
      )}

      <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {archive.map(t => {
          const timeLeft = getTimeRemaining(t.deletedAt)
          if (!timeLeft) {
            const newArchive = archive.filter(x => x.id !== t.id)
            setArchive(newArchive)
            save('tf_archive', newArchive)
            return null
          }

          const { days, hours, minutes, seconds } = timeLeft

          return (
            <li
              key={t.id}
              className="bg-white p-4 rounded-2xl shadow-lg border border-gray-200 flex flex-col justify-between hover:scale-102 transition-transform duration-200"
            >
              <div>
                <h3 className="font-semibold text-lg text-indigo-700">{t.title}</h3>
                {t.description && (
                  <p className="text-gray-600 mt-1 text-sm">{t.description}</p>
                )}
                <div className="text-xs text-gray-500 mt-2">
                  Deleted at: {new Date(t.deletedAt).toLocaleString()}
                </div>
                <div className="text-xs text-red-600 mt-1 font-medium">
                  Will be permanently deleted in: {days}d {hours}h {minutes}m {seconds}s
                </div>
              </div>

              <div className="flex gap-2 mt-4 flex-wrap">
                <button
                  onClick={() => setPopup({ show: true, type: 'restore', taskId: t.id })}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-1.5 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors text-sm font-semibold"
                >
                  <FaUndo /> Restore
                </button>

                <button
                  onClick={() => setPopup({ show: true, type: 'delete', taskId: t.id })}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-1.5 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors text-sm font-semibold"
                >
                  <FaTrashAlt /> Delete Permanently
                </button>
              </div>
            </li>
          )
        })}
      </ul>

      {/* Confirmation Popup */}
      {popup.show && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl text-center">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              {popup.type === 'restore' ? 'Confirm Restore?' : 'Confirm Permanent Delete?'}
            </h2>
            <p className="text-sm text-gray-500 mb-6">
              {popup.type === 'restore'
                ? 'Do you want to restore this task back to your tasks?'
                : 'This action cannot be undone. Are you sure you want to delete it permanently?'}
            </p>
            <div className="flex flex-col gap-3">
              <button
                onClick={confirmAction}
                className={popup.type === 'restore'
                  ? 'px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold'
                  : 'px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-semibold'
                }
              >
                {popup.type === 'restore' ? 'Yes, Restore' : 'Yes, Delete'}
              </button>
              <button
                onClick={cancelAction}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors font-semibold"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
