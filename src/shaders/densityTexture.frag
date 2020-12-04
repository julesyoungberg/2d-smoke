precision mediump float;

uniform vec2 resolution;
uniform float time;
uniform sampler2D densityTexture;

void main() {
    vec2 uv = gl_FragCoord.xy / resolution;
    float density = texture2D(densityTexture, uv).x;
    gl_FragColor = vec4(vec3(density), 1);
}
