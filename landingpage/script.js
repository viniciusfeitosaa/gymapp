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
})();
