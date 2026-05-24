import type { PTEModule } from '@/types/pte';

export type CommandTarget = 'seven' | 'eight';

export type CommandPriority = 'focus' | 'active' | 'support' | 'low';

export interface Bilingual {
  en: string;
  zh: string;
}

export interface BilingualList {
  en: readonly string[];
  zh: readonly string[];
}

export interface TargetProfile {
  id: CommandTarget;
  label: Bilingual;
  scores: Array<{ skill: string; value: number }>;
  route: string[];
  support: string[];
}

export interface CommandNode {
  id: string;
  label: string;
  skills: PTEModule['category'][];
  priority: Record<CommandTarget, CommandPriority>;
  dailyVolume: Record<CommandTarget, Bilingual>;
  rationale: Record<CommandTarget, Bilingual>;
  checklist: Record<CommandTarget, BilingualList>;
  failurePoints: Record<CommandTarget, BilingualList>;
}

const checklist = {
  seven: {
    wfd: {
      en: [
        '50-100 sentences / day.',
        'Capture the main clause first, then add details.',
        'Check spelling, plurals, articles, prepositions, tense.',
        'Drill high-frequency questions repeatedly.',
        'Reserve enough time for WFD on test day.',
      ],
      zh: [
        '每天 50-100 句。',
        '先记主干，再补细节。',
        '检查拼写、单复数、冠词、介词、时态。',
        '高频题反复刷。',
        '考试给 WFD 留足时间。',
      ],
    },
    rs: {
      en: [
        '50-100 sentences / day.',
        'Repeat short sentences in full.',
        'For long sentences grab subject, verb, object and keywords.',
        'Keep speaking even when you missed parts.',
        'Goal: no breaks, no panic, no blanks.',
      ],
      zh: [
        '每天 50-100 句。',
        '简单句尽量完整复述。',
        '长句抓主谓宾和关键词。',
        '听不全也继续说。',
        '目标是不断、不慌、不空白。',
      ],
    },
    essay: {
      en: [
        'Use templates only as a frame; real content is required.',
        'Decide how many questions the prompt is asking.',
        'Rewrite the prompt in the introduction.',
        'Body = opinion + explanation + example.',
        'Choose simple sentences over flashy but broken ones.',
      ],
      zh: [
        '模板可以用，但必须有真实内容。',
        '先判断题目问几个问题。',
        '引言改写题目。',
        'Body 写观点 + 解释 + 例子。',
        '语法宁可简单也别错。',
      ],
    },
    sst: {
      en: [
        'Note the topic plus 2-3 keyword groups.',
        'Organize with a template.',
        'Keep it within 50-70 words.',
        'Memorize titles and keywords, not full transcripts.',
        'Check spelling, grammar, punctuation.',
      ],
      zh: [
        '记主题 + 2-3 组关键词。',
        '用模板组织。',
        '控制在 50-70 词。',
        '熟标题和关键词，不背全文。',
        '检查拼写、语法、标点。',
      ],
    },
    fib: {
      en: [
        'Decide the part of speech first.',
        'Look for fixed collocations.',
        'Check the grammar around the blank.',
        'Watch plural, tense, prepositions.',
        'Build a collocation log from your mistakes.',
      ],
      zh: [
        '先判断词性。',
        '看固定搭配。',
        '看空格前后语法。',
        '注意单复数、时态、介词。',
        '错题整理搭配本。',
      ],
    },
    ra: {
      en: [
        'Pre-read and chunk by punctuation.',
        'Hold a natural pace.',
        'Do not stop on unknown words.',
        'Stabilize the first few questions.',
        '10-20 reads / day.',
      ],
      zh: [
        '预读时按标点断句。',
        '保持自然语速。',
        '生词不要停。',
        '开头几题稳住。',
        '每天 10-20 篇。',
      ],
    },
    di: {
      en: [
        'Fixed frame: topic + data points + summary.',
        'Capture max, min, trends.',
        'Speak for 25-35 seconds.',
        'Relevance is enough.',
        '1-3 drills / day to keep feel.',
      ],
      zh: [
        '固定框架：主题 + 信息点 + 总结。',
        '抓最大值、最小值、趋势。',
        '说 25-35 秒。',
        '内容相关即可。',
        '每天 1-3 题保持口感。',
      ],
    },
    rl: {
      en: [
        'Note phrases, not single words.',
        'Capture topic, reasons, examples, conclusion.',
        'Use a template to thread the content.',
        'Keep speaking even when you missed parts.',
        '1-3 drills / day.',
      ],
      zh: [
        '记短语，不只记单词。',
        '抓主题、原因、例子、结论。',
        '用模板串内容。',
        '没听懂也继续说。',
        '每天 1-3 题。',
      ],
    },
    swt: {
      en: [
        'Must be a single sentence.',
        'Lock onto main idea + core details.',
        'Connect with and / while / because / which.',
        'No personal opinions.',
        'Verify there is exactly one period.',
      ],
      zh: [
        '必须一句话。',
        '抓主旨 + 核心细节。',
        '用 and / while / because / which 连接。',
        '不加个人观点。',
        '检查句号数量。',
      ],
    },
    hiw: {
      en: [
        'Track the text with your mouse.',
        'Click the moment you hear a difference.',
        'Never look back.',
        'Train speed and focus.',
        'Do not click when uncertain.',
      ],
      zh: [
        '鼠标跟着文本走。',
        '听到不同立刻点。',
        '不回看。',
        '练速度和专注力。',
        '不确定别乱点。',
      ],
    },
    ro: {
      en: [
        'Find the opening sentence first.',
        'Watch this / these / it / such references.',
        'Look for the timeline.',
        'Track repeated topic words.',
        'Move on if you run out of time.',
      ],
      zh: [
        '先找首句。',
        '找 this / these / it / such 指代。',
        '找时间线。',
        '找主题词重复。',
        '超时就走。',
      ],
    },
    choice: {
      en: [
        'Read the stem first.',
        'Locate evidence with the question in mind.',
        'On multi-select, fewer picks if unsure.',
        'Eliminate clearly wrong options.',
        'Cap your time on these low-yield items.',
      ],
      zh: [
        '先读题干。',
        '带问题定位。',
        '多选不确定少选。',
        '排除明显错误。',
        '控时低投入。',
      ],
    },
    lowListening: {
      en: [
        'Keep basic feel only.',
        'Answers stay short, accurate, fast.',
        'For listening items, grab main idea and logic.',
        'On FIB-L watch s / ed / spelling.',
        'Do not over-invest time here.',
      ],
      zh: [
        '保持基本手感。',
        '答案短、准、快。',
        '听力题先抓主旨和逻辑。',
        'FIB-L 注意 s / ed / spelling。',
        '不投入过多时间。',
      ],
    },
  },
  eight: {
    wfd: {
      en: [
        'Practice both high-frequency and unseen items.',
        '50-100 sentences / day.',
        'Drill error logs until perfect.',
        'Review the error type after every sentence.',
        'Final pass: spelling, plural, tense, preposition word by word.',
      ],
      zh: [
        '高频 + 非高频都练。',
        '每天 50-100 句。',
        '错题刷到完全不错。',
        '每句复盘错误类型。',
        '最后逐词检查 spelling、plural、tense、preposition。',
      ],
    },
    rs: {
      en: [
        '80-150 sentences / day.',
        'Practice both predictable and unseen items.',
        'Repeat long sentences by sense groups.',
        'Add background noise to train under pressure.',
        'Preserve grammar structure and keywords.',
      ],
      zh: [
        '每天 80-150 句。',
        '预测 + 非预测都练。',
        '长句按意群复述。',
        '加背景噪音练抗压。',
        '保留语法结构和关键词。',
      ],
    },
    essay: {
      en: [
        'Templates alone are not enough.',
        'Prepare general opinion sentences for each topic family.',
        'Practice 1 essay or 1 timed typing pass daily.',
        'Train both typing speed and proofreading speed.',
        'The conclusion must loop back to the prompt.',
      ],
      zh: [
        '不能只靠模板。',
        '每类话题准备通用观点句。',
        '每天至少练 1 篇或默打 1 篇。',
        '练打字速度和检查速度。',
        '结论必须回扣题目。',
      ],
    },
    di: {
      en: [
        'Personalize the template.',
        'For charts capture trend, max, min.',
        'For images / flowcharts describe what you see.',
        'Logic order: overall -> details -> conclusion.',
        'Drill until 25-35s output is natural.',
      ],
      zh: [
        '模板个性化。',
        '图表抓趋势、最大值、最小值。',
        '图片/流程图描述看见的内容。',
        '逻辑顺序：overall -> details -> conclusion。',
        '练到 25-35 秒自然输出。',
      ],
    },
    rlSgd: {
      en: [
        'Note phrases or sentence fragments.',
        'For SGD record speaker + viewpoint.',
        'Structure: topic -> key points -> conclusion.',
        'Keep templates short and flexible.',
        'Train with noise and multi-speaker audio.',
      ],
      zh: [
        '记短语或句子片段。',
        'SGD 记 speaker + viewpoint。',
        '结构：topic -> key points -> conclusion。',
        '模板短而灵活。',
        '加噪音和多人音频训练。',
      ],
    },
    swt: {
      en: [
        'Must be a single sentence.',
        'Main idea first, details serve the main idea.',
        '30-50 words is the safe range.',
        'Avoid risky synonym swaps.',
        'Final check: grammar and punctuation.',
      ],
      zh: [
        '必须一句话。',
        '主旨优先，细节服务主旨。',
        '控制在 30-50 词更稳。',
        '少用不确定的同义替换。',
        '最后检查语法和标点。',
      ],
    },
    sst: {
      en: [
        'Capture main idea, supporting points, conclusion.',
        'Write 2-3 core information points.',
        'Make the template feel natural.',
        'Memorize keywords for high-frequency items.',
        'Spelling and grammar must stay solid.',
      ],
      zh: [
        '抓 main idea、supporting points、conclusion。',
        '写 2-3 个核心信息点。',
        '模板自然化。',
        '高频题熟关键词。',
        '拼写和语法必须稳。',
      ],
    },
    fib: {
      en: [
        'Build a collocation library systematically.',
        'Distinguish near-synonyms carefully.',
        'Use both sentence grammar and paragraph logic.',
        '5-8 passages / day.',
        'Sort errors by POS, collocation, semantics.',
      ],
      zh: [
        '系统积累 collocation。',
        '精细区分近义词。',
        '看句内语法 + 段落逻辑。',
        '每天 5-8 篇。',
        '错题按词性、搭配、语义分类。',
      ],
    },
    ra: {
      en: [
        'Read in meaning chunks.',
        'Even pace, natural stress.',
        'Glide over unknown words.',
        'Add noise training.',
        'Record and replay; check pauses and re-reads.',
      ],
      zh: [
        '读成 meaning chunks。',
        '语速均匀，重音自然。',
        '生词自然滑过。',
        '加入噪音训练。',
        '录音复听，检查停顿和回读。',
      ],
    },
    hiw: {
      en: [
        'Train a steady tracking speed.',
        'Mouse always on the current word.',
        'Drop missed words; never look back.',
        'Train multiple accents.',
        'Keep feel ready before test day.',
      ],
      zh: [
        '练稳定跟读速度。',
        '鼠标始终跟当前词。',
        '错过就放弃，不回头。',
        '训练不同口音。',
        '考前保持手感。',
      ],
    },
    lfb: {
      en: [
        'Predict the part of speech before audio plays.',
        'Listen to the words around the blank together.',
        'Use grammar to judge endings.',
        'Keep a separate log of high-frequency spelling words.',
        'Do a quick re-read of the full passage at the end.',
      ],
      zh: [
        '播放前预判词性。',
        '空格前后一起听。',
        '结合语法判断尾音。',
        '高频拼写词单独整理。',
        '做完快速回读全文。',
      ],
    },
    ro: {
      en: [
        'Light daily volume to keep logic feel.',
        'Focus on opening sentence and adjacent pairs.',
        'Watch references, articles, timeline, logic words.',
        'Stay within time.',
        'Use elimination to lock the easy pairs.',
      ],
      zh: [
        '每天少量保持逻辑手感。',
        '重点练首句和相邻句配对。',
        '看指代、冠词、时间线、逻辑词。',
        '控制时间。',
        '用排除法锁定几对。',
      ],
    },
    rts: {
      en: [
        'Quickly identify the scene: request, apology, suggestion, complaint, instruction.',
        'Decide the audience and purpose.',
        'Structure: response -> action / request -> closing.',
        'Tone: natural and polite.',
        'Rotate scenarios in practice.',
      ],
      zh: [
        '快速识别场景：请求、道歉、建议、投诉、说明。',
        '判断对象和目的。',
        '结构：回应 -> 行动/请求 -> 结束。',
        '语言自然礼貌。',
        '练不同场景。',
      ],
    },
    lowChoice: {
      en: [
        'Stay conservative on multi-select.',
        'On listening MCQs grab main idea and turning points.',
        'For ASQ a short answer is enough.',
        'For HCS pick the summary that covers the whole.',
        'For SMW grab the closing logic.',
      ],
      zh: [
        '保守处理多选。',
        '听力选择题抓主旨和转折。',
        'ASQ 短答即可。',
        'HCS 选覆盖整体的 summary。',
        'SMW 抓结尾逻辑。',
      ],
    },
  },
} as const;

