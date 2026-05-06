import { useState } from 'react';
import { ArrowLeft, ExternalLink, Mail, MessageCircle, Moon, Sun, X } from 'lucide-react';

type Project = {
  title: string;
  type: string;
  status: string;
  imageNo: string;
  desc: string;
  value: string;
  tech: string[];
  link?: string;
};

const email = 'mmashharawi2021@gmail.com';
const whatsappNumber = '970568876261';
const base = import.meta.env.BASE_URL || '/';
const imagePath = (imageNo: string) => `${base}assets/projects/${imageNo}.webp`;
const whatsapp = (message: string) => `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
const generalWhatsApp = whatsapp('مرحبًا مهند، شاهدت موقعك الشخصي وأرغب بمناقشة فكرة مشروع.');

const nav = [
  ['#home', 'الرئيسية'],
  ['#services', 'الخدمات'],
  ['#projects', 'الأعمال'],
  ['#skills', 'المهارات'],
  ['#contact', 'تواصل']
];

// لتبديل الصور يدويًا غيّر imageNo فقط. الصور موجودة هنا: app/public/assets/projects/01.webp ... 14.webp
const projects: Project[] = [
  {
    title: 'نظام تقارير تشغيل وضخ المياه',
    type: 'Web System',
    status: 'قيد التطوير',
    imageNo: '01',
    desc: 'نظام عربي لإدارة تقارير التشغيل اليومية، الوقود، الإنتاج، الفحوصات، الجهات المستفيدة، والأرشيف.',
    value: 'تحويل التقارير اليومية من نصوص وملفات متفرقة إلى لوحة تشغيل قابلة للتصدير والمتابعة.',
    tech: ['React', 'TypeScript', 'Firebase', 'Reports'],
    link: 'https://fridge-oracle-sza.web.app/'
  },
  {
    title: 'لوحة متابعة الحصر الميداني GIS',
    type: 'GIS Platform',
    status: 'مكتمل / خاص',
    imageNo: '03',
    desc: 'خريطة تفاعلية لمتابعة المناطق والمباني ونسب الإنجاز مع فلاتر وإحصائيات وتصدير.',
    value: 'تحويل البيانات الميدانية إلى رؤية مكانية واضحة للإدارة.',
    tech: ['GIS', 'Maps', 'Analytics', 'Leaflet']
  },
  {
    title: 'AmanCare',
    type: 'Storefront',
    status: 'نموذج أولي',
    imageNo: '06',
    desc: 'واجهة متجر عربية لعرض المنتجات بطريقة هادئة ومنظمة مع تجربة طلب واضحة ومباشرة.',
    value: 'واجهة تجارية تركّز على الخصوصية والثقة وسهولة الطلب.',
    tech: ['Storefront', 'RTL', 'UX', 'Products']
  },
  {
    title: 'منصة الساعي للخير',
    type: 'Charity Platform',
    status: 'نموذج أولي',
    imageNo: '08',
    desc: 'منصة خيرية عربية/إنجليزية لعرض فكرة الكفالة والتبرع بواجهة واضحة ومؤثرة.',
    value: 'بناء الثقة وتسهيل قرار التبرع من أول زيارة.',
    tech: ['Charity', 'Landing', 'Bilingual', 'Dark/Light']
  },
  {
    title: 'تجربة GIS متقدمة',
    type: 'GIS UX',
    status: 'مكتمل / خاص',
    imageNo: '11',
    desc: 'شاشات دخول وتحميل ومحرر خرائط وتحكم فني مصممة لتجربة نظام GIS أكثر احترافية.',
    value: 'النظام لا يقتصر على الخريطة؛ بل يقدم تجربة كاملة من الدخول حتى التحليل.',
    tech: ['Login', 'Map Editor', 'Field Data', 'UX']
  }
];

const services = [
  ['أنظمة ويب مخصصة', 'إدخال بيانات، أرشفة، صلاحيات، بحث، تقارير، وتصدير.'],
  ['داشبوردات تشغيل وإدارة', 'لوحات تحكم تعرض المؤشرات المهمة بسرعة.'],
  ['خرائط GIS تفاعلية', 'خرائط ويب تعرض الطبقات والبيانات المكانية بطريقة سهلة.'],
  ['واجهات عربية RTL', 'تصميم عربي واضح وسريع يناسب الجوال.'],
  ['Firebase وقواعد بيانات', 'تسجيل دخول، Firestore، صلاحيات، واستضافة.'],
  ['تحسين أنظمة موجودة', 'إعادة ترتيب الواجهة وتحسين الأداء وتجربة الاستخدام.']
];

const skills = [
  ['واجهات وتطبيقات ويب', 'React, TypeScript, Vite, CSS'],
  ['خرائط و GIS', 'ArcGIS Pro, GeoJSON, MapLibre'],
  ['سحابة وقواعد بيانات', 'Firebase, Firestore, Auth, Hosting'],
  ['جودة وتجربة استخدام', 'RTL UX, Responsive, Performance']
];

function projectMessage(project: Project) {
  return whatsapp(`مرحبًا مهند، شاهدت مشروع "${project.title}" في موقعك وأرغب بتنفيذ مشروع مشابه.\n\nالفكرة باختصار:\nالبيانات المتوفرة:\nالمخرجات المطلوبة:`);
}

function Chips({ items }: { items: string[] }) {
  return <div className="chips">{items.map((item) => <span key={item}>{item}</span>)}</div>;
}

function ProjectImage({ project, large = false }: { project: Project; large?: boolean }) {
  return (
    <div className={large ? 'project-image large' : 'project-image'}>
      <span className="image-number">صورة {project.imageNo}</span>
      <img src={imagePath(project.imageNo)} alt={project.title} loading="lazy" />
    </div>
  );
}

function Modal({ project, onClose }: { project: Project; onClose: () => void }) {
  return (
    <div className="modal" onClick={onClose}>
      <article className="modal-card glass" onClick={(e) => e.stopPropagation()}>
        <button className="close" onClick={onClose} aria-label="إغلاق"><X size={20} /></button>
        <ProjectImage project={project} large />
        <div className="modal-content">
          <b className="pill">{project.type} / {project.status}</b>
          <h2>{project.title}</h2>
          <p>{project.desc}</p>
          <p className="value">القيمة: {project.value}</p>
          <Chips items={project.tech} />
          <div className="actions">
            {project.link && <a className="secondary" href={project.link} target="_blank">فتح المعاينة <ExternalLink size={17} /></a>}
            <a className="whatsapp-btn" href={projectMessage(project)} target="_blank">اطلب مشروع مشابه <MessageCircle size={17} /></a>
          </div>
        </div>
      </article>
    </div>
  );
}

function Title({ label, title, desc }: { label: string; title: string; desc?: string }) {
  return <div className="section-title"><span>{label}</span><h2>{title}</h2>{desc && <p>{desc}</p>}</div>;
}

export default function App() {
  const [light, setLight] = useState(false);
  const [selected, setSelected] = useState<Project | null>(null);

  return (
    <div className={light ? 'app light' : 'app'}>
      <header className="topbar">
        <div className="container nav glass">
          <a className="brand" href="#home"><span>م</span><b>مهند المشهراوي<small>GIS / Web Systems</small></b></a>
          <nav>{nav.map(([href, label]) => <a key={href} href={href}>{label}</a>)}</nav>
          <div className="nav-actions">
            <a className="whatsapp-mini" href={generalWhatsApp} target="_blank">واتساب</a>
            <button className="theme" onClick={() => setLight(!light)}>{light ? <Moon /> : <Sun />}</button>
          </div>
        </div>
      </header>

      <main>
        <section id="home" className="container hero">
          <div className="hero-copy">
            <span className="pill">GIS / Dashboards / Web Systems</span>
            <h1>أنا مهند المشهراوي<br /><strong>مهندس GIS ومطور أنظمة ويب</strong></h1>
            <p>أساعد المؤسسات والأفراد على تحويل الملفات والجداول والتقارير اليومية إلى أنظمة واضحة، سريعة، وقابلة للاستخدام الحقيقي.</p>
            <div className="actions"><a className="primary" href="#projects">شاهد الأعمال <ArrowLeft size={18} /></a><a className="whatsapp-btn" href={generalWhatsApp} target="_blank">تواصل واتساب <MessageCircle size={18} /></a></div>
            <div className="hero-tags"><span>GIS وخرائط وبيانات</span><span>RTL واجهات عربية</span><span>Cloud Firebase ونشر</span><span>Systems حلول عملية</span></div>
          </div>
          <aside className="hero-panel glass"><h3>GIS Operations Console</h3><div className="fake-map"><i /><b /></div></aside>
        </section>

        <section className="container about glass">
          <span className="pill">من أنا</span>
          <h2>لا أصمم واجهات جميلة فقط؛ أبني أنظمة تحل مشكلة واضحة.</h2>
          <p>قيمة الموقع أو النظام ليست في الشكل وحده، بل في قدرته على تقليل الوقت، تنظيم البيانات، وتقديم صورة احترافية أمام المستخدم أو العميل.</p>
          <div className="mini-grid"><b>GIS والخرائط والتحليل المكاني</b><b>React وTypeScript وواجهات RTL</b><b>Firebase وFirestore والاستضافة</b><b>تصميم عملي يركز على الثقة والسرعة</b></div>
        </section>

        <section id="services" className="container section">
          <Title label="الخدمات" title="حلول رقمية واضحة بدل العمل اليدوي المتعب" desc="أركز على الأنظمة التي تخدم العمل اليومي فعلًا: إدخال بيانات، متابعة، خرائط، تقارير، وتصدير." />
          <div className="grid cards">{services.map(([title, desc]) => <article className="card glass" key={title}><h3>{title}</h3><p>{desc}</p></article>)}</div>
        </section>

        <section className="container business glass">
          <span className="pill">حلول للأعمال والمؤسسات</span>
          <h2>حوّل عملك من ملفات ورسائل متفرقة إلى نظام واضح يدير بياناتك وتقاريرك.</h2>
          <p>رجل الأعمال لا يحتاج موقعًا جميلًا فقط. يحتاج نظامًا يقلل الفوضى، يختصر الوقت، ويجعل المتابعة والإدارة أوضح.</p>
          <a className="whatsapp-btn wide" href={generalWhatsApp} target="_blank">اطلب تصورًا مبدئيًا</a>
          <div className="solution-table"><div><b>تقارير يومية على واتساب</b><span>نظام تقارير وأرشفة مع تصدير ومتابعة</span></div><div><b>ملفات Excel كثيرة</b><span>داشبورد إداري يعرض المؤشرات المهمة</span></div><div><b>مواقع أو فروع أو مناطق</b><span>خريطة GIS تفاعلية تعرض البيانات مكانيًا</span></div><div><b>بيانات مبعثرة</b><span>قاعدة بيانات منظمة قابلة للبحث والتوسع</span></div></div>
        </section>

        <section id="projects" className="container section">
          <Title label="الأعمال" title="أعمال فعلية داخل الواجهة وبصور مرقمة" desc="كل صورة الآن لها رقم واضح. بعد نجاح العرض يمكن تبديل الأرقام بسهولة من الكود." />
          <div className="project-feature glass">
            <ProjectImage project={projects[0]} large />
            <div><b className="pill">{projects[0].type}</b><h3>{projects[0].title}</h3><p>{projects[0].desc}</p><p className="value">القيمة: {projects[0].value}</p><Chips items={projects[0].tech} /><div className="actions"><button className="secondary" onClick={() => setSelected(projects[0])}>تفاصيل المشروع</button><a className="whatsapp-btn" href={projectMessage(projects[0])} target="_blank">اطلب مشروع مشابه</a></div></div>
          </div>
          <div className="grid projects-grid">{projects.slice(1).map((project) => <article className="project-card glass" key={project.title}><ProjectImage project={project} /><div className="project-body"><b className="pill small">{project.type}</b><h3>{project.title}</h3><p>{project.desc}</p><p className="value">القيمة: {project.value}</p><Chips items={project.tech} /><div className="actions stacked"><button className="secondary" onClick={() => setSelected(project)}>تفاصيل المشروع</button><a className="whatsapp-btn" href={projectMessage(project)} target="_blank">اطلب مشابه</a></div></div></article>)}</div>
        </section>

        <section id="skills" className="container section">
          <Title label="المهارات" title="مزيج عملي بين GIS، الواجهة، وقواعد البيانات" />
          <div className="grid skills-grid">{skills.map(([title, desc]) => <article className="card glass" key={title}><h3>{title}</h3><p>{desc}</p></article>)}</div>
        </section>

        <section className="container lead glass">
          <span className="pill">طلب سريع</span>
          <h2>أرسل تفاصيل أولية وسأعود لك بتصور أوضح.</h2>
          <p>النموذج يجهز رسالة واتساب منظمة.</p>
          <form onSubmit={(e) => { e.preventDefault(); const data = new FormData(e.currentTarget); const msg = `مرحبًا مهند، أريد تصورًا مبدئيًا لنظام عمل.\n\nالاسم/الجهة: ${data.get('name') || '-'}\nنوع النشاط: ${data.get('business') || '-'}\nالمشكلة الحالية: ${data.get('problem') || '-'}\nالأدوات الحالية: ${data.get('tools') || '-'}`; window.open(whatsapp(msg), '_blank'); }}><label>الاسم أو اسم الجهة<input name="name" placeholder="مثال: شركة / مؤسسة / اسم شخص" /></label><label>نوع النشاط<input name="business" placeholder="تشغيل، تجارة، جمعية، مكتب هندسي" /></label><label>المشكلة الحالية<textarea name="problem" placeholder="اشرح أين الفوضى أو التأخير الحالي" /></label><label>هل تستخدم Excel أو واتساب؟<input name="tools" placeholder="مثال: نعم، Excel وواتساب" /></label><button className="whatsapp-btn wide" type="submit">إرسال الطلب عبر واتساب</button></form>
        </section>

        <section id="contact" className="container contact glass">
          <div><span className="pill">تواصل</span><h2>لديك فكرة نظام، خريطة، أو داشبورد؟</h2><p>أرسل الفكرة باختصار: ما المشكلة؟ ما البيانات المتوفرة؟ وما النتيجة التي تريدها؟</p><div className="actions"><a className="whatsapp-btn" href={generalWhatsApp} target="_blank">تواصل واتساب</a><a className="secondary" href={`mailto:${email}`}>البريد <Mail size={18} /></a></div></div>
          <div className="contact-list"><a href={generalWhatsApp} target="_blank">WhatsApp<strong>+970 568 876 261</strong></a><a href={`mailto:${email}`}>Email<strong>{email}</strong></a><a href="https://github.com/mmashharawi2021-cell" target="_blank">GitHub<strong>mmashharawi2021-cell</strong></a></div>
        </section>
      </main>

      <a className="float-whatsapp" href={generalWhatsApp} target="_blank"><MessageCircle size={22} /></a>
      <nav className="bottom-nav">{nav.map(([href, label]) => <a key={href} href={href}>{label}</a>)}</nav>
      <footer>© 2026 Mohanad Al-Mashharawi. Premium GIS / Web Systems Portfolio.</footer>
      {selected && <Modal project={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}
