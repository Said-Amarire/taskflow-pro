// src/ui/TaskForm.jsx
import React, { useState, useEffect, useRef } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { FiBell, FiPlus } from 'react-icons/fi'

export default function TaskForm({ onAdd }) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [dueTime, setDueTime] = useState('')
  const [priority, setPriority] = useState('')
  const [alarmEnabled, setAlarmEnabled] = useState(false)
  const [priorityError, setPriorityError] = useState(false)
  const [showForm, setShowForm] = useState(false)

  const [minDate, setMinDate] = useState('')
  const [minTime, setMinTime] = useState('')
  const [dateError, setDateError] = useState(false)
  const [timeError, setTimeError] = useState(false)

  const descriptionRef = useRef(null)

  // Set minimum date and time for the inputs
  useEffect(() => {
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const day = String(now.getDate()).padStart(2, '0')
    const hours = String(now.getHours()).padStart(2, '0')
    const minutes = String(now.getMinutes()).padStart(2, '0')
    const seconds = String(now.getSeconds()).padStart(2, '0')

    setMinDate(`${year}-${month}-${day}`)
    setMinTime(`${hours}:${minutes}:${seconds}`)
  }, [])

  // Auto-resize description textarea
  useEffect(() => {
    if (descriptionRef.current) {
      descriptionRef.current.style.height = 'auto'
      descriptionRef.current.style.height = descriptionRef.current.scrollHeight + 'px'
    }
  }, [description])

  const submit = (e) => {
    e.preventDefault()

    let valid = true

    if (!priority) {
      setPriorityError(true)
      valid = false
    } else {
      setPriorityError(false)
    }

    if (alarmEnabled) {
      if (!dueDate) {
        setDateError(true)
        valid = false
      } else {
        setDateError(false)
      }

      if (!dueTime) {
        setTimeError(true)
        valid = false
      } else {
        setTimeError(false)
      }

      if (!valid) {
        alert('⚠️ To enable the alarm, please select a valid due date and time.')
        return
      }
    }

    let due = null
    if (dueDate) {
      const time = dueTime || '00:00:00'
      const [hours, minutes, seconds] = time.split(':').map(Number)
      const dateObj = new Date(dueDate)
      dateObj.setHours(hours % 24, minutes || 0, seconds || 0, 0)

      const now = new Date()
      if (dateObj <= now) {
        alert('⚠️ Please select a future date and time!')
        return
      }

      due = dateObj.toISOString()
    }

    const task = {
      id: uuidv4(),
      title: title.trim(),
      description: description.trim(),
      priority,
      done: false,
      createdAt: new Date().toISOString(),
      due,
      completedAt: null,
      alarmEnabled,
      alarmPlayedAt: null,
    }

    onAdd(task)

    setTitle('')
    setDescription('')
    setDueDate('')
    setDueTime('')
    setPriority('')
    setAlarmEnabled(false)
    setShowForm(false)
  }

  const priorityColor = (p) => {
    if (p === 'High') return 'bg-red-200 text-red-700'
    if (p === 'Medium') return 'bg-yellow-200 text-yellow-700'
    if (p === 'Low') return 'bg-green-200 text-green-700'
    return 'bg-white text-black'
  }

  return (
    <>
      {!showForm && (
        <button
          onClick={() => setShowForm(true)}
          className="w-full flex justify-center py-6 bg-green-100 text-green-600 rounded-xl border border-green-300 shadow cursor-pointer hover:bg-green-200 transition"
        >
          <div className="flex flex-col items-center gap-2">
            <FiPlus className="text-4xl" />
            <span className="text-lg font-semibold">Add New Task</span>
          </div>
        </button>
      )}

      {showForm && (
        <form
          onSubmit={submit}
          className="w-full flex flex-col md:flex-row flex-wrap gap-3 p-4 bg-white border border-gray-200 rounded-xl shadow-lg mt-4"
        >
          <div className="flex-1 flex flex-col md:flex-row md:gap-3 flex-wrap w-full">
            <input
              aria-label="Task title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Task title"
              className="flex-1 min-w-[150px] border border-gray-300 p-2 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />

            <div className="flex gap-2 flex-wrap">
              <div className="flex flex-col">
                <label className="text-xs text-gray-500 mb-1">Due Date</label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  min={minDate}
                  className={`border p-2 rounded-lg focus:ring-2 focus:outline-none focus:ring-indigo-500 ${
                    dateError ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
              </div>

              <div className="flex flex-col">
                <label className="text-xs text-gray-500 mb-1">Due Time</label>
                <input
                  type="time"
                  step="1"
                  value={dueTime}
                  onChange={(e) => setDueTime(e.target.value)}
                  min={dueDate === minDate ? minTime : '00:00:00'}
                  className={`border p-2 rounded-lg focus:ring-2 focus:outline-none focus:ring-indigo-500 ${
                    timeError ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
              </div>
            </div>

            <div className="flex flex-col flex-1">
              <label className="text-sm font-semibold mb-1">
                Priority <span className="text-red-500">*</span>
              </label>
              {priorityError && (
                <span className="text-red-600 text-xs mb-1">
                  Please select a priority
                </span>
              )}
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className={`border p-2 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none ${
                  priorityError ? 'border-red-500' : priorityColor(priority)
                }`}
              >
                <option value="" disabled>Select priority</option>
                <option value="Low" className="bg-green-200 text-green-700">Low</option>
                <option value="Medium" className="bg-yellow-200 text-yellow-700">Medium</option>
                <option value="High" className="bg-red-200 text-red-700">High</option>
              </select>
            </div>

            <label className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg mt-2 cursor-pointer">
              <FiBell className="text-indigo-600 w-5 h-5" />
              <input
                type="checkbox"
                checked={alarmEnabled}
                onChange={(e) => setAlarmEnabled(e.target.checked)}
                className="h-4 w-4 accent-indigo-600"
              />
              <span className="text-sm font-medium">Enable alarm for this task</span>
            </label>

            <button
              type="submit"
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors flex-shrink-0 mt-2 md:mt-0"
            >
              Add Task
            </button>
          </div>

          <textarea
            ref={descriptionRef}
            aria-label="Task description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Description"
            rows={5}
            className="w-full border border-gray-300 p-2 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none resize-none mt-2 md:mt-4 overflow-hidden"
          />
        </form>
      )}
    </>
  )
}
