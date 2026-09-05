import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { authApi } from '../../services/authApi';
import i18n from '../../i18n';
import { safeLocalGet, safeLocalSet, safeLocalRemove } from '../../utils/storage';

const syncLanguage = (userData) => {
  if (userData && userData.nativeLanguage) {
    const lang = userData.nativeLanguage === 'en' ? 'en' : 'vi';
    i18n.changeLanguage(lang);
  }
};

const token = safeLocalGet('token');
let user = null;
if (token) {
  const storedUser = safeLocalGet('user');
  if (storedUser && typeof storedUser === 'object') {
    user = storedUser;
  } else if (typeof storedUser === 'string') {
    try {
      user = JSON.parse(storedUser);
    } catch {
      user = null;
    }
  }
}
if (user) {
  syncLanguage(user);
}

const initialState = {
  user,
  token,
  isAuthenticated: Boolean(token),
  isLoading: false,
  error: null,
};

const resolveAuthResponse = (payload) => {
  if (!payload) return { token: null, user: null };
  if (typeof payload === 'string') {
    return { token: payload, user: null };
  }
  const data = payload.data && typeof payload.data === 'object' ? payload.data : payload;
  return {
    token: data.access_token || data.token || null,
    user: data.user || null,
  };
};

export const loginUser = createAsyncThunk('auth/loginUser', async (credentials, { rejectWithValue }) => {
  try {
    const response = await authApi.login(credentials);
    return response.data;
  } catch (error) {
    return rejectWithValue(error.response?.data || error.message);
  }
});

export const loginWithGoogle = createAsyncThunk('auth/loginWithGoogle', async (googleData, { rejectWithValue }) => {
  try {
    const response = await authApi.googleLogin(googleData);
    return response.data;
  } catch (error) {
    return rejectWithValue(error.response?.data || error.message);
  }
});

export const registerUser = createAsyncThunk('auth/registerUser', async (credentials, { rejectWithValue }) => {
  try {
    const response = await authApi.register(credentials);
    return response.data;
  } catch (error) {
    return rejectWithValue(error.response?.data || error.message);
  }
});

export const updateProfile = createAsyncThunk('auth/updateProfile', async ({ id, data }, { rejectWithValue }) => {
  try {
    const response = await authApi.updateUser(id, data);
    return response.data;
  } catch (error) {
    return rejectWithValue(error.response?.data || error.message);
  }
});

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout(state) {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.error = null;
      safeLocalRemove('token');
      safeLocalRemove('user');
    },
    clearAuthError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.isLoading = false;
        const { token: resolvedToken, user: resolvedUser } = resolveAuthResponse(action.payload);
        state.user = resolvedToken ? resolvedUser : null;
        state.token = resolvedToken;
        state.isAuthenticated = Boolean(resolvedToken);
        state.error = null;
        if (resolvedToken) {
          safeLocalSet('token', resolvedToken);
        }
        if (resolvedToken && resolvedUser) {
          safeLocalSet('user', resolvedUser);
          syncLanguage(resolvedUser);
        }
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || action.error.message;
      })
      .addCase(loginWithGoogle.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loginWithGoogle.fulfilled, (state, action) => {
        state.isLoading = false;
        const { token: resolvedToken, user: resolvedUser } = resolveAuthResponse(action.payload);
        state.user = resolvedToken ? resolvedUser : null;
        state.token = resolvedToken;
        state.isAuthenticated = Boolean(resolvedToken);
        state.error = null;
        if (resolvedToken) {
          safeLocalSet('token', resolvedToken);
        }
        if (resolvedToken && resolvedUser) {
          safeLocalSet('user', resolvedUser);
          syncLanguage(resolvedUser);
        }
      })
      .addCase(loginWithGoogle.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || action.error.message;
      })
      .addCase(registerUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.isLoading = false;
        const { token: resolvedToken, user: resolvedUser } = resolveAuthResponse(action.payload);
        state.user = resolvedToken ? resolvedUser : null;
        state.token = resolvedToken;
        state.isAuthenticated = Boolean(resolvedToken);
        state.error = null;
        if (resolvedToken) {
          safeLocalSet('token', resolvedToken);
        }
        if (resolvedToken && resolvedUser) {
          safeLocalSet('user', resolvedUser);
          syncLanguage(resolvedUser);
        }
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || action.error.message;
      })
      .addCase(updateProfile.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload;
        state.error = null;
        safeLocalSet('user', action.payload);
        syncLanguage(action.payload);
      })
      .addCase(updateProfile.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || action.error.message;
      });
  },
});

export const { logout, clearAuthError } = authSlice.actions;
export default authSlice.reducer;
