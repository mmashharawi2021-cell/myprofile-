# ضبط الجودة — المرحلة الأولى

## المرجع قبل الإصلاح (Baseline)

- المستودع: `mmashharawi2021-cell/myprofile-`
- الفرع: `main`
- Commit المرجعي قبل هذه المرحلة: [`d59e8a60a342aa3df24c27115d7146fa5172a58f`](https://github.com/mmashharawi2021-cell/myprofile-/commit/d59e8a60a342aa3df24c27115d7146fa5172a58f)
- يتيح الـ commit العودة إلى الملفات الأصلية ومقارنتها بالتغييرات. لا تغيّر هذه المرحلة واجهة React أو محتوى الموقع أو نظام CMS.

## بيئة البناء

- إصدار Node.js المعتمد: **24** من `.nvmrc`، وبنفس الإصدار الرئيسي المستخدم في `Dockerfile`.
- تثبيت الاعتماديات يتم باستخدام `npm ci` في QA ونشر GitHub Pages.
- يبقى بناء GitHub Pages ثابتًا دون CMS، ويستمر Docker في بناء واجهة CMS بإعداد `VITE_CMS=true`.

## الاختبارات والتوثيق

يُشغّل Workflow `Portfolio quality assurance` تلقائيًا لكل Pull Request يستهدف `main`، بالإضافة إلى قواعد التشغيل السابقة على `push` والتشغيل اليدوي. يتضمن:

1. `npm run build` (فحص TypeScript وبناء Vite).
2. `node --test scripts/seo.test.mjs`.
3. `node --test server/editor.test.mjs`.
4. `node scripts/qa-browser.mjs` (Playwright على بناء GitHub Pages الثابت).

يحفظ كل تشغيل في Artifact باسم `portfolio-qa`، عندما تتوفر الملفات:
- `run-info.txt` لتسجيل SHA ومرجع Git ونوع الحدث وإصدار Node.
- `build.log` و`seo-tests.log` و`cms-tests.log` و`browser-tests.log` لنتائج الاختبارات.
- `results.json` وصور `portfolio-*.png` ولقطات الهاتف والكمبيوتر من اختبارات المتصفح.

الـ Artifacts محفوظة لمدة 30 يومًا وفق سياسة المستودع؛ للمقارنة الدائمة استخدم SHA المرجعي، ويمكن حفظ نسخة خارج GitHub عند الحاجة. لا تُعتبر الاختبارات ناجحة حتى يظهر تشغيل ناجح فعليًا.

## شرط منع دمج التغييرات الفاشلة

**هذا الشرط يحتاج إعدادًا على مستوى GitHub Repository، ولا يفرضه ملف Workflow بمفرده.**

بعد التأكد من ظهور أول تشغيل QA على PR، انتقل إلى **Settings → Rules → Rulesets** (أو **Branches → Branch protection**) وأنشئ قاعدة لفرع `main`:
- Require a pull request before merging.
- Require status checks to pass before merging.
- اختر الفحص `qa` من Workflow `Portfolio quality assurance` (تأكد من الاسم المعروض في Checks).
- امنع تجاوز القاعدة للحسابات غير المصرح لها.

لا تدمج أي PR ما لم تجتز فحوص البناء وSEO وCMS والمتصفح. لا تُغيّر هذه المرحلة إعدادات حماية المستودع مباشرة.

## الفحص المحلي

```sh
npm ci
npm run build
node --test scripts/seo.test.mjs
node --test server/editor.test.mjs
node scripts/qa-browser.mjs
```

اختبارات المتصفح تتطلب Playwright وChromium كما يُثبّتهما GitHub Actions. واختبار Docker النهائي يبقى خطوة تحقق منفصلة.
