#version 300 es
precision highp float;

in vec2 uv;
out vec4 fragColor;

uniform vec2 resolution;
uniform float dt;
uniform sampler2D velocityTexture;
uniform sampler2D temperatureTexture;
uniform sampler2D densityTexture;
uniform float gravity;
uniform float buoyancy;
uniform float restTemp;
uniform float k;

void main() {    
    vec3 velocity = texture(velocityTexture, uv).xyz;

    velocity.y -= gravity * dt;

    if (buoyancy != 0.0) {
        float temp = texture(temperatureTexture, uv).x;
        float density = texture(densityTexture, uv).x;
        velocity.y += ((temp - restTemp) - k * density) * dt * buoyancy;
    }

    fragColor = vec4(velocity, 1);
}
