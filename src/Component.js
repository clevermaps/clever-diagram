import Observable from "./utils/Observable";
import style from "./CleverDiagram.css";
import * as d3 from "d3";

class Component {

    constructor(
        className = "component"
    ) {
        this._container = null;
        this._className = className;

        this._observable = new Observable([
            "enter",
            "leave",
            "click"
        ]);

        this._lastData = null;
        this._svg = null;
    }

    on(eventName, handler) {
        this._observable.on(eventName, handler);
        return this;
    }

    off(eventName, handler) {
        this._observable.off(eventName, handler);
        return this;
    }

    get className() {
        return this._className;
    }

    get container() {
        return this._container;
    }

    get observable() {
        return this._observable;
    }

    _renderContainer(selector, x = 0, y = 0){

        return d3.select(selector).append("g")
            .attr("class", style[this.className])
            .attr("transform", `translate(${x}, ${y})`);

    }

    render(selector, x = 0, y = 0, index = 0){
        this.destroy();

        this._container = this._renderContainer(selector, x, y);

        if (!this._container) {
            throw `Component ${this._className} was not rendered. Check your selector: ${selector}`;
        }

        this._container.datum(index);

        this._container
            .on("click", (index) => {
                this._observable.fire("click", index);
            })
            .on("mouseenter", (index) => {
                this._observable.fire("enter", index);
            })
            .on("mouseleave", (index) => {
                this._observable.fire("leave", index);
            });

        return this;
    }

    destroy(){
        if (this.isRendered()) {
            this._lastData = null;
            this.clearData();
            this._container.datum(null);
            this._container.remove();
            this._container = null;
        }
        return this;
    }

    clearData() {
        if (!this.isRendered()) {
            throw "Can't call clearData() when widget is not rendered, please call .render() first.";
        }
        this._clearData();
        this._data = null;
        return this;
    }

    isRendered(){
        return this._container !== null;
    }

    setData(data) {
        if (!this.isRendered()) {
            throw "Can't call setData() when component is not rendered, please call .render() first.";
        }
        this._lastData = Object.assign({}, this._lastData, data);

        return this._setData(this._container, data, this._lastData);
    }


}

export default Component;
