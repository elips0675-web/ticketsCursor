import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import fs from 'fs'
import path from 'path'

const mockS3Send = vi.fn()
vi.mock('@aws-sdk/client-s3', () => ({
  S3Client: vi.fn().mockImplementation(function() { return { send: mockS3Send } }),
  PutObjectCommand: vi.fn(),
  GetObjectCommand: vi.fn(),
  DeleteObjectCommand: vi.fn(),
}))

vi.mock('@aws-sdk/s3-request-presigner', () => ({
  getSignedUrl: vi.fn().mockResolvedValue('https://s3.example.com/key'),
}))

describe('storage.js (local mode)', () => {
  const testDir = path.join(import.meta.dirname, '..', '..', 'uploads-test')

  beforeEach(() => {
    delete process.env.S3_ENDPOINT
    delete process.env.S3_BUCKET
    process.env.UPLOADS_DIR = testDir
    vi.resetModules()
  })

  afterEach(() => {
    try {
      fs.rmSync(testDir, { recursive: true, force: true })
    } catch {}
  })

  it('exports S3_ENABLED as false without S3 config', async () => {
    const mod = await import('../storage.js')
    expect(mod.S3_ENABLED).toBe(false)
  })

  it('saveFile writes to disk and returns local url', async () => {
    const { saveFile } = await import('../storage.js')
    const result = await saveFile('test', 'hello.txt', Buffer.from('world'))
    expect(result.url).toBe('/uploads/test/hello.txt')
    expect(result.storage).toBe('local')

    const filePath = path.join(testDir, 'test', 'hello.txt')
    expect(fs.existsSync(filePath)).toBe(true)
    expect(fs.readFileSync(filePath, 'utf-8')).toBe('world')
  })

  it('getFileUrl returns local path', async () => {
    const { getFileUrl } = await import('../storage.js')
    const url = await getFileUrl('test', 'file.pdf')
    expect(url).toBe('/uploads/test/file.pdf')
  })

  it('deleteFile removes file', async () => {
    const { saveFile, deleteFile } = await import('../storage.js')
    await saveFile('test', 'delete-me.txt', Buffer.from('data'))
    const filePath = path.join(testDir, 'test', 'delete-me.txt')
    expect(fs.existsSync(filePath)).toBe(true)

    await deleteFile('test', 'delete-me.txt')
    expect(fs.existsSync(filePath)).toBe(false)
  })

  it('deleteFile does not throw on missing file', async () => {
    const { deleteFile } = await import('../storage.js')
    await expect(deleteFile('test', 'nonexistent.txt')).resolves.toBeUndefined()
  })
})

describe('storage.js (S3 mode)', () => {
  beforeEach(() => {
    process.env.S3_ENDPOINT = 'https://s3.example.com'
    process.env.S3_BUCKET = 'my-bucket'
    process.env.S3_ACCESS_KEY = 'access'
    process.env.S3_SECRET_KEY = 'secret'
    vi.resetModules()
  })

  it('exports S3_ENABLED as true with S3 config', async () => {
    const mod = await import('../storage.js')
    expect(mod.S3_ENABLED).toBe(true)
  })

  it('saveFile returns S3 url', async () => {
    const mod = await import('../storage.js')
    const result = await mod.saveFile('folder', 'doc.txt', Buffer.from('content'))
    expect(result.url).toBe('folder/doc.txt')
    expect(result.storage).toBe('s3')
  })

  it('getFileUrl returns signed URL', async () => {
    const mod = await import('../storage.js')
    const url = await mod.getFileUrl('folder', 'doc.txt')
    expect(url).toBe('https://s3.example.com/key')
  })

  it('deleteFile does not throw', async () => {
    const mod = await import('../storage.js')
    await expect(mod.deleteFile('folder', 'doc.txt')).resolves.toBeUndefined()
  })
})
