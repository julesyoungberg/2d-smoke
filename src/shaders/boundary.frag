#version 300 es
precision highp float;

out vec4 fragColor;

uniform vec2 resolution;
uniform vec2 offset;
uniform float scale;
uniform sampler2D x;

void main() {
    vec2 coord = gl_FragCoord.xy;
    fragColor = scale * texture(x, coord + offset);
}
