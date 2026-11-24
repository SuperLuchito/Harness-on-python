import { FunctionDoc, SyntaxDoc } from '../types/guide';

export const FUNCTION_DOCS: Record<string, FunctionDoc> = {
  create_client: {
    id: 'create_client',
    name: 'create_client',
    file: 'provider.py',
    signature: 'def create_client():',
    oneLiner: 'Создаёт и настраивает подключение к выбранному ИИ-провайдеру.',
    whatItDoes:
      'Читает ваш ключ доступа из переменной окружения компьютера (чтобы не хранить секрет прямо в коде) и возвращает готовый объект клиента, который умеет отправлять HTTP-запросы к модели.',
    whyAgentNeedsIt:
      'Изолирует настройки подключения в одном месте. Если вы решите сменить Command Code GOAT на OpenAI, Anthropic или собственный прокси — менять придётся только эту функцию, а остальной агент останется нетронутым.',
    params: [],
    returns: 'Объект клиента SDK (OpenAI или Anthropic), готовый к отправке запросов.',
    methodsUsed: [
      {
        name: 'os.environ.get(...)',
        description:
          'Безопасно считывает переменную окружения по имени. Если её забыли задать, возвращает None вместо резкого падения программы.',
      },
      {
        name: 'raise ValueError(...)',
        description:
          'Выводит понятную ошибку сразу при старте, если ключ не найден, чтобы вы не искали причину в глубине логов.',
      },
      {
        name: 'OpenAI(api_key=..., base_url=...) / Anthropic(api_key=...)',
        description:
          'Создаёт клиент нужного провайдера. Параметр base_url направляет запросы в Command Code GOAT, ваш прокси или Google Gemini.',
      },
    ],
    relatedFunctions: ['ask_model', 'format_tools', 'run_agent'],
  },
  format_tools: {
    id: 'format_tools',
    name: 'format_tools',
    file: 'provider.py',
    signature: 'def format_tools(tools):',
    oneLiner: 'Переводит простое описание наших инструментов в формат, который понимает API провайдера.',
    whatItDoes:
      'Берёт наш единый список словарей инструментов (имя, описание, схема параметров) и упаковывает его в структуру, которую ждёт конкретный провайдер (формат OpenAI functions или Anthropic tools).',
    whyAgentNeedsIt:
      'У разных API немного отличаются названия полей JSON. Этот маленький переводчик позволяет один раз описать read_file, list_files и edit_file в agent.py и больше никогда не переписывать их под нового провайдера.',
    params: [
      {
        name: 'tools',
        typeLabel: 'list[dict]',
        description: 'Список наших инструментов в простом едином формате.',
      },
    ],
    returns: 'Новый список словарей, готовый для передачи в запрос к модели.',
    methodsUsed: [
      {
        name: 'result.append(...)',
        description: 'Добавляет каждый сконвертированный инструмент в конец итогового списка.',
      },
    ],
    relatedFunctions: ['ask_model', 'create_client'],
  },
  ask_model: {
    id: 'ask_model',
    name: 'ask_model',
    file: 'provider.py',
    signature: 'def ask_model(client, conversation, tools=None):',
    oneLiner: 'Отправляет всю историю переписки модели и возвращает единый понятный ответ.',
    whatItDoes:
      'Посылает список сообщений (и список доступных инструментов, если они переданы) в облако, дожидается ответа и превращает его в простой словарь с тремя полями: text (слова модели), tool_calls (какие инструменты она просит вызвать) и raw_message (сырое сообщение для сохранения в историю).',
    whyAgentNeedsIt:
      'Это «мост» между вашим терминалом и языковой моделью. Благодаря единому формату ответа цикл run_agent() одинаково работает с Command Code GOAT, OpenAI, Claude и Gemini.',
    params: [
      {
        name: 'client',
        typeLabel: 'SDK Client',
        description: 'Клиент, созданный функцией create_client().',
      },
      {
        name: 'conversation',
        typeLabel: 'list[dict]',
        description: 'Вся история диалога с самого начала — сервер ничего не помнит сам.',
      },
      {
        name: 'tools',
        typeLabel: 'list[dict] | None',
        description: 'Необязательный список инструментов, которыми модель может воспользоваться.',
      },
    ],
    returns: 'Словарь {"text": str, "tool_calls": list, "raw_message": dict}.',
    methodsUsed: [
      {
        name: 'client.chat.completions.create(...) / client.messages.create(...)',
        description: 'Отправляет сетевой запрос к выбранной модели с историей сообщений и схемами инструментов.',
      },
      {
        name: 'json.loads(...)',
        description: 'Превращает текстовую JSON-строку аргументов от модели в обычный Python-словарь.',
      },
    ],
    relatedFunctions: ['create_client', 'format_tools', 'run_agent', 'make_tool_result_message'],
  },
  make_tool_result_message: {
    id: 'make_tool_result_message',
    name: 'make_tool_result_message',
    file: 'provider.py',
    signature: 'def make_tool_result_message(tool_call_id, result_text, is_error=False):',
    oneLiner: 'Упаковывает результат работы инструмента в сообщение для истории диалога.',
    whatItDoes:
      'Когда мы выполнили инструмент (например, прочитали файл), модель должна узнать, к какому именно запросу относится этот ответ. Функция привязывает текст результата к идентификатору tool_call_id в формате выбранного провайдера.',
    whyAgentNeedsIt:
      'OpenAI-совместимые провайдеры ждут роль "tool", а Anthropic — блок "tool_result" внутри роли "user". Вынесение этой детали в provider.py сохраняет agent.py простым и универсальным.',
    params: [
      {
        name: 'tool_call_id',
        typeLabel: 'str',
        description: 'Уникальный номер вызова, который прислала модель.',
      },
      {
        name: 'result_text',
        typeLabel: 'str',
        description: 'Текст результата (содержимое файла, список файлов или текст ошибки).',
      },
      {
        name: 'is_error',
        typeLabel: 'bool',
        description: 'Флаг: True, если инструмент завершился с ошибкой.',
      },
    ],
    returns: 'Словарь сообщения, готовый для добавления в список conversation.',
    methodsUsed: [
      {
        name: 'dict (...)',
        description: 'Собирает обычный словарь с нужными ключами для API провайдера.',
      },
    ],
    relatedFunctions: ['ask_model', 'execute_tool', 'run_agent'],
  },
  get_user_message: {
    id: 'get_user_message',
    name: 'get_user_message',
    file: 'agent.py',
    signature: 'def get_user_message():',
    oneLiner: 'Аккуратно считывает очередную реплику пользователя из терминала.',
    whatItDoes:
      'Печатает синее приглашение «Вы: », ждёт, пока вы наберёте сообщение и нажмёте Enter. Если вы нажали Ctrl+C или Ctrl+D для выхода, спокойно возвращает None вместо громоздкой ошибки.',
    whyAgentNeedsIt:
      'Отделяет чтение пользовательского ввода от основной логики агента — так цикл run_agent() остаётся чистым, а при желании консоль легко заменить на Telegram-бота или веб-чат.',
    params: [],
    returns: 'Строку с вашим сообщением или None, если пора завершить программу.',
    methodsUsed: [
      {
        name: 'input(...)',
        description: 'Стандартная функция Python, которая выводит приглашение и ждёт ввод текста с клавиатуры.',
      },
      {
        name: 'try / except (EOFError, KeyboardInterrupt)',
        description: 'Перехватывает нажатие Ctrl+C или закрытие потока ввода, чтобы программа завершалась красиво.',
      },
    ],
    relatedFunctions: ['run_agent'],
  },
  run_agent: {
    id: 'run_agent',
    name: 'run_agent',
    file: 'agent.py',
    signature: 'def run_agent(client, tools):',
    oneLiner: 'Главный цикл агента — сердцебиение всей программы.',
    whatItDoes:
      'Хранит список conversation (память диалога) и крутит бесконечный цикл while True. Если сейчас очередь человека — спрашивает ввод. Затем отправляет историю модели. Если модель ответила текстом — печатает его и снова ждёт человека. Если модель попросила вызвать инструменты — запускает их, добавляет результаты в историю и сразу же снова обращается к модели, не тревожа пользователя.',
    whyAgentNeedsIt:
      'Именно переменная read_user_input (читать ввод человека или сразу вернуть результат инструмента модели) превращает обычный чат-бот в автономного агента, способного делать много шагов подряд.',
    params: [
      {
        name: 'client',
        typeLabel: 'SDK Client',
        description: 'Настроенный клиент выбранного провайдера.',
      },
      {
        name: 'tools',
        typeLabel: 'list[dict]',
        description: 'Список доступных инструментов (read_file, list_files, edit_file).',
      },
    ],
    returns: 'Ничего (None) — работает в цикле, пока пользователь не выйдет.',
    methodsUsed: [
      {
        name: 'conversation.append(...)',
        description: 'Дописывает каждое новое сообщение (человека, модели или инструмента) в конец истории.',
      },
      {
        name: 'ask_model(...)',
        description: 'Отправляет накопленную историю языковой модели.',
      },
      {
        name: 'execute_tool(...)',
        description: 'Находит и запускает запрошенный моделью инструмент на вашем диске.',
      },
    ],
    relatedFunctions: ['get_user_message', 'ask_model', 'execute_tool'],
  },
  execute_tool: {
    id: 'execute_tool',
    name: 'execute_tool',
    file: 'agent.py',
    signature: 'def execute_tool(tools, name, args):',
    oneLiner: 'Находит нужный инструмент по имени, запускает его и перехватывает ошибки.',
    whatItDoes:
      'Ищет в списке tools инструмент, у которого поле "name" совпадает с запросом модели. Если находит — печатает зелёную строку-лог в терминал, вызывает привязанную Python-функцию с аргументами args и возвращает (текст_ответа, флаг_ошибки).',
    whyAgentNeedsIt:
      'Модель может ошибиться (например, попросить несуществующий файл). Вместо того чтобы уронить всю программу, execute_tool ловит исключение и вежливо сообщает текст ошибки обратно модели — и та часто сама исправляется!',
    params: [
      {
        name: 'tools',
        typeLabel: 'list[dict]',
        description: 'Реестр всех зарегистрированных инструментов.',
      },
      {
        name: 'name',
        typeLabel: 'str',
        description: 'Имя инструмента, которое прислала модель (например, "read_file").',
      },
      {
        name: 'args',
        typeLabel: 'dict',
        description: 'Словарь параметров для инструмента (например, {"path": "agent.py"}).',
      },
    ],
    returns: 'Кортеж (result_text, is_error): строку с результатом и True/False, была ли ошибка.',
    methodsUsed: [
      {
        name: 'try / except Exception as error',
        description: 'Ловит любые ошибки внутри инструмента (нет файла, нет прав) и возвращает их модельке как обычный текст.',
      },
      {
        name: 'json.dumps(args, ensure_ascii=False)',
        description: 'Красиво превращает словарь аргументов в строку для вывода в терминал, сохраняя кириллицу читаемой.',
      },
    ],
    relatedFunctions: ['run_agent', 'read_file', 'list_files', 'edit_file'],
  },
  read_file: {
    id: 'read_file',
    name: 'read_file',
    file: 'agent.py',
    signature: 'def read_file(args):',
    oneLiner: 'Читает текстовый файл с диска и возвращает его содержимое строкой.',
    whatItDoes:
      'Достаёт путь к файлу из args["path"], открывает файл в кодировке UTF-8 и считывает весь его текст. После выхода из блока with файл автоматически закрывается.',
    whyAgentNeedsIt:
      'Это «глаза» агента. Без чтения файлов модель не может посмотреть на ваш код, загадку в secret-file.txt или список зависимостей проекта.',
    params: [
      {
        name: 'args',
        typeLabel: 'dict',
        description: 'Словарь от модели с обязательным ключом "path".',
      },
    ],
    returns: 'Строку со всем содержимым файла.',
    methodsUsed: [
      {
        name: 'open(file_path, "r", encoding="utf-8")',
        description: 'Открывает файл в режиме чтения ("r") с поддержкой русского языка и любых символов Юникода.',
      },
      {
        name: 'file.read()',
        description: 'Считывает весь текст файла в одну строку.',
      },
    ],
    relatedFunctions: ['execute_tool', 'list_files', 'edit_file'],
  },
  list_files: {
    id: 'list_files',
    name: 'list_files',
    file: 'agent.py',
    signature: 'def list_files(args):',
    oneLiner: 'Показывает список файлов и подпапок в указанной директории.',
    whatItDoes:
      'Берёт путь из args.get("path", ".") (если путь не указан — текущая папка), рекурсивно обходит её с помощью os.walk, пропускает служебные папки (.git, venv, __pycache__), добавляет слэш "/" к именам папок и возвращает список в формате JSON.',
    whyAgentNeedsIt:
      'Позволяет агенту «осмотреться» в проекте, как это делает человек командой ls, прежде чем решать, какие файлы читать или редактировать.',
    params: [
      {
        name: 'args',
        typeLabel: 'dict',
        description: 'Словарь с необязательным ключом "path" (по умолчанию ".").',
      },
    ],
    returns: 'JSON-строку со списком относительных путей файлов и папок.',
    methodsUsed: [
      {
        name: 'os.walk(base_dir)',
        description: 'Обходит папку и все вложенные подпапки, выдавая на каждом шаге (текущая_папка, список_подпапок, список_файлов).',
      },
      {
        name: 'os.path.join(...) / os.path.relpath(...)',
        description: 'Аккуратно склеивает пути (работает на Windows, macOS и Linux) и делает их короткими относительно корня.',
      },
      {
        name: 'json.dumps(items, ensure_ascii=False)',
        description: 'Превращает Python-список в компактную JSON-строку, которую легко читает модель.',
      },
    ],
    relatedFunctions: ['read_file', 'edit_file', 'execute_tool'],
  },
  edit_file: {
    id: 'edit_file',
    name: 'edit_file',
    file: 'agent.py',
    signature: 'def edit_file(args):',
    oneLiner: 'Редактирует существующий файл заменой текста или создаёт новый файл.',
    whatItDoes:
      'Проверяет, что путь задан и old_str отличается от new_str. Если файла ещё нет и old_str пустой — вызывает create_new_file(). Иначе читает файл, проверяет, что old_str действительно найден внутри, заменяет его на new_str и сохраняет файл обратно на диск.',
    whyAgentNeedsIt:
      'Это «руки» агента. Простая замена точной подстроки (search & replace) удивительно надёжна: модель не тратит лишние токены на переписывание всего файла целиком и редко ломает соседние строки.',
    params: [
      {
        name: 'args',
        typeLabel: 'dict',
        description: 'Словарь с ключами "path", "old_str" и "new_str".',
      },
    ],
    returns: 'Строку "OK" при успешной правке или сообщение о создании нового файла.',
    methodsUsed: [
      {
        name: 'os.path.exists(file_path)',
        description: 'Проверяет, существует ли уже файл по этому пути на диске.',
      },
      {
        name: 'old_content.replace(old_str, new_str, 1)',
        description: 'Заменяет первое точное вхождение old_str на new_str, не затрагивая остальной текст.',
      },
      {
        name: 'open(file_path, "w", encoding="utf-8")',
        description: 'Открывает файл на перезапись ("w") и сохраняет обновлённый текст.',
      },
    ],
    relatedFunctions: ['create_new_file', 'read_file', 'list_files'],
  },
  create_new_file: {
    id: 'create_new_file',
    name: 'create_new_file',
    file: 'agent.py',
    signature: 'def create_new_file(file_path, content):',
    oneLiner: 'Создаёт новый файл и автоматически создаёт все недостающие папки по пути.',
    whatItDoes:
      'Выделяет имя родительской папки через os.path.dirname(). Если папка указана, создаёт её через os.makedirs(..., exist_ok=True), а затем записывает туда новый файл с переданным текстом.',
    whyAgentNeedsIt:
      'В Python эта вспомогательная функция занимает всего 6 чистых строк. Благодаря ей агент может создавать файлы вроде utils/helpers.py, даже если папки utils ещё не существует.',
    params: [
      {
        name: 'file_path',
        typeLabel: 'str',
        description: 'Относительный путь к новому файлу.',
      },
      {
        name: 'content',
        typeLabel: 'str',
        description: 'Текст (или код), который нужно записать внутрь.',
      },
    ],
    returns: 'Подтверждение «Файл ... успешно создан».',
    methodsUsed: [
      {
        name: 'os.path.dirname(file_path)',
        description: 'Отделяет путь к папке от имени файла (например, из "src/app.py" вернёт "src").',
      },
      {
        name: 'os.makedirs(folder, exist_ok=True)',
        description: 'Создаёт папку (и все промежуточные папки), не выдавая ошибку, если она уже существует.',
      },
    ],
    relatedFunctions: ['edit_file'],
  },
  verify_virtual_key: {
    id: 'verify_virtual_key',
    name: 'verify_virtual_key',
    file: 'goat_proxy.py',
    signature: 'def verify_virtual_key(auth_header):',
    oneLiner: 'Проверяет виртуальный ключ ученика или коллеги из заголовка Authorization.',
    whatItDoes:
      'Вытаскивает токен после слова "Bearer " из HTTP-заголовка и сверяет его с вашим словарём VIRTUAL_KEYS. Если ключ неизвестен — возвращает None, и прокси отвечает статусом 401.',
    whyAgentNeedsIt:
      'Позволяет делиться лимитами вашей подписки Command Code GOAT с другими людьми безопасно: ваш настоящий мастер-ключ никогда не покидает сервер.',
    params: [
      {
        name: 'auth_header',
        typeLabel: 'str',
        description: 'Значение HTTP-заголовка Authorization из входящего запроса.',
      },
    ],
    returns: 'Словарь профиля пользователя (имя, дневной лимит) или None.',
    methodsUsed: [
      {
        name: 'auth_header.replace("Bearer ", "").strip()',
        description: 'Убирает префикс Bearer и случайные пробелы по краям токена.',
      },
      {
        name: 'VIRTUAL_KEYS.get(token)',
        description: 'Мгновенно ищет токен в словаре разрешённых ключей.',
      },
    ],
    relatedFunctions: ['check_quota', 'forward_to_goat'],
  },
  check_quota: {
    id: 'check_quota',
    name: 'check_quota',
    file: 'goat_proxy.py',
    signature: 'def check_quota(token, limit):',
    oneLiner: 'Считает, сколько запросов сделал пользователь сегодня, и не даёт превысить лимит.',
    whatItDoes:
      'Использует сегодняшнюю дату как ключ счётчика. Если число запросов по этому виртуальному ключу уже достигло дневного лимита — возвращает False (прокси отдаст 429 Too Many Requests). Иначе увеличивает счётчик на 1 и разрешает запрос.',
    whyAgentNeedsIt:
      'Защищает вашу подписку GOAT от случайного бесконечного цикла в коде ученика или чрезмерного расхода кредитов одним пользователем.',
    params: [
      {
        name: 'token',
        typeLabel: 'str',
        description: 'Виртуальный ключ пользователя.',
      },
      {
        name: 'limit',
        typeLabel: 'int',
        description: 'Максимальное число запросов в сутки для этого ключа.',
      },
    ],
    returns: 'True, если лимит не исчерпан, или False, если лимит превышен.',
    methodsUsed: [
      {
        name: 'date.today().isoformat()',
        description: 'Возвращает текущую дату в формате "2026-11-24", чтобы лимиты автоматически сбрасывались каждый новый день.',
      },
    ],
    relatedFunctions: ['verify_virtual_key', 'forward_to_goat'],
  },
  forward_to_goat: {
    id: 'forward_to_goat',
    name: 'forward_to_goat',
    file: 'goat_proxy.py',
    signature: 'def forward_to_goat(request_body):',
    oneLiner: 'Пересылает запрос в Command Code GOAT API, подставляя ваш настоящий ключ подписки.',
    whatItDoes:
      'Берёт тело JSON-запроса от агента, добавляет заголовок Authorization: Bearer <ваш COMMAND_CODE_API_KEY>, отправляет POST-запрос на https://api.commandcode.ai/provider/v1/chat/completions и возвращает сырой ответ обратно клиенту.',
    whyAgentNeedsIt:
      'Это сердце коннектора-шлюза: для агента прокси выглядит как обычный OpenAI API, а оплата и списание токенов идут строго с вашей подписки Command Code GOAT.',
    params: [
      {
        name: 'request_body',
        typeLabel: 'bytes',
        description: 'Сырой JSON-запрос от клиента OpenAI SDK.',
      },
    ],
    returns: 'Кортеж (status_code, response_bytes) от сервера Command Code.',
    methodsUsed: [
      {
        name: 'urllib.request.Request(...) / urlopen(...)',
        description: 'Встроенный в Python HTTP-клиент — работает без установки дополнительных библиотек.',
      },
    ],
    relatedFunctions: ['verify_virtual_key', 'check_quota'],
  },
};

