import ReactECharts from 'echarts-for-react';
import useWeather from '../hooks/useWeather';

const degToCardinal = (d = 0) => {
  const dirs = ['N','NNE','NE','ENE','E','ESE','SE','SSE','S','SSO','SO','OSO','O','ONO','NO','NNO'];
  return dirs[Math.round((d % 360) / 22.5) % 16];
};

function summary(speed, gust, dir){
  const c = degToCardinal(dir);
  const base = `El viento es de ${Math.round(speed)} km/h y proviene del ${c}.`;
  const range = `Hoy el viento alcanzará velocidades de entre ${Math.max(0, Math.round(speed-3))} y ${Math.round(speed+5)} km/h`;
  const gustTxt = `, con ráfagas de hasta ${Math.round(gust || speed+10)} km/h.`;
  return `${base} ${range}${gustTxt}`;
}

export default function Wind(){
  const wx = useWeather();
  const loading = !!wx.loading;

  const times = loading ? [] : wx.windSeries.times;
  const seriesSpeed = loading ? [] : wx.windSeries.speed;
  const seriesGust  = loading ? [] : wx.windSeries.gust;

  const option = {
    grid: { left: 40, right: 20, top: 30, bottom: 40 },
    tooltip: { trigger: 'axis' },
    xAxis: { type: 'category', data: times, boundaryGap: false },
    yAxis: { type: 'value', name: 'km/h' },
    series: [
      {
        name: 'Viento',
        type: 'line',
        smooth: true,
        data: seriesSpeed,
        areaStyle: { opacity: 0.15 },
        lineStyle: { width: 3 },
        symbol: 'none',
      },
      {
        name: 'Ráfagas',
        type: 'line',
        smooth: true,
        data: seriesGust,
        lineStyle: { width: 2, type: 'dashed' },
        symbol: 'none',
      },
    ]
  };

  return (
    <main className="container">
      <section className="card">
        <div className="card-head">
          <h2>VIENTO</h2>
          {!loading && <span className="chip">{Math.round(wx.windSpeed)} km/h {degToCardinal(wx.windDir)}</span>}
        </div>

        <div className="mini-chart">
          <ReactECharts option={option} style={{ height: 320 }} />
          <div className="legend">Línea sólida: viento • Línea punteada: ráfagas</div>
        </div>

        {!loading && (
          <>
            <h3>Resumen diario</h3>
            <p>{summary(wx.windSpeed, wx.gust, wx.windDir)}</p>

            <h3>Información</h3>
            <p className="muted">
              La velocidad del viento representa el promedio a 10 m de altura. Las <strong>ráfagas</strong> son picos
              breves superiores al promedio y pueden afectar la sensación térmica, la dispersión de contaminantes y
              la seguridad al aire libre.
            </p>
          </>
        )}
      </section>
    </main>
  );
}
