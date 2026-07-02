import type { Ticket, Employee, TicketStats } from "@/types"

export const DEMO_EMPLOYEES: Employee[] = [
  { id: 1, name: "Алексей Петров", email: "alexey@example.com", avatar: "", role: "admin", department: "IT", online: true, activeTickets: 3, resolvedToday: 5 },
  { id: 2, name: "Мария Иванова", email: "maria@example.com", avatar: "", role: "senior_agent", department: "Поддержка", online: true, activeTickets: 2, resolvedToday: 8 },
  { id: 3, name: "Дмитрий Сидоров", email: "dmitry@example.com", avatar: "", role: "agent", department: "Поддержка", online: false, activeTickets: 4, resolvedToday: 3 },
  { id: 4, name: "Елена Козлова", email: "elena@example.com", avatar: "", role: "agent", department: "Разработка", online: true, activeTickets: 1, resolvedToday: 2 },
  { id: 5, name: "Сергей Новиков", email: "sergey@example.com", avatar: "", role: "agent", department: "Поддержка", online: false, activeTickets: 0, resolvedToday: 6 },
]

export const DEMO_TICKETS: Ticket[] = [
  {
    id: 1, title: "Не работает отправка email", description: "После обновления сервера перестала работать отправка писем через SMTP. Ошибка Connection timed out.", status: "in_progress", priority: "high", category: "bug", tags: ["email", "smtp", "server"],
    createdBy: { id: 10, name: "Иван Клиент", email: "ivan@client.ru", avatar: "" },
    assignedTo: DEMO_EMPLOYEES[0],
    messages: [
      { id: 1, ticketId: 1, senderId: 10, senderName: "Иван Клиент", senderAvatar: "", text: "Добрый день! После обновления перестала работать отправка почты.", attachments: [], createdAt: "2026-07-01T09:00:00", isInternal: false },
      { id: 2, ticketId: 1, senderId: 1, senderName: "Алексей Петров", senderAvatar: "", text: "Здравствуйте! Проверьте настройки SMTP в конфиге. Какая ошибка приходит?", attachments: [], createdAt: "2026-07-01T09:15:00", isInternal: false },
      { id: 3, ticketId: 1, senderId: 10, senderName: "Иван Клиент", senderAvatar: "", text: "Connection timed out на порт 587", attachments: [], createdAt: "2026-07-01T09:30:00", isInternal: false },
      { id: 4, ticketId: 1, senderId: 1, senderName: "Алексей Петров", senderAvatar: "", text: "Нужно проверить доступность SMTP-сервера и настройки firewall", attachments: [], createdAt: "2026-07-01T09:45:00", isInternal: true },
    ],
    createdAt: "2026-07-01T09:00:00", updatedAt: "2026-07-01T09:45:00", tags: ["email"],
  },
  {
    id: 2, title: "Добавить возможность экспорта в Excel", description: "Необходимо добавить кнопку экспорта списка пользователей в Excel для отчетности.", status: "open", priority: "medium", category: "feature", tags: ["feature", "export"],
    createdBy: { id: 11, name: "Ольга Менеджер", email: "olga@client.ru", avatar: "" },
    messages: [
      { id: 5, ticketId: 2, senderId: 11, senderName: "Ольга Менеджер", senderAvatar: "", text: "Требуется экспорт данных в Excel для ежемесячных отчетов.", attachments: [], createdAt: "2026-07-01T10:00:00", isInternal: false },
    ],
    createdAt: "2026-07-01T10:00:00", updatedAt: "2026-07-01T10:00:00", tags: ["export"],
  },
  {
    id: 3, title: "Сбой авторизации через Telegram", description: "При входе через Telegram выдает ошибку 500. Пользователи не могут залогиниться.", status: "critical", priority: "critical", category: "incident", tags: ["telegram", "auth"],
    createdBy: { id: 12, name: "Павел Техдир", email: "pavel@client.ru", avatar: "" },
    assignedTo: DEMO_EMPLOYEES[1],
    messages: [
      { id: 6, ticketId: 3, senderId: 12, senderName: "Павел Техдир", senderAvatar: "", text: "Telegram авторизация полностью упала. Срочно нужно исправить!", attachments: [], createdAt: "2026-07-02T08:00:00", isInternal: false },
      { id: 7, ticketId: 3, senderId: 2, senderName: "Мария Иванова", senderAvatar: "", text: "Уже смотрю. Проблема в токене бота, обновляю.", attachments: [], createdAt: "2026-07-02T08:05:00", isInternal: false },
    ],
    createdAt: "2026-07-02T08:00:00", updatedAt: "2026-07-02T08:05:00", tags: ["telegram"],
  },
  {
    id: 4, title: "Обновить документацию API", description: "Старая документация не соответствует актуальным эндпоинтам.", status: "open", priority: "low", category: "other", tags: ["docs"],
    createdBy: { id: 13, name: "Анна Разработчик", email: "anna@dev.ru", avatar: "" },
    messages: [
      { id: 8, ticketId: 4, senderId: 13, senderName: "Анна Разработчик", senderAvatar: "", text: "Документация устарела, нужно обновить.", attachments: [], createdAt: "2026-06-30T14:00:00", isInternal: false },
    ],
    createdAt: "2026-06-30T14:00:00", updatedAt: "2026-06-30T14:00:00", tags: ["docs"],
  },
  {
    id: 5, title: "Медленная загрузка страницы чатов", description: "При открытии списка чатов загрузка занимает более 10 секунд.", status: "resolved", priority: "high", category: "bug", tags: ["performance"],
    createdBy: { id: 10, name: "Иван Клиент", email: "ivan@client.ru", avatar: "" },
    assignedTo: DEMO_EMPLOYEES[3],
    messages: [
      { id: 9, ticketId: 5, senderId: 10, senderName: "Иван Клиент", senderAvatar: "", text: "Очень долго грузится список чатов.", attachments: [], createdAt: "2026-06-28T11:00:00", isInternal: false },
      { id: 10, ticketId: 5, senderId: 4, senderName: "Елена Козлова", senderAvatar: "", text: "Оптимизировала запросы, добавила индексы. Загрузка теперь 1-2 секунды.", attachments: [], createdAt: "2026-06-29T16:00:00", isInternal: false },
    ],
    createdAt: "2026-06-28T11:00:00", updatedAt: "2026-06-29T16:00:00", tags: ["performance"],
  },
]

export const DEMO_STATS: TicketStats = {
  total: DEMO_TICKETS.length,
  open: DEMO_TICKETS.filter(t => t.status === 'open').length,
  inProgress: DEMO_TICKETS.filter(t => t.status === 'in_progress').length,
  resolved: DEMO_TICKETS.filter(t => t.status === 'resolved').length,
  critical: DEMO_TICKETS.filter(t => t.priority === 'critical').length,
  avgResolutionTime: 4.5,
}
