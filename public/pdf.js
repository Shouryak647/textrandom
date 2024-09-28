document.getElementById('uploadForm').addEventListener('submit', function (event) {
    event.preventDefault();

    const formData = new FormData();
    const pdfFile = document.getElementById('pdfFile').files[0];
    formData.append('pdf', pdfFile);

    fetch('/convert', {
        method: 'POST',
        body: formData
    })
    .then(response => response.blob())
    .then(blob => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'converted_images.zip';
        document.body.appendChild(a);
        a.click();
        a.remove();
    })
    .catch(error => {
        console.error('Error:', error);
    });
});
