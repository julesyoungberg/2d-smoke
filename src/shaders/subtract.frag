precision mediump float;

uniform float halfrdx;
uniform sampler2D pressureField;
uniform sampler2D veleocityField;

void main() {
    vec2 coord = gl_FragCoord.xy;

    // left, right, bottom, and top x samples
    float pL = texture2D(pressureField, coord - vec2(1, 0)).x;
    float pR = texture2D(pressureField, coord + vec2(1, 0)).x;
    float pB = texture2D(pressureField, coord - vec2(0, 1)).x;
    float pT = texture2D(pressureField, coord + vec2(0, 1)).x;

    vec2 nextVelocity = texture2D(veleocityField, coord).xy;
    nextVelocity -= halfrdx * vec2(pR - pL, pT - pB);
}
