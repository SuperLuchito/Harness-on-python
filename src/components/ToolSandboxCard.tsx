import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Play, Terminal } from 'lucide-react';

type ToolSandboxKind = 'read_file' | 'list_files' | 'edit_file';

interface ToolSandboxCardProps {
  kind: ToolSandboxKind;
  onInspectFunction: (fnId: string) => void;
}

const VIRTUAL_FILES: Record<string, string> = {
  'secret-file.txt': 'Что становится всё более влажным, пока кого-то сушит?',
  'agent.py': 'from provider import create_client, ask_model\n\n# Главный цикл агента\nwhile True:\n    user_text = get_user_message()\n    ...',
  'provider.py': 'MODEL_NAME = "deepseek/deepseek-v4.1-flash"\nBASE_URL = "https://api.commandcode.ai/provider/v1"',
  'missing.txt': '__ERROR__',
};

const EDIT_PRESETS = [
  {
    id: 'fix-greeting',
    label: 'Заменить приветствие',
    path: 'hello.py',
    original: 'def greet(name):\n    return f"Привт, {name}!"\n',
    oldStr: 'Привт',
    newStr: 'Привет',
  },
  {
    id: 'ambiguous',
    label: 'Неуникальный фрагмент (ошибка)',
    path: 'calc.py',
    original: 'x = 1\ny = x + 1\nz = x + 2\n',
    oldStr: 'x',
    newStr: 'count',
  },
  {
    id: 'create-new',
    label: 'Создать новый файл (old_str="")',
    path: 'notes.txt',
    original: '',
    oldStr: '',
    newStr: 'Список задач: подключить read_file, list_files и edit_file.',
  },
];

