export type TajwidRuleId =
  | 'ghunnah'
  | 'idgham_bighunnah'
  | 'idgham_bilaghunnah'
  | 'iqlab'
  | 'ikhfa'
  | 'qalqalah'
  | 'mad';

export interface TajwidRuleInfo {
  id: TajwidRuleId;
  name: string;
  colorClass: string;
  swatchClass: string;
  duration: string;
  description: string;
  letters: string;
  example: string;
  exampleNote: string;
}

export const TAJWID_RULES: TajwidRuleInfo[] = [
  {
    id: 'ghunnah',
    name: 'Ghunnah Musyaddadah',
    colorClass: 'text-emerald-600 dark:text-emerald-400',
    swatchClass: 'bg-emerald-600 dark:bg-emerald-400',
    duration: 'Dengung 2 harakat',
    description:
      'Huruf Nun atau Mim yang bertasydid dibaca dengan mendengung jelas dari rongga hidung selama 2 harakat.',
    letters: 'نّ · مّ',
    example: 'اِنَّ · ثُمَّ',
    exampleNote: 'Inna · Tsumma',
  },
  {
    id: 'idgham_bighunnah',
    name: 'Idgham Bighunnah',
    colorClass: 'text-purple-600 dark:text-purple-400',
    swatchClass: 'bg-purple-600 dark:bg-purple-400',
    duration: 'Lebur + dengung 2 harakat',
    description:
      'Nun sukun atau tanwin bertemu salah satu dari empat huruf berikut dileburkan disertai suara dengung.',
    letters: 'ي · ن · م · و',
    example: 'مَنْ يَّقُوْلُ · سِنَةٌ وَّلَا',
    exampleNote: 'May-yaqūlu · Sinatuw-walā',
  },
  {
    id: 'idgham_bilaghunnah',
    name: 'Idgham Bilaghunnah',
    colorClass: 'text-slate-500 dark:text-slate-400',
    swatchClass: 'bg-slate-500 dark:bg-slate-400',
    duration: 'Lebur tanpa dengung',
    description:
      'Nun sukun atau tanwin bertemu huruf Lam atau Ra dileburkan langsung ke huruf berikutnya tanpa dengung.',
    letters: 'ل · ر',
    example: 'مِنْ رَّبِّهِمْ · هُدًى لِّلْمُتَّقِيْنَ',
    exampleNote: 'Mir-rabbihim · Hudal-lilmuttaqīn',
  },
  {
    id: 'iqlab',
    name: 'Iqlab',
    colorClass: 'text-blue-600 dark:text-blue-400',
    swatchClass: 'bg-blue-600 dark:bg-blue-400',
    duration: 'Tukar ke Mim + dengung 2 harakat',
    description:
      'Nun sukun atau tanwin bertemu huruf Ba ditukar bunyinya menjadi Mim ringan yang didengungkan.',
    letters: 'ب',
    example: 'مِنْ بَعْدِ · سَمِيْعٌ بَصِيْرٌ',
    exampleNote: 'Mim-ba‘di · Samī‘um-baṣīr',
  },
  {
    id: 'ikhfa',
    name: 'Ikhfa (Haqiqi & Syafawi)',
    colorClass: 'text-amber-600 dark:text-amber-400',
    swatchClass: 'bg-amber-600 dark:bg-amber-400',
    duration: 'Samar + dengung 2 harakat',
    description:
      'Nun sukun/tanwin bertemu 15 huruf Ikhfa atau Mim sukun bertemu huruf Ba dibaca samar dengan dengung.',
    letters: 'ت ث ج د ذ ز س ش ص ض ط ظ ف ق ك (dan مْ + ب)',
    example: 'اَنْعَمْتَ · عِنْدَهٗ · تَرْمِيْهِمْ بِحِجَارَةٍ',
    exampleNote: 'Ang‘amta · ‘Indahū · Tarmīhim-biḥijārah',
  },
  {
    id: 'qalqalah',
    name: 'Qalqalah',
    colorClass: 'text-rose-600 dark:text-rose-400',
    swatchClass: 'bg-rose-600 dark:bg-rose-400',
    duration: 'Memantul jelas',
    description:
      'Lima huruf Qalqalah yang berharakat sukun (mati asli atau karena waqaf) dibaca dengan pantulan suara.',
    letters: 'ق · ط · ب · ج · د',
    example: 'قُلْ هُوَ اللّٰهُ اَحَدٌ · يَخْلُقْ',
    exampleNote: 'Aḥad(e) · Yakhluq(e)',
  },
  {
    id: 'mad',
    name: 'Mad (Wajib, Jaiz & Lazim)',
    colorClass: 'text-sky-600 dark:text-sky-400',
    swatchClass: 'bg-sky-600 dark:bg-sky-400',
    duration: 'Panjang 4–6 harakat',
    description:
      'Bacaan yang bertanda harakat panjang bergelombang (maddah) dipanjangkan 4 sampai 6 harakat.',
    letters: 'ـٓ · ـۤ (tanda maddah)',
    example: 'لَآ اِلٰهَ · شَاۤءَ · الضَّاۤلِّيْنَ',
    exampleNote: 'Lā ilāha · Syā’a · Aḍ-ḍāllīn',
  },
];

export const TAJWID_CLASS_MAP: Record<TajwidRuleId, string> = {
  ghunnah: 'text-emerald-600 dark:text-emerald-400',
  idgham_bighunnah: 'text-purple-600 dark:text-purple-400',
  idgham_bilaghunnah: 'text-slate-500 dark:text-slate-400',
  iqlab: 'text-blue-600 dark:text-blue-400',
  ikhfa: 'text-amber-600 dark:text-amber-400',
  qalqalah: 'text-rose-600 dark:text-rose-400',
  mad: 'text-sky-600 dark:text-sky-400',
};

