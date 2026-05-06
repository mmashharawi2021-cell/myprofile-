import './site-extras.css';

const whatsappNumber = '970568876261';
const quickConsultUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent('مرحبًا مهند، أريد استشارة سريعة بخصوص فكرة نظام أو موقع.')}`;

const audience = [
  'المؤسسات والجمعيات التي تحتاج أنظمة متابعة وتقارير',
  'فرق التشغيل والميدان التي تعتمد على بيانات يومية',
  'مهندسو GIS والفرق التي تعمل على بيانات مكانية',
  'أصحاب المشاريع الصغيرة الذين يحتاجون واجهة موثوقة',
  'أي جهة تعتمد على Excel وتريد تحويله إلى نظام واضح'
];

const projectTypes = [
  'نظام تقارير يومية',
  'داشبورد إداري',
  'خريطة GIS تفاعلية',
  'نظام أرشفة وبحث',
  'تطبيق إدارة مصاريف أو عملاء',
  'موقع خدمات أو Portfolio احترافي'
];

function createCard(text: string) {
  const card = document.createElement('article');
  card.className = 'extra-card glass';
  card.textContent = text;
  return card;
}

function buildExtras() {
  if (document.querySelector('.business-extras')) return;
  const projects = document.getElementById('projects');
  if (!projects) return;

  const wrapper = document.createElement('section');
  wrapper.className = 'container section business-extras';
  wrapper.innerHTML = `
    <div class="title">
      <span>لمن يناسب هذا النوع من العمل؟</span>
      <h2>إذا كانت لديك بيانات، تقارير، خرائط، أو إجراءات متكررة، فأنت غالبًا تحتاج نظامًا واضحًا.</h2>
      <p>هذه أمثلة للجهات والحالات التي يناسبها عملي، حتى يعرف الزائر بسرعة هل الخدمة مناسبة له أم لا.</p>
    </div>
    <div class="grid audience-grid"></div>
    <div class="extras-split glass">
      <div>
        <em>أنواع المشاريع</em>
        <h2>مشاريع أستطيع تنفيذها أو تطويرها</h2>
        <p>الهدف ليس تنفيذ واجهة جميلة فقط، بل بناء حل عملي قابل للاستخدام والنشر.</p>
      </div>
      <div class="project-type-grid"></div>
    </div>
    <div class="quick-consult glass">
      <div>
        <em>استشارة سريعة</em>
        <h2>غير متأكد من شكل المشروع؟ ابدأ بسؤال بسيط.</h2>
        <p>أرسل الفكرة باختصار، وسأساعدك على تحويلها إلى تصور واضح: الصفحات، البيانات، وطريقة التنفيذ المناسبة.</p>
      </div>
      <a class="whatsapp-btn" href="${quickConsultUrl}" target="_blank" rel="noreferrer">ناقش فكرتك خلال دقائق</a>
    </div>
  `;

  const audienceGrid = wrapper.querySelector('.audience-grid');
  audience.forEach((item) => audienceGrid?.appendChild(createCard(item)));

  const typeGrid = wrapper.querySelector('.project-type-grid');
  projectTypes.forEach((item) => typeGrid?.appendChild(createCard(item)));

  projects.parentElement?.insertBefore(wrapper, projects);
}

const observer = new MutationObserver(buildExtras);
observer.observe(document.body, { childList: true, subtree: true });
buildExtras();
