import { useEffect, useState, useCallback } from "react";
import { enablePush, isPushEnabled, getPushState } from "../lib/push";

export default function EmailPrompt() {
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    // 1) chequeo rápido
    setVisible(!isPushEnabled());
    // 2) confirmación asíncrona (cuando el SW ya está listo)
    getPushState().then((ok) => setVisible(!ok));

    const onEnabled = () => setVisible(false);
    const onDisabled = () => setVisible(true);
    const onStorage = (e) => { if (e.key === "sigaire_push_enabled") getPushState().then(ok => setVisible(!ok)); };

    window.addEventListener("sigaire:push-enabled", onEnabled);
    window.addEventListener("sigaire:push-disabled", onDisabled);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener("sigaire:push-enabled", onEnabled);
      window.removeEventListener("sigaire:push-disabled", onDisabled);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  const onClick = useCallback(async () => {
    if (busy) return;
    setBusy(true); setErr("");
    try {
      await enablePush();
      setVisible(false); // oculta inmediatamente
    } catch (e) {
      setErr(e?.message || "No se pudo activar las notificaciones.");
    } finally {
      setBusy(false);
    }
  }, [busy]);

  if (!visible) return null;

  return (
    <div className="info-card prompt-push" role="region" aria-live="polite"
      style={{ display:"flex", gap:8, flexWrap:"wrap", padding:10, borderRadius:12,
               background:"rgba(255,255,255,.85)", border:"1px solid rgba(0,0,0,.08)", alignItems:"center" }}>
      <span role="img" aria-label="campana" style={{ fontSize: 20 }}>🔔</span>
      <strong style={{ marginRight: 8 }}>¿Quieres recibir notificaciones?</strong>
      <button onClick={onClick} disabled={busy} className="btn primary"
        style={{ padding:"8px 12px", borderRadius:10, border:"1px solid rgba(0,0,0,.1)",
                 background:"#6d8bff", color:"#fff", fontWeight:700, cursor: busy?"default":"pointer" }}
        aria-busy={busy}>
        {busy ? "Activando…" : "Sí, quiero recibir notificaciones"}
      </button>
      {err && <p className="error" role="alert" style={{ margin:0, color:"#b00020", fontWeight:600 }}>{err}</p>}
    </div>
  );
}