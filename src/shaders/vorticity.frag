#version 300 es
precision highp float;

in vec2 uv;
out vec4 fragColor;

uniform vec2 resolution;
uniform vec2 texelSize;
uniform sampler2D curlField;
uniform sampler2D velocityField;
uniform float curl;
uniform float dt;

float sampleXVelocity(vec2 pos) {
    vec2 cellIndex = vec2(pos.x, pos.y - 1.0);
    return texture(velocityField, cellIndex / (resolution + 1.0)).x;
}

float sampleYVelocity(vec2 pos) {
    vec2 cellIndex = vec2(pos.x - 1.0, pos.y);
    return texture(velocityField, cellIndex / (resolution + 1.0)).y;
}

vec2 getVelocity(vec2 st) {
    vec2 pos = st * (resolution + 1.0);
    return vec2(sampleXVelocity(pos), sampleYVelocity(pos));
}

void main() {
    vec2 coord = gl_FragCoord.xy;

    float L = texture(curlField, (coord - vec2(1, 0)) / resolution).x;
    float R = texture(curlField, (coord + vec2(1, 0)) / resolution).x;
    float B = texture(curlField, (coord - vec2(0, 1)) / resolution).x;
    float T = texture(curlField, (coord + vec2(0, 1)) / resolution).x;
    float C = texture(curlField, coord / resolution).x;

    vec2 force = 0.5 * vec2(abs(T) - abs(B), abs(R) - abs(L));
    force /= length(force) + 0.0001;
    force *= curl * C;
    force.y *= -1.0;

    vec2 velocity = getVelocity(uv).xy;
    velocity += force * dt;
    velocity = min(max(velocity, -1000.0), 1000.0);
    fragColor = vec4(velocity, 0, 1);
}
