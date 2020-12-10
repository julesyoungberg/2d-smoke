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
uniform bool stagger;

float getWeight(vec2 c) {
    vec2 cUv = c / resolution;
    vec2 p = cUv - point;
    p.x *= aspectRatio;
    return exp(-dot(p, p) / radius);
}

void main() {
    vec2 coord = gl_FragCoord.xy;

    if (!stagger) {
        vec3 splat = getWeight(coord + 0.5) * color;
        vec3 base = texture(tex, uv).xyz;

        fragColor = vec4(base + splat, 1);
    } else {
        float xWeight = getWeight(coord + vec2(0, 0.5));
        float xVal = xWeight * color.x;

        float yWeight = getWeight(coord + vec2(0.5, 0));
        float yVal = yWeight * color.y;

        vec3 base = texture(tex, coord / (resolution + 1.0)).xyz;

        fragColor = vec4(base + vec3(xVal, yVal, 0), 1);
    }
}
