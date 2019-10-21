import style from "./CleverDiagram.css";
import Component from './Component';
import {
    NODE_HEIGHT,
    ICON_FONT_SIZE,
    NODE_SELECTED_BG,
    NODE_DEFAULT_BG,
    NODE_MUTED_BG,
    NODE_GROUP_COLOR_MUTED,
    NODE_GROUP_WIDTH,
    NODE_STROKE_COLOR,
    NODE_NAME_FONT_SIZE,
    NODE_ICON_COLOR,
    NODE_NAME_COLOR
} from './DiagramDefaults';

class DiagramNode extends Component {
    constructor(
        {
            nodeWidth,
            iconFontFamily
        }
    ) {
        super('diagram-node');
        this._nodeWidth = nodeWidth;
        this._iconFontFamily = iconFontFamily;

        this._observable
            .add("enterNode");
    }

    _setData(container, data) {
        container.selectAll("*").remove();

        this._node = data.node;
        this._selected = data.selected;
        this._selectedMuted = data.selectedMuted;
        this._selectedSubsequent = data.selectedSubsequent;
        this._styles = data.styles;
        this._groupColor = data.groupColor;

        this._renderAll();
    }

    _renderAll() {
        this._renderGradients();
        this._renderNodeBaseLayer();
        this._renderNodeSkeleton();

        if (this._node.icon) {
            this._renderIcon();
        }

        this._renderLine();
        this._setNodeStyle();
        this._rendertNodeName();
    }

    _renderGradients() {
        this._gradientEdge = NODE_GROUP_WIDTH/this._nodeWidth;

        this._defs = this.container.append("svg:defs");

        this._renderDefaultGradient();
        this._renderMutedGradient();
    }

    _renderDefaultGradient() {
        const colorDefaultBg = NODE_DEFAULT_BG;

        this._defaultGradient = this._defs
            .append("svg:linearGradient")
            .attr("id", `node-background-default-${this._node.name}`);

        this._defaultGradient.selectAll("stop")
            .data([
                { offset: "0", color: this._groupColor, opacity: '0.4'},
                { offset: this._gradientEdge, color: this._groupColor, opacity: '0.4'},
                { offset: this._gradientEdge + 0.001, color: colorDefaultBg, opacity: '1'},
                { offset: "1", color: colorDefaultBg, opacity: '1'}
            ])
            .enter().append("stop")
            .attr("offset", data => data.offset)
            .attr("stop-color", data => data.color)
            .attr("stop-opacity", data => data.opacity);
    }

    _renderMutedGradient() {
        const colorMutedBg = NODE_MUTED_BG;
        const colorGroupMuted= NODE_GROUP_COLOR_MUTED;

        this._mutedGradient = this._defs
            .append("svg:linearGradient")
            .attr("id", "node-background-muted");

        this._mutedGradient.selectAll("stop")
            .data([
                { offset: "0", color: colorGroupMuted, opacity: '1'},
                { offset: this._gradientEdge, color: colorGroupMuted, opacity: '1'},
                { offset: this._gradientEdge + 0.001, color: colorMutedBg, opacity: '1'},
                { offset: "1", color: colorMutedBg, opacity: '1'}
            ])
            .enter().append("stop")
            .attr("offset", data => data.offset)
            .attr("stop-color", data => data.color)
            .attr("stop-opacity", data => data.opacity);
    }

    _renderNodeBaseLayer() {
        this._nodeBaseLayer = this.container
            .append("rect")
            .attr("x", 0)
            .attr("y", 0)
            .attr("width", this._styles.width)
            .attr("height", this._styles.height)
            .attr("fill", "white")
            .attr("rx", 5);
    }

    _renderNodeSkeleton() {
        this._nodeSkeleton = this.container
            .append("rect")
            .attr("x", 0)
            .attr("y", 0)
            .attr("width", this._styles.width)
            .attr("height", this._styles.height)
            .attr("fill", `url(#node-background-default-${this._node.name})`)
            .attr("rx", 5)
            .attr("stroke", NODE_STROKE_COLOR)
            .attr("stroke-width", 1)
            .attr("class", style['node-skeleton'])
            .attr("id", this._node.name);
    }

    _renderIcon() {
        this._icon = this.container.append("text")
            .attr("x", NODE_GROUP_WIDTH/2)
            .attr("y", (this._styles.height/2 + ICON_FONT_SIZE/2) - 1)
            .attr("class", style['node-icon'])
            .attr("font-family", this._iconFontFamily)
            .attr("font-size", ICON_FONT_SIZE)
            .attr("fill", NODE_ICON_COLOR)
            .text(this._node.icon);
    }

    _renderLine() {
        this._line = this.container
            .append("line")
            .attr("x1", NODE_GROUP_WIDTH)
            .attr("y1", 0)
            .attr("x2", NODE_GROUP_WIDTH)
            .attr("y2", NODE_GROUP_WIDTH)
            .attr("stroke", NODE_STROKE_COLOR)
            .attr("stroke-width", 1)
            .attr("opacity", 0);
    }

    _setNodeStyle() {
        if (this._selected) {
            this._setSpecialStyle(NODE_SELECTED_BG, 1);
        } else if (this._highlighted) {
            this._setSpecialStyle(this._groupColor, 0.4);
        } else if (!this._highlightedSubsequent && (this._selectedMuted || this._highlightedMuted)) {
            this._setMutedStyle();
        } else {
            this._setOriginalStyle();
        }
    }

    _rendertNodeName() {
        this._clipPath = this._defs
            .append("clipPath")
            .attr("id", "node-name-mask");

        this._nodeNameMask = this._clipPath
            .append("rect")
            .attr("x", NODE_GROUP_WIDTH + 15)
            .attr("y", 0)
            .attr("width", this._nodeWidth - NODE_GROUP_WIDTH - 25)
            .attr("height", this._styles.height);

        this._nodeName = this.container
            .append("g")
            .attr("clip-path", "url(#node-name-mask)")
            .append("text")
            .text(this._node.name)
            .attr("x", NODE_GROUP_WIDTH + 15)
            .attr("y", (NODE_HEIGHT/2 + NODE_NAME_FONT_SIZE/2) - 2)
            .attr("font-size", NODE_NAME_FONT_SIZE)
            .attr("fill", NODE_NAME_COLOR)
            .attr("class", style["node-name"]);
    }

    setStyle() {
        this._setNodeStyle();
    }

    isSelected() {
        return this._selected;
    }

    isSelectedSubsequent() {
        return this._selectedSubsequent;
    }

    setSelected(value) {
        this._selected = value;
    }

    setSelectedSubsequent(value) {
        this._selectedSubsequent = value;
    }

    setHighlighted(value) {
        this._highlighted = value;
    }

    setHighlightedSubsequent(value) {
        this._highlightedSubsequent = value;
    }

    setSelectedMuted(value) {
        this._selectedMuted = value;
    }

    setHighlightedMuted(value) {
        this._highlightedMuted = value;
    }

    _setSpecialStyle(color, opacity) {
        this._nodeSkeleton.attr("fill", color);
        this._nodeSkeleton.attr("fill-opacity", opacity);
        this._line.attr("opacity", "1");
    }

    _setMutedStyle() {
        this._nodeSkeleton.attr("fill", "url(#node-background-muted");
        this._nodeSkeleton.attr("fill-opacity", "1");
        this._line.attr("opacity", "0");
    }

    _setOriginalStyle() {
        this._nodeSkeleton.attr("fill", `url(#node-background-default-${this._node.name})`);
        this._nodeSkeleton.attr("fill-opacity", "1");
        this._line.attr("opacity", "0");
    }
}

export default DiagramNode;
