#version 300 es
precision highp float;

in vec2 uv;
out vec4 fragColor;

uniform vec2 resolution;
uniform float halfrdx;
uniform sampler2D pressureField;
uniform sampler2D velocityField;

void main() {
    // left, right, bottom, and top x samples
    float pL = texture(pressureField, uv - (vec2(1, 0) / resolution)).x;
    float pR = texture(pressureField, uv + (vec2(1, 0) / resolution)).x;
    float pB = texture(pressureField, uv - (vec2(0, 1) / resolution)).x;
    float pT = texture(pressureField, uv + (vec2(0, 1) / resolution)).x;

    vec2 nextVelocity = texture(velocityField, uv).xy;
    nextVelocity -= halfrdx * vec2(pR - pL, pT - pB);

    fragColor = vec4(nextVelocity.x, nextVelocity.y, 0, 1);
}
