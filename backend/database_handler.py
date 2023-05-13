from pymongo import MongoClient
import os


client = MongoClient(os.environ.get('MONGODB_URL'))
db = client['historical-prices']
collections = {}
last_collection_idx = 0
records_limit = 10000

def collection_name():
    return f'prices_{last_collection_idx}'

# assume collections are non-existent / empty
def setup():
    global last_collection_idx
    import pandas as pd
    
    df = pd.read_csv("C:/Users/Siah Wee Hung/Desktop/old.csv")

    while df.shape[0]:
        last_collection_idx += 1
        col = collection_name()
        collections[col] = df.shape[0]

        insert_many_docs(col, df.iloc[:records_limit].to_dict(orient='records'))

        df = df.iloc[records_limit:]

def num_collections():
    return len(db.list_collection_names())

def insert_many_docs(collection, docs):
    db[collection].insert_many(docs)

def insert_doc(doc):
    global last_collection_idx

    if collections[collection_name()] == records_limit:
        last_collection_idx += 1
        collections[collection_name()] = 1
    else:
        collections[collection_name()] += 1

    db[collection_name()].insert_one(doc)


def find_all(collection):
    cursor = db[collection].find({}, {'_id':0}).sort('datetime', 1)
    return list(cursor)

def find_last(collection):
    cursor = db[collection].find().sort('datetime', -1)

    try:       
        data = cursor[0]
    except:
        return {}

    del data['_id']

    return data

def delete_many_docs(collection, dates):
    deleted = db[collection].delete_many({'datetime': {'$in': dates}})
    return deleted.deleted_count


# initialize
def init_db():
    global last_collection_idx

    for col in db.list_collection_names():
        datetimes = db[col].find().distinct('datetime')
        collections[col] = len(datetimes)
    
    last_collection_idx = len(collections)

    print(collections)

#def prune():
#    datetimes = collection.find({}, {'_id':0}).sort('datetime', 1).distinct('datetime')
#    length = len(datetimes)
    
#    if length > records_limit:
#        deleted = delete_many(datetimes[:length - records_limit])
#        print(f'Pruned: {length} - {deleted}')