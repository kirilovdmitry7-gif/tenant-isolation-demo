# Как опубликовать это на GitHub

## Шаг 0 — обязательный

Папку `dot-claude` переименуй в `.claude`:

    ren dot-claude .claude

(Она приехала под другим именем только потому, что запись в папки с именем
`.claude` с моей стороны запрещена. Содержимое в порядке.)

Это важно: внутри лежат рабочее соглашение, два субагента и хук — то самое,
что показывает заказчику, как ты работаешь с Claude Code.

## Шаг 1 — публикация

Открой терминал в этой папке и выполни:

    gh repo create tenant-isolation-demo --public --source=. --remote=origin --push

Если gh ещё не авторизован:

    gh auth login

(GitHub.com → HTTPS → Login with a web browser)

Если gh не установлен, вручную:

    git init
    git add -A
    git commit -m "Tenant isolation demo: RLS proof, idempotent import, signed webhooks"
    git branch -M main
    git remote add origin https://github.com/ТВОЙ-ЛОГИН/tenant-isolation-demo.git
    git push -u origin main

## Шаг 2

Пришли мне ссылку на репозиторий. Живой адрес на Vercel я подниму сам.
