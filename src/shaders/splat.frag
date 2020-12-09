#version 300 es
precision highp float;

in vec2 uv;
out vec4 fragColor;

uniform vec2 resolution;
uniform sampler2D tex;
uniform float aspectRatio;
uniform vec3 color;
uniform vec2 point;
uniform float radius;

void main() {
    vec2 p = uv - point;
    p.x *= aspectRatio;

    vec3 splat = exp(-dot(p, p) / radius) * color;
    vec3 base = texture(tex, uv).xyz;

    fragColor = vec4(base + splat, 1);
}
