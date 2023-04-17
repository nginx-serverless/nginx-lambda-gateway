import json

def lambda_handler(event, context):
    # TODO implement
    return {
        'statusCode': 200,
        'body': {
            'request': event,
            'response': 'Hello from NGINX Lambda Gateway - /foo!'
        }
    }
