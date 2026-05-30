import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getAllCourses, addCourse, updateCourse, deleteCourse, getAllTeachers, assignTeacherToCourse } from '../../services/adminService.js'

const semesters = [
  '1st Year Odd Semester',
  '1st Year Even Semester',
  '2nd Year Odd Semester',
  '2nd Year Even Semester',
  '3rd Year Odd Semester',
  '3rd Year Even Semester',
  '4th Year Odd Semester',
  '4th Year Even Semester',
]

const emptyForm = {
  courseCode: '', courseTitle: '',
  credit: '', type: 'theory',
  labCredit: '', semester: '1st Year Odd Semester',
  teachers: []
}


const ManageCourses = () => {
  const navigate = useNavigate()
  const [courses, setCourses] = useState([])
  const [teachers, setTeachers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [editForm, setEditForm] = useState(emptyForm)
  const [form, setForm] = useState(emptyForm)
  const [filterSemester, setFilterSemester] = useState('all')
  const [assignSemester, setAssignSemester] = useState('')
  const [selectedCourse, setSelectedCourse] = useState('')
  const [selectedTeacher, setSelectedTeacher] = useState('')

  useEffect(() => { fetchAll() }, [])

  const fetchAll = async () => {
    try {
      const [c, t] = await Promise.all([getAllCourses(), getAllTeachers()])
      setCourses(c)
      setTeachers(t)
    } catch { setError('Failed to load data') }
    finally { setLoading(false) }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(''); setSuccess('')
    try {
      await addCourse(form)
      setSuccess('Course added successfully')
      setForm(emptyForm)
      setShowForm(false)
      fetchAll()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add course')
    }
  }

  const handleUpdate = async (id) => {
    setError(''); setSuccess('')
    try {
      await updateCourse(id, editForm)
      setSuccess('Course updated successfully')
      setEditingId(null)
      fetchAll()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update course')
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this course?')) return
    try {
      await deleteCourse(id)
      setSuccess('Course deleted successfully')
      fetchAll()
    } catch { setError('Failed to delete course') }
  }

  const handleAssignTeacher = async () => {
    if (!selectedCourse || !selectedTeacher) return
    try {
      await assignTeacherToCourse(selectedCourse, selectedTeacher)
      setSuccess('Teacher assigned successfully')
      setSelectedCourse('')
      setSelectedTeacher('')
      fetchAll()
    } catch { setError('Failed to assign teacher') }
  }

  const filteredCourses = filterSemester === 'all'
    ? courses
    : courses.filter(c => c.semester === filterSemester)

  const coursesForAssign = assignSemester
    ? courses.filter(c => c.semester === assignSemester)
    : []

  const inputClass = "w-full px-3 py-1.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"

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

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/admin/dashboard')} className="text-gray-400 hover:text-gray-600">← Back</button>
          <h1 className="font-semibold text-gray-800">Manage Courses</h1>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors">
          {showForm ? 'Cancel' : '+ Add Course'}
        </button>
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {error && <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">{error}</div>}
        {success && <div className="mb-4 px-4 py-3 bg-green-50 border border-green-200 rounded-xl text-green-600 text-sm">{success}</div>}

        {/* Add Course Form */}
        {showForm && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
            <h3 className="font-semibold text-gray-800 mb-4">Add New Course</h3>
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Course Code *</label>
                  <input type="text" placeholder="e.g. ETE 3101" value={form.courseCode} onChange={e => setForm({ ...form, courseCode: e.target.value })} required className={inputClass} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Course Title *</label>
                  <input type="text" placeholder="e.g. Digital Electronics" value={form.courseTitle} onChange={e => setForm({ ...form, courseTitle: e.target.value })} required className={inputClass} />
                </div>
<div>
  <label className="block text-sm font-medium text-gray-700 mb-1">Type *</label>
  <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value, credit: '', labCredit: '' })} className={inputClass}>
    <option value="theory">Theory</option>
    <option value="lab">Sessional</option>
    <option value="project">Project Design & Development</option>
    <option value="thesis">Project & Thesis</option>
    <option value="training">Industrial Training</option>
  </select>
</div>
{form.type === 'theory' && (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1">Credit *</label>
    <input type="number" step="0.25" placeholder="e.g. 3" value={form.credit} onChange={e => setForm({ ...form, credit: e.target.value })} required className={inputClass} />
  </div>
)}
{form.type === 'lab' && (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1">Sessional Credit *</label>
    <select value={form.labCredit} onChange={e => setForm({ ...form, labCredit: e.target.value })} required className={inputClass}>
      <option value="">Select</option>
      <option value="0.75">0.75</option>
      <option value="1.5">1.5</option>
    </select>
  </div>
)}
{['project', 'thesis', 'training'].includes(form.type) && (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1">Credit *</label>
    <input type="number" step="0.25" placeholder="e.g. 2" value={form.credit} onChange={e => setForm({ ...form, credit: e.target.value })} required className={inputClass} />
  </div>
)}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Semester *</label>
                  <select value={form.semester} onChange={e => setForm({ ...form, semester: e.target.value })} className={inputClass}>
                    {semesters.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <button type="submit" className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium">
                Add Course
              </button>
            </form>
          </div>
        )}

        {/* Assign Teacher */}
        {courses.length > 0 && teachers.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
            <h3 className="font-semibold text-gray-800 mb-4">Assign Teacher to Course</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Select Semester</label>
                <select
                  value={assignSemester}
                  onChange={e => { setAssignSemester(e.target.value); setSelectedCourse('') }}
                  className={inputClass}
                >
                  <option value="">Select semester first</option>
                  {semesters.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Select Course</label>
                <select
                  value={selectedCourse}
                  onChange={e => setSelectedCourse(e.target.value)}
                  disabled={!assignSemester}
                  className={`${inputClass} disabled:bg-gray-100 disabled:cursor-not-allowed`}
                >
                  <option value="">
                    {assignSemester ? 'Select course' : 'Select semester first'}
                  </option>
                  {coursesForAssign.map(c => (
                    <option key={c._id} value={c._id}>
                      {c.courseCode} — {c.courseTitle} ({getTypeLabel(c.type)})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Select Teacher</label>
                <select value={selectedTeacher} onChange={e => setSelectedTeacher(e.target.value)} className={inputClass}>
                  <option value="">Select teacher</option>
                  {teachers.map(t => (
                    <option key={t._id} value={t._id}>
                      {t.name} — {t.designation} ({t.department})
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <button
              onClick={handleAssignTeacher}
              disabled={!selectedCourse || !selectedTeacher}
              className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed transition-colors text-sm font-medium"
            >
              Assign Teacher
            </button>
          </div>
        )}

        {/* Filter by Semester - dropdown */}
<div className="flex items-center justify-between mb-4">
  <h3 className="text-sm font-medium text-gray-600">
    {filterSemester === 'all' ? `All Courses (${courses.length})` : `${filterSemester} (${filteredCourses.length})`}
  </h3>
  <div className="flex items-center gap-2">
    <label className="text-sm text-gray-500">Filter by Semester:</label>
    <select
      value={filterSemester}
      onChange={e => setFilterSemester(e.target.value)}
      className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
    >
      <option value="all">All Semesters</option>
      {semesters.map(s => <option key={s} value={s}>{s}</option>)}
    </select>
  </div>
</div>

        {/* Courses Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h3 className="font-semibold text-gray-800">
              {filterSemester === 'all' ? `All Courses (${courses.length})` : `${filterSemester} (${filteredCourses.length})`}
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  {['Code', 'Title', 'Credit', 'Type', 'Semester', 'Teachers', 'Students', 'Action'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {loading ? (
                  <tr><td colSpan="8" className="px-6 py-8 text-center text-gray-400">Loading...</td></tr>
                ) : filteredCourses.length === 0 ? (
                  <tr><td colSpan="8" className="px-6 py-8 text-center text-gray-400">No courses found</td></tr>
                ) : filteredCourses.map(c => (
                  editingId === c._id ? (
                    <tr key={c._id} className="bg-blue-50">
                      <td className="px-4 py-3"><input value={editForm.courseCode} onChange={e => setEditForm({ ...editForm, courseCode: e.target.value })} className={inputClass} /></td>
                      <td className="px-4 py-3"><input value={editForm.courseTitle} onChange={e => setEditForm({ ...editForm, courseTitle: e.target.value })} className={inputClass} /></td>
                      <td className="px-4 py-3">
                        {['theory', 'project', 'thesis', 'training'].includes(editForm.type) ? (
                          <input type="number" step="0.25" value={editForm.credit} onChange={e => setEditForm({ ...editForm, credit: e.target.value })} className={inputClass} />
                        ) : (
                          <select value={editForm.labCredit} onChange={e => setEditForm({ ...editForm, labCredit: e.target.value })} className={inputClass}>
                            <option value="">Select</option>
                            <option value="0.75">0.75</option>
                            <option value="1.5">1.5</option>
                          </select>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <select value={editForm.type} onChange={e => setEditForm({ ...editForm, type: e.target.value, credit: '', labCredit: '' })} className={inputClass}>
                          <option value="theory">Theory</option>
                          <option value="lab">Sessional</option>
                          <option value="project">Project Design & Development</option>
                          <option value="thesis">Project & Thesis</option>
                          <option value="training">Industrial Training</option>
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        <select value={editForm.semester} onChange={e => setEditForm({ ...editForm, semester: e.target.value })} className={inputClass}>
                          {semesters.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        <select
                          multiple
                          value={editForm.teachers || []}
                          onChange={e => {
                            const selectedIds = Array.from(e.target.selectedOptions, option => option.value)
                            setEditForm({ ...editForm, teachers: selectedIds })
                          }}
                          className={`${inputClass} h-20 min-w-[120px] text-xs`}
                        >
                          {teachers.map(t => (
                            <option key={t._id} value={t._id}>
                              {t.name}
                            </option>
                          ))}
                        </select>
                        <p className="text-[9px] text-gray-400 mt-1 leading-tight">Hold Ctrl to select multiple</p>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">{c.students?.length || 0}</td>

                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2 whitespace-nowrap">
                          <button onClick={() => handleUpdate(c._id)} className="text-green-600 hover:text-green-800 text-sm font-medium">Save</button>
                          <span className="text-gray-300">|</span>
                          <button onClick={() => setEditingId(null)} className="text-gray-500 hover:text-gray-700 text-sm font-medium">Cancel</button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    <tr key={c._id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-800 font-medium whitespace-nowrap">{c.courseCode}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{c.courseTitle}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{c.credit}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeBadge(c.type)}`}>
                          {getTypeLabel(c.type)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">{c.semester}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{c.teachers?.map(t => t.name).join(', ') || 'Not assigned'}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{c.students?.length || 0}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setEditingId(c._id)
                              setEditForm({
                                courseCode: c.courseCode,
                                courseTitle: c.courseTitle,
                                credit: c.credit,
                                type: c.type,
                                labCredit: c.labCredit || '',
                                semester: c.semester,
                                teachers: c.teachers?.map(t => t._id || t) || []
                              })
                            }}
                            className="text-blue-500 hover:text-blue-700 text-sm font-medium"

                          >
                            Update
                          </button>
                          <span className="text-gray-300">|</span>
                          <button onClick={() => handleDelete(c._id)} className="text-red-500 hover:text-red-700 text-sm font-medium">Delete</button>
                        </div>
                      </td>
                    </tr>
                  )
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ManageCourses