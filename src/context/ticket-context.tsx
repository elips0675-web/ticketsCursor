import { createContext, useContext, useState, useCallback, type ReactNode } from "react"
import type { Ticket, TicketStats, Employee, TicketStatus, TicketPriority } from "@/types"
import { DEMO_TICKETS, DEMO_EMPLOYEES, DEMO_STATS } from "@/lib/demo-data"

interface TicketContextType {
  tickets: Ticket[]
  employees: Employee[]
  stats: TicketStats
  updateTicketStatus: (id: number, status: TicketStatus) => void
  updateTicketPriority: (id: number, priority: TicketPriority) => void
  assignTicket: (id: number, employeeId: number) => void
  addMessage: (ticketId: number, text: string, isInternal: boolean) => void
  createTicket: (ticket: { title: string; description: string; priority: TicketPriority; category: string }) => void
}

const TicketContext = createContext<TicketContextType | null>(null)

export function TicketProvider({ children }: { children: ReactNode }) {
  const [tickets, setTickets] = useState<Ticket[]>(DEMO_TICKETS)
  const [employees] = useState<Employee[]>(DEMO_EMPLOYEES)

  const stats: TicketStats = {
    total: tickets.length,
    open: tickets.filter(t => t.status === 'open').length,
    inProgress: tickets.filter(t => t.status === 'in_progress').length,
    resolved: tickets.filter(t => t.status === 'resolved').length,
    critical: tickets.filter(t => t.priority === 'critical').length,
    avgResolutionTime: 4.5,
  }

  const updateTicketStatus = useCallback((id: number, status: TicketStatus) => {
    setTickets(prev => prev.map(t => t.id === id ? { ...t, status, updatedAt: new Date().toISOString() } : t))
  }, [])

  const updateTicketPriority = useCallback((id: number, priority: TicketPriority) => {
    setTickets(prev => prev.map(t => t.id === id ? { ...t, priority, updatedAt: new Date().toISOString() } : t))
  }, [])

  const assignTicket = useCallback((id: number, employeeId: number) => {
    const emp = employees.find(e => e.id === employeeId)
    setTickets(prev => prev.map(t => t.id === id ? { ...t, assignedTo: emp, updatedAt: new Date().toISOString() } : t))
  }, [employees])

  const addMessage = useCallback((ticketId: number, text: string, isInternal: boolean) => {
    setTickets(prev => prev.map(t => {
      if (t.id !== ticketId) return t
      const newMsg = {
        id: Date.now(),
        ticketId,
        senderId: 1,
        senderName: "Алексей Петров",
        senderAvatar: "",
        text,
        attachments: [],
        createdAt: new Date().toISOString(),
        isInternal,
      }
      return { ...t, messages: [...t.messages, newMsg], updatedAt: new Date().toISOString() }
    }))
  }, [])

  const createTicket = useCallback((data: { title: string; description: string; priority: TicketPriority; category: string }) => {
    const newTicket: Ticket = {
      id: Date.now(),
      title: data.title,
      description: data.description,
      status: "open",
      priority: data.priority as TicketPriority,
      category: data.category as any,
      createdBy: { id: 1, name: "Алексей Петров", email: "alexey@example.com", avatar: "" },
      messages: [{
        id: Date.now(),
        ticketId: Date.now(),
        senderId: 1,
        senderName: "Алексей Петров",
        senderAvatar: "",
        text: data.description,
        attachments: [],
        createdAt: new Date().toISOString(),
        isInternal: false,
      }],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      tags: [],
    }
    setTickets(prev => [newTicket, ...prev])
  }, [])

  return (
    <TicketContext.Provider value={{ tickets, employees, stats, updateTicketStatus, updateTicketPriority, assignTicket, addMessage, createTicket }}>
      {children}
    </TicketContext.Provider>
  )
}

export function useTickets() {
  const ctx = useContext(TicketContext)
  if (!ctx) throw new Error("useTickets must be used within TicketProvider")
  return ctx
}
