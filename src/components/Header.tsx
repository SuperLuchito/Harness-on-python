import { useEffect, useState } from 'react';
import { AnimatePresence, motion, useScroll, useSpring } from 'motion/react';
import { BookOpen, ChevronDown, Eye, EyeOff, Moon, Sun, X } from 'lucide-react';
import { SYNTAX_DOCS } from '../data/pythonGlossary';

interface HeaderProps {
  syntaxHintsEnabled: boolean;
  darkMode: boolean;
  onToggleSyntaxHints: () => void;
  onToggleDarkMode: () => void;
  onOpenGlossary: () => void;
}

const NAV_LINKS = [
  { href: '#provider-setup', label: 'Выбор провайдера' },
  { href: '#pencils-out', label: '01 · К делу: собираем скелет' },
  { href: '#first-tool', label: '02 · Первый инструмент' },
  { href: '#read-file', label: '03 · Даём глаза: read_file' },
  { href: '#list-files', label: '04 · Осматриваемся: list_files' },
  { href: '#edit-file', label: '05 · Даём руки: edit_file' },
  { href: '#goat-proxy', label: '06 · Command Code GOAT и прокси' },
  { href: '#simulator', label: '07 · Симулятор цикла' },
  { href: '#full-code', label: '08 · Весь код проекта' },
  { href: '#locals', label: '09 · Locals (Apple Silicon LLM)' },
];

const GLOSSARY_COUNT = Object.keys(SYNTAX_DOCS).length;

export function HarnessLogo({ compact = false }: { compact?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2 select-none whitespace-nowrap">
      {/* Minimal architectural harness-frame mark */}
      <svg
        viewBox="0 0 22 22"
        fill="none"
        aria-hidden="true"
        className={compact ? 'h-[17px] w-[17px] shrink-0' : 'h-[19px] w-[19px] shrink-0'}
      >
        <path
          d="M3.5 7.5V3.5H7.5M14.5 3.5H18.5V7.5M18.5 14.5V18.5H14.5M7.5 18.5H3.5V14.5"
          className="stroke-[#111614] dark:stroke-[#ecece6]"
          strokeWidth="1.5"
          strokeLinecap="square"
        />
        <rect
          x="8.25"
          y="8.25"
          width="5.5"
          height="5.5"
          rx="1"
          className="fill-[#2e7d5b] dark:fill-[#4cb888]"
        />
      </svg>
      <span
        style={{ fontFamily: 'var(--font-brand)' }}
        className={`${
          compact ? 'text-[23px]' : 'text-[26px]'
        } font-semibold italic leading-none tracking-[-0.02em] text-[#111614] dark:text-[#ecece6]`}
      >
        Harness
      </span>
    </span>
  );
}

