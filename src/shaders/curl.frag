#version 300 es
precision highp float;

in vec2 uv;
out vec4 fragColor;

uniform vec2 texelSize;
uniform sampler2D velocity;

void main() {
    float L = texture(velocity, uv - vec2(texelSize.x, 0)).y;
    float R = texture(velocity, uv + vec2(texelSize.x, 0)).y;
    float B = texture(velocity, uv - vec2(0, texelSize.y)).x;
    float T = texture(velocity, uv + vec2(0, texelSize.y)).x;
    vec2 C = texture(velocity, uv).xy;
    if (uv.x == 0.0) L = -C.x;
    if (uv.x == 1.0) R = -C.x;
    if (uv.y == 0.0) R = -C.y;
    if (uv.y == 1.0) B = -C.y;
    float vorticity = R - L - T + B;
    fragColor = vec4(0.5 * vorticity, 0, 0, 1);
}
