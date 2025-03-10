import os
import base64
import uuid
import json
import datetime
from flask import Flask, render_template, request, jsonify, redirect, url_for
from dotenv import load_dotenv
import cohere

from main import setup_client, generate_image_description, generate_issue_summary

app = Flask(__name__)
load_dotenv(dotenv_path=".env", override=True)
app.config['UPLOAD_FOLDER'] = os.path.join(os.path.dirname(__file__), 'temp')

# Example tickets data - in a real app, this would be in a database
TICKETS_FILE = os.path.join(os.path.dirname(__file__), 'tickets.json')

def load_tickets():
    if not os.path.exists(TICKETS_FILE):
        # Create sample tickets if file doesn't exist
        sample_tickets = [
            {
                "id": "TKT-001",
                "title": "Conveyor Belt Motor Failure",
                "description": "The main drive motor for conveyor line B has failed. The motor is overheating and making grinding noises. Requires immediate replacement of the bearing assembly and possibly the motor itself.",
                "technician": "John Smith",
                "location": "Factory Floor - Line B",
                "equipment_id": "CONV-B-001",
                "status": "Open",
                "created_at": "2025-03-08T10:30:00",
                "additional_notes": "Motor was serviced last month but has been running at high load."
            },
            {
                "id": "TKT-002",
                "title": "Air Compressor Pressure Drop",
                "description": "The primary air compressor is experiencing significant pressure drops during operation. The pressure gauge shows fluctuations between 80-95 PSI instead of maintaining a steady 120 PSI. The pressure regulator valve may need replacement.",
                "technician": "Sarah Johnson",
                "location": "Utility Room A",
                "equipment_id": "COMP-AIR-002",
                "status": "In Progress",
                "created_at": "2025-03-09T09:15:00",
                "additional_notes": "This is the second time this issue has occurred in the last month."
            },
            {
                "id": "TKT-003",
                "title": "Control Panel Display Malfunction",
                "description": "The LCD display on the main control panel is showing intermittent failures. Screen flickers and sometimes goes completely blank for several minutes before coming back online. Affects the operator's ability to monitor critical systems.",
                "technician": "Mike Wilson",
                "location": "Control Room",
                "equipment_id": "CTRL-PNL-005",
                "status": "Open",
                "created_at": "2025-03-09T14:45:00",
                "additional_notes": "Temporary workaround is to use the backup display on panel B."
            }
        ]
        with open(TICKETS_FILE, 'w') as f:
            json.dump(sample_tickets, f, indent=2)
        return sample_tickets
    
    try:
        with open(TICKETS_FILE, 'r') as f:
            return json.load(f)
    except Exception:
        return []

def save_tickets(tickets):
    with open(TICKETS_FILE, 'w') as f:
        json.dump(tickets, f, indent=2)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/describe', methods=['POST'])
def describe_image():
    if 'images[]' not in request.files:
        return jsonify({'error': 'No images provided'}), 400
    
    images = request.files.getlist('images[]')
    prompt = request.form.get('prompt', 'Describe this image in detail')
    
    # Create temp directory if it doesn't exist
    os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
    
    temp_files = []
    image_descriptions = []
    
    try:
        client = setup_client()
        
        # Process each image
        for image in images:
            if image.filename == '':
                continue
            
            # Save image temporarily with unique filename
            file_ext = os.path.splitext(image.filename)[1]
            temp_filename = f"{uuid.uuid4()}{file_ext}"
            temp_path = os.path.join(app.config['UPLOAD_FOLDER'], temp_filename)
            image.save(temp_path)
            temp_files.append(temp_path)
            
            # Generate description
            description = generate_image_description(client, prompt, temp_path)
            image_descriptions.append({
                "filename": image.filename,
                "description": description
            })
        
        # Generate summary if multiple images
        summary = {"title": "", "description": ""}
        if len(image_descriptions) > 1:
            summary = generate_issue_summary(client, image_descriptions)
        
        # Clean up temporary files
        for temp_file in temp_files:
            if os.path.exists(temp_file):
                os.remove(temp_file)
        
        return jsonify({
            'descriptions': image_descriptions,
            'summary': summary
        })
    
    except Exception as e:
        # Clean up temporary files
        for temp_file in temp_files:
            if os.path.exists(temp_file):
                os.remove(temp_file)
        return jsonify({'error': str(e)}), 500

@app.route('/tickets')
def view_tickets():
    tickets = load_tickets()
    return render_template('tickets.html', tickets=tickets)

@app.route('/submit_ticket', methods=['POST'])
def submit_ticket():
    try:
        data = request.json
        
        # Load existing tickets
        tickets = load_tickets()
        
        # Generate a new ticket ID (simple implementation)
        next_id = f"TKT-{len(tickets) + 1:03d}"
        
        # Get current timestamp in ISO format
        current_time = datetime.datetime.now().isoformat(timespec='minutes')
        
        # Create new ticket
        new_ticket = {
            "id": next_id,
            "title": data.get('title', 'Untitled Issue'),
            "description": data.get('description', ''),
            "technician": data.get('technician', 'Unknown'),
            "location": data.get('location', 'Unknown'),
            "equipment_id": data.get('equipment_id', 'Unknown'),
            "status": "Open",
            "created_at": current_time,
            "additional_notes": data.get('additional_notes', '')
        }
        
        # Add new ticket to the list
        tickets.append(new_ticket)
        
        # Save updated tickets list
        save_tickets(tickets)
        
        return jsonify({"success": True, "ticket_id": next_id})
    
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

if __name__ == '__main__':
    # Create templates directory if it doesn't exist
    templates_dir = os.path.join(os.path.dirname(__file__), 'templates')
    os.makedirs(templates_dir, exist_ok=True)
    
    # Create static directories if they don't exist
    css_dir = os.path.join(os.path.dirname(__file__), 'static', 'css')
    js_dir = os.path.join(os.path.dirname(__file__), 'static', 'js')
    os.makedirs(css_dir, exist_ok=True)
    os.makedirs(js_dir, exist_ok=True)
    
    app.run(debug=True)