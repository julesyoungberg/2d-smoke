#version 300 es
precision highp float;

in vec2 uv;
out vec4 fragColor;

uniform vec2 resolution;
uniform sampler2D velocity;

void main() {
    vec2 coord = gl_FragCoord.xy;
    vec2 base = texture(velocity, coord / (resolution + 1.0)).xy;

    float L = base.y;
    float R = texture(velocity, (coord + vec2(1, 0)) / (resolution + 1.0)).y;
    float B = base.x;
    float T = texture(velocity, (coord + vec2(0, 1)) / (resolution + 1.0)).x;

    float vorticity = R - L - T + B;
    fragColor = vec4(0.5 * vorticity, 0, 0, 1);
}
