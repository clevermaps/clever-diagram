import style from "./CleverDiagram.css";
import * as d3 from "d3";
import * as ELK from "ELK";
import Component from './Component';
import DiagramEdges from './DiagramEdges';
import DiagramNodes from './DiagramNodes';
import {
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
        mouseControl = MOUSE_CONTROL,
        iconFontFamily,
        zoomable = true
    }) {
        super('diagram');

        this._nodeWidth = nodeWidth;
        this._nodeHeight = nodeHeight;
        this._groupColors = groupColors;
        this._elkWorkerUrl = elkWorkerUrl;
        this._mouseControl = mouseControl;
        this._iconFontFamily = iconFontFamily;
        this._zoomable = zoomable;

        this._hasRenderedNodes = false;
        this._currentScale = 1;
        this._transitionDuration = 200;

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
        this._wrapper = d3.select(selector);
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
            const subsequentNodes = this._getSubsequentNodes(this._data);

            this._renderEdges(layout, subsequentNodes);
            this._renderNodes(layout, subsequentNodes);

            this._graphSize = this._getGraphSize(layout.children, layout.edges);

            if (!this._zoomable) {
                this._setGraphSize(this._graphSize);
            } else {
                this._doZoom(this._graphSize);
                this._centerGraph();
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

    _getSubsequentNodes(data) {
        return data.nodes.reduce((obj, item) => {
            const edges = this._findEdgesRecursive(data.edges, [item.name]);
            obj[item.name] = edges.map(edge => edge.end);
            return obj;
        }, {});
    }

    _findEdgesRecursive(edges, names, alreadySearched=[]) {
        let results = names.reduce((acc, cur) => {
            if (alreadySearched.indexOf(cur) >= 0) {
                return acc;
            }

            const filteredEdges = edges.filter(edge => edge.start === cur);

            return acc.concat(filteredEdges);
        }, []);

        const namesToFind = results.map(result => result.end);
        alreadySearched = alreadySearched.concat(names);

        if (namesToFind.length) {
            return results.concat(this._findEdgesRecursive(this._dataEdges, namesToFind, alreadySearched));
        }

        return results;
    }

    _getGraphSize(nodes, edges) {
        const edgesWithBendPoints = edges.flatMap(edge => edge.sections.filter(section => section.bendPoints));
        const bendPointsYs = edgesWithBendPoints.flatMap(edge => edge.bendPoints.flatMap(bendPoint => bendPoint.y));
        const maxEdgesY = Math.max.apply(Math, bendPointsYs);
        const maxNodesY = Math.max.apply(Math, nodes.map(node => node.y + node.height));

        const height = Math.max(maxEdgesY, maxNodesY) + 10;
        const width = Math.max.apply(Math, nodes.map(node => node.x + node.width)) + 10;

        return {width, height};
    }

    _setGraphSize({width, height}) {
        this._svgContainer.style("width", `${width}px`);
        this._svgContainer.style("height", `${height}px`);
    }

    _centerGraph() {
        this._zoom.translateTo(this._svgContainer, 0, 0);
    }

    _doZoom(graphSize) {
        const svgSize = this._svgContainer.node().getBoundingClientRect();

        this._svgContainer.classed(style.zoomable, true);

        this._zoomOutScaleWidth = this._getZoomOutScale(graphSize.width, svgSize.width);
        this._zoomOutScaleHeight = this._getZoomOutScale(graphSize.height, svgSize.height);

        this._zoomOutScale = Math.min(this._zoomOutScaleWidth, this._zoomOutScaleHeight);

        const translateExtent = [
            [0, 0],
            [graphSize.width, graphSize.height]
        ];

        this._zoom = d3.zoom()
            .extent([[0, 0], [svgSize.width, svgSize.height]])
            .scaleExtent([this._zoomOutScale, 1])
            .translateExtent(translateExtent);

        this._zoom.on("zoom", this._zoomHandler.bind(this));

        this._wrapper.call(this._zoom);
    }

    _getZoomOutScale(size, max) {
        if (size > max) {
            return max / size;
        }
        return 1;
    }

    _zoomHandler() {
        this._observable.fire("zoom", d3.event.transform.k);
        this._currentScale = d3.event.transform.k;
        this._container.attr("transform", d3.event.transform);
    }

    _renderEdges(layout, subsequentNodes) {
        const data = {
            layout,
            edges: this._dataEdges,
            subsequentNodes,
            selected: this._data.selected,
        };
        this._edges = new DiagramEdges();
        this._edges.render(this.container.node());
        this._edges.setData(data);
    }

    _renderNodes(layout, subsequentNodes) {
        const data = {
            nodes: this._data.nodes,
            edges: this._data.edges,
            selected: this._data.selected,
            layout,
            groupColors: this._groupColors,
            subsequentNodes
        };
        this._nodes = new DiagramNodes({
            nodeWidth: this._nodeWidth,
            iconFontFamily: this._iconFontFamily,
            mouseControl: this._mouseControl
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
        this._edges.selectEdges(name);
    }

    deselectNode(name) {
        const isSomeHighlighted = this._nodes.isSomeHighlighted();
        this._nodes.deselectNode(name);
        this._edges.deselectEdges(isSomeHighlighted);
    }

    highlightNode(name) {
        this._nodes.highlightNode(name);
        this._edges.highlightEdges(name);
    }

    unhighlightNode() {
        const isSomeSelected = this._nodes.isSomeSelected();
        this._nodes.unhighlightNode();
        this._edges.unhighlightEdges(isSomeSelected);
    }

    zoomIn() {
        if (!this._zoomable) {
            return;
        }
        const targetScale = this._currentScale + 0.1;
        this._zoom.scaleTo(
            this._wrapper.transition().duration(this._transitionDuration),
            targetScale
        );
    }

    zoomOut() {
        if (!this._zoomable) {
            return;
        }
        const targetScale = this._currentScale - 0.1;
        this._zoom.scaleTo(
            this._wrapper.transition().duration(this._transitionDuration),
            targetScale
        );
    }

    fullExtent() {
        if (!this._zoomable) {
            return;
        }
        this._zoom.scaleTo(
            this._wrapper.transition().duration(this._transitionDuration),
            this._zoomOutScale
        );
    }

    getZoomScaleExtent() {
        return [this._zoomOutScale, 1];
    }

    reloadZoom() {
        if (!this._zoom) {
            return;
        }

        this._zoom.on("zoom", null);

        const lastScale = this._currentScale;
        this._doZoom(this._graphSize);

        if (lastScale < this._zoomOutScale) {
            this._zoom.scaleTo(
                this._wrapper.transition().duration(this._transitionDuration),
                this._zoomOutScale
            );
        } else {
            this._zoom.scaleTo(
                this._wrapper,
                lastScale
            );
        }
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
