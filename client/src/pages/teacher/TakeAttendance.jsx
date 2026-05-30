import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getCourseById } from '../../services/courseService.js'
import { takeAttendance } from '../../services/attendanceService.js'

const TakeAttendance = () => {
  const { courseId } = useParams()
  const navigate = useNavigate()
  const [course, setCourse] = useState(null)
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [selectedLabGroup, setSelectedLabGroup] = useState('first30') // Default to 'first30'
  const [attendance, setAttendance] = useState({}) // studentId -> 'present' | 'absent'
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    loadCourseDetails()
  }, [courseId])

  useEffect(() => {
    if (course) {
      // Determine default lab group based on week number when date changes
      if (course.type === 'lab') {
        const d = new Date(date)
        const weekNumber = Math.ceil(d.getDate() / 7)
        let calculatedGroup = 'first30'
        if (course.labCredit === 1.5) {
          calculatedGroup = d.getDay() % 2 === 0 ? 'first30' : 'second30'
        } else {
          calculatedGroup = weekNumber % 2 !== 0 ? 'first30' : 'second30'
        }
        setSelectedLabGroup(calculatedGroup)
      }
    }
  }, [course, date])

  const loadCourseDetails = async () => {
    try {
      const data = await getCourseById(courseId)
      setCourse(data)
      
      // Initialize all to present
      const initial = {}
      if (data.students) {
        data.students.forEach(s => {
          initial[s._id] = 'present'
        })
      }
      setAttendance(initial)
    } catch (err) {
      setError('Failed to load course details')
    } finally {
      setLoading(false)
    }
  }

  const handleStatusChange = (studentId, status) => {
    setAttendance(prev => ({
      ...prev,
      [studentId]: status
    }))
  }

  const enrolledStudents = course?.students
    ? [...course.students].sort((a, b) => (a.studentId || '').localeCompare(b.studentId || ''))
    : []

  // Filter students based on lab group if it is a sessional/lab course
  const studentsToDisplay = course?.type === 'lab'
    ? enrolledStudents.filter(s => s.labGroup === selectedLabGroup)
    : enrolledStudents

  const markAll = (status) => {
    const updated = { ...attendance }
    studentsToDisplay.forEach(s => {
      updated[s._id] = status
    })
    setAttendance(updated)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setSubmitting(true)

    const records = studentsToDisplay.map(s => ({
      studentId: s._id,
      status: attendance[s._id] || 'present',
      labGroup: s.labGroup
    }))

    try {
      await takeAttendance(courseId, date, records)
      setSuccess('Attendance submitted successfully!')
      setTimeout(() => {
        navigate('/teacher/dashboard')
      }, 1500)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit attendance')
    } finally {
      setSubmitting(false)
    }
  }

  const presentCount = studentsToDisplay.filter(s => attendance[s._id] === 'present').length
  const absentCount = studentsToDisplay.length - presentCount

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
            <h1 className="font-bold text-slate-800 text-sm tracking-tight">Take Attendance</h1>
            <p className="text-[10px] text-slate-400 font-medium">Record attendance for today's lecture</p>
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

            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5">Class Date</label>
                <input
                  type="date"
                  value={date}
                  max={new Date().toISOString().split('T')[0]}
                  onChange={e => setDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded-xl text-xs font-bold text-slate-700 transition-all cursor-pointer"
                />
              </div>
            </div>

          </div>
        )}

        {course?.type === 'lab' && (
          <div className="mb-6 bg-white p-6 border border-slate-100 rounded-3xl shadow-sm">
            <label className="block text-xs font-black text-slate-500 mb-2 uppercase tracking-wider">Choose Sessional Lab Group</label>
            <select
              value={selectedLabGroup}
              onChange={e => setSelectedLabGroup(e.target.value)}
              className="w-full px-3.5 py-3.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded-2xl text-xs font-black text-slate-700 transition-all cursor-pointer"
            >
              <option value="first30">🗓️ First 30 Students (Roll 1-30)</option>
              <option value="second30">🗓️ Second 30 Students (Roll 31+)</option>
            </select>
          </div>
        )}


        {loading ? (
          <div className="text-center py-20 text-slate-400">
            <div className="text-3xl mb-3 animate-spin">⏳</div>
            <p className="font-semibold text-sm">Loading course details...</p>
          </div>
        ) : studentsToDisplay.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-100 shadow-sm">
            <div className="text-5xl mb-4">🔍</div>
            <h3 className="font-bold text-slate-800 text-lg mb-2">No Students Found</h3>
            <p className="text-slate-400 text-sm max-w-sm mx-auto">
              No students are currently enrolled under this sessional group.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            {/* Bulk Controls & Status Counters */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
              <div className="flex gap-4">
                <div className="text-xs">
                  <span className="text-slate-400 font-semibold uppercase tracking-wider text-[10px]">Students</span>
                  <p className="font-extrabold text-slate-800 text-sm mt-0.5">{studentsToDisplay.length}</p>
                </div>
                <div className="text-xs">
                  <span className="text-emerald-500 font-semibold uppercase tracking-wider text-[10px]">Present</span>
                  <p className="font-extrabold text-emerald-600 text-sm mt-0.5">{presentCount}</p>
                </div>
                <div className="text-xs">
                  <span className="text-red-500 font-semibold uppercase tracking-wider text-[10px]">Absent</span>
                  <p className="font-extrabold text-red-600 text-sm mt-0.5">{absentCount}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => markAll('present')}
                  className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100/80 text-emerald-700 text-[10px] font-bold rounded-xl border border-emerald-100 transition-all cursor-pointer"
                >
                  ✓ All Present
                </button>
                <button
                  type="button"
                  onClick={() => markAll('absent')}
                  className="px-3 py-1.5 bg-red-50 hover:bg-red-100/85 text-red-650 text-[10px] font-bold rounded-xl border border-red-100 transition-all cursor-pointer"
                >
                  ✗ All Absent
                </button>
              </div>
            </div>

            {/* Students Table */}
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden mb-6">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Roll No.</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student Name</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-44">Attendance Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {studentsToDisplay.map((student) => {
                      const isPresent = attendance[student._id] === 'present'
                      return (
                        <tr key={student._id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm text-gray-800 font-medium whitespace-nowrap">{student.studentId}</td>
                          <td className="px-4 py-3 text-sm text-gray-800 font-medium">{student.name}</td>
                          <td className="px-6 py-4 text-center">
                            <div className="inline-flex bg-slate-100 p-0.5 rounded-xl border border-slate-200/50">
                              <button
                                type="button"
                                onClick={() => handleStatusChange(student._id, 'present')}
                                className={`px-4 py-1.5 text-[11px] font-bold rounded-lg transition-all duration-200 cursor-pointer ${
                                  isPresent
                                    ? 'bg-emerald-600 text-white shadow-sm'
                                    : 'text-slate-500 hover:text-slate-800'
                                }`}
                              >
                                Present
                              </button>
                              <button
                                type="button"
                                onClick={() => handleStatusChange(student._id, 'absent')}
                                className={`px-4 py-1.5 text-[11px] font-bold rounded-lg transition-all duration-200 cursor-pointer ${
                                  !isPresent
                                    ? 'bg-red-500 text-white shadow-sm'
                                    : 'text-slate-500 hover:text-slate-800'
                                }`}
                              >
                                Absent
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => navigate('/teacher/dashboard')}
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-100 transition-all cursor-pointer"
              >
                {submitting ? 'Saving attendance...' : 'Submit Attendance'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

export default TakeAttendance