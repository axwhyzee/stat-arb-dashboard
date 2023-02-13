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

# assume collections are non-existent / empty
def setup():
    import pandas as pd
    
    df = pd.read_csv("C:/Users/Siah Wee Hung/Desktop/data.csv")
    print(df.shape)
    
    while df.shape[0] >= records_limit:
        insert_many_docs(df.iloc[:records_limit].to_dict(orient='records'))

def get_collections():
    return db.list_collection_names()

def insert_many_docs(collection, docs):
    db[collection].insert_many(docs)

def insert_doc(collection, doc):
    inserted_id = db[collection].insert_one(doc).inserted_id # id of the doc that was just inserted
    return inserted_id

def find_all(collection):
    cursor = db[collection].find({}, {'_id':0}).sort('datetime', 1)
    return list(cursor)

def find_pair(collection, pair):
    res = []
    cursor = db[collection].find({}).sort('datetime', 1)
    
    for doc in cursor:
        res.append([doc['datetime'], doc[pair]])

    return res

def find_last(collection):
    cursor = db[collection].find().sort('datetime', -1)

    data = cursor[0]
    del data['_id']

    return data

def delete_many_docs(collection, dates):
    deleted = db[collection].delete_many({'datetime': {'$in': dates}})
    return deleted.deleted_count

#def prune():
#    datetimes = collection.find({}, {'_id':0}).sort('datetime', 1).distinct('datetime')
#    length = len(datetimes)
    
#    if length > records_limit:
#        deleted = delete_many(datetimes[:length - records_limit])
#        print(f'Pruned: {length} - {deleted}')

