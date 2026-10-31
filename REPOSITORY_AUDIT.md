# مراجعة GitHub — المرحلة الثانية

## النطاق والمرجع

- المستودع: `mmashharawi2021-cell/myprofile-`.
- `main` عند بداية المرحلة الثانية: [`4544aaef15585a2ea9759bd102f02c2d3069f4ff`](https://github.com/mmashharawi2021-cell/myprofile-/commit/4544aaef15585a2ea9759bd102f02c2d3069f4ff) (دمج المرحلة الأولى، PR #15).
- هذه المراجعة **لا تحذف فروع Git أو ملفات الواجهة القديمة** ولا تغيّر التصميم أو CMS. الهدف تنظيم العمل وتوثيق القرارات.

## Pull Request #3

[PR #3 — Add approved social accounts to contact and footer, update WhatsApp](https://github.com/mmashharawi2021-cell/myprofile-/pull/3) مفتوح، وفرعه `feature/social-profiles-20261031` متباعد عن `main`؛ لذلك لا ينبغي دمجه مباشرة.

**موجود بالفعل في `main`:**
- روابط LinkedIn وFacebook وInstagram وTikTok وGitHub وWhatsApp ظاهرة في واجهة التواصل، وتظهر الشبكات الاجتماعية في التذييل.
- رقم واتساب في `app/src/content/default.json` هو `972599876261`.
- اختبارات المتصفح للتحقق من روابط التواصل ورقم واتساب موجودة في `scripts/qa-browser.mjs`.
- القيم الصحيحة لرقم واتساب موجودة أيضًا في `app/src/business-funnel.ts` و`app/src/site-extras.ts`، وهما من الملفات القديمة المرشحة للفحص في مرحلة التنظيف.

**الجزء المفيد المتبقي من PR #3:** كان يضيف الحسابات الأربعة إلى `Person.sameAs` في `app/index.html` ويتحقق منها في اختبار SEO. نُقلت هاتان الإضافتان فقط إلى فرع المرحلة الثانية، دون استبدال JSX الحالي بمكوّن `SocialLinks` قديم أو التراجع عن تحسينات QA والتصميم.

**الإجراء المقترح:** بعد نجاح QA ودمج PR المرحلة الثانية، يُغلق PR #3 باعتباره مستبدلًا مع تعليق يربطه بالبديل. لا يُحذف فرعه تلقائيًا قبل مراجعة الحاجة للاحتفاظ به.

## حالة الفروع القديمة

أظهر فحص الفروع في بداية المرحلة **21 فرعًا**، بما فيها `main`. الفروع التالية مرتبطة بطلبات سحب مدمجة بالفعل، لكنها قد تكون ذات قيمة للمراجعة أو الرجوع للتصميمات السابقة:

- `qa/contact-accessibility-20261031` — PR #1
- `feature/social-links-20261031` — PR #2
- `feature/satellite-loader-v4-20261031` — PR #4
- `feature/smooth-m-remove-orbits-20261031` — PR #5
- `feature/smooth-v4-refinement-20261031` — PR #6
- `feature/laser-glitch-v4-20261031` — PR #7
- `feature/laser-glitch-video-fixes-20261031` — PR #8
- `feature/laser-qa-isolated-install-20261031` — PR #9
- `feature/digital-glitch-intro-video-20261031` — PR #10
- `feature/faithful-video-reference-intro-20261031` — PR #11
- `feature/approved-r13-traced-loader-6s-flight-20261031` — PR #12
- `feature/signature-header-20261031` — PR #13
- `fix/hide-cms-on-pages` — PR #14
- `chore/phase1-qa-baseline` — PR #15

الفروع الإضافية التالية لم تُثبت هذه المراجعة ارتباطها بدمج محدد، وتحتاج تدقيقًا منفصلًا قبل أي قرار بالحذف: `feature/approved-logo-intro`، `feature/brand-identity-rollout`، `feature/project-contributions-gis-evidence`، `feature/seo-social-sharing-20261031`، و`qa/browser-regression-2026-10-31`.

فرع `feature/social-profiles-20261031` مرتبط بطلب السحب المفتوح #3. وفرع `main` هو المرجع المنشور. **لم يُحذف أي فرع.**

## ضوابط المتابعة

1. افحص `git diff` ونتائج QA لأي فرع قبل إغلاق طلب سحبه أو حذفه.
2. نفّذ حذف الملفات القديمة وCSS والتبعيات في **المرحلة الثالثة** فقط، بعد التحقق من عدم استخدامها.
3. طبّق تقصير المقدمة إلى 1–1.5 ثانية وتقليل `FloatingWords` على الهاتف في **المرحلة الرابعة** فقط، مع تعديل اختبارات التوقيت.
4. تأكد من تفعيل قاعدة حماية `main` لفحص `qa` من إعدادات GitHub؛ النجاح في CI لا يثبت أن قاعدة الحماية مفروضة.
