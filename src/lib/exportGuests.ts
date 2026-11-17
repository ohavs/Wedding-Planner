import type { Guest, GuestSide, Wedding } from './types'
import { normalizeMembers } from './utils'

/* ------------------------------------------------------------------ */
/* מבנה: צד (חתן / כלה / משותף) → רשומות (יחיד / משפחה עם כל השמות)     */
/* ------------------------------------------------------------------ */

interface Entry {
  name: string
  count: number
  /** שמות בני המשפחה (ריק למוזמן יחיד) */
  members: string[]
}

interface SideSection {
  title: string
  people: number
  entries: Entry[]
}

const SIDE_ORDER: GuestSide[] = ['partner1', 'partner2', 'shared']

/** טקסט באנגלית בתוך עברית - בידוד כדי שסדר המילים לא יתהפך (גם ב-Word, בעזרת RLM) */
const iso = (s: string) => `<bdi>${esc(s)}</bdi>&rlm;`

/** כותרת הצד (HTML) */
function sideTitle(side: GuestSide, wedding: Wedding | null): string {
  if (side === 'partner1') return wedding?.partner1 ? `צד החתן · ${iso(wedding.partner1)}` : 'צד החתן'
  if (side === 'partner2') return wedding?.partner2 ? `צד הכלה · ${iso(wedding.partner2)}` : 'צד הכלה'
  return 'מוזמנים משותפים'
}

function toEntry(g: Guest): Entry {
  if (g.kind === 'family') {
    const members = normalizeMembers(g.members)
      .map((m) => m.name?.trim())
      .filter(Boolean) as string[]
    return { name: g.name, count: members.length || g.count || 1, members }
  }
  return { name: g.name, count: g.count || 1, members: [] }
}

function buildSections(guests: Guest[], wedding: Wedding | null): SideSection[] {
  return SIDE_ORDER.map((side) => {
    const entries = guests
      .filter((g) => (SIDE_ORDER.includes(g.side) ? g.side : 'shared') === side)
      .map(toEntry)
      .sort((a, b) => a.name.localeCompare(b.name, 'he'))
    return {
      title: sideTitle(side, wedding),
      people: entries.reduce((s, e) => s + e.count, 0),
      entries,
    }
  }).filter((s) => s.entries.length > 0)
}

/* ------------------------------------------------------------------ */
/* HTML - עיצוב inline כדי שגם Word וגם html2canvas יציגו אותו נכון      */
/* ------------------------------------------------------------------ */

