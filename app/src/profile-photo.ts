import './profile-photo.css';

function addProfilePhoto() {
  if (document.querySelector('.profile-photo-card')) return;
  const hero = document.getElementById('home');
  if (!hero) return;

  const visual = hero.querySelector('.mock');
  if (!visual) return;

  const card = document.createElement('aside');
  card.className = 'profile-photo-card glass';
  card.innerHTML = `
    <img src="/myprofile-/profile-photo.svg" alt="مهند المشهراوي - مهندس GIS ومطور أنظمة ويب" loading="eager" />
    <div>
      <strong>مهند المشهراوي</strong>
      <span>GIS Engineer / Web Systems Developer</span>
    </div>
  `;

  visual.insertAdjacentElement('beforebegin', card);
}

const observer = new MutationObserver(addProfilePhoto);
observer.observe(document.body, { childList: true, subtree: true });
addProfilePhoto();
