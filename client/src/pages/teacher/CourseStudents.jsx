import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getCourseById } from '../../services/courseService.js'
import { getCourseAttendance } from '../../services/attendanceService.js'
import * as XLSX from 'xlsx'


const CourseStudents = () => {
  const { courseId } = useParams()
  const navigate = useNavigate()
  const [course, setCourse] = useState(null)
  const [attendanceRecords, setAttendanceRecords] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('eligible') // 'eligible' | 'risk' | 'barred'
  const [searchTerm, setSearchTerm] = useState('')
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
  const isProjectOrSupervised = course?.type === 'project' || course?.type === 'thesis' || course?.type === 'training'

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
        // Assume eligible if no classes held yet
        eligibleStudents.push(studentData)
      }
    })
  }

  const averageAttendance = studentCountWithRecords > 0
    ? Math.round(totalPresenceSum / studentCountWithRecords)
    : null

  // ─── Excel Export ────────────────────────────────────────────────────────────
  const exportToExcel = () => {
    if (!course || !course.students) return

    // Sort sessions ascending (oldest → newest) for column order
    const sortedSessions = [...uniqueSessions].sort((a, b) => a.localeCompare(b))

    // Build header row: Roll No. | Name | date1 | date2 | ... | Present | Total | %
    const dateHeaders = sortedSessions.map(d => {
      const dt = new Date(d)
      return `${String(dt.getDate()).padStart(2,'0')}/${String(dt.getMonth()+1).padStart(2,'0')}/${dt.getFullYear()}`
    })
    const headers = ['Roll No.', 'Name', 'Series', ...dateHeaders, 'Present', 'Total Classes', 'Attendance %', 'Status']

    // Build a data row for every student sorted by studentId
    const allStudentData = [...eligibleStudents, ...riskStudents, ...barredStudents]
      .sort((a, b) => (a.student?.studentId || '').localeCompare(b.student?.studentId || ''))

    const rows = allStudentData.map(({ student, total, present, percentage }) => {
      // Per-date presence: P / A / - (no class that day)
      const dateCells = sortedSessions.map(sessionDate => {
        const dayRecords = attendanceRecords.filter(r => {
          const sid = r.student?._id?.toString() || r.student?.toString()
          const recDate = new Date(r.date).toISOString().split('T')[0]
          return sid === student._id && recDate === sessionDate
        })
        if (dayRecords.length === 0) return '-'
        return dayRecords[0].status === 'present' ? 'P' : 'A'
      })

      const status = percentage === null ? 'No Class' :
                     percentage >= 75 ? 'Eligible' :
                     percentage >= 50 ? 'At Risk' : 'Barred'

      return [
        student.studentId,
        student.name,
        student.series ? `'${student.series}` : 'N/A',
        ...dateCells,
        present,
        total,
        percentage !== null ? `${percentage}%` : 'N/A',
        status
      ]
    })

    // Build worksheet data
    const wsData = [
      // Title rows
      [`Course Analysis Report`],
      [`Course: ${course.courseCode} - ${course.courseTitle}`],
      [`Semester: ${course.semester}`],
      [`Total Classes: ${totalClassesHeld}   |   Enrolled: ${enrolledCount}   |   Average Attendance: ${averageAttendance !== null ? averageAttendance + '%' : 'N/A'}`],
      [`Eligible (≥75%): ${eligibleStudents.length}   |   At Risk (50-74%): ${riskStudents.length}   |   Barred (<50%): ${barredStudents.length}`],
      [], // blank row
      headers,
      ...rows
    ]

    const ws = XLSX.utils.aoa_to_sheet(wsData)

    // Column widths
    const colWidths = [
      { wch: 12 }, // Roll No.
      { wch: 28 }, // Name
      { wch: 9  }, // Series
      ...sortedSessions.map(() => ({ wch: 11 })), // date cols
      { wch: 10 }, // Present
      { wch: 14 }, // Total Classes
      { wch: 14 }, // Attendance %
      { wch: 12 }, // Status
    ]
    ws['!cols'] = colWidths

    // Style the header row (row index 6, 0-based)
    const headerRowIndex = 6
    headers.forEach((_, colIdx) => {
      const cellAddr = XLSX.utils.encode_cell({ r: headerRowIndex, c: colIdx })
      if (!ws[cellAddr]) return
      ws[cellAddr].s = {
        font: { bold: true, color: { rgb: 'FFFFFF' } },
        fill: { fgColor: { rgb: '3949AB' } },
        alignment: { horizontal: 'center' }
      }
    })

    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Attendance Analysis')

    const fileName = `${course.courseCode}_${course.courseTitle}_Attendance.xlsx`
      .replace(/[^a-zA-Z0-9._-]/g, '_')

    XLSX.writeFile(wb, fileName)
  }
  // ─────────────────────────────────────────────────────────────────────────────



  // Get active list based on selected category tab (for regular courses)
  const getActiveList = () => {
    if (activeTab === 'eligible') return eligibleStudents
    if (activeTab === 'risk') return riskStudents
    return barredStudents
  }

  const activeList = getActiveList()

  // Filter lists based on search term and sort ascending
  const filterList = (list) => {
    return list.filter(item =>
      item.student?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.student?.studentId?.toLowerCase().includes(searchTerm.toLowerCase())
    ).sort((a, b) => (a.student?.studentId || '').localeCompare(b.student?.studentId || ''))
  }

  // For project/supervised courses: direct roster filter and sort ascending
  const getFilteredSupervisedStudents = () => {
    if (!course || !course.students) return []
    return course.students.filter(student =>
      student.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.studentId?.toLowerCase().includes(searchTerm.toLowerCase())
    ).sort((a, b) => (a.studentId || '').localeCompare(b.studentId || ''))
  }

  const displayedList = isProjectOrSupervised ? getFilteredSupervisedStudents() : filterList(activeList)

  return (
    <div className="min-h-screen bg-slate-50/50 font-sans text-slate-800">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200/85 px-6 py-4 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/teacher/dashboard')}
            className="w-8 h-8 flex items-center justify-center bg-slate-100 hover:bg-slate-200 rounded-xl text-slate-650 transition-colors text-sm font-black cursor-pointer"
          >
            ←
          </button>
          <div>
            <h1 className="font-bold text-slate-800 text-sm tracking-tight">📊 Course Analysis</h1>
            <p className="text-[10px] text-slate-450 font-semibold mt-0.5">Comprehensive student details and attendance diagnostics</p>
          </div>
        </div>
        {course && (
          <div className="flex items-center gap-3">
            {!isProjectOrSupervised && !loading && (
              <button
                type="button"
                onClick={exportToExcel}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-bold rounded-xl shadow-sm transition-all cursor-pointer"
              >
                <span>⬇️</span>
                Export Excel
              </button>
            )}
            <span className="bg-indigo-50 text-indigo-700 text-xs font-bold px-3 py-1.5 rounded-xl border border-indigo-100">
              {course.courseCode}
            </span>
          </div>
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
          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm mb-6 flex justify-between items-center flex-wrap gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-850 mb-1">{course.courseTitle}</h2>
              <p className="text-xs text-slate-450 font-semibold">{course.semester}</p>
            </div>
            
            {/* Search Input always visible for rapid roster search */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-400">Search Roll / Name:</span>
              <input
                type="text"
                placeholder="Search roll or name..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="px-3 py-1.5 border border-slate-250 bg-slate-50 hover:bg-slate-100 focus:bg-white rounded-xl text-xs font-bold text-slate-750 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all w-52"
              />
            </div>
          </div>
        )}

        {loading ? (
          <div className="text-center py-20 text-slate-400">
            <div className="text-3xl mb-3 animate-spin">⏳</div>
            <p className="font-semibold text-sm">Building analysis logs...</p>
          </div>
        ) : isProjectOrSupervised ? (
          /* Project / Supervision Courses - Simpler direct roster view without attendance stats */
          <div>
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden mb-6">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Roll No.</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student Name</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Series</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayedList.length === 0 ? (
                      <tr>
                        <td colSpan="3" className="text-center py-8 text-slate-450 text-xs font-semibold">
                          🔍 No supervised students found matching "{searchTerm}"
                        </td>
                      </tr>
                    ) : (
                      displayedList.map((student) => (
                        <tr key={student._id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm text-gray-800 font-medium whitespace-nowrap">{student.studentId}</td>
                          <td className="px-4 py-3 text-sm text-gray-800 font-medium">{student.name}</td>
                          <td className="px-4 py-3 text-sm text-gray-600 font-medium">Series '{student.series || 'N/A'}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
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
        ) : (
          /* Regular Courses - Attendance-based Analysis */
          <div>
            {/* Quick Metrics Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
              <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm flex items-center gap-4 hover:scale-[1.01] transition-transform">
                <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center text-xl text-indigo-650">
                  🗓️
                </div>
                <div>
                  <span className="text-[10px] font-extrabold text-slate-450 uppercase tracking-wider">Classes Conducted</span>
                  <h3 className="text-2xl font-black text-slate-800 mt-0.5">{totalClassesHeld}</h3>
                </div>
              </div>

              <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm flex items-center gap-4 hover:scale-[1.01] transition-transform">
                <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center text-xl text-emerald-650">
                  📈
                </div>
                <div>
                  <span className="text-[10px] font-extrabold text-slate-450 uppercase tracking-wider">Average Attendance</span>
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
                  <span className="text-[10px] font-extrabold text-slate-450 uppercase tracking-wider">Enrolled Count</span>
                  <h3 className="text-2xl font-black text-slate-800 mt-0.5">{enrolledCount}</h3>
                </div>
              </div>
            </div>

            {/* Eligibility Category Tabs switcher */}
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden mb-6">
              <div className="flex border-b border-slate-100">
                <button
                  onClick={() => setActiveTab('eligible')}
                  className={`flex-1 py-4 text-xs font-extrabold transition-colors border-b-2 flex items-center justify-center gap-2 cursor-pointer ${
                    activeTab === 'eligible'
                      ? 'text-emerald-750 border-emerald-600 bg-emerald-50/10'
                      : 'text-slate-500 hover:text-slate-850 border-transparent'
                  }`}
                >
                  <span>✓ Eligible (≥75%)</span>
                  <span className="bg-emerald-105 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                    {eligibleStudents.length}
                  </span>
                </button>

                <button
                  onClick={() => setActiveTab('risk')}
                  className={`flex-1 py-4 text-xs font-extrabold transition-colors border-b-2 flex items-center justify-center gap-2 cursor-pointer ${
                    activeTab === 'risk'
                      ? 'text-amber-700 border-amber-500 bg-amber-50/10'
                      : 'text-slate-500 hover:text-slate-850 border-transparent'
                  }`}
                >
                  <span>⚠️ At Risk (50-74%)</span>
                  <span className="bg-amber-105 text-amber-850 text-[10px] font-bold px-2 py-0.5 rounded-full">
                    {riskStudents.length}
                  </span>
                </button>

                <button
                  onClick={() => setActiveTab('barred')}
                  className={`flex-1 py-4 text-xs font-extrabold transition-colors border-b-2 flex items-center justify-center gap-2 cursor-pointer ${
                    activeTab === 'barred'
                      ? 'text-red-650 border-red-500 bg-red-50/10'
                      : 'text-slate-500 hover:text-slate-850 border-transparent'
                  }`}
                >
                  <span>✗ Barred (&lt;50%)</span>
                  <span className="bg-red-105 text-red-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                    {barredStudents.length}
                  </span>
                </button>
              </div>

              {/* Attendance category table roster */}
              <div className="p-6">
                {displayedList.length === 0 ? (
                  <div className="text-center py-10 text-slate-400">
                    <p className="text-xs font-semibold">No students expected in this eligibility category matching "{searchTerm}".</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto border border-slate-100 rounded-2xl">
                    <table className="w-full border-collapse">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Roll No.</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student Name</th>
                          <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Present Classes</th>
                          <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Expected Sessions</th>
                          <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Attendance %</th>
                        </tr>
                      </thead>
                      <tbody>
                        {displayedList.map(({ student, total, present, percentage }) => (
                          <tr key={student._id} className="border-b border-gray-100 hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm text-gray-800 font-medium whitespace-nowrap">{student.studentId}</td>
                            <td className="px-4 py-3 text-sm text-gray-800 font-medium">{student.name}</td>
                            <td className="px-4 py-3 text-center text-sm text-gray-800 font-medium">{present}</td>
                            <td className="px-4 py-3 text-center text-sm text-gray-800 font-medium">{total}</td>
                            <td className="px-4 py-3 text-center">
                              <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border ${
                                activeTab === 'eligible' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                                activeTab === 'risk' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                                'bg-red-50 text-red-650 border-red-100'
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

export default CourseStudents