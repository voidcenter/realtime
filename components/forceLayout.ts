import * as d3 from "d3";
import { ViewContext } from "./defs";



// export function getForcedLayout(vc: ViewContext) {
//     const width = vc.app.screen.width;
//     const height = vc.app.screen.height;

//     // prep nodes / links 




//     // force layout
//     const simulation = d3.forceSimulation(vc.nodes)
//     .force("link", d3.forceLink(vc.links) // This force provides links between nodes
//         .id((d) => d.id) // This sets the node id accessor to the specified function. If not specified, will default to the index of a node.
//         .distance(50))
//     .force("charge", d3.forceManyBody().strength(-1000)) // This adds repulsion (if it's negative) between nodes.
//     .force("center", d3.forceCenter(width / 2, height / 2))
//     .force("collision", d3.forceCollide().radius((d) => d.radius).iterations(2))
//     .velocityDecay(0.8)
//     .stop();


//     // const rect = new Graphics().lineStyle(5, 0xFF0000).drawRect(0, 0, defs.WORLD_WIDTH, defs.WORLD_HEIGHT);
//     // vc.viewport.addChild(rect);
// }


