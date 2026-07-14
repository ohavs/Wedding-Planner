/**
 * דוחס תמונה בצד הלקוח לפני העלאה - שינוי גודל ל-maxDim פיקסלים
 * והמרה ל-JPEG. עמיד לתקלות: אם הדחיסה נכשלת (למשל פורמט שהדפדפן
 * לא יודע לפענח, כמו HEIC בחלק מהדפדפנים) - מחזיר את הקובץ המקורי
 * כדי שההעלאה תמשיך בכל מקרה.
 */
export async function compressImage(
  file: File,
  maxDim = 1400,
  quality = 0.8,
): Promise<Blob> {
  if (!file.type.startsWith('image/')) return file

  try {
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = () => reject(new Error('read failed'))
      reader.readAsDataURL(file)
    })

    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image()
      image.onload = () => resolve(image)
      image.onerror = () => reject(new Error('image decode failed'))
      image.src = dataUrl
    })

    let { width, height } = img
    if (!width || !height) return file
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
    // משתמשים בתוצאה הדחוסה רק אם הצליחה; אחרת בקובץ המקורי
    return blob ?? file
  } catch (e) {
    console.warn('image compression failed, uploading original', e)
    return file
  }
}
