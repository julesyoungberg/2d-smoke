#version 300 es
precision highp float;

in vec2 uv;
out vec4 fragColor;

uniform vec2 resolution;
uniform float dt;
uniform sampler2D velocityTexture;

void main() {    
    vec3 velocity = texture(velocityTexture, uv).xyz;

    // velocity.y -= 9.0 * dt;

    fragColor = vec4(velocity, 1);
}
