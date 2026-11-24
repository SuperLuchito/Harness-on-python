import { PROVIDERS } from '../data/providers';
import { ProviderId, SimulatorScenarioId, SimulatorStep } from '../types/guide';

export interface SimulatorScenarioMeta {
  id: SimulatorScenarioId;
  title: string;
  subtitle: string;
  userPrompt: string;
}

export const SIMULATOR_SCENARIOS: SimulatorScenarioMeta[] = [
  {
    id: 'riddle',
    title: 'Загадка в secret-file.txt',
    subtitle: 'Агент сам решает прочитать файл, чтобы ответить на вопрос',
    userPrompt: 'Помоги разгадать загадку из файла secret-file.txt',
  },
  {
    id: 'fizzbuzz',
    title: 'Создание fizzbuzz.py',
    subtitle: 'Связка инструментов: сначала list_files, затем edit_file',
    userPrompt: 'Создай файл fizzbuzz.py, который печатает FizzBuzz до 15',
  },
  {
    id: 'rot13',
    title: 'Расшифровка ROT13',
    subtitle: 'Агент пишет и сохраняет скрипт congrats.py',
    userPrompt: "Создай congrats.py для расшифровки ROT13: 'Pbatenghyngvbaf ba ohvyqvat n pbqr-rqvgvat ntrag!'",
  },
];

