import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Properties from './pages/Properties';
import PropertyDetail from './pages/PropertyDetail';
import Dashboard from './pages/Dashboard';
import Investments from './pages/Investments';
import Search from './pages/Search';
import ApiOnboarding from './pages/ApiOnboarding';
import ApiIntegrations from './pages/ApiIntegrations';
import BrochureUpload from './pages/BrochureUpload';
import AiAssistant from './pages/AiAssistant';

export default function App() {
  return (
    <div className="app">
      <Navbar />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/properties" element={<Properties />} />
          <Route path="/properties/:id" element={<PropertyDetail />} />
          <Route path="/search" element={<Search />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/investments"
            element={
              <ProtectedRoute>
                <Investments />
              </ProtectedRoute>
            }
          />
          <Route
            path="/api-onboarding"
            element={
              <ProtectedRoute>
                <ApiOnboarding />
              </ProtectedRoute>
            }
          />
          <Route
            path="/api-integrations"
            element={
              <ProtectedRoute>
                <ApiIntegrations />
              </ProtectedRoute>
            }
          />
          <Route
            path="/brochures"
            element={
              <ProtectedRoute>
                <BrochureUpload />
              </ProtectedRoute>
            }
          />
          <Route
            path="/ai-assistant"
            element={
              <ProtectedRoute>
                <AiAssistant />
              </ProtectedRoute>
            }
          />
        </Routes>
      </main>
    </div>
  );
}
