// Reutiliza el video/overlay del home en todas las vistas detalle
import BackgroundVideo from "./BackgroundVideo";
import useWeather from "../hooks/useWeather";

export default function DetailShell({ children, maxWidth = 1100 }) {
  const wx = useWeather();
  return (
    <>
      <BackgroundVideo isNight={!!wx.isNight} />
      <main className="container" style={{ maxWidth }}>
        {children}
      </main>
    </>
  );
}