import style from "./CleverDiagram.css";
import * as d3 from "d3";
import * as ELK from "ELK";
import Component from './Component';
import DiagramEdges from './DiagramEdges';
import DiagramNodes from './DiagramNodes';
import {
    DIAGRAM_MARGIN,
    NODE_WIDTH,
    NODE_HEIGHT,
    MOUSE_CONTROL
} from './DiagramDefaults';

/**
 * @class
 * Main Diagram class
 * @param {Object} options
 */
class Diagram extends Component {
    constructor({
        nodeWidth = NODE_WIDTH,
        nodeHeight = NODE_HEIGHT,
        groupColors = {},
        elkWorkerUrl,
        diagramMargin = DIAGRAM_MARGIN,
        mouseControl = MOUSE_CONTROL,
        iconFontFamily,
        zoomable = true
    }) {
        super('diagram');

        this._nodeWidth = nodeWidth;
        this._nodeHeight = nodeHeight;
        this._groupColors = groupColors;
        this._elkWorkerUrl = elkWorkerUrl;
        this._diagramMargin = diagramMargin;
        this._mouseControl = mouseControl;
        this._iconFontFamily = iconFontFamily;
        this._zoomable = zoomable;

        this._hasRenderedNodes = false;
        this._currentScale = 1;

        this._elk = new ELK({
            workerUrl: this._elkWorkerUrl
        });

        this._observable
            .add("selectNode")
            .add("deselectNode")
            .add("highlightNode")
            .add("unhighlightNode")
            .add("zoom");
    }

    _renderContainer(selector, x = 0, y = 0) {
        this._wrapper = d3.select(selector).node();
        this._svgContainer = d3.select(selector).append("svg");

        return this._svgContainer.append("g")
            .attr("class", style[this.className])
            .attr("transform", `translate(${x}, ${y})`);
    }

    _setData(container, data) {
        container.selectAll("*").remove();

        this._dataEdges = data.edges || [];
        this._dataNodes = data.nodes || [];
        this._data = data;

        return this._renderElk();
    }

    _renderElk() {
        const graph = this._getElkGraph();

        return this._elk.layout(graph).then(layout => {
            this._renderEdges(layout);
            this._renderNodes(layout);
            const {maxWidth, maxHeight} = this._getGraphSize(layout.children, layout.edges);
            if (!this._zoomable) {
                this._setGraphSize(maxWidth, maxHeight);
            } else {
                this._doZoom(maxWidth, maxHeight);
            }

            this._hasRenderedNodes = true;
        });
    }

    _getElkGraph() {
        return {
            "id": "root",
            properties: this._getRootProperties(),
            "children": this._dataNodes.map(node => {
                return {
                    id: node.name,
                    width: this._nodeWidth,
                    height: this._nodeHeight
                };
            }),
            "edges": this._dataEdges.map((edge, index) => {
                return {
                    id: "edge_" + index,
                    sources: [edge.start],
                    targets: [edge.end]
                };
            })
        };
    }

    _getRootProperties(){
        return {
            'algorithm': 'layered',
            'direction':'RIGHT'
        };
    }

    _getGraphSize(nodes, edges) {
        const edgesWithBendPoints = edges.flatMap(edge => edge.sections.filter(section => section.bendPoints));
        const bendPointsYs = edgesWithBendPoints.flatMap(edge => edge.bendPoints.flatMap(bendPoint => bendPoint.y));
        const maxEdgesY = Math.max.apply(Math, bendPointsYs);
        const maxNodesY = Math.max.apply(Math, nodes.map(node => node.y + node.height));

        const maxHeight = Math.max(maxEdgesY, maxNodesY) + 20;
        const maxWidth = Math.max.apply(Math, nodes.map(node => node.x + node.width)) + 20;

        return {maxWidth, maxHeight};
    }

