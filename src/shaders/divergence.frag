precision mediump float;

uniform float halfrdx;
uniform sampler2D w;

void main() {
    vec2 coord = gl_FragCoord.xy;

    // left, right, bottom, and top x samples
    vec4 wL = texture2D(w, coord - vec2(1, 0));
    vec4 wR = texture2D(w, coord + vec2(1, 0));
    vec4 wB = texture2D(w, coord - vec2(0, 1));
    vec4 wT = texture2D(w, coord + vec2(0, 1));

    gl_FragColor = vec4(halfrdx * ((wR.x - wL.x) + (wT.y - wB.y)));
}
