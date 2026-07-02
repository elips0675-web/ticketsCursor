import { Button } from "@/components/ui/button"
import { useNavigate } from "react-router-dom"

export default function NotFound() {
  const navigate = useNavigate()
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <h1 className="text-6xl font-black text-muted-foreground/20">404</h1>
      <h2 className="text-lg font-bold mt-4">Страница не найдена</h2>
      <p className="text-sm text-muted-foreground mt-1 mb-6">Такой страницы не существует</p>
      <Button onClick={() => navigate("/")}>На главную</Button>
    </div>
  )
}
