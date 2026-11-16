import type { MathBranch, PrepGrade } from '../types/chat';

export interface QuickPrompt {
  id: string;
  grade: PrepGrade;
  branch: Exclude<MathBranch, 'all'>;
  titleAr: string;
  titleEn: string;
  prompt: string;
}

export interface FormulaCard {
  id: string;
  grade: PrepGrade;
  branch: Exclude<MathBranch, 'all'>;
  title: string;
  latex: string;
  note: string;
  askPrompt: string;
}

export const GRADE_OPTIONS: { id: PrepGrade; labelAr: string; labelEn: string }[] = [
  { id: 'prep1', labelAr: 'أولى إعدادي', labelEn: 'Prep 1' },
  { id: 'prep2', labelAr: 'تانية إعدادي', labelEn: 'Prep 2' },
  { id: 'prep3', labelAr: 'تالتة إعدادي', labelEn: 'Prep 3' },
];

export const BRANCH_OPTIONS: { id: MathBranch; labelAr: string; labelEn: string }[] = [
  { id: 'all', labelAr: 'الكل', labelEn: 'All' },
  { id: 'algebra', labelAr: 'جبر وإحصاء', labelEn: 'Algebra' },
  { id: 'geometry', labelAr: 'هندسة ومثلثات', labelEn: 'Geometry' },
];

export const QUICK_PROMPTS: QuickPrompt[] = [
  // Prep 1
  {
    id: 'p1-alg-1',
    grade: 'prep1',
    branch: 'algebra',
    titleAr: 'جمع وطرح الأعداد النسبية',
    titleEn: 'Rational Numbers',
    prompt: 'اشرح لي إزاي أجمع وأطرح الأعداد النسبية، وحل لي المسألة دي: $\\frac{3}{4} + \\left(-\\frac{5}{6}\\right)$',
  },
  {
    id: 'p1-alg-2',
    grade: 'prep1',
    branch: 'algebra',
    titleAr: 'المعادلات والمتباينات في Q',
    titleEn: 'Equations in Q',
    prompt: 'Find the solution set in $\\mathbb{Q}$ step by step: $3x - 5 = 10$ and explain each step.',
  },
  {
    id: 'p1-geo-1',
    grade: 'prep1',
    branch: 'geometry',
    titleAr: 'حالات تطابق المثلثين',
    titleEn: 'Triangle Congruence',
    prompt: 'لخص لي الـ 4 حالات لتطابق المثلثين (SAS, ASA, SSS, RHS) مع مثال برهان سهل لأولى إعدادي.',
  },
  {
    id: 'p1-geo-2',
    grade: 'prep1',
    branch: 'geometry',
    titleAr: 'التوازي والزوايا المتبادلة والمتناظرة',
    titleEn: 'Parallel Lines & Angles',
    prompt: 'إيه الفرق بين الزوايا المتبادلة والمتناظرة والمتداخلة في حالة التوازي؟ واديني مسألة تطبيقية.',
  },

  // Prep 2
  {
    id: 'p2-alg-1',
    grade: 'prep2',
    branch: 'algebra',
    titleAr: 'تحليل المقدار الثلاثي',
    titleEn: 'Factorization',
    prompt: 'علمني إزاي أحلل المقدار الثلاثي البسيط وغير البسيط، وحل: $x^2 - 7x + 12$ و $2x^2 + 5x - 3$.',
  },
  {
    id: 'p2-alg-2',
    grade: 'prep2',
    branch: 'algebra',
    titleAr: 'الأعداد الحقيقية والفترات',
    titleEn: 'Real Numbers & Intervals',
    prompt: 'If $X = [-2, 4)$ and $Y = [1, 6]$, find $X \\cup Y$, $X \\cap Y$, and $X - Y$ with explanation.',
  },
  {
    id: 'p2-geo-1',
    grade: 'prep2',
    branch: 'geometry',
    titleAr: 'متوسطات المثلث والمثلث المتساوي الساقين',
    titleEn: 'Medians & Isosceles Triangle',
    prompt: 'اشرح نظرية نقطة تقاطع متوسطات المثلث (بنسبة 1 : 2 من جهة القاعدة) مع مسألة برهان كاملة.',
  },
  {
    id: 'p2-geo-2',
    grade: 'prep2',
    branch: 'geometry',
    titleAr: 'نظرية فيثاغورس وعكسها',
    titleEn: 'Pythagoras Theorem',
    prompt: 'In $\\triangle ABC$, $AB = 6\\text{ cm}$, $BC = 8\\text{ cm}$, $AC = 10\\text{ cm}$. Prove that $\\angle B = 90^\\circ$ and find the area.',
  },

  // Prep 3
  {
    id: 'p3-alg-1',
    grade: 'prep3',
    branch: 'algebra',
    titleAr: 'القانون العام لحل المعادلة التربيعية',
    titleEn: 'Quadratic Formula',
    prompt: 'Solve using the General Formula (القانون العام) to the nearest 2 decimal places: $2x^2 - 5x + 1 = 0$.',
  },
  {
    id: 'p3-alg-2',
    grade: 'prep3',
    branch: 'algebra',
    titleAr: 'النسبة والتناسب والتغير الطردي والعكسي',
    titleEn: 'Variation & Proportion',
    prompt: 'اشرح الفرق بين التغير الطردي ($y \\propto x$) والتغير العكسي ($y \\propto \\frac{1}{x}$) مع مسألة امتحان مهمة.',
  },
  {
    id: 'p3-geo-1',
    grade: 'prep3',
    branch: 'geometry',
    titleAr: 'النسب المثلثية (sin, cos, tan)',
    titleEn: 'Trigonometric Ratios',
    prompt: 'Find the value without a calculator: $\\sin 30^\\circ \\cos 60^\\circ + \\cos^2 45^\\circ - \\tan 45^\\circ$ with full steps.',
  },
  {
    id: 'p3-geo-2',
    grade: 'prep3',
    branch: 'geometry',
    titleAr: 'ميل الخط المستقيم ومعادلته',
    titleEn: 'Slope & Line Equation',
    prompt: 'أوجد معادلة الخط المستقيم المار بالنقطة $(2, -3)$ ويوازي المستقيم $2x - y + 5 = 0$.',
  },
];

