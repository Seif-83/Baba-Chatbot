export interface MaterialItem {
  id: string;
  title: string;
  grade: 'prep1' | 'prep2' | 'prep3';
  type: 'exam' | 'booklet';
  branch: 'all' | 'algebra' | 'geometry';
  fileName: string;
  fileUrl: string;
  description: string;
  fileSize?: string;
  year?: string;
  extractedText?: string;
}

export const STUDY_MATERIALS: MaterialItem[] = [
  {
    id: 'exam-prep3-shamel',
    title: 'امتحان شامل رياضيات - الصف الثالث الإعدادي',
    grade: 'prep3',
    type: 'exam',
    branch: 'all',
    fileName: 'شامل ٣ع.pdf',
    fileUrl: '/امتحانات/3rd prep/شامل ٣ع.pdf',
    description: 'امتحان مجمع لمستر عمرو محسن يشمل أسئلة الجبر والإحصاء والهندسة وحساب المثلثات مع مسائل متوقعة.',
    fileSize: '140 KB',
    year: '2024 / 2025',
    extractedText: `EASY MATHS WITH MR AMR MOHSEN
Comprehensive Mathematics Exam Prep 3 (Third Preparatory Grade)
First Question:
[A] Choose the correct answer from those given:
1. The equation of the axis of symmetry of the quadratic function f where f(x) = (x − 3)^2 + 1 is ............
(a) x = 1  (b) y = 1  (c) x = 3  (d) y = 3
2. In the opposite figure: If sin θ = 3/5, where m(∠B) = 90° and BC = 6 cm, then the length of AB equals ............ cm.
(a) 4  (b) 8  (c) 12  (d) 15
3. The image of the point (−3, 5) under a dilation (enlargement) centered at the origin with scale factor 3 is ............
(a) (−1, 2)  (b) (−9, 6)  (c) (−3, 2)  (d) (−9, 15)
[B] Find in the standard form the equation of the straight line passing through the two points (0, 1) and (−4, 3).

Second Question:
[A] Choose the correct answer from those given:
1. The set of real zeros of the function f where f(x) = (x^2 − 4) / (x^2 − 5x + 6) is ............
(a) {2, 3}  (b) {−2, 2}  (c) {−2}  (d) {3}
2. The standard form of the equation of the straight line whose inclination angle measures 45° and whose Y-intercept equals 3 is ............
(a) X − Y = −3  (b) X + Y = −3  (c) X − Y = 3  (d) X + Y = 3
3. If 2 sin θ = tan θ where θ is the measure of an acute angle, then the value of θ is ............
(a) 60°  (b) 45°  (c) 30°  (d) 15°
[B] Without using a calculator, prove that: tan 60° = (2 tan 30°) / (1 − tan^2 30°)

Third Question:
[A] Choose the correct answer from those given:
1. In the opposite figure: If m(∠ADE) = m(∠B), AD = 3 cm, DC = X cm, AE = 2 cm, and EB = 4 cm, then the value of X is ............
(a) 1  (b) 2  (c) 3  (d) 4
2. The slope of the straight line perpendicular to the straight line whose equation is x = 3y + 1 equals ............
(a) −3  (b) 3  (c) −1/3  (d) 1/3
[B] In a right-angled triangle at B: If m(∠C) = 41° and hypotenuse AC = 10 cm, find the value of X (length of AB opposite to 41°) rounded to the nearest tenth.

Fourth Question:
[A] In the opposite figure: If D is the midpoint of AB, AC = 8 cm, BC = 5 cm, DE = 4 cm, AE = 2.5 cm, prove that:
1. △ABC ∼ △DAE
2. AE // BC
[B] Simplify to the simplest form f(x), stating the domain of f where:
f(x) = (x^2 + x)/(x^2 − 1) − (5 − x)/(x^2 − 6x + 5)

Fifth Question:
[A] Graph the quadratic function f where f(x) = (x − 2)^2 + 3, showing on the graph its axis of symmetry, and find the maximum or minimum value of the function f.`,
  },
];

export const GRADE_LABELS: Record<'prep1' | 'prep2' | 'prep3', string> = {
  prep1: 'أولى إعدادي',
  prep2: 'تانية إعدادي',
  prep3: 'تالتة إعدادي',
};
