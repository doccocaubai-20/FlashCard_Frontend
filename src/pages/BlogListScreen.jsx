import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import BlogNav from '../components/blog/BlogNav';
import SeoHead from '../components/common/SeoHead';
import { BLOG_POSTS } from '../data/blogPosts';
import { Calendar, Clock, ArrowRight, Tag, BookOpen, Sparkles, ChevronRight } from 'lucide-react';

export default function BlogListScreen() {
  const [selectedCategory, setSelectedCategory] = useState('ALL');

  const categories = [
    { id: 'ALL', label: 'Tất cả bài viết' },
    { id: 'Đánh giá công cụ', label: 'Đánh giá công cụ' },
    { id: 'Lộ trình học tập', label: 'Lộ trình học tập' },
    { id: 'Khoa học ghi nhớ', label: 'Khoa học ghi nhớ' },
  ];

  const filteredPosts = selectedCategory === 'ALL'
    ? BLOG_POSTS
    : BLOG_POSTS.filter((p) => p.category === selectedCategory);

  const featuredPost = BLOG_POSTS.find((p) => p.featured) || BLOG_POSTS[0];
  const regularPosts = filteredPosts.filter((p) => p.id !== featuredPost.id || selectedCategory !== 'ALL');

  const schemaData = {
    '@context': 'https://schema.org',
    '@type': 'Blog',
    name: 'ChongZi Tiếng Trung Blog',
    description: 'Chuyên trang kiến thức, phương pháp tự học tiếng Trung và cẩm nang luyện thi HSK.',
    url: 'https://chongziapp.id.vn/blog',
    publisher: {
      '@type': 'Organization',
      name: 'ChongZi App',
      logo: {
        '@type': 'ImageObject',
        url: 'https://chongziapp.id.vn/ap2.png',
      },
    },
  };

  return (
    <div className="min-h-screen bg-bg text-main transition-colors flex flex-col">
      <SeoHead
        title="ChongZi Blog | Kiến Thức Tự Học Tiếng Trung & Luyện Thi HSK"
        description="Tổng hợp các bài viết chuyên sâu về phương pháp tự học tiếng Trung, phân tích thuật toán ghi nhớ FSRS, đánh giá công cụ học tập và cẩm nang luyện thi HSK 1 - 6."
        keywords={['học tiếng trung', 'tự học tiếng trung', 'kinh nghiệm thi hsk', 'chongzi blog', 'flashcard tiếng trung']}
        canonicalUrl="https://chongziapp.id.vn/blog"
        schemaData={schemaData}
      />

      <BlogNav />

      {/* Hero Header */}
      <section className="border-b border-border bg-surface/50 py-12 px-4 sm:px-6">
        <div className="mx-auto max-w-4xl text-center">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1 text-xs font-medium text-mute mb-4">
            <BookOpen className="h-3.5 w-3.5 text-primary" />
            <span>Chuyên mục tri thức tiếng Trung</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-main mb-3">
            Phương Pháp & Kinh Nghiệm Tự Học Tiếng Trung
          </h1>
          <p className="text-base sm:text-lg text-mute max-w-2xl mx-auto leading-relaxed">
            Phân tích chuyên sâu các công nghệ ghi nhớ, lộ trình thực chiến từ số 0 đến HSK 6 và cách học tiếng Trung bền bỉ không áp lực.
          </p>
        </div>
      </section>

      {/* Main Content Area */}
      <main className="mx-auto max-w-6xl px-4 sm:px-6 py-10 flex-1 w-full">
        {/* Category Filters */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-8 no-scrollbar">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`rounded-full px-4 py-1.5 text-xs font-medium whitespace-nowrap transition-all ${
                selectedCategory === cat.id
                  ? 'bg-primary text-white shadow-sm'
                  : 'bg-surface border border-border text-mute hover:text-main hover:border-mute'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Featured Post (Only shown when filter is ALL) */}
        {selectedCategory === 'ALL' && featuredPost && (
          <div className="mb-12">
            <div className="group relative overflow-hidden rounded-2xl border border-border bg-surface shadow-sm transition-all hover:shadow-md hover:border-primary/40">
              <div className="p-6 sm:p-8 md:p-10">
                <div className="flex flex-wrap items-center gap-3 text-xs font-medium text-mute mb-4">
                  <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-primary font-semibold">
                    Bài viết nổi bật
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    {featuredPost.publishedAt}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    {featuredPost.readTime}
                  </span>
                </div>

                <Link to={`/blog/${featuredPost.slug}`}>
                  <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-main group-hover:text-primary transition-colors mb-3 leading-snug">
                    {featuredPost.title}
                  </h2>
                </Link>

                <p className="text-sm sm:text-base text-mute leading-relaxed mb-6 max-w-3xl">
                  {featuredPost.summary}
                </p>

                <div className="flex items-center justify-between pt-4 border-t border-border/60">
                  <span className="text-xs text-mute font-medium">Bởi {featuredPost.author}</span>
                  <Link
                    to={`/blog/${featuredPost.slug}`}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
                  >
                    <span>Đọc toàn bộ bài viết</span>
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Regular Posts Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {regularPosts.map((post) => (
            <article
              key={post.id}
              className="group flex flex-col justify-between rounded-xl border border-border bg-surface p-6 shadow-sm transition-all hover:shadow-md hover:border-primary/30"
            >
              <div>
                <div className="flex items-center gap-3 text-xs text-mute mb-3">
                  <span className="rounded bg-surface-hover px-2 py-0.5 font-medium text-mute">
                    {post.category}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {post.readTime}
                  </span>
                  <span>{post.publishedAt}</span>
                </div>

                <Link to={`/blog/${post.slug}`}>
                  <h3 className="text-lg font-bold text-main group-hover:text-primary transition-colors leading-snug mb-2">
                    {post.title}
                  </h3>
                </Link>

                <p className="text-xs sm:text-sm text-mute leading-relaxed line-clamp-3 mb-4">
                  {post.summary}
                </p>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-border/50 text-xs">
                <span className="text-mute">{post.author}</span>
                <Link
                  to={`/blog/${post.slug}`}
                  className="inline-flex items-center gap-1 font-semibold text-primary group-hover:translate-x-0.5 transition-transform"
                >
                  <span>Chi tiết</span>
                  <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </article>
          ))}
        </div>
      </main>

      {/* Editorial Footer */}
      <footer className="border-t border-border bg-surface/80 py-8 px-4 sm:px-6 transition-colors">
        <div className="mx-auto max-w-6xl flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-mute">
          <div className="flex items-center gap-2">
            <img src="/ap2.png" alt="ChongZi" className="h-5 w-5 rounded" />
            <span className="font-medium text-main">ChongZi Tiếng Trung</span>
            <span>- Nền tảng học thông minh & luyện thi HSK</span>
          </div>
          <div className="flex items-center gap-6">
            <Link to="/hsk-exams" className="hover:text-main transition-colors">Đề thi HSK 1 - 6</Link>
            <Link to="/study" className="hover:text-main transition-colors">Flashcard FSRS</Link>
            <Link to="/" className="hover:text-main transition-colors">Về trang chủ</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
