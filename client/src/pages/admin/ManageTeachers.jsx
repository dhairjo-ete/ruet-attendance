import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getAllTeachers, addTeacher, deleteTeacher } from '../../services/adminService.js'
import axiosInstance from '../../services/axiosInstance.js'

const designations = ['Professor', 'Associate Professor', 'Assistant Professor', 'Lecturer']

const emptyForm = { name: '', email: '', password: '', designation: '', department: '' }

const ManageTeachers = () => {
  const navigate = useNavigate()
  const [teachers, setTeachers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [editForm, setEditForm] = useState(emptyForm)
  const [form, setForm] = useState(emptyForm)

  useEffect(() => { fetchTeachers() }, [])

  const fetchTeachers = async () => {
    try {
      const data = await getAllTeachers()
      setTeachers(data)
    } catch { setError('Failed to load teachers') }
    finally { setLoading(false) }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(''); setSuccess('')
    try {
      await addTeacher(form)
      setSuccess('Teacher added successfully')
      setForm(emptyForm)
      setShowForm(false)
      fetchTeachers()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add teacher')
    }
  }

  const handleUpdate = async (id) => {
    setError(''); setSuccess('')
    try {
      await axiosInstance.put(`/admin/teachers/${id}`, editForm)
      setSuccess('Teacher updated successfully')
      setEditingId(null)
      fetchTeachers()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update teacher')
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this teacher?')) return
    try {
      await deleteTeacher(id)
      setSuccess('Teacher deleted')
      fetchTeachers()
    } catch { setError('Failed to delete') }
  }

  const inputClass = "w-full px-3 py-1.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/admin/dashboard')} className="text-gray-400 hover:text-gray-600">← Back</button>
          <h1 className="font-semibold text-gray-800">Manage Teachers</h1>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors">
          {showForm ? 'Cancel' : '+ Add Teacher'}
        </button>
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {error && <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">{error}</div>}
        {success && <div className="mb-4 px-4 py-3 bg-green-50 border border-green-200 rounded-xl text-green-600 text-sm">{success}</div>}

        {showForm && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
            <h3 className="font-semibold text-gray-800 mb-4">Add New Teacher</h3>
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                  <input type="text" placeholder="e.g. Dr. John Smith" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required className={inputClass} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                  <input type="email" placeholder="e.g. teacher@ruet.ac.bd" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required className={inputClass} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
                  <input type="password" placeholder="Set initial password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required className={inputClass} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Designation *</label>
                  <select value={form.designation} onChange={e => setForm({ ...form, designation: e.target.value })} required className={inputClass}>
                    <option value="">Select designation</option>
                    {designations.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Department *</label>
                  <input type="text" placeholder="e.g. ETE, CSE, ME" value={form.department} onChange={e => setForm({ ...form, department: e.target.value })} required className={inputClass} />
                </div>
              </div>
              <button type="submit" className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium">
                Add Teacher
              </button>
            </form>
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h3 className="font-semibold text-gray-800">All Teachers ({teachers.length})</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  {['Name', 'Email', 'Designation', 'Department', 'Action'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {loading ? (
                  <tr><td colSpan="5" className="px-6 py-8 text-center text-gray-400">Loading...</td></tr>
                ) : teachers.length === 0 ? (
                  <tr><td colSpan="5" className="px-6 py-8 text-center text-gray-400">No teachers added yet</td></tr>
                ) : teachers.map(t => (
                  editingId === t._id ? (
                    <tr key={t._id} className="bg-blue-50">
                      <td className="px-4 py-3"><input value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} className={inputClass} /></td>
                      <td className="px-4 py-3"><input type="email" value={editForm.email} onChange={e => setEditForm({ ...editForm, email: e.target.value })} className={inputClass} /></td>
                      <td className="px-4 py-3">
                        <select value={editForm.designation} onChange={e => setEditForm({ ...editForm, designation: e.target.value })} className={inputClass}>
                          {designations.map(d => <option key={d} value={d}>{d}</option>)}
                        </select>
                      </td>
                      <td className="px-4 py-3"><input value={editForm.department} onChange={e => setEditForm({ ...editForm, department: e.target.value })} className={inputClass} /></td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2 whitespace-nowrap">
                          <button onClick={() => handleUpdate(t._id)} className="text-green-600 hover:text-green-800 text-sm font-medium">Save</button>
                          <span className="text-gray-300">|</span>
                          <button onClick={() => setEditingId(null)} className="text-gray-500 hover:text-gray-700 text-sm font-medium">Cancel</button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    <tr key={t._id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-800 font-medium whitespace-nowrap">{t.name}</td>
                      <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">{t.email}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="px-2 py-1 bg-purple-50 text-purple-700 rounded-full text-xs font-medium">{t.designation}</span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">{t.department}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setEditingId(t._id)
                              setEditForm({ name: t.name, email: t.email, designation: t.designation, department: t.department, password: '' })
                            }}
                            className="text-blue-500 hover:text-blue-700 text-sm font-medium"
                          >
                            Update
                          </button>
                          <span className="text-gray-300">|</span>
                          <button onClick={() => handleDelete(t._id)} className="text-red-500 hover:text-red-700 text-sm font-medium">Delete</button>
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

export default ManageTeachers