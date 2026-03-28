/* ============================================================
   URBAN CODE LABS — script.js
   ============================================================ */

(function () {
  'use strict';

  /* ---------- NAV SCROLL ---------- */
  var navbar = document.getElementById('navbar');
  function onScroll() {
    if (window.scrollY > 40) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- HAMBURGER ---------- */
  var hamburger   = document.getElementById('hamburger');
  var mobileMenu  = document.getElementById('mobileMenu');

  hamburger.addEventListener('click', function () {
    var isOpen = mobileMenu.classList.toggle('open');
    hamburger.classList.toggle('open', isOpen);
    hamburger.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    mobileMenu.setAttribute('aria-hidden',  isOpen ? 'false' : 'true');
  });

  /* close on link click */
  mobileMenu.querySelectorAll('a').forEach(function (link) {
    link.addEventListener('click', function () {
      mobileMenu.classList.remove('open');
      hamburger.classList.remove('open');
      hamburger.setAttribute('aria-expanded', 'false');
      mobileMenu.setAttribute('aria-hidden', 'true');
    });
  });

  /* close on outside click */
  document.addEventListener('click', function (e) {
    if (!navbar.contains(e.target) && mobileMenu.classList.contains('open')) {
      mobileMenu.classList.remove('open');
      hamburger.classList.remove('open');
      hamburger.setAttribute('aria-expanded', 'false');
      mobileMenu.setAttribute('aria-hidden', 'true');
    }
  });

  /* ---------- SMOOTH SCROLL ---------- */
  document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
    anchor.addEventListener('click', function (e) {
      var id = anchor.getAttribute('href');
      if (id === '#') return;
      var target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      var offset = 76;
      var top = target.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top: top, behavior: 'smooth' });
    });
  });

  /* ---------- REVEAL ON SCROLL ---------- */
  var revealEls = document.querySelectorAll('.reveal');
  var revealObs = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        revealObs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.08, rootMargin: '0px 0px -36px 0px' });

  revealEls.forEach(function (el) { revealObs.observe(el); });

  /* ---------- ACTIVE NAV LINK ---------- */
  var sections  = document.querySelectorAll('section[id], div[id="home"]');
  var navAnchors = document.querySelectorAll('.nav-links a');

  window.addEventListener('scroll', function () {
    var scrollY = window.scrollY + 120;
    var current = '';
    sections.forEach(function (sec) {
      if (sec.offsetTop <= scrollY) current = sec.getAttribute('id');
    });
    navAnchors.forEach(function (a) {
      a.style.color = '';
      if (a.getAttribute('href') === '#' + current && !a.classList.contains('nav-cta')) {
        a.style.color = 'var(--text)';
      }
    });
  }, { passive: true });

  /* ---------- CONTACT FORM ---------- */
  var form = document.getElementById('contactForm');
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();

      var nome     = form.nome.value.trim();
      var email    = form.email.value.trim();
      var mensagem = form.mensagem.value.trim();
      var tipo     = form.tipo.value;

      if (!nome || !email || !mensagem) {
        alert('Por favor, preencha os campos obrigatórios: Nome, E-mail e Mensagem.');
        return;
      }

      var btn = form.querySelector('button[type="submit"]');
      btn.textContent = 'Enviando...';
      btn.disabled = true;
      btn.style.opacity = '0.7';

      /* Compose WhatsApp message */
      var msg = 'Olá! Vim pelo site da Urban Code Labs.\n\n'
        + '*Nome:* ' + nome + '\n'
        + '*E-mail:* ' + email + '\n'
        + (tipo ? '*Projeto:* ' + form.tipo.options[form.tipo.selectedIndex].text + '\n' : '')
        + '*Mensagem:* ' + mensagem;

      setTimeout(function () {
        btn.textContent = '✓ Mensagem Enviada!';
        btn.style.background = 'var(--green)';
        btn.style.opacity = '1';

        setTimeout(function () {
          window.open('https://wa.me/5562981972706?text=' + encodeURIComponent(msg), '_blank');
          btn.textContent = 'Enviar Mensagem';
          btn.disabled = false;
          btn.style.background = '';
          form.reset();
        }, 1600);
      }, 900);
    });
  }

})();
/* ---- TECH NEWS — river infinito ---- */
(function () {
  var allFeeds = [], curSource = 'all';
  var river, wrap;
  var pos = 0, halfW = 0, paused = false, rafId = null;
  var SPEED = 0.5; // px por frame (~30px/s a 60fps)

  function esc(s) { return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
  function rgba(h, a) {
    var r=parseInt(h.slice(1,3),16), g=parseInt(h.slice(3,5),16), b=parseInt(h.slice(5,7),16);
    return 'rgba('+r+','+g+','+b+','+a+')';
  }

  function loadNews() {
    river = document.getElementById('newsRiver');
    wrap  = document.getElementById('newsRiverWrap');
    var err = document.getElementById('newsErr');
    if (!river) return;
    river.className = 'news-river is-loading';
    river.innerHTML = '<div class="news-loading-state"><div class="news-spin"></div><span>Buscando notícias...</span></div>';
    if (err) err.style.display = 'none';

    fetch('/api/news')
      .then(function(r) { if (!r.ok) throw 0; return r.json(); })
      .then(function(d) {
        if (!d.ok || !d.feeds || !d.feeds.length) throw 0;
        allFeeds = d.feeds;
        buildRiver('all');
        var u = document.getElementById('newsUpdate');
        if (u) {
          var t = new Date(d.ts);
          u.textContent = 'Atualizado ' + t.toLocaleTimeString('pt-BR', {hour:'2-digit', minute:'2-digit'});
        }
      })
      .catch(function() {
        if (river) { river.className = 'news-river'; river.innerHTML = ''; }
        var err = document.getElementById('newsErr');
        if (err) err.style.display = 'block';
      });
  }

  function buildRiver(source) {
    curSource = source;
    river = document.getElementById('newsRiver');
    if (!river) return;

    var feeds = source === 'all' ? allFeeds : allFeeds.filter(function(f) { return f.source === source; });
    var items = [];
    feeds.forEach(function(f) {
      (f.items || []).forEach(function(i) { items.push(Object.assign({}, i, {source: f.source, color: f.color})); });
    });

    if (!items.length) {
      river.className = 'news-river is-loading';
      river.innerHTML = '<div class="news-loading-state"><span>Sem notícias no momento.</span></div>';
      return;
    }

    // build card HTML
    function cardHTML(item) {
      var bc = rgba(item.color, 0.11), bd = rgba(item.color, 0.26);
      return '<a class="nc" href="'+esc(item.link)+'" target="_blank" rel="noopener noreferrer" draggable="false">' +
        '<div class="nc-top">' +
          '<span class="nc-badge" style="color:'+item.color+';background:'+bc+';border-color:'+bd+'">'+esc(item.source)+'</span>' +
          (item.pubDate ? '<span class="nc-date">'+esc(item.pubDate)+'</span>' : '') +
        '</div>' +
        '<div class="nc-line" style="background:'+item.color+'"></div>' +
        '<h3>'+esc(item.title)+'</h3>' +
        (item.desc && item.desc.length > 5 ? '<p>'+esc(item.desc)+'</p>' : '') +
        '<span class="nc-cta" style="color:'+item.color+'">Ler ' +
          '<svg width="10" height="10" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M3 8h10M9 4l4 4-4 4"/></svg>' +
        '</span>' +
      '</a>';
    }

    // duplicate para loop seamless
    var html = items.map(cardHTML).join('') + items.map(cardHTML).join('');
    river.className = 'news-river';
    river.innerHTML = html;
    river.style.setProperty('--river-x', '0px');
    pos = 0;

    // medir metade (1 set de cards)
    requestAnimationFrame(function() {
      halfW = river.scrollWidth / 2;
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(tick);
    });
  }

  function tick() {
    if (!paused) {
      pos += SPEED;
      if (pos >= halfW) pos -= halfW; // reset seamless
      river.style.transform = 'translateX(-' + pos.toFixed(2) + 'px)';
    }
    rafId = requestAnimationFrame(tick);
  }

  // pause no hover
  if (wrap) {
    wrap.addEventListener('mouseenter', function() { paused = true; });
    wrap.addEventListener('mouseleave', function() { paused = false; });
  }
  // delay binding — wrap pode não existir ainda no DOMContentLoaded
  document.addEventListener('mouseover', function(e) {
    var w = document.getElementById('newsRiverWrap');
    if (!w) return;
    if (!w._bound) {
      w._bound = true;
      w.addEventListener('mouseenter', function() { paused = true; });
      w.addEventListener('mouseleave', function() { paused = false; });
    }
  }, { once: true });

  // filtros
  document.querySelectorAll('.news-filter').forEach(function(btn) {
    btn.addEventListener('click', function() {
      document.querySelectorAll('.news-filter').forEach(function(b) { b.classList.remove('active'); });
      btn.classList.add('active');
      if (allFeeds.length) buildRiver(btn.getAttribute('data-source'));
    });
  });

  loadNews();
})();
