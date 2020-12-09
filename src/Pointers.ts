import Pointer from './Pointer';

import { getMouseXY, getTouchXY } from './util';

/**
 * Tracks mouse and touch events for interaction
 */
export default class Pointers {
    pointers: Pointer[] = [];

    constructor(readonly canvas: HTMLCanvasElement) {
        this.pointers.push(new Pointer(canvas));
    }

    setup() {
        this.canvas.addEventListener('mousedown', (e: MouseEvent) => {
            const { x, y } = getMouseXY(e);
            let pointer = this.pointers.find((p) => p.id === -1);
            if (!pointer) {
                pointer = new Pointer(this.canvas);
                this.pointers.push(pointer);
            }
            pointer.onDown(-1, x, y);
        });

        this.canvas.addEventListener('mousemove', (e: MouseEvent) => {
            const pointer = this.pointers[0];
            if (!pointer?.down) {
                return;
            }

            const { x, y } = getMouseXY(e);
            pointer.onMove(x, y);
        });

        this.canvas.addEventListener('mouseup', () => {
            this.pointers[0].onUp();
        });

        this.canvas.addEventListener('touchstart', (e: TouchEvent) => {
            e.preventDefault();
            const touches = e.targetTouches;
            while (touches.length >= this.pointers.length) {
                this.pointers.push(new Pointer(this.canvas));
            }

            Array.from(touches).forEach((touch, i) => {
                const { x, y } = getTouchXY(touch);
                this.pointers[i + 1].onDown(touches[i].identifier, x, y);
            });
        });

        this.canvas.addEventListener('touchmove', (e: TouchEvent) => {
            e.preventDefault();
            const touches = e.targetTouches;

            Array.from(touches).forEach((touch, i) => {
                const pointer = this.pointers[i + 1];
                if (!pointer.down) {
                    return;
                }

                const { x, y } = getTouchXY(touch);
                pointer.onMove(x, y);
            });
        });

        this.canvas.addEventListener('touchend', (e: TouchEvent) => {
            e.preventDefault();
            const touches = e.changedTouches;

            Array.from(touches).forEach((touch) => {
                const pointer = this.pointers.find((p) => p.id === touch.identifier);
                pointer?.onUp();
            });
        });
    }
}
