import { PROVIDERS } from '../data/providers';
import { ProviderId, VirtualKeyEntry } from '../types/guide';

export interface ProviderCodeBundle {
  setupCommands: string;
  envExportCommand: string;
  providerSimpleCode: string;
  agentSimpleCode: string;
  providerWithToolsCode: string;
  readFileToolCode: string;
  agentLoopWithToolsCode: string;
  listFilesToolCode: string;
  editFileToolCode: string;
  fullAgentCode: string;
  requirementsTxt: string;
  goatProxyCode: string;
}

export const DEFAULT_VIRTUAL_KEYS: VirtualKeyEntry[] = [
  { id: 'vk-1', label: 'Ученик Алиса', token: 'student_alice_2026', dailyLimit: 40 },
  { id: 'vk-2', label: 'Ученик Максим', token: 'student_maxim_2026', dailyLimit: 40 },
  { id: 'vk-3', label: 'Демо-доступ (команда)', token: 'team_demo_key', dailyLimit: 100 },
];

function buildProviderSimpleCode(providerId: ProviderId, model: string): string {
  const cfg = PROVIDERS[providerId];

  if (cfg.protocol === 'anthropic_native') {
    return `# provider.py — подключение к Anthropic (Claude)
import os
from anthropic import Anthropic

MODEL_NAME = "${model}"


def create_client():
    api_key = os.environ.get("${cfg.envVar}")
    if not api_key:
        raise ValueError("Сначала задайте переменную ${cfg.envVar}")
    return Anthropic(api_key=api_key)


def ask_model(client, conversation):
    response = client.messages.create(
        model=MODEL_NAME,
        max_tokens=1024,
        messages=conversation,
    )
    text = response.content[0].text
    return {
        "text": text,
        "raw_message": {"role": "assistant", "content": response.content},
    }`;
  }

  const headerComment =
    providerId === 'command_code_goat'
      ? '# provider.py — подключение подписки Command Code GOAT'
      : providerId === 'goat_shared_proxy'
        ? '# provider.py — подключение через ваш GOAT-прокси (виртуальный ключ)'
        : providerId === 'locals'
          ? '# provider.py — подключение локального сервера Locals (Apple Silicon)'
          : providerId === 'gemini'
            ? '# provider.py — подключение Google Gemini (OpenAI-совместимый адрес)'
            : '# provider.py — подключение OpenAI / OpenRouter API';

  const baseUrlLine =
    providerId === 'goat_shared_proxy'
      ? `BASE_URL = os.environ.get("PROXY_BASE_URL", "${cfg.baseUrl}")`
      : `BASE_URL = "${cfg.baseUrl}"`;

  const clientBody =
    providerId === 'locals'
      ? `def create_client():
    # Locals работает локально — ключ "local" нужен лишь для совместимости с OpenAI SDK
    api_key = os.environ.get("${cfg.envVar}", "local")
    return OpenAI(api_key=api_key, base_url=BASE_URL)`
      : `def create_client():
    api_key = os.environ.get("${cfg.envVar}")
    if not api_key:
        raise ValueError("Сначала задайте переменную ${cfg.envVar}")
    return OpenAI(api_key=api_key, base_url=BASE_URL)`;

  return `${headerComment}
import os
from openai import OpenAI

MODEL_NAME = "${model}"
${baseUrlLine}


${clientBody}


def ask_model(client, conversation):
    response = client.chat.completions.create(
        model=MODEL_NAME,
        messages=conversation,
    )
    message = response.choices[0].message
    return {
        "text": message.content or "",
        "raw_message": {"role": "assistant", "content": message.content or ""},
    }`;
}

