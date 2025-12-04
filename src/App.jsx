import React from 'react'
import { Routes, Route } from 'react-router-dom'
import Sidebar from './components/Sidebar'
import Header from './components/Header'
import Dashboard from './pages/Dashboard'
import Tasks from './pages/Tasks'
import Profile from './pages/Profile'
import NotFound from './pages/NotFound'
import Archive from './pages/Archive'
import Settings from './pages/Settings'

export default function App() {
  return (
    <div className="min-h-screen flex">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header />
        <main className="p-6">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/tasks" element={<Tasks />} />
            <Route path="/archive" element={<Archive />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
      </div>
    </div>
  )
}
