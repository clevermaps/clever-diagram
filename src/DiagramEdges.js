import Component from './Component';
import DiagramEdge from './DiagramEdge';
import {
    EDGES_STROKE_COLOR,
    EDGES_STROKE_COLOR_MUTED
} from './DiagramDefaults';

class DiagramEdges extends Component {
    constructor() {
        super('diagram-edges');
    }

    _setData(container, data) {
        container.selectAll("*").remove();

        this._renderDefs('end', EDGES_STROKE_COLOR);
        this._renderDefs('end-muted', EDGES_STROKE_COLOR_MUTED);

        this._createEdges(data);
        this._renderEdges();

        this._data = data;
        this._subsequentNodes = data.subsequentNodes;

        data.edges.forEach((edge, index) => this._setEdgeData(edge, index));
    }

    _createEdges(data) {
        this._edges = data.edges.map(() => {
            return new DiagramEdge();
        });
    }

    _renderEdges() {
        this._edges.forEach((edge, index) => {
            edge.render(this.container.node(), 0, 0, index);
        });
    }

    _setEdgeData(edge, index) {
        const layout = this._data.layout.edges[index];

        this._edges[index].setData({
            edge,
            layout
        });
    }

    _renderDefs(id, color) {
        this.container.append("svg:defs")
            .append("svg:marker")
            .attr("id", id)
            .attr("viewBox", "0 -5 10 10")
            .attr("refX", 10)
            .attr("refY", 0)
            .attr("markerWidth", 5)
            .attr("markerHeight", 5)
            .attr("orient", "auto")
            .style("fill", color)
            .style("stroke-opacity", 0.6)
            .append("svg:path")
            .attr("d", "M0,-5L10,0L0,5");
    }

    selectEdges(name) {
        this._data.edges.forEach((edge, index) => {
            const diagramEdge = this._edges[index];
            const isSubsequentNode = this._isSubsequentNode(name, edge.start);
            const selected = (name === edge.start) || isSubsequentNode;
            const muted = !selected;

            diagramEdge.setSelected(selected);
            diagramEdge.setStyle(muted);
        });
    }

    deselectEdges(name, highlightDeselected=false) {
        this._data.edges.forEach((edge, index) => {
            const diagramEdge = this._edges[index];

            diagramEdge.setSelected(false);

            let muted = false;

            if (highlightDeselected) {
                const isSubsequentNode = this._isSubsequentNode(name, edge.start);
                const highlighted = (name === edge.start) || isSubsequentNode;
                muted = !highlighted;
            }
            diagramEdge.setStyle(muted);
        });
    }

    highlightEdges(name) {
        this._data.edges.forEach((edge, index) => {
            const diagramEdge = this._edges[index];
            const isSubsequentNode = this._isSubsequentNode(name, edge.start);
            const highlighted = (name === edge.start) || isSubsequentNode;
            const muted = !highlighted;

            diagramEdge.setStyle(muted);
        });
    }

    unhighlightEdges() {
        const isSomeSelected = this._edges.some(edge => edge._selected);

        this._data.edges.forEach((edge, index) => {
            const diagramEdge = this._edges[index];
            const muted = isSomeSelected && !diagramEdge._selected;
            diagramEdge.setStyle(muted, isSomeSelected);
        });
    }

    _isSubsequentNode(nodeName, edgeStart) {
        const subsequentNodes = this._subsequentNodes[nodeName];
        return subsequentNodes.indexOf(edgeStart) >= 0;
    }
}

export default DiagramEdges;
