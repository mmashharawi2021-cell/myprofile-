# سجل تنظيف الملفات — المرحلة الثالثة

## مرجع المرحلة

- بداية الفرع: [`9a6c47a091ab3b4c088f04df4eee30322a5667d0`](https://github.com/mmashharawi2021-cell/myprofile-/commit/9a6c47a091ab3b4c088f04df4eee30322a5667d0) بعد دمج PR #16.
- نطاق التغيير: إزالة ملفات الواجهة القديمة غير الداخلة في بنية Vite الحالية، وتنظيف الاعتماديات وناتج TypeScript المتتبع في Git.
- لم تتغير ملفات `app/src/main.tsx` و`app/src/App.tsx` و`app/src/ReferenceIntro.tsx` أو محتوى `app/src/content/default.json`.

## الملفات المرشحة للحذف والمُزالة من فرع المراجعة

- صفحات جذر المستودع القديمة: `index.html`، `projects-showcase.html`، `profile-photo.svg`. تطبيق Vite يستخدم `app/index.html`؛ لا تُقدَّم هذه الملفات عند نشر `docs/`.
- مكونات مقدمة قديمة: `app/src/BrandIntro.tsx`، `app/src/DigitalGlitchIntro.tsx`. تُستخدم المقدمة الحالية `ReferenceIntro.tsx`، لا هذه النسخ.
- ملفات TypeScript غير المتصلة بنقطة الدخول الحالية: `business-funnel.ts`، `site-extras.ts`، `hero-rotator.ts`، `profile-photo.ts`، `data.ts` داخل `app/src/`.
- CSS القديم المعزول: `whatsapp.css`، `marketing.css`، `fixes.css`، `light-mode-fix.css`، `fix-images.css`، `business-funnel.css`، `site-extras.css`، `hero-rotator.css`، `profile-photo.css` داخل `app/src/`.
- ناتج البناء `tsconfig.tsbuildinfo`؛ أضيف `*.tsbuildinfo` إلى `.gitignore`.

## الاعتماديات

- نقل `vite` و`@vitejs/plugin-react` من `dependencies` إلى `devDependencies`، مع مزامنة ملف القفل.
- إزالة `framer-motion`، ومعه الحزم المستقلة `motion-dom` و`motion-utils` و`tslib` الموجودة فقط بسببه في ملف القفل.
- يجب أن يثبت تشغيل `npm ci` و`npm run build` على CI عدم وجود أي اعتماد متبقٍ عليها؛ وإلا تُصحّح هذه الإزالة قبل الدمج.

## عناصر محفوظة عمدًا

- `app/src/ReferenceIntro.tsx`، و`app/src/traced-r13-m.svg`، و`app/src/brandAsset.ts`، وملفات CSS المستوردة من `app/src/main.tsx`.
- `app/src/FloatingWords.tsx`؛ التعديل على كثافتها على الهاتف وتقصير مدة المقدمة مخصص للمرحلة الرابعة.
- `app/public/` بالكامل، بما فيه ملفات الصور والهوية وملف Google Search Console.
- مجلد `assets/` القديم في جذر المستودع؛ لم يُحذف في هذه الدفعة حتى يتم تدقيق الروابط الخارجية واستخداماته بقدر كافٍ.
- `server/` و`Dockerfile` و`shared/` وملفات CMS؛ لا تعديل على صلاحيات التحرير أو بيانات SQLite.

## التحقق المطلوب قبل الدمج

1. نجاح `npm ci` و`npm run build` على Node 24.
2. نجاح اختبارات SEO وCMS وPlaywright بالكامل، بما فيها الفحص على الهاتف والكمبيوتر.
3. عدم وجود صور مفقودة أو أخطاء JavaScript أو تغيّرات بصرية غير مقصودة.
4. الاحتفاظ بفرع PR دون دمج إلى أن تظهر نتائج CI وتُراجع.

**ملاحظة:** الحذف يتم في فرع منفصل فقط؛ كل الملفات متاحة في تاريخ Git، ويمكن التراجع عن PR دون تغيير النسخة المنشورة.
