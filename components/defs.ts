
import { ParsedBlock, Context } from "@/context/defs";
import { Application } from "pixi.js";



export const VIEW_ASPECT_RATIO = 9 / 16;
export const SCREEN_NODE_SIZE = 12;

// in seoncds
// if there are too few blocks, leave the view empty, in a waiting animation 
// if there are too many blocks, ignore some blocks 
export const MAX_ANIMATION_DURATION = 1;
export const MIN_ANIMATION_DURATION = 2;


export interface ViewGraph {
    nodes: any;
    links: any;
    selectedNode?: any;
}


export interface ViewContext {
    app?: Application;
    context?: Context;

    // current animation 
    startTs?: number;
    duration?: number; 

    block?: ParsedBlock;

    vg: ViewGraph;

    timeAlpha: number;
    addressUrlPrefix?: string;

}

