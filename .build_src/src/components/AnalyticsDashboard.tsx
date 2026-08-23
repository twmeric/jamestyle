import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '../store/appStore';
import { SLIDES } from '../data/slides';
import {
  fetchAnalyticsSummary,
  fetchSlideHeatmap,
  fetchFanScores,
  fetchOpeningFunnel,
  fetchEngagementAnalytics,
  fetchWhatsAppLeads,
  fetchConversionFunnel,
  fetchCardDownloads,
  fetchCustomerJourney,
  fetchQuoteReactions,
  fetchSubscribers,
  fetchDropOff,
  fetchContentPerformance,
  fetchConversionPaths,
  fetchSetting,
  updateSetting,
} from '../api/reactionsApi';

interface Props {
  onClose: () => void;
}

// Format timestamp to readable date — handles ISO string or unix epoch
function formatDate(ts: string | number | null | undefined): string {
  if (ts == null) return '-';
  let d: Date;
  if (typeof ts === 'string') {
    // ISO 8601 string (YYYY-MM-DDTHH:mm:ss)
    d = new Date(ts.endsWith('Z') || ts.includes('+') ? ts : ts + 'Z');
  } else {
    // Unix epoch in seconds
    d = new Date(ts < 1e12 ? ts * 1000 : ts);
  }
  if (isNaN(d.getTime())) return '-';
  return d.toLocaleString('zh-HK', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatDuration(sec: number): string {
  if (sec < 60) return `${sec}秒`;
  if (sec < 3600) return `${Math.floor(sec / 60)}分${sec % 60}秒`;
  return `${Math.floor(sec / 3600)}時${Math.floor((sec % 3600) / 60)}分`;
}

// Simple bar for visualizations
function Bar({ value, max, color = 'bg-james-orange' }: { value: number; max: number; color?: string }) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden">
      <motion.div
        className={`h-full ${color} rounded-full`}
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
      />
    </div>
  );
}

