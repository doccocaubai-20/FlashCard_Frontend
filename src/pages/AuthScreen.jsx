import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { loginUser, registerUser, clearAuthError } from '../features/auth/authSlice';

export default function AuthScreen() {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const authState = useSelector((state) => state.auth);
    const [isLogin, setIsLogin] = useState(true);
    const [formData, setFormData] = useState({ name: '', email: '', password: '' });

    useEffect(() => {
        if (authState.isAuthenticated) {
            navigate('/', { replace: true });
        }
    }, [authState.isAuthenticated, navigate]);

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
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br p-4">
            <div className="max-w-md w-full bg-gradient-to-br from-white via-blue-50 to-indigo-100 rounded-2xl shadow-2xl p-8 border border-white/60">

                {/* Tiêu đề */}
                <div className="text-center mb-8">
                    <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">
                        {isLogin ? 'Chào mừng trở lại' : 'Tạo tài khoản mới'}
                    </h2>
                    <p className="text-sm text-gray-500 mt-2">
                        Hệ thống học Flashcard thông minh
                    </p>
                </div>

                {/* Form nhập liệu */}
                <form onSubmit={handleSubmit} className="space-y-5">
                    {!isLogin && (
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Họ và tên</label>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                required
                                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                placeholder="Nguyễn Văn A"
                            />
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Email</label>
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            required
                            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                            placeholder="example@email.com"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Mật khẩu</label>
                        <input
                            type="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            required
                            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                            placeholder="••••••••"
                        />
                    </div>

                    <button
                        type="submit"
                        className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 transition-colors shadow-md hover:shadow-lg mt-2"
                    >
                        {isLogin ? 'Đăng nhập' : 'Đăng ký'}
                    </button>
                </form>

                {/* Phân cách */}
                <div className="mt-8 flex items-center">
                    <div className="flex-1 border-t border-gray-200"></div>
                    <span className="px-4 text-sm text-gray-400 font-medium">Hoặc tiếp tục với</span>
                    <div className="flex-1 border-t border-gray-200"></div>
                </div>

                {/* Nút Google */}
                <button className="mt-6 w-full flex items-center justify-center gap-3 bg-white border border-gray-200 text-gray-700 font-semibold py-3 rounded-xl hover:bg-gray-50 transition-colors shadow-sm">
                    <svg width="22" height="22" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.53-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-8.72z" />
                        <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.11 0-5.74-2.11-6.68-4.96H1.21v3.15C3.18 21.88 7.31 24 12 24z" />
                        <path fill="#FBBC05" d="M5.32 14.24A7.16 7.16 0 0 1 4.91 12c0-.79.13-1.57.38-2.31V6.54H1.21A11.94 11.94 0 0 0 0 12c0 1.92.45 3.74 1.21 5.46l4.11-3.22z" />
                        <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.18 2.12 1.21 5.38l4.11 3.22c.94-2.85 3.57-4.96 6.68-4.96z" />
                    </svg>
                    Google
                </button>

                {/* Chuyển đổi trạng thái */}
                <p className="mt-8 text-center text-sm text-gray-600">
                    {isLogin ? 'Chưa có tài khoản? ' : 'Đã có tài khoản? '}
                    <button
                        onClick={() => {
                            setIsLogin((prev) => !prev);
                            if (authState.error) dispatch(clearAuthError());
                        }}
                        className="font-bold text-blue-600 hover:text-blue-800 transition-colors"
                    >
                        {isLogin ? 'Đăng ký ngay' : 'Đăng nhập ngay'}
                    </button>
                </p>

                {authState.error && (
                    <div className="mt-4 rounded-2xl bg-red-50 p-4 text-sm text-red-700 ring-1 ring-red-200">
                        {typeof authState.error === 'string' ? authState.error : 'Đăng nhập thất bại. Vui lòng thử lại.'}
                    </div>
                )}

            </div>
        </div>
    );
}