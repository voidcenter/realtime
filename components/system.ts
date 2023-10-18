import { Application } from "pixi.js";
import { VIEW_ASPECT_RATIO, ViewContext } from "./defs";



export function setPixiApp(parentRef): { app }  {

    const app = new Application({
        width: 10,
        height: 10,
        backgroundAlpha: 0,
        antialias: true,
        autoDensity: true,
    });
        
    globalThis.__PIXI_APP__ = app;
    
    // On first render add app to DOM
    app.renderer.resize(window.innerWidth, window.innerWidth * VIEW_ASPECT_RATIO);
    parentRef.current.replaceChildren(app.view);
    
    return { app };
}


export const setupResizeHandler = (vc: ViewContext) => {
    function handleResize() {
        vc.app.renderer.resize(window.innerWidth, window.innerWidth * VIEW_ASPECT_RATIO);
    }
    window.addEventListener('resize', handleResize)
    return () => {
        window.removeEventListener('resize', handleResize)
    }
}


