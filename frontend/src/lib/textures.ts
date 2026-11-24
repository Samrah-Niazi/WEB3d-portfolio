// Procedural textures as SVG data URIs, so there are no image files to ship.
const svg = (body: string, w: number, h: number) =>
  `url("data:image/svg+xml,${encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' width='${w}' height='${h}'>${body}</svg>`)}")`;

// Fine film grain laid over the dark scenes.
export const GRAIN = svg(
  "<filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix type='saturate' values='0'/></filter><rect width='100%' height='100%' filter='url(#n)' opacity='.55'/>",
  160,
  160,
);

// Long brush strokes as an alpha mask; the About page paints them in the palette's color.
export const BRUSH = svg(
  "<filter id='f' x='0' y='0' width='100%' height='100%'><feTurbulence type='turbulence' baseFrequency='0.004 0.02' numOctaves='5' seed='11' stitchTiles='stitch'/><feColorMatrix type='matrix' values='0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  1.7 0 0 0 -0.42'/></filter><rect width='100%' height='100%' filter='url(#f)'/>",
  1000,
  1000,
);
