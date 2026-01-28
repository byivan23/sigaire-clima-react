import React, { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';

export default function NavBar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 2);
    onScroll();
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => (document.body.style.overflow = '');
  }, [open]);

  const links = [
    { to: '/', label: 'Inicio', end: true, type: 'route' },
    { href: '/#alerts', label: 'Alertas', type: 'anchor' },
    { href: '/#rain', label: 'Radar', type: 'anchor' },
    { href: '/#pollutants', label: 'Contaminantes', type: 'anchor' },
    { to: '/about', label: 'Acerca de nosotros', type: 'route' },
  ];

  const close = () => setOpen(false);

  return (
    <header className={`navbar ${scrolled ? 'navbar--scrolled' : ''}`}>
      <div className="navbar__inner">
        <a className="brand" href="/" aria-label="SIGAIRE – Inicio">
          <img src="/icons/logo-128.png" alt="" onError={(e)=> e.currentTarget.remove()} />
          <span>SIGAIRE</span>
        </a>

        <button
          className={`hamburger ${open ? 'is-active' : ''}`}
          aria-label="Abrir menú"
          aria-controls="mainmenu"
          aria-expanded={open}
          onClick={() => setOpen(v => !v)}
        >
          <span /><span /><span />
        </button>

        <nav id="mainmenu" className={`nav ${open ? 'nav--open' : ''}`} aria-label="Navegación principal">
          {links.map(l => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.end}
              className={({ isActive }) => `nav__link ${isActive ? 'is-active' : ''}`}
              onClick={close}
            >
              {l.label}
            </NavLink>
          ))}
        </nav>
      </div>
      <div className={`backdrop ${open ? 'backdrop--show' : ''}`} onClick={close} />
    </header>
  );
}