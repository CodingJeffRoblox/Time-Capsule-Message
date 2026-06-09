import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import Navigation from './components/Navigation'
import Home from './pages/Home'
import Login from './pages/Login'
import Profile from './pages/Profile'
import MessageBoard from './pages/MessageBoard'
import Archived from './pages/Archived'
import UserProfile from './pages/UserProfile'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <BrowserRouter>
        <div className="min-h-screen text-white">
          <Navigation />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/archived" element={<Archived />} />
            <Route path="/board" element={<MessageBoard />} />
            <Route path="/user/:userId" element={<UserProfile />} />
          </Routes>
        </div>
      </BrowserRouter>
    </AuthProvider>
  </React.StrictMode>,
)
