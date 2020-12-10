import seedrandom from 'seedrandom';
import * as twgl from 'twgl.js';

import Pointer from './Pointer';
import Pointers from './Pointers';
import { swap } from './util';
import bindFramebuffer, { bindFramebufferWithTexture } from './util/bindFramebuffer';
import buildTexture from './util/buildTexture';
import { Color, randomColor } from './util/color';
import getResolution from './util/getResolution';

const advectShader = require('./shaders/advect.frag');
const addForcesShader = require('./shaders/addForces.frag');
const basicFragShader = require('./shaders/basic.frag');
const basicVertShader = require('./shaders/basic.vert');
const boundaryShader = require('./shaders/boundary.frag');
const clearShader = require('./shaders/clear.frag');
const curlShader = require('./shaders/curl.frag');
const divergenceShader = require('./shaders/divergence.frag');
const jacobiShader = require('./shaders/jacobi.frag');
const splatShader = require('./shaders/splat.frag');
const subtractShader = require('./shaders/subtract.frag');
const textureShader = require('./shaders/texture.frag');
const vorticityShader = require('./shaders/vorticity.frag');

const config = {
    SIM_RESOLUTION: 128,
    DYE_RESOLUTION: 512,
    CAPTURE_RESOLUTION: 512,
    DENSITY_DISSIPATION: 0.2,
    VELOCITY_DISSIPATION: 0.05,
    PRESSURE: 0.8,
    PRESSURE_ITERATIONS: 50,
    CURL: 30,
    REST_TEMP: 0,
    SPLAT_RADIUS: 2.0,
    SPLAT_FORCE: 6000,
    VISCOSITY: 0.101,
};

/**
 * FluidSimulator class
 * Simulates fluids in 2D using a Eulerian approach on the GPU
 */
export default class FluidSimulator {
    gl: WebGLRenderingContext;
    // buffers
    quadBufferInfo: twgl.BufferInfo;
    // textures
    curlTexture: WebGLTexture;
    divergenceTexture: WebGLTexture;
    dyeTexture: WebGLTexture;
    dyeTempTexture: WebGLTexture;
    pressureTexture: WebGLTexture;
    simTexture: WebGLTexture;
    temperatureTexture: WebGLTexture;
    velocityTexture: WebGLTexture;
    // frame buffers
    simulationFramebuffer: WebGLFramebuffer;
    dyeFramebuffer: WebGLFramebuffer;
    // shader programs
    advectProgInfo: twgl.ProgramInfo;
    addForcesProgInfo: twgl.ProgramInfo;
    basicProgInfo: twgl.ProgramInfo;
    boundaryProgInfo: twgl.ProgramInfo;
    clearProgInfo: twgl.ProgramInfo;
    curlProgInfo: twgl.ProgramInfo;
    divergenceProgInfo: twgl.ProgramInfo;
    jacobiProgInfo: twgl.ProgramInfo;
    renderTextureProgInfo: twgl.ProgramInfo;
    splatProgInfo: twgl.ProgramInfo;
    subtractProgInfo: twgl.ProgramInfo;
    vorticityProgInfo: twgl.ProgramInfo;
    // simulation state
    prevTime = 0;
    timeStep = 0;
    pointers: Pointers;
    swap: (a: string, b: string) => void;
    simRes: twgl.v3.Vec3;
    simTexelSize: twgl.v3.Vec3;
    dyeRes: twgl.v3.Vec3;
    dyeTexelSize: twgl.v3.Vec3;
    splatStack: number[] = [];
    running = true;
    runN = 0;
    ran = 0;

