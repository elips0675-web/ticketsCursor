import { useState, useRef, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { useTickets } from "@/context/ticket-context"
import { formatDate, formatTime } from "@/lib/utils"
import { ArrowLeft, Send, User, MessageSquare, Tag, Lock, ExternalLink } from "lucide-react"
import type { TicketStatus, TicketPriority } from "@/types"

export default function TicketDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { tickets, employees, updateTicketStatus, updateTicketPriority, assignTicket, addMessage } = useTickets()
  const ticket = tickets.find(t => t.id === Number(id))

  const [messageText, setMessageText] = useState("")
  const [isInternal, setIsInternal] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }) }, [ticket?.messages])

  if (!ticket) {
    return (
      <div className="text-center py-20">
        <h2 className="font-bold text-lg">Тикет не найден</h2>
        <Button variant="link" onClick={() => navigate("/tickets")}>Вернуться к списку</Button>
      </div>
    )
  }

  const handleSend = () => {
    if (!messageText.trim()) return
    addMessage(ticket.id, messageText, isInternal)
    setMessageText("")
    setIsInternal(false)
  }

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" onClick={() => navigate("/tickets")} className="gap-1.5">
        <ArrowLeft className="w-4 h-4" />
        Назад к тикетам
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <CardTitle className="text-lg">{ticket.title}</CardTitle>
                    <Badge className={`text-[10px] ${ticket.status.replace('_', '-')}`}>
                      {{ open: "Открытые", in_progress: "В работе", resolved: "Решённые", closed: "Закрытые" }[ticket.status]}
                    </Badge>
                    <Badge className={`text-[10px] priority-${ticket.priority}`}>
                      {{ low: "Низкий", medium: "Средний", high: "Высокий", critical: "Критичный" }[ticket.priority]}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">Создан {formatDate(ticket.createdAt)}</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-foreground/80 mb-4">{ticket.description}</p>
              {ticket.tags.length > 0 && (
                <div className="flex items-center gap-1.5 flex-wrap">
                  <Tag className="w-3 h-3 text-muted-foreground" />
                  {ticket.tags.map(tag => (
                    <Badge key={tag} variant="secondary" className="text-[9px]">{tag}</Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-primary" />
                Переписка ({ticket.messages.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-h-[400px] overflow-y-auto mb-4 pr-2">
                {ticket.messages.map(msg => (
                  <div key={msg.id} className={`flex gap-3 ${msg.isInternal ? "opacity-70" : ""}`}>
                    <Avatar className="w-8 h-8 mt-0.5">
                      <AvatarFallback className="text-[10px]">{msg.senderName[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-bold">{msg.senderName}</span>
                        <span className="text-[10px] text-muted-foreground">{formatTime(msg.createdAt)}</span>
                        {msg.isInternal && (
                          <Badge variant="secondary" className="text-[8px] gap-0.5">
                            <Lock className="w-2.5 h-2.5" /> Внутреннее
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-foreground/80">{msg.text}</p>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              <Separator className="my-3" />
              <div className="space-y-2">
                <Textarea
                  value={messageText}
                  onChange={e => setMessageText(e.target.value)}
                  placeholder="Напишите сообщение..."
                  className="min-h-[80px]"
                />
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isInternal}
                      onChange={e => setIsInternal(e.target.checked)}
                      className="rounded"
                    />
                    <Lock className="w-3 h-3" />
                    Внутренняя заметка
                  </label>
                  <Button size="sm" onClick={handleSend} disabled={!messageText.trim()}>
                    <Send className="w-4 h-4 mr-1.5" />
                    Отправить
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Управление</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground">Статус</label>
                <Select
                  value={ticket.status}
                  onValueChange={v => updateTicketStatus(ticket.id, v as TicketStatus)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="open">Открытые</SelectItem>
                    <SelectItem value="in_progress">В работе</SelectItem>
                    <SelectItem value="resolved">Решённые</SelectItem>
                    <SelectItem value="closed">Закрытые</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground">Приоритет</label>
                <Select
                  value={ticket.priority}
                  onValueChange={v => updateTicketPriority(ticket.id, v as TicketPriority)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Низкий</SelectItem>
                    <SelectItem value="medium">Средний</SelectItem>
                    <SelectItem value="high">Высокий</SelectItem>
                    <SelectItem value="critical">Критичный</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground">Назначить</label>
                <Select
                  value={ticket.assignedTo ? String(ticket.assignedTo.id) : ""}
                  onValueChange={v => assignTicket(ticket.id, Number(v))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите сотрудника" />
                  </SelectTrigger>
                  <SelectContent>
                    {employees.map(emp => (
                      <SelectItem key={emp.id} value={String(emp.id)}>
                        {emp.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Детали</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Создатель</p>
                  <p className="text-sm font-bold">{ticket.createdBy.name}</p>
                </div>
              </div>
              {ticket.assignedTo && (
                <div className="flex items-center gap-2">
                  <ExternalLink className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Назначен</p>
                    <p className="text-sm font-bold">{ticket.assignedTo.name}</p>
                  </div>
                </div>
              )}
              <div>
                <p className="text-xs text-muted-foreground">Обновлён</p>
                <p className="text-sm">{formatDate(ticket.updatedAt)}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
