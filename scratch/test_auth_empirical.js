/**
 * Empirical Test Harness for ChongZi Milestone 1
 * Tests:
 * 1. Storage resilience, QuotaExceededError, eviction, and migration
 * 2. Auth token & user hydration, login/register/logout persistence in authSlice
 * 3. Axios request and response interceptors in api.js
 */

import { createServer } from 'vite';
import assert from 'node:assert/strict';

// Mock browser globals
class MockLocalStorage {
  constructor() {
    this.store = new Map();
    this.failOnSet = false;
    this.throwQuota = false;
  }

  get length() {
    return this.store.size;
  }

  key(n) {
    return Array.from(this.store.keys())[n] || null;
  }

  getItem(key) {
    return this.store.has(key) ? this.store.get(key) : null;
  }

  setItem(key, value) {
    if (this.throwQuota) {
      const err = new Error('QuotaExceededError: storage is full');
      err.name = 'QuotaExceededError';
      err.code = 22;
      throw err;
    }
    if (this.failOnSet) {
      throw new Error('Access denied: localStorage disabled');
    }
    this.store.set(key, String(value));
  }

  removeItem(key) {
    this.store.delete(key);
  }

  clear() {
    this.store.clear();
  }
}

const mockLocalStorage = new MockLocalStorage();
globalThis.window = {
  localStorage: mockLocalStorage,
  location: {
    pathname: '/dashboard',
    href: 'http://localhost:5173/dashboard',
  },
};
globalThis.localStorage = mockLocalStorage;

// Mock IndexedDB
globalThis.indexedDB = {
  open: () => {
    return {
      set onupgradeneeded(fn) {},
      set onsuccess(fn) {
        setTimeout(() => fn({ target: { result: mockDb } }), 0);
      },
      set onerror(fn) {},
    };
  },
};

const mockIdbStore = new Map();
const mockDb = {
  objectStoreNames: { contains: () => true },
  transaction: () => ({
    objectStore: () => ({
      put: (val, key) => {
        mockIdbStore.set(key, val);
        const req = {};
        setTimeout(() => req.onsuccess && req.onsuccess(), 0);
        return req;
      },
      get: (key) => {
        const req = { result: mockIdbStore.get(key) };
        setTimeout(() => req.onsuccess && req.onsuccess(), 0);
        return req;
      },
      delete: (key) => {
        mockIdbStore.delete(key);
        const req = {};
        setTimeout(() => req.onsuccess && req.onsuccess(), 0);
        return req;
      },
    }),
  }),
};

let testsPassed = 0;
let testsFailed = 0;
const testResults = [];

function runTest(name, fn) {
  try {
    fn();
    testsPassed++;
    testResults.push({ name, status: 'PASS' });
    console.log(`[PASS] ${name}`);
  } catch (err) {
    testsFailed++;
    testResults.push({ name, status: 'FAIL', error: err.message, stack: err.stack });
    console.error(`[FAIL] ${name}: ${err.message}`);
  }
}

async function runAsyncTest(name, fn) {
  try {
    await fn();
    testsPassed++;
    testResults.push({ name, status: 'PASS' });
    console.log(`[PASS] ${name}`);
  } catch (err) {
    testsFailed++;
    testResults.push({ name, status: 'FAIL', error: err.message, stack: err.stack });
    console.error(`[FAIL] ${name}: ${err.message}`);
  }
}

