import { useSelector } from 'react-redux';
import { Routes, Route, Navigate } from 'react-router-dom';
import React, { Suspense } from 'react';
import Layout from './components/common/Layout';
import AuthScreen from './pages/AuthScreen';
import DashboardScreen from './pages/DashboardScreen';
import DeckListScreen from './pages/DeckListScreen';
import DeckDetailScreen from './pages/DeckDetailScreen';
import StudyScreen from './pages/StudyScreen';
import CreateFlashcardScreen from './pages/CreateFlashcardScreen';
import SettingsScreen from './pages/SettingsScreen';
import FreeWriteScreen from './pages/FreeWriteScreen';
import QuizScreen from './pages/QuizScreen';
import GameScreen from './pages/GameScreen';
import RadicalScreen from './pages/RadicalScreen';
import PinyinScreen from './pages/PinyinScreen';
import DictationScreen from './pages/DictationScreen';
import MatchingGameScreen from './pages/MatchingGameScreen';
import VocabularyNotebookScreen from './pages/VocabularyNotebookScreen';
import ScribbleWriteScreen from './pages/ScribbleWriteScreen';
import FallingWordsGameScreen from './pages/FallingWordsGameScreen';
import StudyHubScreen from './pages/StudyHubScreen';
import GameArcadeScreen from './pages/GameArcadeScreen';
import ReferenceHubScreen from './pages/ReferenceHubScreen';
import LeaderboardScreen from './pages/LeaderboardScreen';
import AdminScreen from './pages/AdminScreen';
import StatsScreen from './pages/StatsScreen';
import SynonymComparisonScreen from './pages/SynonymComparisonScreen';
import ChatbotScreen from './pages/ChatbotScreen';
import HskExamListScreen from './pages/HskExamListScreen';
import HskExamPlayerScreen from './pages/HskExamPlayerScreen';

// Lazy-loaded pages (heavy data files — only download when user visits)
const GrammarScreen = React.lazy(() => import('./pages/GrammarScreen'));
const DialogueScreen = React.lazy(() => import('./pages/DialogueScreen'));
const TranslationPlaygroundScreen = React.lazy(() => import('./pages/TranslationPlaygroundScreen'));
const SpeakingScreen = React.lazy(() => import('./pages/SpeakingScreen'));
const FreestyleSpeakingScreen = React.lazy(() => import('./pages/FreestyleSpeakingScreen'));
const DictionaryScreen = React.lazy(() => import('./pages/DictionaryScreen'));
const UnscrambleGameScreen = React.lazy(() => import('./pages/UnscrambleGameScreen'));
const EnglishHubScreen = React.lazy(() => import('./pages/EnglishHubScreen'));
const WritingNotebookScreen = React.lazy(() => import('./pages/WritingNotebookScreen'));
const PrintFlashcardScreen = React.lazy(() => import('./pages/PrintFlashcardScreen'));
const VideoListScreen = React.lazy(() => import('./pages/VideoListScreen'));
const VideoPlayerScreen = React.lazy(() => import('./pages/VideoPlayerScreen'));

// Loading spinner for lazy pages
function LazyFallback() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 border-3 border-primary/30 border-t-primary rounded-full animate-spin" />
        <span className="text-xs font-semibold text-mute">Đang tải trang...</span>
      </div>
    </div>
  );
}

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
        <Route path="/synonyms" element={<SynonymComparisonScreen />} />
        <Route path="/write" element={<FreeWriteScreen />} />
        <Route path="/scribble-write" element={<ScribbleWriteScreen />} />
        <Route path="/radicals" element={<RadicalScreen />} />
        <Route path="/pinyin" element={<PinyinScreen />} />
        <Route path="/games/falling" element={<FallingWordsGameScreen />} />
        <Route path="/games/matching" element={<MatchingGameScreen />} />
        <Route path="/study-hub" element={<StudyHubScreen />} />
        <Route path="/game-arcade" element={<GameArcadeScreen />} />
        <Route path="/reference-hub" element={<ReferenceHubScreen />} />
        <Route path="/notebook" element={<VocabularyNotebookScreen />} />
        <Route path="/leaderboard" element={<LeaderboardScreen />} />
        <Route path="/stats" element={<StatsScreen />} />
        <Route path="/admin" element={
          <AdminRoute>
            <AdminScreen />
          </AdminRoute>
        } />
        <Route path="/chat" element={<ChatbotScreen />} />
        <Route path="/hsk-exams" element={<HskExamListScreen />} />
        <Route path="/hsk-exams/:id/play" element={<HskExamPlayerScreen />} />
        <Route path="/settings" element={<SettingsScreen />} />

        {/* Lazy-loaded routes (heavy data) */}
        <Route path="/grammar" element={<Suspense fallback={<LazyFallback />}><GrammarScreen /></Suspense>} />
        <Route path="/dictionary" element={<Suspense fallback={<LazyFallback />}><DictionaryScreen /></Suspense>} />
        <Route path="/dialogues" element={<Suspense fallback={<LazyFallback />}><DialogueScreen /></Suspense>} />
        <Route path="/speaking" element={<Suspense fallback={<LazyFallback />}><SpeakingScreen /></Suspense>} />
        <Route path="/speaking-sandbox" element={<Suspense fallback={<LazyFallback />}><FreestyleSpeakingScreen /></Suspense>} />
        <Route path="/translation" element={<Suspense fallback={<LazyFallback />}><TranslationPlaygroundScreen /></Suspense>} />
        <Route path="/games/unscramble" element={<Suspense fallback={<LazyFallback />}><UnscrambleGameScreen /></Suspense>} />
        <Route path="/english-hub" element={<Suspense fallback={<LazyFallback />}><EnglishHubScreen /></Suspense>} />
        <Route path="/writing-notebook" element={<Suspense fallback={<LazyFallback />}><WritingNotebookScreen /></Suspense>} />
        <Route path="/print-cards" element={<Suspense fallback={<LazyFallback />}><PrintFlashcardScreen /></Suspense>} />
        <Route path="/video" element={<Suspense fallback={<LazyFallback />}><VideoListScreen /></Suspense>} />
        <Route path="/video/:id" element={<Suspense fallback={<LazyFallback />}><VideoPlayerScreen /></Suspense>} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;