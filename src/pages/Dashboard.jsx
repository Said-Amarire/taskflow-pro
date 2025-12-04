// src/pages/Dashboard.jsx
import React, { useMemo, useState } from 'react'
import StatCard from '../components/StatCard'
import { Bar, Doughnut } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  BarElement,
  CategoryScale,
  LinearScale,
  ArcElement,
  Tooltip,
  Legend
} from 'chart.js'
import ChartDataLabels from 'chartjs-plugin-datalabels'
import { load, getPermanentDeletedCount } from '../utils/storage'

ChartJS.register(BarElement, CategoryScale, LinearScale, ArcElement, Tooltip, Legend, ChartDataLabels)

export default function Dashboard() {
  const tasks = load('tf_tasks', [])
  const archive = load('tf_archive', [])
  const permanentlyDeletedTasksCount = getPermanentDeletedCount()

  const [period, setPeriod] = useState('week')

  const totals = useMemo(() => {
    const total = tasks.length
    const done = tasks.filter(t => t.done).length
    return { total: total, done: done, pending: total - done }
  }, [tasks])

  const overdue = tasks.filter(t => t.due && !t.done && new Date(t.due) < new Date()).length
  const dueToday = tasks.filter(t => t.due && !t.done &&
    new Date(t.due).toDateString() === new Date().toDateString()).length
  const completedToday = tasks.filter(t => t.done && t.completedAt &&
    new Date(t.completedAt).toDateString() === new Date().toDateString()).length
  const completionRate = totals.total > 0 ? Math.floor((totals.done / totals.total) * 100) : 0
  const tasksToday = tasks.filter(t =>
    t.due && !t.done && new Date(t.due).toDateString() === new Date().toDateString()
  )
  const highPriority = tasks.filter(t => t.priority === 'High' && !t.done)
  const overdueTasks = tasks.filter(t => t.due && !t.done && new Date(t.due) < new Date())
  const archiveThisMonth = archive.filter(a => {
    const d = new Date(a.deletedAt)
    const now = new Date()
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
  })

  const computeBarData = () => {
    let startDate = new Date()
    let labels = []

    if (period === 'day') labels = [...Array(24)].map((_, i) => `${i}:00`)
    else if (period === 'week') {
      labels = [...Array(7)].map((_, i) => {
        const d = new Date()
        d.setDate(d.getDate() - (6 - i))
        return `${d.getDate().toString().padStart(2, '0')}/${d.toLocaleString('en-US', { month: 'short' })}`
      })
    } else if (period === 'month') {
      const daysInMonth = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0).getDate()
      labels = [...Array(daysInMonth)].map((_, i) => (i + 1).toString().padStart(2, '0'))
    } else if (period === 'year') {
      labels = [...Array(12)].map((_, i) =>
        new Date(startDate.getFullYear(), i, 1).toLocaleString('en-US', { month: 'short' })
      )
    }

    const created = labels.map((_, i) =>
      Math.floor(tasks.filter(t => {
        const d = new Date(t.createdAt)
        if (period === 'day') return d.getHours() === i
        if (period === 'week') {
          const start = new Date(); start.setDate(start.getDate() - (6 - i)); start.setHours(0, 0, 0, 0)
          const end = new Date(start); end.setHours(23, 59, 59, 999)
          return d >= start && d <= end
        }
        if (period === 'month') return d.getDate() === i + 1
        if (period === 'year') return d.getMonth() === i
      }).length)
    )

    const completed = labels.map((_, i) =>
      Math.floor(tasks.filter(t => {
        if (!t.done || !t.completedAt) return false
        const d = new Date(t.completedAt)
        if (period === 'day') return d.getHours() === i
        if (period === 'week') {
          const start = new Date(); start.setDate(start.getDate() - (6 - i)); start.setHours(0, 0, 0, 0)
          const end = new Date(start); end.setHours(23, 59, 59, 999)
          return d >= start && d <= end
        }
        if (period === 'month') return d.getDate() === i + 1
        if (period === 'year') return d.getMonth() === i
      }).length)
    )

    return {
      labels,
      datasets: [
        { label: 'Created', data: created, backgroundColor: '#10B981' },
        { label: 'Completed', data: completed, backgroundColor: '#6366F1' }
      ]
    }
  }

  const barData = computeBarData()

  const doughnutData = {
    labels: ['Completed', 'Pending', 'Overdue'],
    datasets: [{
      data: [totals.done, totals.pending, overdue].map(val => Math.floor(val)),
      backgroundColor: ['#6366F1', '#10B981', '#EF4444'],
      hoverOffset: 8
    }]
  }

  const doughnutOptions = {
    plugins: {
      legend: { position: 'bottom' },
      datalabels: {
        formatter: (value, ctx) => {
          const total = ctx.chart.data.datasets[0].data.reduce((a, b) => a + b, 0)
          const percent = total > 0 ? Math.floor((value / total) * 100) : 0
          return `${percent}%`
        },
        color: '#111',
        font: { weight: 'bold', size: 16 }
      }
    }
  }

  const priorityData = {
    labels: ['Low', 'Medium', 'High'],
    datasets: [{
      label: 'Tasks by Priority',
      data: [
        tasks.filter(t => t.priority === 'Low').length,
        tasks.filter(t => t.priority === 'Medium').length,
        tasks.filter(t => t.priority === 'High').length
      ].map(val => Math.floor(val)),
      backgroundColor: ['#10B981', '#FBBF24', '#EF4444']
    }]
  }

  return (
    <div className="w-full min-h-screen space-y-6 bg-gray-50 px-0 md:px-4 lg:px-6">

      {/* Top Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <div className="bg-white p-4 rounded-xl shadow-lg border border-gray-200">
          <div className="text-sm text-gray-500">Total Tasks</div>
          <div className="text-2xl font-semibold mt-2 text-indigo-700">{totals.total}</div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-lg border border-gray-200">
          <div className="text-sm text-gray-500">Completed</div>
          <div className="text-2xl font-semibold mt-2 text-indigo-600">{totals.done}</div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-lg border border-gray-200">
          <div className="text-sm text-gray-500">Pending</div>
          <div className="text-2xl font-semibold mt-2 text-yellow-600">{totals.pending}</div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-lg border border-gray-200">
          <div className="text-sm text-gray-500">Overdue</div>
          <div className="text-2xl font-semibold mt-2 text-red-500">{overdue}</div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-lg border border-gray-200">
          <div className="text-sm text-gray-500">Near Permanent Delete</div>
          <div className="text-2xl font-semibold mt-2 text-red-700">{permanentlyDeletedTasksCount}</div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-lg border border-gray-200">
          <div className="text-sm text-gray-500">Completion Rate</div>
          <div className="text-2xl font-semibold mt-2 text-indigo-500">{completionRate}%</div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-lg border border-gray-200">
          <div className="text-sm text-gray-500">Due Today</div>
          <div className="text-2xl font-semibold mt-2 text-blue-500">{dueToday}</div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-lg border border-gray-200">
          <div className="text-sm text-gray-500">Completed Today</div>
          <div className="text-2xl font-semibold mt-2 text-green-600">{completedToday}</div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-lg border border-gray-200">
          <div className="text-sm text-gray-500">High Priority Tasks</div>
          <div className="text-2xl font-semibold mt-2 text-red-600">{highPriority.length}</div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-lg border border-gray-200">
          <div className="text-sm text-gray-500">Archived This Month</div>
          <div className="text-2xl font-semibold mt-2 text-blue-600">{archiveThisMonth.length}</div>
        </div>
      </div>

      {/* Period Filter */}
      <div className="flex flex-wrap gap-3 items-center">
        <span className="font-semibold text-indigo-700">View period:</span>
        {['day', 'week', 'month', 'year'].map(p => (
          <button
            key={p}
            className={`px-4 py-1 rounded-lg transition-all shadow-sm border 
              ${period === p
                ? 'bg-indigo-600 text-white'
                : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
              }`}
            onClick={() => setPeriod(p)}
          >
            {p.charAt(0).toUpperCase() + p.slice(1)}
          </button>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-6">
        <div className="bg-white p-4 shadow-lg rounded-xl border">
          <h3 className="font-semibold mb-4 text-indigo-700">Tasks Activity</h3>
          <div className="w-full h-96">
            <Bar data={barData} options={{ maintainAspectRatio: false }} />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white p-4 shadow-lg rounded-xl border">
            <h3 className="font-semibold mb-4 text-center text-indigo-700">Task Status Distribution</h3>
            <div className="w-full h-72">
              <Doughnut data={doughnutData} options={doughnutOptions} plugins={[ChartDataLabels]} />
            </div>
          </div>
          <div className="bg-white p-4 shadow-lg rounded-xl border">
            <h3 className="font-semibold mb-4 text-center text-indigo-700">Tasks by Priority</h3>
            <div className="w-full h-72">
              <Bar data={priorityData} options={{ maintainAspectRatio: false }} />
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Lists */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">

        {/* Tasks Today */}
        <div className="bg-blue-200 p-4 shadow-lg rounded-xl border text-black">
          <h3 className="font-semibold mb-2">
            Tasks Due Today ({tasksToday.length})
          </h3>
          <ul className="space-y-1 max-h-60 overflow-y-auto text-black text-sm">
            {tasksToday.length === 0 && <li>No tasks for today!</li>}
            {tasksToday.map(t => (
              <li key={t.id} className="flex justify-between border-b py-1">
                <span className="text-black">{t.title}</span>
                <span className="text-xs text-black">
                  {t.due ? new Date(t.due).toLocaleTimeString('en-US', { hour12: false }) : ''}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* High Priority Tasks */}
        <div className="bg-red-100 p-4 shadow-lg rounded-xl border text-black">
          <h3 className="font-semibold mb-2">
            High Priority Tasks ({highPriority.length})
          </h3>
          <ul className="space-y-1 max-h-60 overflow-y-auto text-black text-sm">
            {highPriority.length === 0 && <li>No high priority tasks!</li>}
            {highPriority.map(t => (
              <li key={t.id} className="flex justify-between border-b py-1">
                <span className="text-black">{t.title}</span>
                <span className="text-xs text-black">
                  {t.due ? new Date(t.due).toLocaleDateString('en-US', { month: 'short', day: '2-digit' }) : ''}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* Overdue Tasks */}
        <div className="bg-amber-100 p-4 shadow-lg rounded-xl border text-black">
          <h3 className="font-semibold mb-2">
            Overdue Tasks ({overdueTasks.length})
          </h3>
          <ul className="space-y-1 max-h-60 overflow-y-auto text-black text-sm">
            {overdueTasks.length === 0 && <li>No overdue tasks!</li>}
            {overdueTasks.map(t => (
              <li key={t.id} className="flex justify-between border-b py-1">
                <span className="line-through text-black">{t.title}</span>
                <span className="text-xs text-black">
                  {t.due ? new Date(t.due).toLocaleDateString('en-US', { month: 'short', day: '2-digit' }) : ''}
                </span>
              </li>
            ))}
          </ul>
        </div>

      </div>
    </div>
  )
}
