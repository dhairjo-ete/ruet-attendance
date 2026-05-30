import { Navigate } from 'react-router-dom'
import useAuth from '../hooks/useAuth.js'

const AdminRoute = ({ children }) => {
  const { user } = useAuth()
  if (!user) return <Navigate to='/login' replace />
  if (user.role !== 'admin') return <Navigate to='/unauthorized' replace />
  return children
}

export default AdminRoute