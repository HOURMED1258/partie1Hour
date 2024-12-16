document.addEventListener("DOMContentLoaded", function () {
    const sectionCarte2 = document.getElementById("carte2");
    if (sectionCarte2) {
        const map = L.map(sectionCarte2).setView([31.0245, -8.1356], 10);

        // Ajouter les tuiles
        const tiles1 = L.tileLayer('https://api.mapbox.com/styles/v1/elaounijassim/claz9neo300li14mpxy0alzzo/tiles/256/{z}/{x}/{y}@2x?access_token=pk.eyJ1IjoiZWxhb3VuaWphc3NpbSIsImEiOiJjbGF5ZmswaXIwNzhvM3FtbHhiZ2o3eG94In0.2D5g4-DntItXKK1ylEJsrQ', {
            maxZoom: 19,
            attribution: "© <a href='https://www.mapbox.com/about/maps/'>Mapbox</a> © <a href='http://www.openstreetmap.org/copyright'>OpenStreetMap</a>"
        }).addTo(map);

        // Préparer le graphique
        const ctx = document.getElementById("graph1").getContext("2d");
        const graph = new Chart(ctx, {
            type: "bar",
            data: {
                labels: ["Haute confiance", "Confiance moyenne", "Faible confiance"], // Niveaux de confiance
                datasets: [{
                    label: "Nombre de bâtiments",
                    data: [0, 0, 0],
                    backgroundColor: ["green", "orange", "red"]
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: { display: true },
                    tooltip: { enabled: true }
                },
                scales: {
                    y: { beginAtZero: true },
                    x: { title: { display: true, text: "Le Niveau de Confiance" } }
                }
            }
        });

        // Charger les communes
        let communesLayer;
        fetch("communes1.geojson")
            .then(response => response.json())
            .then(data => {
                const getCommuneStyle = (nomcommune) => {
                    const colors = {
                        "AGHBAR": "red",
                        "ANOUGAL": "green",
                        "AZGOUR": "blue",
                        "IGHIL": "yellow",
                        "TALAT NYAAQOUBL": "magenta"
                    };
                    return colors[nomcommune] || "gray";
                };

                communesLayer = L.geoJSON(data, {
                    style: function (feature) {
                        const nomcommune = feature.properties.nomcommune;
                        return {
                            color: getCommuneStyle(nomcommune),
                            weight: 2
                        };
                    },
                    onEachFeature: function (feature, layer) {
                        if (feature.properties && feature.properties.nomcommune) {
                            layer.bindPopup(`<strong>Commune:</strong> ${feature.properties.nomcommune}`);
                            layer.on("click", function () {
                                // Mettre à jour le graphique lorsqu'une commune est cliquée
                                updateGraphForCommune(feature.properties.nomcommune);
                            });
                        }
                    }
                }).addTo(map);
            })
            .catch(error => console.error("Erreur lors du chargement de communes1.geojson :", error));

        // Charger les bâtiments
        let batimentsData = [];
        fetch("batiments.geojson")
            .then(response => response.json())
            .then(data => {
                batimentsData = data.features;

                // Fonction pour définir le style des bâtiments
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

                // Ajout des données GeoJSON à la carte
                const batimentsLayer = L.geoJSON(data, {
                    style: function (feature) {
                        const confidence = feature.properties.confidence || 0;
                        return getBuildingStyle(confidence);
                    },
                    onEachFeature: function (feature, layer) {
                        if (feature.properties) {
                            const name = feature.properties.name || "Inconnu";
                            const confidence = feature.properties.confidence || "Non spécifié";
                            layer.bindPopup(
                                `<strong>Bâtiment:</strong> ${name}<br><strong>Confiance:</strong> ${confidence}`
                            );
                        }
                    }
                }).addTo(map);

                // Ajouter checkbox pour afficher/masquer bâtiments
                const showBuildingsCheckbox = document.getElementById("showBuildings");
                showBuildingsCheckbox.addEventListener("change", function () {
                    if (showBuildingsCheckbox.checked) {
                        batimentsLayer.addTo(map);
                    } else {
                        map.removeLayer(batimentsLayer);
                    }
                });
            })
            .catch(error => console.error("Erreur lors du chargement de batiments.geojson :", error));

        // Fonction pour mettre à jour le graphique
        function updateGraphForCommune(nomcommune) {
            const filteredBuildings = batimentsData.filter(feature => feature.properties.nomcommune === nomcommune);
            const confidenceCounts = { high: 0, medium: 0, low: 0 };

            filteredBuildings.forEach(feature => {
                const confidence = feature.properties.confidence || 0;
                if (confidence >= 0.75) {
                    confidenceCounts.high++;
                } else if (confidence > 0.7 && confidence < 0.75) {
                    confidenceCounts.medium++;
                } else if (confidence >= 0.65 && confidence <= 0.7) {
                    confidenceCounts.low++;
                }
            });

            // Mettre à jour les données du graphique
            graph.data.labels = ["Haute confiance", "Confiance moyenne", "Faible confiance"];
            graph.data.datasets[0].data = [
                confidenceCounts.high,
                confidenceCounts.medium,
                confidenceCounts.low
            ];
            graph.update();
        }

        // Ajouter une légende
        const legend = L.control({ position: 'topright' });
        legend.onAdd = function () {
            const div = L.DomUtil.create('div', 'info legend');
            div.innerHTML += "<strong>Commune</strong><br>";
            div.innerHTML += "<i style='background: red'></i> AGHBAR<br>";
            div.innerHTML += "<i style='background: green'></i> ANOUGAL<br>";
            div.innerHTML += "<i style='background: blue'></i> AZGOUR<br>";
            div.innerHTML += "<i style='background: yellow'></i> IGHIL<br>";
            div.innerHTML += "<i style='background: pink'></i> TALAT NYAAQOUBL<br><br>";
            div.innerHTML += "<strong>Bâtiment - Confiance</strong><br>";
            div.innerHTML += "<i style='background: green'></i> Haute confiance<br>";
            div.innerHTML += "<i style='background: orange'></i> Confiance moyenne<br>";
            div.innerHTML += "<i style='background: red'></i> Faible confiance<br>";
            return div;
        };
        legend.addTo(map);
    }
    
});
