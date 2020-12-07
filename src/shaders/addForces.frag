// #version 300 es
precision highp float;

uniform vec2 resolution;
uniform float timeStep;
uniform sampler2D velocityTexture;

void main() {
    vec2 coord = gl_FragCoord.xy;
    vec2 uv = coord / resolution;
    
    vec3 velocity = texture2D(velocityTexture, uv).xyz;

    // velocity.y -= 9.0 * timeStep;

    gl_FragColor = vec4(velocity, 1);
}
