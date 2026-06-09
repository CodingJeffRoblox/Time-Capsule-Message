import { useState, useEffect } from 'react'
import { database } from '../firebase'
import { ref, onValue, remove, set } from 'firebase/database'
import { Lock, Unlock, Clock, Eye, Calendar, Users, Sparkles, MoreVertical, Archive, Trash2 } from 'lucide-react'
import { formatDistanceToNow, isPast } from 'date-fns'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'

export default function MessageBoard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [publicCapsules, setPublicCapsules] = useState([])
  const [filter, setFilter] = useState('all')
  const [selectedCapsule, setSelectedCapsule] = useState(null)
  const [passwordInput, setPasswordInput] = useState('')

  useEffect(() => {
    const publicCapsulesRef = ref(database, 'publicCapsules')
    const unsubscribe = onValue(publicCapsulesRef, (snapshot) => {
      const data = snapshot.val()
      if (data) {
        const capsulesArray = Object.entries(data).map(([id, capsule]) => ({
          id,
          ...capsule,
        }))
        setPublicCapsules(capsulesArray)
      } else {
        setPublicCapsules([])
      }
    })

    return () => unsubscribe()
  }, [])

  const filteredCapsules = publicCapsules.filter(capsule => {
    if (filter === 'all') return true
    if (filter === 'ready') return isPast(new Date(capsule.unlockDate))
    if (filter === 'locked') return capsule.isLocked
    if (filter === 'unlocked') return !capsule.isLocked
    if (filter === 'mine') return capsule.authorId === user?.uid
    return true
  })

  const handleDeletePublic = async (capsuleId) => {
    if (!confirm('Are you sure you want to delete this public capsule?')) return
    
    try {
      await remove(ref(database, `publicCapsules/${capsuleId}`))
    } catch (error) {
      console.error('Error deleting public capsule:', error)
      alert('Failed to delete capsule')
    }
  }

  const handleArchivePublic = async (capsuleId) => {
    if (!confirm('Are you sure you want to archive this capsule? It will be removed from the public board.')) return
    
    try {
      const capsuleRef = ref(database, `publicCapsules/${capsuleId}`)
      const snapshot = await new Promise((resolve) => {
        onValue(capsuleRef, resolve, { onlyOnce: true })
      })
      
      if (snapshot.exists()) {
        const capsuleData = snapshot.val()
        // Also archive in user's capsules
        if (user) {
          const userArchiveRef = ref(database, `users/${user.uid}/archived/${capsuleId}`)
          await set(userArchiveRef, { ...capsuleData, archivedAt: new Date().toISOString() })
        }
        await remove(capsuleRef)
      }
    } catch (error) {
      console.error('Error archiving public capsule:', error)
      alert('Failed to archive capsule')
    }
  }

  const unlockCapsule = (capsule) => {
    if (capsule.isLocked && capsule.password) {
      if (passwordInput === capsule.password) {
        setSelectedCapsule({ ...capsule, isUnlocked: true })
        setPasswordInput('')
      } else {
        alert('Incorrect password!')
      }
    } else if (!isPast(new Date(capsule.unlockDate))) {
      alert('This capsule cannot be opened yet!')
    } else {
      setSelectedCapsule({ ...capsule, isUnlocked: true })
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {selectedCapsule ? (
        <ViewPublicCapsule
          capsule={selectedCapsule}
          onBack={() => setSelectedCapsule(null)}
          passwordInput={passwordInput}
          setPasswordInput={setPasswordInput}
          onUnlock={() => unlockCapsule(selectedCapsule)}
        />
      ) : (
        <>
          <div className="glass rounded-2xl p-8 mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Message Board</h2>
                <p className="text-gray-400">View public time capsules from around the world</p>
              </div>
            </div>

            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2 rounded-lg transition-colors ${filter === 'all' ? 'bg-purple-500' : 'bg-white/10 hover:bg-white/20'}`}
              >
                All
              </button>
              {user && (
                <button
                  onClick={() => setFilter('mine')}
                  className={`px-4 py-2 rounded-lg transition-colors ${filter === 'mine' ? 'bg-purple-500' : 'bg-white/10 hover:bg-white/20'}`}
                >
                  My Capsules
                </button>
              )}
              <button
                onClick={() => setFilter('ready')}
                className={`px-4 py-2 rounded-lg transition-colors ${filter === 'ready' ? 'bg-purple-500' : 'bg-white/10 hover:bg-white/20'}`}
              >
                Ready to Open
              </button>
              <button
                onClick={() => setFilter('locked')}
                className={`px-4 py-2 rounded-lg transition-colors ${filter === 'locked' ? 'bg-purple-500' : 'bg-white/10 hover:bg-white/20'}`}
              >
                Password Protected
              </button>
            </div>
          </div>

          {publicCapsules.length === 0 ? (
            <div className="glass rounded-2xl p-12 text-center">
              <Users className="w-16 h-16 mx-auto mb-4 text-gray-500" />
              <h3 className="text-xl font-semibold mb-2">No Public Capsules Yet</h3>
              <p className="text-gray-400">Be the first to share a public time capsule!</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredCapsules.map(capsule => (
                <PublicCapsuleCard 
                  key={capsule.id} 
                  capsule={capsule} 
                  onSelect={() => setSelectedCapsule(capsule)}
                  isOwner={capsule.authorId === user?.uid}
                  onDelete={() => handleDeletePublic(capsule.id)}
                  onArchive={() => handleArchivePublic(capsule.id)}
                  onAuthorClick={() => navigate(`/user/${capsule.authorId}`)}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}

function PublicCapsuleCard({ capsule, onSelect, isOwner, onDelete, onArchive, onAuthorClick }) {
  const canOpen = isPast(new Date(capsule.unlockDate))
  const timeUntil = formatDistanceToNow(new Date(capsule.unlockDate), { addSuffix: true })
  const [showMenu, setShowMenu] = useState(false)

  return (
    <div 
      onClick={onSelect}
      className="glass rounded-xl p-6 hover:bg-white/15 transition-colors cursor-pointer relative"
    >
      <div className="flex items-center gap-2 mb-4">
        {capsule.isLocked ? (
          <Lock className="w-5 h-5 text-yellow-400" />
        ) : (
          <Unlock className="w-5 h-5 text-green-400" />
        )}
        <Eye className="w-4 h-4 text-purple-400" />
        {isOwner && (
          <div className="ml-auto relative">
            <button
              onClick={(e) => {
                e.stopPropagation()
                setShowMenu(!showMenu)
              }}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <MoreVertical className="w-5 h-5" />
            </button>
            {showMenu && (
              <div className="absolute right-0 top-8 bg-gray-800 rounded-lg shadow-lg py-2 w-40 z-10">
                {canOpen && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onArchive()
                      setShowMenu(false)
                    }}
                    className="w-full px-4 py-2 text-left hover:bg-gray-700 flex items-center gap-2 text-orange-400"
                  >
                    <Archive className="w-4 h-4" />
                    Archive
                  </button>
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onDelete()
                    setShowMenu(false)
                  }}
                  className="w-full px-4 py-2 text-left hover:bg-gray-700 flex items-center gap-2 text-red-400"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <h3 className="font-semibold text-lg mb-2">{capsule.title}</h3>
      {canOpen ? (
        <p className="text-gray-400 text-sm mb-4 line-clamp-3">{capsule.message}</p>
      ) : (
        <p className="text-gray-400 text-sm mb-4 line-clamp-3">Message hidden until unlock date</p>
      )}

      <div className="glass-dark rounded-lg p-4 mb-4">
        <CountdownTimer targetDate={capsule.unlockDate} />
      </div>

      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-purple-400" />
          {canOpen ? (
            <span className="text-green-400">Ready to open!</span>
          ) : (
            <span className="text-gray-400">Opens {timeUntil}</span>
          )}
        </div>
        <span 
          onClick={(e) => {
            e.stopPropagation()
            onAuthorClick()
          }}
          className="text-gray-500 hover:text-purple-400 cursor-pointer"
        >
          by {capsule.authorName || 'Anonymous'}
        </span>
      </div>
    </div>
  )
}

function CountdownTimer({ targetDate }) {
  const [timeLeft, setTimeLeft] = useState({})

  useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = new Date(targetDate) - new Date()
      
      if (difference <= 0) {
        return { expired: true }
      }

      return {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
      }
    }

    setTimeLeft(calculateTimeLeft())
    
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft())
    }, 1000)

    return () => clearInterval(timer)
  }, [targetDate])

  if (timeLeft.expired) {
    return (
      <div className="text-center">
        <div className="text-green-400 font-semibold">Ready to Open!</div>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-4 gap-2">
      {[
        { label: 'D', value: timeLeft.days },
        { label: 'H', value: timeLeft.hours },
        { label: 'M', value: timeLeft.minutes },
        { label: 'S', value: timeLeft.seconds },
      ].map((item) => (
        <div key={item.label} className="text-center">
          <div className="text-lg font-bold text-purple-400">{String(item.value).padStart(2, '0')}</div>
          <div className="text-xs text-gray-500">{item.label}</div>
        </div>
      ))}
    </div>
  )
}

function ViewPublicCapsule({ capsule, onBack, passwordInput, setPasswordInput, onUnlock }) {
  const canOpen = isPast(new Date(capsule.unlockDate))
  const timeUntil = formatDistanceToNow(new Date(capsule.unlockDate), { addSuffix: true })

  if (!capsule.isUnlocked) {
    return (
      <div className="glass rounded-2xl p-8">
        <button onClick={onBack} className="mb-6 text-gray-400 hover:text-white transition-colors flex items-center gap-2">
          ← Back to message board
        </button>

        <div className="text-center mb-8">
          <div className="w-20 h-20 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center mx-auto mb-4">
            {capsule.isLocked ? (
              <Lock className="w-10 h-10" />
            ) : (
              <Clock className="w-10 h-10" />
            )}
          </div>
          <h2 className="text-3xl font-bold mb-2">{capsule.title}</h2>
          <p className="text-gray-400">
            by {capsule.authorName || 'Anonymous'}
          </p>
          <p className="text-gray-400 mt-2">
            {canOpen ? 'This capsule is ready to open!' : `Opens ${timeUntil}`}
          </p>
        </div>

        <CountdownTimer targetDate={capsule.unlockDate} />

        {capsule.isLocked && canOpen && (
          <div className="mt-8">
            <label className="block text-sm font-medium mb-2">Enter Password to Unlock</label>
            <input
              type="password"
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 focus:border-purple-500 focus:outline-none transition-colors mb-4"
              placeholder="Enter password..."
              onKeyPress={(e) => e.key === 'Enter' && onUnlock()}
            />
            <button
              onClick={onUnlock}
              className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg font-semibold hover:opacity-90 transition-opacity"
            >
              Unlock Capsule
            </button>
          </div>
        )}

        {!capsule.isLocked && canOpen && (
          <button
            onClick={onUnlock}
            className="mt-8 w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg font-semibold hover:opacity-90 transition-opacity"
          >
            Open Capsule
          </button>
        )}
      </div>
    )
  }

  return (
    <div className="glass rounded-2xl p-8">
      <button onClick={onBack} className="mb-6 text-gray-400 hover:text-white transition-colors flex items-center gap-2">
        ← Back to message board
      </button>

      <div className="text-center mb-8">
        <div className="w-20 h-20 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center mx-auto mb-4">
          <Sparkles className="w-10 h-10" />
        </div>
        <h2 className="text-3xl font-bold mb-2">{capsule.title}</h2>
        <p className="text-gray-400">by {capsule.authorName || 'Anonymous'}</p>
        <p className="text-gray-400 mt-1">Created {formatDistanceToNow(new Date(capsule.createdAt), { addSuffix: true })}</p>
      </div>

      <div className="bg-white/5 rounded-xl p-6 mb-8">
        <p className="text-lg leading-relaxed whitespace-pre-wrap">{capsule.message}</p>
      </div>

      <button
        onClick={onBack}
        className="w-full py-3 rounded-lg bg-white/10 hover:bg-white/20 transition-colors font-medium"
      >
        Close
      </button>
    </div>
  )
}
