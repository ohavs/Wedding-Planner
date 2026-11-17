import type { FamilyMember, Guest, GuestSide, Wedding } from './types'
import { GUEST_GROUPS } from './constants'
import { formatDateShort, normalizeMembers } from './utils'

/* ------------------------------------------------------------------ */
/* מבנה הנתונים: צד (חתן / כלה / משותף) → קירבה → רשומות (יחיד / משפחה) */
/* ------------------------------------------------------------------ */

interface Entry {
  name: string
  family: boolean
  count: number
  child: boolean
  tentative: boolean
  members: FamilyMember[]
}

interface GroupSection {
  label: string
  people: number
  entries: Entry[]
}

interface SideSection {
  side: GuestSide
  role: string
  name: string
  people: number
  invites: number
  groups: GroupSection[]
}

const SIDE_ORDER: GuestSide[] = ['partner1', 'partner2', 'shared']

function sideInfo(side: GuestSide, wedding: Wedding | null): { role: string; name: string } {
  if (side === 'partner1') return { role: 'צד החתן', name: wedding?.partner1 ?? '' }
  if (side === 'partner2') return { role: 'צד הכלה', name: wedding?.partner2 ?? '' }
  return { role: 'מוזמנים משותפים', name: '' }
}

function toEntry(g: Guest): Entry {
  const family = g.kind === 'family'
  const members = family ? normalizeMembers(g.members).filter((m) => m.name?.trim()) : []
  return {
    name: g.name,
    family,
    count: family ? members.length || g.count || 1 : g.count || 1,
    child: !family && g.ageGroup === 'child',
    tentative: !family && Boolean(g.tentative),
    members,
  }
}

function groupRank(label: string): number {
  const i = GUEST_GROUPS.indexOf(label)
  return i === -1 ? GUEST_GROUPS.length : i
}

function buildSections(guests: Guest[], wedding: Wedding | null): SideSection[] {
  const sections: SideSection[] = []
  for (const side of SIDE_ORDER) {
    const list = guests.filter((g) => (SIDE_ORDER.includes(g.side) ? g.side : 'shared') === side)
    if (list.length === 0) continue

    const byGroup = new Map<string, Entry[]>()
    for (const g of list) {
      const label = g.group?.trim() || 'אחר'
      if (!byGroup.has(label)) byGroup.set(label, [])
      byGroup.get(label)!.push(toEntry(g))
    }

    const groups: GroupSection[] = [...byGroup.entries()]
      .sort(([a], [b]) => groupRank(a) - groupRank(b) || a.localeCompare(b, 'he'))
      .map(([label, entries]) => ({
        label,
        entries: entries.sort((a, b) => a.name.localeCompare(b.name, 'he')),
        people: entries.reduce((s, e) => s + e.count, 0),
      }))

    sections.push({
      side,
      ...sideInfo(side, wedding),
      people: groups.reduce((s, g) => s + g.people, 0),
      invites: list.length,
      groups,
    })
  }
  return sections
}

/* ------------------------------------------------------------------ */
/* HTML                                                                */
/* ------------------------------------------------------------------ */

