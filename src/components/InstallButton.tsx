import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import * as LucideIcons from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isChrome, setIsChrome] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [isIframe, setIsIframe] = useState(false);

  useEffect(() => {
    // Check if running in standalone mode (already installed)
    const isStandaloneMode = 
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true ||
      document.referrer.includes('android-app://');

    setIsInstalled(isStandaloneMode);

    // Detect browser/OS
    const ua = navigator.userAgent;
    const isChromeBrowser = /Chrome|Chromium|CriOS/i.test(ua) && !/Edge|Edg|OPR/i.test(ua);
    const isIOSDevice = /iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream;
    const isAndroidDevice = /Android/i.test(ua);
    const isInIframe = window.self !== window.top;

    setIsChrome(isChromeBrowser);
    setIsIOS(isIOSDevice);
    setIsAndroid(isAndroidDevice);
    setIsIframe(isInIframe);

    // Listen for beforeinstallprompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsInstallable(true);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const triggerInstall = async (): Promise<'accepted' | 'dismissed' | 'manual_guide'> => {
    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        const choice = await deferredPrompt.userChoice;
        if (choice.outcome === 'accepted') {
          setIsInstalled(true);
          setIsInstallable(false);
          setDeferredPrompt(null);
        }
        return choice.outcome;
      } catch (err) {
        console.error('Error invoking install prompt:', err);
        return 'manual_guide';
      }
    }
    return 'manual_guide';
  };

  return {
    deferredPrompt,
    isInstallable,
    isInstalled,
    isChrome,
    isIOS,
    isAndroid,
    isIframe,
    triggerInstall,
  };
}

interface InstallHeaderButtonProps {
  variant?: 'landing' | 'app';
  isDarkMode?: boolean;
  className?: string;
}

export const InstallHeaderButton: React.FC<InstallHeaderButtonProps> = ({
  variant = 'app',
  isDarkMode = true,
  className = '',
}) => {
  const { isInstalled, isInstallable, triggerInstall, isChrome, isIframe } = usePWAInstall();
  const [showModal, setShowModal] = useState(false);

  const handleClick = async () => {
    if (isInstallable) {
      const result = await triggerInstall();
      if (result === 'manual_guide') {
        setShowModal(true);
      }
    } else {
      setShowModal(true);
    }
  };

  // If already installed, we can hide or show a subtle "Installed" indicator
  if (isInstalled) {
    return null;
  }

  if (variant === 'landing') {
    return (
      <>
        <motion.button
          type="button"
          id="top-install-btn-landing"
          onClick={handleClick}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border cursor-pointer ${
            isDarkMode
              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20 hover:border-emerald-500/50 shadow-[0_0_12px_rgba(16,185,129,0.2)]"
              : "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 shadow-sm"
          } ${className}`}
          title="Install Nourish IQ as an App"
        >
          <LucideIcons.Download size={14} className="animate-bounce" />
          <span>Install App</span>
        </motion.button>

        <InstallGuideModal isOpen={showModal} onClose={() => setShowModal(false)} />
      </>
    );
  }

  return (
    <>
      <motion.button
        type="button"
        id="top-install-btn-app"
        onClick={handleClick}
        whileHover={{ scale: 1.04 }}
        whileTap={{ scale: 0.96 }}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500/20 to-teal-500/20 text-emerald-400 border border-emerald-500/30 hover:border-emerald-500/60 hover:from-emerald-500/30 hover:to-teal-500/30 transition-all shadow-[0_0_15px_rgba(16,185,129,0.15)] cursor-pointer group ${className}`}
        title="Install Nourish IQ App on Chrome"
      >
        <div className="w-5 h-5 rounded-md bg-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
          <LucideIcons.Download size={13} className="text-emerald-400" />
        </div>
        <span className="text-xs font-bold text-emerald-300 hidden xs:inline sm:inline">Install</span>
      </motion.button>

      <InstallGuideModal isOpen={showModal} onClose={() => setShowModal(false)} />
    </>
  );
};

export const TopInstallBanner: React.FC<{ isDarkMode?: boolean }> = ({ isDarkMode = true }) => {
  const { isInstalled, isInstallable, triggerInstall, isChrome, isIframe } = usePWAInstall();
  const [isDismissed, setIsDismissed] = useState(false);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const dismissed = sessionStorage.getItem('nourish_pwa_banner_dismissed');
    if (dismissed === 'true') {
      setIsDismissed(true);
    }
  }, []);

  const handleDismiss = () => {
    setIsDismissed(true);
    sessionStorage.setItem('nourish_pwa_banner_dismissed', 'true');
  };

  const handleInstallClick = async () => {
    if (isInstallable) {
      const result = await triggerInstall();
      if (result === 'manual_guide') {
        setShowModal(true);
      }
    } else {
      setShowModal(true);
    }
  };

  if (isInstalled || isDismissed) {
    return <InstallGuideModal isOpen={showModal} onClose={() => setShowModal(false)} />;
  }

  return (
    <>
      <motion.div
        initial={{ height: 0, opacity: 0 }}
        animate={{ height: 'auto', opacity: 1 }}
        exit={{ height: 0, opacity: 0 }}
        className="bg-gradient-to-r from-emerald-950/90 via-slate-900/90 to-teal-950/90 border-b border-emerald-500/30 text-white px-3 sm:px-4 py-2 z-40 relative backdrop-blur-md"
      >
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-6 h-6 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 flex-shrink-0">
              <LucideIcons.Smartphone size={13} />
            </div>
            <p className="truncate font-medium text-slate-200">
              <span className="font-bold text-emerald-400">Install Nourish IQ:</span> Tap for full-screen & offline tracking
            </p>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              type="button"
              onClick={handleInstallClick}
              className="px-3 py-1 bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-slate-950 font-black text-[11px] rounded-lg transition-all shadow-md shadow-emerald-500/20 flex items-center gap-1 cursor-pointer"
            >
              <LucideIcons.Download size={12} />
              <span>Install Now</span>
            </button>
            <button
              type="button"
              onClick={handleDismiss}
              className="p-1 text-slate-400 hover:text-white rounded-md transition-colors cursor-pointer"
              title="Dismiss"
            >
              <LucideIcons.X size={14} />
            </button>
          </div>
        </div>
      </motion.div>

      <InstallGuideModal isOpen={showModal} onClose={() => setShowModal(false)} />
    </>
  );
};

