import { useState } from 'react'
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { Toaster } from 'react-hot-toast'
import Navbar from './components/layout/Navbar'
import LoadingScreen from './components/ui/LoadingScreen'
import ErrorBoundary from './components/ui/ErrorBoundary'
import GlobalAlertBanner from './components/ui/GlobalAlertBanner'
import PremiumEffectsCore from './components/ui/PremiumEffectsCore'
import Landing from './pages/Landing'
import Dashboard from './pages/Dashboard'
import Assistant from './pages/Assistant'
import Analytics from './pages/Analytics'
import Alerts from './pages/Alerts'
import MapPage from './pages/MapPage'
import Admin from './pages/Admin'
import Login from './pages/Login'
import Hub from './pages/Hub'
import Calculator from './pages/Calculator'
import Sandbox from './pages/Sandbox'
import News from './pages/News'
import Iot from './pages/Iot'
import Quiz from './pages/Quiz'
import Notifications from './pages/Notifications'
import Profile from './pages/Profile'
import GreenInvest from './pages/GreenInvest'
import EmergencyCommand from './pages/EmergencyCommand'
import Footprint from './pages/Footprint'
import ProtectedRoute from './components/layout/ProtectedRoute'
import AdminRoute from './components/layout/AdminRoute'
import { WeatherProvider } from './context/WeatherContext'
import { AuthProvider } from './context/AuthContext'
import { SocketProvider } from './context/SocketContext'
import { ThemeProvider } from './context/ThemeContext'
import CosmosOrrery from './components/ui/CosmosOrrery'

function AnimatedRoutes() {
  const location = useLocation()
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/assistant" element={<ProtectedRoute><Assistant /></ProtectedRoute>} />
        <Route path="/analytics" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
        <Route path="/alerts" element={<ProtectedRoute><Alerts /></ProtectedRoute>} />
        <Route path="/map" element={<ProtectedRoute><MapPage /></ProtectedRoute>} />
        <Route path="/hub" element={<ProtectedRoute><Hub /></ProtectedRoute>} />
        <Route path="/calculator" element={<ProtectedRoute><Calculator /></ProtectedRoute>} />
        <Route path="/sandbox" element={<ProtectedRoute><Sandbox /></ProtectedRoute>} />
        <Route path="/news" element={<ProtectedRoute><News /></ProtectedRoute>} />
        <Route path="/iot" element={<ProtectedRoute><Iot /></ProtectedRoute>} />
        <Route path="/quiz" element={<ProtectedRoute><Quiz /></ProtectedRoute>} />
        <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/profile/:userId" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/invest" element={<ProtectedRoute><GreenInvest /></ProtectedRoute>} />
        <Route path="/emergency" element={<ProtectedRoute><EmergencyCommand /></ProtectedRoute>} />
        <Route path="/footprint" element={<ProtectedRoute><Footprint /></ProtectedRoute>} />
        <Route path="/admin" element={<AdminRoute><Admin /></AdminRoute>} />
      </Routes>
    </AnimatePresence>
  )
}

export default function App() {
  const [appReady, setAppReady] = useState(false)

  return (
    <ErrorBoundary>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <AuthProvider>
          <SocketProvider>
            <ThemeProvider>
            <WeatherProvider>
              <AnimatePresence mode="wait">
                {!appReady && (
                  <LoadingScreen key="loader" onComplete={() => setAppReady(true)} />
                )}
              </AnimatePresence>

              {appReady && (
                <div className="min-h-screen bg-dark-900 flex flex-col overflow-x-hidden w-full max-w-[100vw]">
                  <GlobalAlertBanner />
                  <PremiumEffectsCore />
                  <Navbar />
                  <div className="flex-1 w-full">
                    <AnimatedRoutes />
                  </div>
                  <Toaster
                    position="top-right"
                    toastOptions={{
                      style: {
                        background: 'rgba(4, 13, 26, 0.95)',
                        color: '#fff',
                        border: '1px solid rgba(0,212,255,0.2)',
                        backdropFilter: 'blur(20px)',
                        fontFamily: 'Inter, sans-serif',
                        fontSize: '14px',
                        zIndex: 9999,
                      },
                      success: { iconTheme: { primary: '#06ffd4', secondary: '#040d1a' } },
                      error: { iconTheme: { primary: '#ff4444', secondary: '#040d1a' } },
                    }}
                  />
                  <CosmosOrrery />
                </div>
              )}
            </WeatherProvider>
            </ThemeProvider>
          </SocketProvider>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  )
}
