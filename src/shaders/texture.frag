#version 300 es
precision highp float;

out vec4 fragColor;

uniform vec2 resolution;
uniform float time;
uniform sampler2D tex;

void main() {
    vec2 uv = gl_FragCoord.xy / resolution;
    vec3 v = texture(tex, uv).xyz;
    if (any(lessThan(v, vec3(0)))) {
        v = vec3(1, 0, 0);
    }

    fragColor = vec4(v, 1);
}
