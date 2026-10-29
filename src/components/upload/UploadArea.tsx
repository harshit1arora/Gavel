import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, FileText, Image, X, Check, AlertCircle } from 'lucide-react';
import { useStore } from '../../store/appStore';

export function UploadArea() {
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { uploadedFiles, addFile, removeFile } = useStore();

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = e.dataTransfer.files;
    if (files) {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (file.type === 'application/pdf' || file.type.startsWith('image/')) {
          const type = file.name.toLowerCase().includes('salary') ? 'salary' : 'statement';
          addFile(file, type);
        }
      }
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      for (let i = 0; i < e.target.files.length; i++) {
        const file = e.target.files[i];
        const type = file.name.toLowerCase().includes('salary') ? 'salary' : 'statement';
        addFile(file, type);
      }
    }
  };

  return (
    <div className="w-full">
      {/* Drag and Drop Area */}
      <motion.div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        animate={{
          borderColor: dragActive ? 'rgb(255, 127, 14)' : 'rgba(255, 127, 14, 0.3)',
          backgroundColor: dragActive ? 'rgba(255, 127, 14, 0.05)' : 'rgba(255, 127, 14, 0.02)',
        }}
        className="relative border-2 border-dashed rounded-2xl p-12 cursor-pointer transition-all overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-orange-600/5 via-transparent to-orange-600/5 pointer-events-none" />

        <div className="relative z-10 text-center">
          <motion.div
            animate={{ y: dragActive ? -5 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="w-16 h-16 rounded-full bg-orange-500/10 flex items-center justify-center mx-auto mb-4">
              <Upload className="w-8 h-8 text-orange-500" />
            </div>

            <h3 className="text-xl font-semibold text-white mb-2">
              Drop your files here
            </h3>
            <p className="text-gray-400 mb-4">
              or click to select PDF bank statements, salary slips, or images
            </p>
          </motion.div>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-orange-500 hover:bg-orange-600 text-white font-semibold transition-colors"
          >
            <Upload className="w-4 h-4" />
            Browse Files
          </button>

          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".pdf,image/*"
            onChange={handleChange}
            className="hidden"
          />

          <p className="text-xs text-gray-500 mt-6">
            ✓ PDF statements · ✓ JPG/PNG images · ✓ Up to 20MB each
            <br />
            🔒 256-bit encrypted · Auto-deleted after analysis
          </p>
        </div>
      </motion.div>

      {/* Uploaded Files */}
      <AnimatePresence>
        {uploadedFiles.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="mt-8"
          >
            <h4 className="text-sm font-semibold text-gray-300 mb-4">
              {uploadedFiles.length} file{uploadedFiles.length !== 1 ? 's' : ''} selected
            </h4>

            <div className="space-y-3">
              {uploadedFiles.map((file, index) => (
                <motion.div
                  key={file.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-center gap-4 p-4 rounded-lg bg-white/5 border border-white/10 hover:border-orange-500/30 transition-colors group"
                >
                  <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center flex-shrink-0">
                    {file.file.type === 'application/pdf' ? (
                      <FileText className="w-5 h-5 text-orange-500" />
                    ) : (
                      <Image className="w-5 h-5 text-orange-500" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">
                      {file.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {file.type === 'salary' ? 'Salary Slip' : 'Bank Statement'} ·{' '}
                      {(file.file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>

                  <motion.div
                    animate={{ scale: 1 }}
                    className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0"
                  >
                    <Check className="w-4 h-4 text-green-500" />
                  </motion.div>

                  <button
                    onClick={() => removeFile(file.id)}
                    className="w-8 h-8 rounded-lg hover:bg-red-500/20 text-gray-400 hover:text-red-500 flex items-center justify-center transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function UploadProgress() {
  const { uploadProgress } = useStore();

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm text-gray-400">Uploading...</span>
        <span className="text-sm font-semibold text-orange-400">{uploadProgress}%</span>
      </div>
      <div className="h-2 bg-white/5 rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-orange-500 to-orange-600"
          animate={{ width: `${uploadProgress}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>
    </div>
  );
}
