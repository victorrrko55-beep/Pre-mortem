/**
 * OCR 인식률을 높이기 위한 영수증 사진 전처리.
 * 적정 해상도로 리사이즈한 뒤 그레이스케일 변환과 대비 스트레칭
 * (5–95 퍼센타일 기준)을 적용한다. 실패 시 호출부에서 원본을 쓰면 된다.
 */
export async function preprocessReceiptImage(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' })
  const maxSide = Math.max(bitmap.width, bitmap.height)
  // Tesseract는 글자 높이 20px 이상에서 잘 동작한다 — 너무 작으면 확대, 너무 크면 축소
  const target = maxSide < 1200 ? 1200 : Math.min(maxSide, 2000)
  const scale = target / maxSide

  const canvas = document.createElement('canvas')
  canvas.width = Math.round(bitmap.width * scale)
  canvas.height = Math.round(bitmap.height * scale)
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('canvas 2d context unavailable')
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  bitmap.close()

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
  const { data } = imageData

  // 그레이스케일 + 밝기 히스토그램
  const histogram = new Uint32Array(256)
  const grays = new Uint8ClampedArray(data.length / 4)
  for (let i = 0; i < data.length; i += 4) {
    const gray = Math.round(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2])
    grays[i / 4] = gray
    histogram[gray]++
  }

  // 5–95 퍼센타일로 대비 스트레칭 (그림자·바랜 인쇄 보정)
  const total = grays.length
  let low = 0
  let high = 255
  let cumulative = 0
  for (let v = 0; v < 256; v++) {
    cumulative += histogram[v]
    if (cumulative >= total * 0.05) {
      low = v
      break
    }
  }
  cumulative = 0
  for (let v = 255; v >= 0; v--) {
    cumulative += histogram[v]
    if (cumulative >= total * 0.05) {
      high = v
      break
    }
  }
  const range = Math.max(high - low, 1)

  for (let i = 0; i < grays.length; i++) {
    const stretched = Math.max(0, Math.min(255, ((grays[i] - low) * 255) / range))
    data[i * 4] = stretched
    data[i * 4 + 1] = stretched
    data[i * 4 + 2] = stretched
  }
  ctx.putImageData(imageData, 0, 0)

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('toBlob failed'))),
      'image/png',
    )
  })
}
