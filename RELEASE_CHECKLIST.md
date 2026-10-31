# المرحلة السادسة — فحص الإصدار النهائي والإطلاق

## الإصدار الذي تخضع له الاختبارات

- مرجع `main` عند بداية المرحلة: [`a4819c46b7eef381d6dcc5fbd4c502457ea0add2`](https://github.com/mmashharawi2021-cell/myprofile-/commit/a4819c46b7eef381d6dcc5fbd4c502457ea0add2) بعد دمج PR #19.
- الإطلاق عبر `.github/workflows/deploy.yml` من `main` إلى [GitHub Pages](https://mmashharawi2021-cell.github.io/myprofile-/).
- هذه المرحلة **لا تعدّل الواجهة أو المحتوى أو الصور أو CMS**. إنها بوابة تحقق وإرشادات نشر وتراجع.

## ما يجري اختباره آليًا

| النطاق | أداة الاختبار | ما يثبت |
| --- | --- | --- |
| Vite + TypeScript | `npm run build` | اكتمال البناء |
| الملفات الثابتة | `node --test scripts/release-static.test.mjs` | الروابط الداخلية لملفات HTML، جميع صور المشاريع الافتراضية، Sitemap وملف Google وPNG المشاركة |
| SEO | `node --test scripts/seo.test.mjs` | عنوان الصفحة وCanonical وOpen Graph وJSON-LD وSitemap |
| CMS server | `node --test server/editor.test.mjs` | المصادقة والحفظ والتاريخ وحماية الجلسات وSQLite |
| تجربة المستخدم | `node scripts/qa-browser.mjs` | مقاسات الأجهزة والمشاريع والصور والمقدمة والتصفح والوضع الداكن وCMS المعطل على Pages |
| صورة Docker الفعلية | `node scripts/docker-smoke.mjs` | بناء الصورة ثم تشغيلها بقيود read-only وبيانات اعتماد اختبار مؤقتة والتحقق من Health وJS وLogin وSave وLogout |

ينفذ GitHub Actions الوظائف `qa` و`docker-cms` بشكل مستقل. استخدم **نتيجتي الوظيفتين** كشرط للموافقة على PR؛ فنجاح واحدة وحدها غير كافٍ.

اختبار Docker يولد كلمة مرور وملفًا مؤقتين، ولا يستخدم `.secrets/` الحقيقي أو بيانات تشغيل CMS. ويُحذف حاويته وصورته وملفه بعد انتهاء الاختبار.

## قائمة مراجعة الإطلاق

- [ ] نجاح جميع الفحوص على PR المرحلة السادسة دون تجاوز أخطاء.
- [ ] مراجعة Artifact `portfolio-qa` بما فيه لقطات 320 و390 و768 و1280 بكسل، و`performance-baseline.json`.
- [ ] نجاح Artifact `portfolio-docker-smoke` وحفظ سجل الحاوية.
- [ ] التأكد بصريًا من سلامة الشعارات والصور وشريط التنقل وأزرار التواصل وحالة RTL والوضعين الفاتح والداكن.
- [ ] التأكد من أن المقدمة تقارب 1–1.5 ثانية على الأجهزة العادية، وتُتخطى في وضع تقليل الحركة.
- [ ] مراجعة قواعد حماية `main`: Require PR وRequire checks `qa` و`docker-cms`.
- [ ] بعد اعتماد PR ودمجه، التأكد من نجاح **Deploy portfolio to GitHub Pages** على commit الدمج.
- [ ] فتح الموقع المنشور وفحص `/myprofile-/` و`/myprofile-/sitemap.xml` و`/myprofile-/google99f895784bf51371.html` و`/myprofile-/og-preview.png`.
- [ ] فحص Network: عدم وجود طلبات `/myprofile-/api/` أو زر `.editor-launch` في Pages.
- [ ] تجربة التصفية والتنقل إلى المشاريع، وعدم وجود صورة مفقودة أو Scroll أفقي على الهاتف.
- [ ] تشغيل PageSpeed Insights للهاتف والكمبيوتر بعد النشر، وتسجيل قيم Performance وLCP وCLS وINP إن توفرت. **لا توجد نتيجة Lighthouse مؤكدة في هذه الوثيقة**.

## حدود قياس الأداء

يقيس `performance-baseline.json` تجربة Chromium المحلية داخل GitHub Actions، ولا يعادل تشغيل Lighthouse على GitHub Pages ولا بيانات Core Web Vitals الحقيقية. لا يجوز وصف أي رقم بأنه مؤشر أداء الإنتاج إلا إذا قيس على الموقع المنشور ونُسب إلى مصدره ووقته.

## التراجع الآمن عند ظهور خلل

1. حدد SHA الخاص بالدمج الذي سبب المشكلة في سجل `main`.
2. أنشئ فرع إصلاح من `main`، ثم نفّذ `git revert <merge-commit-sha>` (قد يتطلب Revert للـ merge تحديد parent بحسب طريقة الدمج).
3. افتح PR للتراجع، وشغّل `qa` و`docker-cms` ثم ادمجه بعد المراجعة.
4. تحقّق من نشر النسخة الجديدة عبر GitHub Actions، ثم أعد فحص الموقع. لا تستخدم `git reset --hard` على `main` المنشور ولا تحذف بيانات Docker/SQLite في عملية التراجع.

## الأوامر المحلية

```bash
npm ci
npm run build
node --test scripts/release-static.test.mjs
node --test scripts/seo.test.mjs
node --test server/editor.test.mjs
node scripts/qa-browser.mjs
node scripts/docker-smoke.mjs
```

يتطلب الاختبار الأخير Docker وتشغيل Docker Engine، بينما يحتاج اختبار المتصفح Playwright وChromium كما توفرهما بيئة CI. يعمل `scripts/docker-smoke.mjs` على منفذ محلي اختباري 18080، ولا يغيّر البيانات الدائمة لـ CMS.
