precision mediump float;

uniform vec2 resolution;
uniform float timeStep;
uniform sampler2D velocityTexture;
uniform sampler2D quantityTexture;

void main() {
    vec2 coord = gl_FragCoord.xy;
    vec2 scale = 1.0 / resolution;
    vec2 uv = coord / resolution;
    // follow the velocity field "back in time"
    vec2 prevCoord = coord - scale * texture2D(velocityTexture, uv).xy * timeStep;
    vec2 prevUV = prevCoord / resolution;
    // interpolate value from previous location and write to the output fragment
    gl_FragColor = texture2D(quantityTexture, prevUV);
}
