document.addEventListener('DOMContentLoaded', () => {
    const imageInput = document.getElementById('imageInput');
    const dropZone = document.getElementById('dropZone');
    const detectButton = document.getElementById('detectButton');
    const saveButton = document.getElementById('saveButton');
    const resultCanvas = document.getElementById('resultCanvas');
    const resultList = document.getElementById('resultList');
    const errorMessage = document.getElementById('errorMessage');
    const ctx = resultCanvas.getContext('2d');
    let currentImage = null;

    // Handle file selection
    imageInput.addEventListener('change', handleFileSelect);
    dropZone.addEventListener('click', () => imageInput.click());
    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('dragover');
    });
    dropZone.addEventListener('dragleave', () => {
        dropZone.classList.remove('dragover');
    });
    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('dragover');
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            imageInput.files = files;
            handleFileSelect({ target: imageInput });
        }
    });

    function handleFileSelect(e) {
        const file = e.target.files[0];
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const img = new Image();
                img.onload = () => {
                    currentImage = img;
                    displayImage(img);
                };
                img.src = event.target.result;
            };
            reader.readAsDataURL(file);
        } else {
            showError('Please select a valid image file.');
        }
    }

    function displayImage(img) {
        resultCanvas.width = img.width;
        resultCanvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        resultList.innerHTML = '';
        errorMessage.textContent = '';
        saveButton.disabled = true; // Vô hiệu hóa nút lưu cho đến khi có kết quả
    }

    function showError(message) {
        errorMessage.textContent = message;
        resultList.innerHTML = '';
        if (currentImage) {
            displayImage(currentImage);
        }
        saveButton.disabled = true;
    }

    detectButton.addEventListener('click', async () => {
        if (!imageInput.files[0]) {
            showError('Please select an image first.');
            return;
        }

        const file = imageInput.files[0];
        const reader = new FileReader();
        reader.onload = async (event) => {
            const base64Str = event.target.result;
            try {
                const response = await fetch('/api/', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ image: base64Str })
                });
                const data = await response.json();

                if (response.ok) {
                    displayResults(data.results);
                    saveButton.disabled = false; // Kích hoạt nút lưu khi có kết quả
                } else {
                    showError(data.error || 'Failed to process image.');
                }
            } catch (err) {
                showError('Error connecting to server: ' + err.message);
            }
        };
        reader.readAsDataURL(file);
    });

    function displayResults(results) {
        if (!currentImage) return;

        // Redraw image
        ctx.drawImage(currentImage, 0, 0);
        resultList.innerHTML = '';

        // Draw bounding boxes and labels
        results.forEach(result => {
            const { name, conf, bbox } = result;
            const [xmin, ymin, xmax, ymax] = bbox;

            // Draw rectangle
            ctx.strokeStyle = 'red';
            ctx.lineWidth = 2;
            ctx.strokeRect(xmin, ymin, xmax - xmin, ymax - ymin);

            // Draw label background
            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            const label = `${name} (${(conf * 100).toFixed(1)}%)`;
            const textWidth = ctx.measureText(label).width;
            ctx.fillRect(xmin, ymin - 20, textWidth + 10, 20);

            // Draw label text
            ctx.fillStyle = 'white';
            ctx.font = '14px Arial';
            ctx.fillText(label, xmin + 5, ymin - 5);

            // Add to result list
            const li = document.createElement('li');
            li.className = 'list-group-item';
            li.textContent = `${name}: ${(conf * 100).toFixed(1)}% [${xmin}, ${ymin}, ${xmax}, ${ymax}]`;
            resultList.appendChild(li);
        });

        if (results.length === 0) {
            resultList.innerHTML = '<li class="list-group-item">No objects detected.</li>';
            saveButton.disabled = true;
        }
    }

    // Save canvas as PNG
    saveButton.addEventListener('click', () => {
        if (!currentImage || saveButton.disabled) {
            showError('No detection results to save.');
            return;
        }
        const link = document.createElement('a');
        link.download = 'detection_result.png';
        link.href = resultCanvas.toDataURL('image/png');
        link.click();
    });
});