const mistakes = {
  seven: {
    wfd: {
      en: [
        'Heard it but spelled it wrong.',
        'Missed s / ed.',
        'Missed a / the.',
        'Wrong preposition.',
        'No time to check the last item.',
      ],
      zh: [
        '听懂但拼错。',
        '漏 s / ed。',
        '漏 a / the。',
        '介词写错。',
        '最后一题没时间检查。',
      ],
    },
    rs: {
      en: [
        'Chasing completeness causes pauses.',
        'Giving up after missing the opening.',
        'Speaking too slowly.',
        'Drilling predictions only, never reactions.',
        'Too many pauses, repeats, hesitations.',
      ],
      zh: [
        '追求完整导致卡顿。',
        '开头没听清就放弃。',
        '说得太慢。',
        '只背预测，不练反应。',
        '停顿、重复、犹豫太多。',
      ],
    },
    essay: {
      en: [
        'Just stuffing in keywords.',
        'Prompt asks two questions, you answered one.',
        'Template too hollow.',
        'Misusing fancy vocabulary.',
        'Too many spelling, tense, plural errors.',
      ],
      zh: [
        '只塞关键词。',
        '问两个问题只答一个。',
        '模板太空。',
        '高级词乱用。',
        '拼写、时态、单复数错太多。',
      ],
    },
    sst: {
      en: [
        'Word count drifts.',
        'Misspelled keywords.',
        'Notes are scattered words, not sentences.',
        'Template content is off-topic.',
        'Forgot to check plural and tense.',
      ],
      zh: [
        '字数不稳。',
        '关键词拼错。',
        '只记散词，写不成句。',
        '模板内容不相关。',
        '忘记检查单复数和时态。',
      ],
    },
    fib: {
      en: [
        'Picking by Chinese meaning only.',
        'Ignoring preposition collocations.',
        'Cannot tell near-synonyms apart.',
        'Wrong part of speech.',
        'Stuck too long on one blank.',
      ],
      zh: [
        '只凭中文意思选。',
        '忽略介词搭配。',
        '近义词分不清。',
        '词性判断错。',
        '一个空纠结太久。',
      ],
    },
    ra: {
      en: [
        'Reading too fast.',
        'Word-by-word, no rhythm.',
        'Stopping on unknown words.',
        'Re-reading or stress-correcting.',
        'Running out of breath in the second half.',
      ],
      zh: [
        '读太快。',
        '一个词一个词蹦。',
        '生词卡住。',
        '回读、重读。',
        '后半句气息崩。',
      ],
    },
    di: {
      en: [
        'Template too rigid.',
        'Reading numbers only.',
        'Long pauses.',
        'Panicking on complex visuals.',
        'Filling time with made-up content.',
      ],
      zh: [
        '模板太僵。',
        '只念数字。',
        '停顿太长。',
        '看到复杂图就慌。',
        '为了说满时间乱编。',
      ],
    },
    rl: {
      en: [
        'Manic note-taking, missed listening.',
        'Notes are scattered words.',
        'Template content is empty.',
        'Relevance too weak.',
        'Mid-speech pauses.',
      ],
      zh: [
        '疯狂记笔记，反而没听。',
        '只写散词。',
        '模板不会填内容。',
        '相关性太弱。',
        '中途停顿。',
      ],
    },
    swt: {
      en: [
        'Wrote two sentences.',
        'Just piled details.',
        'Sentence too long, grammar broke.',
        'Added personal opinion.',
        'Punctuation errors.',
      ],
      zh: [
        '写成两句话。',
        '只堆细节。',
        '句子太长导致语法错。',
        '自己发挥观点。',
        '标点错误。',
      ],
    },
    hiw: {
      en: [
        'Lost focus, missed clicks.',
        'Over-clicking or mis-clicking.',
        'Eyes cannot keep up with audio.',
        'Missed early, then everything fell apart.',
        'Mis-read paraphrases as errors.',
      ],
      zh: [
        '走神漏点。',
        '多点、误点。',
        '眼睛跟不上音频。',
        '前面漏了后面全乱。',
        '把同义表达误判成错误。',
      ],
    },
    ro: {
      en: [
        'Burned too much time for 1-2 marks.',
        'Wrong opening sentence.',
        'Ignored pronoun chains.',
        'Sorted by Chinese meaning only.',
        'Crowded out FIB time.',
      ],
      zh: [
        '为 1-2 分耗太久。',
        '首句找错。',
        '忽视代词承接。',
        '只凭中文意思排序。',
        '影响 FIB 时间。',
      ],
    },
    choice: {
      en: [
        'Picked an option just because the wording matched.',
        'Random guesses on multi-select.',
        'Missed negation words.',
        'Over-reasoning.',
        'Burned time on low-weight items.',
      ],
      zh: [
        '看到原词就选。',
        '多选乱赌。',
        '忽略否定词。',
        '过度推理。',
        '为低权重题耗时。',
      ],
    },
    lowListening: {
      en: [
        'Rambling on ASQ.',
        'Missed closing logic on SMW.',
        'Got fooled by keyword overlap on HCS.',
        'Heard FIB-L right but spelled wrong.',
        'Low-yield items wrecking your mood.',
      ],
      zh: [
        'ASQ 多说废话。',
        'SMW 没听结尾逻辑。',
        'HCS 被关键词骗。',
        'FIB-L 听对但拼错。',
        '低收益题影响心态。',
      ],
    },
  },
  eight: {
    wfd: {
      en: [
        'Relying on predictions only.',
        'Spelling is not stable.',
        'Plurals, tense, articles dropped.',
        'Filling articles and prepositions randomly.',
        'Focus drops near the end of the test.',
      ],
      zh: [
        '只靠预测。',
        '单词拼写不稳定。',
        '复数、时态、冠词漏掉。',
        '冠词介词随便补。',
        '考到最后注意力下降。',
      ],
    },
    rs: {
      en: [
        'Content too thin.',
        'Too many pauses on long sentences.',
        'Sacrificing fluency for completeness.',
        'Distracted by neighbours in the test centre.',
        'Collapsing on unfamiliar sentences.',
      ],
      zh: [
        '内容太少。',
        '长句停顿太多。',
        '为内容完整牺牲流利度。',
        '考场被旁边人影响。',
        '陌生句子直接崩。',
      ],
    },
    essay: {
      en: [
        'Template feel is too obvious.',
        'Opinions too generic.',
        'Complex sentences with too many errors.',
        'Examples do not serve the opinion.',
        'Skipping the proofreading pass.',
      ],
      zh: [
        '模板痕迹过重。',
        '观点太泛。',
        '句式复杂但错误多。',
        '例子不服务观点。',
        '写完不检查低级错误。',
      ],
    },
    di: {
      en: [
        'Same template the whole way.',
        'Relevance too low.',
        'Stalled after misreading a number.',
        'Speaking too fast.',
        'Long silence at the end.',
      ],
      zh: [
        '全程固定模板。',
        '内容相关性太低。',
        '数字读错后停住。',
        '语速过快。',
        '结尾空白太久。',
      ],
    },
    rlSgd: {
      en: [
        'Copied a public template verbatim.',
        'Mixed up which speaker said what.',
        'Said only the topic, not the content.',
        'Relevance too weak.',
        'Stalled chasing completeness.',
      ],
      zh: [
        '完全照搬公共模板。',
        '观点归属混乱。',
        '只说主题，不说内容。',
        '相关性太弱。',
        '为了完整度卡顿。',
      ],
    },
    swt: {
      en: [
        'Too many complex clauses.',
        'Misused connectors.',
        'Over-paraphrasing changed the meaning.',
        'Punctuation broke the sentence.',
        'Small spelling errors hurting writing score.',
      ],
      zh: [
        '复杂从句太多。',
        '连接词乱用。',
        '改写过度导致变意。',
        '标点造成句子断裂。',
        '拼写小错影响写作。',
      ],
    },
    sst: {
      en: [
        'Content too generic.',
        'Misspelled keywords.',
        'Sentence structure messy.',
        'Mechanical template stacking.',
        'Adding details broke the grammar.',
      ],
      zh: [
        '内容太泛。',
        '关键词拼错。',
        '句子结构混乱。',
        '机械堆模板。',
        '为了多写细节导致语法错。',
      ],
    },
    fib: {
      en: [
        'Memorizing answers, not training judgment.',
        'Looking only at the blank, not the logic.',
        'Picking near-synonyms by feel.',
        'Misled by familiar words.',
        'Too slow.',
      ],
      zh: [
        '背答案，不练判断。',
        '只看空格，不看逻辑。',
        '近义词凭感觉。',
        '被熟词误导。',
        '做太慢。',
      ],
    },
    ra: {
      en: [
        'Sacrificing fluency for completeness.',
        'Going back to re-read.',
        'Intonation too flat or too theatrical.',
        'Tense on the first few items.',
        'Drilling without record-replay.',
      ],
      zh: [
        '为完整度牺牲流利度。',
        '回头补读。',
        '语调过平或过夸张。',
        '前几题紧张。',
        '只刷题不复听。',
      ],
    },
    hiw: {
      en: [
        'Chasing missed clicks causes chain errors.',
        'Mental fatigue drops accuracy.',
        'Over-relying on the visual track.',
        'Click timing is slow.',
        'Mis-read look-alike words.',
      ],
      zh: [
        '追漏点导致连环错。',
        '精神疲劳正确率下降。',
        '太依赖视觉。',
        '点击时机慢。',
        '形近词看错。',
      ],
    },
    lfb: {
      en: [
        'Heard correctly but spelled wrong.',
        'Wrong plural decision.',
        'Liaison swallowed the word.',
        'Slow typing made you miss the next blank.',
        'Changed a correct answer to a wrong one.',
      ],
      zh: [
        '听力对，拼写错。',
        '单复数判断错。',
        '连读吞音影响判断。',
        '打字慢漏下一个空。',
        '把对的改错。',
      ],
    },
    ro: {
      en: [
        'Trying for full marks ate your clock.',
        'Ignored the / a signals.',
        'Misplaced the turning sentence.',
        'Pronoun has no antecedent.',
        'Looked at answers, not the logic chain.',
      ],
      zh: [
        '想全对导致超时。',
        '忽略 the / a 的信息。',
        '转折句位置放错。',
        '代词没有前文对象。',
        '只看答案不看逻辑链。',
      ],
    },
    rts: {
      en: [
        'Answered the wrong scenario.',
        'Tone does not match.',
        'Content is hollow.',
        'Forgot the concrete action.',
        'Sounds rehearsed.',
      ],
      zh: [
        '答偏场景。',
        '语气不合适。',
        '内容空泛。',
        '忘记具体行动。',
        '机械背诵。',
      ],
    },
    lowChoice: {
      en: [
        'Random multi-select picks.',
        'Fooled by surface keyword overlap.',
        'Treated an example as the main idea.',
        'Rambling on ASQ.',
        'Burned time on low-yield items.',
      ],
      zh: [
        '多选乱选。',
        '被原词复现骗。',
        '把例子当主旨。',
        'ASQ 多说废话。',
        '在低收益题上耗太久。',
      ],
    },
  },
} as const;

