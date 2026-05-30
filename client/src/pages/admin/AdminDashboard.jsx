import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import useAuth from '../../hooks/useAuth.js'
import { getAllStudents, getAllTeachers, getAllCourses } from '../../services/adminService.js'
import ruetLogo from '../../assets/RUET_logo.png'


const cards = [
  { 
    title: 'Manage Students', 
    desc: 'Add, view, update and promote students', 
    icon: '🎓', 
    path: '/admin/students', 
    color: 'from-blue-500 to-cyan-500',
    shadow: 'shadow-blue-100'
  },
  { 
    title: 'Manage Teachers', 
    desc: 'Add, view and update faculty members', 
    icon: '👨‍🏫', 
    path: '/admin/teachers', 
    color: 'from-purple-500 to-indigo-500',
    shadow: 'shadow-purple-100'
  },
  { 
    title: 'Manage Courses', 
    desc: 'Add courses and assign course teachers', 
    icon: '📚', 
    path: '/admin/courses', 
    color: 'from-emerald-500 to-teal-500',
    shadow: 'shadow-emerald-100'
  },
  { 
    title: 'Manage Routine', 
    desc: 'Configure class schedules and timing', 
    icon: '🗓️', 
    path: '/admin/routine', 
    color: 'from-orange-500 to-amber-500',
    shadow: 'shadow-orange-100'
  },
]

