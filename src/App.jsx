import { useSelector } from 'react-redux';
import { Routes, Route, Navigate } from 'react-router-dom';
import AuthScreen from './pages/AuthScreen';
import DashboardScreen from './pages/DashboardScreen';
import DeckDetailScreen from './pages/DeckDetailScreen';
import StudyScreen from './pages/StudyScreen';

function PrivateRoute({ children }) {
  const token = useSelector((state) => state.auth.token);
  return token ? children : <Navigate to="/login" replace />;
}

function LoginRoute() {
  const token = useSelector((state) => state.auth.token);
  return token ? <Navigate to="/" replace /> : <AuthScreen />;
}

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginRoute />} />
      <Route
        path="/"
        element={
          <PrivateRoute>
            <DashboardScreen />
          </PrivateRoute>
        }
      />
      <Route
        path="/decks/:id"
        element={
          <PrivateRoute>
            <DeckDetailScreen />
          </PrivateRoute>
        }
      />
      <Route
        path="/study"
        element={
          <PrivateRoute>
            <StudyScreen />
          </PrivateRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;