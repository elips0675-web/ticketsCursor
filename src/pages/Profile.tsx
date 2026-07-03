import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { User, Mail, Phone, Briefcase, MapPin, FileText, Settings, Camera, Save, Monitor } from "lucide-react"

const DEMO_USER = {
  id: 1,
  name: "Алексей Петров",
  email: "alexey@example.com",
  phone: "+7 (995) 123-45-67",
  role: "admin",
  department: "IT",
  title: "Системный администратор",
  bio: "Отвечаю за IT-инфраструктуру, серверы и тикет-систему. Люблю автоматизацию и порядок.",
  online: true,
}

const DEMO_FILES = [
  { id: 1, name: "Скрипт деплоя.sh", size: "2.4 KB", date: "2026-07-01" },
  { id: 2, name: "Инструкция по VPN.pdf", size: "1.2 MB", date: "2026-06-28" },
  { id: 3, name: "Логотип.png", size: "345 KB", date: "2026-06-25" },
]

export default function ProfilePage() {
  const [editing, setEditing] = useState(false)
  const [user, setUser] = useState(DEMO_USER)
  const [form, setForm] = useState({ ...DEMO_USER })
  const [sysInfo, setSysInfo] = useState({ computerName: "", userAccount: "" })

  const updateSysInfo = () => {
    const name = (document.getElementById("sys-computer") as HTMLInputElement)?.value || ""
    const account = (document.getElementById("sys-account") as HTMLInputElement)?.value || ""
    setSysInfo({ computerName: name, userAccount: account })
    localStorage.setItem("sysInfo", JSON.stringify({ computerName: name, userAccount: account }))
  }

  useEffect(() => {
    const saved = localStorage.getItem("sysInfo")
    if (saved) { setSysInfo(JSON.parse(saved)); return }
    fetch("/api/system-info").then(r => r.ok && r.json()).then(data => {
      if (data) {
        setSysInfo({ computerName: data.computerName, userAccount: data.userAccount })
        localStorage.setItem("sysInfo", JSON.stringify({ computerName: data.computerName, userAccount: data.userAccount }))
      }
    }).catch(() => {})
  }, [])

  const saveProfile = () => {
    setUser({ ...form })
    setEditing(false)
  }

  const cancelEdit = () => {
    setForm({ ...user })
    setEditing(false)
  }

  const initials = user.name.split(" ").map(n => n[0]).join("")
  const roleLabels: Record<string, string> = { agent: "Агент", senior_agent: "Ст. агент", admin: "Администратор" }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Профиль</h1>
        <p className="text-sm text-muted-foreground mt-1">Управление аккаунтом</p>
      </div>

      <Tabs defaultValue="profile">
        <TabsList>
          <TabsTrigger value="profile" className="gap-1.5"><User className="w-3.5 h-3.5" /> Профиль</TabsTrigger>
          <TabsTrigger value="files" className="gap-1.5"><FileText className="w-3.5 h-3.5" /> Файлы</TabsTrigger>
          <TabsTrigger value="settings" className="gap-1.5"><Settings className="w-3.5 h-3.5" /> Настройки</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="mt-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-start gap-5 mb-6">
                <div className="relative">
                  <Avatar className="w-16 h-16 ring-2 ring-primary/20">
                    <AvatarFallback className="text-lg bg-primary/10 text-primary">{initials}</AvatarFallback>
                  </Avatar>
                  {user.online && <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-green-500 border-2 border-white rounded-full" />}
                </div>
                <div className="flex-1 min-w-0">
                  {editing ? (
                    <div className="space-y-2">
                      <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
                      <Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
                    </div>
                  ) : (
                    <>
                      <h2 className="text-lg font-bold">{user.name}</h2>
                      <p className="text-sm text-muted-foreground">{user.title}</p>
                      <Badge variant="secondary" className="mt-2 text-[9px]">{roleLabels[user.role] || user.role} • {user.department}</Badge>
                    </>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                {editing ? (
                  <>
                    <div className="space-y-1.5"><label className="text-sm font-bold flex items-center gap-2"><Mail className="w-3.5 h-3.5" /> Email</label><Input value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></div>
                    <div className="space-y-1.5"><label className="text-sm font-bold flex items-center gap-2"><Phone className="w-3.5 h-3.5" /> Телефон</label><Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} /></div>
                    <div className="space-y-1.5"><label className="text-sm font-bold flex items-center gap-2"><Briefcase className="w-3.5 h-3.5" /> Должность</label><Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} /></div>
                    <div className="space-y-1.5"><label className="text-sm font-bold flex items-center gap-2"><FileText className="w-3.5 h-3.5" /> О себе</label><Textarea value={form.bio} onChange={e => setForm({ ...form, bio: e.target.value })} rows={3} /></div>
                    <div className="flex gap-2 pt-2">
                      <Button onClick={saveProfile} className="gap-1.5"><Save className="w-4 h-4" /> Сохранить</Button>
                      <Button variant="outline" onClick={cancelEdit}>Отмена</Button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-3 py-2 border-b"><Mail className="w-4 h-4 text-muted-foreground" /><div><p className="text-xs text-muted-foreground">Email</p><p className="text-sm font-medium">{user.email}</p></div></div>
                    <div className="flex items-center gap-3 py-2 border-b"><Phone className="w-4 h-4 text-muted-foreground" /><div><p className="text-xs text-muted-foreground">Телефон</p><p className="text-sm font-medium">{user.phone}</p></div></div>
                    <div className="flex items-center gap-3 py-2 border-b"><Briefcase className="w-4 h-4 text-muted-foreground" /><div><p className="text-xs text-muted-foreground">Должность</p><p className="text-sm font-medium">{user.title}</p></div></div>
                    <div className="flex items-center gap-3 py-2 border-b"><MapPin className="w-4 h-4 text-muted-foreground" /><div><p className="text-xs text-muted-foreground">Отдел</p><p className="text-sm font-medium">{user.department}</p></div></div>
                    {user.bio && <div className="py-2"><p className="text-xs text-muted-foreground mb-1">О себе</p><p className="text-sm">{user.bio}</p></div>}
                    <div className="flex gap-2 pt-2">
                      <Button variant="outline" onClick={() => setEditing(true)} className="gap-1.5"><Camera className="w-4 h-4" /> Редактировать</Button>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
          <Card className="mt-4">
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-3">
                <Monitor className="w-4 h-4 text-primary" />
                <h3 className="font-bold text-sm">Текущее устройство</h3>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Имя компьютера</label>
                  <Input id="sys-computer" defaultValue={sysInfo.computerName} onChange={updateSysInfo} placeholder="Например: PC-IT-01" className="text-sm" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Учётная запись</label>
                  <Input id="sys-account" defaultValue={sysInfo.userAccount} onChange={updateSysInfo} placeholder="Домен\Пользователь" className="text-sm" />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="files" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <FileText className="w-4 h-4 text-primary" />
                Мои файлы ({DEMO_FILES.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {DEMO_FILES.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">Нет файлов</p>
              ) : (
                <div className="space-y-2">
                  {DEMO_FILES.map(f => (
                    <div key={f.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                        <FileText className="w-4 h-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold truncate">{f.name}</p>
                        <p className="text-[10px] text-muted-foreground">{f.size} • {f.date}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Настройки</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Уведомления</p>
                <label className="flex items-center justify-between py-2">
                  <span className="text-sm font-medium">Звук уведомлений</span>
                  <input type="checkbox" defaultChecked className="rounded" />
                </label>
                <label className="flex items-center justify-between py-2">
                  <span className="text-sm font-medium">Push-уведомления</span>
                  <input type="checkbox" defaultChecked className="rounded" />
                </label>
              </div>
              <div className="space-y-3 pt-3 border-t">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Приватность</p>
                <label className="flex items-center justify-between py-2">
                  <span className="text-sm font-medium">Показывать онлайн-статус</span>
                  <input type="checkbox" defaultChecked className="rounded" />
                </label>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
