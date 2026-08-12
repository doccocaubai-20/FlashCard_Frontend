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

export const createDeck = createAsyncThunk('deck/createDeck', async (deckData, { rejectWithValue }) => {
  try {
    const response = await deckApi.createDeck(deckData);
    return response.data;
  } catch (error) {
    return rejectWithValue(error.response?.data || error.message);
  }
});

export const updateDeck = createAsyncThunk('deck/updateDeck', async ({ id, data }, { rejectWithValue }) => {
  try {
    const response = await deckApi.updateDeck(id, data);
    return response.data;
  } catch (error) {
    return rejectWithValue(error.response?.data || error.message);
  }
});

export const deleteDeck = createAsyncThunk('deck/deleteDeck', async (id, { rejectWithValue }) => {
  try {
    await deckApi.deleteDeck(id);
    return id;
  } catch (error) {
    return rejectWithValue(error.response?.data || error.message);
  }
});

export const deleteFlashcard = createAsyncThunk('deck/deleteFlashcard', async (id, { rejectWithValue }) => {
  try {
    await flashcardApi.delete(id);
    return id;
  } catch (error) {
    return rejectWithValue(error.response?.data || error.message);
  }
});

export const createFlashcard = createAsyncThunk('deck/createFlashcard', async (cardData, { rejectWithValue }) => {
  try {
    const response = await flashcardApi.create(cardData);
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
    clearCurrentDeck(state) {
      state.currentDeck = null;
      state.flashcards = [];
      state.error = null;
      state.isLoading = true; // Set isLoading to true immediately when starting to fetch a new deck details
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
      })
      .addCase(createDeck.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createDeck.fulfilled, (state, action) => {
        state.isLoading = false;
        state.decks.push(action.payload);
      })
      .addCase(createDeck.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || action.error.message;
      })
      .addCase(updateDeck.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateDeck.fulfilled, (state, action) => {
        state.isLoading = false;
        const index = state.decks.findIndex((d) => d.id === action.payload.id);
        if (index !== -1) {
          state.decks[index] = action.payload;
        }
        if (state.currentDeck && state.currentDeck.id === action.payload.id) {
          state.currentDeck = action.payload;
        }
      })
      .addCase(updateDeck.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || action.error.message;
      })
      .addCase(deleteDeck.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(deleteDeck.fulfilled, (state, action) => {
        state.isLoading = false;
        state.decks = state.decks.filter((d) => d.id !== action.payload);
      })
      .addCase(deleteDeck.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || action.error.message;
      })
      .addCase(deleteFlashcard.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(deleteFlashcard.fulfilled, (state, action) => {
        state.isLoading = false;
        state.flashcards = state.flashcards.filter((c) => c.id !== action.payload);
      })
      .addCase(deleteFlashcard.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || action.error.message;
      })
      .addCase(createFlashcard.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createFlashcard.fulfilled, (state, action) => {
        state.isLoading = false;
        state.flashcards.push(action.payload);
      })
      .addCase(createFlashcard.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || action.error.message;
      });
  },
});

export const { clearDeckError, clearCurrentDeck, resetDeckState } = deckSlice.actions;
export default deckSlice.reducer;
