class Example {
    constructor(variant) {
        this.variant = variant;
    }

    setVariant(variant) {
        this.variant = variant;
    }

    createDiagram() {
        this.diagram = new CleverDiagram({
            elkWorkerUrl:'../dist/elk-worker.min.js',
            groupColors:{
                'admin':'#2196F3',
                'default':'#4CAF50',
                'projects': 'rgb(181, 19, 254)'
            },
            iconFontFamily: 'Material-Design-Iconic-Font'
        });

        this.diagram.render('.graph-ct')
            .on('selectNode', (name) => {
                console.log(`selected node: ${name}`);
                this.diagram.selectNode(name);
            })
            .on('deselectNode', (name) => {
                console.log(`deselected node: ${name}`);
                this.diagram.deselectNode(name);
            })
            .on('highlightNode', (name) => {
                console.log(`highlighted node: ${name}`);
                this.diagram.highlightNode(name);
            })
            .on('unhighlightNode', () => {
                console.log('unhighlight node');
                this.diagram.unhighlightNode();
            });

        d3.json(data[this.variant].path, json => {
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