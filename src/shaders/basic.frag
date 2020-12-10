#version 300 es
precision highp float;

in vec2 uv;
out vec4 fragColor;

uniform vec2 resolution;

void main() {
    vec2 st = gl_FragCoord.xy / resolution;
    fragColor = vec4(st, 0, 1);
}
