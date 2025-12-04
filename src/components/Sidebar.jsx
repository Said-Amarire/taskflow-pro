import { Link, useLocation } from 'react-router-dom'
import { FiHome, FiList, FiUser, FiArchive, FiSettings } from 'react-icons/fi'
import { useState, useEffect, useRef } from 'react'

export default function Sidebar() {
  const loc = useLocation()
  const [showMobileNav, setShowMobileNav] = useState(true)
  const [headerVisible, setHeaderVisible] = useState(true)
  const lastScrollY = useRef(0)

  const HEADER_HEIGHT = 90
  const TOP_MARGIN = 16

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY

      if (currentScrollY > lastScrollY.current && currentScrollY > 20) {
        setHeaderVisible(false)
        setShowMobileNav(false)
      } else {
        setHeaderVisible(true)
        setShowMobileNav(true)
      }

      lastScrollY.current = currentScrollY
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const item = (to, icon, label) => {
    const isActive = loc.pathname.replace(/\/$/, '') === to.replace(/\/$/, '')
    return (
      <Link
        to={to}
        className={`
          flex items-center gap-3 p-3 rounded-lg transition-all duration-300
          ${isActive 
            ? 'bg-indigo-800 text-white font-semibold shadow-md' 
            : 'text-white hover:text-white relative group'}
        `}
      >
        <span className="text-xl">{icon}</span>
        <span className="font-medium">{label}</span>

        {!isActive && (
          <span className="absolute inset-0 rounded-lg bg-gradient-to-r from-indigo-600 to-indigo-500 opacity-0 group-hover:opacity-20 transition-opacity duration-300 pointer-events-none"></span>
        )}
      </Link>
    )
  }

  const links = [
    ['/', <FiHome />, 'Dashboard'],
    ['/tasks', <FiList />, 'Tasks'],
    ['/archive', <FiArchive />, 'Archive'],
    ['/profile', <FiUser />, 'Profile'],
    ['/settings', <FiSettings />, 'Settings']
  ]

  const mobileLinks = () => {
    const dashboard = links.find(l => l[0] === '/')
    const others = links.filter(l => l[0] !== '/')
    const middle = Math.floor(others.length / 2)
    return [...others.slice(0, middle), dashboard, ...others.slice(middle)]
  }

  return (
    <>
      <aside
        className="hidden md:flex fixed left-4 w-72 bg-indigo-700 h-[calc(100vh-16px)] px-6 py-6 flex-col shadow-xl rounded-3xl transition-all duration-300"
        style={{
          top: `${headerVisible ? HEADER_HEIGHT + TOP_MARGIN : TOP_MARGIN}px`,
          height: headerVisible
            ? `calc(100vh - ${HEADER_HEIGHT + TOP_MARGIN + 16}px)`
            : `calc(100vh - ${TOP_MARGIN + 16}px)`
        }}
      >
        <nav className="flex flex-col gap-3 mt-2">
          {links.map(([to, icon, label]) => item(to, icon, label))}
        </nav>
      </aside>

      <nav
        className={`fixed bottom-2 left-2 right-2 bg-indigo-700 border-t md:hidden flex justify-around py-2 shadow-xl z-50 rounded-full transition-transform duration-300 ${
          showMobileNav ? 'translate-y-0' : 'translate-y-28'
        }`}
      >
        {mobileLinks().map(([to, icon, label]) => {
          const isActive = loc.pathname.replace(/\/$/, '') === to.replace(/\/$/, '')
          return (
            <Link
              key={to}
              to={to}
              className={`
                flex flex-col items-center text-xs gap-1 relative group transition-all duration-300
                ${isActive
                  ? 'text-white font-extrabold scale-110 tracking-wide'
                  : 'text-indigo-200 hover:text-white'}
              `}
            >
              <span className="text-xl">{icon}</span>
              <span>{label}</span>

              {!isActive && (
                <span className="absolute inset-0 rounded-full bg-gradient-to-t from-indigo-600 to-indigo-500 opacity-0 group-hover:opacity-20 transition-opacity duration-300 pointer-events-none"></span>
              )}
            </Link>
          )
        })}
      </nav>

      <div className="md:ml-72"></div>
    </>
  )
}
