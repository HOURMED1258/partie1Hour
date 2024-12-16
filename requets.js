document.addEventListener("DOMContentLoaded", function () {
    const map = L.map("map-requets").setView([31.0245, -8.1356], 10); // Coordonnées centrées

    // Ajouter une couche de base (OpenStreetMap)
    const tiles1 = L.tileLayer('https://api.mapbox.com/styles/v1/elaounijassim/claz9neo300li14mpxy0alzzo/tiles/256/{z}/{x}/{y}@2x?access_token=pk.eyJ1IjoiZWxhb3VuaWphc3NpbSIsImEiOiJjbGF5ZmswaXIwNzhvM3FtbHhiZ2o3eG94In0.2D5g4-DntItXKK1ylEJsrQ', {
        maxZoom: 19,
        attribution: "© <a href='https://www.mapbox.com/about/maps/'>Mapbox</a> © <a href='http://www.openstreetmap.org/copyright'>OpenStreetMap</a>"
    }).addTo(map);

    let communeLayer = null; // Calque de la commune filtrée
    let batimentsLayer = null; // Calque des bâtiments filtrés

    // Charger les données GeoJSON des communes
    let communesData = null;
    fetch('communes1.geojson')
        .then(response => response.json())
        .then(data => {
            communesData = data;
            console.log("Données des communes chargées.");
        })
        .catch(error => console.error('Erreur lors du chargement de communes1.geojson:', error));

    // Charger les données GeoJSON des bâtiments
    let batimentsData = null;
    fetch('batiments.geojson')
        .then(response => response.json())
        .then(data => {
            batimentsData = data;
            console.log("Données des bâtiments chargées.");
        })
        .catch(error => console.error('Erreur lors du chargement de batiments.geojson:', error));

    // Fonction pour obtenir le style en fonction du niveau de confiance
    const getBuildingStyle = (confidence) => {
        if (confidence >= 0.75) {
            return { color: "green", weight: 2, dashArray: null }; // Ligne verte pleine
        } else if (confidence > 0.7 && confidence < 0.75) {
            return { color: "orange", weight: 2, dashArray: "5, 5" }; // Ligne orange pointillée
        } else if (confidence >= 0.65 && confidence <= 0.7) {
            return { color: "red", weight: 2, dashArray: "5, 5" }; // Ligne rouge pointillée
        } else {
            return { color: "gray", weight: 1, dashArray: "2, 4" }; // Par défaut : gris en pointillé
        }
    };

    // Fonction pour afficher une commune filtrée par nom
    const afficherCommune = (nomcommune) => {
        if (communeLayer) {
            map.removeLayer(communeLayer); // Supprimer le calque précédent de la commune
        }

        if (communesData) {
            // Filtrer les communes par le nom (en utilisant 'nomcommune' ici ou la propriété correspondante)
            const filteredCommune = communesData.features.filter(feature => feature.properties.nomcommune === nomcommune); // Assurez-vous que c'est 'nomcommune' ou 'name'

            if (filteredCommune.length > 0) {
                // Ajouter la commune au calque
                communeLayer = L.geoJSON(filteredCommune, {
                    style: {
                        color: "blue",
                        weight: 2,
                        fillOpacity: 0.2
                    },
                    onEachFeature: function (feature, layer) {
                        layer.bindPopup(`<b>Commune: </b>${feature.properties.nomcommune}`); // Assurez-vous que c'est 'nomcommune' ou 'name'
                    }
                }).addTo(map);
                console.log("Commune affichée :", nomcommune);
                return filteredCommune[0].geometry; // Retourner la géométrie de la commune
            } else {
                console.log("Aucune commune trouvée pour ce nom.");
            }
        }
        return null;
    };

    // Gérer la soumission du formulaire
    const requestForm = document.getElementById('requestForm');
    requestForm.addEventListener('submit', function (event) {
        event.preventDefault(); // Empêche l'envoi du formulaire

        const confidenceValue = document.getElementById('confidence').value;
        const selectedCommune = document.getElementById('nomcommune').value;

        console.log("Valeur de confiance sélectionnée:", confidenceValue);
        console.log("Commune sélectionnée:", selectedCommune);

        // Supprimer les calques existants avant d'ajouter de nouveaux
        if (communeLayer) {
            map.removeLayer(communeLayer); // Supprimer le calque de la commune précédente
            console.log("Ancien calque de commune supprimé.");
        }
        if (batimentsLayer) {
            map.removeLayer(batimentsLayer); // Supprimer le calque des bâtiments précédents
            console.log("Ancien calque des bâtiments supprimé.");
        }

        // Afficher la commune sélectionnée
        let communeGeometry = null;
        if (selectedCommune) {
            communeGeometry = afficherCommune(selectedCommune);
        }

        // Filtrer les bâtiments en fonction du niveau de confiance et de l'intersection avec la commune
        if (batimentsData && communeGeometry) {
            let filteredBuildings;

            if (confidenceValue) {
                // Appliquer un filtre spécifique selon la classe de confiance
                filteredBuildings = batimentsData.features.filter(function (feature) {
                    return feature.properties.confidence >= parseFloat(confidenceValue);
                });
            } else {
                filteredBuildings = batimentsData.features; // Afficher tous les bâtiments si aucun filtre de confiance n'est appliqué
            }

            // Filtrer les bâtiments en fonction de l'intersection avec la commune
            filteredBuildings = filteredBuildings.filter(function (feature) {
                const buildingGeometry = feature.geometry;
                return turf.booleanIntersects(buildingGeometry, communeGeometry);
            });

            console.log("Bâtiments après intersection avec la commune:", filteredBuildings.length);

            // Ajouter le calque des bâtiments filtrés
            if (filteredBuildings.length > 0) {
                batimentsLayer = L.geoJSON(filteredBuildings, {
                    style: function (feature) {
                        return getBuildingStyle(feature.properties.confidence);
                    },
                    onEachFeature: function (feature, layer) {
                        layer.bindPopup(`<b>Confiance: </b>${feature.properties.confidence}`);
                    }
                }).addTo(map);
                console.log("Bâtiments filtrés ajoutés à la carte.");
            } else {
                console.log("Aucun bâtiment ne correspond à l'intersection avec la commune ou au critère de confiance.");
            }
        }
    });
});
