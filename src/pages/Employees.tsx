import { useState, useMemo } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Search, Phone, Mail, CheckCircle2, Clock, Users } from "lucide-react"
import { useTickets } from "@/context/ticket-context"

const roleLabels: Record<string, string> = {
  agent: "Агент", senior_agent: "Ст. агент", admin: "Администратор",
}

export default function Employees() {
  const { employees } = useTickets()
  const [search, setSearch] = useState("")

  const filtered = useMemo(() => {
    if (!search.trim()) return employees
    const q = search.toLowerCase()
    return employees.filter(e =>
      e.name.toLowerCase().includes(q) || e.department.toLowerCase().includes(q) || e.email.toLowerCase().includes(q),
    )
  }, [employees, search])

  const groupedByDept = useMemo(() => {
    const groups: Record<string, typeof employees> = {}
    filtered.forEach(e => {
      const dept = e.department || "Без отдела"
      if (!groups[dept]) groups[dept] = []
      groups[dept].push(e)
    })
    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b))
  }, [filtered])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Сотрудники</h1>
          <p className="text-sm text-muted-foreground mt-1">{employees.length} человек</p>
        </div>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Поиск сотрудников..."
          className="pl-9"
        />
      </div>

      <div className="space-y-8">
        {groupedByDept.map(([dept, emps]) => (
          <div key={dept}>
            <div className="flex items-center gap-2 mb-3">
              <Users className="w-4 h-4 text-muted-foreground" />
              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{dept}</h3>
              <Badge variant="secondary" className="text-[9px]">{emps.length}</Badge>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {emps.map(emp => <EmployeeCard key={emp.id} employee={emp} />)}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function EmployeeCard({ employee }: { employee: import("@/types").Employee }) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-5">
        <div className="flex items-start gap-4">
          <div className="relative">
            <Avatar className="w-12 h-12">
              <AvatarFallback className="text-sm bg-primary/10 text-primary">
                {employee.name.split(' ').map(n => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
            {employee.online && (
              <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-bold text-sm truncate">{employee.name}</h4>
            <Badge variant="secondary" className="text-[9px] mt-1">
              {roleLabels[employee.role] || employee.role}
            </Badge>
            <p className="text-[10px] text-muted-foreground mt-1.5">{employee.department}</p>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-4 text-[10px] text-muted-foreground">
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {employee.activeTickets} активных
          </div>
          <div className="flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-green-500" />
            {employee.resolvedToday} сегодня
          </div>
        </div>

        {(employee.email || employee.phone) && (
          <div className="mt-3 pt-3 border-t space-y-1">
            {employee.email && (
              <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                <Mail className="w-3 h-3" />
                {employee.email}
              </div>
            )}
            {employee.phone && (
              <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                <Phone className="w-3 h-3" />
                {employee.phone}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
