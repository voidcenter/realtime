import React, { useEffect, useRef } from "react";
import { useAppContext, useAppDispatch } from "@/context/AppContext";
import { useChange } from "./useChange";
import { setPixiApp, setupResizeHandler } from "./system";
import { MAX_ANIMATION_DURATION, ViewContext } from "./defs";
import moment from 'moment-timezone';
import { ContextChange } from "@/context/defs";
import { drawNodes_arrows, getForcedLayout } from "./draw";


// ---------------------------
const RealtimeView = ({ setBlockNumber, addressUrlPrefix, graphData }) => {

    const context = useAppContext();
    const dispatch = useAppDispatch();

    // console.log('context', context);


    const vcRef = useRef({ } as ViewContext);
    const vc = vcRef.current; 
    vc.context = context;
    vc.addressUrlPrefix = addressUrlPrefix;
    vc.graphData = graphData;

    
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


    const mainLoop = (vc: ViewContext) => {

        // console.log('tick', vc, vc.context);

        // if the screen is empty and there are new blocks
        const now = moment().unix();
        const thisContext = vc.context;
        if ((!vc.startTs ||  now > vc.startTs + vc.duration) && thisContext.blocks.length > 0) {
            // new animation 

            if (vc.block && thisContext.blocks[0].block_number <= vc.block.block_number) {
                dispatch({type: ContextChange.POP_FIRST_BLOCK });
                return;
            }

            vc.startTs = now;
            vc.duration = MAX_ANIMATION_DURATION;            
            vc.block = thisContext.blocks[0];  // remove first 
            setBlockNumber(vc.block.block_number);

            dispatch({type: ContextChange.POP_FIRST_BLOCK });

            console.log('animate', vc.block.block_number, vc.block, thisContext);

            console.log(JSON.stringify(thisContext));

            getForcedLayout(vc);

            vc.timeAlpha = 0;
            // drawNodes(vc);
            drawNodes_arrows(vc);
        } else {

            const nowMs = moment().valueOf();

            // animating 
            vc.timeAlpha = (nowMs - vc.startTs * 1000) / (vc.duration * 1000);
            vc.timeAlpha = Math.min(1, vc.timeAlpha);
            // console.log('time is ', vc.timeAlpha, now, vc.startTs, vc.duration);

            drawNodes_arrows(vc);

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