    constructor(gl: WebGLRenderingContext) {
        this.gl = gl;
        this.quadBufferInfo = twgl.createBufferInfoFromArrays(gl, {
            position: {
                data: [-1, -1, -1, 1, 1, -1, 1, 1],
                numComponents: 2,
            },
        });

        this.curlTexture = gl.createTexture();
        this.divergenceTexture = gl.createTexture();
        this.dyeTexture = gl.createTexture();
        this.dyeTempTexture = gl.createTexture();
        this.pressureTexture = gl.createTexture();
        this.simTexture = gl.createTexture();
        this.temperatureTexture = gl.createTexture();
        this.velocityTexture = gl.createTexture();

        this.advectProgInfo = twgl.createProgramInfo(gl, [basicVertShader, advectShader]);
        this.addForcesProgInfo = twgl.createProgramInfo(gl, [basicVertShader, addForcesShader]);
        this.basicProgInfo = twgl.createProgramInfo(gl, [basicVertShader, basicFragShader]);
        this.boundaryProgInfo = twgl.createProgramInfo(gl, [basicVertShader, boundaryShader]);
        this.clearProgInfo = twgl.createProgramInfo(gl, [basicVertShader, clearShader]);
        this.curlProgInfo = twgl.createProgramInfo(gl, [basicVertShader, curlShader]);
        this.divergenceProgInfo = twgl.createProgramInfo(gl, [basicVertShader, divergenceShader]);
        this.jacobiProgInfo = twgl.createProgramInfo(gl, [basicVertShader, jacobiShader]);
        this.renderTextureProgInfo = twgl.createProgramInfo(gl, [basicVertShader, textureShader]);
        this.splatProgInfo = twgl.createProgramInfo(gl, [basicVertShader, splatShader]);
        this.subtractProgInfo = twgl.createProgramInfo(gl, [basicVertShader, subtractShader]);
        this.vorticityProgInfo = twgl.createProgramInfo(gl, [basicVertShader, vorticityShader]);

        this.simulationFramebuffer = gl.createFramebuffer();
        this.dyeFramebuffer = gl.createFramebuffer();

        this.pointers = new Pointers(gl.canvas as HTMLCanvasElement);

        this.swap = swap.bind(this);

        this.simRes = getResolution(gl, config.SIM_RESOLUTION);
        this.dyeRes = getResolution(gl, config.DYE_RESOLUTION);

        gl.canvas.addEventListener('keydown', (e: KeyboardEvent) => {
            if (e.code === 'KeyP') {
                this.running = false;
            }
        });
    }

    /**
     * build GPU texture buffers
     */
    buildTextures() {
        const { simRes, dyeRes } = this;
        const numCells = simRes[0] * simRes[1];

        const common = {
            internalFormat: (this.gl as any).RGBA32F,
            type: this.gl.FLOAT,
            wrap: this.gl.CLAMP_TO_EDGE,
        };

        const zeros = new Float32Array(numCells * 4).fill(0);
        const simDimensions = { width: simRes[0], height: simRes[1] };
        const opt = {
            ...simDimensions,
            ...common,
            src: zeros,
        };

        buildTexture(this.gl, this.curlTexture, opt);
        buildTexture(this.gl, this.divergenceTexture, opt);
        buildTexture(this.gl, this.pressureTexture, opt);
        buildTexture(this.gl, this.simTexture, { ...simDimensions, src: null });
        buildTexture(this.gl, this.temperatureTexture, opt);
        buildTexture(this.gl, this.velocityTexture, opt);
    
        const dyeDimensions = { width: dyeRes[0], height: dyeRes[1] };
        buildTexture(this.gl, this.dyeTexture, {
            ...dyeDimensions,
            src: new Float32Array(dyeRes[0] * dyeRes[1] * 4),
        });
        buildTexture(this.gl, this.dyeTempTexture, { ...dyeDimensions, src: null });
    }

    setup() {
        this.ran = 0;
        this.prevTime = Date.now();
        this.buildTextures();
        
        const rng = seedrandom(Math.random());
        this.multipleSplats(rng() * 5 + 10, rng);

        this.simTexelSize = twgl.v3.create(1 / this.simRes[0], 1 / this.simRes[1]);
        this.dyeTexelSize = twgl.v3.create(1 / this.dyeRes[0], 1 / this.dyeRes[1]);

        this.update();
    }

    bindSimFramebuffer(texture?: WebGLTexture) {
        bindFramebufferWithTexture(
            this.gl,
            this.simulationFramebuffer,
            this.simRes[0],
            this.simRes[1],
            texture || this.simTexture
        );
    }

    bindDyeFramebuffer(texture?: WebGLTexture) {
        bindFramebufferWithTexture(
            this.gl,
            this.dyeFramebuffer,
            this.dyeRes[0],
            this.dyeRes[1],
            texture || this.dyeTempTexture
        );
    }

    runProg(programInfo: twgl.ProgramInfo, uniforms: Record<string, any>) {
        this.gl.useProgram(programInfo.program);
        twgl.setBuffersAndAttributes(this.gl, programInfo, this.quadBufferInfo);
        twgl.setUniforms(programInfo, uniforms);
        twgl.drawBufferInfo(this.gl, this.quadBufferInfo, this.gl.TRIANGLE_STRIP);
    }

    runSimProg(programInfo: twgl.ProgramInfo, uniforms: Record<string, any>) {
        this.bindSimFramebuffer();
        this.runProg(programInfo, uniforms);
    }

    getSimRes() {
        return this.simRes.slice(0, 2);
    }

    dt() {
        return this.timeStep;
    }

