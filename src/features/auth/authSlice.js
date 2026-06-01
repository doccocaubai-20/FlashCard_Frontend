import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { authApi } from '../../services/authApi';

const token = localStorage.getItem('token') || null;
const user = token ? JSON.parse(localStorage.getItem('user') || 'null') : null;

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
    token:
      payload.token ||
      payload.accessToken ||
      payload.access_token ||
      payload.AccessToken ||
      payload.Access_Token ||
      data.token ||
      data.accessToken ||
      data.access_token ||
      data.AccessToken ||
      data.Access_Token ||
      null,
    user: payload.user || data.user || (data?.email ? data : null),
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

export const registerUser = createAsyncThunk('auth/registerUser', async (credentials, { rejectWithValue }) => {
  try {
    const response = await authApi.register(credentials);
    return response.data;
  } catch (error) {
    return rejectWithValue(error.response?.data || error.message);
  }
});

export const fetchMe = createAsyncThunk('auth/fetchMe', async (_, { rejectWithValue }) => {
  try {
    const response = await authApi.getMe();
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
      localStorage.removeItem('token');
      localStorage.removeItem('user');
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
        state.user = resolvedUser;
        state.token = resolvedToken;
        state.isAuthenticated = Boolean(resolvedToken) || Boolean(action.payload);
        state.error = null;
        if (resolvedToken) {
          localStorage.setItem('token', resolvedToken);
        }
        if (resolvedUser) {
          localStorage.setItem('user', JSON.stringify(resolvedUser));
        }
      })
      .addCase(loginUser.rejected, (state, action) => {
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
        state.user = resolvedUser;
        state.token = resolvedToken;
        state.isAuthenticated = Boolean(resolvedToken) || Boolean(action.payload);
        state.error = null;
        if (resolvedToken) {
          localStorage.setItem('token', resolvedToken);
        }
        if (resolvedUser) {
          localStorage.setItem('user', JSON.stringify(resolvedUser));
        }
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || action.error.message;
      })
      .addCase(fetchMe.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchMe.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(fetchMe.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || action.error.message;
      });
  },
});

export const { logout, clearAuthError } = authSlice.actions;
export default authSlice.reducer;