function buildProviderWithToolsCode(providerId: ProviderId, model: string): string {
  const cfg = PROVIDERS[providerId];

  if (cfg.protocol === 'anthropic_native') {
    return `# provider.py — адаптер Anthropic с поддержкой инструментов
import os
from anthropic import Anthropic

MODEL_NAME = "${model}"


def create_client():
    api_key = os.environ.get("${cfg.envVar}")
    if not api_key:
        raise ValueError("Сначала задайте переменную ${cfg.envVar}")
    return Anthropic(api_key=api_key)


def format_tools(tools):
    result = []
    for tool in tools:
        result.append({
            "name": tool["name"],
            "description": tool["description"],
            "input_schema": tool["parameters"],
        })
    return result


def make_tool_result_message(tool_call_id, result_text, is_error=False):
    return {
        "role": "user",
        "content": [{
            "type": "tool_result",
            "tool_use_id": tool_call_id,
            "content": result_text,
            "is_error": is_error,
        }],
    }


def ask_model(client, conversation, tools=None):
    params = {
        "model": MODEL_NAME,
        "max_tokens": 2048,
        "messages": conversation,
    }
    if tools:
        params["tools"] = format_tools(tools)

    response = client.messages.create(**params)

    text_parts = []
    tool_calls = []
    for block in response.content:
        if block.type == "text":
            text_parts.append(block.text)
        elif block.type == "tool_use":
            tool_calls.append({
                "id": block.id,
                "name": block.name,
                "args": block.input,
            })

    return {
        "text": "\\n".join(text_parts),
        "tool_calls": tool_calls,
        "raw_message": {"role": "assistant", "content": response.content},
    }`;
  }

  const baseUrlLine =
    providerId === 'goat_shared_proxy'
      ? `BASE_URL = os.environ.get("PROXY_BASE_URL", "${cfg.baseUrl}")`
      : `BASE_URL = "${cfg.baseUrl}"`;

  const clientBody =
    providerId === 'locals'
      ? `def create_client():
    # Locals слушает 127.0.0.1:8321 — облачный секретный ключ не требуется
    api_key = os.environ.get("${cfg.envVar}", "local")
    return OpenAI(api_key=api_key, base_url=BASE_URL)`
      : `def create_client():
    api_key = os.environ.get("${cfg.envVar}")
    if not api_key:
        raise ValueError("Сначала задайте переменную ${cfg.envVar}")
    return OpenAI(api_key=api_key, base_url=BASE_URL)`;

  return `# provider.py — универсальный адаптер (${cfg.shortName}) с инструментами
import json
import os
from openai import OpenAI

MODEL_NAME = "${model}"
${baseUrlLine}


${clientBody}


def format_tools(tools):
    result = []
    for tool in tools:
        result.append({
            "type": "function",
            "function": {
                "name": tool["name"],
                "description": tool["description"],
                "parameters": tool["parameters"],
            },
        })
    return result


def make_tool_result_message(tool_call_id, result_text, is_error=False):
    prefix = "Ошибка: " if is_error else ""
    return {
        "role": "tool",
        "tool_call_id": tool_call_id,
        "content": prefix + result_text,
    }


def ask_model(client, conversation, tools=None):
    params = {
        "model": MODEL_NAME,
        "messages": conversation,
    }
    if tools:
        params["tools"] = format_tools(tools)

    response = client.chat.completions.create(**params)
    message = response.choices[0].message

    tool_calls = []
    raw_tool_calls = []
    if message.tool_calls:
        for call in message.tool_calls:
            tool_calls.append({
                "id": call.id,
                "name": call.function.name,
                "args": json.loads(call.function.arguments or "{}"),
            })
            raw_tool_calls.append({
                "id": call.id,
                "type": "function",
                "function": {
                    "name": call.function.name,
                    "arguments": call.function.arguments or "{}",
                },
            })

    raw_message = {"role": "assistant", "content": message.content or ""}
    if raw_tool_calls:
        raw_message["tool_calls"] = raw_tool_calls

    return {
        "text": message.content or "",
        "tool_calls": tool_calls,
        "raw_message": raw_message,
    }`;
}

