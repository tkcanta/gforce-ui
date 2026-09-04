/* G-Force Landing 1.0.0. LP-only progressive enhancement; no runtime dependency. */
export function initLanding(root = document) {
  if (!['lp-expressive', 'lp-enterprise', 'lp-hybrid'].includes(document.documentElement.dataset.gfuProfile)) return;
  const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
  for (const tabs of root.querySelectorAll('[data-lp-tabs]:not([data-lp-initialized])')) {
    tabs.dataset.lpInitialized = 'true';
    const buttons = [...tabs.querySelectorAll('[role="tab"]')];
    const activate = (index, focus = false) => {
      buttons.forEach((button,i) => {
        button.setAttribute('aria-selected',String(i === index)); button.tabIndex = i === index ? 0 : -1;
        const panel = document.getElementById(button.getAttribute('aria-controls'));
        panel.hidden = i !== index;
        panel.setAttribute('aria-labelledby',button.id);
      });
      if (focus) buttons[index].focus();
    };
    buttons.forEach((button,index) => {
      button.addEventListener('click',()=>activate(index));
      button.addEventListener('keydown',event=>{
        if (!['ArrowLeft','ArrowRight','Home','End'].includes(event.key)) return;
        event.preventDefault();
        activate(event.key === 'Home' ? 0 : event.key === 'End' ? buttons.length-1 : (index + (event.key === 'ArrowRight' ? 1 : -1) + buttons.length) % buttons.length,true);
      });
    });
    tabs.querySelector('[role="tablist"]').hidden = false; activate(0);
  }
  for (const pricing of root.querySelectorAll('[data-lp-pricing]:not([data-lp-initialized])')) {
    pricing.dataset.lpInitialized = 'true';
    const update = () => {
      const period = pricing.querySelector('input:checked').value;
      pricing.querySelectorAll('[data-lp-price]').forEach(node=>{ node.hidden = node.dataset.lpPrice !== period; });
      pricing.querySelector('[data-lp-price-status]').textContent = document.documentElement.lang === 'ja' ? (period === 'annual' ? '年払いの総額を表示しています。' : '月払いの金額を表示しています。') : (period === 'annual' ? 'Showing the total annual amount.' : 'Showing the monthly amount.');
    };
    pricing.querySelector('fieldset').hidden = false;
    pricing.addEventListener('change',update); update();
  }
  for (const carousel of root.querySelectorAll('[data-lp-carousel]:not([data-lp-initialized])')) {
    carousel.dataset.lpInitialized = 'true';
    const track = carousel.querySelector('.gfu-lp-carousel__track');
    const previous = carousel.querySelector('[data-lp-dir="previous"]'), next = carousel.querySelector('[data-lp-dir="next"]');
    const update = () => { previous.disabled = track.scrollLeft <= 1; next.disabled = track.scrollLeft + track.clientWidth >= track.scrollWidth - 2; };
    for (const [button,direction] of [[previous,-1],[next,1]]) button.addEventListener('click',()=>track.scrollBy({left:direction * (track.firstElementChild.getBoundingClientRect().width + 24),behavior:reduced() ? 'instant' : 'smooth'}));
    track.addEventListener('scroll',update,{passive:true});
    new ResizeObserver(update).observe(track);
    carousel.querySelector('.gfu-lp-carousel__controls').hidden = false; update();
  }
  if (document.documentElement.hasAttribute('data-lp-ready')) return;
  const dialog = document.getElementById('lp-navigation');
  const trigger = document.querySelector('[data-lp-mobile-open]');
  if (dialog && trigger) {
    trigger.hidden = false;
    trigger.addEventListener('click',()=>{ dialog.showModal(); trigger.setAttribute('aria-expanded','true'); });
    dialog.querySelector('[data-lp-mobile-close]').addEventListener('click',()=>dialog.close());
    // Native modal inertness does not prevent tabbing into browser chrome; keep navigation focus in the dialog.
    dialog.addEventListener('keydown',event=>{
      if (event.key !== 'Tab') return;
      const items=[...dialog.querySelectorAll('a[href],button:not(:disabled)')].filter(node=>node.getClientRects().length);
      const first=items[0],last=items.at(-1);
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    });
    dialog.addEventListener('click',event=>{
      if (event.target.closest('a')) dialog.close();
      else if (event.target === dialog) {
        const box = dialog.getBoundingClientRect();
        if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) dialog.close();
      }
    });
    dialog.addEventListener('close',()=>{ trigger.setAttribute('aria-expanded','false'); if (trigger.getClientRects().length) trigger.focus(); });
    matchMedia('(min-width: 840px)').addEventListener('change',event=>{ if (event.matches && dialog.open) { dialog.close(); document.querySelector('.gfu-lp-brand').focus(); } });
  }
  for (const mega of document.querySelectorAll('.gfu-lp-mega')) {
    const close = focus => { mega.open=false; if (focus) mega.querySelector('summary').focus(); };
    mega.addEventListener('keydown',event=>{ if (event.key === 'Escape' && mega.open) { event.preventDefault(); close(true); } });
    mega.addEventListener('click',event=>{ if (event.target.closest('a')) close(false); });
    document.addEventListener('click',event=>{ if (mega.open && !mega.contains(event.target)) close(false); });
    mega.addEventListener('focusout',event=>{ if (mega.open && !mega.contains(event.relatedTarget)) close(false); });
  }
  const anchors = [...document.querySelectorAll('.gfu-lp-anchor a')];
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries=>{
      for (const entry of entries) if (entry.isIntersecting) anchors.forEach(a=>{ if (a.hash === `#${entry.target.id}`) a.setAttribute('aria-current','location'); else a.removeAttribute('aria-current'); });
    },{rootMargin:'-20% 0px -60% 0px'});
    anchors.forEach(a=>observer.observe(document.getElementById(a.hash.slice(1))));
  }
  document.documentElement.dataset.lpReady='true';
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded',()=>initLanding(),{once:true});
else initLanding();
