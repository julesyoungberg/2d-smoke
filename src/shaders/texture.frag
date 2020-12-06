precision mediump float;

uniform vec2 resolution;
uniform float time;
uniform sampler2D texture;

void main() {
    vec2 uv = gl_FragCoord.xy / resolution;
    vec3 v = texture2D(texture, uv).xyz;
    gl_FragColor = vec4(v, 1);
}
