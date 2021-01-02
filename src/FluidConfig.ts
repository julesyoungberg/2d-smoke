import { GUI } from 'dat.gui';
import { makeNoise2D } from 'open-simplex-noise';

import { hsvToRgb } from './util/color';

const noise = makeNoise2D(Date.now());

type ColorMode = 'rainbow' | 'static';
type PointerMode = 'flame' | 'hand' | 'obstacle';
type RenderMode = 'color' | 'dpt' | 'velocity';

export default class FluidConfig {
    // texture resolutions
    simResolution = 128;
    dyeResolution = 512;

    // fluid properties
    buoyancy = 1;
    buoyancyKappa = 0.25;
    buoyancySigma = 0.1;
    color = [100, 100, 100];
    densityDissipation = 0.05;
    gravity = 5;
    pressure = 0.8;
    // rest temperature of the fluid
    // 10 for smok
    // 15 for clouds
    restTemp = 10;
    temperatureDissipation = 0.2;
    velocityDissipation = 0.2;
    viscosity = 0.101;
    vorticity = 30;

    // sim config
    candle = true;
    colorMode: ColorMode = 'rainbow';
    colorRate = 5;
    colorOffset = 0;
    noiseX = 0.0;
    pointerMode: PointerMode = 'flame';
    pressureIterations = 50;
    renderMode: RenderMode = 'color';
    splatRadius = 0.5;
    splatForce = 6000;

    constructor(gui: GUI) {
        this.colorOffset = Math.random();

        // gui.add(this, 'renderMode', ['color', 'velocity', 'dpt']);
        gui.add(this, 'pointerMode', ['flame', 'hand', 'obstacle']);
        gui.add(this, 'candle');

        const color = gui.addFolder('color');
        color.open();
        color.add(this, 'colorMode', ['rainbow', 'static']).onChange((val) => {
            if (val === 'static') {
                this.color = this.getCurrentColor().map((c) => c * 255 * 50);
            }
            gui.updateDisplay();
        });
        color.add(this, 'colorRate', 0, 10);
        color.addColor(this, 'color');

        const fluid = gui.addFolder('fluid');
        fluid.open();
        fluid.add(this, 'buoyancy', 0, 1);
        fluid.add(this, 'gravity', 0, 30);
        fluid.add(this, 'vorticity', 0, 100);
        fluid.add(this, 'densityDissipation', 0, 0.5);
        fluid.add(this, 'temperatureDissipation', 0, 0.5);
        fluid.add(this, 'velocityDissipation', 0, 0.5);

        const advanced = fluid.addFolder('advanced');
        advanced.add(this, 'buoyancyKappa', 0, 1);
        advanced.add(this, 'buoyancySigma', 0, 1);
        advanced.add(this, 'pressure', 0, 1);
        advanced.add(this, 'restTemp', 0, 30);
        advanced.add(this, 'viscosity', 0, 500);

        const controls = gui.addFolder('simulation');
        controls.add(this, 'splatRadius', 0, 2.0);
        controls.add(this, 'splatForce', 0, 10000);
    }

    reset() {
        this.colorOffset = Math.random();
    }

    getCurrentColor() {
        const n = (noise(this.noiseX, 0) + 1) * 0.5;
        this.noiseX += this.colorRate / 40000;
        return hsvToRgb((n * 3 + this.colorOffset) % 1, 0.8, 0.5).map((c) => c / 40);
    }

    getColor() {
        switch (this.colorMode) {
            case 'rainbow':
                return this.getCurrentColor();
            default:
                return this.color.map((c) => c / (255 * 50));
        }
    }
}
