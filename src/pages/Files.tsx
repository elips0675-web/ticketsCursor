import { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Search, Grid3X3, List, FileText, Image, FileCode, File, Folder } from "lucide-react"
import type { FileItem, FileFolder } from "@/types"

const FILE_ICONS: Record<string, string> = {
  img: "🖼️", pdf: "📄", doc: "📝", code: "💻", archive: "🗜️",
}

const CATEGORIES = [
  { key: "all", label: "Все", icon: Folder },
  { key: "img", label: "Изображения", icon: Image },
  { key: "pdf", label: "PDF", icon: FileText },
  { key: "doc", label: "Документы", icon: FileText },
  { key: "code", label: "Код", icon: FileCode },
]

const DEMO_FOLDERS: FileFolder[] = [
  {
    id: 1, name: "Документы", files: [
      { id: 1, name: "Отчёт Q2.pdf", size: "2.4 MB", type: "pdf", folderId: 1, createdAt: "2026-06-29" },
      { id: 2, name: "Договор поставки.docx", size: "845 KB", type: "doc", folderId: 1, createdAt: "2026-06-28" },
      { id: 3, name: "Презентация.pptx", size: "5.1 MB", type: "doc", folderId: 1, createdAt: "2026-06-25" },
    ],
  },
  {
    id: 2, name: "Дизайн", files: [
      { id: 4, name: "Макет главной.png", size: "1.8 MB", type: "img", folderId: 2, createdAt: "2026-06-28" },
      { id: 5, name: "Логотип.svg", size: "124 KB", type: "code", folderId: 2, createdAt: "2026-06-27" },
      { id: 6, name: "Баннер.jpg", size: "3.2 MB", type: "img", folderId: 2, createdAt: "2026-06-26" },
    ],
  },
  {
    id: 3, name: "Архив", files: [
      { id: 7, name: "Старая документация.pdf", size: "1.1 MB", type: "pdf", folderId: 3, createdAt: "2026-05-15" },
    ],
  },
  {
    id: 4, name: "Скрипты", files: [
      { id: 8, name: "deploy.sh", size: "2 KB", type: "code", folderId: 4, createdAt: "2026-06-30" },
      { id: 9, name: "backup.py", size: "15 KB", type: "code", folderId: 4, createdAt: "2026-06-29" },
    ],
  },
]

export default function FilesPage() {
  const [folders] = useState<FileFolder[]>(DEMO_FOLDERS)
  const [activeFolder, setActiveFolder] = useState<number>(1)
  const [category, setCategory] = useState("all")
  const [search, setSearch] = useState("")
  const [view, setView] = useState<"grid" | "list">("grid")

  const currentFolder = folders.find(f => f.id === activeFolder)
  const allFiles = useMemo(() => folders.flatMap(f => f.files.map(file => ({ ...file, folder: f.name }))), [folders])

  const displayFiles = useMemo(() => {
    const source = search ? allFiles : (currentFolder?.files || [])
    return source
      .filter(f => category === "all" || f.type === category)
      .filter(f => !search || f.name.toLowerCase().includes(search.toLowerCase()))
  }, [search, allFiles, currentFolder, category])

  const iconForType = (type: string) => FILE_ICONS[type] || "📁"

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Файлы</h1>
        <p className="text-sm text-muted-foreground mt-1">Управление файлами и документами</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {folders.map(f => (
          <button
            key={f.id}
            onClick={() => setActiveFolder(f.id)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-bold transition-all ${
              activeFolder === f.id ? "bg-primary text-primary-foreground shadow" : "bg-card border hover:bg-muted"
            }`}
          >
            <Folder className="w-4 h-4" />
            {f.name}
            <Badge variant={activeFolder === f.id ? "default" : "secondary"} className="text-[9px] ml-1">
              {f.files.length}
            </Badge>
          </button>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={search ? "🔍 Поиск по всем файлам..." : "🔍 Поиск в папке..."}
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-2">
          <Tabs value={category} onValueChange={setCategory}>
            <TabsList className="h-8">
              {CATEGORIES.map(c => (
                <TabsTrigger key={c.key} value={c.key} className="text-[10px] px-2 h-7 gap-1">
                  <c.icon className="w-3 h-3" />
                  <span className="hidden sm:inline">{c.label}</span>
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
          <Button variant="outline" size="icon" onClick={() => setView(v => v === "grid" ? "list" : "grid")}>
            {view === "grid" ? <List className="w-4 h-4" /> : <Grid3X3 className="w-4 h-4" />}
          </Button>
        </div>
      </div>

      {displayFiles.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <File className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-bold text-sm">{search ? "Ничего не найдено" : "Папка пуста"}</p>
        </div>
      ) : view === "grid" ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {displayFiles.map(f => (
            <Card key={f.id} className="hover:shadow-md transition-all hover:-translate-y-0.5 cursor-pointer">
              <CardContent className="p-5 text-center">
                <div className="text-4xl mb-3">{iconForType(f.type)}</div>
                <p className="text-sm font-bold truncate">{f.name}</p>
                <p className="text-[10px] text-muted-foreground mt-1">{f.size}{f.folder ? ` • ${f.folder}` : ""}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-2 divide-y">
            {displayFiles.map(f => (
              <div key={f.id} className="flex items-center gap-3 p-3 hover:bg-muted/50 rounded-lg cursor-pointer transition-colors">
                <span className="text-2xl w-8 text-center">{iconForType(f.type)}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold truncate">{f.name}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {f.size}{f.folder ? ` • ${f.folder}` : ""}{f.createdAt ? ` • ${f.createdAt}` : ""}
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
