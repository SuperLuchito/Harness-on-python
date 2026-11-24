import { useEffect, useMemo, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { MotionConfig, motion } from 'motion/react';
import { BookOpen, Cpu, Sparkles } from 'lucide-react';
import { ArticleBody } from './components/ArticleBody';
import { AgentLoopSimulator } from './components/AgentLoopSimulator';
import { FullCodeBundle } from './components/FullCodeBundle';
import { FunctionInspectorDrawer } from './components/FunctionInspectorDrawer';
import { GoatProxySection } from './components/GoatProxySection';
import { HarnessLogo, Header } from './components/Header';
import { LocalsSection } from './components/LocalsSection';
import { ProviderSelector } from './components/ProviderSelector';
import { SyntaxGlossaryDrawer } from './components/SyntaxGlossaryDrawer';
import { PROVIDERS } from './data/providers';
import { ProviderId, VirtualKeyEntry } from './types/guide';
import { DEFAULT_VIRTUAL_KEYS, generateProviderCodeBundle } from './utils/providerCodegen';

const TOC_ITEMS = [
  { id: 'intro', href: '#intro', label: 'Введение' },
  { id: 'provider-setup', href: '#provider-setup', label: 'Выбор провайдера' },
  { id: 'pencils-out', href: '#pencils-out', label: 'Собираем скелет' },
  { id: 'first-tool', href: '#first-tool', label: 'Первый инструмент' },
  { id: 'read-file', href: '#read-file', label: 'read_file' },
  { id: 'list-files', href: '#list-files', label: 'list_files' },
  { id: 'edit-file', href: '#edit-file', label: 'edit_file' },
  { id: 'conclusion', href: '#conclusion', label: 'Итог' },
  { id: 'goat-proxy', href: '#goat-proxy', label: 'Command Code GOAT' },
  { id: 'simulator', href: '#simulator', label: 'Симулятор цикла' },
  { id: 'full-code', href: '#full-code', label: 'Весь код проекта' },
  { id: 'locals', href: '#locals', label: 'Locals → Harness' },
];

export default function App() {
  const [providerId, setProviderId] = useState<ProviderId>('command_code_goat');
  const [selectedModel, setSelectedModel] = useState<string>(PROVIDERS.command_code_goat.defaultModel);
  const [syntaxHintsEnabled, setSyntaxHintsEnabled] = useState<boolean>(true);
  const [darkMode, setDarkMode] = useState<boolean>(false);
  const [activeFunctionId, setActiveFunctionId] = useState<string | null>(null);
  const [glossaryOpen, setGlossaryOpen] = useState<boolean>(false);
  const [glossaryInitialSyntax, setGlossaryInitialSyntax] = useState<string | null>(null);
  const [virtualKeys, setVirtualKeys] = useState<VirtualKeyEntry[]>(DEFAULT_VIRTUAL_KEYS);
  const [activeSectionId, setActiveSectionId] = useState<string>('intro');
  const themeTimerRef = useRef<number | null>(null);

  useEffect(() => {
    const root = document.documentElement;
    if (darkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [darkMode]);

  useEffect(() => {
    return () => {
      if (themeTimerRef.current !== null) {
        window.clearTimeout(themeTimerRef.current);
      }
    };
  }, []);

  const handleToggleDarkMode = () => {
    const nextDark = !darkMode;
    const root = document.documentElement;
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const applyTheme = () => {
      root.classList.toggle('dark', nextDark);
      flushSync(() => {
        setDarkMode(nextDark);
      });
    };

    const docWithVT = document as Document & {
      startViewTransition?: (callback: () => void) => { finished: Promise<void> };
    };

    if (!prefersReducedMotion && typeof docWithVT.startViewTransition === 'function') {
      docWithVT.startViewTransition(applyTheme);
      return;
    }

    if (prefersReducedMotion) {
      applyTheme();
      return;
    }

    // Fallback for browsers without View Transitions API: apply class first, then flip on next frame
    root.classList.add('theme-transitioning');
    if (themeTimerRef.current !== null) {
      window.clearTimeout(themeTimerRef.current);
    }
    window.requestAnimationFrame(() => {
      applyTheme();
      themeTimerRef.current = window.setTimeout(() => {
        root.classList.remove('theme-transitioning');
        themeTimerRef.current = null;
      }, 560);
    });
  };

  // Live scrollspy for the left sidebar table of contents
  useEffect(() => {
    const ids = TOC_ITEMS.map((t) => t.id);
    const elements = ids
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => Boolean(el));

    if (elements.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible.length > 0 && visible[0].target.id) {
          setActiveSectionId(visible[0].target.id);
        }
      },
      { rootMargin: '-18% 0px -65% 0px', threshold: 0.05 }
    );

    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const handleSelectProvider = (nextId: ProviderId) => {
    setProviderId(nextId);
    setSelectedModel(PROVIDERS[nextId].defaultModel);
  };

  const bundle = useMemo(
    () => generateProviderCodeBundle(providerId, selectedModel, virtualKeys),
    [providerId, selectedModel, virtualKeys]
  );

  const handleAddVirtualKey = (label: string, token: string, dailyLimit: number) => {
    setVirtualKeys((prev) => [
      ...prev,
      { id: `vk-${Date.now()}`, label, token, dailyLimit },
    ]);
  };

  const handleRemoveVirtualKey = (id: string) => {
    setVirtualKeys((prev) => (prev.length > 1 ? prev.filter((k) => k.id !== id) : prev));
  };

  const handleUpdateVirtualKeyLimit = (id: string, dailyLimit: number) => {
    setVirtualKeys((prev) =>
      prev.map((k) => (k.id === id ? { ...k, dailyLimit } : k))
    );
  };

  const handleOpenGlossaryWithSyntax = (syntaxId: string) => {
    setGlossaryInitialSyntax(syntaxId);
    setGlossaryOpen(true);
  };

  const handleSwitchToProxyProvider = () => {
    handleSelectProvider('goat_shared_proxy');
    document.getElementById('provider-setup')?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSwitchToLocalsProvider = () => {
    handleSelectProvider('locals');
  };

  return (
    <MotionConfig reducedMotion="user">
      <div
        id="top"
        className="amp-arch-grid relative min-h-screen overflow-x-clip bg-[#f7f7f3] text-[#111614] dark:bg-[#121413] dark:text-[#ecece6]"
      >
        {/* Subtle centered radial veil so the drafting grid softens behind the reading column */}
        <div
          aria-hidden="true"
          className="pointer-events-none fixed inset-0 z-0 bg-[radial-gradient(ellipse_56%_84%_at_50%_42%,rgba(247,247,243,0.78)_0%,rgba(247,247,243,0.22)_74%,rgba(247,247,243,0.52)_100%)] dark:bg-[radial-gradient(ellipse_56%_84%_at_50%_42%,rgba(18,20,19,0.78)_0%,rgba(18,20,19,0.22)_74%,rgba(18,20,19,0.56)_100%)]"
        />

        {/* Symmetrical architectural vertical dotted guidelines framing left rail, center column, and right rail */}
        <div
          aria-hidden="true"
          className="pointer-events-none fixed inset-y-0 left-1/2 z-0 hidden w-full max-w-[1320px] -translate-x-1/2 xl:block"
        >
          <div className="amp-dotted-col absolute inset-y-0 left-[3%] w-[1px]" />
          <div className="amp-dotted-col absolute inset-y-0 left-[20%] w-[1px]" />
          <div className="amp-dotted-col absolute inset-y-0 left-[80%] w-[1px]" />
          <div className="amp-dotted-col absolute inset-y-0 left-[97%] w-[1px]" />
        </div>

        {/* Main foreground wrapper */}
        <div className="relative z-10">
          <Header
            syntaxHintsEnabled={syntaxHintsEnabled}
            darkMode={darkMode}
            onToggleSyntaxHints={() => setSyntaxHintsEnabled((v) => !v)}
            onToggleDarkMode={handleToggleDarkMode}
            onOpenGlossary={() => {
              setGlossaryInitialSyntax(null);
              setGlossaryOpen(true);
            }}
          />

          {/* Symmetrical 3-column desktop grid: Left TOC (200px) | Centered Reading Column (760px) | Right Context Rail (200px) */}
          <main className="mx-auto max-w-[1320px] px-4 pb-28 pt-10 sm:px-6 lg:px-10 lg:pt-16">
            <div className="xl:grid xl:grid-cols-[200px_minmax(0,760px)_200px] xl:justify-center xl:gap-10">
              {/* Left Sticky Table of Contents Rail — balances the page symmetrically */}
              <aside className="hidden xl:block">
                <div className="sticky top-24 pr-2">
                  <nav aria-label="Оглавление заметки">
                    <p className="font-mono text-[10px] uppercase tracking-[0.08em] text-[#2e7d5b] dark:text-[#4cb888]">
                      СОДЕРЖАНИЕ
                    </p>
                    <ul className="mt-3 space-y-1.5 text-[12px]">
                      {TOC_ITEMS.map((item) => {
                        const isActive = activeSectionId === item.id;
                        return (
                          <li key={item.href} className="relative pl-3">
                            {isActive && (
                              <motion.span
                                layoutId="toc-active-bar"
                                transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                                className="absolute left-0 top-1 bottom-1 w-[2px] rounded-full bg-[#2e7d5b] dark:bg-[#4cb888]"
                              />
                            )}
                            <a
                              href={item.href}
                              className={`block py-0.5 transition-colors ${
                                isActive
                                  ? 'font-medium text-[#111614] dark:text-[#ecece6]'
                                  : 'text-[#61655f] hover:text-[#111614] dark:text-[#8e938c] dark:hover:text-[#ecece6]'
                              }`}
                            >
                              {item.label}
                            </a>
                          </li>
                        );
                      })}
                    </ul>
                  </nav>
                </div>
              </aside>

              {/* Primary Dead-Center 760px Editorial Column */}
              <div className="mx-auto w-full min-w-0 max-w-[760px] xl:mx-0">
                {/* Hero Banner */}
                <motion.header
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                  className="mb-10"
                >
                  <div className="relative flex items-center font-mono text-[11px] uppercase tracking-[0.06em] text-[#61655f] dark:text-[#8e938c]">
                    <span
                      aria-hidden="true"
                      className="mr-3 inline-block h-3.5 w-[2px] rounded-full bg-[#2e7d5b] dark:bg-[#4cb888]"
                    />
                    <span>ПРАКТИЧЕСКОЕ РУКОВОДСТВО</span>
                    <span aria-hidden="true" className="mx-2 text-[#9fa39c] dark:text-white/30">
                      ·
                    </span>
                    <span>PYTHON · LOCALS · 2026</span>
                  </div>

                  <h1 className="mt-7 text-[50px] font-light leading-[0.95] tracking-[-0.03em] text-[#111614] sm:text-[70px] lg:text-[84px] dark:text-[#ecece6]">
                    Как <em className="font-light italic">создать</em>
                    <br />
                    <em className="font-light italic">ИИ-</em>агента
                  </h1>

                  <p className="mt-4 text-[21px] font-light italic leading-[1.2] tracking-[-0.02em] text-[#61655f] sm:text-[26px] lg:text-[30px] dark:text-[#8e938c]">
                    и подключить к нему облачные или локальные LLM
                  </p>
                </motion.header>

                {/* Provider Selector directly integrated near the top so every code snippet adapts live */}
                <ProviderSelector
                  selectedProvider={providerId}
                  selectedModel={selectedModel}
                  onSelectProvider={handleSelectProvider}
                  onSelectModel={setSelectedModel}
                />

                {/* Main Essay Body */}
                <article className="min-w-0">
                  <ArticleBody
                    providerId={providerId}
                    selectedModel={selectedModel}
                    bundle={bundle}
                    syntaxHintsEnabled={syntaxHintsEnabled}
                    activeFunctionId={activeFunctionId}
                    onSelectFunction={(fnId) => setActiveFunctionId(fnId)}
                    onOpenGlossaryWithSyntax={handleOpenGlossaryWithSyntax}
                  />
                </article>

                {/* Companion Interactive Sections & Focused Locals-to-Harness Integration */}
                <div className="mt-16 space-y-16">
                  <GoatProxySection
                    virtualKeys={virtualKeys}
                    goatProxyCode={bundle.goatProxyCode}
                    syntaxHintsEnabled={syntaxHintsEnabled}
                    activeFunctionId={activeFunctionId}
                    onAddKey={handleAddVirtualKey}
                    onRemoveKey={handleRemoveVirtualKey}
                    onUpdateLimit={handleUpdateVirtualKeyLimit}
                    onSelectFunction={(fnId) => setActiveFunctionId(fnId)}
                    onOpenGlossaryWithSyntax={handleOpenGlossaryWithSyntax}
                    onSwitchToProxyProvider={handleSwitchToProxyProvider}
                  />

                  <AgentLoopSimulator
                    providerId={providerId}
                    selectedModel={selectedModel}
                    onInspectFunction={(fnId) => setActiveFunctionId(fnId)}
                  />

                  <FullCodeBundle
                    providerId={providerId}
                    bundle={bundle}
                    syntaxHintsEnabled={syntaxHintsEnabled}
                    activeFunctionId={activeFunctionId}
                    onSelectFunction={(fnId) => setActiveFunctionId(fnId)}
                    onOpenGlossaryWithSyntax={handleOpenGlossaryWithSyntax}
                  />

                  <LocalsSection
                    isLocalsSelected={providerId === 'locals'}
                    onSelectLocalsProvider={handleSwitchToLocalsProvider}
                  />
                </div>
              </div>

              {/* Right Sticky Context & Quick-Tools Rail — mirrors the left TOC rail */}
              <aside className="hidden xl:block">
                <div className="sticky top-24 space-y-5 pl-2">
                  <div className="rounded-[7px] border border-[#e0e2dc] bg-[#fcfcf9]/90 p-3.5 dark:border-white/[0.09] dark:bg-[#171a19]/90">
                    <p className="font-mono text-[10px] uppercase tracking-[0.08em] text-[#2e7d5b] dark:text-[#4cb888]">
                      АКТИВНЫЙ ПРОВАЙДЕР
                    </p>
                    <p className="mt-1.5 text-[13px] font-medium text-[#111614] dark:text-[#ecece6]">
                      {PROVIDERS[providerId].shortName}
                    </p>
                    <p className="mt-0.5 truncate font-mono text-[11px] text-[#61655f] dark:text-[#8e938c]">
                      {selectedModel}
                    </p>
                    <a
                      href="#provider-setup"
                      className="amp-prose-link mt-2 inline-block text-[12px]"
                    >
                      Сменить ↑
                    </a>
                  </div>

                  {/* Quick interactive sidebar actions */}
                  <div className="space-y-2">
                    <p className="font-mono text-[10px] uppercase tracking-[0.08em] text-[#61655f] dark:text-[#8e938c]">
                      БЫСТРЫЙ ДОСТУП
                    </p>
                    <motion.button
                      type="button"
                      whileHover={{ x: 2 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        setGlossaryInitialSyntax(null);
                        setGlossaryOpen(true);
                      }}
                      className="flex w-full items-center gap-2 rounded-[6px] border border-[#2e7d5b]/35 bg-[#2e7d5b]/[0.07] px-2.5 py-2 text-left font-mono text-[11px] font-medium text-[#1c4a36] transition-colors hover:border-[#2e7d5b] hover:bg-[#2e7d5b]/14 dark:border-[#4cb888]/40 dark:bg-[#4cb888]/10 dark:text-[#a8e8ca]"
                    >
                      <BookOpen className="h-3.5 w-3.5 shrink-0 text-[#2e7d5b] dark:text-[#4cb888]" aria-hidden="true" />
                      <span>Словарь и квиз</span>
                    </motion.button>
                    <motion.a
                      href="#simulator"
                      whileHover={{ x: 2 }}
                      whileTap={{ scale: 0.98 }}
                      className="flex w-full items-center gap-2 rounded-[6px] border border-[#e0e2dc] bg-white/75 px-2.5 py-2 text-left font-mono text-[11px] text-[#3c403c] transition-colors hover:border-[#2e7d5b]/55 hover:text-[#111614] dark:border-white/10 dark:bg-white/[0.03] dark:text-[#b6bab3] dark:hover:border-[#4cb888]/55 dark:hover:text-[#ecece6]"
                    >
                      <Sparkles className="h-3.5 w-3.5 shrink-0 text-[#8a6d3b] dark:text-[#c7ab75]" aria-hidden="true" />
                      <span>Симулятор цикла</span>
                    </motion.a>
                    <motion.a
                      href="#locals"
                      whileHover={{ x: 2 }}
                      whileTap={{ scale: 0.98 }}
                      className="flex w-full items-center gap-2 rounded-[6px] border border-[#e0e2dc] bg-white/75 px-2.5 py-2 text-left font-mono text-[11px] text-[#3c403c] transition-colors hover:border-[#2e7d5b]/55 hover:text-[#111614] dark:border-white/10 dark:bg-white/[0.03] dark:text-[#b6bab3] dark:hover:border-[#4cb888]/55 dark:hover:text-[#ecece6]"
                    >
                      <Cpu className="h-3.5 w-3.5 shrink-0 text-[#2e7d5b] dark:text-[#4cb888]" aria-hidden="true" />
                      <span>Locals → Harness</span>
                    </motion.a>
                  </div>
                </div>
              </aside>
            </div>
          </main>

          {/* Multi-Column Architectural Footer */}
          <footer className="border-t border-[#e4e5df] bg-[#f7f7f3]/80 py-14 text-[13px] text-[#61655f] backdrop-blur-[2px] dark:border-white/[0.08] dark:bg-[#121413]/80 dark:text-[#8e938c]">
            <div className="mx-auto max-w-[1320px] px-4 sm:px-6 lg:px-10">
              <div className="grid grid-cols-1 gap-10 md:grid-cols-12">
                {/* Left brand block */}
                <div className="md:col-span-5 space-y-4">
                  <a
                    href="#top"
                    className="inline-flex items-center transition-opacity hover:opacity-75"
                  >
                    <HarnessLogo compact />
                  </a>
                  <p className="max-w-xs text-[12.5px] leading-relaxed text-[#61655f] dark:text-[#8e938c]">
                    Практическое руководство по сборке код-редактирующего ИИ-агента на понятном
                    Python с облачными провайдерами и локальным подключением Locals.
                  </p>
                </div>

                {/* Navigation columns */}
                <div className="md:col-span-2 space-y-2.5">
                  <h3 className="text-[12.5px] font-medium text-[#111614] dark:text-[#ecece6]">
                    Разделы
                  </h3>
                  <ul className="space-y-1.5 text-[12.5px]">
                    <li>
                      <a href="#pencils-out" className="hover:text-[#111614] dark:hover:text-[#ecece6]">
                        Скелет агента
                      </a>
                    </li>
                    <li>
                      <a href="#first-tool" className="hover:text-[#111614] dark:hover:text-[#ecece6]">
                        Первый инструмент
                      </a>
                    </li>
                    <li>
                      <a href="#read-file" className="hover:text-[#111614] dark:hover:text-[#ecece6]">
                        read_file
                      </a>
                    </li>
                    <li>
                      <a href="#edit-file" className="hover:text-[#111614] dark:hover:text-[#ecece6]">
                        edit_file
                      </a>
                    </li>
                  </ul>
                </div>

                <div className="md:col-span-3 space-y-2.5">
                  <h3 className="text-[12.5px] font-medium text-[#111614] dark:text-[#ecece6]">
                    Практика и Locals
                  </h3>
                  <ul className="space-y-1.5 text-[12.5px]">
                    <li>
                      <a href="#provider-setup" className="hover:text-[#111614] dark:hover:text-[#ecece6]">
                        Выбор провайдера
                      </a>
                    </li>
                    <li>
                      <a href="#goat-proxy" className="hover:text-[#111614] dark:hover:text-[#ecece6]">
                        Command Code GOAT и прокси
                      </a>
                    </li>
                    <li>
                      <a href="#simulator" className="hover:text-[#111614] dark:hover:text-[#ecece6]">
                        Симулятор цикла агента
                      </a>
                    </li>
                    <li>
                      <a href="#full-code" className="hover:text-[#111614] dark:hover:text-[#ecece6]">
                        Скачать файлы проекта
                      </a>
                    </li>
                    <li>
                      <a href="#locals" className="font-medium text-[#2e7d5b] hover:opacity-80 dark:text-[#4cb888]">
                        Locals → наш Harness
                      </a>
                    </li>
                  </ul>
                </div>

                <div className="md:col-span-2 space-y-2.5">
                  <h3 className="text-[12.5px] font-medium text-[#111614] dark:text-[#ecece6]">
                    Справочник
                  </h3>
                  <ul className="space-y-1.5 text-[12.5px]">
                    <li>
                      <button
                        type="button"
                        onClick={() => {
                          setGlossaryInitialSyntax(null);
                          setGlossaryOpen(true);
                        }}
                        className="hover:text-[#111614] dark:hover:text-[#ecece6]"
                      >
                        Словарь и квиз
                      </button>
                    </li>
                    <li>
                      <button
                        type="button"
                        onClick={() => setActiveFunctionId('run_agent')}
                        className="hover:text-[#111614] dark:hover:text-[#ecece6]"
                      >
                        Разбор run_agent()
                      </button>
                    </li>
                    <li>
                      <a href="#top" className="hover:text-[#111614] dark:hover:text-[#ecece6]">
                        Наверх ↑
                      </a>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </footer>
        </div>

        {/* Drawers */}
        <FunctionInspectorDrawer
          functionId={activeFunctionId}
          onClose={() => setActiveFunctionId(null)}
          onSelectFunction={(fnId) => setActiveFunctionId(fnId)}
        />

        <SyntaxGlossaryDrawer
          isOpen={glossaryOpen}
          initialSyntaxId={glossaryInitialSyntax}
          onClose={() => setGlossaryOpen(false)}
          onSelectFunction={(fnId) => setActiveFunctionId(fnId)}
        />
      </div>
    </MotionConfig>
  );
}
