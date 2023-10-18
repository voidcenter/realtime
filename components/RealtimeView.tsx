import React, { useEffect, useRef } from "react";
import { ContextChange, useAppContext, useAppDispatch } from "@/context/AppContext";
import { useChange } from "./useChange";
import { setPixiApp, setupResizeHandler } from "./system";
import { MAX_ANIMATION_DURATION, ViewContext } from "./defs";
import * as moment from 'moment-timezone';


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


            // async update context 
            const newContext = { 
                blockEvents: [ 
                    ... thisContext.blocks 
                ] 
            };
            // dispatch({type: ContextChange.SET_DATA, newContext });

            console.log('animate', vc.block.blockNumber, vc.block, thisContext);

            // console.log(JSON.stringify(thisContext));


            // get force layout
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



// lastAnimating StartTime
// max Aimating Seconds
// min Animating Second 
// 如果很多，就min
// 如果很少，就max
// set then start
// 自己定tick，还是app有tick
// 

