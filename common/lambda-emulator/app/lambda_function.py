import json

def lambda_handler(event, context):
    return {
        'statusCode': 200,
        'body': {
            'request': event,
            'response': 'Hello from NGINX Lambda Gateway Emulator - /foo!'
        }
    }
