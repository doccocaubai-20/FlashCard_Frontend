import React, { useState } from 'react';
import {
  Mic,
  PhoneCall,
  Sparkles,
  BookOpen,
  Award,
  Volume2,
  CheckCircle2,
  Headphones,
  GraduationCap,
} from 'lucide-react';
import VoiceConversation from '../components/speaking-tutor/VoiceConversation';
import PronunciationDoctor from '../components/speaking-tutor/PronunciationDoctor';
import FreestyleMonologue from '../components/speaking-tutor/FreestyleMonologue';

export default function SpeakingTutorScreen() {
  const [activeTab, setActiveTab] = useState('conversation'); // 'conversation' | 'pronunciation' | 'monologue'

  const TABS = [
    {
      id: 'conversation',
      label: 'Đối đáp thoại 1-1',
      subtitle: 'Đàm thoại giọng nói theo tình huống thực tế',
      icon: PhoneCall,
    },
    {
      id: 'pronunciation',
      label: 'Bác sĩ Phát âm HSK',
      subtitle: 'Luyện chuẩn từng câu & sửa lệch thanh điệu',
      icon: Award,
    },
    {
      id: 'monologue',
      label: 'Sửa khẩu ngữ bản xứ',
      subtitle: 'Thuyết trình tự do & xem Native Rephrase',
      icon: Sparkles,
    },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12 select-none">
      {/* Hero Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-primary/10 via-teal-500/5 to-primary/5 border border-primary/20 shadow-xs">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/15 text-primary text-xs font-bold border border-primary/25">
            <Headphones size={13} />
            <span>Phòng Luyện Nói AI Tương Tác 1-1</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-ink dark:text-on-dark tracking-tight">
            Gia Sư AI Luyện Nói Tiếng Trung
          </h1>

          <p className="text-xs sm:text-sm text-mute max-w-xl leading-relaxed">
            Học nói phản xạ 100% bằng âm thanh, uốn nắn thanh điệu Pinyin và nâng cấp khẩu ngữ tự nhiên như người bản xứ cùng công nghệ Gemini Live Voice.
          </p>
        </div>

        {/* Feature Highlights Pills */}
        <div className="flex flex-col gap-2 shrink-0 text-xs font-semibold">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/80 dark:bg-white/5 border border-hairline dark:border-white/10 text-ink/80 dark:text-on-dark/80">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Âm thanh Gemini Live 24kHz</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/80 dark:bg-white/5 border border-hairline dark:border-white/10 text-ink/80 dark:text-on-dark/80">
            <span className="w-2 h-2 rounded-full bg-primary" />
            <span>Nhận diện thanh điệu HSK 1 - 6</span>
          </div>
        </div>
      </div>

      {/* Main Mode Navigation Tabs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 p-1.5 rounded-2xl bg-surface-bone/70 dark:bg-white/5 border border-hairline dark:border-white/10">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-3 p-3 rounded-xl transition-all cursor-pointer text-left ${
                isActive
                  ? 'bg-white dark:bg-[#1a2332] text-primary shadow-sm border border-hairline/80 dark:border-white/10'
                  : 'text-mute hover:text-ink dark:hover:text-on-dark hover:bg-black/5 dark:hover:bg-white/5'
              }`}
            >
              <div
                className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 ${
                  isActive
                    ? 'bg-primary/10 text-primary'
                    : 'bg-surface-bone dark:bg-white/5 text-mute'
                }`}
              >
                <Icon size={18} />
              </div>
              <div className="min-w-0">
                <span
                  className={`font-bold text-xs block truncate ${
                    isActive ? 'text-ink dark:text-on-dark' : ''
                  }`}
                >
                  {tab.label}
                </span>
                <span className="text-[10px] text-mute block truncate">
                  {tab.subtitle}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Tab Content Panels */}
      <div className="pt-2">
        {activeTab === 'conversation' && <VoiceConversation />}
        {activeTab === 'pronunciation' && <PronunciationDoctor />}
        {activeTab === 'monologue' && <FreestyleMonologue />}
      </div>
    </div>
  );
}
