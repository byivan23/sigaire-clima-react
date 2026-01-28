import React from "react";

export default function About() {
  const justify = { textAlign: "justify", textWrap: "pretty" };

  return (
    <>
      {/* Fondo global para esta página debajo de todo el contenido */}
      <div
        aria-hidden
        style={{
          position: "fixed",
          inset: 0,
          background: "linear-gradient(180deg,#e7f2ff 0%, #ffffff 48%, #ffffff 100%)",
          zIndex: 0,
          pointerEvents: "none",
        }}
      />

      {/* Contenido – permanece arriba del fondo */}
      <main className="container" style={{ maxWidth: 1100, position: "relative", zIndex: 1 }}>
        {/* Encabezado */}
        <article className="shape-rect">
          <h1 style={{ margin: 0 }}>Acerca de SIGAIRE</h1>
          <p className="muted" style={{ marginTop: 4, ...justify }}>
            <strong>SIGAIRE</strong>: Sistema Inteligente de Gestión Autónoma de la Calidad del Aire
            es una aplicación web responsiva desarrollada en el Tecnológico de Estudios Superiores de
            San Felipe Progreso. Su objetivo es acercar indicadores ambientales claros y accionables
            para la comunidad académica y la población en general.
          </p>
        </article>

        {/* Propósito y Alcance */}
        <section className="grid" style={{ gridTemplateColumns: "repeat(2, 1fr)", gap: 16 }}>
          <article className="shape-rect">
            <h3>Propósito</h3>
            <p style={justify}>
              Brindar información ambiental local, confiable y actualizada para apoyar la toma de
              decisiones cotidianas (salud, movilidad, actividades al aire libre) y fomentar la
              educación ambiental.
            </p>
          </article>
          <article className="shape-rect">
            <h3>Alcance</h3>
            <p style={justify}>
              Visualización de <strong>calidad del aire (AQI)</strong>, <strong>índice UV</strong>,
              <strong> viento</strong>, <strong>presión atmosférica</strong> y un
              <strong> radar de precipitación</strong> con mapas interactivos.
            </p>
          </article>
        </section>

        {/* Grupo y Colaboradores */}
        <section className="grid" style={{ gridTemplateColumns: "repeat(2, 1fr)", gap: 16 }}>
          <article className="shape-rect">
            <h3>GRUPO DE TRABAJO</h3>
            <ul style={{ margin: 0, paddingLeft: 18 }}>
              <li>MTRA. NORMA ELSA REYES PIÑA</li>
              <li>DR. JESUS ALBERTO GARCIA ROJAS</li>
              <li>DR. OCTAVIO CATARINO AGUILAR</li>
            </ul>
          </article>

          <article className="shape-rect">
            <h3>COLABORADORES</h3>
            <ul style={{ margin: 0, paddingLeft: 18 }}>
              <li>P.I.I IVAN DAVID GARCÍA</li>
              <li>I.I. MARIANA — VISIÓN ARTIFICIAL</li>
              <li>I.I. EDUARDO — ARQUITECTURA DE ROBOT MÓVIL</li>
              <li>I.I. LIZETH JOSE ÁNGELES — VISIÓN ARTIFICIAL</li>
            </ul>
          </article>
        </section>

        {/* Características */}
        <article className="shape-rect">
          <h3>Características clave</h3>
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            <li>Tarjetas visuales y gráficos de fácil lectura en cualquier dispositivo.</li>
            <li>Mapa de precipitación con vista rápida y enlace a detalle.</li>
            <li>Consejos de salud y uso según humedad e índice UV.</li>
            <li>Navegación tipo pill con accesos a radar, contaminantes y alertas.</li>
            <li>Base técnica preparada para notificaciones por correo.</li>
          </ul>
        </article>

        {/* Fuentes y Tecnologías */}
        <section className="grid" style={{ gridTemplateColumns: "repeat(2, 1fr)", gap: 16 }}>
          <article className="shape-rect">
            <h3>Fuentes de datos</h3>
            <ul style={{ margin: 0, paddingLeft: 18 }}>
              <li><strong>Tomorrow.io</strong></li>
              <li><strong>OpenStreetMap + Leaflet</strong></li>
            </ul>
    
          </article>
          <article className="shape-rect">
            <h3>Tecnologías</h3>
            <ul style={{ margin: 0, paddingLeft: 18 }}>
              <li>Frontend: React + Vite, diseño responsive propio.</li>
              <li>Gráficos: ECharts y componentes personalizados.</li>
              <li>Mapas: Leaflet.</li>
              <li>Despliegue: Vercel.</li>
              <li>Correo transaccional: SendGrid.</li>
            </ul>
          </article>
        </section>

        {/* Compromisos */}
        <section className="grid" style={{ gridTemplateColumns: "repeat(2, 1fr)", gap: 16 }}>
          <article className="shape-rect">
            <h3>Privacidad</h3>
            <p style={justify}>
              SIGAIRE no almacena datos personales sensibles. Las solicitudes a proveedores externos
              se realizan conforme a sus políticas. Pronto publicaremos nuestro aviso de privacidad.
            </p>
          </article>
          <article className="shape-rect">
            <h3>Accesibilidad</h3>
            <p style={justify}>
              Mantenemos contraste adecuado, semántica HTML y navegación por teclado. Si detectas
              barreras, háznoslo saber para corregirlas.
            </p>
          </article>
        </section>

        {/* Contacto */}
        <article className="shape-rect">
          <h3>Contacto</h3>
          <p style={justify}>
            Para dudas, sugerencias o colaboración:{" "}
            <a href="mailto:contacto@sigaire.edu.mx">contacto@sigaire.edu.mx</a>
          </p>
        </article>

        {/* Agradecimientos */}
        <article className="shape-rect">
          <h3>Agradecimientos</h3>
          <p className="muted" style={justify}>
            A la comunidad del TESFTP de San Felipe Progreso y a los proyectos Tomorrow.io, OpenStreetMap
            y Leaflet por sus herramientas abiertas y documentación.
          </p>
        </article>
      </main>
    </>
  );
}