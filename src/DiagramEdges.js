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
        this._subsequentNodes = data.subsequentNodes;
    }

    _renderDefs() {
        this.container.append("svg:defs")
            .append("svg:marker")
            .attr("id", "end")
            .attr("viewBox", "0 -5 10 10")
            .attr("refX", 10)
            .attr("refY", 0)
            .attr("markerWidth", 5)
            .attr("markerHeight", 5)
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
                        path += `M${d.startPoint.x} ${d.startPoint.y} `;

                        const defaultRadius = 6;
                        let lastPoint = {
                            x: d.startPoint.x,
                            y: d.startPoint.y
                        };

                        (d.bendPoints || []).forEach((bendPoint, index) => {

                            const nextPoint = d.bendPoints[index + 1] || d.endPoint;

                            const params = this._getSectionParams(
                                bendPoint,
                                lastPoint,
                                nextPoint,
                                defaultRadius
                            );

                            const section = this._getSection(params);

                            path += section;

                            lastPoint.x = bendPoint.x;
                            lastPoint.y = bendPoint.y;

                        }, this);

                        const isEnd = true;
                        const nextPoint = {};
                        const params = this._getSectionParams(
                            d.endPoint,
                            lastPoint,
                            nextPoint,
                            defaultRadius,
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
        const {x, y, defaultRadius, isEnd} = params;

        let curve = '';
        let line = '';
        let radius = defaultRadius;

        const diff = {
            lastX: x.rounded - x.lastRounded,
            lastY: y.rounded - y.lastRounded,
            nextX: x.nextRounded - x.rounded,
            nextY: y.nextRounded - y.rounded
        };

        Object.keys(diff).forEach(key => {
            const abs = Math.abs(diff[key]);
            if (abs && abs < radius) {
                radius = abs / 2;
            }
        });

        const lineEndCorrection = isEnd ? 0 : radius;

        // DRAW LINE
        if (diff.lastX > 0) {
            // to right
            line = `L ${x.current - lineEndCorrection} ${y.current} `;
        } else if (diff.lastX < 0) {
            // to left
            line = `L ${x.current + lineEndCorrection} ${y.current} `;
        } else if (diff.lastY > 0) {
            // to bottom
            line = `L ${x.current} ${y.current - lineEndCorrection} `;
        } else if (diff.lastY < 0) {
            // to top
            line = `L ${x.current} ${y.current + lineEndCorrection} `;
        }

        // DRAW CURVE
        if (!isEnd) {
            if (diff.nextY > 0) {
                // to bottom
                curve = `Q ${x.current} ${y.current} ${x.current} ${y.current + radius} `;
            } else if (diff.nextY < 0) {
                // to top
                curve = `Q ${x.current} ${y.current} ${x.current} ${y.current - radius} `;
            } else if (diff.nextX < 0) {
                // to left
                curve = `Q ${x.current} ${y.current} ${x.current - radius} ${y.current} `;
            } else if (diff.nextX > 0) {
                // to right
                curve = `Q ${x.current} ${y.current} ${x.current + radius} ${y.current} `;
            }
        }

        return line.concat(curve);
    }

    _getSectionParams(
        point,
        lastPoint,
        nextPoint,
        defaultRadius,
        isEnd = false
    ) {
        return {
            x: {
                current: point.x,
                last: lastPoint.x,
                next: nextPoint.x,
                rounded: Math.round(point.x),
                lastRounded: Math.round(lastPoint.x),
                nextRounded: Math.round(nextPoint.x)
            },
            y: {
                current: point.y,
                last: lastPoint.y,
                next: nextPoint.y,
                rounded: Math.round(point.y),
                lastRounded: Math.round(lastPoint.y),
                nextRounded: Math.round(nextPoint.y)
            },
            defaultRadius,
            isEnd
        };
    }

    selectEdges(name) {
    }

    deselectEdges(name, highlightDeselected=false) {
    }

    highlightEdges(name) {
    }

    unhighlightEdges() {
    }
}

export default DiagramEdges;
