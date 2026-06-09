import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { googleProvider, database } from '../firebase'
import { ref, set, onValue } from 'firebase/database'
import { updateProfile } from 'firebase/auth'
import { Mail, Lock, Chrome, User, Calendar, X } from 'lucide-react'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignup, setIsSignup] = useState(false)
  const [error, setError] = useState('')
  const [username, setUsername] = useState('')
  const [dob, setDob] = useState('')
  const [bio, setBio] = useState('')
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [googleUser, setGoogleUser] = useState(null)
  const { login, signup, googleLogin, user } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    try {
      if (isSignup) {
        await signup(email, password, { username, dob, bio })
      } else {
        await login(email, password)
      }
      navigate('/')
    } catch (err) {
      setError(err.message)
    }
  }

  const handleGoogleLogin = async () => {
    try {
      const result = await googleLogin(googleProvider)
      setGoogleUser(result.user)
      
      // Check if user already has profile data
      const userRef = ref(database, `users/${result.user.uid}`)
      const snapshot = await new Promise((resolve) => {
        onValue(userRef, resolve, { onlyOnce: true })
      })
      
      const userData = snapshot.val()
      console.log('Existing user data:', userData)
      
      // Check if user has completed profile (has username and dob)
      if (!snapshot.exists() || !userData || !userData.username || !userData.dob) {
        console.log('Profile incomplete, showing modal')
        setShowProfileModal(true)
        // Pre-fill existing data if available
        if (userData) {
          setUsername(userData.username || '')
          setDob(userData.dob || '')
          setBio(userData.bio || '')
        }
      } else {
        console.log('Profile complete, navigating to home')
        navigate('/')
      }
    } catch (err) {
      setError(err.message)
    }
  }

  const handleProfileCompletion = async (e) => {
    e.preventDefault()
    if (!username.trim() || !dob) {
      setError('Please fill in required fields')
      return
    }
    
    try {
      await updateProfile(googleUser, { displayName: username.trim() })
      await set(ref(database, `users/${googleUser.uid}`), {
        displayName: username.trim(),
        dob,
        bio: bio.trim(),
        createdAt: new Date().toISOString()
      })
      setShowProfileModal(false)
      navigate('/')
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="glass rounded-2xl p-8 w-full max-w-md">
        <h2 className="text-3xl font-bold text-center mb-2">
          {isSignup ? 'Create Account' : 'Welcome Back'}
        </h2>
        <p className="text-gray-400 text-center mb-8">
          {isSignup ? 'Sign up to start creating time capsules' : 'Sign in to access your capsules'}
        </p>

        {error && (
          <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3 mb-6 text-red-400 text-sm">
            {error}
          </div>
        )}

        <button
          onClick={handleGoogleLogin}
          className="w-full py-3 rounded-lg bg-white hover:bg-gray-100 text-gray-900 font-medium transition-colors flex items-center justify-center gap-3 mb-6"
        >
          <Chrome className="w-5 h-5" />
          Continue with Google
        </button>

        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-white/20"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-4 bg-transparent text-gray-400">or continue with email</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {isSignup && (
            <>
              <div>
                <label className="block text-sm font-medium mb-2">Username *</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-lg bg-white/10 border border-white/20 focus:border-purple-500 focus:outline-none transition-colors"
                    placeholder="Your username"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Date of Birth *</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="date"
                    value={dob}
                    onChange={(e) => setDob(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-lg bg-white/10 border border-white/20 focus:border-purple-500 focus:outline-none transition-colors"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Bio</label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 focus:border-purple-500 focus:outline-none transition-colors resize-none"
                  placeholder="Tell us about yourself..."
                />
              </div>
            </>
          )}

          <div>
            <label className="block text-sm font-medium mb-2">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-lg bg-white/10 border border-white/20 focus:border-purple-500 focus:outline-none transition-colors"
                placeholder="you@example.com"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-lg bg-white/10 border border-white/20 focus:border-purple-500 focus:outline-none transition-colors"
                placeholder="••••••••"
                required
                minLength={6}
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg font-semibold hover:opacity-90 transition-opacity"
          >
            {isSignup ? 'Create Account' : 'Sign In'}
          </button>
        </form>

        <p className="text-center mt-6 text-gray-400">
          {isSignup ? 'Already have an account?' : "Don't have an account?"}{' '}
          <button
            onClick={() => setIsSignup(!isSignup)}
            className="text-purple-400 hover:text-purple-300 font-medium"
          >
            {isSignup ? 'Sign in' : 'Sign up'}
          </button>
        </p>
      </div>

      {showProfileModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="glass rounded-2xl p-8 w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Complete Your Profile</h2>
              <button
                onClick={() => {
                  setShowProfileModal(false)
                  navigate('/')
                }}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {error && (
              <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3 mb-6 text-red-400 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleProfileCompletion} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Username *</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-lg bg-white/10 border border-white/20 focus:border-purple-500 focus:outline-none transition-colors"
                    placeholder="Choose a username"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Date of Birth *</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="date"
                    value={dob}
                    onChange={(e) => setDob(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-lg bg-white/10 border border-white/20 focus:border-purple-500 focus:outline-none transition-colors"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Bio</label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 focus:border-purple-500 focus:outline-none transition-colors resize-none"
                  placeholder="Tell us about yourself..."
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg font-semibold hover:opacity-90 transition-opacity"
              >
                Complete Profile
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
