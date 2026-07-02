import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Search, MessageCircle, Users, Hash } from "lucide-react"
import { formatRelativeTime } from "@/lib/utils"
import type { ChatRoom } from "@/types"

const DEMO_CHATS: ChatRoom[] = [
  { id: 1, name: "Общий чат", type: "group", avatar: "", lastMessage: "Коллеги, собрание в 15:00", lastTime: "2026-07-02T14:30:00", unread: 3, members: 15 },
  { id: 2, name: "Разработка", type: "group", avatar: "", lastMessage: "Пулл-реквест готов к ревью", lastTime: "2026-07-02T12:00:00", unread: 1, members: 8 },
  { id: 3, name: "IT-поддержка", type: "channel", avatar: "", lastMessage: "Инцидент #42 закрыт", lastTime: "2026-07-02T10:00:00", unread: 0, members: 6 },
  { id: 4, name: "HR — важное", type: "group", avatar: "", lastMessage: "Новый сотрудник с понедельника", lastTime: "2026-07-01T16:00:00", unread: 0, members: 12 },
  { id: 5, name: "Алексей Петров", type: "personal", avatar: "", lastMessage: "Ок, сделаю до вечера", lastTime: "2026-07-02T15:00:00", unread: 2 },
  { id: 6, name: "Мария Иванова", type: "personal", avatar: "", lastMessage: "Спасибо за помощь!", lastTime: "2026-07-02T13:00:00", unread: 0 },
  { id: 7, name: "Дмитрий Сидоров", type: "personal", avatar: "", lastMessage: "Нужно обсудить задачу", lastTime: "2026-07-01T11:00:00", unread: 1 },
  { id: 8, name: "Елена Козлова", type: "personal", avatar: "", lastMessage: "Готова презентация", lastTime: "2026-06-30T17:00:00", unread: 0 },
  { id: 9, name: "Проект Альфа", type: "group", avatar: "", lastMessage: "Дедлайн перенесли", lastTime: "2026-07-01T09:00:00", unread: 0, members: 5 },
  { id: 10, name: "Бухгалтерия", type: "channel", avatar: "", lastMessage: "Отчёты за квартал", lastTime: "2026-06-29T12:00:00", unread: 0, members: 4 },
]

export default function ChatsPage() {
  const navigate = useNavigate()
  const [search, setSearch] = useState("")

  const groups = DEMO_CHATS.filter(c => c.type === "group" || c.type === "channel")
  const personal = DEMO_CHATS.filter(c => c.type === "personal")

  const filterChats = (chats: ChatRoom[]) => {
    if (!search.trim()) return chats
    const q = search.toLowerCase()
    return chats.filter(c => c.name.toLowerCase().includes(q) || (c.lastMessage || "").toLowerCase().includes(q))
  }

  const filteredGroups = filterChats(groups)
  const filteredPersonal = filterChats(personal)

  const sortByTime = (a: ChatRoom, b: ChatRoom) => {
    return (b.lastTime || "").localeCompare(a.lastTime || "") || b.unread - a.unread
  }

  const chatIcon = (c: ChatRoom) => {
    if (c.type === "personal") return <Avatar className="w-10 h-10"><AvatarFallback className="bg-primary/10 text-primary text-xs">{c.name.split(" ").map(n => n[0]).join("")}</AvatarFallback></Avatar>
    if (c.type === "channel") return <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center"><Hash className="w-5 h-5 text-amber-600" /></div>
    return <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center"><Users className="w-5 h-5 text-blue-600" /></div>
  }

  const renderChat = (c: ChatRoom) => (
    <div
      key={c.id}
      onClick={() => navigate(`/chats/${c.id}`)}
      className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted/50 cursor-pointer transition-all group"
    >
      {chatIcon(c)}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <h4 className="font-bold text-sm truncate">{c.name}</h4>
          <span className="text-[10px] text-muted-foreground shrink-0 ml-2">
            {c.lastTime ? formatRelativeTime(c.lastTime) : ""}
          </span>
        </div>
        <div className="flex items-center justify-between mt-0.5">
          <p className="text-xs text-muted-foreground truncate">{c.lastMessage || "Нет сообщений"}</p>
          <div className="flex items-center gap-1.5 shrink-0 ml-2">
            {c.members && <span className="text-[9px] text-muted-foreground">{c.members}</span>}
            {c.unread > 0 && (
              <Badge className="h-5 min-w-[18px] px-1.5 bg-primary text-primary-foreground border-0 text-[9px] font-bold flex items-center justify-center rounded-full">
                {c.unread}
              </Badge>
            )}
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <MessageCircle className="w-6 h-6 text-primary" />
          Чаты
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Общение и коммуникация</p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Поиск чатов..."
          className="pl-9"
        />
      </div>

      <div className="space-y-1">
        {filteredGroups.length > 0 && (
          <div>
            <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-1 mb-2">
              Общие — {filteredGroups.length}
            </h3>
            <div className="space-y-0.5">
              {filteredGroups.sort(sortByTime).map(renderChat)}
            </div>
          </div>
        )}

        {filteredPersonal.length > 0 && (
          <div className="mt-6">
            <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-1 mb-2">
              Личные — {filteredPersonal.length}
            </h3>
            <div className="space-y-0.5">
              {filteredPersonal.sort(sortByTime).map(renderChat)}
            </div>
          </div>
        )}

        {filteredGroups.length === 0 && filteredPersonal.length === 0 && (
          <div className="text-center py-16 text-muted-foreground">
            <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="font-bold text-sm">Чаты не найдены</p>
          </div>
        )}
      </div>
    </div>
  )
}
