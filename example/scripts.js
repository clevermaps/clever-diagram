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
            editable:document.getElementById('editable').checked,
            groupColors:{
                'admin':'#2196F3',
                'default':'#4CAF50'
            }
        });

        this.diagram.render('.graph-ct');

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
        this.diagram.on('nodeClick', (nodeName) => {
            console.log('selected:' +nodeName);
        });

        this.diagram.on('nodeHighlight', (nodeName, highlighted) => {
            console.log(`highlighted: ${nodeName} (${highlighted})`);
        });

        let doSelect = false;
        d3.select('#selectNode').on('click', () => {
            doSelect = !doSelect;
            this.diagram.selectNode(data[this.variant].node, doSelect);
        });

        let doHighlight = false;
        d3.select('#highlightNode').on('click', () => {
            doHighlight = !doHighlight;
            this.diagram.highlightNode(data[this.variant].node, doHighlight);
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
        node: 'address-points'
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