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
    type: '',
    taskId: null
  })

  useEffect(() => {
    const interval = setInterval(() => setTimer(prev => prev + 1), 1000)
    return () => clearInterval(interval)
  }, [])

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

      incrementPermanentDeleted()
    }
    setPopup({ show: false, type: '', taskId: null })
  }

  const cancelAction = () => {
    setPopup({ show: false, type: '', taskId: null })
  }

  return (
    <div className="w-full min-h-screen bg-gray-50 p-6 md:p-8">
      <h1 className="text-2xl md:text-3xl font-bold mb-6 text-indigo-700 text-center md:text-left">
        Archived Tasks
      </h1>

      {archive.length === 0 && (
        <p className="text-gray-500 text-lg text-center mt-10">No archived tasks yet.</p>
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
              className="bg-white p-6 rounded-3xl shadow-lg border border-gray-200 flex flex-col justify-between hover:scale-[1.03] transition-transform duration-300 hover:shadow-2xl"
            >
              <div>
                <h3 className="font-bold text-xl md:text-2xl text-indigo-700 mb-2">{t.title}</h3>
                {t.description && (
                  <p className="text-gray-600 mt-1 text-sm md:text-base">{t.description}</p>
                )}
                <div className="text-xs md:text-sm text-gray-500 mt-3">
                  Deleted at: {new Date(t.deletedAt).toLocaleString()}
                </div>
                <div className="text-xs md:text-sm text-red-600 mt-2 font-medium">
                  Will be permanently deleted in: {days}d {hours}h {minutes}m {seconds}s
                </div>
              </div>

              <div className="flex gap-2 mt-5 flex-wrap">
                <button
                  onClick={() => setPopup({ show: true, type: 'restore', taskId: t.id })}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-xl hover:bg-green-200 transition-colors font-semibold text-sm md:text-base shadow-md"
                >
                  <FaUndo /> Restore
                </button>

                <button
                  onClick={() => setPopup({ show: true, type: 'delete', taskId: t.id })}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-100 text-red-700 rounded-xl hover:bg-red-200 transition-colors font-semibold text-sm md:text-base shadow-md"
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-sm w-full shadow-2xl text-center animate-popup">
            <h2 className="text-lg md:text-xl font-bold text-gray-800 mb-4">
              {popup.type === 'restore' ? 'Confirm Restore?' : 'Confirm Permanent Delete?'}
            </h2>
            <p className="text-sm md:text-base text-gray-500 mb-6">
              {popup.type === 'restore'
                ? 'Do you want to restore this task back to your tasks?'
                : 'This action cannot be undone. Are you sure you want to delete it permanently?'}
            </p>
            <div className="flex flex-col gap-3 md:flex-row justify-center">
              <button
                onClick={confirmAction}
                className={`px-4 py-2 md:px-6 md:py-3 rounded-xl text-white font-semibold transition-colors ${
                  popup.type === 'restore'
                    ? 'bg-green-600 hover:bg-green-700'
                    : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                {popup.type === 'restore' ? 'Yes, Restore' : 'Yes, Delete'}
              </button>
              <button
                onClick={cancelAction}
                className="px-4 py-2 md:px-6 md:py-3 rounded-xl bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes popupIn {
          0% { opacity: 0; transform: scale(0.9); }
          100% { opacity: 1; transform: scale(1); }
        }
        .animate-popup {
          animation: popupIn 0.25s ease-out;
        }
      `}</style>
    </div>
  )
}
