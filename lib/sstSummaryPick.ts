export interface SstSummary {
  id: 'a' | 'b';
  text: string;
  wordCount: number;
}

export interface SstSummaryChallenge {
  id: string;
  lectureText: string;
  summaries: [SstSummary, SstSummary];
  correctSummaryId: 'a' | 'b';
  explanation: { en: string; zh: string };
}

function wc(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function summary(id: 'a' | 'b', text: string): SstSummary {
  return { id, text, wordCount: wc(text) };
}

export const sstSummaryPickChallenges: SstSummaryChallenge[] = [
  {
    id: 'sst-summary-001',
    lectureText:
      'Recent studies show that short daytime naps of about twenty minutes can improve memory and alertness. Researchers tested university students and found their reaction times rose by roughly fifteen percent after a brief nap, while longer naps left subjects groggy.',
    summaries: [
      summary(
        'a',
        'The lecture explains that brief twenty-minute daytime naps improve memory and alertness, citing a university study where reaction times rose about fifteen percent, while longer naps caused grogginess.',
      ),
      summary(
        'b',
        'The lecturer talks about a study where university students were tested on their reaction times. Their times rose by roughly fifteen percent after a short nap of about twenty minutes, but longer naps left them groggy in the afternoon.',
      ),
    ],
    correctSummaryId: 'a',
    explanation: {
      en: 'Summary A leads with the main idea (short naps improve memory and alertness) and then supports it with the study and the long-nap caveat. Summary B starts with study procedure detail and never names the main claim, so the marker cannot see what the lecture is actually about.',
      zh: 'A 先说主旨（短时小憩能提升记忆和警觉），再用研究和"长时反而困"做支撑。B 一上来就在说实验过程，主旨没明确写出来，评分时看不到这段在讲什么。',
    },
  },
  {
    id: 'sst-summary-002',
    lectureText:
      'Coral reefs are under serious threat from warming oceans, which cause bleaching when temperatures stay high for too long. Scientists warn that without rapid emission cuts, most reefs could be lost within decades, taking with them the marine species that depend on them.',
    summaries: [
      summary(
        'a',
        'The lecture describes how warming oceans cause coral bleaching when temperatures stay high too long, and warns that most reefs could be lost within decades unless emissions are cut quickly, threatening dependent species.',
      ),
      summary(
        'b',
        'The lecture explains that coral bleaching happens when ocean temperatures stay high for too long, which is a complex process scientists are still studying through reef monitoring programs around the world.',
      ),
    ],
    correctSummaryId: 'a',
    explanation: {
      en: 'A captures the main claim (reefs are under serious threat, urgent emission cuts needed) plus the consequence. B zooms in on the bleaching mechanism, treating a supporting detail as the main idea — and even invents content the lecture never said.',
      zh: 'A 抓到了主旨（珊瑚礁面临严重威胁，需立刻减排）和后果。B 把"白化机制"这个支撑点当成主旨在讲，还编造了讲座没说过的内容（监测项目），属于典型抓错重点。',
    },
  },
  {
    id: 'sst-summary-003',
    lectureText:
      'Hybrid work has reshaped office life. Companies report that productivity has held steady while commuting time has dropped, but managers still struggle with maintaining team culture and supporting newer employees who learn best in person.',
    summaries: [
      summary(
        'a',
        'I think hybrid work is generally a good idea, since productivity has held steady and commute time has dropped, although personally I believe new employees still need in-person guidance to grow properly.',
      ),
      summary(
        'b',
        'The lecture reports that hybrid work has kept productivity steady and cut commute time, but managers still struggle to maintain team culture and to support newer employees who learn best in person.',
      ),
    ],
    correctSummaryId: 'b',
    explanation: {
      en: 'B reports the lecture neutrally — both the upside (productivity, commute) and the downside (culture, new staff). A inserts personal opinion ("I think", "I believe"), which costs Content marks: SST is a transcription summary, not an opinion piece.',
      zh: 'B 客观转述了讲座的两面（生产力、通勤是优势；团队文化、新人培养是难点）。A 加了"I think / I believe"的个人观点，SST 评分会扣 Content 分——这是转述题，不是观点题。',
    },
  },
];
