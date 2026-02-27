const observer = new IntersectionObserver((entries) => {
  entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
}, { threshold: 0.1, rootMargin: '0px 0px -30px 0px' });
document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

// run an initial check so above-the-fold elements reveal immediately (no wait for images)
function markVisibleInView() {
  document.querySelectorAll('.reveal').forEach(el => {
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight && rect.bottom > 0) {
      el.classList.add('visible');
    }
  });
}
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', markVisibleInView);
} else {
  markVisibleInView();
}
window.addEventListener('load', markVisibleInView);

const topbar = document.querySelector('.topbar');
window.addEventListener('scroll', () => {
  topbar.classList.toggle('scrolled', window.scrollY > 10);
}, { passive: true });

// mobile navigation drawer
const mobileToggle = document.querySelector('.mobile-toggle');
const navLinks = document.querySelector('.nav-links');
if (mobileToggle && navLinks) {
  mobileToggle.addEventListener('click', () => {
    const expanded = navLinks.classList.toggle('open');
    mobileToggle.setAttribute('aria-expanded', expanded);
  });
  // collapse menu when a link is tapped
  navLinks.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      if (navLinks.classList.contains('open')) {
        navLinks.classList.remove('open');
        mobileToggle.setAttribute('aria-expanded', 'false');
      }
    });
  });
  // collapse menu when tapping outside
  document.addEventListener('click', (e) => {
    if (navLinks.classList.contains('open') &&
        !navLinks.contains(e.target) &&
        !mobileToggle.contains(e.target)) {
      navLinks.classList.remove('open');
      mobileToggle.setAttribute('aria-expanded', 'false');
    }
  });
}
