export function swap(o: any, a: string, b: string) {
    const t: any = o[a];
    o[a] = o[b];
    o[b] = t;
}

export function scaleByPixelRatio(input: number) {
    const pixelRatio = window.devicePixelRatio || 1;
    return Math.floor(input * pixelRatio);
}

export function getMouseXY(e: MouseEvent) {
    return { x: scaleByPixelRatio(e.offsetX), y: scaleByPixelRatio(e.offsetY) };
}

export function getTouchXY(e: Touch) {
    return { x: scaleByPixelRatio(e.pageX), y: scaleByPixelRatio(e.pageY) };
}