import React from 'react';
import { createRoot } from 'react-dom/client';
import { ShaderGradient, ShaderGradientCanvas } from 'shadergradient';
import { FlutedGlass } from '@paper-design/shaders-react';

const SHADER_GRADIENT_URL =
  'https://shadergradient.co/customize?animate=on&axesHelper=off&brightness=1.2&cAzimuthAngle=170&cDistance=4.41&cPolarAngle=70&cameraZoom=1&color1=%23ff7a5c&color2=%23ffa166&color3=%23ffffff&destination=onCanvas&embedMode=off&envPreset=city&format=gif&fov=45&frameRate=10&gizmoHelper=hide&grain=off&lightType=3d&loop=on&loopDuration=10&pixelDensity=1&positionX=0&positionY=0.9&positionZ=-0.3&range=enabled&rangeEnd=40&rangeStart=0&reflection=0.1&rotationX=45&rotationY=0&rotationZ=0&shader=defaults&toggleAxis=false&type=waterPlane&uAmplitude=0&uDensity=1.2&uFrequency=0&uSpeed=0.2&uStrength=3.4&uTime=0&wireframe=false&zoomOut=false';

const FLUTED_SOURCE = `data:image/svg+xml,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 720">
  <defs>
    <radialGradient id="warm" cx="58%" cy="22%" r="80%">
      <stop offset="0" stop-color="#fff2dc"/>
      <stop offset=".38" stop-color="#ff9b62"/>
      <stop offset=".68" stop-color="#0f1220"/>
      <stop offset="1" stop-color="#020308"/>
    </radialGradient>
    <linearGradient id="beam" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#ffffff" stop-opacity=".24"/>
      <stop offset=".45" stop-color="#ff7a5c" stop-opacity=".18"/>
      <stop offset="1" stop-color="#ffffff" stop-opacity=".05"/>
    </linearGradient>
  </defs>
  <rect width="1280" height="720" fill="url(#warm)"/>
  <path d="M-80 550 C 240 420 392 220 684 254 C 916 281 1020 146 1372 22" fill="none" stroke="url(#beam)" stroke-width="220" opacity=".62"/>
  <g fill="#ffffff" opacity=".52">
    <circle cx="118" cy="116" r="1.8"/>
    <circle cx="302" cy="88" r="1.2"/>
    <circle cx="512" cy="142" r="1.6"/>
    <circle cx="724" cy="76" r="1.4"/>
    <circle cx="1008" cy="124" r="1.7"/>
    <circle cx="1148" cy="252" r="1.1"/>
    <circle cx="438" cy="454" r="1.3"/>
    <circle cx="820" cy="500" r="1.5"/>
  </g>
</svg>
`)}`;

const fillLayer = {
  position: 'absolute',
  inset: 0,
  width: '100%',
  height: '100%',
};

function SiteShader() {
  return (
    <ShaderGradientCanvas
      pixelDensity={1}
      fov={45}
      style={fillLayer}
    >
      <ShaderGradient
        control="query"
        urlString={SHADER_GRADIENT_URL}
      />
    </ShaderGradientCanvas>
  );
}

function HeroFlutedGlass() {
  return (
    <FlutedGlass
      width="100%"
      height="100%"
      image={FLUTED_SOURCE}
      colorBack="#00000000"
      colorShadow="#000000"
      colorHighlight="#ffffff"
      size={0.5}
      shadows={0.25}
      highlights={0.1}
      shape="lines"
      angle={0}
      distortionShape="prism"
      distortion={0.5}
      shift={0}
      stretch={0}
      blur={0}
      edges={0.25}
      margin={0}
      grainMixer={0}
      grainOverlay={0}
      fit="cover"
      maxPixelCount={1920 * 1080}
      style={fillLayer}
    />
  );
}

const siteShaderRoot = document.getElementById('site-shader-root');
const flutedGlassRoot = document.getElementById('fluted-glass-root');

if (siteShaderRoot) {
  createRoot(siteShaderRoot).render(
    <React.StrictMode>
      <SiteShader />
    </React.StrictMode>
  );
}

if (flutedGlassRoot) {
  createRoot(flutedGlassRoot).render(
    <React.StrictMode>
      <HeroFlutedGlass />
    </React.StrictMode>
  );
}
