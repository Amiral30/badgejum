document.addEventListener('DOMContentLoaded', () => {
    const imageUpload = document.getElementById('imageUpload');
    const badgeCanvas = document.getElementById('badgeCanvas');
    const ctx = badgeCanvas.getContext('2d');
    const downloadButton = document.getElementById('downloadButton');

    const cropModal = new bootstrap.Modal(document.getElementById('cropModal'));
    const imageToCrop = document.getElementById('imageToCrop');
    const cropButton = document.getElementById('cropButton');
    let cropperInstance;

    const defaultBadgeImagePath = 'badge.jpg';
    const circleConfig = { 
        x: 452,   
        y: 166,
        radius: 128
    };

    let userImage = null; 
    let defaultBadgeImage = new Image();

    defaultBadgeImage.src = defaultBadgeImagePath;
    defaultBadgeImage.onload = () => {
        drawBadge();
    };
    defaultBadgeImage.onerror = () => {
        console.error("Erreur lors du chargement de l'affiche par défaut. Vérifiez le chemin : " + defaultBadgeImagePath);
        alert("L'affiche par défaut n'a pas pu être chargée. Vérifiez le chemin du fichier.");
    };
    
    function drawBadge() {
        ctx.clearRect(0, 0, badgeCanvas.width, badgeCanvas.height);

        if (defaultBadgeImage.complete && defaultBadgeImage.naturalWidth > 0) {
            ctx.drawImage(defaultBadgeImage, 0, 0, badgeCanvas.width, badgeCanvas.height);
        } else {
            console.warn("L'image de l'affiche par défaut n'est pas encore chargée ou a échoué.");
            ctx.fillStyle = '#f0f0f0';
            ctx.fillRect(0, 0, badgeCanvas.width, badgeCanvas.height);
            ctx.fillStyle = '#333';
            ctx.font = '20px Arial';
            ctx.textAlign = 'center';
            ctx.fillText("Affiche par défaut non chargée", badgeCanvas.width / 2, badgeCanvas.height / 2);
        }

        if (userImage) {
            ctx.save();
            ctx.beginPath();
            ctx.arc(circleConfig.x, circleConfig.y, circleConfig.radius, 0, Math.PI * 2, true);
            ctx.closePath();
            ctx.clip();

            const imageAspectRatio = userImage.width / userImage.height;
            const circleDiameter = circleConfig.radius * 2;
            let drawWidth = circleDiameter;
            let drawHeight = circleDiameter;

            if (imageAspectRatio < 1) { 
                drawWidth = drawHeight * imageAspectRatio;
            } else { 
                drawHeight = drawWidth / imageAspectRatio;
            }

            const drawX = circleConfig.x - (drawWidth / 2);
            const drawY = circleConfig.y - (drawHeight / 2);

            ctx.drawImage(userImage, drawX, drawY, drawWidth, drawHeight);
            ctx.restore();

            ctx.beginPath();
            ctx.arc(circleConfig.x, circleConfig.y, circleConfig.radius, 0, Math.PI * 2, true);
            ctx.strokeStyle = 'white';
            ctx.lineWidth = 5;
            ctx.stroke();
        }
    }

    imageUpload.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                imageToCrop.src = e.target.result;
                cropModal.show(); // Affiche la modale
            };
            reader.readAsDataURL(file);
        } else {
            userImage = null;
            drawBadge();
        }
    });

    // NOUVEAU CODE : Initialiser Cropper.js seulement quand la modale est complètement visible
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
            ready: function () { // Callback quand Cropper.js est prêt
                // Force le redimensionnement pour s'assurer que l'image prend toute la place
                this.cropper.zoomTo(0.5); // Ajuste le zoom initial si nécessaire (0.5 = 50%)
                this.cropper.zoomTo(1); // Zoom à 100% après un petit zoom initial
                this.cropper.reset(); // Réinitialise pour adapter à la taille du conteneur
            }
        });
    });

    // NOUVEAU CODE : Détruire Cropper.js quand la modale est cachée
    document.getElementById('cropModal').addEventListener('hidden.bs.modal', () => {
        if (cropperInstance) {
            cropperInstance.destroy();
            cropperInstance = null; // Important pour éviter les références persistantes
        }
    });

    cropButton.addEventListener('click', () => {
        if (cropperInstance) {
            const croppedDataUrl = cropperInstance.getCroppedCanvas({
                width: 400,
                height: 400,
                fillColor: '#fff',
                imageSmoothingEnabled: true,
                imageSmoothingQuality: 'high'
            }).toDataURL('image/png');

            userImage = new Image();
            userImage.src = croppedDataUrl;
            userImage.onload = () => {
                drawBadge();
                cropModal.hide();
            };
            userImage.onerror = () => {
                alert("Erreur lors du traitement de l'image rognée.");
                userImage = null;
                drawBadge();
                cropModal.hide();
            };
        }
    });

    downloadButton.addEventListener('click', () => {
        if (defaultBadgeImage.complete && defaultBadgeImage.naturalWidth > 0) {
            const dataURL = badgeCanvas.toDataURL('image/png');
            const a = document.createElement('a');
            a.href = dataURL;
            a.download = 'mon_badge_evenement.png';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        } else {
            alert("L'affiche par défaut n'est pas encore chargée. Veuillez patienter ou recharger la page.");
        }
    });

    drawBadge();
});
