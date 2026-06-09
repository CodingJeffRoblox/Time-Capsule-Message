import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { database } from '../firebase'
import { ref, onValue } from 'firebase/database'
import { User, Calendar, Lock, Unlock, Eye, ArrowLeft } from 'lucide-react'
import { formatDistanceToNow, isPast } from 'date-fns'
import { useNavigate } from 'react-router-dom'

export default function UserProfile() {
  const { userId } = useParams()
  const navigate = useNavigate()
  const [userData, setUserData] = useState(null)
  const [publicCapsules, setPublicCapsules] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const userRef = ref(database, `users/${userId}`)
    const publicCapsulesRef = ref(database, 'publicCapsules')

    const unsubscribeUser = onValue(userRef, (snapshot) => {
      const data = snapshot.val()
      if (data) {
        setUserData(data)
      }
      setLoading(false)
    })

    const unsubscribePublic = onValue(publicCapsulesRef, (snapshot) => {
      const data = snapshot.val()
      if (data) {
        const capsulesArray = Object.entries(data)
          .map(([id, capsule]) => ({
            id,
            ...capsule,
          }))
          .filter(capsule => capsule.authorId === userId)
        setPublicCapsules(capsulesArray)
      } else {
        setPublicCapsules([])
      }
    })

    return () => {
      unsubscribeUser()
      unsubscribePublic()
    }
  }, [userId])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="glass rounded-2xl p-8 text-center">
          <p className="text-gray-400">Loading profile...</p>
        </div>
      </div>
    )
  }

  if (!userData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="glass rounded-2xl p-8 text-center">
          <p className="text-gray-400">User not found</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <button
        onClick={() => navigate('/board')}
        className="mb-6 text-gray-400 hover:text-white transition-colors flex items-center gap-2"
      >
        <ArrowLeft className="w-5 h-5" />
        Back to Message Board
      </button>

      <div className="glass rounded-2xl p-8 mb-8">
        <div className="flex items-center gap-6 mb-8">
          <div className="w-20 h-20 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
            <User className="w-10 h-10" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">{userData.displayName || 'Time Traveler'}</h2>
            <p className="text-gray-400 mt-1">Member since {formatDistanceToNow(new Date(userData.createdAt || Date.now()), { addSuffix: true })}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="glass-dark rounded-lg p-4 text-center">
            <div className="text-3xl font-bold text-purple-400">{publicCapsules.length}</div>
            <div className="text-sm text-gray-400 mt-1">Public Capsules</div>
          </div>
        </div>
      </div>

      <h3 className="text-xl font-bold mb-4">Public Capsules</h3>
      
      {publicCapsules.length === 0 ? (
        <div className="glass rounded-2xl p-12 text-center">
          <p className="text-gray-400">This user hasn't shared any public capsules yet</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {publicCapsules.map(capsule => (
            <div key={capsule.id} className="glass rounded-xl p-6">
              <div className="flex items-center gap-2 mb-4">
                {capsule.isLocked ? (
                  <Lock className="w-5 h-5 text-yellow-400" />
                ) : (
                  <Unlock className="w-5 h-5 text-green-400" />
                )}
                <Eye className="w-4 h-4 text-purple-400" />
              </div>

              <h4 className="font-semibold text-lg mb-2">{capsule.title}</h4>
              <p className="text-gray-400 text-sm mb-4 line-clamp-3">{capsule.message}</p>

              <div className="flex items-center gap-2 text-sm">
                <Calendar className="w-4 h-4 text-purple-400" />
                {isPast(new Date(capsule.unlockDate)) ? (
                  <span className="text-green-400">Ready to open!</span>
                ) : (
                  <span className="text-gray-400">
                    Opens {formatDistanceToNow(new Date(capsule.unlockDate), { addSuffix: true })}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
