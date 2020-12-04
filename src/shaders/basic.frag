precision mediump float;

uniform vec2 resolution;
uniform float time;
uniform sampler2D velocityTexture;

void main() {
    vec2 uv = gl_FragCoord.xy / resolution;
    vec4 velocity = texture2D(velocityTexture, uv);
    gl_FragColor = velocity;
}
