# Service Desk

Корпоративная система учёта заявок (Helpdesk) с чатами, календарём, опросами, файловым хранилищем и профилем пользователя.

---

## Стек

**Frontend:** React 18 + TypeScript + Vite + Tailwind CSS + shadcn/ui + Recharts  
**Backend:** Express + MySQL + JWT (helmet, rate-limit)  
**Среда:** Node.js 18+, MySQL (через Laragon) или Docker

---

## Функции

| Модуль | Возможности |
|--------|------------|
| **Дашборд** | Карточки статистики, график по статусам, список последних обновлений |
| **Тикеты** | CRUD, поиск, фильтр по статусу/приоритету, сортировка, назначение на сотрудника, внутренние заметки |
| **Сотрудники** | Список с группировкой по отделам, онлайн-статус, поиск |
| **Календарь** | Сетка месяца, навигация, создание/удаление событий, блок ближайших |
| **Опросы** | Создание, голосование (одиночное/множественное), прогресс-бары |
| **Файлы** | Папки, сетка/список, фильтр по типу, поиск |
| **Чаты** | Общие и личные чаты, отправка сообщений, реакции (эмодзи), удаление, поиск по сообщениям |
| **Профиль** | Редактирование имени/email/телефона/должности/био, вкладки "Мои файлы" и "Настройки" |
| **Авторизация** | Регистрация, логин, JWT, dev-логин без пароля |

---

## Docker (production)

```bash
# .env файл для Docker
set DB_PASSWORD=mysecret
set JWT_SECRET=my-jwt-secret

# Сборка и запуск
docker compose up -d --build

# → Frontend: http://localhost
# → API:      http://localhost:4000
# → MySQL:    localhost:3307 (root / mysecret)

# Остановка
docker compose down

# Полная перезагрузка (включая БД)
docker compose down -v && docker compose up -d --build
```

---

## Быстрый старт (локально)

**1. Импорт БД**
```bash
mysql -u root -p < server\seed.sql
```

**2. Настройка .env**
```bash
copy server\.env.example server\.env
# при необходимости указать DB_PASSWORD
```

**3. Запуск**
```bash
запустить-все.bat
```

Или вручную:
```bash
npm run dev          # Frontend → http://localhost:5173
cd server && npm run dev  # API → http://localhost:4000
```

**Dev-логин:** `POST /api/auth/dev-login` (без пароля, возвращает JWT)

---

## API (избранное)

| Метод | Путь | Описание |
|-------|------|----------|
| POST | /api/auth/login | Вход по email + password |
| POST | /api/auth/register | Регистрация |
| POST | /api/auth/dev-login | Dev-логин (userId = 1) |
| GET | /api/tickets | Список тикетов |
| POST | /api/tickets | Создать тикет |
| GET | /api/chats | Список чатов |
| POST | /api/chats/:id/messages | Отправить сообщение |
| GET | /api/polls | Список опросов |
| POST | /api/polls/:id/vote | Голосование |
| GET | /api/calendar | События |
| GET | /api/employees | Сотрудники |

---

## Что дальше

См. раздел «Что осталось» в [`Что сделано.txt`](Что%20сделано.txt) — RBAC, экспорт, тесты и др.
