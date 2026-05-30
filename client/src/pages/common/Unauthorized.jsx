import { useNavigate } from 'react-router-dom'

const Unauthorized = () => {
  const navigate = useNavigate()
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-8xl font-bold text-red-500 mb-4">403</h1>
        <h2 className="text-2xl font-semibold text-gray-800 mb-2">Unauthorized</h2>
        <p className="text-gray-500 mb-6">You do not have permission to access this page.</p>
        <button onClick={() => navigate('/login')} className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors">
          Go to Login
        </button>
      </div>
    </div>
  )
}

export default Unauthorized