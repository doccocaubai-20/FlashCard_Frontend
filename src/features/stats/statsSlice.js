import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { statsApi } from '../../services/statsApi';

const initialState = {
  summary: null,
  heatmapData: [],
  badges: [],
  goals: null,
  isLoading: false,
  error: null,
};

export const fetchSummary = createAsyncThunk('stats/fetchSummary', async (_, { rejectWithValue }) => {
  try {
    const response = await statsApi.getSummary();
    return response.data;
  } catch (error) {
    return rejectWithValue(error.response?.data || error.message);
  }
});

export const fetchHeatmap = createAsyncThunk('stats/fetchHeatmap', async (_, { rejectWithValue }) => {
  try {
    const response = await statsApi.getHeatmap();
    return response.data;
  } catch (error) {
    return rejectWithValue(error.response?.data || error.message);
  }
});

export const fetchBadges = createAsyncThunk('stats/fetchBadges', async (_, { rejectWithValue }) => {
  try {
    const response = await statsApi.getBadges();
    return response.data;
  } catch (error) {
    return rejectWithValue(error.response?.data || error.message);
  }
});

const statsSlice = createSlice({
  name: 'stats',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchSummary.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchSummary.fulfilled, (state, action) => {
        state.isLoading = false;
        state.summary = action.payload;
      })
      .addCase(fetchSummary.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || action.error.message;
      })
      .addCase(fetchHeatmap.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchHeatmap.fulfilled, (state, action) => {
        state.isLoading = false;
        state.heatmapData = action.payload;
      })
      .addCase(fetchHeatmap.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || action.error.message;
      })
      .addCase(fetchBadges.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchBadges.fulfilled, (state, action) => {
        state.isLoading = false;
        state.badges = action.payload;
      })
      .addCase(fetchBadges.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || action.error.message;
      });
  },
});

export default statsSlice.reducer;