export function buildGoatProxyCode(virtualKeys: VirtualKeyEntry[], defaultModel: string): string {
  const keysDictLines = virtualKeys
    .map(
      (k) =>
        `    "${k.token}": {"name": "${k.label.replace(/"/g, '\\"')}", "daily_limit": ${Math.max(1, k.dailyLimit)}},`
    )
    .join('\n');

  return `# goat_proxy.py — ваш личный шлюз для раздачи подписки Command Code GOAT
# Не требует сторонних фреймворков: работает на стандартной библиотеке Python!
from datetime import date
from http.server import BaseHTTPRequestHandler, HTTPServer
import json
import os
import urllib.error
import urllib.request

GOAT_BASE_URL = "https://api.commandcode.ai/provider/v1"
GOAT_MASTER_KEY = os.environ.get("COMMAND_CODE_API_KEY")
DEFAULT_MODEL = "${defaultModel}"

# Виртуальные ключи, которые вы раздаёте ученикам или команде:
VIRTUAL_KEYS = {
${keysDictLines}
}

# Простой счётчик запросов в памяти: {(ключ, дата): число_запросов}
USAGE_TODAY = {}


def verify_virtual_key(auth_header):
    if not auth_header:
        return None, None
    token = auth_header.replace("Bearer ", "").strip()
    profile = VIRTUAL_KEYS.get(token)
    return token, profile


def check_quota(token, limit):
    today = date.today().isoformat()
    counter_key = (token, today)
    used = USAGE_TODAY.get(counter_key, 0)
    if used >= limit:
        return False
    USAGE_TODAY[counter_key] = used + 1
    return True


def forward_to_goat(request_body):
    url = f"{GOAT_BASE_URL}/chat/completions"
    req = urllib.request.Request(
        url=url,
        data=request_body,
        method="POST",
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {GOAT_MASTER_KEY}",
        },
    )
    try:
        with urllib.request.urlopen(req, timeout=120) as resp:
            return resp.status, resp.read()
    except urllib.error.HTTPError as err:
        return err.code, err.read()


class GoatProxyHandler(BaseHTTPRequestHandler):
    def do_POST(self):
        if not self.path.endswith("/chat/completions"):
            self.send_response(404)
            self.end_headers()
            return

        token, profile = verify_virtual_key(self.headers.get("Authorization"))
        if profile is None:
            self.send_response(401)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(b'{"error": "Неверный виртуальный ключ доступа"}')
            return

        if not check_quota(token, profile["daily_limit"]):
            self.send_response(429)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(b'{"error": "Дневной лимит запросов исчерпан"}')
            return

        length = int(self.headers.get("Content-Length", "0"))
        body = self.rfile.read(length)
        status, response_bytes = forward_to_goat(body)

        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.end_headers()
        self.wfile.write(response_bytes)


if __name__ == "__main__":
    if not GOAT_MASTER_KEY:
        raise ValueError("Задайте COMMAND_CODE_API_KEY перед запуском прокси!")
    print("GOAT-прокси запущен на http://localhost:8080/v1")
    HTTPServer(("0.0.0.0", 8080), GoatProxyHandler).serve_forever()`;
}

