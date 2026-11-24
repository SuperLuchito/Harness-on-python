import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  ArrowUpRight,
  Check,
  CheckCircle2,
  ChevronDown,
  Copy,
  HelpCircle,
  RotateCcw,
  Search,
  X,
  XCircle,
} from 'lucide-react';
import { FUNCTION_DOCS, SYNTAX_CATEGORY_LABELS, SYNTAX_DOCS } from '../data/pythonGlossary';
import { SyntaxCategory } from '../types/guide';

interface SyntaxGlossaryDrawerProps {
  isOpen: boolean;
  initialSyntaxId: string | null;
  onClose: () => void;
  onSelectFunction: (fnId: string) => void;
}

interface QuizQuestion {
  id: string;
  question: string;
  code: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  relatedSyntaxId?: string;
}

const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    id: 'q1',
    question: 'Зачем в коде агента нужен блок with open(path, "r") as f?',
    code: 'with open("secret-file.txt", "r", encoding="utf-8") as f:\n    text = f.read()',
    options: [
      'Он ускоряет чтение файла в 10 раз',
      'Автоматически закроет файл после выхода из блока, даже если случится ошибка',
      'Создаёт новый файл, если его не было',
    ],
    correctIndex: 1,
    explanation:
      'Контекстный менеджер with гарантирует, что Python аккуратно закроет файл сам — без утечек дескрипторов.',
    relatedSyntaxId: 'with_open',
  },
  {
    id: 'q2',
    question: 'Что вернёт os.environ.get("COMMAND_CODE_API_KEY"), если ключ не задан?',
    code: 'api_key = os.environ.get("COMMAND_CODE_API_KEY")',
    options: [
      'Программу сразу выкинет с ошибкой KeyError',
      'Пустой список []',
      'Специальное значение None, которое мы можем красиво проверить через if not api_key',
    ],
    correctIndex: 2,
    explanation:
      'Метод .get() безопасен: вместо падения он возвращает None, и мы можем показать новичку понятную подсказку.',
    relatedSyntaxId: 'os_environ',
  },
  {
    id: 'q3',
    question: 'Почему в главном цикле агента используется флаг read_user_input = False?',
    code: 'if reply["tool_calls"]:\n    # выполнили инструменты...\n    read_user_input = False',
    options: [
      'Чтобы сразу отправить результат инструмента обратно модели, не прерываясь на ввод человека',
      'Чтобы навсегда выключить клавиатуру',
      'Чтобы очистить историю conversation',
    ],
    correctIndex: 0,
    explanation:
      'Так агент может делать многошаговые цепочки (например, сначала list_files, потом read_file, потом edit_file) автономно.',
    relatedSyntaxId: 'while_true',
  },
  {
    id: 'q4',
    question: 'Зачем функция edit_file проверяет text.count(old_str) > 1?',
    code: 'if content.count(old_str) > 1:\n    raise ValueError("Фрагмент встречается несколько раз")',
    options: [
      'Чтобы запретить редактировать файлы длиннее 1 строки',
      'Чтобы модель не заменила не то место по ошибке, если фрагмент не уникален',
      'Потому что Python умеет делать replace только один раз',
    ],
    correctIndex: 1,
    explanation:
      'Если old_str встречается дважды, агент может сломать соседнюю функцию. Ошибка подсказывает модели передать больше контекста.',
    relatedSyntaxId: 'raise',
  },
  {
    id: 'q5',
    question: 'Что делает json.loads(call.function.arguments) в provider.py?',
    code: 'args = json.loads(call.function.arguments or "{}")',
    options: [
      'Сохраняет файл на диск в формате JSON',
      'Превращает JSON-строку от модели в обычный словарь Python (dict)',
      'Отправляет HTTP-запрос на сервер Command Code GOAT',
    ],
    correctIndex: 1,
    explanation:
      'API присылает аргументы инструмента как строку JSON, а json.loads() превращает её в удобный словарь вида {"path": "agent.py"}.',
    relatedSyntaxId: 'json_loads',
  },
];

