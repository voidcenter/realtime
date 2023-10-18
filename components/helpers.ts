import * as d3 from "d3";
import { ViewContext } from "./defs";
import { Graphics } from "pixi.js";
import { Container, Point } from "pixi.js";
import { Link } from "@/context/defs";

const SCREEN_NODE_SIZE = 24;


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

    const nSteps = 100;
    for (let i=0; i<nSteps; i++) {
        simulation.tick(1);
        getTickFunction(vc)();
    }

    console.log('sim', nodes);
    // const rect = new Graphics().lineStyle(5, 0xFF0000).drawRect(0, 0, defs.WORLD_WIDTH, defs.WORLD_HEIGHT);
    // vc.viewport.addChild(rect);
}




export function drawNodes(vc: ViewContext) {

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

