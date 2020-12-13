import * as twgl from 'twgl.js';

import convolutionKernels from './convolutionKernels';
import createModuleProg from './createModuleProg';
import createUnitQuad2d from './createUnitQuad2D';

const vertShader = `#version 300 es
in vec4 position;
out vec2 uv;

void main() {
   gl_Position = position;
   uv = position.xy * 0.5 + 0.5;
}
`;

const fragShader = `#version 300 es
precision highp float;

in vec2 uv;
out vec4 fragColor;

uniform sampler2D image;
uniform float kernel[9];
uniform float kernelWeight;

void main() {
    vec2 onePixel = vec2(1) / vec2(textureSize(image, 0));

    vec4 colorSum =
        texture(u_image, uv + onePixel * vec2(-1, -1)) * kernel[0] +
        texture(u_image, uv + onePixel * vec2( 0, -1)) * kernel[1] +
        texture(u_image, uv + onePixel * vec2( 1, -1)) * kernel[2] +
        texture(u_image, uv + onePixel * vec2(-1,  0)) * kernel[3] +
        texture(u_image, uv + onePixel * vec2( 0,  0)) * kernel[4] +
        texture(u_image, uv + onePixel * vec2( 1,  0)) * kernel[5] +
        texture(u_image, uv + onePixel * vec2(-1,  1)) * kernel[6] +
        texture(u_image, uv + onePixel * vec2( 0,  1)) * kernel[7] +
        texture(u_image, uv + onePixel * vec2( 1,  1)) * kernel[8];

    fragColor = vec4((colorSum / kernelWeight).rgb, 1);
}
`;

const getProgramInfo = createModuleProg([vertShader, fragShader]);

export interface convolveImageOptions {
    image: WebGLTexture;
    quadBufferInfo?: twgl.BufferInfo;
    kernel: string | number[];
}

function getValidKernel(input: convolveImageOptions['kernel']) {
    if (typeof input === 'string') {
        if (!convolutionKernels[input]) {
            throw new Error('invalid kernel name');
        }

        return convolutionKernels[input];
    }

    if (Array.isArray(input)) {
        if (input.length !== 9) {
            throw new Error('invalid kernel: must be 3x3 matrix of length 9');
        }

        return input;
    }

    throw new Error('invalid kernel: must be name or matrix');
}

export default function convolveImage(gl: WebGLRenderingContext, opt: convolveImageOptions) {
    const programInfo = getProgramInfo(gl);
    gl.useProgram(programInfo.program);

    const kernel = getValidKernel(opt.kernel);

    const bufferInfo = opt.quadBufferInfo || createUnitQuad2d(gl);
    twgl.setBuffersAndAttributes(gl, programInfo, bufferInfo);
    twgl.setUniforms(programInfo, { image: opt.image, kernel });
    twgl.drawBufferInfo(gl, bufferInfo, gl.TRIANGLE_STRIP);
}
