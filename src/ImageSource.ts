import * as twgl from 'twgl.js';
import { swap } from './util';
import { bindFramebufferWithTexture } from './util/bindFramebuffer';
import convolveImage from './util/convolveImage';

import { containImage, fileObjToData } from './util/image';

export default class ImageSource {
    gl: WebGLRenderingContext;
    res: twgl.v3.Vec3;
    framebuffer: WebGLFramebuffer;
    imageTexture: WebGLTexture;
    tempImageTexture: WebGLTexture;
    callback: (t: WebGLTexture, w: number, h: number) => void;

    constructor(
        gl: WebGLRenderingContext,
        callback: (t: WebGLTexture, w: number, h: number) => void
    ) {
        this.gl = gl;
        this.callback = callback;
        this.uploadImage = this.uploadImage.bind(this);

        this.framebuffer = gl.createFramebuffer();
    }

    setup(res: twgl.v3.Vec3) {
        this.res = res;
    }

    async handleImageUploaded(e: InputEvent) {
        const input = e.target as HTMLInputElement;
        if (input.files.length === 0) {
            return;
        }

        const srcData = await fileObjToData(input.files[0]);
        console.log(
            'containing image within: ',
            this.res.map((c) => c / 2)
        );
        const canvas = await containImage(srcData, this.res[0] / 2, this.res[1] / 2);
        console.log('resulting dimensions: ', canvas.width, canvas.height);
        this.imageTexture = twgl.createTexture(this.gl, { src: canvas });
        this.tempImageTexture = twgl.createTexture(this.gl, { src: canvas });

        bindFramebufferWithTexture(
            this.gl,
            this.framebuffer,
            canvas.width,
            canvas.height,
            this.tempImageTexture
        );
        convolveImage(this.gl, { image: this.imageTexture, kernel: 'boxBlur' });
        swap.bind(this)('imageTexture', 'tempImageTexture');

        this.callback(this.imageTexture, canvas.width, canvas.height);
    }

    uploadImage() {
        const input = document.getElementById('image-upload');
        input.addEventListener('change', this.handleImageUploaded.bind(this), { once: true });
        input.click();
    }
}
