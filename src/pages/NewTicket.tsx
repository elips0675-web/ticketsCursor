import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useTickets } from "@/context/ticket-context"
import { ArrowLeft, Send } from "lucide-react"
import type { TicketPriority } from "@/types"

export default function NewTicket() {
  const navigate = useNavigate()
  const { createTicket } = useTickets()
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [priority, setPriority] = useState<TicketPriority>("medium")
  const [category, setCategory] = useState("support")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !description.trim()) return
    createTicket({ title, description, priority, category })
    navigate("/tickets")
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Button variant="ghost" size="sm" onClick={() => navigate("/tickets")} className="gap-1.5">
        <ArrowLeft className="w-4 h-4" />
        Назад к тикетам
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>Новый тикет</CardTitle>
          <CardDescription>Создайте обращение в службу поддержки</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-sm font-bold">Тема</label>
              <Input
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="Кратко опишите проблему"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-bold">Описание</label>
              <Textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Подробно опишите проблему..."
                className="min-h-[150px]"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-bold">Приоритет</label>
                <Select value={priority} onValueChange={v => setPriority(v as TicketPriority)}>
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
                <label className="text-sm font-bold">Категория</label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bug">Баг/Ошибка</SelectItem>
                    <SelectItem value="feature">Улучшение</SelectItem>
                    <SelectItem value="support">Поддержка</SelectItem>
                    <SelectItem value="incident">Инцидент</SelectItem>
                    <SelectItem value="other">Другое</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" type="button" onClick={() => navigate("/tickets")}>Отмена</Button>
              <Button type="submit" disabled={!title.trim() || !description.trim()}>
                <Send className="w-4 h-4 mr-1.5" />
                Создать тикет
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
