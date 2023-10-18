import React, { useEffect, useRef } from "react";
import { useAppContext, useAppDispatch } from "@/context/AppContext";
import { useChange } from "./useChange";
import { setPixiApp, setupResizeHandler } from "./system";
import { MAX_ANIMATION_DURATION, ViewContext } from "./defs";
import * as moment from 'moment-timezone';
import { ContextChange } from "@/context/defs";
import { drawNodes, getForcedLayout } from "./helpers";


// ---------------------------
const RealtimeView = ({  }) => {

    const context = useAppContext();
    const dispatch = useAppDispatch();

    // console.log('context', context);


    const vcRef = useRef({} as ViewContext);
    const vc = vcRef.current; 
    vc.context = context;

    
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


    useChange(context, (prev, current) => {
        // console.log('context updated', current);
    });


    const mainLoop = (vc: ViewContext) => {

        // console.log('tick', vc, vc.context);

        // if the screen is empty and there are new blocks
        const now = moment().unix();
        const thisContext = vc.context;
        if ((!vc.startTs ||  now > vc.startTs + vc.duration) && thisContext.blocks.length > 0) {
            // new animation 
            vc.startTs = now;
            vc.duration = MAX_ANIMATION_DURATION;            
            vc.block = thisContext.blocks[0];  // remove first 


            dispatch({type: ContextChange.POP_FIRST_BLOCK });

            console.log('animate', vc.block.block_number, vc.block, thisContext);

            // console.log(JSON.stringify(thisContext));


            // get force layout

            getForcedLayout(vc);
            drawNodes(vc);

            // start ticker 
        }

    }


    useEffect(() => {
        // Set up an interval to update the ticker value every second
        const interval = setInterval(() => {
            mainLoop(vcRef.current);
        }, 1000 / 30);
    
        // Clean up the interval on component unmount
        return () => clearInterval(interval);
    }, []);


    return <div ref={ref} />;
};


export default RealtimeView;

