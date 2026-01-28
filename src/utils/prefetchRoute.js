// src/utils/prefetchRoute.js
export default function prefetchRoute(path) {
    switch (path) {
      case "/about":       import("../pages/About.jsx"); break;
      case "/air":         import("../pages/AirDetail.jsx"); break;
      case "/wind":        import("../pages/WindDetail.jsx"); break;
      case "/uv":          import("../pages/UvDetail.jsx"); break;
      case "/humidity":    import("../pages/HumidityDetail.jsx"); break;
      case "/pollutants":  import("../pages/PollutantsDetail.jsx"); break;
      case "/precip":      import("../pages/PrecipDetail.jsx"); break;
      case "/pressure":    import("../pages/PressureDetail.jsx"); break;
      default: break; // Home ya cargada
    }
  }