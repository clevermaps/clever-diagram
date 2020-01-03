class Example {
    constructor(variant) {
        this.variant = variant;
    }

    setVariant(variant) {
        this.variant = variant;
    }

    createDiagram() {
        const zoomable = true;
        this.currentScale = 1;
        this.wrapper = document.querySelector('.graph-ct');

        if (!zoomable) {
            this.wrapper.classList.add('scrolling');
        }

        this.diagram = new CleverDiagram({
            elkWorkerUrl:'../dist/elk-worker.min.js',
            groupColors:{
                'admin':'#2196F3',
                'default':'#4CAF50',
                'projects': 'rgb(181, 19, 254)'
            },
            iconFontFamily: 'Material-Design-Iconic-Font',
            mouseControl: true,
            zoomable
        });

        this.diagram.render('.graph-ct')
            .on('selectNode', (name) => {
                console.log(`selected node: ${name}`);
            })
            .on('deselectNode', (name) => {
                console.log(`deselected node: ${name}`);
            })
            .on('highlightNode', (name) => {
                console.log(`highlighted node: ${name}`);
            })
            .on('zoom', (transform) => {
                console.log(`zoom transform: ${transform}`);
                this.diagram.setTransform(transform);
                this.currentScale = transform.k;
            });

        d3.json(data[this.variant].path).then(json => {
            this.diagram.setData(json);
        });

        this.registerEvents();
    }

    destroyDiagram() {
        d3.select('.graph-ct').html('');
        this.diagram.destroy();
    }

    registerEvents() {
        let doSelect = false;
        d3.select('#selectNode').on('click', () => {
            doSelect = !doSelect;
            if (doSelect) {
                this.diagram.selectNode(data[this.variant].node);
            } else {
                this.diagram.deselectNode(data[this.variant].node);
            }
        });

        let doHighlight = false;
        d3.select('#highlightNode').on('click', () => {
            doHighlight = !doHighlight;
            if (doHighlight) {
                this.diagram.highlightNode(data[this.variant].node);
            } else {
                this.diagram.unhighlightNode(data[this.variant].node);
            }
        });

        d3.select('#zoomIn').on('click', () => {
            this.diagram.setZoom(this.currentScale + 0.1);
        });

        d3.select('#zoomOut').on('click', () => {
            this.diagram.setZoom(this.currentScale - 0.1);
        });

        d3.select('#fullExtent').on('click', () => {
            this.diagram.setFullExtent();
        });

        d3.select('#reloadZoom').on('click', () => {
            this.wrapper.style.width = '700px';
            this.diagram.reloadZoom();
        });
    }
}

const data = {
    healthServices: {
        path: 'data/health-services.json',
        node: 'grid_dwh'
    },
    foodDelivery: {
        path: 'data/food-delivery.json',
        node: 'orders_dwh'
    },
    leafletDistribution: {
        path: 'data/leaflet-distribution.json',
        node: 'address-points'
    }
};

const selectEl = document.getElementById('data-select');
const example = new Example(selectEl.value);
example.createDiagram();


selectEl.addEventListener('change', () => {
    example.destroyDiagram();
    example.setVariant(selectEl.value);
    example.createDiagram();
});