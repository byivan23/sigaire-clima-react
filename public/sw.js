/* eslint-env serviceworker */
/* global clients */

const ICON  = "/img/icons/icon-192.png";   // asegúrate de que existan
const BADGE = "/img/icons/badge-72.png";

/* Instala y toma control sin esperar a que cierren pestañas viejas */
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

/* Mostrar notificaciones push */
self.addEventListener("push", (event) => {
  let data = {};
  try {
    if (event.data) {
      try {
        data = event.data.json(); // payload JSON {title, body, tag, url, ...}
      } catch {
        data = { title: "SIGAIRE", body: event.data.text() }; // texto plano
      }
    }
  } catch {
    data = { title: "SIGAIRE", body: "Nuevo aviso" };
  }

  const title = data.title || "SIGAIRE · Aviso";
  const options = {
    body: data.body || "Nuevo aviso de clima/aire",
    icon: ICON,
    badge: BADGE,
    tag: data.tag || "sigaire",
    data: data.url || "/",            // URL al tocar la notificación
    requireInteraction: !!data.requireInteraction,
    actions: Array.isArray(data.actions) ? data.actions : []
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

/* Click en la notificación: enfocar pestaña existente o abrir nueva */
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const targetPath = event.notification.data || "/";
  const targetURL = new URL(targetPath, self.location.origin).href;

  event.waitUntil((async () => {
    const allClients = await clients.matchAll({ type: "window", includeUncontrolled: true });

    // Si hay una pestaña abierta, navegar/focar
    for (const client of allClients) {
      try {
        if ("navigate" in client) await client.navigate(targetURL);
        if ("focus" in client)    return client.focus();
      } catch {/* continuar */}
    }

    // Si no hay, abrir una nueva
    if (clients.openWindow) return clients.openWindow(targetURL);
  })());
});

/* Si el navegador rota la suscripción, avisa a la app para que se re-suscriba */
self.addEventListener("pushsubscriptionchange", async () => {
  const clientList = await clients.matchAll({ type: "window", includeUncontrolled: true });
  for (const client of clientList) {
    // La app puede escuchar este mensaje y llamar enablePush() de nuevo
    client.postMessage({ type: "PUSH_SUBSCRIPTION_CHANGED" });
  }
});