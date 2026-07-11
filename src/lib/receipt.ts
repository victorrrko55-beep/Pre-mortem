import type { FuelGrade, ParsedReceipt } from '../types'

const toNumber = (s: string): number => Number(s.replace(/[^\d.]/g, ''))

const pad2 = (n: number) => String(n).padStart(2, '0')

function parseDate(text: string): string | undefined {
  // 2026-07-11 / 2026.07.11 / 2026/07/11 / 2026년 7월 11일
  const full = text.match(/(20\d{2})\s*[-./년]\s*(\d{1,2})\s*[-./월]\s*(\d{1,2})/)
  if (full) {
    const [, y, m, d] = full
    const month = Number(m)
    const day = Number(d)
    if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      return `${y}-${pad2(month)}-${pad2(day)}`
    }
  }
  // 26/07/11 (연도 2자리)
  const short = text.match(/\b(\d{2})[-./](\d{1,2})[-./](\d{1,2})\b/)
  if (short) {
    const [, y, m, d] = short
    const month = Number(m)
    const day = Number(d)
    if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      return `20${y}-${pad2(month)}-${pad2(day)}`
    }
  }
  return undefined
}

function parseStationName(lines: string[]): string | undefined {
  const line = lines.find((l) =>
    /(주유소|충전소|(?:GS칼텍스|SK에너지|S-?OIL|에쓰오일|현대오일뱅크|오일뱅크|알뜰))/i.test(l),
  )
  if (!line) return undefined
  return line
    .replace(/^(상\s*호\s*명?|가\s*맹\s*점\s*명?|매\s*장\s*명?)\s*[:：]?\s*/, '')
    .replace(/\s{2,}.*/, '')
    .trim()
}

function parseAddress(lines: string[]): string | undefined {
  const labeled = lines.find((l) => /^(주\s*소|소\s*재\s*지|사업장)\s*[:：]?/.test(l))
  if (labeled) {
    const value = labeled.replace(/^(주\s*소|소\s*재\s*지|사업장)\s*[:：]?\s*/, '').trim()
    if (value.length >= 4) return value
  }
  return lines.find(
    (l) =>
      /[가-힣]+(특별시|광역시|특별자치시|특별자치도)/.test(l) ||
      /[가-힣]{1,8}[시군구]\s+[가-힣]/.test(l) ||
      /[가-힣0-9]+(로|길)\s*\d+/.test(l),
  )
}

function parseFuelGrade(text: string): FuelGrade | undefined {
  if (/고급/.test(text)) return 'premium'
  if (/(경유|디젤)/.test(text)) return 'diesel'
  if (/(LPG|부탄|충전소)/i.test(text)) return 'lpg'
  if (/(휘발유|무연|가솔린)/.test(text)) return 'regular'
  return undefined
}

function parseLiters(text: string): number | undefined {
  const patterns = [
    /(?:주유량|급유량|수\s*량)\s*[:：]?\s*([\d,]+\.?\d*)/,
    /([\d,]+\.\d{1,3})\s*(?:L|ℓ|리터)/i,
    /([\d,]+)\s*(?:L|ℓ|리터)\b/i,
  ]
  for (const p of patterns) {
    const m = text.match(p)
    if (m) {
      const n = toNumber(m[1])
      if (n >= 1 && n <= 200) return n
    }
  }
  return undefined
}

function parseUnitPrice(text: string): number | undefined {
  const patterns = [/(?:단\s*가|리터당)\s*[:：]?\s*([\d,]+)/, /([\d,]{3,6})\s*원?\s*\/\s*(?:L|ℓ)/i]
  for (const p of patterns) {
    const m = text.match(p)
    if (m) {
      const n = toNumber(m[1])
      if (n >= 500 && n <= 5000) return n
    }
  }
  return undefined
}

function parseAmount(text: string): number | undefined {
  const labeled = [
    ...text.matchAll(
      /(?:결\s*제\s*금\s*액|승\s*인\s*금\s*액|판\s*매\s*금\s*액|받을\s*금액|합\s*계|총\s*액|금\s*액)\s*[:：]?\s*₩?\s*([\d,]+)/g,
    ),
  ]
    .map((m) => toNumber(m[1]))
    .filter((n) => n >= 1000 && n <= 2_000_000)
  if (labeled.length > 0) return Math.max(...labeled)

  // 라벨을 못 찾으면 콤마 형식 금액 중 최댓값으로 추정
  const candidates = [...text.matchAll(/\b(\d{1,3}(?:,\d{3})+)\b/g)]
    .map((m) => toNumber(m[1]))
    .filter((n) => n >= 5000 && n <= 2_000_000)
  if (candidates.length > 0) return Math.max(...candidates)
  return undefined
}

const CARD_ISSUERS =
  /(신한|삼성|현대|KB\s*국민|국민|롯데|하나|우리|NH\s*농협|농협|BC|비씨|IBK|기업|카카오뱅크|카카오|토스|씨티|SC\s*제일)/

function parseCard(lines: string[]): string | undefined {
  const cardLine = lines.find((l) => /(카드|CARD)/i.test(l) && !/카드번호없음/.test(l))
  const source = cardLine ?? lines.find((l) => CARD_ISSUERS.test(l))
  if (!source) return undefined
  const issuer = source.match(CARD_ISSUERS)
  if (issuer) return `${issuer[1].replace(/\s+/g, '')}카드`
  if (cardLine) {
    const cleaned = cardLine
      .replace(/^(카드\s*(?:종류|명)?|결제\s*수단)\s*[:：]?\s*/, '')
      .replace(/[\d*-]{6,}.*/, '')
      .trim()
    if (cleaned.length >= 2 && cleaned.length <= 20) return cleaned
  }
  return undefined
}

/**
 * 주유소 영수증 OCR 텍스트에서 날짜·주유소명·주소·유종·주유량·금액·단가·결제카드를 추출한다.
 * 인식하지 못한 필드는 undefined로 남겨 사용자가 직접 입력하도록 한다.
 */
export function parseReceiptText(raw: string): ParsedReceipt {
  const lines = raw
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
  const text = lines.join('\n')

  const result: ParsedReceipt = {
    date: parseDate(text),
    stationName: parseStationName(lines),
    stationAddress: parseAddress(lines),
    fuelGrade: parseFuelGrade(text),
    liters: parseLiters(text),
    unitPrice: parseUnitPrice(text),
    amount: parseAmount(text),
    paymentCard: parseCard(lines),
  }

  // 두 값이 있으면 나머지 하나를 계산해 채운다
  if (result.amount && result.liters && !result.unitPrice) {
    result.unitPrice = Math.round(result.amount / result.liters)
  } else if (result.amount && result.unitPrice && !result.liters) {
    result.liters = Math.round((result.amount / result.unitPrice) * 100) / 100
  }

  return result
}
