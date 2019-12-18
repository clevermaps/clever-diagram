import Component from './Component';
import {
    EDGES_STROKE_COLOR,
    EDGES_STROKE_COLOR_MUTED
} from './DiagramDefaults';

class DiagramEdge extends Component {
    constructor() {
        super('diagram-edge');
    }

    _setData(container, data) {
        container.selectAll("*").remove();

        this._renderEdge(data);
    }

    _renderEdge(data) {
        this._edge = this.container.append("path")
            .attr("class", "link")
            .attr("stroke", EDGES_STROKE_COLOR)
            .attr("stroke-width", 1)
            .attr("stroke-linejoin", "bevel")
            .attr("fill", "transparent")
            .attr("d", () => {
                const d = data.layout.sections[0];
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

        if (data.edge.type == "arrow") {
            this._edge.attr("marker-end", "url(#end)");
        }
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

    setSelected(value) {
        this._selected = value;
    }

    setStyle(muted) {
        if (muted) {
            this._edge.attr('stroke', EDGES_STROKE_COLOR_MUTED);
            this._edge.attr("marker-end", "url(#end-muted)");
        } else {
            this._edge.attr('stroke', EDGES_STROKE_COLOR);
            this._edge.attr("marker-end", "url(#end)");
        }
    }
}

export default DiagramEdge;
