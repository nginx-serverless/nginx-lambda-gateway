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
    topic_arn = "arn:aws:sns:us-east-2:{account-id}:nginx-noti"
    sns_client = boto3.client("sns")

    try:
        sent_message = sns_client.publish(
            TargetArn=topic_arn,
            Message=json.dumps(event)
        )

        if sent_message is not None:
            logger.info(f"Success - Message ID: {sent_message['MessageId']}")
        return {
            "statusCode": 200,
            "body": {
                'request': event,
                "response": "sent a message to AWS SNS"
            }
        }

    except ClientError as e:
        logger.error(e)
        return None
