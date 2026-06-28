'use client'

import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import type { TecnologiaKey } from '@/types/medicion'

interface Vista3DProps {
  techKey: TecnologiaKey
  diametroPulg: number
}

function pr(diam: number) { return Math.max(0.14, Math.min(0.45, diam / 16)) }

const M = {
  pipe:    () => new THREE.MeshStandardMaterial({ color: 0x4a7a7a, metalness: 0.7, roughness: 0.3 }),
  flange:  () => new THREE.MeshStandardMaterial({ color: 0x6a9080, metalness: 0.8, roughness: 0.25 }),
  valve:   () => new THREE.MeshStandardMaterial({ color: 0xc08030, metalness: 0.6, roughness: 0.35 }),
  accent:  () => new THREE.MeshStandardMaterial({ color: 0x9fd13a, metalness: 0.4, roughness: 0.3 }),
  body:    () => new THREE.MeshStandardMaterial({ color: 0x344830, metalness: 0.65, roughness: 0.4 }),
  dark:    () => new THREE.MeshStandardMaterial({ color: 0x0d1209, metalness: 0.3, roughness: 0.8 }),
  silver:  () => new THREE.MeshStandardMaterial({ color: 0x9ab0a0, metalness: 0.85, roughness: 0.2 }),
  orange:  () => new THREE.MeshStandardMaterial({ color: 0xe05020, metalness: 0.5, roughness: 0.35 }),
  teal:    () => new THREE.MeshStandardMaterial({ color: 0x30b0b0, metalness: 0.6, roughness: 0.25 }),
}

function seg(scene: THREE.Object3D, x1: number, x2: number, r: number) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, x2 - x1, 24), M.pipe())
  m.rotation.z = Math.PI / 2
  m.position.set((x1 + x2) / 2, 0, 0)
  scene.add(m)
}

function flange(scene: THREE.Object3D, x: number, r: number) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(r * 1.5, r * 1.5, 0.1, 24), M.flange())
  m.rotation.z = Math.PI / 2
  m.position.set(x, 0, 0)
  scene.add(m)
}

function valve(scene: THREE.Object3D, x: number, r: number) {
  // cuerpo
  const b = new THREE.Mesh(new THREE.BoxGeometry(0.32, r * 2.4, r * 2.4), M.valve())
  b.position.set(x, 0, 0)
  scene.add(b)
  // vástago
  const v = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.13, r * 0.13, r * 2.2, 10), M.valve())
  v.position.set(x, r * 1.8, 0)
  scene.add(v)
  // volante
  const h = new THREE.Mesh(new THREE.TorusGeometry(r * 0.55, r * 0.07, 8, 18), M.accent())
  h.position.set(x, r * 3.1, 0)
  scene.add(h)
  const s = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.06, r * 0.06, r * 1.1, 8), M.accent())
  s.rotation.z = Math.PI / 2
  s.position.set(x, r * 3.1, 0)
  scene.add(s)
}

// ── ULTRASÓNICO ───────────────────────────────────────────────────────────────
// Spool largo con 4 pares de transductores inclinados en la pared
function buildUltrasonico(scene: THREE.Object3D, r: number) {
  const spoolLen = 2.4
  // cuerpo spool — más largo y grueso que la tubería
  const spool = new THREE.Mesh(
    new THREE.CylinderGeometry(r * 1.45, r * 1.45, spoolLen, 32),
    new THREE.MeshStandardMaterial({ color: 0x2a4a48, metalness: 0.7, roughness: 0.3 })
  )
  spool.rotation.z = Math.PI / 2
  scene.add(spool)
  flange(scene, -spoolLen / 2, r)
  flange(scene, spoolLen / 2, r)

  // 4 pares de transductores (cilindros angulados en la pared del spool)
  const positions = [-0.8, -0.25, 0.25, 0.8]
  positions.forEach((xPos, i) => {
    const angle = (i % 2 === 0 ? 0 : Math.PI / 2)
    for (const side of [1, -1]) {
      const tLen = r * 0.9
      const t = new THREE.Mesh(
        new THREE.CylinderGeometry(r * 0.095, r * 0.095, tLen, 10),
        M.teal()
      )
      const oy = side * r * 1.45
      const oz = Math.sin(angle) * side * r * 0.6
      t.position.set(xPos, oy, oz)
      // inclinar ~30° hacia el eje
      t.rotation.x = -side * 0.5
      scene.add(t)
      // cabeza del transductor
      const head = new THREE.Mesh(new THREE.SphereGeometry(r * 0.16, 10, 8), M.accent())
      head.position.set(xPos, oy + side * tLen * 0.5, oz)
      scene.add(head)
    }
  })

  // cable de señal (línea visual)
  const cableGeo = new THREE.CylinderGeometry(r * 0.03, r * 0.03, 0.8, 6)
  for (const xPos of [-0.5, 0.5]) {
    const c = new THREE.Mesh(cableGeo, M.dark())
    c.position.set(xPos, r * 2.2, 0)
    scene.add(c)
  }
  // caja de electrónica arriba
  const box = new THREE.Mesh(new THREE.BoxGeometry(1.6, r * 0.7, r * 0.9), M.body())
  box.position.set(0, r * 2.6, 0)
  scene.add(box)
}

