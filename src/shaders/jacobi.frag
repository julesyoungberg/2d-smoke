#version 300 es
precision highp float;

in vec2 uv;
out vec4 fragColor;

uniform vec2 texelSize;
uniform float alpha;
uniform float rBeta;
uniform sampler2D x;
uniform sampler2D b;

void main() {
    // left, right, bottom, and top x samples
    vec4 xL = texture(x, uv - vec2(texelSize.x, 0));
    vec4 xR = texture(x, uv + vec2(texelSize.x, 0));
    vec4 xB = texture(x, uv - vec2(0, texelSize.y));
    vec4 xT = texture(x, uv + vec2(0, texelSize.y));

    // b sample, from center
    vec4 bC = texture(b, uv);

    // evaluate jacobi iteration
    fragColor = (xL + xR + xB + xT + alpha * bC) * rBeta;
}