export function buildSimulatorSteps(
  scenarioId: SimulatorScenarioId,
  providerId: ProviderId,
  modelOverride?: string
): SimulatorStep[] {
  const cfg = PROVIDERS[providerId];
  const modelName = modelOverride || cfg.defaultModel;
  const endpoint = cfg.baseUrl || 'https://api.anthropic.com/v1/messages';

  if (scenarioId === 'riddle') {
    const initialFiles = [
      { name: 'agent.py', content: '# Главный скрипт агента (150 строк)', status: 'existing' as const },
      { name: 'provider.py', content: `# Коннектор: ${cfg.shortName} (${modelName})`, status: 'existing' as const },
      {
        name: 'secret-file.txt',
        content: 'what animal is the most disagreeable because it always says neigh?',
        status: 'existing' as const,
      },
    ];

    return [
      {
        index: 0,
        title: '1. Ввод пользователя',
        activeNode: 'user',
        activeFunction: 'get_user_message',
        explanation:
          'Функция get_user_message() считывает вашу фразу из терминала. В ней нет никаких команд — обычный живой вопрос.',
        conversationCount: 1,
        payloadPreview: JSON.stringify(
          { role: 'user', content: 'Помоги разгадать загадку из файла secret-file.txt' },
          null,
          2
        ),
        terminalLines: [
          { speaker: 'system', text: 'Чат с агентом запущен (нажмите Ctrl+C для выхода)' },
          { speaker: 'user', text: 'Помоги разгадать загадку из файла secret-file.txt' },
        ],
        files: initialFiles,
      },
      {
        index: 1,
        title: '2. Запрос к провайдеру',
        activeNode: 'provider',
        activeFunction: 'ask_model',
        explanation: `Цикл run_agent() вызывает ask_model() и отправляет историю переписки плюс список доступных инструментов на ${endpoint}.`,
        conversationCount: 1,
        payloadPreview: JSON.stringify(
          {
            endpoint,
            model: modelName,
            messages: [{ role: 'user', content: 'Помоги разгадать загадку из файла secret-file.txt' }],
            tools: ['read_file', 'list_files', 'edit_file'],
          },
          null,
          2
        ),
        terminalLines: [
          { speaker: 'system', text: 'Чат с агентом запущен (нажмите Ctrl+C для выхода)' },
          { speaker: 'user', text: 'Помоги разгадать загадку из файла secret-file.txt' },
        ],
        files: initialFiles,
      },
      {
        index: 2,
        title: '3. Модель «подмигивает»',
        activeNode: 'loop',
        activeFunction: 'run_agent',
        explanation:
          'Модель понимает, что не знает содержимое файла, и вместо ответа присылает структурированный запрос tool_call: read_file({"path": "secret-file.txt"}).',
        conversationCount: 2,
        payloadPreview: JSON.stringify(
          {
            text: 'Сейчас прочитаю файл secret-file.txt и посмотрю, что за загадка внутри.',
            tool_calls: [{ id: 'call_01', name: 'read_file', args: { path: 'secret-file.txt' } }],
          },
          null,
          2
        ),
        terminalLines: [
          { speaker: 'system', text: 'Чат с агентом запущен (нажмите Ctrl+C для выхода)' },
          { speaker: 'user', text: 'Помоги разгадать загадку из файла secret-file.txt' },
          { speaker: 'model', text: 'Сейчас прочитаю файл secret-file.txt и посмотрю, что за загадка внутри.' },
        ],
        files: initialFiles,
      },
      {
        index: 3,
        title: '4. Локальный запуск read_file',
        activeNode: 'tools',
        activeFunction: 'read_file',
        explanation:
          'execute_tool() находит нашу Python-функцию read_file() и запускает её прямо на вашем компьютере. Модель НЕ имеет прямого доступа к диску — файл читает ваш скрипт.',
        conversationCount: 3,
        payloadPreview: JSON.stringify(
          {
            role: 'tool',
            tool_call_id: 'call_01',
            content: 'what animal is the most disagreeable because it always says neigh?',
          },
          null,
          2
        ),
        terminalLines: [
          { speaker: 'system', text: 'Чат с агентом запущен (нажмите Ctrl+C для выхода)' },
          { speaker: 'user', text: 'Помоги разгадать загадку из файла secret-file.txt' },
          { speaker: 'model', text: 'Сейчас прочитаю файл secret-file.txt и посмотрю, что за загадка внутри.' },
          { speaker: 'tool', text: 'read_file({"path": "secret-file.txt"})' },
        ],
        files: initialFiles.map((f) => (f.name === 'secret-file.txt' ? { ...f, status: 'read' as const } : f)),
      },
      {
        index: 4,
        title: '5. Повторный виток и финальный ответ',
        activeNode: 'provider',
        activeFunction: 'ask_model',
        explanation:
          'Поскольку read_user_input = False, цикл сразу отправляет текст загадки модели. Теперь у неё есть все данные: она отвечает «Лошадь!» и возвращает управление человеку.',
        conversationCount: 4,
        payloadPreview: JSON.stringify(
          {
            text: 'Ответ: Лошадь! Это игра слов: звук «neigh» (иго-го) звучит так же, как «nay» (нет).',
            tool_calls: [],
          },
          null,
          2
        ),
        terminalLines: [
          { speaker: 'system', text: 'Чат с агентом запущен (нажмите Ctrl+C для выхода)' },
          { speaker: 'user', text: 'Помоги разгадать загадку из файла secret-file.txt' },
          { speaker: 'model', text: 'Сейчас прочитаю файл secret-file.txt и посмотрю, что за загадка внутри.' },
          { speaker: 'tool', text: 'read_file({"path": "secret-file.txt"})' },
          {
            speaker: 'model',
            text: 'Отличная загадка! Ответ — лошадь. В английском ржание «neigh» звучит точь-в-точь как «nay» («нет»), поэтому лошадь якобы всегда со всем не согласна.',
          },
        ],
        files: initialFiles.map((f) => (f.name === 'secret-file.txt' ? { ...f, status: 'read' as const } : f)),
      },
    ];
  }

  if (scenarioId === 'fizzbuzz') {
    const baseFiles = [
      { name: 'agent.py', content: '# Главный скрипт агента', status: 'existing' as const },
      { name: 'provider.py', content: `# Провайдер: ${cfg.shortName}`, status: 'existing' as const },
    ];
    const createdFizzBuzz = {
      name: 'fizzbuzz.py',
      content:
        'for n in range(1, 16):\n    if n % 15 == 0: print("FizzBuzz")\n    elif n % 3 == 0: print("Fizz")\n    elif n % 5 == 0: print("Buzz")\n    else: print(n)',
      status: 'created' as const,
    };

    return [
      {
        index: 0,
        title: '1. Задача на создание кода',
        activeNode: 'user',
        activeFunction: 'get_user_message',
        explanation: 'Вы просите создать рабочий Python-файл. Агент получает задачу и отправляет её в модель.',
        conversationCount: 1,
        payloadPreview: JSON.stringify(
          { role: 'user', content: 'Создай файл fizzbuzz.py, который печатает FizzBuzz до 15' },
          null,
          2
        ),
        terminalLines: [
          { speaker: 'user', text: 'Создай файл fizzbuzz.py, который печатает FizzBuzz до 15' },
        ],
        files: baseFiles,
      },
      {
        index: 1,
        title: '2. Проверка папки через list_files',
        activeNode: 'tools',
        activeFunction: 'list_files',
        explanation:
          'Прежде чем создавать файл, модель сама решает осмотреться и вызывает list_files({}), чтобы не перезаписать существующий код.',
        conversationCount: 3,
        payloadPreview: JSON.stringify(
          { tool_call: 'list_files({})', tool_result: ['agent.py', 'provider.py'] },
          null,
          2
        ),
        terminalLines: [
          { speaker: 'user', text: 'Создай файл fizzbuzz.py, который печатает FizzBuzz до 15' },
          { speaker: 'model', text: 'Сначала проверю, нет ли уже такого файла в папке.' },
          { speaker: 'tool', text: 'list_files({})' },
        ],
        files: baseFiles,
      },
      {
        index: 2,
        title: '3. Создание файла через edit_file',
        activeNode: 'tools',
        activeFunction: 'edit_file',
        explanation:
          'Увидев, что fizzbuzz.py ещё нет, модель вызывает edit_file с пустым old_str="". Внутри срабатывает create_new_file() и сохраняет файл на диск.',
        conversationCount: 5,
        payloadPreview: JSON.stringify(
          {
            name: 'edit_file',
            args: {
              path: 'fizzbuzz.py',
              old_str: '',
              new_str: createdFizzBuzz.content,
            },
          },
          null,
          2
        ),
        terminalLines: [
          { speaker: 'user', text: 'Создай файл fizzbuzz.py, который печатает FizzBuzz до 15' },
          { speaker: 'model', text: 'Сначала проверю, нет ли уже такого файла в папке.' },
          { speaker: 'tool', text: 'list_files({})' },
          { speaker: 'tool', text: 'edit_file({"path": "fizzbuzz.py", "old_str": "", "new_str": "..."})' },
        ],
        files: [...baseFiles, createdFizzBuzz],
      },
      {
        index: 3,
        title: '4. Завершение и отчёт',
        activeNode: 'provider',
        activeFunction: 'run_agent',
        explanation:
          'Получив ответ «Файл fizzbuzz.py успешно создан», модель убеждается, что задача решена, и пишет вам инструкцию по запуску. Новый файл уже на диске!',
        conversationCount: 6,
        payloadPreview: JSON.stringify(
          {
            model: modelName,
            text: 'Готово! Файл fizzbuzz.py создан. Запустите его командой: python fizzbuzz.py',
            tool_calls: [],
          },
          null,
          2
        ),
        terminalLines: [
          { speaker: 'user', text: 'Создай файл fizzbuzz.py, который печатает FizzBuzz до 15' },
          { speaker: 'model', text: 'Сначала проверю, нет ли уже такого файла в папке.' },
          { speaker: 'tool', text: 'list_files({})' },
          { speaker: 'tool', text: 'edit_file({"path": "fizzbuzz.py", "old_str": "", "new_str": "..."})' },
          { speaker: 'model', text: 'Готово! Файл fizzbuzz.py создан. Запустите его командой: python fizzbuzz.py' },
        ],
        files: [...baseFiles, createdFizzBuzz],
      },
    ];
  }

  // rot13 scenario
  const baseFiles = [
    { name: 'agent.py', content: '# Главный скрипт агента', status: 'existing' as const },
    { name: 'provider.py', content: `# Провайдер: ${cfg.shortName}`, status: 'existing' as const },
  ];
  const congratsFile = {
    name: 'congrats.py',
    content:
      'import codecs\nsecret = "Pbatenghyngvbaf ba ohvyqvat n pbqr-rqvgvat ntrag!"\nprint(codecs.decode(secret, "rot_13"))',
    status: 'created' as const,
  };

  return [
    {
      index: 0,
      title: '1. Зашифрованное задание',
      activeNode: 'user',
      activeFunction: 'get_user_message',
      explanation: 'Финальный тест с шифром: просим агента написать скрипт для декодирования ROT13.',
      conversationCount: 1,
      payloadPreview: JSON.stringify(
        {
          role: 'user',
          content: "Создай congrats.py для расшифровки ROT13: 'Pbatenghyngvbaf ba ohvyqvat n pbqr-rqvgvat ntrag!'",
        },
        null,
        2
      ),
      terminalLines: [
        {
          speaker: 'user',
          text: "Создай congrats.py для расшифровки ROT13: 'Pbatenghyngvbaf ba ohvyqvat n pbqr-rqvgvat ntrag!'",
        },
      ],
      files: baseFiles,
    },
    {
      index: 1,
      title: '2. Запрос на запись congrats.py',
      activeNode: 'provider',
      activeFunction: 'ask_model',
      explanation: `Модель (${modelName}) знает стандартный модуль Python codecs и сразу формирует вызов edit_file с готовым кодом.`,
      conversationCount: 2,
      payloadPreview: JSON.stringify(
        {
          endpoint,
          tool_calls: [{ name: 'edit_file', args: { path: 'congrats.py', old_str: '', new_str: congratsFile.content } }],
        },
        null,
        2
      ),
      terminalLines: [
        {
          speaker: 'user',
          text: "Создай congrats.py для расшифровки ROT13: 'Pbatenghyngvbaf ba ohvyqvat n pbqr-rqvgvat ntrag!'",
        },
        { speaker: 'model', text: 'Создаю скрипт congrats.py с расшифровкой ROT13.' },
      ],
      files: baseFiles,
    },
    {
      index: 2,
      title: '3. Инструмент сохраняет файл',
      activeNode: 'tools',
      activeFunction: 'create_new_file',
      explanation: 'edit_file вызывает create_new_file("congrats.py", ...) — файл появляется в вашей папке.',
      conversationCount: 3,
      payloadPreview: JSON.stringify({ tool_result: 'Файл congrats.py успешно создан' }, null, 2),
      terminalLines: [
        {
          speaker: 'user',
          text: "Создай congrats.py для расшифровки ROT13: 'Pbatenghyngvbaf ba ohvyqvat n pbqr-rqvgvat ntrag!'",
        },
        { speaker: 'model', text: 'Создаю скрипт congrats.py с расшифровкой ROT13.' },
        { speaker: 'tool', text: 'edit_file({"path": "congrats.py", "old_str": "", "new_str": "..."})' },
      ],
      files: [...baseFiles, congratsFile],
    },
    {
      index: 3,
      title: '4. Поздравление расшифровано!',
      activeNode: 'loop',
      activeFunction: 'run_agent',
      explanation:
        'Запустите python congrats.py в терминале и увидите: «Congratulations on building a code-editing agent!»',
      conversationCount: 4,
      payloadPreview: JSON.stringify(
        {
          shell_output: 'Congratulations on building a code-editing agent!',
        },
        null,
        2
      ),
      terminalLines: [
        {
          speaker: 'user',
          text: "Создай congrats.py для расшифровки ROT13: 'Pbatenghyngvbaf ba ohvyqvat n pbqr-rqvgvat ntrag!'",
        },
        { speaker: 'model', text: 'Создаю скрипт congrats.py с расшифровкой ROT13.' },
        { speaker: 'tool', text: 'edit_file({"path": "congrats.py", "old_str": "", "new_str": "..."})' },
        {
          speaker: 'model',
          text: 'Готово! Запустите python congrats.py — на экране появится скрытое поздравление.',
        },
        { speaker: 'system', text: '$ python congrats.py -> Congratulations on building a code-editing agent!' },
      ],
      files: [...baseFiles, congratsFile],
    },
  ];
}
