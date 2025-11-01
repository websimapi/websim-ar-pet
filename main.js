/**
 * This component manages the pet's state in the AR scene.
 * It waits for the GPS to initialize, places the pet nearby,
 * and provides feedback to the user.
 */
AFRAME.registerComponent('pet-manager', {
    init: function () {
        this.pet = this.el;
        this.camera = document.querySelector('[gps-camera]');
        this.statusText = document.getElementById('status');
        this.petPlaced = false;

        console.log('Pet manager initialized. Waiting for GPS.');
        this.statusText.textContent = 'Getting GPS signal... Please be patient.';

        window.addEventListener('gps-camera-update-position', this.onGpsUpdate.bind(this));
    },

    onGpsUpdate: function (e) {
        if (!this.petPlaced) {
            console.log('First GPS signal received:', e.detail.position);
            this.statusText.textContent = 'Location found! Placing pet...';
            
            // Place pet 15 meters to the North of the user's initial location.
            // 0.0001 adds roughly 11 meters. 0.00015 is ~16.5m.
            const petLatitude = e.detail.position.latitude + 0.00015;
            const petLongitude = e.detail.position.longitude;

            this.pet.setAttribute('gps-entity-place', {
                latitude: petLatitude,
                longitude: petLongitude
            });

            this.pet.setAttribute('visible', true);
            this.petPlaced = true;
            console.log(`Pet placed at: lat=${petLatitude}, lon=${petLongitude}`);
        }

        // This code runs on every GPS update after the pet is placed.
        if (this.petPlaced) {
            // Using built-in distance function from AR.js aframe component
            const distance = this.pet.components['gps-entity-place']?.distance;
            
            if (distance !== undefined && distance !== null) {
                this.statusText.textContent = `Look around! Your pet is ${distance.toFixed(1)} meters away.`;
            } else {
                this.statusText.textContent = 'Look around to find your pet!';
            }
        }
    },

    tick: function () {
        // Make the pet gently rotate if it's visible.
        if (this.pet.getAttribute('visible')) {
            this.el.object3D.rotation.y += 0.01;
        }
    }
});


document.addEventListener('DOMContentLoaded', () => {
    const sceneEl = document.querySelector('a-scene');
    const loadingOverlay = document.getElementById('loading-overlay');
    const loadingText = document.getElementById('loading-text');
    const startButton = document.getElementById('start-button');
    const statusText = document.getElementById('status');

    startButton.addEventListener('click', () => {
        loadingText.textContent = 'Requesting location permissions...';
        startButton.style.display = 'none';
        requestPermissions();
    });

    function requestPermissions() {
        // 1. Request Location
        navigator.geolocation.getCurrentPosition(
            (position) => {
                loadingText.textContent = 'Location access granted. Requesting camera...';
                // 2. Request Camera
                navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
                    .then((stream) => {
                        // We don't need the stream ourselves, AR.js will handle it.
                        // Stop the track to free up the camera for AR.js
                        stream.getTracks().forEach(track => track.stop());
                        startAR();
                    })
                    .catch((err) => {
                        handlePermissionError(err, 'Camera');
                    });
            },
            (err) => {
                handlePermissionError(err, 'Location');
            }
        );
    }

    function handlePermissionError(err, type) {
        let message = `Could not get ${type} access. Please check your browser settings and refresh.`;
        if (err.code === 1 || err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
            message = `${type} permission denied. Please enable it in your browser settings and refresh.`;
        }
        loadingText.textContent = message;
        console.error(`Error getting ${type} permissions:`, err);
    }

    function startAR() {
        loadingText.textContent = 'Starting AR experience...';
        statusText.textContent = "Waiting for GPS signal...";

        // Dynamically add the arjs component to the scene to start it
        sceneEl.setAttribute('arjs', {
            sourceType: 'webcam',
            videoTexture: true,
            debugUIEnabled: false
        });

        console.log("AR.js started");
    }
});


// This component handles placing the pet and showing distance updates.
AFRAME.registerComponent('gps-event-handler', {
    init: function () {
        const pet = this.el;
        const statusText = document.getElementById('status');
        const loadingOverlay = document.getElementById('loading-overlay');

        let petPlaced = false;

        console.log("AR scene initialized, waiting for GPS.");

        // Fired when GPS signal is first found
        window.addEventListener('gps-camera-update-position', (e) => {
            if (!petPlaced) {
                console.log('GPS position updated:', e.detail.position);
                statusText.textContent = "Location found! Placing pet...";
                
                // Place pet 15 meters to the North
                const petLatitude = e.detail.position.latitude + 0.00015;
                const petLongitude = e.detail.position.longitude;

                pet.setAttribute('gps-entity-place', {
                    latitude: petLatitude,
                    longitude: petLongitude
                });

                pet.setAttribute('visible', true);
                loadingOverlay.style.display = 'none';
                petPlaced = true;
                console.log('Pet placed at:', petLatitude, petLongitude);
            }
        });
    }
});


// This component makes our pet rotate and handles interaction logic.
AFRAME.registerComponent('pet-behavior', {
    init: function () {
        this.distanceText = document.getElementById('distance');
        this.camera = document.querySelector('[gps-camera]');
        this.statusText = document.getElementById('status');

        // This event fires on every position update.
        window.addEventListener('gps-camera-update-position', (event) => {
            if(!this.el.getAttribute('visible')) return;

            // Using built-in distance function from AR.js aframe component
            const distance = this.el.components['gps-entity-place'].distance;
            
            if (this.distanceText) {
                if(distance !== null) {
                    this.distanceText.textContent = `${distance.toFixed(2)}`;
                    this.statusText.textContent = "Look around to find your pet!";
                } else {
                    this.distanceText.textContent = '...';
                }
            }
        });
        
        console.log('Pet behavior initialized!');
    },

    tick: function () {
        // Make the pet gently rotate.
        this.el.object3D.rotation.y += 0.01;
    }
});