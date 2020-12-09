#version 300 es
precision highp float;

in vec2 uv;
out vec4 fragColor;

uniform vec2 resolution;
uniform float halfrdx;
uniform sampler2D w;

void main() {
    // left, right, bottom, and top x samples
    vec4 wL = texture(w, uv - (vec2(1, 0) / resolution));
    vec4 wR = texture(w, uv + (vec2(1, 0) / resolution));
    vec4 wB = texture(w, uv - (vec2(0, 1) / resolution));
    vec4 wT = texture(w, uv + (vec2(0, 1) / resolution));

    fragColor = vec4(halfrdx * ((wR.x - wL.x) + (wT.y - wB.y)));
}
