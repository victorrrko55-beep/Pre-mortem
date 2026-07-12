import { createWorker } from 'tesseract.js'

/**
 * 영수증 이미지에서 텍스트를 추출한다 (한국어+영어, 브라우저 내 처리).
 * 최초 실행 시 언어 데이터(~수 MB)를 내려받으므로 네트워크 연결이 필요하다.
 */
export async function recognizeReceipt(
  image: File | Blob,
  onProgress: (percent: number, status: string) => void,
): Promise<string> {
  const worker = await createWorker(['kor', 'eng'], 1, {
    logger: (m) => {
      if (m.status === 'recognizing text') {
        onProgress(Math.round(m.progress * 100), '영수증 글자 인식 중')
      } else if (m.status.includes('loading') || m.status.includes('initializing')) {
        onProgress(0, '인식 엔진 준비 중 (최초 1회 다운로드)')
      }
    },
  })
  try {
    const { data } = await worker.recognize(image)
    return data.text
  } finally {
    await worker.terminate()
  }
}
