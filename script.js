let villageData = {};
let pieChart;

// Fonction pour introduire un délai
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function ensureLayersRendered() {
    await delay(500); // 500 ms pour permettre aux couches d'être rendues
}

// Charger le fichier GeoJSON et préparer les données pour le graphique
fetch('surface.geojson')
    .then(response => response.json())
    .then(data => {
        data.features.forEach(feature => {
            const village = feature.properties.name;
            const surfaceTotale = feature.properties.surface_T;
            const surfaceDetruite = feature.properties.surface;
            const surfaceNonDetruite = surfaceTotale - surfaceDetruite;

            // Stocker les informations pour chaque village
            villageData[village] = {
                detruite: surfaceDetruite,
                nonDetruite: surfaceNonDetruite
            };
        });
        console.log("Contenu de villageData :", villageData);
    });

// Mettre à jour le diagramme à barres (histogramme)
function updatePieChart(village) {
    const data = villageData[village];
    const chartData = {
        labels: ['Détruit', 'Non détruit'], // Labels pour chaque barre
        datasets: [{
            label: 'Surface (en m²)', // Légende pour l'histogramme
            data: [data.detruite, data.nonDetruite], // Données pour les barres
            backgroundColor: ['#FF0000', '#28A745'], // Couleur des barres
            borderColor: ['#FF6384', '#36A2EB'], // Couleur des bords des barres
            borderWidth: 1 // Largeur des bords des barres
        }]
    };

    if (pieChart) {
        pieChart.destroy(); // Supprimer l'ancien graphique pour éviter les doublons
    }

    pieChart = new Chart(document.getElementById('pieChart'), {
        type: 'bar', // Changer le type en 'bar' pour l'histogramme
        data: chartData,
        options: {
            responsive: true,
            plugins: {
                title: {
                    display: true,
                    text: village // Titre du graphique (nom du village)
                },
                subtitle: {
                    display: true,
                    text: 'La surface des bâtiments détruits et non détruits' // Sous-titre du graphique
                },
                legend: {
                    display: false // Masquer la légende des couleurs, car on a déjà des labels
                }
            },
            scales: {
                y: {
                    beginAtZero: true // Commencer l'axe Y à 0 pour une meilleure visibilité
                }
            }
        }
    });
}

// Initialiser la carte Leaflet principale
var map = L.map('map', {
    center: [31.0245, -8.1356],
    zoom: 10,
    dragging: false,
    doubleClickZoom: false,
    boxZoom: false,
    keyboard: false
});

// Ajouter la couche de base
const tiles1 = L.tileLayer('https://api.mapbox.com/styles/v1/elaounijassim/claz9neo300li14mpxy0alzzo/tiles/256/{z}/{x}/{y}@2x?access_token=pk.eyJ1IjoiZWxhb3VuaWphc3NpbSIsImEiOiJjbGF5ZmswaXIwNzhvM3FtbHhiZ2o3eG94In0.2D5g4-DntItXKK1ylEJsrQ', {
    maxZoom: 19,
    attribution: "© <a href='https://www.mapbox.com/about/maps/'>Mapbox</a> © <a href='http://www.openstreetmap.org/copyright'>OpenStreetMap</a>"
}).addTo(map);

// Précharger toutes les couches raster
let layer1, layer2, layer3, layer4, layer5, layer6;
let sideBySideControl;

function loadAllGeoRasters() {
    return Promise.all([
        loadGeoRaster('10300500E4F91800visual11.tif').then(layer => layer1 = layer),
        loadGeoRaster('103001008244DA00-visual21.tif').then(layer => layer2 = layer),
        loadGeoRaster('10300500E4F91800visual12.tif').then(layer => layer3 = layer),
        loadGeoRaster('103001008244DA00-visual22.tif').then(layer => layer4 = layer)
    ]);
}

function loadGeoRaster(url) {
    return fetch(url)
        .then(response => response.arrayBuffer())
        .then(arrayBuffer => parseGeoraster(arrayBuffer))
        .then(georaster => new GeoRasterLayer({
            georaster: georaster,
            resolution: 250,
        }));
}

// Fonction pour afficher les couches d'un village
function showLayers(layerA, layerB, village) {
    // Supprimer les couches précédentes
    if (sideBySideControl) map.removeControl(sideBySideControl);

    // Ajouter les nouvelles couches
    layerA.addTo(map);
    layerB.addTo(map);

    // Ajuster les contrôles et les limites
    map.fitBounds(layerA.getBounds());
    sideBySideControl = L.control.sideBySide(layerA, layerB).addTo(map);

    // Mettre à jour le graphique
    updatePieChart(village);
}

// Charger toutes les couches au chargement de la page
loadAllGeoRasters().then(() => {
    console.log("Toutes les couches sont chargées");
    // Afficher les couches du premier village par défaut
    showLayers(layer1, layer2, 'village1');
});

// Associer les boutons aux couches préchargées
document.getElementById('village1').addEventListener('click', () => {
    showLayers(layer1, layer2, 'village1');
});

document.getElementById('village2').addEventListener('click', () => {
    showLayers(layer3, layer4, 'village2');
});

// *** Ajout de la gestion des communes et bâtiments ***
const communeColors = {
    // Vos couleurs des communes ici...
};
let communeLayer = null;
let batimentLayers = {};


