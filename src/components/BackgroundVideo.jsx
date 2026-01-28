import React from "react";

export default function BackgroundVideo({
  isNight = false,
  imgDay = "/img/dia.png",
  imgNight = "/img/noche.png",
  videoDay = "/video/dia.mp4",
  videoNight = "/video/noche.mp4",
}) {
  const img = isNight ? imgNight : imgDay;
  const vid = isNight ? videoNight : videoDay;

  return (
    <div className="wx-bg" aria-hidden="true">
      <video
        className="bg-video"
        autoPlay
        muted
        loop
        playsInline
        onError={(e) => { e.currentTarget.style.display = "none"; }}
      >
        <source src={vid} type="video/mp4" />
      </video>
      <img className="bg-image" src={img} alt="" />
      <div className="bg-overlay" />
    </div>
  );
}