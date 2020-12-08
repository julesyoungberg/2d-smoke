#version 300 es
precision highp float;

out vec4 fragColor;

uniform vec2 resolution;
uniform float scale;
uniform sampler2D x;

vec4 fetchVal(vec2 coord) {
    return scale * texture(x, coord / resolution);
}

void main() {
    vec2 coord = gl_FragCoord.xy;

    if (coord.x == 0.0) {
        // left edge
        if (coord.y == 0.0 || coord.y == resolution.y - 1.0) {
            // left corners
            fragColor = vec4(0);
        } else {
            // left side
            fragColor = fetchVal(coord + vec2(1, 0));
        }
    } else if (coord.x == resolution.x - 1.0) {
        // right edge
        if (coord.y == 0.0 || coord.y == resolution.y - 1.0) {
            // right corners
            fragColor = vec4(0);
        } else {
            // right side
            fragColor = scale * texture(x, (coord - vec2(1, 0)) / resolution);
        }
    } else if (coord.y == 0.0) {
        // bottom edge
        fragColor = fetchVal(coord + vec2(0, 1));
    } else if (coord.y == resolution.y - 1.0) {
        // top edge
        fragColor = fetchVal(coord - vec2(0, 1));
    } else {
        // interior - return the input
        fragColor = texture(x, coord / resolution);
    }
}