// ── ORIFICIO ──────────────────────────────────────────────────────────────────
// Plato de orificio bien visible entre dos bridas gruesas, con manifold ΔP
function buildOrificio(scene: THREE.Object3D, r: number) {
  // segmentos de tubo a cada lado de las bridas
  seg(scene, -1.1, -0.07, r)
  seg(scene, 0.07, 1.1, r)

  // bridas de orificio — más gruesas
  for (const x of [-0.07, 0.07]) {
    const f = new THREE.Mesh(
      new THREE.CylinderGeometry(r * 1.75, r * 1.75, 0.13, 32),
      M.flange()
    )
    f.rotation.z = Math.PI / 2
    f.position.set(x, 0, 0)
    scene.add(f)
    // pernos (8 cilindros alrededor)
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2
      const bolt = new THREE.Mesh(
        new THREE.CylinderGeometry(r * 0.06, r * 0.06, 0.35, 6),
        M.silver()
      )
      bolt.rotation.z = Math.PI / 2
      bolt.position.set(x, Math.sin(a) * r * 1.55, Math.cos(a) * r * 1.55)
      scene.add(bolt)
    }
  }
  // plato de orificio — disco verde visible
  const plate = new THREE.Mesh(
    new THREE.CylinderGeometry(r * 1.72, r * 1.72, 0.055, 32),
    M.accent()
  )
  plate.rotation.z = Math.PI / 2
  scene.add(plate)
  // agujero (disco negro al centro)
  const hole = new THREE.Mesh(
    new THREE.CylinderGeometry(r * 0.6, r * 0.6, 0.075, 24),
    M.dark()
  )
  hole.rotation.z = Math.PI / 2
  scene.add(hole)

  // tomas de presión diferencial — tubos que suben
  for (const [xOff, zOff] of [[-0.1, r * 1.72], [0.1, r * 1.72]]) {
    const tap = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.09, r * 0.09, r * 1.4, 8), M.silver())
    tap.position.set(xOff, r * 1.72, zOff * 0)
    scene.add(tap)
    // codo hacia el manifold
    const elbow = new THREE.Mesh(new THREE.TorusGeometry(r * 0.25, r * 0.07, 8, 12, Math.PI / 2), M.silver())
    elbow.position.set(xOff, r * 2.4, 0)
    scene.add(elbow)
  }
  // manifold ΔP (caja horizontal entre las dos tomas)
  const manifold = new THREE.Mesh(new THREE.BoxGeometry(0.4, r * 0.5, r * 0.5), M.body())
  manifold.position.set(0, r * 2.5, 0)
  scene.add(manifold)
  // indicador de ΔP
  const ind = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.35, r * 0.35, r * 0.18, 16), M.orange())
  ind.position.set(0, r * 2.9, 0)
  scene.add(ind)
}