async function main() {
  console.log('====================================================');
  console.log('Starting Empirical Test Harness for Milestone 1');
  console.log('====================================================\n');

  // Launch headless Vite SSR server to import ESM modules with aliases and transforms
  const viteServer = await createServer({
    configFile: false,
    server: { middlewareMode: true },
  });

  try {
    const storage = await viteServer.ssrLoadModule('/src/utils/storage.js');
    const {
      safeLocalGet,
      safeLocalSet,
      safeLocalRemove,
      PRESERVED_KEYS,
      isNonEssentialKey,
      evictNonEssentialCaches,
      migrateLocalStorageToIDB,
    } = storage;

    // ----------------------------------------------------
    // Suite 1: Storage Layer Tests
    // ----------------------------------------------------
    console.log('\n--- Suite 1: Storage Layer Tests ---');

    runTest('safeLocalSet and safeLocalGet basic roundtrip', () => {
      mockLocalStorage.clear();
      safeLocalSet('token', 'eyJhbGciOiJIUzI1NiJ9.test');
      safeLocalSet('user', { id: 42, name: 'ChongZi Learner', nativeLanguage: 'vi' });

      const retrievedToken = safeLocalGet('token');
      const retrievedUser = safeLocalGet('user');

      assert.equal(retrievedToken, 'eyJhbGciOiJIUzI1NiJ9.test');
      assert.deepEqual(retrievedUser, { id: 42, name: 'ChongZi Learner', nativeLanguage: 'vi' });
    });

    runTest('safeLocalRemove purges from localStorage and memory fallback', () => {
      safeLocalRemove('token');
      safeLocalRemove('user');

      assert.equal(safeLocalGet('token'), null);
      assert.equal(safeLocalGet('user'), null);
      assert.equal(mockLocalStorage.getItem('token'), null);
      assert.equal(mockLocalStorage.getItem('user'), null);
    });

    runTest('PRESERVED_KEYS contains essential auth & UI keys', () => {
      assert.ok(PRESERVED_KEYS.has('token'), 'token must be preserved');
      assert.ok(PRESERVED_KEYS.has('user'), 'user must be preserved');
      assert.ok(PRESERVED_KEYS.has('chongzi_sidebar_collapsed'), 'sidebar state must be preserved');
      assert.ok(PRESERVED_KEYS.has('theme'), 'theme must be preserved');
      assert.ok(PRESERVED_KEYS.has('chongzi_dashboard_mode'), 'dashboard mode must be preserved');
    });

    runTest('isNonEssentialKey strictly protects PRESERVED_KEYS', () => {
      assert.equal(isNonEssentialKey('token'), false);
      assert.equal(isNonEssentialKey('user'), false);
      assert.equal(isNonEssentialKey('chongzi_sidebar_collapsed'), false);

      assert.equal(isNonEssentialKey('wotd_word'), true);
      assert.equal(isNonEssentialKey('offline_dict_nihao'), true);
      assert.equal(isNonEssentialKey('cached_quiz_1'), true);
      assert.equal(isNonEssentialKey('temp_search_query'), true);
    });

    runTest('QuotaExceededError triggers eviction and updates in-memory fallback', () => {
      mockLocalStorage.clear();
      // Setup preserved keys and non-essential keys
      mockLocalStorage.setItem('token', 'jwt_active_session');
      mockLocalStorage.setItem('chongzi_sidebar_collapsed', 'true');
      mockLocalStorage.setItem('offline_dict_abc', 'large_dict_data');
      mockLocalStorage.setItem('wotd_word', '你好');

      try {
        // Force quota exceeded
        mockLocalStorage.throwQuota = true;

        // Attempt to save new token
        safeLocalSet('token', 'jwt_new_token_under_quota');

        // Immediate safeLocalGet should return the new token via memoryFallbackCache
        const tokenGot = safeLocalGet('token');
        assert.equal(tokenGot, 'jwt_new_token_under_quota');
      } finally {
        mockLocalStorage.throwQuota = false;
      }
    });

    runTest('QuotaExceededError on NEW key (not in localStorage) falls back to memory', () => {
      mockLocalStorage.clear();
      try {
        mockLocalStorage.throwQuota = true;
        safeLocalSet('brand_new_token', 'jwt_brand_new_value');
        const tokenGot = safeLocalGet('brand_new_token');
        assert.equal(tokenGot, 'jwt_brand_new_value');
      } finally {
        mockLocalStorage.throwQuota = false;
      }
    });

    await runAsyncTest('migrateLocalStorageToIDB migrates heavy caches and preserves UI/Auth keys', async () => {
      mockLocalStorage.clear();
      mockLocalStorage.setItem('token', 'session_token_123');
      mockLocalStorage.setItem('user', JSON.stringify({ id: 1, name: 'Tester' }));
      mockLocalStorage.setItem('chongzi_sidebar_collapsed', 'true');
      mockLocalStorage.setItem('wotd_word', '学');
      mockLocalStorage.setItem('offline_dict_xue', 'data_xue');

      await migrateLocalStorageToIDB();

      // Non-essential keys should be removed from localStorage
      assert.equal(mockLocalStorage.getItem('wotd_word'), null, 'wotd_word should be removed from localStorage');
      assert.equal(mockLocalStorage.getItem('offline_dict_xue'), null, 'offline_dict should be removed from localStorage');

      // Preserved keys MUST remain in localStorage
      assert.equal(mockLocalStorage.getItem('token'), 'session_token_123', 'token MUST remain in localStorage');
      assert.ok(mockLocalStorage.getItem('user'), 'user MUST remain in localStorage');
      assert.equal(mockLocalStorage.getItem('chongzi_sidebar_collapsed'), 'true', 'sidebar state MUST remain');
    });

    // ----------------------------------------------------
    // Suite 2: AuthSlice Hydration & Reducer Tests
    // ----------------------------------------------------
    console.log('\n--- Suite 2: AuthSlice Hydration & Reducer Tests ---');

    // Test hydration when storage has valid credentials
    mockLocalStorage.clear();
    safeLocalRemove('token');
    safeLocalRemove('user');
    safeLocalSet('token', 'hydrated_jwt_token_999');
    safeLocalSet('user', { id: 999, name: 'Hydrated User', nativeLanguage: 'vi' });

    // Load authSlice fresh
    const authModule = await viteServer.ssrLoadModule('/src/features/auth/authSlice.js');
    const authReducer = authModule.default;
    const { loginUser, loginWithGoogle, registerUser, updateProfile, logout, clearAuthError } = authModule;

    runTest('authSlice initial hydration loads token and user from safeLocalGet', () => {
      const initial = authReducer(undefined, { type: '@@INIT' });
      assert.equal(initial.token, 'hydrated_jwt_token_999');
      assert.equal(initial.isAuthenticated, true);
      assert.deepEqual(initial.user, { id: 999, name: 'Hydrated User', nativeLanguage: 'vi' });
      assert.equal(initial.error, null);
      assert.equal(initial.isLoading, false);
    });

    runTest('authSlice loginUser.fulfilled updates state and calls safeLocalSet', () => {
      mockLocalStorage.clear();
      const loginPayload = {
        data: {
          access_token: 'new_login_access_token_101',
          user: { id: 101, email: 'student@chongzi.com', nativeLanguage: 'en' },
        },
      };

      const prevState = { user: null, token: null, isAuthenticated: false, isLoading: true, error: null };
      const nextState = authReducer(prevState, {
        type: loginUser.fulfilled.type,
        payload: loginPayload,
      });

      assert.equal(nextState.token, 'new_login_access_token_101');
      assert.equal(nextState.isAuthenticated, true);
      assert.equal(nextState.isLoading, false);
      assert.deepEqual(nextState.user, { id: 101, email: 'student@chongzi.com', nativeLanguage: 'en' });

      // Check safeLocalSet persistence
      assert.equal(safeLocalGet('token'), 'new_login_access_token_101');
      assert.deepEqual(safeLocalGet('user'), { id: 101, email: 'student@chongzi.com', nativeLanguage: 'en' });
    });

    runTest('authSlice registerUser.fulfilled updates state and calls safeLocalSet', () => {
      mockLocalStorage.clear();
      const registerPayload = {
        access_token: 'register_token_202',
        user: { id: 202, email: 'newbie@chongzi.com' },
      };

      const prevState = { user: null, token: null, isAuthenticated: false, isLoading: true, error: null };
      const nextState = authReducer(prevState, {
        type: registerUser.fulfilled.type,
        payload: registerPayload,
      });

      assert.equal(nextState.token, 'register_token_202');
      assert.equal(nextState.isAuthenticated, true);
      assert.deepEqual(nextState.user, { id: 202, email: 'newbie@chongzi.com' });

      assert.equal(safeLocalGet('token'), 'register_token_202');
      assert.deepEqual(safeLocalGet('user'), { id: 202, email: 'newbie@chongzi.com' });
    });

    runTest('authSlice loginWithGoogle.fulfilled updates state and calls safeLocalSet', () => {
      mockLocalStorage.clear();
      const googlePayload = {
        access_token: 'google_token_303',
        user: { id: 303, name: 'Google User' },
      };

      const prevState = { user: null, token: null, isAuthenticated: false, isLoading: true, error: null };
      const nextState = authReducer(prevState, {
        type: loginWithGoogle.fulfilled.type,
        payload: googlePayload,
      });

      assert.equal(nextState.token, 'google_token_303');
      assert.equal(nextState.isAuthenticated, true);
      assert.equal(safeLocalGet('token'), 'google_token_303');
    });

    runTest('authSlice updateProfile.fulfilled updates state and safeLocalSet for user', () => {
      const updatedUser = { id: 101, email: 'student@chongzi.com', name: 'Updated ChongZi Name' };
      const prevState = { user: { id: 101 }, token: 'valid_token', isAuthenticated: true };

      const nextState = authReducer(prevState, {
        type: updateProfile.fulfilled.type,
        payload: updatedUser,
      });

      assert.deepEqual(nextState.user, updatedUser);
      assert.deepEqual(safeLocalGet('user'), updatedUser);
    });

    runTest('authSlice logout resets state and invokes safeLocalRemove', () => {
      safeLocalSet('token', 'token_to_purge');
      safeLocalSet('user', { id: 505 });

      const activeState = {
        user: { id: 505 },
        token: 'token_to_purge',
        isAuthenticated: true,
        isLoading: false,
        error: null,
      };

      const loggedOutState = authReducer(activeState, logout());

      assert.equal(loggedOutState.user, null);
      assert.equal(loggedOutState.token, null);
      assert.equal(loggedOutState.isAuthenticated, false);
      assert.equal(loggedOutState.error, null);

      // Verify storage was purged
      assert.equal(safeLocalGet('token'), null);
      assert.equal(safeLocalGet('user'), null);
    });

    // Adversarial / Edge case: Empty or invalid payload on fulfilled
    runTest('Adversarial: loginUser.fulfilled with empty object payload', () => {
      const emptyPayload = {};
      const prevState = { user: null, token: null, isAuthenticated: false };
      const nextState = authReducer(prevState, {
        type: loginUser.fulfilled.type,
        payload: emptyPayload,
      });

      // resolvedToken is null, resolvedUser is null
      assert.equal(nextState.token, null);
      assert.equal(nextState.user, null);

      // Check: isAuthenticated in authSlice.js:114 is: Boolean(resolvedToken) || Boolean(action.payload)
      // Because {} is truthy, nextState.isAuthenticated becomes true despite having no token!
      console.log(`  -> Note: nextState.isAuthenticated = ${nextState.isAuthenticated} for empty object payload (token: ${nextState.token})`);
    });

    // ----------------------------------------------------
    // Suite 3: API Interceptor Tests
    // ----------------------------------------------------
    console.log('\n--- Suite 3: API Interceptor Tests ---');

    const apiModule = await viteServer.ssrLoadModule('/src/services/api.js');
    const api = apiModule.default;

    runTest('api request interceptor attaches Authorization header when token exists', async () => {
      mockLocalStorage.clear();
      safeLocalSet('token', 'bearer_interceptor_token_xyz');

      // Find the request interceptor function
      const reqInterceptor = api.interceptors.request.handlers[0].fulfilled;
      const dummyConfig = { headers: {} };
      const resultConfig = reqInterceptor(dummyConfig);

      assert.equal(resultConfig.headers.Authorization, 'Bearer bearer_interceptor_token_xyz');
    });

    runTest('api request interceptor does NOT attach Authorization header when token is null', () => {
      safeLocalRemove('token');

      const reqInterceptor = api.interceptors.request.handlers[0].fulfilled;
      const dummyConfig = { headers: {} };
      const resultConfig = reqInterceptor(dummyConfig);

      assert.equal(resultConfig.headers.Authorization, undefined);
    });

    runTest('api request interceptor uses in-memory token during QuotaExceededError', () => {
      mockLocalStorage.clear();
      mockLocalStorage.throwQuota = true;
      safeLocalSet('token', 'in_memory_quota_token_888');

      const reqInterceptor = api.interceptors.request.handlers[0].fulfilled;
      const dummyConfig = { headers: {} };
      const resultConfig = reqInterceptor(dummyConfig);

      assert.equal(resultConfig.headers.Authorization, 'Bearer in_memory_quota_token_888');
      mockLocalStorage.throwQuota = false;
    });

    await runAsyncTest('api response interceptor on 401 purges tokens and redirects to /login', async () => {
      mockLocalStorage.clear();
      safeLocalSet('token', 'expiring_token_401');
      safeLocalSet('user', { id: 777, name: 'To be logged out' });

      globalThis.window.location.pathname = '/study';
      globalThis.window.location.href = 'http://localhost:5173/study';

      const respInterceptor = api.interceptors.response.handlers[0].rejected;
      const error401 = {
        response: { status: 401, data: { message: 'Unauthorized token expired' } },
      };

      try {
        await respInterceptor(error401);
        assert.fail('Expected 401 interceptor to reject');
      } catch (rejectedErr) {
        assert.equal(rejectedErr.response.status, 401);
        // Tokens must be purged
        assert.equal(safeLocalGet('token'), null, 'token must be purged on 401');
        assert.equal(safeLocalGet('user'), null, 'user must be purged on 401');
        // Redirect to /login
        assert.equal(globalThis.window.location.href, '/login', 'should redirect to /login');
      }
    });

    await runAsyncTest('api response interceptor on 401 when ALREADY on /login does not redirect loop', async () => {
      mockLocalStorage.clear();
      safeLocalSet('token', 'stale_token_on_login');
      safeLocalSet('user', { id: 888 });

      globalThis.window.location.pathname = '/login';
      globalThis.window.location.href = 'http://localhost:5173/login';

      const respInterceptor = api.interceptors.response.handlers[0].rejected;
      const error401 = {
        response: { status: 401, data: { message: 'Invalid credentials' } },
      };

      try {
        await respInterceptor(error401);
        assert.fail('Expected 401 interceptor to reject');
      } catch (rejectedErr) {
        assert.equal(rejectedErr.response.status, 401);
        // Tokens purged
        assert.equal(safeLocalGet('token'), null);
        assert.equal(safeLocalGet('user'), null);
        // Location href should remain unchanged (not reset or loop)
        assert.equal(globalThis.window.location.href, 'http://localhost:5173/login');
      }
    });

    await runAsyncTest('api response interceptor on 500 does NOT purge tokens', async () => {
      mockLocalStorage.clear();
      safeLocalSet('token', 'valid_token_preserved');
      safeLocalSet('user', { id: 999 });

      const respInterceptor = api.interceptors.response.handlers[0].rejected;
      const error500 = {
        response: { status: 500, data: { message: 'Internal server error' } },
      };

      try {
        await respInterceptor(error500);
        assert.fail('Expected 500 interceptor to reject');
      } catch (rejectedErr) {
        assert.equal(rejectedErr.response.status, 500);
        // Tokens must NOT be purged
        assert.equal(safeLocalGet('token'), 'valid_token_preserved');
        assert.deepEqual(safeLocalGet('user'), { id: 999 });
      }
    });
  } finally {
    await viteServer.close();
  }

  console.log('\n====================================================');
  console.log(`Test Execution Finished: ${testsPassed} passed, ${testsFailed} failed`);
  console.log('====================================================');

  if (testsFailed > 0) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Fatal test harness error:', err);
  process.exit(1);
});
