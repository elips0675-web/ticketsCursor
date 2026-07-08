import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Lock, Loader2, CheckCircle } from 'lucide-react'
import { useSearchParams, Link } from 'react-router-dom'
import { API_URL } from '@/lib/api'

export default function ResetPassword() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') || ''
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async () => {
    if (password !== confirm) {
      setError("Passwords don't match")
      return
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }
    setLoading(true)
    try {
      const res = await fetch(`${API_URL}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      })
      if (res.ok) setDone(true)
      else {
        const d = await res.json()
        setError(d.message || 'Error')
      }
    } catch {
      setError('Network error')
    }
    setLoading(false)
  }

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-muted/30">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <CardTitle>Invalid link</CardTitle>
            <CardDescription>This reset link is invalid or expired.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-muted/30">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-2" />
            <CardTitle>Password reset</CardTitle>
            <CardDescription>Your password has been reset successfully.</CardDescription>
          </CardHeader>
          <CardContent>
            <Link to="/login" className="text-sm text-primary hover:underline">
              Go to login
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-muted/30">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle>Set new password</CardTitle>
          <CardDescription>Enter your new password</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="New password"
              className="pl-9"
              type="password"
            />
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Confirm password"
              className="pl-9"
              type="password"
            />
          </div>
          {error && <p className="text-xs text-red-500">{error}</p>}
          <Button onClick={submit} disabled={loading || !password.trim() || !confirm.trim()} className="w-full gap-2">
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            Reset password
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
