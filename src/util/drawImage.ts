import * as twgl from 'twgl.js';

const drawImageVert = `#version 300 es
in vec4 position;
out vec2 uv;
uniform mat4 matrix;

void main() {
   gl_Position = matrix * position;
   uv = position.xy * 0.5 + 0.5;
}
`;

const drawImageFrag = `#version 300 es
precision highp float;
in vec2 uv;
out vec4 fragColor;
uniform sampler2D image;

void main() {
    fragColor = texture(image, uv);
}
`;

export interface drawImageOptions {
    image: WebGLTexture;
    x: number;
    y: number;
    width: number;
    height: number;
    destWidth: number;
    destHeight: number;
    quadBufferInfo: twgl.BufferInfo;
}

// based on: https://webgl2fundamentals.org/webgl/lessons/webgl-2d-drawimage.html
export default function drawImage(gl: WebGLRenderingContext, opt: drawImageOptions) {
    const programInfo = twgl.createProgramInfo(gl, [drawImageVert, drawImageFrag]);
    gl.useProgram(programInfo.program);

    // this matrix will convert from pixels to clip space
    let matrix = twgl.m4.ortho(0, opt.destWidth, opt.destHeight, 0, -1, 1);
    matrix = twgl.m4.translate(matrix, twgl.v3.create(opt.x, opt.y, 0));
    matrix = twgl.m4.scale(matrix, twgl.v3.create(opt.width, opt.height, 1));

    twgl.setBuffersAndAttributes(gl, programInfo, opt.quadBufferInfo);
    twgl.setUniforms(programInfo, { image: opt.image, matrix });
    twgl.drawBufferInfo(gl, opt.quadBufferInfo, gl.TRIANGLE_STRIP);
}
