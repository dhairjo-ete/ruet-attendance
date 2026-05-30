import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { enrollInCourse, enrollInMultipleCourses, getStudentProfile, unenrollFromCourse } from '../../services/studentService.js'
import { getAllAvailableCourses } from '../../services/courseService.js'

const semesters = [
  '1st Year Odd Semester', '1st Year Even Semester',
  '2nd Year Odd Semester', '2nd Year Even Semester',
  '3rd Year Odd Semester', '3rd Year Even Semester',
  '4th Year Odd Semester', '4th Year Even Semester',
]

const getTypeLabel = (type) => {
  if (type === 'lab') return 'Sessional'
  if (type === 'project') return 'Project'
  if (type === 'thesis') return 'Thesis'
  if (type === 'training') return 'Industrial Training'
  return 'Theory'
}

const getTypeBadge = (type) => {
  if (type === 'lab') return 'bg-purple-50 text-purple-700'
  if (type === 'project') return 'bg-orange-50 text-orange-700'
  if (type === 'thesis') return 'bg-red-50 text-red-700'
  if (type === 'training') return 'bg-yellow-50 text-yellow-700'
  return 'bg-blue-50 text-blue-700'
}

const StudentCourses = () => {
  const navigate = useNavigate()
  const [courses, setCourses] = useState([])
  const [enrolledIds, setEnrolledIds] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [filterSemester, setFilterSemester] = useState('')
  const [enrollingId, setEnrollingId] = useState(null)
  const [enrollingAll, setEnrollingAll] = useState(false)

  useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
    try {
      const [allCourses, profile] = await Promise.all([
        getAllAvailableCourses(),
        getStudentProfile(),
      ])
      // Sort courses by courseCode ascending
      const sorted = [...allCourses].sort((a, b) => a.courseCode.localeCompare(b.courseCode))
      setCourses(sorted)
      setEnrolledIds(profile.enrolledCourses.map(c => c._id || c))
    } catch (err) {
      setError('Failed to load courses')
    } finally {
      setLoading(false)
    }
  }

  const handleEnroll = async (courseId) => {
    setError(''); setSuccess('')
    setEnrollingId(courseId)
    try {
      await enrollInCourse(courseId)
      setSuccess('Enrolled successfully!')
      setEnrolledIds(prev => [...prev, courseId])
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to enroll')
      setTimeout(() => setError(''), 4000)
    } finally {
      setEnrollingId(null)
    }
  }

  const handleUnenroll = async (courseId) => {
    if (!window.confirm('Are you sure you want to unenroll from this course? This will also remove any selected supervisor for this course.')) return
    setError(''); setSuccess('')
    setEnrollingId(courseId)
    try {
      await unenrollFromCourse(courseId)
      setSuccess('Unenrolled successfully!')
      setEnrolledIds(prev => prev.filter(id => id !== courseId))
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to unenroll')
      setTimeout(() => setError(''), 4000)
    } finally {
      setEnrollingId(null)
    }
  }

  const handleEnrollAll = async () => {
    setError(''); setSuccess('')
    const unenrolledIds = filtered
      .filter(c => !enrolledIds.includes(c._id))
      .map(c => c._id)
    if (unenrolledIds.length === 0) {
      setSuccess('You are already enrolled in all visible courses.')
      setTimeout(() => setSuccess(''), 3000)
      return
    }
    setEnrollingAll(true)
    try {
      const result = await enrollInMultipleCourses(unenrolledIds)
      setSuccess(result.message)
      setEnrolledIds(prev => [...prev, ...unenrolledIds])
      setTimeout(() => setSuccess(''), 4000)
    } catch (err) {
      setError(err.response?.data?.message || 'Bulk enroll failed')
      setTimeout(() => setError(''), 4000)
    } finally {
      setEnrollingAll(false)
    }
  }

  const filtered = filterSemester ? courses.filter(c => c.semester === filterSemester) : courses
  const unenrolledCount = filtered.filter(c => !enrolledIds.includes(c._id)).length

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <nav className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/student/dashboard')}
            className="text-gray-400 hover:text-gray-600"
          >
            ← Back
          </button>
          <h1 className="font-semibold text-gray-800">Browse Courses</h1>
        </div>
        <span className="px-3 py-1.5 bg-indigo-50 text-indigo-700 text-xs font-semibold rounded-lg border border-indigo-100">
          Enrolled: {enrolledIds.length} Courses
        </span>
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Notifications */}
        {error && (
          <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 px-4 py-3 bg-green-50 border border-green-200 rounded-xl text-green-600 text-sm">
            {success}
          </div>
        )}

        {/* Filter + Enroll All */}
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <h3 className="text-sm font-medium text-gray-600">
            {filterSemester === '' ? `All Available Courses (${courses.length})` : `${filterSemester} (${filtered.length})`}
          </h3>
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-500">Filter by Semester:</label>
              <select
                value={filterSemester}
                onChange={e => setFilterSemester(e.target.value)}
                className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Semesters</option>
                {semesters.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            {unenrolledCount > 0 && (
              <button
                onClick={handleEnrollAll}
                disabled={enrollingAll}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 text-white text-sm font-medium rounded-lg transition-colors cursor-pointer"
              >
                {enrollingAll ? 'Enrolling...' : `Enroll All (${unenrolledCount})`}
              </button>
            )}
          </div>
        </div>

        {/* Courses Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  {['Code', 'Title', 'Type', 'Credit', 'Semester', 'Teacher(s)', 'Action'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {loading ? (
                  <tr><td colSpan="7" className="px-6 py-8 text-center text-gray-400">Loading...</td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan="7" className="px-6 py-8 text-center text-gray-400">No courses found</td></tr>
                ) : filtered.map(course => {
                  const isEnrolled = enrolledIds.includes(course._id)
                  const isEnrolling = enrollingId === course._id
                  return (
                    <tr key={course._id} className={`hover:bg-gray-50 ${isEnrolled ? 'bg-green-50/30' : ''}`}>
                      <td className="px-4 py-3 text-sm text-gray-800 font-medium whitespace-nowrap">{course.courseCode}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{course.courseTitle}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeBadge(course.type)}`}>
                          {getTypeLabel(course.type)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">{course.credit || course.labCredit}</td>
                      <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">{course.semester}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {course.teachers?.map(t => t.name).join(', ') || 'Not assigned'}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {isEnrolled ? (
                          <div className="flex items-center gap-2">
                            <span className="px-2.5 py-1 bg-green-50 text-green-700 text-xs font-medium rounded-lg border border-green-200">
                              ✅ Enrolled
                            </span>
                            <button
                              onClick={() => handleUnenroll(course._id)}
                              disabled={isEnrolling || enrollingAll}
                              className="px-2.5 py-1 bg-red-50 hover:bg-red-100 text-red-650 text-xs font-semibold rounded-lg border border-red-150 transition-colors cursor-pointer"
                            >
                              {isEnrolling && enrollingId === course._id ? '...' : 'Unenroll'}
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleEnroll(course._id)}
                            disabled={isEnrolling || enrollingAll}
                            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white text-xs font-medium rounded-lg transition-colors cursor-pointer"
                          >
                            {isEnrolling ? 'Enrolling...' : 'Enroll'}
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

export default StudentCourses