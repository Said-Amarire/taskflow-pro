// src/ui/TaskList.jsx
import React, { useState, useEffect, useRef } from 'react'
import { FiBell, FiArrowUp, FiArrowDown } from 'react-icons/fi'
import { load, save } from '../utils/storage'

function getCountdown(due) {
  const now = new Date()
  const target = new Date(due)
  const diff = target - now
  if (diff <= 0) return 'Expired'

  const seconds = Math.floor(diff / 1000) % 60
  const minutes = Math.floor(diff / (1000 * 60)) % 60
  const hours = Math.floor(diff / (1000 * 60 * 60)) % 24
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))

  if (days > 0) return `${days}d ${hours}h ${minutes}m ${seconds}s`
  if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`
  return `${minutes}m ${seconds}s`
}

function formatDate(dateStr) {
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  })
}

function isLessThan24Hours(due) {
  const now = new Date()
  const target = new Date(due)
  const diff = target - now
  return diff > 0 && diff < 24 * 60 * 60 * 1000
}

function TaskItem({ t, onToggle, onDelete, onEdit, moveUp, moveDown, isFirst, isLast }) {
  const [editing, setEditing] = useState(false)
  const [title, setTitle] = useState(t.title)
  const [description, setDescription] = useState(t.description)
  const [priority, setPriority] = useState(t.priority || '')
  const [dueDate, setDueDate] = useState(t.due ? new Date(t.due).toISOString().slice(0, 10) : '')
  const [dueTime, setDueTime] = useState(t.due ? new Date(t.due).toISOString().slice(11, 19) : '')
  const [countdown, setCountdown] = useState(t.due ? getCountdown(t.due) : '')
  const [alarmEnabled, setAlarmEnabled] = useState(!!t.alarmEnabled)
  const descriptionRef = useRef(null)

  const isRed = t.due && isLessThan24Hours(t.due)

  // Auto-resize description
  useEffect(() => {
    if (descriptionRef.current) {
      descriptionRef.current.style.height = 'auto'
      descriptionRef.current.style.height = descriptionRef.current.scrollHeight + 'px'
    }
  }, [description])

  useEffect(() => {
    if (!t.due || t.done) return
    const interval = setInterval(() => setCountdown(getCountdown(t.due)), 1000)
    return () => clearInterval(interval)
  }, [t.due, t.done])

  const saveTask = () => {
    if (alarmEnabled) {
      if (!dueDate || !dueTime) {
        alert('⚠️ To enable the alarm, please select a valid due date and time.')
        return
      }
      const dateObj = new Date(dueDate)
      const [h, m, s] = dueTime.split(':').map(Number)
      dateObj.setHours(h, m, s, 0)
      if (dateObj <= new Date()) {
        alert('⚠️ Please select a future date and time!')
        return
      }
    }

    let due = null
    if (dueDate) {
      const [hours, minutes, seconds] = (dueTime || '00:00:00').split(':').map(Number)
      const dateObj = new Date(dueDate)
      dateObj.setHours(hours % 24, minutes, seconds, 0)
      due = dateObj.toISOString()
    }

    const updatedTask = { ...t, title, description, priority, due, alarmEnabled, alarmPlayedAt: null }

    // Update tf_tasks for Header notifications
    const tasks = load('tf_tasks', [])
    const updatedTasks = tasks.map(task => (task.id === t.id ? updatedTask : task))
    save('tf_tasks', updatedTasks)

    onEdit(t.id, updatedTask)
    setEditing(false)
  }

  const snoozeTask = (minutes = 5) => {
    const tasks = load('tf_tasks', [])
    const updatedTasks = tasks.map(task => {
      if (task.id === t.id) {
        const newDue = new Date(Date.now() + minutes * 60000)
        return { ...task, due: newDue.toISOString(), alarmPlayedAt: null }
      }
      return task
    })
    save('tf_tasks', updatedTasks)
  }

  return (
    <li className={`flex flex-col gap-2 border rounded-xl p-3 md:p-4 ${t.done ? 'bg-purple-100' : 'bg-white'}`}>
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3 flex-wrap flex-1">
          <input
            type="checkbox"
            checked={t.done}
            onChange={() => {
              const completedAt = !t.done ? new Date().toISOString() : null
              onToggle(t.id, completedAt)

              const tasks = load('tf_tasks', [])
              const updatedTasks = tasks.map(task => task.id === t.id ? { ...task, done: !t.done, completedAt } : task)
              save('tf_tasks', updatedTasks)
            }}
            className="mt-1 h-5 w-5 accent-indigo-600"
          />
          <div className="flex-1 flex flex-col gap-1 min-w-[250px]">
            {editing ? (
              <>
                <input value={title} onChange={e => setTitle(e.target.value)} className="border border-gray-300 p-1 rounded w-full focus:ring-2 focus:ring-indigo-500 focus:outline-none" placeholder="Title" />
                <div className="flex gap-2 mt-1 flex-wrap">
                  <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} min={new Date().toISOString().slice(0,10)} className="border border-gray-300 p-1 rounded focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
                  <input type="time" step="1" value={dueTime} onChange={e => setDueTime(e.target.value)} min={dueDate === new Date().toISOString().slice(0,10) ? new Date().toISOString().slice(11,19) : '00:00:00'} className="border border-gray-300 p-1 rounded focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
                </div>
                <select value={priority} onChange={e => setPriority(e.target.value)} className={`border p-1 rounded w-full focus:ring-2 focus:outline-none mt-1 ${
                  priority === 'High' ? 'border-red-500' :
                  priority === 'Medium' ? 'border-yellow-500' :
                  priority === 'Low' ? 'border-green-500' : 'border-gray-300'
                }`}>
                  <option value="">Select priority</option>
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                </select>
                <label className="flex items-center gap-2 mt-2">
                  <input
                    type="checkbox"
                    checked={alarmEnabled}
                    onChange={e => setAlarmEnabled(e.target.checked)}
                    className="h-4 w-4 accent-indigo-600"
                  />
                  <FiBell className="text-indigo-600" />
                  <span className="text-sm">Enable alarm</span>
                </label>
                <textarea
                  ref={descriptionRef}
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Description"
                  className="w-full border border-gray-300 p-2 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none resize-none mt-2 overflow-hidden"
                />
              </>
            ) : (
              <>
                <div className={`font-medium text-lg ${t.done ? 'line-through text-gray-400' : ''}`}>{t.title}</div>
                {t.due && (
                  <div className={`flex items-center gap-2 text-xs font-semibold mt-1 flex-wrap ${isRed ? 'text-red-700' : 'text-black'}`}>
                    <div>Due: {formatDate(t.due)}</div>
                    {!t.done && <div>⏳ {countdown} left</div>}
                  </div>
                )}
                {t.description && (
                  <div className="text-sm text-gray-600 mt-1 break-words whitespace-pre-wrap">{t.description}</div>
                )}
                <div className={`text-xs font-semibold px-2 py-1 rounded w-max mt-1
                  ${t.priority === 'High' ? 'bg-red-200 text-red-700' :
                    t.priority === 'Medium' ? 'bg-yellow-200 text-yellow-700' :
                    t.priority === 'Low' ? 'bg-green-200 text-green-700' :
                    'bg-gray-200 text-gray-700'
                  }`}
                >
                  {t.priority || 'No priority'}
                </div>
                <div className="text-xs text-gray-400 mt-1 flex flex-col gap-0.5">
                  <div>Created: {formatDate(t.createdAt)}</div>
                  {t.completedAt && <div>Completed: {formatDate(t.completedAt)}</div>}
                  <div>Alarm: {!t.done ? (t.alarmEnabled ? (t.alarmPlayedAt ? 'Played' : 'Enabled') : 'Off') : 'Off'}</div>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-1 ml-2 mt-1">
          <button disabled={isFirst} onClick={moveUp} className="p-1 text-gray-600 hover:text-black"><FiArrowUp /></button>
          <button disabled={isLast} onClick={moveDown} className="p-1 text-gray-600 hover:text-black"><FiArrowDown /></button>
        </div>
      </div>

      <div className="flex gap-2 mt-2 flex-wrap">
        {editing ? (
          <>
            <button onClick={saveTask} className="text-sm px-2 py-1 bg-green-100 text-green-800 rounded-lg hover:bg-green-200 transition-colors">Save</button>
            <button onClick={() => setEditing(false)} className="text-sm px-2 py-1 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">Cancel</button>
          </>
        ) : (
          <>
            <button onClick={() => setEditing(true)} className="text-sm px-2 py-1 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors">Edit</button>
            <button onClick={() => onDelete(t.id)} className="text-sm px-2 py-1 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors">Delete</button>
            {t.alarmEnabled && !t.done && (
              <button onClick={() => snoozeTask(5)} className="text-sm px-2 py-1 bg-yellow-50 text-yellow-700 rounded-lg hover:bg-yellow-100 transition-colors">Snooze 5 min</button>
            )}
          </>
        )}
      </div>
    </li>
  )
}

export default function TaskList({ tasks, onToggle, onDelete, onEdit }) {
  const [orderedTasks, setOrderedTasks] = useState([])

  useEffect(() => {
    const savedOrder = load('taskOrder', [])
    const newOrdered = []

    savedOrder.forEach(id => {
      const task = tasks.find(t => t.id === id)
      if (task) newOrdered.push(task)
    })

    const remainingTasks = tasks.filter(t => !savedOrder.includes(t.id))
    setOrderedTasks([...remainingTasks, ...newOrdered])
  }, [tasks])

  const saveOrder = (tasksList) => {
    setOrderedTasks(tasksList)
    save('taskOrder', tasksList.map(t => t.id))
  }

  const moveTask = (index, direction) => {
    const newTasks = [...orderedTasks]
    if (direction === 'up' && index > 0) [newTasks[index - 1], newTasks[index]] = [newTasks[index], newTasks[index - 1]]
    if (direction === 'down' && index < newTasks.length - 1) [newTasks[index], newTasks[index + 1]] = [newTasks[index + 1], newTasks[index]]
    saveOrder(newTasks)
  }

  return (
    <div className="w-full h-full flex flex-col p-0 gap-4 md:gap-6">
      <h3 className="font-semibold text-indigo-700 text-lg md:text-xl mt-2 mb-2 px-0">Tasks</h3>
      <ul className="flex flex-col gap-4 w-full">
        {orderedTasks.length === 0 ? (
          <li className="text-sm text-gray-400">No tasks yet — add one!</li>
        ) : (
          orderedTasks.map((t, index) => (
            <TaskItem
              key={t.id}
              t={t}
              onToggle={onToggle}
              onDelete={onDelete}
              onEdit={onEdit}
              moveUp={() => moveTask(index, 'up')}
              moveDown={() => moveTask(index, 'down')}
              isFirst={index === 0}
              isLast={index === orderedTasks.length - 1}
            />
          ))
        )}
      </ul>
    </div>
  )
}
