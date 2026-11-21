
export function initPWA() {
  const banner = document.getElementById('installBanner');
  const installButton = document.getElementById('installButton');
  const dismissButton = document.getElementById('dismissInstall');
  const iosInstructions = document.getElementById('iosInstructions');

  if (!banner || !installButton || !dismissButton) return;

  const DISMISS_KEY = 'star-dive-install-dismissed';
  const DISMISS_DAYS = 7;

  let deferredPrompt = null;

  const isStandalone =
    window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true;

  const isIOS =
    /iphone|ipad|ipod/i.test(window.navigator.userAgent) ||
    (
      window.navigator.platform === 'MacIntel' &&
      window.navigator.maxTouchPoints > 1
    );

  function wasDismissedRecently() {
    try {
      const dismissedAt = Number(
        localStorage.getItem(DISMISS_KEY) || 0
      );

      return dismissedAt > 0 &&
        Date.now() - dismissedAt <
          DISMISS_DAYS * 24 * 60 * 60 * 1000;
    } catch (error) {
      return false;
    }
  }

  function showBanner() {
    if (isStandalone || wasDismissedRecently()) return;
    banner.classList.add('visible');
  }

  function hideBanner() {
    banner.classList.remove('visible');
  }

  dismissButton.addEventListener('click', () => {
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now()));
    } catch (error) {}

    hideBanner();
  });

  if (isIOS && !isStandalone) {
    installButton.textContent = 'Cómo instalar';
    iosInstructions.classList.remove('visible');

    installButton.addEventListener('click', () => {
      iosInstructions.classList.toggle('visible');
    });

    showBanner();
  }

  window.addEventListener('beforeinstallprompt', event => {
    event.preventDefault();
    deferredPrompt = event;

    if (!isIOS) {
      installButton.textContent = 'Instalar aplicación';
      showBanner();
    }
  });

  installButton.addEventListener('click', async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    await deferredPrompt.userChoice;

    deferredPrompt = null;
    hideBanner();
  });

  window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
    hideBanner();
  });

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js')
        .then(registration =>
          console.log(
            'Star Dive: Service Worker registrado.',
            registration.scope
          )
        )
        .catch(error =>
          console.error(
            'Star Dive: error al registrar el Service Worker.',
            error
          )
        );
    });
  }
}