const AGENT_CONTEXT_HINTS: Record<string, { file: string; fnId?: string; tip: string }> = {
  def: {
    file: 'agent.py / provider.py',
    fnId: 'run_agent',
    tip: 'Все 8 ключевых шагов агента (read_file, edit_file, ask_model, run_agent) оформлены простыми def-функциями без классов.',
  },
  while_true: {
    file: 'agent.py',
    fnId: 'run_agent',
    tip: 'Главное «сердце» агента — бесконечный цикл, который крутится, пока ты общаешься или пока модель вызывает инструменты.',
  },
  try_except: {
    file: 'agent.py',
    fnId: 'execute_tool',
    tip: 'Защищает агента от падений: если файла нет, ошибка превращается в текст для модели, и она сама исправляет путь.',
  },
  with_open: {
    file: 'agent.py',
    fnId: 'read_file',
    tip: 'Используется внутри read_file() и edit_file() для надёжного чтения и перезаписи файлов на диске.',
  },
  json_loads: {
    file: 'provider.py',
    fnId: 'ask_model',
    tip: 'Распаковывает JSON-аргументы, которые модель прислала в tool_call, в обычный Python-словарь.',
  },
  os_environ: {
    file: 'provider.py',
    fnId: 'create_client',
    tip: 'Берёт секретный ключ COMMAND_CODE_API_KEY из окружения, чтобы не хранить пароли прямо в исходнике.',
  },
  raise: {
    file: 'agent.py / provider.py',
    fnId: 'edit_file',
    tip: 'Явно останавливает выполнение, если не задан ключ или фрагмент в edit_file не найден.',
  },
};

