import './business-funnel.css';

const phone = '970568876261';
const wa = (text: string) => `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
const businessMessage = wa('مرحبًا مهند، أريد تصورًا مبدئيًا لنظام يساعدني في تنظيم عملي.\n\nنوع النشاط:\nالمشكلة الحالية:\nهل أستخدم Excel أو واتساب حاليًا؟\nالمخرجات المطلوبة:');

const solutions = [
  ['تقارير يومية على واتساب', 'نظام تقارير وأرشفة مع تصدير ومتابعة'],
  ['ملفات Excel كثيرة', 'داشبورد إداري يعرض المؤشرات المهمة'],
  ['متابعة فرق أو تشغيل', 'نظام متابعة يومية بصلاحيات وسجل نشاط'],
  ['مواقع أو فروع أو مناطق', 'خريطة GIS تفاعلية تعرض البيانات مكانياً'],
  ['طلبات أو عملاء', 'نظام إدارة بسيط للطلبات والعملاء'],
  ['بيانات مبعثرة', 'قاعدة بيانات منظمة قابلة للبحث والتوسع']
];

const packages = [
  ['بداية منظمة', 'نظام أساسي لإدارة البيانات والتقارير، مناسب كبداية سريعة ومنظمة.'],
  ['نمو احترافي', 'داشبورد، صلاحيات، تصدير، أرشفة، وتحسين تجربة الاستخدام.'],
  ['حل مخصص', 'نظام كامل حسب طبيعة العمل، مع خرائط أو تقارير متقدمة عند الحاجة.']
];

function buildBusinessFunnel() {
  if (document.querySelector('.business-funnel')) return;
  const services = document.getElementById('services');
  if (!services) return;

  const section = document.createElement('section');
  section.className = 'container section business-funnel';
  section.innerHTML = `
    <div class="business-hero glass">
      <div>
        <em>حلول للأعمال والمؤسسات</em>
        <h2>حوّل عملك من ملفات ورسائل متفرقة إلى نظام واضح يدير بياناتك وتقاريرك.</h2>
        <p>رجل الأعمال لا يحتاج موقعًا جميلًا فقط. يحتاج نظامًا يقلل الفوضى، يختصر الوقت، ويجعل المتابعة والإدارة أوضح.</p>
      </div>
      <a class="whatsapp-btn" href="${businessMessage}" target="_blank" rel="noreferrer">اطلب تصورًا مبدئيًا لنظام عملك</a>
    </div>

    <div class="solution-table glass">
      <div class="solution-head">
        <span>المشكلة الحالية</span>
        <span>الحل المقترح</span>
      </div>
      <div class="solution-rows"></div>
    </div>

    <div class="business-packages">
      <div class="title compact-title">
        <span>باقات بدون أسعار ثابتة</span>
        <h2>نبدأ من حجم المشكلة، وليس من قائمة أسعار جاهزة.</h2>
        <p>السعر والتفاصيل تُحدد بعد فهم طبيعة البيانات والمخرجات المطلوبة.</p>
      </div>
      <div class="package-grid"></div>
    </div>

    <form class="lead-form glass" id="leadForm">
      <div>
        <em>طلب سريع</em>
        <h2>أرسل تفاصيل أولية وسأعود لك بتصور أوضح.</h2>
        <p>النموذج لا يحفظ بياناتك في قاعدة بيانات حاليًا؛ فقط يجهز رسالة واتساب منظمة.</p>
      </div>
      <label>الاسم أو اسم الجهة<input name="name" placeholder="مثال: شركة / مؤسسة / اسم شخص" /></label>
      <label>نوع النشاط<input name="business" placeholder="مثال: تشغيل، تجارة، جمعية، مكتب هندسي" /></label>
      <label>المشكلة الحالية<textarea name="problem" placeholder="اشرح باختصار أين الفوضى أو التأخير الحالي"></textarea></label>
      <label>هل تستخدم Excel أو واتساب حاليًا؟<input name="tools" placeholder="مثال: نعم، Excel وواتساب" /></label>
      <button class="whatsapp-btn" type="submit">إرسال الطلب عبر واتساب</button>
    </form>
  `;

  const rows = section.querySelector('.solution-rows');
  solutions.forEach(([problem, solution]) => {
    const row = document.createElement('div');
    row.className = 'solution-row';
    row.innerHTML = `<strong>${problem}</strong><span>${solution}</span>`;
    rows?.appendChild(row);
  });

  const packageGrid = section.querySelector('.package-grid');
  packages.forEach(([title, text]) => {
    const card = document.createElement('article');
    card.className = 'package-card glass';
    card.innerHTML = `<h3>${title}</h3><p>${text}</p>`;
    packageGrid?.appendChild(card);
  });

  const form = section.querySelector('#leadForm') as HTMLFormElement | null;
  form?.addEventListener('submit', (event) => {
    event.preventDefault();
    const data = new FormData(form);
    const message = `مرحبًا مهند، أريد تصورًا مبدئيًا لنظام عمل.\n\nالاسم/الجهة: ${data.get('name') || '-'}\nنوع النشاط: ${data.get('business') || '-'}\nالمشكلة الحالية: ${data.get('problem') || '-'}\nالأدوات الحالية: ${data.get('tools') || '-'}\n\nأرغب بمناقشة الحل المناسب.`;
    window.open(wa(message), '_blank', 'noopener,noreferrer');
  });

  services.parentElement?.insertBefore(section, services.nextSibling);
}

const observer = new MutationObserver(buildBusinessFunnel);
observer.observe(document.body, { childList: true, subtree: true });
buildBusinessFunnel();
