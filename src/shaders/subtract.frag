precision mediump float;

uniform vec2 resolution;
uniform float halfrdx;
uniform sampler2D pressureField;
uniform sampler2D velocityField;

void main() {
    vec2 coord = gl_FragCoord.xy;

    // left, right, bottom, and top x samples
    float pL = texture2D(pressureField, (coord - vec2(1, 0)) / resolution).x;
    float pR = texture2D(pressureField, (coord + vec2(1, 0)) / resolution).x;
    float pB = texture2D(pressureField, (coord - vec2(0, 1)) / resolution).x;
    float pT = texture2D(pressureField, (coord + vec2(0, 1)) / resolution).x;

    vec2 nextVelocity = texture2D(velocityField, coord / resolution).xy;
    nextVelocity -= halfrdx * vec2(pR - pL, pT - pB);

    gl_FragColor = vec4(nextVelocity.x, nextVelocity.y, 0, 1);
}
