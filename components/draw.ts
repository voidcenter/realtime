import * as d3 from "d3";
import { SCREEN_NODE_SIZE, ViewContext } from "./defs";
import { Graphics, Polygon, Container, Point, Circle } from "pixi.js";
import { Link } from "@/context/defs";
import { curvedArrow } from "./arrow";





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

        // console.log('contrain nodes');
    };
}





export function getForcedLayout(vc: ViewContext) {
    const width = vc.app.screen.width;
    const height = vc.app.screen.height;

    // prep nodes / links 

    // force layout
    const block = vc.block;
    const nodes = block.addresses.map(address => ({
        address,
    }));
    // console.log('nodes', nodes);

    // we need this to pass nodes to tick
    vc.vg = {
        nodes,
        links: block.links,
        selectedNode: null,
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

    // console.log('sim', nodes);
    // const rect = new Graphics().lineStyle(5, 0xFF0000).drawRect(0, 0, defs.WORLD_WIDTH, defs.WORLD_HEIGHT);
    // vc.viewport.addChild(rect);
}


function clearView(vc: ViewContext) {
    // remove previous nodes 
    while (vc.app.stage.children[0]) { 
        const cont = vc.app.stage.children[0];

        while (cont.children[0]) {  
            const nod = cont.children[0] as any;
            cont.removeChild(nod);
            nod.destroy();
        }

        vc.app.stage.removeChild(cont);
        cont.destroy();
    }    
}




const getLinkWidth = (amount, highlight) => {
    // console.log(amount, highlight, Math.log10(amount + 1) / 2 + 1 + highlight ? 2 : 0);
    const baseWidth = Math.max(1, Math.log10(amount + 1) / 2);
    const adjustedWidth = baseWidth + (highlight ? 2 : 0);
    return { baseWidth, adjustedWidth };
}



export function drawNodes_arrows(vc: ViewContext) {

    if (!vc.vg) { 
        console.log('!vc.vg   !');
        return;
    }

    clearView(vc);

    // draw nodes 
    const container = new Container();
    container.sortableChildren = true;
    vc.app.stage.addChild(container);

    vc.vg.nodes.forEach((node) => {

        // 0xFCE20F
        const selected = vc.vg.selectedNode == node; 
        const gfx = new Graphics()
            .beginFill(selected ? 0x0000ff : 0xC74855, 1)
            .lineStyle(1, 0x000000)
            .drawCircle(0, 0, selected ? SCREEN_NODE_SIZE * 1.2 : SCREEN_NODE_SIZE) 
            .endFill();
        gfx.zIndex = 3;
        gfx.eventMode = 'static';
        gfx.hitArea = new Circle(0, 0, SCREEN_NODE_SIZE);

        gfx.position = new Point(node.x, node.y);

        gfx.on('mouseenter', () => {
            // console.log('ya', node);
            vc.vg.selectedNode = node;
        });

        gfx.on('mouseleave', () => {
            // console.log('ya', node);
            vc.vg.selectedNode = null;
        });

        gfx.on('pointerdown', () => {
            const url = `${vc.addressUrlPrefix}${'' + node.address}`;
            console.log('go', url, node);
            window.open(url, '_blank').focus();
        });

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


