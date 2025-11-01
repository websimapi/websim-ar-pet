/**
 * This component manages the pet's behavior once in the scene.
 */
AFRAME.registerComponent('pet-manager', {
    init: function () {
        console.log('Pet manager initialized.');
    },
    tick: function () {
        // Make the pet gently rotate if it's visible.
        if (this.el.getAttribute('visible')) {
            this.el.object3D.rotation.y += 0.01;
        }
    }
});


document.addEventListener('DOMContentLoaded', () => {
    const sceneEl = document.querySelector('a-scene');
    const petEl = document.getElementById('pet');
    const loadingOverlay = document.getElementById('loading-overlay');
    const loadingText = document.getElementById('loading-text');
    const startButton = document.getElementById('start-button');
    const statusText = document.getElementById('status');
    let petPlaced = false;

    // Hide status text until we have something to say
    statusText.style.display = 'none';

    startButton.addEventListener('click', () => {
        loadingText.textContent = 'Requesting location access...';
        startButton.style.display = 'none';
        requestPermissionsAndStart();
    });

    function requestPermissionsAndStart() {
        // We need to get location permissions first.
        // A-Frame's AR.js system will handle camera permissions when the scene is dynamically set up.
        if (!navigator.geolocation) {
            statusText.textContent = "Geolocation is not supported by your browser.";
            loadingText.textContent = "Geolocation is not supported by your browser.";
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                console.log('Location access granted.');
                loadingText.textContent = 'Starting AR camera...';
                statusText.style.display = 'block'; // Show status now
                statusText.textContent = 'Waiting for GPS signal...';

                // Set up the scene now that we have permission
                // This will trigger the camera permission prompt
                sceneEl.setAttribute('arjs', {
                    sourceType: 'webcam',
                    videoTexture: true,
                    debugUIEnabled: false,
                });
                 // Add the gps-camera dynamically only after user interaction
                const camera = document.createElement('a-camera');
                camera.setAttribute('gps-camera', '');
                camera.setAttribute('rotation-reader', '');
                sceneEl.appendChild(camera);


                // Listen for GPS updates to place the pet
                window.addEventListener('gps-camera-update-position', onGpsUpdate);
                
                // Set the pet manager component
                petEl.setAttribute('pet-manager', '');

            },
            (error) => {
                console.error("Geolocation error: ", error);
                loadingText.textContent = `Error: ${error.message}. Please enable location permissions in your browser and refresh.`;
                statusText.style.display = 'block';
                statusText.textContent = 'Location permission denied.';
            }
        );
    }
    
    function onGpsUpdate(e) {
        if (!petPlaced) {
            console.log('First GPS signal received:', e.detail.position);
            statusText.textContent = 'Location found! Placing pet...';
            
            // Place pet 15 meters to the North of the user's initial location.
            const petLatitude = e.detail.position.latitude + 0.00015;
            const petLongitude = e.detail.position.longitude;

            petEl.setAttribute('gps-entity-place', {
                latitude: petLatitude,
                longitude: petLongitude
            });

            petEl.setAttribute('visible', true);
            petPlaced = true;
            loadingOverlay.style.display = 'none'; // Hide overlay once pet is placed
            console.log(`Pet placed at: lat=${petLatitude}, lon=${petLongitude}`);
        } else {
            // This code runs on every GPS update after the pet is placed.
            // Using built-in distance function from AR.js aframe component
            const distance = petEl.components['gps-entity-place']?.distance;
            
            if (distance !== undefined && distance !== null) {
                statusText.textContent = `Look around! Your pet is ${distance.toFixed(1)} meters away.`;
            } else {
                statusText.textContent = 'Look around to find your pet!';
            }
        }
    }
});