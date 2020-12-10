#version 300 es
precision highp float;

in vec2 uv;
out vec4 fragColor;

uniform sampler2D tex;
uniform float value;

void main() {
    fragColor = value * texture(tex, uv);
}