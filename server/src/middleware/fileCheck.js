import { fileTypeFromFile } from 'file-type'
import fs from 'fs'

const ALLOWED_EXTENSIONS = new Set([
  'jpg', 'jpeg', 'png', 'gif', 'webp', 'pdf', 'doc', 'docx', 'xls', 'xlsx',
  'txt', 'zip', 'rar', 'gz', '7z',
])

export async function validateFileType(filePath) {
  try {
    const type = await fileTypeFromFile(filePath)
    if (!type) {
      const ext = filePath.split('.').pop()?.toLowerCase()
      if (ext === 'txt') return true
      fs.unlink(filePath, () => {})
      return false
    }
    if (!ALLOWED_EXTENSIONS.has(type.ext)) {
      fs.unlink(filePath, () => {})
      return false
    }
    return true
  } catch {
    return false
  }
}

export function createFileCheckMiddleware(fields) {
  return async (req, res, next) => {
    const files = fields.flatMap((f) => {
      const val = req.files?.[f] || req.file?.[f] || []
      return Array.isArray(val) ? val : [val].filter(Boolean)
    })
    for (const file of files) {
      const valid = await validateFileType(file.path)
      if (!valid) {
        return res.status(400).json({ message: `Недопустимый тип файла: ${file.originalname}` })
      }
    }
    next()
  }
}
