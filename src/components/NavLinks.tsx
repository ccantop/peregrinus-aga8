'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const links = [
  { href: '/',           label: 'Nuevo proyecto' },
  { href: '/proyectos',  label: 'Mis proyectos' },
  { href: '/guia',       label: 'Guía' },
]

export function NavLinks() {
  const path = usePathname()

  const isActive = (href: string) => {
    if (href === '/') return path === '/'
    return path.startsWith(href)
  }

  return (
    <>
      {links.map(({ href, label }) => (
        <Link
          key={href}
          href={href}
          className="text-xs px-3 py-1.5 rounded transition-colors hover:bg-[#eef4f7]"
          style={isActive(href) ? {
            color: 'var(--accent)',
            background: 'rgba(74,158,187,0.08)',
            fontWeight: 600,
            borderBottom: '2px solid var(--accent)',
          } : { color: 'var(--ink2)' }}
        >
          {label}
        </Link>
      ))}
    </>
  )
}
