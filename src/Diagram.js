import Observable from "./utils/Observable";
import style from "./Diagram.css";
import * as d3 from "d3";
import * as jsPlumb from "jsPlumb";
import * as $klay from "$klay";

/**
 * @class
 * Main Diagram class
 * @param {Object} options
 */
export default class Diagram {
	constructor(options) {
		/**
		 * @private
		 * observable handler
		 */
		this._observable = new Observable([
			/**
			 * @event 
			 * Fires when node is selected
			 * @param {String} node name
			 */
			"nodeSelected",
			/**
			 * @event 
			 * Fires when node is selected
			 * @param {String} node name
			 */
			"nodeDeselected",			
			/**
			 * @event 
			 * Fires when node is highlighted
			 * @param {String} node name
			 * @param {Boolean} highlighted
			 */
			"nodeHighlight"
		]);

		this._options = options || {};

		/**
		 * @private 
		 * DOM container for diagram
		 */
		this._container = null;

		this._groupColors = options.groupColors || {};
	}

	/**
	 * Bind widget event
	 * @param {String} event event name
	 * @param {Function} handler event handler
	 * @returns {Bar} returns this widget instance
	 */
	on(eventName, handler) {
		this._observable.on(eventName, handler);
		return this;
	}

	/**
	 * Unbind widget event
	 * @param {String} event event name
	 * @param {Function} [handler] event handler
	 * @returns {Bar} returns this widget instance
	 */
	off(eventName, handler) {
		this._observable.off(eventName, handler);
		return this;
	}	

	/**
	 * Destroys widget
	 * @returns {Bar} returns this widget instance
	 */
	destroy() {
		this._observable.destroy();
		this._plumb.clear();
		this._el.remove();
		return this;
	}	

	/**
	 * Render logic of this widget
	 * @param {String|DOMElement} selector selector or DOM element 
	 * @returns {Bar} returns this widget instance
	 */
	render(selector) {
		this._container = d3.select(selector);
		this._el = this._container.append("div").classed(style.diagram, true);
		this._plumb = jsPlumb.getInstance();
	}

	_getKlayGraph(){
		return {
			"id": "root",
			"children": this._nodes.map(node=>{
				return {
					id:node.name,
					width:150,
					height:50
				}
			}),
			"edges": this._edges.map((edge, index)=>{
				return {
					id:"edge_"+index,
					source:edge.start,
					target:edge.end
				}
			})
		}
	}

	_setGraphSize(nodes){
		var maxHeight = Math.max.apply(Math, nodes.map(node=>node.y+node.height));
		var maxWidth = Math.max.apply(Math, nodes.map(node=>node.x+node.width));

		this._el.style("width", maxWidth+"px");
		this._el.style("height", maxHeight+"px");
	}

	/**
	 * Renders nodes
	 */
	_renderNodes(){
		return new Promise((success, failure)=>{
			$klay.layout({
				graph: this._getKlayGraph(),
				options:{
					spacing:40,
					algorithm: "de.cau.cs.kieler.klay.layered",
					layoutHierarchy: true,
					intCoordinates: true,
					direction: "RIGHT",
					//thoroughness:50,
					//crossMin:"LAYER_SWEEP",
					mergeEdges:true,
					//linearSegmentsDeflectionDampening:0.5,
					layerConstraint:"LAST_SEPARATE",
					nodePlace:"BRANDES_KOEPF", // LINEAR_SEGMENTS BRANDES_KOEPF
					nodeLayering: "NETWORK_SIMPLEX" // NETWORK_SIMPLEX LONGEST_PATH INTERACTIVE
				},
				success: (layouted)=>{
					this._nodes.forEach((node, i)=>{
						var styles = {
							top:layouted.children[i].y,
							left:layouted.children[i].x,
							width:layouted.children[i].width,
							height:layouted.children[i].height
						};

						this._renderNode(node, styles);
					});

					this._renderEdges();
					this._plumb.draggable(document.querySelectorAll("."+style.node));
					this._setGraphSize(layouted.children);	
					success();									
				},
				error: function(error) { 
					console.log(error); 
					failure();
				}
			});		
		});
	}

