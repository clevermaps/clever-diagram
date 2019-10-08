import Component from './Component';
import {
    EDGES_STROKE_COLOR
} from './DiagramDefaults';

class DiagramEdges extends Component {
    constructor() {
        super('diagram-edges');
    }

    _setData(container, data) {
        container.selectAll("*").remove();

        this._renderDefs();

        this._renderEdges(data);
    }

    _renderDefs() {
        this.container.append("svg:defs")
			.append("svg:marker")
			.attr("id", "end")
			.attr("viewBox", "0 -5 10 10")
			.attr("refX", 10)
			.attr("refY", 0)
			.attr("markerWidth", 4)
			.attr("markerHeight", 4)
			.attr("orient", "auto")
			.style("fill", EDGES_STROKE_COLOR)
			.style("stroke-opacity", 0.6)
			.append("svg:path")
			.attr("d", "M0,-5L10,0L0,5");
    }

    _renderEdges(data){
        const layout = data.layout;
        data.edges.forEach((edge, index) => {
            const link = this.container.append("path")
                .attr("class", "link")
                .attr("stroke", EDGES_STROKE_COLOR)
                .attr("stroke-width", 1)
                .attr("fill", "transparent")
                .attr("d", () => {
                    const d = layout.edges[index].sections[0];
                    let path = "";
                    if (d.startPoint && d.endPoint) {
                        path += "M" + d.startPoint.x + " " + d.startPoint.y + " ";
                        (d.bendPoints || []).forEach(function (bp) {
                            path += "L" + bp.x + " " + bp.y + " ";
                        });
                        path += "L" + d.endPoint.x + " " + d.endPoint.y + " ";
                    }
                    return path;
                });

            if (edge.type == "arrow") {
                link.attr("marker-end", "url(#end)");
            }
        });
    }
}

export default DiagramEdges;
