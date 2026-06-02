import { useSelector } from 'react-redux';
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/common/Layout';
import AuthScreen from './pages/AuthScreen';
import DashboardScreen from './pages/DashboardScreen';
import DeckListScreen from './pages/DeckListScreen';
import DeckDetailScreen from './pages/DeckDetailScreen';
import StudyScreen from './pages/StudyScreen';
import CreateFlashcardScreen from './pages/CreateFlashcardScreen';
import SettingsScreen from './pages/SettingsScreen';
import DictionaryScreen from './pages/DictionaryScreen';
import { useDictionary } from './hooks/useDictionary';

function PrivateRoute({ children }) {
  const token = useSelector((state) => state.auth.token);
  return token ? children : <Navigate to="/login" replace />;
}

function LoginRoute() {
  const token = useSelector((state) => state.auth.token);
  return token ? <Navigate to="/" replace /> : <AuthScreen />;
}

function App() {
  // Preload and cache the dictionary in the background on app startup
  useDictionary();

  return (
    <Routes>
      <Route path="/login" element={<LoginRoute />} />
      
      {/* Protected Routes wrapped in Layout */}
      <Route
        element={
          <PrivateRoute>
            <Layout />
          </PrivateRoute>
        }
      >
        <Route path="/" element={<DashboardScreen />} />
        <Route path="/decks" element={<DeckListScreen />} />
        <Route path="/decks/:id" element={<DeckDetailScreen />} />
        <Route path="/study" element={<StudyScreen />} />
        <Route path="/flashcards/new" element={<CreateFlashcardScreen />} />
        <Route path="/dictionary" element={<DictionaryScreen />} />
        <Route path="/settings" element={<SettingsScreen />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;