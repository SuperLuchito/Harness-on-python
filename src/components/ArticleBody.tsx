import { ReactNode, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ChevronDown } from 'lucide-react';
import { PROVIDERS } from '../data/providers';
import { ProviderId } from '../types/guide';
import { ProviderCodeBundle } from '../utils/providerCodegen';
import { InteractiveCodeBlock } from './InteractiveCodeBlock';
import { TerminalTranscript } from './TerminalTranscript';
import { ToolSandboxCard } from './ToolSandboxCard';

interface ArticleBodyProps {
  providerId: ProviderId;
  selectedModel: string;
  bundle: ProviderCodeBundle;
  syntaxHintsEnabled: boolean;
  activeFunctionId: string | null;
  onSelectFunction: (fnId: string) => void;
  onOpenGlossaryWithSyntax: (syntaxId: string) => void;
}

function NoteBox({ label, title, children }: { label: string; title: string; children: ReactNode }) {
  const [expanded, setExpanded] = useState(true);

  return (
    <motion.aside
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.36, ease: [0.22, 1, 0.36, 1] }}
      className="group my-6 overflow-hidden rounded-[6px] border border-[#e2e3dd] bg-[#fcfcf9] transition-colors duration-200 hover:border-[#cfd1c9] dark:border-white/[0.1] dark:bg-[#171a19] dark:hover:border-white/20"
    >
      <button
        type="button"
        onClick={() => setExpanded((prev) => !prev)}
        aria-expanded={expanded}
        className="flex w-full items-start justify-between gap-4 px-4 py-3.5 text-left transition-colors hover:bg-black/[0.015] dark:hover:bg-white/[0.02]"
      >
        <div className="min-w-0">
          <div className="font-mono text-[10.5px] uppercase tracking-[0.06em] text-[#8a6d3b] dark:text-[#b89c66]">
            {label}
          </div>
          <p className="mt-1 text-[14.5px] font-medium text-[#111614] dark:text-[#ecece6]">
            {title}
          </p>
        </div>
        <motion.span
          animate={{ rotate: expanded ? 180 : 0 }}
          transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
          className="mt-1 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-[4px] text-[#61655f] transition-colors group-hover:text-[#111614] dark:text-[#8e938c] dark:group-hover:text-[#ecece6]"
          aria-hidden="true"
        >
          <ChevronDown className="h-3.5 w-3.5" />
        </motion.span>
      </button>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            key="note-content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="border-t border-[#ecece6] px-4 py-3.5 space-y-2 text-[14px] leading-[1.6] text-[#3a3e3b] dark:border-white/[0.06] dark:text-[#b9bdb6]">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.aside>
  );
}

function TermTip({ term, explanation }: { term: string; explanation: string }) {
  const [open, setOpen] = useState(false);

  return (
    <span className="relative inline">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        title="Нажмите, чтобы прочитать короткое объяснение термина"
        className="amp-inline-code cursor-pointer border-b border-dotted border-[#f34f3f]/70 transition-colors hover:bg-[#f34f3f]/12 dark:border-[#ff6b5b]/70 dark:hover:bg-[#ff6b5b]/16"
      >
        {term}
      </button>
      <AnimatePresence>
        {open && (
          <motion.span
            initial={{ opacity: 0, y: 4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 2, scale: 0.98 }}
            transition={{ duration: 0.16 }}
            role="note"
            className="mt-2 mb-1 block rounded-[5px] border border-[#dcdcd4] bg-[#f7f7f3] px-3 py-2 font-sans text-[13px] not-italic leading-relaxed text-[#2e322f] shadow-sm dark:border-white/15 dark:bg-[#191c1a] dark:text-[#cfd2cc]"
          >
            <span className="font-mono text-[11px] font-medium text-[#f34f3f] dark:text-[#ff6b5b]">
              {term}
            </span>
            <span className="mx-1.5 opacity-50">—</span>
            <span>{explanation}</span>
          </motion.span>
        )}
      </AnimatePresence>
    </span>
  );
}

