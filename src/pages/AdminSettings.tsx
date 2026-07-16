import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'
import { Save, Loader2, Eye, EyeOff, Database, Server, FileText, Search, RefreshCw } from 'lucide-react'
import { api } from '@/lib/api'

const FIELDS = [
  { key: 'COMPANY_NAME', label: 'companyName', type: 'text', section: 'companySettings' },
  { key: 'COMPANY_LOGO', label: 'companyLogo', type: 'text', section: 'companySettings' },
  { key: 'TIMEZONE', label: 'timezone', type: 'text', section: 'companySettings' },
  { key: 'DEFAULT_LANGUAGE', label: 'defaultLanguage', type: 'text', section: 'companySettings' },
  { key: 'AUTO_ASSIGN', label: 'autoAssign', type: 'text', section: 'ticketSettings' },
  { key: 'SLA_RESPONSE_HOURS', label: 'slaResponseHours', type: 'text', section: 'ticketSettings' },
  { key: 'TELEGRAM_BOT_TOKEN', label: 'telegramToken', type: 'password', section: 'telegramSettings' },
  { key: 'SMTP_HOST', label: 'smtpHost', type: 'text', section: 'emailSettings' },
  { key: 'SMTP_PORT', label: 'smtpPort', type: 'text', section: 'emailSettings' },
  { key: 'SMTP_SECURE', label: 'smtpSecure', type: 'text', section: 'emailSettings' },
  { key: 'SMTP_USER', label: 'smtpUser', type: 'text', section: 'emailSettings' },
  { key: 'SMTP_PASS', label: 'smtpPass', type: 'password', section: 'emailSettings' },
  { key: 'SMTP_FROM', label: 'smtpFrom', type: 'text', section: 'emailSettings' },
  { key: 'LDAP_URL', label: 'ldapUrl', type: 'text', section: 'ldapSettings' },
  { key: 'LDAP_BASE_DN', label: 'ldapBaseDn', type: 'text', section: 'ldapSettings' },
  { key: 'LDAP_BIND_DN', label: 'ldapBindDn', type: 'text', section: 'ldapSettings' },
  { key: 'LDAP_BIND_CREDENTIALS', label: 'ldapBindCredentials', type: 'password', section: 'ldapSettings' },
]

