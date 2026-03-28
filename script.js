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

  /* ============================================================
     TECH NEWS — carrossel estilo Bloomberg
  ============================================================ */
  var _allFeeds   = [];
  var _curSource  = 'all';
  var _curSlide   = 0;
  var _totalSlides= 0;
  var _cols       = 3;
  var _autoTimer  = null;

  function _getCols() {
    return window.innerWidth <= 700 ? 1 : window.innerWidth <= 960 ? 2 : 3;
  }

  function esc(s) {
    return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  function loadNews() {
    var carousel = document.getElementById('newsCarousel');
    var err      = document.getElementById('newsError');
    if (!carousel) return;
    carousel.innerHTML = '<div class="news-loading"><div class="news-spinner"></div><span>Buscando notícias...</span></div>';
    if (err) err.style.display = 'none';

    fetch('/api/news')
      .then(function(r) { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(function(data) {
        if (!data.ok || !data.feeds || !data.feeds.length) throw new Error('empty');
        _allFeeds = data.feeds;
        buildCarousel(_curSource);
        buildTicker(data.feeds);
        var upd = document.getElementById('newsUpdate');
        if (upd) {
          var d = new Date(data.ts);
          upd.textContent = d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) + ' · ao vivo';
        }
      })
      .catch(function() {
        carousel.innerHTML = '';
        if (err) err.style.display = 'block';
      });
  }

  function buildTicker(feeds) {
    var track = document.getElementById('newsTicker');
    if (!track) return;
    var items = [];
    feeds.forEach(function(f) {
      (f.items || []).slice(0, 3).forEach(function(item) {
        items.push({ title: item.title, link: item.link });
      });
    });
    // duplicate for seamless loop
    var html = '';
    [items, items].forEach(function(arr) {
      arr.forEach(function(item) {
        html += '<a href="' + esc(item.link) + '" target="_blank" rel="noopener noreferrer">' + esc(item.title) + '</a>';
      });
    });
    track.innerHTML = html;
  }

  function buildCarousel(source) {
    _curSource = source;
    _curSlide  = 0;
    _cols      = _getCols();

    var feeds = source === 'all'
      ? _allFeeds
      : _allFeeds.filter(function(f) { return f.source === source; });

    var items = [];
    feeds.forEach(function(f) {
      (f.items || []).forEach(function(item) {
        items.push(Object.assign({}, item, { source: f.source, color: f.color }));
      });
    });

    var carousel = document.getElementById('newsCarousel');
    var dots     = document.getElementById('newsDots');
    if (!carousel) return;

    if (!items.length) {
      carousel.innerHTML = '<div class="news-loading"><span>Nenhuma notícia disponível.</span></div>';
      if (dots) dots.innerHTML = '';
      return;
    }

    // Split into slides of _cols items
    var slides = [];
    for (var i = 0; i < items.length; i += _cols) {
      slides.push(items.slice(i, i + _cols));
    }
    _totalSlides = slides.length;

    // Build slides HTML
    var html = '';
    slides.forEach(function(slide) {
      html += '<div class="news-slide" style="--cols:' + _cols + '">';
      slide.forEach(function(item) {
        var textColor = item.color;
        var bgColor   = hexAlpha(item.color, 0.12);
        var bdColor   = hexAlpha(item.color, 0.3);
        html +=
          '<a class="news-card" href="' + esc(item.link) + '" target="_blank" rel="noopener noreferrer">' +
            '<div class="news-card-top">' +
              '<span class="news-source-badge" style="color:' + textColor + ';background:' + bgColor + ';border:1px solid ' + bdColor + '">' + esc(item.source) + '</span>' +
              (item.pubDate ? '<span class="news-date">' + esc(item.pubDate) + '</span>' : '') +
            '</div>' +
            '<div class="news-card-accent" style="background:' + item.color + '"></div>' +
            '<h3>' + esc(item.title) + '</h3>' +
            (item.desc && item.desc.length > 5 ? '<p>' + esc(item.desc) + '</p>' : '') +
            '<span class="news-card-cta" style="color:' + item.color + '">Ler <svg width="10" height="10" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M3 8h10M9 4l4 4-4 4"/></svg></span>' +
          '</a>';
      });
      html += '</div>';
    });

    carousel.innerHTML = html;

    // Dots
    if (dots) {
      var dotsHtml = '';
      slides.forEach(function(_, i) {
        dotsHtml += '<button class="news-dot' + (i === 0 ? ' active' : '') + '" data-slide="' + i + '" aria-label="Slide ' + (i+1) + '"></button>';
      });
      dots.innerHTML = dotsHtml;
      dots.querySelectorAll('.news-dot').forEach(function(btn) {
        btn.addEventListener('click', function() { goToSlide(parseInt(btn.getAttribute('data-slide'))); });
      });
    }

    updateNav();
    startAuto();
  }

  function goToSlide(n) {
    _curSlide = Math.max(0, Math.min(n, _totalSlides - 1));
    var carousel = document.getElementById('newsCarousel');
    if (!carousel) return;
    var slideW = carousel.offsetWidth;
    carousel.scrollTo({ left: slideW * _curSlide, behavior: 'smooth' });
    // Update dots
    document.querySelectorAll('.news-dot').forEach(function(d, i) {
      d.classList.toggle('active', i === _curSlide);
    });
    updateNav();
    resetAuto();
  }

  function updateNav() {
    var prev = document.getElementById('newsPrev');
    var next = document.getElementById('newsNext');
    if (prev) prev.disabled = _curSlide === 0;
    if (next) next.disabled = _curSlide >= _totalSlides - 1;
  }

  function startAuto() {
    clearInterval(_autoTimer);
    _autoTimer = setInterval(function() {
      goToSlide(_curSlide < _totalSlides - 1 ? _curSlide + 1 : 0);
    }, 6000);
  }

  function resetAuto() {
    clearInterval(_autoTimer);
    startAuto();
  }

  function hexAlpha(hex, a) {
    var r = parseInt(hex.slice(1,3),16);
    var g = parseInt(hex.slice(3,5),16);
    var b = parseInt(hex.slice(5,7),16);
    return 'rgba('+r+','+g+','+b+','+a+')';
  }

  // Nav buttons
  var prevBtn = document.getElementById('newsPrev');
  var nextBtn = document.getElementById('newsNext');
  if (prevBtn) prevBtn.addEventListener('click', function() { goToSlide(_curSlide - 1); });
  if (nextBtn) nextBtn.addEventListener('click', function() { goToSlide(_curSlide + 1); });

  // Filters
  document.querySelectorAll('.news-filter').forEach(function(btn) {
    btn.addEventListener('click', function() {
      document.querySelectorAll('.news-filter').forEach(function(b) { b.classList.remove('active'); });
      btn.classList.add('active');
      if (_allFeeds.length) buildCarousel(btn.getAttribute('data-source'));
    });
  });

  // Rebuild on resize
  var _resizeTimer;
  window.addEventListener('resize', function() {
    clearTimeout(_resizeTimer);
    _resizeTimer = setTimeout(function() {
      if (_getCols() !== _cols && _allFeeds.length) buildCarousel(_curSource);
    }, 200);
  });

  // Touch swipe
  var _touchX = 0;
  document.addEventListener('touchstart', function(e) {
    var c = document.getElementById('newsCarousel');
    if (c && c.contains(e.target)) _touchX = e.touches[0].clientX;
  }, { passive: true });
  document.addEventListener('touchend', function(e) {
    var c = document.getElementById('newsCarousel');
    if (!c || !c.contains(e.target)) return;
    var dx = e.changedTouches[0].clientX - _touchX;
    if (Math.abs(dx) > 50) goToSlide(dx < 0 ? _curSlide + 1 : _curSlide - 1);
  }, { passive: true });

  loadNews();

})();
