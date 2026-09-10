import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useTheme } from '../../context/ThemeContext';
import { Sun, Moon, Menu, X, ArrowRight, BookOpen, GraduationCap, Compass } from 'lucide-react';

export default function BlogNav() {
  const { isDark, toggleTheme } = useTheme();
  const token = useSelector((state) => state.auth.token);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-surface/90 backdrop-blur-md transition-colors">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        {/* Brand Logo */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <img
            src="/ap2.png"
            alt="ChongZi Logo"
            className="h-9 w-9 rounded-xl object-cover shadow-sm transition-transform duration-200 group-hover:scale-105"
          />
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-lg tracking-tight text-main">ChongZi</span>
              <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary">Blog</span>
            </div>
            <p className="text-[11px] text-mute leading-none hidden sm:block">Học Tiếng Trung Khoa Học</p>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-mute">
          <Link to="/" className="hover:text-main transition-colors">Trang chủ</Link>
          <Link to="/blog" className="text-primary font-semibold transition-colors">Tất cả bài viết</Link>
          <Link to="/hsk-exams" className="hover:text-main transition-colors flex items-center gap-1">
            <GraduationCap className="h-4 w-4" />
            <span>Luyện đề HSK</span>
          </Link>
          <Link to={token ? "/dashboard" : "/study"} className="hover:text-main transition-colors flex items-center gap-1">
            <BookOpen className="h-4 w-4" />
            <span>Kho từ vựng</span>
          </Link>
        </nav>

        {/* Right CTA Actions */}
        <div className="flex items-center gap-2.5">
          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            aria-label="Chuyển đổi giao diện Sáng / Tối"
            className="rounded-lg p-2 text-mute hover:bg-surface-hover hover:text-main transition-colors"
          >
            {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>

          {/* Primary Action */}
          {token ? (
            <Link
              to="/dashboard"
              className="hidden sm:inline-flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-2 text-xs font-semibold text-white shadow-sm hover:opacity-95 transition-opacity"
            >
              <span>Vào học</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          ) : (
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-2 text-xs font-semibold text-white shadow-sm hover:opacity-95 transition-opacity"
            >
              <span>Bắt đầu học thử</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          )}

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Mở danh mục điều hướng"
            className="md:hidden rounded-lg p-2 text-mute hover:bg-surface-hover hover:text-main"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-border bg-surface px-4 py-4 space-y-3 shadow-lg">
          <Link
            to="/"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-sm font-medium text-mute hover:bg-surface-hover hover:text-main"
          >
            Trang chủ
          </Link>
          <Link
            to="/blog"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-sm font-semibold text-primary bg-primary/10"
          >
            Tất cả bài viết
          </Link>
          <Link
            to="/hsk-exams"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-sm font-medium text-mute hover:bg-surface-hover hover:text-main"
          >
            Luyện đề HSK 1 - 6
          </Link>
          <Link
            to={token ? "/dashboard" : "/login"}
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-sm font-medium text-mute hover:bg-surface-hover hover:text-main"
          >
            {token ? "Bảng điều khiển" : "Đăng nhập / Đăng ký"}
          </Link>
        </div>
      )}
    </header>
  );
}
