import { initRoleBuilder } from './pages/roleBuilder.js';

function onReady(fn){ document.readyState !== 'loading' ? fn() : document.addEventListener('DOMContentLoaded', fn); }

onReady(() => {
  const path = window.location.pathname;
  if (path.endsWith('/role-builder.html')) {
    initRoleBuilder();
  }
});
