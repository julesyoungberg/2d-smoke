#version 300 es
precision highp float;

in vec2 uv;
out vec4 fragColor;

uniform vec2 texelSize;
uniform sampler2D w;

void main() {
    // left, right, bottom, and top x samples
    vec4 wL = texture(w, uv - vec2(texelSize.x, 0));
    vec4 wR = texture(w, uv + vec2(texelSize.x, 0));
    vec4 wB = texture(w, uv - vec2(0, texelSize.y));
    vec4 wT = texture(w, uv + vec2(0, texelSize.y));

    float divergence = 0.5 * (wR.x - wL.x + wT.y - wB.y);
    fragColor = vec4(divergence, 0, 0, 1);
}
