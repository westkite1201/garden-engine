export function composeSvg(params: {
  totalWidth: number;
  totalHeight: number;
  displayWidth: number;
  displayHeight: number;
  backgroundColor: string;
  borderRects: string;
  soilRects: string;
  growthRects: string;
  growthKeyframes: string;
  actorGroups: string;
  actorKeyframes: string;
  effectGroups: string;
  effectKeyframes: string;
}): string {
  const {
    totalWidth,
    totalHeight,
    displayWidth,
    displayHeight,
    backgroundColor,
    borderRects,
    soilRects,
    growthRects,
    growthKeyframes,
    actorGroups,
    actorKeyframes,
    effectGroups,
    effectKeyframes,
  } = params;

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${displayWidth}" height="${displayHeight}" viewBox="0 0 ${totalWidth} ${totalHeight}">
  <defs>
    <style>
  ${growthKeyframes}
  ${actorKeyframes}
  ${effectKeyframes}
    </style>
  </defs>
  <rect x="0" y="0" width="${totalWidth}" height="${totalHeight}" fill="${backgroundColor}"/>
  <g id="border-layer">
    ${borderRects}
  </g>
  <g id="soil-layer">
    ${soilRects}
  </g>
  <g id="growth-layer">
    ${growthRects}
  </g>
  ${effectGroups}
  <g id="actor-layer">
    ${actorGroups}
  </g>
</svg>`;
}
