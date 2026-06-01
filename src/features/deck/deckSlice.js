import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { deckApi } from '../../services/deckApi';
import { flashcardApi } from '../../services/flashcardApi';

const initialState = {
  decks: [],
  currentDeck: null,
  flashcards: [],
  isLoading: false,
  error: null,
};

export const fetchAllDecks = createAsyncThunk('deck/fetchAllDecks', async (_, { rejectWithValue }) => {
  try {
    const response = await deckApi.getDecks();
    return response.data;
  } catch (error) {
    return rejectWithValue(error.response?.data || error.message);
  }
});

export const fetchDeckDetails = createAsyncThunk('deck/fetchDeckDetails', async (deckId, { rejectWithValue }) => {
  try {
    const response = await deckApi.getDeckById(deckId);
    return response.data;
  } catch (error) {
    return rejectWithValue(error.response?.data || error.message);
  }
});

export const fetchFlashcardsByDeck = createAsyncThunk('deck/fetchFlashcardsByDeck', async (deckId, { rejectWithValue }) => {
  try {
    const response = await flashcardApi.getByDeck(deckId);
    return response.data;
  } catch (error) {
    return rejectWithValue(error.response?.data || error.message);
  }
});

export const importFlashcards = createAsyncThunk('deck/importFlashcards', async (importData, { rejectWithValue }) => {
  try {
    const response = await flashcardApi.bulkImport(importData);
    return response.data;
  } catch (error) {
    return rejectWithValue(error.response?.data || error.message);
  }
});

const deckSlice = createSlice({
  name: 'deck',
  initialState,
  reducers: {
    clearDeckError(state) {
      state.error = null;
    },
    resetDeckState(state) {
      state.decks = [];
      state.currentDeck = null;
      state.flashcards = [];
      state.isLoading = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAllDecks.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchAllDecks.fulfilled, (state, action) => {
        state.isLoading = false;
        state.decks = action.payload;
      })
      .addCase(fetchAllDecks.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || action.error.message;
      })
      .addCase(fetchDeckDetails.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchDeckDetails.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentDeck = action.payload;
      })
      .addCase(fetchDeckDetails.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || action.error.message;
      })
      .addCase(fetchFlashcardsByDeck.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchFlashcardsByDeck.fulfilled, (state, action) => {
        state.isLoading = false;
        state.flashcards = action.payload;
      })
      .addCase(fetchFlashcardsByDeck.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || action.error.message;
      })
      .addCase(importFlashcards.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(importFlashcards.fulfilled, (state, action) => {
        state.isLoading = false;
        if (Array.isArray(action.payload)) {
          state.flashcards = action.payload;
        }
      })
      .addCase(importFlashcards.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || action.error.message;
      });
  },
});

export const { clearDeckError, resetDeckState } = deckSlice.actions;
export default deckSlice.reducer;
