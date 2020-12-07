#version 300 es
precision highp float;

out vec4 fragColor;

uniform vec2 resolution;
uniform float timeStep;
uniform sampler2D velocityTexture;

void main() {
    vec2 coord = gl_FragCoord.xy;
    vec2 uv = coord / resolution;
    
    vec3 velocity = texture(velocityTexture, uv).xyz;

    // velocity.y -= 9.0 * timeStep;

    fragColor = vec4(velocity, 1);
}