export function ToolSandboxCard({ kind, onInspectFunction }: ToolSandboxCardProps) {
  // read_file state
  const [selectedReadFile, setSelectedReadFile] = useState<string>('secret-file.txt');
  const [readRanCount, setReadRanCount] = useState<number>(1);

  // list_files state
  const [listTarget, setListTarget] = useState<'.' | 'utils'>('.');
  const [showIgnored, setShowIgnored] = useState<boolean>(false);

  // edit_file state
  const [presetId, setPresetId] = useState<string>(EDIT_PRESETS[0].id);
  const activePreset = EDIT_PRESETS.find((p) => p.id === presetId) ?? EDIT_PRESETS[0];
  const [oldStr, setOldStr] = useState<string>(activePreset.oldStr);
  const [newStr, setNewStr] = useState<string>(activePreset.newStr);
  const [editRunKey, setEditRunKey] = useState<number>(1);

  const handleSelectEditPreset = (id: string) => {
    const next = EDIT_PRESETS.find((p) => p.id === id) ?? EDIT_PRESETS[0];
    setPresetId(id);
    setOldStr(next.oldStr);
    setNewStr(next.newStr);
    setEditRunKey((k) => k + 1);
  };

  if (kind === 'read_file') {
    const rawContent = VIRTUAL_FILES[selectedReadFile];
    const isError = rawContent === '__ERROR__';
    return (
      <div className="my-6 rounded-[6px] border border-[#dcdcd4] bg-[#ffffff] p-4 shadow-[0_2px_10px_rgba(17,22,20,0.04)] dark:border-white/[0.11] dark:bg-[#161918]">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="inline-flex items-center gap-1.5 font-mono text-[10.5px] uppercase tracking-[0.06em] text-[#2e7d5b] dark:text-[#4cb888]">
            <Terminal className="h-3.5 w-3.5" aria-hidden="true" />
            <span>ПОПРОБУЙ ВЖИВУЮ · READ_FILE</span>
          </div>
          <button
            type="button"
            onClick={() => onInspectFunction('read_file')}
            className="font-mono text-[11px] text-[#61655f] underline decoration-[#2e7d5b]/55 underline-offset-2 hover:text-[#111614] dark:text-[#8e938c] dark:hover:text-[#ecece6]"
          >
            разобрать read_file()
          </button>
        </div>

        <p className="mt-1.5 text-[13px] text-[#4a4e49] dark:text-[#a8aca5]">
          Выбери файл, который модель передаст в аргументе <code className="amp-inline-code">path</code>, и посмотри, что вернёт Python:
        </p>

        <div className="mt-3 flex flex-wrap gap-1.5">
          {Object.keys(VIRTUAL_FILES).map((file) => {
            const active = file === selectedReadFile;
            return (
              <motion.button
                key={file}
                type="button"
                whileTap={{ scale: 0.96 }}
                onClick={() => {
                  setSelectedReadFile(file);
                  setReadRanCount((c) => c + 1);
                }}
                className={`rounded-[5px] border px-2.5 py-1 font-mono text-[11.5px] transition-colors ${
                  active
                    ? 'border-[#2e7d5b] bg-[#2e7d5b] text-white dark:border-[#4cb888] dark:bg-[#4cb888] dark:text-[#0f1714]'
                    : 'border-[#e0e2dc] bg-[#f7f7f3] text-[#2e322f] hover:border-[#2e7d5b]/50 dark:border-white/10 dark:bg-[#121413] dark:text-[#c7cac3] dark:hover:border-[#4cb888]/50'
                }`}
              >
                {file}
              </motion.button>
            );
          })}
        </div>

        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={`${selectedReadFile}-${readRanCount}`}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.18 }}
            className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-2"
          >
            <div className="rounded-[4px] border border-[#e4e5df] bg-[#f7f7f3] p-3 font-mono text-[11.5px] dark:border-white/[0.08] dark:bg-[#121413]">
              <div className="text-[10px] uppercase tracking-[0.05em] text-[#61655f] dark:text-[#8e938c]">
                ЗАПРОС МОДЕЛИ (TOOL_CALL)
              </div>
              <pre className="mt-1.5 whitespace-pre-wrap text-[#111614] dark:text-[#e8e8e2]">
                {`read_file({"path": "${selectedReadFile}"})`}
              </pre>
            </div>
            <div
              className={`rounded-[4px] border p-3 font-mono text-[11.5px] ${
                isError
                  ? 'border-[#f34f3f]/50 bg-[#f34f3f]/[0.06] dark:border-[#ff6b5b]/50 dark:bg-[#ff6b5b]/10'
                  : 'border-[#3d8b3d]/45 bg-[#3d8b3d]/[0.06] dark:border-[#6cc56c]/45 dark:bg-[#6cc56c]/10'
              }`}
            >
              <div className="text-[10px] uppercase tracking-[0.05em] text-[#61655f] dark:text-[#8e938c]">
                {isError ? 'ОТВЕТ PYTHON (ОШИБКА ПЕРЕХВАЧЕНА)' : 'ОТВЕТ PYTHON (TOOL RESULT)'}
              </div>
              <pre className="mt-1.5 whitespace-pre-wrap break-words text-[#111614] dark:text-[#e8e8e2]">
                {isError
                  ? `Ошибка: FileNotFoundError — файл "${selectedReadFile}" не найден. Агент не упал, а попробует другой путь!`
                  : rawContent}
              </pre>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    );
  }

  if (kind === 'list_files') {
    const visibleItems =
      listTarget === '.'
        ? ['agent.py', 'provider.py', 'secret-file.txt', 'utils/', 'utils/helpers.py']
        : ['utils/helpers.py', 'utils/prompts.txt'];
    const ignoredItems = ['.git/HEAD', 'venv/bin/python', '__pycache__/agent.cpython-312.pyc'];

    return (
      <div className="my-6 rounded-[6px] border border-[#dcdcd4] bg-[#ffffff] p-4 shadow-[0_2px_10px_rgba(17,22,20,0.04)] dark:border-white/[0.11] dark:bg-[#161918]">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="inline-flex items-center gap-1.5 font-mono text-[10.5px] uppercase tracking-[0.06em] text-[#2e7d5b] dark:text-[#4cb888]">
            <Terminal className="h-3.5 w-3.5" aria-hidden="true" />
            <span>ПОПРОБУЙ ВЖИВУЮ · LIST_FILES</span>
          </div>
          <button
            type="button"
            onClick={() => onInspectFunction('list_files')}
            className="font-mono text-[11px] text-[#61655f] underline decoration-[#2e7d5b]/55 underline-offset-2 hover:text-[#111614] dark:text-[#8e938c] dark:hover:text-[#ecece6]"
          >
            разобрать list_files()
          </button>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setListTarget('.')}
            className={`rounded-[5px] border px-2.5 py-1 font-mono text-[11.5px] transition-colors ${
              listTarget === '.'
                ? 'border-[#2e7d5b] bg-[#2e7d5b] text-white dark:border-[#4cb888] dark:bg-[#4cb888] dark:text-[#0f1714]'
                : 'border-[#e0e2dc] bg-[#f7f7f3] text-[#2e322f] hover:border-[#2e7d5b]/50 dark:border-white/10 dark:bg-[#121413] dark:text-[#c7cac3]'
            }`}
          >
            path: "." (корень)
          </button>
          <button
            type="button"
            onClick={() => setListTarget('utils')}
            className={`rounded-[5px] border px-2.5 py-1 font-mono text-[11.5px] transition-colors ${
              listTarget === 'utils'
                ? 'border-[#2e7d5b] bg-[#2e7d5b] text-white dark:border-[#4cb888] dark:bg-[#4cb888] dark:text-[#0f1714]'
                : 'border-[#e0e2dc] bg-[#f7f7f3] text-[#2e322f] hover:border-[#2e7d5b]/50 dark:border-white/10 dark:bg-[#121413] dark:text-[#c7cac3]'
            }`}
          >
            path: "utils"
          </button>
          <button
            type="button"
            onClick={() => setShowIgnored((v) => !v)}
            className="ml-auto font-mono text-[11px] text-[#8a6d3b] underline underline-offset-2 hover:opacity-75 dark:text-[#b89c66]"
          >
            {showIgnored ? 'Скрыть отфильтрованный шум' : 'Показать, что отбросил фильтр'}
          </button>
        </div>

        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={`${listTarget}-${showIgnored}`}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.18 }}
            className="mt-3 rounded-[4px] border border-[#e4e5df] bg-[#f7f7f3] p-3 font-mono text-[12px] dark:border-white/[0.08] dark:bg-[#121413]"
          >
            <div className="text-[10px] uppercase tracking-[0.05em] text-[#61655f] dark:text-[#8e938c]">
              JSON, КОТОРЫЙ ПОЛУЧИТ МОДЕЛЬ
            </div>
            <pre className="mt-1.5 overflow-x-auto text-[#3d8b3d] dark:text-[#6cc56c]">
              {JSON.stringify(visibleItems, null, 2)}
            </pre>
            {showIgnored && listTarget === '.' && (
              <div className="mt-2.5 border-t border-[#e4e5df] pt-2 text-[11px] text-[#8a6d3b] dark:border-white/10 dark:text-[#b89c66]">
                Отброшено ради экономии токенов: {ignoredItems.join(', ')} (и ещё ~4000 файлов в venv/)
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    );
  }

  // edit_file interactive preview
  let editResult: { ok: boolean; status: string; content: string };
  if (oldStr === '') {
    editResult = {
      ok: true,
      status: `Файл ${activePreset.path} создан/записан с нуля`,
      content: newStr || '(пустой файл)',
    };
  } else {
    const occurrences = activePreset.original.split(oldStr).length - 1;
    if (occurrences === 0) {
      editResult = {
        ok: false,
        status: 'ValueError: фрагмент old_str не найден в файле',
        content: activePreset.original,
      };
    } else if (occurrences > 1) {
      editResult = {
        ok: false,
        status: `ValueError: фрагмент "${oldStr}" встретился ${occurrences} раза — слишком неоднозначно!`,
        content: activePreset.original,
      };
    } else {
      editResult = {
        ok: true,
        status: 'Успешно заменено ровно 1 точное совпадение',
        content: activePreset.original.replace(oldStr, newStr),
      };
    }
  }

  return (
    <div className="my-6 rounded-[6px] border border-[#dcdcd4] bg-[#ffffff] p-4 shadow-[0_2px_10px_rgba(17,22,20,0.04)] dark:border-white/[0.11] dark:bg-[#161918]">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="inline-flex items-center gap-1.5 font-mono text-[10.5px] uppercase tracking-[0.06em] text-[#2e7d5b] dark:text-[#4cb888]">
          <Play className="h-3.5 w-3.5" aria-hidden="true" />
          <span>ПОПРОБУЙ ВЖИВУЮ · EDIT_FILE</span>
        </div>
        <button
          type="button"
          onClick={() => onInspectFunction('edit_file')}
          className="font-mono text-[11px] text-[#61655f] underline decoration-[#2e7d5b]/55 underline-offset-2 hover:text-[#111614] dark:text-[#8e938c] dark:hover:text-[#ecece6]"
        >
          разобрать edit_file()
        </button>
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {EDIT_PRESETS.map((p) => (
          <motion.button
            key={p.id}
            type="button"
            whileTap={{ scale: 0.96 }}
            onClick={() => handleSelectEditPreset(p.id)}
            className={`rounded-[5px] border px-2.5 py-1 font-mono text-[11px] transition-colors ${
              p.id === presetId
                ? 'border-[#2e7d5b] bg-[#2e7d5b] text-white dark:border-[#4cb888] dark:bg-[#4cb888] dark:text-[#0f1714]'
                : 'border-[#e0e2dc] bg-[#f7f7f3] text-[#2e322f] hover:border-[#2e7d5b]/50 dark:border-white/10 dark:bg-[#121413] dark:text-[#c7cac3]'
            }`}
          >
            {p.label}
          </motion.button>
        ))}
      </div>

      <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
        <label className="block">
          <span className="font-mono text-[10px] uppercase tracking-[0.05em] text-[#61655f] dark:text-[#8e938c]">
            old_str (что ищем)
          </span>
          <input
            type="text"
            value={oldStr}
            onChange={(e) => {
              setOldStr(e.target.value);
              setEditRunKey((k) => k + 1);
            }}
            placeholder='"" — создать файл'
            className="mt-1 w-full rounded-[4px] border border-[#dcdcd4] bg-[#f7f7f3] px-2.5 py-1.5 font-mono text-[12px] text-[#111614] focus:border-[#f34f3f] focus:outline-none dark:border-white/15 dark:bg-[#121413] dark:text-[#ecece6]"
          />
        </label>
        <label className="block">
          <span className="font-mono text-[10px] uppercase tracking-[0.05em] text-[#61655f] dark:text-[#8e938c]">
            new_str (на что меняем)
          </span>
          <input
            type="text"
            value={newStr}
            onChange={(e) => {
              setNewStr(e.target.value);
              setEditRunKey((k) => k + 1);
            }}
            className="mt-1 w-full rounded-[4px] border border-[#dcdcd4] bg-[#f7f7f3] px-2.5 py-1.5 font-mono text-[12px] text-[#111614] focus:border-[#f34f3f] focus:outline-none dark:border-white/15 dark:bg-[#121413] dark:text-[#ecece6]"
          />
        </label>
      </div>

      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={`${presetId}-${editRunKey}`}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.16 }}
          className={`mt-3 rounded-[4px] border p-3 font-mono text-[12px] ${
            editResult.ok
              ? 'border-[#3d8b3d]/50 bg-[#3d8b3d]/[0.06] dark:border-[#6cc56c]/45 dark:bg-[#6cc56c]/10'
              : 'border-[#f34f3f]/55 bg-[#f34f3f]/[0.06] dark:border-[#ff6b5b]/50 dark:bg-[#ff6b5b]/10'
          }`}
        >
          <div
            className={`text-[10.5px] font-medium ${
              editResult.ok
                ? 'text-[#2f6f2f] dark:text-[#6cc56c]'
                : 'text-[#d93829] dark:text-[#ff6b5b]'
            }`}
          >
            {editResult.status}
          </div>
          <pre className="mt-1.5 whitespace-pre-wrap text-[#111614] dark:text-[#e8e8e2]">
            {editResult.content}
          </pre>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
