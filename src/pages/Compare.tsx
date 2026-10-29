import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Trophy, TrendingUp, Users, Share2, ArrowRight, RefreshCw } from 'lucide-react';
import { useStore } from '../store/appStore';
import { cn } from '@/lib/utils';

const ComparePage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { currentAnalysis, analysisHistory } = useStore();
  const [animatedPercentile, setAnimatedPercentile] = useState(0);

  const score = currentAnalysis?.approvalScore || parseInt(searchParams.get('score') || '0');
  const averageScore = 68;
  const percentile = score >= averageScore 
    ? Math.min(99, 50 + Math.round((score - averageScore) * 1.5))
    : Math.max(10, 50 - (averageScore - score));

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedPercentile(percentile);
    }, 500);
    return () => clearTimeout(timer);
  }, [percentile]);

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/compare?score=${score}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Check My Loan Approval Score',
          text: `I got ${score}% approval probability on Gavel! Can you beat my score?`,
          url: shareUrl,
        });
      } catch (err) {
        await navigator.clipboard.writeText(shareUrl);
      }
    } else {
      await navigator.clipboard.writeText(shareUrl);
    }
  };

  const getScoreGrade = (score: number) => {
    if (score >= 85) return { grade: 'A+', label: 'Excellent', color: 'text-green-400' };
    if (score >= 75) return { grade: 'A', label: 'Great', color: 'text-green-400' };
    if (score >= 65) return { grade: 'B+', label: 'Good', color: 'text-orange-400' };
    if (score >= 55) return { grade: 'B', label: 'Average', color: 'text-orange-400' };
    if (score >= 45) return { grade: 'C', label: 'Below Average', color: 'text-red-400' };
    return { grade: 'D', label: 'Poor', color: 'text-red-400' };
  };

  const gradeInfo = getScoreGrade(score);

  if (!currentAnalysis && !score) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-black via-[#0a0a0a] to-black text-white flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4">No Analysis Found</h1>
          <p className="text-gray-400 mb-8">Upload your bank statement to get your approval score.</p>
          <button
            onClick={() => navigate('/upload')}
            className="px-8 py-4 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-semibold"
          >
            Analyze Now
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-[#0a0a0a] to-black text-white">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{ y: [0, 30, 0] }}
          transition={{ duration: 8, repeat: Infinity }}
          className="absolute top-40 right-20 w-[500px] h-[500px] bg-orange-500/10 rounded-full blur-[100px]"
        />
        <motion.div
          animate={{ y: [0, -30, 0] }}
          transition={{ duration: 10, repeat: Infinity }}
          className="absolute bottom-40 left-20 w-[400px] h-[400px] bg-orange-500/8 rounded-full blur-[80px]"
        />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-4 py-20">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-500/10 border border-orange-500/30 text-orange-400 text-sm mb-6">
            <Trophy className="w-4 h-4" />
            <span>Viral Score Comparison</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-display font-bold mb-4">
            How Do You Compare?
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            See how your financial profile stacks up against other users
          </p>
        </motion.div>

        {/* Main Score Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="relative bg-gradient-to-b from-white/10 to-white/5 border border-white/10 rounded-3xl p-8 md:p-12 mb-12"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-orange-500/5 to-transparent rounded-3xl" />
          
          <div className="relative flex flex-col md:flex-row items-center justify-between gap-8">
            {/* Your Score */}
            <div className="text-center md:text-left">
              <div className="text-gray-400 text-sm mb-2">Your Approval Score</div>
              <div className="flex items-baseline gap-3">
                <span className="text-6xl md:text-7xl font-display font-bold text-white">
                  {score}%
                </span>
                <span className={cn("text-3xl font-bold", gradeInfo.color)}>
                  {gradeInfo.grade}
                </span>
              </div>
              <div className="text-gray-400 mt-2">{gradeInfo.label}</div>
            </div>

            {/* VS Divider */}
            <div className="hidden md:block w-px h-32 bg-white/10" />

            {/* Percentile */}
            <div className="text-center">
              <div className="text-gray-400 text-sm mb-2">You Score Better Than</div>
              <div className="text-5xl md:text-6xl font-display font-bold text-orange-400">
                {animatedPercentile}%
              </div>
              <div className="text-gray-400 mt-2">of users</div>
            </div>

            {/* VS Divider */}
            <div className="hidden md:block w-px h-32 bg-white/10" />

            {/* Average */}
            <div className="text-center">
              <div className="text-gray-400 text-sm mb-2">Average Score</div>
              <div className="text-4xl md:text-5xl font-display font-bold text-gray-500">
                {averageScore}%
              </div>
              <div className="text-gray-500 mt-2">All users</div>
            </div>
          </div>
        </motion.div>

        {/* Comparison Bars */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="grid md:grid-cols-2 gap-6 mb-12"
        >
          {/* Your Score vs Average */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-gray-400">Your Score</span>
              <span className="text-white font-semibold">{score}%</span>
            </div>
            <div className="h-3 bg-white/10 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${score}%` }}
                transition={{ delay: 0.6, duration: 1 }}
                className="h-full bg-gradient-to-r from-orange-500 to-orange-600 rounded-full"
              />
            </div>
          </div>

          {/* Average vs Your Score */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-gray-400">Average Score</span>
              <span className="text-gray-400 font-semibold">{averageScore}%</span>
            </div>
            <div className="h-3 bg-white/10 rounded-full overflow-hidden">
              <div className="h-full bg-gray-600 rounded-full" style={{ width: `${averageScore}%` }} />
            </div>
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="grid grid-cols-3 gap-4 mb-12"
        >
          {[
            { icon: Users, label: 'Total Users', value: '12,847' },
            { icon: TrendingUp, label: 'Avg. Score', value: `${averageScore}%` },
            { icon: Trophy, label: 'Top Score', value: '98%' },
          ].map((stat, i) => (
            <div key={i} className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
              <stat.icon className="w-6 h-6 text-orange-500 mx-auto mb-2" />
              <div className="text-2xl font-bold text-white">{stat.value}</div>
              <div className="text-xs text-gray-400">{stat.label}</div>
            </div>
          ))}
        </motion.div>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="flex flex-col sm:flex-row gap-4 justify-center"
        >
          <button
            onClick={handleShare}
            className="group relative px-8 py-4 rounded-xl font-semibold text-white overflow-hidden flex items-center justify-center gap-2"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-orange-600 via-orange-500 to-orange-700" />
            <div className="absolute inset-0 bg-gradient-to-r from-orange-600 via-orange-500 to-orange-700 blur-xl opacity-60 group-hover:opacity-100 transition-opacity" />
            <span className="relative flex items-center gap-2">
              <Share2 className="w-5 h-5" />
              Share Your Score
            </span>
          </button>

          <button
            onClick={() => navigate('/dashboard')}
            className="px-8 py-4 rounded-xl font-semibold text-white border border-white/20 hover:bg-white/10 transition-colors flex items-center justify-center gap-2"
          >
            <RefreshCw className="w-5 h-5" />
            Analyze Again
          </button>

          <button
            onClick={() => navigate('/upload')}
            className="px-8 py-4 rounded-xl font-semibold text-orange-400 hover:text-orange-300 transition-colors flex items-center justify-center gap-2"
          >
            View Full Report
            <ArrowRight className="w-5 h-5" />
          </button>
        </motion.div>

        {/* Viral Message */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="text-center mt-12"
        >
          <p className="text-gray-500 text-sm">
            🔒 Your data is anonymous. We never share your personal financial information.
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default ComparePage;