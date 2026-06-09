import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import { database } from '../firebase'
import { ref, onValue, push, remove, set } from 'firebase/database'
import { Lock, Unlock, Clock, Eye, EyeOff, Calendar, MessageSquare, Sparkles } from 'lucide-react'
import { formatDistanceToNow, isPast } from 'date-fns'

export default function Home() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [capsules, setCapsules] = useState([])
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [selectedCapsule, setSelectedCapsule] = useState(null)
  const [passwordInput, setPasswordInput] = useState('')

  useEffect(() => {
    if (!user) {
      navigate('/login')
      return
    }

    const capsulesRef = ref(database, `users/${user.uid}/capsules`)
    const unsubscribe = onValue(capsulesRef, (snapshot) => {
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

    return () => unsubscribe()
  }, [user, navigate])

  const createCapsule = async (capsuleData) => {
    try {
      const capsulesRef = ref(database, `users/${user.uid}/capsules`)
      await push(capsulesRef, capsuleData)
      
      if (capsuleData.isPublic) {
        const publicRef = ref(database, 'publicCapsules')
        await push(publicRef, {
          ...capsuleData,
          authorId: user.uid,
          authorName: user.displayName || user.email,
        })
      }
      
      setShowCreateForm(false)
    } catch (error) {
      console.error('Error creating capsule:', error)
      alert('Failed to create capsule')
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

  const archiveCapsule = async (id) => {
    try {
      const capsuleRef = ref(database, `users/${user.uid}/capsules/${id}`)
      const archiveRef = ref(database, `users/${user.uid}/archived/${id}`)
      
      // Get the capsule data
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
    }
  }

  useEffect(() => {
    // Check for capsules that should be archived (ready for 2+ days)
    capsules.forEach(capsule => {
      if (isPast(new Date(capsule.unlockDate))) {
        const unlockDate = new Date(capsule.unlockDate)
        const twoDaysAgo = new Date()
        twoDaysAgo.setDate(twoDaysAgo.getDate() - 2)
        
        if (unlockDate < twoDaysAgo) {
          archiveCapsule(capsule.id)
        }
      }
    })
  }, [capsules])

  const deleteCapsule = async (id) => {
    if (!confirm('Are you sure you want to delete this capsule?')) return
    
    try {
      await remove(ref(database, `users/${user.uid}/capsules/${id}`))
      if (selectedCapsule?.id === id) {
        setSelectedCapsule(null)
      }
    } catch (error) {
      console.error('Error deleting capsule:', error)
      alert('Failed to delete capsule')
    }
  }

  if (!user) {
    return null
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {showCreateForm && (
        <CreateCapsuleForm onSubmit={createCapsule} onCancel={() => setShowCreateForm(false)} />
      )}

      {selectedCapsule ? (
        <ViewCapsule
          capsule={selectedCapsule}
          onBack={() => setSelectedCapsule(null)}
          onDelete={() => deleteCapsule(selectedCapsule.id)}
          passwordInput={passwordInput}
          setPasswordInput={setPasswordInput}
          onUnlock={() => unlockCapsule(selectedCapsule)}
        />
      ) : (
        <>
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold mb-2">My Time Capsules</h2>
              <p className="text-gray-400">Preserve moments of your life for the future</p>
            </div>
            <button
              onClick={() => setShowCreateForm(!showCreateForm)}
              className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg font-semibold hover:opacity-90 transition-opacity flex items-center gap-2"
            >
              <MessageSquare className="w-5 h-5" />
              {showCreateForm ? 'Cancel' : 'Preserve Moment'}
            </button>
          </div>

          <CapsuleList
            capsules={capsules}
            onSelect={setSelectedCapsule}
            onDelete={deleteCapsule}
            onArchive={archiveCapsule}
          />
        </>
      )}
    </div>
  )
}

function CreateCapsuleForm({ onSubmit, onCancel }) {
  const [message, setMessage] = useState('')
  const [unlockDate, setUnlockDate] = useState('')
  const [isPublic, setIsPublic] = useState(true)
  const [usePassword, setUsePassword] = useState(false)
  const [password, setPassword] = useState('')
  const [title, setTitle] = useState('')
  const [showQuestionnaire, setShowQuestionnaire] = useState(false)
  
  // Who Are You Right Now? questions
  const [predictions, setPredictions] = useState({
    money: '',
    dreamJob: '',
    closestFriends: '',
    currentGames: '',
    aiPrediction: '',
    location: '',
  })
  
  // Life Snapshot
  const [lifeSnapshot, setLifeSnapshot] = useState({
    favoriteSong: '',
    favoriteMovie: '',
    favoriteGame: '',
    currentGoals: '',
    dailyRoutine: '',
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!message || !unlockDate) {
      alert('Please fill in all required fields')
      return
    }
    if (usePassword && !password) {
      alert('Please enter a password')
      return
    }
    onSubmit({
      title: title || 'Untitled Capsule',
      message,
      unlockDate,
      isPublic,
      isLocked: usePassword,
      password: usePassword ? password : null,
      createdAt: new Date().toISOString(),
      predictions: showQuestionnaire ? predictions : null,
      lifeSnapshot: showQuestionnaire ? lifeSnapshot : null,
    })
  }

  const setQuickDate = (days) => {
    const date = new Date()
    date.setDate(date.getDate() + days)
    setUnlockDate(date.toISOString().split('T')[0])
  }

  const setMilestoneDate = async (type) => {
    const date = new Date()
    const currentYear = date.getFullYear()
    
    switch(type) {
      case 'birthday':
        // Get user's DOB from Firebase
        try {
          const userRef = ref(database, `users/${user.uid}`)
          const snapshot = await new Promise((resolve) => {
            onValue(userRef, resolve, { onlyOnce: true })
          })
          
          const userData = snapshot.val()
          console.log('User data for birthday:', userData)
          
          if (snapshot.exists() && userData && userData.dob) {
            const dob = new Date(userData.dob)
            console.log('Parsed DOB:', dob)
            
            // Create a date object for this year's birthday
            const thisYearBirthday = new Date(currentYear, dob.getMonth(), dob.getDate())
            console.log('This year birthday:', thisYearBirthday)
            
            // If birthday has already passed this year, use next year
            const today = new Date()
            today.setHours(0, 0, 0, 0)
            thisYearBirthday.setHours(0, 0, 0, 0)
            
            if (thisYearBirthday <= today) {
              thisYearBirthday.setFullYear(currentYear + 1)
            }
            
            date.setTime(thisYearBirthday.getTime())
            console.log('Final birthday date:', date)
          } else {
            console.log('No DOB found, using fallback')
            // Fallback to 1 year from today if no DOB
            date.setFullYear(currentYear + 1)
          }
        } catch (error) {
          console.error('Error fetching DOB:', error)
          // Fallback to 1 year from today on error
          date.setFullYear(currentYear + 1)
        }
        break
      case '1year':
        date.setFullYear(currentYear + 1)
        break
      case '5years':
        date.setFullYear(currentYear + 5)
        break
      case 'age30':
        // Calculate age 30 based on DOB if available
        try {
          const userRef = ref(database, `users/${user.uid}`)
          const snapshot = await new Promise((resolve) => {
            onValue(userRef, resolve, { onlyOnce: true })
          })
          
          if (snapshot.exists() && snapshot.val().dob) {
            const dob = new Date(snapshot.val().dob)
            date.setFullYear(dob.getFullYear() + 30)
            date.setMonth(dob.getMonth())
            date.setDate(dob.getDate())
          } else {
            // Fallback to assuming current age + 10
            date.setFullYear(currentYear + 10)
          }
        } catch (error) {
          date.setFullYear(currentYear + 10)
        }
        break
      case 'retirement':
        date.setFullYear(currentYear + 40)
        break
    }
    setUnlockDate(date.toISOString().split('T')[0])
  }

  return (
    <div className="glass rounded-2xl p-8 mb-8">
      <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <MessageSquare className="w-6 h-6 text-purple-400" />
        Preserve a Moment
      </h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium mb-2">Title (Optional)</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 focus:border-purple-500 focus:outline-none transition-colors"
            placeholder="Give your capsule a name..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Your Message *</label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={6}
            className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 focus:border-purple-500 focus:outline-none transition-colors resize-none"
            placeholder="Write a note to your future self..."
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Unlock Date *</label>
          <input
            type="date"
            value={unlockDate}
            onChange={(e) => setUnlockDate(e.target.value)}
            className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 focus:border-purple-500 focus:outline-none transition-colors"
            required
          />
          <div className="flex gap-2 mt-3 flex-wrap">
            <button
              type="button"
              onClick={() => setQuickDate(7)}
              className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors text-sm"
            >
              7 days
            </button>
            <button
              type="button"
              onClick={() => setQuickDate(30)}
              className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors text-sm"
            >
              30 days
            </button>
            <button
              type="button"
              onClick={() => setQuickDate(90)}
              className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors text-sm"
            >
              3 months
            </button>
            <button
              type="button"
              onClick={() => setQuickDate(365)}
              className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors text-sm"
            >
              1 year
            </button>
            <button
              type="button"
              onClick={() => setQuickDate(365 * 5)}
              className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors text-sm"
            >
              5 years
            </button>
          </div>
          <div className="mt-3">
            <p className="text-xs text-gray-400 mb-2">Milestone Presets:</p>
            <div className="flex gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => setMilestoneDate('birthday')}
                className="px-4 py-2 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 transition-colors text-sm text-purple-300"
              >
                Next Birthday
              </button>
              <button
                type="button"
                onClick={() => setMilestoneDate('1year')}
                className="px-4 py-2 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 transition-colors text-sm text-purple-300"
              >
                1 Year
              </button>
              <button
                type="button"
                onClick={() => setMilestoneDate('5years')}
                className="px-4 py-2 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 transition-colors text-sm text-purple-300"
              >
                5 Years
              </button>
              <button
                type="button"
                onClick={() => setMilestoneDate('age30')}
                className="px-4 py-2 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 transition-colors text-sm text-purple-300"
              >
                Age 30
              </button>
              <button
                type="button"
                onClick={() => setMilestoneDate('retirement')}
                className="px-4 py-2 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 transition-colors text-sm text-purple-300"
              >
                Retirement
              </button>
            </div>
          </div>
        </div>

        <div className="glass-dark rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-400" />
              Who Are You Right Now?
            </h3>
            <button
              type="button"
              onClick={() => setShowQuestionnaire(!showQuestionnaire)}
              className={`w-14 h-8 rounded-full p-1 transition-colors ${showQuestionnaire ? 'bg-purple-500' : 'bg-gray-600'}`}
            >
              <div className={`w-6 h-6 rounded-full bg-white transition-transform ${showQuestionnaire ? 'translate-x-6' : ''}`} />
            </button>
          </div>
          <p className="text-gray-400 text-sm mb-4">
            Add predictions and life snapshots to see how you change over time
          </p>

          {showQuestionnaire && (
            <div className="space-y-4 mt-4">
              <div className="border-t border-white/10 pt-4">
                <h4 className="font-medium mb-3 text-purple-300">Future Predictions</h4>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm mb-1">How much money do you think you'll have?</label>
                    <input
                      type="text"
                      value={predictions.money}
                      onChange={(e) => setPredictions({...predictions, money: e.target.value})}
                      className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/20 focus:border-purple-500 focus:outline-none transition-colors text-sm"
                      placeholder="$50,000 per year..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm mb-1">What's your dream job?</label>
                    <input
                      type="text"
                      value={predictions.dreamJob}
                      onChange={(e) => setPredictions({...predictions, dreamJob: e.target.value})}
                      className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/20 focus:border-purple-500 focus:outline-none transition-colors text-sm"
                      placeholder="Software engineer at Google..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm mb-1">Who are your closest friends right now?</label>
                    <input
                      type="text"
                      value={predictions.closestFriends}
                      onChange={(e) => setPredictions({...predictions, closestFriends: e.target.value})}
                      className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/20 focus:border-purple-500 focus:outline-none transition-colors text-sm"
                      placeholder="Alex, Jordan, Taylor..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm mb-1">What games are you playing?</label>
                    <input
                      type="text"
                      value={predictions.currentGames}
                      onChange={(e) => setPredictions({...predictions, currentGames: e.target.value})}
                      className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/20 focus:border-purple-500 focus:outline-none transition-colors text-sm"
                      placeholder="Valorant, Minecraft, Elden Ring..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm mb-1">What do you think AI will be like?</label>
                    <textarea
                      value={predictions.aiPrediction}
                      onChange={(e) => setPredictions({...predictions, aiPrediction: e.target.value})}
                      rows={2}
                      className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/20 focus:border-purple-500 focus:outline-none transition-colors resize-none text-sm"
                      placeholder="AI will be able to..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm mb-1">Where do you think you'll live?</label>
                    <input
                      type="text"
                      value={predictions.location}
                      onChange={(e) => setPredictions({...predictions, location: e.target.value})}
                      className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/20 focus:border-purple-500 focus:outline-none transition-colors text-sm"
                      placeholder="San Francisco, Tokyo, London..."
                    />
                  </div>
                </div>
              </div>

              <div className="border-t border-white/10 pt-4">
                <h4 className="font-medium mb-3 text-purple-300">Life Snapshot</h4>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm mb-1">Favorite song</label>
                    <input
                      type="text"
                      value={lifeSnapshot.favoriteSong}
                      onChange={(e) => setLifeSnapshot({...lifeSnapshot, favoriteSong: e.target.value})}
                      className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/20 focus:border-purple-500 focus:outline-none transition-colors text-sm"
                      placeholder="Song name..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm mb-1">Favorite movie</label>
                    <input
                      type="text"
                      value={lifeSnapshot.favoriteMovie}
                      onChange={(e) => setLifeSnapshot({...lifeSnapshot, favoriteMovie: e.target.value})}
                      className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/20 focus:border-purple-500 focus:outline-none transition-colors text-sm"
                      placeholder="Movie name..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm mb-1">Favorite game</label>
                    <input
                      type="text"
                      value={lifeSnapshot.favoriteGame}
                      onChange={(e) => setLifeSnapshot({...lifeSnapshot, favoriteGame: e.target.value})}
                      className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/20 focus:border-purple-500 focus:outline-none transition-colors text-sm"
                      placeholder="Game name..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm mb-1">Current goals</label>
                    <textarea
                      value={lifeSnapshot.currentGoals}
                      onChange={(e) => setLifeSnapshot({...lifeSnapshot, currentGoals: e.target.value})}
                      rows={2}
                      className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/20 focus:border-purple-500 focus:outline-none transition-colors resize-none text-sm"
                      placeholder="Learn Spanish, get promoted, travel to Japan..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm mb-1">Daily routine</label>
                    <textarea
                      value={lifeSnapshot.dailyRoutine}
                      onChange={(e) => setLifeSnapshot({...lifeSnapshot, dailyRoutine: e.target.value})}
                      rows={2}
                      className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/20 focus:border-purple-500 focus:outline-none transition-colors resize-none text-sm"
                      placeholder="Wake up at 7am, coffee, gym, work..."
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsPublic(!isPublic)}
              className={`w-14 h-8 rounded-full p-1 transition-colors ${isPublic ? 'bg-purple-500' : 'bg-gray-600'}`}
            >
              <div className={`w-6 h-6 rounded-full bg-white transition-transform ${isPublic ? 'translate-x-6' : ''}`} />
            </button>
            <span className="text-sm">
              {isPublic ? (
                <span className="flex items-center gap-2">
                  <Eye className="w-4 h-4" /> Public (shown on board)
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <EyeOff className="w-4 h-4" /> Private (only you)
                </span>
              )}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setUsePassword(!usePassword)}
              className={`w-14 h-8 rounded-full p-1 transition-colors ${usePassword ? 'bg-purple-500' : 'bg-gray-600'}`}
            >
              <div className={`w-6 h-6 rounded-full bg-white transition-transform ${usePassword ? 'translate-x-6' : ''}`} />
            </button>
            <span className="text-sm">
              {usePassword ? (
                <span className="flex items-center gap-2">
                  <Lock className="w-4 h-4" /> Password Protected
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Unlock className="w-4 h-4" /> No Password
                </span>
              )}
            </span>
          </div>
        </div>

        {usePassword && (
          <div>
            <label className="block text-sm font-medium mb-2">Password *</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 focus:border-purple-500 focus:outline-none transition-colors"
              placeholder="Enter a password..."
              required
            />
          </div>
        )}

        <div className="flex gap-4">
          <button
            type="submit"
            className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg font-semibold hover:opacity-90 transition-opacity"
          >
            Create Capsule
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-3 rounded-lg bg-white/10 hover:bg-white/20 transition-colors font-semibold"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}

function CapsuleList({ capsules, onSelect, onDelete, onArchive }) {
  const [filter, setFilter] = useState('all')
  const [viewMode, setViewMode] = useState('grid') // 'grid' or 'timeline'

  const filteredCapsules = capsules.filter(capsule => {
    if (filter === 'all') return true
    if (filter === 'locked') return capsule.isLocked
    if (filter === 'unlocked') return !capsule.isLocked
    if (filter === 'ready') return isPast(new Date(capsule.unlockDate))
    return true
  }).filter(capsule => {
    // Filter out capsules that should be archived (ready for 2+ days)
    if (isPast(new Date(capsule.unlockDate))) {
      const unlockDate = new Date(capsule.unlockDate)
      const twoDaysAgo = new Date()
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2)
      return unlockDate >= twoDaysAgo
    }
    return true
  })

  // Group capsules by year for timeline view
  const capsulesByYear = filteredCapsules.reduce((acc, capsule) => {
    const year = new Date(capsule.createdAt).getFullYear()
    if (!acc[year]) acc[year] = []
    acc[year].push(capsule)
    return acc
  }, {})

  const sortedYears = Object.keys(capsulesByYear).sort((a, b) => b - a)

  if (capsules.length === 0) {
    return (
      <div className="glass rounded-2xl p-12 text-center">
        <MessageSquare className="w-16 h-16 mx-auto mb-4 text-gray-500" />
        <h3 className="text-xl font-semibold mb-2">No Capsules Yet</h3>
        <p className="text-gray-400 mb-6">Preserve your first moment to get started!</p>
      </div>
    )
  }

  return (
    <div>
      <div className="flex gap-2 mb-6 flex-wrap items-center">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-lg transition-colors ${filter === 'all' ? 'bg-purple-500' : 'bg-white/10 hover:bg-white/20'}`}
        >
          All
        </button>
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
        <div className="ml-auto flex gap-2">
          <button
            onClick={() => setViewMode('grid')}
            className={`px-4 py-2 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-purple-500' : 'bg-white/10 hover:bg-white/20'}`}
          >
            Grid
          </button>
          <button
            onClick={() => setViewMode('timeline')}
            className={`px-4 py-2 rounded-lg transition-colors ${viewMode === 'timeline' ? 'bg-purple-500' : 'bg-white/10 hover:bg-white/20'}`}
          >
            Timeline
          </button>
        </div>
      </div>

      {viewMode === 'timeline' ? (
        <div className="space-y-8">
          {sortedYears.map(year => (
            <div key={year}>
              <h3 className="text-2xl font-bold mb-4 text-purple-400">{year}</h3>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {capsulesByYear[year].map(capsule => (
                  <CapsuleCard
                    key={capsule.id}
                    capsule={capsule}
                    onSelect={() => onSelect(capsule)}
                    onDelete={() => onDelete(capsule.id)}
                    onArchive={() => onArchive(capsule.id)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredCapsules.map(capsule => (
            <CapsuleCard
              key={capsule.id}
              capsule={capsule}
              onSelect={() => onSelect(capsule)}
              onDelete={() => onDelete(capsule.id)}
              onArchive={() => onArchive(capsule.id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function CapsuleCard({ capsule, onSelect, onDelete, onArchive }) {
  const canOpen = isPast(new Date(capsule.unlockDate))
  const timeUntil = formatDistanceToNow(new Date(capsule.unlockDate), { addSuffix: true })

  return (
    <div 
      onClick={onSelect}
      className="glass rounded-xl p-6 hover:bg-white/15 transition-colors cursor-pointer group"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-2">
          {capsule.isLocked ? (
            <Lock className="w-5 h-5 text-yellow-400" />
          ) : (
            <Unlock className="w-5 h-5 text-green-400" />
          )}
          {!capsule.isPublic && (
            <EyeOff className="w-4 h-4 text-gray-400" />
          )}
        </div>
        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          {canOpen && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onArchive()
              }}
              className="text-orange-400 hover:text-orange-300"
            >
              Archive
            </button>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation()
              onDelete()
            }}
            className="text-red-400 hover:text-red-300"
          >
            Delete
          </button>
        </div>
      </div>

      <h3 className="font-semibold text-lg mb-2">{capsule.title}</h3>
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
          <span className="text-gray-400">Opens {timeUntil}</span>
        )}
      </div>

      <button
        onClick={(e) => {
          e.stopPropagation()
          onSelect()
        }}
        className="mt-4 w-full py-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors font-medium"
      >
        {canOpen ? 'Open Capsule' : 'View Details'}
      </button>
    </div>
  )
}

function ViewCapsule({ capsule, onBack, onDelete, passwordInput, setPasswordInput, onUnlock }) {
  const canOpen = isPast(new Date(capsule.unlockDate))
  const timeUntil = formatDistanceToNow(new Date(capsule.unlockDate), { addSuffix: true })

  if (!capsule.isUnlocked) {
    return (
      <div className="glass rounded-2xl p-8">
        <button onClick={onBack} className="mb-6 text-gray-400 hover:text-white transition-colors flex items-center gap-2">
          ← Back to capsules
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

        <button
          onClick={onDelete}
          className="mt-4 w-full py-3 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors font-medium"
        >
          Delete Capsule
        </button>
      </div>
    )
  }

  return (
    <div className="glass rounded-2xl p-8">
      <button onClick={onBack} className="mb-6 text-gray-400 hover:text-white transition-colors flex items-center gap-2">
        ← Back to capsules
      </button>

      <div className="text-center mb-8">
        <div className="w-20 h-20 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center mx-auto mb-4">
          <Sparkles className="w-10 h-10" />
        </div>
        <h2 className="text-3xl font-bold mb-2">{capsule.title}</h2>
        <p className="text-gray-400">Created {formatDistanceToNow(new Date(capsule.createdAt), { addSuffix: true })}</p>
      </div>

      <div className="bg-white/5 rounded-xl p-6 mb-8">
        <p className="text-lg leading-relaxed whitespace-pre-wrap">{capsule.message}</p>
      </div>

      {(capsule.predictions || capsule.lifeSnapshot) && (
        <div className="glass-dark rounded-xl p-6 mb-8">
          <h3 className="text-xl font-semibold mb-4 flex items-center gap-2 text-purple-300">
            <Sparkles className="w-5 h-5" />
            Who You Were Back Then
          </h3>
          
          {capsule.predictions && (
            <div className="mb-6">
              <h4 className="font-medium mb-3 text-purple-200">Your Predictions</h4>
              <div className="grid gap-3 text-sm">
                {capsule.predictions.money && (
                  <div className="bg-white/5 rounded-lg p-3">
                    <span className="text-gray-400">Money:</span>
                    <span className="ml-2">{capsule.predictions.money}</span>
                  </div>
                )}
                {capsule.predictions.dreamJob && (
                  <div className="bg-white/5 rounded-lg p-3">
                    <span className="text-gray-400">Dream Job:</span>
                    <span className="ml-2">{capsule.predictions.dreamJob}</span>
                  </div>
                )}
                {capsule.predictions.closestFriends && (
                  <div className="bg-white/5 rounded-lg p-3">
                    <span className="text-gray-400">Closest Friends:</span>
                    <span className="ml-2">{capsule.predictions.closestFriends}</span>
                  </div>
                )}
                {capsule.predictions.currentGames && (
                  <div className="bg-white/5 rounded-lg p-3">
                    <span className="text-gray-400">Games:</span>
                    <span className="ml-2">{capsule.predictions.currentGames}</span>
                  </div>
                )}
                {capsule.predictions.aiPrediction && (
                  <div className="bg-white/5 rounded-lg p-3">
                    <span className="text-gray-400">AI Prediction:</span>
                    <span className="ml-2">{capsule.predictions.aiPrediction}</span>
                  </div>
                )}
                {capsule.predictions.location && (
                  <div className="bg-white/5 rounded-lg p-3">
                    <span className="text-gray-400">Location:</span>
                    <span className="ml-2">{capsule.predictions.location}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {capsule.lifeSnapshot && (
            <div>
              <h4 className="font-medium mb-3 text-purple-200">Life Snapshot</h4>
              <div className="grid gap-3 text-sm">
                {capsule.lifeSnapshot.favoriteSong && (
                  <div className="bg-white/5 rounded-lg p-3">
                    <span className="text-gray-400">Favorite Song:</span>
                    <span className="ml-2">{capsule.lifeSnapshot.favoriteSong}</span>
                  </div>
                )}
                {capsule.lifeSnapshot.favoriteMovie && (
                  <div className="bg-white/5 rounded-lg p-3">
                    <span className="text-gray-400">Favorite Movie:</span>
                    <span className="ml-2">{capsule.lifeSnapshot.favoriteMovie}</span>
                  </div>
                )}
                {capsule.lifeSnapshot.favoriteGame && (
                  <div className="bg-white/5 rounded-lg p-3">
                    <span className="text-gray-400">Favorite Game:</span>
                    <span className="ml-2">{capsule.lifeSnapshot.favoriteGame}</span>
                  </div>
                )}
                {capsule.lifeSnapshot.currentGoals && (
                  <div className="bg-white/5 rounded-lg p-3">
                    <span className="text-gray-400">Goals:</span>
                    <span className="ml-2">{capsule.lifeSnapshot.currentGoals}</span>
                  </div>
                )}
                {capsule.lifeSnapshot.dailyRoutine && (
                  <div className="bg-white/5 rounded-lg p-3">
                    <span className="text-gray-400">Daily Routine:</span>
                    <span className="ml-2">{capsule.lifeSnapshot.dailyRoutine}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="flex gap-4">
        <button
          onClick={onDelete}
          className="flex-1 py-3 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors font-medium"
        >
          Delete Capsule
        </button>
        <button
          onClick={onBack}
          className="flex-1 py-3 rounded-lg bg-white/10 hover:bg-white/20 transition-colors font-medium"
        >
          Close
        </button>
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
    return null
  }

  return (
    <div className="grid grid-cols-4 gap-4 mt-8">
      {[
        { label: 'Days', value: timeLeft.days },
        { label: 'Hours', value: timeLeft.hours },
        { label: 'Minutes', value: timeLeft.minutes },
        { label: 'Seconds', value: timeLeft.seconds },
      ].map((item) => (
        <div key={item.label} className="glass-dark rounded-lg p-4 text-center">
          <div className="text-3xl font-bold text-purple-400">{String(item.value).padStart(2, '0')}</div>
          <div className="text-xs text-gray-400 mt-1">{item.label}</div>
        </div>
      ))}
    </div>
  )
}
