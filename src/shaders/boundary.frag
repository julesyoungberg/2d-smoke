#version 300 es
precision highp float;

in vec2 uv;
in vec2 coord;
out vec4 fragColor;

uniform vec2 resolution;
uniform vec2 texelSize;
uniform float scale;
uniform sampler2D x;

vec4 fetchVal(vec2 c) {
    return scale * texture(x, c);
}

void main() {
    if (coord.x == 0.0) {
        // left edge
        if (coord.y == 0.0 || coord.y == resolution.y - 1.0) {
            // left corners
            fragColor = vec4(0);
        } else {
            // left side
            fragColor = fetchVal(coord + vec2(texelSize.x, 0));
        }
    } else if (coord.x == resolution.x - 1.0) {
        // right edge
        if (coord.y == 0.0 || coord.y == resolution.y - 1.0) {
            // right corners
            fragColor = vec4(0);
        } else {
            // right side
            fragColor = fetchVal(coord - vec2(texelSize.x, 0));
        }
    } else if (coord.y == 0.0) {
        // bottom edge
        fragColor = fetchVal(coord + vec2(0, texelSize.y));
    } else if (coord.y == resolution.y - 1.0) {
        // top edge
        fragColor = fetchVal(coord - vec2(0, texelSize.y));
    } else {
        // interior - return the input
        fragColor = texture(x, uv);
    }
}
