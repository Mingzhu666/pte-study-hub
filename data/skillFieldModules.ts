// Skill Field — visualization metadata for the 20 PTE Academic task types.
// Bridges the design-spec module codes (WFD, RS, ...) with this project's
// PTEModule IDs in data/pteModules.ts (wfd, rs, ...).
//
// weight (0-100): subjective composite of how much this task moves the overall band.
// skills: which of the 4 communicative skills it scores into (0-3 strength).
//   L = Listening, R = Reading, S = Speaking, W = Writing.

export type SkillKey = 'L' | 'R' | 'S' | 'W';

export interface SkillFieldNode {
  designId: string;
  moduleId: string;
  /** commandMap.ts node id used to drive MissionPanel. Listening-only
   *  multi/single choice variants (lmc, lmcs) collapse onto the shared
   *  mcm/mcs nodes since commandMap doesn't split by section. */
  commandNodeId: string;
  code: string;
  name: string;
  cn: string;
  section: 'SW' | 'R' | 'L';
  skills: Record<SkillKey, number>;
  weight: number;
  count: string;
  time: string;
}

export const SKILL_FIELD_NODES: SkillFieldNode[] = [
  // ───── Speaking & Writing ─────
  { designId: 'RA',     moduleId: 'ra',     commandNodeId: 'ra',     code: 'RA',      name: 'Read Aloud',                       cn: '朗读',           section: 'SW', skills: { L:0, R:3, S:3, W:0 }, weight: 78, count: '6–7',   time: '30–40s' },
  { designId: 'RS',     moduleId: 'rs',     commandNodeId: 'rs',     code: 'RS',      name: 'Repeat Sentence',                  cn: '复述句子',       section: 'SW', skills: { L:3, R:0, S:3, W:0 }, weight: 94, count: '10–12', time: '15s'    },
  { designId: 'DI',     moduleId: 'di',     commandNodeId: 'di',     code: 'DI',      name: 'Describe Image',                   cn: '看图说话',       section: 'SW', skills: { L:0, R:0, S:3, W:0 }, weight: 42, count: '6–7',   time: '40s'    },
  { designId: 'RL',     moduleId: 'rl',     commandNodeId: 'rl',     code: 'RL',      name: 'Re-tell Lecture',                  cn: '复述讲座',       section: 'SW', skills: { L:3, R:0, S:3, W:0 }, weight: 72, count: '1–2',   time: '40s'    },
  { designId: 'ASQ',    moduleId: 'asq',    commandNodeId: 'asq',    code: 'ASQ',     name: 'Answer Short Question',            cn: '简短回答',       section: 'SW', skills: { L:2, R:0, S:2, W:0 }, weight: 32, count: '5–6',   time: '10s'    },
  { designId: 'SWT',    moduleId: 'swt',    commandNodeId: 'swt',    code: 'SWT',     name: 'Summarize Written Text',           cn: '总结书面文本',   section: 'SW', skills: { L:0, R:3, S:0, W:3 }, weight: 65, count: '1–2',   time: '10min'  },
  { designId: 'WE',     moduleId: 'essay',  commandNodeId: 'essay',  code: 'WE',      name: 'Write Essay',                      cn: '写作文',         section: 'SW', skills: { L:0, R:0, S:0, W:3 }, weight: 68, count: '1–2',   time: '20min'  },

  // ───── Reading ─────
  { designId: 'RWFIB',  moduleId: 'rw-fib', commandNodeId: 'rw-fib', code: 'R&W FIB', name: 'Reading & Writing Fill in Blanks', cn: '读写填空',       section: 'R',  skills: { L:0, R:3, S:0, W:3 }, weight: 84, count: '5–6',   time: '—'      },
  { designId: 'MCMA_R', moduleId: 'mcm',    commandNodeId: 'mcm',    code: 'MCMA',    name: 'Multiple Choice, Multi (R)',       cn: '阅读多选',       section: 'R',  skills: { L:0, R:2, S:0, W:0 }, weight: 28, count: '1–2',   time: '—'      },
  { designId: 'RO',     moduleId: 'rp',     commandNodeId: 'rp',     code: 'RO',      name: 'Re-order Paragraphs',              cn: '段落排序',       section: 'R',  skills: { L:0, R:3, S:0, W:0 }, weight: 46, count: '2–3',   time: '—'      },
  { designId: 'RFIB',   moduleId: 'r-fib',  commandNodeId: 'r-fib',  code: 'R FIB',   name: 'Reading Fill in the Blanks',       cn: '阅读填空',       section: 'R',  skills: { L:0, R:3, S:0, W:0 }, weight: 48, count: '4–5',   time: '—'      },
  { designId: 'MCSA_R', moduleId: 'mcs',    commandNodeId: 'mcs',    code: 'MCSA',    name: 'Multiple Choice, Single (R)',      cn: '阅读单选',       section: 'R',  skills: { L:0, R:1, S:0, W:0 }, weight: 18, count: '1–2',   time: '—'      },

  // ───── Listening ─────
  { designId: 'SST',    moduleId: 'sst',    commandNodeId: 'sst',    code: 'SST',     name: 'Summarize Spoken Text',            cn: '总结口语文本',   section: 'L',  skills: { L:3, R:0, S:0, W:3 }, weight: 70, count: '1–2',   time: '10min'  },
  { designId: 'MCMA_L', moduleId: 'lmc',    commandNodeId: 'mcm',    code: 'MCMA',    name: 'Multiple Choice, Multi (L)',       cn: '听力多选',       section: 'L',  skills: { L:2, R:0, S:0, W:0 }, weight: 26, count: '1–2',   time: '—'      },
  { designId: 'FIBL',   moduleId: 'lfb',    commandNodeId: 'lfb',    code: 'L FIB',   name: 'Fill in the Blanks (L)',           cn: '听力填空',       section: 'L',  skills: { L:3, R:0, S:0, W:2 }, weight: 64, count: '2–3',   time: '—'      },
  { designId: 'HCS',    moduleId: 'hcs',    commandNodeId: 'hcs',    code: 'HCS',     name: 'Highlight Correct Summary',        cn: '选择正确摘要',   section: 'L',  skills: { L:2, R:0, S:0, W:0 }, weight: 24, count: '1–2',   time: '—'      },
  { designId: 'MCSA_L', moduleId: 'lmcs',   commandNodeId: 'mcs',    code: 'MCSA',    name: 'Multiple Choice, Single (L)',      cn: '听力单选',       section: 'L',  skills: { L:1, R:0, S:0, W:0 }, weight: 16, count: '1–2',   time: '—'      },
  { designId: 'SMW',    moduleId: 'smw',    commandNodeId: 'smw',    code: 'SMW',     name: 'Select Missing Word',              cn: '选择缺失词',     section: 'L',  skills: { L:2, R:0, S:0, W:0 }, weight: 22, count: '1–2',   time: '—'      },
  { designId: 'HIW',    moduleId: 'hiw',    commandNodeId: 'hiw',    code: 'HIW',     name: 'Highlight Incorrect Words',        cn: '划出错词',       section: 'L',  skills: { L:3, R:0, S:0, W:0 }, weight: 52, count: '2–3',   time: '—'      },
  { designId: 'WFD',    moduleId: 'wfd',    commandNodeId: 'wfd',    code: 'WFD',     name: 'Write from Dictation',             cn: '听写句子',       section: 'L',  skills: { L:3, R:0, S:0, W:3 }, weight: 98, count: '3–4',   time: '—'      },
];

export const SKILL_META: Record<SkillKey, { key: SkillKey; en: string; cn: string }> = {
  L: { key: 'L', en: 'Listening', cn: '听力' },
  R: { key: 'R', en: 'Reading',   cn: '阅读' },
  S: { key: 'S', en: 'Speaking',  cn: '口语' },
  W: { key: 'W', en: 'Writing',   cn: '写作' },
};

export function isHighROI(node: SkillFieldNode): boolean {
  if (node.weight < 65) return false;
  const strong = (['L', 'R', 'S', 'W'] as SkillKey[]).filter((k) => node.skills[k] >= 2).length;
  return strong >= 2;
}

export function nodeNameForLanguage(node: SkillFieldNode, language: 'en' | 'zh'): string {
  return language === 'zh' ? node.cn : node.name;
}

export function skillMetaName(meta: { en: string; cn: string }, language: 'en' | 'zh'): string {
  return language === 'zh' ? meta.cn : meta.en;
}
