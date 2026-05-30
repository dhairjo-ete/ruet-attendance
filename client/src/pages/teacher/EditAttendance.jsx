import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getCourseById } from '../../services/courseService.js'
import { getCourseAttendance, editAttendance } from '../../services/attendanceService.js'

const EditAttendance = () => {
  const { courseId } = useParams()
  const navigate = useNavigate()
  const [course, setCourse] = useState(null)
  const [sessions, setSessions] = useState({}) // dateStr -> [attendanceRecords]
  const [selectedDate, setSelectedDate] = useState('')
  const [loading, setLoading] = useState(true)
  const [updatingId, setUpdatingId] = useState(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    loadCourseAndAttendance()
  }, [courseId])

  const loadCourseAndAttendance = async () => {
    try {
      const [courseData, attendanceRecords] = await Promise.all([
        getCourseById(courseId),
        getCourseAttendance(courseId)
      ])
      setCourse(courseData)

      // Group records by date string
      const grouped = {}
      attendanceRecords.forEach(record => {
        const dStr = new Date(record.date).toISOString().split('T')[0]
        if (!grouped[dStr]) {
          grouped[dStr] = []
        }
        grouped[dStr].push(record)
      })
      setSessions(grouped)

      // Set default selected date to the most recent session
      const dates = Object.keys(grouped).sort((a, b) => b.localeCompare(a))
      if (dates.length > 0) {
        setSelectedDate(dates[0])
      }
    } catch (err) {
      setError('Failed to load attendance records')
    } finally {
      setLoading(false)
    }
  }

  const handleStatusUpdate = async (recordId, currentStatus) => {
    setError('')
    setSuccess('')
    setUpdatingId(recordId)
    const nextStatus = currentStatus === 'present' ? 'absent' : 'present'

    try {
      await editAttendance(recordId, nextStatus)
      setSuccess('Attendance record updated successfully!')
      
      // Update local state
      setSessions(prev => {
        const updated = { ...prev }
        updated[selectedDate] = updated[selectedDate].map(r => 
          r._id === recordId ? { ...r, status: nextStatus, isEdited: true, editedAt: new Date() } : r
        )
        return updated
      })

      setTimeout(() => setSuccess(''), 2500)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update record')
      setTimeout(() => setError(''), 4500)
    } finally {
      setUpdatingId(null)
    }
  }

  // Calculate editability of selected session
  const checkSessionEditability = (dateStr) => {
    if (!dateStr) return false
    const sessionDate = new Date(dateStr)
    const now = new Date()
    // Align dates to check midnight to midnight or exact 24 hours
    const diffHours = (now - sessionDate) / (1000 * 60 * 60)
    return diffHours <= 24
  }

  const sessionDates = Object.keys(sessions).sort((a, b) => b.localeCompare(a))
  const currentRecords = selectedDate ? sessions[selectedDate] || [] : []
  const isEditable = checkSessionEditability(selectedDate)

  // Session stats
  const totalInSession = currentRecords.length
  const presentInSession = currentRecords.filter(r => r.status === 'present').length
  const absentInSession = totalInSession - presentInSession

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
            <h1 className="font-bold text-slate-800 text-sm tracking-tight">Edit Attendance</h1>
            <p className="text-[10px] text-slate-400 font-medium">Modify existing attendance records</p>
          </div>
        </div>
        {course && (
          <span className="bg-indigo-50 text-indigo-700 text-xs font-bold px-3 py-1.5 rounded-xl border border-indigo-100">
            {course.courseCode}
          </span>
        )}
      </nav>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        {error && (
          <div className="mb-6 px-4 py-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl font-medium">
            ❌ {error}
          </div>
        )}
        {success && (
          <div className="mb-6 px-4 py-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm rounded-xl font-medium">
            ✅ {success}
          </div>
        )}

        {course && (
          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm mb-6">
            <h2 className="text-lg font-bold text-slate-800 mb-1">{course.courseTitle}</h2>
            <p className="text-xs text-slate-400 font-semibold mb-4">{course.semester}</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5">Select Lecture Session</label>
                <select
                  value={selectedDate}
                  onChange={e => setSelectedDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded-xl text-xs font-bold text-slate-700 transition-all cursor-pointer"
                >
                  {sessionDates.length === 0 ? (
                    <option value="">No sessions taken yet</option>
                  ) : (
                    sessionDates.map(d => (
                      <option key={d} value={d}>
                        Session date: {d}
                      </option>
                    ))
                  )}
                </select>
              </div>

              {selectedDate && (
                <div className={`rounded-xl p-3 border text-xs font-semibold ${
                  isEditable 
                    ? 'bg-emerald-50 border-emerald-150 text-emerald-800' 
                    : 'bg-amber-50 border-amber-150 text-amber-800'
                }`}>
                  {isEditable ? (
                    <p>✓ Active Session: Editable for another few hours (24h limit).</p>
                  ) : (
                    <p>🔒 Locked Session: Older than 24 hours. Edits are disabled.</p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {loading ? (
          <div className="text-center py-20 text-slate-400">
            <div className="text-3xl mb-3 animate-spin">⏳</div>
            <p className="font-semibold text-sm">Loading attendance records...</p>
          </div>
        ) : sessionDates.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-100 shadow-sm">
            <div className="text-5xl mb-4">📭</div>
            <h3 className="font-bold text-slate-800 text-lg mb-2">No Sessions Found</h3>
            <p className="text-slate-400 text-sm max-w-sm mx-auto">No attendance records have been registered for this course yet.</p>
          </div>
        ) : (
          <div>
            {/* Status counts for selected session */}
            <div className="flex gap-4 mb-4 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
              <div className="text-xs">
                <span className="text-slate-400 font-semibold uppercase tracking-wider text-[10px]">Marked</span>
                <p className="font-extrabold text-slate-800 text-sm mt-0.5">{totalInSession}</p>
              </div>
              <div className="text-xs">
                <span className="text-emerald-500 font-semibold uppercase tracking-wider text-[10px]">Present</span>
                <p className="font-extrabold text-emerald-600 text-sm mt-0.5">{presentInSession}</p>
              </div>
              <div className="text-xs">
                <span className="text-red-500 font-semibold uppercase tracking-wider text-[10px]">Absent</span>
                <p className="font-extrabold text-red-600 text-sm mt-0.5">{absentInSession}</p>
              </div>
                {/* Students List */}
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden mb-6">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Roll No.</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student Name</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-40">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...currentRecords]
                      .sort((a, b) => (a.student?.studentId || '').localeCompare(b.student?.studentId || ''))
                      .map((record) => {
                        const isPresent = record.status === 'present'
                        const isUpdating = updatingId === record._id
                        return (
                          <tr key={record._id} className="border-b border-gray-100 hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm text-gray-800 font-medium whitespace-nowrap">{record.student?.studentId || 'N/A'}</td>
                            <td className="px-4 py-3 text-sm text-gray-800 font-medium">{record.student?.name || 'N/A'}</td>
                            <td className="px-4 py-3 text-center">
                              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider border ${
                                isPresent 
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                                  : 'bg-red-50 text-red-600 border-red-100'
                              }`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${isPresent ? 'bg-emerald-500' : 'bg-red-500'}`} />
                                {record.status}
                                {record.isEdited && <span className="text-[8px] font-bold text-slate-400 capitalize">(Edited)</span>}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <button
                                type="button"
                                onClick={() => handleStatusUpdate(record._id, record.status)}
                                disabled={!isEditable || isUpdating}
                                className={`px-4 py-1.5 rounded-xl text-[10px] font-extrabold transition-all duration-200 cursor-pointer ${
                                  !isEditable
                                    ? 'bg-slate-50 text-slate-350 border border-slate-100 cursor-not-allowed'
                                    : isPresent
                                      ? 'bg-red-50 hover:bg-red-100 text-red-650 border border-red-100'
                                      : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-100'
                                }`}
                              >
                                {isUpdating ? 'Updating...' : isPresent ? 'Mark Absent' : 'Mark Present'}
                              </button>
                            </td>
                          </tr>
                        )
                      })}
                  </tbody>
                </table>
              </div>
            </div>          </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => navigate('/teacher/dashboard')}
                className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer animate-none"
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

export default EditAttendance