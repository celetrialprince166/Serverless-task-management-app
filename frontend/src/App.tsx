import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { RequireAuth } from './components/auth/RequireAuth';
import { LoginPage } from './pages/Login';
import { SignupPage } from './pages/Signup';
import { ConfirmSignupPage } from './pages/ConfirmSignup';
import { LandingPage } from './pages/Landing';
import { Dashboard } from './pages/Dashboard';
import { TasksPage } from './pages/Tasks';
import { TeamPage } from './pages/Team';
import { SettingsPage } from './pages/Settings';

function App() {
    return (
        <AuthProvider>
        <Router>
        <Routes>
        <Route path= "/" element = {< LandingPage />} />
            < Route path = "/login" element = {< LoginPage />} />
                < Route path = "/signup" element = {< SignupPage />} />
                    < Route path = "/confirm-signup" element = {< ConfirmSignupPage />} />
                        < Route
path = "/dashboard"
element = {
              < RequireAuth >
    <Dashboard />
    </RequireAuth>
            }
          />
    < Route
path = "/tasks"
element = {
              < RequireAuth >
    <TasksPage />
    </RequireAuth>
            }
          />
    < Route
path = "/team"
element = {
              < RequireAuth >
    <TeamPage />
    </RequireAuth>
            }
          />
    < Route
path = "/settings"
element = {
              < RequireAuth >
    <SettingsPage />
    </RequireAuth>
            }
          />
    </Routes>
    </Router>
    </AuthProvider>
  );
}

export default App;
