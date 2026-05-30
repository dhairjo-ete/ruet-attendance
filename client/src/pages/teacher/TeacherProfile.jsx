import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import useAuth from '../../hooks/useAuth.js'
import { getTeacherProfile, updateTeacherProfile } from '../../services/teacherService.js'
import { changePassword } from '../../services/authService.js'

const TeacherProfile = () => {
  const { user, login, navigate } = useAuth()
  const currentNav = useNavigate() // Fallback if navigate is not exposed in useAuth
  const routeNav = currentNav || navigate
  
  const [profile, setProfile] = useState(null)
  const [website, setWebsite] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(true)
  
  // Feedback states
  const [profileError, setProfileError] = useState('')
  const [profileSuccess, setProfileSuccess] = useState('')
  const [pwError, setPwError] = useState('')
  const [pwSuccess, setPwSuccess] = useState('')
  const [submittingProfile, setSubmittingProfile] = useState(false)
  const [submittingPassword, setSubmittingPassword] = useState(false)

  useEffect(() => {
    loadProfile()
  }, [])

  const loadProfile = async () => {
    try {
      const data = await getTeacherProfile()
      setProfile(data)
      setWebsite(data.website || '')
    } catch (err) {
      setProfileError('Failed to fetch profile details')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateWebsite = async (e) => {
    e.preventDefault()
    setProfileError('')
    setProfileSuccess('')
    setSubmittingProfile(true)

    try {
      await updateTeacherProfile(website)
      setProfileSuccess('Website link updated successfully!')
      
      // Update React Auth context state
      const updatedUser = { ...user, website }
      login(updatedUser)
      
      // Refresh local profile state
      setProfile(prev => ({ ...prev, website }))
      setTimeout(() => setProfileSuccess(''), 3000)
    } catch (err) {
      setProfileError(err.response?.data?.message || 'Failed to update website')
    } finally {
      setSubmittingProfile(false)
    }
  }

  const handleChangePassword = async (e) => {
    e.preventDefault()
    setPwError('')
    setPwSuccess('')

    if (newPassword.length < 6) {
      setPwError('New password must be at least 6 characters long')
      return
    }

    if (newPassword !== confirmPassword) {
      setPwError('Passwords do not match')
      return
    }

    setSubmittingPassword(true)
    try {
      await changePassword(newPassword)
      setPwSuccess('Password changed successfully!')
      setNewPassword('')
      setConfirmPassword('')
      setTimeout(() => setPwSuccess(''), 3000)
    } catch (err) {
      setPwError(err.response?.data?.message || 'Failed to change password')
    } finally {
      setSubmittingPassword(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50/50 font-sans text-slate-800">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200/85 px-6 py-4 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={() => routeNav('/teacher/dashboard')}
            className="w-8 h-8 flex items-center justify-center bg-slate-100 hover:bg-slate-200 rounded-xl text-slate-600 transition-colors text-sm font-black cursor-pointer"
          >
            ←
          </button>
          <div>
            <h1 className="font-bold text-slate-800 text-sm tracking-tight">Faculty Profile</h1>
            <p className="text-[10px] text-slate-400 font-medium">Manage your personal settings and credentials</p>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-3xl mx-auto px-6 py-8">
        
        {loading ? (
          <div className="text-center py-20 text-slate-400">
            <div className="text-3xl mb-3 animate-spin">⏳</div>
            <p className="font-semibold text-sm">Loading profile information...</p>
          </div>
        ) : (
          <div className="space-y-6">
            
            {/* General Profile Info Card */}
            <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
              <div className="flex items-center gap-4 border-b border-slate-100 pb-5 mb-5">
                <div className="w-16 h-16 bg-gradient-to-br from-indigo-650 to-blue-650 rounded-full flex items-center justify-center text-white text-2xl font-black shadow-md shadow-indigo-100">
                  {profile?.name?.charAt(0) || 'F'}
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-800">{profile?.name}</h2>
                  <p className="text-xs text-indigo-600 font-bold">{profile?.designation}</p>
                  <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Department of {profile?.department}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="bg-slate-50 border border-slate-150 rounded-xl p-3">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Email Address</span>
                  <p className="font-bold text-slate-700 mt-1">{profile?.email}</p>
                </div>
                <div className="bg-slate-50 border border-slate-150 rounded-xl p-3">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Role Access</span>
                  <p className="font-bold text-slate-700 mt-1 capitalize">{user?.role || 'Teacher'}</p>
                </div>
              </div>
            </div>

            {/* Profile Settings (Website Update Form) */}
            <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
              <h3 className="font-bold text-slate-800 text-sm tracking-tight mb-1">Personal Website Link</h3>
              <p className="text-xs text-slate-400 mb-4">Set a website link to display on your portal profile card</p>
              
              {profileError && (
                <div className="mb-4 px-4 py-2 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl font-medium">
                  ❌ {profileError}
                </div>
              )}
              {profileSuccess && (
                <div className="mb-4 px-4 py-2 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-xl font-medium">
                  ✅ {profileSuccess}
                </div>
              )}

              <form onSubmit={handleUpdateWebsite} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Website URL</label>
                  <input
                    type="text"
                    placeholder="e.g. www.ruet.ac.bd/ete/teacher"
                    value={website}
                    onChange={e => setWebsite(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs font-semibold text-slate-700 placeholder-slate-400"
                  />
                </div>
                <button
                  type="submit"
                  disabled={submittingProfile}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm"
                >
                  {submittingProfile ? 'Saving...' : 'Update Website'}
                </button>
              </form>
            </div>

            {/* Security Settings (Change Password Form) */}
            <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
              <h3 className="font-bold text-slate-800 text-sm tracking-tight mb-1">Security Settings</h3>
              <p className="text-xs text-slate-400 mb-4">Update your password regularly to secure your portal account</p>

              {pwError && (
                <div className="mb-4 px-4 py-2 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl font-medium">
                  ❌ {pwError}
                </div>
              )}
              {pwSuccess && (
                <div className="mb-4 px-4 py-2 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-xl font-medium">
                  ✅ {pwSuccess}
                </div>
              )}

              <form onSubmit={handleChangePassword} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">New Password</label>
                    <input
                      type="password"
                      placeholder="Minimum 6 characters"
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs font-semibold text-slate-700"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Confirm New Password</label>
                    <input
                      type="password"
                      placeholder="Retype password"
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs font-semibold text-slate-700"
                      required
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={submittingPassword}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm"
                >
                  {submittingPassword ? 'Changing Password...' : 'Change Password'}
                </button>
              </form>
            </div>

          </div>
        )}
      </div>
    </div>
  )
}

export default TeacherProfile