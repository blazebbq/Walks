#!/bin/bash
# Generate simple placeholder icons using ImageMagick if available
# Otherwise create simple SVG placeholders

sizes=(72 96 128 144 152 192 384 512)

for size in "${sizes[@]}"; do
  cat > "icon-${size}x${size}.png.svg" << SVGEOF
<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${size}" height="${size}" fill="#2563eb"/>
  <text x="50%" y="50%" font-family="Arial" font-size="$((size/3))" fill="white" text-anchor="middle" dominant-baseline="middle">W</text>
</svg>
SVGEOF
done

echo "Icon placeholders created. For production, replace with proper PNG icons."
