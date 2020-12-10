#version 300 es
precision highp float;

in vec2 uv;
in vec2 coord;
out vec4 fragColor;

uniform vec2 texelSize;
uniform float dissipation;
uniform float dt;
uniform sampler2D velocityTexture;
uniform sampler2D quantityTexture;

void main() {
    // follow the velocity field "back in time"
    vec2 prevUV = uv - texture(velocityTexture, uv).xy * dt * texelSize;
    // interpolate value from previous location and write to the output fragment
    float decay = 1.0 + dissipation * dt;
    fragColor = texture(quantityTexture, prevUV) / decay;
}
