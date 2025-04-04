// Common chart utilities used by all chart modules

// Register the plugin at the top of the file
if (!Chart.registry.plugins.get('datalabels')) {
    Chart.register(ChartDataLabels);
}

function addDownloadButtons(chartId) {
    const chartContainer = document.getElementById(chartId).parentNode;
    
    // Check if buttons already exist
    if (chartContainer.querySelector('.chart-download-buttons')) {
        return;
    }

    const downloadButtons = document.createElement('div');
    downloadButtons.className = 'chart-download-buttons';
    downloadButtons.style.position = 'absolute';
    downloadButtons.style.top = '10px';
    downloadButtons.style.right = '10px';

    const downloadImageButton = document.createElement('button');
    downloadImageButton.innerText = 'Image';
    downloadImageButton.addEventListener('click', () => downloadChartAsImage(chartId));
    downloadButtons.appendChild(downloadImageButton);

    const downloadPdfButton = document.createElement('button');
    downloadPdfButton.innerText = 'PDF';
    downloadPdfButton.addEventListener('click', () => downloadChartAsPdf(chartId));
    downloadButtons.appendChild(downloadPdfButton);

    const downloadExcelButton = document.createElement('button');
    downloadExcelButton.innerText = 'Excel';
    downloadExcelButton.addEventListener('click', () => downloadChartDataAsExcel(chartId));
    downloadButtons.appendChild(downloadExcelButton);

    chartContainer.appendChild(downloadButtons);
}

function downloadChartAsImage(chartId) {
    const chart = Chart.getChart(chartId);
    const image = chart.toBase64Image();
    download(image, 'png');
}

function downloadChartAsPdf(chartId) {
    // Implement PDF download logic here
    alert('PDF download not implemented yet');
}

function downloadChartDataAsExcel(chartId) {
    // Implement Excel download logic here
    alert('Excel download not implemented yet');
}

function download(data, type) {
    const filename = 'chart.' + type;
    const link = document.createElement('a');
    link.href = data;
    link.download = filename;
    link.click();
}

// Helper function to get start of week
function getStartOfWeek(date) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff));
}

// Helper function to get end of week
function getEndOfWeek(date) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + 7;
    return new Date(d.setDate(diff));
}

// Helper function to get week number
function getWeekNumber(date) {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
}
