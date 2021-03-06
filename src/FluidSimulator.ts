import { GUI } from 'dat.gui';
import seedrandom from 'seedrandom';
import * as twgl from 'twgl.js';

import FluidConfig from './FluidConfig';
import ImageSource from './ImageSource';
import Pointer from './Pointer';
import Pointers from './Pointers';
import { swap } from './util';
import bindFramebuffer, { bindFramebufferWithTexture } from './util/bindFramebuffer';
import buildTexture from './util/buildTexture';
import { randomColor } from './util/color';
import createUnitQuad2D from './util/createUnitQuad2D';
import drawImage from './util/drawImage';
import getResolution from './util/getResolution';

const advectShader = require('./shaders/advect.frag');
const addForcesShader = require('./shaders/addForces.frag');
const basicFragShader = require('./shaders/basic.frag');
const basicVertShader = require('./shaders/basic.vert');
const clearShader = require('./shaders/clear.frag');
const curlShader = require('./shaders/curl.frag');
const divergenceShader = require('./shaders/divergence.frag');
const dptShader = require('./shaders/dpt.frag');
const jacobiShader = require('./shaders/jacobi.frag');
const obstacleShader = require('./shaders/obstacle.frag');
const renderShader = require('./shaders/render.frag');
const splatShader = require('./shaders/splat.frag');
const subtractShader = require('./shaders/subtract.frag');
const textureShader = require('./shaders/texture.frag');
const vorticityShader = require('./shaders/vorticity.frag');

/**
 * FluidSimulator class
 * Simulates fluids in 2D using a Eulerian approach on the GPU
 */
export default class FluidSimulator {
    gl: WebGLRenderingContext;
    simulationFramebuffer: WebGLFramebuffer;
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
    // shader programs
    advectProgInfo: twgl.ProgramInfo;
    addForcesProgInfo: twgl.ProgramInfo;
    basicProgInfo: twgl.ProgramInfo;
    clearProgInfo: twgl.ProgramInfo;
    curlProgInfo: twgl.ProgramInfo;
    divergenceProgInfo: twgl.ProgramInfo;
    jacobiProgInfo: twgl.ProgramInfo;
    obstacleProgInfo: twgl.ProgramInfo;
    renderDptProgInfo: twgl.ProgramInfo;
    renderTextureProgInfo: twgl.ProgramInfo;
    renderProgInfo: twgl.ProgramInfo;
    splatProgInfo: twgl.ProgramInfo;
    subtractProgInfo: twgl.ProgramInfo;
    vorticityProgInfo: twgl.ProgramInfo;
    // interaction
    pointers: Pointers;
    splatStack: number[] = [];
    // simulation config
    dyeRes: number[];
    dyeTexelSize: number[];
    simRes: number[];
    simTexelSize: number[];
    // simulation state
    config: FluidConfig;
    imageSource: ImageSource;
    prevTime = 0;
    timeStep = 0;
    running = true;
    runN = 0;
    ran = 0;

    swap: (a: string, b: string) => void;

    constructor(gl: WebGLRenderingContext, gui: GUI) {
        this.gl = gl;
        this.imageSource = new ImageSource(gl, this.handleImageSource.bind(this));

        // setup controls
        gui.add({ 'Play / Pause': this.toggleRunning.bind(this) }, 'Play / Pause');
        gui.add({ Restart: this.reset.bind(this) }, 'Restart');
        gui.add({ 'From Image': this.imageSource.handler }, 'From Image');
        this.config = new FluidConfig(gui);

        document.addEventListener('keydown', (e: KeyboardEvent) => {
            console.log('Key Pressed:', e.key);
            if (['p', ' '].includes(e.key)) {
                this.toggleRunning();
            } else if (e.key === 'r') {
                this.reset();
            }
        });

        this.quadBufferInfo = createUnitQuad2D(gl);

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
        this.clearProgInfo = twgl.createProgramInfo(gl, [basicVertShader, clearShader]);
        this.curlProgInfo = twgl.createProgramInfo(gl, [basicVertShader, curlShader]);
        this.divergenceProgInfo = twgl.createProgramInfo(gl, [basicVertShader, divergenceShader]);
        this.jacobiProgInfo = twgl.createProgramInfo(gl, [basicVertShader, jacobiShader]);
        this.obstacleProgInfo = twgl.createProgramInfo(gl, [basicVertShader, obstacleShader]);
        this.renderDptProgInfo = twgl.createProgramInfo(gl, [basicVertShader, dptShader]);
        this.renderTextureProgInfo = twgl.createProgramInfo(gl, [basicVertShader, textureShader]);
        this.renderProgInfo = twgl.createProgramInfo(gl, [basicVertShader, renderShader]);
        this.splatProgInfo = twgl.createProgramInfo(gl, [basicVertShader, splatShader]);
        this.subtractProgInfo = twgl.createProgramInfo(gl, [basicVertShader, subtractShader]);
        this.vorticityProgInfo = twgl.createProgramInfo(gl, [basicVertShader, vorticityShader]);

        this.simulationFramebuffer = gl.createFramebuffer();

        this.pointers = new Pointers(gl.canvas as HTMLCanvasElement);

        this.swap = swap.bind(this);

        this.simRes = getResolution(gl, this.config.simResolution);
        this.dyeRes = getResolution(gl, this.config.dyeResolution);
    }

