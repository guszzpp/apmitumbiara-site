// APMI — tema claro/escuro, com preferência persistente e detecção do sistema.
(function () {
  'use strict';
  var storageKey = 'apmi-theme';
  var preference = null;
  var systemTheme = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;

  try {
    var stored = window.localStorage.getItem(storageKey);
    if (stored === 'light' || stored === 'dark') preference = stored;
  } catch (error) {
    // Navegadores podem bloquear o armazenamento; a alternância segue disponível.
  }

  function activeTheme() {
    return preference || (systemTheme && systemTheme.matches ? 'dark' : 'light');
  }

  function applyTheme() {
    var mode = activeTheme();
    document.documentElement.setAttribute('data-theme', mode);

    var themeColor = document.querySelector('meta[name="theme-color"]');
    if (themeColor) themeColor.setAttribute('content', mode === 'dark' ? '#111c2a' : '#0d2744');

    document.querySelectorAll('[data-theme-toggle]').forEach(function (button) {
      var next = mode === 'dark' ? 'claro' : 'escuro';
      button.textContent = mode === 'dark' ? '☀' : '☾';
      button.setAttribute('aria-label', 'Ativar modo ' + next);
      button.setAttribute('title', 'Ativar modo ' + next);
      button.setAttribute('aria-pressed', String(mode === 'dark'));
    });
  }

  // Executa no <head>, antes da folha de estilos, para evitar a troca visível na abertura.
  applyTheme();

  document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('[data-theme-toggle]').forEach(function (button) {
      button.addEventListener('click', function () {
        preference = activeTheme() === 'dark' ? 'light' : 'dark';
        try { window.localStorage.setItem(storageKey, preference); } catch (error) {}
        applyTheme();
      });
    });
    applyTheme();
  });

  if (systemTheme) {
    var onSystemChange = function () { if (!preference) applyTheme(); };
    if (systemTheme.addEventListener) systemTheme.addEventListener('change', onSystemChange);
    else if (systemTheme.addListener) systemTheme.addListener(onSystemChange);
  }

  window.addEventListener('storage', function (event) {
    if (event.key !== storageKey) return;
    preference = event.newValue === 'light' || event.newValue === 'dark' ? event.newValue : null;
    applyTheme();
  });
})();
