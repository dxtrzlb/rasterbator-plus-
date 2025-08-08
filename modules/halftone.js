export function renderHalftone(ctx, imgData, dotSize, spacing, width, height) {
  const data = imgData.data;
  for (let y = 0; y < height; y += spacing) {
    for (let x = 0; x < width; x += spacing) {
      const i = (y * width + x) * 4;
      const brightness = (data[i] + data[i + 1] + data[i + 2]) / 3;
      const radius = (255 - brightness) / 255 * dotSize;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fillStyle = 'black';
      ctx.fill();
    }
  }
}
