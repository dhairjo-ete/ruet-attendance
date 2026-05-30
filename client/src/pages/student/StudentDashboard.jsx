import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import useAuth from '../../hooks/useAuth.js'
import { getAllStudentAttendance, chooseSupervisor, getStudentProfile, deselectSupervisor } from '../../services/studentService.js'
import ruetLogo from '../../assets/RUET_logo.png'


const semesters = [
  '1st Year Odd Semester', '1st Year Even Semester',
  '2nd Year Odd Semester', '2nd Year Even Semester',
  '3rd Year Odd Semester', '3rd Year Even Semester',
  '4th Year Odd Semester', '4th Year Even Semester',
]

const StudentDashboard = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [attendance, setAttendance] = useState([])
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [supervisorMsg, setSupervisorMsg] = useState('')
  const [filterSemester, setFilterSemester] = useState('all')
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef(null)

  useEffect(() => { fetchAttendance() }, [])

  // Close menu on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const fetchAttendance = async () => {
    try {
      const [attendanceData, profileData] = await Promise.all([
        getAllStudentAttendance(),
        getStudentProfile()
      ])
      setAttendance(attendanceData)
      setProfile(profileData)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => { logout(); navigate('/login') }

  const handleSelectSupervisor = async (courseId, teacherId) => {
    if (!teacherId) return
    try {
      await chooseSupervisor(courseId, teacherId)
      setSupervisorMsg('Supervisor selected successfully!')
      setTimeout(() => setSupervisorMsg(''), 3000)
      fetchAttendance()
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to select supervisor')
    }
  }

  const handleDeselectSupervisor = async (courseId) => {
    if (!window.confirm('Are you sure you want to deselect this supervisor?')) return
    try {
      await deselectSupervisor(courseId)
      setSupervisorMsg('Supervisor deselected successfully!')
      setTimeout(() => setSupervisorMsg(''), 3000)
      fetchAttendance()
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to deselect supervisor')
    }
  }

  const getPercentageColors = (pct) => {
    if (pct < 50) return { text: 'text-red-650', bg: 'bg-red-50/50', border: 'border-red-100', bar: 'bg-red-500' }
    if (pct < 75) return { text: 'text-amber-600', bg: 'bg-amber-50/50', border: 'border-amber-100', bar: 'bg-amber-500' }
    return { text: 'text-emerald-650', bg: 'bg-emerald-50/50', border: 'border-emerald-100', bar: 'bg-emerald-500' }
  }

  // Calculate overall percentage based on all regular courses (unfiltered)
  const allRegularCourses = attendance.filter(a => !a.isProject)
  const overallPct = allRegularCourses.length > 0
    ? Math.round(allRegularCourses.reduce((sum, a) => sum + parseFloat(a.percentage || 0), 0) / allRegularCourses.length)
    : null

  // Filter attendance list
  const filteredAttendance = filterSemester === 'all'
    ? attendance
    : attendance.filter(a => a.course.semester === filterSemester)

  const regularCourses = filteredAttendance.filter(a => !a.isProject)
  const projectCourses = filteredAttendance.filter(a => a.isProject)

  // Fallbacks for display
  const displaySeries = profile?.series || user?.series || 'N/A'
  const displaySemester = profile?.currentSemester || user?.currentSemester || 'N/A'

  return (
    <div className="min-h-screen bg-slate-50/60 font-sans text-slate-800">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-200/60 px-6 py-4 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 flex items-center justify-center bg-white border border-slate-200/80 rounded-xl p-1 shadow-sm">
            <img src={ruetLogo} alt="RUET Logo" className="w-full h-full object-contain" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-slate-800 text-sm tracking-tight">Attendance Management System</h1>
              <span className="bg-teal-50 text-teal-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-teal-100">Student Portal</span>
            </div>
            <p className="text-[10px] text-slate-400 font-medium">Department of ETE</p>
          </div>
        </div>

        {/* Desktop nav items */}
        <div className="hidden sm:flex items-center gap-3">
          <button
            onClick={() => navigate('/student/courses')}
            className="px-4 py-2 text-xs font-semibold text-indigo-650 bg-indigo-50/50 hover:bg-indigo-50 border border-indigo-100 rounded-xl transition-all duration-200 cursor-pointer flex items-center gap-1.5"
          >
            <span>📚</span>
            <span>Browse Courses</span>
          </button>
          <button
            onClick={handleLogout}
            className="px-4 py-2 text-xs font-semibold text-red-650 bg-red-50 hover:bg-red-100 border border-red-100 rounded-xl transition-all duration-200 cursor-pointer"
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
            <div className="absolute right-0 top-12 bg-white border border-slate-200 rounded-2xl shadow-lg p-4 min-w-[200px] z-50 flex flex-col gap-3">
              <div className="pb-3 border-b border-slate-100">
                <p className="text-sm font-bold text-slate-800">{user?.name}</p>
                <p className="text-[11px] text-slate-400 font-medium">Student &bull; {user?.studentId}</p>
              </div>
              <button
                onClick={() => { setMenuOpen(false); navigate('/student/courses') }}
                className="w-full px-4 py-2.5 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-100 rounded-xl transition-all duration-200 cursor-pointer text-center flex items-center justify-center gap-1.5"
              >
                <span>📚</span> Browse Courses
              </button>
              <button
                onClick={handleLogout}
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
        <div className="bg-gradient-to-r from-indigo-50/70 via-slate-50 to-blue-50/70 rounded-3xl p-8 mb-8 text-slate-800 shadow-sm border border-indigo-100/80 relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(99,102,241,0.06),transparent_60%)] pointer-events-none" />
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest mb-1.5">Student Profile</p>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tight mb-4">{user?.name}</h2>
              <div className="flex gap-2.5 flex-wrap">
                <span className="bg-white/80 border border-slate-100 text-slate-700 rounded-full px-3.5 py-1.5 text-xs font-semibold shadow-sm flex items-center gap-1.5">
                  <span className="opacity-70">🪪 ID:</span> {user?.studentId}
                </span>
                <span className="bg-white/80 border border-indigo-100/50 text-indigo-900 rounded-full px-3.5 py-1.5 text-xs font-semibold shadow-sm flex items-center gap-1.5">
                  <span className="opacity-70">📅 Series:</span> {displaySeries}
                </span>
                <span className="bg-white/80 border border-indigo-100/50 text-indigo-900 rounded-full px-3.5 py-1.5 text-xs font-semibold shadow-sm flex items-center gap-1.5">
                  <span className="opacity-70">🎓 Semester:</span> {displaySemester}
                </span>
              </div>
            </div>
            
            {/* Avg Attendance Circle */}
            {overallPct !== null && (
              <div className="bg-white border border-indigo-100 rounded-2xl p-4 min-w-[130px] text-center shadow-sm hover:scale-[1.02] transition-all">
                <p className="text-3xl font-black text-indigo-650 leading-none">{overallPct}%</p>
                <p className="text-[9px] font-extrabold text-indigo-400 uppercase tracking-wider mt-1.5">Avg Attendance</p>
              </div>
            )}
          </div>
        </div>

        {supervisorMsg && (
          <div className="mb-6 px-4 py-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm rounded-xl font-medium">
            ✅ {supervisorMsg}
          </div>
        )}

        {/* Loading Spinner */}
        {loading ? (
          <div className="text-center py-20 text-slate-400">
            <div className="text-3xl mb-3 animate-spin">⏳</div>
            <p className="font-semibold text-sm">Loading dashboard details...</p>
          </div>
        ) : attendance.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-100 shadow-sm">
            <div className="text-5xl mb-4">📭</div>
            <h3 className="font-bold text-slate-800 text-lg mb-2">No Enrolled Courses</h3>
            <p className="text-slate-400 text-sm mb-6 max-w-sm mx-auto">You haven't enrolled in any courses yet. Go to Browse Courses to get started.</p>
            <button 
              onClick={() => navigate('/student/courses')} 
              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-sm shadow-sm transition-all cursor-pointer"
            >
              Browse Available Courses →
            </button>
          </div>
        ) : (
          <>
            {/* Dropdown Semester Filter (Matches Admin ManageCourses layout) */}
            <div className="flex items-center justify-between mb-6 bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
              <h3 className="text-sm font-bold text-slate-700">
                {filterSemester === 'all' ? `All Enrolled Courses (${attendance.length})` : `${filterSemester} (${filteredAttendance.length})`}
              </h3>
              <div className="flex items-center gap-2">
                <label className="text-xs font-semibold text-slate-500">Filter by Semester:</label>
                <select
                  value={filterSemester}
                  onChange={e => setFilterSemester(e.target.value)}
                  className="px-3 py-1.5 border border-slate-250 bg-slate-50 hover:bg-slate-100 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all cursor-pointer"
                >
                  <option value="all">All Semesters</option>
                  {semesters.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>

            {/* Zero State for Selected Semester */}
            {filteredAttendance.length === 0 && (
              <div className="bg-white rounded-2xl py-14 text-center border border-slate-100 shadow-sm">
                <div className="text-4xl mb-3">🔍</div>
                <p className="text-slate-500 text-xs font-bold">No courses found enrolled for {filterSemester}.</p>
              </div>
            )}

            {/* Regular Courses */}
            {regularCourses.length > 0 && (
              <div className="mb-10">
                <div className="flex items-center gap-2 mb-4">
                  <span className="bg-indigo-50 text-indigo-700 text-xs font-bold px-2.5 py-1 rounded-lg border border-indigo-100">📖 Attendance</span>
                  <h3 className="font-bold text-slate-800 text-base tracking-tight">Regular Courses</h3>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {regularCourses.map(item => {
                    const clr = getPercentageColors(parseFloat(item.percentage))
                    const pct = parseFloat(item.percentage)
                    return (
                      <div 
                        key={item.course._id} 
                        className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden hover:shadow-md hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between"
                      >
                        <div>
                          {/* Card Header */}
                          <div className="p-5 border-b border-slate-50">
                            <div className="flex justify-between items-start gap-4">
                              <div>
                                <span className="bg-slate-100 text-slate-800 text-[10px] font-bold px-2 py-0.5 rounded-md uppercase">{item.course.courseCode}</span>
                                <h4 className="font-bold text-slate-800 text-sm mt-2 leading-snug">{item.course.courseTitle}</h4>
                              </div>
                              <div className={`text-center ${clr.bg} ${clr.text} ${clr.border} border rounded-xl px-2.5 py-1.5 min-w-[54px] flex-shrink-0`}>
                                <div className="text-lg font-black leading-none">{item.percentage}%</div>
                                <div className="text-[8px] font-bold uppercase mt-0.5 opacity-95">present</div>
                              </div>
                            </div>
                          </div>

                          {/* Progress bar */}
                          <div className="h-1 bg-slate-150">
                            <div className={`h-full ${clr.bar} transition-all duration-500`} style={{ width: `${Math.min(pct, 100)}%` }} />
                          </div>

                          {/* Stat Chips */}
                          <div className="p-5">
                            <div className="grid grid-cols-3 gap-2 text-center mb-4">
                              <div className="bg-slate-50/50 rounded-xl p-2 border border-slate-100">
                                <div className="text-sm font-extrabold text-slate-750">{item.total}</div>
                                <div className="text-[9px] font-bold text-slate-400 uppercase mt-0.5">Total</div>
                              </div>
                              <div className="bg-slate-50/50 rounded-xl p-2 border border-slate-100">
                                <div className="text-sm font-extrabold text-emerald-600">{item.present}</div>
                                <div className="text-[9px] font-bold text-slate-400 uppercase mt-0.5">Present</div>
                              </div>
                              <div className="bg-slate-50/50 rounded-xl p-2 border border-slate-100">
                                <div className="text-sm font-extrabold text-red-500">{item.absent}</div>
                                <div className="text-[9px] font-bold text-slate-400 uppercase mt-0.5">Absent</div>
                              </div>
                            </div>

                            <div className="flex justify-between items-center px-3 py-2 bg-slate-50/50 border border-slate-100 rounded-xl">
                              <span className="text-xs font-semibold text-slate-500">Attendance Marks</span>
                              <span className="text-xs font-bold text-slate-800">{item.marks} <span className="text-[10px] text-slate-450 font-normal">/ 10</span></span>
                            </div>
                          </div>
                        </div>

                        {/* Warnings */}
                        {item.warning && (
                          <div className={`mx-5 mb-5 px-3 py-2 ${clr.bg} border ${clr.border} rounded-xl text-[11px] font-semibold ${clr.text} flex items-center gap-1.5`}>
                            <span>⚠️</span>
                            <span>{item.warning}</span>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Project / Thesis Courses */}
            {projectCourses.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <span className="bg-emerald-50 text-emerald-700 text-xs font-bold px-2.5 py-1 rounded-lg border border-emerald-100">🔬 Project / Thesis / Training</span>
                  <h3 className="font-bold text-slate-800 text-base tracking-tight">Supervision Details</h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {projectCourses.map(item => (
                    <div 
                      key={item.course._id} 
                      className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden hover:shadow-md transition-all duration-300"
                    >
                      {/* Top banner accent */}
                      <div className="bg-gradient-to-r from-emerald-600 to-teal-500 p-5 text-white">
                        <span className="text-[9px] font-black text-emerald-100 uppercase tracking-widest bg-emerald-750 px-2 py-0.5 rounded-full">{item.course.courseCode}</span>
                        <h4 className="font-bold text-white text-sm mt-2 leading-snug">{item.course.courseTitle}</h4>
                      </div>

                      <div className="p-5">
                        {item.supervisor ? (
                          <div className="flex flex-col gap-3 p-4 bg-emerald-50/50 border border-emerald-100 rounded-2xl">
                            <div className="flex items-center gap-4">
                              <div className="w-11 h-11 bg-gradient-to-br from-emerald-600 to-teal-500 rounded-full flex items-center justify-center text-white font-black text-base shadow-sm">
                                {item.supervisor.name?.charAt(0) || '?'}
                              </div>
                              <div className="flex-1">
                                <p className="text-[10px] font-bold text-slate-400 uppercase">Supervisor Selected</p>
                                <p className="font-extrabold text-slate-800 text-sm">{item.supervisor.name}</p>
                                <p className="text-[10px] text-slate-500 font-semibold mt-0.5">{item.supervisor.designation}</p>
                              </div>
                              <span className="text-xl bg-emerald-100/50 w-7 h-7 flex items-center justify-center rounded-full">✅</span>
                            </div>
                            {item.course.type !== 'training' && (
                              <div className="flex justify-end mt-1 border-t border-emerald-100/80 pt-2">
                                <button
                                  onClick={() => handleDeselectSupervisor(item.course._id)}
                                  className="px-3 py-1 text-[10px] font-bold text-red-650 bg-red-50 hover:bg-red-100 border border-red-150 rounded-xl transition-all duration-200 cursor-pointer"
                                >
                                  ❌ Deselect Supervisor
                                </button>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div>
                            {item.course.type === 'training' ? (
                              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-center text-xs font-semibold text-slate-500">
                                ℹ️ This course is designed to gain practical knowledge about advanced technological organization, their office environment, code, conducts, etc. 
                                by working with office stuffs.
                              </div>
                            ) : (
                              <>
                                <label className="block text-xs font-bold text-slate-500 mb-2">Choose Supervisor</label>
                                <select
                                  onChange={e => handleSelectSupervisor(item.course._id, e.target.value)}
                                  defaultValue=""
                                  className="w-full px-3 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded-xl text-xs font-bold text-slate-700 transition-all cursor-pointer mb-2"
                                >
                                  <option value="" disabled>Select your supervisor...</option>
                                  {item.course.teachers?.map(t => (
                                    <option key={t._id} value={t._id}>{t.name} ({t.designation})</option>
                                  ))}
                                </select>
                                <p className="text-[10px] text-slate-400 font-medium">💡 You can change or deselect your supervisor if needed.</p>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default StudentDashboard