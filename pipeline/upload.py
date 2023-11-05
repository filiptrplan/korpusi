import json
import os
import hashlib
from typing_extensions import Annotated
from elasticsearch import Elasticsearch
from dotenv import load_dotenv
import typer

load_dotenv()
crt_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '../certs/ca/ca.crt'))
client = Elasticsearch(hosts=os.getenv('ELASTIC_HOST'), basic_auth=(os.getenv('ELASTIC_USER'), os.getenv('ELASTIC_PASSWORD')),
                       ca_certs=crt_path, verify_certs=True)

def calculate_hash(json_str: str):
    """Calculates the hash of the original file from the JSON string."""
    obj = json.loads(json_str)
    m = hashlib.sha256()
    orig_file = obj['original_file']
    m.update(orig_file.encode('utf-8'))
    return m.hexdigest()

def index_document(json_str: str, index: str):
    """Indexes a single document in the ElasticSearch database."""
    try:
        json.loads(json_str)
    except json.JSONDecodeError as e:
        raise e
    client.index(index=index, document=json_str, id=calculate_hash(json_str))

def main(index: str, 
        json_file: Annotated[str, typer.Option(help='Path to the JSON file to upload. It should feature one JSON file for each line.')] = None,
        json_dir: Annotated[str, typer.Option(help='Path to the directory containing the JSON files to upload. Each file is its separate document')] = None):
    """Uploads JSON files to the ElasticSearch database."""
    if json_file is not None and json_dir is not None:
        raise typer.BadParameter("Cannot specify both json_file and json_dir")
    if json_file is None and json_dir is None:
        raise typer.BadParameter("Must specify either json_file or json_dir")
    
    if json_file is not None:
        with open(json_file, 'r', encoding='utf-8') as f:
            for i, line in enumerate(f):
                try:
                    index_document(line, index)
                except json.JSONDecodeError:
                    print(f'Line {i} in {json_file} is not valid JSON. Skipping...')
                print(f'Indexed line {i} in {json_file}')


    if json_dir is not None:
        for file in os.listdir(json_dir):
            if file.endswith(".json"):
                with open(os.path.join(json_dir, file), 'r', encoding='utf-8') as f:
                    try:
                        index_document(f, index)
                    except json.JSONDecodeError:
                        print(f'{json_file} is not valid JSON. Skipping...')
                    print(f'Indexed {json_file}')

if __name__ == '__main__':
    typer.run(main)
