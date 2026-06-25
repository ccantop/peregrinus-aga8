'use client'

import { useState } from 'react'
import Link from 'next/link'
import { signup } from '@/lib/acciones/auth'

const field = 'w-full bg-[#f2f7f9] border border-[#cddde5] text-[#1b3044] rounded-md px-3 py-2.5 text-sm focus:outline-none focus:border-[#4a9ebb]'

export default function SignupPage() {
  const [err,     setErr]     = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setErr('')
    const fd = new FormData(e.currentTarget)
    if (fd.get('password') !== fd.get('password2')) {
      setErr('Las contraseñas no coinciden.')
      return
    }
    setLoading(true)
    const res = await signup(fd)
    setLoading(false)
    if (res?.error) setErr(res.error)
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4"
      style={{ background: 'var(--bg)' }}>
      <div className="w-full max-w-sm">

        <div className="text-center mb-8">
          <p className="text-2xl font-semibold tracking-widest uppercase mb-1"
            style={{ color: 'var(--accent)', letterSpacing: '0.15em' }}>
            PEREGRIN
          </p>
          <p className="text-xs" style={{ color: 'var(--ink3)' }}>
            Diseño de puntos de medición de gas natural
          </p>
        </div>

        <div className="rounded-xl border p-7" style={{ background: 'var(--panel)', borderColor: 'var(--line)' }}>
          <h1 className="text-base font-semibold mb-5" style={{ color: 'var(--ink)' }}>
            Crear cuenta
          </h1>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="block text-xs mb-1.5" style={{ color: 'var(--ink3)' }}>
                Correo electrónico
              </label>
              <input
                type="email" name="email" required autoComplete="email"
                className={field} placeholder="tu@correo.com"
              />
            </div>
            <div>
              <label className="block text-xs mb-1.5" style={{ color: 'var(--ink3)' }}>
                Contraseña
              </label>
              <input
                type="password" name="password" required minLength={8}
                autoComplete="new-password" className={field} placeholder="Mínimo 8 caracteres"
              />
            </div>
            <div>
              <label className="block text-xs mb-1.5" style={{ color: 'var(--ink3)' }}>
                Confirmar contraseña
              </label>
              <input
                type="password" name="password2" required
                autoComplete="new-password" className={field} placeholder="Repite la contraseña"
              />
            </div>

            {err && (
              <p className="text-xs rounded-md px-3 py-2"
                style={{ background: 'rgba(184,64,48,0.08)', color: '#b84030', border: '1px solid rgba(184,64,48,0.2)' }}>
                {err}
              </p>
            )}

            <button
              type="submit" disabled={loading}
              className="w-full rounded-md py-2.5 text-sm font-semibold transition-opacity hover:opacity-90 disabled:opacity-50 mt-1"
              style={{ background: 'var(--accent)', color: '#fff' }}
            >
              {loading ? 'Creando cuenta…' : 'Crear cuenta →'}
            </button>
          </form>

          <p className="text-xs text-center mt-5" style={{ color: 'var(--ink3)' }}>
            ¿Ya tienes cuenta?{' '}
            <Link href="/auth/login" className="hover:underline" style={{ color: 'var(--accent)' }}>
              Iniciar sesión
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
