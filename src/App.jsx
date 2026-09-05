import { useSelector } from 'react-redux';
import { Routes, Route, Navigate } from 'react-router-dom';
import React, { Suspense } from 'react';
import Layout from './components/common/Layout';
// Critical entry routes (eagerly loaded)
import LandingScreen from './pages/LandingScreen';
import OnboardingScreen from './pages/OnboardingScreen';
import AuthScreen from './pages/AuthScreen';
import DashboardScreen from './pages/DashboardScreen';
import DeckListScreen from './pages/DeckListScreen';
import DeckDetailScreen from './pages/DeckDetailScreen';
import StudyScreen from './pages/StudyScreen';
import DictionaryScreen from './pages/DictionaryScreen';

// Lazy-loaded routes (secondary, mini-games, specialized tools, and heavy media)
const StatsScreen = React.lazy(() => import('./pages/StatsScreen'));
const LeaderboardScreen = React.lazy(() => import('./pages/LeaderboardScreen'));
const AdminScreen = React.lazy(() => import('./pages/AdminScreen'));
const SettingsScreen = React.lazy(() => import('./pages/SettingsScreen'));
const CreateFlashcardScreen = React.lazy(() => import('./pages/CreateFlashcardScreen'));

// Mini-games
const GameScreen = React.lazy(() => import('./pages/GameScreen'));
const GameArcadeScreen = React.lazy(() => import('./pages/GameArcadeScreen'));
const MatchingGameScreen = React.lazy(() => import('./pages/MatchingGameScreen'));
const FallingWordsGameScreen = React.lazy(() => import('./pages/FallingWordsGameScreen'));
const QuizScreen = React.lazy(() => import('./pages/QuizScreen'));
const UnscrambleGameScreen = React.lazy(() => import('./pages/UnscrambleGameScreen'));

// Specialized tools & practice hubs
const RadicalScreen = React.lazy(() => import('./pages/RadicalScreen'));
const PinyinScreen = React.lazy(() => import('./pages/PinyinScreen'));
const DictationScreen = React.lazy(() => import('./pages/DictationScreen'));
const FreeWriteScreen = React.lazy(() => import('./pages/FreeWriteScreen'));
const ScribbleWriteScreen = React.lazy(() => import('./pages/ScribbleWriteScreen'));
const VocabularyNotebookScreen = React.lazy(() => import('./pages/VocabularyNotebookScreen'));
const SynonymComparisonScreen = React.lazy(() => import('./pages/SynonymComparisonScreen'));
const ChatbotScreen = React.lazy(() => import('./pages/ChatbotScreen'));
const HskExamListScreen = React.lazy(() => import('./pages/HskExamListScreen'));
const HskExamPlayerScreen = React.lazy(() => import('./pages/HskExamPlayerScreen'));
const ReferenceHubScreen = React.lazy(() => import('./pages/ReferenceHubScreen'));
const StudyHubScreen = React.lazy(() => import('./pages/StudyHubScreen'));

// Heavy data & media features
const GrammarScreen = React.lazy(() => import('./pages/GrammarScreen'));
const DialogueScreen = React.lazy(() => import('./pages/DialogueScreen'));
const TranslationPlaygroundScreen = React.lazy(() => import('./pages/TranslationPlaygroundScreen'));
const SpeakingScreen = React.lazy(() => import('./pages/SpeakingScreen'));
const FreestyleSpeakingScreen = React.lazy(() => import('./pages/FreestyleSpeakingScreen'));
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
  return user?.role === 'ADMIN' ? children : <Navigate to="/dashboard" replace />;
}

function LoginRoute() {
  const token = useSelector((state) => state.auth.token);
  return token ? <Navigate to="/dashboard" replace /> : <AuthScreen />;
}

function RootRoute() {
  const token = useSelector((state) => state.auth.token);
  return !token ? <LandingScreen /> : <Navigate to="/dashboard" replace />;
}