export default function AdminSettings() {
  const { t } = useTranslation()
  const [values, setValues] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [show, setShow] = useState<Record<string, boolean>>({})

  useEffect(() => {
    api
      .get('/admin/settings')
      .then((data) => {
        setValues(data || {})
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const save = async () => {
    setSaving(true)
    try {
      await api.put('/admin/settings', values)
      toast.success(t('admin.saveSuccess'))
    } catch {
      /* toast handled by api client */
    }
    setSaving(false)
  }

  const sections = [...new Set(FIELDS.map((f) => f.section))]

  if (loading)
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    )

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t('admin.settings')}</h1>
        <p className="text-sm text-muted-foreground mt-1">{t('admin.settingsSubtitle')}</p>
      </div>

      {sections.map((section) => (
        <Card key={section}>
          <CardHeader>
            <CardTitle className="text-sm">{t(`admin.${section}`)}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {FIELDS.filter((f) => f.section === section).map((f) => (
              <div key={f.key}>
                <Label htmlFor={f.key} className="text-xs font-bold">
                  {t(`admin.${f.label}`)}
                </Label>
                <div className="relative mt-1">
                  <Input
                    id={f.key}
                    type={f.type === 'password' && !show[f.key] ? 'password' : 'text'}
                    value={values[f.key] || ''}
                    onChange={(e) => setValues((prev) => ({ ...prev, [f.key]: e.target.value }))}
                    className="pr-8"
                  />
                  {f.type === 'password' && (
                    <button
                      type="button"
                      onClick={() => setShow((prev) => ({ ...prev, [f.key]: !prev[f.key] }))}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground"
                    >
                      {show[f.key] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      ))}

      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Server className="w-4 h-4 text-primary" />
            {t('admin.operations')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="flex items-start gap-3">
              <Database className="w-5 h-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm font-medium">{t('admin.redisTitle')}</p>
                <p className="text-xs text-muted-foreground">{t('admin.redisDesc')}</p>
              </div>
            </div>
            <RedisStatus />
          </div>

          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="flex items-start gap-3">
              <FileText className="w-5 h-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm font-medium">{t('admin.backupTitle')}</p>
                <p className="text-xs text-muted-foreground">{t('admin.backupDesc')}</p>
              </div>
            </div>
            <ActionButton
              action="backup"
              label={t('admin.backupBtn')}
              runningLabel={t('admin.backupRunning')}
              doneLabel={t('admin.backupDone')}
            />
          </div>

          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="flex items-start gap-3">
              <Database className="w-5 h-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm font-medium">{t('admin.seedTitle')}</p>
                <p className="text-xs text-muted-foreground">{t('admin.seedDesc')}</p>
              </div>
            </div>
            <ActionButton
              action="seed"
              label={t('admin.seedBtn')}
              runningLabel={t('admin.seedRunning')}
              doneLabel={t('admin.seedDone')}
            />
          </div>

          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="flex items-start gap-3">
              <Search className="w-5 h-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm font-medium">{t('admin.geoTitle')}</p>
                <p className="text-xs text-muted-foreground">{t('admin.geoDesc')}</p>
              </div>
            </div>
            <ActionButton
              action="geo"
              label={t('admin.geoBtn')}
              runningLabel={t('admin.geoRunning')}
              doneLabel={t('admin.geoDone')}
            />
          </div>
        </CardContent>
      </Card>

      <Button onClick={save} disabled={saving} className="gap-2">
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
        {saving ? t('common.loading') : t('common.save')}
      </Button>
    </div>
  )
}

function RedisStatus() {
  const { t } = useTranslation()
  const [url, setUrl] = useState('')
  const [connected, setConnected] = useState(false)
  const [loading, setLoading] = useState(true)
  const [showInput, setShowInput] = useState(false)
  const [inputUrl, setInputUrl] = useState('')

  useEffect(() => {
    api
      .get('/admin/settings/redis-status')
      .then((d: any) => {
        if (d) {
          setUrl(d.url || '')
          setConnected(d.connected)
          setInputUrl(d.url || '')
        }
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const saveUrl = async () => {
    await api.put('/admin/settings/redis', { url: inputUrl })
    setUrl(inputUrl)
    setConnected(false)
    setShowInput(false)
    toast.success(t('admin.saveSuccess'))
  }

  if (loading) return <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />

  return (
    <div className="flex items-center gap-2 shrink-0">
      {showInput ? (
        <div className="flex items-center gap-2">
          <Input
            value={inputUrl}
            onChange={(e) => setInputUrl(e.target.value)}
            placeholder={t('admin.redisEnterUrl')}
            className="w-44 h-8 text-xs"
          />
          <Button size="sm" variant="default" onClick={saveUrl} className="h-8 text-xs">
            {t('admin.redisSave')}
          </Button>
        </div>
      ) : (
        <>
          <span
            className={`text-xs font-medium px-2 py-0.5 rounded-full ${connected ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-muted text-muted-foreground'}`}
          >
            {connected ? t('admin.redisOn') : t('admin.redisOff')}
          </span>
          <Button size="sm" variant="outline" onClick={() => setShowInput(true)} className="h-7 text-xs">
            <RefreshCw className="w-3 h-3 mr-1" />
            {url ? t('common.edit') : t('common.add')}
          </Button>
        </>
      )}
    </div>
  )
}

function ActionButton({
  action,
  label,
  runningLabel,
  doneLabel,
}: {
  action: string
  label: string
  runningLabel: string
  doneLabel: string
}) {
  const [state, setState] = useState<'idle' | 'running' | 'done'>('idle')

  const run = async () => {
    setState('running')
    try {
      await api.post(`/admin/settings/${action}`)
      setState('done')
      toast.success(doneLabel)
      setTimeout(() => setState('idle'), 3000)
    } catch {
      setState('idle')
    }
  }

  return (
    <Button size="sm" onClick={run} disabled={state === 'running'} className="shrink-0 gap-1.5">
      {state === 'running' && <Loader2 className="w-3 h-3 animate-spin" />}
      {state === 'running' ? runningLabel : label}
    </Button>
  )
}
