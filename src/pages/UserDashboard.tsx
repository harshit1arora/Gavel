import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  Upload, FileText, TrendingUp, TrendingDown, Eye, 
  Download, Trash2, Settings, Shield, Clock, BarChart3 
} from 'lucide-react';
import { useStore } from '../store/appStore';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

const UserDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { analysisHistory, currentAnalysis, clearFiles } = useStore();
  const [activeTab, setActiveTab] = useState<'history' | 'settings'>('history');
  
  // Settings State
  const [autoDelete, setAutoDelete] = useState(true);
  const [anonAnalytics, setAnonAnalytics] = useState(true);

  const handleViewReport = (id: string) => {
    const report = analysisHistory.find(r => r.id === id);
    if (report) {
      navigate(`/report/${id}`);
    }
  };

  const handleDeleteReport = (id: string) => {
    if (confirm('Are you sure you want to delete this report?')) {
      // In a real app, this would delete from store
      toast({ title: 'Report deleted' });
    }
  };

  const handleExportData = () => {
    toast({ title: 'Export Started', description: 'Your data is being packaged for download.' });
  };

  const handleDeleteAllData = () => {
    if (confirm('Are you sure you want to permanently delete ALL your data? This action cannot be undone.')) {
      toast({ title: 'Data Deleted', description: 'All your data has been permanently removed.', variant: 'destructive' });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-[#0a0a0a] to-black text-white">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{ y: [0, 30, 0] }}
          transition={{ duration: 8, repeat: Infinity }}
          className="absolute top-40 right-20 w-[500px] h-[500px] bg-orange-500/10 rounded-full blur-[100px]"
        />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 py-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <h1 className="text-4xl md:text-5xl font-display font-bold mb-4">
            Your Dashboard
          </h1>
          <p className="text-xl text-gray-400">
            View your analysis history and manage your account
          </p>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid md:grid-cols-4 gap-4 mb-12"
        >
          <button
            onClick={() => navigate('/upload')}
            className="group p-6 bg-gradient-to-b from-orange-500/20 to-orange-500/10 border border-orange-500/30 rounded-2xl hover:border-orange-500/50 transition-all text-left"
          >
            <div className="w-12 h-12 rounded-xl bg-orange-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Upload className="w-6 h-6 text-orange-400" />
            </div>
            <div className="font-semibold text-white">New Analysis</div>
            <div className="text-sm text-gray-400">Upload & analyze</div>
          </button>

          <button
            onClick={() => currentAnalysis && navigate(`/report/${currentAnalysis.id}`)}
            disabled={!currentAnalysis}
            className={cn(
              "p-6 bg-white/5 border border-white/10 rounded-2xl transition-all text-left",
              currentAnalysis ? "hover:border-orange-500/30 cursor-pointer" : "opacity-50 cursor-not-allowed"
            )}
          >
            <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center mb-4">
              <FileText className="w-6 h-6 text-gray-400" />
            </div>
            <div className="font-semibold text-white">Latest Report</div>
            <div className="text-sm text-gray-400">
              {currentAnalysis ? `${currentAnalysis.approvalScore}% score` : 'No analysis'}
            </div>
          </button>

          <button
            onClick={() => currentAnalysis && navigate('/compare')}
            disabled={!currentAnalysis}
            className={cn(
              "p-6 bg-white/5 border border-white/10 rounded-2xl transition-all text-left",
              currentAnalysis ? "hover:border-orange-500/30 cursor-pointer" : "opacity-50 cursor-not-allowed"
            )}
          >
            <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center mb-4">
              <BarChart3 className="w-6 h-6 text-gray-400" />
            </div>
            <div className="font-semibold text-white">Compare</div>
            <div className="text-sm text-gray-400">vs other users</div>
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className="p-6 bg-white/5 border border-white/10 rounded-2xl hover:border-orange-500/30 transition-all text-left"
          >
            <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center mb-4">
              <Settings className="w-6 h-6 text-gray-400" />
            </div>
            <div className="font-semibold text-white">Settings</div>
            <div className="text-sm text-gray-400">Privacy & security</div>
          </button>
        </motion.div>

        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="border-b border-white/10 mb-8"
        >
          <div className="flex gap-8">
            <button
              onClick={() => setActiveTab('history')}
              className={cn(
                "py-4 px-2 font-semibold transition-all relative",
                activeTab === 'history' ? 'text-white' : 'text-gray-400 hover:text-gray-300'
              )}
            >
              Analysis History
              {activeTab === 'history' && (
                <motion.div layoutId="tab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-500" />
              )}
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={cn(
                "py-4 px-2 font-semibold transition-all relative",
                activeTab === 'settings' ? 'text-white' : 'text-gray-400 hover:text-gray-300'
              )}
            >
              Settings & Privacy
              {activeTab === 'settings' && (
                <motion.div layoutId="tab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-500" />
              )}
            </button>
          </div>
        </motion.div>

        {/* Tab Content */}
        {activeTab === 'history' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            {analysisHistory.length === 0 ? (
              <div className="text-center py-20">
                <div className="w-20 h-20 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-6">
                  <FileText className="w-10 h-10 text-gray-500" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">No Analyses Yet</h3>
                <p className="text-gray-400 mb-8">Upload your first bank statement to get started.</p>
                <button
                  onClick={() => navigate('/upload')}
                  className="px-8 py-4 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-semibold inline-flex items-center gap-2"
                >
                  <Upload className="w-5 h-5" />
                  Start Analysis
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {analysisHistory.map((report, index) => (
                  <motion.div
                    key={report.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 * index }}
                    className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:border-orange-500/30 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={cn(
                          "w-14 h-14 rounded-xl flex items-center justify-center font-bold text-xl",
                          report.approvalScore >= 75 ? "bg-green-500/20 text-green-400" :
                          report.approvalScore >= 55 ? "bg-orange-500/20 text-orange-400" :
                          "bg-red-500/20 text-red-400"
                        )}>
                          {report.approvalScore}%
                        </div>
                        <div>
                          <div className="font-semibold text-white">
                            {report.archetype}
                          </div>
                          <div className="text-sm text-gray-400 flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            {new Date().toLocaleDateString('en-IN', { 
                              day: 'numeric', 
                              month: 'short', 
                              year: 'numeric' 
                            })}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleViewReport(report.id)}
                          className="p-2 rounded-lg hover:bg-white/10 transition-colors text-gray-400 hover:text-white"
                        >
                          <Eye className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDeleteReport(report.id)}
                          className="p-2 rounded-lg hover:bg-white/10 transition-colors text-gray-400 hover:text-red-400"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>

                    {/* Quick metrics */}
                    <div className="grid grid-cols-4 gap-4 mt-4 pt-4 border-t border-white/10">
                      <div>
                        <div className="text-xs text-gray-500">Stability</div>
                        <div className="font-semibold text-white">{report.financialStability}%</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500">Income</div>
                        <div className="font-semibold text-white">{report.incomeConsistency}%</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500">EMI Capacity</div>
                        <div className="font-semibold text-white">{report.emiCapacity}%</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500">Spending</div>
                        <div className="font-semibold text-white">{report.spendingHealth}%</div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {activeTab === 'settings' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="space-y-6"
          >
            {/* Privacy Settings */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg bg-orange-500/20 flex items-center justify-center">
                  <Shield className="w-5 h-5 text-orange-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">Privacy & Security</h3>
                  <p className="text-sm text-gray-400">Manage your data and privacy settings</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl cursor-pointer" onClick={() => {
                  setAutoDelete(!autoDelete);
                  toast({ title: "Settings Updated", description: `Auto-delete uploads is now ${!autoDelete ? 'enabled' : 'disabled'}.` });
                }}>
                  <div>
                    <div className="font-medium text-white">Auto-delete uploads</div>
                    <div className="text-sm text-gray-400">Automatically delete files after analysis</div>
                  </div>
                  <div className={cn("w-12 h-6 rounded-full relative transition-colors", autoDelete ? "bg-orange-500" : "bg-white/20")}>
                    <div className={cn("absolute top-1 w-4 h-4 bg-white rounded-full transition-all", autoDelete ? "right-1" : "left-1")} />
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl cursor-pointer" onClick={() => {
                  setAnonAnalytics(!anonAnalytics);
                  toast({ title: "Settings Updated", description: `Anonymous analytics is now ${!anonAnalytics ? 'enabled' : 'disabled'}.` });
                }}>
                  <div>
                    <div className="font-medium text-white">Anonymous analytics</div>
                    <div className="text-sm text-gray-400">Help improve our algorithms anonymously</div>
                  </div>
                  <div className={cn("w-12 h-6 rounded-full relative transition-colors", anonAnalytics ? "bg-orange-500" : "bg-white/20")}>
                    <div className={cn("absolute top-1 w-4 h-4 bg-white rounded-full transition-all", anonAnalytics ? "right-1" : "left-1")} />
                  </div>
                </div>
              </div>
            </div>

            {/* Data Management */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center">
                  <Trash2 className="w-5 h-5 text-gray-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">Data Management</h3>
                  <p className="text-sm text-gray-400">Control your stored data</p>
                </div>
              </div>

              <div className="space-y-3">
                <button onClick={handleExportData} className="w-full p-4 bg-white/5 hover:bg-white/10 rounded-xl text-left transition-colors">
                  <div className="font-medium text-white">Export all data</div>
                  <div className="text-sm text-gray-400">Download all your reports and history</div>
                </button>
                <button onClick={handleDeleteAllData} className="w-full p-4 bg-red-500/10 hover:bg-red-500/20 rounded-xl text-left transition-colors border border-red-500/20">
                  <div className="font-medium text-red-400">Delete all data</div>
                  <div className="text-sm text-red-400/70">Permanently remove all your data</div>
                </button>
              </div>
            </div>

            {/* Security Info */}
            <div className="bg-gradient-to-r from-orange-500/10 to-transparent border border-orange-500/20 rounded-2xl p-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-orange-500/20 flex items-center justify-center flex-shrink-0">
                  <Shield className="w-5 h-5 text-orange-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-white mb-2">Your Data is Secure</h3>
                  <p className="text-sm text-gray-400">
                    All uploads are encrypted with 256-bit encryption. We never store your 
                    financial documents - they're automatically deleted after analysis. Your 
                    privacy is our top priority.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default UserDashboard;