import React from "react";

export default class ErrorBoundary extends React.Component {
  constructor(props){
    super(props);
    this.state = { hasError: false, err: null };
  }
  static getDerivedStateFromError(err){ return { hasError: true, err }; }
  componentDidCatch(err, info){ console.error("ErrorBoundary:", err, info); }

  render(){
    if (this.state.hasError) {
      return (
        <main className="container">
          <div className="info-card" style={{ color:"#b91c1c" }}>
            <h3>Ocurrió un error al cargar esta sección</h3>
            <p style={{whiteSpace:"pre-wrap"}}>
              {String(this.state.err?.message || this.state.err || "Error desconocido")}
            </p>
          </div>
        </main>
      );
    }
    return this.props.children;
  }
}