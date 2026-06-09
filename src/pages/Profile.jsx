import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { database, auth } from '../firebase'
import { ref, onValue, remove, set, update } from 'firebase/database'
import { updateProfile } from 'firebase/auth'
import { User, Mail, Calendar, Trash2, Archive, Lock, Unlock, Eye, EyeOff, Edit2, Check, X } from 'lucide-react'
import { formatDistanceToNow, isPast } from 'date-fns'

export default function Profile() {
  const { user } = useAuth()
  const [capsules, setCapsules] = useState([])
  const [archivedCapsules, setArchivedCapsules] = useState([])
  const [showArchived, setShowArchived] = useState(false)
  const [stats, setStats] = useState({ total: 0, public: 0, private: 0, unlocked: 0, archived: 0 })
  const [isEditingName, setIsEditingName] = useState(false)
  const [displayName, setDisplayName] = useState('')
  const [userData, setUserData] = useState(null)

  useEffect(() => {
    if (!user) return

    setDisplayName(user.displayName || 'Time Traveler')

    const capsulesRef = ref(database, `users/${user.uid}/capsules`)
    const archivedRef = ref(database, `users/${user.uid}/archived`)
    const userRef = ref(database, `users/${user.uid}`)

    const unsubscribeUser = onValue(userRef, (snapshot) => {
      const data = snapshot.val()
      if (data) {
        setUserData(data)
      }
    })

    const unsubscribeCapsules = onValue(capsulesRef, (snapshot) => {
      const data = snapshot.val()
      if (data) {
        const capsulesArray = Object.entries(data).map(([id, capsule]) => ({
          id,
          ...capsule,
        }))
        setCapsules(capsulesArray)
      } else {
        setCapsules([])
      }
    })

    const unsubscribeArchived = onValue(archivedRef, (snapshot) => {
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

    return () => {
      unsubscribeUser()
      unsubscribeCapsules()
      unsubscribeArchived()
    }
  }, [user])

  useEffect(() => {
    const total = capsules.length
    const publicCount = capsules.filter(c => c.isPublic).length
    const privateCount = capsules.filter(c => !c.isPublic).length
    const unlockedCount = capsules.filter(c => isPast(new Date(c.unlockDate))).length
    
    setStats({ total, public: publicCount, private: privateCount, unlocked: unlockedCount, archived: archivedCapsules.length })
  }, [capsules, archivedCapsules])

  const handleDelete = async (capsuleId) => {
    if (!confirm('Are you sure you want to delete this capsule?')) return
    
    try {
      await remove(ref(database, `users/${user.uid}/capsules/${capsuleId}`))
    } catch (error) {
      console.error('Error deleting capsule:', error)
      alert('Failed to delete capsule')
    }
  }

  const handleDeleteArchived = async (capsuleId) => {
    if (!confirm('Are you sure you want to delete this archived capsule?')) return
    
    try {
      await remove(ref(database, `users/${user.uid}/archived/${capsuleId}`))
    } catch (error) {
      console.error('Error deleting archived capsule:', error)
      alert('Failed to delete archived capsule')
    }
  }

  const handleArchive = async (capsuleId) => {
    if (!confirm('Are you sure you want to archive this capsule?')) return
    
    try {
      const capsuleRef = ref(database, `users/${user.uid}/capsules/${capsuleId}`)
      const archiveRef = ref(database, `users/${user.uid}/archived/${capsuleId}`)
      
      const snapshot = await new Promise((resolve) => {
        onValue(capsuleRef, resolve, { onlyOnce: true })
      })
      
      if (snapshot.exists()) {
        const capsuleData = snapshot.val()
        await set(archiveRef, { ...capsuleData, archivedAt: new Date().toISOString() })
        await remove(capsuleRef)
      }
    } catch (error) {
      console.error('Error archiving capsule:', error)
      alert('Failed to archive capsule')
    }
  }

  const handleUpdateName = async () => {
    if (!displayName.trim()) return
    
    try {
      await update(ref(database, `users/${user.uid}`), {
        displayName: displayName.trim()
      })
      // Update Firebase Auth profile
      await updateProfile(auth.currentUser, { displayName: displayName.trim() })
      setIsEditingName(false)
    } catch (error) {
      console.error('Error updating name:', error)
      alert('Failed to update name')
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="glass rounded-2xl p-8 text-center">
          <p className="text-gray-400">Please log in to view your profile</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="glass rounded-2xl p-8 mb-8">
        <div className="flex items-center gap-6 mb-8">
          <div className="w-20 h-20 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
            <User className="w-10 h-10" />
          </div>
          <div className="flex-1">
            {isEditingName ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="text-2xl font-bold bg-white/10 border border-white/20 rounded-lg px-3 py-1 focus:border-purple-500 focus:outline-none"
                  onKeyPress={(e) => e.key === 'Enter' && handleUpdateName()}
                />
                <button
                  onClick={handleUpdateName}
                  className="text-green-400 hover:text-green-300"
                >
                  <Check className="w-5 h-5" />
                </button>
                <button
                  onClick={() => {
                    setIsEditingName(false)
                    setDisplayName(user.displayName || 'Time Traveler')
                  }}
                  className="text-red-400 hover:text-red-300"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-bold">{user.displayName || 'Time Traveler'}</h2>
                <button
                  onClick={() => setIsEditingName(true)}
                  className="text-gray-400 hover:text-white"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
              </div>
            )}
            <div className="flex items-center gap-2 text-gray-400 mt-1">
              <Mail className="w-4 h-4" />
              <span>{user.email}</span>
            </div>
            {userData && (
              <div className="mt-4 space-y-2 text-sm">
                {userData.dob && (
                  <div className="flex items-center gap-2 text-gray-400">
                    <Calendar className="w-4 h-4" />
                    <span>Born: {new Date(userData.dob).toLocaleDateString()}</span>
                  </div>
                )}
                {userData.bio && (
                  <div className="text-gray-400">
                    <p className="line-clamp-2">{userData.bio}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="glass-dark rounded-lg p-4 text-center">
            <div className="text-3xl font-bold text-purple-400">{stats.total}</div>
            <div className="text-sm text-gray-400 mt-1">Total Capsules</div>
          </div>
          <div className="glass-dark rounded-lg p-4 text-center">
            <div className="text-3xl font-bold text-green-400">{stats.public}</div>
            <div className="text-sm text-gray-400 mt-1">Public</div>
          </div>
          <div className="glass-dark rounded-lg p-4 text-center">
            <div className="text-3xl font-bold text-blue-400">{stats.private}</div>
            <div className="text-sm text-gray-400 mt-1">Private</div>
          </div>
          <div className="glass-dark rounded-lg p-4 text-center">
            <div className="text-3xl font-bold text-yellow-400">{stats.unlocked}</div>
            <div className="text-sm text-gray-400 mt-1">Ready to Open</div>
          </div>
          <div className="glass-dark rounded-lg p-4 text-center">
            <div className="text-3xl font-bold text-orange-400">{stats.archived}</div>
            <div className="text-sm text-gray-400 mt-1">Archived</div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold">{showArchived ? 'Archived Capsules' : 'Your Capsules'}</h3>
        <button
          onClick={() => setShowArchived(!showArchived)}
          className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors flex items-center gap-2"
        >
          <Archive className="w-4 h-4" />
          {showArchived ? 'View Active' : 'View Archived'}
        </button>
      </div>
      
      {!showArchived ? (
        capsules.length === 0 ? (
          <div className="glass rounded-2xl p-12 text-center">
            <p className="text-gray-400">You haven't created any capsules yet</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {capsules.map(capsule => {
              const canOpen = isPast(new Date(capsule.unlockDate))
              return (
                <div key={capsule.id} className="glass rounded-xl p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
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
                    <div className="flex gap-2">
                      {canOpen && (
                        <button
                          onClick={() => handleArchive(capsule.id)}
                          className="text-orange-400 hover:text-orange-300 transition-colors"
                          title="Archive"
                        >
                          <Archive className="w-5 h-5" />
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(capsule.id)}
                        className="text-red-400 hover:text-red-300 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                  
                  {canOpen ? (
                    <p className="text-gray-400 text-sm mb-4 line-clamp-2">{capsule.message}</p>
                  ) : (
                    <p className="text-gray-400 text-sm mb-4 line-clamp-2">Message hidden until unlock date</p>
                  )}
                  
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="w-4 h-4 text-purple-400" />
                    {canOpen ? (
                      <span className="text-green-400">Ready to open!</span>
                    ) : (
                      <span className="text-gray-400">
                        Opens {formatDistanceToNow(new Date(capsule.unlockDate), { addSuffix: true })}
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )
      ) : (
        archivedCapsules.length === 0 ? (
          <div className="glass rounded-2xl p-12 text-center">
            <Archive className="w-16 h-16 mx-auto mb-4 text-gray-500" />
            <h3 className="text-xl font-semibold mb-2">No Archived Capsules</h3>
            <p className="text-gray-400">Capsules are archived 2 days after they become ready to open</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {archivedCapsules.map(capsule => (
              <div key={capsule.id} className="glass rounded-xl p-6 border-orange-500/30">
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
                    onClick={() => handleDeleteArchived(capsule.id)}
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
        )
      )}
    </div>
  )
}
