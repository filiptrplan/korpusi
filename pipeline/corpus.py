import os
from elasticsearch import Elasticsearch
from dotenv import load_dotenv
import typer

app = typer.Typer()

load_dotenv()
crt_path = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "../certs/ca/ca.crt")
)
client = Elasticsearch(
    hosts=os.getenv("ELASTIC_HOST"),
    basic_auth=(os.getenv("ELASTIC_USER"), os.getenv("ELASTIC_PASSWORD")),
    ca_certs=crt_path,
    verify_certs=True,
)


@app.command()
def create_corpus(index: str, corpus_name: str):
    """Creates a corpus in the ElasticSearch database."""
    client.options(ignore_status=400).indices.create(
        index=index
    )  # create the index if it doesn't exist
    api_response = client.index(index=index, document={"corpus_name": corpus_name})
    print(f'Created corpus {corpus_name} with id {api_response["_id"]}')


@app.command()
def list_corpuses(index: str):
    """Lists all the corpuses and their ID"""
    api_response = client.search(index=index)
    for hit in api_response["hits"]["hits"]:
        print(f'{hit["_id"]}: {hit["_source"]["corpus_name"]}')
