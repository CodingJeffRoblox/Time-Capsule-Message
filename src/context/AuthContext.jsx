import { createContext, useContext, useEffect, useState } from 'react'
import { auth, database } from '../firebase'
import { onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup, signOut, updateProfile } from 'firebase/auth'
import { ref, set } from 'firebase/database'

const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user)
      setLoading(false)
    })
    return unsubscribe
  }, [])

  const login = async (email, password) => {
    return signInWithEmailAndPassword(auth, email, password)
  }

  const signup = async (email, password, profileData = {}) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password)
    
    // Update Firebase Auth profile with username
    if (profileData.username) {
      await updateProfile(userCredential.user, {
        displayName: profileData.username
      })
    }
    
    // Store additional profile data in Firebase Database
    if (profileData.username || profileData.dob || profileData.bio) {
      await set(ref(database, `users/${userCredential.user.uid}`), {
        displayName: profileData.username || '',
        dob: profileData.dob || '',
        bio: profileData.bio || '',
        createdAt: new Date().toISOString()
      })
    }
    
    return userCredential
  }

  const googleLogin = async (provider) => {
    return signInWithPopup(auth, provider)
  }

  const logout = async () => {
    return signOut(auth)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, googleLogin, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
