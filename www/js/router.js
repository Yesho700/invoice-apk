/**
 * router.js — Hash-based SPA router.
 * Maps URL hashes like #/dashboard, #/invoices/new to page modules.
 */

const Router = (() => {
  let routes = {};
  let currentCleanup = null;

  function register(routeMap) {
    routes = routeMap;
  }

  function navigate(hash) {
    window.location.hash = hash;
  }

  function match(pattern, path) {
    const patternParts = pattern.split('/').filter(Boolean);
    const pathParts = path.split('/').filter(Boolean);
    if (patternParts.length !== pathParts.length) return null;

    const params = {};
    for (let i = 0; i < patternParts.length; i++) {
      if (patternParts[i].startsWith(':')) {
        params[patternParts[i].slice(1)] = decodeURIComponent(pathParts[i]);
      } else if (patternParts[i] !== pathParts[i]) {
        return null;
      }
    }
    return params;
  }

  function handleRoute() {
    if (typeof currentCleanup === 'function') {
      try { currentCleanup(); } catch {}
      currentCleanup = null;
    }

    const hash = window.location.hash || '#/dashboard';
    const path = hash.replace(/^#/, '');

    for (const [pattern, handler] of Object.entries(routes)) {
      const params = match(pattern, path);
      if (params !== null) {
        const root = document.getElementById('app-root');
        if (root) {
          root.innerHTML = '<div class="page-loading">Loading...</div>';
        }
        Promise.resolve(handler(params)).then(cleanup => {
          if (typeof cleanup === 'function') currentCleanup = cleanup;
        });
        return;
      }
    }

    const root = document.getElementById('app-root');
    if (root) root.innerHTML = `<div style="text-align:center;padding:60px;color:#94a3b8"><h2>Page not found</h2><a href="#/dashboard" style="color:#5be016">Go to Dashboard</a></div>`;
  }

  function start() {
    window.addEventListener('hashchange', handleRoute);
    if (!window.location.hash || window.location.hash === '#') {
      window.location.hash = '#/dashboard';
    } else {
      handleRoute();
    }
  }

  return { register, navigate, start };
})();
