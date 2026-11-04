import { shape } from './dom'

export function windRose(degrees: number, direction: string): SVGElement {
  const root = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
  root.setAttribute('viewBox', '0 0 100 100')
  root.setAttribute('role', 'img')
  root.setAttribute('aria-label', `${direction}, ${degrees.toFixed(0)} degrees`)
  shape('circle', { class: 'rose__ring', cx: 50, cy: 50, r: 32 }, root)
  for (let bearing = 0; bearing < 360; bearing += 45) {
    const angle = (bearing * Math.PI) / 180
    const long = bearing % 90 === 0
    const inner = long ? 24 : 28
    shape(
      'line',
      {
        class: 'rose__tick',
        x1: 50 + Math.sin(angle) * inner,
        y1: 50 - Math.cos(angle) * inner,
        x2: 50 + Math.sin(angle) * 32,
        y2: 50 - Math.cos(angle) * 32,
      },
      root,
    )
  }
  const marks: [string, number, number][] = [
    ['N', 50, 13],
    ['E', 94, 54],
    ['S', 50, 97],
    ['W', 6, 54],
  ]
  for (const [label, x, y] of marks) {
    const node = shape('text', { class: 'rose__mark', x, y }, root)
    node.textContent = label
  }
  const needle = shape('g', { transform: `rotate(${degrees.toFixed(1)} 50 50)` }, root)
  shape('polygon', { class: 'rose__needle', points: '50,18 44.5,56 55.5,56' }, needle)
  shape('circle', { class: 'rose__hub', cx: 50, cy: 50, r: 4 }, root)
  return root
}