export function ArticleBody({
  providerId,
  selectedModel,
  bundle,
  syntaxHintsEnabled,
  activeFunctionId,
  onSelectFunction,
  onOpenGlossaryWithSyntax,
}: ArticleBodyProps) {
  const cfg = PROVIDERS[providerId];
  const assistant = cfg.assistantDisplayName;

  return (
    <div className="space-y-12 text-[16px] leading-[1.65] text-[#111614]/84 dark:text-[#ecece6]/84">
      {/* Intro */}
      <section id="intro" className="scroll-mt-24 space-y-5">
        <p>
          Собрать с нуля рабочего ИИ-агента, который сам ориентируется в папке проекта, читает файлы
          и вносит точечные правки в код, можно за один вечер — и без тяжёлых фреймворков.
        </p>

        <p>
          Когда смотришь со стороны, как CLI-агент находит нужный модуль, ловит traceback, читает
          соседний файл и переписывает функцию, легко решить, что внутри скрыта проприетарная
          архитектура на десятки тысяч строк.
        </p>

        <p>
          На деле базовый механизм устроен куда конкретнее и держится на трёх вещах: языковая модель
          (
          <TermTip
            term="LLM"
            explanation="Large Language Model — большая языковая модель. Она принимает массив сообщений (историю диалога и описания инструментов) и возвращает текст или структурированный вызов функции."
          />
          ), управляющий цикл с историей сообщений и достаточный лимит контекста. Всё, что отличает
          промышленные CLI-агенты и плагины для IDE, — это инженерная обвязка вокруг этого же цикла:
          сжатие контекста, песочница для команд, ретраи, удобный дифф и параллельные подзадачи.
        </p>

        <p>
          Для нашего рабочего прототипа хватит около 200 строк понятного Python без сторонних
          агентских библиотек, метаклассов и сложной иерархии классов. Причём заметную часть объёма
          составят не алгоритмы, а JSON-схемы и текстовые описания трёх файловых инструментов.
        </p>

        <p>
          Разберём всю сборку по шагам: от создания виртуального окружения до первого запуска, когда
          скрипт сам прочитает файл на диске и внесёт нужную правку.
        </p>

        <p>
          Лучше не ограничиваться чтением, а переписать код руками в локальной папке. Когда сам
          видишь в терминале каждый запрос модели и каждый ответ инструмента, архитектура любого
          агентского харнесса сразу становится прозрачной.
        </p>

        <p>Что пригодится для старта:</p>

        <ul className="list-disc space-y-2 pl-5">
          <li>
            <a
              href="https://www.python.org/downloads/"
              target="_blank"
              rel="noreferrer"
              className="amp-prose-link"
            >
              Python 3.10 или новее
            </a>{' '}
            — проверить версию можно командой{' '}
            <code className="amp-inline-code">python3 --version</code>.
          </li>
          <li>
            Библиотека <code className="amp-inline-code">{cfg.pipPackage}</code> — официальный
            клиент (<code className="amp-inline-code">SDK</code>), который возьмёт на себя все
            сетевые HTTP-запросы к провайдеру ({cfg.shortName}).
          </li>
          <li>
            <a href="#provider-setup" className="amp-prose-link">
              Ключ доступа {cfg.shortName}
            </a>{' '}
            в переменной окружения <code className="amp-inline-code">{cfg.envVar}</code> для модели{' '}
            <code className="amp-inline-code">{selectedModel}</code>.
          </li>
        </ul>

        <NoteBox label="КАК ЧИТАТЬ КОД В ЭТОЙ СТАТЬЕ" title="Любая функция и конструкция кликабельны">
          <p>
            Если в Python ты ещё не чувствуешь себя как рыба в воде — не переживай. Нажми на любую
            подчёркнутую{' '}
            <span className="border-b border-[#f34f3f]/65 font-mono text-[13px] text-[#111614] dark:text-[#ecece6]">
              функцию
            </span>{' '}
            в коде, и справа откроется её подробный разбор: что она принимает, что возвращает и
            зачем нужна агенту. А клик по слову с{' '}
            <span className="border-b border-dotted border-[#f34f3f]/65 font-mono text-[13px] text-[#f34f3f] dark:text-[#ff6b5b]">
              пунктирной линией
            </span>{' '}
            прямо на месте объяснит синтаксис Python простыми словами.
          </p>
        </NoteBox>
      </section>

      {/* Section 1 */}
      <section id="pencils-out" className="scroll-mt-24 space-y-5 pt-2">
        <h2 className="text-[24px] font-medium leading-[32px] tracking-[-0.01em] text-[#111614] dark:text-[#ecece6]">
          К делу: собираем скелет
        </h2>

        <p>
          Хватит теории — сразу к терминалу. Создадим папку для проекта, изолированное окружение и
          пару пустых файлов. Выполни эти команды по очереди:
        </p>

        <InteractiveCodeBlock
          filename="терминал — готовим рабочую папку"
          language="bash"
          code={bundle.setupCommands}
          syntaxHintsEnabled={syntaxHintsEnabled}
          activeFunctionId={activeFunctionId}
          onSelectFunction={onSelectFunction}
          onOpenGlossaryWithSyntax={onOpenGlossaryWithSyntax}
        />

        <NoteBox
          label="ПОЯСНЕНИЕ // ЗАЧЕМ VENV И ДВА ФАЙЛА"
          title="Изолируем зависимости и отделяем API от логики"
        >
          <p>
            Команда <code className="amp-inline-code">python3 -m venv venv</code> создаёт для
            проекта личную «песочницу» — виртуальное окружение. Всё, что мы поставим через{' '}
            <code className="amp-inline-code">pip install</code>, останется внутри этой папки и не
            сломает другие программы на твоём компьютере.
          </p>
          <p>
            А на два файла я делю проект не просто так: <code className="amp-inline-code">provider.py</code>{' '}
            знает только о том, как постучаться к API, а <code className="amp-inline-code">agent.py</code>{' '}
            — только о логике самого агента. Сегодня я гоняю всё через подписку{' '}
            <a href="#provider-setup" className="amp-prose-link">
              Command Code GOAT
            </a>
            , завтра раздаю лимиты знакомым через прокси, а через неделю решаю потестировать другую
            модель — и мне нужно поменять лишь <code className="amp-inline-code">provider.py</code>,
            не трогая сам агент.
          </p>
        </NoteBox>

        <p>
          Открываем <code className="amp-inline-code">provider.py</code> и пишем наш первый крошечный
          адаптер. Здесь ровно две функции:{' '}
          <button
            type="button"
            onClick={() => onSelectFunction('create_client')}
            className="amp-inline-code cursor-pointer underline decoration-[#f34f3f]/60 underline-offset-2 hover:bg-[#f34f3f]/10"
          >
            create_client()
          </button>{' '}
          берёт ключ и настраивает подключение, а{' '}
          <button
            type="button"
            onClick={() => onSelectFunction('ask_model')}
            className="amp-inline-code cursor-pointer underline decoration-[#f34f3f]/60 underline-offset-2 hover:bg-[#f34f3f]/10"
          >
            ask_model()
          </button>{' '}
          отправляет историю переписки модели и возвращает её ответ в простом словаре:
        </p>

        <InteractiveCodeBlock
          filename={`provider.py (${cfg.shortName})`}
          code={bundle.providerSimpleCode}
          syntaxHintsEnabled={syntaxHintsEnabled}
          activeFunctionId={activeFunctionId}
          onSelectFunction={onSelectFunction}
          onOpenGlossaryWithSyntax={onOpenGlossaryWithSyntax}
        />

        <p>
          Теперь переходим в <code className="amp-inline-code">agent.py</code>. Пока без всяких
          инструментов — просто соберём минимальный консольный чат, чтобы проверить, что модель нас
          слышит и отвечает:
        </p>

        <InteractiveCodeBlock
          filename="agent.py (версия 1 — базовый чат)"
          code={bundle.agentSimpleCode}
          syntaxHintsEnabled={syntaxHintsEnabled}
          activeFunctionId={activeFunctionId}
          onSelectFunction={onSelectFunction}
          onOpenGlossaryWithSyntax={onOpenGlossaryWithSyntax}
        />

        <p>
          Посмотри, как тут мало кода: меньше тридцати строк, а главное «сердце» всей программы —
          обычный бесконечный цикл <code className="amp-inline-code">while True</code> внутри{' '}
          <button
            type="button"
            onClick={() => onSelectFunction('run_agent')}
            className="amp-inline-code cursor-pointer underline decoration-[#f34f3f]/60 underline-offset-2 hover:bg-[#f34f3f]/10"
          >
            run_agent()
          </button>
          .
        </p>

        <p>
          Логика итерации полностью прозрачна: читаем твою строку через{' '}
          <code className="amp-inline-code">input()</code>, добавляем словарь{' '}
          <code className="amp-inline-code">{`{"role": "user", ...}`}</code> в список{' '}
          <code className="amp-inline-code">conversation</code>, отправляем весь накопленный массив
          сообщений в API, сохраняем ответ модели с ролью{' '}
          <code className="amp-inline-code">assistant</code> и печатаем его в консоль. На этом этапе
          у нас готов базовый консольный клиент, поверх которого уже можно навешивать инструменты.
        </p>

        <p>Прокинем ключ доступа в переменную окружения и запустим скрипт:</p>

        <InteractiveCodeBlock
          filename="терминал — передаём ключ и запускаем"
          language="bash"
          code={bundle.envExportCommand}
          syntaxHintsEnabled={syntaxHintsEnabled}
          activeFunctionId={activeFunctionId}
          onSelectFunction={onSelectFunction}
          onOpenGlossaryWithSyntax={onOpenGlossaryWithSyntax}
        />

        <p>Можно сразу поболтать с моделью:</p>

        <TerminalTranscript
          title="python agent.py"
          assistantName={assistant}
          entries={[
            { speaker: 'command', text: 'python agent.py' },
            { speaker: 'system', text: 'Чат с агентом запущен (нажмите Ctrl+C для выхода)' },
            { speaker: 'user', text: 'Привет! Меня зовут Макс. Как дела?' },
            {
              speaker: 'model',
              text: 'Привет, Макс! Всё отлично, спасибо. Приятно познакомиться. Чем займёмся сегодня?',
            },
            {
              speaker: 'user',
              text: 'Придумай пару дурацких «лошадиных» прозвищ, чтобы обыграть моё имя!',
            },
            {
              speaker: 'model',
              text: 'Держи несколько добродушных вариантов:\n* Макси-мустанг\n* Скакун Макс\n* Галоп-Максимум\n* Рысак Макс\n* Макс в Яблоках\nНадеюсь, хоть одно из них заставило тебя улыбнуться!',
            },
          ]}
        />

        <NoteBox
          label="ПОЯСНЕНИЕ // STATELESS И КОНТЕКСТНОЕ ОКНО"
          title="Почему модель помнит твоё имя, хотя сервер ничего не сохраняет"
        >
          <p>
            Обрати внимание: во втором ответе модель спокойно вспомнила, что меня зовут Макс.
            Кажется, будто на сервере ведётся наша сессия — но нет! Сервер провайдера{' '}
            <code className="amp-inline-code">stateless</code> («без памяти»): каждый HTTP-запрос
            для него как в первый раз.
          </p>
          <p>
            Иллюзию памяти создаём <strong>мы сами</strong> — тем, что на каждом шаге отправляем
            весь накопленный список <code className="amp-inline-code">conversation</code> целиком.
            Всё, что помещается в этот список за один запрос, называется{' '}
            <strong>контекстным окном</strong> (context window).
          </p>
        </NoteBox>

        <p>
          Ладно, шутки про коней так себе, да и это пока просто болталка, а никакой не агент. В чём
          принципиальная разница? Вот короткое определение, на котором держится всё остальное:
        </p>

        <blockquote className="my-5 border-l-2 border-[#f34f3f] pl-4 text-[16.5px] italic text-[#111614] dark:border-[#ff6b5b] dark:text-[#ecece6]">
          Агент — это языковая модель с доступом к инструментам, которые позволяют ей узнавать новое
          и менять реальный мир за пределами своего контекстного окна.
        </blockquote>
      </section>

      {/* Section 2 */}
      <section id="first-tool" className="scroll-mt-24 space-y-5 pt-2">
        <h2 className="text-[24px] font-medium leading-[32px] tracking-[-0.01em] text-[#111614] dark:text-[#ecece6]">
          Первый инструмент: эффект «подмигивания»
        </h2>

        <p>
          Формулировка «модель с доступом к инструментам» (в документации провайдеров —{' '}
          <TermTip
            term="Tool Use"
            explanation="Режим, в котором модель возвращает не просто текст, а структурированную просьбу вызвать конкретную функцию с аргументами (например, read_file)."
          />{' '}
          или <code className="amp-inline-code">Function Calling</code>) на практике описывает
          простой протокол обмена между моделью и нашим кодом.
        </p>

        <p>
          Языковая модель работает в изоляции и сама по себе не имеет доступа ни к файловой системе,
          ни к сети — она лишь генерирует токены. Поэтому мы заранее задаём контракт: если для
          ответа нужны внешние данные или действие на диске, модель вместо догадок возвращает
          структурированный запрос на вызов функции. Наш Python-харнесс перехватывает этот вызов,{' '}
          <strong>исполняет функцию локально</strong> и дописывает её вывод обратно в историю
          диалога.
        </p>

        <p>
          Этот же принцип можно проверить даже без поддержки Tool Calling в API — достаточно прямо
          в тексте диалога договориться с моделью о формате команды. Посмотрим, как это сработает на
          нашем текущем скрипте без единой правки кода:
        </p>

        <TerminalTranscript
          title="python agent.py — ручной эксперимент с инструментом"
          assistantName={assistant}
          entries={[
            { speaker: 'command', text: 'python agent.py' },
            { speaker: 'system', text: 'Чат с агентом запущен (нажмите Ctrl+C для выхода)' },
            {
              speaker: 'user',
              text: 'Ты — эксперт по погоде. Когда я спрошу про погоду в каком-нибудь городе, отвечай строго строкой `get_weather(<город>)`. После этого я сам напишу тебе данные о погоде. Договорились?',
            },
            {
              speaker: 'model',
              text: 'Договорились! Как только ты спросишь про погоду в конкретном городе, я отвечу строго `get_weather(<город>)` и буду ждать от тебя данные. Спрашивай!',
            },
            { speaker: 'user', text: 'Слушай, а что сейчас с погодой в Мюнхене?' },
            { speaker: 'model', text: 'get_weather(Мюнхен)' },
          ]}
        />

        <p>
          Модель точно соблюла договорённый формат и вместо выдумки выдала сигнал{' '}
          <code className="amp-inline-code">get_weather(Мюнхен)</code>. Теперь наша сторона должна
          выполнить действие и вернуть результат обратно в контекст — как если бы мы сходили к
          погодному API:
        </p>

        <TerminalTranscript
          title="продолжение диалога"
          assistantName={assistant}
          entries={[
            { speaker: 'user', text: 'жарко и душно, +28 градусов' },
            {
              speaker: 'model',
              text: 'Спасибо за свежие данные! В Мюнхене сейчас жарко и душно — +28 °C. Если планируешь прогулку, лучше одеться максимально легко, захватить воду и переждать пик жары в тени или в кафе. Проверить погоду в другом городе?',
            },
          ]}
        />

        <p>Цикл «запрос → вызов → результат → финальный ответ» замкнулся.</p>

        <p>
          Современные модели специально обучены работать в таком режиме — они буквально рады
          переложить добычу фактов на инструменты вместо того, чтобы гадать вслепую. Так что вся
          архитектура <code className="amp-inline-code">Tool Use</code> сводится ровно к двум шагам:
        </p>

        <ol className="list-decimal space-y-2 pl-5">
          <li>
            <strong>Регистрация:</strong> вместе с историей чата мы передаём модели список доступных
            инструментов — их названия, описания и какие аргументы они ждут.
          </li>
          <li>
            <strong>Обработка вызова:</strong> если модель решает вызвать инструмент, она присылает
            не обычный текст, а структурированный объект{' '}
            <code className="amp-inline-code">tool_call</code> с именем функции и JSON-параметрами.
            Мы запускаем функцию у себя в Python и возвращаем результат в историю диалога.
          </li>
        </ol>

        <p>
          Чтобы нам не приходилось вручную вырезать текст вроде{' '}
          <code className="amp-inline-code">get_weather(...)</code> регулярными выражениями, все
          крупные API-провайдеры сделали для этого отдельные поля в запросе и ответе. Прокачаем наш{' '}
          <code className="amp-inline-code">provider.py</code>, чтобы он умел передавать инструменты
          и приводить ответ любого провайдера к одному удобному формату:
        </p>

        <InteractiveCodeBlock
          filename={`provider.py (с поддержкой инструментов для ${cfg.shortName})`}
          code={bundle.providerWithToolsCode}
          syntaxHintsEnabled={syntaxHintsEnabled}
          activeFunctionId={activeFunctionId}
          onSelectFunction={onSelectFunction}
          onOpenGlossaryWithSyntax={onOpenGlossaryWithSyntax}
        />

        <NoteBox
          label="ПОЯСНЕНИЕ // ЕДИНЫЙ КОНТРАКТ АДАПТЕРА"
          title="Почему смена провайдера не ломает ни строчки в agent.py"
        >
          <p>
            У OpenAI/Command Code GOAT и у Anthropic чуть разные форматы сообщений для инструментов
            (например, роль <code className="amp-inline-code">tool</code> против блока{' '}
            <code className="amp-inline-code">tool_result</code>). Но наша функция{' '}
            <button
              type="button"
              onClick={() => onSelectFunction('ask_model')}
              className="amp-inline-code cursor-pointer underline decoration-[#f34f3f]/60 underline-offset-2 hover:bg-[#f34f3f]/10"
            >
              ask_model()
            </button>{' '}
            всегда возвращает один и тот же предсказуемый словарь{' '}
            <code className="amp-inline-code">{`{"text", "tool_calls", "raw_message"}`}</code>, а{' '}
            <button
              type="button"
              onClick={() => onSelectFunction('make_tool_result_message')}
              className="amp-inline-code cursor-pointer underline decoration-[#f34f3f]/60 underline-offset-2 hover:bg-[#f34f3f]/10"
            >
              make_tool_result_message()
            </button>{' '}
            сама упаковывает результат так, как ждёт выбранный API. Попробуй переключить провайдера
            наверху страницы — увидишь, как перестроится <code className="amp-inline-code">provider.py</code>,
            а код агента дальше останется прежним.
          </p>
        </NoteBox>

        <p>
          Отлично, связь готова. Пора дать агенту его первый настоящий инструмент — научим его
          читать файлы с диска.
        </p>
      </section>

      {/* Section 3: read_file */}
      <section id="read-file" className="scroll-mt-24 space-y-5 pt-2">
        <h2 className="text-[24px] font-medium leading-[32px] tracking-[-0.01em] text-[#111614] dark:text-[#ecece6]">
          Даём агенту глаза: <code className="amp-inline-code text-[21px]">read_file</code>
        </h2>

        <p>
          Чтобы модель узнала о новом инструменте, ей нужно передать его «паспорт». Держи в уме:
          какими бы серьёзными ни казались JSON-схемы, на стороне сервера они всё равно превратятся
          в обычный текст внутри системного промпта. По сути, это всё то же «подмигни мне словом{' '}
          <code className="amp-inline-code">read_file</code>, если захочешь заглянуть внутрь файла».
        </p>

        <p>У каждого нашего инструмента будут ровно четыре поля:</p>

        <ul className="list-disc space-y-2 pl-5">
          <li>
            <code className="amp-inline-code">name</code> — короткое машинное имя вроде{' '}
            <code className="amp-inline-code">"read_file"</code>.
          </li>
          <li>
            <code className="amp-inline-code">description</code> — подробная инструкция для модели
            нормальным языком: что инструмент делает, когда его стоит вызывать, а когда нельзя
            (например, «не передавай сюда имя папки»).
          </li>
          <li>
            <code className="amp-inline-code">parameters</code> — описание аргументов в стандарте{' '}
            <strong>JSON Schema</strong> (в Python это просто вложенный словарь, который объясняет:
            «я жду поле <code className="amp-inline-code">path</code>, это обязательная строка»).
          </li>
          <li>
            <code className="amp-inline-code">function</code> — ссылка на реальную Python-функцию,
            которая откроет файл и вернёт его содержимое.
          </li>
        </ul>

        <p>Добавляем инструмент <code className="amp-inline-code">read_file</code>:</p>

        <InteractiveCodeBlock
          filename="agent.py — добавляем read_file"
          code={bundle.readFileToolCode}
          syntaxHintsEnabled={syntaxHintsEnabled}
          activeFunctionId={activeFunctionId}
          onSelectFunction={onSelectFunction}
          onOpenGlossaryWithSyntax={onOpenGlossaryWithSyntax}
        />

        <p>
          Вся реализация{' '}
          <button
            type="button"
            onClick={() => onSelectFunction('read_file')}
            className="amp-inline-code cursor-pointer underline decoration-[#2e7d5b]/60 underline-offset-2 hover:bg-[#2e7d5b]/10"
          >
            read_file()
          </button>{' '}
          укладывается в чтение файла в кодировке UTF-8 плюс чёткую JSON-схему, чтобы модель не
          путала файл с директорией и всегда передавала относительный путь.
        </p>

        <ToolSandboxCard kind="read_file" onInspectFunction={onSelectFunction} />

        <p>
          Но есть нюанс. Если сейчас просто передать <code className="amp-inline-code">[READ_FILE_TOOL]</code>{' '}
          в модель и спросить <em>«Что лежит в agent.py?»</em>, произойдёт смешная вещь: модель
          напишет <em>«Сейчас загляну в agent.py!»</em> — и замолчит. Она уже честно «подмигнула»
          нам через <code className="amp-inline-code">tool_calls</code>, но наш старый цикл ещё не
          умеет реагировать на такие сигналы.
        </p>

        <p>
          Исправляем! Добавляем функцию-диспетчер{' '}
          <button
            type="button"
            onClick={() => onSelectFunction('execute_tool')}
            className="amp-inline-code cursor-pointer underline decoration-[#f34f3f]/60 underline-offset-2 hover:bg-[#f34f3f]/10"
          >
            execute_tool()
          </button>{' '}
          и обновляем главный цикл{' '}
          <button
            type="button"
            onClick={() => onSelectFunction('run_agent')}
            className="amp-inline-code cursor-pointer underline decoration-[#f34f3f]/60 underline-offset-2 hover:bg-[#f34f3f]/10"
          >
            run_agent()
          </button>
          :
        </p>

        <InteractiveCodeBlock
          filename="agent.py — цикл с выполнением инструментов"
          code={bundle.agentLoopWithToolsCode}
          syntaxHintsEnabled={syntaxHintsEnabled}
          activeFunctionId={activeFunctionId}
          onSelectFunction={onSelectFunction}
          onOpenGlossaryWithSyntax={onOpenGlossaryWithSyntax}
        />

        <NoteBox
          label="ПОЯСНЕНИЕ // ЗАЧЕМ НУЖЕН ФЛАГ READ_USER_INPUT"
          title="Как агент делает несколько шагов подряд без участия человека"
        >
          <p>
            Посмотри на переменную <code className="amp-inline-code">read_user_input</code> — это
            главный переключатель всего цикла. Пока модель общается обычным текстом, флаг равен{' '}
            <code className="amp-inline-code">True</code>: программа останавливается и ждёт твоего
            нового вопроса.
          </p>
          <p>
            Но как только в ответе появляется <code className="amp-inline-code">tool_calls</code>,
            мы выполняем все запрошенные инструменты, дописываем их результаты в{' '}
            <code className="amp-inline-code">conversation</code> и ставим{' '}
            <code className="amp-inline-code">read_user_input = False</code>. На следующем витке
            цикла программа <strong>не спрашивает пользователя</strong>, а сразу несёт свежие данные
            обратно модели. Так агент может вызывать инструменты цепочкой — хоть два, хоть десять раз
            подряд, пока не соберёт всё нужное для финального ответа.
          </p>
        </NoteBox>

        <p>
          Проверим в бою! Создадим рядом в папке файл{' '}
          <code className="amp-inline-code">secret-file.txt</code> с небольшой загадкой внутри:
        </p>

        <InteractiveCodeBlock
          filename="терминал — создаём файл с загадкой"
          language="bash"
          code={`echo 'Что становится всё более влажным, пока кого-то сушит?' > secret-file.txt`}
          syntaxHintsEnabled={syntaxHintsEnabled}
          activeFunctionId={activeFunctionId}
          onSelectFunction={onSelectFunction}
          onOpenGlossaryWithSyntax={onOpenGlossaryWithSyntax}
        />

        <p>Запускаем агента в той же папке и просим разгадать загадку из файла:</p>

        <TerminalTranscript
          title="python agent.py — момент «ого!»"
          assistantName={assistant}
          entries={[
            { speaker: 'command', text: 'python agent.py' },
            { speaker: 'system', text: 'Чат с агентом запущен (нажмите Ctrl+C для выхода)' },
            { speaker: 'user', text: 'Помоги разгадать загадку из файла secret-file.txt' },
            { speaker: 'model', text: 'Сейчас посмотрю, что написано в secret-file.txt.' },
            { speaker: 'tool', text: 'read_file({"path": "secret-file.txt"})' },
            {
              speaker: 'model',
              text: 'Классная загадка! Ответ — **полотенце**.\n\nЧем больше оно вытирает и сушит, тем мокрее становится само.',
            },
          ]}
        />

        <p>
          Остановись на секунду и оцени, что только что произошло. Мы <em>нигде</em> в коде не
          писали <code className="amp-inline-code">if "файл" in user_text: read_file(...)</code>. Мы
          просто положили перед моделью инструмент и описание — а она сама сообразила, что без
          чтения файла ответа не узнает, дёрнула наш Python-код, прочитала текст и решила задачу.
        </p>

        <p>А если попросить агента разобрать собственный исходник?</p>

        <TerminalTranscript
          title="python agent.py — агент читает самого себя"
          assistantName={assistant}
          entries={[
            { speaker: 'user', text: 'Что происходит внутри agent.py? Только коротко!' },
            { speaker: 'model', text: 'Сейчас загляну в agent.py.' },
            { speaker: 'tool', text: 'read_file({"path": "agent.py"})' },
            {
              speaker: 'model',
              text: 'Если коротко, agent.py — это консольный ИИ-агент:\n- Подключает адаптер API из provider.py\n- Хранит переписку в списке conversation внутри цикла while True\n- Даёт модели инструмент read_file для чтения локальных файлов\n- Через execute_tool() запускает запрошенные инструменты и возвращает результат обратно модели.',
            },
          ]}
        />

        <p>
          Модель самостоятельно разобрала структуру <code className="amp-inline-code">agent.py</code>{' '}
          прямо с диска. Теперь добавим ещё два инструмента — просмотр директории и точечное
          редактирование файлов — чтобы цикл стал полноценным код-агентом.
        </p>
      </section>

      {/* Section 4: list_files */}
      <section id="list-files" className="scroll-mt-24 space-y-5 pt-2">
        <h2 className="text-[24px] font-medium leading-[32px] tracking-[-0.01em] text-[#111614] dark:text-[#ecece6]">
          Учим ориентироваться в папке: <code className="amp-inline-code text-[21px]">list_files</code>
        </h2>

        <p>
          Что ты делаешь первым делом, когда попадаешь в незнакомую папку в терминале? Правильно,
          пишешь <code className="amp-inline-code">ls</code>, чтобы осмотреться по сторонам. Дадим
          агенту точно такой же обзор:
        </p>

        <InteractiveCodeBlock
          filename="agent.py — добавляем list_files"
          code={bundle.listFilesToolCode}
          syntaxHintsEnabled={syntaxHintsEnabled}
          activeFunctionId={activeFunctionId}
          onSelectFunction={onSelectFunction}
          onOpenGlossaryWithSyntax={onOpenGlossaryWithSyntax}
        />

        <p>
          Внутри всё предельно понятно: стандартный <code className="amp-inline-code">os.walk</code>{' '}
          проходит по папке, мы выкидываем шумные служебные каталоги вроде{' '}
          <code className="amp-inline-code">.git</code>,{' '}
          <code className="amp-inline-code">venv</code> и{' '}
          <code className="amp-inline-code">__pycache__</code> (иначе модель захлебнётся в тысячах
          чужих файлов), к папкам дописываем слэш <code className="amp-inline-code">/</code> на
          конце и отдаём аккуратный JSON-список.
        </p>

        <ToolSandboxCard kind="list_files" onInspectFunction={onSelectFunction} />

        <NoteBox
          label="ПОЯСНЕНИЕ // ФОРМАТ ОТВЕТА ИНСТРУМЕНТА"
          title="Жёсткого стандарта нет — главное, чтобы модель легко понимала текст"
        >
          <p>
            Слэш в конце имени директории (<code className="amp-inline-code">utils/</code>) — это не
            требование API, а просто моя удобная договорённость. Можно было вернуть обычный список
            через перенос строки или писать <code className="amp-inline-code">папка: utils</code>.
            Золотое правило одно: формат должен быть коротким (экономим токены) и однозначным для
            чтения.
          </p>
        </NoteBox>

        <p>
          Дописываем <code className="amp-inline-code">LIST_FILES_TOOL</code> в список{' '}
          <code className="amp-inline-code">TOOLS</code> — и смотри, как модель начинает сама{' '}
          <em>комбинировать</em> два инструмента в связке:
        </p>

        <TerminalTranscript
          title="python agent.py — связка list_files + read_file"
          assistantName={assistant}
          entries={[
            { speaker: 'user', text: 'Расскажи вкратце про все Python-файлы в этой папке.' },
            { speaker: 'model', text: 'Сначала посмотрю, какие файлы вообще есть в проекте.' },
            { speaker: 'tool', text: 'list_files({})' },
            { speaker: 'model', text: 'Вижу два файла Python: agent.py и provider.py. Прочитаю оба:' },
            { speaker: 'tool', text: 'read_file({"path": "agent.py"})' },
            { speaker: 'tool', text: 'read_file({"path": "provider.py"})' },
            {
              speaker: 'model',
              text: 'Вот краткий разбор Python-файлов проекта:\n\n1. **provider.py** — слой подключения к выбранному ИИ-провайдеру, скрывающий отличия разных API.\n2. **agent.py** — сам консольный агент с циклом диалога и двумя инструментами: read_file и list_files.',
            },
          ]}
        />

        <p>
          Заметь порядок действий: сначала <code className="amp-inline-code">list_files</code>,
          чтобы сориентироваться, а потом два вызова{' '}
          <code className="amp-inline-code">read_file</code> по конкретным файлам — один в один как
          работает живой программист. И при этом у нас в проекте сейчас около 120 строк кода! Дай
          этой мысли улечься — и переходим к финальному инструменту.
        </p>
      </section>

      {/* Section 5: edit_file */}
      <section id="edit-file" className="scroll-mt-24 space-y-5 pt-2">
        <h2 className="text-[24px] font-medium leading-[32px] tracking-[-0.01em] text-[#111614] dark:text-[#ecece6]">
          Даём агенту руки: <code className="amp-inline-code text-[21px]">edit_file</code>
        </h2>

        <p>
          Последний кирпичик — инструмент <code className="amp-inline-code">edit_file</code>, с
          которым агент сможет не только читать, но и создавать и редактировать файлы на диске.
        </p>

        <p>
          Часто ожидают, что для надёжного редактирования кода обязательно нужны unified diff-патчи,
          AST-парсеры или адресация по номерам строк. На практике у каждого из этих подходов есть
          типичные поломки: модели легко сбиваются со счёта строк после первой же правки и ошибаются
          в заголовках hunk-блоков diff.
        </p>

        <p>
          Поэтому в большинстве реальных кодинг-агентов базовым примитивом служит{' '}
          <strong>точная замена уникального фрагмента</strong>: передаём{' '}
          <code className="amp-inline-code">old_str</code>, проверяем, что он встречается в файле
          ровно один раз (иначе возвращаем ошибку, чтобы модель уточнила контекст), и заменяем на{' '}
          <code className="amp-inline-code">new_str</code>. А если файла ещё нет и{' '}
          <code className="amp-inline-code">old_str</code> равен пустой строке{' '}
          <code className="amp-inline-code">""</code> — создаём новый файл с содержимым{' '}
          <code className="amp-inline-code">new_str</code>.
        </p>

        <InteractiveCodeBlock
          filename="agent.py — добавляем edit_file и create_new_file"
          code={bundle.editFileToolCode}
          syntaxHintsEnabled={syntaxHintsEnabled}
          activeFunctionId={activeFunctionId}
          onSelectFunction={onSelectFunction}
          onOpenGlossaryWithSyntax={onOpenGlossaryWithSyntax}
        />

        <ToolSandboxCard kind="edit_file" onInspectFunction={onSelectFunction} />

        <NoteBox
          label="ПОЯСНЕНИЕ // ПОЧЕМУ ЗАМЕНА СТРОКИ, А НЕ НОМЕРА СТРОК"
          title="Модели плохо считают строчки, но отлично работают с контекстом"
        >
          <p>
            Языковые модели видят текст в виде токенов, а не пронумерованной таблицы, поэтому часто
            промахиваются на пару строк при редактировании по номерам. Зато точно процитировать 3–5
            строчек кода (<code className="amp-inline-code">old_str</code>) и написать, на что их
            заменить (<code className="amp-inline-code">new_str</code>), для них элементарно.
          </p>
          <p>
            А вспомогательная функция{' '}
            <button
              type="button"
              onClick={() => onSelectFunction('create_new_file')}
              className="amp-inline-code cursor-pointer underline decoration-[#f34f3f]/60 underline-offset-2 hover:bg-[#f34f3f]/10"
            >
              create_new_file()
            </button>{' '}
            занимает всего 6 строк и умеет сама создавать недостающие подпапки — так агент не
            упадёт с ошибкой, если решит положить файл в <code className="amp-inline-code">utils/helpers.py</code>.
          </p>
        </NoteBox>

        <p>
          Добавляем <code className="amp-inline-code">EDIT_FILE_TOOL</code> в список{' '}
          <code className="amp-inline-code">TOOLS</code>. Всё собрано — выпускаем агента в дикую
          природу! Попросим его написать классический скрипт FizzBuzz на Python:
        </p>

        <TerminalTranscript
          title="python agent.py — создаём fizzbuzz.py"
          assistantName={assistant}
          entries={[
            { speaker: 'command', text: 'python agent.py' },
            { speaker: 'system', text: 'Чат с агентом запущен (нажмите Ctrl+C для выхода)' },
            {
              speaker: 'user',
              text: 'Создай файл fizzbuzz.py, который печатает FizzBuzz от 1 до 100 и сразу запускается.',
            },
            { speaker: 'model', text: 'Сначала проверю, нет ли уже такого файла в папке.' },
            { speaker: 'tool', text: 'list_files({})' },
            { speaker: 'model', text: 'Файла fizzbuzz.py нет — создаю новый скрипт.' },
            {
              speaker: 'tool',
              text: 'edit_file({"path": "fizzbuzz.py", "old_str": "", "new_str": "def fizzbuzz(limit):\\n    for n in range(1, limit + 1):\\n        ..."})',
            },
            {
              speaker: 'model',
              text: 'Готово! Я создал fizzbuzz.py. Можешь запустить его командой: python fizzbuzz.py',
            },
          ]}
        />

        <p>
          Агент сначала проверил директорию через <code className="amp-inline-code">list_files</code>,
          убедился, что файла нет, и создал его через <code className="amp-inline-code">edit_file</code>.
          Проверим запуск в терминале:
        </p>

        <InteractiveCodeBlock
          filename="терминал — проверяем fizzbuzz.py"
          language="bash"
          code={`$ python fizzbuzz.py\n1\n2\nFizz\n4\nBuzz\nFizz\n7\n8\nFizz\nBuzz\n11\nFizz\n13\n14\nFizzBuzz\n[...]`}
          syntaxHintsEnabled={syntaxHintsEnabled}
          activeFunctionId={activeFunctionId}
          onSelectFunction={onSelectFunction}
          onOpenGlossaryWithSyntax={onOpenGlossaryWithSyntax}
        />

        <p>
          Создавать файл с нуля — это полдела. Давай проверим, сможет ли он аккуратно{' '}
          <em>отредактировать</em> уже готовый скрипт, ничего в нём не сломав:
        </p>

        <TerminalTranscript
          title="python agent.py — точечная правка fizzbuzz.py"
          assistantName={assistant}
          entries={[
            { speaker: 'user', text: 'Поправь fizzbuzz.py так, чтобы он печатал только до 15.' },
            { speaker: 'model', text: 'Сначала прочитаю текущий код fizzbuzz.py.' },
            { speaker: 'tool', text: 'read_file({"path": "fizzbuzz.py"})' },
            { speaker: 'model', text: 'Вижу вызов fizzbuzz(100). Меняю 100 на 15:' },
            {
              speaker: 'tool',
              text: 'edit_file({"path": "fizzbuzz.py", "old_str": "fizzbuzz(100)", "new_str": "fizzbuzz(15)"})',
            },
            {
              speaker: 'model',
              text: 'Обновил fizzbuzz.py — теперь скрипт выводит последовательность от 1 до 15.',
            },
          ]}
        />

        <p>
          Он сам прочитал код, сам нашёл нужную строку и точечно заменил её. И напоследок — задачка
          с шифром ROT13 (это простой сдвиг латинского алфавита на 13 букв):
        </p>

        <blockquote className="my-5 border-l-2 border-[#d5d7d0] pl-4 italic text-[#424642] dark:border-white/20 dark:text-[#b2b6af]">
          Создай скрипт congrats.py, который расшифровывает строку ROT13
          ‘Pbatenghyngvbaf ba ohvyqvat n pbqr-rqvgvat ntrag!’ и выводит результат.
        </blockquote>

        <p>Проверим, справится ли наш 200-строчный агент:</p>

        <TerminalTranscript
          title="python agent.py — тест с шифром ROT13"
          assistantName={assistant}
          entries={[
            {
              speaker: 'user',
              text: "Создай скрипт congrats.py, который расшифровывает строку ROT13 'Pbatenghyngvbaf ba ohvyqvat n pbqr-rqvgvat ntrag!' и печатает результат",
            },
            { speaker: 'model', text: 'Создаю congrats.py с декодированием ROT13:' },
            {
              speaker: 'tool',
              text: 'edit_file({"path": "congrats.py", "old_str": "", "new_str": "import codecs\\nmsg = \'Pbatenghyngvbaf ba ohvyqvat n pbqr-rqvgvat ntrag!\'\\nprint(codecs.decode(msg, \'rot_13\'))\\n"})',
            },
            {
              speaker: 'model',
              text: 'Готово! Запусти файл командой python congrats.py, чтобы увидеть расшифрованную фразу.',
            },
          ]}
        />

        <p>Запускаем и смотрим, что получилось:</p>

        <InteractiveCodeBlock
          filename="терминал — проверяем congrats.py"
          language="bash"
          code={`$ python congrats.py\nCongratulations on building a code-editing agent!`}
          syntaxHintsEnabled={syntaxHintsEnabled}
          activeFunctionId={activeFunctionId}
          onSelectFunction={onSelectFunction}
          onOpenGlossaryWithSyntax={onOpenGlossaryWithSyntax}
        />

        <p>Сработало с первого раза!</p>
      </section>

      {/* Section 6: Conclusion */}
      <section id="conclusion" className="scroll-mt-24 space-y-5 pt-2">
        <h2 className="text-[24px] font-medium leading-[32px] tracking-[-0.01em] text-[#111614] dark:text-[#ecece6]">
          Что на самом деле находится в ядре любого код-агента
        </h2>

        <p>
          Вся рабочая схема теперь у тебя перед глазами: цикл сообщений, адаптер провайдера и
          диспетчер инструментов. Никакого скрытого «секретного уровня» за этими 200 строками нет.
        </p>

        <p>
          Конечно, продакшн-харнессы добавляют сверху много полезной инженерии: запуск shell-команд с
          подтверждением, сжатие длинной истории при приближении к лимиту контекста, отслеживание
          стоимости токенов, ретраи на сетевых сбоях и параллельных субагентов. Но в центре всё
          равно крутится ровно эта же петля <code className="amp-inline-code">while True</code> с
          передачей <code className="amp-inline-code">tool_calls</code> и{' '}
          <code className="amp-inline-code">tool_result</code>.
        </p>

        <p>
          А самое приятное — благодаря вынесенному слою <code className="amp-inline-code">provider.py</code>{' '}
          ты не привязан к одному облаку: можешь ходить через подписку Command Code GOAT, раздавать
          лимиты через собственный прокси или вообще перевести этот же харнесс на локальную модель
          на Apple Silicon — подробный разбор такого запуска через <strong>Locals</strong> смотри в
          разделе ниже.
        </p>
      </section>
    </div>
  );
}
