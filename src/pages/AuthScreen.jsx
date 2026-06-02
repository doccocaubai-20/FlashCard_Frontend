import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { loginUser, registerUser, loginWithGoogle, clearAuthError } from '../features/auth/authSlice';
import { LogIn, UserPlus, BookOpen } from 'lucide-react';

export default function AuthScreen() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const authState = useSelector((state) => state.auth);
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });

  // Auto redirect if already authenticated
  useEffect(() => {
    if (authState.isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [authState.isAuthenticated, navigate]);

  // Load Real Google Identity Services client script
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    document.body.appendChild(script);

    script.onload = () => {
      if (window.google) {
        try {
          window.google.accounts.id.initialize({
            client_id: '1008006970131-mcutblsqgcafbus89ip8p0t77q5hi4dq.apps.googleusercontent.com',
            callback: handleGoogleCredentialResponse,
          });
          window.google.accounts.id.renderButton(
            document.getElementById('google-signin-btn-container'),
            { theme: 'outline', size: 'large', text: 'continue_with', width: '380' }
          );
        } catch (e) {
          console.warn('Google SDK init failed, likely running in sandboxed environment.', e);
        }
      }
    };

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const handleGoogleCredentialResponse = async (response) => {
    try {
      await dispatch(loginWithGoogle({ credential: response.credential })).unwrap();
      navigate('/', { replace: true });
    } catch (err) {
      console.error('Google login failed:', err);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (authState.error) {
      dispatch(clearAuthError());
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const action = isLogin ? loginUser(formData) : registerUser(formData);
    try {
      await dispatch(action).unwrap();
      navigate('/', { replace: true });
    } catch (error) {
      console.error('Auth failed:', error);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4 transition-colors">
      <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-3xl shadow-2xl p-8 border border-slate-200 dark:border-slate-800 transition-colors">

        {/* Brand / Logo */}
        <div className="text-center mb-8">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-md shadow-indigo-200 dark:shadow-none mb-4">
            <BookOpen size={24} />
          </div>
          <h2 className="text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
            {isLogin ? 'Chào mừng trở lại' : 'Tạo tài khoản mới'}
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
            Hệ thống học Flashcard thông minh tiếng Trung ChongZi
          </p>
        </div>

        {/* Email & Password Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Họ và tên</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950/20 border border-slate-200 dark:border-slate-800 rounded-xl focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-sm text-slate-800 dark:text-slate-200"
                placeholder="Nguyễn Văn A"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950/20 border border-slate-200 dark:border-slate-800 rounded-xl focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-sm text-slate-800 dark:text-slate-200"
              placeholder="example@email.com"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Mật khẩu</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950/20 border border-slate-200 dark:border-slate-800 rounded-xl focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-sm text-slate-800 dark:text-slate-200"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl transition-all shadow-md hover:shadow-lg active:scale-[0.98] cursor-pointer mt-2"
          >
            {isLogin ? <LogIn size={18} /> : <UserPlus size={18} />}
            <span>{isLogin ? 'Đăng nhập' : 'Đăng ký'}</span>
          </button>
        </form>

        {/* Divider */}
        <div className="mt-8 flex items-center">
          <div className="flex-grow border-t border-slate-200 dark:border-slate-800"></div>
          <span className="px-4 text-xs text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">Hoặc sử dụng</span>
          <div className="flex-grow border-t border-slate-200 dark:border-slate-800"></div>
        </div>

        {/* Google Buttons Section */}
        <div className="mt-6 space-y-3">
          
          {/* Overlay container: custom button under, transparent Google button over */}
          <div className="relative w-full max-w-[380px] mx-auto h-10 select-none">
            {/* Custom Google Button UI */}
            <button
              type="button"
              className="absolute inset-0 w-full h-full flex items-center justify-center gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 font-bold rounded-xl transition-all shadow-sm pointer-events-none"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" className="shrink-0">
                <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.53-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-8.72z" />
                <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.11 0-5.74-2.11-6.68-4.96H1.21v3.15C3.18 21.88 7.31 24 12 24z" />
                <path fill="#FBBC05" d="M5.32 14.24A7.16 7.16 0 0 1 4.91 12c0-.79.13-1.57.38-2.31V6.54H1.21A11.94 11.94 0 0 0 0 12c0 1.92.45 3.74 1.21 5.46l4.11-3.22z" />
                <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.18 2.12 1.21 5.38l4.11 3.22c.94-2.85 3.57-4.96 6.68-4.96z" />
              </svg>
              <span className="text-sm">Tiếp tục với Google</span>
            </button>

            {/* Invisible Google official button overlay */}
            <div
              id="google-signin-btn-container"
              className="absolute inset-0 w-full h-full opacity-0 hover:cursor-pointer [&_iframe]:!w-full [&_iframe]:!h-full"
              style={{
                opacity: 0.01,
                zIndex: 10,
              }}
            />
          </div>

        </div>

        {/* Switch Account Action */}
        <p className="relative z-20 mt-8 text-center text-sm text-slate-600 dark:text-slate-400">
          {isLogin ? 'Chưa có tài khoản? ' : 'Đã có tài khoản? '}
          <button
            type="button"
            onClick={() => {
              setIsLogin((prev) => !prev);
              if (authState.error) dispatch(clearAuthError());
            }}
            className="font-extrabold text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors cursor-pointer"
          >
            {isLogin ? 'Đăng ký ngay' : 'Đăng nhập ngay'}
          </button>
        </p>

        {authState.error && (
          <div className="mt-4 rounded-2xl bg-red-50 dark:bg-red-950/20 p-4 text-xs font-semibold text-red-700 dark:text-red-400 ring-1 ring-red-200 dark:ring-red-900/50">
            {typeof authState.error === 'string' ? authState.error : 'Xác thực thất bại. Vui lòng kiểm tra lại thông tin.'}
          </div>
        )}

      </div>
    </div>
  );
}