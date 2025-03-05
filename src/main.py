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
    