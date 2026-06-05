import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import api from '../services/api';
import { Trophy, Flame, Layers, Award, Medal, Users, RefreshCw } from 'lucide-react';

export default function LeaderboardScreen() {
  const [ranking, setRanking] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const currentUser = useSelector((state) => state.auth.user);

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await api.get('/api/social/leaderboard');
      setRanking(res.data || []);
    } catch (err) {
      console.error(err);
      setError('Không thể tải bảng xếp hạng học tập.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] text-mute gap-3 animate-pulse">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <span className="text-sm font-medium">Đang tải bảng xếp hạng học viên...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12 max-w-md mx-auto">
        <Trophy size={48} className="mx-auto text-stone mb-3" />
        <h3 className="font-bold text-ink dark:text-on-dark text-base mb-2">Đã xảy ra lỗi</h3>
        <p className="text-xs text-mute mb-4">{error}</p>
        <button
          onClick={fetchLeaderboard}
          className="px-4 py-2 bg-primary hover:bg-primary-deep text-white text-xs font-bold rounded-lg cursor-pointer transition-colors"
        >
          Tải lại
        </button>
      </div>
    );
  }

  // Separate top 3 for the podium
  const topThree = ranking.slice(0, 3);
  const remainingRank = ranking.slice(3);

  // Re-order top three for visual podium layout: [Rank #2, Rank #1, Rank #3]
  const podiumLayout = [];
  if (topThree[1]) podiumLayout.push({ ...topThree[1], pos: 2 });
  if (topThree[0]) podiumLayout.push({ ...topThree[0], pos: 1 });
  if (topThree[2]) podiumLayout.push({ ...topThree[2], pos: 3 });

  // Find current user rank
  const currentUserRankIndex = ranking.findIndex(u => u.id === currentUser?.id);
  const currentUserRank = currentUserRankIndex !== -1 ? currentUserRankIndex + 1 : null;
  const currentUserRankData = currentUserRankIndex !== -1 ? ranking[currentUserRankIndex] : null;

  return (
    <div className="space-y-8 max-w-4xl mx-auto pb-12 animate-fade-in text-left">
      
      {/* Header */}
      <div className="flex items-center justify-between border-b border-hairline dark:border-divider-dark pb-6">
        <div>
          <h1 className="text-2xl font-display font-extrabold text-ink dark:text-on-dark flex items-center gap-2">
            <Trophy className="text-amber-500 animate-bounce" />
            Đấu Trường Học Tập
          </h1>
          <p className="text-xs text-mute dark:text-on-dark-mute mt-1">
            Bảng xếp hạng vinh danh những học viên chăm chỉ và kiên trì nhất hệ thống.
          </p>
        </div>
        <button
          onClick={fetchLeaderboard}
          className="p-2 border border-hairline dark:border-divider-dark rounded-lg hover:bg-surface-bone dark:hover:bg-black text-mute hover:text-ink transition-colors cursor-pointer"
          title="Tải lại bảng xếp hạng"
        >
          <RefreshCw size={16} />
        </button>
      </div>

      {/* Podium for top 3 */}
      {topThree.length > 0 && (
        <div className="flex flex-row items-end justify-center gap-4 lg:gap-8 pt-8 px-4">
          {podiumLayout.map((player) => {
            const isRank1 = player.pos === 1;
            const isRank2 = player.pos === 2;
            const isCurrent = player.id === currentUser?.id;

            return (
              <div 
                key={player.id} 
                className={`flex-1 flex flex-col items-center text-center transition-all ${
                  isRank1 ? 'scale-105 z-10' : 'scale-95'
                }`}
              >
                {/* Avatar with Ring */}
                <div className="relative mb-3 group">
                  <div className={`h-16 w-16 lg:h-20 lg:w-20 rounded-full flex items-center justify-center font-bold text-lg text-ink bg-surface-card border-2 shadow-md overflow-hidden ${
                    isRank1 
                      ? 'border-amber-400 ring-4 ring-amber-400/20' 
                      : isRank2 
                        ? 'border-stone-300 ring-4 ring-stone-300/10' 
                        : 'border-amber-700 ring-4 ring-amber-700/10'
                  }`}>
                    {player.avatarUrl ? (
                      <img src={player.avatarUrl} alt="avatar" className="h-full w-full object-cover" />
                    ) : (
                      player.name.substring(0, 2).toUpperCase()
                    )}
                  </div>
                  {/* Badge position icon */}
                  <div className={`absolute -top-2 -right-1 h-6 w-6 rounded-full flex items-center justify-center text-xs font-black shadow-sm text-white ${
                    isRank1 
                      ? 'bg-amber-400' 
                      : isRank2 
                        ? 'bg-stone-400' 
                        : 'bg-amber-700'
                  }`}>
                    {player.pos}
                  </div>
                </div>

                {/* Player Name */}
                <div className="flex flex-col items-center gap-0.5">
                  <span className={`text-xs lg:text-sm font-bold truncate max-w-[100px] lg:max-w-[140px] block ${
                    isCurrent ? 'text-primary' : 'text-ink dark:text-on-dark'
                  }`}>
                    {player.name}
                  </span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    {/* Streak Badge */}
                    <div className="flex items-center gap-0.5 text-[10px] font-bold text-amber-500 font-mono">
                      <Flame size={12} fill="currentColor" />
                      {player.currentStreak}
                    </div>
                    <span className="text-mute/40">|</span>
                    {/* Reps Badge */}
                    <div className="flex items-center gap-0.5 text-[10px] font-bold text-primary font-mono">
                      <Layers size={12} />
                      {player.totalRepetitions}
                    </div>
                  </div>
                </div>

                {/* Pedestal block */}
                <div className={`w-full mt-4 rounded-t-lg shadow-sm border-t border-x border-hairline dark:border-divider-dark ${
                  isRank1 
                    ? 'h-24 bg-amber-400/10 dark:bg-amber-400/5 border-amber-400/20' 
                    : isRank2 
                      ? 'h-18 bg-stone-400/10 dark:bg-stone-400/5 border-stone-400/20' 
                      : 'h-14 bg-amber-700/10 dark:bg-amber-700/5 border-amber-700/20'
                } flex items-center justify-center`}>
                  <div className="text-[10px] font-black uppercase text-mute tracking-wider">
                    {player.pos === 1 ? 'Quán quân' : player.pos === 2 ? 'Á quân' : 'Hạng 3'}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Main Ranking Table */}
      <div className="bg-surface-card dark:bg-surface-dark border border-hairline dark:border-divider-dark rounded-xl p-5 shadow-xs">
        <h3 className="font-bold text-ink dark:text-on-dark text-sm mb-4 flex items-center gap-2">
          <Award size={18} className="text-primary" />
          Bảng điểm tổng hợp (Top 20)
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-hairline dark:border-divider-dark text-[10px] uppercase text-mute font-bold tracking-wider">
                <th className="pb-3 pl-2 w-16">Hạng</th>
                <th className="pb-3">Học viên</th>
                <th className="pb-3 text-center">Chuỗi ngày (Streak)</th>
                <th className="pb-3 text-center">Lượt học bài (Reps)</th>
                <th className="pb-3 text-right pr-4">Tổng điểm</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-hairline dark:divide-divider-dark text-xs text-body dark:text-on-dark-mute">
              {remainingRank.map((player, idx) => {
                const rankNum = idx + 4;
                const isCurrent = player.id === currentUser?.id;
                return (
                  <tr 
                    key={player.id} 
                    className={`hover:bg-surface-bone/20 dark:hover:bg-black/15 transition-colors ${
                      isCurrent ? 'bg-primary/5 dark:bg-primary/5 font-bold' : ''
                    }`}
                  >
                    <td className="py-3.5 pl-2 font-mono font-bold text-mute text-center">
                      #{rankNum}
                    </td>
                    <td className="py-3.5">
                      <div className="flex items-center gap-2">
                        <div className="h-7 w-7 rounded-full bg-surface-bone dark:bg-black font-bold flex items-center justify-center text-[10px] shadow-xs text-ink dark:text-on-dark overflow-hidden border border-hairline dark:border-divider-dark">
                          {player.avatarUrl ? (
                            <img src={player.avatarUrl} alt="avatar" className="h-full w-full object-cover" />
                          ) : (
                            player.name.substring(0, 2).toUpperCase()
                          )}
                        </div>
                        <span className={isCurrent ? 'text-primary font-bold' : 'text-ink dark:text-on-dark font-medium'}>
                          {player.name}
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 text-center font-mono font-semibold">
                      <span className="text-amber-500 inline-flex items-center gap-0.5">
                        <Flame size={12} fill="currentColor" />
                        {player.currentStreak} ngày
                      </span>
                    </td>
                    <td className="py-3.5 text-center font-mono font-semibold text-primary">
                      {player.totalRepetitions}
                    </td>
                    <td className="py-3.5 text-right pr-4 font-mono font-bold text-ink dark:text-on-dark">
                      {player.score.toLocaleString()}
                    </td>
                  </tr>
                );
              })}
              {ranking.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center py-6 italic text-mute">
                    Chưa có xếp hạng. Hãy học bài để trở thành người đứng đầu!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Floating Card for Current User Position */}
      {currentUserRank && (
        <div className="bg-primary/10 border border-primary/20 rounded-xl p-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-primary text-white font-black rounded-xl flex items-center justify-center text-sm shadow-md">
              #{currentUserRank}
            </div>
            <div>
              <h4 className="font-bold text-sm text-ink dark:text-on-dark">Thứ hạng của bạn</h4>
              <p className="text-[11px] text-mute dark:text-on-dark-mute">
                Bạn đã tích lũy được {currentUserRankData?.score.toLocaleString()} điểm học tập.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex flex-col items-center">
              <span className="text-[9px] uppercase font-bold text-mute">Chuỗi ngày</span>
              <span className="text-sm font-bold text-amber-500 flex items-center gap-0.5">
                <Flame size={14} fill="currentColor" />
                {currentUserRankData?.currentStreak}
              </span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-[9px] uppercase font-bold text-mute">Lượt Reps</span>
              <span className="text-sm font-bold text-primary flex items-center gap-0.5">
                <Layers size={14} />
                {currentUserRankData?.totalRepetitions}
              </span>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
