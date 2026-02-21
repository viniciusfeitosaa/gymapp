(function () {
  var menuToggle = document.querySelector('.menu-toggle');
  var navMobile = document.querySelector('.nav-mobile');

  if (menuToggle && navMobile) {
    menuToggle.addEventListener('click', function () {
      navMobile.classList.toggle('is-open');
      menuToggle.setAttribute('aria-label', navMobile.classList.contains('is-open') ? 'Fechar menu' : 'Abrir menu');
    });

    navMobile.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        navMobile.classList.remove('is-open');
      });
    });
  }

  var heroTitle = document.querySelector('.hero-title');
  var heroSubtitle = document.querySelector('.hero-subtitle');
  var heroPrimaryCta = document.querySelector('.hero-actions .btn-primary');
  var heroSecondaryCta = document.querySelector('.hero-actions .btn-outline');
  var storageKey = 'gymcode_ab_hero_v1';

  if (heroTitle && heroSubtitle && heroPrimaryCta && heroSecondaryCta) {
    var variants = {
      a: {
        title: 'Organize seus alunos e treinos em um sistema feito para <span class="text-accent">personal trainers</span>',
        subtitle:
          'Centralize fichas, rotina e comunicação em um fluxo simples para atender melhor e ganhar tempo todos os dias.',
        primaryCta: 'Começar grátis',
        secondaryCta: 'Conhecer recursos'
      },
      b: {
        title: 'A plataforma para <span class="text-accent">personal trainers</span> que querem escalar com organização',
        subtitle:
          'Troque planilhas soltas por uma rotina profissional: crie fichas personalizadas, gerencie alunos e compartilhe treinos no WhatsApp em minutos.',
        primaryCta: 'Testar grátis agora',
        secondaryCta: 'Ver como funciona'
      }
    };

    var params = new URLSearchParams(window.location.search);
    var forced = params.get('ab');
    var saved = null;

    try {
      saved = localStorage.getItem(storageKey);
    } catch (err) {
      saved = null;
    }

    var variant = 'b';
    if (forced === 'a' || forced === 'b') {
      variant = forced;
    } else if (saved === 'a' || saved === 'b') {
      variant = saved;
    } else {
      variant = Math.random() < 0.5 ? 'a' : 'b';
    }

    try {
      localStorage.setItem(storageKey, variant);
    } catch (err) {
      // Ignore storage restrictions in private mode.
    }

    heroTitle.innerHTML = variants[variant].title;
    heroSubtitle.textContent = variants[variant].subtitle;
    heroPrimaryCta.textContent = variants[variant].primaryCta;
    heroSecondaryCta.textContent = variants[variant].secondaryCta;
    document.documentElement.setAttribute('data-hero-variant', variant);
  }
})();
