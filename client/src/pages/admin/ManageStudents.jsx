import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { getAllStudents, addStudent, deleteStudent, updateStudent, promoteAllStudents, bulkImportStudents } from '../../services/adminService.js'
import * as XLSX from 'xlsx'

const sessions = [
  { session: '2020-21', series: '20' },
  { session: '2021-22', series: '21' },
  { session: '2022-23', series: '22' },
  { session: '2023-24', series: '23' },
  { session: '2024-25', series: '24' },
  { session: '2025-26', series: '25' },
]

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
  name: '', studentId: '', registration: '',
  session: '2020-21', currentSemester: '1st Year Odd Semester',
  labGroup: 'first30', email: ''
}

const ManageStudents = () => {
  const navigate = useNavigate()
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [filterSeries, setFilterSeries] = useState('all')
  const [editingId, setEditingId] = useState(null)
  const [editForm, setEditForm] = useState(emptyForm)
  const [showPromoteModal, setShowPromoteModal] = useState(false)
  const [promoteSession, setPromoteSession] = useState('2020-21')
  const [form, setForm] = useState(emptyForm)

  // Import state
  const [showImportModal, setShowImportModal] = useState(false)
  const [importPreview, setImportPreview] = useState([])   // parsed rows ready to review
  const [importLoading, setImportLoading] = useState(false)
  const [importResult, setImportResult] = useState(null)   // result from server
  const fileInputRef = useRef(null)

  useEffect(() => { fetchStudents() }, [])

  const fetchStudents = async () => {
    try {
      const data = await getAllStudents()
      setStudents(data)
    } catch { setError('Failed to load students') }
    finally { setLoading(false) }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(''); setSuccess('')
    try {
      await addStudent(form)
      setSuccess('Student added successfully')
      setForm(emptyForm)
      setShowForm(false)
      fetchStudents()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add student')
    }
  }

  const handleUpdate = async (id) => {
    setError(''); setSuccess('')
    try {
      await updateStudent(id, editForm)
      setSuccess('Student updated successfully')
      setEditingId(null)
      fetchStudents()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update student')
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this student?')) return
    try {
      await deleteStudent(id)
      setSuccess('Student deleted')
      fetchStudents()
    } catch { setError('Failed to delete') }
  }

  const handlePromoteAll = async () => {
    setError(''); setSuccess('')
    try {
      const result = await promoteAllStudents(promoteSession)
      setSuccess(result.message)
      setShowPromoteModal(false)
      fetchStudents()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to promote students')
    }
  }

  const filteredStudents = filterSeries === 'all'
    ? students
    : students.filter(s => s.series === filterSeries)

  const seriesGroups = [...new Set(students.map(s => s.series))].sort()

  const inputClass = "w-full px-3 py-1.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"

  // ─── Excel Template Download ─────────────────────────────────────────────────
  const downloadTemplate = () => {
    const headers = ['name', 'studentId', 'registration', 'session', 'currentSemester', 'labGroup', 'email']
    const example = [
      ['Bhismodev Saha', '2504001', '2504001', '2025-26', '1st Year Odd Semester', 'first30', 'student@ruet.ac.bd'],
      ['Another Student', '2504002', '2504002', '2025-26', '1st Year Odd Semester', 'first30', ''],
    ]
    const notes = [
      [],
      ['--- INSTRUCTIONS ---'],
      ['name', 'Required. Full name of the student.'],
      ['studentId', 'Required. Unique student roll number (e.g. 2504001).'],
      ['registration', 'Required. Registration number. Also used as default login password.'],
      ['session', 'Required. Academic session in YYYY-YY format (e.g. 2025-26).'],
      ['currentSemester', 'Required. One of: 1st Year Odd Semester, 1st Year Even Semester, 2nd Year Odd Semester, 2nd Year Even Semester, 3rd Year Odd Semester, 3rd Year Even Semester, 4th Year Odd Semester, 4th Year Even Semester'],
      ['labGroup', 'Required. Either: first30  OR  second30'],
      ['email', 'Optional. Student email address.'],
    ]
    const wsData = [headers, ...example, ...notes]
    const ws = XLSX.utils.aoa_to_sheet(wsData)
    ws['!cols'] = [{ wch: 22 }, { wch: 12 }, { wch: 14 }, { wch: 12 }, { wch: 28 }, { wch: 12 }, { wch: 28 }]
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Students')
    XLSX.writeFile(wb, 'student_import_template.xlsx')
  }

  // ─── Handle File Pick & Parse ────────────────────────────────────────────────
  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    setImportResult(null)
    const reader = new FileReader()
    reader.onload = (evt) => {
      const wb = XLSX.read(evt.target.result, { type: 'binary' })
      const ws = wb.Sheets[wb.SheetNames[0]]
      const rows = XLSX.utils.sheet_to_json(ws, { defval: '' })
      // Normalize keys to trim whitespace
      const normalized = rows.map(r => {
        const obj = {}
        Object.keys(r).forEach(k => { obj[k.trim()] = r[k] })
        return obj
      })
      setImportPreview(normalized)
    }
    reader.readAsBinaryString(file)
    // reset so same file can be re-selected
    e.target.value = ''
  }

  // ─── Submit Import ────────────────────────────────────────────────────────────
  const handleImportSubmit = async () => {
    if (importPreview.length === 0) return
    setImportLoading(true)
    setImportResult(null)
    try {
      const result = await bulkImportStudents(importPreview)
      setImportResult(result)
      setImportPreview([])
      fetchStudents()
    } catch (err) {
      setImportResult({ message: err.response?.data?.message || 'Import failed', added: 0, skipped: importPreview.length, errors: [] })
    } finally {
      setImportLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/admin/dashboard')} className="text-gray-400 hover:text-gray-600">← Back</button>
          <h1 className="font-semibold text-gray-800">Manage Students</h1>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setShowPromoteModal(true)}
            className="px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors"
          >
            Promote Semester
          </button>
          <button
            onClick={() => { setShowImportModal(true); setImportPreview([]); setImportResult(null) }}
            className="px-4 py-2 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700 transition-colors"
          >
            📥 Import Excel
          </button>
          <button
            onClick={() => setShowForm(!showForm)}
            className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
          >
            {showForm ? 'Cancel' : '+ Add Student'}
          </button>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {error && <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">{error}</div>}
        {success && <div className="mb-4 px-4 py-3 bg-green-50 border border-green-200 rounded-xl text-green-600 text-sm">{success}</div>}

        {/* ── Import Excel Modal ───────────────────────────────────────── */}
        {showImportModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">
              {/* Modal Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                <div>
                  <h3 className="font-bold text-gray-800 text-lg">📥 Import Students from Excel</h3>
                  <p className="text-xs text-gray-500 mt-0.5">Upload an .xlsx file to bulk-add students to the database</p>
                </div>
                <button onClick={() => setShowImportModal(false)} className="text-gray-400 hover:text-gray-600 text-xl font-bold">✕</button>
              </div>

              {/* Modal Body */}
              <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

                {/* Step 1 - Template */}
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                  <p className="text-sm font-semibold text-blue-800 mb-2">Step 1 — Download the Template</p>
                  <p className="text-xs text-blue-600 mb-3">Download the Excel template, fill in the student data, then upload it below. Do not change the column headers.</p>
                  <button
                    onClick={downloadTemplate}
                    className="px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    ⬇️ Download Template
                  </button>
                </div>

                {/* Step 2 - Upload */}
                <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center hover:border-purple-400 transition-colors">
                  <p className="text-sm font-semibold text-gray-700 mb-1">Step 2 — Upload Your Filled Excel File</p>
                  <p className="text-xs text-gray-400 mb-4">.xlsx files only</p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="px-5 py-2 bg-purple-600 text-white text-xs font-bold rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    📂 Choose File
                  </button>
                </div>

                {/* Preview Table */}
                {importPreview.length > 0 && (
                  <div>
                    <p className="text-sm font-semibold text-gray-700 mb-2">Step 3 — Review ({importPreview.length} rows) then click Import</p>
                    <div className="overflow-x-auto border border-gray-100 rounded-xl max-h-56">
                      <table className="w-full border-collapse text-xs">
                        <thead className="bg-gray-50 sticky top-0">
                          <tr>
                            {['#', 'Name', 'Student ID', 'Registration', 'Session', 'Semester', 'Lab Group', 'Email'].map(h => (
                              <th key={h} className="px-3 py-2 text-left text-gray-500 font-semibold uppercase tracking-wide whitespace-nowrap">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {importPreview.map((row, i) => (
                            <tr key={i} className="border-t border-gray-50 hover:bg-gray-50">
                              <td className="px-3 py-2 text-gray-400">{i + 1}</td>
                              <td className="px-3 py-2 text-gray-800 font-medium whitespace-nowrap">{row.name}</td>
                              <td className="px-3 py-2 text-gray-600 whitespace-nowrap">{row.studentId}</td>
                              <td className="px-3 py-2 text-gray-600 whitespace-nowrap">{row.registration}</td>
                              <td className="px-3 py-2 text-gray-600 whitespace-nowrap">{row.session}</td>
                              <td className="px-3 py-2 text-gray-600 whitespace-nowrap">{row.currentSemester}</td>
                              <td className="px-3 py-2 text-gray-600 whitespace-nowrap">{row.labGroup}</td>
                              <td className="px-3 py-2 text-gray-400 whitespace-nowrap">{row.email || '—'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Import Result */}
                {importResult && (
                  <div className={`rounded-xl p-4 border text-sm ${importResult.added > 0 ? 'bg-green-50 border-green-200 text-green-800' : 'bg-amber-50 border-amber-200 text-amber-800'}`}>
                    <p className="font-bold mb-1">{importResult.message}</p>
                    {importResult.errors && importResult.errors.length > 0 && (
                      <ul className="list-disc list-inside text-xs space-y-0.5 mt-2 text-red-600">
                        {importResult.errors.map((e, i) => <li key={i}>{e}</li>)}
                      </ul>
                    )}
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100">
                <button
                  onClick={() => setShowImportModal(false)}
                  className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  Close
                </button>
                {importPreview.length > 0 && (
                  <button
                    onClick={handleImportSubmit}
                    disabled={importLoading}
                    className="px-6 py-2 text-sm bg-purple-600 text-white font-bold rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors"
                  >
                    {importLoading ? 'Importing...' : `✅ Import ${importPreview.length} Students`}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Promote Modal */}
        {showPromoteModal && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md">
              <h3 className="font-semibold text-gray-800 mb-2 text-lg">Promote Semester</h3>
              <p className="text-sm text-gray-500 mb-4">
                All students of the selected session will be promoted to their next semester and their enrolled courses will be cleared.
              </p>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Select Session</label>
                <select
                  value={promoteSession}
                  onChange={e => setPromoteSession(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                >
                  {sessions.map(s => (
                    <option key={s.session} value={s.session}>{s.session} (Series {s.series})</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-3 justify-end">
                <button onClick={() => setShowPromoteModal(false)} className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">
                  Cancel
                </button>
                <button onClick={handlePromoteAll} className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700">
                  Promote All
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Add Student Form */}
        {showForm && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
            <h3 className="font-semibold text-gray-800 mb-4">Add New Student</h3>
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                  <input type="text" placeholder="e.g. XYZ" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required className={inputClass} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Student ID *</label>
                  <input type="text" placeholder="e.g. 22040**" value={form.studentId} onChange={e => setForm({ ...form, studentId: e.target.value })} required className={inputClass} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Registration No *</label>
                  <input type="text" placeholder="e.g. 7**" value={form.registration} onChange={e => setForm({ ...form, registration: e.target.value })} required className={inputClass} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Session *</label>
                  <select value={form.session} onChange={e => setForm({ ...form, session: e.target.value })} className={inputClass}>
                    {sessions.map(s => <option key={s.session} value={s.session}>{s.session} (Series {s.series})</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Current Semester *</label>
                  <select value={form.currentSemester} onChange={e => setForm({ ...form, currentSemester: e.target.value })} className={inputClass}>
                    {semesters.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Sessional Group *</label>
                  <select value={form.labGroup} onChange={e => setForm({ ...form, labGroup: e.target.value })} className={inputClass}>
                    <option value="first30">First 30 (Roll 1–30)</option>
                    <option value="second30">Second 30 (Roll 31–60)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email (optional)</label>
                  <input type="email" placeholder="e.g. s_id@student.ruet.ac.bd" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className={inputClass} />
                </div>
              </div>
              <button type="submit" className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium">
                Add Student
              </button>
            </form>
          </div>
        )}

        {/* Filter */}
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          <span className="text-sm text-gray-500 font-medium">Filter by Series:</span>
          <button onClick={() => setFilterSeries('all')} className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${filterSeries === 'all' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}>All</button>
          {seriesGroups.map(s => (
            <button key={s} onClick={() => setFilterSeries(s)} className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${filterSeries === s ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}>
              Series {s}
            </button>
          ))}
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h3 className="font-semibold text-gray-800">
              {filterSeries === 'all' ? `All Students (${students.length})` : `Series ${filterSeries} (${filteredStudents.length})`}
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  {['Name', 'Student ID', 'Registration', 'Session', 'Series', 'Current Semester', 'Sessional Group', 'Action'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {loading ? (
                  <tr><td colSpan="8" className="px-6 py-8 text-center text-gray-400">Loading...</td></tr>
                ) : filteredStudents.length === 0 ? (
                  <tr><td colSpan="8" className="px-6 py-8 text-center text-gray-400">No students found</td></tr>
                ) : filteredStudents.map(s => (
                  editingId === s._id ? (
                    <tr key={s._id} className="bg-blue-50">
                      <td className="px-4 py-3"><input value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} className={inputClass} /></td>
                      <td className="px-4 py-3"><input value={editForm.studentId} onChange={e => setEditForm({ ...editForm, studentId: e.target.value })} className={inputClass} /></td>
                      <td className="px-4 py-3"><input value={editForm.registration} onChange={e => setEditForm({ ...editForm, registration: e.target.value })} className={inputClass} /></td>
                      <td className="px-4 py-3">
                        <select value={editForm.session} onChange={e => setEditForm({ ...editForm, session: e.target.value })} className={inputClass}>
                          {sessions.map(s => <option key={s.session} value={s.session}>{s.session}</option>)}
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium whitespace-nowrap">
                          Series {editForm.session.split('-')[0].slice(-2)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <select value={editForm.currentSemester} onChange={e => setEditForm({ ...editForm, currentSemester: e.target.value })} className={inputClass}>
                          {semesters.map(sem => <option key={sem} value={sem}>{sem}</option>)}
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        <select value={editForm.labGroup} onChange={e => setEditForm({ ...editForm, labGroup: e.target.value })} className={inputClass}>
                          <option value="first30">First 30</option>
                          <option value="second30">Second 30</option>
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2 whitespace-nowrap">
                          <button onClick={() => handleUpdate(s._id)} className="text-green-600 hover:text-green-800 text-sm font-medium">Save</button>
                          <span className="text-gray-300">|</span>
                          <button onClick={() => setEditingId(null)} className="text-gray-500 hover:text-gray-700 text-sm font-medium">Cancel</button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    <tr key={s._id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-800 font-medium whitespace-nowrap">{s.name}</td>
                      <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">{s.studentId}</td>
                      <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">{s.registration}</td>
                      <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">{s.session}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium">Series {s.series}</span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="px-2 py-1 bg-green-50 text-green-700 rounded-full text-xs font-medium">{s.currentSemester}</span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">{s.labGroup === 'first30' ? 'First 30' : 'Second 30'}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setEditingId(s._id)
                              setEditForm({
                                name: s.name,
                                studentId: s.studentId,
                                registration: s.registration,
                                session: s.session,
                                currentSemester: s.currentSemester,
                                labGroup: s.labGroup,
                                email: s.email || ''
                              })
                            }}
                            className="text-blue-500 hover:text-blue-700 text-sm font-medium"
                          >
                            Update
                          </button>
                          <span className="text-gray-300">|</span>
                          <button onClick={() => handleDelete(s._id)} className="text-red-500 hover:text-red-700 text-sm font-medium">
                            Delete
                          </button>
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

export default ManageStudents