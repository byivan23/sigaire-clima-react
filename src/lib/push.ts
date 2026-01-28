/// <reference types="vite/client" />
// src/lib/push.ts

// Mantiene el nombre exacto en minúsculas para coincidir con el archivo EmailPrompt.jsx
export const PUSH_FLAG = "sigaire_push_enabled";
export const EVT_PUSH_ON  = "sigaire:push-enabled";
export const EVT_PUSH_OFF = "sigaire:push-disabled";

export async function registerSW(): Promise<ServiceWorkerRegistration> {
  if (!("serviceWorker" in navigator)) {
    throw new Error("SW no soportado");
  }
  // evita caches viejos del SW
  const reg = await navigator.serviceWorker.register("/sw.js", {
    scope: "/",
    updateViaCache: "none",
  });
  return reg;
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const output = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; ++i) output[i] = raw.charCodeAt(i);
  return output;
}

function getVapidPublicKey(): string {
  const key = (import.meta as any)?.env?.VITE_VAPID_PUBLIC_KEY as string | undefined;
  if (!key || typeof key !== "string" || !key.trim()) {
    throw new Error("VITE_VAPID_PUBLIC_KEY no está definida. Revisa tus variables de entorno.");
  }
  return key.trim();
}

function markEnabled() {
  try {
    localStorage.setItem(PUSH_FLAG, "1");
    window.dispatchEvent(new CustomEvent(EVT_PUSH_ON));
  } catch {
    /* ignore */
  }
}

function markDisabled() {
  try {
    localStorage.removeItem(PUSH_FLAG);
    window.dispatchEvent(new CustomEvent(EVT_PUSH_OFF));
  } catch {
    /* ignore */
  }
}

/** Indica rápido si el usuario ya activó push (para ocultar el banner en el primer render). */
export function isPushEnabled(): boolean {
  try {
    if (localStorage.getItem(PUSH_FLAG) === "1") return true;
    return typeof Notification !== "undefined" && Notification.permission === "granted";
  } catch {
    return false;
  }
}

/**
 * Verifica de forma asíncrona el estado real (consulta al SW/PushManager).
 */
export async function getPushState(): Promise<boolean> {
  try {
    if (!("serviceWorker" in navigator)) {
      return localStorage.getItem(PUSH_FLAG) === "1";
    }
    if (typeof Notification === "undefined" || Notification.permission !== "granted") {
      return localStorage.getItem(PUSH_FLAG) === "1";
    }
    const reg = await navigator.serviceWorker.getRegistration();
    const sub = await reg?.pushManager.getSubscription();
    return !!sub || localStorage.getItem(PUSH_FLAG) === "1";
  } catch {
    return localStorage.getItem(PUSH_FLAG) === "1";
  }
}

/**
 * Esto es importante: activa Push + guarda suscripción en el backend y
 * dispara 2 notificaciones: una local inmediata y una push real desde el servidor.
 * Además, persistimos una bandera en localStorage y emitimos un evento para que el UI
 * oculte el banner de suscripción de inmediato.
 */
export async function enablePush() {
  if (!("Notification" in window)) {
    throw new Error("Notifications no soportadas");
  }
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
    throw new Error("Push no soportado en este navegador");
  }

  const permission =
    Notification.permission === "granted" ? "granted" : await Notification.requestPermission();
  if (permission !== "granted") throw new Error("Permiso denegado");

  // Registrar SW
  const reg = await registerSW();

  // Obtener/crear suscripción
  const existing = await reg.pushManager.getSubscription();
  const appServerKey = urlBase64ToUint8Array(getVapidPublicKey());
  const sub =
    existing ||
    (await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: appServerKey,
    }));

  // Marca en localStorage y emite evento para ocultar el banner YA
  markEnabled();

  // Metadata opcional (lat/lon si el usuario acepta geolocalización)
  let meta: Record<string, unknown> = {};
  try {
    const pos = await new Promise<GeolocationPosition>((res, rej) =>
      navigator.geolocation.getCurrentPosition(res, rej, { timeout: 8000 })
    );
    meta = { lat: pos.coords.latitude, lon: pos.coords.longitude };
  } catch {
    // sin geoloc está bien
  }

  // Guardar en backend
  await fetch("/api/push/subscribe", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ ...sub.toJSON(), meta }),
  });

  // Notificación local inmediata (feedback al usuario)
  try {
    reg.showNotification("SIGAIRE", {
      body: "✅ Notificaciones activadas",
      tag: "welcome",
      icon: "/icons/icon-192.png",
      badge: "/icons/badge-72.png",
      data: "/", // URL al tocar la notificación
    });
  } catch {
    /* algunos navegadores no permiten showNotification aquí */
  }

  // Y además, dispara una push real desde tu API (prueba end-to-end)
  try {
    await fetch("/api/push/send", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        title: "SIGAIRE",
        body: "🚀 Suscripción confirmada",
        tag: "suscripcion",
        url: "/",
      }),
    });
  } catch {
    /* si falla el envío remoto, la local ya dio feedback */
  }

  return sub;
}

export async function disablePush() {
  const reg = await navigator.serviceWorker.getRegistration();
  const sub = reg && (await reg.pushManager.getSubscription());
  if (sub) {
    await fetch("/api/push/unsubscribe", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ endpoint: sub.endpoint }),
    });
    await sub.unsubscribe();
  }
  // 🔕 Limpia la marca y avisa al UI para re-mostrar el banner si fuera necesario
  markDisabled();
}