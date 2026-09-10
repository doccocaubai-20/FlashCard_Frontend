import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import BlogNav from '../components/blog/BlogNav';
import SeoHead from '../components/common/SeoHead';
import { getBlogPostBySlug, BLOG_POSTS } from '../data/blogPosts';
import {
  Calendar,
  Clock,
  User,
  ArrowLeft,
  Share2,
  Check,
  ChevronRight,
  List,
  Sparkles,
  ExternalLink,
  BookOpen,
  GraduationCap,
  ArrowRight
} from 'lucide-react';

export default function BlogPostScreen() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const post = getBlogPostBySlug(slug);

  const [copied, setCopied] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);

  // Track scroll progress for reading bar
  useEffect(() => {
    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (totalHeight > 0) {
        const progress = (window.scrollY / totalHeight) * 100;
        setScrollProgress(Math.min(100, Math.max(0, progress)));
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Scroll to top when slug changes
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [slug]);

  if (!post) {
    return (
      <div className="min-h-screen bg-bg text-main flex flex-col">
        <BlogNav />
        <div className="mx-auto max-w-md text-center my-auto px-4 py-16">
          <h1 className="text-2xl font-bold mb-3">Bài viết không tồn tại</h1>
          <p className="text-sm text-mute mb-6">Liên kết bài viết có thể đã bị thay đổi hoặc gỡ bỏ.</p>
          <Link
            to="/blog"
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-white shadow-sm"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Quay lại danh mục Blog</span>
          </Link>
        </div>
      </div>
    );
  }

  const currentUrl = `https://chongziapp.id.vn/blog/${post.slug}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(currentUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleScrollToSection = (sectionId) => {
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Structured Data for Googlebot (Article & Breadcrumbs)
  const schemaData = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Article',
        '@id': `${currentUrl}#article`,
        isPartOf: {
          '@type': 'WebPage',
          '@id': currentUrl,
          url: currentUrl,
          name: post.metaTitle,
        },
        headline: post.title,
        description: post.metaDescription,
        datePublished: post.publishedAt,
        dateModified: post.publishedAt,
        author: {
          '@type': 'Person',
          name: post.author,
        },
        publisher: {
          '@type': 'Organization',
          name: 'ChongZi App',
          logo: {
            '@type': 'ImageObject',
            url: 'https://chongziapp.id.vn/ap2.png',
          },
        },
        mainEntityOfPage: currentUrl,
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: 'Trang chủ',
            item: 'https://chongziapp.id.vn/',
          },
          {
            '@type': 'ListItem',
            position: 2,
            name: 'Blog',
            item: 'https://chongziapp.id.vn/blog',
          },
          {
            '@type': 'ListItem',
            position: 3,
            name: post.title,
            item: currentUrl,
          },
        ],
      },
    ],
  };

  // Other related posts
  const relatedPosts = BLOG_POSTS.filter((p) => p.id !== post.id);

  return (
    <div className="min-h-screen bg-bg text-main transition-colors flex flex-col">
      <SeoHead
        title={post.metaTitle}
        description={post.metaDescription}
        keywords={post.keywords}
        canonicalUrl={currentUrl}
        ogType="article"
        schemaData={schemaData}
      />

      {/* Reading Progress Indicator */}
      <div className="fixed top-0 left-0 right-0 z-50 h-1 bg-border/50">
        <div
          className="h-full bg-primary transition-all duration-150 ease-out"
          style={{ width: `${scrollProgress}%` }}
        />
      </div>

      <BlogNav />

      {/* Main Container */}
      <main className="mx-auto max-w-4xl px-4 sm:px-6 py-8 sm:py-12 flex-1 w-full">
        {/* Breadcrumb Navigation */}
        <nav className="flex items-center gap-1.5 text-xs text-mute mb-6 overflow-x-auto whitespace-nowrap">
          <Link to="/" className="hover:text-main transition-colors">Trang chủ</Link>
          <ChevronRight className="h-3 w-3 text-border flex-shrink-0" />
          <Link to="/blog" className="hover:text-main transition-colors">Blog</Link>
          <ChevronRight className="h-3 w-3 text-border flex-shrink-0" />
          <span className="text-main font-medium truncate max-w-[200px] sm:max-w-md">{post.title}</span>
        </nav>

        {/* Article Header */}
        <header className="mb-8 border-b border-border pb-8">
          <div className="flex flex-wrap items-center gap-3 text-xs font-medium text-mute mb-4">
            <span className="rounded-full bg-primary/10 px-3 py-0.5 text-primary font-semibold">
              {post.category}
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              {post.publishedAt}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {post.readTime}
            </span>
            <span className="flex items-center gap-1">
              <User className="h-3.5 w-3.5" />
              {post.author}
            </span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-main leading-tight mb-4">
            {post.title}
          </h1>

          <p className="text-base sm:text-lg text-mute leading-relaxed font-normal">
            {post.summary}
          </p>

          {/* Social Share & Copy Bar */}
          <div className="mt-6 flex items-center justify-between gap-4 pt-4 border-t border-border/60 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-mute font-medium">Chia sẻ:</span>
              <button
                onClick={handleCopyLink}
                className="inline-flex items-center gap-1 rounded-md border border-border bg-surface px-2.5 py-1 text-xs text-mute hover:text-main hover:bg-surface-hover transition-colors"
                title="Sao chép đường dẫn bài viết"
              >
                {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Share2 className="h-3.5 w-3.5" />}
                <span>{copied ? 'Đã chép link' : 'Sao chép link'}</span>
              </button>
              <a
                href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(currentUrl)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-md border border-border bg-surface px-2.5 py-1 text-xs text-mute hover:text-main hover:bg-surface-hover transition-colors"
              >
                Facebook
              </a>
              <a
                href={`https://zalo.me/share?url=${encodeURIComponent(currentUrl)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-md border border-border bg-surface px-2.5 py-1 text-xs text-mute hover:text-main hover:bg-surface-hover transition-colors"
              >
                Zalo
              </a>
            </div>

            <Link
              to="/blog"
              className="inline-flex items-center gap-1 text-mute hover:text-main transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Về danh mục</span>
            </Link>
          </div>
        </header>

        {/* Table of Contents Box */}
        {post.toc && post.toc.length > 0 && (
          <aside className="mb-10 rounded-xl border border-border bg-surface/70 p-5 shadow-xs">
            <div className="flex items-center gap-2 text-sm font-bold text-main mb-3">
              <List className="h-4 w-4 text-primary" />
              <span>Mục lục bài viết</span>
            </div>
            <nav className="space-y-1.5 text-xs sm:text-sm">
              {post.toc.map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => handleScrollToSection(item.id)}
                  className="block text-left text-mute hover:text-primary transition-colors py-0.5 w-full hover:translate-x-0.5 transition-transform"
                >
                  <span className="text-border mr-2 font-mono text-[11px]">{idx + 1}.</span>
                  <span>{item.title}</span>
                </button>
              ))}
            </nav>
          </aside>
        )}

        {/* Article Body Content */}
        <article
          className="blog-article-content text-main/90"
          dangerouslySetInnerHTML={{ __html: post.contentHtml }}
        />

        {/* Call to Action Box */}
        <div className="mt-12 rounded-2xl border border-primary/20 bg-primary/5 p-6 sm:p-8 text-center">
          <h3 className="text-xl sm:text-2xl font-bold text-main mb-2">
            Trải nghiệm tự học tiếng Trung thông minh cùng ChongZi
          </h3>
          <p className="text-sm text-mute max-w-xl mx-auto mb-6 leading-relaxed">
            Học từ vựng với thuật toán FSRS-4.5, tra cứu 214 bộ thủ, tập viết chữ Hán và luyện thi 77 đề HSK 1 - 6 trọn bộ hoàn toàn miễn phí.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/hsk-exams"
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-sm hover:opacity-95 transition-opacity"
            >
              <GraduationCap className="h-4 w-4" />
              <span>Thi thử HSK miễn phí</span>
            </Link>
            <Link
              to="/study"
              className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-5 py-2.5 text-xs sm:text-sm font-semibold text-main hover:bg-surface-hover transition-colors"
            >
              <BookOpen className="h-4 w-4 text-primary" />
              <span>Học Flashcard FSRS</span>
            </Link>
          </div>
        </div>

        {/* Related Articles */}
        {relatedPosts.length > 0 && (
          <section className="mt-14 pt-8 border-t border-border">
            <h3 className="text-lg font-bold text-main mb-6">Bài viết cùng chuyên mục</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {relatedPosts.map((rel) => (
                <Link
                  key={rel.id}
                  to={`/blog/${rel.slug}`}
                  className="group rounded-xl border border-border bg-surface p-5 transition-all hover:border-primary/40 hover:shadow-sm"
                >
                  <div className="flex items-center gap-2 text-[11px] text-mute mb-2">
                    <span className="rounded bg-surface-hover px-2 py-0.5">{rel.category}</span>
                    <span>{rel.readTime}</span>
                  </div>
                  <h4 className="text-sm font-bold text-main group-hover:text-primary transition-colors leading-snug mb-1">
                    {rel.title}
                  </h4>
                  <p className="text-xs text-mute line-clamp-2 leading-relaxed">
                    {rel.summary}
                  </p>
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-surface/80 py-8 px-4 sm:px-6 transition-colors mt-12">
        <div className="mx-auto max-w-4xl flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-mute">
          <div className="flex items-center gap-2">
            <img src="/ap2.png" alt="ChongZi" className="h-5 w-5 rounded" />
            <span className="font-medium text-main">ChongZi Tiếng Trung</span>
            <span>- chongziapp.id.vn</span>
          </div>
          <div className="flex items-center gap-6">
            <Link to="/blog" className="hover:text-main transition-colors">Tất cả bài viết</Link>
            <Link to="/hsk-exams" className="hover:text-main transition-colors">Luyện thi HSK</Link>
            <Link to="/" className="hover:text-main transition-colors">Về trang chủ</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
