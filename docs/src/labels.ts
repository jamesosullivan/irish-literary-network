import { LabelRenderer, LabelOptions, CssLabel } from "@interacta/css-labels";
import { CosmosInputNode, CosmosInputLink, Graph } from "@cosmograph/cosmos";

export class CosmosLabels<
  N extends CosmosInputNode,
  L extends CosmosInputLink
> {
  cosmos?: Graph<N, L>;
  cssLabels: LabelRenderer;
  permanentCssLabel: CssLabel;
  trackedNodes: N[] | undefined;
  selectedNodes: Set<N> | undefined;
  isLabelsHidden = false;
  isLabelsDistroyed = false;
  textAccessor = (d: N) => d.id;
  constructor(container: HTMLDivElement) {
    this.cssLabels = new LabelRenderer(container, { pointerEvents: "none" });
    this.permanentCssLabel = new CssLabel(container);
    this.permanentCssLabel.element.style.pointerEvents = "none";
    this.permanentCssLabel.setOpacity(1);
  }

  trackNodes(nodes?: N[]) {
    if (!this.cosmos || !this.cssLabels || this.isLabelsDistroyed) return;

    this.trackedNodes = nodes ? nodes : [];
    this.cosmos.trackNodePositionsByIds((this.trackedNodes).map(d => d.id));
  }

  resetNodes() {
    if (!this.cosmos || !this.cssLabels || this.isLabelsDistroyed) return;
    this.trackedNodes = [];
    this.cosmos.trackNodePositionsByIds([]);
    this.cssLabels.setLabels([]);
    this.cssLabels.draw();
  }

  selectNodes(focusedNode?: N) {
    if (!this.cosmos || !this.cssLabels || this.isLabelsDistroyed) return;

    const selectedNodes: N[] | null = this.cosmos.getSelectedNodes();
    if (selectedNodes) {
      const nodesSet = new Set<N>();
      selectedNodes.forEach(node => {
        nodesSet.add(node);
      });
      this.selectedNodes = nodesSet;
    } else {
      this.selectedNodes = undefined;
    }
    this.updateTrackedNodesLabels(focusedNode);
  }

  updateTrackedNodesLabels(focusedNode?: N) {
    if (!this.cosmos || !this.cssLabels || this.isLabelsDistroyed || this.isLabelsHidden)
      return;
    const { cosmos, selectedNodes } = this;
    let labels: LabelOptions[] = [];
    if (this.trackedNodes) {
      const trackedNodesPositions = cosmos.getTrackedNodePositionsMap();
      // @ts-ignore
      labels = this.trackedNodes.map(p => {
        const {id} = p;
        const text = this.textAccessor(p);
        if (text === undefined)
          return undefined;
        const positions = trackedNodesPositions.get(id);
        const screenPosition = cosmos.spaceToScreenPosition([positions?.[0] ?? 0, positions?.[1] ?? 0]);
        const radius = cosmos.spaceToScreenRadius(cosmos.config.nodeSizeScale * (cosmos.getNodeRadiusById(id) ?? 0));
        let opacity = selectedNodes ? 0.1 : 1;
        if (selectedNodes?.size)
          opacity = selectedNodes.has(p) ? 1 : 0.1;

        return {
          id,
          text: text,
          x: screenPosition[0],
          y: screenPosition[1] - (radius + 2),
          opacity,
          weight: opacity,
          shouldBeShown: focusedNode?.id === id,
          color: "#f5f5f5"
        };
      }).filter((d) => d != undefined);
    }
    this.cssLabels.setLabels(labels);
    this.cssLabels.draw(true);
  }

  updateHoveredNodeLabel(hoveredNode?: N, hoveredNodeSpacePosition?: [number, number]) {
    if (!this.cosmos || !this.permanentCssLabel || this.isLabelsDistroyed || this.isLabelsHidden)
      return;
    const { cosmos } = this;
    const text = hoveredNode && this.textAccessor(hoveredNode);
    if (hoveredNode && hoveredNodeSpacePosition && text != undefined) {
      const screenPosition = cosmos.spaceToScreenPosition(hoveredNodeSpacePosition);
      const radius = cosmos.spaceToScreenRadius(cosmos.config.nodeSizeScale * (cosmos.getNodeRadiusById(hoveredNode.id) ?? 0));
      this.permanentCssLabel.setText(text);
      this.permanentCssLabel.setVisibility(true);
      this.permanentCssLabel.setColor("#f5f5f5")
      this.permanentCssLabel.setPosition(screenPosition[0], screenPosition[1] - (radius + 2));
    } else {
      this.permanentCssLabel.setVisibility(false);
    }
    this.permanentCssLabel.draw();
  }

  show() {
    if (this.isLabelsDistroyed)
      return;
    this.isLabelsHidden = false;
    this.updateTrackedNodesLabels();
    this.cssLabels?.show();
  }

  hide() {
    if (this.isLabelsDistroyed)
      return;
    this.isLabelsHidden = true;
    this.cssLabels?.hide();
  }

  destroy() {
    if (this.isLabelsDistroyed)
      return;
    this.isLabelsDistroyed = true;
    this.permanentCssLabel?.destroy();
    this.cssLabels?.destroy();
  }
}