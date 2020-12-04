precision mediump float;

uniform vec2 resolution;
uniform float time;
uniform sampler2D velocityTexture;

void main() {
    vec2 uv = gl_FragCoord.xy / resolution;
    vec2 velocity = texture2D(velocityTexture, uv).xy;
    gl_FragColor = vec4(velocity.x, velocity.y, 0, 1);
}
