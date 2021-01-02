#version 300 es
precision highp float;

in vec2 uv;
out vec4 fragColor;

uniform vec2 obstaclePosition;
uniform float obstacleRadius;
uniform bool renderObstacle;
uniform sampler2D dye;

void main() {
    if (renderObstacle) {
        vec2 fragCoord = gl_FragCoord.xy;
        vec2 dir = fragCoord - 3.0 * vec2(0.5, 0.5) - obstaclePosition;
        float dist = length(dir);
        if (dist < obstacleRadius) {
            fragColor = vec4(1.0);
            return;
        }
    }

    vec3 v = texture(dye, uv).xyz;
    fragColor = vec4(v, 1);
}