    toggleRunning() {
        this.running = !this.running;
    }

    /**
     * build GPU texture buffers
     */
    buildTextures() {
        const { simRes, dyeRes } = this;
        const numCells = simRes[0] * simRes[1];

        const zeros = new Float32Array(numCells * 4).fill(0);
        const simDimensions = { width: simRes[0], height: simRes[1] };
        const opt = { ...simDimensions, src: zeros };

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

        // random initialization
        // const rng = seedrandom(Math.random());
        // this.multipleSplats(rng() * 5 + 10, rng);

        this.imageSource.setup(this.dyeRes, 'boxBlur');
        this.simTexelSize = [1 / this.simRes[0], 1 / this.simRes[1]];
        this.dyeTexelSize = [1 / this.dyeRes[0], 1 / this.dyeRes[1]];
        console.log('sim res:', this.simRes);
        console.log('dye res:', this.dyeRes);

        this.update();
    }

    reset() {
        this.setup();
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
            this.simulationFramebuffer,
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
            this.config.velocityDissipation
        );
        this.swap('velocityTexture', 'simTexture');
    }

    advectTemperature() {
        this.bindSimFramebuffer();
        this.advect(
            this.temperatureTexture,
            Array.from(this.simTexelSize).slice(0, 2),
            this.config.temperatureDissipation
        );
        this.swap('temperatureTexture', 'simTexture');
    }

    advectDye() {
        this.bindDyeFramebuffer();
        this.advect(
            this.dyeTexture,
            Array.from(this.dyeTexelSize).slice(0, 2),
            this.config.densityDissipation
        );
        this.swap('dyeTexture', 'dyeTempTexture');
    }

    runObstacleProg(scale: number, tex: WebGLTexture) {
        const pointer = this.pointers.pointers[0];
        this.runSimProg(this.obstacleProgInfo, {
            obstaclePosition: [pointer.x * this.simRes[0], pointer.y * this.simRes[1]],
            obstacleRadius: 3.0,
            resolution: this.simRes,
            scale,
            tex,
        });
    }

    enforceVelocityObstacle() {
        if (!(this.config.pointerMode === 'obstacle' && this.pointers.pointers[0].down)) {
            return;
        }

        this.runObstacleProg(-1.0, this.velocityTexture);
        this.swap('velocityTexture', 'simTexture');
    }

    enforcePressureObstacle() {
        if (!(this.config.pointerMode === 'obstacle' && this.pointers.pointers[0].down)) {
            return;
        }

        this.runObstacleProg(1.0, this.pressureTexture);
        this.swap('pressureTexture', 'simTexture');
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

        const ndt = this.config.viscosity * this.dt();
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
            gravity: this.config.gravity,
            buoyancy: this.config.buoyancy,
            restTemp: this.config.restTemp,
            kappa: this.config.buoyancyKappa,
            sigma: this.config.buoyancySigma,
        });

        this.swap('velocityTexture', 'simTexture');
    }

    computeCurl() {
        this.bindSimFramebuffer(this.curlTexture);
        this.runProg(this.curlProgInfo, {
            texelSize: this.simTexelSize.slice(0, 2),
            velocity: this.velocityTexture,
        });
    }

    enforceVorticity() {
        this.runSimProg(this.vorticityProgInfo, {
            texelSize: this.simTexelSize.slice(0, 2),
            curlField: this.curlTexture,
            velocityField: this.velocityTexture,
            vorticityConst: this.config.vorticity,
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
            value: this.config.pressure,
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

    scaleRadius(r: number) {
        const aspectRatio = this.gl.canvas.width / this.gl.canvas.height;
        if (aspectRatio > 1) {
            return r * aspectRatio;
        }

        return r;
    }

    splat(x: number, y: number, dx: number, dy: number, color: number[], velOnly?: boolean) {
        const common = {
            aspectRatio: this.gl.canvas.width / this.gl.canvas.height,
            point: [x, y],
            radius: this.scaleRadius(this.config.splatRadius / 100.0),
        };

        // splat to velocity texture
        this.runSimProg(this.splatProgInfo, {
            ...common,
            color: [dx / 2, dy / 2, 0],
            tex: this.velocityTexture,
        });
        this.swap('velocityTexture', 'simTexture');

        if (velOnly) {
            return;
        }

        // splat to temperature texture
        this.runSimProg(this.splatProgInfo, {
            ...common,
            color: [Math.random() * 10 + 5, 0, 0],
            tex: this.temperatureTexture,
        });
        this.swap('temperatureTexture', 'simTexture');

        // splat to dye texture
        this.bindDyeFramebuffer();
        this.runProg(this.splatProgInfo, {
            ...common,
            color,
            tex: this.dyeTexture,
        });
        this.swap('dyeTexture', 'dyeTempTexture');
    }

    multipleSplats(nSplats: number, rng: () => number) {
        for (let i = 0; i < nSplats; i++) {
            const color = randomColor().map((c) => c * 10.0);
            const x = rng();
            const y = rng();
            const dx = 1000 * (rng() - 0.5);
            const dy = 1000 * (rng() - 0.5);
            this.splat(x, y, dx, dy, color, this.config.pointerMode === 'hand');
        }
    }

    splatPointer(p: Pointer) {
        const dx = p.deltaX * this.config.splatForce;
        const dy = p.deltaY * this.config.splatForce;
        this.splat(p.x, p.y, dx, dy, p.color, this.config.pointerMode === 'hand');
    }

    applyInputs() {
        // apply constant input
        if (this.config.candle) {
            this.splat(0.5, 0, 0, 2, this.config.getColor());
        }

        if (this.config.pointerMode === 'obstacle') {
            return;
        }

        if (this.splatStack.length > 0) {
            const rng = seedrandom(Math.random());
            this.multipleSplats(this.splatStack.pop(), rng);
        }

        this.pointers.pointers.forEach((p, i) => {
            if (p.moved) {
                this.pointers.pointers[i].moved = false;
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

        // this.diffuseVelocity();
        this.addForces();
        this.enforceVelocityObstacle();

        if (this.config.vorticity > 0) {
            this.computeCurl();
            this.enforceVorticity();
        }

        this.computeDivergence();

        this.clearPressureField();
        this.computePressureField();
        this.enforcePressureObstacle();

        this.subtractPressureGradient();
        this.enforceVelocityObstacle();

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
        if (this.running) {
            this.applyInputs();
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

    drawDpt() {
        this.runProg(this.renderDptProgInfo, {
            divergence: this.divergenceTexture,
            pressure: this.pressureTexture,
            temperature: this.temperatureTexture,
        });
    }

    drawTexture(tex: WebGLTexture) {
        this.runProg(this.renderTextureProgInfo, { tex });
    }

    render() {
        const pointer = this.pointers.pointers[0];
        this.runProg(this.renderProgInfo, {
            obstaclePosition: [pointer.x * this.gl.canvas.width, pointer.y * this.gl.canvas.height],
            obstacleRadius: 3.0 * (this.gl.canvas.width / this.simRes[0]),
            renderObstacle: this.config.pointerMode === 'obstacle' && pointer.down,
            dye: this.dyeTexture,
        });
    }

    /**
     * draw current state of simulation
     */
    draw() {
        bindFramebuffer(this.gl, null, this.gl.canvas.width, this.gl.canvas.height);
        this.gl.clearColor(0, 0, 0, 1);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);

        switch (this.config.renderMode) {
            case 'dpt':
                this.drawDpt();
                break;
            case 'velocity':
                this.drawTexture(this.velocityTexture);
                break;
            default:
                this.render();
        }
    }

    // TODO
    // - improve velocity and temperature
    // - set special settings for the image mode
    handleImageSource(imageTexture: WebGLTexture, width: number, height: number) {
        this.config.candle = false;
        this.setup();

        this.bindDyeFramebuffer();
        drawImage(this.gl, {
            image: imageTexture,
            x: this.dyeRes[0] / 2,
            y: this.dyeRes[1] / 2,
            width,
            height,
            destWidth: this.dyeRes[0],
            destHeight: this.dyeRes[1],
            quadBufferInfo: this.quadBufferInfo,
        });
        this.swap('dyeTexture', 'dyeTempTexture');

        this.bindSimFramebuffer();
        drawImage(this.gl, {
            image: imageTexture,
            x: this.simRes[0] / 2,
            y: this.simRes[1] / 2,
            width,
            height,
            destWidth: this.simRes[0],
            destHeight: this.simRes[1],
            quadBufferInfo: this.quadBufferInfo,
        });
        this.swap('velocityTexture', 'simTexture');

        this.bindSimFramebuffer();
        drawImage(this.gl, {
            image: imageTexture,
            x: this.simRes[0] / 2,
            y: this.simRes[1] / 2,
            width,
            height,
            destWidth: this.simRes[0],
            destHeight: this.simRes[1],
            quadBufferInfo: this.quadBufferInfo,
        });
        this.swap('temperatureTexture', 'simTexture');
    }
}
