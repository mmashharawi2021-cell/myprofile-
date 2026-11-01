# Mohanad Al-Mashharawi Portfolio

موقع شخصي عربي لعرض مشاريع نظم المعلومات الجغرافية (GIS) وتطوير أنظمة الويب، مبني باستخدام React 18 وTypeScript وVite 5، مع تصميم RTL ووضعين داكن وفاتح.

## مكوّنات المشروع

- **الموقع العام:** تطبيق React يبدأ من `app/index.html` و`app/src/main.tsx`، والأقسام والتفاعلات في `app/src/App.tsx`.
- **المحتوى الافتراضي:** `app/src/content/default.json`، ويحمّله `app/src/content/SiteContent.tsx`؛ ملفات `app/src/data.ts` ليست مصدر البيانات الفعلي.
- **التصميم:** `app/src/styles.css` وملفات CSS التي يستوردها `app/src/main.tsx`.
- **المشاريع والصور:** `app/public/assets/projects/`، والصورة الشخصية المستخدمة في المحتوى `app/public/assets/profile-photo.webp`.

تتضمن الواجهة تصفية المشاريع، نافذة تفاصيل قابلة للإغلاق بلوحة المفاتيح، خدمات ومهارات، روابط تواصل، ونموذجًا يفتح رسالة واتساب لمراجعتها قبل إرسالها.

## التشغيل والتطوير

استخدم Node.js 24 وفق `.nvmrc`، ثم:

```sh
npm ci
npm run dev
```

افتح: http://localhost:5173/myprofile-/

على Windows، قد تحتاج إلى `npm.cmd` بدل `npm` في PowerShell.

## السيرة الذاتية التفاعلية

تفتح البطاقة الصغيرة ذات الصورة الشخصية أسفل معاينة المشروع الرئيسية صفحة CV مستقلة على `/myprofile-/cv/`.
الصفحة عربية ومتجاوبة، وتعرض الخبرات المهنية والتقنية والمشاريع والمهارات والمؤهلات مع دخول متدرج وعناصر تظهر عند التمرير. تحترم `prefers-reduced-motion` وتوفر زر طباعة.

- بيانات السيرة الذاتية: `app/src/cv/data.json` (تُراجع قبل تغيير أي خبرة).
- واجهة CV: `app/src/cv/main.tsx` و`app/src/cv/cv.css` و`app/cv/index.html`.
- زر العربية / English يبدّل جميع أقسام CV ونصوص الواجهة من `data.json`، ويحدّث `lang` و`dir` ويحفظ الاختيار في `portfolio-cv-language`. العربية هي الافتراضية عند غياب اختيار صالح أو تعذّر التخزين. انتقال اللغة يحترم `prefers-reduced-motion`، والطباعة تستخدم اللغة المعروضة؛ ملف PDF المتاح يظل بالإنجليزية كما يوضح زر التنزيل.
- `npm run build` يُنشئ تلقائيًا ملف PDF **باللغة الإنجليزية** من بيانات السيرة نفسها في `docs/cv/Mohanad-Almashharawi-CV.pdf` باستخدام `scripts/build-cv-pdf.mjs`، دون مكتبات إضافية.
- تعمل الصفحة مباشرة على GitHub Pages دون أي API.
- يستطيع محرك البحث الوصول إلى صفحة CV عبر Sitemap والرابط `canonical` المستقل.
- اختبارات `scripts/qa-browser.mjs` و`scripts/seo.test.mjs` و`scripts/release-static.test.mjs` تشمل المسار الجديد.

**ملاحظة:** تعديل محتوى الموقع يتم في `app/src/content/default.json`، والسيرة الذاتية في `app/src/cv/data.json`؛ أي تعديل يُنشر تلقائيًا بعد دمجه في `main`.

## البناء والنشر العام

```sh
npm run build
```

يفحص الأمر TypeScript ويبني الموقع داخل `docs/`، وفق `vite.config.ts` (الجذر `app` والمسار الأساسي `/myprofile-/`). مجلد `docs/` ناتج بناء ومُستبعد من Git؛ **لا يلزم عمل commit له**. يبني `.github/workflows/deploy.yml` الموقع تلقائيًا من `main` وينشر الناتج على GitHub Pages:

https://mmashharawi2021-cell.github.io/myprofile-/

الموقع ثابت بالكامل، ولا يحتوي لوحة تحرير أو خادمًا أو قاعدة بيانات.

ملفات HTML القديمة الموجودة في جذر المستودع ليست نقطة دخول تطبيق Vite الحالي. تُراجع ضمن مرحلة تنظيف منفصلة، ولا تُحذف قبل التحقق من مراجعها.

## الجودة وإدارة التغييرات

```sh
npm ci
npm run build
node --test scripts/seo.test.mjs
node scripts/qa-browser.mjs
```

تحتاج اختبارات المتصفح إلى Playwright وChromium، ويُثبّتهما CI تلقائيًا. راجع [QUALITY.md](QUALITY.md) لتشغيل QA عند فتح طلبات السحب وحفظ نتائج الاختبارات ولقطات الشاشة، و[REPOSITORY_AUDIT.md](REPOSITORY_AUDIT.md) لحالة الفروع القديمة وPR #3.

لا تُدمج طلبات السحب قبل نجاح فحوص الجودة ومراجعة التغييرات. تتطلب حماية `main` الإلزامية ضبط قواعد GitHub Repository من الإعدادات.
