import * as twgl from 'twgl.js';

import bindFramebuffer, { bindFramebufferWithTexture } from './util/bindFramebuffer';
import buildTexture from './util/buildTexture';
import { swap } from './util';
import getTextureData from './util/getTextureData';

const advectShader = require('./shaders/advect.frag');
const addForcesShader = require('./shaders/addForces.frag');
const basicVertShader = require('./shaders/basic.vert');
const boundaryShader = require('./shaders/boundary.frag');
const divergenceShader = require('./shaders/divergence.frag');
const jacobiShader = require('./shaders/jacobi.frag');
const subtractShader = require('./shaders/subtract.frag');
const textureShader = require('./shaders/texture.frag');

/**
 * FluidSimulator class
 * Simulates fluids in 2D using a Eulerian approach on the GPU
 */
export default class FluidSimulator {
    // buffers
    quadBufferInfo: twgl.BufferInfo;
    // textures
    densityTexture: WebGLTexture;
    divergenceTexture: WebGLTexture;
    pressureTexture: WebGLTexture;
    tempTexture: WebGLTexture;
    velocityTexture: WebGLTexture;
    // frame buffers
    simulationFramebuffer: WebGLFramebuffer;
    // shader programs
    advectProgInfo: twgl.ProgramInfo;
    addForcesProgInfo: twgl.ProgramInfo;
    boundaryProgInfo: twgl.ProgramInfo;
    divergenceProgInfo: twgl.ProgramInfo;
    jacobiProgInfo: twgl.ProgramInfo;
    renderTextureProgInfo: twgl.ProgramInfo;
    subtractProgInfo: twgl.ProgramInfo;
    // simulation state
    prevTime = 0;
    timeStep = 0;
    timeScale = 0.001;
    viscosity = 0.101;

    constructor(readonly gl: any, readonly res: number) {
        this.quadBufferInfo = twgl.createBufferInfoFromArrays(gl, {
            position: {
                data: [-1, -1, -1, 1, 1, -1, 1, 1],
                numComponents: 2,
            },
        });

        this.densityTexture = gl.createTexture();
        this.divergenceTexture = gl.createTexture();
        this.pressureTexture = gl.createTexture();
        this.tempTexture = gl.createTexture();
        this.velocityTexture = gl.createTexture();

        this.advectProgInfo = twgl.createProgramInfo(gl, [basicVertShader, advectShader]);
        this.addForcesProgInfo = twgl.createProgramInfo(gl, [basicVertShader, addForcesShader]);
        this.boundaryProgInfo = twgl.createProgramInfo(gl, [basicVertShader, boundaryShader]);
        this.divergenceProgInfo = twgl.createProgramInfo(gl, [basicVertShader, divergenceShader]);
        this.jacobiProgInfo = twgl.createProgramInfo(gl, [basicVertShader, jacobiShader]);
        this.renderTextureProgInfo = twgl.createProgramInfo(gl, [basicVertShader, textureShader]);
        this.subtractProgInfo = twgl.createProgramInfo(gl, [basicVertShader, subtractShader]);

        this.simulationFramebuffer = gl.createFramebuffer();
    }

    /**
     * build GPU texture buffers
     */
    buildTextures() {
        const { res } = this;
        const numCells = res * res;

        const dims = { width: res, height: res };

        buildTexture(this.gl, this.tempTexture, { ...dims, src: null });

        buildTexture(this.gl, this.velocityTexture, {
            ...dims,
            src: new Float32Array(numCells * 4).fill(0),
        });

        buildTexture(this.gl, this.pressureTexture, {
            ...dims,
            src: new Float32Array(numCells * 4).fill(0),
        });

        buildTexture(this.gl, this.densityTexture, {
            ...dims,
            src: new Float32Array(numCells * 4).fill(0),
        });

        buildTexture(this.gl, this.divergenceTexture, {
            ...dims,
            src: new Float32Array(numCells * 4).fill(0),
        });
    }

    setup() {
        this.buildTextures();
    }

    bindSimulationFramebuffer(texture?: WebGLTexture) {
        bindFramebufferWithTexture(
            this.gl,
            this.simulationFramebuffer,
            this.res,
            this.res,
            texture || this.tempTexture
        );
    }
    
    runProg(programInfo: twgl.ProgramInfo, uniforms: Record<string, any>) {
        this.gl.useProgram(programInfo.program);
        twgl.setBuffersAndAttributes(this.gl, programInfo, this.quadBufferInfo);
        twgl.setUniforms(programInfo, uniforms);
        twgl.drawBufferInfo(this.gl, this.quadBufferInfo, this.gl.TRIANGLE_STRIP);
    }

    runSimProg(programInfo: twgl.ProgramInfo, uniforms: Record<string, any>) {
        this.bindSimulationFramebuffer();
        this.runProg(programInfo, uniforms);
    }

