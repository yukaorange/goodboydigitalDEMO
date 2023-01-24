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

  float dist = distance(newUv, vec2(0.5, 0.5));
  float circle = 1.0 - smoothstep(0.5, 1.0, dist);

  gl_FragColor = vec4(circle, circle, circle, 1.);
}