// ── TURBINA ───────────────────────────────────────────────────────────────────
// Cuerpo con ventana de inspección y rueda de turbina visible
function buildTurbina(scene: THREE.Object3D, r: number) {
  const bodyLen = 1.6
  // cuerpo principal
  const body = new THREE.Mesh(
    new THREE.CylinderGeometry(r * 1.4, r * 1.4, bodyLen, 32),
    new THREE.MeshStandardMaterial({ color: 0x2a3830, metalness: 0.7, roughness: 0.35 })
  )
  body.rotation.z = Math.PI / 2
  scene.add(body)
  flange(scene, -bodyLen / 2, r)
  flange(scene, bodyLen / 2, r)

  // rueda de turbina — 6 aspas grandes y visibles
  const hubR = r * 0.22
  const hub = new THREE.Mesh(new THREE.CylinderGeometry(hubR, hubR, bodyLen * 0.85, 16), M.silver())
  hub.rotation.z = Math.PI / 2
  scene.add(hub)

  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2
    const blade = new THREE.Mesh(
      new THREE.BoxGeometry(bodyLen * 0.78, r * 0.08, r * 1.05),
      M.accent()
    )
    blade.position.set(0, Math.sin(a) * r * 0.72, Math.cos(a) * r * 0.72)
    blade.rotation.x = a
    blade.rotation.y = 0.38  // ángulo helicoidal
    scene.add(blade)
  }

  // ventana de inspección (disco teal en la parte superior del cuerpo)
  const window3d = new THREE.Mesh(
    new THREE.CylinderGeometry(r * 0.38, r * 0.38, 0.07, 16),
    M.teal()
  )
  window3d.position.set(0, r * 1.42, 0)
  scene.add(window3d)

  // pickup magnético
  const pickup = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.12, r * 0.12, r * 0.7, 8), M.body())
  pickup.position.set(0.35, r * 1.44, 0)
  scene.add(pickup)

  // salida de señal
  const conn = new THREE.Mesh(new THREE.BoxGeometry(r * 0.5, r * 0.35, r * 0.35), M.body())
  conn.position.set(0.35, r * 2.1, 0)
  scene.add(conn)
}

// ── CORIOLIS ──────────────────────────────────────────────────────────────────
// Dos tubos en U bien visibles saliendo de la carcasa
function buildCoriolis(scene: THREE.Object3D, r: number) {
  const boxW = 1.8
  // carcasa exterior
  const casing = new THREE.Mesh(
    new THREE.BoxGeometry(boxW, r * 3.8, r * 2.4),
    new THREE.MeshStandardMaterial({ color: 0x1e2e1e, metalness: 0.6, roughness: 0.45 })
  )
  scene.add(casing)
  flange(scene, -boxW / 2, r)
  flange(scene, boxW / 2, r)

  // tubos en U — dos arcos grandes y visibles en colores diferentes
  const tubeColors = [0x9fd13a, 0x30b0b0]
  for (let ti = 0; ti < 2; ti++) {
    const oz = (ti === 0 ? -r * 0.55 : r * 0.55)
    const mat = new THREE.MeshStandardMaterial({ color: tubeColors[ti], metalness: 0.5, roughness: 0.3 })
    const tubeR = r * 0.17

    // rama izquierda del U (vertical)
    const left = new THREE.Mesh(new THREE.CylinderGeometry(tubeR, tubeR, r * 2.8, 10), mat)
    left.position.set(-0.5, r * 1.5, oz)
    scene.add(left)

    // rama derecha del U (vertical)
    const right = new THREE.Mesh(new THREE.CylinderGeometry(tubeR, tubeR, r * 2.8, 10), mat)
    right.position.set(0.5, r * 1.5, oz)
    scene.add(right)

    // fondo del U (horizontal, en la cima)
    const top = new THREE.Mesh(new THREE.CylinderGeometry(tubeR, tubeR, 1.05, 10), mat)
    top.rotation.z = Math.PI / 2
    top.position.set(0, r * 2.95, oz)
    scene.add(top)

    // codos (cuartos de toro)
    for (const side of [-1, 1]) {
      const elbow = new THREE.Mesh(
        new THREE.TorusGeometry(r * 0.45, tubeR, 8, 16, Math.PI / 2),
        mat
      )
      elbow.position.set(side * 0.5, r * 2.95, oz)
      elbow.rotation.z = side > 0 ? 0 : Math.PI
      elbow.rotation.y = Math.PI / 2
      scene.add(elbow)
    }
  }

  // sensores de vibración (dos bobinas en las ramas)
  for (const x of [-0.5, 0.5]) {
    const coil = new THREE.Mesh(
      new THREE.TorusGeometry(r * 0.32, r * 0.08, 6, 14),
      M.orange()
    )
    coil.position.set(x, r * 1.8, 0)
    coil.rotation.y = Math.PI / 2
    scene.add(coil)
  }

  // caja de transmisión arriba
  const txBox = new THREE.Mesh(new THREE.BoxGeometry(0.7, r * 0.65, r * 0.65), M.body())
  txBox.position.set(0, r * 3.7, 0)
  scene.add(txBox)
  const led = new THREE.Mesh(new THREE.BoxGeometry(0.08, r * 0.18, r * 0.18),
    new THREE.MeshStandardMaterial({ color: 0x00ff44, emissive: 0x00ff44, emissiveIntensity: 0.6 }))
  led.position.set(0.32, r * 3.7, 0)
  scene.add(led)
}

