(centroids, points, clusters) => {
  if (
    Array.isArray(centroids) &&
    Array.isArray(points) & Array.isArray(clusters)
  ) {
    let result = [...clusters];

    points.forEach((point) => {
      let distances = [];
      centroids.forEach((vector) => {
        const distance = Math.sqrt(
          Math.pow(point[0] - vector[0], 2) + Math.pow(point[1] - vector[1], 2)
        );
        distances.push(distance);
      });
      let minimum = -1;
      let minIndex = -1;
      distances.forEach((distance, index) => {
        if (minimum == -1 || distance < minimum) {
          minimum = distance;
          minIndex = index;
        }
      });
      if (minIndex >= 0 && minIndex < clusters.length) {
        result[minIndex].push(point);
      }
    });
    return result;
  }
  return [];
};

// calculate_centroids
(input) => {
  let centroids = [];
  input.clusters.forEach((cluster) => {
    let sumX = 0;
    let sumY = 0;
    cluster.forEach((point) => {
      sumX += point[0];
      sumY += point[1];
    });
    centroids.push([sumX / cluster.length, sumY / cluster.length]);
  });
  return centroids;
};
