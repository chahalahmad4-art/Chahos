/* Play the brand intro once per tab session. Reduced-motion users see the page immediately. */
(() => {
  const intro = document.querySelector('[data-chahos-intro]');
  if (!intro) return;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let alreadySeen = false;
  try { alreadySeen = sessionStorage.getItem('chahos-intro-seen') === '1'; } catch (_) {}
  if (reducedMotion || alreadySeen) {
    intro.remove();
    return;
  }
  try { sessionStorage.setItem('chahos-intro-seen', '1'); } catch (_) {}
  const finish = () => {
    intro.classList.add('is-leaving');
    window.setTimeout(() => intro.remove(), 600);
  };
  window.setTimeout(finish, 1750);
  intro.addEventListener('click', finish, { once: true });
  intro.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' || event.key === 'Enter' || event.key === ' ') finish();
  });
})();
