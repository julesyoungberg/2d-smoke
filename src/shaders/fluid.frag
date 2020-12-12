#version 300 es
precision highp float;

in vec2 uv;
out vec4 fragColor;

uniform sampler2D dye;
uniform sampler2D pressure;
uniform sampler2D temperature;
uniform sampler2D velocity;

void main() {
    vec3 color = texture(dye, uv).xyz;
    float p = texture(pressure, uv).x;
    float t = texture(temperature, uv).x;
    vec2 vel = texture(velocity, uv).xy;
    fragColor = vec4(color, 1);
}
