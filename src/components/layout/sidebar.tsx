import { NavLink } from "react-router-dom"
import { Ticket, LayoutDashboard, Users, PlusCircle, Calendar, BarChart3, FileText, MessageCircle, User, HelpCircle, LogOut, BookOpen, Newspaper } from "lucide-react"
import { cn } from "@/lib/utils"

const navItems = [
  { to: "/", icon: LayoutDashboard, label: "Дашборд" },
  { to: "/chats", icon: MessageCircle, label: "Чаты" },
  { to: "/tickets", icon: Ticket, label: "Тикеты" },
  { to: "/employees", icon: Users, label: "Сотрудники" },
  { to: "/calendar", icon: Calendar, label: "Календарь" },
  { to: "/polls", icon: BarChart3, label: "Опросы" },
  { to: "/wiki", icon: BookOpen, label: "База знаний" },
  { to: "/news", icon: Newspaper, label: "Новости" },
  { to: "/files", icon: FileText, label: "Файлы" },
  { to: "/tickets/new", icon: PlusCircle, label: "Новый тикет" },
]

const bottomItems = [
  { to: "/profile", icon: User, label: "Профиль" },
  { to: "/login", icon: LogOut, label: "Выйти" },
]

export function Sidebar() {
  return (
    <aside className="hidden md:flex md:w-60 flex-col bg-sidebar text-sidebar-foreground h-screen shrink-0">
      <div className="p-5 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-sidebar-primary flex items-center justify-center">
            <Ticket className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-sm leading-tight">Service Desk</h1>
            <p className="text-[9px] text-sidebar-foreground/50 font-bold uppercase tracking-widest mt-0.5">Helpdesk</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/"}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-bold transition-colors",
                isActive
                  ? "bg-sidebar-accent text-sidebar-primary"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground",
              )
            }
          >
            <item.icon className="w-4 h-4" />
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="p-3 border-t border-sidebar-border space-y-1">
        {bottomItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-bold transition-colors",
                isActive
                  ? "bg-sidebar-accent text-sidebar-primary"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground",
              )
            }
          >
            <item.icon className="w-4 h-4" />
            {item.label}
          </NavLink>
        ))}
      </div>
    </aside>
  )
}
