import Chart from "chart.js/auto";
import { format, subMonths } from "date-fns";

const generateMonthLabels = (count) => {
  const currentDate = new Date();
  const labels = Array.from({ length: count }, (_, index) =>
    format(subMonths(currentDate, count - index - 1), "MMM")
  );
  return labels;
};

const LineChart = () => {
  const labels = generateMonthLabels(7);

  const data = {
    labels: labels,
    datasets: [
      {
        label: "My First Dataset",
        data: [65, 59, 80, 81, 56, 55, 40],
        borderColor: "rgb(75, 192, 192)",
        tension: 0.1,
      },
    ],
  };

  const options = {
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  const ctx = document.getElementById("myChart");

  // Check if there's already a chart instance attached to the canvas
  if (ctx) {
    // Get the existing chart instance and destroy it
    const chartInstance = Chart.getChart(ctx);
    if (chartInstance) {
      chartInstance.destroy();
    }

    // Create a new chart instance
    new Chart(ctx, {
      type: "line",
      data: data,
      options: options,
    });
  } else {
    console.error('Canvas element with id "myChart" not found.');
  }
};

export default LineChart;
