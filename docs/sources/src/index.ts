import "./styles.css";
import { generateData, Node, Link } from "./data-gen";
import { Graph, GraphConfigInterface } from "@cosmograph/cosmos";
import { CosmosLabels } from "./labels";

const canvas = document.querySelector("canvas") as HTMLCanvasElement;
const div = document.querySelector("#labels") as HTMLDivElement;

const cosmosLabels = new CosmosLabels<Node, Link>(div);
let graph: Graph<Node, Link>;
let selectedNode: Node | undefined;
let currentGraphData: {nodes: Node[], links: Link[]};
let mostImportantNodes: Node[] = [];

const config: GraphConfigInterface<Node, Link> = {
  backgroundColor: "#222222",
  nodeSize: n => 3 * (1 + (n.ratio ?? 0)),
  nodeColor: node => node.color!,
  linkColor: "#666666",
  linkArrows: false,
  linkWidth: 0.1,
  linkGreyoutOpacity: 0.5,
  pixelRatio: 2,
  useQuadtree: false,
  simulation: {
    decay: 1000,
    center: 0,
    repulsionQuadtreeLevels: 12,
    linkDistRandomVariationRange: [1, 1.2],
    repulsionFromMouse: 2,
    linkDistance: 10,
    linkSpring: 1,
    repulsion: 1,
    repulsionTheta: 1.15,
    friction: 0.85,
    gravity: 0.25,
    onTick: (alpha) => onTick(alpha),
  },
  events: {
    onClick: (node, i, pos, event) => onPointClick(node),
    onNodeMouseOver: (hoverNode, _, nodePostion) => {
      cosmosLabels.updateHoveredNodeLabel(hoverNode, nodePostion);
    },
    onNodeMouseOut: () => {
      cosmosLabels.updateHoveredNodeLabel();
    },
    onZoom: () => {
      cosmosLabels.updateHoveredNodeLabel();
      cosmosLabels.updateTrackedNodesLabels(selectedNode);
    }
  }
};

graph = new Graph(canvas, config);
cosmosLabels.cosmos = graph;

generateData()
  .then((result) => {
    const {nodes, links} = result;
    currentGraphData = result;
    graph.setData(nodes, links);
    updateMostImportantLabels();
    initializeSearchBox();

    cosmosLabels.trackNodes(mostImportantNodes);
  });

const updateMostImportantLabels = () => {
  if (!graph || !cosmosLabels) return;
  mostImportantNodes = getMostImportantNodes(currentGraphData.nodes);
}

const getMostImportantNodes = (nodes: Node[], count = 100): Node[] => {
  return nodes.filter((n) => n.id !== undefined)
    .sort((a, b) => b.totalLinks! - a.totalLinks!)
    .slice(0, count);
}

let prevAlpha: number = 1;
const onTick = (alpha?: number) => {
  if (alpha && Math.abs(prevAlpha - alpha) > 0.02) {
    prevAlpha = alpha;
    cosmosLabels.updateTrackedNodesLabels(selectedNode);
  }
}

const onPointClick = (node?: Node) => {
  selectedNode = node;
  cosmosLabels.resetNodes();
  if (node) {
    graph.selectNodeById(node.id, true);
    var adjacentNodes = graph.getAdjacentNodes(node.id);
    if (adjacentNodes) {
      var addNodes = adjacentNodes.filter(n => n.id !== node.id).sort((a, b) => b.totalLinks! - a.totalLinks!).slice(0, 50);
      cosmosLabels.trackNodes([node, ...addNodes]);
    } else {
      cosmosLabels.trackNodes([node]);
    }

    $("#selected-area").show();
    $("#selected-node").text(node.id);
    $("#input-links").text(node.inputLinks);
    $("#output-links").text(node.outputLinks);
  } else {
    graph.unselectNodes();
    cosmosLabels.trackNodes(mostImportantNodes);
    $("#selected-area").hide();
  }
  cosmosLabels.updateTrackedNodesLabels();
}

/* ~ Demo Actions ~ */
// Start / Pause
let isPaused = false;
$("#pause").on("click", function() {
  if (isPaused) {
    isPaused = false;
    $(this).text("Pause");
    graph.start();
  } else {
    isPaused = true;
    $(this).text("Start");
    graph.pause();
  }
});

$("#fit-view").on("click", function() {
  graph.fitView();
});

function initializeSearchBox() {
  let data = [{ id: "", text: "-"}, ...currentGraphData.nodes.map(node => ({ id: node.id, text: node.id }))];
  // @ts-ignore
  $("#node-search").select2({
    placeholder: "Search node",
    allowClear: true,
    minimumInputLength: 3,
    data: data,
    matcher: matchStart,
  });

  $("#nodes").text(currentGraphData.nodes.length);
  $("#links").text(currentGraphData.links.length);
}

// @ts-ignore
function matchStart(params, data) {
  if (params.term.length < 3) {
    return null;
  }
  // Do not display the item if there is no 'text' property
  if (typeof data.text === 'undefined') {
    return null;
  }
  const term = params.term.toUpperCase();
  const text = data.text.toUpperCase();
  if (text.indexOf(term) > -1) {
    return data;
  }
  return null;
}

// @ts-ignore
$("#node-search").on("select2:select", function(e) {
  const data = e.params.data;
  const index = currentGraphData.nodes.findIndex(n => n.id === data.id);
  const node = currentGraphData.nodes[index];
  onPointClick(node);
});
// @ts-ignore
$("#node-search").on("select2:unselect", function(e) {
  onPointClick();
});


