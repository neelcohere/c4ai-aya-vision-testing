# C4AI Aya Vision Testing

A simple web application for testing the C4AI Aya Vision model using Cohere's API.

## Features

- Drag and drop interface for image uploads
- Custom prompt input for tailored image descriptions
- Real-time image description generation using Cohere's C4AI Aya Vision model

## Setup

1. Clone this repository
2. Create a `.env` file in the root directory with your Cohere API key:
   ```
   COHERE_API_KEY=your_api_key_here
   ```
3. Install dependencies:
   ```bash
   pip install -e .
   ```
   
## Usage

### Command-line

Run the script directly to analyze the example image:

```bash
python src/main.py
```

### Web Application

Start the web server:

```bash
python src/app.py
```

Then open your browser to `http://127.0.0.1:5000/` to use the web interface:

1. Drag and drop an image or click "Select Image"
2. Optionally customize the prompt (default: "Describe this image in detail")
3. Click "Get Description" to generate an AI description of your image

## Requirements

- Python 3.10+
- Flask
- Cohere Python SDK
- python-dotenv