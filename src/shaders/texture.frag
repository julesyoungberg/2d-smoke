#version 300 es
precision highp float;

in vec2 uv;
out vec4 fragColor;

uniform sampler2D tex;

void main() {
    vec3 v = texture(tex, uv).xyz;
    fragColor = vec4(v, 1);
}
