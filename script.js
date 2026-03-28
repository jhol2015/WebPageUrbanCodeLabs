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

  /* ---- TECH NEWS carousel ---- */
  var _allFeeds  = [], _curSource = 'all';
  var _curSlide  = 0,  _total = 0, _cols = 3;
  var _autoTimer = null;

  function _getCols() {
    return window.innerWidth <= 700 ? 1 : window.innerWidth <= 960 ? 2 : 3;
  }
  function _esc(s) {
    return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }
  function _hex2rgba(hex, a) {
    var r=parseInt(hex.slice(1,3),16), g=parseInt(hex.slice(3,5),16), b=parseInt(hex.slice(5,7),16);
    return 'rgba('+r+','+g+','+b+','+a+')';
  }

  function loadNews() {
    var el = document.getElementById('newsCarousel');
    var er = document.getElementById('newsError');
    if (!el) return;
    el.innerHTML = '<div class="news-loading"><div class="news-spinner"></div><span>Buscando notícias...</span></div>';
    if (er) er.style.display = 'none';

    fetch('/api/news')
      .then(function(r){ if(!r.ok) throw 0; return r.json(); })
      .then(function(d){
        if (!d.ok || !d.feeds || !d.feeds.length) throw 0;
        _allFeeds = d.feeds;
        buildCarousel('all');
        var u = document.getElementById('newsUpdate');
        if (u) {
          var t = new Date(d.ts);
          u.textContent = 'Atualizado ' + t.toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'});
        }
      })
      .catch(function(){
        if (el) el.innerHTML = '';
        if (er) er.style.display = 'block';
      });
  }

  function buildCarousel(source) {
    _curSource = source; _curSlide = 0; _cols = _getCols();
    var feeds = source === 'all' ? _allFeeds : _allFeeds.filter(function(f){ return f.source === source; });
    var items = [];
    feeds.forEach(function(f){ (f.items||[]).forEach(function(i){ items.push(Object.assign({},i,{source:f.source,color:f.color})); }); });

    var el = document.getElementById('newsCarousel');
    var dotsEl = document.getElementById('newsDots');
    if (!el) return;

    if (!items.length) {
      el.innerHTML = '<div class="news-loading"><span>Sem notícias no momento.</span></div>';
      if (dotsEl) dotsEl.innerHTML = '';
      return;
    }

    // paginate
    var pages = [];
    for (var i = 0; i < items.length; i += _cols) pages.push(items.slice(i, i+_cols));
    _total = pages.length;

    // build HTML
    var html = '<div class="news-slides-track">';
    pages.forEach(function(page, pi) {
      var colCount = Math.min(page.length, _cols);
      html += '<div class="news-slide" style="grid-template-columns:repeat('+colCount+',1fr)">';
      page.forEach(function(item) {
        var bc = _hex2rgba(item.color, 0.12);
        var bd = _hex2rgba(item.color, 0.28);
        html +=
          '<a class="news-card" href="'+_esc(item.link)+'" target="_blank" rel="noopener noreferrer">'+
            '<div class="news-card-top">'+
              '<span class="news-source-badge" style="color:'+item.color+';background:'+bc+';border-color:'+bd+'">'+_esc(item.source)+'</span>'+
              (item.pubDate ? '<span class="news-date">'+_esc(item.pubDate)+'</span>' : '')+
            '</div>'+
            '<div class="news-card-accent" style="background:'+item.color+'"></div>'+
            '<h3>'+_esc(item.title)+'</h3>'+
            (item.desc && item.desc.length > 5 ? '<p>'+_esc(item.desc)+'</p>' : '')+
            '<span class="news-card-cta" style="color:'+item.color+'">Ler '+
              '<svg width="10" height="10" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M3 8h10M9 4l4 4-4 4"/></svg>'+
            '</span>'+
          '</a>';
      });
      html += '</div>';
    });
    html += '</div>';
    el.innerHTML = html;

    // dots
    if (dotsEl) {
      dotsEl.innerHTML = pages.map(function(_,i){
        return '<button class="news-dot'+(i===0?' active':'')+'" data-i="'+i+'"></button>';
      }).join('');
      dotsEl.querySelectorAll('.news-dot').forEach(function(b){
        b.addEventListener('click', function(){ goSlide(+b.getAttribute('data-i')); });
      });
    }
    goSlide(0, true);
    startAuto();
  }

  function goSlide(n, instant) {
    _curSlide = Math.max(0, Math.min(n, _total-1));
    var track = document.querySelector('.news-slides-track');
    if (track) {
      var w = track.parentElement.offsetWidth;
      track.style.transition = instant ? 'none' : 'transform 0.4s cubic-bezier(0.25,0.46,0.45,0.94)';
      track.style.transform  = 'translateX(-' + (_curSlide * w) + 'px)';
    }
    document.querySelectorAll('.news-dot').forEach(function(d,i){ d.classList.toggle('active', i===_curSlide); });
    var prev = document.getElementById('newsPrev');
    var next = document.getElementById('newsNext');
    if (prev) prev.disabled = _curSlide === 0;
    if (next) next.disabled = _curSlide >= _total - 1;
  }

  function startAuto() {
    clearInterval(_autoTimer);
    _autoTimer = setInterval(function(){
      goSlide(_curSlide < _total-1 ? _curSlide+1 : 0);
    }, 7000);
  }

  // nav buttons
  var _prev = document.getElementById('newsPrev');
  var _next = document.getElementById('newsNext');
  if (_prev) _prev.addEventListener('click', function(){ goSlide(_curSlide-1); clearInterval(_autoTimer); startAuto(); });
  if (_next) _next.addEventListener('click', function(){ goSlide(_curSlide+1); clearInterval(_autoTimer); startAuto(); });

  // filters
  document.querySelectorAll('.news-filter').forEach(function(btn){
    btn.addEventListener('click', function(){
      document.querySelectorAll('.news-filter').forEach(function(b){ b.classList.remove('active'); });
      btn.classList.add('active');
      if (_allFeeds.length) buildCarousel(btn.getAttribute('data-source'));
    });
  });

  // resize
  var _resT;
  window.addEventListener('resize', function(){
    clearTimeout(_resT);
    _resT = setTimeout(function(){ if (_getCols()!==_cols && _allFeeds.length) buildCarousel(_curSource); }, 200);
  });

  // touch swipe
  var _tx = 0;
  document.addEventListener('touchstart', function(e){
    if (document.getElementById('newsCarousel').contains(e.target)) _tx = e.touches[0].clientX;
  },{passive:true});
  document.addEventListener('touchend', function(e){
    var c = document.getElementById('newsCarousel');
    if (!c || !c.contains(e.target)) return;
    var dx = e.changedTouches[0].clientX - _tx;
    if (Math.abs(dx) > 50) { goSlide(dx < 0 ? _curSlide+1 : _curSlide-1); clearInterval(_autoTimer); startAuto(); }
  },{passive:true});

  loadNews();

})();
