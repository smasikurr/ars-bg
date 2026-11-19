function cr(e){let t=u,n=d,r=ue;return`<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Pipeline Shader — Exported</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body { width: 100%; height: 100%; overflow: hidden; background: #000; }
  canvas { display: block; width: 100%; height: 100%; }
  #text-canvas { position: absolute; top: 0; left: 0; z-index: 5; pointer-events: none; }
  .noise-overlay {
    position: fixed; top: 0; left: 0; width: 100%; height: 100%;
    background-size: 128px 128px; pointer-events: none; z-index: 10;
    mix-blend-mode: ${e.grainBlend}; opacity: ${e.grain/100*.6};
  }
</style>
</head>
<body>
<div style="position:relative; width:100%; height:100%;">
<canvas id="glCanvas"></canvas>
<canvas id="text-canvas"></canvas>
<div class="noise-overlay" id="noiseOverlay"></div>
</div>
<script id="vertex-shader" type="x-shader/x-vertex">${t}<\/script>
<script id="fragment-shader" type="x-shader/x-fragment">${n}<\/script>
<script>
(function() {
  const COLORS = ${e.colors};
  const FLOW_TYPE = ${e.flowType};
  const ZOOM = ${e.zoom} * 0.028 + 0.2;
  const FLOW_SPEED = ${e.speed} * 0.02;
  const LIQUID_STR = ${e.liquid} * 0.02;
  const MORPH = ${e.morph} / 100.0 * 3.0;
  const ROTATION = ${e.rotation} * (Math.PI / 180.0);
  const ART_ENABLE = ${+!!e.artEnable};
  const ART_TYPE = ${e.artType};
  const ART_SIZE = ${e.artSize};
  const ART_SHAPE = ${e.artShape};
  const ART_CONTRAST = ${e.artContrast};
  const ART_ASCII_ENABLE = ${e.asciiEnable};
  const ART_ASCII_MODE = '${e.asciiMode}';
  const ART_ASCII_SIZE = ${e.asciiSize};
  const ART_ASCII_SPACING = ${e.asciiSpacing};
  const ART_ASCII_FONT = ${e.asciiFont};
  const ART_ASCII_COLOR = '${e.asciiColor}';
  const ART_ASCII_BLEND = '${e.asciiBlend}';
  const ART_ASCII_DECAY = ${e.asciiDecay} / 1000.0;
  const ART_ASCII_RADIUS = ${e.asciiRadius};
  const ART_ASCII_SMOOTH = ${e.asciiSmooth} / 100.0;
  const ART_ASCII_GRAVITY = ${e.asciiGravity} / 10.0;
  const ART_ASCII_CHARSET = '${e.asciiCharset}';
  const ART_ASCII_CUSTOM = \`${e.asciiCustom.replace(/`/g,"\\`")}\`;
  const ART_ASCII_DITHER = '${e.asciiDither}';
  const GRAIN = ${e.grain};

  if (GRAIN > 0) {
    const nc = document.createElement('canvas'); nc.width = 256; nc.height = 256;
    const nctx = nc.getContext('2d');
    const img = nctx.createImageData(256, 256);
    for (let i = 0; i < img.data.length; i += 4) {
      const v = Math.random() * 255;
      img.data[i] = v; img.data[i+1] = v; img.data[i+2] = v; img.data[i+3] = 255;
    }
    nctx.putImageData(img, 0, 0);
    document.getElementById('noiseOverlay').style.backgroundImage = 'url(' + nc.toDataURL() + ')';
  }

  const canvas = document.getElementById('glCanvas');
  const gl = canvas.getContext('webgl', { preserveDrawingBuffer: true });

  