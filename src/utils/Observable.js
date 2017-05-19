/**
 * @class
 * Observable class, handles binding and firing events
 * @param {Array} events list of events for this observable
 */
export default class Observable {
    /**
     * @param {Array} events
     */
    constructor(events = []) {
        // create a map of handlers where each event has an array of bound handlers
        this._handlers = events.reduce((acc, cur)=>{
            acc[cur] = [];
            return acc;
        },{});
    }

	/**
	 * @public
	 * Bind event
	 * @param {String} event event name
	 * @param {Function} handler event handler
	 */
    on(event, handler) {
        if (!(event in this._handlers)) throw "No such event: " + event;
		this._handlers[event].push(handler);
		return this;
    }

	/**
	 * @public
	 * Unbind event
	 * @param {String} event event name
	 * @param {Function} [handler] event handler, optional
	 */
    off(event, handler) {
        if (!(event in this._handlers)) throw "No such event: " + event;
		if (!handler) {
			this._handlers[event] = [];
		} else {
			var handlers = this._handlers[event];
			var index = handlers.indexOf(handler);
			if (index != -1){
				handlers.splice(index, 1);
			}
		}
		return this;
    }

	/**
	 * @public
	 * Fire widget event
	 * @param {String} event event name
	 * @param {*} ...args event arguments
	 */
	fire(event, ...args) {
		if (!(event in this._handlers)) throw "No such event: " + event;
		var handlers = this._handlers[event];
		for (var i = 0; i < handlers.length; i++) {
			handlers[i].apply(this, args);
		}
		return this;
    }

	/**
	 * @public
	 * Destorys this observable, removes events and so on 
	 */
	destroy() {
		this._handlers = null;
		return this;
    }
	
}