<!-- Chart.js Library -->
<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>

<script>
    document.addEventListener("DOMContentLoaded", function() {
        // Graphique des magnitudes des tremblements de terre
        var ctxMagnitude = document.getElementById('magnitude-chart').getContext('2d');
        var magnitudeChart = new Chart(ctxMagnitude, {
            type: 'bar',
            data: {
                labels: ['0-2', '2-4', '4-6', '6-8', '8+'],
                datasets: [{
                    label: 'Magnitudes des Tremblements de Terre',
                    data: [12, 19, 8, 5, 3], // Exemples de données
                    backgroundColor: 'rgba(52, 152, 219, 0.7)',
                    borderColor: 'rgba(52, 152, 219, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true
                    }
                },
                plugins: {
                    title: {
                        display: true,
                        text: 'Distribution des Magnitudes des Tremblements de Terre'
                    }
                }
            }
        });

        // Graphique des profondeurs des tremblements de terre
        var ctxDepth = document.getElementById('depth-chart').getContext('2d');
        var depthChart = new Chart(ctxDepth, {
            type: 'pie',
            data: {
                labels: ['0-100 km', '100-300 km', '300+ km'],
                datasets: [{
                    label: 'Profondeur des Tremblements de Terre',
                    data: [40, 35, 25], // Exemples de données
                    backgroundColor: ['#3498db', '#e74c3c', '#2ecc71'],
                    borderColor: '#fff',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    title: {
                        display: true,
                        text: 'Répartition des Profondeurs des Tremblements de Terre'
                    }
                }
            }
        });
    });
</script>
