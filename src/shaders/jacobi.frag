precision mediump float;

uniform vec2 resolution;
uniform float alpha;
uniform float rBeta;
uniform sampler2D x;
uniform sampler2D b;

void main() {
    vec2 coord = gl_FragCoord.xy;
    // left, right, bottom, and top x samples
    vec4 xL = texture2D(x, (coord - vec2(1, 0)) / resolution);
    vec4 xR = texture2D(x, (coord + vec2(1, 0)) / resolution);
    vec4 xB = texture2D(x, (coord - vec2(0, 1)) / resolution);
    vec4 xT = texture2D(x, (coord + vec2(0, 1)) / resolution);

    // b sample, from center
    vec4 bC = texture2D(b, coord / resolution);

    // evaluate jacobi iteration
    gl_FragColor = (xL + xR + xB + xT + alpha * bC) * rBeta;
}