export const InstallGuideModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({
  isOpen,
  onClose,
}) => {
  const { triggerInstall, isInstallable, isChrome, isIOS, isAndroid, isIframe } = usePWAInstall();
  const [copied, setCopied] = useState(false);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl relative"
        >
          {/* Header */}
          <div className="p-5 border-b border-slate-800/80 flex items-center justify-between bg-slate-950/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
                <LucideIcons.Download size={20} />
              </div>
              <div>
                <h3 className="font-bold text-white text-base">Install Nourish IQ</h3>
                <p className="text-xs text-slate-400">Quick 1-tap installation guide</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            >
              <LucideIcons.X size={18} />
            </button>
          </div>

          {/* Body Instructions */}
          <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
            {/* Quick 1-Tap Trigger if Chrome/Chromium native event is ready */}
            {isInstallable && (
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl space-y-2">
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                  <LucideIcons.Sparkles size={16} />
                  <span>Instant Install Available</span>
                </div>
                <p className="text-xs text-slate-300">
                  Chrome is ready to install Nourish IQ directly to your device.
                </p>
                <button
                  type="button"
                  onClick={async () => {
                    await triggerInstall();
                    onClose();
                  }}
                  className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
                >
                  <LucideIcons.Download size={15} />
                  Install Nourish IQ Now
                </button>
              </div>
            )}

            {/* If inside iframe / AI Studio preview */}
            {isIframe && (
              <div className="p-3.5 bg-blue-500/10 border border-blue-500/20 rounded-xl space-y-2">
                <div className="flex items-center gap-2 text-blue-400 font-bold text-xs">
                  <LucideIcons.ExternalLink size={14} />
                  <span>Preview Tab Detected</span>
                </div>
                <p className="text-[11px] text-slate-300">
                  For the best installation experience in Google Chrome, open the app in its own browser tab.
                </p>
                <a
                  href={typeof window !== 'undefined' ? window.location.href : '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer text-center"
                >
                  <LucideIcons.ExternalLink size={13} />
                  Open in New Chrome Tab
                </a>
              </div>
            )}

            {/* Instructions for Google Chrome (Desktop / Android) */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-white font-bold text-xs uppercase tracking-wider text-slate-400">
                <LucideIcons.Chrome size={15} className="text-emerald-400" />
                <span>How to Install in Google Chrome</span>
              </div>

              <div className="space-y-2.5">
                <div className="flex items-start gap-3 p-3 bg-slate-950/60 border border-slate-800/60 rounded-xl">
                  <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 font-black text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                    1
                  </div>
                  <div className="text-xs text-slate-300">
                    <p className="font-semibold text-white">Tap the Chrome Menu (⋮) or Address Bar</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      On Mobile: Tap the <strong>three dots (⋮)</strong> in the top-right.<br />
                      On Desktop: Click the <strong>Install icon (💻/⬇️)</strong> on the right of the address bar.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-slate-950/60 border border-slate-800/60 rounded-xl">
                  <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 font-black text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                    2
                  </div>
                  <div className="text-xs text-slate-300">
                    <p className="font-semibold text-white">Select "Install App" or "Add to Home screen"</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Chrome will package Nourish IQ with offline support and home screen icon.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-slate-950/60 border border-slate-800/60 rounded-xl">
                  <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 font-black text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                    3
                  </div>
                  <div className="text-xs text-slate-300">
                    <p className="font-semibold text-white">Tap "Install" to Confirm</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      The app launches in full-screen mode instantly.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Apple Safari Instructions accordion / fallback */}
            <details className="group border border-slate-800 rounded-xl overflow-hidden">
              <summary className="p-3 bg-slate-950/40 text-xs font-bold text-slate-300 cursor-pointer flex items-center justify-between list-none select-none">
                <span className="flex items-center gap-2">
                  <LucideIcons.Compass size={14} className="text-blue-400" />
                  <span>iPhone / Safari Instructions</span>
                </span>
                <LucideIcons.ChevronDown size={14} className="group-open:rotate-180 transition-transform text-slate-500" />
              </summary>
              <div className="p-3 bg-slate-950/20 text-xs text-slate-300 space-y-2 border-t border-slate-800">
                <p>1. Open link in <strong>Safari</strong>.</p>
                <p>2. Tap the <strong>Share</strong> button (box with upward arrow <LucideIcons.Share size={12} className="inline text-blue-400" />).</p>
                <p>3. Tap <strong>"Add to Home Screen"</strong> $\rightarrow$ <strong>Add</strong>.</p>
              </div>
            </details>
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-slate-800/80 bg-slate-950/60 flex items-center justify-between gap-3">
            <button
              onClick={handleCopyLink}
              className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-emerald-400 transition-colors font-medium cursor-pointer"
            >
              {copied ? <LucideIcons.Check size={14} className="text-emerald-400" /> : <LucideIcons.Copy size={14} />}
              <span>{copied ? 'Link Copied!' : 'Copy App Link'}</span>
            </button>

            <button
              onClick={onClose}
              className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
