import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Upload as UploadIcon, Lock, Zap, Shield } from 'lucide-react';
import { UploadArea } from '../components/upload/UploadArea';
import { useStore } from '../store/appStore';
import { trackPredictorUpload } from '../utils/analytics';

export function UploadPage() {
  const navigate = useNavigate();
  const { uploadedFiles, setUploading, setUploadProgress, setUserEmail } = useStore();
  const [isProcessing, setIsProcessing] = useState(false);
  const [emailInput, setEmailInput] = useState('');

  const handleAnalyze = async () => {
    if (uploadedFiles.length === 0) {
      alert('Please upload at least one file');
      return;
    }

    if (!emailInput || !emailInput.includes('@')) {
      alert('Please enter a valid email address to lock in your report and continue.');
      return;
    }

    uploadedFiles.forEach(file => {
      trackPredictorUpload(file.name, file.size);
    });

    setIsProcessing(true);
    setUploading(true);
    setUserEmail(emailInput);

    // Simulate file upload
    for (let i = 0; i <= 100; i += 10) {
      setUploadProgress(i);
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    setUploading(false);
    navigate('/analyzing');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-[#0a0a0a] to-black text-white pt-20">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
        <motion.div
          animate={{ y: [0, 20, 0] }}
          transition={{ duration: 5, repeat: Infinity }}
          className="absolute top-20 right-20 w-96 h-96 bg-orange-500/5 rounded-full blur-3xl"
        />
        <motion.div
          animate={{ y: [0, -20, 0] }}
          transition={{ duration: 7, repeat: Infinity }}
          className="absolute bottom-20 left-20 w-96 h-96 bg-orange-500/5 rounded-full blur-3xl"
        />
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h1 className="text-5xl sm:text-6xl font-display font-bold mb-4">
            Upload Your Bank Statement
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Upload your bank statement or salary slip to get an instant AI analysis of your loan approval chances.
          </p>
        </motion.div>

        {/* Main upload area */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="mb-8"
        >
          <UploadArea />
        </motion.div>

        {/* Email Capture Panel */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="max-w-md mx-auto mb-8 bg-white/5 border border-white/10 rounded-2xl p-6 text-center space-y-4"
        >
          <div className="text-xs font-mono text-orange-400 font-bold uppercase tracking-wider">Step 2: Connect Financial Identity</div>
          <div>
            <h3 className="text-sm font-bold text-white">Enter email to lock in your personal report</h3>
            <p className="text-xs text-gray-400 mt-1">Receive monthly score improvement summaries and CIBIL notifications.</p>
          </div>
          <input
            type="email"
            value={emailInput}
            onChange={(e) => setEmailInput(e.target.value)}
            placeholder="name@example.com"
            className="w-full px-4 py-3 rounded-xl bg-black border border-white/15 focus:border-orange-500/50 outline-none text-white text-center text-sm font-medium transition-all"
            required
          />
        </motion.div>

        {/* Analyze button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="flex justify-center mb-16"
        >
          <button
            onClick={handleAnalyze}
            disabled={uploadedFiles.length === 0 || isProcessing}
            className="group relative px-10 py-4 rounded-xl font-semibold text-white text-lg overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-orange-600 via-orange-500 to-orange-700" />
            <div className="absolute inset-0 bg-gradient-to-r from-orange-600 via-orange-500 to-orange-700 blur-xl opacity-60 group-hover:opacity-100 transition-opacity group-disabled:opacity-0" />
            <span className="relative flex items-center justify-center gap-3">
              <UploadIcon className="w-5 h-5" />
              {isProcessing ? 'Processing...' : 'Start AI Analysis'}
              <Zap className="w-5 h-5" />
            </span>
          </button>
        </motion.div>

        {/* Trust indicators */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.6 }}
          className="bg-white/5 border border-white/10 rounded-2xl p-8 mb-12"
        >
          <h3 className="text-lg font-semibold text-white mb-6">Why Upload With Gavel?</h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="flex gap-4">
              <div className="w-12 h-12 rounded-lg bg-orange-500/10 flex items-center justify-center flex-shrink-0">
                <Lock className="w-6 h-6 text-orange-500" />
              </div>
              <div>
                <h4 className="font-semibold text-white mb-1">Military-Grade Security</h4>
                <p className="text-sm text-gray-400">
                  256-bit encryption. Your files are never stored. Auto-deleted after analysis.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-12 h-12 rounded-lg bg-orange-500/10 flex items-center justify-center flex-shrink-0">
                <Zap className="w-6 h-6 text-orange-500" />
              </div>
              <div>
                <h4 className="font-semibold text-white mb-1">Instant Results</h4>
                <p className="text-sm text-gray-400">
                  Get your AI analysis in 60 seconds. No waiting. No BS.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-12 h-12 rounded-lg bg-orange-500/10 flex items-center justify-center flex-shrink-0">
                <Shield className="w-6 h-6 text-orange-500" />
              </div>
              <div>
                <h4 className="font-semibold text-white mb-1">No Account Required</h4>
                <p className="text-sm text-gray-400">
                  Guest mode enabled. Just upload and analyze. Privacy first.
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* What we analyze */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.6 }}
          className="bg-gradient-to-r from-orange-500/10 to-orange-500/5 border border-orange-500/20 rounded-2xl p-8"
        >
          <h3 className="text-lg font-semibold text-white mb-6">What We Analyze</h3>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              'Income Stability',
              'Spending Patterns',
              'EMI Load',
              'Balance Trends',
              'Salary Consistency',
              'Loan Capacity',
              'Risk Factors',
              'Approval Score',
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1 + i * 0.05 }}
                className="p-4 rounded-lg bg-white/5 border border-white/5 text-center"
              >
                <p className="text-sm text-gray-300">{item}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default UploadPage;
