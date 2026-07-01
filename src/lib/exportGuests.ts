import type { Guest, GuestSide, Wedding } from './types'
import { formatDateShort } from './utils'

function sideName(side: GuestSide, wedding: Wedding | null): string {
  if (side === 'partner1') return wedding?.partner1 || 'ראשון'
  if (side === 'partner2') return wedding?.partner2 || 'שני'
  return 'משותף'
}

function esc(s: string): string {
  return String(s).replace(
    /[&<>"]/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c] ?? c,
  )
}

interface Row {
  i: number
  name: string
  group: string
  side: string
  count: number
}

function buildRows(guests: Guest[], wedding: Wedding | null): Row[] {
  return guests
    .slice()
    .sort((a, b) => a.name.localeCompare(b.name, 'he'))
    .map((g, idx) => ({
      i: idx + 1,
      name: g.name,
      group: g.group || '',
      side: sideName(g.side, wedding),
      count: g.count || 1,
    }))
}

/** מרכיב טבלת HTML מעוצבת לרשימת המוזמנים */
function buildTable(guests: Guest[], wedding: Wedding | null): string {
  const rows = buildRows(guests, wedding)
  const totalPeople = rows.reduce((s, r) => s + r.count, 0)
  const title = wedding ? `${esc(wedding.partner1)} & ${esc(wedding.partner2)}` : 'רשימת מוזמנים'
  const date = wedding?.date ? formatDateShort(wedding.date) : ''

  const body = rows
    .map(
      (r) => `<tr>
        <td style="text-align:center">${r.i}</td>
        <td>${esc(r.name)}</td>
        <td>${esc(r.group)}</td>
        <td>${esc(r.side)}</td>
        <td style="text-align:center">${r.count}</td>
      </tr>`,
    )
    .join('')

  return `
  <div style="font-family:'Rubik',Arial,sans-serif;color:#2A2620;padding:24px;direction:rtl">
    <h1 style="margin:0 0 4px;font-size:24px;color:#15616D">רשימת מוזמנים</h1>
    <div style="font-size:15px;color:#5E574C;margin-bottom:2px">${title}</div>
    ${date ? `<div style="font-size:13px;color:#9A9184;margin-bottom:16px">${date}</div>` : '<div style="margin-bottom:16px"></div>'}
    <table style="width:100%;border-collapse:collapse;font-size:14px">
      <thead>
        <tr style="background:#15616D;color:#fff">
          <th style="padding:8px;text-align:center;width:36px">#</th>
          <th style="padding:8px;text-align:right">שם</th>
          <th style="padding:8px;text-align:right">קירבה</th>
          <th style="padding:8px;text-align:right">צד</th>
          <th style="padding:8px;text-align:center;width:60px">כמות</th>
        </tr>
      </thead>
      <tbody>${body}</tbody>
      <tfoot>
        <tr style="background:#F8ECD9;font-weight:bold">
          <td colspan="4" style="padding:8px;text-align:left">סה״כ אנשים</td>
          <td style="padding:8px;text-align:center">${totalPeople}</td>
        </tr>
      </tfoot>
    </table>
    <div style="margin-top:10px;font-size:12px;color:#9A9184">
      ${rows.length} רשומות · ${totalPeople} אנשים
    </div>
  </div>`
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

/** ייצוא ל-Word (קובץ .doc מבוסס HTML - נפתח היטב ב-Word) */
export function exportGuestsWord(guests: Guest[], wedding: Wedding | null) {
  const html = `<!doctype html><html xmlns:o="urn:schemas-microsoft-com:office:office"
    xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40" dir="rtl">
    <head><meta charset="utf-8"><title>רשימת מוזמנים</title></head>
    <body>${buildTable(guests, wedding)}</body></html>`
  const blob = new Blob(['﻿', html], { type: 'application/msword' })
  triggerDownload(blob, 'רשימת-מוזמנים.doc')
}

/** ייצוא ל-PDF (רינדור HTML לקאנבס - עברית תקינה) */
export async function exportGuestsPdf(guests: Guest[], wedding: Wedding | null) {
  const container = document.createElement('div')
  container.style.position = 'fixed'
  container.style.top = '0'
  container.style.left = '-10000px'
  container.style.width = '760px'
  container.style.background = '#ffffff'
  container.innerHTML = buildTable(guests, wedding)
  document.body.appendChild(container)

  try {
    const mod = await import('html2pdf.js')
    const html2pdf = mod.default ?? mod
    await html2pdf()
      .set({
        margin: [10, 8, 12, 8],
        filename: 'רשימת-מוזמנים.pdf',
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, backgroundColor: '#ffffff', useCORS: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        pagebreak: { mode: ['avoid-all', 'css', 'legacy'] },
      })
      .from(container)
      .save()
  } finally {
    document.body.removeChild(container)
  }
}
