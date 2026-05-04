import './hero-rotator.css';

const roles = [
  'نظم المعلومات الجغرافية GIS',
  'Web Development',
  'Dashboards',
  'Interactive Maps',
  'Business Systems',
  'Data Management',
  'Firebase Systems',
  'Arabic RTL Interfaces'
];

function initHeroRotator() {
  const hero = document.getElementById('home');
  if (!hero || hero.querySelector('.hero-identity')) return;
  const content = hero.firstElementChild;
  const title = content?.querySelector('h1');
  if (!content || !title) return;

  title.innerHTML = `أنا مهند المشهراوي<span>مهندس GIS ومطور أنظمة ويب</span>`;

  const rotator = document.createElement('div');
  rotator.className = 'hero-identity';
  rotator.innerHTML = `
    <span class="hero-static">أبني حلولًا في:</span>
    <strong class="hero-dynamic">${roles[0]}</strong>
  `;
  title.insertAdjacentElement('afterend', rotator);

  const dynamic = rotator.querySelector('.hero-dynamic') as HTMLElement | null;
  if (!dynamic) return;
  let index = 0;
  window.setInterval(() => {
    dynamic.classList.add('is-changing');
    window.setTimeout(() => {
      index = (index + 1) % roles.length;
      dynamic.textContent = roles[index];
      dynamic.classList.remove('is-changing');
    }, 260);
  }, 2300);
}

const observer = new MutationObserver(initHeroRotator);
observer.observe(document.body, { childList: true, subtree: true });
initHeroRotator();
