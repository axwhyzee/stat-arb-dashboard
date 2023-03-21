from dotenv import load_dotenv, find_dotenv
from pymongo import MongoClient
import os

# load env variable file
load_dotenv(find_dotenv())

password = os.environ.get("MONGODB_PWD")
connection_string = f'mongodb+srv://admin:{password}@cluster0.lplvg1w.mongodb.net/?retryWrites=true&w=majority'

client = MongoClient(connection_string)
db = client['historical-prices']
last_collection_idx = 0 # ID of last database collection
collections = {} # mapping of database collection ID to its number of records. Store this so we can know when it's time to make a new collection
records_limit = 10000 # max records per collection

def collection_name() -> str:
    '''
    Get name of last created collection in the database

    :return: Name of last created collection in the database
    :rtype: str
    '''
    return f'prices_{last_collection_idx}'

def num_collections() -> int:
    '''
    Return number of collections in database

    :return: Number of collections in database
    :rtype: int
    '''
    return len(db.list_collection_names())

def insert_many_docs(collection: str, docs: list[dict]):
    '''
    Insert multiple documents into a collection

    :param str collection: Name of collection to insert document into
    :param list[dict] docs: List of document objects to insert
    '''
    db[collection].insert_many(docs)

def insert_doc(doc: dict):
    '''
    Insert single document into a collection

    :param dict doc: Document object to insert
    '''
    if collections[collection_name()] == records_limit:
        global last_collection_idx
        last_collection_idx += 1
        collections[collection_name()] = 1
    else:
        collections[collection_name()] += 1

    db[collection_name()].insert_one(doc)


def find_all(collection: str) -> list[dict]:
    '''
    Fetch all documents from a collection

    :param str collection: Name of collection to retrieve documents from
    :return: List of document objects
    :rtype: list[dict]
    '''
    cursor = db[collection].find({}, {'_id':0}).sort('datetime', 1)

    return list(cursor)

def find_last(collection: str):
    '''
    Find most recently added document from a collection

    :param str collection: Name of collection to retrieve most recently added document from
    :return: Document object
    :rtype: dict
    '''
    cursor = db[collection].find().sort('datetime', -1)

    data = cursor[0]
    del data['_id']

    return data

def delete_many_docs(collection: str, dates: list[int]) -> int:
    '''
    Delete multiple documents from a collection by date

    :param str collection: Name of collection to delete documents from
    :param list[int] dates: List of unix timestamps. Rows with a matching datetime value will be deleted 
    :return: Number of deleted documents
    :rtype: int
    '''
    deleted = db[collection].delete_many({'datetime': {'$in': dates}})

    return deleted.deleted_count


# initialize
def init_db():
    '''
    Initialise global variable values based on current state of database
    '''
    global last_collection_idx

    for col in db.list_collection_names():
        datetimes = db[col].find().distinct('datetime')
        collections[col] = len(datetimes)
    
    last_collection_idx = len(collections)


init_db()