function App() {
  return (
    <Routes>
      {/* Public Landing Page at / (unauthenticated) or redirect to /dashboard (authenticated) */}
      <Route path="/" element={<RootRoute />} />
      <Route path="/login" element={<LoginRoute />} />
      <Route path="/register" element={<LoginRoute />} />

      {/* Onboarding Flow: Protected by PrivateRoute */}
      <Route
        path="/onboarding"
        element={
          <PrivateRoute>
            <OnboardingScreen />
          </PrivateRoute>
        }
      />

      {/* Protected Routes wrapped in Layout */}
      <Route
        element={
          <PrivateRoute>
            <Layout />
          </PrivateRoute>
        }
      >
        <Route path="/dashboard" element={<DashboardScreen />} />
        <Route path="/decks" element={<DeckListScreen />} />
        <Route path="/decks/:id" element={<DeckDetailScreen />} />
        <Route path="/decks/:id/game" element={<Suspense fallback={<LazyFallback />}><GameScreen /></Suspense>} />
        <Route path="/decks/:id/quiz" element={<Suspense fallback={<LazyFallback />}><QuizScreen /></Suspense>} />
        <Route path="/decks/:id/dictation" element={<Suspense fallback={<LazyFallback />}><DictationScreen /></Suspense>} />
        <Route path="/study" element={<StudyScreen />} />
        <Route path="/flashcards/new" element={<Suspense fallback={<LazyFallback />}><CreateFlashcardScreen /></Suspense>} />
        <Route path="/synonyms" element={<Suspense fallback={<LazyFallback />}><SynonymComparisonScreen /></Suspense>} />
        <Route path="/write" element={<Suspense fallback={<LazyFallback />}><FreeWriteScreen /></Suspense>} />
        <Route path="/scribble-write" element={<Suspense fallback={<LazyFallback />}><ScribbleWriteScreen /></Suspense>} />
        <Route path="/radicals" element={<Suspense fallback={<LazyFallback />}><RadicalScreen /></Suspense>} />
        <Route path="/pinyin" element={<Suspense fallback={<LazyFallback />}><PinyinScreen /></Suspense>} />
        <Route path="/games/falling" element={<Suspense fallback={<LazyFallback />}><FallingWordsGameScreen /></Suspense>} />
        <Route path="/games/matching" element={<Suspense fallback={<LazyFallback />}><MatchingGameScreen /></Suspense>} />
        <Route path="/study-hub" element={<Suspense fallback={<LazyFallback />}><StudyHubScreen /></Suspense>} />
        <Route path="/game-arcade" element={<Suspense fallback={<LazyFallback />}><GameArcadeScreen /></Suspense>} />
        <Route path="/reference-hub" element={<Suspense fallback={<LazyFallback />}><ReferenceHubScreen /></Suspense>} />
        <Route path="/notebook" element={<Suspense fallback={<LazyFallback />}><VocabularyNotebookScreen /></Suspense>} />
        <Route path="/leaderboard" element={<Suspense fallback={<LazyFallback />}><LeaderboardScreen /></Suspense>} />
        <Route path="/stats" element={<Suspense fallback={<LazyFallback />}><StatsScreen /></Suspense>} />
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <Suspense fallback={<LazyFallback />}>
                <AdminScreen />
              </Suspense>
            </AdminRoute>
          }
        />
        <Route path="/chat" element={<Suspense fallback={<LazyFallback />}><ChatbotScreen /></Suspense>} />
        <Route path="/hsk-exams" element={<Suspense fallback={<LazyFallback />}><HskExamListScreen /></Suspense>} />
        <Route path="/hsk-exams/:id/play" element={<Suspense fallback={<LazyFallback />}><HskExamPlayerScreen /></Suspense>} />
        <Route path="/settings" element={<Suspense fallback={<LazyFallback />}><SettingsScreen /></Suspense>} />

        {/* Lazy-loaded routes (heavy data & specialized tools) */}
        <Route path="/grammar" element={<Suspense fallback={<LazyFallback />}><GrammarScreen /></Suspense>} />
        <Route path="/dictionary" element={<DictionaryScreen />} />
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