/**
 * Unified download functionality for charts
 * Provides download options for PNG, PDF, and Excel formats
 */

// Add download buttons to a chart
function addDownloadButtons(chartId) {
    const chartCanvas = document.getElementById(chartId);
    if (!chartCanvas) {
        console.error(`Chart with ID ${chartId} not found`);
        return;
    }

    const chartContainer = chartCanvas.parentElement;

    // Remove existing download buttons if any
    const existingButtons = chartContainer.querySelector('.chart-download-buttons');
    if (existingButtons) {
        existingButtons.remove();
    }

    // Create download buttons container
    const downloadButtons = document.createElement('div');
    downloadButtons.className = 'chart-download-buttons';

    // PNG Download Button
    const downloadImageButton = document.createElement('button');
    downloadImageButton.innerHTML = '<i class="fas fa-image"></i>';
    downloadImageButton.title = 'Download as PNG';
    downloadImageButton.className = 'chart-download-btn';
    downloadImageButton.addEventListener('click', () => downloadChartAsImage(chartId));
    downloadButtons.appendChild(downloadImageButton);

    // PDF Download Button
    const downloadPdfButton = document.createElement('button');
    downloadPdfButton.innerHTML = '<i class="fas fa-file-pdf"></i>';
    downloadPdfButton.title = 'Download as PDF';
    downloadPdfButton.className = 'chart-download-btn';
    downloadPdfButton.addEventListener('click', () => downloadChartAsPdf(chartId));
    downloadButtons.appendChild(downloadPdfButton);

    // Excel Download Button
    const downloadExcelButton = document.createElement('button');
    downloadExcelButton.innerHTML = '<i class="fas fa-file-excel"></i>';
    downloadExcelButton.title = 'Download as Excel';
    downloadExcelButton.className = 'chart-download-btn';
    downloadExcelButton.addEventListener('click', () => downloadChartDataAsExcel(chartId));
    downloadButtons.appendChild(downloadExcelButton);

    // Add buttons to chart container
    chartContainer.appendChild(downloadButtons);
}

// Download chart as PNG image
function downloadChartAsImage(chartId) {
    const canvas = document.getElementById(chartId);
    if (!canvas) {
        console.error(`Canvas with ID ${chartId} not found`);
        return;
    }

    // Get chart title or use chart ID
    let title = chartId;
    const chart = Chart.getChart(chartId);
    if (chart && chart.options && chart.options.plugins && chart.options.plugins.title && chart.options.plugins.title.text) {
        title = chart.options.plugins.title.text;
    }

    // Create filename with date
    const filename = `${title.replace(/[^a-z0-9]/gi, '-').toLowerCase()}-${new Date().toISOString().split('T')[0]}.png`;

    // Convert canvas to data URL and download
    const image = canvas.toDataURL('image/png').replace('image/png', 'image/octet-stream');
    downloadFile(image, filename, 'image/png');
}

// Download chart as PDF
function downloadChartAsPdf(chartId) {
    const canvas = document.getElementById(chartId);
    if (!canvas) {
        console.error(`Canvas with ID ${chartId} not found`);
        return;
    }

    // Get chart title or use chart ID
    let title = chartId;
    const chart = Chart.getChart(chartId);
    if (chart && chart.options && chart.options.plugins && chart.options.plugins.title && chart.options.plugins.title.text) {
        title = chart.options.plugins.title.text;
    }

    // Create filename with date
    const filename = `${title.replace(/[^a-z0-9]/gi, '-').toLowerCase()}-${new Date().toISOString().split('T')[0]}.pdf`;

    // Check if jsPDF is available
    if (typeof jspdf === 'undefined') {
        // Load jsPDF dynamically if not available
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
        script.onload = function() {
            generatePdf(canvas, title, filename);
        };
        document.head.appendChild(script);
    } else {
        generatePdf(canvas, title, filename);
    }
}

// Helper function to generate PDF
function generatePdf(canvas, title, filename) {
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF('landscape');

    // Add title
    pdf.setFontSize(18);
    pdf.text(title, 14, 22);

    // Add date
    pdf.setFontSize(12);
    pdf.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 30);

    // Add image
    const imgData = canvas.toDataURL('image/png');
    pdf.addImage(imgData, 'PNG', 10, 40, 280, 150);

    // Save PDF
    pdf.save(filename);
}

// Download chart data as Excel
function downloadChartDataAsExcel(chartId) {
    const chart = Chart.getChart(chartId);
    if (!chart) {
        console.error(`Chart with ID ${chartId} not found`);
        return;
    }

    // Get chart title or use chart ID
    let title = chartId;
    if (chart.options && chart.options.plugins && chart.options.plugins.title && chart.options.plugins.title.text) {
        title = chart.options.plugins.title.text;
    }

    // Create filename with date
    const filename = `${title.replace(/[^a-z0-9]/gi, '-').toLowerCase()}-${new Date().toISOString().split('T')[0]}.xlsx`;

    // Check if SheetJS is available
    if (typeof XLSX === 'undefined') {
        // Load SheetJS dynamically if not available
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js';
        script.onload = function() {
            generateExcel(chart, title, filename);
        };
        document.head.appendChild(script);
    } else {
        generateExcel(chart, title, filename);
    }
}

// Helper function to generate Excel file
function generateExcel(chart, title, filename) {
    // Extract data from chart
    const labels = chart.data.labels;
    const datasets = chart.data.datasets;

    // Create workbook
    const wb = XLSX.utils.book_new();
    wb.Props = {
        Title: title,
        Subject: "Chart Data",
        Author: "Restaurant Analytics Dashboard",
        CreatedDate: new Date()
    };

    // Create worksheet data
    const wsData = [['Date']];

    // Add dataset names to header row
    datasets.forEach(dataset => {
        wsData[0].push(dataset.label || 'Dataset');
    });

    // Add data rows
    labels.forEach((label, i) => {
        const row = [label instanceof Date ? label.toLocaleDateString() : label];
        datasets.forEach(dataset => {
            row.push(dataset.data[i]);
        });
        wsData.push(row);
    });

    // Create worksheet and add to workbook
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    XLSX.utils.book_append_sheet(wb, ws, "Chart Data");

    // Generate and download Excel file
    XLSX.writeFile(wb, filename);
}

// Generic file download function
function downloadFile(data, filename, type) {
    const link = document.createElement('a');
    link.href = data;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}
