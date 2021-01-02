#version 300 es
precision highp float;

in vec2 uv;
out vec4 fragColor;

uniform vec2 obstaclePosition;
uniform float obstacleRadius;
uniform float scale;
uniform vec2 resolution;
uniform sampler2D tex;

void main() {
    vec2 fragCoord = gl_FragCoord.xy;
    vec2 dir = fragCoord - 3.0 * vec2(0.5, 0.5) - obstaclePosition;
    float dist = length(dir);
    if (dist < obstacleRadius) {
        fragColor = vec4(0);
        return;
    }

    if (dist < obstacleRadius + 1.0) {
        fragColor = scale * texture(tex, (fragCoord + dir / dist * 2.0) / resolution);
        return;
    }

    fragColor = texture(tex, fragCoord / resolution);
}