const dailyVolume = {
  wfd: {
    seven: { en: '50-100 sentences / day', zh: '50-100 句 / day' },
    eight: { en: '50-100 sentences + error review', zh: '50-100 句 + 错题复盘' },
  },
  rs: {
    seven: { en: '50-100 sentences / day', zh: '50-100 句 / day' },
    eight: { en: '80-150 sentences / day', zh: '80-150 句 / day' },
  },
  essay: {
    seven: { en: '1 outline or essay', zh: '1 篇 outline 或 essay' },
    eight: { en: '1 essay or timed typing pass', zh: '1 篇 essay 或限时默打' },
  },
  sst: {
    seven: { en: '1-2 summaries', zh: '1-2 篇 summaries' },
    eight: { en: '2 summaries + spelling pass', zh: '2 篇 + spelling pass' },
  },
  fibRw: {
    seven: { en: 'collocation + grammar error log', zh: '搭配 + 语法错题' },
    eight: { en: '5-8 passages / day', zh: '5-8 篇 / day' },
  },
  fibR: {
    seven: { en: 'collocation + semantic drills', zh: '搭配 + 语义练习' },
    eight: { en: '5-8 passages / day', zh: '5-8 篇 / day' },
  },
  ra: {
    seven: { en: '10-20 reads / day', zh: '10-20 篇 / day' },
    eight: { en: 'record-replay + noise drill', zh: '录音复听 + 噪音训练' },
  },
  di: {
    seven: { en: '1-3 drills to keep feel', zh: '1-3 题保持口感' },
    eight: { en: '25-35s natural output', zh: '25-35 秒自然输出' },
  },
  rl: {
    seven: { en: '1-3 drills / day', zh: '1-3 题 / day' },
    eight: { en: 'phrase fragments + noise drill', zh: '短语片段 + 噪音训练' },
  },
  sgd: {
    seven: { en: 'quick frame only', zh: '只过基本框架' },
    eight: { en: 'speaker + viewpoint drills', zh: 'speaker + viewpoint 练习' },
  },
  swt: {
    seven: { en: '1 summary + period check', zh: '1 篇 summary + 句号检查' },
    eight: { en: '30-50 word one-sentence drill', zh: '30-50 词 one-sentence drill' },
  },
  hiw: {
    seven: { en: 'speed + focus', zh: '速度 + 专注力' },
    eight: { en: 'accent + click timing', zh: '口音 + 点击时机' },
  },
  lfb: {
    seven: { en: 'quick spelling review', zh: '快速 spelling review' },
    eight: { en: 'POS prediction + full re-read', zh: '词性预判 + 回读全文' },
  },
  ro: {
    seven: { en: '2-3 sets, strict timing', zh: '2-3 组，严格控时' },
    eight: { en: 'light logic feel', zh: '少量逻辑手感' },
  },
  rts: {
    seven: { en: 'quick frame only', zh: '只过基本框架' },
    eight: { en: 'rotate scenarios', zh: '不同场景轮换' },
  },
  lowChoice: {
    seven: { en: 'low effort, time-controlled', zh: '低投入控时' },
    eight: { en: 'low effort, time-controlled', zh: '低投入控时' },
  },
  mcm: {
    seven: { en: 'fewer picks when unsure', zh: '不确定少选' },
    eight: { en: 'conservative on multi-select', zh: '保守处理多选' },
  },
  hcs: {
    seven: { en: 'main idea only', zh: '只抓主旨' },
    eight: { en: 'summary coverage check', zh: '检查 summary 覆盖度' },
  },
  smw: {
    seven: { en: 'closing logic', zh: '结尾逻辑' },
    eight: { en: 'closing logic', zh: '结尾逻辑' },
  },
  asq: {
    seven: { en: 'short, accurate, fast', zh: '短准快' },
    eight: { en: 'short answer only', zh: '短答即可' },
  },
} as const;