// ── DIAFRAGMA ─────────────────────────────────────────────────────────────────
// Medidor de diafragma con cámara de medición y totalizador visible
function buildDiafragma(scene: THREE.Object3D, r: number) {
  // cuerpo principal (hexagonal — típico de medidores de diafragma)
  const body = new THREE.Mesh(
    new THREE.CylinderGeometry(r * 1.55, r * 1.55, 0.9, 6),
    new THREE.MeshStandardMaterial({ color: 0x283820, metalness: 0.55, roughness: 0.5 })
  )
  body.rotation.z = Math.PI / 2
  scene.add(body)
  flange(scene, -0.5, r)
  flange(scene, 0.5, r)

  // tapa frontal (disco)
  const lid = new THREE.Mesh(new THREE.CylinderGeometry(r * 1.52, r * 1.52, 0.06, 6), M.flange())
  lid.rotation.z = Math.PI / 2
  lid.position.set(0.5, 0, 0)
  scene.add(lid)

  // pernos perimetrales
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2
    const bolt = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.06, r * 0.06, 1.05, 6), M.silver())
    bolt.rotation.z = Math.PI / 2
    bolt.position.set(0, Math.sin(a) * r * 1.38, Math.cos(a) * r * 1.38)
    scene.add(bolt)
  }

  // cuello hacia el totalizador
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.3, r * 0.3, r * 1.1, 10), M.body())
  neck.position.set(-0.1, r * 1.6, 0)
  scene.add(neck)

  // totalizador (caja cuadrada con visor)
  const totalizer = new THREE.Mesh(new THREE.BoxGeometry(0.85, r * 1.1, r * 1.1), M.body())
  totalizer.position.set(-0.1, r * 2.3, 0)
  scene.add(totalizer)

  // visor del totalizador
  const visor = new THREE.Mesh(
    new THREE.BoxGeometry(0.82, r * 0.45, r * 0.55),
    new THREE.MeshStandardMaterial({ color: 0x90c890, metalness: 0.1, roughness: 0.1, transparent: true, opacity: 0.7 })
  )
  visor.position.set(-0.1, r * 2.38, 0)
  scene.add(visor)

  // diales del totalizador (discos pequeños)
  for (let i = 0; i < 5; i++) {
    const dial = new THREE.Mesh(
      new THREE.CylinderGeometry(r * 0.1, r * 0.1, 0.06, 12),
      new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0x334433, emissiveIntensity: 0.3 })
    )
    dial.rotation.z = Math.PI / 2
    dial.position.set(-0.1, r * 2.38, r * 0.22 - i * r * 0.11)
    scene.add(dial)
  }

  // salida de impulsos
  const imp = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.1, r * 0.1, r * 0.55, 8), M.teal())
  imp.position.set(-0.1, r * 2.9, 0)
  scene.add(imp)
}

const BUILDERS: Record<TecnologiaKey, (s: THREE.Object3D, r: number) => void> = {
  ultrasonico: buildUltrasonico,
  orificio:    buildOrificio,
  turbina:     buildTurbina,
  coriolis:    buildCoriolis,
  diafragma:   buildDiafragma,
}

const LABELS: Record<TecnologiaKey, string> = {
  ultrasonico: 'Ultrasónico multipath',
  orificio:    'Placa de orificio',
  turbina:     'Turbina',
  coriolis:    'Coriolis',
  diafragma:   'Diafragma',
}

