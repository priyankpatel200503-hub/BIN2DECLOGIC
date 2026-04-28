import { useState, useEffect, useRef, useCallback } from 'react';
import { useConverter } from './hooks/useConverter';
import { useHistory } from './hooks/useHistory';
import { Moon, Sun, ArrowRightLeft, Clock, Trash2, Copy, Delete, Lightbulb, ArrowRight } from 'lucide-react';
import { LogicPanel } from './components/LogicPanel';
import './App.css';

function App() {
  const [isDark, setIsDark] = useState(() => {
    try {
      const stored = localStorage.getItem('bin2dec_theme');
      if (stored) return stored === 'dark';
    } catch { /* ignore */ }
    return false;
  });
  const [isLogicOpen, setIsLogicOpen] = useState(false);
  const [isSwapping, setIsSwapping] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [toastVisible, setToastVisible] = useState(false);

  const { mode, inputStr, outputStr, errorStr, setInput, toggleMode } = useConverter();
  const { history, addHistory, removeHistory, clearHistory } = useHistory();

  const historyListRef = useRef<HTMLDivElement>(null);
  const lastSavedRef = useRef<string>('');
  const isBinaryMode = mode === 'BIN_TO_DEC';

  // --- Theme persistence ---
  useEffect(() => {
    if (isDark) {
      document.body.setAttribute('data-theme', 'dark');
    } else {
      document.body.removeAttribute('data-theme');
    }
    try { localStorage.setItem('bin2dec_theme', isDark ? 'dark' : 'light'); } catch { /* ignore */ }
  }, [isDark]);

  // --- Save to history when a valid new output is generated ---
  useEffect(() => {
    if (outputStr && !errorStr && inputStr) {
      const key = `${mode}:${inputStr}`;
      if (lastSavedRef.current === key) return;
      lastSavedRef.current = key;
      addHistory(inputStr, outputStr, mode);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [outputStr]);

  // --- Toast helper ---
  const showToast = useCallback((msg: string) => {
    setToastMsg(msg);
    setToastVisible(true);
    setTimeout(() => setToastVisible(false), 1800);
  }, []);

  // --- Handlers ---
  const handleCopy = () => {
    if (outputStr) {
      navigator.clipboard.writeText(outputStr).then(() => {
        showToast('Copied to clipboard');
      });
    }
  };

  const handleClear = () => {
    setInput('');
    lastSavedRef.current = '';
  };

  const handleSwap = () => {
    setIsSwapping(true);
    lastSavedRef.current = '';
    toggleMode();
    setTimeout(() => setIsSwapping(false), 350);
  };

  const handleNumpadPress = (btn: number | string) => {
    if (btn === 'Clear') {
      handleClear();
    } else if (btn === 'Back') {
      setInput(inputStr.slice(0, -1));
    } else {
      setInput(inputStr + btn);
    }
  };

  const handleApplyHistory = (input: string, itemMode: string) => {
    if (itemMode !== mode) {
      lastSavedRef.current = '';
      toggleMode();
    }
    setTimeout(() => {
      lastSavedRef.current = `${itemMode}:${input}`;
      setInput(input);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 50);
  };

  const formatModeLabel = (m: string) =>
    m === 'BIN_TO_DEC' ? 'BIN → DEC' : 'DEC → BIN';

  const formatTimestamp = (ts: number) => {
    const d = new Date(ts);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHrs = Math.floor(diffMins / 60);
    if (diffHrs < 24) return `${diffHrs}h ago`;
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  const numpadKeys = [1, 2, 3, 4, 5, 6, 7, 8, 9, 'Clear', 0, 'Back'] as const;

  return (
    <>
      <div className="app-container">
        {/* --- Header --- */}
        <header className="header animate-fade-in">
          <h1 className="title">Bin2Dec</h1>
          <button
            className="theme-toggle"
            onClick={() => setIsDark(!isDark)}
            aria-label="Toggle theme"
          >
            {isDark ? <Sun size={22} /> : <Moon size={22} />}
          </button>
        </header>

        <main>
          {/* --- Converter Card --- */}
          <section className="converter-card animate-slide-down">
            {/* Input */}
            <div className="input-group">
              <label>{isBinaryMode ? 'Binary' : 'Decimal'}</label>
              <div
                className={`display-field ${inputStr ? 'has-value' : ''}`}
              >
                {inputStr || (
                  <span className="output-placeholder">
                    {isBinaryMode
                      ? 'Enter binary (0, 1)...'
                      : 'Enter decimal (0–9)...'}
                  </span>
                )}
              </div>
              {errorStr && <span className="error-text">{errorStr}</span>}
            </div>

            {/* Swap Button */}
            <div className="controls">
              <button
                className={`swap-btn ${isSwapping ? 'spinning' : ''}`}
                onClick={handleSwap}
                title="Swap conversion mode"
                aria-label="Swap conversion mode"
              >
                <ArrowRightLeft size={22} />
              </button>
            </div>

            {/* Output */}
            <div className="input-group">
              <label>{isBinaryMode ? 'Decimal' : 'Binary'}</label>
              <div className="output-field">
                {outputStr || (
                  <span className="output-placeholder">
                    Result appears here
                  </span>
                )}
                {outputStr && (
                  <div className="action-bar">
                    <button
                      className="icon-btn"
                      onClick={() => setIsLogicOpen(true)}
                      title="Show step-by-step logic"
                      aria-label="Show logic"
                    >
                      <Lightbulb size={18} />
                    </button>
                    <button
                      className="icon-btn"
                      onClick={handleCopy}
                      title="Copy result"
                      aria-label="Copy result"
                    >
                      <Copy size={18} />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Custom Number Pad */}
            <div className="numpad-container">
              <div className="numpad-grid">
                {numpadKeys.map((btn) => {
                  const isDisabled =
                    isBinaryMode && typeof btn === 'number' && btn > 1;
                  return (
                    <button
                      key={btn}
                      className={`numpad-btn ${typeof btn === 'string' ? 'numpad-btn-action' : ''}`}
                      disabled={isDisabled}
                      onClick={() => handleNumpadPress(btn)}
                      aria-label={btn === 'Back' ? 'Backspace' : String(btn)}
                    >
                      {btn === 'Back' ? (
                        <Delete size={22} strokeWidth={1.5} />
                      ) : (
                        btn
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </section>

          {/* --- History Section --- */}
          <section className="history-section animate-fade-in" style={{ marginTop: 24 }}>
            <div className="history-header">
              <h2 className="history-title">
                <Clock size={18} /> History
              </h2>
              {history.length > 0 && (
                <button className="clear-history-btn" onClick={clearHistory}>
                  Clear All
                </button>
              )}
            </div>

            <div className="history-list" ref={historyListRef}>
              {history.length === 0 ? (
                <div className="empty-history">
                  <div className="empty-history-icon">🕐</div>
                  No conversions yet. Start typing above!
                </div>
              ) : (
                history.map((item, index) => (
                  <HistoryCard
                    key={item.id}
                    item={item}
                    index={index}
                    onApply={() => handleApplyHistory(item.input, item.mode)}
                    onDelete={() => removeHistory(item.id)}
                    formatMode={formatModeLabel}
                    formatTime={formatTimestamp}
                  />
                ))
              )}
            </div>
          </section>
        </main>
      </div>

      {/* --- Footer --- */}
      <footer className="footer-full-width animate-fade-in">
        <div className="credits-container">
          <span className="credits-label">Designed by</span>
          <div className="credits-names">
            <strong>PATEL PRIYANK</strong>
            <strong>PATEL KEYUR</strong>
            <strong>BAGDI PARAS</strong>
            <strong>CHAUDHARY ALKESH</strong>
            <strong>PATEL TIRTH</strong>
          </div>
        </div>
      </footer>

      {/* --- Logic Panel Modal --- */}
      {isLogicOpen && (
        <LogicPanel
          inputStr={inputStr}
          outputStr={outputStr}
          mode={mode}
          onClose={() => setIsLogicOpen(false)}
        />
      )}

      {/* --- Toast --- */}
      <div className={`toast ${toastVisible ? 'show' : ''}`}>
        {toastMsg}
      </div>
    </>
  );
}

/* ============================================
   HISTORY CARD — Swipe-to-delete component
   ============================================ */
interface HistoryCardProps {
  item: { id: string; input: string; output: string; mode: string; timestamp: number };
  index: number;
  onApply: () => void;
  onDelete: () => void;
  formatMode: (m: string) => string;
  formatTime: (ts: number) => string;
}

function HistoryCard({ item, index, onApply, onDelete, formatMode, formatTime }: HistoryCardProps) {
  const [swipeX, setSwipeX] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const startXRef = useRef(0);

  const handleTouchStart = (e: React.TouchEvent) => {
    startXRef.current = e.touches[0].clientX;
    setIsSwiping(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isSwiping) return;
    const diff = startXRef.current - e.touches[0].clientX;
    if (diff > 0) {
      setSwipeX(Math.min(diff, 80));
    } else {
      setSwipeX(0);
    }
  };

  const handleTouchEnd = () => {
    setIsSwiping(false);
    if (swipeX > 60) {
      onDelete();
    } else {
      setSwipeX(0);
    }
  };

  return (
    <div
      className={`history-item ${index === 0 ? 'highlight-item' : ''}`}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{ overflow: 'hidden', padding: 0 }}
    >
      {/* Delete background revealed on swipe */}
      <div className="swipe-delete-bg">
        <Trash2 size={18} />
      </div>

      {/* Card content slides left on swipe */}
      <div
        className="history-item-inner"
        style={{
          transform: `translateX(-${swipeX}px)`,
          padding: '12px 16px',
        }}
        onClick={() => {
          if (swipeX < 5) onApply();
        }}
      >
        <div className="history-item-content">
          <span className="history-mode-badge">{formatMode(item.mode)}</span>
          <div className="history-values">
            <span>{item.input}</span>
            <ArrowRight size={12} className="history-arrow" />
            <span className="history-output">{item.output}</span>
          </div>
          <span className="history-timestamp">{formatTime(item.timestamp)}</span>
        </div>
        <div className="history-actions" onClick={(e) => e.stopPropagation()}>
          <button
            className="icon-btn delete"
            onClick={onDelete}
            title="Delete"
            aria-label="Delete history item"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;
