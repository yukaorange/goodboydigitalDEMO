uniform float time;
uniform float uXAspect;
uniform float uYAspect;
uniform sampler2D uTexture;
uniform sampler2D uVideo;

varying vec2 vUv;
varying float vDist;

void main() {
  vec2 newUv = vUv - vec2(0.5);
  newUv.x *= min(uXAspect, 1.);
  newUv.y *= min(uYAspect, 1.);
  newUv += 0.5;

  gl_FragColor = vec4(0.7, 0.7, 0.7, 0.99 * vDist);
}