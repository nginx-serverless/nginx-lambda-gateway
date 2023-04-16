import json

def lambda_handler(event, context):
    """Sample lambda handler for a function of `foo`.
    """
    return {
        'statusCode': 200,
        'body': {
            'request': event,
            'response': 'Hello from NGINX Lambda Gateway - /foo!'
        }
    }
