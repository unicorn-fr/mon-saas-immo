declare module 'jscanify' {
  interface CornerPoints {
    topLeftCorner: { x: number; y: number } | null
    topRightCorner: { x: number; y: number } | null
    bottomLeftCorner: { x: number; y: number } | null
    bottomRightCorner: { x: number; y: number } | null
  }
  export default class jscanify {
    constructor()
    findPaperContour(img: any): any | null
    getCornerPoints(contour: any, img: any): CornerPoints
    highlightPaper(image: HTMLCanvasElement | HTMLImageElement | HTMLVideoElement, options?: { color?: string; thickness?: number }): HTMLCanvasElement
    extractPaper(image: HTMLCanvasElement | HTMLImageElement | HTMLVideoElement, resultWidth: number, resultHeight: number, cornerPoints?: CornerPoints): HTMLCanvasElement | null
  }
}
