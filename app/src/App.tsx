import { useState } from 'react';
import { ArrowLeft, ExternalLink, Mail, MessageCircle, Moon, Sun, X } from 'lucide-react';

type Project = {
  title: string;
  type: string;
  status: string;
  desc: string;
  problem: string;
  solution: string;
  features: string[];
  tech: string[];
  visual: 'water' | 'phone' | 'map' | 'orphans' | 'market' | 'data';
  screens?: string[];
  link?: string;
};

const email = 'mmashharawi2021@gmail.com';
const whatsappNumber = '970568876261';
const base = import.meta.env.BASE_URL || '/';
const img = (name: string) => `${base}assets/projects/${name}`;
const whatsapp = (message: string) => `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
const generalWhatsApp = whatsapp('مرحبًا مهند، شاهدت موقعك الشخصي وأرغب بمناقشة فكرة مشروع.');
const nav = [['#home','الرئيسية'],['#services','الخدمات'],['#projects','الأعمال'],['#skills','المهارات'],['#contact','تواصل']];
const services = [
  ['أنظمة ويب مخصصة','أحوّل العمل اليدوي والمتكرر إلى نظام واضح: إدخال بيانات، أرشفة، صلاحيات، بحث، تقارير، وتصدير.'],
  ['داشبوردات تشغيل وإدارة','لوحات تحكم تعرض المؤشرات المهمة بسرعة، وتساعد صاحب القرار على فهم الوضع بدل الغرق في الجداول.'],
  ['خرائط GIS تفاعلية','خرائط ويب تعرض الطبقات والبيانات المكانية بطريقة سهلة، مع تصنيف، بحث، وتحليل بصري.'],
  ['واجهات عربية RTL احترافية','تصميم عربي واضح وسريع يناسب المستخدم الحقيقي، خصوصًا على الجوال، بدون تعقيد أو ازدحام.'],
  ['Firebase وقواعد بيانات','ربط تسجيل الدخول، Firestore، الصلاحيات، والاستضافة السحابية بطريقة منظمة وقابلة للتوسع.'],
  ['تحسين أنظمة موجودة','إعادة ترتيب الواجهة، تحسين الأداء، تنظيف التجربة، وإظهار النظام بشكل يليق بالعميل والعمل.']
];
const outcomes = [
  ['عندك تقارير يومية متعبة؟','أحوّلها إلى نظام إدخال وأرشفة وتصدير، بدل النسخ اليدوي والبحث داخل الملفات.'],
  ['عندك بيانات مكانية؟','أحوّلها إلى خريطة تفاعلية مفهومة يمكن عرضها ومشاركتها مع الفريق أو الإدارة.'],
  ['عندك ملفات Excel كثيرة؟','أحوّلها إلى داشبورد واضح يختصر المؤشرات المهمة ويقلل وقت المتابعة.'],
  ['عندك فكرة مشروع؟','أرتبها معك من المشكلة والبيانات إلى واجهة قابلة للنشر والاستخدام.']
];
const beforeAfter = [
  ['قبل','ملفات متفرقة، تقارير يدوية، صعوبة متابعة، ومظهر لا يعطي ثقة كافية.'],
  ['بعد','نظام واضح، واجهة منظمة، مؤشرات مباشرة، تصدير سريع، وتجربة تليق بالعمل.']
];

// ملاحظة: هذه هي أسماء الملفات التي رفعتها أنت داخل app/public/assets/projects.
// ربطتها مباشرة الآن حتى تظهر الصور الحقيقية في الواجهة بدل الرسومات الوهمية.
const uploaded = {
  waterLight: 'file_000000000c4471f4a62bf142d587cc3e.png',
  waterDark: 'file_0000000012a07243b51fe65c5143b888.png',
  amancareHero: 'file_0000000016cc71f4bc47e5a9dea3e6f6.png',
  amancareProducts: 'file_000000001a4c724684609052d3ae25ef.png',
  gisLoginOld: 'file_00000000250c7246899b1c8f3d1e9263.png',
  gisDashboard: 'file_0000000025f871f4aac987298e629519.png',
  gisLoginDark: 'file_00000000358471f4bced956d6ea882e5.png',
  gisLoader: 'file_000000004ecc71f483fe115305425dc8.png',
  gisEditor: 'file_000000006dcc7246b84db297e8e4ea2a.png',
  gisStats: 'file_00000000808472469d824f546070d3db.png',
  gisData: 'file_0000000087107243a1ee39cf9f1edb77.png',
  charityLoader: 'file_00000000979c7243b3a32467e83090e8.png',
  charityLight: 'file_000000009818724386a9bc73e571f8f6.png',
  charityDark: 'file_00000000e884724686e466809884cba7.png'
};

const projects: Project[] = [
  {
    title:'نظام تقارير تشغيل وضخ المياه', type:'Web System', status:'قيد التطوير', visual:'water',
    screens:[uploaded.waterDark, uploaded.waterLight],
    desc:'نظام عربي يحوّل تقارير التشغيل اليومية إلى أرشيف منظم مع حسابات وتصدير ومشاركة.',
    problem:'التقارير اليومية كانت تعتمد على نصوص وجداول يدوية، ما يجعل المراجعة والتتبع والتصدير أبطأ وأكثر عرضة للأخطاء.',
    solution:'بناء نظام يحفظ كل تقرير كبطاقة واضحة، يفتح التفاصيل، يحسب القيم، ويدعم التعديل والتصدير والمشاركة.',
    features:['أرشيف يومي','حساب ساعات التشغيل','إدارة الوقود والمياه','PDF وExcel','مشاركة واتساب'],
    tech:['React','TypeScript','Firebase','Firestore','RTL'], link:'https://fridge-oracle-sza.web.app/'
  },
  {
    title:'لوحة متابعة الحصر الميداني GIS', type:'GIS Platform', status:'مكتمل / خاص', visual:'map',
    screens:[uploaded.gisDashboard, uploaded.gisStats, uploaded.gisData, uploaded.gisEditor],
    desc:'لوحة GIS تفاعلية لمتابعة المناطق، المباني، حالات الإنجاز، الإحصائيات، والفلاتر.',
    problem:'البيانات الميدانية والمكانية تحتاج عرضًا واضحًا للإدارة والفرق الفنية بدل الملفات المتفرقة.',
    solution:'تحويل بيانات الحصر إلى خريطة تفاعلية مع فلاتر، إحصائيات، ولوحات متابعة قابلة للعرض والتحليل.',
    features:['خريطة تفاعلية','إحصاء تحليلي','فلاتر','مفتاح خريطة','تصدير'],
    tech:['GIS','Leaflet','GeoJSON','Dashboard','Analytics']
  },
  {
    title:'AmanCare', type:'Storefront', status:'نموذج أولي', visual:'market',
    screens:[uploaded.amancareHero, uploaded.amancareProducts],
    desc:'واجهة متجر عربية لعرض المنتجات بطريقة هادئة ومنظمة مع تجربة طلب واضحة ومباشرة.',
    problem:'المنتجات الحساسة تحتاج عرضًا محترمًا ومنظمًا يحافظ على الخصوصية ويختصر رحلة الطلب.',
    solution:'واجهة عربية RTL ناعمة تركز على الثقة، الخصوصية، سهولة التصفح، والتواصل المباشر.',
    features:['واجهة متجر','تصنيفات','بحث','تواصل مباشر','RTL'],
    tech:['React','RTL','UX','Storefront']
  },
  {
    title:'منصة الساعي للخير', type:'Charity Platform', status:'نموذج أولي', visual:'orphans',
    screens:[uploaded.charityDark, uploaded.charityLight, uploaded.charityLoader],
    desc:'منصة خيرية عربية/إنجليزية لعرض فكرة الكفالة والتبرع بواجهة واضحة ومؤثرة.',
    problem:'المنصات الخيرية تحتاج ثقة ووضوحًا من أول زيارة، وليس مجرد نصوص عامة أو أزرار تبرع.',
    solution:'تصميم تجربة إنسانية تشرح الهدف، تبني الثقة، وتوجه الزائر إلى قرار واضح.',
    features:['Landing Page','Bilingual','Dark/Light','CTA واضح'],
    tech:['React','Bilingual','Charity UX','Responsive']
  },
  {
    title:'تجربة دخول وتحميل GIS', type:'GIS UX', status:'مكتمل / خاص', visual:'data',
    screens:[uploaded.gisLoginDark, uploaded.gisLoader, uploaded.gisLoginOld],
    desc:'شاشات دخول وتحميل مصممة لتجعل تجربة نظام GIS أكثر احترافية من أول لحظة.',
    problem:'كثير من الأنظمة تبدأ بشاشات ضعيفة تعطي انطباعًا غير رسمي حتى لو كان النظام قويًا.',
    solution:'تجربة دخول وتحميل بهوية GIS واضحة، حالة تحميل، ولغة واجهة منظمة.',
    features:['Login','Loader','Arabic/English','Premium UI'],
    tech:['UX','GIS','Responsive','Dark UI']
  },
  {
    title:'تطبيق تاجر', type:'Mobile App', status:'قيد التطوير', visual:'phone',
    desc:'تطبيق عربي لإدارة المصاريف والديون والعملاء بواجهة بسيطة تناسب الشخص والتاجر الصغير.',
    problem:'كثير من تطبيقات المال تبدو محاسبية أكثر من اللازم، ولا تتحدث بلغة المستخدم العربي اليومية.',
    solution:'تطبيق Offline-first بمصطلحات واضحة مثل له وعليه، مع كشف حساب، أقساط، تقارير، ومشاركة واتساب.',
    features:['وضع شخصي/تاجر/عائلة','كشف حساب','ديون وأقساط','تصدير','شريط ديون متحرك'],
    tech:['Flutter','Dart','Offline','RTL']
  }
];
const skills = [['Frontend','React، TypeScript، Vite، CSS، Motion'],['GIS','ArcGIS Pro، GeoJSON، MapLibre، Spatial Analysis'],['Cloud','Firebase، Firestore، Auth، Hosting، Rules'],['Quality','RTL UX، Responsive، Performance، Clean Code']];
const steps = ['فهم المشكلة والنتيجة المطلوبة قبل أي تصميم','تحديد بنية البيانات ورحلة المستخدم الأساسية','تصميم Wireframe واضح قبل الألوان والمؤثرات','بناء النظام تدريجيًا مع اختبار كل مرحلة','تحسين الأداء والتجاوب وتجربة الجوال','النشر والتوثيق وتجهيز المشروع للتسليم'];
const projectRequest = (p: Project) => whatsapp(`مرحبًا مهند، شاهدت مشروع "${p.title}" في موقعك وأرغب بتنفيذ مشروع مشابه.\n\nالفكرة باختصار:\nالبيانات المتوفرة:\nالمخرجات المطلوبة:`);

function Chips({items}:{items:string[]}){return <div className="chips">{items.map(x=><span key={x}>{x}</span>)}</div>}
function ProjectMockup({visual}:{visual:Project['visual']}){return <div className={`project-mockup ${visual}`}><div className="mock-toolbar"><i/><i/><i/></div><div className="mock-content"><span/><span/><span/><b/></div><div className="mock-footer"><em/><em/><em/></div></div>}
function ProjectVisual({p}:{p:Project}){if(p.screens?.length){return <div className={`project-shots count-${Math.min(p.screens.length,4)}`}>{p.screens.slice(0,4).map((name,index)=><img key={name} src={img(name)} alt={`${p.title} - صورة ${index+1}`} loading="lazy" />)}</div>}return <ProjectMockup visual={p.visual}/>}
function Modal({p,onClose}:{p:Project;onClose:()=>void}){return <div className="modal" onClick={onClose}><article className="modal-card glass" onClick={e=>e.stopPropagation()}><button className="close" onClick={onClose}><X size={20}/></button><div className="modal-grid"><ProjectVisual p={p}/><div><b className="tag">{p.type} / {p.status}</b><h2>{p.title}</h2><p>{p.desc}</p></div></div><div className="split"><div><h3>المشكلة</h3><p>{p.problem}</p></div><div><h3>الحل</h3><p>{p.solution}</p></div></div><Chips items={p.features}/><Chips items={p.tech}/><div className="actions modal-actions">{p.link&&<a className="primary" href={p.link} target="_blank">فتح المعاينة <ExternalLink size={17}/></a>}<a className="whatsapp-btn" href={projectRequest(p)} target="_blank">اطلب مشروع مشابه <MessageCircle size={17}/></a></div></article></div>}

export default function App(){const[light,setLight]=useState(false);const[selected,setSelected]=useState<Project|null>(null);return <div className={light?'app light':'app'}><header className="top"><div className="container nav glass"><a className="brand" href="#home"><span>م</span><b>مهند المشهراوي<small>GIS / Web Systems</small></b></a><nav>{nav.map(([h,l])=><a key={h} href={h}>{l}</a>)}</nav><div className="nav-actions"><a className="whatsapp-mini" href={generalWhatsApp} target="_blank"><MessageCircle size={18}/> واتساب</a><button className="toggle" onClick={()=>setLight(!light)}>{light?<Moon/>:<Sun/>}</button></div></div></header><main><section id="home" className="container hero"><div><em>GIS / Dashboards / Web Systems</em><h1>أبني أنظمة عملية تُظهر بياناتك بوضوح<span>وتجعل عملك أسهل وأقوى أمام العملاء</span></h1><p>أنا مهند المشهراوي، مهندس GIS ومطور أنظمة ويب. أساعد المؤسسات والأفراد على تحويل الملفات والجداول والتقارير اليومية إلى أنظمة واضحة، سريعة، وقابلة للاستخدام الحقيقي.</p><div className="actions"><a className="primary" href="#projects">شاهد الأعمال <ArrowLeft size={18}/></a><a className="whatsapp-btn" href={generalWhatsApp} target="_blank">تواصل واتساب <MessageCircle size={18}/></a></div><div className="metrics">{['أنظمة تشغيل','خرائط GIS','واجهات عربية','نشر سحابي'].map(x=><div key={x}><b>{x}</b><span>حلول عملية قابلة للتوسع</span></div>)}</div></div><div className="mock glass"><div className="mock-head"><b>GIS Operations Console</b><i/></div><div className="map"><span/><span/><b/></div><div className="bars">{['تقارير اليوم','مؤشرات الأداء','حالة البيانات'].map((x,i)=><p key={x}><strong>{x}</strong><em style={{width:`${86-i*14}%`}}/></p>)}</div></div></section><section className="container about glass"><div><em>من أنا</em><h2>لا أصمم واجهات جميلة فقط؛ أبني أنظمة تحل مشكلة واضحة.</h2><p>قيمة الموقع أو النظام ليست في الشكل وحده، بل في قدرته على تقليل الوقت، تنظيم البيانات، وتقديم صورة احترافية أمام المستخدم أو العميل.</p></div><div className="mini">{['GIS والخرائط والتحليل المكاني','React وTypeScript وواجهات RTL','Firebase وFirestore والاستضافة','تصميم عملي يركز على الثقة والسرعة'].map(x=><b key={x}>{x}</b>)}</div></section><section id="services" className="container section"><Title a="الخدمات" h="حلول رقمية واضحة بدل العمل اليدوي المتعب" p="أركز على الأنظمة التي تخدم العمل اليومي فعلًا: إدخال بيانات، متابعة، خرائط، تقارير، وتصدير."/><div className="grid three">{services.map(([h,p])=><article className="card glass" key={h}><h3>{h}</h3><p>{p}</p></article>)}</div></section><section className="container section outcome-section"><Title a="ماذا أقدم لك؟" h="أحوّل المشكلة اليومية إلى نتيجة قابلة للاستخدام" p="العميل لا يحتاج أسماء التقنيات أولًا؛ يحتاج أن يعرف كيف ستصبح حياته أو عمله أسهل بعد النظام."/><div className="grid two">{outcomes.map(([h,p])=><article className="outcome-card glass" key={h}><h3>{h}</h3><p>{p}</p></article>)}</div></section><section className="container before-after glass"><div><em>قبل / بعد</em><h2>الفرق الحقيقي ليس في الشكل فقط، بل في تنظيم العمل.</h2><p>النظام الجيد يقلل الفوضى، يسرّع الوصول للمعلومة، ويجعل عرض العمل أكثر ثقة أمام الإدارة أو العميل.</p></div><div className="ba-grid">{beforeAfter.map(([h,p])=><article key={h}><b>{h}</b><p>{p}</p></article>)}</div></section><section id="projects" className="container section"><Title a="الأعمال" h="مشاريع فعلية بصور واضحة داخل الواجهة" p="كل صورة هنا من مشروع حقيقي. الهدف أن يرى الزائر مستوى التنفيذ مباشرة دون روابط صعبة الوصول."/><div className="grid three">{projects.map(p=><article className="project glass" key={p.title}><ProjectVisual p={p}/><div className="project-body"><div className="project-meta"><span>{p.type}</span><small>{p.status}</small></div><h3>{p.title}</h3><p>{p.desc}</p><Chips items={p.tech.slice(0,4)}/><div className="project-actions"><button className="secondary" onClick={()=>setSelected(p)}>تفاصيل المشروع</button>{p.link&&<a className="secondary" href={p.link} target="_blank">معاينة</a>}<a className="whatsapp-btn" href={projectRequest(p)} target="_blank">اطلب مشابه</a></div></div></article>)}</div></section><section className="container cta-panel glass"><div><em>الهدف من الموقع</em><h2>الزائر لا يحتاج أن يرى كل شيء؛ يحتاج أن يثق أنك قادر على تنفيذ فكرته.</h2><p>لذلك كل مشروع في الموقع يوضح الفكرة، المشكلة، الحل، والتقنيات، ثم يعطي الزائر خطوة مباشرة للتواصل.</p></div><a className="whatsapp-btn" href={generalWhatsApp} target="_blank">ابدأ مشروعك عبر واتساب <MessageCircle size={18}/></a></section><section id="skills" className="container section"><Title a="المهارات" h="مزيج عملي بين GIS، الواجهة، وقواعد البيانات"/><div className="grid four">{skills.map(([h,p])=><article className="card glass" key={h}><h3>{h}</h3><p>{p}</p></article>)}</div></section><section className="container section"><Title a="طريقة العمل" h="تنفيذ مرتب من الفكرة حتى النشر"/><div className="grid three">{steps.map((s,i)=><div className="step glass" key={s}><b>{String(i+1).padStart(2,'0')}</b><p>{s}</p></div>)}</div></section><section id="contact" className="container contact glass"><div><em>تواصل</em><h2>لديك فكرة نظام، خريطة، أو داشبورد؟</h2><p>أرسل لي الفكرة باختصار: ما المشكلة؟ ما البيانات المتوفرة؟ وما النتيجة التي تريدها؟ بعدها يمكن تحويلها إلى خطة تنفيذ واضحة.</p><div className="actions"><a className="whatsapp-btn" href={generalWhatsApp} target="_blank">تواصل واتساب <MessageCircle size={18}/></a><a className="secondary" href={`mailto:${email}`}>راسلني بالبريد <Mail size={18}/></a></div></div><div className="contact-list"><a href={generalWhatsApp} target="_blank">WhatsApp<strong>+970 568 876 261</strong></a><a href="https://www.linkedin.com/in/mohanad-elmashharawi-a4bb23148" target="_blank">LinkedIn<strong>Mohanad Al-Mashharawi</strong></a><a href={`mailto:${email}`}>Email<strong>{email}</strong></a><a href="https://github.com/mmashharawi2021-cell" target="_blank">GitHub<strong>mmashharawi2021-cell</strong></a></div></section></main><a className="float-whatsapp" href={generalWhatsApp} target="_blank" aria-label="تواصل واتساب"><MessageCircle size={23}/></a><nav className="bottom">{nav.map(([h,l])=><a key={h} href={h}>{l}</a>)}</nav><footer>© 2026 Mohanad Al-Mashharawi. Premium GIS / Web Systems Portfolio.</footer>{selected&&<Modal p={selected} onClose={()=>setSelected(null)}/>}</div>}
function Title({a,h,p}:{a:string;h:string;p?:string}){return <div className="title"><span>{a}</span><h2>{h}</h2>{p&&<p>{p}</p>}</div>}
