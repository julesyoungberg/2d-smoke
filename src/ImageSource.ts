import * as twgl from 'twgl.js';

import drawImage from './util/drawImage';
import { containImage, fileObjToData } from './util/image';

export default class ImageSource {
    gl: WebGLRenderingContext;
    res: twgl.v3.Vec3;
    callback: (t: WebGLTexture, w: number, h: number) => void;

    constructor(
        gl: WebGLRenderingContext,
        callback: (t: WebGLTexture, w: number, h: number) => void
    ) {
        this.gl = gl;
        this.callback = callback;
        this.uploadImage = this.uploadImage.bind(this);
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
        const imageTexture = twgl.createTexture(this.gl, { src: canvas });
        const tempImageTexture = twgl.createTexture(this.gl, { src: canvas });

        this.callback(imageTexture, canvas.width, canvas.height);
    }

    uploadImage() {
        const input = document.getElementById('image-upload');
        input.addEventListener('change', this.handleImageUploaded.bind(this), { once: true });
        input.click();
    }
}
