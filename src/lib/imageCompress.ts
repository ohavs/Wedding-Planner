/**
 * דוחס תמונה בצד הלקוח לפני העלאה - שינוי גודל ל-maxDim פיקסלים
 * והמרה ל-JPEG באיכות נתונה, לשמירה על מהירות טעינה מיטבית.
 */
export async function compressImage(
  file: File,
  maxDim = 1400,
  quality = 0.8,
): Promise<Blob> {
  if (!file.type.startsWith('image/')) return file

  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })

  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = reject
    image.src = dataUrl
  })

  let { width, height } = img
  if (width > maxDim || height > maxDim) {
    const scale = maxDim / Math.max(width, height)
    width = Math.round(width * scale)
    height = Math.round(height * scale)
  }

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) return file
  ctx.drawImage(img, 0, 0, width, height)

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, 'image/jpeg', quality),
  )
  // אם הדחיסה נכשלה או גדולה מהמקור - נשתמש במקור
  return blob && blob.size < file.size ? blob : blob ?? file
}
