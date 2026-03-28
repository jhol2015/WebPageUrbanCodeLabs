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

/* ---- TECH NEWS ---- */
(function(){
  var feeds=[], src='all', cur=0, total=0, cols=3, timer=null;

  function gcols(){ return window.innerWidth<=700?1:window.innerWidth<=960?2:3; }
  function esc(s){ return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
  function rgba(h,a){ var r=parseInt(h.slice(1,3),16),g=parseInt(h.slice(3,5),16),b=parseInt(h.slice(5,7),16); return 'rgba('+r+','+g+','+b+','+a+')'; }

  function loadNews(){
    var vp=document.getElementById('newsViewport');
    var tr=document.getElementById('newsTrack');
    var er=document.getElementById('newsErr');
    if(!tr) return;
    tr.style.transform='translateX(0)';
    tr.innerHTML='<div class="news-loading-state"><div class="news-spin"></div><span>Buscando notícias...</span></div>';
    if(er) er.style.display='none';
    fetch('/api/news')
      .then(function(r){ if(!r.ok) throw 0; return r.json(); })
      .then(function(d){
        if(!d.ok||!d.feeds||!d.feeds.length) throw 0;
        feeds=d.feeds;
        build('all');
        var u=document.getElementById('newsUpdate');
        if(u){ var t=new Date(d.ts); u.textContent='Atualizado '+t.toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'}); }
      })
      .catch(function(){
        if(tr) tr.innerHTML='';
        if(er) er.style.display='block';
      });
  }

  function build(source){
    src=source; cur=0; cols=gcols();
    var list=source==='all'?feeds:feeds.filter(function(f){return f.source===source;});
    var items=[];
    list.forEach(function(f){ (f.items||[]).forEach(function(i){ items.push(Object.assign({},i,{source:f.source,color:f.color})); }); });

    var tr=document.getElementById('newsTrack');
    var dt=document.getElementById('newsDots');
    if(!tr) return;

    if(!items.length){
      tr.innerHTML='<div class="news-loading-state"><span>Sem notícias no momento.</span></div>';
      if(dt) dt.innerHTML='';
      return;
    }

    var pages=[]; for(var i=0;i<items.length;i+=cols) pages.push(items.slice(i,i+cols));
    total=pages.length;

    var html='';
    pages.forEach(function(page){
      var c=Math.min(page.length,cols);
      html+='<div class="news-slide" style="grid-template-columns:repeat('+c+',1fr)">';
      page.forEach(function(item){
        var bc=rgba(item.color,0.12), bd=rgba(item.color,0.28);
        html+=
          '<a class="nc" href="'+esc(item.link)+'" target="_blank" rel="noopener noreferrer">'+
            '<div class="nc-top">'+
              '<span class="nc-badge" style="color:'+item.color+';background:'+bc+';border-color:'+bd+'">'+esc(item.source)+'</span>'+
              (item.pubDate?'<span class="nc-date">'+esc(item.pubDate)+'</span>':'')+
            '</div>'+
            '<div class="nc-line" style="background:'+item.color+'"></div>'+
            '<h3>'+esc(item.title)+'</h3>'+
            (item.desc&&item.desc.length>5?'<p>'+esc(item.desc)+'</p>':'')+
            '<span class="nc-cta" style="color:'+item.color+'">Ler <svg width="10" height="10" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M3 8h10M9 4l4 4-4 4"/></svg></span>'+
          '</a>';
      });
      html+='</div>';
    });
    tr.innerHTML=html;

    if(dt){
      dt.innerHTML=pages.map(function(_,i){ return '<button class="news-dot'+(i===0?' active':'')+'" data-i="'+i+'"></button>'; }).join('');
      dt.querySelectorAll('.news-dot').forEach(function(b){ b.addEventListener('click',function(){ go(+b.getAttribute('data-i')); clearInterval(timer); startAuto(); }); });
    }
    go(0,true);
    startAuto();
  }

  function go(n,instant){
    cur=Math.max(0,Math.min(n,total-1));
    var tr=document.getElementById('newsTrack');
    var vp=document.getElementById('newsViewport');
    if(tr&&vp){
      var w=vp.offsetWidth;
      tr.style.transition=instant?'none':'transform 0.38s cubic-bezier(0.25,0.46,0.45,0.94)';
      tr.style.transform='translateX(-'+(cur*w)+'px)';
    }
    document.querySelectorAll('.news-dot').forEach(function(d,i){ d.classList.toggle('active',i===cur); });
    var pv=document.getElementById('newsPrev'), nx=document.getElementById('newsNext');
    if(pv) pv.disabled=cur===0;
    if(nx) nx.disabled=cur>=total-1;
  }

  function startAuto(){ clearInterval(timer); timer=setInterval(function(){ go(cur<total-1?cur+1:0); },7000); }

  var pv=document.getElementById('newsPrev'), nx=document.getElementById('newsNext');
  if(pv) pv.addEventListener('click',function(){ go(cur-1); clearInterval(timer); startAuto(); });
  if(nx) nx.addEventListener('click',function(){ go(cur+1); clearInterval(timer); startAuto(); });

  document.querySelectorAll('.news-filter').forEach(function(b){
    b.addEventListener('click',function(){
      document.querySelectorAll('.news-filter').forEach(function(x){ x.classList.remove('active'); });
      b.classList.add('active');
      if(feeds.length) build(b.getAttribute('data-source'));
    });
  });

  var rt; window.addEventListener('resize',function(){ clearTimeout(rt); rt=setTimeout(function(){ if(gcols()!==cols&&feeds.length) build(src); },200); });

  var tx=0;
  document.addEventListener('touchstart',function(e){ var c=document.getElementById('newsViewport'); if(c&&c.contains(e.target)) tx=e.touches[0].clientX; },{passive:true});
  document.addEventListener('touchend',function(e){ var c=document.getElementById('newsViewport'); if(!c||!c.contains(e.target)) return; var dx=e.changedTouches[0].clientX-tx; if(Math.abs(dx)>50){ go(dx<0?cur+1:cur-1); clearInterval(timer); startAuto(); } },{passive:true});

  loadNews();
})();