export function Header({
  syntaxHintsEnabled,
  darkMode,
  onToggleSyntaxHints,
  onToggleDarkMode,
  onOpenGlossary,
}: HeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 220,
    damping: 32,
    restDelta: 0.001,
  });

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [menuOpen]);

  return (
    <header
      className={`sticky top-0 z-30 transition-colors duration-300 ${
        scrolled
          ? 'bg-[#f7f7f3]/92 backdrop-blur-md dark:bg-[#121413]/92'
          : 'bg-transparent'
      }`}
    >
      <div className="relative mx-auto flex h-16 max-w-[1320px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-10">
        {/* Left brand + breadcrumb */}
        <div className="flex min-w-0 items-center gap-4">
          <motion.a
            href="#top"
            aria-label="Harness — наверх"
            whileHover={{ x: 1.5 }}
            whileTap={{ scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 420, damping: 24 }}
            className="inline-flex shrink-0 items-center rounded-[5px] py-1 pr-1 transition-opacity hover:opacity-85"
          >
            <HarnessLogo />
          </motion.a>

          <span
            aria-hidden="true"
            className="hidden h-4 w-[1px] bg-[#cfd2ca] md:inline-block dark:bg-white/15"
          />

          <nav
            aria-label="Навигационная цепочка"
            className="hidden min-w-0 items-center gap-2 font-mono text-[11px] uppercase tracking-[0.06em] text-[#61655f] md:flex dark:text-[#8e938c]"
          >
            <a
              href="#top"
              className="shrink-0 text-[#111614] transition-opacity hover:opacity-70 dark:text-[#ecece6]"
            >
              ЗАМЕТКИ
            </a>
            <span aria-hidden="true" className="text-[#9fa39c] dark:text-white/30">
              //
            </span>
            <span className="truncate text-[#111614] dark:text-[#ecece6]">
              ИИ-АГЕНТ И LOCALS
            </span>
          </nav>
        </div>

        {/* Right interactive controls with pleasant refined palette */}
        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          <motion.button
            type="button"
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.96 }}
            onClick={onToggleSyntaxHints}
            aria-pressed={syntaxHintsEnabled}
            title={
              syntaxHintsEnabled
                ? 'Подсказки синтаксиса Python включены (нажмите, чтобы скрыть)'
                : 'Подсказки синтаксиса Python выключены (нажмите, чтобы включить)'
            }
            className={`inline-flex h-8 items-center gap-1.5 rounded-[6px] border px-2.5 font-mono text-[11px] uppercase tracking-[0.04em] transition-colors whitespace-nowrap ${
              syntaxHintsEnabled
                ? 'border-[#d8dcd4] bg-white/80 text-[#1e352b] hover:border-[#2e7d5b]/55 dark:border-white/12 dark:bg-white/[0.05] dark:text-[#dce8e1] dark:hover:border-[#4cb888]/55'
                : 'border-transparent bg-transparent text-[#61655f] hover:bg-black/[0.04] hover:text-[#111614] dark:text-[#8e938c] dark:hover:bg-white/[0.06] dark:hover:text-[#ecece6]'
            }`}
          >
            {syntaxHintsEnabled ? (
              <Eye className="h-3.5 w-3.5 text-[#2e7d5b] dark:text-[#4cb888]" aria-hidden="true" />
            ) : (
              <EyeOff className="h-3.5 w-3.5" aria-hidden="true" />
            )}
            <span className="hidden lg:inline">
              {syntaxHintsEnabled ? 'Синтаксис: вкл' : 'Синтаксис: выкл'}
            </span>
          </motion.button>

          {/* Sage-emerald accented Glossary button */}
          <motion.button
            type="button"
            whileHover={{ y: -1, scale: 1.015 }}
            whileTap={{ scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 460, damping: 24 }}
            onClick={onOpenGlossary}
            className="group inline-flex h-8 items-center gap-1.5 rounded-[6px] border border-[#2e7d5b]/45 bg-[#2e7d5b]/[0.1] px-2.5 font-mono text-[11px] font-medium uppercase tracking-[0.04em] text-[#1c4a36] shadow-[0_1px_3px_rgba(46,125,91,0.1)] transition-all hover:border-[#2e7d5b] hover:bg-[#2e7d5b] hover:text-white whitespace-nowrap dark:border-[#4cb888]/45 dark:bg-[#4cb888]/14 dark:text-[#a8e8ca] dark:hover:border-[#4cb888] dark:hover:bg-[#4cb888] dark:hover:text-[#0f1714]"
          >
            <BookOpen
              className="h-3.5 w-3.5 text-[#2e7d5b] transition-colors group-hover:text-white dark:text-[#4cb888] dark:group-hover:text-[#0f1714]"
              aria-hidden="true"
            />
            <span>Словарь</span>
            <span className="hidden sm:inline tabular-nums opacity-75">· {GLOSSARY_COUNT}</span>
          </motion.button>

          {/* Soft slate-amber Theme Switcher button */}
          <motion.button
            type="button"
            whileHover={{ y: -1, scale: 1.015 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 460, damping: 24 }}
            onClick={onToggleDarkMode}
            aria-label={darkMode ? 'Переключить на светлую тему' : 'Переключить на тёмную тему'}
            title={darkMode ? 'Переключить на светлую тему' : 'Переключить на тёмную тему'}
            className={`inline-flex h-8 items-center gap-1.5 rounded-[6px] border px-2.5 font-mono text-[11px] font-medium uppercase tracking-[0.04em] transition-all whitespace-nowrap ${
              darkMode
                ? 'border-[#e6be5a]/50 bg-[#e6be5a]/14 text-[#f5dfa1] shadow-[0_0_12px_rgba(230,190,90,0.14)] hover:border-[#e6be5a] hover:bg-[#e6be5a]/22'
                : 'border-[#2d404e]/85 bg-[#263846] text-[#f5f6f2] shadow-[0_1px_5px_rgba(38,56,70,0.18)] hover:bg-[#314859]'
            }`}
          >
            <AnimatePresence mode="wait" initial={false}>
              {darkMode ? (
                <motion.span
                  key="sun"
                  initial={{ rotate: -55, opacity: 0, scale: 0.72 }}
                  animate={{ rotate: 0, opacity: 1, scale: 1 }}
                  exit={{ rotate: 55, opacity: 0, scale: 0.72 }}
                  transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                  className="inline-flex items-center"
                >
                  <Sun className="h-3.5 w-3.5 text-[#f0ca67]" aria-hidden="true" />
                </motion.span>
              ) : (
                <motion.span
                  key="moon"
                  initial={{ rotate: 55, opacity: 0, scale: 0.72 }}
                  animate={{ rotate: 0, opacity: 1, scale: 1 }}
                  exit={{ rotate: -55, opacity: 0, scale: 0.72 }}
                  transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                  className="inline-flex items-center"
                >
                  <Moon className="h-3.5 w-3.5 text-[#f4cf7a]" aria-hidden="true" />
                </motion.span>
              )}
            </AnimatePresence>
            <span className="hidden sm:inline">{darkMode ? 'Светлая' : 'Тёмная'}</span>
          </motion.button>

          <motion.button
            type="button"
            whileTap={{ scale: 0.94 }}
            onClick={() => setMenuOpen((o) => !o)}
            aria-expanded={menuOpen}
            aria-label="Открыть оглавление статьи"
            className="inline-flex h-8 w-8 items-center justify-center rounded-[6px] border border-[#dce0d8] bg-white/75 text-[#3c403c] transition-colors hover:border-[#2e7d5b] hover:text-[#111614] dark:border-white/12 dark:bg-white/[0.04] dark:text-[#b6bab3] dark:hover:border-[#4cb888] dark:hover:text-[#ecece6]"
          >
            {menuOpen ? (
              <X className="h-4 w-4" aria-hidden="true" />
            ) : (
              <ChevronDown className="h-4 w-4" aria-hidden="true" />
            )}
          </motion.button>
        </div>
      </div>

      {/* Subtle architectural reading progress line */}
      <div className="relative h-[2px] w-full bg-[#e4e5df]/60 dark:bg-white/[0.06]">
        <motion.div
          style={{ scaleX }}
          className="h-full origin-left bg-[#2e7d5b] dark:bg-[#4cb888]"
        />
      </div>

      {/* Smoothly animated centered navigation dropdown */}
      <AnimatePresence initial={false}>
        {menuOpen && (
          <motion.div
            key="nav-dropdown"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden border-b border-[#e2e3dd] bg-[#f7f7f3]/98 backdrop-blur-md dark:border-white/10 dark:bg-[#121413]/98"
          >
            <div className="mx-auto max-w-[760px] px-4 py-5 sm:px-6">
              <p className="font-mono text-[11px] uppercase tracking-[0.06em] text-[#2e7d5b] dark:text-[#4cb888]">
                РАЗДЕЛЫ РУКОВОДСТВА
              </p>
              <nav
                aria-label="Быстрый переход по разделам"
                className="mt-3 grid grid-cols-1 gap-x-8 gap-y-2 sm:grid-cols-2"
              >
                {NAV_LINKS.map((item, idx) => (
                  <motion.a
                    key={item.href}
                    href={item.href}
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.18, delay: idx * 0.02 }}
                    onClick={() => setMenuOpen(false)}
                    className="py-1 font-mono text-[12px] text-[#3c403c] transition-colors hover:text-[#2e7d5b] dark:text-[#b6bab3] dark:hover:text-[#4cb888]"
                  >
                    {item.label}
                  </motion.a>
                ))}
              </nav>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
