#version 300 es
precision highp float;

in vec2 uv;
out vec4 fragColor;

uniform sampler2D divergence;
uniform sampler2D pressure;
uniform sampler2D temperature;

void main() {
    float d = texture(divergence, uv).x;
    float p = texture(pressure, uv).x;
    float t = texture(temperature, uv).x;
    fragColor = vec4(d, p, t, 1);
}
