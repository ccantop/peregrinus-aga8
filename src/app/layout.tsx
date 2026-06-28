import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { logout } from '@/lib/acciones/auth'
import './globals.css'

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] })
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Peregrin — Diseño de puntos de medición de gas',
  description: 'Ingeniería normativa de estaciones de medición de gas natural',
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <html lang="es" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <header
          className="shrink-0 border-b px-6 py-3 flex items-center justify-between"
          style={{ background: 'var(--panel)', borderColor: 'var(--line)' }}
        >
          <div className="flex items-center gap-6 flex-1">
            <Link href="/" className="flex items-center gap-2.5 shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo.png" alt="PEREGRIN" width={36} height={36} style={{ objectFit: 'contain' }} />
              <div className="hidden sm:flex flex-col leading-none">
                <span
                  className="text-sm font-semibold tracking-widest uppercase"
                  style={{ color: 'var(--ink)', letterSpacing: '0.15em' }}
                >
                  PEREGRIN
                </span>
                <span className="text-[9px] tracking-wide mt-0.5" style={{ color: 'var(--ink3)', letterSpacing: '0.05em' }}>
                  Gas Engineering Experts
                </span>
              </div>
            </Link>
            {user && (
              <nav className="flex items-center gap-1 ml-auto">
                <Link
                  href="/"
                  className="text-xs px-3 py-1.5 rounded transition-colors hover:bg-[#eef4f7]"
                  style={{ color: 'var(--ink2)' }}
                >
                  Nuevo proyecto
                </Link>
                <Link
                  href="/proyectos"
                  className="text-xs px-3 py-1.5 rounded transition-colors hover:bg-[#eef4f7]"
                  style={{ color: 'var(--ink2)' }}
                >
                  Mis proyectos
                </Link>
                <Link
                  href="/guia"
                  className="text-xs px-3 py-1.5 rounded transition-colors hover:bg-[#eef4f7]"
                  style={{ color: 'var(--ink2)' }}
                >
                  Guía
                </Link>
              </nav>
            )}
          </div>
          <div className="flex items-center gap-3">
            <span
              className="font-mono text-[10px] border px-2 py-0.5 rounded"
              style={{ color: 'var(--warn)', borderColor: 'var(--warn)' }}
            >
              PROTOTIPO
            </span>
            {user && (
              <>
                <span className="text-[11px]" style={{ color: 'var(--ink3)' }}>
                  {user.email}
                </span>
                <form action={logout}>
                  <button
                    type="submit"
                    className="text-xs px-3 py-1.5 rounded transition-colors hover:bg-[#eef4f7]"
                    style={{ color: 'var(--ink3)', border: '1px solid var(--line)' }}
                  >
                    Salir
                  </button>
                </form>
              </>
            )}
          </div>
        </header>
        <main className="flex-1">{children}</main>
      </body>
    </html>
  )
}