export function generateProviderCodeBundle(
  providerId: ProviderId,
  modelOverride?: string,
  virtualKeys: VirtualKeyEntry[] = DEFAULT_VIRTUAL_KEYS
): ProviderCodeBundle {
  const cfg = PROVIDERS[providerId];
  const activeModel = modelOverride || cfg.defaultModel;

  const setupCommands = `mkdir code-editing-agent
cd code-editing-agent
python3 -m venv venv
source venv/bin/activate   # на Windows: venv\\Scripts\\activate
pip install ${cfg.pipPackage}
touch provider.py agent.py`;

  const envExportCommand =
    providerId === 'goat_shared_proxy'
      ? `export ${cfg.envVar}="${virtualKeys[0]?.token || cfg.envPlaceholder}"
export PROXY_BASE_URL="${cfg.baseUrl}"
python agent.py`
      : providerId === 'locals'
        ? `# Убедись, что локальный сервер Locals запущен (locals status)
python agent.py`
        : `export ${cfg.envVar}="${cfg.envPlaceholder}"
python agent.py`;

  const providerSimpleCode = buildProviderSimpleCode(providerId, activeModel);

  const agentSimpleCode = `# agent.py — первый минимальный чат в терминале
from provider import ask_model, create_client


def get_user_message():
    try:
        return input("\\033[94mВы\\033[0m: ")
    except (EOFError, KeyboardInterrupt):
        return None


def run_agent(client):
    conversation = []
    print("Чат с моделью запущен (нажмите Ctrl+C для выхода)")

    while True:
        user_text = get_user_message()
        if user_text is None:
            break

        conversation.append({"role": "user", "content": user_text})
        reply = ask_model(client, conversation)
        conversation.append(reply["raw_message"])

        print(f"\\033[93m${cfg.assistantDisplayName}\\033[0m: {reply['text']}")


if __name__ == "__main__":
    client = create_client()
    run_agent(client)`;

  const providerWithToolsCode = buildProviderWithToolsCode(providerId, activeModel);

  const readFileToolCode = `# Инструмент read_file в agent.py
def read_file(args):
    file_path = args["path"]
    with open(file_path, "r", encoding="utf-8") as file:
        return file.read()


READ_FILE_TOOL = {
    "name": "read_file",
    "description": (
        "Читает содержимое файла по относительному пути. "
        "Используй, когда нужно узнать, что внутри файла. "
        "Не передавай сюда имена папок."
    ),
    "parameters": {
        "type": "object",
        "properties": {
            "path": {
                "type": "string",
                "description": "Относительный путь к файлу в рабочей папке.",
            }
        },
        "required": ["path"],
    },
    "function": read_file,
}`;

  const agentLoopWithToolsCode = `# Обновлённый цикл агента и диспетчер инструментов в agent.py
import json
from provider import ask_model, create_client, make_tool_result_message


def execute_tool(tools, name, args):
    for tool in tools:
        if tool["name"] == name:
            args_preview = json.dumps(args, ensure_ascii=False)
            print(f"\\033[92mtool\\033[0m: {name}({args_preview})")
            try:
                result = tool["function"](args)
                return result, False
            except Exception as error:
                return str(error), True
    return f"Инструмент '{name}' не найден", True


def run_agent(client, tools):
    conversation = []
    print("Чат с агентом запущен (нажмите Ctrl+C для выхода)")
    read_user_input = True

    while True:
        if read_user_input:
            user_text = get_user_message()
            if user_text is None:
                break
            conversation.append({"role": "user", "content": user_text})

        reply = ask_model(client, conversation, tools=tools)
        conversation.append(reply["raw_message"])

        if reply["text"]:
            print(f"\\033[93m${cfg.assistantDisplayName}\\033[0m: {reply['text']}")

        if not reply["tool_calls"]:
            read_user_input = True
            continue

        for call in reply["tool_calls"]:
            result_text, is_error = execute_tool(tools, call["name"], call["args"])
            tool_msg = make_tool_result_message(call["id"], result_text, is_error)
            conversation.append(tool_msg)

        read_user_input = False`;

  const listFilesToolCode = `# Инструмент list_files в agent.py
import os


def list_files(args):
    base_dir = args.get("path") or "."
    ignored = {".git", "venv", "__pycache__"}
    items = []

    for root, dirs, files in os.walk(base_dir):
        dirs[:] = [d for d in dirs if d not in ignored]
        for folder in sorted(dirs):
            full_path = os.path.join(root, folder)
            rel_path = os.path.relpath(full_path, base_dir)
            items.append(rel_path + "/")
        for filename in sorted(files):
            full_path = os.path.join(root, filename)
            rel_path = os.path.relpath(full_path, base_dir)
            items.append(rel_path)

    return json.dumps(items, ensure_ascii=False)


LIST_FILES_TOOL = {
    "name": "list_files",
    "description": (
        "Показывает список файлов и папок по указанному пути. "
        "Если путь не передан — показывает текущую папку."
    ),
    "parameters": {
        "type": "object",
        "properties": {
            "path": {
                "type": "string",
                "description": "Необязательный путь к папке (по умолчанию текущая).",
            }
        },
        "required": [],
    },
    "function": list_files,
}`;

  const editFileToolCode = `# Инструмент edit_file и помощник create_new_file в agent.py
def create_new_file(file_path, content):
    folder = os.path.dirname(file_path)
    if folder:
        os.makedirs(folder, exist_ok=True)
    with open(file_path, "w", encoding="utf-8") as file:
        file.write(content)
    return f"Файл {file_path} успешно создан"


def edit_file(args):
    file_path = args.get("path", "")
    old_str = args.get("old_str", "")
    new_str = args.get("new_str", "")

    if not file_path or old_str == new_str:
        raise ValueError("Нужно указать path и разные old_str / new_str")

    if not os.path.exists(file_path):
        if old_str == "":
            return create_new_file(file_path, new_str)
        raise FileNotFoundError(f"Файл {file_path} не найден")

    with open(file_path, "r", encoding="utf-8") as file:
        old_content = file.read()

    if old_str and old_str not in old_content:
        raise ValueError("Фрагмент old_str не найден в файле")

    new_content = old_content.replace(old_str, new_str, 1)
    with open(file_path, "w", encoding="utf-8") as file:
        file.write(new_content)
    return "OK"


EDIT_FILE_TOOL = {
    "name": "edit_file",
    "description": (
        "Редактирует текстовый файл, заменяя точный фрагмент old_str на new_str. "
        "Если файла ещё нет и old_str пустой — создаёт новый файл."
    ),
    "parameters": {
        "type": "object",
        "properties": {
            "path": {"type": "string", "description": "Путь к файлу."},
            "old_str": {"type": "string", "description": "Точный текст для поиска и замены."},
            "new_str": {"type": "string", "description": "Новый текст вместо old_str."},
        },
        "required": ["path", "old_str", "new_str"],
    },
    "function": edit_file,
}`;

  const fullAgentCode = `# agent.py — полный код-редактирующий агент (~150 строк понятного Python)
import json
import os
from provider import ask_model, create_client, make_tool_result_message


def read_file(args):
    file_path = args["path"]
    with open(file_path, "r", encoding="utf-8") as file:
        return file.read()


def list_files(args):
    base_dir = args.get("path") or "."
    ignored = {".git", "venv", "__pycache__"}
    items = []
    for root, dirs, files in os.walk(base_dir):
        dirs[:] = [d for d in dirs if d not in ignored]
        for folder in sorted(dirs):
            rel = os.path.relpath(os.path.join(root, folder), base_dir)
            items.append(rel + "/")
        for filename in sorted(files):
            rel = os.path.relpath(os.path.join(root, filename), base_dir)
            items.append(rel)
    return json.dumps(items, ensure_ascii=False)


def create_new_file(file_path, content):
    folder = os.path.dirname(file_path)
    if folder:
        os.makedirs(folder, exist_ok=True)
    with open(file_path, "w", encoding="utf-8") as file:
        file.write(content)
    return f"Файл {file_path} успешно создан"


def edit_file(args):
    file_path = args.get("path", "")
    old_str = args.get("old_str", "")
    new_str = args.get("new_str", "")
    if not file_path or old_str == new_str:
        raise ValueError("Нужно указать path и разные old_str / new_str")
    if not os.path.exists(file_path):
        if old_str == "":
            return create_new_file(file_path, new_str)
        raise FileNotFoundError(f"Файл {file_path} не найден")
    with open(file_path, "r", encoding="utf-8") as file:
        old_content = file.read()
    if old_str and old_str not in old_content:
        raise ValueError("Фрагмент old_str не найден в файле")
    new_content = old_content.replace(old_str, new_str, 1)
    with open(file_path, "w", encoding="utf-8") as file:
        file.write(new_content)
    return "OK"


TOOLS = [
    {
        "name": "read_file",
        "description": "Читает содержимое файла по относительному пути. Не используй для папок.",
        "parameters": {
            "type": "object",
            "properties": {"path": {"type": "string", "description": "Путь к файлу."}},
            "required": ["path"],
        },
        "function": read_file,
    },
    {
        "name": "list_files",
        "description": "Показывает список файлов и папок. Без path — текущая папка.",
        "parameters": {
            "type": "object",
            "properties": {"path": {"type": "string", "description": "Необязательный путь."}},
            "required": [],
        },
        "function": list_files,
    },
    {
        "name": "edit_file",
        "description": "Заменяет old_str на new_str в файле или создаёт новый файл, если old_str пустой.",
        "parameters": {
            "type": "object",
            "properties": {
                "path": {"type": "string", "description": "Путь к файлу."},
                "old_str": {"type": "string", "description": "Текст для замены."},
                "new_str": {"type": "string", "description": "Новый текст."},
            },
            "required": ["path", "old_str", "new_str"],
        },
        "function": edit_file,
    },
]


def get_user_message():
    try:
        return input("\\033[94mВы\\033[0m: ")
    except (EOFError, KeyboardInterrupt):
        return None


def execute_tool(tools, name, args):
    for tool in tools:
        if tool["name"] == name:
            args_preview = json.dumps(args, ensure_ascii=False)
            print(f"\\033[92mtool\\033[0m: {name}({args_preview})")
            try:
                return tool["function"](args), False
            except Exception as error:
                return str(error), True
    return f"Инструмент '{name}' не найден", True


def run_agent(client, tools):
    conversation = []
    print("Чат с агентом запущен (нажмите Ctrl+C для выхода)")
    read_user_input = True

    while True:
        if read_user_input:
            user_text = get_user_message()
            if user_text is None:
                break
            conversation.append({"role": "user", "content": user_text})

        reply = ask_model(client, conversation, tools=tools)
        conversation.append(reply["raw_message"])

        if reply["text"]:
            print(f"\\033[93m${cfg.assistantDisplayName}\\033[0m: {reply['text']}")

        if not reply["tool_calls"]:
            read_user_input = True
            continue

        for call in reply["tool_calls"]:
            result_text, is_error = execute_tool(tools, call["name"], call["args"])
            conversation.append(make_tool_result_message(call["id"], result_text, is_error))

        read_user_input = False


if __name__ == "__main__":
    client = create_client()
    run_agent(client, TOOLS)`;

  const requirementsTxt =
    cfg.pipPackage === 'anthropic'
      ? 'anthropic>=0.49.0\n'
      : 'openai>=1.68.0\n';

  const goatProxyCode = buildGoatProxyCode(
    virtualKeys,
    PROVIDERS.command_code_goat.defaultModel
  );

  return {
    setupCommands,
    envExportCommand,
    providerSimpleCode,
    agentSimpleCode,
    providerWithToolsCode,
    readFileToolCode,
    agentLoopWithToolsCode,
    listFilesToolCode,
    editFileToolCode,
    fullAgentCode,
    requirementsTxt,
    goatProxyCode,
  };
}