export interface TajwidSegment {
  text: string;
  rule: TajwidRuleId | null;
}

const SUKUN = '\u0652';
const SHADDAH = '\u0651';
const TANWIN = new Set(['\u064B', '\u064C', '\u064D']);
const MADDAH = new Set(['\u0653', '\u06E4']);
const SMALL_MEEM = '\u06E2';
const QALQALAH_LETTERS = new Set(['ق', 'ط', 'ب', 'ج', 'د']);
const IDGHAM_BIGHUNNAH_NEXT = new Set(['ي', 'ن', 'م', 'و']);
const IDGHAM_BILAGHUNNAH_NEXT = new Set(['ل', 'ر']);
const IKHFA_NEXT = new Set([
  'ت',
  'ث',
  'ج',
  'د',
  'ذ',
  'ز',
  'س',
  'ش',
  'ص',
  'ض',
  'ط',
  'ظ',
  'ف',
  'ق',
  'ك',
]);

function isDiacritic(ch: string): boolean {
  const code = ch.charCodeAt(0);
  return (
    (code >= 0x064b && code <= 0x065f) ||
    code === 0x0670 ||
    (code >= 0x06d6 && code <= 0x06ed)
  );
}

function isArabicLetter(ch: string): boolean {
  const code = ch.charCodeAt(0);
  return code >= 0x0621 && code <= 0x064a;
}

interface GlyphCluster {
  base: string;
  marks: string;
  raw: string;
}

function splitClusters(text: string): GlyphCluster[] {
  const clusters: GlyphCluster[] = [];
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (isDiacritic(ch) && clusters.length > 0) {
      clusters[clusters.length - 1].marks += ch;
      clusters[clusters.length - 1].raw += ch;
    } else {
      clusters.push({ base: ch, marks: '', raw: ch });
    }
  }
  return clusters;
}

function findNextLetterIndex(clusters: GlyphCluster[], fromIdx: number): number {
  for (let i = fromIdx + 1; i < clusters.length; i++) {
    const b = clusters[i].base;
    if (b === ' ' || b === 'ا' && i === fromIdx + 1 && clusters[fromIdx].marks.includes('\u064B')) {
      // Skip trailing silent Alif after fathatain (e.g. سَمِيْعًا بَصِيْرًا)
      continue;
    }
    if (isArabicLetter(b)) return i;
  }
  return -1;
}

export function parseTajwidSegments(text: string): TajwidSegment[] {
  const clusters = splitClusters(text);
  const rules: (TajwidRuleId | null)[] = new Array(clusters.length).fill(null);

  for (let i = 0; i < clusters.length; i++) {
    const c = clusters[i];
    const hasSukun = c.marks.includes(SUKUN);
    const hasShaddah = c.marks.includes(SHADDAH);
    const hasTanwin = [...c.marks].some((m) => TANWIN.has(m));
    const hasMaddah = [...c.marks].some((m) => MADDAH.has(m));
    const hasSmallMeem = c.marks.includes(SMALL_MEEM);

    // 1. Maddah (~ 4-6 harakat)
    if (hasMaddah) {
      rules[i] = 'mad';
      continue;
    }

    // 2. Ghunnah Musyaddadah (Nun or Mim with Shaddah, excluding idgham-assigned markers later)
    if ((c.base === 'ن' || c.base === 'م') && hasShaddah) {
      rules[i] = 'ghunnah';
    }

    // 3. Nun Sukun or Tanwin rules (Idgham, Iqlab, Ikhfa)
    const isNunSukun = c.base === 'ن' && (hasSukun || hasSmallMeem);
    if (isNunSukun || hasTanwin) {
      const nextIdx = findNextLetterIndex(clusters, i);
      if (nextIdx !== -1) {
        const nextBase = clusters[nextIdx].base;
        if (nextBase === 'ب' || hasSmallMeem) {
          rules[i] = 'iqlab';
          continue;
        }
        if (IDGHAM_BIGHUNNAH_NEXT.has(nextBase)) {
          rules[i] = 'idgham_bighunnah';
          continue;
        }
        if (IDGHAM_BILAGHUNNAH_NEXT.has(nextBase)) {
          rules[i] = 'idgham_bilaghunnah';
          continue;
        }
        if (IKHFA_NEXT.has(nextBase)) {
          rules[i] = 'ikhfa';
          continue;
        }
      }
    }

    // 4. Ikhfa Syafawi (Mim Sukun followed by Ba)
    if (c.base === 'م' && hasSukun) {
      const nextIdx = findNextLetterIndex(clusters, i);
      if (nextIdx !== -1 && clusters[nextIdx].base === 'ب') {
        rules[i] = 'ikhfa';
        continue;
      }
    }

    // 5. Qalqalah (Qaf, Tha, Ba, Jim, Dal with Sukun)
    if (QALQALAH_LETTERS.has(c.base) && hasSukun && !rules[i]) {
      rules[i] = 'qalqalah';
    }
  }

  // Merge adjacent clusters sharing the same rule so DOM stays minimal and ligatures intact
  const segments: TajwidSegment[] = [];
  for (let i = 0; i < clusters.length; i++) {
    const r = rules[i];
    const last = segments[segments.length - 1];
    if (last && last.rule === r) {
      last.text += clusters[i].raw;
    } else {
      segments.push({ text: clusters[i].raw, rule: r });
    }
  }

  return segments;
}
