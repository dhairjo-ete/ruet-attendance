import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import useAuth from '../../hooks/useAuth.js'
import { getTeacherCourses } from '../../services/teacherService.js'
import { endCourse } from '../../services/courseService.js'
import ruetLogo from '../../assets/RUET_logo.png'

const seriesConfig = [
  { series: '20', title: "Series '20", icon: '🎓', color: 'from-blue-500 to-cyan-500', shadow: 'shadow-blue-100' },
  { series: '21', title: "Series '21", icon: '🏛️', color: 'from-purple-500 to-indigo-500', shadow: 'shadow-purple-100' },
  { series: '22', title: "Series '22", icon: '🔬', color: 'from-emerald-500 to-teal-500', shadow: 'shadow-emerald-100' },
  { series: '23', title: "Series '23", icon: '⚙️', color: 'from-orange-500 to-amber-500', shadow: 'shadow-orange-100' },
  { series: '24', title: "Series '24", icon: '💻', color: 'from-rose-500 to-pink-500', shadow: 'shadow-rose-100' },
  { series: '25', title: "Series '25", icon: '🚀', color: 'from-teal-500 to-cyan-500', shadow: 'shadow-teal-100' },
]

const TeacherDashboard = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [courses, setCourses] = useState([])
  const [seriesSemesterMap, setSeriesSemesterMap] = useState({})
  const [loading, setLoading] = useState(true)
  const [selectedSeries, setSelectedSeries] = useState('none')
  const [activeTab, setActiveTab] = useState('regular')
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef(null)

  const [showEndModal, setShowEndModal] = useState(false)
  const [courseToEnd, setCourseToEnd] = useState(null)
  const [endLoading, setEndLoading] = useState(false)

  const handleEndCourseClick = (course) => {
    setCourseToEnd(course)
    setShowEndModal(true)
  }

  const handleConfirmEndCourse = async () => {
    if (!courseToEnd) return
    setEndLoading(true)
    try {
      await endCourse(courseToEnd._id)
      setShowEndModal(false)
      setCourseToEnd(null)
      await fetchCourses()
    } catch (err) {
      console.error("Failed to end course:", err)
      alert("Failed to end course. Please try again.")
    } finally {
      setEndLoading(false)
    }
  }

  useEffect(() => { fetchCourses() }, [])

  // Close menu on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const fetchCourses = async () => {
    try {
      const data = await getTeacherCourses()
      setCourses(data.courses || [])
      setSeriesSemesterMap(data.seriesSemesterMap || {})
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => { logout(); navigate('/login') }

  // Count courses assigned per series/semester
  const getCourseCountForSeries = (ser) => {
    const sem = seriesSemesterMap[ser]
    if (!sem) return 0
    return courses.filter(c => c.semester === sem).length
  }

  // Filter courses based on active series card selection
  const activeSemester = selectedSeries !== 'none' ? seriesSemesterMap[selectedSeries] : null
  const filteredCourses = activeSemester
    ? courses.filter(c => c.semester === activeSemester)
    : []

  const regularCourses = filteredCourses.filter(c => c.type === 'theory' || c.type === 'lab')
  const projectCourses = filteredCourses.filter(c => c.type === 'project' || c.type === 'thesis' || c.type === 'training')

  // Overall counts for quick stats banner
  const totalCourses = courses.length
  const totalSupervisedCount = courses.reduce((sum, c) => {
    const supervised = c.projectSupervisors?.filter(ps => {
      const tid = ps.teacher?._id?.toString() || ps.teacher?.toString()
      return tid === user?._id
    }) || []
    return sum + supervised.length
  }, 0)

  return (
    <div className="min-h-screen bg-slate-50/50 font-sans text-slate-800">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200/80 px-6 py-4 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 flex items-center justify-center bg-white border border-slate-200/80 rounded-xl p-1 shadow-sm">
            <img src={ruetLogo} alt="RUET Logo" className="w-full h-full object-contain" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-slate-800 text-sm tracking-tight">Attendance Management System</h1>
              <span className="bg-indigo-50 text-indigo-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-indigo-100">Teacher Portal</span>
            </div>
            <p className="text-[11px] text-slate-400">Department of ETE</p>
          </div>
        </div>

        {/* Desktop nav items */}
        <div className="hidden sm:flex items-center gap-3">
          <button
            onClick={() => navigate('/teacher/profile')}
            className="px-4 py-2 text-xs font-semibold text-indigo-650 bg-indigo-50 hover:bg-indigo-100 border border-indigo-100 rounded-xl transition-all duration-200 cursor-pointer flex items-center gap-1.5"
          >
            <span>👤</span>
            <span>My Profile</span>
          </button>

          <button
            onClick={handleLogout}
            className="px-4 py-2 text-xs font-semibold text-red-650 bg-red-50 hover:bg-red-100/80 border border-red-100 rounded-xl transition-all duration-200 cursor-pointer"
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
                <p className="text-[11px] text-slate-400 font-medium">{user?.designation}</p>
              </div>
              <button
                onClick={() => { setMenuOpen(false); navigate('/teacher/profile') }}
                className="w-full px-4 py-2.5 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-100 rounded-xl transition-all duration-200 cursor-pointer text-center flex items-center justify-center gap-1.5"
              >
                <span>👤</span> My Profile
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
      <div className="max-w-4xl mx-auto px-6 py-10">
        
        {/* Welcome & Stats Banner (Gentle Light-Theme Academic Design) */}
        <div className="bg-gradient-to-r from-blue-50/70 via-slate-50 to-indigo-50/70 rounded-3xl p-8 mb-8 text-slate-800 shadow-sm border border-blue-150 relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(99,102,241,0.06),transparent_60%)] pointer-events-none" />
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest mb-1.5">Faculty Profile</p>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-850 tracking-tight mb-3.5">{user?.name}</h2>
              <div className="flex gap-2.5 flex-wrap">
                <span className="bg-white/80 border border-blue-100/50 text-blue-900 rounded-full px-3.5 py-1.5 text-xs font-semibold shadow-sm">
                  🎓 {user?.designation}
                </span>
                <span className="bg-white/80 border border-blue-100/50 text-blue-900 rounded-full px-3.5 py-1.5 text-xs font-semibold shadow-sm">
                  🏢 Dept. of {user?.department}
                </span>
              </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="flex gap-4 sm:gap-6 self-start md:self-center">
              <div className="bg-white border border-blue-100 rounded-2xl p-4 min-w-[100px] text-center shadow-sm hover:scale-[1.02] transition-all">
                <p className="text-2xl sm:text-3xl font-black text-indigo-650">{loading ? '...' : totalCourses}</p>
                <p className="text-[9px] font-extrabold text-indigo-400 mt-1.5 uppercase tracking-wider">Total Courses</p>
              </div>
              <div className="bg-white border border-blue-100 rounded-2xl p-4 min-w-[100px] text-center shadow-sm hover:scale-[1.02] transition-all">
                <p className="text-2xl sm:text-3xl font-black text-indigo-650">{loading ? '...' : totalSupervisedCount}</p>
                <p className="text-[9px] font-extrabold text-indigo-400 mt-1.5 uppercase tracking-wider">Supervised</p>
              </div>
            </div>
          </div>
        </div>

        {/* Dynamic Series Grid Blocks in a Perfect 3x2 Matrix */}
        <div className="mb-8">
          <div className="mb-4">
            <h3 className="font-bold text-slate-800 text-lg tracking-tight">Academic Series</h3>
            <p className="text-xs text-slate-400">Select a Series to load assigned courses</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {seriesConfig.map(c => {
              const active = selectedSeries === c.series
              const count = getCourseCountForSeries(c.series)
              const sem = seriesSemesterMap[c.series] || 'Loading...'
              return (
                <div
                  key={c.series}
                  onClick={() => {
                    setSelectedSeries(active ? 'none' : c.series)
                    setActiveTab('regular')
                  }}
                  className={`bg-white rounded-2xl p-6 shadow-sm border cursor-pointer hover:shadow-md hover:-translate-y-1 transition-all duration-200 flex flex-col justify-between h-40 ${
                    active ? 'border-indigo-600 ring-4 ring-indigo-500/10' : 'border-slate-100'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div className={`w-10 h-10 bg-gradient-to-br ${c.color} rounded-xl flex items-center justify-center text-xl text-white shadow-sm`}>
                      {c.icon}
                    </div>
                    <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full border ${
                      count > 0 ? 'bg-indigo-50 text-indigo-700 border-indigo-100' : 'bg-slate-50 text-slate-450 border-slate-100'
                    }`}>
                      {count} {count === 1 ? 'course' : 'courses'}
                    </span>
                  </div>
                  <div>
                    <h4 className="font-extrabold text-slate-800 text-base tracking-tight">{c.title}</h4>
                    <p className="text-[11px] text-slate-400 font-semibold mt-1.5 leading-snug line-clamp-2" title={sem}>
                      {sem}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Course Directory Section */}
        <div className="mt-10">
          {loading ? (
            <div className="text-center py-20 text-slate-400">
              <div className="text-3xl mb-3 animate-spin">⏳</div>
              <p className="font-semibold text-sm">Loading your courses...</p>
            </div>
          ) : selectedSeries === 'none' ? (
            /* First webpage empty state: No active courses directory displayed */
            <div className="bg-white rounded-3xl p-10 text-center border border-slate-200/60 shadow-sm">
              <div className="text-5xl mb-4">📚</div>
              <h3 className="font-bold text-slate-800 text-lg mb-2">Select a Series to Start</h3>
              <p className="text-slate-400 text-xs max-w-sm mx-auto leading-relaxed">
                Choose one of the Series to view and manage your assigned courses.
              </p>
            </div>
          ) : filteredCourses.length === 0 ? (
            /* Selected series empty state: No assigned courses */
            <div className="bg-white rounded-3xl p-12 text-center border border-slate-100 shadow-sm">
              <div className="text-5xl mb-4">📭</div>
              <h3 className="font-bold text-slate-800 text-lg mb-2">No Courses Assigned</h3>
              <p className="text-slate-400 text-sm max-w-sm mx-auto">
                You are not assigned any courses for {activeSemester}.
              </p>
            </div>
          ) : (
            <>
              <div className="mb-6">
                <h3 className="font-bold text-slate-800 text-lg tracking-tight">
                  {seriesConfig.find(s => s.series === selectedSeries)?.title} Assigned Courses ({filteredCourses.length})
                </h3>
                <p className="text-xs text-slate-400 mb-6">
                  Showing courses assigned for {activeSemester}
                </p>

                {/* Tab Switcher Segment Bar */}
                <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200/50 max-w-md mb-8">
                  <button
                    onClick={() => setActiveTab('regular')}
                    className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer text-center ${
                      activeTab === 'regular'
                        ? 'bg-white text-indigo-750 shadow-sm border border-slate-250/20'
                        : 'text-slate-500 hover:text-slate-850'
                    }`}
                  >
                    📖 Regular Courses ({regularCourses.length})
                  </button>
                  <button
                    onClick={() => setActiveTab('supervised')}
                    className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer text-center ${
                      activeTab === 'supervised'
                        ? 'bg-white text-emerald-750 shadow-sm border border-slate-250/20'
                        : 'text-slate-500 hover:text-slate-850'
                    }`}
                  >
                    🔬 Supervised Courses ({projectCourses.length})
                  </button>
                </div>
              </div>

              {/* Regular Courses Tab */}
              {activeTab === 'regular' && (
                <div>
                  {regularCourses.length === 0 ? (
                    <div className="bg-white rounded-3xl p-12 text-center border border-slate-100 shadow-sm">
                      <div className="text-5xl mb-4">📖</div>
                      <h3 className="font-bold text-slate-800 text-sm mb-1">No Regular Courses</h3>
                      <p className="text-slate-400 text-xs">No theory or sessional courses are assigned for this batch.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      {regularCourses.map(course => (
                        <div
                          key={course._id}
                          className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden hover:shadow-md hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between"
                        >
                          <div>
                            {/* Top banner accent based on type */}
                            <div className={`h-1.5 bg-gradient-to-r ${course.type === 'lab' ? 'from-purple-650 to-purple-550' : 'from-indigo-650 to-indigo-550'}`} />

                            <div className="p-5">
                              <div className="flex justify-between items-start gap-4 mb-3">
                                <span className="bg-slate-100 text-slate-850 text-[10px] font-bold px-2 py-0.5 rounded-md uppercase">
                                  {course.courseCode}
                                </span>
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${course.type === 'lab' ? 'bg-purple-50 text-purple-700 border-purple-100' : 'bg-indigo-50 text-indigo-700 border-indigo-100'}`}>
                                  {course.type === 'lab' ? 'Sessional' : 'Theory'}
                                </span>
                              </div>

                              <h4 className="font-bold text-slate-800 text-sm leading-snug line-clamp-2 h-10" title={course.courseTitle}>{course.courseTitle}</h4>
                              <p className="text-[10px] text-slate-450 font-semibold mt-1">{course.semester}</p>

                              <div className="mt-4 flex items-center justify-between px-3 py-2 bg-slate-50/50 border border-slate-100 rounded-xl text-xs">
                                <span className="text-slate-500 font-medium">👥 Enrolled Students</span>
                                <span className="font-extrabold text-slate-850">{course.students?.length || 0}</span>
                              </div>
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="p-5 pt-0">
                            {/* Main Attendance Buttons Row */}
                            <div className="grid grid-cols-4 gap-2">
                              <button
                                onClick={() => navigate(`/teacher/attendance/${course._id}`)}
                                className="col-span-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-[11px] font-extrabold shadow-sm transition-all cursor-pointer text-center animate-none"
                              >
                                📝 Take Attendance
                              </button>
                              <button
                                onClick={() => navigate(`/teacher/attendance/edit/${course._id}`)}
                                className="col-span-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-[11px] font-bold transition-all cursor-pointer text-center animate-none"
                              >
                                ✏️ Edit
                              </button>
                            </div>
                            
                            {/* Compact Row for Analysis and End Course */}
                            <div className="flex justify-between items-center mt-3 pt-2.5 border-t border-slate-100/80 px-1">
                              <button
                                onClick={() => navigate(`/teacher/course/${course._id}/students`)}
                                className="text-slate-650 hover:text-indigo-650 transition-colors flex items-center gap-1.5 cursor-pointer font-semibold text-[11.5px]"
                              >
                                <span>📊 Course Analysis</span>
                              </button>
                              <button
                                onClick={() => handleEndCourseClick(course)}
                                className="text-red-500 hover:text-red-700 transition-colors flex items-center gap-1.5 cursor-pointer font-semibold text-[11.5px]"
                              >
                                <span>🛑 End Course</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Supervised Courses Tab */}
              {activeTab === 'supervised' && (
                <div>
                  {projectCourses.length === 0 ? (
                    <div className="bg-white rounded-3xl p-12 text-center border border-slate-100 shadow-sm">
                      <div className="text-5xl mb-4">🔬</div>
                      <h3 className="font-bold text-slate-800 text-sm mb-1">No Supervised Courses</h3>
                      <p className="text-slate-400 text-xs">No projects, thesis or industrial training courses are assigned for this batch.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      {projectCourses.map(course => {
                        const supervisedStudents = [...(course.projectSupervisors?.filter(ps => {
                          const tid = ps.teacher?._id?.toString() || ps.teacher?.toString()
                          return tid === user?._id
                        }).map(ps => ps.student) || [])].sort((a, b) =>
                          (a?.studentId || '').localeCompare(b?.studentId || '')
                        )

                        return (
                          <div
                            key={course._id}
                            className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden hover:shadow-md hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between"
                          >
                            <div>
                              {/* Top banner accent based on type */}
                              <div className="h-1.5 bg-gradient-to-r from-emerald-600 to-teal-500" />

                              <div className="p-5">
                                <div className="flex justify-between items-start gap-4 mb-3">
                                  <span className="bg-slate-100 text-slate-850 text-[10px] font-bold px-2 py-0.5 rounded-md uppercase">
                                    {course.courseCode}
                                  </span>
                                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md border bg-emerald-50 text-emerald-700 border-emerald-100 uppercase">
                                    {course.type === 'training' ? 'Training' : course.type === 'thesis' ? 'Thesis' : 'Project'}
                                  </span>
                                </div>

                                <h4 className="font-bold text-slate-800 text-sm leading-snug line-clamp-2 h-10" title={course.courseTitle}>{course.courseTitle}</h4>
                                <p className="text-[10px] text-slate-450 font-semibold mt-1">{course.semester}</p>

                                <div className="mt-4 flex items-center justify-between px-3 py-2 bg-slate-50/50 border border-slate-100 rounded-xl text-xs">
                                  <span className="text-slate-500 font-medium">👥 Supervised Students</span>
                                  <span className="font-extrabold text-slate-850">{supervisedStudents.length}</span>
                                </div>
                              </div>
                            </div>

                            {/* Actions */}
                            <div className="p-5 pt-0">
                              <button
                                onClick={() => navigate(`/teacher/course/${course._id}/students`)}
                                className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer text-center"
                              >
                                📊 Analysis
                              </button>
                              <div className="flex justify-end mt-3 pt-2.5 border-t border-slate-100/80">
                                <button
                                  onClick={() => handleEndCourseClick(course)}
                                  className="text-red-500 hover:text-red-700 transition-colors flex items-center gap-1.5 cursor-pointer font-semibold text-[11.5px]"
                                >
                                  <span>🛑 End Course</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* End Course Confirmation Modal */}
      {showEndModal && courseToEnd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(15,23,42,0.55)', backdropFilter: 'blur(4px)' }}>
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-md p-8 animate-in fade-in zoom-in-95 duration-200">
            {/* Icon + Title */}
            <div className="flex flex-col items-center text-center mb-6">
              <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center text-3xl mb-4 border border-red-100">
                🛑
              </div>
              <h2 className="text-xl font-black text-slate-800 tracking-tight mb-1">End This Course?</h2>
              <p className="text-xs text-slate-500 leading-relaxed max-w-xs">
                This will permanently mark the course as ended and remove all enrolled students from the roster. This action cannot be undone.
              </p>
            </div>

            {/* Course Info Card */}
            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 mb-6">
              <div className="flex justify-between items-start mb-2">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 bg-slate-200/70 px-2 py-0.5 rounded-md">{courseToEnd.courseCode}</span>
                <span className="text-[10px] font-bold text-red-600 bg-red-50 border border-red-100 px-2 py-0.5 rounded-md uppercase">{courseToEnd.type}</span>
              </div>
              <p className="font-bold text-slate-800 text-sm leading-snug mt-2">{courseToEnd.courseTitle}</p>
              <p className="text-[11px] text-slate-400 font-semibold mt-1">{courseToEnd.semester}</p>
              <div className="mt-3 pt-3 border-t border-slate-200/80 flex items-center justify-between text-xs">
                <span className="text-slate-500">👥 Enrolled Students</span>
                <span className="font-extrabold text-slate-700">{courseToEnd.students?.length || 0} students will be unenrolled</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => { setShowEndModal(false); setCourseToEnd(null) }}
                disabled={endLoading}
                className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-semibold transition-all cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmEndCourse}
                disabled={endLoading}
                className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-bold transition-all cursor-pointer shadow-sm shadow-red-200 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {endLoading ? (
                  <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />Ending...</>
                ) : (
                  <>🛑 Yes, End Course</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default TeacherDashboard