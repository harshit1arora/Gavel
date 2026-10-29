import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Zap, Brain, ShieldAlert, Cpu, Terminal, CheckCircle2 } from 'lucide-react';
import { ANALYSIS_STEPS, generateMockAnalysis } from '../utils/analysis/mockEngine';
import { useStore } from '../store/appStore';
import { trackPredictorSuccess } from '../utils/analytics';

const parseLogs = [
  "Initializing transaction OCR metadata scanner...",
  "Detecting statement structure and layout schemas...",
  "Parsing ledger transactions: 142 items discovered...",
  "Verifying UPI debit frequency and velocity thresholds...",
  "Scanning for short-term Buy-Now-Pay-Later micro-loans...",
  "Targeting weekend discretionary entertainment transactions...",
  "Running salary consistency timing calculations...",
  "Validating recurring credits and deposits consistency...",
  "Computing net disposable salary income margins...",
  "Analyzing cash retention behavior and average balances...",
  "Executing shadow bank underwriting simulator models...",
  "Applying Debt-to-Income (FOIR) constraint tests...",
  "Checking for balance fluctuations below critical levels...",
  "Constructing psychological financial personality archetype...",
  "Calculating approval odds and global peer-percentiles...",
  "Finalizing credit analysis report payload...",
];

export function AnalyzingPage() {
  const navigate = useNavigate();
  const { setCurrentAnalysis, addToHistory, uploadedFiles, clearFiles } = useStore();
  const [completedSteps, setCompletedSteps] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);
  const logContainerRef = useRef<HTMLDivElement>(null);

  // Append logs periodically
  useEffect(() => {
    let currentLogIndex = 0;
    const logInterval = setInterval(() => {
      if (currentLogIndex < parseLogs.length) {
        setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${parseLogs[currentLogIndex]}`]);
        currentLogIndex++;
      } else {
        clearInterval(logInterval);
      }
    }, 450);

    return () => clearInterval(logInterval);
  }, []);

  // Scroll logs to bottom
  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs]);

  useEffect(() => {
    let currentStep = 0;

    const progressInterval = setInterval(() => {
      setCompletedSteps(prev => Math.min(prev + 1, ANALYSIS_STEPS.length));
      currentStep++;

      if (currentStep >= ANALYSIS_STEPS.length) {
        clearInterval(progressInterval);

        // Generate mock analysis
        const fileName = uploadedFiles[0]?.name || 'statement.pdf';
        const analysis = generateMockAnalysis(fileName);
        setCurrentAnalysis(analysis);
        addToHistory(analysis);
        clearFiles();
        
        trackPredictorSuccess(analysis.id, analysis.approvalScore);

        // Redirect to report
        setTimeout(() => {
          navigate(`/report/${analysis.id}`);
        }, 1000);
      }
    }, 1500);

    return () => clearInterval(progressInterval);
  }, []);

  const progress = (completedSteps / ANALYSIS_STEPS.length) * 100;

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-6 relative overflow-hidden font-sans">
      {/* Cinematic Glowing Background Particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-orange-500/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/3 right-1/4 w-[500px] h-[500px] bg-purple-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '8s' }} />
        
        {/* Subtle grid pattern overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:32px_32px] opacity-40" />
      </div>

      <div className="relative z-10 max-w-5xl w-full grid lg:grid-cols-12 gap-8 items-stretch">
        
        {/* Left Column: Progress Steps & Diagnostics */}
        <div className="lg:col-span-6 flex flex-col justify-between bg-zinc-950/80 border border-white/5 rounded-3xl p-8 backdrop-blur-xl">
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
                <Cpu className="w-5 h-5 text-orange-500" />
              </div>
              <div>
                <h2 className="text-xl font-bold tracking-tight text-white">Neural Analysis Engine</h2>
                <p className="text-xs text-gray-500 font-mono">Running model v4.12.9-beta</p>
              </div>
            </div>

            <div className="w-full h-px bg-white/10" />

            {/* Steps Container */}
            <div className="space-y-6">
              {ANALYSIS_STEPS.map((step, index) => {
                const isCompleted = index < completedSteps;
                const isActive = index === completedSteps;

                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-center gap-4"
                  >
                    <div className="relative">
                      <motion.div
                        animate={{
                          scale: isActive ? 1.15 : 1,
                          borderColor: isCompleted ? '#F97316' : isActive ? '#F97316' : 'rgba(255,255,255,0.1)',
                          backgroundColor: isCompleted ? 'rgba(249,115,22,0.1)' : 'transparent'
                        }}
                        className="w-7 h-7 rounded-full border-2 flex items-center justify-center flex-shrink-0 z-10 relative"
                      >
                        {isCompleted ? (
                          <CheckCircle2 className="w-4 h-4 text-orange-500" />
                        ) : isActive ? (
                          <motion.div
                            animate={{ scale: [1, 1.4, 1] }}
                            transition={{ duration: 1.2, repeat: Infinity }}
                            className="w-2.5 h-2.5 rounded-full bg-orange-500"
                          />
                        ) : (
                          <span className="text-[10px] font-mono text-gray-600">{index + 1}</span>
                        )}
                      </motion.div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-semibold transition-colors ${isActive ? 'text-white' : isCompleted ? 'text-gray-400' : 'text-gray-600'}`}>{step.step}</p>
                      <div className="h-1 bg-white/5 rounded-full overflow-hidden mt-1.5">
                        <motion.div
                          className="h-full bg-gradient-to-r from-orange-500 to-orange-600"
                          animate={{
                            width: isCompleted ? '100%' : isActive ? '70%' : '0%',
                          }}
                          transition={{ duration: step.duration / 1000 }}
                        />
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Overall Progress Slider */}
          <div className="mt-8 pt-6 border-t border-white/5 space-y-3">
            <div className="flex justify-between items-center text-sm font-medium">
              <span className="text-gray-400">Total Analyzing Progress</span>
              <span className="text-orange-400 font-mono font-bold">{Math.round(progress)}%</span>
            </div>
            <div className="h-2.5 bg-white/5 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-orange-500 via-orange-600 to-orange-700"
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.4 }}
              />
            </div>
          </div>
        </div>

        {/* Right Column: Scrolling Terminal Logs */}
        <div className="lg:col-span-6 flex flex-col bg-zinc-950 border border-white/5 rounded-3xl p-6 relative overflow-hidden min-h-[400px]">
          <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/5 rounded-full blur-2xl pointer-events-none" />
          
          <div className="flex items-center justify-between mb-4 flex-shrink-0">
            <div className="flex items-center gap-2 text-gray-400">
              <Terminal className="w-4 h-4 text-orange-500" />
              <span className="text-xs font-mono font-bold uppercase tracking-wider">Parsing Console Log Streams</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-ping" />
              <span className="text-[10px] text-green-500 font-mono font-bold uppercase">Streaming live</span>
            </div>
          </div>

          {/* Console Output Screen */}
          <div 
            ref={logContainerRef}
            className="flex-1 overflow-y-auto font-mono text-xs text-orange-400/90 space-y-2.5 p-4 rounded-xl bg-black border border-white/5 no-scrollbar select-none"
          >
            {logs.length === 0 && (
              <div className="text-gray-600 animate-pulse">Awaiting data parsing pipeline handshake...</div>
            )}
            {logs.map((log, index) => (
              <div key={index} className="leading-relaxed border-l border-orange-500/20 pl-2">
                {log}
              </div>
            ))}
          </div>

          <div className="mt-4 text-[10px] text-gray-500 text-center flex-shrink-0">
            🔒 Fully encrypted in memory. Statements parsed with zero server-side storage.
          </div>
        </div>

      </div>
    </div>
  );
}

export default AnalyzingPage;
