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

  /* -------- TECH NEWS -------- */
  var currentSource = 'all';
  var allFeeds = [];

  function loadNews() {
    var grid = document.getElementById('newsGrid');
    var err  = document.getElementById('newsError');
    if (!grid) return;

    grid.innerHTML = '<div class="news-loading"><div class="news-spinner"></div><span>Buscando notícias...</span></div>';
    if (err) err.style.display = 'none';

    fetch('/api/news')
      .then(function(r) { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(function(data) {
        if (!data.ok || !data.feeds.length) throw new Error('empty');
        allFeeds = data.feeds;
        renderNews(currentSource);

        var upd = document.getElementById('newsUpdate');
        if (upd) {
          var d = new Date(data.ts);
          upd.textContent = 'Atualizado às ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        }
      })
      .catch(function() {
        grid.innerHTML = '';
        if (err) err.style.display = 'block';
      });
  }

  function renderNews(source) {
    var grid = document.getElementById('newsGrid');
    if (!grid) return;
    grid.innerHTML = '';

    var feeds = source === 'all' ? allFeeds : allFeeds.filter(function(f) { return f.source === source; });
    var items = [];
    feeds.forEach(function(f) {
      f.items.forEach(function(item) {
        items.push(Object.assign({}, item, { source: f.source, color: f.color }));
      });
    });

    if (!items.length) {
      grid.innerHTML = '<div class="news-loading"><span>Nenhuma notícia encontrada.</span></div>';
      return;
    }

    var limit = source === 'all' ? 12 : 6;
    items.slice(0, limit).forEach(function(item) {
      var card = document.createElement('a');
      card.className = 'news-card';
      card.href = item.link;
      card.target = '_blank';
      card.rel = 'noopener noreferrer';

      var opacity = '0.15';
      var borderOpacity = '0.3';
      var colorStyle = 'color:' + item.color + ';background:' + hexAlpha(item.color, 0.1) + ';border-color:' + hexAlpha(item.color, 0.25);

      card.innerHTML =
        '<div class="news-card-header">' +
          '<span class="news-source-badge" style="' + colorStyle + '">' + esc(item.source) + '</span>' +
          (item.pubDate ? '<span class="news-date">' + esc(item.pubDate) + '</span>' : '') +
        '</div>' +
        '<h3>' + esc(item.title) + '</h3>' +
        (item.desc && item.desc.length > 5 ? '<p>' + esc(item.desc) + '</p>' : '') +
        '<span class="news-card-link">Ler artigo <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M3 8h10M9 4l4 4-4 4"/></svg></span>';

      grid.appendChild(card);
    });
  }

  function hexAlpha(hex, a) {
    var r = parseInt(hex.slice(1,3),16);
    var g = parseInt(hex.slice(3,5),16);
    var b = parseInt(hex.slice(5,7),16);
    return 'rgba(' + r + ',' + g + ',' + b + ',' + a + ')';
  }

  function esc(str) {
    return String(str || '')
      .replace(/&/g,'&amp;')
      .replace(/</g,'&lt;')
      .replace(/>/g,'&gt;')
      .replace(/"/g,'&quot;');
  }

  /* filters */
  document.querySelectorAll('.news-filter').forEach(function(btn) {
    btn.addEventListener('click', function() {
      document.querySelectorAll('.news-filter').forEach(function(b) { b.classList.remove('active'); });
      btn.classList.add('active');
      currentSource = btn.getAttribute('data-source');
      if (allFeeds.length) {
        renderNews(currentSource);
      } else {
        loadNews();
      }
    });
  });

  loadNews();