const rationale = {
  wfd: {
    seven: {
      en: 'For Band 7 use WFD to lock listening and writing details — spelling, plurals, time management.',
      zh: '7炸先用 WFD 稳住听力和写作细节，重点是拼写、单复数和时间分配。',
    },
    eight: {
      en: 'For Band 8 WFD cannot rely on predictions — drill high-frequency, unseen items, and word-by-word checks.',
      zh: '8炸的 WFD 不能只靠预测，要把高频、非高频和逐词检查都练稳。',
    },
  },
  rs: {
    seven: {
      en: 'For Band 7 the goal is no breaks, no panic, no blanks — secure simple sentences and main clauses first.',
      zh: '7炸的 RS 目标是不断、不慌、不空白，先把简单句和主干拿住。',
    },
    eight: {
      en: 'For Band 8 RS must hold structure, keywords, and fluency under unfamiliar long sentences and noise.',
      zh: '8炸的 RS 要在陌生句、长句和噪音压力下仍保住结构、关键词和流利度。',
    },
  },
  essay: {
    seven: {
      en: 'For Band 7 essays must really answer the prompt — templates are skeletons; small errors hurt more than fancy phrasing.',
      zh: '7炸写作要真实回答题目，模板只是骨架，低级错误比高级表达更危险。',
    },
    eight: {
      en: 'For Band 8 reduce template feel and stabilize opinions, examples, conclusion call-back, and proofreading speed.',
      zh: '8炸写作要降低模板痕迹，观点句、例子、回扣题目和检查速度都要更稳。',
    },
  },
  sst: {
    seven: {
      en: 'For Band 7 SST, lock 50-70 words with topic, keywords, and a template — avoid scattered words.',
      zh: '7炸的 SST 用主题、关键词和模板稳住 50-70 词，避免散词写不成句。',
    },
    eight: {
      en: 'For Band 8 SST capture main idea, supporting points, conclusion — spelling and grammar must stay solid.',
      zh: '8炸 SST 要抓 main idea、supporting points 和 conclusion，拼写语法必须更稳定。',
    },
  },
  rwFib: {
    seven: {
      en: 'For Band 7 FIB-RW, secure stable marks via POS, collocation, and the grammar around the blank.',
      zh: '7炸的 FIB-RW 先靠词性、搭配和空格前后语法拿稳定分。',
    },
    eight: {
      en: 'For Band 8 FIB-RW build a collocation library and distinguish near-synonyms and paragraph logic.',
      zh: '8炸的 FIB-RW 要系统积累 collocation，并精细区分近义词和段落逻辑。',
    },
  },
  rFib: {
    seven: {
      en: 'For Band 7, FIB-R shares logic with FIB-RW — do not pick by Chinese meaning alone.',
      zh: '7炸的 FIB-R 和 FIB-RW 共用判断逻辑，关键是别只凭中文意思选。',
    },
    eight: {
      en: 'For Band 8 FIB-R use sentence grammar and paragraph logic; memorizing answers will not replace judgment.',
      zh: '8炸的 FIB-R 要看句内语法和段落逻辑，不能背答案代替判断。',
    },
  },
  ra: {
    seven: {
      en: 'For Band 7 RA, hold a natural pace and chunk by punctuation — do not get derailed by unknown words.',
      zh: '7炸 RA 用自然语速和断句稳住开场，不要被生词打断。',
    },
    eight: {
      en: 'For Band 8 RA read in meaning chunks and use record-replay to check pauses, re-reads, intonation.',
      zh: '8炸 RA 要读成 meaning chunks，并用复听检查停顿、回读和语调。',
    },
  },
  di: {
    seven: {
      en: 'For Band 7 DI use a fixed frame for max, min, trends — relevance is enough.',
      zh: '7炸 DI 用固定框架抓最大值、最小值和趋势，内容相关即可。',
    },
    eight: {
      en: 'For Band 8 DI personalize the template and run overall -> details -> conclusion to keep relevance high.',
      zh: '8炸 DI 要模板个性化，按 overall -> details -> conclusion 输出，避免相关性太低。',
    },
  },
  rl: {
    seven: {
      en: 'For Band 7 RL note phrases and topic logic — keep speaking even when you missed parts.',
      zh: '7炸 RL 记短语和主题逻辑，没听懂也继续说。',
    },
    eight: {
      en: 'For Band 8 RL use phrase capture and structured output to protect relevance and fluency.',
      zh: '8炸 RL 要用 phrase capture 和结构化输出保护相关性和流利度。',
    },
  },
  sgd: {
    seven: {
      en: 'For Band 7 only the basic frame is needed — RS / WFD / WE come first.',
      zh: '7炸只需知道基本框架，优先级低于 RS/WFD/WE。',
    },
    eight: {
      en: 'For Band 8 SGD shares the speaking-relevance chain with RL — focus on speaker and viewpoint.',
      zh: '8炸把 SGD 和 RL 放在同一条口语相关性链路里，重点是 speaker 和 viewpoint。',
    },
  },
  swt: {
    seven: {
      en: 'For Band 7 SWT must be one sentence — main idea + core details is enough.',
      zh: '7炸 SWT 的核心是必须一句话，抓主旨和核心细节即可。',
    },
    eight: {
      en: 'For Band 8 SWT take fewer paraphrase risks; main idea first, then check grammar and punctuation.',
      zh: '8炸 SWT 要少冒险改写，主旨优先，最后检查语法和标点。',
    },
  },
  hiw: {
    seven: {
      en: 'For Band 7 HIW keep tracking and click feel — do not click when uncertain.',
      zh: '7炸 HIW 主要保持跟读和点击手感，不确定不要乱点。',
    },
    eight: {
      en: 'For Band 8 HIW guard against fatigue and chasing missed clicks — keep feel ready before test day.',
      zh: '8炸 HIW 要防疲劳和追漏点导致连环错，考前保持手感。',
    },
  },
  lfb: {
    seven: {
      en: 'For Band 7 FIB-L is light maintenance — main risk is s / ed / spelling.',
      zh: '7炸 FIB-L 属于低投入维护，主要避免 s / ed / spelling 失分。',
    },
    eight: {
      en: 'For Band 8 FIB-L use POS prediction, ending judgment, and a high-frequency spelling list.',
      zh: '8炸 FIB-L 要用词性预判、尾音判断和高频拼写表补细节。',
    },
  },
  ro: {
    seven: {
      en: 'For Band 7 RO use opening sentence, references, timeline — do not let it eat FIB time.',
      zh: '7炸 RO 要会找首句、指代和时间线，但不要影响 FIB 时间。',
    },
    eight: {
      en: 'For Band 8 RO focus on opening sentence and adjacent pairs; use elimination to lock the easy pairs.',
      zh: '8炸 RO 重点练首句和相邻句配对，用排除法锁定几对。',
    },
  },
  rts: {
    seven: {
      en: 'For Band 7 RTS is not on the main route — knowing the response frame is enough.',
      zh: '7炸 RTS 不放主线，知道回应框架即可。',
    },
    eight: {
      en: 'For Band 8 RTS quickly judge scene, audience, purpose — output a natural, polite action response.',
      zh: '8炸 RTS 要快速判断场景、对象和目的，输出自然礼貌的行动回应。',
    },
  },
  mcs: {
    seven: {
      en: 'For Band 7 MCS, locate evidence with the question — surface keyword overlap is not the answer.',
      zh: '7炸 MCS 带问题定位即可，看到原词不等于答案。',
    },
    eight: {
      en: 'For Band 8 MCS is low-yield — grab main idea and turning points, do not be fooled by repeated wording.',
      zh: '8炸 MCS 低收益，抓主旨和转折，不要被原词复现骗。',
    },
  },
  mcm: {
    seven: {
      en: 'For Band 7 MCM stay conservative and time-controlled — no random gambling.',
      zh: '7炸 MCM 不要乱赌，多选题以保守和控时为主。',
    },
    eight: {
      en: 'For Band 8 MCM is still low-yield — avoid random multi-select and burning time.',
      zh: '8炸 MCM 仍然低收益，避免多选乱选和为低收益题耗太久。',
    },
  },
  hcs: {
    seven: {
      en: 'For Band 7 HCS keep basic feel only — do not be fooled by keyword overlap.',
      zh: '7炸 HCS 只保基本手感，避免被关键词骗。',
    },
    eight: {
      en: 'For Band 8 HCS pick the summary that covers the whole — do not treat an example as the main idea.',
      zh: '8炸 HCS 选覆盖整体的 summary，不把例子当主旨。',
    },
  },
  smw: {
    seven: {
      en: 'For Band 7 SMW grab main idea and closing logic — do not let low-yield items wreck your mood.',
      zh: '7炸 SMW 抓主旨和结尾逻辑即可，别让低收益题影响心态。',
    },
    eight: {
      en: 'For Band 8 SMW grab the closing logic — low-effort maintenance only.',
      zh: '8炸 SMW 抓结尾逻辑，低投入维护。',
    },
  },
  asq: {
    seven: {
      en: 'For Band 7 ASQ stay short, accurate, fast — no rambling.',
      zh: '7炸 ASQ 答案短、准、快，不多说废话。',
    },
    eight: {
      en: 'For Band 8 ASQ is low-yield maintenance — a short answer is enough.',
      zh: '8炸 ASQ 是低收益维护题，短答即可。',
    },
  },
} as const;

