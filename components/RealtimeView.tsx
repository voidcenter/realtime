import React, { useEffect, useRef } from "react";
import { settings, SCALE_MODES, Application, Graphics, Container } from "pixi.js";


const VIEW_ASPECT_RATIO = 9 / 16;


function setPixiApp(parentRef): { app }  {

    const app = new Application({
        width: 10,
        height: 10,
        backgroundAlpha: 0,
        antialias: true,
        autoDensity: true,
    });
    
    console.log('test');
    
    globalThis.__PIXI_APP__ = app;
    
    // On first render add app to DOM
    app.renderer.resize(window.innerWidth, window.innerWidth * VIEW_ASPECT_RATIO);
    parentRef.current.replaceChildren(app.view);
    
    return { app };
}


const setupResizeHandler = (vc) => {
    function handleResize() {
        vc.app.renderer.resize(window.innerWidth, window.innerWidth * VIEW_ASPECT_RATIO);
    }
    window.addEventListener('resize', handleResize)
    return () => {
        window.removeEventListener('resize', handleResize)
    }
}


// ---------------------------
const RealtimeView = ({  }) => {

    // const context = useAppContext();
    // const dispatch = useAppDispatch();

    const vcRef = useRef({});
 
    useEffect(() => {
        return setupResizeHandler(vcRef.current);
    });

    const ref = useRef(null);
    useEffect(() => {
        console.log('PixiApp useEffect');
        const { app } = setPixiApp(ref);
        vcRef.current.app = app;
        app.start();

        return () => {
            app.stop();
        };
    }, []);

    return <div ref={ref} />;
};


export default RealtimeView;

