import { BrowserRouter, Route, Routes } from "react-router-dom"
import { AppLayout } from "@/components/layout/app-layout"
import { TicketProvider } from "@/context/ticket-context"
import { TooltipProvider } from "@/components/ui/tooltip"
import Dashboard from "@/pages/Dashboard"
import Tickets from "@/pages/Tickets"
import TicketDetail from "@/pages/TicketDetail"
import Employees from "@/pages/Employees"
import NewTicket from "@/pages/NewTicket"
import CalendarPage from "@/pages/Calendar"
import PollsPage from "@/pages/Polls"
import FilesPage from "@/pages/Files"
import ChatsPage from "@/pages/Chats"
import ChatDetail from "@/pages/ChatDetail"
import ProfilePage from "@/pages/Profile"
import WikiPage from "@/pages/Wiki"
import NewsPage from "@/pages/News"
import Login from "@/pages/Login"
import Register from "@/pages/Register"
import NotFound from "@/pages/NotFound"

export default function App() {
  return (
    <TooltipProvider>
      <TicketProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/*" element={
              <AppLayout>
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/tickets" element={<Tickets />} />
                  <Route path="/tickets/new" element={<NewTicket />} />
                  <Route path="/tickets/:id" element={<TicketDetail />} />
                  <Route path="/employees" element={<Employees />} />
                  <Route path="/calendar" element={<CalendarPage />} />
                  <Route path="/polls" element={<PollsPage />} />
                  <Route path="/files" element={<FilesPage />} />
                  <Route path="/chats" element={<ChatsPage />} />
                  <Route path="/chats/:id" element={<ChatDetail />} />
                  <Route path="/profile" element={<ProfilePage />} />
                  <Route path="/wiki" element={<WikiPage />} />
                  <Route path="/news" element={<NewsPage />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </AppLayout>
            } />
          </Routes>
        </BrowserRouter>
      </TicketProvider>
    </TooltipProvider>
  )
}
