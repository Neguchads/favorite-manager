// Estrela do ícone da extensão em SVG (mesma do public/icons), reutilizada no logo e nas imagens promocionais.
// Uso: <div data-star data-size="220"></div> e <script src="star.js"></script>
function starPath(cx, cy, outer, inner) {
  const pts = [];
  for (let i = 0; i < 10; i++) {
    const r = i % 2 === 0 ? outer : inner;
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    pts.push(`${(cx + r * Math.cos(a)).toFixed(2)},${(cy + r * Math.sin(a)).toFixed(2)}`);
  }
  return `M${pts.join('L')}Z`;
}

function starIconSvg(size) {
  return `
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 128 128">
  <defs>
    <linearGradient id="fm-bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#13233a"/>
      <stop offset="1" stop-color="#0b1626"/>
    </linearGradient>
    <linearGradient id="fm-star" x1="0.2" y1="0" x2="0.8" y2="1">
      <stop offset="0" stop-color="#5cb4ff"/>
      <stop offset="1" stop-color="#2584f0"/>
    </linearGradient>
  </defs>
  <rect x="3" y="3" width="122" height="122" rx="26" fill="url(#fm-bg)" stroke="#2a4466" stroke-width="2.5"/>
  <path d="${starPath(64, 67, 46, 20)}" fill="url(#fm-star)" stroke="url(#fm-star)" stroke-width="9" stroke-linejoin="round"/>
</svg>`;
}

document.querySelectorAll('[data-star]').forEach((el) => {
  el.innerHTML = starIconSvg(Number(el.getAttribute('data-size') || 128));
});
