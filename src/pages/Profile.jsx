// src/pages/Profile.jsx
import React, { useState, useEffect, useRef } from 'react'
import { FiEdit2, FiEye } from 'react-icons/fi'

export default function Profile() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [avatar, setAvatar] = useState('')
  const [showZoom, setShowZoom] = useState(false)
  const [isClosing, setIsClosing] = useState(false)
  const fileInputRef = useRef(null)

  const defaultAvatar = '/profile.jpg'

  useEffect(() => {
    const savedProfile = JSON.parse(localStorage.getItem('user_profile')) || {}

    if (!savedProfile.avatar) {
      const initialProfile = {
        name: 'Amarire',
        email: 'Contact@Amarire.dev',
        avatar: defaultAvatar
      }
      localStorage.setItem('user_profile', JSON.stringify(initialProfile))
      setName(initialProfile.name)
      setEmail(initialProfile.email)
      setAvatar(initialProfile.avatar)
    } else {
      setName(savedProfile.name || 'Amarire')
      setEmail(savedProfile.email || 'Contact@Amarire.dev')
      setAvatar(savedProfile.avatar || defaultAvatar)
    }
  }, [])

  const handleAvatarChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setAvatar(reader.result)
    reader.readAsDataURL(file)
  }

  const handleSave = () => {
    const profile = { name, email, avatar }
    if (window.confirm('Do you want to save or update this profile information?')) {
      localStorage.setItem('user_profile', JSON.stringify(profile))
      alert('Profile saved successfully!')
      window.dispatchEvent(new Event('profileUpdated'))
    }
  }

  const handleCloseZoom = () => {
    setIsClosing(true)
    setTimeout(() => {
      setShowZoom(false)
      setIsClosing(false)
    }, 300)
  }

  return (
    <div className="w-full min-h-screen py-6 px-0 md:px-4">

      {showZoom && (
        <div
          className={`fixed inset-0 z-[999999999] flex items-center justify-center
                      bg-white/20 backdrop-blur-3xl
                      ${isClosing ? 'animate-fadeOut' : 'animate-fadeIn'}`}
          onClick={handleCloseZoom}
        >
          <div className={`rounded-3xl overflow-hidden shadow-[0_0_40px_rgba(255,255,255,0.6)]
                          border-4 border-white/50
                          ${isClosing ? 'animate-zoomOut' : 'animate-zoomIn'}`}>
            <img
              src={avatar || defaultAvatar}
              alt="Zoom Avatar"
              className="w-[92vw] max-w-xl rounded-3xl object-cover"
            />
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes fadeOut { from { opacity: 1; } to { opacity: 0; } }
        @keyframes zoomIn { from { transform: scale(0.6); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        @keyframes zoomOut { from { transform: scale(1); opacity: 1; } to { transform: scale(0.6); opacity: 0; } }
        .animate-fadeIn { animation: fadeIn 0.3s forwards; }
        .animate-fadeOut { animation: fadeOut 0.3s forwards; }
        .animate-zoomIn { animation: zoomIn 0.3s forwards; }
        .animate-zoomOut { animation: zoomOut 0.3s forwards; }
      `}</style>

      <div className="max-w-full md:max-w-4xl mx-auto space-y-6">

        <div className="bg-white shadow-lg border border-gray-200 rounded-2xl p-4 md:p-6 space-y-6 w-full">

          <h2 className="text-2xl font-semibold text-indigo-700">Profile</h2>

          <div className="flex flex-col md:flex-row gap-6 items-center">

            <div className="relative group w-full md:w-auto flex justify-center">

              <div
                className="w-56 h-56 md:w-64 md:h-64 rounded-3xl overflow-hidden border-4 border-white/60 shadow-lg cursor-pointer relative"
              >
                <img
                  src={avatar || defaultAvatar}
                  alt="Avatar"
                  className="w-full h-full object-cover select-none"
                />

                <div
                  onClick={() => setShowZoom(true)}
                  className="absolute inset-0 flex items-center justify-center
                             bg-white/10 opacity-0 group-hover:opacity-100
                             transition cursor-pointer"
                >
                  <FiEye className="text-white text-4xl opacity-90" />
                </div>
              </div>

              <div
                className="absolute -top-3 -right-3 bg-indigo-600 text-white p-3 rounded-full shadow-xl cursor-pointer hover:bg-indigo-700 transition"
                onClick={() => fileInputRef.current.click()}
              >
                <FiEdit2 className="text-lg" />
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="hidden"
              />
            </div>

            <div className="flex-1 space-y-4 w-full">

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full border p-2 rounded-lg focus:ring-2 focus:ring-indigo-300"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full border p-2 rounded-lg focus:ring-2 focus:ring-indigo-300"
                />
              </div>

              <button
                onClick={handleSave}
                className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition w-full md:w-auto"
              >
                Save Profile
              </button>

            </div>

          </div>
        </div>
      </div>
    </div>
  )
}
