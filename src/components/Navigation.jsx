import { Link, useLocation } from 'react-router-dom'
import { Sparkles, MessageSquare, Users, User, LogOut, Archive } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

export default function Navigation() {
  const { user, logout } = useAuth()
  const location = useLocation()

  const handleLogout = async () => {
    await logout()
  }

  return (
    <nav className="glass-dark sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                Time Capsule
              </h1>
            </div>
          </Link>

          <div className="flex items-center gap-6">
            <Link
              to="/"
              className={`flex items-center gap-2 transition-colors ${location.pathname === '/' ? 'text-purple-400' : 'text-gray-400 hover:text-white'}`}
            >
              <MessageSquare className="w-5 h-5" />
              <span className="hidden sm:inline">My Capsules</span>
            </Link>
            <Link
              to="/board"
              className={`flex items-center gap-2 transition-colors ${location.pathname === '/board' ? 'text-purple-400' : 'text-gray-400 hover:text-white'}`}
            >
              <Users className="w-5 h-5" />
              <span className="hidden sm:inline">Message Board</span>
            </Link>
            {user && (
              <>
                <Link
                  to="/profile"
                  className={`flex items-center gap-2 transition-colors ${location.pathname === '/profile' ? 'text-purple-400' : 'text-gray-400 hover:text-white'}`}
                >
                  <User className="w-5 h-5" />
                  <span className="hidden sm:inline">Profile</span>
                </Link>
                <Link
                  to="/archived"
                  className={`flex items-center gap-2 transition-colors ${location.pathname === '/archived' ? 'text-purple-400' : 'text-gray-400 hover:text-white'}`}
                >
                  <Archive className="w-5 h-5" />
                  <span className="hidden sm:inline">Archived</span>
                </Link>
              </>
            )}
            {user ? (
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
              >
                <LogOut className="w-5 h-5" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            ) : (
              <Link
                to="/login"
                className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg font-semibold hover:opacity-90 transition-opacity"
              >
                Login
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
