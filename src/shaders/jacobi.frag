precision mediump float;

uniform vec2 resolution;
uniform float alpha;
uniform float rBeta;
uniform sampler2D x;
uniform sampler2D b;

void main() {
    vec2 coord = gl_FragCoord.xy;
    // left, right, bottom, and top x samples
    float xL = texture2D(x, coord - vec2(1, 0)).x;
    float xR = texture2D(x, coord + vec2(1, 0)).x;
    float xB = texture2D(x, coord - vec2(0, 1)).x;
    float xT = texture2D(x, coord + vec2(0, 1)).x;

    // b sample, from center
    float bC = texture2D(b, coord).x;

    // evaluate jacobi iteration
    gl_FragColor = vec4((xL + xR + xB + xT + alpha * bC) * rBeta);
}
