import os
import base64
import cohere
from dotenv import load_dotenv

load_dotenv(dotenv_path=".env", override=True)


def setup_client() -> cohere.ClientV2:
    client = cohere.ClientV2(
        api_key=os.getenv("COHERE_API_KEY"),
        log_warning_experimental_features=False
    )
    return client


def encode_image(img_path: str | os.PathLike) -> str | None:
    try:
        with open(img_path, "rb") as img_file:
            encoded_img = base64.b64encode(img_file.read()).decode("utf-8")
    except Exception as e:
        print("Error encoding image: ", e)
        return None
    return "data:image/png;base64," + encoded_img


def generate_image_description(client: cohere.ClientV2, prompt: str, img_path: str | os.PathLike) -> str:
    encoded_img = encode_image(img_path)
    messages = [
        {
            "role": "user",
            "content": [
                {
                    "type": "text",
                    "text": prompt
                },
                {
                    "type": "image_url",
                    "image_url": {"url": encoded_img}
                }
            ]
        }
    ]

    response = client.chat(
        model="c4ai-aya-vision-32b",
        messages=messages,
    )

    return response.message.content[0].text


def generate_issue_summary(client: cohere.ClientV2, image_descriptions: list) -> dict:
    """
    Generate a summary of technical issues based on multiple image descriptions
    
    Args:
        client: Cohere client
        image_descriptions: List of dictionaries with 'filename' and 'description' keys
        
    Returns:
        A dictionary with title and description of the technical issue
    """
    # Create a formatted string of all image descriptions
    descriptions_text = "\n\n".join([
        f"Image: {item['filename']}\nDescription: {item['description']}" 
        for item in image_descriptions
    ])
    
    messages = [
        {
            "role": "user",
            "content": [
                {
                    "type": "text",
                    "text": f"""I'm a field technician and I've taken multiple photos of faulty equipment. Based on these image descriptions, please provide a summary of the technical issue and what might need repair.

Your response must be formatted exactly as follows:

TITLE: [a brief, specific title of the issue in 5-8 words]

DESCRIPTION: [a detailed description of the technical issue, what components are affected, and what might need repair]

Just provide the TITLE and DESCRIPTION, nothing else.

Here are the image descriptions:

{descriptions_text}"""
                }
            ]
        }
    ]
    
    response = client.chat(
        model="command-a-111b",
        messages=messages,
        temperature=0.7,
    )
    
    # Parse the response to extract title and description
    raw_text = response.message.content[0].text
    
    # Default values
    title = "Equipment Issue Detected"
    description = raw_text
    
    # Try to parse the formatted response
    try:
        if "TITLE:" in raw_text and "DESCRIPTION:" in raw_text:
            parts = raw_text.split("DESCRIPTION:")
            title_part = parts[0].strip()
            title = title_part.replace("TITLE:", "").strip()
            description = parts[1].strip()
    except Exception:
        # If parsing fails, use the entire text as description
        pass
    
    return {"title": title, "description": description}


def main():
    IMG_DIR = os.path.abspath("data")
    image_path = os.path.join(IMG_DIR, "answerable_correctness_violinplot.png")
    prompt = "Summarize the trends in this graph and rank the models in terms of performance"

    response = generate_image_description(
        client=setup_client(),
        prompt=prompt,
        img_path=image_path,
    )
    print(response)


if __name__ == "__main__":
    main()
    