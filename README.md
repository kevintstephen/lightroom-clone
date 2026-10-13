# Aperture

A web-based photo editing application inspired by Adobe Lightroom, built with React, TypeScript, and Tailwind CSS.

## Features

### Photo Library
- Import multiple photos at once
- Grid view of all imported photos
- View photo metadata (name, date added)
- Delete photos from library

### Photo Editor
- **Adjustments**: Fine-tune your photos with the following controls:
  - Brightness
  - Contrast
  - Saturation
  - Exposure
  - Highlights
  - Shadows
  - Temperature
  - Tint
  - Vignette
  - Blur

- **Presets**: Quick one-click filters:
  - Vivid
  - Dramatic
  - Soft
  - Black & White
  - Warm
  - Cool

- **Actions**:
  - Reset all adjustments to default
  - Export edited photo

## Tech Stack

- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Styling
- **Lucide React** - Icons

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd lightroom-clone
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser to `http://localhost:5173`

### Building for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

## Usage

1. **Import Photos**: Click the "Import" button in the header to select photos from your computer
2. **View Library**: Browse your imported photos in the library view
3. **Edit Photos**: Click on any photo to open the editor
4. **Apply Adjustments**: Use the sliders to fine-tune your photo
5. **Apply Presets**: Click preset buttons for quick filters
6. **Export**: Click "Export" to download your edited photo

## Project Structure

```
lightroom-clone/
├── src/
│   ├── components/
│   │   ├── PhotoEditor.tsx    # Main editing interface
│   │   ├── PhotoLibrary.tsx   # Photo grid view
│   │   └── Slider.tsx         # Reusable slider component
│   ├── lib/
│   │   └── utils.ts           # Utility functions
│   ├── types.ts               # TypeScript type definitions
│   ├── App.tsx                # Main application component
│   ├── main.tsx               # Entry point
│   └── index.css              # Global styles
├── public/                    # Static assets
├── index.html                 # HTML template
├── tailwind.config.js         # Tailwind configuration
├── tsconfig.json              # TypeScript configuration
└── vite.config.ts             # Vite configuration
```

## Future Enhancements

Potential features to add:
- [ ] Crop and rotate tools
- [ ] Curves adjustment
- [ ] HSL (Hue, Saturation, Luminance) controls
- [ ] Local adjustments (brush, gradient)
- [ ] History/undo functionality
- [ ] Batch editing
- [ ] Collections and albums
- [ ] Advanced export options (size, format, quality)
- [ ] Keyboard shortcuts
- [ ] Dark/light theme toggle
- [ ] Cloud storage integration

## License

MIT

## Acknowledgments

- Inspired by Adobe Lightroom
- Icons by [Lucide](https://lucide.dev/)
