import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { Plus, BarChart3, CheckCheck, X } from "lucide-react"
import type { Poll, PollOption } from "@/types"

const DEMO_POLLS: Poll[] = [
  {
    id: 1, title: "Какой стек выбрать для нового проекта?", description: "Голосуем за стек технологий", multipleChoice: false,
    options: [
      { id: 1, pollId: 1, text: "React + Node.js", votesCount: 12 },
      { id: 2, pollId: 1, text: "Vue + Python", votesCount: 5 },
      { id: 3, pollId: 1, text: "Next.js + Go", votesCount: 8 },
    ],
    totalVotes: 25, myVotes: [], createdBy: 1, createdAt: "2026-07-01",
  },
  {
    id: 2, title: "Удобство интерфейса", description: "Оцените новый дизайн тикет-системы", multipleChoice: true,
    options: [
      { id: 4, pollId: 2, text: "Всё отлично", votesCount: 18 },
      { id: 5, pollId: 2, text: "Нужно доработать", votesCount: 7 },
      { id: 6, pollId: 2, text: "Неудобно", votesCount: 3 },
    ],
    totalVotes: 28, myVotes: [], createdBy: 1, createdAt: "2026-06-28",
  },
]

export default function PollsPage() {
  const [polls, setPolls] = useState<Poll[]>(DEMO_POLLS)
  const [showNew, setShowNew] = useState(false)
  const [voting, setVoting] = useState<number | null>(null)
  const [form, setForm] = useState({ title: "", description: "", options: ["", ""], multipleChoice: false })

  const createPoll = () => {
    if (!form.title.trim() || form.options.filter(o => o.trim()).length < 2) return
    const opts: PollOption[] = form.options.filter(o => o.trim()).map((text, i) => ({
      id: Date.now() + i, pollId: Date.now(), text, votesCount: 0,
    }))
    const poll: Poll = {
      id: Date.now(), title: form.title, description: form.description,
      multipleChoice: form.multipleChoice, options: opts,
      totalVotes: 0, myVotes: [], createdBy: 1, createdAt: new Date().toISOString(),
    }
    setPolls(prev => [poll, ...prev])
    setShowNew(false)
    setForm({ title: "", description: "", options: ["", ""], multipleChoice: false })
  }

  const vote = (pollId: number, optionId: number) => {
    setPolls(prev => prev.map(p => {
      if (p.id !== pollId) return p
      if (p.myVotes?.includes(optionId)) {
        const newVotes = p.myVotes.filter(v => v !== optionId)
        return {
          ...p, myVotes: newVotes, totalVotes: p.totalVotes - 1,
          options: p.options.map(o => o.id === optionId ? { ...o, votesCount: o.votesCount - 1 } : o),
        }
      }
      let newOpts = p.options.map(o => o.id === optionId ? { ...o, votesCount: o.votesCount + 1 } : o)
      let newMyVotes: number[]
      if (p.multipleChoice) {
        newMyVotes = [...(p.myVotes || []), optionId]
        return { ...p, options: newOpts, myVotes: newMyVotes, totalVotes: p.totalVotes + 1 }
      } else {
        newMyVotes = [optionId]
        newOpts = newOpts.map(o => p.myVotes?.includes(o.id) ? { ...o, votesCount: o.votesCount - 1 } : o)
        return { ...p, options: newOpts, myVotes: newMyVotes, totalVotes: p.totalVotes + 1 }
      }
    }))
  }

  const calcPct = (votes: number, total: number) => total > 0 ? Math.round(votes / total * 100) : 0

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Опросы</h1>
          <p className="text-sm text-muted-foreground mt-1">Голосование и сбор мнений</p>
        </div>
        <Button onClick={() => setShowNew(!showNew)}>
          <Plus className="w-4 h-4 mr-1.5" /> Создать опрос
        </Button>
      </div>

      {showNew && (
        <Card>
          <CardHeader><CardTitle className="text-sm">Новый опрос</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-bold">Вопрос</label>
              <Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Задайте вопрос" autoFocus />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-bold">Описание</label>
              <Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={2} />
            </div>
            {form.options.map((opt, i) => (
              <div key={i} className="space-y-1.5">
                <label className="text-sm font-bold">Вариант {i + 1}</label>
                <div className="flex gap-2">
                  <Input value={opt} onChange={e => {
                    const o = [...form.options]; o[i] = e.target.value; setForm({ ...form, options: o })
                  }} className="flex-1" />
                  {form.options.length > 2 && (
                    <Button variant="ghost" size="icon" className="text-destructive shrink-0" onClick={() => setForm({ ...form, options: form.options.filter((_, j) => j !== i) })}>
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
            <Button variant="outline" size="sm" onClick={() => setForm({ ...form, options: [...form.options, ""] })}>
              <Plus className="w-3.5 h-3.5 mr-1" /> Вариант
            </Button>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <Checkbox checked={form.multipleChoice} onCheckedChange={v => setForm({ ...form, multipleChoice: !!v })} />
              Можно выбрать несколько вариантов
            </label>
            <div className="flex gap-2">
              <Button onClick={createPoll} disabled={!form.title.trim() || form.options.filter(o => o.trim()).length < 2}>Создать</Button>
              <Button variant="outline" onClick={() => setShowNew(false)}>Отмена</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {polls.map(poll => {
          const open = voting === poll.id
          const hasVoted = (poll.myVotes?.length || 0) > 0
          return (
            <Card key={poll.id} className="flex flex-col">
              <CardContent className="p-5 flex-1 flex flex-col">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <BarChart3 className="w-4 h-4 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-bold text-sm leading-tight truncate">{poll.title}</h3>
                      {poll.description && (
                        <p className="text-[11px] text-muted-foreground truncate mt-0.5">{poll.description}</p>
                      )}
                    </div>
                  </div>

                  <div className="mt-3 space-y-2">
                    {poll.options.map(opt => {
                      const pct = calcPct(opt.votesCount, poll.totalVotes || 1)
                      const isSelected = poll.myVotes?.includes(opt.id)
                      return (
                        <div
                          key={opt.id}
                          onClick={() => vote(poll.id, opt.id)}
                          className={`relative overflow-hidden rounded-lg p-2.5 transition-all ${hasVoted ? (isSelected ? "ring-2 ring-primary bg-primary/5" : "bg-muted/30") : "cursor-pointer hover:bg-primary/10 bg-muted/50"}`}
                        >
                          {hasVoted && (
                            <div className="absolute inset-0 bg-primary/5 transition-all" style={{ width: `${pct}%` }} />
                          )}
                          <div className="relative z-10 flex items-center justify-between gap-2">
                            <div className="flex items-center gap-1.5 min-w-0">
                              {hasVoted && isSelected && <CheckCheck className="w-3 h-3 text-primary shrink-0" />}
                              <span className={`text-sm truncate ${isSelected ? "font-bold" : ""}`}>{opt.text}</span>
                            </div>
                            {hasVoted && (
                              <span className="text-xs font-bold text-muted-foreground shrink-0">{pct}%</span>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                <div className="flex items-center justify-between mt-4 pt-3 border-t text-[10px] text-muted-foreground">
                  <span>{poll.options.length} вар. · {poll.totalVotes} гол.</span>
                  {hasVoted ? (
                    <Badge variant="secondary" className="text-[9px] gap-0.5">
                      <CheckCheck className="w-2.5 h-2.5" /> Проголосовал
                    </Badge>
                  ) : (
                    <span className="text-primary font-medium">Нажмите, чтобы выбрать</span>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}
        {polls.length === 0 && (
          <div className="col-span-full text-center py-16 text-muted-foreground">
            <BarChart3 className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="font-bold text-sm">Опросов пока нет</p>
          </div>
        )}
      </div>
    </div>
  )
}
