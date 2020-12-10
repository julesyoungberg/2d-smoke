#version 300 es
precision highp float;

in vec2 uv;
out vec4 fragColor;

uniform vec2 texelSize;
uniform sampler2D w;

void main() {
    // left, right, bottom, and top x samples
    float L = texture(w, uv - vec2(texelSize.x, 0)).x;
    float R = texture(w, uv + vec2(texelSize.x, 0)).x;
    float B = texture(w, uv - vec2(0, texelSize.y)).y;
    float T = texture(w, uv + vec2(0, texelSize.y)).y;

    float divergence = 0.5 * (R - L + T - B);
    fragColor = vec4(divergence, 0, 0, 1);
}
