/* ============================================================
   URBAN CODE LABS - script.js
   ============================================================ */

/* ---------- i18n (textos dinâmicos por idioma) ---------- */
var UCL_LANG = (document.documentElement.lang || 'pt').slice(0, 2).toLowerCase() === 'en' ? 'en' : 'pt';
var UCL_LOCALE = UCL_LANG === 'en' ? 'en-US' : 'pt-BR';
var UCL_T = {
  pt: {
    sending: 'Enviando...', sent: '✓ Mensagem Enviada!', send: 'Enviar Mensagem', errorSend: 'Não foi possível enviar. Tente novamente.',
    fillRequired: 'Preencha os campos obrigatórios: Nome, E-mail e Mensagem.',
    sentMsg: 'Recebemos sua mensagem. Retornaremos em breve.',
    errUnavailable: 'Nosso servidor de e-mail está indisponível no momento. Tente novamente em instantes ou fale com a gente pelo WhatsApp.',
    errRate: 'Você enviou muitas mensagens em pouco tempo. Aguarde alguns minutos e tente de novo.',
    errEmail: 'Confira o e-mail informado.',
    waCta: 'Falar pelo WhatsApp',
    waIntro: 'Olá! Vim pelo site da Urban Code Labs.', waName: 'Nome', waEmail: 'E-mail', waProject: 'Projeto', waMessage: 'Mensagem',
    newsRead: 'Ler', newsEmpty: 'Sem notícias no momento.', newsUpdated: 'Atualizado'
  },
  en: {
    sending: 'Sending...', sent: '✓ Message sent!', send: 'Send Message', errorSend: 'Could not send. Please try again.',
    fillRequired: 'Please fill in the required fields: Name, E-mail and Message.',
    sentMsg: 'We got your message. We will get back to you soon.',
    errUnavailable: 'Our e-mail server is unavailable right now. Try again in a moment or reach us on WhatsApp.',
    errRate: 'You have sent too many messages in a short time. Wait a few minutes and try again.',
    errEmail: 'Please check the e-mail address.',
    waCta: 'Chat on WhatsApp',
    waIntro: 'Hi! I came from the Urban Code Labs website.', waName: 'Name', waEmail: 'E-mail', waProject: 'Project', waMessage: 'Message',
    newsRead: 'Read', newsEmpty: 'No news at the moment.', newsUpdated: 'Updated'
  }
};
var UCL_L = UCL_T[UCL_LANG];

