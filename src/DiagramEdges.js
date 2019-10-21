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

    _renderEdges(data) {
        const layout = data.layout;
        data.edges.forEach((edge, index) => {
            const link = this.container.append("path")
                .attr("class", "link")
                .attr("stroke", EDGES_STROKE_COLOR)
                .attr("stroke-width", 1)
                .attr("stroke-linejoin", "bevel")
                .attr("fill", "transparent")
                .attr("d", () => {
                    const d = layout.edges[index].sections[0];
                    let path = "";
                    if (d.startPoint && d.endPoint) {
                        path += `M${d.startPoint.x} ${d.startPoint.y}`;

                        const radius = 6;
                        let lastPoint = {
                            x: d.startPoint.x,
                            y: d.startPoint.y
                        };

                        let init = true;

                        (d.bendPoints || []).forEach(bendPoint => {

                            const params = this._getSectionParams(
                                bendPoint,
                                lastPoint,
                                init,
                                radius
                            );

                            const section = this._getSection(params);

                            path += section;

                            lastPoint.x = bendPoint.x;
                            lastPoint.y = bendPoint.y;

                            init = false;

                        }, this);

                        const isEnd = true;
                        const params = this._getSectionParams(
                            d.endPoint,
                            lastPoint,
                            init,
                            radius,
                            isEnd
                        );

                        const endSection = this._getSection(params);

                        path += endSection;
                    }

                    return path;
                });

            if (edge.type == "arrow") {
                link.attr("marker-end", "url(#end)");
            }
        });
    }

    _getSection(params) {
        const {x, y, init, radius, isEnd} = params;

        let curve = '';
        let line = '';
        const lineEndCorrection = isEnd ? 0 : radius;

        if (x.lastRounded === x.rounded && y.lastRounded > y.rounded) {
            // to top
            curve = `Q ${x.last} ${y.last} ${x.last} ${y.last - radius} `;
            line = `L ${x.current} ${y.current + lineEndCorrection} `;
        } else if (x.lastRounded === x.rounded && y.lastRounded < y.rounded) {
            // to bottom
            curve = `Q ${x.last} ${y.last} ${x.last} ${y.last + radius} `;
            line = `L ${x.current} ${y.current - lineEndCorrection} `;
        } else if (x.lastRounded < x.rounded && y.lastRounded === y.rounded) {
            // to right
            if (!init) {
                curve = `Q ${x.last} ${y.last} ${x.last + radius} ${y.last} `;
            }
            line = `L ${x.current - lineEndCorrection} ${y.current} `;
        } else if (x.lastRounded > x.rounded && y.lastRounded === y.rounded) {
            // to left
            if (!init) {
                curve = `Q ${x.last} ${y.last} ${x.last - radius} ${y.last} `;
            }
            line = `L ${x.current + lineEndCorrection} ${y.current} `;
        }

        return curve.concat(line);
    }

    _getSectionParams(
        point,
        lastPoint,
        init,
        radius,
        isEnd = false
    ) {
        return {
            x: {
                current: point.x,
                last: lastPoint.x,
                rounded: Math.round(point.x),
                lastRounded: Math.round(lastPoint.x)
            },
            y: {
                current: point.y,
                last: lastPoint.y,
                rounded: Math.round(point.y),
                lastRounded: Math.round(lastPoint.y)
            },
            init,
            radius,
            isEnd
        };
    }
}

export default DiagramEdges;
