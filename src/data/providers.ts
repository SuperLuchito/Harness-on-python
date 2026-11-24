import { ProviderConfig, ProviderId } from '../types/guide';

export const PROVIDERS: Record<ProviderId, ProviderConfig> = {
  command_code_goat: {
    id: 'command_code_goat',
    shortName: 'Command Code GOAT',
    title: 'Подписка Command Code GOAT (Provider API)',
    subtitle: 'Использует квоту вашей подписки GOAT напрямую через официальный шлюз api.commandcode.ai',
    authType: 'subscription',
    authLabel: 'Подписка GOAT',
    pipPackage: 'openai',
    envVar: 'COMMAND_CODE_API_KEY',
    envPlaceholder: 'user_ваш_ключ_из_command_code_studio',
    baseUrl: 'https://api.commandcode.ai/provider/v1',
    protocol: 'openai_compat',
    models: [
      {
        id: 'deepseek/deepseek-v4.1-flash',
        label: 'DeepSeek V4.1 Flash',
        note: 'Свежий чекпоинт, 1M контекст, быстрая и дешёвая база для агента',
      },
      {
        id: 'z-ai/glm-5.3-flash',
        label: 'GLM-5.3 Flash',
        note: '~$0.15/M input, 1M контекст, сильна в терминальных задачах и правке кода',
      },
      {
        id: 'qwen/qwen3.8-flash',
        label: 'Qwen 3.8 Flash',
        note: 'Сверхбыстрая бюджетная модель с уверенным tool calling',
      },
      {
        id: 'tencent/hy4-flash',
        label: 'HY4 Flash',
        note: '~$0.07/M input, $0.003/M кэш, 1M контекст, 150+ ток/с — сверхбюджетная модель',
      },
    ],
    defaultModel: 'deepseek/deepseek-v4.1-flash',
    assistantDisplayName: 'Агент (GOAT)',
    setupSummary:
      'Подписка Command Code GOAT ($10/мес, до $70–100+ в кредитах) даёт доступ к 30+ быстрым и доступным моделям через стандартный OpenAI-совместимый адрес. Используется обычная библиотека openai — меняется только base_url.',
    keyHowTo:
      'Откройте Command Code Studio -> раздел API Keys -> создайте ключ (обычно начинается с user_...) и сохраните его в переменную COMMAND_CODE_API_KEY.',
    extensibilityNote:
      'Поскольку Command Code Provider API совместим со стандартом OpenAI, переключение на любую из 30+ моделей сводится к замене одной строки MODEL_NAME.',
  },
  goat_shared_proxy: {
    id: 'goat_shared_proxy',
    shortName: 'Свой GOAT-прокси',
    title: 'Коннектор-прокси для раздачи вашей подписки GOAT',
    subtitle: 'Выдавайте ученикам или команде виртуальные ключи с лимитами, не раскрывая свой основной ключ',
    authType: 'proxy',
    authLabel: 'Общий доступ по лимитам',
    pipPackage: 'openai',
    envVar: 'PROXY_ACCESS_KEY',
    envPlaceholder: 'student_alice_2026',
    baseUrl: 'http://localhost:8080/v1',
    protocol: 'openai_compat',
    models: [
      {
        id: 'deepseek/deepseek-v4.1-flash',
        label: 'DeepSeek V4.1 Flash (прокси)',
        note: 'Быстрая модель по умолчанию — бережёт квоты всей группы',
      },
      {
        id: 'z-ai/glm-5.3-flash',
        label: 'GLM-5.3 Flash (прокси)',
        note: 'Очень дешёвый кэш ($0.03/M) и 1M контекст для учебных проектов',
      },
      {
        id: 'qwen/qwen3.8-flash',
        label: 'Qwen 3.8 Flash (прокси)',
        note: 'Минимальная задержка и низкий расход лимита на группу',
      },
      {
        id: 'tencent/hy4-flash',
        label: 'HY4 Flash (прокси)',
        note: '~$0.07/M input и 150+ ток/с — максимум запросов на одного ученика',
      },
    ],
    defaultModel: 'deepseek/deepseek-v4.1-flash',
    assistantDisplayName: 'Агент (Прокси)',
    setupSummary:
      'Агент ученика стучится на ваш локальный или облачный шлюз (goat_proxy.py или cmdcode2api). Шлюз проверяет виртуальный ключ и дневной лимит, а затем отправляет запрос в Command Code GOAT от имени вашей подписки.',
    keyHowTo:
      'Запустите goat_proxy.py из раздела «GOAT-прокси» (в нём хранится ваш COMMAND_CODE_API_KEY), а ученику отдайте только виртуальный ключ вида student_alice_2026 и адрес сервера.',
    extensibilityNote:
      'Ученику вообще не нужно знать, какой провайдер стоит за вашим шлюзом: завтра вы можете поменять GOAT на OpenRouter или локальный Locals на Mac, не трогая код агента.',
  },
  locals: {
    id: 'locals',
    shortName: 'Locals (Apple Silicon)',
    title: 'Locals — локальный сервер LLM на Apple Silicon',
    subtitle: 'Запускает Inkling 2 Mini локально через MLX/Metal с OpenAI-совместимым API без оплаты за токены',
    authType: 'local',
    authLabel: 'Локально · 127.0.0.1',
    pipPackage: 'openai',
    envVar: 'LOCALS_API_KEY',
    envPlaceholder: 'local',
    baseUrl: 'http://127.0.0.1:8321/v1',
    protocol: 'openai_compat',
    models: [
      {
        id: 'locals/inkling-2-mini-mlx-nvfp4',
        label: 'Inkling 2 Mini (NVFP4)',
        note: 'Основная локальная MLX-сборка с DSpark, Streaming и Tool Calling',
      },
      {
        id: 'locals/inkling-2-mini-mlx-nvfp4-thinking',
        label: 'Inkling 2 Mini (Thinking)',
        note: 'Вариант с расширенными рассуждениями (reasoning_content) для сложных правок',
      },
    ],
    defaultModel: 'locals/inkling-2-mini-mlx-nvfp4',
    assistantDisplayName: 'Агент (Locals)',
    setupSummary:
      'Locals поднимает локальный OpenAI-совместимый сервер на http://127.0.0.1:8321/v1 поверх MLX/Metal. Наш Harness подключается к нему через обычный openai SDK — без облачных ключей и оплаты за токены.',
    keyHowTo:
      'Облачный ключ не нужен: достаточно передать фиктивную строку "local" для совместимости с OpenAI SDK и запустить локальный сервер командой locals start.',
    extensibilityNote:
      'Тот же файл agent.py работает с Locals без изменений: меняется только BASE_URL, MODEL_NAME и api_key="local" в provider.py.',
  },
  openai_compatible: {
    id: 'openai_compatible',
    shortName: 'OpenAI / OpenRouter',
    title: 'OpenAI API или любой OpenAI-совместимый ключ',
    subtitle: 'Подходит для OpenAI, OpenRouter, DeepSeek, Groq, Together и локальных серверов (Ollama / LM Studio)',
    authType: 'api_key',
    authLabel: 'API-ключ',
    pipPackage: 'openai',
    envVar: 'OPENAI_API_KEY',
    envPlaceholder: 'sk-ваш_api_ключ',
    baseUrl: 'https://api.openai.com/v1',
    protocol: 'openai_compat',
    models: [
      {
        id: 'gpt-4.1-mini',
        label: 'GPT-4.1 Mini',
        note: 'Быстрая, доступная и точно следует схемам инструментов',
      },
      {
        id: 'gpt-4.1-nano',
        label: 'GPT-4.1 Nano',
        note: 'Ультрадешёвый вариант для тестов и первых запусков',
      },
      {
        id: 'deepseek/deepseek-v4.1-flash',
        label: 'DeepSeek V4.1 Flash (OpenRouter)',
        note: 'Укажите base_url="https://openrouter.ai/api/v1"',
      },
    ],
    defaultModel: 'gpt-4.1-mini',
    assistantDisplayName: 'Агент (GPT)',
    setupSummary:
      'Самый универсальный стандарт в индустрии: один и тот же клиент openai работает с десятками провайдеров — достаточно поменять base_url и ключ.',
    keyHowTo:
      'Получите ключ в кабинете platform.openai.com или openrouter.ai и задайте переменную окружения OPENAI_API_KEY.',
    extensibilityNote:
      'Для перехода на OpenRouter просто укажите base_url="https://openrouter.ai/api/v1", для локальной Ollama — "http://localhost:11434/v1".',
  },
  anthropic: {
    id: 'anthropic',
    shortName: 'Anthropic (Claude)',
    title: 'Anthropic API (нативный Claude SDK)',
    subtitle: 'Официальный Python SDK Anthropic с нативным протоколом tool_use / tool_result',
    authType: 'api_key',
    authLabel: 'API-ключ',
    pipPackage: 'anthropic',
    envVar: 'ANTHROPIC_API_KEY',
    envPlaceholder: 'sk-ant-ваш_ключ',
    baseUrl: null,
    protocol: 'anthropic_native',
    models: [
      {
        id: 'claude-3-5-haiku-latest',
        label: 'Claude Haiku (быстрая)',
        note: 'Быстрая и экономичная модель для нативного Anthropic SDK',
      },
      {
        id: 'claude-sonnet-4-20250514',
        label: 'Claude Sonnet 4',
        note: 'Старшая модель для сложных многошаговых правок кода',
      },
    ],
    defaultModel: 'claude-3-5-haiku-latest',
    assistantDisplayName: 'Claude',
    setupSummary:
      'Прямое подключение к API Anthropic через их официальный SDK. Использует нативный формат tool_use и tool_result, а мой файл provider.py аккуратно переводит его в тот же простой формат, что и для остальных провайдеров.',
    keyHowTo:
      'Создайте API-ключ в console.anthropic.com и сохраните его в переменную ANTHROPIC_API_KEY.',
    extensibilityNote:
      'Даже если вы начали с нативного Anthropic SDK, файл agent.py не меняется ни на строчку — вся разница изолирована внутри provider.py.',
  },
  gemini: {
    id: 'gemini',
    shortName: 'Google Gemini',
    title: 'Google Gemini API (OpenAI-совместимый режим)',
    subtitle: 'Подключение Gemini 2.5 через официальный OpenAI-совместимый эндпоинт Google AI',
    authType: 'api_key',
    authLabel: 'API-ключ',
    pipPackage: 'openai',
    envVar: 'GEMINI_API_KEY',
    envPlaceholder: 'AIzaSy_ваш_ключ',
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai/',
    protocol: 'openai_compat',
    models: [
      {
        id: 'gemini-2.5-flash',
        label: 'Gemini 2.5 Flash',
        note: 'Мгновенные ответы, щедрый бесплатный лимит, отличный tool calling',
      },
      {
        id: 'gemini-2.5-pro',
        label: 'Gemini 2.5 Pro',
        note: 'Глубокий анализ кода и многошаговые правки',
      },
    ],
    defaultModel: 'gemini-2.5-flash',
    assistantDisplayName: 'Gemini',
    setupSummary:
      'Google поддерживает официальный OpenAI-совместимый эндпоинт для Gemini — значит, новичкам не нужно учить ещё один SDK, достаточно одного адреса base_url.',
    keyHowTo:
      'Получите бесплатный API-ключ в Google AI Studio (aistudio.google.com) и задайте переменную GEMINI_API_KEY.',
    extensibilityNote:
      'Благодаря единому адаптеру provider.py вы можете тестировать одного и того же агента на Gemini, GOAT и OpenAI за 5 секунд.',
  },
};

export const PROVIDER_ORDER: ProviderId[] = [
  'command_code_goat',
  'goat_shared_proxy',
  'locals',
  'openai_compatible',
  'anthropic',
  'gemini',
];
