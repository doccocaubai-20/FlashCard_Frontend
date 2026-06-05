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
import FreeWriteScreen from './pages/FreeWriteScreen';
import QuizScreen from './pages/QuizScreen';
import GameScreen from './pages/GameScreen';
import RadicalScreen from './pages/RadicalScreen';
import PinyinScreen from './pages/PinyinScreen';
import GrammarScreen from './pages/GrammarScreen';
import DialogueScreen from './pages/DialogueScreen';
import DictationScreen from './pages/DictationScreen';
import MatchingGameScreen from './pages/MatchingGameScreen';
import TranslationPlaygroundScreen from './pages/TranslationPlaygroundScreen';
import VocabularyNotebookScreen from './pages/VocabularyNotebookScreen';
import SpeakingScreen from './pages/SpeakingScreen';
import UnscrambleGameScreen from './pages/UnscrambleGameScreen';
import FallingWordsGameScreen from './pages/FallingWordsGameScreen';
import StudyHubScreen from './pages/StudyHubScreen';
import GameArcadeScreen from './pages/GameArcadeScreen';
import ReferenceHubScreen from './pages/ReferenceHubScreen';
import LeaderboardScreen from './pages/LeaderboardScreen';
import AdminScreen from './pages/AdminScreen';
import StatsScreen from './pages/StatsScreen';

function PrivateRoute({ children }) {
  const token = useSelector((state) => state.auth.token);
  return token ? children : <Navigate to="/login" replace />;
}

function AdminRoute({ children }) {
  const user = useSelector((state) => state.auth.user);
  return user?.role === 'ADMIN' ? children : <Navigate to="/" replace />;
}

function LoginRoute() {
  const token = useSelector((state) => state.auth.token);
  return token ? <Navigate to="/" replace /> : <AuthScreen />;
}

function App() {
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
        <Route path="/decks/:id/game" element={<GameScreen />} />
        <Route path="/decks/:id/quiz" element={<QuizScreen />} />
        <Route path="/decks/:id/dictation" element={<DictationScreen />} />
        <Route path="/study" element={<StudyScreen />} />
        <Route path="/flashcards/new" element={<CreateFlashcardScreen />} />
        <Route path="/dictionary" element={<DictionaryScreen />} />
        <Route path="/write" element={<FreeWriteScreen />} />
        <Route path="/radicals" element={<RadicalScreen />} />
        <Route path="/pinyin" element={<PinyinScreen />} />
        <Route path="/grammar" element={<GrammarScreen />} />
        <Route path="/dialogues" element={<DialogueScreen />} />
        <Route path="/speaking" element={<SpeakingScreen />} />
        <Route path="/games/unscramble" element={<UnscrambleGameScreen />} />
        <Route path="/games/falling" element={<FallingWordsGameScreen />} />
        <Route path="/games/matching" element={<MatchingGameScreen />} />
        <Route path="/study-hub" element={<StudyHubScreen />} />
        <Route path="/game-arcade" element={<GameArcadeScreen />} />
        <Route path="/reference-hub" element={<ReferenceHubScreen />} />
        <Route path="/translation" element={<TranslationPlaygroundScreen />} />
        <Route path="/notebook" element={<VocabularyNotebookScreen />} />
        <Route path="/leaderboard" element={<LeaderboardScreen />} />
        <Route path="/stats" element={<StatsScreen />} />
        <Route path="/admin" element={
          <AdminRoute>
            <AdminScreen />
          </AdminRoute>
        } />
        <Route path="/settings" element={<SettingsScreen />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;