import * as d3 from "d3";
import { ViewContext } from "./defs";
import { Graphics, Polygon, Container, Point } from "pixi.js";
import { Link } from "@/context/defs";

const SCREEN_NODE_SIZE = 12;


// 找最大的transfers 。。。 max 50 nodes?   筛选规则
// 往两边铺开
// 显示arrow



function getTickFunction(vc: ViewContext): () => void {
    return () => {
        
        const width = vc.app.screen.width;
        const height = vc.app.screen.height;

        const ox = width / 2;
        const oy = height / 2;

        const xArr = vc.vg.nodes.map(c => c.x);
        const yArr = vc.vg.nodes.map(c => c.y);
        
        const xSpan = Math.max(...xArr) - Math.min(...xArr);
        const ySpan = Math.max(...yArr) - Math.min(...yArr);

        const targetSpan = 0.8;
        const xMul = width * targetSpan / xSpan;
        const yMul = height * targetSpan / ySpan;
        
        vc.vg.nodes.forEach((node) => {
            // node.x = Math.max(SCREEN_NODE_SIZE, Math.min(width - SCREEN_NODE_SIZE, node.x)); 
            // node.y = node.y / width * height;
            // node.y = Math.max(SCREEN_NODE_SIZE, Math.min(height - SCREEN_NODE_SIZE, node.y)); 
            node.x = ox + (node.x - ox) * xMul;
            node.y = oy + (node.y - oy) * yMul;
        });

        console.log('contrain nodes');
    };
}





export function getForcedLayout(vc: ViewContext) {
    const width = vc.app.screen.width;
    const height = vc.app.screen.height;

    // prep nodes / links 

    // force layout
    const block = vc.block;
    const nodes = block.addresses.map(address => ({
        address
    }));
    console.log('nodes', nodes);

    // we need this to pass nodes to tick
    vc.vg = {
        nodes,
        links: block.links
    }

    const simulation = d3.forceSimulation(nodes)
        .force("link", d3.forceLink(block.links) // This force provides links between nodes
            // .id((d) => d.id) // This sets the node id accessor to the specified function. If not specified, will default to the index of a node.
        .distance(50))
        .force("charge", d3.forceManyBody().strength(-3000)) // This adds repulsion (if it's negative) between nodes.
        .force("center", d3.forceCenter(width / 2, height / 2))
        .force("collision", d3.forceCollide().radius((d) => d.radius).iterations(2))
        .velocityDecay(0.9)
        .stop();
        // .on("tick", getTickFunction(vc));

    const nSteps = 10;
    for (let i=0; i<nSteps; i++) {
        simulation.tick(1);
        getTickFunction(vc)();
    }

    console.log('sim', nodes);
    // const rect = new Graphics().lineStyle(5, 0xFF0000).drawRect(0, 0, defs.WORLD_WIDTH, defs.WORLD_HEIGHT);
    // vc.viewport.addChild(rect);
}


function clearView(vc: ViewContext) {
    // remove previous nodes 
    while (vc.app.stage.children[0]) { 
        const cont = vc.app.stage.children[0];

        while (cont.children[0]) {  
            const nod = cont.children[0];
            cont.removeChild(nod);
            nod.destroy();
        }

        vc.app.stage.removeChild(cont);
        cont.destroy();
    }    
}



export function drawNodes(vc: ViewContext) {

    clearView(vc);


    // draw nodes 
    const container = new Container();
    container.sortableChildren = true;
    vc.app.stage.addChild(container);

    vc.vg.nodes.forEach(({ x, y }) => {
        const gfx = new Graphics()
            .beginFill(0xffffff, 1)
            .lineStyle(1, 0x000000)
            .drawCircle(0, 0, SCREEN_NODE_SIZE)
            .endFill();
        gfx.zIndex = 2;
        gfx.position = new Point(x, y);
        container.addChild(gfx);   
    });


    vc.vg.links.forEach((link) => {
        console.log(link.source.index);
        const from = vc.vg.nodes[link.source.index];
        const to = vc.vg.nodes[link.target.index];
        const gfx = new Graphics()
            .lineStyle(1, 0x000000)
            .moveTo(from.x, from.y)
            .lineTo(to.x, to.y);
        gfx.zIndex = 1;
        container.addChild(gfx);       
    });

}




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
        return getDefaultArrow(xyFrom, xyTo); // if length is 0 - can't render arrows
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




const getLinkWidth = (amount, highlight) => {
    // console.log(amount, highlight, Math.log10(amount + 1) / 2 + 1 + highlight ? 2 : 0);
    const baseWidth = Math.max(1, Math.log10(amount + 1) / 2);
    const adjustedWidth = baseWidth + (highlight ? 2 : 0);
    return { baseWidth, adjustedWidth };
}



export function drawNodes_arrows(vc: ViewContext) {

    clearView(vc);

    // draw nodes 
    const container = new Container();
    container.sortableChildren = true;
    vc.app.stage.addChild(container);

    vc.vg.nodes.forEach(({ x, y }) => {
        const gfx = new Graphics()
            .beginFill(0xC74855, 1)
            .lineStyle(1, 0x000000)
            .drawCircle(0, 0, SCREEN_NODE_SIZE)
            .endFill();
        gfx.zIndex = 3;
        gfx.position = new Point(x, y);
        container.addChild(gfx);   
    });

        // const gfx = curvedArrow(from, to, 0x000000, width, width, false);


    vc.vg.links.forEach((link) => {
        // console.log(link.source.index);
        const from = vc.vg.nodes[link.source.index];
        const to = vc.vg.nodes[link.target.index];

        const { baseWidth, adjustedWidth } = getLinkWidth(link.amount, false);
        const gfxs = curvedArrow(from, to, 0x000000, baseWidth, baseWidth, false, vc.timeAlpha);
        if (gfxs) {
            const { baseline, arrow } = gfxs;
            if (baseline && arrow) {
                baseline.zIndex = 1;
                arrow.zIndex = 2;
                // console.log('add gfx', from, to, link.amount);
                container.addChild(baseline);
                container.addChild(arrow);
            }
        }
    });
}