function esc(s: string): string {
  return String(s ?? '').replace(
    /[&<>"]/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c] ?? c,
  )
}

/** גופן מערכת - כדי שהמדידה והציור בקאנבס ישתמשו באותו גופן בדיוק */
const FONT = 'Arial, Helvetica, sans-serif'
const INK = '#1F1D1A'
const SOFT = '#55504A'
const FAINT = '#9A948C'
const ACCENT = '#15616D'

const DOC_STYLE = `font-family:${FONT};color:${INK};direction:rtl;text-align:right`
const TABLE_OPEN = `<table dir="rtl" cellspacing="0" cellpadding="0" style="width:100%;border-collapse:collapse;table-layout:fixed;font-family:${FONT};color:${INK}">`
const COLGROUP = '<colgroup><col><col width="56" style="width:56px"></colgroup>'

const people = (n: number) => (n === 1 ? 'איש אחד' : `${n} אנשים`)

const rowGap = () => '<tr><td colspan="2" style="height:26px;padding:0;border:0;font-size:1px">&nbsp;</td></tr>'

const sideHead = (title: string, meta: string) =>
  `<tr><td colspan="2" style="padding:0 0 7px;border-bottom:2px solid ${ACCENT};text-align:right">` +
  `<span style="float:left;padding-top:5px;font-size:13px;color:${ACCENT}">${meta}</span>` +
  `<span style="font-size:19px;font-weight:bold;color:${ACCENT}">${title}</span></td></tr>`

const rowSide = (s: SideSection) => sideHead(s.title, people(s.people))
const rowSideCont = (s: SideSection) => sideHead(`${s.title} (המשך)`, '')

const rowEntry = (e: Entry) => {
  const members = e.members.length
    ? `<div style="margin-top:3px;font-size:14px;line-height:1.6;color:${SOFT}">` +
      e.members.map((m) => `<span style="white-space:nowrap">${esc(m)}</span>`).join(', ') +
      '</div>'
    : ''
  return (
    `<tr><td style="padding:9px 0;border-bottom:1px solid #ECE8E1;vertical-align:top;text-align:right">` +
    `<div style="font-size:15px;font-weight:bold">${esc(e.name)}</div>${members}</td>` +
    `<td style="padding:10px 0 9px;border-bottom:1px solid #ECE8E1;vertical-align:top;text-align:left;font-size:14px;color:${FAINT}">${e.count}</td></tr>`
  )
}

const EMPTY = `<div style="padding:40px 0;text-align:center;color:${FAINT};font-size:15px">אין מוזמנים ברשימה</div>`

function headerHtml(sections: SideSection[], wedding: Wedding | null): string {
  const total = sections.reduce((s, x) => s + x.people, 0)
  const couple = wedding ? `${iso(`${wedding.partner1} & ${wedding.partner2}`)} · ` : ''
  return (
    `<div style="padding-bottom:22px;${DOC_STYLE}">` +
    `<div style="font-size:26px;font-weight:bold;color:${INK}">רשימת מוזמנים</div>` +
    `<div style="margin-top:5px;font-size:15px;color:${SOFT}">${couple}${people(total)}</div></div>`
  )
}

/* ------------------------------------------------------------------ */
/* בלוקים לעימוד                                                       */
/* ------------------------------------------------------------------ */

interface Block {
  side: boolean
  sec: number
  row: number
}

interface Layout {
  rows: string[]
  blocks: Block[]
  gapRow: number
  /** כותרת "(המשך)" לעמוד שמתחיל באמצע צד */
  contRow: number[]
}

function buildLayout(sections: SideSection[]): Layout {
  const rows: string[] = []
  const reg = (html: string) => rows.push(html) - 1
  const blocks: Block[] = []
  const gapRow = reg(rowGap())
  const contRow: number[] = []

  sections.forEach((s, sec) => {
    contRow.push(reg(rowSideCont(s)))
    blocks.push({ side: true, sec, row: reg(rowSide(s)) })
    for (const e of s.entries) blocks.push({ side: false, sec, row: reg(rowEntry(e)) })
  })
  return { rows, blocks, gapRow, contRow }
}

/* ------------------------------------------------------------------ */
/* Word                                                                */
/* ------------------------------------------------------------------ */

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
  const sections = buildSections(guests, wedding)
  const { rows, blocks, gapRow } = buildLayout(sections)
  const body = blocks
    .flatMap((b, i) => (b.side && i > 0 ? [gapRow, b.row] : [b.row]))
    .map((id) => rows[id])
    .join('')

  const html = `<!doctype html><html xmlns:o="urn:schemas-microsoft-com:office:office"
    xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40" dir="rtl">
    <head><meta charset="utf-8"><title>רשימת מוזמנים</title></head>
    <body dir="rtl" style="${DOC_STYLE}"><div dir="rtl" style="${DOC_STYLE}">${headerHtml(sections, wedding)}
    ${body ? `${TABLE_OPEN}${COLGROUP}${body}</table>` : EMPTY}
    </div></body></html>`
  const blob = new Blob(['﻿', html], { type: 'application/msword' })
  triggerDownload(blob, 'רשימת-מוזמנים.doc')
}

/* ------------------------------------------------------------------ */
/* PDF                                                                 */
/* ------------------------------------------------------------------ */

const PAGE_W = 794 // A4 ב-96dpi
const PAGE_H = 1123
const PAD_X = 56
const PAD_TOP = 52
const FOOT_H = 70 // אזור תחתון שמור למספר העמוד
const CONTENT_W = PAGE_W - PAD_X * 2
const AVAIL_H = PAGE_H - PAD_TOP - FOOT_H

const PAGE_CSS = `
  html, body { margin: 0; padding: 0; background: #ffffff; overflow: hidden; }
  * { box-sizing: border-box; }
  .page { position: relative; width: ${PAGE_W}px; height: ${PAGE_H}px; padding: ${PAD_TOP}px ${PAD_X}px 0; background: #ffffff; overflow: hidden; }
  .foot { position: absolute; left: 0; right: 0; bottom: 28px; text-align: center; font-size: 11px; color: ${FAINT}; }
`

const nextFrame = () => new Promise<void>((r) => requestAnimationFrame(() => setTimeout(r, 30)))

