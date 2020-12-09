#version 300 es
precision highp float;

in vec2 uv;
in vec2 coord;
out vec4 fragColor;

uniform vec2 resolution;
uniform float timeStep;
uniform sampler2D velocityTexture;
uniform sampler2D quantityTexture;

void main() {
    vec2 scale = 1.0 / resolution;
    // follow the velocity field "back in time"
    vec2 prevCoord = coord - scale * texture(velocityTexture, uv).xy * timeStep;
    vec2 prevUV = prevCoord / resolution;
    // interpolate value from previous location and write to the output fragment
    fragColor = texture(quantityTexture, prevUV);
}
