/**
 * 네이버 클라우드 CLOVA OCR(General) 연동 — 설정 화면에서 Invoke URL과
 * Secret Key를 입력한 경우에만 사용한다. 인식된 텍스트를 줄 단위로 합쳐
 * 반환하므로 기존 영수증 파서(parseReceiptText)를 그대로 쓸 수 있다.
 */

interface ClovaField {
  inferText: string
  lineBreak?: boolean
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      resolve(result.slice(result.indexOf(',') + 1))
    }
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}

export async function recognizeWithClova(
  image: File,
  invokeUrl: string,
  secretKey: string,
): Promise<string> {
  const format = image.type === 'image/png' ? 'png' : 'jpg'
  const body = {
    version: 'V2',
    requestId: crypto.randomUUID(),
    timestamp: Date.now(),
    images: [{ format, name: 'receipt', data: await fileToBase64(image) }],
  }
  const res = await fetch(invokeUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-OCR-SECRET': secretKey },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`CLOVA OCR 요청 실패 (HTTP ${res.status})`)
  const json = (await res.json()) as {
    images?: { inferResult?: string; fields?: ClovaField[] }[]
  }
  const image0 = json.images?.[0]
  if (!image0 || image0.inferResult === 'ERROR') throw new Error('CLOVA OCR 인식 실패')
  return (image0.fields ?? [])
    .map((f) => f.inferText + (f.lineBreak ? '\n' : ' '))
    .join('')
}
