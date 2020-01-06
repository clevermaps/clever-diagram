import Component from './Component';
import DiagramNode from './DiagramNode';
import {NODE_GROUP_COLOR_DEFAULT} from './DiagramDefaults';

class DiagramNodes extends Component {
    constructor(
        {
            nodeWidth,
            iconFontFamily,
            mouseControl
        }
    ) {
        super('diagram-nodes');

        this._nodeWidth = nodeWidth;
        this._iconFontFamily = iconFontFamily;
        this._mouseControl = mouseControl;

        this._observable
            .add("selectNode")
            .add("deselectNode")
            .add("highlightNode")
            .add("unhighlightNode");
    }

    _setData(container, data) {
        container.selectAll("*").remove();

        this._dataNodes = data.nodes;
        this._dataEdges = data.edges;
        this._layout = data.layout;
        this._groupColors = data.groupColors;
        this._selected = data.selected;
        this._subsequentNodes = data.subsequentNodes;

        this._createNodes(data);
        this._renderNodes();

        data.nodes.forEach((node, index) => this._setNodeData(node, index));
    }

    _createNodes(data) {
        this._nodes = data.nodes.map(() => {
            return new DiagramNode({
                nodeWidth: this._nodeWidth,
                iconFontFamily: this._iconFontFamily
            });
        });
    }

    _renderNodes() {
        this._nodes.forEach((node, index) => {
            const name = this._dataNodes[index].name;
            const styles = this._getStyles(this._layout.children[index]);
            node.render(this.container.node(), styles.x, styles.y, index);
            if (this._mouseControl) {
                node
                    .on("click", (index) => {
                        if (this._nodes[index].isSelected()) {
                            this._observable.fire("deselectNode", name);
                        } else {
                            this._observable.fire("selectNode", name);
                        }
                    })
                    .on("enter", () => {
                        this._enterTimeout = setTimeout(() => {
                            this._observable.fire("highlightNode", name);
                        }, 150);
                    })
                    .on("leave", () => {
                        clearTimeout(this._enterTimeout);
                        this._observable.fire("unhighlightNode");
                    });
            }
        });
    }

    selectNode(name) {
        const subsequentNodes = this._subsequentNodes[name];

        this._dataNodes.forEach((node, index) => {
            const diagramNode = this._nodes[index];
            const isSubsequentNode = subsequentNodes.indexOf(node.name) >= 0;
            const selected = name === node.name;
            const muted = !(selected || isSubsequentNode);

            diagramNode.setSelected(selected);
            diagramNode.setSelectedSubsequent(isSubsequentNode);
            diagramNode.setSelectedMuted(muted);
            diagramNode.setStyle();
        });
    }

    deselectNode() {
        this._dataNodes.forEach((node, index) => {
            const diagramNode = this._nodes[index];

            diagramNode.setSelected(false);
            diagramNode.setSelectedMuted(false);
            diagramNode.setStyle();
        });

    }

    highlightNode(name) {
        const subsequentNodes = this._subsequentNodes[name];

        this._dataNodes.forEach((node, index) => {
            const diagramNode = this._nodes[index];
            const highlighted = name === node.name;
            const isSubsequentNode = subsequentNodes.indexOf(node.name) >= 0;
            const muted = !(highlighted || isSubsequentNode);

            diagramNode.setHighlighted(highlighted);
            diagramNode.setHighlightedSubsequent(isSubsequentNode);
            diagramNode.setHighlightedMuted(muted);
            diagramNode.setStyle();
        });
    }

    unhighlightNode() {
        this._nodes.forEach((diagramNode) => {
            diagramNode.setHighlighted(false);
            diagramNode.setHighlightedSubsequent(false);
            diagramNode.setHighlightedMuted(false);
            diagramNode.setStyle();
        });
    }

    _setNodeData(node, index) {
        const styles = this._getStyles(this._layout.children[index]);
        const groupColor = this._groupColors[node.group] || NODE_GROUP_COLOR_DEFAULT;
        const selected = this._selected === node.name;
        let selectedMuted, selectedSubsequent = false;

        if (this._selected) {
            const subsequentNodes = this._subsequentNodes[this._selected];
            const isSubsequentNode = subsequentNodes && subsequentNodes.indexOf(node.name) >= 0;
            selectedMuted = !isSubsequentNode;
            selectedSubsequent = isSubsequentNode;
        }

        this._nodes[index].setData({
            node,
            selected,
            selectedSubsequent,
            selectedMuted,
            styles,
            groupColor
        });
    }

    _getStyles(layout) {
        return {
            y: layout.y,
            x: layout.x,
            width: layout.width,
            height: layout.height
        };
    }

    isSomeSelected() {
        return this._nodes.some(node => node.isSelected());
    }

    isSomeHighlighted() {
        return this._nodes.some(node => node.isHighlighted());
    }
}

export default DiagramNodes;
