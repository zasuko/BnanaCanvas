import React, { useState, useEffect } from 'react';

interface ApiKeyModalProps {
  isOpen: boolean;
  onSave: (key: string) => void;
  onClose: () => void;
  savedKey?: string;
}

const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ isOpen, onSave, onClose, savedKey = '' }) => {
  const [key, setKey] = useState(savedKey);
  const [error, setError] = useState('');

  useEffect(() => {
    setKey(savedKey);
  }, [savedKey]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!key.trim()) {
      setError('Please enter a valid API Key');
      return;
    }
    onSave(key.trim());
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-brand-bg/90 backdrop-blur-sm"
        onClick={() => { if(savedKey) onClose(); }} // Only allow closing by click if a key already exists
      />
      
      {/* Modal Content */}
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl p-8 border border-white animate-float">
        <div className="flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-pink-50 rounded-full flex items-center justify-center mb-4 text-primary">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                </svg>
            </div>
            
            <h2 className="text-2xl font-extrabold text-text-main mb-2">
                Enter Gemini API Key
            </h2>
            <div className="text-text-secondary mb-6 text-sm space-y-3">
                <p>
                    To use the <span className="text-primary font-bold">Banana Canvas</span>, you need your own Google Gemini API key. Your key is stored locally in your browser and is never sent to our servers.
                </p>
                <p className="text-xs text-text-secondary/80 border-t border-dashed border-gray-200 pt-3 leading-relaxed">
                    Banana Canvasを使用するには、<br/>
                    Google Gemini APIキーが必要です。<br/>
                    入力されたキーはブラウザにのみ保存され、<br/>
                    外部サーバーへ送信されることはありません。
                </p>
            </div>

            <form onSubmit={handleSubmit} className="w-full">
                <input
                    type="password"
                    value={key}
                    onChange={(e) => {
                        setKey(e.target.value);
                        setError('');
                    }}
                    placeholder="Enter your API Key here..."
                    className="w-full p-4 rounded-xl border border-border-color bg-brand-bg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all mb-2 text-text-main font-mono text-sm"
                />
                
                {error && <p className="text-red-400 text-xs font-bold mb-4">{error}</p>}
                
                <div className="flex flex-col gap-3 mt-4">
                    <button
                        type="submit"
                        className="w-full py-3 px-6 bg-primary hover:bg-primary-hover text-white font-bold rounded-xl transition-all shadow-lg shadow-primary/30"
                    >
                        Save API Key
                    </button>
                    {savedKey && (
                        <button
                            type="button"
                            onClick={onClose}
                            className="w-full py-3 px-6 bg-gray-100 hover:bg-gray-200 text-text-secondary font-bold rounded-xl transition-all"
                        >
                            Cancel
                        </button>
                    )}
                </div>
            </form>
            
            <div className="mt-6 pt-6 border-t border-gray-100 w-full">
                <a 
                    href="https://aistudio.google.com/app/apikey" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary font-bold text-xs hover:underline flex items-center justify-center gap-1"
                >
                    Get a free API Key from Google AI Studio
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                </a>
            </div>
        </div>
      </div>
    </div>
  );
};

export default ApiKeyModal;