const KEY = 'bdip_theme';

export function getTheme() {
  return localStorage.getItem(KEY) || 'light';
}

export function setTheme(theme) {
  localStorage.setItem(KEY, theme);
  if (theme === 'dark') {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
}

export function initTheme() {
  setTheme(getTheme());
}
