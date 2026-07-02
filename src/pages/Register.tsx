import { useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

const DEPARTMENTS = [
  { id: 1, name: "IT" },
  { id: 2, name: "Поддержка" },
  { id: 3, name: "Разработка" },
  { id: 4, name: "Бухгалтерия" },
  { id: 5, name: "HR" },
]

export default function Register() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: "", email: "", password: "", department: "", title: "" })
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    if (!form.name.trim() || !form.email.trim() || !form.password) {
      setError("Заполните обязательные поля")
      return
    }
    if (form.password.length < 6) {
      setError("Пароль должен быть минимум 6 символов")
      return
    }
    setLoading(true)
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || data.message || "Ошибка регистрации")
        return
      }
      localStorage.setItem("token", data.token)
      navigate("/")
    } catch {
      setError("Ошибка соединения с сервером")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-muted/30">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 rounded-xl bg-primary flex items-center justify-center mb-3">
            <span className="text-white font-bold text-lg">SD</span>
          </div>
          <CardTitle>Регистрация</CardTitle>
          <CardDescription>Создайте учётную запись</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm font-medium">{error}</div>
            )}
            <div className="space-y-1.5">
              <label className="text-sm font-bold">Имя и фамилия</label>
              <Input
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                placeholder="Иван Петров"
                required
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-bold">Email</label>
              <Input
                type="email"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                placeholder="ivan@company.ru"
                required
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-bold">Пароль</label>
              <Input
                type="password"
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                placeholder="Минимум 6 символов"
                minLength={6}
                required
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-bold">Отдел</label>
              <Select value={form.department} onValueChange={v => setForm({ ...form, department: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Выберите отдел" />
                </SelectTrigger>
                <SelectContent>
                  {DEPARTMENTS.map(d => (
                    <SelectItem key={d.id} value={String(d.id)}>{d.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-bold">Должность</label>
              <Input
                value={form.title}
                onChange={e => setForm({ ...form, title: e.target.value })}
                placeholder="Например: Junior Developer"
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Регистрация..." : "Зарегистрироваться"}
            </Button>
          </form>
          <div className="text-center text-sm text-muted-foreground mt-6">
            Уже есть аккаунт?{" "}
            <Link to="/login" className="text-primary font-bold hover:underline">Войти</Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