export default function AnalyticsDashboard({ onClose }: Props) {
  const { lang } = useAppStore();
  const t = (tc: string, sc: string) => lang === 'sc' ? sc : tc;

  const [summary, setSummary] = useState<any>(null);
  const [heatmap, setHeatmap] = useState<any>(null);
  const [fanData, setFanData] = useState<any>(null);
  const [timeline, setTimeline] = useState<any>(null);
  const [openingFunnel, setOpeningFunnel] = useState<any>(null);
  const [deviceAnalytics, setDeviceAnalytics] = useState<any>(null);
  const [engagement, setEngagement] = useState<any>(null);
  const [whatsappData, setWhatsappData] = useState<any>(null);
  const [conversionFunnel, setConversionFunnel] = useState<any>(null);
  const [cardDownloads, setCardDownloads] = useState<any>(null);
  const [customers, setCustomers] = useState<any[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [customerJourney, setCustomerJourney] = useState<any>(null);
  const [quoteReactions, setQuoteReactions] = useState<any>(null);
  const [subscribers, setSubscribers] = useState<any>(null);
  const [dropOff, setDropOff] = useState<any>(null);
  const [contentPerf, setContentPerf] = useState<any>(null);
  const [conversionPaths, setConversionPaths] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'opening' | 'heatmap' | 'fans' | 'emotions' | 'whatsapp' | 'customers' | 'quote-reactions' | 'subscribers'>('overview');
  const [loading, setLoading] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [adminPhone, setAdminPhone] = useState('85268810677');
  const [settingsMsg, setSettingsMsg] = useState('');

  // Debug: global click tracking
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      console.log('[Analytics] Global click on:', target.tagName, target.className, target.textContent?.slice(0, 20));
    };
    document.addEventListener('click', handler, true);
    return () => document.removeEventListener('click', handler, true);
  }, []);

  useEffect(() => {
    fetchSetting('admin_phone').then((v) => {
      if (v) setAdminPhone(v);
    });
  }, []);

  useEffect(() => {
    Promise.all([
      fetchAnalyticsSummary(),
      fetchSlideHeatmap(),
      fetchFanScores(),
      fetchOpeningFunnel(),
      fetchEngagementAnalytics(),
      fetchWhatsAppLeads(),
      fetchConversionFunnel(),
      fetchCardDownloads(),
      fetchQuoteReactions(),
      fetchSubscribers(),
      fetchDropOff(),
      fetchContentPerformance(),
      fetchConversionPaths(),
    ]).then(([s, h, f, o, e, w, cf, cd, qr, sub, dOff, cPerf, cPath]) => {
      setSummary(s);
      setHeatmap(h);
      setFanData(f);
      setOpeningFunnel(o);
      setEngagement(e);
      setWhatsappData(w);
      setConversionFunnel(cf);
      setCardDownloads(cd);
      setQuoteReactions(qr);
      setSubscribers(sub);
      setDropOff(dOff);
      setContentPerf(cPerf);
      setConversionPaths(cPath);
      if (w?.customers) setCustomers(w.customers);
      setLoading(false);
    });
  }, []);

  const tabs = [
    { id: 'overview' as const, label: t('📊 總覽', '📊 总览') },
    { id: 'opening' as const, label: t('🌅 開場漏斗', '🌅 开场漏斗') },
    { id: 'heatmap' as const, label: t('🔥 作品熱力', '🔥 作品热力') },
    { id: 'quote-reactions' as const, label: t('📜 語錄反應', '📜 语录反应') },
    { id: 'fans' as const, label: t('❤️ 粉絲指數', '❤️ 粉丝指数') },
    { id: 'emotions' as const, label: t('🎨 情緒光譜', '🎨 情绪光谱') },
    { id: 'whatsapp' as const, label: t('💬 卡片轉化', '💬 卡片转化') },
    { id: 'subscribers' as const, label: t('🔔 訂閱用戶', '🔔 订阅用户') },
    { id: 'customers' as const, label: t('👤 客戶詳情', '👤 客户详情') },
  ];

  function getTabData() {
    switch (activeTab) {
      case 'overview': return summary;
      case 'opening': return openingFunnel;
      case 'heatmap': return heatmap;
      case 'fans': return fanData;
      case 'emotions': return engagement;
      case 'whatsapp': return { ...whatsappData, conversionFunnel, cardDownloads };
      case 'customers': return customers;
      case 'quote-reactions': return quoteReactions;
      case 'subscribers': return subscribers;
      default: return null;
    }
  }

  function exportData(format: 'csv' | 'json') {
    const data = getTabData();
    if (!data) return;

    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
    const filename = `jamestyle-${activeTab}-${timestamp}.${format}`;

    let blob: Blob;
    if (format === 'json') {
      blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    } else {
      // Simple CSV conversion for arrays
      const rows = Array.isArray(data) ? data : [data];
      if (rows.length === 0) return;
      const keys = Object.keys(rows[0]);
      const csv = [
        keys.join(','),
        ...rows.map((row: any) => keys.map((k) => {
          const v = row[k];
          const str = v == null ? '' : typeof v === 'object' ? JSON.stringify(v) : String(v);
          return '"' + str.replace(/"/g, '""') + '"';
        }).join(',')),
      ].join('\n');
      blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    }

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  return (
    <div className="fixed inset-0 z-[70] bg-james-dark text-warm-light overflow-y-auto">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-james-dark/95 backdrop-blur-sm border-b border-warm-gold/10">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            <h1 className="text-lg text-warm-gold tracking-wider">{t('🔬 阿占數據實驗室', '🔬 阿占数据实验室')}</h1>
            <p className="text-xs text-cream/60 mt-0.5">Data Science Dashboard</p>
          </div>
          <div className="flex items-center gap-2">
            <div
              onClick={() => {
                console.log('[Analytics] Settings clicked!');
                setShowSettings(true);
              }}
              className="bg-red-600 text-white text-xs px-3 py-1.5 rounded cursor-pointer select-none"
            >
              {t('設置', '设置')}
            </div>
            <button
              onClick={() => exportData('json')}
              className="text-warm-light/50 hover:text-warm-light text-sm px-3 py-1 border border-warm-light/20 rounded"
              title={t('導出 JSON', '导出 JSON')}
            >
              📥 JSON
            </button>
            <button
              onClick={() => exportData('csv')}
              className="text-warm-light/50 hover:text-warm-light text-sm px-3 py-1 border border-warm-light/20 rounded"
              title={t('導出 CSV', '导出 CSV')}
            >
              📥 CSV
            </button>
            <button
              onClick={onClose}
              className="text-warm-light/50 hover:text-warm-light text-sm px-3 py-1 border border-warm-light/20 rounded"
            >
              {t('✕ 關閉', '✕ 关闭')}
            </button>
          </div>
        </div>

        {/* Tab bar */}
        <div className="max-w-4xl mx-auto px-4 flex gap-1 pb-2 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 text-xs tracking-wider rounded-t transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-warm-gold/20 text-warm-gold border-b-2 border-warm-gold'
                  : 'text-cream/60 hover:text-cream/80'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
              className="text-4xl mb-4"
            >
              🔬
            </motion.div>
            <p className="text-cream/60 text-sm">{t('正在分析數據...', '正在分析数据...')}</p>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {activeTab === 'overview' && <OverviewTab summary={summary} engagement={engagement} dropOff={dropOff} contentPerf={contentPerf} conversionPaths={conversionPaths} lang={lang} />}
              {activeTab === 'opening' && <OpeningFunnelTab funnel={openingFunnel} lang={lang} />}
              {activeTab === 'heatmap' && <HeatmapTab heatmap={heatmap} lang={lang} />}
              {activeTab === 'fans' && <FansTab fanData={fanData} lang={lang} />}
              {activeTab === 'emotions' && <EmotionSpectrumTab engagement={engagement} lang={lang} />}
              {activeTab === 'whatsapp' && <WhatsappLeadsTab data={whatsappData} conversionFunnel={conversionFunnel} cardDownloads={cardDownloads} lang={lang} />}
              {activeTab === 'quote-reactions' && <QuoteReactionsTab data={quoteReactions} lang={lang} />}
              {activeTab === 'subscribers' && <SubscribersTab data={subscribers} lang={lang} />}
              {activeTab === 'customers' && <CustomersTab customers={customers} customerJourney={customerJourney} setCustomerJourney={setCustomerJourney} lang={lang} />}
            </motion.div>
          </AnimatePresence>
        )}
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={() => setShowSettings(false)}
        >
          <div
            className="bg-james-dark border border-warm-gold/20 rounded-2xl p-6 w-80 max-w-[90vw]"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-sm text-warm-gold tracking-wider mb-4">{t('⚙️ 系統設置', '⚙️ 系统设置')}</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-cream/60 mb-1.5">{t('WhatsApp 客服號碼', 'WhatsApp 客服号码')}</label>
                <input
                  type="text"
                  value={adminPhone}
                  onChange={(e) => setAdminPhone(e.target.value.replace(/\D/g, ''))}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-cream focus:outline-none focus:border-warm-gold/50"
                  placeholder="852xxxxxxxx"
                />
                <p className="text-[10px] text-cream/40 mt-1">{t('格式：852 開頭，不需要 + 號', '格式：852 开头，不需要 + 号')}</p>
              </div>
              {settingsMsg && (
                <div className={`text-xs text-center ${settingsMsg.includes('成功') || settingsMsg.includes('Success') ? 'text-green-400' : 'text-red-400'}`}>
                  {settingsMsg}
                </div>
              )}
              <div className="flex gap-2">
                <button
                  onClick={async () => {
                    const ok = await updateSetting('admin_phone', adminPhone);
                    setSettingsMsg(ok ? t('✅ 保存成功', '✅ 保存成功') : t('❌ 保存失敗', '❌ 保存失败'));
                    setTimeout(() => setSettingsMsg(''), 3000);
                  }}
                  className="flex-1 bg-warm-gold/20 hover:bg-warm-gold/30 text-warm-gold text-sm py-2 rounded-lg transition-colors"
                >
                  {t('保存', '保存')}
                </button>
                <button
                  onClick={() => setShowSettings(false)}
                  className="flex-1 bg-white/5 hover:bg-white/10 text-cream/70 text-sm py-2 rounded-lg transition-colors"
                >
                  {t('取消', '取消')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================
// TAB: 總覽
// ============================================================
function OverviewTab({ summary, engagement, dropOff, contentPerf, conversionPaths, lang }: { summary: any; engagement: any; dropOff: any; contentPerf: any; conversionPaths: any; lang: 'tc' | 'sc' }) {
  const t = (tc: string, sc: string) => lang === 'sc' ? sc : tc;
  if (!summary) return <EmptyState lang={lang} />;

  const stats = [
    { label: t('總訪客數', '总访客数'), value: summary.totalSessions, emoji: '👤', color: 'text-blue-400' },
    { label: t('總反應數', '总反应数'), value: summary.totalReactions, emoji: '💬', color: 'text-pink-400' },
    { label: t('完成率', '完成率'), value: `${summary.completionRate}%`, emoji: '🏁', color: 'text-green-400' },
    { label: t('平均瀏覽到第', '平均浏览到第'), value: `#${summary.avgMaxSlide}`, emoji: '📖', color: 'text-orange-400' },
    { label: t('行為事件', '行为事件'), value: summary.totalEvents, emoji: '📊', color: 'text-cyan-400' },
  ];

  // New engagement stats (only show if engagement data exists)
  const engagementStats = engagement ? [
    { label: t('聲音開啟率', '声音开启率'), value: `${engagement.soundToggle?.rate || 0}%`, emoji: '🔊', color: 'text-yellow-400' },
    { label: t('拼貼生成數', '拼贴生成数'), value: engagement.collageCount || 0, emoji: '🖼️', color: 'text-emerald-400' },
    { label: t('WhatsApp分享', 'WhatsApp分享'), value: engagement.whatsappShareCount || 0, emoji: '💬', color: 'text-green-400' },
    { label: t('語錄瀏覽', '语录浏览'), value: engagement.galleryPageViewCount || 0, emoji: '👁️', color: 'text-blue-400' },
    { label: t('平均每場成就', '平均每场成就'), value: engagement.achievementSummary?.avgPerAllSessions || '0.00', emoji: '🏆', color: 'text-amber-400' },
  ] : [];

  return (
    <div className="space-y-8">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {stats.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="bg-white/5 rounded-xl p-4 border border-white/5"
          >
            <div className="text-2xl mb-1">{s.emoji}</div>
            <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-xs text-cream/60 mt-1">{s.label}</div>
          </motion.div>
        ))}
      </div>

      {/* Engagement Stats */}
      {engagementStats.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          {engagementStats.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="bg-white/5 rounded-xl p-4 border border-white/5"
            >
              <div className="text-2xl mb-1">{s.emoji}</div>
              <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
              <div className="text-xs text-cream/60 mt-1">{s.label}</div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Reaction Distribution */}
      <div className="bg-white/5 rounded-xl p-5 border border-white/5">
        <h3 className="text-sm text-warm-gold tracking-wider mb-4">{t('💕 反應類型分佈', '💕 反应类型分布')}</h3>
        <div className="space-y-3">
          {(summary.reactionDistribution || []).map((r: any) => {
            const emoji = r.reactionType === 'heart' ? '❤️' : r.reactionType === 'like' ? '👍' : '📤';
            const maxCount = Math.max(...(summary.reactionDistribution || []).map((d: any) => d.count));
            return (
              <div key={r.reactionType} className="flex items-center gap-3">
                <span className="text-lg w-6">{emoji}</span>
                <div className="flex-1">
                  <Bar value={r.count} max={maxCount} />
                </div>
                <span className="text-sm text-cream/80 w-12 text-right">{r.count}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Device Distribution */}
      <div className="bg-white/5 rounded-xl p-5 border border-white/5">
        <h3 className="text-sm text-warm-gold tracking-wider mb-4">{t('📱 裝置分佈', '📱 装置分布')}</h3>
        <div className="space-y-2">
          {(summary.deviceDistribution || []).map((d: any) => {
            const emoji = d.deviceType === 'mobile' ? '📱' : d.deviceType === 'tablet' ? '📱' : '🖥️';
            const label = d.deviceType === 'mobile' ? t('手機', '手机') : d.deviceType === 'tablet' ? t('平板', '平板') : d.deviceType === 'desktop' ? t('桌面', '桌面') : d.deviceType;
            return (
              <div key={d.deviceType} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                <span className="text-sm">{emoji} {label}</span>
                <span className="text-sm text-warm-gold">{d.count} 位</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Top Slides */}
      <div className="bg-white/5 rounded-xl p-5 border border-white/5">
        <h3 className="text-sm text-warm-gold tracking-wider mb-4">{t('🏆 最受歡迎作品 TOP 5', '🏆 最受欢迎作品 TOP 5')}</h3>
        <div className="space-y-3">
          {(summary.topSlides || []).map((s: any, i: number) => {
            const slide = SLIDES.find((sl) => sl.id === s.slideId);
            const maxCount = summary.topSlides?.[0]?.count || 1;
            const medals = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣'];
            return (
              <div key={s.slideId} className="flex items-center gap-3">
                <span className="text-lg">{medals[i]}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-cream/80 truncate mb-1">
                    #{s.slideId} {slide?.emoji} {slide?.title[lang]}
                  </div>
                  <Bar value={s.count} max={maxCount} color="bg-warm-gold" />
                </div>
                <span className="text-sm text-warm-gold w-10 text-right">{s.count}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Key Insights */}
      <div className="bg-gradient-to-br from-james-orange/10 to-warm-gold/10 rounded-xl p-5 border border-james-orange/20">
        <h3 className="text-sm text-james-orange tracking-wider mb-3">{t('🧠 關鍵洞見', '🧠 关键洞见')}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <InsightCard
            emoji={Number(summary.completionRate) > 50 ? '✅' : '⚠️'}
            title={t('完成率', '完成率') + ' ' + summary.completionRate + '%'}
            action={Number(summary.completionRate) > 50
              ? t('內容吸引力強勁，可考慮增加新作品', '内容吸引力强劲，可考虑增加新作品')
              : t('建議優化前 3 張作品，降低流失率', '建议优化前 3 张作品，降低流失率')}
          />
          <InsightCard
            emoji={Number(summary.avgMaxSlide) > 10 ? '🎯' : '🔻'}
            title={t('平均瀏覽到第', '平均浏览到第') + ' ' + summary.avgMaxSlide + t('張', '张')}
            action={Number(summary.avgMaxSlide) > 10
              ? t('用戶參與度深，適合在中段插入轉化 CTA', '用户参与度深，适合在中段插入转化 CTA')
              : t('第', '第') + ' ' + Math.ceil(Number(summary.avgMaxSlide)) + ' ' + t('張是流失關口，需強化內容', '张是流失关口，需强化内容')}
          />
          <InsightCard
            emoji={summary.topSlides?.[0] ? '🔥' : '📭'}
            title={t('最熱作品', '最热作品') + ': #' + (summary.topSlides?.[0]?.slideId || '-')}
            action={t('可複製該作品風格製作新內容', '可复制该作品风格制作新内容')}
          />
          <InsightCard
            emoji={summary.deviceDistribution?.find((d: any) => d.deviceType === 'mobile')?.count > (summary.totalSessions * 0.6) ? '📱' : '🖥️'}
            title={t('主力裝置', '主力装置')}
            action={summary.deviceDistribution?.find((d: any) => d.deviceType === 'mobile')?.count > (summary.totalSessions * 0.6)
              ? t('超過 60% 用戶用手機，確保移動端體驗流暢', '超过 60% 用户用手机，确保移动端体验流畅')
              : t('桌面用戶比例高，可考慮更豐富的視覺呈現', '桌面用户比例高，可考虑更丰富的视觉呈现')}
          />
        </div>
      </div>

      {/* Drop-off Alert */}
      {dropOff?.worstDropOff && (
        <div className="bg-gradient-to-br from-red-500/10 to-orange-500/10 rounded-xl p-5 border border-red-500/20">
          <h3 className="text-sm text-red-400 tracking-wider mb-3">{t('⚠️ 流失警報', '⚠️ 流失警报')}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <InsightCard
              emoji="🔻"
              title={t('第', '第') + dropOff.worstDropOff.slideId + t('張作品流失最嚴重', '张作品流失最严重')}
              action={t('流失率', '流失率') + ' ' + dropOff.worstDropOff.dropOffRate + '% — ' + t('建議強化此作品內容或互動設計', '建议强化此作品内容或互动设计')}
            />
            {(dropOff.dropOffs || []).slice(0, 5).map((d: any) => (
              <div key={d.slideId} className="bg-white/5 rounded-lg p-3 border border-white/5">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-cream/80">{t('第', '第')}{d.slideId}{t('張 → 第', '张 → 第')}{d.slideId + 1}{t('張', '张')}</span>
                  <span className="text-xs text-red-400 font-bold">-{d.dropOffRate}%</span>
                </div>
                <Bar value={Number(d.dropOffRate)} max={100} color="bg-red-400" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Content Performance */}
      {contentPerf?.slides && contentPerf.slides.length > 0 && (
        <div className="bg-white/5 rounded-xl p-5 border border-white/5">
          <h3 className="text-sm text-warm-gold tracking-wider mb-4">{t('🎯 內容效果對比', '🎯 内容效果对比')}</h3>
          <div className="space-y-3">
            {contentPerf.slides
              .sort((a: any, b: any) => Number(b.reactionRate) - Number(a.reactionRate))
              .slice(0, 5)
              .map((s: any, i: number) => {
                const slide = SLIDES.find((sl) => sl.id === s.slideId);
                return (
                  <div key={s.slideId} className="flex items-center gap-3 py-2 border-b border-white/5 last:border-0">
                    <span className="text-lg">{i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : '•'}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs text-cream/80 truncate">#{s.slideId} {slide?.emoji} {slide?.title[lang]}</div>
                      <div className="flex gap-3 mt-1">
                        <span className="text-[10px] text-pink-400">{t('反應率', '反应率')} {s.reactionRate}%</span>
                        <span className="text-[10px] text-green-400">{t('分享率', '分享率')} {s.shareRate}%</span>
                        <span className="text-[10px] text-cream/40">{s.views}{t('次瀏覽', '次浏览')}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* Conversion Paths */}
      {conversionPaths && (
        <div className="bg-white/5 rounded-xl p-5 border border-white/5">
          <h3 className="text-sm text-warm-gold tracking-wider mb-4">{t('🛣️ 轉化路徑', '🛣️ 转化路径')}</h3>
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white/5 rounded-lg p-3 border border-white/5 text-center">
              <div className="text-2xl">👀→💬</div>
              <div className="text-xl font-bold text-pink-400">{conversionPaths.viewToReaction || 0}%</div>
              <div className="text-[10px] text-cream/60 mt-1">{t('瀏覽後反應轉化', '浏览后反应转化')}</div>
            </div>
            <div className="bg-white/5 rounded-lg p-3 border border-white/5 text-center">
              <div className="text-2xl">💬→📱</div>
              <div className="text-xl font-bold text-green-400">{conversionPaths.reactionToWhatsApp || 0}%</div>
              <div className="text-[10px] text-cream/60 mt-1">{t('反應後 WhatsApp 轉化', '反应后 WhatsApp 转化')}</div>
            </div>
            <div className="bg-white/5 rounded-lg p-3 border border-white/5 text-center">
              <div className="text-2xl">🏁→📱</div>
              <div className="text-xl font-bold text-warm-gold">{conversionPaths.completeToWhatsApp || 0}%</div>
              <div className="text-[10px] text-cream/60 mt-1">{t('看完後 WhatsApp 轉化', '看完后 WhatsApp 转化')}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================
// TAB: 作品熱力圖
// ============================================================
function HeatmapTab({ heatmap, lang }: { heatmap: any; lang: 'tc' | 'sc' }) {
  const t = (tc: string, sc: string) => lang === 'sc' ? sc : tc;
  if (!heatmap) return <EmptyState lang={lang} />;

  // Build per-slide data
  const slideData = SLIDES.map((slide) => {
    const views = heatmap.viewCounts?.find((v: any) => v.slideId === slide.id)?.count || 0;
    const dwell = heatmap.dwellTimes?.find((d: any) => d.slideId === slide.id);
    const avgDwell = dwell ? Math.round(dwell.avgDwell / 1000) : 0; // convert ms to sec
    const insightViews = heatmap.insightViews?.find((iv: any) => iv.slideId === slide.id)?.count || 0;

    const reactions: Record<string, number> = {};
    (heatmap.reactionsBySlide || [])
      .filter((r: any) => r.slideId === slide.id)
      .forEach((r: any) => { reactions[r.reactionType] = r.count; });

    const totalReactions = Object.values(reactions).reduce((a: number, b: any) => a + Number(b), 0);

    return {
      ...slide,
      views,
      avgDwell,
      insightViews,
      reactions,
      totalReactions,
    };
  });

  const maxViews = Math.max(...slideData.map((s) => s.views), 1);
  const maxReactions = Math.max(...slideData.map((s) => s.totalReactions), 1);
  const maxDwell = Math.max(...slideData.map((s) => s.avgDwell), 1);

  return (
    <div className="space-y-4">
      <div className="bg-gradient-to-br from-james-orange/10 to-warm-gold/10 rounded-xl p-4 border border-james-orange/20 mb-4">
        <p className="text-xs text-cream/90">{t('🔬 此熱力圖展示每張作品的「吸引力密度」— 結合瀏覽次數、停留時間、反應數和解畫點擊率四個維度，幫助你理解哪些作品最能觸動訪客。', '🔬 此热力图展示每张作品的「吸引力密度」— 结合浏览次数、停留时间、反应数和解画点击率四个维度，帮助你理解哪些作品最能触动访客。')}</p>
      </div>

      {slideData.map((s, i) => {
        // Calculate "heat score" — normalized intensity
        const heatScore = (
          (s.views / maxViews) * 0.3 +
          (s.totalReactions / maxReactions) * 0.35 +
          (s.avgDwell / maxDwell) * 0.2 +
          (s.insightViews / Math.max(...slideData.map((x) => x.insightViews), 1)) * 0.15
        ) * 100;

        const heatColor =
          heatScore > 70 ? 'border-red-500/40 bg-red-500/5' :
          heatScore > 40 ? 'border-orange-500/30 bg-orange-500/5' :
          'border-white/10 bg-white/5';

        return (
          <motion.div
            key={s.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            className={`rounded-xl p-4 border ${heatColor}`}
          >
            <div className="flex items-start gap-3 mb-3">
              <span className="text-xl">{s.emoji}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm text-warm-gold">#{s.id}</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-cream/80">
                    🔥 {heatScore.toFixed(0)}
                  </span>
                </div>
                <p className="text-xs text-warm-light/50 truncate">{s.title[lang]}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-center gap-2">
                <span className="text-cream/60">{t('👁️ 瀏覽', '👁️ 浏览')}</span>
                <span className="text-warm-light/80">{s.views}{t('次', '次')}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-cream/60">{t('⏱️ 平均停留', '⏱️ 平均停留')}</span>
                <span className="text-warm-light/80">{s.avgDwell}{t('秒', '秒')}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-cream/60">{t('🔍 解畫', '🔍 解画')}</span>
                <span className="text-warm-light/80">{s.insightViews}{t('次', '次')}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-cream/60">{t('💬 反應', '💬 反应')}</span>
                <span className="text-warm-light/80">
                  ❤️{s.reactions['heart'] || 0} 👍{s.reactions['like'] || 0} 📤{s.reactions['share'] || 0}
                </span>
              </div>
            </div>

            {/* Heat bar */}
            <div className="mt-3">
              <Bar value={heatScore} max={100} color={heatScore > 70 ? 'bg-red-500' : heatScore > 40 ? 'bg-james-orange' : 'bg-white/30'} />
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

// ============================================================
// TAB: 粉絲指數
// ============================================================
function FansTab({ fanData, lang }: { fanData: any; lang: 'tc' | 'sc' }) {
  const t = (tc: string, sc: string) => lang === 'sc' ? sc : tc;
  if (!fanData) return <EmptyState lang={lang} />;

  return (
    <div className="space-y-6">
      {/* Fan Score Summary */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white/5 rounded-xl p-4 border border-white/5">
          <div className="text-2xl">🫂</div>
          <div className="text-2xl font-bold text-pink-400">{fanData.totalFans}</div>
          <div className="text-xs text-cream/60 mt-1">{t('追蹤粉絲數', '追踪粉丝数')}</div>
        </div>
        <div className="bg-white/5 rounded-xl p-4 border border-white/5">
          <div className="text-2xl">💯</div>
          <div className="text-2xl font-bold text-warm-gold">{fanData.avgScore}</div>
          <div className="text-xs text-cream/60 mt-1">{t('平均熱愛指數', '平均热爱指数')}</div>
        </div>
      </div>

      {/* Tier Distribution */}
      <div className="bg-white/5 rounded-xl p-5 border border-white/5">
        <h3 className="text-sm text-warm-gold tracking-wider mb-4">{t('🏅 粉絲等級分佈', '🏅 粉丝等级分布')}</h3>
        <div className="space-y-2">
          {Object.entries(fanData.tierDistribution || {}).map(([tierKey, cnt]) => {
            const tierLabels: Record<string, string> = {
              superfan: t('鐵粉', '铁粉'),
              loyal: t('忠實粉絲', '忠实粉丝'),
              active: t('活躍觀眾', '活跃观众'),
              regular: t('普通觀眾', '普通观众'),
              passerby: t('路人', '路人'),
            };
            return (
              <div key={tierKey} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                <span className="text-sm">{tierLabels[tierKey] || tierKey}</span>
                <span className="text-sm text-warm-gold">{cnt as number} 位</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Fan Score Formula Explanation */}
      <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-xl p-5 border border-purple-500/20">
        <h3 className="text-sm text-purple-400 tracking-wider mb-3">{t('🧮 阿占熱愛指數計算公式', '🧮 阿占热爱指数计算公式')}</h3>
        <div className="text-xs text-cream/80 space-y-1.5 font-mono">
          <p>{t('基礎分 = (反應次數 × 3) + (瀏覽作品數 × 2)', '基础分 = (反应次数 × 3) + (浏览作品数 × 2)')}</p>
          <p>{t('加分項：', '加分项：')}</p>
          <p className="pl-4">{t('+ 看完全部作品 = +20分', '+ 看完全部作品 = +20分')}</p>
          <p className="pl-4">{t('+ 每個反應過的不同作品 = +4分', '+ 每个反应过的不同作品 = +4分')}</p>
          <p className="mt-2 text-warm-gold">{t('最高 100 分', '最高 100 分')}</p>
        </div>
      </div>

      {/* Fan Leaderboard */}
      <div className="bg-white/5 rounded-xl p-5 border border-white/5">
        <h3 className="text-sm text-warm-gold tracking-wider mb-4">{t('🏆 粉絲排行榜', '🏆 粉丝排行榜')}</h3>
        {(fanData.fans || []).length === 0 ? (
          <p className="text-xs text-cream/50 text-center py-4">{t('暫無數據，等待訪客互動…', '暂无数据，等待访客互动…')}</p>
        ) : (
          <div className="space-y-3">
            {(fanData.fans || []).slice(0, 20).map((fan: any, i: number) => (
              <motion.div
                key={fan.sessionId}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.05 }}
                className="flex items-center gap-3 py-2 border-b border-white/5 last:border-0"
              >
                <span className="text-sm text-cream/50 w-6">#{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-xs text-cream/80 font-mono truncate max-w-[120px]">
                      {fan.sessionId.slice(0, 8)}...
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-white/10">
                      {fan.deviceType === 'mobile' ? '📱' : '🖥️'}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-cream/60">
                    <span>{t('📖 看', '📖 看')}{fan.slidesViewed}{t('張', '张')}</span>
                    <span>💬 {fan.totalReactions}{t('反應', '反应')}</span>
                    <span>{fan.completedGallery ? t('✅看完', '✅看完') : `➡️${t('到第', '到第')}${fan.maxSlideReached}${t('張', '张')}`}</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-warm-gold">{fan.score}</div>
                  <div className="text-xs text-cream/60">{
                    ({
                      superfan: t('鐵粉', '铁粉'),
                      loyal: t('忠實粉絲', '忠实粉丝'),
                      active: t('活躍觀眾', '活跃观众'),
                      regular: t('普通觀眾', '普通观众'),
                      passerby: t('路人', '路人'),
                    } as Record<string, string>)[fan.tier] || fan.tier
                  }</div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================
// TAB: 情緒光譜
// ============================================================
const EMOTION_META: Record<string, { emoji: string; label: [string, string]; color: string; barColor: string }> = {
  warm:  { emoji: '❤️', label: ['感動', '感动'], color: 'text-rose-400',    barColor: 'bg-rose-400' },
  cold:  { emoji: '😂', label: ['好笑', '好笑'], color: 'text-amber-400',   barColor: 'bg-amber-400' },
  dream: { emoji: '🍵', label: ['療癒', '疗愈'], color: 'text-emerald-400', barColor: 'bg-emerald-400' },
  dark:  { emoji: '💡', label: ['共鳴', '共鸣'], color: 'text-sky-400',     barColor: 'bg-sky-400' },
};

function EmotionSpectrumTab({ engagement, lang }: { engagement: any; lang: 'tc' | 'sc' }) {
  const t = (tc: string, sc: string) => lang === 'sc' ? sc : tc;
  if (!engagement?.emotionSpectrum) return <EmptyState lang={lang} />;

  const spectrum = engagement.emotionSpectrum;
  const emotionKeys = Object.keys(EMOTION_META);

  return (
    <div className="space-y-4">
      <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-xl p-4 border border-purple-500/20 mb-4">
        <p className="text-xs text-cream/90">
          {t('🎨 每張作品的情緒光譜由所有訪客的投票聚合而成。顏色條越長，代表越多人選擇了該情緒。', '🎨 每张作品的情绪光谱由所有访客的投票聚合而成。颜色条越长，代表越多人选择了该情绪。')}
        </p>
      </div>

      {SLIDES.map((slide, i) => {
        const votes = spectrum[slide.id] || {};
        const totalVotes = Object.values(votes).reduce((a: number, b: any) => a + Number(b), 0);
        const maxVotes = Math.max(
          ...Object.values(spectrum).flatMap((v: any) => Object.values(v).map((n: any) => Number(n))),
          1
        );

        return (
          <motion.div
            key={slide.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            className="bg-white/5 rounded-xl p-4 border border-white/5"
          >
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lg">{slide.emoji}</span>
              <span className="text-sm text-warm-gold">#{slide.id}</span>
              <span className="text-xs text-cream/60 truncate flex-1">{slide.title[lang]}</span>
              <span className="text-xs text-cream/50">{totalVotes} {t('票', '票')}</span>
            </div>

            {totalVotes === 0 ? (
              <p className="text-xs text-cream/40 text-center py-2">{t('暫無投票', '暂无投票')}</p>
            ) : (
              <div className="space-y-2">
                {emotionKeys.map((key) => {
                  const meta = EMOTION_META[key];
                  const count = votes[key] || 0;
                  const pct = totalVotes > 0 ? ((count / totalVotes) * 100).toFixed(0) : '0';
                  return (
                    <div key={key} className="flex items-center gap-2">
                      <span className="text-sm w-6">{meta.emoji}</span>
                      <span className={`text-xs w-6 ${meta.color}`}>{meta.label[lang === 'sc' ? 1 : 0]}</span>
                      <div className="flex-1">
                        <Bar value={count} max={maxVotes} color={meta.barColor} />
                      </div>
                      <span className="text-xs text-cream/70 w-14 text-right">{count} ({pct}%)</span>
                    </div>
                  );
                })}
              </div>
            )}
          </motion.div>
        );
      })}
    </div>
  );
}

// ============================================================
// TAB: 成就解鎖
// ============================================================
const ACHIEVEMENT_META: Record<string, { emoji: string; tc: string; sc: string; desc: [string, string] }> = {
  slow_reader:   { emoji: '🐢', tc: '慢活派',     sc: '慢活派',     desc: ['在任一作品停留超過15秒', '在任一作品停留超过15秒'] },
  bubble_popper: { emoji: '🫧', tc: '全盤托出',   sc: '全盘托出',   desc: ['戳破所有煩惱氣泡', '戳破所有烦恼气泡'] },
  return_visitor:{ emoji: '↩️', tc: '回頭客',     sc: '回头客',     desc: ['看完15張後回到第1張', '看完15张后回到第1张'] },
  night_owl:     { emoji: '🦉', tc: '深夜讀者',   sc: '深夜读者',   desc: ['在00:00-05:00訪問', '在00:00-05:00访问'] },
  streak_3days:  { emoji: '🔥', tc: '連續訪問者',  sc: '连续访问者',  desc: ['連續三天訪問', '连续三天访问'] },
  sound_on:      { emoji: '🔊', tc: '聲音探索者',  sc: '声音探索者',  desc: ['開啟沉浸式聲音', '开启沉浸式声音'] },
  collage_creator:{ emoji: '🖼️', tc: '拼貼藝術家', sc: '拼贴艺术家', desc: ['生成第一張拼貼作品', '生成第一张拼贴作品'] },
  emotion_voter: { emoji: '🎨', tc: '情緒感應者',  sc: '情绪感应者',  desc: ['投下第一張情緒票', '投下第一张情绪票'] },
  gallery_complete:{ emoji: '🏁', tc: '完美收藏家', sc: '完美收藏家', desc: ['看完全部15張作品', '看完全部15张作品'] },
};

function AchievementsTab({ engagement, lang }: { engagement: any; lang: 'tc' | 'sc' }) {
  const t = (tc: string, sc: string) => lang === 'sc' ? sc : tc;
  if (!engagement?.achievementStats) return <EmptyState lang={lang} />;

  const stats = engagement.achievementStats || {};
  const entries = Object.entries(stats)
    .map(([id, count]) => ({ id, count: count as number, meta: ACHIEVEMENT_META[id] }))
    .sort((a, b) => b.count - a.count);

  const maxCount = Math.max(...entries.map((e) => e.count), 1);
  const summary = engagement.achievementSummary || {};

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white/5 rounded-xl p-4 border border-white/5 text-center">
          <div className="text-2xl">🏆</div>
          <div className="text-xl font-bold text-warm-gold">{summary.totalAchievements || 0}</div>
          <div className="text-xs text-cream/60 mt-1">{t('總解鎖次數', '总解锁次数')}</div>
        </div>
        <div className="bg-white/5 rounded-xl p-4 border border-white/5 text-center">
          <div className="text-2xl">👤</div>
          <div className="text-xl font-bold text-warm-gold">{summary.sessionsWithAchievements || 0}</div>
          <div className="text-xs text-cream/60 mt-1">{t('解鎖用戶數', '解锁用户数')}</div>
        </div>
        <div className="bg-white/5 rounded-xl p-4 border border-white/5 text-center">
          <div className="text-2xl">📊</div>
          <div className="text-xl font-bold text-warm-gold">{summary.avgPerSession || '0.00'}</div>
          <div className="text-xs text-cream/60 mt-1">{t('人均成就數', '人均成就数')}</div>
        </div>
      </div>

      {/* Achievement List */}
      <div className="bg-white/5 rounded-xl p-5 border border-white/5">
        <h3 className="text-sm text-warm-gold tracking-wider mb-4">{t('🏅 成就解鎖排行', '🏅 成就解锁排行')}</h3>
        {entries.length === 0 ? (
          <p className="text-xs text-cream/50 text-center py-4">{t('暫無數據，等待訪客解鎖…', '暂无数据，等待访客解锁…')}</p>
        ) : (
          <div className="space-y-3">
            {entries.map((entry, i) => {
              const meta = entry.meta || { emoji: '❓', tc: entry.id, sc: entry.id, desc: ['', ''] };
              return (
                <motion.div
                  key={entry.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-center gap-3 py-2 border-b border-white/5 last:border-0"
                >
                  <span className="text-lg">{meta.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-cream/80">{lang === 'sc' ? meta.sc : meta.tc}</span>
                      <span className="text-[10px] text-cream/40">{meta.desc[lang === 'sc' ? 1 : 0]}</span>
                    </div>
                    <div className="mt-1">
                      <Bar value={entry.count} max={maxCount} color="bg-amber-400" />
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-bold text-warm-gold">{entry.count}</span>
                    <span className="text-xs text-cream/50 ml-1">{t('次', '次')}</span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================
// TAB: 時間趨勢
// ============================================================
function TimelineTab({ timeline, lang }: { timeline: any; lang: 'tc' | 'sc' }) {
  const t = (tc: string, sc: string) => lang === 'sc' ? sc : tc;
  if (!timeline) return <EmptyState lang={lang} />;

  const sessionsPerDay = timeline.sessionsPerDay || [];
  const reactionsPerDay = timeline.reactionsPerDay || [];

  const maxSessions = Math.max(...sessionsPerDay.map((d: any) => d.count), 1);
  const maxReactions = Math.max(...reactionsPerDay.map((d: any) => d.count), 1);

  return (
    <div className="space-y-6">
      {/* Sessions per day */}
      <div className="bg-white/5 rounded-xl p-5 border border-white/5">
        <h3 className="text-sm text-warm-gold tracking-wider mb-4">{t('👤 每日訪客數（近30日）', '👤 每日访客数（近30日）')}</h3>
        {sessionsPerDay.length === 0 ? (
          <p className="text-xs text-cream/50 text-center py-4">{t('暫無數據', '暂无数据')}</p>
        ) : (
          <div className="space-y-2">
            {sessionsPerDay.map((d: any) => (
              <div key={d.day} className="flex items-center gap-3">
                <span className="text-xs text-cream/60 w-16 shrink-0">{d.day?.slice(5)}</span>
                <div className="flex-1">
                  <Bar value={d.count} max={maxSessions} color="bg-blue-400" />
                </div>
                <span className="text-xs text-cream/80 w-8 text-right">{d.count}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Reactions per day */}
      <div className="bg-white/5 rounded-xl p-5 border border-white/5">
        <h3 className="text-sm text-warm-gold tracking-wider mb-4">{t('💬 每日反應數（近30日）', '💬 每日反应数（近30日）')}</h3>
        {reactionsPerDay.length === 0 ? (
          <p className="text-xs text-cream/50 text-center py-4">{t('暫無數據', '暂无数据')}</p>
        ) : (
          <div className="space-y-2">
            {reactionsPerDay.map((d: any) => (
              <div key={d.day} className="flex items-center gap-3">
                <span className="text-xs text-cream/60 w-16 shrink-0">{d.day?.slice(5)}</span>
                <div className="flex-1">
                  <Bar value={d.count} max={maxReactions} color="bg-pink-400" />
                </div>
                <span className="text-xs text-cream/80 w-8 text-right">{d.count}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Data Science notes */}
      <div className="bg-gradient-to-br from-james-orange/10 to-warm-gold/10 rounded-xl p-5 border border-james-orange/20">
        <h3 className="text-sm text-james-orange tracking-wider mb-3">{t('🔬 趨勢洞察', '🔬 趋势洞察')}</h3>
        <div className="text-xs text-cream/90 space-y-2 leading-relaxed">
          <p>{t('📌 觀察每日訪客數和反應數的比例，可以判斷「互動密度」— 即每位訪客平均產生多少反應', '📌 观察每日访客数和反应数的比例，可以判断「互动密度」— 即每位访客平均产生多少反应')}</p>
          <p>{t('📌 如果訪客數穩定但反應數下降，可能意味內容新鮮感減少', '📌 如果访客数稳定但反应数下降，可能意味内容新鲜感减少')}</p>
          <p>{t('📌 反應高峰日通常對應外部推廣或社群分享活動', '📌 反应高峰日通常对应外部推广或社群分享活动')}</p>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// TAB: Opening 漏斗
// ============================================================
function OpeningFunnelTab({ funnel, lang }: { funnel: any; lang: 'tc' | 'sc' }) {
  const t = (tc: string, sc: string) => lang === 'sc' ? sc : tc;
  if (!funnel) return <EmptyState lang={lang} />;

  const eventCounts = funnel.eventCounts || {};
  const total = eventCounts['page_view'] || 0;
  const bubblesPopped = eventCounts['bubble_popped'] || 0;
  const quotesSeen = eventCounts['quote_read'] || 0;
  const digestSeen = eventCounts['digest_quote_seen'] || 0;
  const carouselSeen = eventCounts['carousel_started'] || eventCounts['slideshow_started'] || 0;
  const completeSeen = eventCounts['opening_complete'] || 0;

  const steps = [
    { label: t('進入頁面', '进入页面'), count: total, emoji: '🌐' },
    { label: t('完成呼吸幕', '完成呼吸幕'), count: eventCounts['breathing_complete'] || 0, emoji: '🫁' },
    { label: t('戳破氣泡', '戳破气泡'), count: bubblesPopped, emoji: '🫧' },
    { label: t('看到金句', '看到金句'), count: quotesSeen, emoji: '💭' },
    { label: t('消化幕完成', '消化幕完成'), count: digestSeen, emoji: '🍵' },
    { label: t('開始輪播', '开始轮播'), count: carouselSeen, emoji: '🎠' },
    { label: t('完成全幕', '完成全幕'), count: completeSeen, emoji: '✨' },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-br from-james-orange/10 to-warm-gold/10 rounded-xl p-5 border border-james-orange/20">
        <h3 className="text-sm text-james-orange tracking-wider mb-3">{t('🌅 Opening 轉化漏斗', '🌅 Opening 转化漏斗')}</h3>
        <div className="space-y-3">
          {steps.map((step, i) => {
            const prevCount = i === 0 ? total : steps[i - 1].count;
            const conversion = prevCount > 0 ? ((step.count / prevCount) * 100).toFixed(1) : '0.0';
            const overall = total > 0 ? ((step.count / total) * 100).toFixed(1) : '0.0';
            const maxCount = Math.max(...steps.map((s) => s.count), 1);
            return (
              <div key={step.label} className="flex items-center gap-3">
                <span className="text-lg">{step.emoji}</span>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-cream/80">{step.label}</span>
                    <span className="text-xs text-warm-gold">{step.count} ({overall}%)</span>
                  </div>
                  <Bar value={step.count} max={maxCount} color="bg-james-orange" />
                  {i > 0 && (
                    <div className="text-[10px] text-cream/50 mt-0.5">
                      {t('步驟轉化', '步骤转化')}: {conversion}%
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-white/5 rounded-xl p-5 border border-white/5">
        <h3 className="text-sm text-warm-gold tracking-wider mb-4">{t('🫧 煩惱氣泡統計', '🫧 烦恼气泡统计')}</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-warm-gold">{bubblesPopped}</div>
            <div className="text-xs text-cream/60">{t('氣泡被戳破', '气泡被戳破')}</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-warm-gold">{quotesSeen}</div>
            <div className="text-xs text-cream/60">{t('金句被閱讀', '金句被阅读')}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// TAB: 裝置數據
// ============================================================
function DeviceTab({ device, lang }: { device: any; lang: 'tc' | 'sc' }) {
  const t = (tc: string, sc: string) => lang === 'sc' ? sc : tc;
  if (!device) return <EmptyState lang={lang} />;

  const total = device.total || 0;

  const distCards = [
    {
      title: t('📐 屏幕方向', '📐 屏幕方向'),
      data: device.orientationDist || [],
      keyField: 'orientation',
      emoji: (v: string) => v?.includes('landscape') ? '🖥️' : '📱',
      label: (v: string) => v?.includes('landscape') ? t('橫屏', '横屏') : t('豎屏', '竖屏'),
    },
    {
      title: t('🌐 網絡類型', '🌐 网络类型'),
      data: device.connectionDist || [],
      keyField: 'connectionType',
      emoji: (v: string) => v === 'wifi' ? '📶' : '📡',
      label: (v: string) => v === 'wifi' ? 'WiFi' : v === '4g' ? '4G' : v === '5g' ? '5G' : t('其他', '其他'),
    },
    {
      title: t('📱 操作系統', '📱 操作系统'),
      data: device.osDist || [],
      keyField: 'os',
      emoji: (v: string) => v === 'iOS' ? '🍎' : v === 'Android' ? '🤖' : v === 'Windows' ? '🪟' : v === 'macOS' ? '🖥️' : '💻',
      label: (v: string) => v || t('未知', '未知'),
    },
    {
      title: t('🌐 瀏覽器', '🌐 浏览器'),
      data: device.browserDist || [],
      keyField: 'browser',
      emoji: (v: string) => v === 'Safari' ? '🧭' : v === 'Chrome' ? '🔵' : v === 'Edge' ? '🔷' : v === 'Firefox' ? '🦊' : '🌐',
      label: (v: string) => v || t('未知', '未知'),
    },
    {
      title: t('📏 屏幕尺寸', '📏 屏幕尺寸'),
      data: device.screenSizes || [],
      keyField: 'range',
      emoji: (v: string) => v?.includes('1024') ? '💻' : v?.includes('768') ? '📱' : '📲',
      label: (v: string) => v,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 rounded-xl p-5 border border-blue-500/20">
        <h3 className="text-sm text-blue-400 tracking-wider mb-3">{t('📱 裝置數據總覽', '📱 装置数据总览')}</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-2xl font-bold text-warm-gold">{total}</div>
            <div className="text-xs text-cream/60">{t('已收集裝置數', '已收集装置数')}</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-warm-gold">
              {device.fcpAvg ? `${Math.round(device.fcpAvg)}ms` : '--'}
            </div>
            <div className="text-xs text-cream/60">{t('平均 FCP', '平均 FCP')}</div>
          </div>
        </div>
      </div>

      {/* Distribution Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {distCards.map((card) => {
          const maxCount = Math.max(...(card.data.map((d: any) => d.count) || [1]), 1);
          return (
            <div key={card.title} className="bg-white/5 rounded-xl p-5 border border-white/5">
              <h3 className="text-sm text-warm-gold tracking-wider mb-4">{card.title}</h3>
              <div className="space-y-3">
                {card.data.map((item: any) => {
                  const rawValue = item[card.keyField];
                  const count = item.count;
                  const pct = total > 0 ? ((count / total) * 100).toFixed(1) : '0.0';
                  return (
                    <div key={rawValue} className="flex items-center gap-3">
                      <span className="text-lg">{card.emoji(rawValue)}</span>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-cream/80">{card.label(rawValue)}</span>
                          <span className="text-xs text-warm-gold">{count} ({pct}%)</span>
                        </div>
                        <Bar value={count} max={maxCount} color="bg-blue-400" />
                      </div>
                    </div>
                  );
                })}
                {card.data.length === 0 && (
                  <p className="text-xs text-cream/50 text-center py-2">{t('暫無數據', '暂无数据')}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Data Science Notes */}
      <div className="bg-gradient-to-br from-james-orange/10 to-warm-gold/10 rounded-xl p-5 border border-james-orange/20">
        <h3 className="text-sm text-james-orange tracking-wider mb-3">{t('🔬 裝置洞察', '🔬 装置洞察')}</h3>
        <div className="text-xs text-cream/90 space-y-2 leading-relaxed">
          <p>{t('📌 豎屏 vs 橫屏比例反映用戶使用場景——豎屏為主代表碎片化時間瀏覽', '📌 竖屏 vs 横屏比例反映用户使用场景——竖屏为主代表碎片化时间浏览')}</p>
          <p>{t('📌 WiFi vs 移動數據比例影響圖片加載策略——4G/5G 用戶需要更積極的壓縮', '📌 WiFi vs 移动数据比例影响图片加载策略——4G/5G 用户需要更积极的压缩')}</p>
          <p>{t('📌 FCP (首次內容繪製) 是首屏體驗關鍵指標——超過 1.8s 建議優化圖片加載', '📌 FCP (首次内容绘制) 是首屏体验关键指标——超过 1.8s 建议优化图片加载')}</p>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// TAB: WhatsApp 獲客
// ============================================================
function WhatsappLeadsTab({ data, conversionFunnel, cardDownloads, lang }: { data: any; conversionFunnel: any; cardDownloads: any; lang: 'tc' | 'sc' }) {
  const t = (tc: string, sc: string) => lang === 'sc' ? sc : tc;
  if (!data) return <EmptyState lang={lang} />;

  const totalLeads = data.totalLeads || 0;
  const totalShares = data.totalShares || 0;
  const completedShares = data.completedShares || 0;
  const conversionRate = data.conversionRate || '0.0';
  const topSlides = data.topSlides || [];
  const recentLeads = data.recentLeads || [];

  const funnelSteps = conversionFunnel?.steps || [];
  const hasFunnel = funnelSteps.length > 0;

  const totalDownloads = cardDownloads?.totalDownloads || 0;
  const downloadRate = cardDownloads?.downloadRate || '0.0';
  const topDownloadedSlides = cardDownloads?.topSlides || [];

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/5 rounded-xl p-4 border border-white/5 text-center"
        >
          <div className="text-2xl">📲</div>
          <div className="text-2xl font-bold text-green-400">{totalLeads}</div>
          <div className="text-xs text-cream/60 mt-1">{t('WhatsApp 獲客', 'WhatsApp 获客')}</div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
          className="bg-white/5 rounded-xl p-4 border border-white/5 text-center"
        >
          <div className="text-2xl">🖼️</div>
          <div className="text-2xl font-bold text-warm-gold">{totalShares}</div>
          <div className="text-xs text-cream/60 mt-1">{t('卡片分享次數', '卡片分享次数')}</div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.16 }}
          className="bg-white/5 rounded-xl p-4 border border-white/5 text-center"
        >
          <div className="text-2xl">✅</div>
          <div className="text-2xl font-bold text-blue-400">{completedShares}</div>
          <div className="text-xs text-cream/60 mt-1">{t('已完成分享', '已完成分享')}</div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.24 }}
          className="bg-white/5 rounded-xl p-4 border border-white/5 text-center"
        >
          <div className="text-2xl">📈</div>
          <div className="text-2xl font-bold text-pink-400">{conversionRate}%</div>
          <div className="text-xs text-cream/60 mt-1">{t('轉化率', '转化率')}</div>
        </motion.div>
      </div>

      {/* 6-Step Conversion Funnel */}
      {hasFunnel && (
        <div className="bg-gradient-to-br from-james-orange/10 to-warm-gold/10 rounded-xl p-5 border border-james-orange/20">
          <h3 className="text-sm text-james-orange tracking-wider mb-4">{t('🌅 六步轉化漏斗', '🌅 六步转化漏斗')}</h3>
          <div className="space-y-3">
            {funnelSteps.map((step: any, i: number) => {
              const prevCount = i === 0 ? step.count : funnelSteps[i - 1].count;
              const conversion = prevCount > 0 ? ((step.count / prevCount) * 100).toFixed(1) : '0.0';
              const maxCount = Math.max(...funnelSteps.map((s: any) => s.count), 1);
              return (
                <div key={step.name} className="flex items-center gap-3">
                  <span className="text-lg">{step.emoji}</span>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-cream/80">{step.label}</span>
                      <span className="text-xs text-warm-gold">{step.count} ({i > 0 ? `${conversion}%` : '100%'})</span>
                    </div>
                    <Bar value={step.count} max={maxCount} color="bg-james-orange" />
                    {i > 0 && (
                      <div className="text-[10px] text-cream/50 mt-0.5">
                        {t('步驟轉化', '步骤转化')}: {conversion}%
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
        </div>
      </div>
    )}

      {/* Download Statistics */}
      {cardDownloads && (
        <div className="bg-white/5 rounded-xl p-5 border border-white/5">
          <h3 className="text-sm text-warm-gold tracking-wider mb-4">{t('⬇️ 下載統計', '⬇️ 下载统计')}</h3>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-warm-gold">{totalDownloads}</div>
              <div className="text-xs text-cream/60">{t('總下載數', '总下载数')}</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-pink-400">{downloadRate}%</div>
              <div className="text-xs text-cream/60">{t('下載率', '下载率')}</div>
            </div>
          </div>
          {topDownloadedSlides.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs text-cream/60 mb-2">{t('🔥 熱門下載作品', '🔥 热门下载作品')}</h4>
              {topDownloadedSlides.map((s: any, i: number) => {
                const slide = SLIDES.find((sl) => sl.id === s.slideId);
                const maxCount = topDownloadedSlides[0]?.count || 1;
                return (
                  <div key={s.slideId} className="flex items-center gap-3">
                    <span className="text-sm text-cream/50 w-6">#{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs text-cream/80 truncate mb-1">
                        {slide?.emoji} {slide?.title[lang]}
                      </div>
                      <Bar value={s.count} max={maxCount} color="bg-purple-400" />
                    </div>
                    <span className="text-sm text-warm-gold w-10 text-right">{s.count}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Top Shared Slides */}
      <div className="bg-white/5 rounded-xl p-5 border border-white/5">
        <h3 className="text-sm text-warm-gold tracking-wider mb-4">{t('🔥 熱門分享作品 TOP 5', '🔥 热门分享作品 TOP 5')}</h3>
        {topSlides.length === 0 ? (
          <p className="text-xs text-cream/50 text-center py-4">{t('暫無分享數據', '暂无分享数据')}</p>
        ) : (
          <div className="space-y-3">
            {topSlides.map((s: any, i: number) => {
              const slide = SLIDES.find((sl) => sl.id === s.slideId);
              const maxCount = topSlides[0]?.count || 1;
              const medals = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣'];
              return (
                <div key={s.slideId} className="flex items-center gap-3">
                  <span className="text-lg">{medals[i]}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-cream/80 truncate mb-1">
                      #{s.slideId} {slide?.emoji} {slide?.title[lang]}
                    </div>
                    <Bar value={s.count} max={maxCount} color="bg-green-400" />
                  </div>
                  <span className="text-sm text-warm-gold w-10 text-right">{s.count}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Recent Leads */}
      <div className="bg-white/5 rounded-xl p-5 border border-white/5">
        <h3 className="text-sm text-warm-gold tracking-wider mb-4">{t('📋 最近獲客記錄', '📋 最近获客记录')}</h3>
        {recentLeads.length === 0 ? (
          <p className="text-xs text-cream/50 text-center py-4">{t('暫無獲客記錄', '暂无获客记录')}</p>
        ) : (
          <div className="space-y-2">
            {recentLeads.map((lead: any, i: number) => (
              <motion.div
                key={lead.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.05 }}
                className="flex items-center justify-between py-2 border-b border-white/5 last:border-0"
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm">💬</span>
                  <span className="text-xs text-cream/80 font-mono">+{lead.phone}</span>
                  <span className="text-[10px] text-cream/40">
                    {t('分享', '分享')} {lead.shareCount} {t('次', '次')}
                  </span>
                </div>
                <span className="text-xs text-cream/50">{formatDate(lead.lastShareAt)}</span>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Data Science Notes */}
      <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-xl p-5 border border-green-500/20">
        <h3 className="text-sm text-green-400 tracking-wider mb-3">{t('🔬 WhatsApp 獲客洞察', '🔬 WhatsApp 获客洞察')}</h3>
        <div className="text-xs text-cream/90 space-y-2 leading-relaxed">
          <p>{t('📌 每個 WhatsApp 號碼都是經過用戶主動發送消息驗證的真實號碼，可直接用於後續營銷', '📌 每个 WhatsApp 号码都是经过用户主动发送消息验证的真实号码，可直接用于后续营销')}</p>
          <p>{t('📌 熱門分享作品反映用戶最願意主動傳播的內容，可作為社群營銷的重點素材', '📌 热门分享作品反映用户最愿意主动传播的内容，可作为社群营销的重点素材')}</p>
          <p>{t('📌 轉化率 = 已完成分享 / 總分享請求，低轉化率可能意味用戶在 WhatsApp 中未點擊發送', '📌 转化率 = 已完成分享 / 总分享请求，低转化率可能意味着用户在 WhatsApp 中未点击发送')}</p>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// TAB: 客戶詳情
// ============================================================
function CustomersTab({ customers, customerJourney, setCustomerJourney, lang }: { customers: any[]; customerJourney: any; setCustomerJourney: (j: any) => void; lang: 'tc' | 'sc' }) {
  console.log('[CustomersTab] render, customers type:', typeof customers, 'isArray:', Array.isArray(customers), 'length:', customers?.length);
  const t = (tc: string, sc: string) => lang === 'sc' ? sc : tc;
  const [selectedPhone, setSelectedPhone] = useState<string | null>(null);
  const [loadingJourney, setLoadingJourney] = useState(false);

  // Safety: ensure customers is a valid array of objects
  const safeCustomers = Array.isArray(customers)
    ? customers.filter((c) => c != null && typeof c === 'object')
    : [];

  function formatPhone(phone: string): string {
    if (!phone) return '';
    return '+' + phone;
  }

  async function handleSelectCustomer(phone: string) {
    setSelectedPhone(phone);
    setLoadingJourney(true);
    const journey = await fetchCustomerJourney(phone);
    setCustomerJourney(journey);
    setLoadingJourney(false);
  }

  function handleCloseDetail() {
    setSelectedPhone(null);
    setCustomerJourney(null);
  }

  const eventIcon: Record<string, string> = {
    slide_view: '👁️',
    reaction: '💬',
    card_share_request: '📤',
    card_download: '⬇️',
  };

  const eventLabel: Record<string, [string, string]> = {
    slide_view: ['瀏覽作品', '浏览作品'],
    reaction: ['點擊反應', '点击反应'],
    card_share_request: ['分享請求', '分享请求'],
    card_download: ['下載卡片', '下载卡片'],
  };

  return (
    <div className="space-y-6">
      {selectedPhone ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm text-warm-gold tracking-wider">{t('👤 客戶詳情', '👤 客户详情')}</h3>
            <button
              onClick={handleCloseDetail}
              className="text-xs text-cream/60 hover:text-cream px-3 py-1 border border-warm-light/20 rounded"
            >
              {t('← 返回列表', '← 返回列表')}
            </button>
          </div>

          {/* Customer Info */}
          {customerJourney?.customer && (
            <div className="bg-white/5 rounded-xl p-4 border border-white/5">
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-cream/50">{t('電話', '电话')}</span>
                  <p className="text-warm-light font-mono mt-0.5">{formatPhone(customerJourney.customer.phone)}</p>
                </div>
                <div>
                  <span className="text-cream/50">{t('來源', '来源')}</span>
                  <p className="text-warm-light mt-0.5">{customerJourney.customer.source || 'WhatsApp'}</p>
                </div>
                <div>
                  <span className="text-cream/50">{t('首次聯繫', '首次联系')}</span>
                  <p className="text-warm-light mt-0.5">{formatDate(customerJourney.customer.firstContactAt)}</p>
                </div>
                <div>
                  <span className="text-cream/50">{t('狀態', '状态')}</span>
                  <p className="text-warm-light mt-0.5">{customerJourney.customer.status || t('活躍', '活跃')}</p>
                </div>
              </div>
            </div>
          )}

          {/* Behavior Timeline */}
          <div className="bg-white/5 rounded-xl p-4 border border-white/5">
            <h4 className="text-xs text-warm-gold tracking-wider mb-3">{t('📈 行為時間線', '📈 行为时间线')}</h4>
            {loadingJourney ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-2xl animate-spin">🔬</div>
              </div>
            ) : !customerJourney?.events || customerJourney.events.length === 0 ? (
              <p className="text-xs text-cream/50 text-center py-4">{t('暫無行為記錄', '暂无行为记录')}</p>
            ) : (
              <div className="space-y-3">
                {(customerJourney.events || []).map((evt: any, i: number) => (
                  <div
                    key={i}
                    className="flex items-start gap-3 py-2 border-b border-white/5 last:border-0"
                    style={{ animationDelay: `${i * 40}ms` }}
                  >
                    <span className="text-lg shrink-0">{eventIcon[evt.eventType] || '📌'}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-cream/80">
                          {(eventLabel[evt.eventType] || [evt.eventType, evt.eventType])[lang === 'sc' ? 1 : 0]}
                          {evt.slideId ? ` #${evt.slideId}` : ''}
                        </span>
                        <span className="text-[10px] text-cream/40 shrink-0 ml-2">{formatDate(evt.createdAt)}</span>
                      </div>
                      {evt.eventData && (
                        <p className="text-[10px] text-cream/40 mt-0.5 truncate">
                          {typeof evt.eventData === 'string' ? evt.eventData : JSON.stringify(evt.eventData)}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 rounded-xl p-4 border border-blue-500/20">
            <h3 className="text-sm text-blue-400 tracking-wider mb-2">{t('👤 客戶列表', '👤 客户列表')}</h3>
            <p className="text-xs text-cream/70">{t('點擊客戶查看詳細行為時間線', '点击客户查看详细行为时间线')}</p>
          </div>

          {safeCustomers.length === 0 ? (
            <EmptyState lang={lang} />
          ) : (
            <div className="bg-white/5 rounded-xl p-4 border border-white/5">
              <div className="space-y-2">
                {safeCustomers.map((c: any, i: number) => (
                  <div
                    key={c.phone || i}
                    onClick={() => handleSelectCustomer(c.phone)}
                    className="flex items-center justify-between py-3 px-3 border-b border-white/5 last:border-0 rounded hover:bg-white/5 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-sm">👤</span>
                      <div>
                        <div className="text-xs text-cream/80 font-mono">{formatPhone(c.phone)}</div>
                        <div className="text-[10px] text-cream/40 mt-0.5">
                          {t('瀏覽', '浏览')} {c.slidesViewed || 0} {t('張', '张')} · {t('反應', '反应')} {c.reactionsCount || 0} {t('次', '次')}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] text-cream/40">{formatDate(c.firstContactAt)}</div>
                      <div className="text-[10px] text-warm-gold mt-0.5">{c.shareToken ? `🎫 ${c.shareToken}` : ''}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

    </div>
  );
}

// ============================================================
// COMPONENT: Insight Card
// ============================================================
function InsightCard({ emoji, title, action }: { emoji: string; title: string; action: string }) {
  return (
    <div className="bg-white/5 rounded-lg p-3 border border-white/5">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-lg">{emoji}</span>
        <span className="text-sm font-bold text-cream/90">{title}</span>
      </div>
      <p className="text-[11px] text-cream/60 leading-relaxed">{action}</p>
    </div>
  );
}

// ============================================================
// TAB: 語錄反應
// ============================================================
function QuoteReactionsTab({ data, lang }: { data: any; lang: 'tc' | 'sc' }) {
  const t = (tc: string, sc: string) => lang === 'sc' ? sc : tc;
  if (!data) return <EmptyState lang={lang} />;

  const total = data.total || 0;
  const byType = data.byType || [];
  const topQuotes = data.topQuotes || [];

  const typeEmojis: Record<string, string> = { like: '👍', love: '❤️', laugh: '😂', sad: '😢' };
  const maxTypeCount = Math.max(...byType.map((r: any) => r.count), 1);

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white/5 rounded-xl p-4 border border-white/5 text-center">
          <div className="text-2xl">💬</div>
          <div className="text-xl font-bold text-warm-gold">{total}</div>
          <div className="text-xs text-cream/60 mt-1">{t('語錄反應總數', '语录反应总数')}</div>
        </div>
        <div className="bg-white/5 rounded-xl p-4 border border-white/5 text-center">
          <div className="text-2xl">📜</div>
          <div className="text-xl font-bold text-warm-gold">{topQuotes.length}</div>
          <div className="text-xs text-cream/60 mt-1">{t('有反應的語錄', '有反应的语录')}</div>
        </div>
      </div>

      {/* Reaction Types */}
      <div className="bg-white/5 rounded-xl p-5 border border-white/5">
        <h3 className="text-sm text-warm-gold tracking-wider mb-4">{t('反應類型分佈', '反应类型分布')}</h3>
        <div className="space-y-3">
          {byType.map((r: any) => (
            <div key={r.reactionType} className="flex items-center gap-3">
              <span className="text-lg w-8">{typeEmojis[r.reactionType] || '📤'}</span>
              <div className="flex-1">
                <Bar value={r.count} max={maxTypeCount} color="bg-pink-400" />
              </div>
              <span className="text-sm text-cream/80 w-12 text-right">{r.count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Top Quotes */}
      <div className="bg-white/5 rounded-xl p-5 border border-white/5">
        <h3 className="text-sm text-warm-gold tracking-wider mb-4">{t('🏆 最受歡迎語錄 TOP 10', '🏆 最受欢迎语录 TOP 10')}</h3>
        <div className="space-y-3">
          {topQuotes.map((q: any, i: number) => {
            const maxCount = topQuotes[0]?.count || 1;
            const bd = q.breakdown || {};
            return (
              <div key={q.quoteCode} className="flex items-start gap-3 py-2 border-b border-white/5 last:border-0">
                <span className="text-sm text-cream/40 w-6">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-mono text-warm-gold">{q.quoteCode}</span>
                    <span className="text-xs text-cream/60">
                      {Object.entries(bd).map(([k, v]) => `${typeEmojis[k] || ''}${v}`).join(' ')}
                    </span>
                  </div>
                  <Bar value={q.count} max={maxCount} color="bg-warm-gold" />
                </div>
                <span className="text-sm text-warm-gold w-10 text-right">{q.count}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// TAB: 訂閱用戶
// ============================================================
function SubscribersTab({ data, lang }: { data: any; lang: 'tc' | 'sc' }) {
  const t = (tc: string, sc: string) => lang === 'sc' ? sc : tc;
  if (!data) return <EmptyState lang={lang} />;

  const total = data.total || 0;
  const byStatus = data.byStatus || [];
  const recent = data.recent || [];

  const statusLabels: Record<string, string> = {
    confirmed: t('已確認', '已确认'),
    requested: t('待確認', '待确认'),
    pending: t('待處理', '待处理'),
  };
  const statusColors: Record<string, string> = {
    confirmed: 'text-green-400',
    requested: 'text-yellow-400',
    pending: 'text-gray-400',
  };

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white/5 rounded-xl p-4 border border-white/5 text-center">
          <div className="text-2xl">🔔</div>
          <div className="text-xl font-bold text-warm-gold">{total}</div>
          <div className="text-xs text-cream/60 mt-1">{t('訂閱總數', '订阅总数')}</div>
        </div>
        {byStatus.map((s: any) => (
          <div key={s.status} className="bg-white/5 rounded-xl p-4 border border-white/5 text-center">
            <div className="text-2xl">{s.status === 'confirmed' ? '✅' : s.status === 'requested' ? '⏳' : '📝'}</div>
            <div className={`text-xl font-bold ${statusColors[s.status] || 'text-cream/80'}`}>{s.count}</div>
            <div className="text-xs text-cream/60 mt-1">{statusLabels[s.status] || s.status}</div>
          </div>
        ))}
      </div>

      {/* Recent Subscribers */}
      <div className="bg-white/5 rounded-xl p-5 border border-white/5">
        <h3 className="text-sm text-warm-gold tracking-wider mb-4">{t('最近訂閱', '最近订阅')}</h3>
        {recent.length === 0 ? (
          <p className="text-xs text-cream/50 text-center py-4">{t('暫無訂閱記錄', '暂无订阅记录')}</p>
        ) : (
          <div className="space-y-2">
            {recent.map((s: any) => (
              <div key={s.id} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                <div className="flex items-center gap-3">
                  <span className="text-sm">{s.status === 'confirmed' ? '✅' : '⏳'}</span>
                  <div>
                    <div className="text-xs text-cream/80 font-mono">{s.phone || t('未填電話', '未填电话')}</div>
                    {s.sourceCode && <div className="text-[10px] text-warm-gold">{t('來源', '来源')}: {s.sourceCode}</div>}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] text-cream/40">{formatDate(s.createdAt)}</div>
                  <div className={`text-[10px] ${statusColors[s.status] || 'text-cream/60'}`}>{statusLabels[s.status] || s.status}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function EmptyState({ lang = 'tc' }: { lang?: 'tc' | 'sc' }) {
  const t = (tc: string, sc: string) => lang === 'sc' ? sc : tc;
  return (
    <div className="flex flex-col items-center justify-center py-20 text-cream/50">
      <span className="text-4xl mb-3">📭</span>
      <p className="text-sm">{t('暫無數據', '暂无数据')}</p>
      <p className="text-xs mt-1">{t('等待訪客開始互動...', '等待访客开始互动...')}</p>
    </div>
  );
}
