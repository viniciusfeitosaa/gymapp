import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import PersonalDashboard from './pages/PersonalDashboard';
import StudentDashboard from './pages/StudentDashboard';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <AuthProvider>
      <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          
          {/* Rotas do Personal */}
          <Route
            path="/personal/*"
            element={
              <ProtectedRoute userType="personal">
                <PersonalDashboard />
              </ProtectedRoute>
            }
          />
          
          {/* Rotas do Aluno */}
          <Route
            path="/student/*"
            element={
              <ProtectedRoute userType="student">
                <StudentDashboard />
              </ProtectedRoute>
            }
          />
          
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