export const SYNTAX_DOCS: Record<string, SyntaxDoc> = {
  def: {
    id: 'def',
    token: 'def',
    title: 'def — Объявление функции',
    category: 'basics',
    shortSummary:
      'Ключевое слово def (от слова define — «определить») создаёт именованный блок кода, который можно вызывать много раз по имени.',
    analogy: 'Как записать рецепт в кулинарную книгу один раз, а потом просто говорить: «приготовь омлет».',
    miniExample: 'def greet(name):\n    return "Привет, " + name',
  },
  import: {
    id: 'import',
    token: 'import',
    title: 'import — Подключение модуля',
    category: 'modules',
    shortSummary:
      'Подключает готовую библиотеку (встроенную в Python, как os и json, или установленную через pip, как openai).',
    analogy: 'Как достать ящик с готовыми инструментами из кладовки, чтобы не мастерить молоток с нуля.',
    miniExample: 'import os\nprint(os.getcwd())',
  },
  from: {
    id: 'from',
    token: 'from',
    title: 'from ... import — Выборочный импорт',
    category: 'modules',
    shortSummary:
      'Забирает из библиотеки только одну конкретную функцию или класс, а не всю библиотеку целиком.',
    analogy: 'Вместо всего ящика инструментов взять только одну отвёртку.',
    miniExample: 'from openai import OpenAI\nclient = OpenAI()',
  },
  return: {
    id: 'return',
    token: 'return',
    title: 'return — Возврат результата',
    category: 'basics',
    shortSummary:
      'Завершает работу функции и отдаёт вычисленное значение тому месту в программе, откуда функцию вызвали.',
    analogy: 'Официант приносит готовое блюдо с кухни обратно к вашему столику.',
    miniExample: 'def add(a, b):\n    return a + b',
  },
  while_true: {
    id: 'while_true',
    token: 'while True',
    title: 'while True — Бесконечный цикл',
    category: 'control_flow',
    shortSummary:
      'Повторяет вложенный блок кода снова и снова, пока внутри не сработает команда break (выход из цикла) или return.',
    analogy: 'Как дежурный в чате: «пока не закроют смену, жди следующее сообщение и отвечай на него».',
    miniExample: 'while True:\n    text = input("> ")\n    if text == "выход": break',
  },
  for: {
    id: 'for',
    token: 'for',
    title: 'for ... in — Цикл перебора',
    category: 'control_flow',
    shortSummary:
      'По очереди проходит по каждому элементу списка (например, по каждому инструменту или каждому файлу в папке).',
    analogy: 'Как перебирать карточки в колоде одну за другой от первой до последней.',
    miniExample: 'for name in ["read_file", "edit_file"]:\n    print(name)',
  },
  if: {
    id: 'if',
    token: 'if',
    title: 'if / elif / else — Условие',
    category: 'control_flow',
    shortSummary:
      'Выполняет блок кода только тогда, когда условие истинно. elif проверяет запасное условие, а else срабатывает во всех остальных случаях.',
    analogy: 'Развилка на дороге: если идёт дождь — возьми зонт, иначе — иди так.',
    miniExample: 'if is_error:\n    print("Ошибка!")\nelse:\n    print("Готово")',
  },
  elif: {
    id: 'elif',
    token: 'elif',
    title: 'elif — «Иначе, если...»',
    category: 'control_flow',
    shortSummary:
      'Сокращение от else if. Проверяет второе условие, только если предыдущий if не сработал.',
    analogy: 'Если ключ от GOAT — идём туда, иначе если от Claude — идём к Anthropic.',
    miniExample: 'if score > 90:\n    grade = "A"\nelif score > 70:\n    grade = "B"',
  },
  else: {
    id: 'else',
    token: 'else',
    title: 'else — Ветка «Иначе»',
    category: 'control_flow',
    shortSummary:
      'Выполняется в том случае, если ни одно из предыдущих условий if/elif не оказалось верным.',
    analogy: 'Запасной план, когда все основные проверки не подошли.',
    miniExample: 'if path:\n    open_file(path)\nelse:\n    print("Путь не указан")',
  },
  try: {
    id: 'try',
    token: 'try',
    title: 'try / except — Безопасная обработка ошибок',
    category: 'control_flow',
    shortSummary:
      'Позволяет «попробовать» выполнить рискованный код (например, открыть файл или сходить в сеть). Если случится ошибка, программа не упадёт, а перейдёт в блок except.',
    analogy: 'Страховочная сетка под канатоходцем: даже если оступишься, шоу продолжится.',
    miniExample: 'try:\n    text = open("a.txt").read()\nexcept Exception as err:\n    print("Не вышло:", err)',
  },
  except: {
    id: 'except',
    token: 'except',
    title: 'except — Перехват ошибки',
    category: 'control_flow',
    shortSummary:
      'Срабатывает, только если внутри блока try возникла ошибка. Через «as error» можно получить сам текст этой ошибки.',
    analogy: 'План действий на случай, если нужного файла на диске не оказалось.',
    miniExample: 'except FileNotFoundError as err:\n    return f"Файл не найден: {err}"',
  },
  with_open: {
    id: 'with_open',
    token: 'with open',
    title: 'with open(...) as f — Безопасная работа с файлом',
    category: 'files_json',
    shortSummary:
      'Открывает файл и гарантирует, что Python сам автоматически закроет его сразу после выхода из блока — даже если внутри произойдёт ошибка.',
    analogy: 'Дверь с доводчиком: вы вошли, взяли нужное, вышли — дверь сама закрылась за вами.',
    miniExample: 'with open("notes.txt", "r", encoding="utf-8") as f:\n    text = f.read()',
  },
  none: {
    id: 'none',
    token: 'None',
    title: 'None — «Ничего / пустое значение»',
    category: 'data',
    shortSummary:
      'Специальное значение в Python, означающее отсутствие данных. Например, когда переменная окружения не найдена или пользователь нажал Ctrl+C.',
    analogy: 'Пустая коробка с аккуратной наклейкой «здесь пока ничего нет».',
    miniExample: 'api_key = os.environ.get("API_KEY")\nif api_key is None:\n    print("Ключ не задан")',
  },
  bool_true_false: {
    id: 'bool_true_false',
    token: 'True / False',
    title: 'True и False — Логические значения',
    category: 'data',
    shortSummary:
      'Булевы значения «истина» и «ложь». В Python всегда пишутся с заглавной буквы. Управляют условиями if и флагами вроде read_user_input.',
    analogy: 'Обычный выключатель света: либо включён (True), либо выключен (False).',
    miniExample: 'read_user_input = True\nif read_user_input:\n    ask_human()',
  },
  break: {
    id: 'break',
    token: 'break',
    title: 'break — Немедленный выход из цикла',
    category: 'control_flow',
    shortSummary:
      'Сразу останавливает текущий цикл while или for и переходит к коду после него.',
    analogy: 'Кнопка «Стоп» в лифте: выходим прямо на этом этаже.',
    miniExample: 'if user_text is None:\n    break',
  },
  continue: {
    id: 'continue',
    token: 'continue',
    title: 'continue — Переход к следующему шагу цикла',
    category: 'control_flow',
    shortSummary:
      'Пропускает оставшиеся строки внутри текущего витка цикла и сразу начинает новый виток сверху.',
    analogy: 'Пролистать пустую страницу в книге и перейти к следующей.',
    miniExample: 'if not user_text.strip():\n    continue',
  },
  raise: {
    id: 'raise',
    token: 'raise',
    title: 'raise — Явный вызов ошибки',
    category: 'control_flow',
    shortSummary:
      'Специально останавливает выполнение функции с понятным сообщением об ошибке (например, когда не задан API-ключ или old_str не найден в файле).',
    analogy: 'Поднять красную карточку сразу, как только замечено нарушение правил.',
    miniExample: 'if not path:\n    raise ValueError("Путь к файлу не указан")',
  },
  os_environ_get: {
    id: 'os_environ_get',
    token: 'os.environ.get',
    title: 'os.environ.get() — Чтение переменной окружения',
    category: 'modules',
    shortSummary:
      'Достаёт секретный ключ из настроек терминала/системы. Это золотое правило безопасности: ключи никогда не вписывают прямо в .py файл.',
    analogy: 'Взять пропуск из сейфа по названию, вместо того чтобы писать пароль на двери.',
    miniExample: 'key = os.environ.get("COMMAND_CODE_API_KEY")',
  },
  json_loads_dumps: {
    id: 'json_loads_dumps',
    token: 'json.loads / json.dumps',
    title: 'json.loads() и json.dumps() — Работа с JSON',
    category: 'files_json',
    shortSummary:
      'json.loads превращает текстовую JSON-строку в Python-словарь, а json.dumps делает обратное — превращает словарь или список в строку.',
    analogy: 'Распаковать посылку (loads) и упаковать вещи обратно в коробку (dumps).',
    miniExample: 'data = json.loads(\'{"path": "agent.py"}\')\nprint(data["path"])',
  },
  os_walk: {
    id: 'os_walk',
    token: 'os.walk',
    title: 'os.walk() — Обход всех папок и файлов',
    category: 'files_json',
    shortSummary:
      'Встроенная функция модуля os, которая заходит в папку и во все вложенные подпапки, на каждом уровне отдавая списки подпапок и файлов.',
    analogy: 'Как обойти все комнаты в доме и записать все предметы на каждом столе.',
    miniExample: 'for root, dirs, files in os.walk("."):\n    print(root, files)',
  },
  append: {
    id: 'append',
    token: '.append',
    title: '.append() — Добавить элемент в конец списка',
    category: 'data',
    shortSummary:
      'Дописывает новый элемент в конец списка (list). Именно так растёт наша история сообщений conversation с каждой репликой.',
    analogy: 'Приклеить ещё один стикер в конец длинной ленты переписки.',
    miniExample: 'messages = []\nmessages.append({"role": "user", "content": "Привет"})',
  },
  dict_get: {
    id: 'dict_get',
    token: '.get',
    title: '.get() — Безопасное чтение из словаря',
    category: 'data',
    shortSummary:
      'Возвращает значение по ключу словаря, а если такого ключа нет — возвращает запасное значение (по умолчанию None), не вызывая ошибку KeyError.',
    analogy: 'Спросить «есть ли путь? Если нет — используй текущую папку "."».',
    miniExample: 'folder = args.get("path", ".")',
  },
  fstring: {
    id: 'fstring',
    token: 'f"..."',
    title: 'f-строка — Удобная подстановка переменных в текст',
    category: 'data',
    shortSummary:
      'Если поставить букву f прямо перед кавычками, всё, что написано внутри фигурных скобок {переменная}, автоматически подставится в строку.',
    analogy: 'Бланк с пустыми окошками, куда Python сам вписывает актуальные значения.',
    miniExample: 'name = "read_file"\nprint(f"Запускаю инструмент: {name}")',
  },
  main_guard: {
    id: 'main_guard',
    token: 'if __name__ == "__main__":',
    title: 'if __name__ == "__main__": — Точка входа в скрипт',
    category: 'modules',
    shortSummary:
      'Означает: «запускай этот код, только если файл запущен напрямую командой python agent.py, а не импортирован из другого файла».',
    analogy: 'Кнопка «Старт», которая нажимается только когда вы открыли саму программу.',
    miniExample: 'if __name__ == "__main__":\n    run_agent(client, TOOLS)',
  },
};

export const SYNTAX_CATEGORY_LABELS: Record<SyntaxDoc['category'], string> = {
  basics: 'Основы и функции',
  control_flow: 'Циклы, условия и ошибки',
  data: 'Списки, словари и строки',
  files_json: 'Файлы и JSON',
  modules: 'Модули и запуск',
};
