// Store for managing application state
import { create } from 'zustand';
import { AnalysisResult } from '../utils/analysis/mockEngine';

interface UploadFile {
  id: string;
  name: string;
  file: File;
  size: number;
  type: 'statement' | 'salary';
  uploadedAt: Date;
}

interface Store {
  // Upload state
  uploadedFiles: UploadFile[];
  isUploading: boolean;
  uploadProgress: number;
  addFile: (file: File, type: 'statement' | 'salary') => void;
  removeFile: (id: string) => void;
  clearFiles: () => void;
  setUploading: (isUploading: boolean) => void;
  setUploadProgress: (progress: number) => void;

  // Analysis state
  currentAnalysis: AnalysisResult | null;
  analysisHistory: AnalysisResult[];
  isAnalyzing: boolean;
  setAnalyzing: (isAnalyzing: boolean) => void;
  setCurrentAnalysis: (analysis: AnalysisResult) => void;
  addToHistory: (analysis: AnalysisResult) => void;

  // User state
  userId: string | null;
  isGuestUser: boolean;
  userEmail: string | null;
  setUserId: (userId: string | null) => void;
  setIsGuestUser: (isGuest: boolean) => void;
  setUserEmail: (email: string | null) => void;
}

export const useStore = create<Store>((set, get) => ({
  // Upload state
  uploadedFiles: [],
  isUploading: false,
  uploadProgress: 0,
  
  addFile: (file: File, type: 'statement' | 'salary') => {
    const newFile: UploadFile = {
      id: `${Date.now()}-${Math.random()}`,
      name: file.name,
      file,
      size: file.size,
      type,
      uploadedAt: new Date(),
    };
    set((state) => ({
      uploadedFiles: [...state.uploadedFiles, newFile],
    }));
  },

  removeFile: (id: string) => {
    set((state) => ({
      uploadedFiles: state.uploadedFiles.filter((f) => f.id !== id),
    }));
  },

  clearFiles: () => {
    set({ uploadedFiles: [] });
  },

  setUploading: (isUploading: boolean) => {
    set({ isUploading });
  },

  setUploadProgress: (progress: number) => {
    set({ uploadProgress: Math.min(100, Math.max(0, progress)) });
  },

  // Analysis state
  currentAnalysis: null,
  analysisHistory: [],
  isAnalyzing: false,

  setAnalyzing: (isAnalyzing: boolean) => {
    set({ isAnalyzing });
  },

  setCurrentAnalysis: (analysis: AnalysisResult) => {
    set({ currentAnalysis: analysis });
  },

  addToHistory: (analysis: AnalysisResult) => {
    set((state) => ({
      analysisHistory: [analysis, ...state.analysisHistory].slice(0, 10), // Keep last 10
    }));
  },

  // User state
  userId: null,
  isGuestUser: true,
  userEmail: null,

  setUserId: (userId: string | null) => {
    set({ userId });
  },

  setIsGuestUser: (isGuest: boolean) => {
    set({ isGuestUser: isGuest });
  },

  setUserEmail: (email: string | null) => {
    set({ userEmail: email });
  },
}));
