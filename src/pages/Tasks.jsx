// src/pages/Tasks.jsx
import React, { useEffect, useState, useRef } from 'react'
import TaskForm from '../ui/TaskForm'
import TaskList from '../ui/TaskList'
import { load, save } from '../utils/storage'

export default function Tasks() {
  const [tasks, setTasks] = useState(() => load('tf_tasks', []))
  const [archive, setArchive] = useState(() => load('tf_archive', []))
  const settingsRef = useRef(load('tf_settings_v7', null))
  const [alarmAlert, setAlarmAlert] = useState(null)
  const [unreadCount, setUnreadCount] = useState(0)
  const audioRef = useRef(new Audio())

  // Persist tasks and archive
  useEffect(() => save('tf_tasks', tasks), [tasks])
  useEffect(() => save('tf_archive', archive), [archive])

  // Keep settingsRef up to date
  useEffect(() => {
    settingsRef.current = load('tf_settings_v7', null)
  })

  const add = t => setTasks(prev => [t, ...prev])
  const update = (id, patch) =>
    setTasks(prev => prev.map(x => x.id === id ? { ...x, ...patch } : x))

  const remove = id => {
    const t = tasks.find(x => x.id === id)
    if (!t) return
    const archivedTask = {
      ...t,
      deletedAt: new Date().toISOString(),
      isArchived: true
    }
    setArchive(prev => [archivedTask, ...prev])
    setTasks(prev => prev.filter(x => x.id !== id))
  }

  const toggle = id => {
    setTasks(prev =>
      prev.map(x =>
        x.id === id
          ? {
              ...x,
              done: !x.done,
              completedAt: !x.done ? new Date().toISOString() : null,
            }
          : x
      )
    )
  }

  // Play sound helper (Audio from settings)
  const playSound = async () => {
    const settings = settingsRef.current
    if (!settings || !settings.enabled) return
    audioRef.current.pause()
    if (settings.selectedTone.startsWith('custom:')) {
      const id = settings.selectedTone.split(':')[1]
      const custom = settings.customSounds?.find(c => c.id === id)
      if (!custom) return
      audioRef.current.src = custom.data
    } else {
      audioRef.current.src = `/tones/${settings.selectedTone.replace('preset:', '')}.mp3`
    }
    audioRef.current.volume = settings.volume / 100
    try { await audioRef.current.play() } catch {}
  }

  // Alarm loop
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date()
      const settings = load('tf_settings_v7', null)
      if (!settings || !settings.enabled) return

      let newAlerts = []
      setTasks(prev => {
        return prev.map(task => {
          if (!task.due || !task.alarmEnabled || task.alarmPlayedAt || task.done) return task
          const dueDate = new Date(task.due)
          if (dueDate <= now) {
            // Mark as played
            task.alarmPlayedAt = new Date().toISOString()
            newAlerts.push({ id: task.id, title: task.title, due: task.due })
          }
          return task
        })
      })

      if (newAlerts.length > 0) {
        // Update unread count
        setUnreadCount(prev => prev + newAlerts.length)
        // Show alert for first one
        setAlarmAlert(newAlerts[0])
        // Play sound once per batch
        playSound()
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="max-w-4xl mx-auto space-y-6 relative">
      <TaskForm onAdd={add} />
      <TaskList
        tasks={tasks}
        onToggle={toggle}
        onDelete={remove}
        onEdit={update}
      />

      {/* Alarm notification */}
      {alarmAlert && (
        <div className="fixed top-5 right-5 bg-indigo-100 border border-indigo-400 text-indigo-800 px-4 py-3 rounded shadow-lg z-50">
          <strong>Task Reminder:</strong> {alarmAlert.title}
          <button onClick={() => setAlarmAlert(null)} className="ml-3 text-indigo-700 font-bold">×</button>
        </div>
      )}
    </div>
  )
}
