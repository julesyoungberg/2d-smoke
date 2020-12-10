#version 300 es

in vec4 position;
out vec2 uv;
out vec2 coord;

uniform vec2 resolution;

void main() {
    uv = position.xy * 0.5 + 0.5;
    coord = floor(uv * resolution);
    gl_Position = position;
}
