#version 300 es
precision highp float;

in vec2 uv;
out vec4 fragColor;

uniform vec2 texelSize;
uniform float dissipation;
uniform float dt;
uniform sampler2D velocityTexture;
uniform vec2 resolution;
uniform sampler2D quantityTexture;

float sampleXVelocity(vec2 pos) {
    vec2 cellIndex = vec2(pos.x, pos.y - 1.0);
    return texture(velocityTexture, cellIndex / (resolution + 1.0)).x;
}

float sampleYVelocity(vec2 pos) {
    vec2 cellIndex = vec2(pos.x - 1.0, pos.y);
    return texture(velocityTexture, cellIndex / (resolution + 1.0)).y;
}

vec2 getVelocity(vec2 st) {
    vec2 pos = st * resolution;
    return vec2(sampleXVelocity(pos), sampleYVelocity(pos));
}

void main() {
    // follow the velocity field "back in time"
    vec2 prevUV = uv - getVelocity(uv) * dt * texelSize;
    // interpolate value from previous location and write to the output fragment
    float decay = 1.0 + dissipation * dt;
    fragColor = texture(quantityTexture, prevUV) / decay;
}
