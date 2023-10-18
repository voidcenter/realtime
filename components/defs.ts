
import { ParsedBlock, Context } from "@/context/defs";
import { Application } from "pixi.js";



export const VIEW_ASPECT_RATIO = 9 / 16;

// in seoncds
// if there are too few blocks, leave the view empty, in a waiting animation 
// if there are too many blocks, ignore some blocks 
export const MAX_ANIMATION_DURATION = 5;
export const MIN_ANIMATION_DURATION = 2;


export interface ViewGraph {
    nodes: any;
    links: any;
}


export interface ViewContext {
    app?: Application;
    context?: Context;

    // current animation 
    startTs?: number;
    duration?: number; 

    block?: ParsedBlock;

    vg: ViewGraph;
}