	/**
	 * @public
	 * Selects node 
	 * @param nodeName
	 */
	selectNode(nodeName){
		var el = document.getElementById(nodeName);
		if (!el) throw "Node "+nodeName + " doesn't exist or graph hasn't been rendered yet";

		var nodeEl = d3.select(el);

		var selectedClass = style["node-selected"];

		if (!nodeEl.classed(selectedClass)){
			d3.select("."+selectedClass).classed(selectedClass, false);
			nodeEl.classed(selectedClass, true);
			this._observable.fire("nodeSelected", nodeName);

			if (this._selectedNodeName && nodeName != this._selectedNodeName){
				this._observable.fire("nodeDeselected", this._selectedNodeName);
			}
			
			this._selectedNodeName = nodeName;
		} else {
			d3.select("."+selectedClass).classed(selectedClass, false);
			this._observable.fire("nodeDeselected", nodeName);
		}
	}

	/**
	 * @public
	 * Highlights node 
	 * @param nodeName
	 * @param highlighted
	 */
	highlightNode(nodeName, highlighted){
		var nodeEl = d3.select("#"+nodeName);
		var highlightedClass = style["node-highlighted"];

		if (this._dragging && d3.event.relatedTarget && d3.event.relatedTarget.tagName == "path"){
			return;
		}

		if (highlighted){
			d3.select("."+highlightedClass).classed(highlightedClass, false);
			nodeEl.classed(highlightedClass, true);
			this._observable.fire("nodeHighlight", nodeName, highlighted);
		} else {
			d3.select("."+highlightedClass).classed(highlightedClass, false);
			this._observable.fire("nodeHighlight", nodeName, highlighted);
		}
	}
	
	_onMouseDown(nodeName){
		this._dragging = true;
		// save box on mouse down so we can compare on mouseup
		this._mouseDownBB = document.getElementById(nodeName).getBoundingClientRect();
	}

	_onMouseUp(nodeName){
		var bb = document.getElementById(nodeName).getBoundingClientRect();
		// only call select when bounding box is same
		if (this._mouseDownBB && this._mouseDownBB.top == bb.top && this._mouseDownBB.left == bb.left){
			this.selectNode(nodeName);
		}
		this._dragging = false;		
	}
	/**
	 * Renders node 
	 * @param node
	 */
	_renderNode(node, styles){
		var color = this._groupColors[node.group] || "#2196F3";
		var styleStr = Object.keys(styles).map(style=>style+":"+styles[style]+"px").join(";")+"; background-color:"+color;
		var nodeEl = this._el
			.append("div")
			.attr("style", styleStr)
			.attr("class", style.node)
			.attr("id", node.name)
			.on("mousedown", ()=>{
				this._onMouseDown(node.name);
			})
			.on("mouseup", ()=>{
				this._onMouseUp(node.name);
			})
			.on("mouseover", ()=>{
				this.highlightNode(node.name, true);
			}).on("mouseout", ()=>{
				this.highlightNode(node.name, false);
			});

		nodeEl	
			.append("div")
			.attr("class", style["node-text"])
			.html(node.name)
	}

	_getEdgeOverlay(edge){
		return {
			"arrow":[ [ "PlainArrow", { location:1, width:10, length:10 } ] ],
			"link":[],
		}[edge.type]
	}

	/**
	 * Renders edges
	 */
	_renderEdges(){
		this._edges.forEach(edge=>{
			var overlay = this._getEdgeOverlay(edge);
			this._plumb.connect({
				source:edge.start,
				target:edge.end,
				anchor:[ "TopCenter","RightMiddle","BottomCenter","LeftMiddle" ],
				endpoint:"Blank",
				paintStyle:{ stroke:'#546E7A', strokeWidth:2 },
				connector :"Straight", //"Flowchart" "Straight",
				overlays: overlay,
				endpointStyle:{ fill: "black" }				
			});
		});
	}

	/**
	 * Sets widget data
	 * @param {Array} data
	 * @returns {Bar} returns this widget instance 
	 */
	setData(data) {
		if (!this._container) throw "Diagram is not rendered"

		this._el.html("");

		this._nodes = data.nodes || [];
		this._edges = data.edges || [];

		return this._renderNodes();
	}
}
