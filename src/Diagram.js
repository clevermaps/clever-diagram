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
        iconFontFamily
    }) {
        super('diagram');

        this._nodeWidth = nodeWidth;
        this._nodeHeight = nodeHeight;
        this._groupColors = groupColors;
        this._elkWorkerUrl = elkWorkerUrl;
        this._diagramMargin = diagramMargin;
        this._mouseControl = mouseControl;
        this._iconFontFamily = iconFontFamily;

        this._hasRenderedNodes = false;

        this._elk = new ELK({
            workerUrl: this._elkWorkerUrl
        });

        this._observable
            .add("selectNode")
            .add("deselectNode")
            .add("highlightNode")
            .add("unhighlightNode");
    }

    _renderContainer(selector, x = 0, y = 0) {
        return d3.select(selector).append("svg")
            .attr("class", style[this.className])
            .attr("transform", `translate(${x}, ${y})`);
    }

    _setData(container, data) {
        container.selectAll("*").remove();

        this._dataEdges = data.edges || [];
        this._dataNodes = data.nodes || [];
        this._data = data;

        this._renderElk();
    }

    _renderElk() {
        const graph = this._getElkGraph();

        return this._elk.layout(graph).then(layout => {
            const subsequentNodes = this._getSubsequentNodes(this._data);

            this._renderEdges(layout, subsequentNodes);
            this._renderNodes(layout, subsequentNodes);
            this._setGraphSize(layout.children, layout.edges);
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

    _setGraphSize(nodes, edges) {
        const edgesWithBendPoints = edges.flatMap(edge => edge.sections.filter(section => section.bendPoints));
        const bendPointsYs = edgesWithBendPoints.flatMap(edge => edge.bendPoints.flatMap(bendPoint => bendPoint.y));
        const maxEdgesY = Math.max.apply(Math, bendPointsYs);
        const maxNodesY = Math.max.apply(Math, nodes.map(node => node.y + node.height));

        const maxHeight = Math.max(maxEdgesY, maxNodesY);
        const maxWidth = Math.max.apply(Math, nodes.map(node => node.x + node.width));

        this.container.style("width", `${maxWidth + 10}px`);
        this.container.style("height", `${maxHeight + 10}px`);
        this.container.style("margin", `${this._diagramMargin}px`);
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

    _clearData() {
        this._dataEdges = null;
        this._dataNodes = null;
        this._edges = null;
        this._nodes = null;
        this._elk = null;
    }
}

export default Diagram;
