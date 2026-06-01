import { configureStore } from '@reduxjs/toolkit';
import authReducer from './features/auth/authSlice';
import deckReducer from './features/deck/deckSlice';
import studyReducer from './features/study/studySlice';
import statsReducer from './features/stats/statsSlice';

const store = configureStore({
  reducer: {
    auth: authReducer,
    deck: deckReducer,
    study: studyReducer,
    stats: statsReducer,
  },
});

export default store;
