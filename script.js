document.addEventListener('DOMContentLoaded', () => {
    const imageUpload = document.getElementById('imageUpload');
    const badgeCanvas = document.getElementById('badgeCanvas');
    const ctx = badgeCanvas.getContext('2d');
    const downloadButton = document.getElementById('downloadButton');

    // Les dimensions du canvas pour l'affichage à l'écran (elles restent normales)
    // Assure-toi que ces valeurs sont définies dans ton HTML <canvas width="..." height="...">
    // Ou définis-les ici si elles ne le sont pas, mais elles devraient correspondre à ton badge.jpg
    const displayCanvasWidth = badgeCanvas.width; // Ex: 600
    const displayCanvasHeight = badgeCanvas.height; // Ex: 300

    const cropModal = new bootstrap.Modal(document.getElementById('cropModal'));
    const imageToCrop = document.getElementById('imageToCrop');
    const cropButton = document.getElementById('cropButton');
    let cropperInstance;

    const defaultBadgeImagePath = 'badge.jpg';
    // Les coordonnées et rayon sont basés sur les dimensions d'affichage, pas HD pour le moment
    const circleConfig = { 
        x: 452,   
        y: 166,
        radius: 128
    };

    let userImage = null; 
    let defaultBadgeImage = new Image();

    defaultBadgeImage.src = defaultBadgeImagePath;
    defaultBadgeImage.onload = () => {
        // Dessine sur le canvas à sa taille d'affichage normale au chargement
        drawBadge(displayCanvasWidth, displayCanvasHeight, 1); // Facteur d'échelle 1 pour l'affichage
    };
    defaultBadgeImage.onerror = () => {
        console.error("Erreur lors du chargement de l'affiche par défaut. Vérifiez le chemin : " + defaultBadgeImagePath);
        alert("L'affiche par défaut n'a pas pu être chargée. Vérifiez le chemin du fichier.");
    };
    
    // Modifie la fonction drawBadge pour qu'elle puisse prendre des dimensions et un facteur d'échelle
    function drawBadge(targetWidth, targetHeight, scaleFactor) {
        // Redimensionne temporairement le canvas pour le dessin
        const originalCanvasWidth = badgeCanvas.width;
        const originalCanvasHeight = badgeCanvas.height;
        badgeCanvas.width = targetWidth;
        badgeCanvas.height = targetHeight;

        ctx.clearRect(0, 0, badgeCanvas.width, badgeCanvas.height);

        if (defaultBadgeImage.complete && defaultBadgeImage.naturalWidth > 0) {
            ctx.drawImage(defaultBadgeImage, 0, 0, badgeCanvas.width, badgeCanvas.height);
        } else {
            console.warn("L'image de l'affiche par défaut n'est pas encore chargée ou a échoué.");
            ctx.fillStyle = '#f0f0f0';
            ctx.fillRect(0, 0, badgeCanvas.width, badgeCanvas.height);
            ctx.fillStyle = '#333';
            ctx.font = `${20 * scaleFactor}px Arial`; // Adapte la taille de la police
            ctx.textAlign = 'center';
            ctx.fillText("Affiche par défaut non chargée", badgeCanvas.width / 2, badgeCanvas.height / 2);
        }

        if (userImage) {
            ctx.save();
            ctx.beginPath();
            // Adapte les coordonnées et le rayon en fonction du facteur d'échelle
            ctx.arc(circleConfig.x * scaleFactor, circleConfig.y * scaleFactor, circleConfig.radius * scaleFactor, 0, Math.PI * 2, true);
            ctx.closePath();
            ctx.clip();

            const imageAspectRatio = userImage.width / userImage.height;
            const circleDiameter = circleConfig.radius * 2 * scaleFactor;
            let drawWidth = circleDiameter;
            let drawHeight = circleDiameter;

            if (imageAspectRatio < 1) { 
                drawWidth = drawHeight * imageAspectRatio;
            } else { 
                drawHeight = drawWidth / imageAspectRatio;
            }

            const drawX = (circleConfig.x * scaleFactor) - (drawWidth / 2);
            const drawY = (circleConfig.y * scaleFactor) - (drawHeight / 2);

            ctx.drawImage(userImage, drawX, drawY, drawWidth, drawHeight);
            ctx.restore();

            ctx.beginPath();
            ctx.arc(circleConfig.x * scaleFactor, circleConfig.y * scaleFactor, circleConfig.radius * scaleFactor, 0, Math.PI * 2, true);
            ctx.strokeStyle = 'white';
            ctx.lineWidth = 5 * scaleFactor; // Adapte la largeur du trait
            ctx.stroke();
        }

        // Restaure la taille originale du canvas après le dessin, pour l'affichage
        badgeCanvas.width = originalCanvasWidth;
        badgeCanvas.height = originalCanvasHeight;
    }

    imageUpload.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                imageToCrop.src = e.target.result;
                cropModal.show();
            };
            reader.readAsDataURL(file);
        } else {
            userImage = null;
            drawBadge(displayCanvasWidth, displayCanvasHeight, 1);
        }
    });

    document.getElementById('cropModal').addEventListener('shown.bs.modal', () => {
        if (cropperInstance) {
            cropperInstance.destroy();
        }
        cropperInstance = new Cropper(imageToCrop, {
            aspectRatio: 1,
            viewMode: 1,
            guides: true,
            autoCropArea: 0.8,
            cropBoxResizable: true,
            cropBoxMovable: true,
            ready: function () {
                this.cropper.zoomTo(0.5);
                this.cropper.zoomTo(1);
                this.cropper.reset();
            }
        });
    });

    document.getElementById('cropModal').addEventListener('hidden.bs.modal', () => {
        if (cropperInstance) {
            cropperInstance.destroy();
            cropperInstance = null;
        }
    });

    cropButton.addEventListener('click', () => {
        if (cropperInstance) {
            const croppedDataUrl = cropperInstance.getCroppedCanvas({
                width: 800, // Résolution de l'image de profil rognée
                height: 800,
                fillColor: '#fff',
                imageSmoothingEnabled: true,
                imageSmoothingQuality: 'high'
            }).toDataURL('image/png');

            userImage = new Image();
            userImage.src = croppedDataUrl;
            userImage.onload = () => {
                // Après le rognage, redessine le badge à la taille d'affichage normale
                drawBadge(displayCanvasWidth, displayCanvasHeight, 1); 
                cropModal.hide();
            };
            userImage.onerror = () => {
                alert("Erreur lors du traitement de l'image rognée.");
                userImage = null;
                drawBadge(displayCanvasWidth, displayCanvasHeight, 1);
                cropModal.hide();
            };
        }
    });

    downloadButton.addEventListener('click', () => {
        if (defaultBadgeImage.complete && defaultBadgeImage.naturalWidth > 0) {
            // --- NOUVEAU CODE : Dessin en HD avant l'exportation ---
            const hdWidth = 1920; // Largeur désirée pour la sortie HD (ex: Full HD)
            const hdHeight = 1080; // Hauteur désirée pour la sortie HD (ex: Full HD)

            // Temporairement, dessine le badge en HD sur le canvas
            drawBadge(hdWidth, hdHeight, hdWidth / displayCanvasWidth); // Utilise un facteur d'échelle

            // Exporte le canvas en HD
            const dataURL = badgeCanvas.toDataURL('image/png', 1.0); // 1.0 pour une qualité maximale PNG
            // --- FIN NOUVEAU CODE ---

            const a = document.createElement('a');
            a.href = dataURL;
            
            const timestamp = new Date().getTime();
            const randomString = Math.random().toString(36).substring(2, 8);
            a.download = `mon_badge_${timestamp}_${randomString}.png`;
            
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);

            // Important : Redessine le badge à sa taille d'affichage normale après l'exportation
            // Pour ne pas laisser le canvas en très grande résolution à l'écran
            drawBadge(displayCanvasWidth, displayCanvasHeight, 1); 
        } else {
            alert("L'affiche par défaut n'est pas encore chargée. Veuillez patienter ou recharger la page.");
        }
    });

    // Appel initial pour dessiner le badge à la taille d'affichage
    drawBadge(displayCanvasWidth, displayCanvasHeight, 1); 
});