export function SyntaxGlossaryDrawer({
  isOpen,
  initialSyntaxId,
  onClose,
  onSelectFunction,
}: SyntaxGlossaryDrawerProps) {
  const [tab, setTab] = useState<'syntax' | 'functions' | 'quiz'>('syntax');
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<SyntaxCategory | 'all'>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Interactive Quiz State
  const [quizIndex, setQuizIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [quizFinished, setQuizFinished] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    if (initialSyntaxId) {
      setTab('syntax');
      setCategory('all');
      const found = SYNTAX_DOCS[initialSyntaxId];
      if (found) {
        setQuery(found.token);
        setExpandedId(found.id);
      }
    } else {
      setQuery('');
    }
  }, [isOpen, initialSyntaxId]);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  const syntaxList = useMemo(() => {
    const q = query.trim().toLowerCase();
    return Object.values(SYNTAX_DOCS).filter((item) => {
      if (category !== 'all' && item.category !== category) return false;
      if (!q) return true;
      return (
        item.token.toLowerCase().includes(q) ||
        item.title.toLowerCase().includes(q) ||
        item.shortSummary.toLowerCase().includes(q)
      );
    });
  }, [query, category]);

  const functionList = useMemo(() => {
    const q = query.trim().toLowerCase();
    return Object.values(FUNCTION_DOCS).filter((fn) => {
      if (!q) return true;
      return (
        fn.name.toLowerCase().includes(q) ||
        fn.oneLiner.toLowerCase().includes(q) ||
        fn.file.toLowerCase().includes(q)
      );
    });
  }, [query]);

  const handleCopySnippet = async (id: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      window.setTimeout(() => setCopiedId((prev) => (prev === id ? null : prev)), 1500);
    } catch {
      setCopiedId(null);
    }
  };

  const currentQuestion = QUIZ_QUESTIONS[quizIndex];

  const handleChooseQuizOption = (idx: number) => {
    if (selectedOption !== null) return;
    setSelectedOption(idx);
    if (idx === currentQuestion.correctIndex) {
      setCorrectCount((c) => c + 1);
    }
  };

  const handleNextQuestion = () => {
    if (quizIndex + 1 >= QUIZ_QUESTIONS.length) {
      setQuizFinished(true);
    } else {
      setQuizIndex((i) => i + 1);
      setSelectedOption(null);
    }
  };

  const handleResetQuiz = () => {
    setQuizIndex(0);
    setSelectedOption(null);
    setCorrectCount(0);
    setQuizFinished(false);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="glossary-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-[2px]"
          role="dialog"
          aria-modal="true"
          aria-labelledby="glossary-title"
          onClick={onClose}
        >
          <motion.aside
            key="glossary-panel"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="flex h-full w-full max-w-xl flex-col border-l border-[#dcdcd4] bg-[#f7f7f3] shadow-2xl dark:border-white/10 dark:bg-[#121413]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top Header */}
            <div className="border-b border-[#e4e5df] px-6 py-5 dark:border-white/[0.08]">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="font-mono text-[11px] uppercase tracking-[0.06em] text-[#f34f3f] dark:text-[#ff6b5b]">
                    ИНТЕРАКТИВНЫЙ СПРАВОЧНИК · PYTHON
                  </div>
                  <h2
                    id="glossary-title"
                    className="mt-1.5 text-[20px] font-medium tracking-[-0.01em] text-[#111614] dark:text-[#ecece6]"
                  >
                    Словарь синтаксиса, функций и квиз
                  </h2>
                </div>
                <motion.button
                  type="button"
                  whileHover={{ rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  transition={{ duration: 0.18 }}
                  onClick={onClose}
                  aria-label="Закрыть словарь Python"
                  className="rounded-[5px] border border-transparent p-1.5 text-[#61655f] transition-colors hover:border-[#dcdcd4] hover:bg-black/5 hover:text-[#111614] dark:text-[#8e938c] dark:hover:border-white/15 dark:hover:bg-white/10 dark:hover:text-white"
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                </motion.button>
              </div>

              {/* Animated Segmented Tabs */}
              <div className="mt-4 flex flex-col gap-2.5">
                <div
                  role="tablist"
                  aria-label="Разделы словаря"
                  className="inline-flex w-full rounded-[5px] border border-[#dcdcd4] bg-white/60 p-1 dark:border-white/12 dark:bg-white/[0.03]"
                >
                  {(
                    [
                      { id: 'syntax', label: `Синтаксис (${Object.keys(SYNTAX_DOCS).length})` },
                      { id: 'functions', label: `Функции (${Object.keys(FUNCTION_DOCS).length})` },
                      { id: 'quiz', label: `Мини-квиз (${QUIZ_QUESTIONS.length})` },
                    ] as const
                  ).map((t) => {
                    const active = tab === t.id;
                    return (
                      <button
                        key={t.id}
                        type="button"
                        role="tab"
                        aria-selected={active}
                        onClick={() => setTab(t.id)}
                        className={`relative flex-1 rounded-[4px] px-2.5 py-1.5 font-mono text-[11px] uppercase tracking-[0.04em] transition-colors whitespace-nowrap ${
                          active
                            ? 'text-[#f7f7f3] dark:text-[#121413]'
                            : 'text-[#61655f] hover:text-[#111614] dark:text-[#8e938c] dark:hover:text-[#ecece6]'
                        }`}
                      >
                        {active && (
                          <motion.span
                            layoutId="glossary-tab-bg"
                            transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                            className="absolute inset-0 rounded-[4px] bg-[#111614] dark:bg-[#ecece6]"
                          />
                        )}
                        <span className="relative z-10">{t.label}</span>
                      </button>
                    );
                  })}
                </div>

                {tab !== 'quiz' && (
                  <div className="relative">
                    <Search
                      className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#61655f]"
                      aria-hidden="true"
                    />
                    <input
                      type="search"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Поиск: while True, json, read_file, try..."
                      aria-label="Поиск по словарю Python"
                      className="w-full rounded-[5px] border border-[#dcdcd4] bg-white/75 py-1.5 pl-8 pr-3 text-[13px] text-[#111614] placeholder:text-[#8c9088] transition-colors focus:border-[#f34f3f] focus:outline-none dark:border-white/15 dark:bg-white/[0.04] dark:text-[#ecece6] dark:focus:border-[#ff6b5b]"
                    />
                  </div>
                )}
              </div>

              {tab === 'syntax' && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => setCategory('all')}
                    className={`rounded-[4px] border px-2 py-0.5 font-mono text-[10.5px] transition-all ${
                      category === 'all'
                        ? 'border-[#f34f3f] bg-[#f34f3f] text-white dark:border-[#ff6b5b] dark:bg-[#ff6b5b] dark:text-[#121413]'
                        : 'border-[#e4e5df] bg-white/50 text-[#61655f] hover:border-[#b5b8b0] hover:text-[#111614] dark:border-white/10 dark:bg-white/[0.02] dark:text-[#8e938c]'
                    }`}
                  >
                    Все темы
                  </button>
                  {(Object.keys(SYNTAX_CATEGORY_LABELS) as SyntaxCategory[]).map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setCategory(cat)}
                      className={`rounded-[4px] border px-2 py-0.5 font-mono text-[10.5px] transition-all ${
                        category === cat
                          ? 'border-[#f34f3f] bg-[#f34f3f] text-white dark:border-[#ff6b5b] dark:bg-[#ff6b5b] dark:text-[#121413]'
                          : 'border-[#e4e5df] bg-white/50 text-[#61655f] hover:border-[#b5b8b0] hover:text-[#111614] dark:border-white/10 dark:bg-white/[0.02] dark:text-[#8e938c]'
                      }`}
                    >
                      {SYNTAX_CATEGORY_LABELS[cat]}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Interactive Animated Content Area */}
            <div className="code-scroll flex-1 overflow-y-auto px-6 py-5">
              <AnimatePresence mode="wait" initial={false}>
                {tab === 'syntax' && (
                  <motion.div
                    key={`syntax-list-${category}-${query}`}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.18 }}
                    className="space-y-3"
                  >
                    {syntaxList.length === 0 ? (
                      <p className="py-10 text-center text-[13.5px] text-[#61655f] dark:text-[#8e938c]">
                        По запросу «{query}» ничего не найдено.
                      </p>
                    ) : (
                      syntaxList.map((item) => {
                        const isExpanded = expandedId === item.id;
                        const ctxHint = AGENT_CONTEXT_HINTS[item.id];
                        const isCopied = copiedId === item.id;

                        return (
                          <motion.article
                            key={item.id}
                            layout
                            className={`overflow-hidden rounded-[5px] border transition-colors ${
                              isExpanded
                                ? 'border-[#f34f3f]/65 bg-white/85 shadow-sm dark:border-[#ff6b5b]/60 dark:bg-white/[0.05]'
                                : 'border-[#e4e5df] bg-white/55 hover:border-[#c2c5bd] dark:border-white/[0.08] dark:bg-white/[0.03] dark:hover:border-white/20'
                            }`}
                          >
                            <button
                              type="button"
                              onClick={() => setExpandedId(isExpanded ? null : item.id)}
                              aria-expanded={isExpanded}
                              className="flex w-full items-start justify-between gap-3 p-4 text-left"
                            >
                              <div className="min-w-0">
                                <div className="flex flex-wrap items-baseline gap-2">
                                  <h3 className="font-mono text-[13.5px] font-medium text-[#f34f3f] dark:text-[#ff6b5b]">
                                    {item.title}
                                  </h3>
                                  <span className="font-mono text-[10.5px] text-[#61655f] dark:text-[#8e938c]">
                                    · {SYNTAX_CATEGORY_LABELS[item.category]}
                                  </span>
                                </div>
                                <p className="mt-1.5 text-[13px] leading-relaxed text-[#2e322f] dark:text-[#cfd2cc]">
                                  {item.shortSummary}
                                </p>
                              </div>
                              <motion.span
                                animate={{ rotate: isExpanded ? 180 : 0 }}
                                transition={{ duration: 0.2 }}
                                className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-[4px] text-[#61655f] dark:text-[#8e938c]"
                                aria-hidden="true"
                              >
                                <ChevronDown className="h-3.5 w-3.5" />
                              </motion.span>
                            </button>

                            <AnimatePresence initial={false}>
                              {isExpanded && (
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: 'auto', opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                                  className="overflow-hidden"
                                >
                                  <div className="border-t border-[#ecece6] px-4 pb-4 pt-3 dark:border-white/[0.07]">
                                    <p className="text-[12.5px] italic text-[#5c605a] dark:text-[#989d95]">
                                      Аналогия: {item.analogy}
                                    </p>

                                    <div className="relative mt-2.5">
                                      <pre className="overflow-x-auto rounded-[4px] border border-[#e6e7e1] bg-[#f7f7f3] px-3 py-2.5 pr-16 font-mono text-[12px] leading-relaxed text-[#111614] dark:border-white/[0.08] dark:bg-[#121413] dark:text-[#e8e8e2]">
                                        {item.miniExample}
                                      </pre>
                                      <button
                                        type="button"
                                        onClick={() => handleCopySnippet(item.id, item.miniExample)}
                                        className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-[3px] border border-[#dcdcd4] bg-white/85 px-1.5 py-0.5 font-mono text-[10px] text-[#3c403c] transition-colors hover:border-[#111614] dark:border-white/15 dark:bg-[#1a1d1b] dark:text-[#cfd2cc]"
                                      >
                                        {isCopied ? (
                                          <>
                                            <Check className="h-2.5 w-2.5 text-[#3d8b3d]" aria-hidden="true" />
                                            <span>Ок</span>
                                          </>
                                        ) : (
                                          <>
                                            <Copy className="h-2.5 w-2.5" aria-hidden="true" />
                                            <span>Код</span>
                                          </>
                                        )}
                                      </button>
                                    </div>

                                    {ctxHint && (
                                      <div className="mt-3 rounded-[4px] border border-[#e4e5df] bg-[#f7f7f3]/90 p-2.5 text-[12px] text-[#3a3e3b] dark:border-white/[0.08] dark:bg-[#161917] dark:text-[#b9bdb6]">
                                        <div className="font-mono text-[10px] uppercase tracking-[0.05em] text-[#8a6d3b] dark:text-[#b89c66]">
                                          ГДЕ В НАШЕМ АГЕНТЕ · {ctxHint.file}
                                        </div>
                                        <p className="mt-1 leading-relaxed">{ctxHint.tip}</p>
                                        {ctxHint.fnId && (
                                          <button
                                            type="button"
                                            onClick={() => {
                                              onClose();
                                              onSelectFunction(ctxHint.fnId!);
                                            }}
                                            className="mt-1.5 inline-flex items-center gap-1 font-mono text-[11px] font-medium text-[#f34f3f] underline underline-offset-2 hover:opacity-80 dark:text-[#ff6b5b]"
                                          >
                                            <span>Открыть разбор {ctxHint.fnId}()</span>
                                            <ArrowUpRight className="h-3 w-3" aria-hidden="true" />
                                          </button>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </motion.article>
                        );
                      })
                    )}
                  </motion.div>
                )}

                {tab === 'functions' && (
                  <motion.div
                    key={`fn-list-${query}`}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.18 }}
                    className="space-y-3"
                  >
                    {functionList.length === 0 ? (
                      <p className="py-10 text-center text-[13.5px] text-[#61655f] dark:text-[#8e938c]">
                        Функций по запросу «{query}» не найдено.
                      </p>
                    ) : (
                      functionList.map((fn) => (
                        <motion.button
                          key={fn.id}
                          type="button"
                          whileHover={{ x: 3 }}
                          whileTap={{ scale: 0.99 }}
                          transition={{ duration: 0.14 }}
                          onClick={() => {
                            onClose();
                            onSelectFunction(fn.id);
                          }}
                          className="group w-full rounded-[5px] border border-[#e4e5df] bg-white/60 p-4 text-left transition-colors hover:border-[#f34f3f]/70 hover:bg-white/90 dark:border-white/[0.08] dark:bg-white/[0.03] dark:hover:border-[#ff6b5b]/60 dark:hover:bg-white/[0.06]"
                        >
                          <div className="flex items-baseline justify-between gap-2">
                            <span className="inline-flex items-center gap-1.5 font-mono text-[13.5px] font-medium text-[#f34f3f] dark:text-[#ff6b5b]">
                              <span>{fn.name}()</span>
                              <ArrowUpRight
                                className="h-3.5 w-3.5 opacity-0 transition-opacity group-hover:opacity-100"
                                aria-hidden="true"
                              />
                            </span>
                            <span className="font-mono text-[11px] text-[#61655f] dark:text-[#8e938c]">
                              {fn.file}
                            </span>
                          </div>
                          <p className="mt-1 text-[13px] leading-relaxed text-[#3a3e3b] dark:text-[#b9bdb6]">
                            {fn.oneLiner}
                          </p>
                        </motion.button>
                      ))
                    )}
                  </motion.div>
                )}

                {tab === 'quiz' && (
                  <motion.div
                    key="quiz-view"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.2 }}
                  >
                    {quizFinished ? (
                      <div className="rounded-[5px] border border-[#e4e5df] bg-white/75 p-6 text-center dark:border-white/10 dark:bg-white/[0.04]">
                        <div className="font-mono text-[11px] uppercase tracking-[0.06em] text-[#f34f3f] dark:text-[#ff6b5b]">
                          РЕЗУЛЬТАТ ПРОВЕРКИ
                        </div>
                        <div className="mt-3 font-mono text-[38px] font-medium tabular-nums text-[#111614] dark:text-[#ecece6]">
                          {correctCount} / {QUIZ_QUESTIONS.length}
                        </div>
                        <p className="mt-2 text-[14px] leading-relaxed text-[#3a3e3b] dark:text-[#b9bdb6]">
                          {correctCount === QUIZ_QUESTIONS.length
                            ? 'Отлично! Ты свободно ориентируешься в механике Python-агента и готов собирать свои инструменты.'
                            : correctCount >= 3
                              ? 'Хороший результат! Пара деталей ещё уляжется, когда запустишь код у себя в терминале.'
                              : 'Не переживай — загляни в раздел «Синтаксис» и попробуй ещё раз, это лучший способ запомнить.'}
                        </p>
                        <motion.button
                          type="button"
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.97 }}
                          onClick={handleResetQuiz}
                          className="mt-5 inline-flex items-center gap-1.5 rounded-[5px] bg-[#111614] px-4 py-2 font-mono text-[11.5px] uppercase tracking-[0.05em] text-[#f7f7f3] dark:bg-[#ecece6] dark:text-[#121413]"
                        >
                          <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                          <span>Пройти заново</span>
                        </motion.button>
                      </div>
                    ) : (
                      <AnimatePresence mode="wait" initial={false}>
                        <motion.div
                          key={currentQuestion.id}
                          initial={{ opacity: 0, x: 12 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -12 }}
                          transition={{ duration: 0.2 }}
                          className="space-y-4"
                        >
                          <div className="flex items-center justify-between font-mono text-[11px] uppercase tracking-[0.05em] text-[#61655f] dark:text-[#8e938c]">
                            <span className="inline-flex items-center gap-1.5">
                              <HelpCircle className="h-3.5 w-3.5 text-[#f34f3f]" aria-hidden="true" />
                              ВОПРОС {quizIndex + 1} ИЗ {QUIZ_QUESTIONS.length}
                            </span>
                            <span className="tabular-nums">ВЕРНО: {correctCount}</span>
                          </div>

                          {/* Progress bars */}
                          <div className="grid grid-cols-5 gap-1.5">
                            {QUIZ_QUESTIONS.map((q, idx) => (
                              <div
                                key={q.id}
                                className={`h-1 rounded-full transition-colors ${
                                  idx < quizIndex
                                    ? 'bg-[#3d8b3d] dark:bg-[#6cc56c]'
                                    : idx === quizIndex
                                      ? 'bg-[#f34f3f] dark:bg-[#ff6b5b]'
                                      : 'bg-[#e2e3dd] dark:bg-white/10'
                                }`}
                              />
                            ))}
                          </div>

                          <h3 className="text-[16px] font-medium leading-snug text-[#111614] dark:text-[#ecece6]">
                            {currentQuestion.question}
                          </h3>

                          <pre className="overflow-x-auto rounded-[5px] border border-[#e4e5df] bg-white/75 px-3.5 py-3 font-mono text-[12px] leading-relaxed text-[#111614] dark:border-white/10 dark:bg-[#191c1a] dark:text-[#e8e8e2]">
                            {currentQuestion.code}
                          </pre>

                          <div className="space-y-2">
                            {currentQuestion.options.map((opt, idx) => {
                              const answered = selectedOption !== null;
                              const isChosen = selectedOption === idx;
                              const isRight = idx === currentQuestion.correctIndex;

                              let stateClass =
                                'border-[#e4e5df] bg-white/60 text-[#111614] hover:border-[#111614] dark:border-white/10 dark:bg-white/[0.03] dark:text-[#ecece6] dark:hover:border-white/35';

                              if (answered && isRight) {
                                stateClass =
                                  'border-[#3d8b3d] bg-[#3d8b3d]/10 text-[#111614] dark:border-[#6cc56c] dark:bg-[#6cc56c]/15 dark:text-[#ecece6]';
                              } else if (answered && isChosen && !isRight) {
                                stateClass =
                                  'border-[#f34f3f] bg-[#f34f3f]/10 text-[#111614] dark:border-[#ff6b5b] dark:bg-[#ff6b5b]/15 dark:text-[#ecece6]';
                              }

                              return (
                                <motion.button
                                  key={idx}
                                  type="button"
                                  whileTap={answered ? undefined : { scale: 0.99 }}
                                  disabled={answered}
                                  onClick={() => handleChooseQuizOption(idx)}
                                  className={`flex w-full items-start gap-2.5 rounded-[5px] border px-3.5 py-3 text-left text-[13.5px] leading-snug transition-colors ${stateClass}`}
                                >
                                  <span className="mt-0.5 shrink-0 font-mono text-[11px] opacity-60">
                                    {String.fromCharCode(65 + idx)}.
                                  </span>
                                  <span className="flex-1">{opt}</span>
                                  {answered && isRight && (
                                    <CheckCircle2
                                      className="h-4 w-4 shrink-0 text-[#3d8b3d] dark:text-[#6cc56c]"
                                      aria-hidden="true"
                                    />
                                  )}
                                  {answered && isChosen && !isRight && (
                                    <XCircle
                                      className="h-4 w-4 shrink-0 text-[#f34f3f] dark:text-[#ff6b5b]"
                                      aria-hidden="true"
                                    />
                                  )}
                                </motion.button>
                              );
                            })}
                          </div>

                          <AnimatePresence>
                            {selectedOption !== null && (
                              <motion.div
                                initial={{ opacity: 0, y: 6 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0 }}
                                className="rounded-[5px] border border-[#e4e5df] bg-white/75 p-4 dark:border-white/10 dark:bg-white/[0.04]"
                              >
                                <p className="text-[13px] leading-relaxed text-[#2e322f] dark:text-[#cfd2cc]">
                                  {currentQuestion.explanation}
                                </p>
                                <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                                  {currentQuestion.relatedSyntaxId && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const doc = SYNTAX_DOCS[currentQuestion.relatedSyntaxId!];
                                        if (doc) {
                                          setTab('syntax');
                                          setCategory('all');
                                          setQuery(doc.token);
                                          setExpandedId(doc.id);
                                        }
                                      }}
                                      className="font-mono text-[11px] text-[#f34f3f] underline underline-offset-2 dark:text-[#ff6b5b]"
                                    >
                                      Открыть в словаре →
                                    </button>
                                  )}
                                  <motion.button
                                    type="button"
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.97 }}
                                    onClick={handleNextQuestion}
                                    className="ml-auto rounded-[4px] bg-[#111614] px-3.5 py-1.5 font-mono text-[11px] uppercase tracking-[0.04em] text-[#f7f7f3] dark:bg-[#ecece6] dark:text-[#121413]"
                                  >
                                    {quizIndex + 1 >= QUIZ_QUESTIONS.length
                                      ? 'Показать итог'
                                      : 'Следующий вопрос →'}
                                  </motion.button>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </motion.div>
                      </AnimatePresence>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.aside>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
