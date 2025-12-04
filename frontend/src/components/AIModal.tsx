import { X, Sparkles, Copy } from 'lucide-react';
import { motion } from 'framer-motion';

interface AIModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  content: string;
  isLoading: boolean;
  onAction?: () => void;
}

export const AIModal: React.FC<AIModalProps> = ({ 
  isOpen, 
  onClose, 
  title, 
  content, 
  isLoading,
  onAction 
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden relative z-10"
      >
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 flex items-center justify-between">
          <div className="flex items-center gap-2 text-white">
            <Sparkles className="w-5 h-5" />
            <h3 className="font-bold text-lg">{title}</h3>
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-8 space-y-4">
              <div className="w-12 h-12 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin" />
              <p className="text-slate-500 text-sm animate-pulse">Consulting Gemini AI models...</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-slate-700 leading-relaxed whitespace-pre-line">
                {content}
              </div>
              {onAction && (
                <div className="flex justify-end gap-2 pt-2">
                  <button 
                    onClick={onClose}
                    className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-100 rounded-lg"
                  >
                    Close
                  </button>
                  <button 
                    onClick={() => { onAction(); onClose(); }}
                    className="px-4 py-2 bg-indigo-600 text-white font-medium hover:bg-indigo-700 rounded-lg flex items-center gap-2"
                  >
                    <Copy className="w-4 h-4" /> Copy to Clipboard
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

