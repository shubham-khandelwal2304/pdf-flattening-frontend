# PDF Flattener Frontend

This is the frontend for the PDF Flattener web application, designed to be deployed on Vercel.

## Features

- 🎨 Beautiful, modern UI with responsive design
- 📱 Mobile-friendly interface
- 🖱️ Drag & drop file upload
- ⚡ Real-time progress tracking
- 🎯 Configurable DPI settings
- 🔧 Maximum OCR quality mode
- 💾 Local storage for API URL configuration

## Deployment on Vercel

### Option 1: Deploy via Vercel CLI

1. Install Vercel CLI:
   ```bash
   npm install -g vercel
   ```

2. Deploy:
   ```bash
   vercel --prod
   ```

### Option 2: Deploy via Vercel Dashboard

1. Go to [vercel.com](https://vercel.com)
2. Import your repository
3. Select the `frontend` folder as the root directory
4. Deploy

### Option 3: Deploy via GitHub Integration

1. Push your code to GitHub
2. Connect your GitHub repository to Vercel
3. Set the root directory to `frontend`
4. Deploy automatically on every push

## Configuration

After deployment, users need to:

1. Enter their Render backend URL in the configuration section
2. The URL will be saved in local storage for future use

## Backend Integration

This frontend connects to a Flask backend deployed on Render. Make sure your backend is deployed and accessible before using the frontend.

## Development

To run locally:

```bash
# Install Vercel CLI
npm install -g vercel

# Run development server
vercel dev
```

## File Structure

```
frontend/
├── index.html          # Main application file
├── vercel.json         # Vercel configuration
├── package.json        # Node.js dependencies
└── README.md          # This file
```

## Customization

The application is a single HTML file with embedded CSS and JavaScript for easy deployment. All styling and functionality is contained within `index.html`.