export const targetProfiles: Record<CommandTarget, TargetProfile> = {
  seven: {
    id: 'seven',
    label: { en: 'PTE 65+', zh: '7炸' },
    scores: [
      { skill: 'L', value: 58 },
      { skill: 'R', value: 59 },
      { skill: 'W', value: 69 },
      { skill: 'S', value: 76 },
    ],
    route: ['wfd', 'rs', 'essay', 'sst', 'rw-fib', 'r-fib', 'ra', 'di', 'rl', 'swt', 'hiw', 'rp', 'mcs', 'mcm', 'asq', 'smw', 'hcs', 'lfb'],
    support: [],
  },
  eight: {
    id: 'eight',
    label: { en: 'PTE 79+', zh: '8炸' },
    scores: [
      { skill: 'L', value: 69 },
      { skill: 'R', value: 70 },
      { skill: 'W', value: 85 },
      { skill: 'S', value: 88 },
    ],
    route: ['wfd', 'rs', 'essay', 'di', 'rl', 'sgd', 'swt', 'sst', 'rw-fib', 'r-fib', 'ra', 'hiw', 'lfb', 'rp', 'rts', 'mcs', 'mcm', 'hcs', 'smw', 'asq'],
    support: [],
  },
};

export type LegacyPriority = 'high' | 'medium' | 'low';

