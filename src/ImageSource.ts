import * as twgl from 'twgl.js';
import { bindFramebufferWithTexture } from './util/bindFramebuffer';
import convolveImage from './util/convolveImage';

import { containImage, fileObjToData } from './util/image';

/**
 * A class for uploading images into WebGL.
 * Usage:
 * const imageSource = new ImageSource(gl, drawImageToCanvas);
 * imageSource.setup([gl.canvas.width, gl.canvas.height], 'boxBlur');
 * button.addEventListener('click', imageSource.handler);
 */
export default class ImageSource {
    filter = 'none';

    private canvas: HTMLCanvasElement;
    private framebuffer: WebGLFramebuffer;
    private gl: WebGLRenderingContext;
    private imageTexture: WebGLTexture;
    private input: HTMLInputElement;
    private outputTexture: WebGLTexture;
    private res: number[];

    private callback: (t: WebGLTexture, w: number, h: number) => void;

    /**
     * Creates a new ImageSource
     * @param gl
     * @param callback function to be called when there is a new image source available
     */
    constructor(
        gl: WebGLRenderingContext,
        callback: (t: WebGLTexture, w: number, h: number) => void,
        readonly verbose: boolean = false
    ) {
        this.gl = gl;
        this.callback = callback;
        this.framebuffer = gl.createFramebuffer();

        this.input = document.createElement('input');
        this.input.setAttribute('type', 'file');
        this.input.setAttribute('accept', 'image/png, image/jpeg');
        this.input.setAttribute('style', 'display: none');
    }

    /**
     * Sets important variables.
     * Must be called before any calls to handler.
     * @param res destination texture resolution / dimensions
     * @param filter filtering to apply
     */
    setup(res: number[], filter?: string) {
        this.res = res;
        this.filter = filter || 'none';
    }

    /**
     * This function facilitates the uploading of an image.
     * It expects a file input on the page wih ID below.
     * Attach this to a button on the page.
     */
    handler = () => {
        this.input.addEventListener('change', this.onUpload, { once: true });
        this.input.click();
    };

    /**
     * Process source image with current filter.
     * Send result to client with the callback.
     */
    process = () => {
        if (!(this.canvas && this.imageTexture)) {
            return;
        }

        if (this.filter === 'none') {
            this.callback(this.imageTexture, this.canvas.width, this.canvas.height);
            return;
        }

        this.outputTexture = twgl.createTexture(this.gl, { src: this.canvas });
        bindFramebufferWithTexture(
            this.gl,
            this.framebuffer,
            this.canvas.width,
            this.canvas.height,
            this.outputTexture
        );
        convolveImage(this.gl, { image: this.imageTexture, kernel: this.filter });
        this.callback(this.outputTexture, this.canvas.width, this.canvas.height);
    };

    /**
     * Converts an uploaded image from file object to WebGL texture.
     * @param e
     */
    private onUpload = async (e: InputEvent) => {
        const input = e.target as HTMLInputElement;
        if (input.files.length === 0) {
            return;
        }

        const srcData = await fileObjToData(input.files[0]);
        if (this.verbose) console.log('containing image within:', this.res.map(d => d / 2));
        this.canvas = await containImage(srcData, this.res[0] / 2, this.res[1] / 2);
        if (this.verbose) console.log('resulting dimensions:', [this.canvas.width, this.canvas.height]);
        this.imageTexture = twgl.createTexture(this.gl, { src: this.canvas });

        this.process();
    };
}