(function () {
  'use strict';

  /* ---------- TEMA ---------- */
  var html = document.documentElement;

  // carrega preferência salva ou usa preferência do sistema
  var savedTheme = localStorage.getItem('ucl-theme');
  if (savedTheme) {
    html.setAttribute('data-theme', savedTheme);
  } else {
    var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    html.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
  }

  var themeBtn = document.getElementById('themeToggle');
  if (themeBtn) {
    themeBtn.addEventListener('click', function () {
      var current = html.getAttribute('data-theme');
      var next = current === 'dark' ? 'light' : 'dark';
      // ativa classe de transição suave apenas durante a troca
      html.classList.add('theme-transitioning');
      html.setAttribute('data-theme', next);
      localStorage.setItem('ucl-theme', next);
      themeBtn.setAttribute('aria-label',
        next === 'dark' ? 'Alternar para modo claro' : 'Alternar para modo escuro'
      );
      setTimeout(function() { html.classList.remove('theme-transitioning'); }, 300);
    });
  }

  // ouvir mudança de preferência do sistema (se usuário não tiver escolha salva)
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function(e) {
    if (!localStorage.getItem('ucl-theme')) {
      html.setAttribute('data-theme', e.matches ? 'dark' : 'light');
    }
  });

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

  /* ---------- CONTACT FORM (envia e-mail via /api/contact; mensagens de status inline) ---------- */
  var form = document.getElementById('contactForm');
  if (form) {
    // elemento de status (criado uma vez, reaproveitado; anunciado por leitores de tela)
    function statusEl() {
      var el = form.querySelector('.form-status');
      if (!el) {
        el = document.createElement('div');
        el.className = 'form-status';
        el.setAttribute('role', 'status');
        el.setAttribute('aria-live', 'polite');
        form.appendChild(el);
      }
      return el;
    }
    function clearStatus() {
      var el = form.querySelector('.form-status');
      if (el) { el.className = 'form-status'; el.textContent = ''; }
    }
    // usa textContent/createElement (nunca innerHTML) -> sem risco de injeção
    function showStatus(kind, text, waHref) {
      var el = statusEl();
      el.className = 'form-status show is-' + kind;
      el.textContent = '';
      var span = document.createElement('span');
      span.textContent = text;
      el.appendChild(span);
      if (waHref) {
        el.appendChild(document.createTextNode(' '));
        var a = document.createElement('a');
        a.href = waHref;
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
        a.className = 'form-status-wa';
        a.textContent = UCL_L.waCta;
        el.appendChild(a);
      }
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();

      var nome     = form.nome.value.trim();
      var email    = form.email.value.trim();
      var mensagem = form.mensagem.value.trim();
      var tipoText = form.tipo && form.tipo.value ? form.tipo.options[form.tipo.selectedIndex].text : '';
      var website  = form.website ? form.website.value : ''; // honeypot

      clearStatus();
      if (!nome || !email || !mensagem) {
        showStatus('error', UCL_L.fillRequired);
        return;
      }

      var btn = form.querySelector('button[type="submit"]');
      btn.textContent = UCL_L.sending;
      btn.disabled = true;
      btn.style.opacity = '0.7';

      function resetBtn() {
        btn.disabled = false; btn.style.opacity = ''; btn.style.background = ''; btn.textContent = UCL_L.send;
      }
      function waLink() {
        var msg = UCL_L.waIntro + '\n\n'
          + '*' + UCL_L.waName + ':* ' + nome + '\n'
          + '*' + UCL_L.waEmail + ':* ' + email + '\n'
          + (tipoText ? '*' + UCL_L.waProject + ':* ' + tipoText + '\n' : '')
          + '*' + UCL_L.waMessage + ':* ' + mensagem;
        return 'https://wa.me/5562981972706?text=' + encodeURIComponent(msg);
      }

      fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome: nome, email: email, tipo: tipoText, mensagem: mensagem, website: website })
      }).then(function (r) {
        return r.json().then(function (d) { return { ok: r.ok, status: r.status, d: d }; })
                       .catch(function () { return { ok: r.ok, status: r.status, d: {} }; });
      }).then(function (res) {
        if (res.ok && res.d && res.d.ok) {
          // sucesso real
          btn.textContent = UCL_L.sent; btn.style.background = 'var(--green)'; btn.style.opacity = '1';
          showStatus('success', UCL_L.sentMsg);
          form.reset();
          setTimeout(resetBtn, 4000);
          return;
        }
        // falha -> reabilita o botão e mostra a mensagem certa
        resetBtn();
        var err = res.d && res.d.error;
        if (res.status === 429 || err === 'rate') {
          showStatus('error', UCL_L.errRate, waLink());
        } else if (err === 'email') {
          showStatus('error', UCL_L.errEmail);
        } else if (err === 'required') {
          showStatus('error', UCL_L.fillRequired);
        } else {
          // 502/503 (indisponível), 403, ou resposta inesperada
          showStatus('error', UCL_L.errUnavailable, waLink());
        }
      }).catch(function () {
        // erro de rede
        resetBtn();
        showStatus('error', UCL_L.errUnavailable, waLink());
      });
    });
  }

})();
/* ---- TECH NEWS - river infinito ---- */
(function () {
  var allFeeds = [], curSource = 'all';
  var river, wrap;
  var pos = 0, halfW = 0, paused = false, rafId = null;
  var SPEED = 0.5; // px por frame (~30px/s a 60fps)

  function esc(s) { return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
  // aceita apenas http/https - bloqueia javascript:, data: e outros esquemas perigosos no href
  function safeUrl(u) { return /^https?:\/\//i.test(String(u||'')) ? u : '#'; }
  function rgba(h, a) {
    var r=parseInt(h.slice(1,3),16), g=parseInt(h.slice(3,5),16), b=parseInt(h.slice(5,7),16);
    return 'rgba('+r+','+g+','+b+','+a+')';
  }

  function loadNews() {
    river = document.getElementById('newsRiver');
    wrap  = document.getElementById('newsRiverWrap');
    var err = document.getElementById('newsErr');
    if (!river) return;
    river.className = 'news-river';
    // skeleton - 8 cards fantasma
    var sk = '';
    for (var s = 0; s < 8; s++) {
      sk += '<div class="nc nc-skeleton"><div class="sk-badge"></div><div class="sk-line sk-title"></div><div class="sk-line sk-title sk-w80"></div><div class="sk-line sk-desc"></div><div class="sk-line sk-desc sk-w60"></div><div class="sk-line sk-desc sk-w70"></div></div><div class="nc-divider"></div>';
    }
    river.innerHTML = sk;
    if (err) err.style.display = 'none';

    // reutiliza fetch iniciado no <head> - sem esperar pelo JS
    var _f = window.__newsFetch || fetch('/api/news');
    window.__newsFetch = null;
    _f.then(function(r) { if (!r.ok) throw 0; return r.json(); })
      .then(function(d) {
        if (!d.ok || !d.feeds || !d.feeds.length) throw 0;
        allFeeds = d.feeds;
        buildRiver('all');
        // oculta filtros sem conteúdo
        var active = d.activeSources || [];
        document.querySelectorAll('.news-filter[data-source]').forEach(function(btn) {
          var src = btn.getAttribute('data-source');
          if (src === 'all' || src === 'br' || src === 'global') return;
          if (active.indexOf(src) === -1) btn.style.display = 'none';
        });

        var u = document.getElementById('newsUpdate');
        if (u) {
          var t = new Date(d.ts);
          u.textContent = UCL_L.newsUpdated + ' ' + t.toLocaleTimeString(UCL_LOCALE, {hour:'2-digit', minute:'2-digit'});
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

    var BR_SOURCES = ['Tecnoblog','Canaltech','TechTudo','Olhar Digital','StartupsBR'];
    var feeds = source === 'all'    ? allFeeds
              : source === 'br'     ? allFeeds.filter(function(f){ return BR_SOURCES.indexOf(f.source) !== -1; })
              : source === 'global' ? allFeeds.filter(function(f){ return BR_SOURCES.indexOf(f.source) === -1; })
              : allFeeds.filter(function(f){ return f.source === source; });
    var items = [];
    feeds.forEach(function(f) {
      (f.items || []).forEach(function(i) { items.push(Object.assign({}, i, {source: f.source, color: f.color})); });
    });

    if (!items.length) {
      river.className = 'news-river is-loading';
      river.innerHTML = '<div class="news-loading-state"><span>' + UCL_L.newsEmpty + '</span></div>';
      return;
    }

    // build card HTML
    function cardHTML(item) {
      var bc = rgba(item.color, 0.11), bd = rgba(item.color, 0.26);
      return '<a class="nc" href="'+esc(safeUrl(item.link))+'" target="_blank" rel="noopener noreferrer" draggable="false">' +
        '<div class="nc-top">' +
          '<span class="nc-badge" style="color:'+item.color+';background:'+bc+';border-color:'+bd+'">'+esc(item.source)+'</span>' +
          (item.pubDate ? '<span class="nc-date">'+esc(item.pubDate)+'</span>' : '') +
        '</div>' +
        '<div class="nc-line" style="background:'+item.color+'"></div>' +
        '<h3>'+esc(item.title)+'</h3>' +
        (item.desc && item.desc.length > 5 ? '<p>'+esc(item.desc)+'</p>' : '') +
        '<span class="nc-cta" style="color:'+item.color+'">'+UCL_L.newsRead+' ' +
          '<svg width="10" height="10" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M3 8h10M9 4l4 4-4 4"/></svg>' +
        '</span>' +
      '</a>';
    }
    var DIV = '<div class="nc-divider"></div>';

    // duplicate para loop seamless
    var set = items.map(cardHTML).join(DIV);
    var html = set + DIV + set;
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
  // delay binding - wrap pode não existir ainda no DOMContentLoaded
  document.addEventListener('mouseover', function(e) {
    var w = document.getElementById('newsRiverWrap');
    if (!w) return;
    if (!w._bound) {
      w._bound = true;
      w.addEventListener('mouseenter', function() { paused = true; });
      w.addEventListener('mouseleave', function() { paused = false; });
    }
  }, { once: true });

  // botão "Tentar novamente" (bind aqui - loadNews não é global; substitui onclick inline p/ CSP)
  var retryBtn = document.getElementById('newsRetry');
  if (retryBtn) retryBtn.addEventListener('click', loadNews);

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

/* ---- CARROSSEL DOS CARDS: passos com pausa (sleep) + arraste manual ---- */
(function () {
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var HOLD = 2600;  // ms parado entre uma passada e outra (o "sleep")
  var MOVE = 750;   // ms de deslizamento de cada passada

  function easeInOut(k) { return k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2; }

  function build(grid) {
    if (!grid || !grid.children.length) return;
    if (grid.parentNode && grid.parentNode.classList.contains('cards-marquee')) return;

    // garante todos os cards visíveis (sem depender do reveal por scroll)
    var originals = Array.prototype.slice.call(grid.children);
    originals.forEach(function (card) { card.classList.remove('reveal'); card.classList.add('visible'); });

    var wrap = document.createElement('div');
    wrap.className = 'cards-marquee';
    grid.parentNode.insertBefore(wrap, grid);
    wrap.appendChild(grid);
    grid.classList.add('is-marquee');

    var cs = getComputedStyle(grid);
    var gap = parseFloat(cs.columnGap || cs.gap) || 0;
    var step = originals[0].getBoundingClientRect().width + gap; // 1 passada = 1 card
    var period = originals.length * step;                        // loop seamless
    var containerW = wrap.clientWidth || 1000;

    // clona o conjunto até preencher o container mesmo no ponto mais deslocado
    var guard = 0;
    while (grid.scrollWidth < containerW + period + 60 && guard < 8) {
      originals.forEach(function (card) {
        var c = card.cloneNode(true);
        c.setAttribute('aria-hidden', 'true');
        grid.appendChild(c);
      });
      guard++;
    }

    var pos = 0; // translateX atual (<= 0)
    function wrapPos() { while (pos <= -period) pos += period; while (pos > 0) pos -= period; }
    function apply() { grid.style.transform = 'translateX(' + pos + 'px)'; }
    apply();

    // ---------- auto: passo + sleep (baseado em tempo acumulado, pausável) ----------
    var state = 'hold', holdMs = 0, moveMs = 0, from = 0, target = 0;
    var dragging = false, hovering = false, last = 0;
    function frame(t) {
      var dt = last ? Math.min(t - last, 50) : 0; last = t;
      var active = !dragging && !hovering && !reduce;
      if (active) {
        if (state === 'hold') {
          holdMs += dt;
          if (holdMs >= HOLD) { state = 'move'; moveMs = 0; from = pos; target = Math.round(pos / step) * step - step; }
        } else {
          moveMs += dt;
          var k = Math.min(1, moveMs / MOVE);
          pos = from + (target - from) * easeInOut(k);
          if (k >= 1) { pos = target; state = 'hold'; holdMs = 0; }
        }
        wrapPos(); apply();
      }
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);

    // ---------- pausa no hover ----------
    wrap.addEventListener('mouseenter', function () { hovering = true; });
    wrap.addEventListener('mouseleave', function () { hovering = false; state = 'hold'; holdMs = 0; });

    // ---------- arraste (mouse + touch via Pointer Events) ----------
    var startX = 0, startPos = 0, moved = false;
    wrap.addEventListener('pointerdown', function (e) {
      dragging = true; moved = false; startX = e.clientX; startPos = pos;
      wrap.classList.add('grabbing');
      try { wrap.setPointerCapture(e.pointerId); } catch (_) {}
    });
    wrap.addEventListener('pointermove', function (e) {
      if (!dragging) return;
      if (Math.abs(e.clientX - startX) > 6) moved = true;
      pos = startPos + (e.clientX - startX);
      while (pos <= -period) { pos += period; startPos += period; }
      while (pos > 0) { pos -= period; startPos -= period; }
      apply();
    });
    // se houve arraste, cancela o clique (não abre link acidentalmente)
    wrap.addEventListener('click', function (e) { if (moved) { e.preventDefault(); e.stopPropagation(); } }, true);
    function endDrag(e) {
      if (!dragging) return;
      dragging = false;
      wrap.classList.remove('grabbing');
      try { wrap.releasePointerCapture(e.pointerId); } catch (_) {}
      pos = Math.round(pos / step) * step; // encaixa no card mais próximo
      wrapPos(); apply();
      state = 'hold'; holdMs = 0;          // retoma o auto após novo sleep
    }
    wrap.addEventListener('pointerup', endDrag);
    wrap.addEventListener('pointercancel', endDrag);
  }

  function init() {
    var s = document.querySelector('#servicos .services-grid');
    var p = document.querySelector('#projetos .projects-grid');
    if (s) build(s);
    if (p) build(p);
  }
  // mede após as webfonts carregarem (evita emenda por mudança de largura)
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(init);
  else init();
})();

/* ---- BANNER DE IDIOMA POR GEOLOCALIZAÇÃO ----
   Fora do BR na página PT -> oferece inglês; BR na /en -> oferece português. */
(function () {
  var KEY = 'ucl-lang-banner';
  try { if (localStorage.getItem(KEY)) return; } catch (e) {}
  var lang = (document.documentElement.lang || 'pt').slice(0, 2).toLowerCase() === 'en' ? 'en' : 'pt';

  fetch('/api/geo').then(function (r) { return r.json(); }).then(function (d) {
    var country = ((d && d.country) || '').toUpperCase();
    if (!country) return;
    var suggest = null;
    if (lang === 'pt' && country !== 'BR') suggest = 'en';
    else if (lang === 'en' && country === 'BR') suggest = 'pt';
    if (suggest) show(suggest);
  }).catch(function () {});

  function show(target) {
    var c = target === 'en'
      ? { msg: 'This site is also available in English.', cta: 'View in English', href: '/en', close: 'Close' }
      : { msg: 'Este site também está disponível em português.', cta: 'Ver em Português', href: '/', close: 'Fechar' };
    var bar = document.createElement('div');
    bar.className = 'lang-banner';
    var msg = document.createElement('span'); msg.className = 'lang-banner-msg'; msg.textContent = c.msg;
    var cta = document.createElement('a'); cta.className = 'lang-banner-cta'; cta.href = c.href; cta.textContent = c.cta;
    var cls = document.createElement('button'); cls.className = 'lang-banner-close'; cls.type = 'button';
    cls.setAttribute('aria-label', c.close); cls.innerHTML = '&times;';
    bar.appendChild(msg); bar.appendChild(cta); bar.appendChild(cls);
    document.body.appendChild(bar);
    requestAnimationFrame(function () { bar.classList.add('show'); });
    function dismiss() { try { localStorage.setItem(KEY, '1'); } catch (e) {} bar.classList.remove('show'); setTimeout(function () { if (bar.parentNode) bar.remove(); }, 300); }
    cls.addEventListener('click', dismiss);
    cta.addEventListener('click', function () { try { localStorage.setItem(KEY, '1'); } catch (e) {} });
  }
})();
