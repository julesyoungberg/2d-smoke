#version 300 es
precision highp float;

in vec2 uv;
out vec4 fragColor;

uniform vec2 resolution;
uniform float alpha;
uniform float rBeta;
uniform sampler2D x;
uniform sampler2D b;

void main() {
    vec2 coord = gl_FragCoord.xy;
    // left, right, bottom, and top x samples
    vec4 xL = texture(x, uv - (vec2(1, 0) / resolution));
    vec4 xR = texture(x, uv + (vec2(1, 0) / resolution));
    vec4 xB = texture(x, uv - (vec2(0, 1) / resolution));
    vec4 xT = texture(x, uv + (vec2(0, 1) / resolution));

    // b sample, from center
    vec4 bC = texture(b, uv);

    // evaluate jacobi iteration
    fragColor = (xL + xR + xB + xT + alpha * bC) * rBeta;
}
