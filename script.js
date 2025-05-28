document.addEventListener('DOMContentLoaded', () => {
    const imageUpload = document.getElementById('imageUpload');
    const badgeCanvas = document.getElementById('badgeCanvas');
    const ctx = badgeCanvas.getContext('2d');
    const downloadButton = document.getElementById('downloadButton');

    const displayCanvasWidth = badgeCanvas.width;
    const displayCanvasHeight = badgeCanvas.height;

    const cropModal = new bootstrap.Modal(document.getElementById('cropModal'));
    const imageToCrop = document.getElementById('imageToCrop');
    const cropButton = document.getElementById('cropButton');
    let cropperInstance;

    const defaultBadgeImagePath = 'badge.jpg';
    
    let circleConfig = {}; 

    let userImage = null; 
    let defaultBadgeImage = new Image();

    defaultBadgeImage.src = defaultBadgeImagePath;
    
    defaultBadgeImage.onload = () => {
        const targetHDWidth = 1920; 
        const badgeAspectRatio = defaultBadgeImage.naturalWidth / defaultBadgeImage.naturalHeight;
        const targetHDHeight = targetHDWidth / badgeAspectRatio;

        circleConfig = { 
            x: 452 * (targetHDWidth / 600),
            y: 166 * (targetHDHeight / 300),
            radius: 128 * (targetHDWidth / 600)
        };
        
        drawBadge(displayCanvasWidth, displayCanvasHeight, 1);
    };
    defaultBadgeImage.onerror = () => {
        console.error("Erreur lors du chargement de l'affiche par défaut. Vérifiez le chemin : " + defaultBadgeImagePath);
        alert("L'affiche par défaut n'a pas pu être chargée. Vérifiez le chemin du fichier.");
    };
    
    function drawBadge(targetWidth, targetHeight, scaleFactor) {
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
            ctx.font = `${20 * scaleFactor}px Arial`;
            ctx.textAlign = 'center';
            ctx.fillText("Affiche par défaut non chargée", badgeCanvas.width / 2, badgeCanvas.height / 2);
        }

        if (userImage) {
            ctx.save();
            ctx.beginPath();
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
            ctx.lineWidth = 5 * scaleFactor;
            ctx.stroke();
        }

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
                width: 800,
                height: 800,
                fillColor: '#fff',
                imageSmoothingEnabled: true,
                imageSmoothingQuality: 'high'
            }).toDataURL('image/png');

            userImage = new Image();
            userImage.src = croppedDataUrl;
            userImage.onload = () => {
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
            const hdWidth = 1920; 
            const badgeAspectRatio = defaultBadgeImage.naturalWidth / defaultBadgeImage.naturalHeight;
            const hdHeight = hdWidth / badgeAspectRatio;

            drawBadge(hdWidth, hdHeight, hdWidth / displayCanvasWidth);

            const dataURL = badgeCanvas.toDataURL('image/png', 1.0); 

            const a = document.createElement('a');
            a.href = dataURL;
            
            const timestamp = new Date().getTime();
            const randomString = Math.random().toString(36).substring(2, 8);
            a.download = `mon_badge_${timestamp}_${randomString}.png`;
            
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);

            drawBadge(displayCanvasWidth, displayCanvasHeight, 1); 
        } else {
            alert("L'affiche par défaut n'est pas encore chargée. Veuillez patienter ou recharger la page.");
        }
    });

    drawBadge(displayCanvasWidth, displayCanvasHeight, 1); 
});
