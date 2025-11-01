// This component handles placing the pet and showing distance updates.
AFRAME.registerComponent('gps-event-handler', {
    init: function () {
        const scene = this.el;
        const pet = document.getElementById('pet');
        const statusText = document.getElementById('status');
        const distanceText = document.getElementById('distance');
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