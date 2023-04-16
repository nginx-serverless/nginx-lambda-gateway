import base64
import boto3
import json
import logging
import os

from botocore.exceptions import ClientError

def lambda_handler(event, context):
    """Sample lambda handler for a function of `nginx-noti` for nginx to send a
       message to Amazon Simple Notification Service(SNS).
    """
    logger = logging.getLogger(__name__)
    logger.setLevel(logging.INFO)
    logger.info("request: " + json.dumps(event))

    #topic_arn = os.environ.get('TOPIC_ARN')
    topic_arn = "arn:aws:sns:{region}:{accont-id}:nginx-noti"
    sns_client = boto3.client("sns")

    # Generate a message from the event
    message = json.dumps(event)
    if 'body' in event:
        code = event['body']
        code_bytes = code.encode('ascii')
        decoded = base64.b64decode(code_bytes)
        message = decoded.decode('UTF-8')

    try:
        sent_message = sns_client.publish(
            TargetArn=topic_arn,
            Message=message
        )

        if sent_message is not None:
            logger.info(f"Success - Message ID: {sent_message['MessageId']}")
        return {
            "statusCode": 200,
            "body": {
                'request': json.loads(message),
                "response": "sent a message to AWS SNS"
            }
        }

    except ClientError as e:
        logger.error(e)
        return None