/** מחלק לעמודים לפי הגובה שנמדד בפועל - רשומה (כולל כל בני המשפחה) לא נחתכת בין עמודים */
function paginate(layout: Layout, h: number[], firstPageUsed: number): number[][] {
  const { blocks, gapRow, contRow } = layout
  const pages: number[][] = [[]]
  let used = firstPageUsed

  const page = () => pages[pages.length - 1]
  const place = (id: number) => {
    page().push(id)
    used += h[id]
  }
  const newPage = (contSec: number | null) => {
    pages.push([])
    used = 0
    if (contSec !== null) place(contRow[contSec])
  }

  blocks.forEach((b, i) => {
    if (b.side) {
      const next = blocks[i + 1]
      const need = h[gapRow] + h[b.row] + (next && !next.side ? h[next.row] : 0)
      if (page().length > 0) {
        if (used + need > AVAIL_H) newPage(null)
        else place(gapRow)
      }
      place(b.row)
      return
    }
    if (used + h[b.row] > AVAIL_H && page().length > 1) newPage(b.sec)
    place(b.row)
  })
  return pages
}

/** ייצוא ל-PDF: עימוד לעמודי A4 ורינדור כל עמוד בנפרד (עברית תקינה, בלי חיתוך באמצע) */
export async function exportGuestsPdf(guests: Guest[], wedding: Wedding | null) {
  const sections = buildSections(guests, wedding)
  const layout = buildLayout(sections)
  const header = headerHtml(sections, wedding)

  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([import('html2canvas'), import('jspdf')])

  const iframe = document.createElement('iframe')
  iframe.setAttribute('aria-hidden', 'true')
  iframe.style.cssText = `position:fixed;left:0;top:0;width:${PAGE_W}px;height:${PAGE_H}px;opacity:0;border:0;z-index:-1;pointer-events:none`
  document.body.appendChild(iframe)

  try {
    const doc = iframe.contentDocument
    if (!doc) throw new Error('iframe document unavailable')
    doc.open()
    doc.write(
      `<!doctype html><html lang="he" dir="rtl"><head><meta charset="utf-8">` +
        `<style>${PAGE_CSS}</style></head><body></body></html>`,
    )
    doc.close()

    // מדידה: כל השורות בטבלה אחת ברוחב התוכן של העמוד
    doc.body.innerHTML =
      `<div dir="rtl" style="width:${CONTENT_W}px;${DOC_STYLE}"><div id="m-hdr">${header}</div>` +
      `<div id="m-tbl">${TABLE_OPEN}${COLGROUP}<tbody>${layout.rows.join('')}</tbody></table></div></div>`
    await nextFrame()
    const headerH = doc.getElementById('m-hdr')!.getBoundingClientRect().height
    const h = Array.from(doc.querySelectorAll('#m-tbl tr')).map((tr) => tr.getBoundingClientRect().height)

    const pages = layout.blocks.length ? paginate(layout, h, headerH) : [[]]

    const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait', compress: true })
    pdf.setProperties({ title: 'רשימת מוזמנים' })

    for (let p = 0; p < pages.length; p++) {
      const ids = pages[p]
      doc.body.innerHTML =
        `<div class="page" dir="rtl" style="${DOC_STYLE}">` +
        (p === 0 ? header : '') +
        (ids.length
          ? `${TABLE_OPEN}${COLGROUP}<tbody>${ids.map((id) => layout.rows[id]).join('')}</tbody></table>`
          : p === 0
            ? EMPTY
            : '') +
        (pages.length > 1 ? `<div class="foot">עמוד ${p + 1} מתוך ${pages.length}</div>` : '') +
        `</div>`
      await nextFrame()

      const canvas = await html2canvas(doc.body.firstElementChild as HTMLElement, {
        scale: 2,
        backgroundColor: '#ffffff',
        useCORS: true,
        logging: false,
        width: PAGE_W,
        height: PAGE_H,
        windowWidth: PAGE_W,
        windowHeight: PAGE_H,
      })
      if (p > 0) pdf.addPage()
      pdf.addImage(canvas.toDataURL('image/jpeg', 0.92), 'JPEG', 0, 0, 210, 297, undefined, 'FAST')
      // שחרור זיכרון (חשוב באייפון)
      canvas.width = 0
      canvas.height = 0
    }

    pdf.save('רשימת-מוזמנים.pdf')
  } finally {
    document.body.removeChild(iframe)
  }
}
