import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { studyApi } from '../../services/studyApi';

const initialState = {
  todayCards: [],
  currentIndex: 0,
  isFinished: false,
  isLoading: false,
  error: null,
};

export const fetchTodayStudy = createAsyncThunk('study/fetchTodayStudy', async (deckId, { rejectWithValue }) => {
  try {
    const response = await studyApi.getToday(deckId);
    return response.data;
  } catch (error) {
    return rejectWithValue(error.response?.data || error.message);
  }
});

export const submitReview = createAsyncThunk('study/submitReview', async (reviewData, { rejectWithValue }) => {
  try {
    const response = await studyApi.review(reviewData);
    return response.data;
  } catch (error) {
    return rejectWithValue(error.response?.data || error.message);
  }
});

const studySlice = createSlice({
  name: 'study',
  initialState,
  reducers: {
    nextCard(state) {
      if (state.currentIndex < state.todayCards.length - 1) {
        state.currentIndex += 1;
      } else {
        state.isFinished = true;
      }
    },
    resetStudyState(state) {
      state.todayCards = [];
      state.currentIndex = 0;
      state.isFinished = false;
      state.isLoading = false;
      state.error = null;
    },
    clearStudyError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchTodayStudy.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchTodayStudy.fulfilled, (state, action) => {
        state.isLoading = false;
        state.todayCards = action.payload;
        state.currentIndex = 0;
        state.isFinished = Array.isArray(action.payload) && action.payload.length === 0;
      })
      .addCase(fetchTodayStudy.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || action.error.message;
      })
      .addCase(submitReview.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(submitReview.fulfilled, (state) => {
        state.isLoading = false;
        if (state.currentIndex < state.todayCards.length - 1) {
          state.currentIndex += 1;
        } else {
          state.isFinished = true;
        }
      })
      .addCase(submitReview.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || action.error.message;
      });
  },
});

export const { nextCard, resetStudyState, clearStudyError } = studySlice.actions;
export default studySlice.reducer;