    /**
     * advect the fluid density
     */
    advect(quantityTexture: WebGLTexture, texelSize: number[], dissipation: number) {
        this.runProg(this.advectProgInfo, {
            texelSize,
            dissipation,
            dt: this.dt(),
            velocityTexture: this.velocityTexture,
            quantityTexture,
        });
    }

    advectVelocity() {
        this.bindSimFramebuffer();
        this.advect(
            this.velocityTexture,
            Array.from(this.simTexelSize).slice(0, 2),
            config.VELOCITY_DISSIPATION
        );
        this.swap('velocityTexture', 'simTexture');
    }

    advectTemperature() {
        this.bindSimFramebuffer();
        this.advect(
            this.temperatureTexture,
            Array.from(this.simTexelSize).slice(0, 2),
            config.VELOCITY_DISSIPATION
        );
        this.swap('temperatureTexture', 'simTexture');
    }

    advectDye() {
        this.bindDyeFramebuffer();
        this.advect(
            this.dyeTexture,
            Array.from(this.dyeTexelSize).slice(0, 2),
            config.DENSITY_DISSIPATION
        );
        this.swap('dyeTexture', 'dyeTempTexture');
    }

    /**
     * Generic function to run jacobi iteration program
     */
    runJacobiProg(alpha: number, rBeta: number, x: WebGLTexture, b: WebGLTexture) {
        this.runProg(this.jacobiProgInfo, {
            texelSize: this.simTexelSize.slice(0, 2),
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
        this.bindSimFramebuffer();

        const ndt = config.VISCOSITY * this.dt();
        const alpha = this.simRes[0] ** 2 / ndt;
        const rBeta = 1 / (4 + this.simRes[0] ** 2 / ndt);

        for (let i = 0; i < 50; i++) {
            this.gl.framebufferTexture2D(
                this.gl.FRAMEBUFFER,
                this.gl.COLOR_ATTACHMENT0,
                this.gl.TEXTURE_2D,
                this.simTexture,
                0
            );
            this.runJacobiProg(alpha, rBeta, this.velocityTexture, this.velocityTexture);
            this.swap('velocityTexture', 'simTexture');
        }
    }

    /**
     * apply external forces to velocity field
     */
    addForces() {
        this.runSimProg(this.addForcesProgInfo, {
            resolution: this.getSimRes(),
            dt: this.dt(),
            velocityTexture: this.velocityTexture,
            temperatureTexture: this.temperatureTexture,
            densityTexture: this.dyeTexture,
            gravity: 0, // 100,
            buoyancy: 2,
            restTemp: config.REST_TEMP,
            k: 0.5,
        });

        this.swap('velocityTexture', 'simTexture');
    }

    computeCurl() {
        this.runSimProg(this.curlProgInfo, {
            texelSize: this.simTexelSize.slice(0, 2),
            velocity: this.velocityTexture,
        });
        this.swap('curlTexture', 'simTexture');
    }

    enforceVorticity() {
        this.runSimProg(this.vorticityProgInfo, {
            texelSize: this.simTexelSize.slice(0, 2),
            curlField: this.curlTexture,
            velocityField: this.velocityTexture,
            curl: config.CURL,
            dt: this.dt(),
        });
        this.swap('velocityTexture', 'simTexture');
    }

    /**
     * Compute the divergence of the velocity field
     */
    computeDivergence() {
        this.bindSimFramebuffer(this.divergenceTexture);
        this.runProg(this.divergenceProgInfo, {
            texelSize: this.simTexelSize.slice(0, 2),
            w: this.velocityTexture,
        });
    }

    /**
     * Clear pressure field
     */
    clearPressureField() {
        this.runSimProg(this.clearProgInfo, {
            tex: this.pressureTexture,
            value: config.PRESSURE,
        });
        this.swap('pressureTexture', 'simTexture');
    }

    /**
     * Compute pressure field with jacobi iteration
     */
    computePressureField() {
        this.bindSimFramebuffer();

        const alpha = -1;
        const rBeta = 0.25;

        for (let i = 0; i < 50; i++) {
            this.gl.framebufferTexture2D(
                this.gl.FRAMEBUFFER,
                this.gl.COLOR_ATTACHMENT0,
                this.gl.TEXTURE_2D,
                this.simTexture,
                0
            );
            this.runJacobiProg(alpha, rBeta, this.pressureTexture, this.divergenceTexture);
            this.swap('pressureTexture', 'simTexture');
        }
    }

    /**
     * Subtract pressure field gradient from intermediate velocity field
     */
    subtractPressureGradient() {
        this.runSimProg(this.subtractProgInfo, {
            texelSize: this.simTexelSize.slice(0, 2),
            pressureField: this.pressureTexture,
            velocityField: this.velocityTexture,
        });

        this.swap('velocityTexture', 'simTexture');
    }

    /**
     * Enforce boundary conditions on a given field
     */
    enforceFieldBoundaries(x: WebGLTexture, scale: number) {
        this.runSimProg(this.boundaryProgInfo, {
            resolution: this.simRes.slice(0, 2),
            texelSize: this.simTexelSize.slice(0, 2),
            scale,
            x,
        });
    }

    enforceVelocityBoundaries() {
        this.enforceFieldBoundaries(this.velocityTexture, -1);
    }

    enforcePressureBoundaries() {
        this.enforceFieldBoundaries(this.pressureTexture, 1);
    }

    scaleRadius(r: number) {
        const aspectRatio = this.gl.canvas.width / this.gl.canvas.height;
        if (aspectRatio > 1) {
            return r * aspectRatio;
        }

        return r;
    }

    splat(x: number, y: number, dx: number, dy: number, color: Color) {
        const common = {
            aspectRatio: this.gl.canvas.width / this.gl.canvas.height,
            point: [x, y],
            radius: this.scaleRadius(config.SPLAT_RADIUS / 100.0),
        };

        // splat to velocity texture
        this.runSimProg(this.splatProgInfo, {
            ...common,
            color: [dx, dy, 0],
            tex: this.velocityTexture,
        });
        this.swap('velocityTexture', 'simTexture');

        // splat to temperature texture
        this.runSimProg(this.splatProgInfo, {
            ...common,
            color: [Math.sqrt(dx * dx + dy * dy), 0, 0],
            tex: this.temperatureTexture,
        });
        this.swap('temperatureTexture', 'simTexture');

        // splat to dye texture
        this.bindDyeFramebuffer();
        this.runProg(this.splatProgInfo, {
            ...common,
            color: [color.r, color.g, color.b],
            tex: this.dyeTexture,
        });
        this.swap('dyeTexture', 'dyeTempTexture');
    }

    multipleSplats(nSplats: number, rng: () => number) {
        for (let i = 0; i < nSplats; i++) {
            const color = randomColor();
            color.r *= 10.0;
            color.g *= 10.0;
            color.b *= 10.0;
            const x = rng();
            const y = rng();
            const dx = 1000 * (rng() - 0.5);
            const dy = 1000 * (rng() - 0.5);
            this.splat(x, y, dx, dy, color);
        }
    }

    splatPointer(p: Pointer) {
        const dx = p.deltaX * config.SPLAT_FORCE;
        const dy = p.deltaY * config.SPLAT_FORCE;
        this.splat(p.x, p.y, dx, dy, p.color);
    }

    applyInputs() {
        if (this.splatStack.length > 0) {
            const rng = seedrandom(Math.random());
            this.multipleSplats(this.splatStack.pop(), rng);
        }

        this.pointers.pointers.forEach((p) => {
            if (p.moved) {
                p.moved = false;
                this.splatPointer(p);
            }
        });
    }

    /**
     * run simulation update logic
     */
    runSimulation() {
        // console.log('dt', this.timeStep * 0.5);
        this.gl.disable(this.gl.BLEND);

        this.diffuseVelocity();
        this.addForces();

        this.computeCurl();
        this.enforceVorticity();

        this.enforceVelocityBoundaries();
    
        this.computeDivergence();
    
        this.clearPressureField();
        this.computePressureField();

        this.enforcePressureBoundaries();

        this.subtractPressureGradient();

        this.advectVelocity();
        this.advectTemperature();
        this.advectDye();
    }

    updateTime() {
        const now = Date.now();
        const dt = (now - this.prevTime) / 1000;
        this.timeStep = Math.min(dt, 0.016666);
        this.prevTime = now;
    }

    /**
     * main update logic ran each time step`
     */
    update() {
        this.updateTime();
        this.applyInputs();
        if (this.running) {
            this.runSimulation();
            this.ran++;

            if (this.runN > 0 && this.ran >= this.runN) {
                this.running = false;
            }
        }
    }

    getTime() {
        return this.prevTime + this.timeStep;
    }

    drawBasic() {
        this.runProg(this.basicProgInfo, {});
    }

    drawTexture(tex: WebGLTexture) {
        this.runProg(this.renderTextureProgInfo, {
            time: this.getTime(),
            resolution: [this.gl.canvas.width, this.gl.canvas.height],
            tex,
        });
    }

    /**
     * draw current state of simulation
     */
    draw() {
        bindFramebuffer(this.gl, null, this.gl.canvas.width, this.gl.canvas.height);
        this.gl.clearColor(0, 0, 0, 1);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
        this.drawTexture(this.dyeTexture);
    }
}
