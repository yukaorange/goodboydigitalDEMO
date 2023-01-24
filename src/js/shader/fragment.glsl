uniform float time;
uniform float uXAspect;
uniform float uYAspect;
uniform sampler2D uTexture;
uniform sampler2D uVideo;

varying vec2 vUv;

void main() {
  vec2 newUv = vUv - vec2(0.5);
  newUv.x *= min(uXAspect, 1.);
  newUv.y *= min(uYAspect, 1.);
  newUv += 0.5;
  // vec4 textureColor = texture2D(uTexture, vUv);
  // gl_FragColor = textureColor;
  vec4 image = texture2D(uVideo, newUv);
  gl_FragColor = image;
}