export default function Vista3D({ techKey, diametroPulg }: Vista3DProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    const w = el.clientWidth
    const h = el.clientHeight
    const r = pr(diametroPulg)

    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0xeef4f7)
    scene.fog = new THREE.Fog(0xeef4f7, 16, 26)

    const camera = new THREE.PerspectiveCamera(42, w / h, 0.05, 60)
    camera.position.set(2.5, r * 6, 5.5)

    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setSize(w, h)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.shadowMap.enabled = true
    el.appendChild(renderer.domElement)

    const controls = new OrbitControls(camera, renderer.domElement)
    controls.target.set(0, r * 2, 0)
    controls.enableDamping = true
    controls.dampingFactor = 0.07
    controls.minDistance = 1.5
    controls.maxDistance = 14

    // Luces
    scene.add(new THREE.AmbientLight(0xffffff, 1.4))
    const key = new THREE.DirectionalLight(0xffffff, 2.2)
    key.position.set(5, 9, 6)
    key.castShadow = true
    scene.add(key)
    const fill = new THREE.DirectionalLight(0xffffff, 1.0)
    fill.position.set(-5, 4, -3)
    scene.add(fill)
    const front = new THREE.DirectionalLight(0xffffff, 0.8)
    front.position.set(0, 3, 8)
    scene.add(front)
    const top = new THREE.DirectionalLight(0x9fd13a, 0.4)
    top.position.set(0, 10, 0)
    scene.add(top)

    // Grid y suelo
    scene.add(new THREE.GridHelper(16, 16, 0x2a3328, 0x181e16))
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(16, 16),
      new THREE.MeshStandardMaterial({ color: 0x0c0f0d })
    )
    ground.rotation.x = -Math.PI / 2
    ground.position.y = -0.01
    ground.receiveShadow = true
    scene.add(ground)

    // El eje de la tubería queda en y=r (fondo en y=0, sobre el grid)
    const assembly = new THREE.Group()
    assembly.position.y = r * 2.2
    scene.add(assembly)

    // Tubería de entrada/salida (centrada en x=0)
    seg(assembly, -3.2, -1.2, r)
    flange(assembly, -1.2, r)
    valve(assembly, -1.5, r)
    flange(assembly, -1.8, r)
    seg(assembly, -1.8, -1.1, r)

    // Elemento primario en el centro (x=0)
    BUILDERS[techKey]?.(assembly, r)

    seg(assembly, 1.1, 1.8, r)
    flange(assembly, 1.8, r)
    valve(assembly, 2.1, r)
    flange(assembly, 2.4, r)
    seg(assembly, 2.4, 3.2, r)

    // Soportes (van desde el suelo real, fuera del group)
    for (const sx of [-2.5, 2.8]) {
      const legH = r * 1.2
      const leg = new THREE.Mesh(
        new THREE.BoxGeometry(0.07, legH, 0.07),
        new THREE.MeshStandardMaterial({ color: 0x4a5a48 })
      )
      leg.position.set(sx, legH / 2, r * 1.6)
      scene.add(leg)
      const base = new THREE.Mesh(
        new THREE.BoxGeometry(0.28, 0.04, 0.28),
        new THREE.MeshStandardMaterial({ color: 0x3a4838 })
      )
      base.position.set(sx, 0.02, r * 1.6)
      scene.add(base)
    }

    let animId: number
    function animate() {
      animId = requestAnimationFrame(animate)
      controls.update()
      renderer.render(scene, camera)
    }
    animate()

    const ro = new ResizeObserver(() => {
      if (!el) return
      camera.aspect = el.clientWidth / el.clientHeight
      camera.updateProjectionMatrix()
      renderer.setSize(el.clientWidth, el.clientHeight)
    })
    ro.observe(el)

    return () => {
      cancelAnimationFrame(animId)
      ro.disconnect()
      controls.dispose()
      renderer.dispose()
      el.removeChild(renderer.domElement)
    }
  }, [techKey, diametroPulg])

  return (
    <div className="relative">
      <div
        ref={containerRef}
        className="w-full rounded-md"
        style={{ height: 400, background: '#070908', cursor: 'grab' }}
      />
      {/* logo overlay */}
      <div className="absolute top-3 left-3 flex items-center gap-1.5">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.png" alt="Peregrin" className="w-6 h-6 object-contain" style={{ filter: 'brightness(0) invert(1)', opacity: 0.7 }} />
        <div className="flex flex-col leading-none">
          <span className="font-bold text-[10px] tracking-widest" style={{ color: 'rgba(255,255,255,0.8)', letterSpacing: '0.15em' }}>PEREGRIN</span>
          <span className="text-[7px]" style={{ color: 'rgba(255,255,255,0.45)' }}>Gas Engineering Experts</span>
        </div>
      </div>
      <div className="absolute bottom-3 left-3 font-mono text-[10px] px-2 py-1 rounded"
        style={{ background: 'rgba(0,0,0,0.6)', color: 'var(--accent)', border: '1px solid rgba(159,209,58,0.3)' }}>
        {LABELS[techKey]}
      </div>
      <div className="absolute bottom-3 right-3 font-mono text-[10px]" style={{ color: 'var(--ink3)' }}>
        Arrastra · scroll zoom
      </div>
    </div>
  )
}
