#version 300 es
precision highp float;

in vec2 uv;
out vec4 fragColor;

uniform vec2 texelSize;
uniform sampler2D w;

void main() {
    vec2 lUv = uv - vec2(texelSize.x, 0);
    vec2 rUv = uv + vec2(texelSize.x, 0);
    vec2 bUv = uv - vec2(0, texelSize.y);
    vec2 tUv = uv + vec2(0, texelSize.y);

    // left, right, bottom, and top x samples
    float L = texture(w, uv - vec2(texelSize.x, 0)).x;
    float R = texture(w, uv + vec2(texelSize.x, 0)).x;
    float B = texture(w, uv - vec2(0, texelSize.y)).y;
    float T = texture(w, uv + vec2(0, texelSize.y)).y;

    vec2 C = texture(w, uv).xy;
    if (lUv.x < 0.0) L = -C.x;
    if (rUv.x > 1.0) R = -C.x;
    if (tUv.y > 1.0) R = -C.y;
    if (bUv.y < 0.0) B = -C.y; 

    float divergence = 0.5 * (R - L + T - B);
    fragColor = vec4(divergence, 0, 0, 1);
}
