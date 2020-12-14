#version 300 es
precision highp float;

in vec2 uv;
out vec4 fragColor;

uniform vec2 texelSize;
uniform sampler2D curlField;
uniform sampler2D velocityField;
uniform float vorticityConst;
uniform float dt;

void main() {
    float L = texture(curlField, uv - vec2(texelSize.x, 0)).x;
    float R = texture(curlField, uv + vec2(texelSize.x, 0)).x;
    float B = texture(curlField, uv - vec2(0, texelSize.y)).x;
    float T = texture(curlField, uv + vec2(0, texelSize.y)).x;
    float C = texture(curlField, uv).x;

    vec2 force = 0.5 * vec2(abs(T) - abs(B), abs(R) - abs(L));
    force /= length(force) + 0.0001;
    force *= vorticityConst * C;
    force.y *= -1.0;

    vec2 velocity = texture(velocityField, uv).xy;
    velocity += force * dt;
    velocity = clamp(velocity, vec2(-1000.0), vec2(1000.0));
    fragColor = vec4(velocity, 0, 1);
}
