from dotenv import load_dotenv, find_dotenv
from pymongo import MongoClient
import os

# load env variable file
load_dotenv(find_dotenv())

password = os.environ.get("MONGODB_PWD")
connection_string = f'mongodb+srv://admin:{password}@cluster0.lplvg1w.mongodb.net/?retryWrites=true&w=majority'

client = MongoClient(connection_string)
db = client['stat-arb-dashboard']
collection = db['prices']

records_limit = 10000


def insert_doc(doc):
    inserted_id = collection.insert_one(doc).inserted_id # id of the doc that was just inserted
    return inserted_id

def find_all():
    cursor = collection.find({}, {'_id':0}).sort('datetime', -1)
    return list(cursor)

def find_pair(pair):
    res = []
    cursor = collection.find({}).sort('datetime', -1)
    
    for doc in cursor:
        res.append([doc['datetime'], doc[pair]])

    return res

def find_last():
    cursor = collection.find().sort('datetime', -1)

    data = cursor[0]
    del data['_id']

    return data

def delete_many(dates):
    deleted = collection.delete_many({'datetime': {'$in': dates}})
    return deleted.deleted_count

def prune():
    datetimes = collection.find({}, {'_id':0}).sort('datetime', 1).distinct('datetime')
    length = len(datetimes)
    
    if length > records_limit:
        print(delete_many(datetimes[:length - records_limit + 1]))

prune()