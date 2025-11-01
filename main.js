// This component makes our pet rotate and handles interaction logic.
AFRAME.registerComponent('pet-behavior', {
    init: function () {
        this.distanceText = document.getElementById('distance');
        this.camera = document.querySelector('[gps-camera]');

        window.addEventListener('gps-camera-update-position', (event) => {
            const petPosition = this.el.getAttribute('position');
            // AR.js doesn't provide a direct distance for gps-entity-place entities
            // in the position attribute relative to the camera, so we calculate it.
            // This is a simplified 2D distance for now.
            const distance = this.el.object3D.position.distanceTo(new THREE.Vector3(0,0,0));
            
            if (this.distanceText) {
                this.distanceText.textContent = distance.toFixed(2);
            }
        });
        
        console.log('Pet behavior initialized!');
    },

    tick: function () {
        // Make the pet gently rotate.
        this.el.object3D.rotation.y += 0.01;
    }
});