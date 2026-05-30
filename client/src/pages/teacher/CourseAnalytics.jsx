import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getCourseById } from '../../services/courseService.js'
import { getCourseAttendance } from '../../services/attendanceService.js'

const CourseAnalytics = () => {
  const { courseId } = useParams()
  const navigate = useNavigate()
  const [course, setCourse] = useState(null)
  const [attendanceRecords, setAttendanceRecords] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('eligible') // 'eligible' | 'risk' | 'barred'
  const [error, setError] = useState('')

  useEffect(() => {
    loadData()
  }, [courseId])

  const loadData = async () => {
    try {
      const [courseData, records] = await Promise.all([
        getCourseById(courseId),
        getCourseAttendance(courseId)
      ])
      setCourse(courseData)
      setAttendanceRecords(records)
    } catch (err) {
      setError('Failed to load course statistics')
    } finally {
      setLoading(false)
    }
  }

  // Find unique class session dates
  const uniqueSessions = [...new Set(attendanceRecords.map(r => 
    new Date(r.date).toISOString().split('T')[0]
  ))].sort((a, b) => b.localeCompare(a))

  const totalClassesHeld = uniqueSessions.length
  const enrolledCount = course?.students?.length || 0

  // Calculate student metrics and group them
  const eligibleStudents = []
  const riskStudents = []
  const barredStudents = []

  let totalPresenceSum = 0
  let studentCountWithRecords = 0

  if (course && course.students) {
    course.students.forEach(student => {
      const studentRecs = attendanceRecords.filter(r => {
        const sid = r.student?._id?.toString() || r.student?.toString()
        return sid === student._id
      })
      const total = studentRecs.length
      const present = studentRecs.filter(r => r.status === 'present').length
      const percentage = total > 0 ? Math.round((present / total) * 100) : null

      const studentData = {
        student,
        total,
        present,
        absent: total - present,
        percentage
      }

      if (percentage !== null) {
        totalPresenceSum += percentage
        studentCountWithRecords++

        if (percentage >= 75) {
          eligibleStudents.push(studentData)
        } else if (percentage >= 50) {
          riskStudents.push(studentData)
        } else {
          barredStudents.push(studentData)
        }
      } else {
        // Assume eligible/neutral if no classes held yet
        eligibleStudents.push(studentData)
      }
    })
  }

  const averageAttendance = studentCountWithRecords > 0
    ? Math.round(totalPresenceSum / studentCountWithRecords)
    : null

  const getActiveList = () => {
    if (activeTab === 'eligible') return eligibleStudents
    if (activeTab === 'risk') return riskStudents
    return barredStudents
  }

  const activeList = getActiveList()

  return (
    <div className="min-h-screen bg-slate-50/50 font-sans text-slate-800">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200/85 px-6 py-4 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/teacher/dashboard')}
            className="w-8 h-8 flex items-center justify-center bg-slate-100 hover:bg-slate-200 rounded-xl text-slate-600 transition-colors text-sm font-black cursor-pointer"
          >
            ←
          </button>
          <div>
            <h1 className="font-bold text-slate-800 text-sm tracking-tight">Course Analytics</h1>
            <p className="text-[10px] text-slate-400 font-medium">Statistical insights and eligibility indicators</p>
          </div>
        </div>
        {course && (
          <span className="bg-indigo-50 text-indigo-700 text-xs font-bold px-3 py-1.5 rounded-xl border border-indigo-100">
            {course.courseCode}
          </span>
        )}
      </nav>

      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-6 py-8">
        {error && (
          <div className="mb-6 px-4 py-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl font-medium">
            ❌ {error}
          </div>
        )}

        {course && (
          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm mb-6">
            <h2 className="text-lg font-bold text-slate-800 mb-1">{course.courseTitle}</h2>
            <p className="text-xs text-slate-400 font-semibold">{course.semester}</p>
          </div>
        )}

        {loading ? (
          <div className="text-center py-20 text-slate-400">
            <div className="text-3xl mb-3 animate-spin">⏳</div>
            <p className="font-semibold text-sm">Generating analytics dashboard...</p>
          </div>
        ) : (
          <div>
            {/* Quick Metrics Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
              <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm flex items-center gap-4 hover:scale-[1.01] transition-transform">
                <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center text-xl text-indigo-650">
                  🗓️
                </div>
                <div>
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Classes Conducted</span>
                  <h3 className="text-2xl font-black text-slate-800 mt-0.5">{totalClassesHeld}</h3>
                </div>
              </div>

              <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm flex items-center gap-4 hover:scale-[1.01] transition-transform">
                <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center text-xl text-emerald-650">
                  📈
                </div>
                <div>
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Average Attendance</span>
                  <h3 className="text-2xl font-black text-emerald-600 mt-0.5">
                    {averageAttendance !== null ? `${averageAttendance}%` : 'N/A'}
                  </h3>
                </div>
              </div>

              <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm flex items-center gap-4 hover:scale-[1.01] transition-transform">
                <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-xl text-blue-650">
                  👥
                </div>
                <div>
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Enrolled Count</span>
                  <h3 className="text-2xl font-black text-slate-800 mt-0.5">{enrolledCount}</h3>
                </div>
              </div>
            </div>

            {/* Attendance Eligibility Categories tabs */}
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden mb-6">
              <div className="flex border-b border-slate-100">
                <button
                  onClick={() => setActiveTab('eligible')}
                  className={`flex-1 py-4 text-xs font-extrabold transition-colors border-b-2 flex items-center justify-center gap-2 cursor-pointer ${
                    activeTab === 'eligible'
                      ? 'text-emerald-700 border-emerald-600 bg-emerald-50/10'
                      : 'text-slate-500 hover:text-slate-800 border-transparent'
                  }`}
                >
                  <span>✓ Eligible (≥75%)</span>
                  <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                    {eligibleStudents.length}
                  </span>
                </button>

                <button
                  onClick={() => setActiveTab('risk')}
                  className={`flex-1 py-4 text-xs font-extrabold transition-colors border-b-2 flex items-center justify-center gap-2 cursor-pointer ${
                    activeTab === 'risk'
                      ? 'text-amber-700 border-amber-500 bg-amber-50/10'
                      : 'text-slate-500 hover:text-slate-800 border-transparent'
                  }`}
                >
                  <span>⚠️ At Risk (50-74%)</span>
                  <span className="bg-amber-100 text-amber-850 text-[10px] font-bold px-2 py-0.5 rounded-full">
                    {riskStudents.length}
                  </span>
                </button>

                <button
                  onClick={() => setActiveTab('barred')}
                  className={`flex-1 py-4 text-xs font-extrabold transition-colors border-b-2 flex items-center justify-center gap-2 cursor-pointer ${
                    activeTab === 'barred'
                      ? 'text-red-650 border-red-500 bg-red-50/10'
                      : 'text-slate-500 hover:text-slate-800 border-transparent'
                  }`}
                >
                  <span>✗ Barred (&lt;50%)</span>
                  <span className="bg-red-100 text-red-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                    {barredStudents.length}
                  </span>
                </button>
              </div>

              {/* Active Tab Roster */}
              <div className="p-6">
                {activeList.length === 0 ? (
                  <div className="text-center py-10 text-slate-400">
                    <p className="text-xs font-semibold">No students in this eligibility category.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto border border-slate-100 rounded-2xl">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="bg-slate-50/30">
                          <th className="px-5 py-3 text-left text-[10px] font-extrabold text-slate-450 uppercase tracking-wider rounded-l-2xl">Roll No.</th>
                          <th className="px-5 py-3 text-left text-[10px] font-extrabold text-slate-450 uppercase tracking-wider">Student Name</th>
                          <th className="px-5 py-3 text-center text-[10px] font-extrabold text-slate-450 uppercase tracking-wider">Present Classes</th>
                          <th className="px-5 py-3 text-center text-[10px] font-extrabold text-slate-450 uppercase tracking-wider font-mono">Sessions Expected</th>
                          <th className="px-5 py-3 text-center text-[10px] font-extrabold text-slate-450 uppercase tracking-wider rounded-r-2xl">Attendance Percentage</th>
                        </tr>
                      </thead>
                      <tbody>
                        {activeList.map(({ student, total, present, percentage }) => (
                          <tr key={student._id} className="border-t border-slate-100 hover:bg-slate-50/20 transition-colors">
                            <td className="px-5 py-3.5 text-xs font-bold text-indigo-650">{student.studentId}</td>
                            <td className="px-5 py-3.5 text-xs font-extrabold text-slate-700">{student.name}</td>
                            <td className="px-5 py-3.5 text-center text-xs font-bold text-slate-650">{present}</td>
                            <td className="px-5 py-3.5 text-center text-xs font-bold text-slate-600">{total}</td>
                            <td className="px-5 py-3.5 text-center text-xs font-extrabold">
                              <span className={`px-2.5 py-1 rounded-lg ${
                                activeTab === 'eligible' ? 'bg-emerald-50 text-emerald-700' :
                                activeTab === 'risk' ? 'bg-amber-50 text-amber-700' :
                                'bg-red-50 text-red-600'
                              }`}>
                                {percentage !== null ? `${percentage}%` : 'N/A'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => navigate('/teacher/dashboard')}
                className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default CourseAnalytics