function esc(s: string): string {
  return String(s ?? '').replace(
    /[&<>"]/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c] ?? c,
  )
}

/** גופן מערכת - כדי שהמדידה והציור בקאנבס ישתמשו באותו גופן בדיוק */
const FONT = 'Arial, Helvetica, sans-serif'

/*
 * כל העיצוב כתוב inline (ולא בקלאסים) - כך גם Word וגם html2canvas מציגים אותו נכון.
 */
const TD = 'padding:6px 8px;border-bottom:1px solid #EEE7DB;vertical-align:middle;text-align:right'
const N = 'text-align:center;color:#9A9184;font-size:11.5px'
const CNT = 'text-align:center;font-weight:bold;color:#15616D'
const ACCENT = 'border-right:3px solid #D9A55B'
const BAND = 'border:0;text-align:right'
const TAG =
  'display:inline-block;margin-left:4px;padding:1px 7px;border-radius:9px;font-size:10.5px;font-weight:bold'

const td = (content: string | number, style = '', colspan = 0) =>
  `<td${colspan ? ` colspan="${colspan}"` : ''} style="${TD};${style}">${content}</td>`
const tag = (label: string, bg: string, color: string) =>
  `<span style="${TAG};background:${bg};color:${color}">${label}</span>`

/** CSS לעמודי ה-PDF בלבד (מסגרת העמוד והכותרת התחתונה) */
const PAGE_CSS = `
  html, body { margin: 0; padding: 0; background: #ffffff; overflow: hidden; }
  * { box-sizing: border-box; }
  .page { position: relative; width: 794px; height: 1123px; padding: 40px 40px 0; background: #ffffff; overflow: hidden; }
  .foot { position: absolute; left: 40px; right: 40px; bottom: 22px; padding-top: 6px; border-top: 1px solid #EEE7DB; font-size: 10.5px; color: #9A9184; }
`
const DOC_STYLE = `font-family:${FONT};color:#2A2620;direction:rtl;text-align:right`
const TABLE_OPEN = `<table dir="rtl" cellspacing="0" cellpadding="0" style="width:100%;border-collapse:collapse;table-layout:fixed;font-family:${FONT};font-size:13px;color:#2A2620">`
const COLGROUP =
  '<colgroup><col width="34" style="width:34px"><col><col width="150" style="width:150px"><col width="56" style="width:56px"></colgroup>'

function tags(e: { child?: boolean; tentative?: boolean }): string {
  return (
    (e.child ? tag('ילד/ה', '#FDF0C8', '#946500') : '') +
    (e.tentative ? tag('בספק', '#FCE3DD', '#B8432C') : '')
  )
}

function sideTitle(sec: SideSection): string {
  return sec.name ? `${esc(sec.role)} · <bdi>${esc(sec.name)}</bdi>` : esc(sec.role)
}

const people = (n: number) => (n === 1 ? 'איש אחד' : `${n} אנשים`)
const SMALL = (s: string, style = '') => `<span style="font-size:12px;font-weight:normal;${style}">${s}</span>`

const SIDE_TD = `${BAND};background:#15616D;color:#ffffff;font-size:15px;font-weight:bold;padding:9px 10px`
const COLS_TD = `${BAND};background:#F3EDE3;color:#7A7164;font-size:10.5px;font-weight:bold;padding:4px 8px`
const FAM_TD = 'background:#FBF4E8;font-weight:bold;border-bottom-color:#F0E3CC'
const MEM_TD = 'padding-top:4px;padding-bottom:4px;border-bottom:1px dotted #EADFCB;color:#3B352C'

const rowGap = () => `<tr>${td('', 'height:16px;padding:0;border:0;font-size:1px', 4)}</tr>`
const rowCols = () =>
  `<tr>${td('#', `${COLS_TD};${N};font-size:10.5px`)}${td('שם', COLS_TD)}${td('הערות', COLS_TD)}${td('אנשים', `${COLS_TD};text-align:center`)}</tr>`
const rowSide = (sec: SideSection) =>
  `<tr>${td(`${SMALL(`${people(sec.people)} · ${sec.invites} הזמנות`, 'float:left;padding-top:2px')}${sideTitle(sec)}`, SIDE_TD, 4)}</tr>`
const rowSideCont = (sec: SideSection) => `<tr>${td(`${sideTitle(sec)} ${SMALL('(המשך)')}`, SIDE_TD, 4)}</tr>`
const rowGroup = (g: GroupSection) =>
  `<tr>${td(`${esc(g.label)} ${SMALL(`· ${people(g.people)}`, 'font-size:12.5px;color:#4F7F86')}`, `${BAND};background:#E7F0F0;color:#15616D;font-size:12.5px;font-weight:bold;padding:6px 10px`, 4)}</tr>`
const rowSingle = (n: number, e: Entry) =>
  `<tr>${td(n, N)}${td(esc(e.name))}${td(tags(e))}${td(e.count, CNT)}</tr>`
const rowFamily = (n: number, e: Entry, cont = false) =>
  `<tr>${td(n, `${FAM_TD};${N};${ACCENT}`)}${td(`${esc(e.name)}${cont ? ` ${SMALL('(המשך)')}` : ''}`, FAM_TD)}` +
  `${td(tag('משפחה', '#F1E1C9', '#85571B'), FAM_TD)}${td(e.count, `${FAM_TD};${CNT}`)}</tr>`
const rowMember = (m: FamilyMember) =>
  `<tr>${td('', `${MEM_TD};${ACCENT}`)}` +
  `${td(`<span style="color:#D9A55B;font-weight:bold;padding-left:6px">•</span>${esc(m.name)}`, `${MEM_TD};padding-right:26px`)}` +
  `${td(tags(m), MEM_TD)}${td('', MEM_TD)}</tr>`

const EMPTY = '<div style="padding:40px 0;text-align:center;color:#9A9184;font-size:15px">אין מוזמנים ברשימה</div>'

function headerHtml(sections: SideSection[], wedding: Wedding | null): string {
  const total = sections.reduce((s, x) => s + x.people, 0)
  const invites = sections.reduce((s, x) => s + x.invites, 0)
  const all = sections.flatMap((s) => s.groups.flatMap((g) => g.entries))
  const kids = all.reduce(
    (s, e) => s + (e.family ? e.members.filter((m) => m.child).length : e.child ? e.count : 0),
    0,
  )
  const maybe = all.reduce(
    (s, e) => s + (e.family ? e.members.filter((m) => m.tentative).length : e.tentative ? e.count : 0),
    0,
  )

  const couple = wedding ? `${esc(wedding.partner1)} & ${esc(wedding.partner2)}` : ''
  const sub = [
    wedding?.date ? formatDateShort(wedding.date) : '',
    `הופק ב-${new Date().toLocaleDateString('he-IL')}`,
  ]
    .filter(Boolean)
    .join(' · ')

  const cell = (v: number, l: string) =>
    `<td style="background:#F8F3EA;border-radius:10px;padding:8px 6px;text-align:center;vertical-align:top">` +
    `<div style="font-size:20px;font-weight:bold;color:#15616D">${v}</div>` +
    `<div style="margin-top:2px;font-size:11px;color:#5E574C">${l}</div></td>`
  const cells = [
    cell(total, `סה״כ אנשים (${invites} הזמנות)`),
    ...sections.map((s) => cell(s.people, sideTitle(s))),
    kids > 0 ? cell(kids, 'ילדים') : '',
    maybe > 0 ? cell(maybe, 'הגעה בספק') : '',
  ].join('')

  return `<div style="padding-bottom:16px;${DOC_STYLE}">
    <h1 style="margin:0;font-size:26px;font-weight:bold;color:#15616D;font-family:${FONT}">רשימת מוזמנים</h1>
    ${couple ? `<div style="margin-top:4px;font-size:16px;font-weight:bold;color:#5E574C">${couple}</div>` : ''}
    <div style="margin-top:3px;font-size:12px;color:#9A9184">${esc(sub)}</div>
    <table dir="rtl" style="width:100%;border-collapse:separate;border-spacing:6px 0;margin-top:14px;font-family:${FONT}"><tr>${cells}</tr></table>
  </div>`
}

/* ------------------------------------------------------------------ */
/* בלוקים לעימוד: כל בלוק נשאר שלם בעמוד (משפחה לא נחתכת בין עמודים)    */
/* ------------------------------------------------------------------ */

interface Block {
  type: 'side' | 'group' | 'entry'
  sec: number
  rows: number[]
  /** שורת "המשך" למשפחה גדולה מעמוד שלם */
  contRow?: number
}

interface Layout {
  rows: string[]
  blocks: Block[]
  gapRow: number
  /** שורות כותרת לעמוד המשך באמצע צד */
  contHead: number[][]
}

function buildLayout(sections: SideSection[]): Layout {
  const rows: string[] = []
  const reg = (html: string) => rows.push(html) - 1
  const blocks: Block[] = []
  const gapRow = reg(rowGap())
  const colsRow = reg(rowCols())
  const contHead: number[][] = []

  sections.forEach((sec, si) => {
    contHead.push([reg(rowSideCont(sec)), colsRow])
    blocks.push({ type: 'side', sec: si, rows: [reg(rowSide(sec)), colsRow] })
    let n = 0
    for (const g of sec.groups) {
      blocks.push({ type: 'group', sec: si, rows: [reg(rowGroup(g))] })
      for (const e of g.entries) {
        n++
        if (e.family) {
          blocks.push({
            type: 'entry',
            sec: si,
            rows: [reg(rowFamily(n, e)), ...e.members.map((m) => reg(rowMember(m)))],
            contRow: reg(rowFamily(n, e, true)),
          })
        } else {
          blocks.push({ type: 'entry', sec: si, rows: [reg(rowSingle(n, e))] })
        }
      }
    }
  })
  return { rows, blocks, gapRow, contHead }
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
    .flatMap((b, i) => (b.type === 'side' && i > 0 ? [gapRow, ...b.rows] : b.rows))
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
const PAD_X = 40
const PAD_TOP = 40
const FOOT_H = 64 // אזור תחתון שמור למספר העמוד
const CONTENT_W = PAGE_W - PAD_X * 2
/** מרווח ביטחון קטן כדי ששורה לא תיגע בכותרת התחתונה */
const AVAIL_H = PAGE_H - PAD_TOP - FOOT_H - 6

const nextFrame = () => new Promise<void>((r) => requestAnimationFrame(() => setTimeout(r, 30)))

/** מחלק את הבלוקים לעמודים לפי גובה שנמדד בפועל לכל שורה */
function paginate(layout: Layout, h: number[], firstPageUsed: number): number[][] {
  const { blocks, gapRow, contHead } = layout
  const pages: number[][] = [[]]
  let used = firstPageUsed

  const sum = (ids: number[]) => ids.reduce((s, id) => s + h[id], 0)
  const contH = (sec: number) => sum(contHead[sec])
  const page = () => pages[pages.length - 1]
  const place = (id: number) => {
    page().push(id)
    used += h[id]
  }
  const newPage = (contSec: number | null) => {
    pages.push([])
    used = 0
    if (contSec !== null) contHead[contSec].forEach(place)
  }
  /** הגובה המינימלי שחייב להופיע יחד עם בלוק (כותרת לא נשארת לבד בתחתית עמוד) */
  const lead = (i: number): number => {
    const b = blocks[i]
    if (!b) return 0
    if (b.type !== 'entry') return sum(b.rows) + lead(i + 1)
    const total = sum(b.rows)
    return contH(b.sec) + total <= AVAIL_H ? total : sum(b.rows.slice(0, 2))
  }

  blocks.forEach((b, i) => {
    if (b.type === 'side') {
      const withGap = page().length > 0
      const need = (withGap ? h[gapRow] : 0) + lead(i)
      if (withGap && used + need > AVAIL_H) newPage(null)
      else if (withGap) place(gapRow)
      b.rows.forEach(place)
      return
    }
    if (b.type === 'group') {
      if (used + lead(i) > AVAIL_H) newPage(b.sec)
      b.rows.forEach(place)
      return
    }
    const total = sum(b.rows)
    if (used + total > AVAIL_H) {
      if (contH(b.sec) + total <= AVAIL_H) {
        newPage(b.sec)
      } else {
        // משפחה ארוכה מעמוד שלם - מפצלים בין עמודים עם שורת "המשך"
        b.rows.forEach((id, k) => {
          if (used + h[id] > AVAIL_H) {
            newPage(b.sec)
            if (k > 0 && b.contRow !== undefined) place(b.contRow)
          }
          place(id)
        })
        return
      }
    }
    b.rows.forEach(place)
  })
  return pages
}

/** ייצוא ל-PDF: עימוד ידני לעמודי A4 ורינדור כל עמוד בנפרד (עברית תקינה, בלי חיתוך שורות) */
export async function exportGuestsPdf(guests: Guest[], wedding: Wedding | null) {
  const sections = buildSections(guests, wedding)
  const layout = buildLayout(sections)
  const header = headerHtml(sections, wedding)
  const footLabel = wedding ? `רשימת מוזמנים · ${esc(wedding.partner1)} & ${esc(wedding.partner2)}` : 'רשימת מוזמנים'

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
        `<div class="foot"><span style="float:left">עמוד ${p + 1} מתוך ${pages.length}</span>${footLabel}</div>` +
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
