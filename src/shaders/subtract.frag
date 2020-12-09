#version 300 es
precision highp float;

in vec2 uv;
out vec4 fragColor;

uniform vec2 texelSize;
uniform sampler2D pressureField;
uniform sampler2D velocityField;

void main() {
    // left, right, bottom, and top x samples
    float pL = texture(pressureField, uv - vec2(texelSize.x, 0)).x;
    float pR = texture(pressureField, uv + vec2(texelSize.x, 0)).x;
    float pB = texture(pressureField, uv - vec2(0, texelSize.y)).x;
    float pT = texture(pressureField, uv + vec2(0, texelSize.y)).x;

    vec2 nextVelocity = texture(velocityField, uv).xy;
    nextVelocity -= vec2(pR - pL, pT - pB);

    fragColor = vec4(nextVelocity, 0, 1);
}
