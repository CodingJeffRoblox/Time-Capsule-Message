import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { database } from '../firebase'
import { ref, onValue, remove } from 'firebase/database'
import { Archive, Calendar, Trash2, Lock, Unlock, ArrowLeft } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { useNavigate } from 'react-router-dom'

export default function Archived() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [archivedCapsules, setArchivedCapsules] = useState([])

  useEffect(() => {
    if (!user) return

    const archivedRef = ref(database, `users/${user.uid}/archived`)
    const unsubscribe = onValue(archivedRef, (snapshot) => {
      const data = snapshot.val()
      if (data) {
        const archivedArray = Object.entries(data).map(([id, capsule]) => ({
          id,
          ...capsule,
        }))
        setArchivedCapsules(archivedArray)
      } else {
        setArchivedCapsules([])
      }
    })

    return () => unsubscribe()
  }, [user])

  const handleDelete = async (capsuleId) => {
    if (!confirm('Are you sure you want to delete this archived capsule?')) return
    
    try {
      await remove(ref(database, `users/${user.uid}/archived/${capsuleId}`))
    } catch (error) {
      console.error('Error deleting archived capsule:', error)
      alert('Failed to delete archived capsule')
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="glass rounded-2xl p-8 text-center">
          <p className="text-gray-400">Please log in to view your archived capsules</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={() => navigate('/profile')}
          className="text-gray-400 hover:text-white transition-colors flex items-center gap-2"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Profile
        </button>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-gradient-to-r from-orange-500 to-red-500 flex items-center justify-center">
            <Archive className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">Archived Capsules</h2>
            <p className="text-gray-400">Capsules archived after 2 days of being ready to open</p>
          </div>
        </div>
      </div>

      {archivedCapsules.length === 0 ? (
        <div className="glass rounded-2xl p-12 text-center">
          <Archive className="w-16 h-16 mx-auto mb-4 text-gray-500" />
          <h3 className="text-xl font-semibold mb-2">No Archived Capsules</h3>
          <p className="text-gray-400">Capsules are automatically archived 2 days after they become ready to open</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {archivedCapsules.map(capsule => (
            <div key={capsule.id} className="glass rounded-xl p-6 border-orange-500/30 hover:border-orange-500/50 transition-colors">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Archive className="w-4 h-4 text-orange-400" />
                    <span className="text-xs text-orange-400 font-medium">ARCHIVED</span>
                  </div>
                  <h4 className="font-semibold">{capsule.title}</h4>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-sm text-gray-400">
                      {capsule.isPublic ? 'Public' : 'Private'}
                    </span>
                    {capsule.isLocked ? (
                      <Lock className="w-3 h-3 text-yellow-400" />
                    ) : (
                      <Unlock className="w-3 h-3 text-green-400" />
                    )}
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(capsule.id)}
                  className="text-red-400 hover:text-red-300 transition-colors"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
              
              <p className="text-gray-400 text-sm mb-4 line-clamp-2">{capsule.message}</p>
              
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <Calendar className="w-4 h-4 text-purple-400" />
                <span>Archived {formatDistanceToNow(new Date(capsule.archivedAt), { addSuffix: true })}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
