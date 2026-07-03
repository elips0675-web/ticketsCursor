import { useState, useMemo } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Search, Newspaper, Plus, Clock, User, AlertTriangle, Pin } from "lucide-react"
import type { NewsPost } from "@/types"
import { useAuth } from "@/context/AuthContext"

const DEMO_NEWS: NewsPost[] = [
  { id: 1, title: "Запуск новой версии Service Desk 2.1", content: "Сегодня состоялся релиз обновления 2.1. Добавлены: улучшенный поиск по тикетам, новый дизайн дашборда, исправлены критические ошибки. Список изменений доступен в Wiki.", important: true, authorId: 1, authorName: "Алексей Петров", createdAt: "2026-07-02T09:00:00" },
  { id: 2, title: "Изменение графика работы техподдержки", content: "С 1 июля техподдержка работает с 8:00 до 20:00 по будням. Заявки, созданные в нерабочее время, обрабатываются на следующий день.", important: false, authorId: 2, authorName: "Мария Иванова", createdAt: "2026-06-28T14:00:00" },
  { id: 3, title: "Плановые работы на сервере", content: "В ночь с 5 на 6 июля с 02:00 до 04:00 будут проводиться технические работы. Возможны кратковременные перерывы в доступе.", important: true, authorId: 1, authorName: "Алексей Петров", createdAt: "2026-06-25T11:00:00" },
  { id: 4, title: "Новый сотрудник в команде", content: "Приветствуем Елену Павлову — нового разработчика в отделе IT. Елена будет заниматься улучшением интерфейса и новыми интеграциями.", important: false, authorId: 1, authorName: "Алексей Петров", createdAt: "2026-06-20T10:00:00" },
  { id: 5, title: "Обновление правил SLA", content: "Обновлены временные рамки для уровней поддержки. Критические инциденты — реакция до 30 минут. Высокий приоритет — до 2 часов. Средний — до 8 часов.", important: false, authorId: 2, authorName: "Мария Иванова", createdAt: "2026-06-15T16:00:00" },
]

const PER_PAGE = 6

export default function NewsPage() {
  const { canManage } = useAuth()
  const [search, setSearch] = useState("")
  const [showImportant, setShowImportant] = useState(false)
  const [open, setOpen] = useState(false)
  const [newTitle, setNewTitle] = useState("")
  const [newContent, setNewContent] = useState("")
  const [newImportant, setNewImportant] = useState(false)
  const [page, setPage] = useState(1)

  const filtered = useMemo(() => {
    let items = DEMO_NEWS
    if (showImportant) items = items.filter(n => n.important)
    if (search.trim()) {
      const q = search.toLowerCase()
      items = items.filter(n => n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q))
    }
    return items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }, [search, showImportant])

  const totalPages = Math.ceil(filtered.length / PER_PAGE)
  const paged = filtered.slice(0, page * PER_PAGE)
  const resetPage = () => setPage(1)

  const handleCreate = () => {
    if (!newTitle.trim() || !newContent.trim()) return
    const post: NewsPost = {
      id: DEMO_NEWS.length + 1,
      title: newTitle,
      content: newContent,
      important: newImportant,
      authorId: 1,
      authorName: "Алексей Петров",
      createdAt: new Date().toISOString(),
    }
    DEMO_NEWS.unshift(post)
    setOpen(false)
    setNewTitle("")
    setNewContent("")
    setNewImportant(false)
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Newspaper className="w-6 h-6 text-primary" />
            Новости
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Объявления и обновления системы</p>
        </div>
        {canManage && (
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus className="w-4 h-4" />Новость</Button>
          </DialogTrigger>
          <DialogContent className="max-w-xl">
            <DialogHeader>
              <DialogTitle>Создать новость</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <Input value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="Заголовок" />
              <Textarea value={newContent} onChange={e => setNewContent(e.target.value)} placeholder="Содержание" rows={6} />
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={newImportant} onChange={e => setNewImportant(e.target.checked)} className="rounded" />
                <span>Важное объявление</span>
              </label>
              <Button onClick={handleCreate} className="w-full">Опубликовать</Button>
            </div>
          </DialogContent>
        </Dialog>
        )}
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input value={search} onChange={e => { setSearch(e.target.value); resetPage() }} placeholder="Поиск новостей..." className="pl-9" />
        </div>
        <Button variant={showImportant ? "default" : "outline"} size="sm" onClick={() => { setShowImportant(!showImportant); resetPage() }} className="gap-2">
          <AlertTriangle className="w-4 h-4" />Важные
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.length === 0 && (
          <div className="col-span-full text-center py-16 text-muted-foreground">
            <Newspaper className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="font-bold text-sm">Новости не найдены</p>
          </div>
        )}
        {paged.map(n => (
          <div key={n.id} className="rounded-xl border bg-card p-5 flex flex-col">
            <div className="flex items-center gap-2 mb-2">
              {n.important && <Pin className="w-4 h-4 text-destructive shrink-0" />}
              <h3 className="font-bold text-sm leading-snug">{n.title}</h3>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed line-clamp-4 flex-1 mb-4">{n.content}</p>
            <div className="flex items-center gap-2 text-[10px] text-muted-foreground pt-3 border-t">
              <span className="flex items-center gap-1"><User className="w-3 h-3" />{n.authorName}</span>
              <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{new Date(n.createdAt).toLocaleDateString()}</span>
              {n.important && <Badge className="text-[9px] bg-destructive/10 text-destructive border-0 ml-auto">Важно</Badge>}
            </div>
          </div>
        ))}
      </div>

      {totalPages > 1 && page < totalPages && (
        <div className="flex justify-center pt-2">
          <Button variant="outline" onClick={() => setPage(p => p + 1)}>
            Показать ещё
          </Button>
        </div>
      )}
    </div>
  )
}