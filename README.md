# Mohanad Al-Mashharawi Portfolio

موقع شخصي عربي لعرض مشاريع نظم المعلومات الجغرافية (GIS) وتطوير أنظمة الويب، مبني باستخدام React 18 وTypeScript وVite 5، مع تصميم RTL ووضعين داكن وفاتح.

## مكوّنات المشروع

- **الموقع العام:** تطبيق React يبدأ من `app/index.html` و`app/src/main.tsx`، والأقسام والتفاعلات في `app/src/App.tsx`.
- **المحتوى الافتراضي:** `app/src/content/default.json`، ويحمّله `app/src/content/SiteContent.tsx`؛ ملفات `app/src/data.ts` ليست مصدر البيانات الفعلي.
- **التصميم:** `app/src/styles.css` وملفات CSS التي يستوردها `app/src/main.tsx`.
- **المشاريع والصور:** `app/public/assets/projects/`، والصورة الشخصية المستخدمة في المحتوى `app/public/assets/profile-photo.webp`.
- **لوحة التحرير الاختيارية (CMS):** خادم Node.js في `server/` مع SQLite وحاوية Docker، وواجهة التحرير في `app/src/editor/`.

تتضمن الواجهة تصفية المشاريع، نافذة تفاصيل قابلة للإغلاق بلوحة المفاتيح، خدمات ومهارات، روابط تواصل، ونموذجًا يفتح رسالة واتساب لمراجعتها قبل إرسالها.

## التشغيل والتطوير

استخدم Node.js 24 وفق `.nvmrc`، ثم:

```sh
npm ci
npm run dev
```

افتح: http://localhost:5173/myprofile-/

على Windows، قد تحتاج إلى `npm.cmd` بدل `npm` في PowerShell. عند تشغيل Vite، تمر طلبات `/myprofile-/api` و`/myprofile-/media` إلى خادم Docker المحلي على المنفذ 8080؛ تشغيل الموقع للعرض لا يتطلب الخادم، لكن التحرير والحفظ يتطلبانه.

## السيرة الذاتية التفاعلية

تفتح البطاقة الصغيرة ذات الصورة الشخصية أسفل معاينة المشروع الرئيسية صفحة CV مستقلة على `/myprofile-/cv/`.
الصفحة عربية ومتجاوبة، وتعرض الخبرات المهنية والتقنية والمشاريع والمهارات والمؤهلات مع دخول متدرج وعناصر تظهر عند التمرير. تحترم `prefers-reduced-motion` وتوفر زر طباعة.

- بيانات السيرة الذاتية: `app/src/cv/data.json` (منفصلة عن CMS الحالي؛ تُراجع قبل تغيير أي خبرة).
- واجهة CV: `app/src/cv/main.tsx` و`app/src/cv/cv.css` و`app/cv/index.html`.
- `npm run build` يُنشئ تلقائيًا ملف PDF **باللغة الإنجليزية** من بيانات السيرة نفسها في `docs/cv/Mohanad-Almashharawi-CV.pdf` باستخدام `scripts/build-cv-pdf.mjs`، دون مكتبات إضافية.
- تعمل الصفحة مباشرة على GitHub Pages وDocker. تخدم Docker الملفات `/myprofile-/cv/` و`/myprofile-/cv/Mohanad-Almashharawi-CV.pdf` دون API إضافي.
- يستطيع محرك البحث الوصول إلى صفحة CV عبر Sitemap والرابط `canonical` المستقل.
- اختبارات `scripts/qa-browser.mjs` و`scripts/seo.test.mjs` و`scripts/release-static.test.mjs` و`scripts/docker-smoke.mjs` تشمل المسار الجديد.

**ملاحظة:** تعديل السيرة الذاتية التفاعلية يتم حاليًا في ملف `data.json` ويحتاج بناءً ونشرًا جديدين؛ لا تعرض لوحة CMS القديمة تحريرها، حتى لا نضيف صلاحيات أو مخطط قاعدة بيانات جديدًا بلا مراجعة.

## البناء والنشر العام

```sh
npm run build
```

يفحص الأمر TypeScript ويبني الموقع داخل `docs/`، وفق `vite.config.ts` (الجذر `app` والمسار الأساسي `/myprofile-/`). مجلد `docs/` ناتج بناء ومُستبعد من Git؛ **لا يلزم عمل commit له**. يبني `.github/workflows/deploy.yml` الموقع تلقائيًا من `main` وينشر الناتج على GitHub Pages:

https://mmashharawi2021-cell.github.io/myprofile-/

النسخة المنشورة على GitHub Pages ثابتة، ولا تُشغّل خادم CMS أو SQLite أو تستدعي API الخاص بالتحرير. في بناء Docker، يفعّل `VITE_CMS=true` الاتصال بالمحرر. راجع [دليل المحرر](EDITOR.md) للتشغيل، والحفظ، ونشر تعديلات CMS إلى الموقع الثابت باستخدام `npm run publish-site`.

ملفات HTML القديمة الموجودة في جذر المستودع ليست نقطة دخول تطبيق Vite الحالي. تُراجع ضمن مرحلة تنظيف منفصلة، ولا تُحذف قبل التحقق من مراجعها.

## الجودة وإدارة التغييرات

```sh
npm ci
npm run build
node --test scripts/seo.test.mjs
node --test server/editor.test.mjs
node scripts/qa-browser.mjs
```

تحتاج اختبارات المتصفح إلى Playwright وChromium، ويُثبّتهما CI تلقائيًا. راجع [QUALITY.md](QUALITY.md) لتشغيل QA عند فتح طلبات السحب وحفظ نتائج الاختبارات ولقطات الشاشة، و[REPOSITORY_AUDIT.md](REPOSITORY_AUDIT.md) لحالة الفروع القديمة وPR #3.

لا تُدمج طلبات السحب قبل نجاح فحوص الجودة ومراجعة التغييرات. تتطلب حماية `main` الإلزامية ضبط قواعد GitHub Repository من الإعدادات.