export function legacyPriorityForTarget(moduleId: string, target: CommandTarget): LegacyPriority {
  const node = commandNodes.find((n) => n.id === moduleId);
  if (!node) return 'low';
  const tier = node.priority[target];
  if (tier === 'focus' || tier === 'active') return 'high';
  if (tier === 'support') return 'medium';
  return 'low';
}

export const commandNodes: CommandNode[] = [
  {
    id: 'wfd',
    label: 'WFD',
    skills: ['listening', 'writing'],
    priority: { seven: 'focus', eight: 'focus' },
    dailyVolume: dailyVolume.wfd,
    rationale: rationale.wfd,
    checklist: { seven: checklist.seven.wfd, eight: checklist.eight.wfd },
    failurePoints: { seven: mistakes.seven.wfd, eight: mistakes.eight.wfd },
  },
  {
    id: 'rs',
    label: 'RS',
    skills: ['speaking', 'listening'],
    priority: { seven: 'focus', eight: 'focus' },
    dailyVolume: dailyVolume.rs,
    rationale: rationale.rs,
    checklist: { seven: checklist.seven.rs, eight: checklist.eight.rs },
    failurePoints: { seven: mistakes.seven.rs, eight: mistakes.eight.rs },
  },
  {
    id: 'essay',
    label: 'WE',
    skills: ['writing'],
    priority: { seven: 'focus', eight: 'focus' },
    dailyVolume: dailyVolume.essay,
    rationale: rationale.essay,
    checklist: { seven: checklist.seven.essay, eight: checklist.eight.essay },
    failurePoints: { seven: mistakes.seven.essay, eight: mistakes.eight.essay },
  },
  {
    id: 'sst',
    label: 'SST',
    skills: ['listening', 'writing'],
    priority: { seven: 'focus', eight: 'active' },
    dailyVolume: dailyVolume.sst,
    rationale: rationale.sst,
    checklist: { seven: checklist.seven.sst, eight: checklist.eight.sst },
    failurePoints: { seven: mistakes.seven.sst, eight: mistakes.eight.sst },
  },
  {
    id: 'rw-fib',
    label: 'FIB-RW',
    skills: ['reading', 'writing'],
    priority: { seven: 'focus', eight: 'active' },
    dailyVolume: dailyVolume.fibRw,
    rationale: rationale.rwFib,
    checklist: { seven: checklist.seven.fib, eight: checklist.eight.fib },
    failurePoints: { seven: mistakes.seven.fib, eight: mistakes.eight.fib },
  },
  {
    id: 'r-fib',
    label: 'FIB-R',
    skills: ['reading'],
    priority: { seven: 'active', eight: 'active' },
    dailyVolume: dailyVolume.fibR,
    rationale: rationale.rFib,
    checklist: { seven: checklist.seven.fib, eight: checklist.eight.fib },
    failurePoints: { seven: mistakes.seven.fib, eight: mistakes.eight.fib },
  },
  {
    id: 'ra',
    label: 'RA',
    skills: ['speaking', 'reading'],
    priority: { seven: 'active', eight: 'active' },
    dailyVolume: dailyVolume.ra,
    rationale: rationale.ra,
    checklist: { seven: checklist.seven.ra, eight: checklist.eight.ra },
    failurePoints: { seven: mistakes.seven.ra, eight: mistakes.eight.ra },
  },
  {
    id: 'di',
    label: 'DI',
    skills: ['speaking'],
    priority: { seven: 'active', eight: 'focus' },
    dailyVolume: dailyVolume.di,
    rationale: rationale.di,
    checklist: { seven: checklist.seven.di, eight: checklist.eight.di },
    failurePoints: { seven: mistakes.seven.di, eight: mistakes.eight.di },
  },
  {
    id: 'rl',
    label: 'RL',
    skills: ['speaking', 'listening'],
    priority: { seven: 'active', eight: 'focus' },
    dailyVolume: dailyVolume.rl,
    rationale: rationale.rl,
    checklist: { seven: checklist.seven.rl, eight: checklist.eight.rlSgd },
    failurePoints: { seven: mistakes.seven.rl, eight: mistakes.eight.rlSgd },
  },
  {
    id: 'sgd',
    label: 'SGD',
    skills: ['speaking', 'listening'],
    priority: { seven: 'low', eight: 'focus' },
    dailyVolume: dailyVolume.sgd,
    rationale: rationale.sgd,
    checklist: { seven: checklist.seven.rl, eight: checklist.eight.rlSgd },
    failurePoints: { seven: mistakes.seven.rl, eight: mistakes.eight.rlSgd },
  },
  {
    id: 'swt',
    label: 'SWT',
    skills: ['writing', 'reading'],
    priority: { seven: 'active', eight: 'active' },
    dailyVolume: dailyVolume.swt,
    rationale: rationale.swt,
    checklist: { seven: checklist.seven.swt, eight: checklist.eight.swt },
    failurePoints: { seven: mistakes.seven.swt, eight: mistakes.eight.swt },
  },
  {
    id: 'hiw',
    label: 'HIW',
    skills: ['listening', 'reading'],
    priority: { seven: 'support', eight: 'support' },
    dailyVolume: dailyVolume.hiw,
    rationale: rationale.hiw,
    checklist: { seven: checklist.seven.hiw, eight: checklist.eight.hiw },
    failurePoints: { seven: mistakes.seven.hiw, eight: mistakes.eight.hiw },
  },
  {
    id: 'lfb',
    label: 'FIB-L',
    skills: ['listening', 'writing'],
    priority: { seven: 'low', eight: 'support' },
    dailyVolume: dailyVolume.lfb,
    rationale: rationale.lfb,
    checklist: { seven: checklist.seven.lowListening, eight: checklist.eight.lfb },
    failurePoints: { seven: mistakes.seven.lowListening, eight: mistakes.eight.lfb },
  },
  {
    id: 'rp',
    label: 'RO',
    skills: ['reading'],
    priority: { seven: 'support', eight: 'support' },
    dailyVolume: dailyVolume.ro,
    rationale: rationale.ro,
    checklist: { seven: checklist.seven.ro, eight: checklist.eight.ro },
    failurePoints: { seven: mistakes.seven.ro, eight: mistakes.eight.ro },
  },
  {
    id: 'rts',
    label: 'RTS',
    skills: ['speaking', 'listening'],
    priority: { seven: 'low', eight: 'support' },
    dailyVolume: dailyVolume.rts,
    rationale: rationale.rts,
    checklist: { seven: checklist.seven.lowListening, eight: checklist.eight.rts },
    failurePoints: { seven: mistakes.seven.lowListening, eight: mistakes.eight.rts },
  },
  {
    id: 'mcs',
    label: 'MCS',
    skills: ['reading'],
    priority: { seven: 'low', eight: 'low' },
    dailyVolume: dailyVolume.lowChoice,
    rationale: rationale.mcs,
    checklist: { seven: checklist.seven.choice, eight: checklist.eight.lowChoice },
    failurePoints: { seven: mistakes.seven.choice, eight: mistakes.eight.lowChoice },
  },
  {
    id: 'mcm',
    label: 'MCM',
    skills: ['reading'],
    priority: { seven: 'low', eight: 'low' },
    dailyVolume: dailyVolume.mcm,
    rationale: rationale.mcm,
    checklist: { seven: checklist.seven.choice, eight: checklist.eight.lowChoice },
    failurePoints: { seven: mistakes.seven.choice, eight: mistakes.eight.lowChoice },
  },
  {
    id: 'hcs',
    label: 'HCS',
    skills: ['listening'],
    priority: { seven: 'low', eight: 'low' },
    dailyVolume: dailyVolume.hcs,
    rationale: rationale.hcs,
    checklist: { seven: checklist.seven.lowListening, eight: checklist.eight.lowChoice },
    failurePoints: { seven: mistakes.seven.lowListening, eight: mistakes.eight.lowChoice },
  },
  {
    id: 'smw',
    label: 'SMW',
    skills: ['listening'],
    priority: { seven: 'low', eight: 'low' },
    dailyVolume: dailyVolume.smw,
    rationale: rationale.smw,
    checklist: { seven: checklist.seven.lowListening, eight: checklist.eight.lowChoice },
    failurePoints: { seven: mistakes.seven.lowListening, eight: mistakes.eight.lowChoice },
  },
  {
    id: 'asq',
    label: 'ASQ',
    skills: ['speaking', 'listening'],
    priority: { seven: 'low', eight: 'low' },
    dailyVolume: dailyVolume.asq,
    rationale: rationale.asq,
    checklist: { seven: checklist.seven.lowListening, eight: checklist.eight.lowChoice },
    failurePoints: { seven: mistakes.seven.lowListening, eight: mistakes.eight.lowChoice },
  },
];
