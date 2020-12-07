precision mediump float;

uniform vec2 resolution;
uniform float halfrdx;
uniform sampler2D w;

void main() {
    vec2 coord = gl_FragCoord.xy;

    // left, right, bottom, and top x samples
    vec4 wL = texture2D(w, (coord - vec2(1, 0)) / resolution);
    vec4 wR = texture2D(w, (coord + vec2(1, 0)) / resolution);
    vec4 wB = texture2D(w, (coord - vec2(0, 1)) / resolution);
    vec4 wT = texture2D(w, (coord + vec2(0, 1)) / resolution);

    gl_FragColor = vec4(halfrdx * ((wR.x - wL.x) + (wT.y - wB.y)));
}