const AdminDashboard = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef(null)

  const [stats, setStats] = useState({ students: 0, teachers: 0, courses: 0 })
  const [loading, setLoading] = useState(true)

  // Close menu on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [s, t, c] = await Promise.all([
          getAllStudents(),
          getAllTeachers(),
          getAllCourses()
        ])
        setStats({
          students: s.length,
          teachers: t.length,
          courses: c.length
        })
      } catch (err) {
        console.error('Failed to fetch admin stats:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchStats()
  }, [])

  return (
    <div className="min-h-screen bg-slate-50/50 font-sans">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200/80 px-6 py-4 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 flex items-center justify-center bg-white border border-slate-200/80 rounded-xl p-1 shadow-sm">
            <img src={ruetLogo} alt="RUET Logo" className="w-full h-full object-contain" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-slate-800 text-sm tracking-tight">Attendance Management System</h1>
              <span className="bg-indigo-50 text-indigo-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-indigo-100">Admin Panel</span>
            </div>
            <p className="text-[11px] text-slate-400">Department of ETE</p>
          </div>
        </div>

        {/* Desktop nav items */}
        <div className="hidden sm:flex items-center gap-4">
          <div className="text-right">
            <p className="text-sm font-semibold text-slate-800">{user?.name}</p>
            <p className="text-[11px] text-slate-400 font-medium">System Administrator</p>
          </div>
          <div className="h-8 w-px bg-slate-200" />
          <button
            onClick={() => { logout(); navigate('/login') }}
            className="px-4 py-2 text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100/80 border border-red-100 rounded-xl transition-all duration-200 cursor-pointer"
          >
            Logout
          </button>
        </div>

        {/* Mobile hamburger */}
        <div className="sm:hidden relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen(prev => !prev)}
            className="w-9 h-9 flex flex-col items-center justify-center gap-[5px] bg-slate-100 hover:bg-slate-200 rounded-xl transition-all cursor-pointer"
            aria-label="Open menu"
          >
            <span className={`block w-5 h-0.5 bg-slate-600 rounded-full transition-all duration-200 ${menuOpen ? 'rotate-45 translate-y-[7px]' : ''}`} />
            <span className={`block w-5 h-0.5 bg-slate-600 rounded-full transition-all duration-200 ${menuOpen ? 'opacity-0' : ''}`} />
            <span className={`block w-5 h-0.5 bg-slate-600 rounded-full transition-all duration-200 ${menuOpen ? '-rotate-45 -translate-y-[7px]' : ''}`} />
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-12 bg-white border border-slate-200 rounded-2xl shadow-lg p-4 min-w-[200px] z-50 flex flex-col gap-3 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="pb-3 border-b border-slate-100">
                <p className="text-sm font-bold text-slate-800">{user?.name}</p>
                <p className="text-[11px] text-slate-400 font-medium">System Administrator</p>
              </div>
              <button
                onClick={() => { logout(); navigate('/login') }}
                className="w-full px-4 py-2.5 text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100/80 border border-red-100 rounded-xl transition-all duration-200 cursor-pointer text-center"
              >
                🚪 Log Out
              </button>
            </div>
          )}
        </div>
      </nav>

      {/* Main Container */}
      <div className="max-w-6xl mx-auto px-6 py-10">
        
        {/* Welcome & Stats Banner (Gentle Light-Theme Academic Design) */}
        <div className="bg-gradient-to-r from-slate-100 via-slate-50 to-indigo-50/70 rounded-3xl p-8 mb-10 text-slate-800 shadow-sm border border-slate-200/80 relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(99,102,241,0.06),transparent_60%)] pointer-events-none" />
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest mb-1.5">Overview</p>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-850 tracking-tight mb-2">Welcome Back, {user?.name || 'Admin'}</h2>
              <p className="text-sm text-slate-500 max-w-md">Manage students, faculty members, courses, and timetables for your department.</p>
            </div>
            
            {/* Quick Stats Grid */}
            <div className="flex gap-4 sm:gap-6 self-start md:self-center">
              <div className="bg-white border border-slate-200/70 rounded-2xl p-4 min-w-[90px] sm:min-w-[110px] text-center shadow-sm hover:scale-[1.02] transition-all">
                <p className="text-2xl sm:text-3xl font-black text-indigo-650">{loading ? '...' : stats.students}</p>
                <p className="text-[9px] sm:text-xs font-extrabold text-indigo-400 mt-1.5 uppercase tracking-wider">Students</p>
              </div>
              <div className="bg-white border border-slate-200/70 rounded-2xl p-4 min-w-[90px] sm:min-w-[110px] text-center shadow-sm hover:scale-[1.02] transition-all">
                <p className="text-2xl sm:text-3xl font-black text-indigo-650">{loading ? '...' : stats.teachers}</p>
                <p className="text-[9px] sm:text-xs font-extrabold text-indigo-400 mt-1.5 uppercase tracking-wider">Faculty</p>
              </div>
              <div className="bg-white border border-slate-200/70 rounded-2xl p-4 min-w-[90px] sm:min-w-[110px] text-center shadow-sm hover:scale-[1.02] transition-all">
                <p className="text-2xl sm:text-3xl font-black text-indigo-650">{loading ? '...' : stats.courses}</p>
                <p className="text-[9px] sm:text-xs font-extrabold text-indigo-400 mt-1.5 uppercase tracking-wider">Courses</p>
              </div>
            </div>
          </div>
        </div>

        {/* Section Title */}
        <div className="mb-6">
          <h3 className="font-bold text-slate-800 text-lg tracking-tight">Administrative Controls</h3>
          <p className="text-xs text-slate-400">Select an option below to configure resources</p>
        </div>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {cards.map(card => (
            <div
              key={card.title}
              onClick={() => navigate(card.path)}
              className={`bg-white rounded-2xl p-6 shadow-sm border border-slate-100 cursor-pointer hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group flex flex-col justify-between h-48`}
            >
              <div>
                <div className={`w-12 h-12 bg-gradient-to-br ${card.color} rounded-2xl flex items-center justify-center text-2xl mb-4 text-white shadow-md shadow-slate-100 group-hover:scale-110 transition-transform duration-300`}>
                  {card.icon}
                </div>
                <h3 className="font-bold text-slate-800 group-hover:text-indigo-600 transition-colors tracking-tight mb-1 text-base">{card.title}</h3>
                <p className="text-xs text-slate-400 leading-relaxed font-medium">{card.desc}</p>
              </div>
              <div className="flex items-center gap-1 text-[11px] font-bold text-indigo-600 group-hover:gap-2 transition-all mt-4 self-end">
                <span>Manage</span>
                <span>→</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default AdminDashboard