export const FORMULA_CARDS: FormulaCard[] = [
  {
    id: 'f-pythagoras',
    grade: 'prep2',
    branch: 'geometry',
    title: 'نظرية فيثاغورس · Pythagoras',
    latex: 'c^2 = a^2 + b^2',
    note: 'في المثلث القائم الزاوية: مربع الوتر يساوي مجموع مربعي ضلعي القائمة.',
    askPrompt: 'اديني مسألة متدرجة على نظرية فيثاغورس وعكسها وحلها معي خطوة بخطوة.',
  },
  {
    id: 'f-quadratic',
    grade: 'prep3',
    branch: 'algebra',
    title: 'القانون العام · Quadratic Formula',
    latex: 'x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}',
    note: 'لحل المعادلة التربيعية $ax^2 + bx + c = 0$ حيث $a \\neq 0$.',
    askPrompt: 'اشرح لي إزاي أستخدم القانون العام وأحدد عدد الحلول من المميز.',
  },
  {
    id: 'f-distance',
    grade: 'prep3',
    branch: 'geometry',
    title: 'البعد بين نقطتين · Distance Formula',
    latex: 'AB = \\sqrt{(x_2 - x_1)^2 + (y_2 - y_1)^2}',
    note: 'حساب طول القطعة المستقيمة الواصلة بين $(x_1, y_1)$ و $(x_2, y_2)$.',
    askPrompt: 'عايز مثال محلول على قانون البعد بين نقطتين لإثبات إن المثلث متساوي الساقين.',
  },
  {
    id: 'f-midpoint',
    grade: 'prep3',
    branch: 'geometry',
    title: 'إحداثيي منتصف قطعة · Midpoint',
    latex: 'M = \\left(\\frac{x_1 + x_2}{2},\\; \\frac{y_1 + y_2}{2}\\right)',
    note: 'إيجاد نقطة المنتصف للقطعة المستقيمة في المستوى الإحداثي.',
    askPrompt: 'اديني مسألة لو عندي نقطة المنتصف وأحد الطرفين وإزاي أجيب الطرف التاني.',
  },
  {
    id: 'f-slope',
    grade: 'prep3',
    branch: 'geometry',
    title: 'ميل الخط المستقيم · Slope',
    latex: 'm = \\frac{y_2 - y_1}{x_2 - x_1} = \\tan \\theta',
    note: 'للمستقيمين المتوازيين $m_1 = m_2$، وللمتعامدين $m_1 \\times m_2 = -1$.',
    askPrompt: 'اشرح لي شرط التوازي وشرط التعامد باستخدام الميل مع مثال.',
  },
  {
    id: 'f-circle',
    grade: 'prep1',
    branch: 'geometry',
    title: 'محيط ومساحة الدائرة · Circle',
    latex: 'C = 2\\pi r \\quad , \\quad A = \\pi r^2',
    note: 'حيث $r$ هو نصف القطر (نق) و $\\pi \\approx \\frac{22}{7}$ أو $3.14$.',
    askPrompt: 'احسب محيط ومساحة دائرة نصف قطرها 7 سم، واديني مسألة عكسية.',
  },
  {
    id: 'f-diff-squares',
    grade: 'prep2',
    branch: 'algebra',
    title: 'الفرق بين مربعين · Difference of Squares',
    latex: 'a^2 - b^2 = (a - b)(a + b)',
    note: 'أحد أهم قوانين التحليل الجبري في تانية وتالتة إعدادي.',
    askPrompt: 'اديني 3 مسائل متنوعة على تحليل الفرق بين مربعين والفرق بين مكعبين.',
  },
  {
    id: 'f-trig',
    grade: 'prep3',
    branch: 'geometry',
    title: 'النسب المثلثية الأساسية · Trig Ratios',
    latex: '\\sin\\theta = \\frac{\\text{Opp}}{\\text{Hyp}},\\; \\cos\\theta = \\frac{\\text{Adj}}{\\text{Hyp}},\\; \\tan\\theta = \\frac{\\text{Opp}}{\\text{Adj}}',
    note: 'الزوايا الخاصة: $30^\\circ, 45^\\circ, 60^\\circ$.',
    askPrompt: 'لخص لي جدول قيم $\\sin, \\cos, \\tan$ للزوايا $30^\\circ, 45^\\circ, 60^\\circ$ بطريقة سهلة للحفظ.',
  },
];

export const MATH_SYMBOLS = [
  { label: 'π', value: 'π' },
  { label: '√', value: '√' },
  { label: '²', value: '²' },
  { label: '³', value: '³' },
  { label: '∠', value: '∠' },
  { label: '△', value: '△' },
  { label: '≅', value: '≅' },
  { label: '∥', value: '∥' },
  { label: '⊥', value: '⊥' },
  { label: '°', value: '°' },
  { label: '÷', value: '÷' },
  { label: '≤', value: '≤' },
  { label: '≥', value: '≥' },
];
