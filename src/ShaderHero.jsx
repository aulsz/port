import React from 'react';
import { createRoot } from 'react-dom/client';
import { ShaderGradient, ShaderGradientCanvas } from 'shadergradient';

const SHADER_GRADIENT_URL =
  'https://shadergradient.co/customize?animate=on&axesHelper=off&brightness=1.2&cAzimuthAngle=170&cDistance=4.41&cPolarAngle=70&cameraZoom=1&color1=%23ff7a5c&color2=%23ffa166&color3=%23ffffff&destination=onCanvas&embedMode=off&envPreset=city&format=gif&fov=45&frameRate=10&gizmoHelper=hide&grain=off&lightType=3d&loop=on&loopDuration=10&pixelDensity=1&positionX=0&positionY=0.9&positionZ=-0.3&range=enabled&rangeEnd=40&rangeStart=0&reflection=0.1&rotationX=45&rotationY=0&rotationZ=0&shader=defaults&toggleAxis=false&type=waterPlane&uAmplitude=0&uDensity=1.2&uFrequency=0&uSpeed=0.2&uStrength=3.4&uTime=0&wireframe=false&zoomOut=false';

function ShaderHero() {
  return (
    <ShaderGradientCanvas
      pixelDensity={1}
      fov={45}
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
      }}
    >
      <ShaderGradient
        control="query"
        urlString={SHADER_GRADIENT_URL}
      />
    </ShaderGradientCanvas>
  );
}

const rootElement = document.getElementById('shader-gradient-root');

if (rootElement) {
  createRoot(rootElement).render(
    <React.StrictMode>
      <ShaderHero />
    </React.StrictMode>
  );
}