    _setGraphSize(width, height) {
        this._svgContainer.style("width", `${width}px`);
        this._svgContainer.style("height", `${height}px`);
    }

    _doZoom(maxWidth, maxHeight) {
        this._svgContainer.classed(style.zoomable, true);

        const svgDimensions = this._svgContainer.node().getBoundingClientRect();

        this._zoomOutScaleWidth = this._getZoomOutScale(svgDimensions.width, maxWidth);
        this._zoomOutScaleHeight = this._getZoomOutScale(svgDimensions.height, maxHeight);

        this._zoomOutScale = Math.min(this._zoomOutScaleWidth, this._zoomOutScaleHeight);

        this._zoom = d3.zoom()
            .extent([[0, 0], [svgDimensions.width, svgDimensions.height]])
            .scaleExtent([this._zoomOutScale, 1])
            .translateExtent([[0, 0], [maxWidth, maxHeight]]);

        this._zoom.on("zoom", this._zoomHandler.bind(this));

        this._svgContainer.call(this._zoom);
    }

    _getZoomOutScale(wrapperDimension, diagramDimension) {
        if (diagramDimension > wrapperDimension) {
            return wrapperDimension / (diagramDimension);
        }

        return 1;
    }

    _zoomHandler() {
        this._observable.fire("zoom", d3.event.transform.k);

        const source = d3.event.sourceEvent;
        const isPan = source && source.type === 'mousemove';
        this._currentScale = d3.event.transform.k;

        if (isPan) {
            this._container.classed(style.animate, false);
        } else {
            this._container.classed(style.animate, true);
        }

        this._container.attr("transform", d3.event.transform);
    }

    _renderEdges(layout) {
        const data = {
            layout,
            edges: this._dataEdges
        };
        this._edges = new DiagramEdges();
        this._edges.render(this.container.node());
        this._edges.setData(data);
    }

    _renderNodes(layout) {
        const data = {
            nodes: this._data.nodes,
            edges: this._data.edges,
            selected: this._data.selected,
            layout,
            groupColors: this._groupColors
        };
        this._nodes = new DiagramNodes({
            nodeWidth: this._nodeWidth,
            mouseControl: this._mouseControl,
            iconFontFamily: this._iconFontFamily
        });

        this._nodes.render(this.container.node())
            .on("selectNode", (name) => {
                this._observable.fire("selectNode", name);
            })
            .on("deselectNode", (name, highlightDeselected) => {
                this._observable.fire("deselectNode", name, highlightDeselected);
            })
            .on("highlightNode", (name) => {
                this._observable.fire("highlightNode", name);
            })
            .on("unhighlightNode", (name) => {
                this._observable.fire("unhighlightNode", name);
            });

        this._nodes.setData(data);
    }

    hasRenderedNodes() {
        return this._hasRenderedNodes;
    }

    selectNode(name) {
        this._nodes.selectNode(name);
    }

    deselectNode(name) {
        this._nodes.deselectNode(name);
    }

    highlightNode(name) {
        this._nodes.highlightNode(name);
    }

    unhighlightNode() {
        this._nodes.unhighlightNode();
    }

    zoomIn() {
        if (!this._zoomable) {
            return;
        }
        const targetScale = this._currentScale + 0.1;
        this._zoom.scaleTo(this._svgContainer, targetScale);
    }

    zoomOut() {
        if (!this._zoomable) {
            return;
        }
        const targetScale = this._currentScale - 0.1;
        this._zoom.scaleTo(this._svgContainer, targetScale);
    }

    fullExtent() {
        if (!this._zoomable) {
            return;
        }
        this._zoom.scaleTo(this._svgContainer, this._zoomOutScale);
    }

    getZoomScaleExtent() {
        return [this._zoomOutScale, 1];
    }

    _clearData() {
        this._dataEdges = null;
        this._dataNodes = null;
        this._edges = null;
        this._nodes = null;
        this._elk = null;
    }
}

export default Diagram;
