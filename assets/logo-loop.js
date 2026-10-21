
(function () {
  var logo = document.getElementById('il-logo');
  if (!logo || !logo.animate) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  var q = function (s) { return Array.prototype.slice.call(logo.querySelectorAll(s)); };
  var bands = q('.il-band .il-in');           // 0 navy, 1 blue, 2 teal, 3 green, 4 sand
  var letters = q('.il-word path');
  var pill = logo.querySelector('.il-pill');
  var pillText = q('.il-pilltxt path');
  var tags = q('.il-tag');
  var SOFT = 'cubic-bezier(.22,1,.36,1)';
  var visible = true;

  function ours() {
    return logo.getAnimations({ subtree: true }).filter(function (a) {
      return !(window.CSSAnimation && a instanceof CSSAnimation);
    });
  }

  function intro() {
    ours().forEach(function (a) { a.cancel(); });
    var o = { fill: 'backwards' };
    function go(el, frames, opts) { el.animate(frames, Object.assign({}, o, opts)); }

    // 1. Navy chat bubble fades up into place.
    go(bands[0], [
      { transform: 'scale(.92)', transformOrigin: '60% 60%', opacity: 0 },
      { transform: 'none', transformOrigin: '60% 60%', opacity: 1 }
    ], { duration: 1100, easing: SOFT });

    // 2. Water rolls in from the deep side toward the beach, one wave after another,
    //    reaching a little past its line and easing back like a wave on sand.
    [1, 2, 3].forEach(function (n, i) {
      go(bands[n], [
        { transform: 'translate(9%, 7%)', opacity: 0, easing: 'cubic-bezier(.33,0,.2,1)' },
        { opacity: 1, offset: 0.3 },
        { transform: 'translate(-0.8%, -0.6%)', offset: 0.68, easing: 'cubic-bezier(.45,0,.55,1)' },
        { transform: 'none', opacity: 1 }
      ], { duration: 2200, delay: 450 + i * 320, easing: 'linear' });
    });

    // 3. White sand settles on top.
    go(bands[4], [
      { transform: 'translate(-2.5%, -2.5%)', opacity: 0 },
      { transform: 'none', opacity: 1 }
    ], { duration: 1400, delay: 1500, easing: SOFT });

    // 4. Wordmark, pill, pill text, taglines.
    letters.forEach(function (el, i) {
      go(el, [{ transform: 'translateY(240px)', opacity: 0 }, { transform: 'none', opacity: 1 }],
        { duration: 800, delay: 2200 + i * 45, easing: SOFT });
    });
    go(pill, [{ transform: 'scaleX(0)' }, { transform: 'none' }], { duration: 850, delay: 2650, easing: SOFT });
    pillText.forEach(function (el, i) {
      go(el, [{ transform: 'translateX(-60px)', opacity: 0 }, { transform: 'none', opacity: 1 }],
        { duration: 500, delay: 2900 + i * 14, easing: SOFT });
    });
    tags.forEach(function (el, i) {
      go(el, [{ transform: 'translateY(90px)', opacity: 0 }, { transform: 'none', opacity: 1 }],
        { duration: 700, delay: 3300 + i * 170, easing: SOFT });
    });

    if (!visible) ours().forEach(function (a) { a.pause(); });
  }

  // Pause everything while the logo is off screen.
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) {
      visible = entries[0].isIntersecting;
      logo.classList.toggle('il-off', !visible);
      ours().forEach(function (a) { visible ? a.play() : a.pause(); });
    }, { threshold: 0.05 }).observe(logo);
  }

  logo.addEventListener('click', intro);
  logo.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); intro(); }
  });

  window.ilLogoReplay = intro;
  intro();
})();
