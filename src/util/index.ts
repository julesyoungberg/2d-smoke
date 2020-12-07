export function swap(o: any, a: string, b: string) {
    const t: any = o[a];
    o[a] = o[b];
    o[b] = t;
}
