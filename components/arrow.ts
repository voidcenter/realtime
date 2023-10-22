
import { Graphics, Polygon, Container, Point, Circle } from "pixi.js";
import { SCREEN_NODE_SIZE } from "./defs";




const ARROW_BORDER_COLOR = 0x000000;
const ARROW_BORDER_COLOR_RED = 0xff0000;

const CURVATURE = 1
const getCurveNSegs = (norm) => Math.max(1, Math.round(norm / 10));
const getDefaultArrow = (xyFrom, xyTo) => 
    new Graphics().lineStyle(1, ARROW_BORDER_COLOR_RED, 1).moveTo(xyFrom.x, xyFrom.y).lineTo(xyTo.x, xyTo.y);


const getNorm = (x1, y1, x2, y2) => {
    const dx = x1 - x2;
    const dy = y1 - y2;
    return Math.sqrt(dx * dx + dy * dy);
}


export const myRange = (start, end, length = end - start) =>
  Array.from({ length }, (_, i) => start + i)


const drawLine = (gfx: Graphics, pts: { x: number, y: number }[]) => {
    gfx.moveTo(pts[0].x, pts[0].y);
    for (let i=0; i<pts.length; i++) {
        gfx.lineTo(pts[i].x, pts[i].y);
    }
}

  

export function curvedArrow(xyFrom, xyTo, color, width, originalWidth, outbound, timeAlpha): 
    { baseline: Graphics, arrow: Graphics } | null {

    // curve right for outbound and left for inbound
    const norm = getNorm(xyFrom.x, xyFrom.y, xyTo.x, xyTo.y);
    if (norm === 0) {
        return null;
    }

    // timeAlpha = 0.05;

    // This is our normal vector. It describes direction of the graph
    // link, and has length == 1:
    const nx = (xyTo.x - xyFrom.x) / norm; 
    const ny = (xyTo.y - xyFrom.y) / norm;
    const headShrink = SCREEN_NODE_SIZE;

    // left direction 
    const inbound_multiplier = (!outbound) ? 1 : -1;   // 1 if inbound, -1 if outbound
    const oNx = -inbound_multiplier * ny;   // right for inbound, left for outbound
    const oNy = inbound_multiplier * nx;

    // find curvature origin 
    const perpExtend = norm / CURVATURE;
    const ox = (xyFrom.x + xyTo.x) / 2 + oNx * perpExtend;
    const oy = (xyFrom.y + xyTo.y) / 2 + oNy * perpExtend;
    const getPt = (ext, r) => ({ x: ox + ext * Math.cos(r), y: oy + ext * Math.sin(r) });

    const extend = getNorm(xyFrom.x, xyFrom.y, ox, oy);
    const radiousEndCut = headShrink / extend;

    // get arrow radius range, removing both ends and the arrow haad 
    let sa = Math.atan2(xyFrom.y - oy, xyFrom.x - ox);
    let ea = Math.atan2(xyTo.y - oy, xyTo.x - ox);

    // this is tricky, because the axis is mirrored 
    //   for outbound: we the drawing count-clockwise on screen, but clockwise in axis, so ea < sa 
    //   for inbound: we draw clockwise on screen but counter-clockwise in axis, ea > sa     
    ea = inbound_multiplier * (ea - sa) > 0 ? ea : ea + inbound_multiplier * Math.PI * 2;


    let baseRadius;
    let tipRadius;
    let bodyRadius;
    let dRadious;
    let radiuses;

    // get arrow body radiuses 
    let nSegs = getCurveNSegs(norm);

    let baseline = new Graphics();



    
    baseRadius = sa + inbound_multiplier * radiousEndCut;
    tipRadius = ea - inbound_multiplier * radiousEndCut;
    bodyRadius = tipRadius - baseRadius;

    dRadious = bodyRadius / nSegs;    // dRadious > 0 for inbound, < 0 for outbound
    radiuses = myRange(0, nSegs + 1).map(i => baseRadius + i * dRadious);
    const midPts = radiuses.map(r => getPt(extend, r));
    baseline.moveTo(midPts[0].x, midPts[0].y);
    for (let i=1; i<midPts.length; i++) {
        if (i % 2 === 1) {
            baseline.lineStyle(1, 0xCBC9D3, 1);
        } else {
            baseline.lineStyle(1, 0xCBC9D3, 1);
        }
        baseline.lineTo(midPts[i].x, midPts[i].y);
    }




    baseRadius = sa + inbound_multiplier * radiousEndCut;
    tipRadius = ea - inbound_multiplier * radiousEndCut;

    // arrow head 
    const ahWidth = 6 + width;
    const ahLength = (4 + originalWidth) * 2;
    const ahRadius = ahLength / extend;
    const arrowTotalLengthMultiplier = 8;

    const ahCut = inbound_multiplier * ahRadius;
    tipRadius = baseRadius + (tipRadius - ahCut - baseRadius) * timeAlpha + ahCut;
    baseRadius = Math.max(baseRadius, tipRadius - ahRadius * arrowTotalLengthMultiplier);

    // sa += inbound_multiplier * radiousEndCut;            
    // ea -= inbound_multiplier * radiousEndCut;

    // get arrow body radious
    bodyRadius = (tipRadius - inbound_multiplier * ahRadius) - baseRadius;
    if (inbound_multiplier * bodyRadius < 0) {
        // during force layouting, this can temporarily happen
        return null;
    }


    nSegs = getCurveNSegs(ahLength * arrowTotalLengthMultiplier);
    // console.log('nSegs = ', nSegs);
    dRadious = bodyRadius / nSegs;    // dRadious > 0 for inbound, < 0 for outbound
    radiuses = myRange(0, nSegs + 1).map(i => baseRadius + i * dRadious);
    // const radiuses = myRange(0, nSegs + 1).map(i => baseRadius + i * dRadious * timeAlpha);

    // get arrow body points 
    const insidePts = radiuses.map(r => getPt(extend - width / 2, r));
    const outsidePts = radiuses.map(r => getPt(extend + width / 2, r));

    // get arrow head points
    // tipRadius = sa + (ea - sa) * timeAlpha;
    const tip = getPt(extend, tipRadius);
    const leftWing = getPt(extend - ahWidth / 2, tipRadius - inbound_multiplier * ahRadius);
    const rightWing = getPt(extend + ahWidth / 2, tipRadius - inbound_multiplier * ahRadius);
    
    // draw 
    const maxAlpha = 1;
    const arrow = new Graphics()
        .lineStyle(0, ARROW_BORDER_COLOR, maxAlpha);


    const arrowColor = 0xD6C0BA; // 0xC5A992;
    const arrowCountourColor = 0x939393; //0x000000;

    let pts = [outsidePts[nSegs], rightWing, tip, leftWing, insidePts[nSegs]];
    arrow.beginFill(arrowColor)
        .drawPolygon(pts)
        .endFill()
        .lineStyle(1, arrowCountourColor, maxAlpha);
    drawLine(arrow, pts);


    if (width > 0) {
        for (let i=0; i<nSegs; i++) {
            let pts = [outsidePts[i], outsidePts[i + 1], insidePts[i + 1], insidePts[i]];
            arrow.lineStyle(0)
                .beginFill(arrowColor, i / nSegs * maxAlpha)
                .drawPolygon(pts)
                .endFill();
            
            arrow.lineStyle(1, arrowCountourColor, i / nSegs * maxAlpha);
            arrow.moveTo(outsidePts[i].x, outsidePts[i].y);
            arrow.lineTo(outsidePts[i + 1].x, outsidePts[i + 1].y);
            arrow.moveTo(insidePts[i].x, insidePts[i].y);
            arrow.lineTo(insidePts[i + 1].x, insidePts[i + 1].y);
        }
    }


    arrow.eventMode = 'static';
    arrow.hitArea = new Polygon(pts);
    return { baseline, arrow };
}