    /**
     * advect the fluid density
     */
    advect() {
        this.runSimProg(this.advectProgInfo, {
            resolution: [this.res, this.res],
            timeStep: this.timeStep,
            velocityTexture: this.velocityTexture,
            quantityTexture: this.velocityTexture,
        });

        swap(this, 'velocityTexture', 'tempTexture');
    }

    /**
     * Generic function to run jacobi iteration program
     * NOTE: this function does not bind a frame buffer nor perform any swapping
     */
    runJacobiProg(alpha: number, rBeta: number, x: WebGLTexture, b: WebGLTexture) {
        this.runProg(this.jacobiProgInfo, {
            resolution: [this.res, this.res],
            alpha,
            rBeta,
            x,
            b,
        });
    }

    /**
     * Perform viscous diffusion on the fluid using jacobi iteration
     */
    diffuseVelocity() {
        this.bindSimulationFramebuffer();

        const ndt = this.viscosity * this.timeStep;
        const alpha = Math.pow(this.res, 2) / ndt;
        const rBeta = 1 / (4 + Math.pow(this.res, 2) / ndt);

        for (let i = 0; i < 50; i++) {
            this.gl.framebufferTexture2D(
                this.gl.FRAMEBUFFER,
                this.gl.COLOR_ATTACHMENT0,
                this.gl.TEXTURE_2D,
                this.tempTexture,
                0
            );
            this.runJacobiProg(alpha, rBeta, this.velocityTexture, this.velocityTexture);
            swap(this, 'velocityTexture', 'tempTexture');
        }
    }

    /**
     * apply external forces to velocity field
     */
    addForces() {
        this.runSimProg(this.addForcesProgInfo, {
            resolution: [this.res, this.res],
            timeStep: this.timeStep,
            velocityTexture: this.velocityTexture,
        });

        swap(this, 'velocityTexture', 'tempTexture');
    }

    /**
     * Compute the divergence of the velocity field
     */
    computeDivergence() {
        this.bindSimulationFramebuffer(this.divergenceTexture);
        this.runProg(this.divergenceProgInfo, {
            resolution: [this.res, this.res],
            halfrdx: 0.5 * (1 / this.res), // should this be divison like in GPU gems?
            w: this.velocityTexture,
        });
    }

    /**
     * Compute pressure field with jacobi iteration
     */
    computePressureField() {
        this.bindSimulationFramebuffer(this.pressureTexture);

        const alpha = -Math.pow(this.res, 2);
        const rBeta = 0.25;

        for (let i = 0; i < 50; i++) {
            this.gl.framebufferTexture2D(
                this.gl.FRAMEBUFFER,
                this.gl.COLOR_ATTACHMENT0,
                this.gl.TEXTURE_2D,
                this.tempTexture,
                0
            );
            this.runJacobiProg(alpha, rBeta, this.divergenceTexture, this.pressureTexture);
            swap(this, 'pressureTexture', 'tempTexture');
        }
    }

    /**
     * Subtract pressure field gradient from intermediate velocity field
     */
    subtractPressureGradient() {
        this.runSimProg(this.subtractProgInfo, {
            resolution: [this.res, this.res],
            halfrdx: 0.5 * (1 / this.res), // should this be divison like in GPU gems?
            pressureField: this.pressureTexture,
            velocityField: this.velocityTexture,
        });

        swap(this, 'velocityTexture', 'tempTexture');
    }

    /**
     * Enforce boundary conditions on a given field
     */
    enforceFieldBoundaries(texture: WebGLTexture) {
        this.runSimProg(this.boundaryProgInfo, {
            resolution: [this.res, this.res],
            offset: [0, 0],
            scale: -1,
            x: texture,
        });
    }

    enforceVelocityBoundaries() {
        this.enforceFieldBoundaries(this.velocityTexture);
    }

    enforcePressureBoundaries() {
        this.enforceFieldBoundaries(this.pressureTexture);
    }

    /**
     * run simulation update logic
     * @param time
     */
    update(time: number) {
        this.timeStep = time - this.prevTime;
        this.prevTime = time;

        this.advect();
        this.diffuseVelocity();
        this.addForces();
        this.computeDivergence();
        this.computePressureField();
        this.subtractPressureGradient();
        // console.log(getTextureData(this.gl, this.divergenceTexture, this.res, this.res));
    }

    getTime() {
        return this.prevTime + this.timeStep;
    }

    drawTexture(tex: any) {
        this.runProg(this.renderTextureProgInfo, {
            time: this.getTime() * this.timeScale,
            resolution: [this.gl.canvas.width, this.gl.canvas.height],
            tex,
        });
    }

    /**
     * draw current state of simulation
     */
    draw() {
        bindFramebuffer(this.gl, null, this.gl.canvas.width, this.gl.canvas.height);
        // Clear the canvas AND the depth buffer.
        this.gl.clearColor(1, 1, 1, 1); // clear to white
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
        this.drawTexture(this.velocityTexture);
    }
}
