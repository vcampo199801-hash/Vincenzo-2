// Best-effort GS1-128 / GS1 DataMatrix parser. Italian pharmaceutical packaging
// carries a DataMatrix (anti-counterfeiting "bollino") encoding GTIN (AI 01),
// batch/lot (AI 10) and expiry date (AI 17) — this pulls those out so a scan
// can prefill lotto/scadenza instead of typing them by hand. Plain EAN-13/QR
// codes with no GS1 structure just come back empty and the raw code is kept.

const FIXED_LENGTH_AIS: Record<string, number> = {
  "00": 18,
  "01": 14,
  "02": 14,
  "11": 6,
  "12": 6,
  "13": 6,
  "15": 6,
  "16": 6,
  "17": 6,
  "20": 2,
};

// Variable-length AIs, terminated by a GS (\x1d) separator or end of string.
const VARIABLE_AIS = new Set(["10", "21", "22", "30", "37", "240", "241", "250", "251"]);

const GS = "";

export type ParsedGs1 = {
  gtin?: string;
  lotto?: string;
  /** ISO yyyy-mm-dd, ready for an <input type="date"> value. */
  scadenza?: string;
  serial?: string;
};

function ai17ToIsoDate(yymmdd: string): string | undefined {
  if (!/^\d{6}$/.test(yymmdd)) return undefined;
  const yy = parseInt(yymmdd.slice(0, 2), 10);
  const mm = yymmdd.slice(2, 4);
  let dd = yymmdd.slice(4, 6);
  if (dd === "00") dd = "01"; // GS1: "00" means end-of-month — approximate, user can correct
  const year = yy >= 51 ? 1900 + yy : 2000 + yy; // GS1's standard pivot year
  return `${year}-${mm}-${dd}`;
}

function applyAi(ai: string, value: string, result: ParsedGs1) {
  if (ai === "01" || ai === "00") result.gtin = value;
  if (ai === "10") result.lotto = value;
  if (ai === "21") result.serial = value;
  if (ai === "17") result.scadenza = ai17ToIsoDate(value);
}

export function parseGs1Barcode(raw: string): ParsedGs1 {
  const result: ParsedGs1 = {};

  // Human-readable bracketed form some scanners emit, e.g. "(01)08012345678909(17)260731(10)ABC123".
  if (raw.includes("(")) {
    const re = /\((\d{2,4})\)([^(]*)/g;
    let match: RegExpExecArray | null;
    while ((match = re.exec(raw))) {
      applyAi(match[1], match[2].trim(), result);
    }
    if (result.gtin || result.lotto || result.scadenza) return result;
  }

  // Raw GS1 form: sequential AI+value pairs, FNC1 (\x1d) separates variable-length fields.
  const s = raw.replace(/^[\x1d\x1c\x04]+/, "");
  let i = 0;
  while (i < s.length - 1) {
    const ai2 = s.slice(i, i + 2);
    const ai3 = s.slice(i, i + 3);
    const ai4 = s.slice(i, i + 4);
    let ai: string | null = null;
    if (FIXED_LENGTH_AIS[ai2] !== undefined || VARIABLE_AIS.has(ai2)) ai = ai2;
    else if (VARIABLE_AIS.has(ai3)) ai = ai3;
    else if (VARIABLE_AIS.has(ai4)) ai = ai4;
    if (!ai) break; // unrecognized AI — stop rather than risk misreading the rest

    const start = i + ai.length;
    const fixedLen = FIXED_LENGTH_AIS[ai];
    if (fixedLen !== undefined) {
      applyAi(ai, s.slice(start, start + fixedLen), result);
      i = start + fixedLen;
    } else {
      let end = s.indexOf(GS, start);
      if (end === -1) end = s.length;
      applyAi(ai, s.slice(start, end), result);
      i = end + 1;
    }
  }

  return result;
}
